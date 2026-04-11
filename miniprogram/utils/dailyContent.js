/**
 * utils/dailyContent.js - 每日内容客户端生成模块
 * 
 * 功能：客户端直接调用 AI 生成每日内容（名言、段子、心理学、金融）
 * 使用 wx.cloud.extend.AI.createModel() 进行流式调用
 * 
 * 数据来源：utils/dailyData.js
 * 
 * 使用方式：
 *   const { DailyContent } = require('./dailyContent.js')
 *   const content = await DailyContent.generateQuote(onChunk, onDone)
 */

const AI_CONFIG = require('./aiConfig.js')
const { 
  PSYCHOLOGY_FIELDS, 
  JOKE_SCENES, 
  FINANCE_FIELDS, 
  FAMOUS_QUOTES,
  FALLBACK_JOKES,
  FALLBACK_PSYCHOLOGY,
  FALLBACK_FINANCE,
  LOVE_FIELDS,
  FALLBACK_LOVE
} = require('./dailyData.js')
const { FALLBACK_MOVIES, MOVIE_GENRES } = require('./movieData.js')
const { FALLBACK_MUSICS, MUSIC_GENRES } = require('./musicData.js')
const { FALLBACK_TECHS, TECH_CATEGORIES } = require('./techData.js')
const { FALLBACK_TCMS, TCM_CATEGORIES } = require('./tcmData.js')
const { FALLBACK_TRAVELS, TRAVEL_REGIONS, TRAVEL_TYPES } = require('./travelData.js')
const { FALLBACK_FORTUNES, BAGUA_DATA, ZODIAC_DATA, CHINESE_ZODIAC_DATA, FORTUNE_TYPES } = require('./fortuneData.js')
const { FALLBACK_AUTHORS, AUTHORS_DATA } = require('./literatureData.js')
const { FALLBACK_FOREIGN_TRADES, FOREIGN_TRADE_CATEGORIES } = require('./foreignTradeData.js')
const { FALLBACK_ECOMMERCE, ECOMMERCE_CATEGORIES } = require('./eCommerceData.js')
const { FALLBACK_MATH, MATH_CATEGORIES } = require('./mathData.js')
const { FALLBACK_ENGLISH, ENGLISH_CATEGORIES } = require('./englishData.js')

// ─── AI 调用核心 ─────────────────────────────────────────────────

/**
 * 流式调用 AI（非等待完整结果，用于实时显示）
 */
async function callAIStream(messages, onChunk, opts = {}) {
  const temperature = opts.temperature ?? AI_CONFIG.AI_CONFIG.params?.temperature ?? 0.75
  const maxTokens = opts.maxTokens || 400

  try {
    const aiModel = wx.cloud.extend.AI.createModel(AI_CONFIG.AI_CONFIG.provider)
    
    console.log('[DailyContent] 调用AI:', AI_CONFIG.AI_CONFIG.model)
    
    const res = await aiModel.streamText({
      data: {
        model: AI_CONFIG.AI_CONFIG.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }
    })

    let fullText = ''
    
    for await (const event of res.eventStream) {
      if (event.data === '[DONE]') break

      try {
        const data = JSON.parse(event.data)
        
        // 跳过思考内容
        const think = data?.choices?.[0]?.delta?.reasoning_content
        if (think) continue

        // 获取生成文本
        const text = data?.choices?.[0]?.delta?.content
        if (text) {
          fullText += text
          onChunk && onChunk(text)
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    return fullText
  } catch (e) {
    console.error('[DailyContent] AI调用失败:', e.message)
    return null
  }
}

/**
 * 同步调用 AI（等待完整结果）
 */
async function callAI(messages, opts = {}) {
  let result = ''
  const text = await callAIStream(messages, (chunk) => { result += chunk }, opts)
  return text || result
}

// ─── 云数据库保存函数 ─────────────────────────────────────────────────

/**
 * 保存名言到云数据库
 */
async function saveQuoteToCloud(quote) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyQuotes').add({
      data: {
        text: quote.text,
        author: quote.author,
        work: quote.work || '',
        domainName: quote.domainName || '名言',
        domainIcon: quote.domainIcon || '📜',
        era: quote.era || 'modern',
        region: quote.region || 'china',
        source: quote.author + (quote.work ? ' ' + quote.work : ''),
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 名言已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存名言到云数据库失败:', e.message)
    return false
  }
}

/**
 * 保存段子到云数据库
 */
async function saveJokeToCloud(joke) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyJokes').add({
      data: {
        title: joke.title,
        content: joke.content,
        scene: joke.scene || '',
        sceneIcon: joke.sceneIcon || '💬',
        source: joke.source || 'AI创作',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 段子已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存段子到云数据库失败:', e.message)
    return false
  }
}

/**
 * 保存心理学知识到云数据库
 */
async function savePsychologyToCloud(psychology) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPsychology').add({
      data: {
        field: psychology.field,
        fieldIcon: psychology.fieldIcon || '🧠',
        title: psychology.title,
        content: psychology.content,
        source: psychology.source || 'AI心理学专家',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 心理学知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存心理学知识到云数据库失败:', e.message)
    return false
  }
}

/**
 * 保存金融知识到云数据库
 */
async function saveFinanceToCloud(finance) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFinance').add({
      data: {
        category: finance.category,
        categoryIcon: finance.categoryIcon || '💰',
        title: finance.title,
        content: finance.content,
        source: finance.source || 'AI金融顾问',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 金融知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存金融知识到云数据库失败:', e.message)
    return false
  }
}

// ─── 内容生成函数 ─────────────────────────────────────────────────

/**
 * 从名言库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomQuoteFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FAMOUS_QUOTES.length
  return { ...FAMOUS_QUOTES[index] }
}

/**
 * 生成每日名言（AI创作 + 名言库兜底）
 */
async function generateQuote() {
  // 尝试AI生成
  const isPoetry = Math.random() > 0.5
  
  let messages, prompt
  
  if (isPoetry) {
    const topics = ['春天', '夏天', '秋天', '冬天', '山水', '思乡', '友情', '人生', '离别', '思念']
    const topic = topics[Math.floor(Math.random() * topics.length)]
    
    prompt = `请从中国古典诗词库中查找或创作一句经典诗词名句（必须是真实存在的古诗词，不得杜撰），要求：
1. 主题：${topic}
2. 必须是真实的、广泛流传的经典诗句
3. 注明作者、朝代和诗题

格式：诗句|作者|朝代|诗题

直接输出，示例：但愿人长久，千里共婵娟。|苏轼|宋|水调歌头`
  } else {
    const categories = ['人生哲理', '励志名言', '情感感悟', '生活智慧', '读书感悟', '处世哲学']
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    prompt = `请从世界名言库中查找一句经典名人名言（必须是真实存在的名言，不得杜撰），要求：
1. 主题：${category}
2. 必须是真实的、广泛流传的经典名言
3. 注明作者和出处

格式：名言内容|作者|出处

直接输出，示例：知识就是力量。|培根|


直接输出，不要任何前缀说明：`
  }

  messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 200 })
    
    if (result && result.length > 5) {
      // 解析AI返回结果
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      let quote
      if (parts.length >= 3) {
        // 古诗词格式：诗句|作者|朝代|诗题
        if (isPoetry) {
          quote = {
            text: parts[0],
            author: parts[1],
            work: parts[3] ? '《' + parts[3] + '》' : '',
            domainName: parts[2] + '诗词',
            domainIcon: '📜',
            era: 'ancient',
            region: 'china',
            type: 'poetry'
          }
        } else {
          // 现代名言格式：名言|作者|出处
          quote = {
            text: parts[0],
            author: parts[1],
            work: parts[2] || '',
            domainName: '名言警句',
            domainIcon: '💬',
            era: 'modern',
            region: 'foreign',
            type: 'quote'
          }
        }
      } else if (parts.length >= 2) {
        quote = {
          text: parts[0],
          author: parts[1],
          work: '',
          domainName: isPoetry ? '诗词' : '名言',
          domainIcon: isPoetry ? '📜' : '💬',
          era: isPoetry ? 'ancient' : 'modern',
          region: 'china',
          type: isPoetry ? 'poetry' : 'quote'
        }
      } else {
        // 无法解析，直接使用AI返回内容
        quote = {
          text: result.trim(),
          author: '佚名',
          work: '',
          domainName: isPoetry ? '诗词' : '名言',
          domainIcon: isPoetry ? '📜' : '💬',
          era: isPoetry ? 'ancient' : 'modern',
          region: 'china',
          type: isPoetry ? 'poetry' : 'quote'
        }
      }
      
      quote.date = new Date().toISOString().split('T')[0]
      quote.source = quote.author + (quote.work ? ' ' + quote.work : '')
      quote.isAIGenerated = true
      
      // 保存到云数据库
      saveQuoteToCloud(quote).catch(() => {})
      
      console.log('[DailyContent] AI生成名言:', quote.text.substring(0, 20) + '...', '-', quote.author)
      return quote
    }
  } catch (e) {
    console.error('[DailyContent] AI生成名言失败:', e.message)
  }
  
  // AI失败，使用名言库兜底
  const fallback = getRandomQuoteFromLibrary()
  fallback.date = new Date().toISOString().split('T')[0]
  fallback.source = fallback.author + (fallback.work ? ' ' + fallback.work : '')
  fallback.isAIGenerated = false
  
  // 保存到云数据库
  saveQuoteToCloud(fallback).catch(() => {})
  
  console.log('[DailyContent] 名言库兜底:', fallback.text.substring(0, 20) + '...', '-', fallback.author)
  return fallback
}

/**
 * 生成每日段子
 */
async function generateJoke() {
  const scene = JOKE_SCENES[Math.floor(Math.random() * JOKE_SCENES.length)]
  const topic = scene.topics[Math.floor(Math.random() * scene.topics.length)]
  
  const prompt = `请创作一段搞笑段子，要求：
1. 场景：${scene.name} - ${topic}
2. 200字以内，要完整有趣
3. 接地气，有共鸣感
4. 结局反转或意外最好
5. 可以有轻微夸张但不要低俗

格式要求：
标题|正文内容（标题和内容用|分隔）

直接输出：`

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.9, maxTokens: 400 })
    
    if (result && result.length > 20) {
      const parts = result.split('|')
      if (parts.length >= 2) {
        const joke = {
          title: parts[0].trim(),
          content: parts.slice(1).join('|').trim(),
          scene: scene.name,
          sceneIcon: scene.icon,
          source: 'AI创作',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveJokeToCloud(joke).catch(() => {})
        return joke
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成段子失败:', e)
  }
  
  // 使用备用
  const fallback = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)]
  const result = {
    ...fallback,
    source: '段子精选',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveJokeToCloud(result).catch(() => {})
  return result
}

/**
 * 生成每日心理学知识
 */
async function generatePsychology() {
  const field = PSYCHOLOGY_FIELDS[Math.floor(Math.random() * PSYCHOLOGY_FIELDS.length)]
  const topic = field.topics[Math.floor(Math.random() * field.topics.length)]
  
  const prompt = `你是一位资深心理学专家，请用通俗易懂的语言，分享一个实用的心理学知识。

要求：
1. 心理学领域：${field.name} - ${topic}
2. 内容要点：
   - 核心概念解释（1-2句）
   - 日常生活中的应用（2-3个具体例子）
   - 实用建议或练习（1-2个可操作的方法）
3. 语言要通俗生动，避免过于学术化
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|知识点标题|正文内容

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 30) {
      const parts = result.split('|')
      if (parts.length >= 3) {
        const psychology = {
          field: parts[0].trim(),
          title: parts[1].trim(),
          content: parts.slice(2).join('|').trim(),
          fieldIcon: field.icon,
          source: 'AI心理学专家',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePsychologyToCloud(psychology).catch(() => {})
        return psychology
      } else if (parts.length === 2) {
        const psychology = {
          field: field.name,
          title: parts[0].trim(),
          content: parts[1].trim(),
          fieldIcon: field.icon,
          source: 'AI心理学专家',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePsychologyToCloud(psychology).catch(() => {})
        return psychology
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成心理学知识失败:', e)
  }
  
  // 使用备用
  const fallback = FALLBACK_PSYCHOLOGY[Math.floor(Math.random() * FALLBACK_PSYCHOLOGY.length)]
  const result = {
    ...fallback,
    fieldIcon: field.icon,
    source: '心理学知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  savePsychologyToCloud(result).catch(() => {})
  return result
}

/**
 * 生成每日金融知识
 */
async function generateFinance() {
  const field = FINANCE_FIELDS[Math.floor(Math.random() * FINANCE_FIELDS.length)]
  const topic = field.topics[Math.floor(Math.random() * field.topics.length)]
  
  const prompt = `你是一位专业金融顾问，请用通俗易懂的语言，分享一个实用的金融知识常识。

要求：
1. 金融领域：${field.name} - ${topic}
2. 内容要点：
   - 核心概念解释（1-2句，让小白也能看懂）
   - 实际应用场景（2-3个具体例子）
   - 实用建议或注意事项（1-2个可操作的方法）
3. 语言要通俗生动，避免过于学术化
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气
6. 可以适当举例说明

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 30) {
      const parts = result.split('|')
      if (parts.length >= 3) {
        const finance = {
          category: parts[0].trim(),
          title: parts[1].trim(),
          content: parts.slice(2).join('|').trim(),
          categoryIcon: field.icon,
          source: 'AI金融顾问',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFinanceToCloud(finance).catch(() => {})
        return finance
      } else if (parts.length === 2) {
        const finance = {
          category: field.name,
          title: parts[0].trim(),
          content: parts[1].trim(),
          categoryIcon: field.icon,
          source: 'AI金融顾问',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFinanceToCloud(finance).catch(() => {})
        return finance
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成金融知识失败:', e)
  }
  
  // 使用备用
  const fallback = FALLBACK_FINANCE[Math.floor(Math.random() * FALLBACK_FINANCE.length)]
  const result = {
    ...fallback,
    categoryIcon: field.icon,
    source: '金融知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveFinanceToCloud(result).catch(() => {})
  return result
}

// ─── 每日情话 ─────────────────────────────────────────────────

/**
 * 保存情话到云数据库
 */
async function saveLoveToCloud(love) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLoves').add({
      data: {
        ...love,
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 情话已保存到云数据库')
  } catch (e) {
    console.error('[DailyContent] 保存情话到云数据库失败:', e)
  }
}

/**
 * 生成每日情话
 */
async function generateLove() {
  const category = LOVE_FIELDS[Math.floor(Math.random() * LOVE_FIELDS.length)]
  
  const prompts = {
    'classic': `请创作一句古风情话，要求：
1. 仿古诗词风格，文言文或半文言
2. 表达恋人间的思念、爱慕、承诺等情感
3. 意境优美，含蓄深情
4. 15-30字

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

  const prompt = prompts[category.id] || prompts['modern']
  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.9, maxTokens: 300 })
    
    if (result && result.length > 5) {
      let love = {
        category: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        source: 'AI创作',
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
      
      // 诗词格式需要解析
      if (category.id === 'poetry') {
        const parts = result.split('|').map(p => p.trim())
        love.content = parts[0] || result
        love.author = parts[2] || '佚名'
        love.source = parts[1] || '诗词精选'
      } else {
        love.content = result
        love.author = 'AI创作'
        love.source = ''
      }
      
      // 保存到云数据库
      saveLoveToCloud(love).catch(() => {})
      return love
    }
  } catch (e) {
    console.error('[DailyContent] 生成情话失败:', e)
  }
  
  // 使用备用
  const fallback = FALLBACK_LOVE[Math.floor(Math.random() * FALLBACK_LOVE.length)]
  const result = {
    ...fallback,
    categoryName: category.name,
    categoryIcon: category.icon,
    source: '经典情话库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveLoveToCloud(result).catch(() => {})
  return result
}

// ─── 每日电影 ─────────────────────────────────────────────────

/**
 * 保存电影到云数据库
 */
async function saveMovieToCloud(movie) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMovies').add({
      data: {
        title: movie.title,
        director: movie.director,
        year: movie.year,
        rating: movie.rating,
        genre: movie.genre,
        genreIcon: movie.genreIcon || '🎬',
        summary: movie.summary,
        quote: movie.quote || '',
        tags: movie.tags || [],
        source: movie.source || 'AI推荐',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 电影已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存电影到云数据库失败:', e)
    return false
  }
}

/**
 * 从电影库随机获取一部（使用日期种子保证每天一致）
 */
function getRandomMovieFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_MOVIES.length
  return { ...FALLBACK_MOVIES[index] }
}

/**
 * 生成每日电影推荐
 */
async function generateMovie() {
  const genre = MOVIE_GENRES[Math.floor(Math.random() * MOVIE_GENRES.length)]
  const topic = genre.topics[Math.floor(Math.random() * genre.topics.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'classic', 'recent', 'chinese', 'animation']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'classic') {
    prompt = `你是一位资深影评人，请推荐一部影史经典高分电影。

要求：
1. 选择豆瓣9分以上的经典电影
2. 可以是任何类型：剧情、爱情、科幻、动画等
3. 必须是真正有深度、有口碑、经得起时间考验的经典之作

格式：
片名|导演|年份|评分|类型|剧情简介|经典台词|标签

直接输出，不要任何前缀：`
  } else if (promptType === 'recent') {
    prompt = `你是一位资深影评人，请推荐一部近年上映的口碑佳作。

要求：
1. 选择2018年以后上映的8.5分以上电影
2. 类型不限：${genre.name} - ${topic}
3. 可以是院线片或流媒体佳作

格式：
片名|导演|年份|评分|类型|剧情简介|推荐理由|标签

直接输出，不要任何前缀：`
  } else if (promptType === 'chinese') {
    prompt = `你是一位资深影评人，请推荐一部国产经典电影。

要求：
1. 选择中国（包括港澳台）的优秀电影
2. 优先推荐有深度、有情怀、展现中国文化特色的作品
3. 类型可以是：${genre.name}

格式：
片名|导演|年份|评分|类型|剧情简介|推荐理由|标签

直接输出，不要任何前缀：`
  } else if (promptType === 'animation') {
    prompt = `你是一位资深影评人，请推荐一部经典动画电影。

要求：
1. 可以是任何国家的优秀动画：宫崎骏、皮克斯、迪士尼、国产动画等
2. 选择真正有深度、老少皆宜的动画佳作

格式：
片名|导演|年份|评分|剧情简介|推荐理由|经典台词|标签

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深影评人，请推荐一部经典电影。

要求：
1. 电影类型：${genre.name} - ${topic}
2. 可以是中国电影或外国电影，优先推荐9分以上的高分经典
3. 内容要点：
   - 电影基本信息（片名、导演、年份、评分）
   - 剧情简介（不剧透关键情节，100字以内）
   - 一句推荐理由或经典台词
4. 语言要生动有感染力

格式要求：
片名|导演|年份|评分|类型|类型图标|剧情简介|推荐理由/经典台词|标签1,标签2,标签3

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 5) {
        const movie = {
          title: parts[0] || '未知电影',
          director: parts[1] || '未知导演',
          year: parts[2] || '未知年份',
          rating: parts[3] || '9.0',
          genre: parts[4] || genre.name,
          genreIcon: genre.icon,
          summary: parts.length > 6 ? parts.slice(5, -1).join('|') : (parts[5] || ''),
          quote: parts.length > 1 ? parts[parts.length - 1] : '',
          tags: parts.length > 1 ? parts[parts.length - 1].split(',').map(t => t.trim()) : [],
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        
        // 保存到云数据库
        saveMovieToCloud(movie).catch(() => {})
        return movie
      } else if (parts.length >= 4) {
        const movie = {
          title: parts[0],
          director: parts[1],
          year: parts[2],
          rating: parts[3],
          genre: genre.name,
          genreIcon: genre.icon,
          summary: parts[4] || '',
          quote: '',
          tags: [],
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveMovieToCloud(movie).catch(() => {})
        return movie
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成电影推荐失败:', e)
  }
  
  // 使用备用电影库
  const fallback = getRandomMovieFromLibrary()
  const result = {
    ...fallback,
    source: '电影推荐库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveMovieToCloud(result).catch(() => {})
  return result
}

// ─── 每日音乐 ─────────────────────────────────────────────────

/**
 * 保存音乐到云数据库
 */
async function saveMusicToCloud(music) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMusics').add({
      data: {
        title: music.title,
        artist: music.artist,
        year: music.year,
        genre: music.genre,
        genreIcon: music.genreIcon || '🎵',
        album: music.album || '',
        duration: music.duration || '',
        description: music.description || '',
        lyric: music.lyric || '',
        mood: music.mood || '',
        moodIcon: music.moodIcon || '🎵',
        tags: music.tags || [],
        source: music.source || 'AI推荐',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 音乐已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存音乐到云数据库失败:', e)
    return false
  }
}

/**
 * 从音乐库随机获取一首（使用日期种子保证每天一致）
 */
function getRandomMusicFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_MUSICS.length
  return { ...FALLBACK_MUSICS[index] }
}

/**
 * 生成每日音乐推荐
 */
async function generateMusic() {
  const genre = MUSIC_GENRES[Math.floor(Math.random() * MUSIC_GENRES.length)]
  const topic = genre.topics[Math.floor(Math.random() * genre.topics.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'classical', 'chinese']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'classical') {
    prompt = `你是一位资深古典音乐评论人，请推荐一首经典古典音乐作品。

要求：
1. 选择古典音乐史上的经典作品
2. 可以是任何时期：巴洛克、古典主义、浪漫主义、现代
3. 必须是真正有深度、有艺术价值的作品

格式：
曲名|艺术家|年代|类型|专辑|时长|音乐简介|推荐理由|情绪|情绪图标|标签

直接输出，不要任何前缀：`
  } else if (promptType === 'chinese') {
    prompt = `你是一位资深音乐评论人，请推荐一首中国经典音乐作品。

要求：
1. 选择中国（包括港澳台）的优秀音乐作品
2. 可以是任何类型：古典、流行、民乐、影视原声
3. 优先推荐展现中国文化特色或有深度情感的作品

格式：
曲名|艺术家|年代|类型|专辑|简介|推荐理由|情绪|情绪图标|标签

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深音乐评论人，请推荐一首经典音乐作品。

要求：
1. 音乐类型：${genre.name} - ${topic}
2. 可以是中国音乐或外国音乐，优先推荐真正有艺术价值和情感共鸣的作品
3. 内容要点：
   - 音乐基本信息（曲名、艺术家、年代、类型）
   - 音乐简介（音乐风格、创作背景，100字以内）
   - 一句推荐理由或经典歌词/乐句
   - 推荐给什么情绪或场景听
4. 语言要生动有感染力

格式要求：
曲名|艺术家|年代|类型|类型图标|专辑|时长|音乐简介|推荐理由/经典歌词|音乐情绪|情绪图标|标签1,标签2,标签3

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 6) {
        const music = {
          title: parts[0] || '未知曲目',
          artist: parts[1] || '未知艺术家',
          year: parts[2] || '未知年代',
          genre: parts[3] || genre.name,
          genreIcon: genre.icon,
          album: parts[5] || '',
          duration: parts[6] || '',
          description: parts.length > 7 ? parts.slice(7, -3).join('|') : '',
          lyric: parts.length > 8 ? parts[parts.length - 3] : '',
          mood: parts.length > 9 ? parts[parts.length - 2] : '',
          moodIcon: parts.length > 10 ? parts[parts.length - 1] : '🎵',
          tags: parts.length > 1 ? parts[parts.length - 1].split(',').map(t => t.trim()).slice(-3) : [],
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        
        // 保存到云数据库
        saveMusicToCloud(music).catch(() => {})
        return music
      } else if (parts.length >= 4) {
        const music = {
          title: parts[0],
          artist: parts[1],
          year: parts[2],
          genre: genre.name,
          genreIcon: genre.icon,
          album: '',
          duration: '',
          description: '',
          lyric: '',
          mood: '',
          moodIcon: '🎵',
          tags: [],
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveMusicToCloud(music).catch(() => {})
        return music
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成音乐推荐失败:', e)
  }
  
  // 使用备用音乐库
  const fallback = getRandomMusicFromLibrary()
  const result = {
    ...fallback,
    source: '音乐推荐库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveMusicToCloud(result).catch(() => {})
  return result
}

// ─── 每日科技 ─────────────────────────────────────────────────

/**
 * 保存科技知识到云数据库
 */
async function saveTechToCloud(tech) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTechs').add({
      data: {
        title: tech.title,
        category: tech.category,
        categoryIcon: tech.categoryIcon || '🔬',
        summary: tech.summary || '',
        impact: tech.impact || '',
        tags: tech.tags || [],
        source: tech.source || 'AI科技解读',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 科技知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存科技知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从科技库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomTechFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_TECHS.length
  return { ...FALLBACK_TECHS[index] }
}

/**
 * 生成每日科技知识
 */
async function generateTech() {
  const category = TECH_CATEGORIES[Math.floor(Math.random() * TECH_CATEGORIES.length)]
  const topic = category.topics[Math.floor(Math.random() * category.topics.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'ai', 'china']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'ai') {
    prompt = `你是一位AI科技专家，请分享一个当前最热门、最前沿的AI科技动态或知识。

要求：
1. 聚焦AI人工智能领域：ChatGPT、大模型、AI Agent、AI手机、AIGC等
2. 内容要点：
   - 技术概念通俗解释
   - 实际应用案例
   - 对未来的影响
3. 语言生动有趣，引发读者兴趣
4. 长度150-200字

格式：
AI人工智能|科技标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'china') {
    prompt = `你是一位科技评论员，请分享一个中国科技发展的亮点或成就。

要求：
1. 聚焦中国科技：国产芯片、鸿蒙系统、量子计算、新能源、航天成就等
2. 内容要点：
   - 技术亮点介绍
   - 重要意义
   - 未来展望
3. 语言要自豪自信，体现中国科技实力
4. 长度150-200字

格式：
科技领域|科技标题|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位科技科普达人，请用通俗易懂的语言，分享一个实用的科技知识或最新科技动态。

要求：
1. 科技领域：${category.name} - ${topic}
2. 内容要点：
   - 科技概念/动态介绍（让小白也能看懂）
   - 实际应用场景或影响（2-3个具体例子）
   - 发展趋势或意义（简短展望）
3. 语言要生动有趣，避免过于专业化
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|科技标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 30) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const tech = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI科技解读',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTechToCloud(tech).catch(() => {})
        return tech
      } else if (parts.length === 2) {
        const tech = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI科技解读',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTechToCloud(tech).catch(() => {})
        return tech
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成科技知识失败:', e)
  }
  
  // 使用备用科技库
  const fallback = getRandomTechFromLibrary()
  const result = {
    ...fallback,
    source: '科技知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveTechToCloud(result).catch(() => {})
  return result
}

// ─── 每日中医 ─────────────────────────────────────────────────

/**
 * 保存中医知识到云数据库
 */
async function saveTcmToCloud(tcm) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTcms').add({
      data: {
        title: tcm.title,
        category: tcm.category,
        categoryIcon: tcm.categoryIcon || '🌿',
        summary: tcm.summary || '',
        tips: tcm.tips || '',
        tags: tcm.tags || [],
        source: tcm.source || 'AI中医专家',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 中医知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存中医知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从中医库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomTcmFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_TCMS.length
  return { ...FALLBACK_TCMS[index] }
}

/**
 * 生成每日中医养生知识
 */
async function generateTcm() {
  const category = TCM_CATEGORIES[Math.floor(Math.random() * TCM_CATEGORIES.length)]
  const topic = category.topics[Math.floor(Math.random() * category.topics.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'herb', 'therapy']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'herb') {
    prompt = `你是一位中医养生专家，请分享一味中药或药食同源食材的养生知识。

要求：
1. 选择常用中药材：人参、黄芪、当归、枸杞、山药、茯苓、陈皮、三七、西洋参、灵芝、酸枣仁、黄精等
2. 内容要点：
   - 性味归经功效
   - 适用人群
   - 使用方法（包括食疗方）
   - 注意事项
3. 语言通俗，体现中医智慧
4. 长度150-200字

格式：
药食同源|养生标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'therapy') {
    prompt = `你是一位中医理疗专家，请分享一种中医外治法的养生保健知识。

要求：
1. 选择一种特色疗法：艾灸、拔罐、刮痧、推拿、足浴、耳穴压豆、三伏贴等
2. 内容要点：
   - 疗法原理
   - 适应症
   - 操作方法
   - 注意事项
3. 语言通俗易懂，实用性强
4. 长度150-200字

格式：
特色疗法|疗法名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深中医养生专家，请用通俗易懂的语言，分享一个实用的中医药养生知识或日常保健方法。

要求：
1. 中医领域随机选择：时节养生(二十四节气)、药食同源、穴位保健、传统功法(八段锦、五禽戏)、体质调理、食疗药膳、脏腑养护、特色疗法
2. 内容要点：
   - 中医概念/知识介绍（让普通人也能理解中医智慧）
   - 日常应用场景（2-3个具体实用的例子）
   - 养生建议或注意事项（简明实用的方法）
3. 语言要生动有趣，体现中医"治未病"的智慧
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|养生标题|正文内容（包含知识点介绍+实用建议）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 30) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const tcm = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI中医专家',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTcmToCloud(tcm).catch(() => {})
        return tcm
      } else if (parts.length === 2) {
        const tcm = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI中医专家',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTcmToCloud(tcm).catch(() => {})
        return tcm
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成中医养生知识失败:', e)
  }
  
  // 使用备用中医库
  const fallback = getRandomTcmFromLibrary()
  const result = {
    ...fallback,
    source: '中医养生库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveTcmToCloud(result).catch(() => {})
  return result
}

// ─── 每日旅游 ─────────────────────────────────────────────────

/**
 * 保存旅游知识到云数据库
 */
async function saveTravelToCloud(travel) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTravels').add({
      data: {
        title: travel.title,
        region: travel.region,
        regionIcon: travel.regionIcon || '🌍',
        category: travel.category,
        categoryIcon: travel.categoryIcon || '🏛️',
        summary: travel.summary || '',
        tips: travel.tips || '',
        tags: travel.tags || [],
        source: travel.source || 'AI导游',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 旅游知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存旅游知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从旅游库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomTravelFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_TRAVELS.length
  return { ...FALLBACK_TRAVELS[index] }
}

/**
 * 生成每日旅游知识
 */
async function generateTravel() {
  const region = TRAVEL_REGIONS[Math.floor(Math.random() * TRAVEL_REGIONS.length)]
  const country = region.countries[Math.floor(Math.random() * region.countries.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'natural', 'cultural']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'natural') {
    prompt = `你是一位自然风光摄影师，请分享一个世界上最美的自然景观。

要求：
1. 目的地包括：挪威峡湾、新西兰冰川、玻利维亚天空之境、冰岛极光、非洲草原、瑞士雪山、日本富士山、张家界天门山、马尔代夫、大堡礁等
2. 内容要点：
   - 自然景观特色和形成原因
   - 最佳观赏季节和时间
   - 摄影技巧和建议
   - 游览实用建议
3. 语言优美浪漫，体现大自然魅力
4. 长度150-200字

格式：
地区|景点名称|正文内容（特色介绍+游览建议）

直接输出，不要任何前缀：`
  } else if (promptType === 'cultural') {
    prompt = `你是一位文化历史专家，请分享一个世界文化遗产的故事。

要求：
1. 选择世界遗产：长城、故宫、吴哥窟、庞贝古城、马丘比丘、佩特拉古城、新天鹅堡、圣家族大教堂等
2. 内容要点：
   - 历史背景和建造故事
   - 文化价值和艺术特色
   - 保护意义
   - 参观实用提示
3. 语言有文化底蕴，体现历史厚重感
4. 长度150-200字

格式：
地区|遗产名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深旅行达人，请分享一个世界各地著名的旅游景点或名胜古迹。

要求：
1. 目的地随机选择：${country}及周边著名景点
2. 内容要点：
   - 景点名称和位置
   - 历史背景和文化意义
   - 游览亮点和特色体验
   - 实用旅游建议（如最佳季节、门票、注意事项）
3. 语言生动有趣，激发读者的旅行欲望
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
地区名称|景点名称|正文内容（景点介绍+游览建议）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 30) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const travel = {
          region: parts[0] || country,
          regionIcon: region.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导游',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTravelToCloud(travel).catch(() => {})
        return travel
      } else if (parts.length === 2) {
        const travel = {
          region: country,
          regionIcon: region.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导游',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveTravelToCloud(travel).catch(() => {})
        return travel
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成旅游知识失败:', e)
  }
  
  // 使用备用旅游库
  const fallback = getRandomTravelFromLibrary()
  const result = {
    ...fallback,
    source: '世界名胜库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveTravelToCloud(result).catch(() => {})
  return result
}

// ─── 每日一卦 ─────────────────────────────────────────────────

/**
 * 保存占卜知识到云数据库
 */
async function saveFortuneToCloud(fortune) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFortunes').add({
      data: {
        title: fortune.title,
        category: fortune.category,
        categoryIcon: fortune.categoryIcon || '🔮',
        summary: fortune.summary || '',
        tags: fortune.tags || [],
        source: fortune.source || 'AI占卜',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 占卜知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存占卜知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从占卜库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomFortuneFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_FORTUNES.length
  return { ...FALLBACK_FORTUNES[index] }
}

/**
 * 生成每日占卜知识
 */
async function generateFortune() {
  // 随机选择占卜类型
  const fortuneTypes = ['bagua', 'zodiac', 'chinese']
  const fortuneType = fortuneTypes[Math.floor(Math.random() * fortuneTypes.length)]
  
  let prompt, categoryName, categoryIcon, titleField, summaryField
  
  if (fortuneType === 'bagua') {
    categoryName = '易经八卦'
    categoryIcon = '☰'
    const bagua = BAGUA_DATA[Math.floor(Math.random() * BAGUA_DATA.length)]
    titleField = 'name'
    summaryField = 'description'
    
    prompt = `你是一位资深易学大师，请解读易经${bagua.name}（${bagua.symbol}）的智慧。

要求：
1. 内容要点：
   - 卦象的基本含义（卦名、卦象、象征事物）
   - 核心哲理或启示
   - 现代生活中的应用指导
2. 语言神秘而富有哲理，体现易经智慧
3. 长度控制在150-200字
4. 要有深度和启发性

格式要求：
用|分隔各部分，结构如下：
卦象解读|${bagua.name}|正文内容（象征意义+智慧解读+实用建议）

直接输出，不要任何前缀：`
  } else if (fortuneType === 'zodiac') {
    const zodiac = ZODIAC_DATA[Math.floor(Math.random() * ZODIAC_DATA.length)]
    categoryName = '星座解读'
    categoryIcon = zodiac.symbol
    titleField = 'name'
    summaryField = 'description'
    
    prompt = `你是一位星座研究专家，请解读${zodiac.name}（${zodiac.date}）的性格特点。

要求：
1. 内容要点：
   - 星座的基本特征（日期范围、守护星、元素属性）
   - 性格优点和特点
   - 与人相处之道或生活建议
2. 语言生动有趣，贴近年轻人
3. 长度控制在150-200字
4. 要有实用性和趣味性

格式要求：
用|分隔各部分，结构如下：
星座解读|${zodiac.name}|正文内容（基本特征+性格解读+相处建议）

直接输出，不要任何前缀：`
  } else {
    const chinese = CHINESE_ZODIAC_DATA[Math.floor(Math.random() * CHINESE_ZODIAC_DATA.length)]
    categoryName = '生肖解读'
    categoryIcon = '🐾'
    titleField = 'name'
    summaryField = 'description'
    
    prompt = `你是一位民俗文化专家，请分享${chinese.name}年的文化寓意。

要求：
1. 内容要点：
   - 生肖的文化象征意义
   - 性格特点或命运特征
   - 与其他生肖的关系或相处之道
2. 语言通俗易懂，体现传统文化
3. 长度控制在150-200字
4. 要有文化内涵和趣味性

格式要求：
用|分隔各部分，结构如下：
生肖解读|${chinese.name}年|正文内容（文化象征+性格特点+相处智慧）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const fortune = {
          category: parts[0] || categoryName,
          categoryIcon: categoryIcon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI占卜',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFortuneToCloud(fortune).catch(() => {})
        return fortune
      } else if (parts.length === 2) {
        const fortune = {
          category: categoryName,
          categoryIcon: categoryIcon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI占卜',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFortuneToCloud(fortune).catch(() => {})
        return fortune
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成占卜知识失败:', e)
  }
  
  // 使用备用占卜库
  const fallback = getRandomFortuneFromLibrary()
  const result = {
    ...fallback,
    category: categoryName,
    categoryIcon: categoryIcon,
    source: '占卜知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveFortuneToCloud(result).catch(() => {})
  return result
}

// ─── 每日文学 ─────────────────────────────────────────────────

/**
 * 保存文学知识到云数据库
 */
async function saveLiteratureToCloud(literature) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLiteratures').add({
      data: {
        title: literature.title,
        author: literature.author,
        era: literature.era,
        region: literature.region,
        works: literature.works || [],
        summary: literature.summary || '',
        quote: literature.quote || '',
        tags: literature.tags || [],
        source: literature.source || 'AI推荐',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 文学知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存文学知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从文学库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomLiteratureFromLibrary() {
  // 每次都随机选择，充分利用50位作家的多样性
  const index = Math.floor(Math.random() * FALLBACK_AUTHORS.length)
  return { ...FALLBACK_AUTHORS[index] }
}

/**
 * 生成每日文学知识
 */
async function generateLiterature() {
  // 随机选择提示词类型
  const promptTypes = ['default', 'chinese', 'foreign']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'chinese') {
    prompt = `你是一位中国文学研究专家，请介绍一位中国文学大师及其代表作。

要求：
1. 选择一位中国经典作家：鲁迅、钱钟书、沈从文、张爱玲、莫言、余华、路遥、王小波、林语堂、老舍、巴金、曹雪芹、施耐庵、罗贯中、吴承恩等
2. 内容要点：
   - 作家生平与文学地位（生卒年、笔名、主要成就）
   - 代表作品的文学价值（2-3部作品简介）
   - 经典名言或名句赏析
   - 阅读推荐理由
3. 语言有文化底蕴，体现中国文学之美
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
作家姓名|时代/年代|代表作1,代表作2,代表作3|正文内容（简介+作品特色+名言赏析）|经典名言|标签1,标签2,标签3

直接输出，不要任何前缀：`
  } else if (promptType === 'foreign') {
    prompt = `你是一位世界文学研究专家，请介绍一位外国文学大师及其代表作。

要求：
1. 选择一位世界著名作家：莎士比亚、托尔斯泰、雨果、海明威、马尔克斯、卡夫卡、简·奥斯汀、狄更斯、加缪、太宰治、川端康成、村上春树等
2. 内容要点：
   - 作家生平与文学成就（国籍、生卒年、文学地位）
   - 代表作品介绍（2-3部作品背景和特色）
   - 在世界文学中的地位
   - 阅读推荐理由
3. 语言优美开阔，体现世界文学魅力
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
作家姓名|国籍/时代|代表作1,代表作2,代表作3|正文内容（简介+作品特色+地位）|经典名言|标签1,标签2,标签3

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深文学评论家，请介绍一位著名作家及其代表作品。

要求：
1. 随机选择一位作家：
   - 中国作家：鲁迅、钱钟书、沈从文、张爱玲、莫言、余华、路遥、王小波、林语堂、老舍、巴金、曹雪芹等
   - 外国作家：莎士比亚、托尔斯泰、雨果、海明威、马尔克斯、卡夫卡、简·奥斯汀、狄更斯、加缪等
2. 内容要点：
   - 作家简介（生卒年、国籍、文学地位）
   - 代表作品介绍（2-3部作品的背景和特色）
   - 一句经典名言
   - 阅读建议
3. 语言优美有文采，体现文学魅力
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
作家姓名|时代/国籍|代表作1,代表作2,代表作3|正文内容（简介+作品特色+名言）|经典名言|标签1,标签2,标签3

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 5) {
        const literature = {
          author: parts[0].trim(),
          era: parts[1].trim(),
          works: parts[2].split(/[,，、]/).map(w => w.trim()).filter(w => w),
          summary: parts.slice(3, -1).join('|').trim(),
          quote: parts[parts.length - 1].trim(),
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveLiteratureToCloud(literature).catch(() => {})
        return literature
      } else if (parts.length >= 4) {
        const literature = {
          author: parts[0].trim(),
          era: parts[1].trim(),
          works: parts[2].split(/[,，、]/).map(w => w.trim()).filter(w => w),
          summary: parts.slice(3).join('|').trim(),
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveLiteratureToCloud(literature).catch(() => {})
        return literature
      } else if (parts.length === 3) {
        const literature = {
          author: parts[0].trim(),
          era: '',
          works: parts[1].split(/[,，、]/).map(w => w.trim()).filter(w => w),
          summary: parts[2].trim(),
          source: 'AI推荐',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveLiteratureToCloud(literature).catch(() => {})
        return literature
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成文学知识失败:', e)
  }
  
  // 使用备用文学库
  const fallback = getRandomLiteratureFromLibrary()
  const result = {
    author: fallback.name,
    era: fallback.era,
    region: fallback.region,
    works: fallback.works,
    summary: fallback.description,
    quote: fallback.quote,
    source: '文学库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveLiteratureToCloud(result).catch(() => {})
  return result
}

// ─── 外贸助手 ─────────────────────────────────────────────────

/**
 * 保存外贸知识到云数据库
 */
async function saveForeignTradeToCloud(foreignTrade) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyForeignTrades').add({
      data: {
        title: foreignTrade.title,
        category: foreignTrade.category,
        categoryIcon: foreignTrade.categoryIcon || '💼',
        summary: foreignTrade.summary || '',
        tips: foreignTrade.tips || '',
        tags: foreignTrade.tags || [],
        source: foreignTrade.source || 'AI分享',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 外贸知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存外贸知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从外贸知识库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomForeignTradeFromLibrary() {
  // 每次都随机选择，充分利用40条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_FOREIGN_TRADES.length)
  return { ...FALLBACK_FOREIGN_TRADES[index] }
}

/**
 * 生成每日外贸知识
 */
async function generateForeignTrade() {
  // 随机选择知识类型
  const category = FOREIGN_TRADE_CATEGORIES[Math.floor(Math.random() * FOREIGN_TRADE_CATEGORIES.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'term', 'payment', 'logistics']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'term') {
    prompt = `你是一位外贸培训讲师，请解释一个外贸专业术语的含义和应用。

要求：
1. 选择一个外贸常用术语：FOB离岸价、CIF到岸价、EXW工厂交货、CFR成本加运费、CPT运费付至、CIP运费保险费付至、DAP完税后交货、DDP完税后交货、L/C信用证、T/T电汇、D/P付款交单、D/A承兑交单、MOQ最小起订量、HS Code海关编码、提单B/L、原产地证CO等
2. 内容要点：
   - 术语的全称、中文含义和英文缩写
   - 买卖双方的责任划分（谁负责运输、保险、报关）
   - 适用场景和举例
   - 使用注意事项
3. 语言简洁专业，便于理解记忆
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
术语解读|术语名称|正文内容（含义+责任划分+应用场景+注意事项）

直接输出，不要任何前缀：`
  } else if (promptType === 'payment') {
    prompt = `你是一位外贸财务专家，请分享一种外贸付款方式的使用技巧和风险防范。

要求：
1. 选择一种付款方式：L/C信用证、T/T电汇、D/P付款交单、D/A承兑交单、DPs等
2. 内容要点：
   - 付款方式的操作流程和基本概念
   - 优点和缺点分析
   - 风险点和防范措施
   - 适合什么样的客户或订单
3. 语言专业严谨，有实操指导价值
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
付款方式|方式名称|正文内容（流程+优缺点+风险防范+适用场景）

直接输出，不要任何前缀：`
  } else if (promptType === 'logistics') {
    prompt = `你是一位国际物流专家，请分享一个货运物流的知识或技巧。

要求：
1. 选择一个物流主题：集装箱规格（20GP/40GP/40HQ）、海运整箱与拼箱选择、空运流程与时效、目的港清关流程、货运保险投保技巧、出口包装与唛头要求等
2. 内容要点：
   - 物流环节的核心知识点
   - 实际操作要点和常见问题
   - 成本优化或风险防范建议
3. 语言实用易懂，贴近业务需求
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
物流货运|主题名称|正文内容（知识点+实操要点+建议）

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深外贸专家，请分享一个实用的外贸业务知识或技巧。

要求：
1. 外贸知识随机选择以下主题之一：
   - 贸易术语应用（FOB、CIF、EXW等）
   - 付款方式选择（L/C、T/T、D/P等）
   - 货运物流知识（海运、空运、集装箱）
   - 报关报检流程（HS编码、原产地证、出口退税）
   - 客户开发技巧（开发信、展会、社交媒体）
   - 合同条款与风险防范
   - 外贸流程与跟单要点
2. 内容要点：
   - 概念或知识点的专业解释
   - 实际应用场景或案例（2-3个实用例子）
   - 操作建议或注意事项
3. 语言要专业实用，符合外贸行业风格
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|知识标题|正文内容（知识点介绍+实用建议+注意事项）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const foreignTrade = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveForeignTradeToCloud(foreignTrade).catch(() => {})
        return foreignTrade
      } else if (parts.length === 2) {
        const foreignTrade = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveForeignTradeToCloud(foreignTrade).catch(() => {})
        return foreignTrade
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成外贸知识失败:', e)
  }
  
  // 使用备用外贸知识库
  const fallback = getRandomForeignTradeFromLibrary()
  const result = {
    ...fallback,
    source: '外贸知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveForeignTradeToCloud(result).catch(() => {})
  return result
}

// ─── 电商运营助手 ─────────────────────────────────────────────────

/**
 * 保存电商知识到云数据库
 */
async function saveECommerceToCloud(ecommerce) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyECommerces').add({
      data: {
        title: ecommerce.title,
        category: ecommerce.category,
        categoryIcon: ecommerce.categoryIcon || '🛒',
        summary: ecommerce.summary || '',
        tips: ecommerce.tips || '',
        tags: ecommerce.tags || [],
        source: ecommerce.source || 'AI分享',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 电商知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存电商知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从电商知识库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomECommerceFromLibrary() {
  // 每次都随机选择，充分利用40条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_ECOMMERCE.length)
  return { ...FALLBACK_ECOMMERCE[index] }
}

/**
 * 生成每日电商运营知识
 */
async function generateECommerce() {
  // 随机选择知识类型
  const category = ECOMMERCE_CATEGORIES[Math.floor(Math.random() * ECOMMERCE_CATEGORIES.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'selection', 'promotion', 'data']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'selection') {
    prompt = `你是一位电商选品专家，请分享一个电商选品的策略或技巧。

要求：
1. 选择一个选品主题：蓝海市场挖掘、竞品分析方法、利润空间核算、产品差异化策略、供应链选品思路等
2. 内容要点：
   - 选品方法或策略的核心要点
   - 实际操作步骤或工具推荐
   - 常见误区或注意事项
3. 语言专业实用，便于落地执行
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
选品策略|策略名称|正文内容（核心要点+实操步骤+注意事项）

直接输出，不要任何前缀：`
  } else if (promptType === 'promotion') {
    prompt = `你是一位电商营销专家，请分享一个营销推广的技巧或方法。

要求：
1. 选择一个营销主题：直播带货技巧、短视频种草策略、私域流量运营、爆款打造方法、活动策划要点等
2. 内容要点：
   - 营销方法的核心原理
   - 实操步骤和关键点
   - 效果提升建议
3. 语言生动有趣，有实操价值
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
营销推广|方法名称|正文内容（核心原理+实操步骤+提升建议）

直接输出，不要任何前缀：`
  } else if (promptType === 'data') {
    prompt = `你是一位电商数据分析师，请分享一个数据分析的技巧或思路。

要求：
1. 选择一个数据分析主题：流量来源分析、转化漏斗优化、ROI提升策略、用户画像构建、竞品数据监控等
2. 内容要点：
   - 分析维度和指标解读
   - 数据背后的业务含义
   - 优化建议和行动方案
3. 语言逻辑清晰，有数据思维
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
数据分析|分析主题|正文内容（指标解读+业务含义+优化建议）

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深电商运营专家，请分享一个实用的电商运营知识或技巧。

要求：
1. 电商知识随机选择以下主题之一：
   - 选品策略（市场调研、竞品分析、利润核算）
   - 运营技巧（标题优化、主图设计、详情页优化）
   - 营销推广（直播带货、短视频种草、私域运营）
   - 数据分析（流量分析、转化分析、ROI优化）
   - 客户服务（售前咨询、售后处理、评价管理）
   - 供应链管理（仓储物流、库存管理、供应商维护）
   - 平台规则（违规类型、合规运营、风险防范）
   - 用户运营（会员体系、复购策略、流失召回）
2. 内容要点：
   - 知识点或技巧的专业讲解
   - 实际应用场景或案例（2-3个实用例子）
   - 操作建议或注意事项
3. 语言要专业实用，符合电商行业风格
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|知识标题|正文内容（知识点介绍+实用建议+注意事项）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const ecommerce = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveECommerceToCloud(ecommerce).catch(() => {})
        return ecommerce
      } else if (parts.length === 2) {
        const ecommerce = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveECommerceToCloud(ecommerce).catch(() => {})
        return ecommerce
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成电商知识失败:', e)
  }
  
  // 使用备用电商知识库
  const fallback = getRandomECommerceFromLibrary()
  const result = {
    ...fallback,
    source: '电商知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveECommerceToCloud(result).catch(() => {})
  return result
}

// ─── 中学数学助手 ─────────────────────────────────────────────────

/**
 * 保存数学知识到云数据库
 */
async function saveMathToCloud(math) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMaths').add({
      data: {
        title: math.title,
        category: math.category,
        categoryIcon: math.categoryIcon || '📐',
        summary: math.summary || '',
        tips: math.tips || '',
        tags: math.tags || [],
        source: math.source || 'AI分享',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 数学知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存数学知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从数学知识库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomMathFromLibrary() {
  // 每次都随机选择，充分利用40条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_MATH.length)
  return { ...FALLBACK_MATH[index] }
}

/**
 * 生成每日数学知识
 */
async function generateMath() {
  // 随机选择知识类型
  const category = MATH_CATEGORIES[Math.floor(Math.random() * MATH_CATEGORIES.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'algebra', 'geometry', 'function']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'algebra') {
    prompt = `你是一位数学竞赛教练，请分享一个代数方面的核心知识点或解题技巧。

要求：
1. 选择一个代数主题：一元二次方程、韦达定理、分式方程、二次根式、因式分解技巧、二次函数最值等
2. 内容要点：
   - 核心概念和公式要准确
   - 典型例题或应用场景
   - 易错点和注意事项
3. 语言清晰严谨，适合有一定基础的学生
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
代数基础|知识名称|正文内容（概念+例题+注意事项）

直接输出，不要任何前缀：`
  } else if (promptType === 'geometry') {
    prompt = `你是一位几何教学专家，请分享一个几何证明的核心方法或定理应用。

要求：
1. 选择一个几何主题：全等三角形判定、相似三角形应用、圆幂定理、垂径定理、勾股定理、弧长扇形面积等
2. 内容要点：
   - 定理或方法的准确表述
   - 应用条件和典型场景
   - 证明思路或解题技巧
3. 语言逻辑清晰，有证明过程
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
几何证明|定理名称|正文内容（定理表述+应用+技巧）

直接输出，不要任何前缀：`
  } else if (promptType === 'function') {
    prompt = `你是一位高中数学教师，请分享一个函数与图像的核心知识点。

要求：
1. 选择一个函数主题：一次函数、反比例函数、二次函数图像性质、指数函数、对数函数、三角函数诱导公式等
2. 内容要点：
   - 函数的基本性质（定义域、值域、单调性、奇偶性）
   - 图像特征和应用
   - 典型问题解法
3. 语言结合图像直观讲解
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
函数图像|函数名称|正文内容（性质+图像+典型问题）

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深数学教师，请分享一个中学数学的核心知识点、重难点或学习技巧。

要求：
1. 知识点随机选择：
   - 代数：方程、不等式、函数、指数、对数
   - 几何：三角形、四边形、圆、相似、全等
   - 三角函数：诱导公式、解三角形
   - 数列：等差数列、等比数列
   - 概率统计：概率、统计量
   - 导数（高中）：求导法则、极值、最值
2. 内容要点：
   - 知识点的核心概念和公式
   - 重难点分析和常见错误
   - 学习技巧或解题方法
3. 语言要清晰易懂，适合中学生学习
4. 长度控制在150-200字
5. 内容要实用、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容（概念讲解+重难点+学习方法）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const math = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveMathToCloud(math).catch(() => {})
        return math
      } else if (parts.length === 2) {
        const math = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveMathToCloud(math).catch(() => {})
        return math
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成数学知识失败:', e)
  }
  
  // 使用备用数学知识库
  const fallback = getRandomMathFromLibrary()
  const result = {
    ...fallback,
    source: '数学知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveMathToCloud(result).catch(() => {})
  return result
}

// ─── 中学英语助手 ─────────────────────────────────────────────────

/**
 * 保存英语知识到云数据库
 */
async function saveEnglishToCloud(english) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyEnglishes').add({
      data: {
        title: english.title,
        category: english.category,
        categoryIcon: english.categoryIcon || '📚',
        summary: english.summary || '',
        tips: english.tips || '',
        tags: english.tags || [],
        source: english.source || 'AI分享',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 英语知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存英语知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从英语知识库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomEnglishFromLibrary() {
  // 每次都随机选择，充分利用40条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_ENGLISH.length)
  return { ...FALLBACK_ENGLISH[index] }
}

/**
 * 生成每日英语知识
 */
async function generateEnglish() {
  // 随机选择知识类型
  const category = ENGLISH_CATEGORIES[Math.floor(Math.random() * ENGLISH_CATEGORIES.length)]
  
  // 随机选择提示词类型
  const promptTypes = ['default', 'grammar', 'vocabulary', 'reading', 'writing', 'listening']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]
  
  let prompt
  if (promptType === 'grammar') {
    prompt = `你是一位英语语法专家，请分享一个语法知识点或辨析。

要求：
1. 选择一个语法主题：时态语态、非谓语动词、定语从句、名词性从句、状语从句、虚拟语气、情态动词、介词搭配、冠词用法等
2. 内容要点：
   - 核心规则或用法讲解
   - 易错点和辨析
   - 记忆口诀或联想方法
3. 语言清晰准确，适合中学生理解
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
语法基础|语法名称|正文内容（规则讲解+易错辨析+记忆方法）

直接输出，不要任何前缀：`
  } else if (promptType === 'vocabulary') {
    prompt = `你是一位英语词汇教学专家，请分享一个词汇学习方法或近义词辨析。

要求：
1. 选择一个词汇主题：词根词缀记忆、词义辨析、短语动词、固定搭配、同义词反义词等
2. 内容要点：
   - 记忆方法或辨析要点
   - 典型例句或对比
   - 使用注意事项
3. 语言生动有趣，便于记忆
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
词汇记忆|主题名称|正文内容（记忆方法+例句对比+注意事项）

直接输出，不要任何前缀：`
  } else if (promptType === 'reading') {
    prompt = `你是一位英语阅读教学专家，请分享一个阅读理解的解题技巧。

要求：
1. 选择一个阅读主题：猜词义技巧、长难句分析、主旨大意题、细节题、推理判断题、任务型阅读等
2. 内容要点：
   - 解题方法的步骤讲解
   - 具体例子演示
   - 常见陷阱和应对策略
3. 语言逻辑清晰，有实操性
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
阅读技巧|技巧名称|正文内容（步骤讲解+例子演示+应对策略）

直接输出，不要任何前缀：`
  } else if (promptType === 'writing') {
    prompt = `你是一位英语写作教学专家，请分享一个写作提升技巧或模板。

要求：
1. 选择一个写作主题：开头结尾模板、连接词使用、句型升级、高级词汇替换、图表作文、看图写话等
2. 内容要点：
   - 技巧或模板的核心要点
   - 示例展示
   - 使用建议和注意事项
3. 语言实用易懂，便于模仿
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
写作技巧|技巧名称|正文内容（核心要点+示例展示+使用建议）

直接输出，不要任何前缀：`
  } else if (promptType === 'listening') {
    prompt = `你是一位英语听力教学专家，请分享一个听力提升技巧或场景词汇。

要求：
1. 选择一个听力主题：数字听力、场景词汇、听力预测、听写技巧、英美发音差异等
2. 内容要点：
   - 技巧或词汇的要点讲解
   - 常见陷阱和应对方法
   - 练习建议
3. 语言简洁实用，有针对性
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
听力训练|主题名称|正文内容（要点讲解+应对方法+练习建议）

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深英语教师，请分享一个中学英语的核心知识点、学习技巧或应试方法。

要求：
1. 知识类型随机选择：
   - 语法：时态、从句、非谓语、虚拟语气、情态动词
   - 词汇：词根词缀、词义辨析、短语搭配
   - 阅读：猜词技巧、长难句分析、题型解法
   - 写作：句型升级、连接词、开头结尾模板
   - 听说：发音技巧、听力场景词汇、口语表达
   - 应试：各题型解题技巧、易错点分析
2. 内容要点：
   - 核心知识点或方法的专业讲解
   - 实用技巧或练习建议（2-3个具体例子）
   - 常见错误或注意事项
3. 语言要清晰易懂，适合中学生学习
4. 长度控制在150-200字
5. 内容要实用、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容（知识点讲解+实用技巧+注意事项）

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      
      if (parts.length >= 3) {
        const english = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveEnglishToCloud(english).catch(() => {})
        return english
      } else if (parts.length === 2) {
        const english = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveEnglishToCloud(english).catch(() => {})
        return english
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成英语知识失败:', e)
  }
  
  // 使用备用英语知识库
  const fallback = getRandomEnglishFromLibrary()
  const result = {
    ...fallback,
    source: '英语知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveEnglishToCloud(result).catch(() => {})
  return result
}

// ─── 导出 ─────────────────────────────────────────────────

module.exports = {
  DailyContent: {
    generateQuote,
    generateJoke,
    generatePsychology,
    generateFinance,
    generateLove,
    generateMovie,
    generateMusic,
    generateTech,
    generateTcm,
    generateTravel,
    generateFortune,
    generateLiterature,
    generateForeignTrade,
    generateECommerce,
    generateMath,
    generateEnglish,
  },
  // 重新导出数据，方便外部访问
  PSYCHOLOGY_FIELDS,
  JOKE_SCENES,
  FINANCE_FIELDS,
  FAMOUS_QUOTES,
  LOVE_FIELDS,
  MOVIE_GENRES,
  FALLBACK_MOVIES,
  MUSIC_GENRES,
  FALLBACK_MUSICS,
  TECH_CATEGORIES,
  FALLBACK_TECHS,
  TCM_CATEGORIES,
  FALLBACK_TCMS,
  TRAVEL_REGIONS,
  TRAVEL_TYPES,
  FALLBACK_TRAVELS,
  FORTUNE_TYPES,
  BAGUA_DATA,
  ZODIAC_DATA,
  CHINESE_ZODIAC_DATA,
  FALLBACK_FORTUNES,
  AUTHORS_DATA,
  FALLBACK_AUTHORS,
  FOREIGN_TRADE_CATEGORIES,
  FALLBACK_FOREIGN_TRADES,
  ECOMMERCE_CATEGORIES,
  FALLBACK_ECOMMERCE,
  MATH_CATEGORIES,
  FALLBACK_MATH,
  ENGLISH_CATEGORIES,
  FALLBACK_ENGLISH,
}
