/**
 * 云函数：dailyJoke - AI生成每日搞笑段子
 * 
 * 功能：
 * 1. 使用混元模型实时生成搞笑段子
 * 2. 涵盖职场、生活、校园、社交等多种场景
 * 3. 存入云数据库
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 段子场景配置
const jokeScenes = [
  { id: 'work', name: '职场', icon: '💼', topics: ['同事关系', '领导开会', '加班日常', '甲方需求', '职场技能', '面试趣事'] },
  { id: 'life', name: '生活', icon: '🏠', topics: ['家庭趣事', '夫妻日常', '养娃日常', '做饭翻车', '购物经历', '宠物故事'] },
  { id: 'campus', name: '校园', icon: '📚', topics: ['室友相处', '考试趣事', '社团活动', '食堂生活', '选课经历', '毕业季'] },
  { id: 'social', name: '社交', icon: '👫', topics: ['相亲经历', '聚会尴尬', '微信社交', '份子钱', '人情往来', '催婚日常'] },
  { id: 'internet', name: '网络', icon: '📱', topics: ['网购经历', '直播带货', '网络热梗', '外卖趣事', '短视频', '网友互动'] },
  { id: 'health', name: '健康', icon: '🏥', topics: ['体检经历', '减肥日常', '熬夜后果', '养生误区', '看病趣事', '健身打卡'] }
]

// 构建AI生成prompt
function buildJokePrompt(scene, topic) {
  const promptTemplates = [
    `请创作一段搞笑段子，要求：
1. 场景：${scene.name} - ${topic}
2. 300字以内，要完整有趣
3. 接地气，有共鸣感
4. 结局反转或意外最好
5. 可以有轻微夸张但不要低俗
6. 结尾可以用金句总结

格式要求：
标题|正文内容

直接输出，标题和内容用|分隔：`,
    
    `写一个关于${scene.name}中${topic}的幽默段子，要求：
1. 生活中真实会发生的场景
2. 结尾要有笑点，让人会心一笑
3. 适当加入对话更有趣
4. 字数150-300字

格式：标题|段子正文`
  ]
  
  return promptTemplates[Math.floor(Math.random() * promptTemplates.length)]
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
    Temperature: 0.9,
    MaxTokens: 400
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

// 解析AI生成的内容
function parseAIResult(content, scene) {
  const parts = content.split('|')
  if (parts.length >= 2) {
    return {
      title: parts[0].trim(),
      content: parts.slice(1).join('|').trim(),
      scene: scene.name,
      sceneIcon: scene.icon
    }
  }
  
  // 如果解析失败
  return {
    title: `${scene.name}趣事`,
    content: content,
    scene: scene.name,
    sceneIcon: scene.icon
  }
}

// 保存到数据库
async function saveToDb(joke) {
  try {
    await db.collection('dailyJokes').add({
      data: {
        ...joke,
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

// 备用段子库
function getFallbackJoke(scene) {
  const jokes = {
    work: [
      { title: '甲方的神仙需求', content: '甲方：把这个logo放大的同时缩小一点。\n\n我：？？？\n\n甲方：就是那种看起来变大了但是实际上没变大的感觉。\n\n我：好的，我试试AI。\n\n三天后\n\n甲方：这个logo好像还是太大了，再调调。\n\n我：好的。\n\n甲方：等等，好像又太小了。\n\n我：...\n\n甲方：你明白我的意思吧？\n\n我：我太明白了。这就是薛定谔的logo。' },
      { title: '职场黑话翻译器', content: '领导：这个词不太性感啊。\n\n我：什么意思？\n\nHR：他的意思是让你重写。\n\n领导：我们要形成闭环。\n\n我：就是做完了从头再走一遍流程？\n\nHR：差不多是这个意思。\n\n领导：这个项目我们要对齐一下。\n\n我：开会讨论谁该干什么？\n\nHR：你学得很快。\n\n我：这都是血泪教训。' }
    ],
    life: [
      { title: '网购翻车实录', content: '买家秀：模特穿着仙气飘飘的连衣裙，在海边随风飘扬\n\n卖家秀：我在家里穿着同款，被我妈问是不是买的窗帘布\n\n买家秀：优雅知性的职场女性\n\n卖家秀：我穿上之后像刚睡醒的程序员\n\n买家秀：显瘦遮肉，轻松驾驭\n\n卖家秀：我穿上之后，室友问我是不是怀孕了\n\n我：\n\n我：算了，不退了，留着当教训吧。' },
      { title: '当代家庭地位', content: '家庭地位排序：\n\n第一：猫。吃最贵的猫粮，看最贵的医生，霸占最舒服的沙发。\n\n第二：我老婆。想吃什么做什么，不想吃就不做，全年无休。\n\n第三：我儿子。要什么给什么，除了要钱的时候。\n\n第四：我。吃饭要主动洗碗，外出要主动买单，生病了要主动带病上班。\n\n第五：我爸。倒数的，因为他还敢顶嘴。' }
    ],
    campus: [
      { title: '室友迷惑行为大赏', content: '室友A：每天晚上11点准时睡觉，但早上6点起来学习\n\n室友B：每天早上6点定闹钟，但从来不是自己关的\n\n室友C：每天在宿舍打电话到凌晨3点，但声音小到自己都听不清\n\n我：每天被迫早起，听室友A念书，听室友B闹钟，听室友C打电话\n\n我：这就是985宿舍吗？\n\n室友们：你也可以起来学习啊\n\n我：？？？' }
    ],
    social: [
      { title: '亲戚灵魂拷问指南', content: '过年回家，亲戚灵魂拷问时间到：\n\n七大姑：一个月多少钱啊？\n\n我：够花。\n\n七大姑：够花是多少钱？\n\n我：花多少够多少。\n\n七大姑：有没有对象啊？\n\n我：正在找。\n\n七大姑：怎么还没找到？你表弟都生二胎了。\n\n我：表弟厉害。\n\n七大姑：你什么时候结婚？\n\n我：等通知。\n\n七大姑：什么通知？\n\n我：民政局的上班通知。' }
    ],
    internet: [
      { title: '直播带货受害者联盟', content: '我：刷到这个主播推荐，眉笔九块九，买！\n\n到货后：\n\n我：这就是九块九的质量吗？\n\n室友：九块九你还想怎样？\n\n我：好歹能写字吧...\n\n室友：你试试。\n\n我：写不出来。\n\n室友：能当教鞭吗？\n\n我：折了。\n\n室友：这下能当牙签了。\n\n我：...\n\n我：下次再也不买了。\n\n三天后\n\n我：咦，这个九块九的面膜看起来不错...' }
    ],
    health: [
      { title: '当代年轻人养生', content: '我：我要开始养生了。\n\n第一天：跑步5公里，早睡早起。\n\n第二天：跑步4公里，可以。\n\n第三天：跑步3公里，不错。\n\n第四天：走路2公里，锻炼。\n\n第五天：在床上做拉伸运动，很专业。\n\n第六天：看养生文章，算学习。\n\n第七天：躺平，也是养生的一种。\n\n第八天：算了，人生苦短，及时行乐。\n\n第九天：买了跑步装备，算投资。\n\n第十天：装备到了，收藏。' }
    ]
  }
  
  const sceneJokes = jokes[scene?.id] || jokes.life
  return sceneJokes[Math.floor(Math.random() * sceneJokes.length)]
}

// 主入口
exports.main = async (event, context) => {
  const { category, refresh = false } = event
  
  console.log('【云函数开始】dailyJoke, category:', category, 'refresh:', refresh)
  
  try {
    // 随机选择场景
    const scene = category 
      ? jokeScenes.find(s => s.id === category) || jokeScenes[Math.floor(Math.random() * jokeScenes.length)]
      : jokeScenes[Math.floor(Math.random() * jokeScenes.length)]
    
    const topic = scene.topics[Math.floor(Math.random() * scene.topics.length)]
    console.log('【选择场景】', scene.name, '-', topic)
    
    const prompt = buildJokePrompt(scene, topic)
    
    // 尝试调用AI
    let aiResult = null
    try {
      aiResult = await callHunyuanAPI(prompt)
    } catch (e) {
      console.error('【AI调用异常】', e.message)
    }
    
    let joke
    
    if (aiResult && aiResult.length > 20) {
      // AI生成成功
      const parsed = parseAIResult(aiResult, scene)
      joke = {
        ...parsed,
        isAIGenerated: true,
        source: 'AI创作'
      }
      console.log('【使用AI生成】', joke.title)
    } else {
      // 使用备用
      console.log('【使用备用段子】')
      const fallback = getFallbackJoke(scene)
      joke = {
        ...fallback,
        scene: scene.name,
        sceneIcon: scene.icon,
        isAIGenerated: false,
        source: '段子精选'
      }
    }
    
    joke.date = new Date().toISOString().split('T')[0]
    
    // 保存到数据库
    await saveToDb(joke)
    
    return {
      success: true,
      joke,
      source: joke.isAIGenerated ? 'AI创作' : '精选段子'
    }
    
  } catch (e) {
    console.error('【云函数异常】', e)
    return {
      success: false,
      error: e.message
    }
  }
}
