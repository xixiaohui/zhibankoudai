/**
 * aiRules.js - 云开发 AI 规则与最佳实践
 * 
 * 文档来源：https://docs.cloudbase.net/ai/model/openai-sdk-access
 * 更新日期: 2026-04-10
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 目录
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. 前置条件
 * 2. Provider 配置
 * 3. 支持的模型
 * 4. 调用参数说明
 * 5. 错误处理
 * 6. 最佳实践
 * 7. 小程序端调用（wx.cloud.extend.AI）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ═══════════════════════════════════════════════════════════
// 1. 前置条件
// ═══════════════════════════════════════════════════════════
/**
 * 使用 CloudBase AI 的前置条件：
 * 1. 已开通云开发环境
 * 2. 已配置大模型（云开发控制台 → AI接入服务）
 * 3. 已创建 API Key（云开发控制台 → API Key配置）
 */

// ═══════════════════════════════════════════════════════════
// 2. Provider 配置
// ═══════════════════════════════════════════════════════════
/**
 * 支持的 AI Provider：
 * 
 * | Provider   | 说明     |
 * |------------|----------|
 * | hunyuan    | 腾讯混元  |
 * | deepseek   | DeepSeek |
 * | hunyuan-exp | 混元实验版（流式） |
 * 
 * ⚠️ 注意：不同 Provider 的 baseURL 不同
 * 
 * 混元:     https://<ENV_ID>.api.tcloudbasegateway.com/v1/ai/hunyuan/v1
 * DeepSeek: https://<ENV_ID>.api.tcloudbasegateway.com/v1/ai/deepseek/v1
 */

// ═══════════════════════════════════════════════════════════
// 3. 支持的模型
// ═══════════════════════════════════════════════════════════
const AI_MODELS = {
  // 腾讯混元模型
  hunyuan: {
    'hunyuan-turbos-latest': '混元 Turbo 最新版（推荐，速度快效果好）',
    'hunyuan-lite': '混元轻量版（备用）',
    'hunyuan-exp': '混元实验版（支持流式）',
  },
  
  // DeepSeek 模型
  deepseek: {
    'deepseek-r1-0528': 'DeepSeek R1（推理能力强）',
    'deepseek-v3-0324': 'DeepSeek V3（平衡型）',
  },
};

// ═══════════════════════════════════════════════════════════
// 4. 调用参数说明
// ═══════════════════════════════════════════════════════════
/**
 * 支持的调用参数：
 * 
 * | 参数              | 类型    | 默认值 | 说明                          |
 * |-------------------|---------|--------|-------------------------------|
 * | model             | string  | 必填   | 模型名称                      |
 * | messages          | array   | 必填   | 消息列表 [{role, content}]    |
 * | stream            | boolean | false  | 是否流式返回                  |
 * | temperature       | number  | 0.7    | 采样温度 (0-2)，越高越有创意   |
 * | top_p             | number  | 0.9    | 核采样 (0-1)                  |
 * | max_tokens        | number  | 512    | 最大生成 token 数             |
 * | presence_penalty  | number  | 0      | 存在惩罚 (-2 to 2)             |
 * | frequency_penalty | number  | 0      | 频率惩罚 (-2 to 2)            |
 */

/**
 * 消息格式示例：
 * const messages = [
 *   { role: "system", content: "你是一个有帮助的助手" },
 *   { role: "user", content: "你好" },
 * ]
 * 
 * role 可选值：
 * - system: 系统提示词（定义 AI 角色）
 * - user: 用户消息
 * - assistant: AI 回复（多轮对话时携带）
 */

// ═══════════════════════════════════════════════════════════
// 5. 错误处理
// ═══════════════════════════════════════════════════════════
const AI_ERROR_CODES = {
  // 常见错误码
  400: {
    name: 'Bad Request',
    description: '请求参数错误',
    commonCauses: [
      'messages 格式错误',
      'model 不存在或不支持',
      'temperature/max_tokens 超范围',
      'system prompt 过长',
      '内容包含敏感词',
    ],
    solution: '检查参数格式和取值范围',
  },
  
  401: {
    name: 'Unauthorized',
    description: 'API Key 错误或过期',
    solution: '检查 API Key 配置',
  },
  
  403: {
    name: 'Forbidden',
    description: '权限不足',
    solution: '检查环境配置和 API Key 权限',
  },
  
  429: {
    name: 'Too Many Requests',
    description: '请求过于频繁',
    solution: '降低请求频率，添加延迟',
  },
  
  500: {
    name: 'Internal Server Error',
    description: '服务器内部错误',
    solution: '稍后重试，或联系技术支持',
  },
};

/**
 * 错误处理示例：
 */
function handleAIError(error) {
  const status = error.status || error.response?.status;
  const message = error.message || error.error?.message;
  
  console.error('AI 调用失败:', status, message);
  
  if (status === 400) {
    console.error('参数错误，请检查：', AI_ERROR_CODES[400].commonCauses);
  } else if (status === 401) {
    console.error('API Key 错误');
  } else if (status === 429) {
    console.error('请求过于频繁，稍后重试');
  }
  
  // 返回降级内容
  return {
    success: false,
    error: {
      code: status,
      message: message,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// 6. 最佳实践
// ═══════════════════════════════════════════════════════════
const AI_BEST_PRACTICES = {
  // System Prompt 最佳实践
  systemPrompt: {
    长度限制: '建议不超过 2000 字符（混元模型限制更严格）',
    结构建议: `
      1. 角色定义：清晰说明 AI 的身份和性格
      2. 说话风格：定义回复的长短、语气、emoji 使用
      3. 禁止事项：明确什么不该做
      4. 示例：可以给出一两个回复示例
    `,
    示例: `你是智伴，一个18岁的小姐姐，是用户温暖的朋友。
    【性格】温暖、乐观、真诚、有点俏皮
    【说话风格】简短自然，30-100字，像朋友聊天
    【禁忌】不要说教，不要给用户压力
    `,
  },

  // 上下文记忆策略
  contextMemory: {
    历史消息: '建议携带最近 8-10 条对话历史',
    记忆注入: '将用户画像和偏好注入 system prompt',
    长度控制: '记忆上下文建议 ≤ 300 字符',
    更新频率: '每次对话后更新记忆，不要每次都传全部历史',
  },

  // 流式输出处理
  streaming: {
    首Token超时: '建议设置 10 秒超时',
    完整响应超时: '建议设置 30 秒超时',
    重试机制: '失败后延迟 1-2 秒重试，最多 2 次',
    思考内容: '混元模型可能返回 reasoning_content（思考过程），需跳过',
  },

  // 性能优化
  performance: {
    并发控制: '避免同时发起多个请求',
    消息截断: '超长消息截断后再发送',
    缓存策略: '相同问题可缓存结果（需设置 TTL）',
    降级方案: 'AI 失败时返回本地预设回复',
  },

  // 安全考虑
  security: {
    APIKey保护: '不要在前端代码中硬编码 API Key',
    内容过滤: '用户输入和 AI 输出都应进行内容过滤',
    敏感信息: '不要在日志中打印完整对话',
  },
};

// ═══════════════════════════════════════════════════════════
// 7. 小程序端调用（wx.cloud.extend.AI）
// ═══════════════════════════════════════════════════════════
/**
 * 小程序端调用方式：
 * 
 * // 1. 创建模型实例
 * const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
 * 
 * // 2. 流式调用
 * const res = await model.streamText({
 *   data: {
 *     model: 'hunyuan-turbos-latest',
 *     messages: [{ role: 'user', content: '你好' }],
 *     temperature: 0.75,
 *     max_tokens: 512,
 *   }
 * })
 * 
 * // 3. 处理流式响应
 * for await (const event of res.eventStream) {
 *   if (event.data === '[DONE]') break
 *   const data = JSON.parse(event.data)
 *   const content = data?.choices?.[0]?.delta?.content
 *   if (content) {
 *     // 追加显示
 *     console.log(content)
 *   }
 * }
 * 
 * ⚠️ 注意事项：
 * - 需要在 app.js 中先初始化 cloud
 * - 需要在 project.config.json 中配置 cloudfunctionRoot
 * - 需要确保云函数已上传部署
 */

// ═══════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════
module.exports = {
  AI_MODELS,
  AI_ERROR_CODES,
  AI_BEST_PRACTICES,
  handleAIError,
};
