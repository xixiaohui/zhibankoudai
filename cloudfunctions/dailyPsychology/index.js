/**
 * 云函数：dailyPsychology - AI作为心理学专家生成心理学知识
 * 
 * 功能：
 * 1. 使用混元模型实时生成心理学知识
 * 2. 涵盖多种心理学领域：儿童、青年、老年、社会、家庭、经济等
 * 3. 存入云数据库
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 心理学领域配置
const psychologyFields = [
  {
    id: 'child',
    name: '儿童心理学',
    icon: '👶',
    topics: ['依恋关系', '安全感建立', '游戏与学习', '亲子沟通', '情绪管理', '社会化发展', '语言发展', '道德发展']
  },
  {
    id: 'youth',
    name: '青年心理学',
    icon: '🌱',
    topics: ['自我认同', '独立性发展', '同伴关系', '学业压力', '职业规划', '恋爱心理', '情绪调节', '自我价值']
  },
  {
    id: 'elderly',
    name: '老年心理学',
    icon: '🌳',
    topics: ['退休适应', '生命回顾', '孤独感应对', '认知老化', '积极老龄化', '家庭角色转变', '意义感保持', '心理健康维护']
  },
  {
    id: 'social',
    name: '社会心理学',
    icon: '👥',
    topics: ['从众与服从', '社会认知', '人际关系', '群体影响', '态度改变', '偏见与歧视', '助人行为', '人际吸引']
  },
  {
    id: 'family',
    name: '家庭心理学',
    icon: '🏠',
    topics: ['家庭系统理论', '依恋风格', '代际传递', '婚姻关系', '手足竞争', '家庭沟通模式', '边界设置', '家庭危机应对']
  },
  {
    id: 'economic',
    name: '经济心理学',
    icon: '💰',
    topics: ['消费决策', '储蓄行为', '金钱态度', '贫困心理', '财富与幸福感', '财务压力应对', '消费陷阱识别', '财务规划心理']
  },
  {
    id: 'cognitive',
    name: '认知心理学',
    icon: '🧠',
    topics: ['注意力', '记忆机制', '思维模式', '学习策略', '决策偏差', '问题解决', '元认知', '认知负荷']
  },
  {
    id: 'clinical',
    name: '临床心理学',
    icon: '💊',
    topics: ['焦虑障碍', '抑郁情绪', '压力管理', '心理韧性', '自我接纳', '心理防御机制', '情绪调节策略', '求助行为']
  },
  {
    id: 'educational',
    name: '教育心理学',
    icon: '📚',
    topics: ['学习动机', '教学方法', '个体差异', '成长型思维', '学习策略', '评价反馈', '课堂管理', '特殊教育需求']
  },
  {
    id: 'positive',
    name: '积极心理学',
    icon: '✨',
    topics: ['幸福感', '优势识别', '心流体验', '感恩练习', '意义发现', '希望培养', '乐观思维', '自我决定理论']
  }
]

// 获取时间相关的心理学话题
function getTimeTopic() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 9) return '早晨心理调适'
  if (hour >= 9 && hour < 12) return '工作学习效率'
  if (hour >= 12 && hour < 14) return '午休心理恢复'
  if (hour >= 14 && hour < 18) return '下午精力管理'
  if (hour >= 18 && hour < 21) return '晚间家庭互动'
  return '睡前心理放松'
}

// 构建AI生成prompt
function buildPsychologyPrompt() {
  const field = psychologyFields[Math.floor(Math.random() * psychologyFields.length)]
  const topic = field.topics[Math.floor(Math.random() * field.topics.length)]
  const timeTopic = getTimeTopic()
  
  return `你是一位资深心理学专家，请用通俗易懂的语言，分享一个实用的心理学知识。

要求：
1. 心理学领域：${field.name} - ${topic}
2. 结合当下场景：${timeTopic}
3. 内容要点：
   - 核心概念解释（1-2句）
   - 日常生活中的应用（2-3个具体例子）
   - 实用建议或练习（1-2个可操作的方法）
4. 语言要通俗生动，避免过于学术化
5. 长度控制在150-200字
6. 内容要有价值、有深度、接地气
7. 不要有任何敏感内容

格式要求：
用|分隔各部分，结构如下：
领域名称|知识点标题|正文内容（包含概念、例子、建议）

直接输出，不要任何前缀或说明文字：`
}

// 使用TC3-HMAC-SHA256签名调用腾讯云混元API
async function callHunyuanAPI(prompt) {
  // 从环境变量获取密钥
  // 兼容多种环境变量名称
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
    MaxTokens: 500
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
          console.log('【AI调用结果】', JSON.stringify(result).substring(0, 200))
          
          if (result.Response && result.Response.Choices) {
            const content = result.Response.Choices[0]?.Message?.Content?.trim()
            resolve(content)
          } else {
            console.error('【AI返回格式错误】', JSON.stringify(result))
            resolve(null)
          }
        } catch (e) {
          console.error('【AI结果解析失败】', e.message, data.substring(0, 200))
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

// 从数据库获取最后一条记录作为备用
async function getLastFromDb() {
  try {
    const res = await db.collection('dailyPsychology')
      .orderBy('date', 'desc')
      .limit(1)
      .get()
    
    if (res.data && res.data.length > 0) {
      return res.data[0]
    }
  } catch (e) {
    console.log('【数据库查询失败】', e.message)
  }
  return null
}

// 解析AI生成的内容
function parseAIResult(content, field) {
  const parts = content.split('|')
  if (parts.length >= 3) {
    return {
      field: parts[0].trim(),
      title: parts[1].trim(),
      content: parts.slice(2).join('|').trim()
    }
  }
  
  // 如果解析失败，尝试另一种格式
  const lines = content.split('\n').filter(l => l.trim())
  return {
    field: field.name,
    title: lines[0]?.substring(0, 30) || '心理学小知识',
    content: content
  }
}

// 保存到数据库
async function saveToDb(psychology) {
  try {
    await db.collection('dailyPsychology').add({
      data: {
        ...psychology,
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

// 获取所有备用心理学知识库
function getFallbackKnowledge() {
  const knowledgeBase = [
    { field: '儿童心理学', title: '依恋关系的重要性', content: '依恋关系是儿童心理健康发展的基石。孩子在生命早期与主要照顾者形成的依恋模式，会影响他们一生的情绪调节能力和人际关系。安全型依恋的孩子更容易建立信任感，在面对挫折时也更有韧性。家长可以通过及时回应孩子的需求、给予温暖的拥抱和高质量的陪伴来培养安全型依恋。' },
    { field: '青年心理学', title: '自我认同的探索', content: '青年期是自我认同形成的关键时期。埃里克森认为，这个阶段的核心任务是解决"我是谁"的问题。年轻人通过尝试不同的角色、价值观和人生方向来探索自我。这个过程可能会有迷茫和焦虑，但这是正常的。建议青年人保持开放心态，多接触不同的人和事物，同时给自己足够的耐心。' },
    { field: '老年心理学', title: '积极老龄化', content: '研究表明，保持积极心态的老年人往往更健康、寿命更长。积极老龄化不仅关注身体健康，更强调心理和社会参与。老年人可以通过学习新技能、参与社区活动、与年轻人交流等方式保持大脑活跃，建立有意义的社会连接，让晚年生活更加充实。' },
    { field: '社会心理学', title: '从众心理的双面性', content: '从众是人类社会的常见现象，既有积极作用也有潜在风险。在紧急情况下，个体的独立判断可能比群体意见更可靠。了解从众心理可以帮助我们更好地理解社会现象，在关键时刻保持独立思考，既不过度盲从，也不刻意标新立异。' },
    { field: '家庭心理学', title: '有效沟通的艺术', content: '家庭沟通模式对家庭关系质量有重要影响。有效的家庭沟通包括：倾听时全神贯注、表达时使用"我"开头的陈述、避免指责和批评、寻求理解而非争辩对错。定期举行家庭会议，分享彼此的想法和感受，可以增进家庭成员间的理解和信任。' },
    { field: '经济心理学', title: '锚定效应的消费陷阱', content: '锚定效应是指人们在做决策时会过度依赖最先获得的信息。商家常利用这一原理，通过标注"原价"来制造打折的假象。了解这一心理现象可以帮助我们更理性地消费，在购买前先明确自己的预算和需求，避免被价格标签牵着走。' },
    { field: '认知心理学', title: '元认知提升学习效率', content: '元认知是指对自己思维过程的认识和调控。具备元认知能力的人能够：制定合理的学习计划、监控自己的理解程度、在发现问题时及时调整策略。通过每天花几分钟反思"我今天学到了什么"、"哪里遇到了困难"、"下一步该怎么改进"，可以显著提升学习效率。' },
    { field: '临床心理学', title: '压力管理技巧', content: '长期压力会对身心健康造成严重影响。有效的压力管理包括：识别压力源并区分可控与不可控因素、运用深呼吸和冥想等放松技巧、保持规律运动和充足睡眠、建立支持性的社交网络。记住，寻求帮助是智慧而非软弱的表现。' },
    { field: '教育心理学', title: '成长型思维的力量', content: '斯坦福大学的德韦克教授提出，思维方式分为固定型和成长型。固定型思维相信能力是天生的，而成长型思维认为能力可以通过努力提升。研究表明，成长型思维的学生在面对挑战时更不容易放弃，更愿意尝试新方法，也更容易取得进步。表扬努力而非天赋可以帮助孩子培养成长型思维。' },
    { field: '积极心理学', title: '感恩练习的科学证据', content: '研究表明，每天记录感恩事项的人幸福感显著提升，情绪更积极，人际关系也更好。感恩练习的方法很简单：每天晚上写下3件让你感恩的事，可以是大到家人的支持，也可以是小到一杯热咖啡。长期坚持会让你更容易注意到生活中的美好。' }
  ]
  
  return knowledgeBase[Math.floor(Math.random() * knowledgeBase.length)]
}

// 主入口
exports.main = async (event, context) => {
  const { field: specifiedField, refresh = false } = event
  
  console.log('【云函数开始】dailyPsychology, refresh:', refresh)
  
  try {
    // 随机选择心理学领域
    const field = specifiedField 
      ? psychologyFields.find(f => f.id === specifiedField) || psychologyFields[Math.floor(Math.random() * psychologyFields.length)]
      : psychologyFields[Math.floor(Math.random() * psychologyFields.length)]
    
    console.log('【选择领域】', field.name, field.icon)
    
    // 尝试调用AI生成
    const prompt = buildPsychologyPrompt()
    console.log('【开始AI生成】')
    
    let aiResult = null
    try {
      aiResult = await callHunyuanAPI(prompt)
      console.log('【AI生成结果】', aiResult ? aiResult.substring(0, 100) + '...' : '无')
    } catch (e) {
      console.error('【AI调用异常】', e.message)
    }
    
    let psychology
    
    if (aiResult && aiResult.length > 20) {
      // AI生成成功
      const parsed = parseAIResult(aiResult, field)
      psychology = {
        ...parsed,
        fieldIcon: field.icon,
        isAIGenerated: true,
        source: 'AI心理学专家',
        date: new Date().toISOString().split('T')[0]
      }
      console.log('【使用AI生成】', psychology.title)
    } else {
      // AI生成失败，使用备用方案
      console.log('【使用备用方案】')
      const fallback = getFallbackKnowledge()
      psychology = {
        ...fallback,
        fieldIcon: field.icon,
        isAIGenerated: false,
        source: '心理学知识库',
        date: new Date().toISOString().split('T')[0]
      }
    }
    
    // 保存到数据库
    await saveToDb(psychology)
    
    return {
      success: true,
      psychology,
      source: psychology.isAIGenerated ? 'AI生成' : '备用知识库'
    }
    
  } catch (e) {
    console.error('【云函数异常】', e)
    return {
      success: false,
      error: e.message
    }
  }
}
