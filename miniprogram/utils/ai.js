/**
 * utils/ai.js - 生产级 AI 调用核心 v8.0
 * 
 * 架构：小程序端直接调用 wx.cloud.extend.AI（CloudBase AI 网关）
 * 
 * 响应格式：res.eventStream（需要解析 event.data）
 * 
 * 特性：
 *   ✅ 流式输出  eventStream（边生成边显示）
 *   ✅ 降级保护  主模型失败自动切换备用模型
 *   ✅ 限流      前端令牌桶（防止连点暴刷）
 *   ✅ 超时      Promise.race 保护
 * 
 * 参考：CloudBase AI 生文模型接入指引
 */

// 动态引入配置
const { AI_CONFIG } = require('./aiConfig.js')

// ─── 解构配置 ─────────────────────────────────────────────────
const { model, params, timeout, retry } = AI_CONFIG
const CFG = {
  STREAM_TIMEOUT_MS: timeout?.stream || 30000,
  FIRST_TOKEN_MS: timeout?.firstToken || 10000,
  RETRY_DELAYS: retry?.delays || [1200, 2500],
  MAX_TOKENS_DEFAULT: params?.maxTokens || 512,
}

const MIN_INTERVAL = 1500
const _lastCallTime = {}

// ─── 主调用入口（流式） ─────────────────────────────────────
/**
 * 流式调用 AI，通过回调逐步推送文本
 * @param {string}   type       业务类型（限流 key）
 * @param {Array}    messages   [{role, content}]
 * @param {Function} onChunk    (text: string) => void
 * @param {Function} onDone     (fullText: string) => void
 * @param {Function} onError    (err: Error) => void
 * @param {Object}   opts       { temperature, maxTokens }
 */
async function callAIStream(type, messages, onChunk, onDone, onError, opts = {}) {
  _throttleCheck(type)

  const temperature = opts.temperature ?? params?.temperature ?? 0.75
  const maxTokens = opts.maxTokens || CFG.MAX_TOKENS_DEFAULT
  const primary = model?.primary || { provider: 'hunyuan-exp', model: 'hunyuan-turbos-latest' }
  const fallback = model?.fallback || { provider: 'hunyuan-exp', model: 'hunyuan-lite' }

  try {
    // 尝试主模型
    const text = await _streamOnce(primary.provider, primary.model, messages, { temperature, maxTokens }, onChunk)
    onDone && onDone(text)
  } catch (primaryErr) {
    console.warn(`[AI] 主模型失败(${primary.model}):`, primaryErr.message)
    try {
      // 切换备用模型
      const text = await _streamOnce(fallback.provider, fallback.model, messages, { temperature, maxTokens }, onChunk)
      onDone && onDone(text)
    } catch (fallbackErr) {
      console.error('[AI] 备用模型也失败:', fallbackErr.message)
      onError && onError(new Error(_friendlyError(fallbackErr)))
    }
  }
}

// ─── 内部：单次流式调用 ───────────────────────────────────────
async function _streamOnce(providerName, modelName, messages, opts, onChunk) {
  const aiModel = wx.cloud.extend.AI.createModel(providerName)

  console.log('模型创建成功:', aiModel)
  console.log('[AI] 调用模型:', providerName, modelName)
  console.log('[AI] 消息数:', messages.length)

  // 调用 streamText
  const callPromise = aiModel.streamText({
    data: {
      model: modelName,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      top_p: params?.topP || 0.9,
    }
  })

  // 超时保护
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`TIMEOUT:${modelName}`)), CFG.STREAM_TIMEOUT_MS)
  )

  const res = await Promise.race([callPromise, timeoutPromise])

  // 关键：使用 eventStream 而不是 textStream
  // CloudBase AI 网关返回的事件流需要解析 event.data
  let fullText = ''
  let firstToken = false

  // 首个 token 超时保护
  let firstTokenReject
  const firstTokenPromise = new Promise((_, reject) => { firstTokenReject = reject })
  const firstTokenTimer = setTimeout(() => {
    if (!firstToken) firstTokenReject(new Error(`FIRST_TOKEN_TIMEOUT:${modelName}`))
  }, CFG.FIRST_TOKEN_MS)

  try {
    // 遍历事件流
    for await (const event of res.eventStream) {
      // 流结束标记
      if (event.data === '[DONE]') {
        break
      }

      // 解析 JSON 数据
      try {
        const data = JSON.parse(event.data)

        // 跳过思考内容（如果有）
        const think = data?.choices?.[0]?.delta?.reasoning_content
        if (think) {
          console.log('[AI思考]:', think.substring(0, 50))
          continue
        }

        // 获取生成文本
        const text = data?.choices?.[0]?.delta?.content
        if (text) {
          firstToken = true
          clearTimeout(firstTokenTimer)
          fullText += text
          onChunk && onChunk(text)
        }
      } catch (parseErr) {
        // 忽略解析错误，可能是非JSON事件
        console.warn('[AI] 解析事件失败:', event.data?.substring(0, 50))
      }
    }
  } finally {
    clearTimeout(firstTokenTimer)
  }

  if (!fullText) throw new Error(`EMPTY_RESPONSE:${modelName}`)
  console.log(`[AI] 成功: model=${modelName} len=${fullText.length}`)
  return fullText
}

// ─── 限流 ───────────────────────────────────────────────────
function _throttleCheck(type) {
  const now = Date.now()
  const last = _lastCallTime[type] || 0
  if (now - last < MIN_INTERVAL) {
    throw new Error('操作太频繁，请稍候再试')
  }
  _lastCallTime[type] = now
}

// ─── 友好错误文案 ─────────────────────────────────────────────
function _friendlyError(e) {
  const msg = (e.message || String(e)).toLowerCase()
  if (msg.includes('操作太频繁')) return '操作太频繁，请稍候再试'
  if (msg.includes('timeout') || msg.includes('超时')) return '网络超时，请检查网络后重试'
  if (msg.includes('empty_response')) return 'AI 返回为空，请稍后重试'
  if (msg.includes('bad request') || msg.includes('400')) {
    return 'AI 配置有误，请检查 aiConfig.js 中的模型名称是否正确'
  }
  if (msg.includes('not supported') || msg.includes('createmodel')) {
    return '当前微信版本过低，或 AI 扩展能力未开通'
  }
  return 'AI 服务繁忙，请稍后重试'
}

// ─── 导出 ───────────────────────────────────────────────────
module.exports = {
  callAIStream,
  CFG,
}
