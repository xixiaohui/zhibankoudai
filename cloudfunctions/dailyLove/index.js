/**
 * 云函数：dailyLove - AI生成每日情话
 * 
 * 功能：
 * 1. 使用混元模型实时生成甜蜜情话
 * 2. 包含古风、现代、名人、诗词等多种风格
 * 3. 存入云数据库
 */

// 50条中文经典情话兜底数据
const FALLBACK_LOVE = [
  // 经典古风 (15条)
  { content: '愿我如星君如月，夜夜流光相皎洁。', author: '范成大', source: '车遥遥篇', category: 'classic' },
  { content: '入我相思门，知我相思苦。', author: '李白', source: '三五七言', category: 'classic' },
  { content: '只愿君心似我心，定不负相思意。', author: '李之仪', source: '卜算子', category: 'classic' },
  { content: '身无彩凤双飞翼，心有灵犀一点通。', author: '李商隐', source: '无题', category: 'classic' },
  { content: '愿得一心人，白头不相离。', author: '卓文君', source: '白头吟', category: 'classic' },
  { content: '问世间，情为何物，直教生死相许。', author: '元好问', source: '摸鱼儿', category: 'classic' },
  { content: '两情若是久长时，又岂在朝朝暮暮。', author: '秦观', source: '鹊桥仙', category: 'classic' },
  { content: '在天愿作比翼鸟，在地愿为连理枝。', author: '白居易', source: '长恨歌', category: 'classic' },
  { content: '曾经沧海难为水，除却巫山不是云。', author: '元稹', source: '离思', category: 'classic' },
  { content: '平生不会相思，才会相思，便害相思。', author: '徐再思', source: '折桂令', category: 'classic' },
  { content: '山有木兮木有枝，心悦君兮君不知。', author: '佚名', source: '越人歌', category: 'classic' },
  { content: '执子之手，与子偕老。', author: '佚名', source: '诗经·击鼓', category: 'classic' },
  { content: '衣带渐宽终不悔，为伊消得人憔悴。', author: '柳永', source: '蝶恋花', category: 'classic' },
  { content: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德', source: '木兰词', category: 'classic' },
  { content: '情不知所起，一往而深，生者可以死，死可以生。', author: '汤显祖', source: '牡丹亭', category: 'classic' },
  
  // 甜蜜现代 (15条)
  { content: '我行过许多地方的桥，看过许多次数的云，喝过许多种类的酒，却只爱过一个正当最好年龄的人。', author: '沈从文', source: '湘行散记', category: 'modern' },
  { content: '于千万人之中遇见你所要遇见的人，于千万年之中，时间的无涯的荒野里，没有早一步，也没有晚一步，刚巧赶上了。', author: '张爱玲', source: '爱', category: 'modern' },
  { content: '你再差劲也会有一个人爱你。', author: '张爱玲', source: '', category: 'modern' },
  { content: '我将于茫茫人海中访我唯一灵魂之伴侣；得之，我幸；不得，我命。', author: '徐志摩', source: '致梁启超', category: 'modern' },
  { content: '别问我爱不爱你，因为余光中都是你。', author: '余光中', source: '', category: 'modern' },
  { content: '我见了她，她便存在于我整个世界。', author: '林徽因', source: '', category: 'modern' },
  { content: '每想你一次，天上飘落一粒沙，从此形成了撒哈拉。', author: '三毛', source: '撒哈拉的故事', category: 'modern' },
  { content: '如果有来生，要做一棵树，站成永恒，没有悲欢的姿势。一半在土里安详，一半在风里飞扬。', author: '三毛', source: '如果有来生', category: 'modern' },
  { content: '我把我整个灵魂都给你，连同它的怪癖，耍小脾气，忽明忽暗，一千八百种坏毛病。', author: '王小波', source: '爱你就像爱生命', category: 'modern' },
  { content: '你要是愿意，我就永远爱你；你要是不愿意，我就永远相思。', author: '王小波', source: '爱你就像爱生命', category: 'modern' },
  { content: '答案很长，我准备用一生的时间来回答，你准备要听了吗？', author: '林徽因', source: '', category: 'modern' },
  { content: '遇见你之前，我没想过结婚；遇见你之后，结婚我没想过别人。', author: '钱钟书', source: '', category: 'modern' },
  { content: '在遇见你之前，我从未想过结婚；在遇见你之后，我从未想过和别人结婚。', author: '杨绛', source: '', category: 'modern' },
  { content: '你是我纸短情长的雨季，也是我满目星河的根本。', author: '佚名', source: '', category: 'modern' },
  { content: '斯人若彩虹，遇上方知有。', author: '文德琳·范·德拉安南', source: '怦然心动', category: 'modern' },
  
  // 名人情话 (10条)
  { content: '我顽固地爱你。', author: '胡适', source: '', category: 'celebrity' },
  { content: '我不要孤独，不要做愚人，我要在死后世界找到你的灵魂。', author: '朱生豪', source: '朱生豪情书', category: 'celebrity' },
  { content: '我愿意舍弃一切，以想念你终此一生。', author: '朱生豪', source: '朱生豪情书', category: 'celebrity' },
  { content: '我一天一天明白你的平凡，同时却一天一天愈更深切地爱你。', author: '朱生豪', source: '朱生豪情书', category: 'celebrity' },
  { content: '醒来觉得甚是爱你。', author: '朱生豪', source: '朱生豪情书', category: 'celebrity' },
  { content: '我愿意像把我包围的枕头一样，抱着你。', author: '徐志摩', source: '', category: 'celebrity' },
  { content: '我将于人海之中遇见你，只为了一个不确定的未来。', author: '顾城', source: '', category: 'celebrity' },
  { content: '我永恒的灵魂，注视着你的心，纵然黑夜孤寂，白昼如焚。', author: '兰波', source: '', category: 'celebrity' },
  { content: '你微微地笑着，不同我说什么话。而我觉得，为了这个，我已等待很久了。', author: '泰戈尔', source: '飞鸟集', category: 'celebrity' },
  { content: '我把我整个灵魂都给你，连同它的怪癖，耍小脾气，忽明忽暗。', author: '王小波', source: '爱你就像爱生命', category: 'celebrity' },
  
  // 诗词传情 (10条)
  { content: '关关雎鸠，在河之洲。窈窕淑女，君子好逑。', author: '佚名', source: '诗经·关雎', category: 'poetry' },
  { content: '蒹葭苍苍，白露为霜。所谓伊人，在水一方。', author: '佚名', source: '诗经·蒹葭', category: 'poetry' },
  { content: '死生契阔，与子成说。执子之手，与子偕老。', author: '佚名', source: '诗经·击鼓', category: 'poetry' },
  { content: '上邪！我欲与君相知，长命无绝衰。', author: '佚名', source: '上邪', category: 'poetry' },
  { content: '山无陵，江水为竭，冬雷震震，夏雨雪，天地合，乃敢与君绝。', author: '佚名', source: '上邪', category: 'poetry' },
  { content: '春蚕到死丝方尽，蜡炬成灰泪始干。', author: '李商隐', source: '无题', category: 'poetry' },
  { content: '何当共剪西窗烛，却话巴山夜雨时。', author: '李商隐', source: '夜雨寄北', category: 'poetry' },
  { content: '此情可待成追忆，只是当时已惘然。', author: '李商隐', source: '锦瑟', category: 'poetry' },
  { content: '金风玉露一相逢，便胜却人间无数。', author: '秦观', source: '鹊桥仙', category: 'poetry' },
  { content: '柔情似水，佳期如梦，忍顾鹊桥归路。', author: '秦观', source: '鹊桥仙', category: 'poetry' }
]

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 获取随机分类
function getRandomCategory() {
  const categories = ['classic', 'modern', 'celebrity', 'poetry']
  return categories[Math.floor(Math.random() * categories.length)]
}

// 获取分类名称
function getCategoryName(category) {
  const names = {
    'classic': '经典古风',
    'modern': '甜蜜现代',
    'celebrity': '名人情话',
    'poetry': '诗词传情'
  }
  return names[category] || '甜蜜情话'
}

// 构建AI生成prompt
function buildLovePrompt(category) {
  const prompts = {
    'classic': `请创作一句古风情话，要求：
1. 仿古诗词风格，文言文或半文言
2. 表达恋人间的思念、爱慕、承诺等情感
3. 意境优美，含蓄深情
4. 15-30字
5. 格式：情话内容

直接输出一句古风情话，不要任何前缀说明：`,

    'modern': `请创作一句现代甜蜜情话，要求：
1. 浪漫温馨，甜蜜撩人
2. 表达对爱人的思念、喜欢、深情
3. 语言生动，可以有点俏皮
4. 15-40字

直接输出一句现代情话，不要任何前缀说明：`,

    'celebrity': `请创作一句名人风格的情话，要求：
1. 仿名家写作风格，如沈从文、张爱玲、三毛、王小波等
2. 文笔优美，感情真挚
3. 富有文学气息和感染力
4. 20-50字

直接输出一句名人风格情话，不要任何前缀说明：`,

    'poetry': `请从中国古典诗词中挑选或化用一句经典的爱情诗句，要求：
1. 必须是真实存在的古诗词名句
2. 表达爱情、思念、相思等情感
3. 注明出处和作者
4. 格式：诗句|出处|作者

直接输出，格式示例：两情若是久长时，又岂在朝朝暮暮。|鹊桥仙|秦观`
  }
  return prompts[category] || prompts['modern']
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
    MaxTokens: 200
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
async function saveToDb(love) {
  try {
    await db.collection('dailyLoves').add({
      data: {
        ...love,
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

// 获取备用情话
function getFallbackLove(category) {
  const filtered = FALLBACK_LOVE.filter(l => l.category === category)
  const pool = filtered.length > 0 ? filtered : FALLBACK_LOVE
  return pool[Math.floor(Math.random() * pool.length)]
}

// 主入口
exports.main = async (event, context) => {
  const { type: specifiedType, refresh = false } = event
  
  console.log('【云函数开始】dailyLove, specifiedType:', specifiedType, 'refresh:', refresh)
  
  try {
    // 随机选择类型
    const category = specifiedType || getRandomCategory()
    console.log('【选择类型】', getCategoryName(category))
    
    const prompt = buildLovePrompt(category)
    
    // 尝试调用AI
    let aiResult = null
    try {
      aiResult = await callHunyuanAPI(prompt)
    } catch (e) {
      console.error('【AI调用异常】', e.message)
    }
    
    let love
    
    if (aiResult && aiResult.length > 5) {
      // AI生成成功
      if (category === 'poetry') {
        // 诗词格式：诗句|出处|作者
        const parts = aiResult.split('|').map(p => p.trim())
        love = {
          content: parts[0] || aiResult,
          author: parts[2] || '佚名',
          source: parts[1] || '诗词精选',
          category: category,
          categoryName: getCategoryName(category),
          isAIGenerated: true
        }
      } else {
        love = {
          content: aiResult,
          author: 'AI创作',
          source: '',
          category: category,
          categoryName: getCategoryName(category),
          isAIGenerated: true
        }
      }
      console.log('【使用AI生成】', love.content.substring(0, 30))
    } else {
      // 使用备用
      console.log('【使用备用方案】')
      const fallback = getFallbackLove(category)
      love = {
        ...fallback,
        categoryName: getCategoryName(fallback.category),
        isAIGenerated: false
      }
    }
    
    love.date = new Date().toISOString().split('T')[0]
    
    // 保存到数据库
    await saveToDb(love)
    
    return {
      success: true,
      love,
      source: love.isAIGenerated ? 'AI创作' : '经典库'
    }
    
  } catch (e) {
    console.error('【云函数异常】', e)
    return {
      success: false,
      error: e.message
    }
  }
}
