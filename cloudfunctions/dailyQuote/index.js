/**
 * 云函数：dailyQuote - AI生成每日诗词名言
 * 
 * 功能：
 * 1. 使用混元模型实时生成诗词/名言
 * 2. 包含古诗词和现代名言两种模式
 * 3. 存入云数据库
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 随机选择诗词类型
function getRandomType() {
  return Math.random() > 0.5 ? 'poetry' : 'quote'
}

// 构建AI生成prompt
function buildPoetryPrompt() {
  const topics = ['春天', '夏天', '秋天', '冬天', '山水', '思乡', '友情', '爱情', '人生', '理想']
  const topic = topics[Math.floor(Math.random() * topics.length)]
  
  return `请创作一首七言绝句，要求：
1. 主题：${topic}
2. 格律工整，平仄协调
3. 意境优美，画面感强
4. 押韵自然，韵脚在二、四句末
5. 不需要写诗名和作者

直接输出四句诗句，每句一行，不要任何前缀说明：`
}

function buildQuotePrompt() {
  const categories = ['人生哲理', '励志名言', '情感感悟', '生活智慧', '读书感悟', '工作启示', '自我成长', '处世哲学']
  const category = categories[Math.floor(Math.random() * categories.length)]
  
  return `请创作一句现代名言/格言，要求：
1. 主题：${category}
2. 语言优美，富有哲理
3. 简短精炼，15-30字
4. 富有启发性和感染力
5. 可以是原创，也可以是改编

直接输出一句名言，不要任何前缀说明，后面用 | 分隔附上一句简短的解读（50字以内）：`
}

// 使用TC3-HMAC-SHA256签名调用腾讯云混元API
async function callHunyuanAPI(prompt) {
  const secretId = process.env.TENCENTCLOUD_SECRETID || process.env.SECRETID || ''
  const secretKey = process.env.TENCENTCLOUD_SECRETKEY || process.env.SECRETKEY || ''
  
  if (!secretId || !secretKey) {
    console.log('【警告】未配置云API密钥，将使用备用方案')
    return null
  }
  
  const crypto = require('crypto')
  
  const host = 'hunyuan.tencentcloudapi.com'
  const service = 'hunyuan'
  const region = 'ap-guangzhou'
  const action = 'ChatCompletions'
  const version = '2023-09-01'
  const algorithm = 'TC3-HMAC-SHA256'
  
  const timestamp = Math.floor(Date.now() / 1000)
  const date = new Date(timestamp * 1000).toISOString().split('T')[0]
  
  const httpRequestMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`
  const signedHeaders = 'content-type;host'
  
  const payload = JSON.stringify({
    Model: 'hunyuan-pro',
    Messages: [
      { Role: 'user', Content: prompt }
    ],
    Temperature: 0.8,
    MaxTokens: 300
  })
  
  const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex')
  
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`
  
  const credentialScope = `${date}/${service}/tc3_request`
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`
  
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest()
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest()
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest()
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex')
  
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  
  const https = require('https')
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Region': region,
        'Authorization': authorization
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          
          if (result.Response && result.Response.Choices) {
            const content = result.Response.Choices[0]?.Message?.Content?.trim()
            resolve(content)
          } else {
            console.error('【AI返回格式错误】', JSON.stringify(result).substring(0, 200))
            resolve(null)
          }
        } catch (e) {
          console.error('【AI结果解析失败】', e.message)
          resolve(null)
        }
      })
    })
    
    req.on('error', (e) => {
      console.error('【AI请求失败】', e.message)
      resolve(null)
    })
    
    req.write(payload)
    req.end()
  })
}

// 保存到数据库
async function saveToDb(quote) {
  try {
    await db.collection('dailyQuotes').add({
      data: {
        ...quote,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      }
    })
    return true
  } catch (e) {
    console.log('【数据库保存失败】', e.message)
    return false
  }
}

// 备用名言库
function getFallbackPoetry() {
  const poems = [
    { content: '春江潮水连海平，海上明月共潮生。', title: '春江花月夜', source: '唐代·张若虚' },
    { content: '大漠孤烟直，长河落日圆。', title: '使至塞上', source: '唐代·王维' },
    { content: '采菊东篱下，悠然见南山。', title: '饮酒·其五', source: '东晋·陶渊明' },
    { content: '明月松间照，清泉石上流。', title: '山居秋暝', source: '唐代·王维' },
    { content: '两岸猿声啼不住，轻舟已过万重山。', title: '早发白帝城', source: '唐代·李白' },
    { content: '但愿人长久，千里共婵娟。', title: '水调歌头', source: '宋代·苏轼' },
    { content: '人生若只如初见，何事秋风悲画扇。', title: '木兰花令', source: '清代·纳兰性德' },
    { content: '山重水复疑无路，柳暗花明又一村。', title: '游山西村', source: '宋代·陆游' }
  ]
  return poems[Math.floor(Math.random() * poems.length)]
}

function getFallbackQuote() {
  const quotes = [
    { content: '生活不是等待风暴过去，而是学会在雨中跳舞。', interpretation: '面对困难，主动出击比消极等待更有力量。' },
    { content: '世界上最远的距离不是生与死，而是我就站在你面前，你却不知道我爱你。', interpretation: '珍惜眼前人，勇敢表达爱意。' },
    { content: '你若盛开，蝴蝶自来。', interpretation: '专注于自我成长，美好的事物自会被吸引而来。' },
    { content: '不是看到希望才坚持，而是坚持了才看到希望。', interpretation: '成功需要耐心和毅力，不要轻易放弃。' },
    { content: '人生没有白走的路，每一步都算数。', interpretation: '经历的一切都在塑造更好的自己。' },
    { content: '真正的自由不是想做什么就做什么，而是教会不想做的事情。', interpretation: '自律是通往自由的桥梁。' },
    { content: '愿你出走半生，归来仍是少年。', interpretation: '保持初心，不被世俗磨灭热情和梦想。' },
    { content: '所有的大人都曾经是小孩，虽然，只有少数的人记得。', interpretation: '保持童心，让生活多一份纯粹和美好。' }
  ]
  return quotes[Math.floor(Math.random() * quotes.length)]
}

// 主入口
exports.main = async (event, context) => {
  const { type: specifiedType, category, refresh = false } = event
  
  console.log('【云函数开始】dailyQuote, specifiedType:', specifiedType, 'refresh:', refresh)
  
  try {
    // 随机选择类型
    const type = specifiedType || getRandomType()
    console.log('【选择类型】', type === 'poetry' ? '古诗词' : '现代名言')
    
    const prompt = type === 'poetry' ? buildPoetryPrompt() : buildQuotePrompt()
    
    // 尝试调用AI
    let aiResult = null
    try {
      aiResult = await callHunyuanAPI(prompt)
    } catch (e) {
      console.error('【AI调用异常】', e.message)
    }
    
    let quote
    
    if (aiResult && aiResult.length > 10) {
      // AI生成成功
      if (type === 'poetry') {
        const lines = aiResult.split('\n').filter(l => l.trim())
        quote = {
          content: lines.join('\n'),
          title: 'AI创作诗词',
          source: 'AI创作',
          type: 'poetry',
          isAIGenerated: true
        }
      } else {
        const parts = aiResult.split('|')
        quote = {
          content: parts[0].trim(),
          interpretation: parts[1]?.trim() || '',
          title: 'AI创作名言',
          source: 'AI创作',
          type: 'quote',
          isAIGenerated: true
        }
      }
      console.log('【使用AI生成】', quote.content.substring(0, 30))
    } else {
      // 使用备用
      console.log('【使用备用方案】')
      if (type === 'poetry') {
        const fallback = getFallbackPoetry()
        quote = {
          ...fallback,
          type: 'poetry',
          isAIGenerated: false
        }
      } else {
        const fallback = getFallbackQuote()
        quote = {
          ...fallback,
          title: '经典名言',
          source: '名言库',
          type: 'quote',
          isAIGenerated: false
        }
      }
    }
    
    quote.date = new Date().toISOString().split('T')[0]
    
    // 保存到数据库
    await saveToDb(quote)
    
    return {
      success: true,
      quote,
      source: quote.isAIGenerated ? 'AI创作' : '经典库'
    }
    
  } catch (e) {
    console.error('【云函数异常】', e)
    return {
      success: false,
      error: e.message
    }
  }
}
