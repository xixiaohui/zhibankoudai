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
const { DAILY_PROMPTS } = require('./dailyPrompts.js')
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
const { FALLBACK_FORTUNES, BAGUA_DATA, ZODIAC_DATA, FORTUNE_TYPES } = require('./fortuneData.js')
const { FALLBACK_AUTHORS, AUTHORS_DATA } = require('./literatureData.js')
const { FALLBACK_FOREIGN_TRADES, FOREIGN_TRADE_CATEGORIES } = require('./foreignTradeData.js')
const { FALLBACK_ECOMMERCE, ECOMMERCE_CATEGORIES } = require('./eCommerceData.js')
const { FALLBACK_MATH, MATH_CATEGORIES } = require('./mathData.js')
const { FALLBACK_ENGLISH, ENGLISH_CATEGORIES } = require('./englishData.js')
const { FALLBACK_PROGRAMMING, PROGRAMMING_CATEGORIES } = require('./programmingData.js')
const { PHOTOGRAPHY_FIELDS, FALLBACK_PHOTOGRAPHY } = require('./photographyData.js')
const { BEAUTY_FIELDS, FALLBACK_BEAUTY } = require('./beautyData.js')
const { INVESTMENT_FIELDS, FALLBACK_INVESTMENT } = require('./investmentData.js')
const { FISHING_FIELDS, FALLBACK_FISHING } = require('./fishingData.js')
const { FITNESS_FIELDS, FALLBACK_FITNESS } = require('./fitnessData.js')
const { PET_FIELDS, FALLBACK_PET } = require('./petData.js')
const { FASHION_FIELDS, FALLBACK_FASHION } = require('./fashionData.js')
const { OUTFIT_FIELDS, FALLBACK_OUTFIT } = require('./outfitData.js')
const { DECORATION_FIELDS, FALLBACK_DECORATION } = require('./decorationData.js')
const { FIBER_FIELDS, FALLBACK_FIBER } = require('./glassFiberData.js')
const { RESIN_FIELDS, FALLBACK_RESIN } = require('./resinData.js')
const { TAX_FIELDS, FALLBACK_TAX } = require('./taxData.js')
const { LAW_FIELDS, FALLBACK_LAW } = require('./lawData.js')
const { OFFICIAL_FIELDS, FALLBACK_OFFICIAL } = require('./officialData.js')
const { HANDLING_FIELDS, FALLBACK_HANDLING } = require('./handlingData.js')
const { FLORAL_FIELDS, FALLBACK_FLORAL } = require('./floralData.js')
const { HISTORY_FIELDS, FALLBACK_HISTORY } = require('./historyData.js')
const { MILITARY_FIELDS, FALLBACK_MILITARY } = require('./militaryData.js')
const { FALLBACK_STOCKS, STOCK_CATEGORIES } = require('./stockData.js')
const { FALLBACK_ECONOMICS, ECONOMICS_CATEGORIES } = require('./economicsData.js')
const { FALLBACK_BUSINESS, BUSINESS_CATEGORIES } = require('./businessData.js')
const { FALLBACK_NEWS, NEWS_CATEGORIES } = require('./newsData.js')

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

// ─── 云数据库去重检查函数 ─────────────────────────────────────────────────

/**
 * 检查内容是否已存在于云数据库
 * @param {string} collectionName - 集合名称
 * @param {string} checkField - 检查字段名
 * @param {string} checkValue - 检查字段值
 * @returns {Promise<boolean>} - 存在返回 true，不存在返回 false
 */
async function checkContentExists(collectionName, checkField, checkValue) {
  if (!checkValue) return false
  
  try {
    const db = wx.cloud.database()
    const res = await db.collection(collectionName)
      .where({
        [checkField]: checkValue
      })
      .limit(1)
      .get()
    
    return res.data && res.data.length > 0
  } catch (e) {
    console.error(`[DailyContent] 检查${collectionName}内容是否存在失败:`, e.message)
    return false  // 检查失败时默认不阻止保存
  }
}

// ─── 云数据库保存函数 ─────────────────────────────────────────────────

/**
 * 保存名言到云数据库
 */
async function saveQuoteToCloud(quote) {
  // 去重检查：以内容作为唯一标识
  const isExists = await checkContentExists('dailyQuotes', 'content', quote.content)
  if (isExists) {
    console.log('[DailyContent] 名言已存在，跳过保存:', quote.content.substring(0, 20) + '...')
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyQuotes').add({
      data: {
        content: quote.content,  // 名言内容
        title: quote.title,  // 作者
        subtitle: quote.subtitle,  // 出处
        categoryIcon: quote.categoryIcon || '📜',
        category: quote.category || '名言',
        era: quote.era,
        region: quote.region,
        type: quote.type,
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyJokes', 'title', joke.title)
  if (isExists) {
    console.log('[DailyContent] 段子已存在，跳过保存:', joke.title.substring(0, 20))
    return false
  }
  
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyPsychology', 'title', psychology.title)
  if (isExists) {
    console.log('[DailyContent] 心理学知识已存在，跳过保存:', psychology.title.substring(0, 20))
    return false
  }
  
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFinance', 'title', finance.title)
  if (isExists) {
    console.log('[DailyContent] 金融知识已存在，跳过保存:', finance.title.substring(0, 20))
    return false
  }
  
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
 * 返回统一格式: { content, title, subtitle, categoryIcon, category }
 */
async function generateQuote() {
  // 尝试AI生成
  const isPoetry = Math.random() > 0.5
  
  let messages, prompt
  
  if (isPoetry) {
    const topics = ['春天', '夏天', '秋天', '冬天', '山水', '思乡', '友情', '人生', '离别', '思念']
    const topic = topics[Math.floor(Math.random() * topics.length)]
    
    prompt = DAILY_PROMPTS.quote.poetry.prompt.replace('诗词主题', topic)
  } else {
    const categories = ['人生哲理', '励志名言', '情感感悟', '生活智慧', '读书感悟', '处世哲学']
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    prompt = DAILY_PROMPTS.quote.sayings.prompt.replace('名言主题', category)
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
            content: parts[0],  // 名言内容
            title: parts[1],  // 作者
            subtitle: parts[3] ? '《' + parts[3] + '》' : parts[2] + '诗词',  // 出处/诗题
            categoryIcon: '📜',
            category: parts[2] + '诗词',
            type: 'poetry'
          }
        } else {
          // 现代名言格式：名言|作者|出处
          quote = {
            content: parts[0],
            title: parts[1],  // 作者
            subtitle: parts[2] || '名言警句',  // 出处
            categoryIcon: '💡',
            category: '名言',
            type: 'quote'
          }
        }
      } else if (parts.length >= 2) {
        quote = {
          content: parts[0],
          title: parts[1],  // 作者
          subtitle: isPoetry ? '古诗词' : '名言警句',  // 出处
          categoryIcon: isPoetry ? '📜' : '💡',
          category: isPoetry ? '诗词' : '名言',
          type: isPoetry ? 'poetry' : 'quote'
        }
      } else {
        // 无法解析，直接使用AI返回内容
        quote = {
          content: result.trim(),
          title: 'AI创作',
          subtitle: isPoetry ? '古诗词' : '名言警句',
          categoryIcon: isPoetry ? '📜' : '💡',
          category: isPoetry ? '诗词' : '名言',
          type: isPoetry ? 'poetry' : 'quote'
        }
      }
      
      quote.date = new Date().toISOString().split('T')[0]
      quote.isAIGenerated = true
      
      // 保存到云数据库
      saveQuoteToCloud(quote).catch(() => {})
      
      console.log('[DailyContent] AI生成名言:', quote.content.substring(0, 20) + '...')
      return quote
    }
  } catch (e) {
    console.error('[DailyContent] AI生成名言失败:', e.message)
  }
  
  // AI失败，使用名言库兜底（字段已统一：content, title, subtitle, categoryIcon, category）
  const fallback = getRandomQuoteFromLibrary()
  // 转换为统一格式
  const quote = {
    content: fallback.content || '',
    title: fallback.title || '佚名',
    subtitle: fallback.subtitle || fallback.category || '名言',
    categoryIcon: fallback.categoryIcon || '📜',
    category: fallback.category || '名言',
    era: fallback.era,
    region: fallback.region,
    type: fallback.type || (fallback.era === 'ancient' ? 'poetry' : (fallback.era === 'modern' ? 'quote' : 'quote')),
    date: new Date().toISOString().split('T')[0],
    isAIGenerated: false
  }
  
  // 保存到云数据库
  saveQuoteToCloud(quote).catch(() => {})
  
  console.log('[DailyContent] 名言库兜底:', quote.content.substring(0, 20) + '...')
  return quote
}

/**
 * 生成每日段子
 */
async function generateJoke() {
  const scene = JOKE_SCENES[Math.floor(Math.random() * JOKE_SCENES.length)]
  const topic = scene.topics[Math.floor(Math.random() * scene.topics.length)]
  
  const prompt = DAILY_PROMPTS.joke.default.prompt.replace('场景主题', `${scene.name} - ${topic}`)

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
  
  const prompt = DAILY_PROMPTS.psychology.default.prompt.replace('知识主题', `${field.name} - ${topic}`)

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
  
  const prompt = DAILY_PROMPTS.finance.default.prompt.replace('知识主题', `${field.name} - ${topic}`)

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
  // 去重检查：以内容作为唯一标识
  const isExists = await checkContentExists('dailyLoves', 'content', love.content)
  if (isExists) {
    console.log('[DailyContent] 情话已存在，跳过保存:', love.content.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLoves').add({
      data: {
        ...love,
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 情话已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存情话到云数据库失败:', e)
    return false
  }
}

/**
 * 生成每日情话
 * 返回统一格式: { content, title, subtitle, categoryIcon, category }
 */
async function generateLove() {
  const category = LOVE_FIELDS[Math.floor(Math.random() * LOVE_FIELDS.length)]
  
  // 分类图标映射
  const categoryIcons = {
    classic: '🌸',
    modern: '💕',
    celebrity: '⭐',
    poetry: '📜'
  }
  const categoryIcon = categoryIcons[category.id] || '💕'
  
  // 使用 dailyPrompts 中的情话提示词
  const promptKey = category.id || 'modern'
  const promptTemplate = DAILY_PROMPTS.love[promptKey]?.prompt || DAILY_PROMPTS.love.modern.prompt
  const prompt = promptTemplate.replace('情感主题', category.name || '情感表达')

  const messages = [{ role: 'user', content: prompt }]
  
  try {
    const result = await callAI(messages, { temperature: 0.9, maxTokens: 300 })
    
    if (result && result.length > 5) {
      let love = {
        category: category.id,
        categoryIcon: categoryIcon,
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
      
      // 诗词格式需要解析
      if (category.id === 'poetry') {
        const parts = result.split('|').map(p => p.trim())
        love.content = parts[0] || result  // 情话内容
        love.title = parts[1] || '诗词精选'  // 出处位置
        love.subtitle = parts[2] || '佚名'  // 作者位置
      } else {
        // 非诗词格式情话，使用AI生成的作者或"AI创作"
        love.content = result  // 情话内容
        love.title = category.name  // 显示分类名
        love.subtitle = 'AI创作'  // AI创作的情话无真实作者
      }
      
      // 保存到云数据库
      saveLoveToCloud(love).catch(() => {})
      return love
    }
  } catch (e) {
    console.error('[DailyContent] 生成情话失败:', e)
  }
  
  // 使用备用 - 转换为统一格式
  const fallback = FALLBACK_LOVE[Math.floor(Math.random() * FALLBACK_LOVE.length)]
  const love = {
    content: fallback.content,  // 情话内容
    title: fallback.source || category.name,  // 出处位置
    subtitle: fallback.author || '佚名',  // 作者位置
    category: fallback.category,
    categoryIcon: categoryIcon,
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  
  // 保存到云数据库
  saveLoveToCloud(love).catch(() => {})
  return love
}

// ─── 每日电影 ─────────────────────────────────────────────────

/**
 * 保存电影到云数据库
 */
async function saveMovieToCloud(movie) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyMovies', 'title', movie.title)
  if (isExists) {
    console.log('[DailyContent] 电影已存在，跳过保存:', movie.title)
    return false
  }
  
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
    prompt = DAILY_PROMPTS.movie.classic.prompt
  } else if (promptType === 'recent') {
    prompt = DAILY_PROMPTS.movie.recent.prompt
      .replace('${genre.name}', genre.name)
      .replace('${topic}', topic)
  } else if (promptType === 'chinese') {
    prompt = DAILY_PROMPTS.movie.chinese.prompt.replace('${genre.name}', genre.name)
  } else if (promptType === 'animation') {
    prompt = DAILY_PROMPTS.movie.animation.prompt
  } else {
    prompt = DAILY_PROMPTS.movie.default?.prompt?.replace('经典电影', `${genre.name} - ${topic}`) || `你是一位资深影评人，请推荐一部${genre.name} - ${topic}相关的经典电影。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyMusics', 'title', music.title)
  if (isExists) {
    console.log('[DailyContent] 音乐已存在，跳过保存:', music.title)
    return false
  }
  
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
    prompt = DAILY_PROMPTS.music.classical.prompt
  } else if (promptType === 'chinese') {
    prompt = DAILY_PROMPTS.music.chinese.prompt
  } else {
    prompt = DAILY_PROMPTS.music.default?.prompt?.replace('经典音乐', `${genre.name} - ${topic}`) || `你是一位资深音乐评论人，请推荐一首${genre.name} - ${topic}相关的经典音乐作品。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyTechs', 'title', tech.title)
  if (isExists) {
    console.log('[DailyContent] 科技知识已存在，跳过保存:', tech.title.substring(0, 20))
    return false
  }
  
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
    prompt = DAILY_PROMPTS.tech.ai.prompt
  } else if (promptType === 'china') {
    prompt = DAILY_PROMPTS.tech.china.prompt
  } else {
    prompt = DAILY_PROMPTS.tech.default?.prompt?.replace('知识主题', `${category.name} - ${topic}`) || `你是一位科技科普达人，请用通俗易懂的语言，分享一个实用的科技知识。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyTcms', 'title', tcm.title)
  if (isExists) {
    console.log('[DailyContent] 中医知识已存在，跳过保存:', tcm.title.substring(0, 20))
    return false
  }
  
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
    prompt = DAILY_PROMPTS.tcm.herb.prompt
  } else if (promptType === 'therapy') {
    prompt = DAILY_PROMPTS.tcm.therapy.prompt
  } else {
    prompt = DAILY_PROMPTS.tcm.default?.prompt?.replace('中医领域', `${category.name} - ${topic}`) || `你是一位资深中医养生专家，请用通俗易懂的语言，分享一个实用的中医药养生知识。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyTravels', 'title', travel.title)
  if (isExists) {
    console.log('[DailyContent] 旅游知识已存在，跳过保存:', travel.title.substring(0, 20))
    return false
  }
  
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
    prompt = DAILY_PROMPTS.travel.natural.prompt
  } else if (promptType === 'cultural') {
    prompt = DAILY_PROMPTS.travel.cultural.prompt
  } else {
    prompt = DAILY_PROMPTS.travel.default?.prompt?.replace('著名景点', `${country}及周边著名景点`) || `你是一位资深旅行达人，请分享一个世界各地著名的旅游景点或名胜古迹。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFortunes', 'title', fortune.title)
  if (isExists) {
    console.log('[DailyContent] 占卜知识已存在，跳过保存:', fortune.title.substring(0, 20))
    return false
  }
  
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
    const bagua = BAGUA_DATA[Math.floor(Math.random() * BAGUA_DATA.length)]
    categoryName = '易经八卦'
    categoryIcon = bagua.symbol || '☰'
    titleField = 'name'
    summaryField = 'description'
    
    prompt = DAILY_PROMPTS.fortune.bagua.prompt
      .replace('${bagua.name}', bagua.name)
      .replace('${bagua.symbol}', bagua.symbol)
      .replace('${bagua.name}', bagua.name)
  } else if (fortuneType === 'zodiac') {
    const zodiac = ZODIAC_DATA[Math.floor(Math.random() * ZODIAC_DATA.length)]
    categoryName = '星座解读'
    categoryIcon = zodiac.symbol
    titleField = 'name'
    summaryField = 'description'
    
    prompt = DAILY_PROMPTS.fortune.zodiac.prompt
      .replace('${zodiac.name}', zodiac.name)
      .replace('${zodiac.date}', zodiac.date)
      .replace('${zodiac.name}', zodiac.name)
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
  // 去重检查：以作者名作为唯一标识
  const isExists = await checkContentExists('dailyLiteratures', 'author', literature.author)
  if (isExists) {
    console.log('[DailyContent] 文学知识已存在，跳过保存:', literature.author)
    return false
  }
  
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
    prompt = DAILY_PROMPTS.literature.chinese.prompt
  } else if (promptType === 'foreign') {
    prompt = DAILY_PROMPTS.literature.foreign.prompt
  } else {
    prompt = DAILY_PROMPTS.literature.default?.prompt || `你是一位资深文学评论家，请介绍一位著名作家及其代表作品。直接输出：`
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
  
  // 使用备用文学库（字段已统一：author, era, region, works, summary, quote）
  const fallback = getRandomLiteratureFromLibrary()
  const result = {
    author: fallback.author || fallback.name || '佚名',
    era: fallback.era,
    region: fallback.region,
    works: fallback.works,
    summary: fallback.summary || fallback.description || '',
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyForeignTrades', 'title', foreignTrade.title)
  if (isExists) {
    console.log('[DailyContent] 外贸知识已存在，跳过保存:', foreignTrade.title.substring(0, 20))
    return false
  }
  
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
    prompt = DAILY_PROMPTS.foreignTrade.term.prompt
  } else if (promptType === 'payment') {
    prompt = DAILY_PROMPTS.foreignTrade.payment.prompt
  } else if (promptType === 'logistics') {
    prompt = DAILY_PROMPTS.foreignTrade.logistics?.prompt || DAILY_PROMPTS.foreignTrade.default?.prompt || `你是一位国际物流专家，请分享一个货运物流的知识或技巧。直接输出：`
  } else {
    prompt = DAILY_PROMPTS.foreignTrade.default?.prompt?.replace('领域', category.name) || `你是一位资深外贸专家，请分享一个实用的外贸业务知识或技巧。直接输出：`
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyECommerces', 'title', ecommerce.title)
  if (isExists) {
    console.log('[DailyContent] 电商知识已存在，跳过保存:', ecommerce.title.substring(0, 20))
    return false
  }
  
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyMaths', 'title', math.title)
  if (isExists) {
    console.log('[DailyContent] 数学知识已存在，跳过保存:', math.title.substring(0, 20))
    return false
  }
  
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
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyEnglishes', 'title', english.title)
  if (isExists) {
    console.log('[DailyContent] 英语知识已存在，跳过保存:', english.title.substring(0, 20))
    return false
  }
  
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

// ─── 计算机编程助手 ─────────────────────────────────────────────────

/**
 * 保存编程知识到云数据库
 */
async function saveProgrammingToCloud(programming) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyProgrammings', 'title', programming.title)
  if (isExists) {
    console.log('[DailyContent] 编程知识已存在，跳过保存:', programming.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyProgrammings').add({
      data: {
        title: programming.title,
        category: programming.category,
        categoryIcon: programming.categoryIcon || '💻',
        summary: programming.summary || '',
        tips: programming.tips || '',
        tags: programming.tags || [],
        source: programming.source || 'AI分享',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 编程知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存编程知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从编程知识库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomProgrammingFromLibrary() {
  // 每次都随机选择，充分利用知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_PROGRAMMING.length)
  return { ...FALLBACK_PROGRAMMING[index] }
}

/**
 * 生成每日编程知识
 */
async function generateProgramming() {
  // 随机选择知识类型
  const category = PROGRAMMING_CATEGORIES[Math.floor(Math.random() * PROGRAMMING_CATEGORIES.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'frontend', 'backend', 'database', 'devops', 'algorithm']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'frontend') {
    prompt = `你是一位前端技术专家，请分享一个前端开发的核心知识点或技巧。

要求：
1. 选择一个前端主题：React/Vue组件设计、CSS Flexbox/Grid、性能优化、TypeScript类型系统、前端工程化等
2. 内容要点：
   - 核心概念或原理
   - 实际应用示例
   - 最佳实践建议
3. 语言简洁专业，有代码示例
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'backend') {
    prompt = `你是一位后端架构师，请分享一个后端开发的核心知识点或架构技巧。

要求：
1. 选择一个后端主题：RESTful API设计、微服务架构、缓存策略、认证授权、数据库优化、消息队列等
2. 内容要点：
   - 核心原理或架构思想
   - 实际应用场景
   - 性能优化建议
3. 语言逻辑清晰，有架构思维
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'database') {
    prompt = `你是一位数据库专家，请分享一个数据库相关的核心知识点或优化技巧。

要求：
1. 选择一个数据库主题：索引原理、事务隔离、SQL优化、NoSQL应用、缓存策略、数据建模等
2. 内容要点：
   - 核心原理讲解
   - 实际案例分析
   - 优化建议
3. 语言专业严谨
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'devops') {
    prompt = `你是一位DevOps工程师，请分享一个DevOps领域的核心知识点或工具使用技巧。

要求：
1. 选择一个DevOps主题：Docker容器化、K8s编排、Git工作流、CI/CD流水线、监控告警、云原生等
2. 内容要点：
   - 核心概念或工具用法
   - 实战技巧
   - 避坑指南
3. 语言实用性强
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'algorithm') {
    prompt = `你是一位算法竞赛教练，请分享一个算法或数据结构的核心知识点或解题技巧。

要求：
1. 选择一个算法主题：排序算法、查找算法、树和图算法、动态规划、贪心算法等
2. 内容要点：
   - 算法原理或数据结构特点
   - 适用场景
   - 实现要点或优化技巧
3. 语言逻辑清晰，有思辨性
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深全栈工程师，请分享一个计算机编程领域的核心知识点、开发技巧或最佳实践。

要求：
1. 技术领域随机选择：
   - 前端开发：React/Vue框架、CSS布局、性能优化、TypeScript
   - 后端开发：Node.js/Java/Python、API设计、微服务、缓存
   - 数据库：MySQL/Redis/MongoDB、索引优化、事务
   - DevOps：Docker、Git、CI/CD、云原生
   - 设计模式：单例、工厂、观察者、策略等
   - 算法数据结构：排序、查找、树、图、动态规划
2. 内容要点：
   - 核心概念或技巧的专业讲解
   - 实际应用场景或代码示例
   - 常见问题或注意事项
3. 语言要简洁准确，有代码感
4. 长度控制在150-200字
5. 内容要实用、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const programming = {
          category: parts[0] || category.name,
          categoryIcon: category.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveProgrammingToCloud(programming).catch(() => {})
        return programming
      } else if (parts.length === 2) {
        const programming = {
          category: category.name,
          categoryIcon: category.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI分享',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveProgrammingToCloud(programming).catch(() => {})
        return programming
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成编程知识失败:', e)
  }

  // 使用备用编程知识库
  const fallback = getRandomProgrammingFromLibrary()
  const result = {
    ...fallback,
    source: '编程知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveProgrammingToCloud(result).catch(() => {})
  return result
}

// ─── 摄影达人 ─────────────────────────────────────────────────

/**
 * 保存摄影知识到云数据库
 */
async function savePhotographyToCloud(photography) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyPhotographies', 'title', photography.title)
  if (isExists) {
    console.log('[DailyContent] 摄影知识已存在，跳过保存:', photography.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPhotographies').add({
      data: {
        title: photography.title,
        category: photography.category,
        categoryIcon: photography.categoryIcon || '📷',
        summary: photography.summary || '',
        tips: photography.tips || [],
        example: photography.example || '',
        source: photography.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 摄影知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存摄影知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从摄影库随机获取一条（使用日期种子保证每天一致）
 */
function getRandomPhotographyFromLibrary() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % FALLBACK_PHOTOGRAPHY.length
  return { ...FALLBACK_PHOTOGRAPHY[index] }
}

/**
 * 生成每日摄影知识
 */
async function generatePhotography() {
  const field = PHOTOGRAPHY_FIELDS[Math.floor(Math.random() * PHOTOGRAPHY_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'basics', 'composition', 'light', 'portrait', 'landscape', 'mobile']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'basics') {
    prompt = `你是一位摄影培训师，请分享一个摄影基础知识或概念。

要求：
1. 选择一个基础主题：光圈、快门、感光度、对焦、测光，白平衡、RAW格式、安全快门、镜头焦段等
2. 内容要点：
   - 基础概念的专业讲解
   - 实际应用示例
   - 操作技巧和注意事项
3. 语言通俗易懂，适合入门学习
4. 长度150-200字

格式：
摄影基础|知识名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'composition') {
    prompt = `你是一位构图专家，请分享一个构图技巧或方法。

要求：
1. 选择一个构图主题：三分法、引导线、框架构图、对称构图、留白艺术、前景运用、对角线构图等
2. 内容要点：
   - 构图原理和效果
   - 实际应用场景
   - 拍摄技巧
3. 语言生动有趣，有启发性
4. 长度150-200字

格式：
构图技巧|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'light') {
    prompt = `你是一位用光大师，请分享一个用光技巧或光线知识。

要求：
1. 选择一个用光主题：黄金时刻、蓝色时刻，逆光、侧光、散射光、柔光、硬光、人造光等
2. 内容要点：
   - 光线特点和效果
   - 拍摄技巧和参数
   - 适用场景
3. 语言富有画面感
4. 长度150-200字

格式：
用光艺术|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'portrait') {
    prompt = `你是一位人像摄影大师，请分享一个人像摄影技巧。

要求：
1. 选择一个人像主题：焦段选择、对焦技巧、背景处理、摆姿引导，光线运用、后期处理等
2. 内容要点：
   - 专业技巧的要点
   - 实际拍摄案例
   - 常见问题和解决方案
3. 语言专业生动
4. 长度150-200字

格式：
人像摄影|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'landscape') {
    prompt = `你是一位风光摄影大师，请分享一个风光摄影技巧。

要求：
1. 选择一个风光主题：光线等待、前景运用、景深控制、慢门摄影、堆栈技术、天气预测等
2. 内容要点：
   - 拍摄要领和技巧
   - 时机和参数设置
   - 设备建议
3. 语言大气有格局
4. 长度150-200字

格式：
风光摄影|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'mobile') {
    prompt = `你是一位手机摄影达人，请分享一个手机摄影技巧。

要求：
1. 选择一个手机摄影主题：触摸对焦、HDR模式、夜景模式、人像模式、超广角、后期修图等
2. 内容要点：
   - 手机功能的正确使用
   - 拍摄技巧和参数
   - 创意玩法
3. 语言简洁实用
4. 长度150-200字

格式：
手机摄影|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深摄影导师，请分享一个实用的摄影技巧或拍摄知识。

要求：
1. 摄影领域随机选择：
   - 摄影基础：曝光三要素、对焦模式，白平衡、测光、ISO感光度
   - 构图技巧：三分法、引导线、框架构图、对称与平衡、留白
   - 用光艺术：黄金时刻、蓝色时刻，逆光摄影、散射光
   - 人像摄影：焦段选择、眼神对焦、背景选择、摆姿引导
   - 风光摄影：光线等待、前景运用、景深控制、慢门摄影
   - 手机摄影：触摸对焦、HDR模式、夜景模式、人像模式
2. 内容要点：
   - 核心知识点或技巧的专业讲解
   - 实际应用场景或示例（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要生动有趣，适合摄影爱好者学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const photography = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePhotographyToCloud(photography).catch(() => {})
        return photography
      } else if (parts.length === 2) {
        const photography = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePhotographyToCloud(photography).catch(() => {})
        return photography
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成摄影知识失败:', e)
  }

  // 使用备用摄影库
  const fallback = getRandomPhotographyFromLibrary()
  const result = {
    ...fallback,
    source: '摄影知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  savePhotographyToCloud(result).catch(() => {})
  return result
}

// ─── 美妆达人 ─────────────────────────────────────────────────

/**
 * 保存美妆知识到云数据库
 */
async function saveBeautyToCloud(beauty) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyBeauties', 'title', beauty.title)
  if (isExists) {
    console.log('[DailyContent] 美妆知识已存在，跳过保存:', beauty.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyBeauties').add({
      data: {
        title: beauty.title,
        category: beauty.category,
        categoryIcon: beauty.categoryIcon || '💄',
        summary: beauty.summary || '',
        tips: beauty.tips || [],
        example: beauty.example || '',
        source: beauty.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 美妆知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存美妆知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从美妆库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomBeautyFromLibrary() {
  // 每次都随机选择，充分利用50条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_BEAUTY.length)
  return { ...FALLBACK_BEAUTY[index] }
}

/**
 * 生成每日美妆知识
 */
async function generateBeauty() {
  // 随机选择美妆类型
  const field = BEAUTY_FIELDS[Math.floor(Math.random() * BEAUTY_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'skincare', 'makeup', 'haircare', 'nailcare', 'bodycare', 'tips']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'skincare') {
    prompt = `你是一位专业护肤顾问，请分享一个护肤知识点或技巧。

要求：
1. 选择一个护肤主题：清洁、保湿、防晒、美白、抗衰老、敏感肌护理、痘痘护理、毛孔护理等
2. 内容要点：
   - 专业知识的科学原理
   - 正确的护肤步骤和手法
   - 常见误区和注意事项
3. 语言通俗易懂，适合护肤小白学习
4. 长度150-200字

格式：
护肤心得|知识名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'makeup') {
    prompt = `你是一位美妆大师，请分享一个化妆技巧。

要求：
1. 选择一个化妆主题：底妆、眼妆、眉妆、腮红、口红、定妆、遮瑕、高光修容等
2. 内容要点：
   - 技巧要点和操作方法
   - 产品选择建议
   - 常见问题和解决方案
3. 语言生动有趣
4. 长度150-200字

格式：
化妆技巧|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'haircare') {
    prompt = `你是一位发型专家，请分享一个护发养发技巧。

要求：
1. 选择一个护发主题：洗发方法、护发素使用、吹发技巧、造型方法、染发护理、烫发护理等
2. 内容要点：
   - 专业技巧的操作方法
   - 产品选择建议
   - 让头发更健康的建议
3. 语言实用接地气
4. 长度150-200字

格式：
护发养发|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'nailcare') {
    prompt = `你是一位美甲师，请分享一个美甲护理技巧。

要求：
1. 选择一个美甲主题：指甲修剪、甲油涂抹、卸甲方法、指甲营养、指甲健康等
2. 内容要点：
   - 专业技巧的操作步骤
   - 注意事项和建议
   - 让指甲更健康的建议
3. 语言简洁实用
4. 长度150-200字

格式：
美甲护理|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'bodycare') {
    prompt = `你是一位身体护理专家，请分享一个身体护理技巧。

要求：
1. 选择一个身体护理主题：去角质、身体乳涂抹、手部护理、足部护理、颈部护理、背部护理等
2. 内容要点：
   - 专业护理的操作方法
   - 护理产品的选择
   - 让皮肤更健康的建议
3. 语言温馨实用
4. 长度150-200字

格式：
身体护理|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'tips') {
    prompt = `你是一位美妆达人，请分享一个美妆小贴士或生活小技巧。

要求：
1. 选择一个小贴士主题：妆容持久、工具清洁、色号选择、场合妆容、问题解决等
2. 内容要点：
   - 实操性强的小技巧
   - 具体的产品推荐或方法
   - 使用场景和效果
3. 语言生动有趣
4. 长度150-200字

格式：
美妆小贴士|贴士名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深美妆导师，请分享一个实用的美妆技巧或护肤知识。

要求：
1. 美妆领域随机选择：
   - 护肤心得：清洁、保湿、防晒、抗衰老、敏感肌护理
   - 化妆技巧：底妆、眼妆、眉妆、腮红、口红、定妆
   - 护发养发：洗发、护发、造型、染发护理
   - 美甲护理：指甲修剪、甲油涂抹、卸甲方法
   - 身体护理：去角质、身体乳、手部护理、足部护理
   - 美妆小贴士：妆容持久、工具清洁、色号选择
2. 内容要点：
   - 核心知识点或技巧的专业讲解
   - 实际应用场景或示例（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要生动有趣，适合美妆爱好者学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const beauty = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveBeautyToCloud(beauty).catch(() => {})
        return beauty
      } else if (parts.length === 2) {
        const beauty = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveBeautyToCloud(beauty).catch(() => {})
        return beauty
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成美妆知识失败:', e)
  }

  // 使用备用美妆库
  const fallback = getRandomBeautyFromLibrary()
  const result = {
    ...fallback,
    source: '美妆知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveBeautyToCloud(result).catch(() => {})
  return result
}

// ─── 投资理财达人 ─────────────────────────────────────────────────

/**
 * 保存投资理财知识到云数据库
 */
async function saveInvestmentToCloud(investment) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyInvestments', 'title', investment.title)
  if (isExists) {
    console.log('[DailyContent] 投资理财知识已存在，跳过保存:', investment.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyInvestments').add({
      data: {
        title: investment.title,
        category: investment.category,
        categoryIcon: investment.categoryIcon || '💰',
        summary: investment.summary || '',
        tips: investment.tips || [],
        example: investment.example || '',
        source: investment.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 投资理财知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存投资理财知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从投资理财库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomInvestmentFromLibrary() {
  // 每次都随机选择，充分利用多条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_INVESTMENT.length)
  return { ...FALLBACK_INVESTMENT[index] }
}

/**
 * 生成每日投资理财知识
 */
async function generateInvestment() {
  // 随机选择投资理财类型
  const field = INVESTMENT_FIELDS[Math.floor(Math.random() * INVESTMENT_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'fund', 'index', 'value', 'global', 'strategy', 'risk']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'fund') {
    prompt = `你是一位基金投资专家，请分享一个基金投资知识点或技巧。

要求：
1. 选择一个基金主题：基金定投、净值估算、申购赎回、分红方式、基金费率、基金转换等
2. 内容要点：
   - 基金知识的科学原理
   - 正确的投资步骤和方法
   - 常见误区和注意事项
3. 语言通俗易懂，适合投资新手学习
4. 长度150-200字

格式：
基金知识|知识名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'index') {
    prompt = `你是一位指数基金专家，请分享一个指数基金投资知识点。

要求：
1. 选择一个指数基金主题：宽基指数、窄基指数、PE/PB估值、红利指数、行业指数、全球指数等
2. 内容要点：
   - 指数基金的专业知识
   - 选基方法和配置建议
   - 估值判断技巧
3. 语言专业但易懂
4. 长度150-200字

格式：
指数基金|知识名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'value') {
    prompt = `你是一位价值投资大师，请分享一个价值投资理念或投资大师的思想。

要求：
1. 选择一个价值投资主题：巴菲特理念、护城河理论、ROE分析、自由现金流、彼得·林奇心法等
2. 内容要点：
   - 投资大师的核心思想
   - 实际应用案例
   - 对普通投资者的启示
3. 语言富有哲理
4. 长度150-200字

格式：
价值投资|理念名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'global') {
    prompt = `你是一位全球资产配置专家，请分享一个海外投资或全球配置的理念。

要求：
1. 选择一个全球投资主题：耶鲁基金配置、达利欧全天候、全球分散投资、QDII基金、海外REITs等
2. 内容要点：
   - 全球投资的专业知识
   - 配置思路和方法
   - 风险与收益分析
3. 语言开阔视野
4. 长度150-200字

格式：
全球投资|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'strategy') {
    prompt = `你是一位投资策略专家，请分享一个投资策略或资产配置方法。

要求：
1. 选择一个投资策略主题：核心卫星策略、再平衡艺术、目标日期基金、股债轮动、金字塔买入等
2. 内容要点：
   - 策略的核心逻辑
   - 具体操作方法
   - 适用人群和场景
3. 语言条理清晰
4. 长度150-200字

格式：
投资策略|策略名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'risk') {
    prompt = `你是一位风险管理专家，请分享一个投资风险控制知识或技巧。

要求：
1. 选择一个风险管理主题：分散投资、止损技巧、流动性管理、杠杆风险、黑天鹅应对等
2. 内容要点：
   - 风险识别和防控方法
   - 实际案例和教训
   - 投资心态建议
3. 语言警醒但建设性
4. 长度150-200字

格式：
风险控制|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深投资理财顾问，请分享一个实用的投资理财知识或基金投资理念。

要求：
1. 投资理财领域随机选择：
   - 基金知识：定投、净值、分红、费率、指数
   - 指数基金：宽基、窄基、估值、smart beta
   - 价值投资：巴菲特理念、护城河、ROE、自由现金流
   - 全球投资：耶鲁基金、达利欧、全球配置、QDII
   - 投资策略：核心卫星、再平衡、股债轮动
   - 风险控制：分散投资、止损、远离杠杆
2. 内容要点：
   - 核心投资知识或理念的专业讲解
   - 实际应用场景或投资案例（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要专业易懂，适合理财小白学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const investment = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveInvestmentToCloud(investment).catch(() => {})
        return investment
      } else if (parts.length === 2) {
        const investment = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveInvestmentToCloud(investment).catch(() => {})
        return investment
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成投资理财知识失败:', e)
  }

  // 使用备用投资理财库
  const fallback = getRandomInvestmentFromLibrary()
  const result = {
    ...fallback,
    source: '投资理财知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveInvestmentToCloud(result).catch(() => {})
  return result
}

// ─── 钓鱼达人 ─────────────────────────────────────────────────

/**
 * 保存钓鱼知识到云数据库
 */
async function saveFishingToCloud(fishing) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFishings', 'title', fishing.title)
  if (isExists) {
    console.log('[DailyContent] 钓鱼知识已存在，跳过保存:', fishing.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFishings').add({
      data: {
        title: fishing.title,
        category: fishing.category,
        categoryIcon: fishing.categoryIcon || '🎣',
        summary: fishing.summary || '',
        tips: fishing.tips || [],
        example: fishing.example || '',
        source: fishing.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 钓鱼知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存钓鱼知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从钓鱼库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomFishingFromLibrary() {
  // 每次都随机选择，充分利用多条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_FISHING.length)
  return { ...FALLBACK_FISHING[index] }
}

/**
 * 生成每日钓鱼知识
 */
async function generateFishing() {
  // 随机选择钓鱼类型
  const field = FISHING_FIELDS[Math.floor(Math.random() * FISHING_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'technique', 'gear', 'bait', 'location', 'species', 'season']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'technique') {
    prompt = `你是一位钓鱼高手，请分享一个钓鱼技巧或实战经验。

要求：
1. 选择一个钓鱼技巧主题：调漂、抛竿、抓口时机、遛鱼手法、飞铅钓法、搓饵拉饵切换等
2. 内容要点：
   - 技巧的要点和操作方法
   - 实际应用场景
   - 常见问题和解决方案
3. 语言专业生动
4. 长度150-200字

格式：
钓鱼技巧|技巧名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'gear') {
    prompt = `你是一位钓鱼装备专家，请分享一个装备选择或使用的知识。

要求：
1. 选择一个装备主题：鱼竿调性、主线子线搭配、浮漂选择、鱼钩型号、钓箱钓椅选择等
2. 内容要点：
   - 装备的专业知识
   - 选择方法和注意事项
   - 使用技巧
3. 语言实用易懂
4. 长度150-200字

格式：
装备选择|装备名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'bait') {
    prompt = `你是一位饵料配制大师，请分享一个饵料配方或饵料使用技巧。

要求：
1. 选择一个饵料主题：商品饵搭配思路、活饵使用技巧、窝料制作、小药使用原则等
2. 内容要点：
   - 饵料配制的核心知识
   - 具体配方和比例
   - 注意事项
3. 语言通俗实用
4. 长度150-200字

格式：
饵料配方|配方名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'location') {
    prompt = `你是一位钓鱼老手，请分享一个钓点选择或作钓策略的经验。

要求：
1. 选择一个选位主题：水库作钓、江河作钓、黑坑技巧、夜钓选位、季节性选位规律等
2. 内容要点：
   - 选位的关键因素
   - 具体位置判断方法
   - 实战经验
3. 语言经验性强
4. 长度150-200字

格式：
钓点选择|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'species') {
    prompt = `你是一位鱼类学专家，请分享一个目标鱼类的习性和钓法。

要求：
1. 选择一个鱼种：鲫鱼、鲤鱼、草鱼、青鱼、鲢鳙、黄辣丁、鳊鱼、白条等
2. 内容要点：
   - 鱼类的习性特点
   - 觅食习惯
   - 漂相识别和钓法技巧
3. 语言生动有趣
4. 长度150-200字

格式：
鱼类习性|鱼种名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'season') {
    prompt = `你是一位四季钓鱼达人，请分享一个季节性作钓的知识或技巧。

要求：
1. 选择一个季节主题：春季钓鱼黄金期、夏季注意事项、秋季钓鱼要点、冬季冰钓技巧等
2. 内容要点：
   - 季节对钓鱼的影响
   - 时段选择和饵料调整
   - 作钓策略变化
3. 语言条理清晰
4. 长度150-200字

格式：
季节作钓|季节名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深钓鱼大师，请分享一个实用的钓鱼技巧或钓鱼知识。

要求：
1. 钓鱼领域随机选择：
   - 钓鱼技巧：调漂、抛竿、抓口、遛鱼、走钓守钓
   - 装备选择：鱼竿、鱼线、鱼钩、浮漂选择
   - 饵料配方：商品饵搭配、活饵使用、窝料制作
   - 钓点选择：水库、江河、黑坑、夜钓选位
   - 鱼类习性：鲫鱼、鲤鱼、草鱼、青鱼习性
   - 季节作钓：春夏秋冬四季钓鱼要点
2. 内容要点：
   - 核心钓鱼知识或技巧的专业讲解
   - 实际应用场景或钓鱼案例（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要生动有趣，适合钓鱼爱好者学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const fishing = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFishingToCloud(fishing).catch(() => {})
        return fishing
      } else if (parts.length === 2) {
        const fishing = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFishingToCloud(fishing).catch(() => {})
        return fishing
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成钓鱼知识失败:', e)
  }

  // 使用备用钓鱼库
  const fallback = getRandomFishingFromLibrary()
  const result = {
    ...fallback,
    source: '钓鱼知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveFishingToCloud(result).catch(() => {})
  return result
}

// ─── 健身达人 ─────────────────────────────────────────────────

/**
 * 保存健身知识到云数据库
 */
async function saveFitnessToCloud(fitness) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFitnesses', 'title', fitness.title)
  if (isExists) {
    console.log('[DailyContent] 健身知识已存在，跳过保存:', fitness.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFitnesses').add({
      data: {
        title: fitness.title,
        category: fitness.category,
        categoryIcon: fitness.categoryIcon || '💪',
        summary: fitness.summary || '',
        tips: fitness.tips || [],
        example: fitness.example || '',
        source: fitness.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 健身知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存健身知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从健身库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomFitnessFromLibrary() {
  // 每次都随机选择，充分利用多条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_FITNESS.length)
  return { ...FALLBACK_FITNESS[index] }
}

/**
 * 生成每日健身知识
 */
async function generateFitness() {
  // 随机选择健身类型
  const field = FITNESS_FIELDS[Math.floor(Math.random() * FITNESS_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'concept', 'fatLoss', 'hipUp', 'nutrition', 'technique', 'habit']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'concept') {
    prompt = `你是一位健身理念导师，请分享一个健身核心概念或训练原则。

要求：
1. 选择一个健身理念主题：渐进超负荷、超量恢复、RM与训练次数、肌肉增长原理、复合动作优先、训练频率与分化等
2. 内容要点：
   - 理念的核心原理
   - 实际应用方法
   - 常见误区和正确做法
3. 语言专业易懂
4. 长度150-200字

格式：
健身理念|理念名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'fatLoss') {
    prompt = `你是一位减脂专家，请分享一个减脂瘦腹的知识或技巧。

要求：
1. 选择一个减脂主题：HIIT训练、腹部训练动作、空腹有氧、热量控制、顽固脂肪应对、减脂平台期突破等
2. 内容要点：
   - 减脂的科学原理
   - 具体训练或饮食方法
   - 注意事项和常见错误
3. 语言通俗实用
4. 长度150-200字

格式：
减脂瘦腹|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'hipUp') {
    prompt = `你是一位臀部塑形专家，请分享一个丰臀塑形的训练知识或技巧。

要求：
1. 选择一个丰臀主题：臀部肌肉解剖、深蹲姿势、臀推动作、硬拉发力、臀中肌锻炼、上臀下臀训练等
2. 内容要点：
   - 训练原理和要点
   - 正确动作示范描述
   - 训练建议和注意事项
3. 语言专业生动
4. 长度150-200字

格式：
丰臀塑形|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'nutrition') {
    prompt = `你是一位运动营养专家，请分享一个健身营养知识或饮食技巧。

要求：
1. 选择一个营养主题：蛋白质摄入指南、碳水聪明吃法、健康脂肪作用、训练前后营养、减脂饮食技巧、增肌热量盈余等
2. 内容要点：
   - 营养知识的专业讲解
   - 具体摄入量和食物选择
   - 饮食安排建议
3. 语言通俗易懂
4. 长度150-200字

格式：
营养饮食|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'technique') {
    prompt = `你是一位健身动作指导专家，请分享一个训练动作的技巧或细节。

要求：
1. 选择一个动作技巧主题：卧推发力、深蹲技巧、硬拉姿势、划船动作、肩部训练、有氧正确心率、拉伸方法等
2. 内容要点：
   - 动作的步骤和要点
   - 常见错误和正确做法
   - 进阶技巧
3. 语言条理清晰
4. 长度150-200字

格式：
动作技巧|动作名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'habit') {
    prompt = `你是一位健康生活顾问，请分享一个健身相关的生活习惯知识。

要求：
1. 选择一个生活习惯主题：睡眠与恢复、水分管理、压力与皮质醇、久坐危害、训练记录、增肌减脂同时进行、瓶颈期应对等
2. 内容要点：
   - 习惯对健身的影响
   - 正确做法和建议
   - 实操技巧
3. 语言温馨实用
4. 长度150-200字

格式：
生活习惯|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深健身教练，请分享一个实用的健身技巧或健康知识。

要求：
1. 健身领域随机选择：
   - 健身理念：渐进超负荷、超量恢复、RM训练原则
   - 减脂瘦腹：HIIT训练、腹部训练、热量控制
   - 丰臀塑形：臀部训练、深蹲、硬拉、臀推
   - 营养饮食：蛋白质摄入、碳水聪明吃法、健康脂肪
   - 动作技巧：卧推、深蹲、硬拉、划船等动作要点
   - 生活习惯：睡眠管理、压力控制、水分补充
2. 内容要点：
   - 核心健身知识或技巧的专业讲解
   - 实际应用场景或训练案例（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要专业易懂，适合健身爱好者学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const fitness = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFitnessToCloud(fitness).catch(() => {})
        return fitness
      } else if (parts.length === 2) {
        const fitness = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        saveFitnessToCloud(fitness).catch(() => {})
        return fitness
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成健身知识失败:', e)
  }

  // 使用备用健身库
  const fallback = getRandomFitnessFromLibrary()
  const result = {
    ...fallback,
    source: '健身知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  saveFitnessToCloud(result).catch(() => {})
  return result
}

// ─── 宠物达人 ─────────────────────────────────────────────────

/**
 * 保存宠物知识到云数据库
 */
async function savePetToCloud(pet) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyPets', 'title', pet.title)
  if (isExists) {
    console.log('[DailyContent] 宠物知识已存在，跳过保存:', pet.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPets').add({
      data: {
        title: pet.title,
        category: pet.category,
        categoryIcon: pet.categoryIcon || '🐾',
        summary: pet.summary || '',
        tips: pet.tips || '',
        source: pet.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 宠物知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存宠物知识到云数据库失败:', e)
    return false
  }
}

/**
 * 从宠物库随机获取一条（每次调用都随机，保证刷新变化）
 */
function getRandomPetFromLibrary() {
  // 每次都随机选择，充分利用多条知识的多样性
  const index = Math.floor(Math.random() * FALLBACK_PET.length)
  return { ...FALLBACK_PET[index] }
}

/**
 * 生成每日宠物知识
 */
async function generatePet() {
  // 随机选择宠物领域
  const field = PET_FIELDS[Math.floor(Math.random() * PET_FIELDS.length)]

  // 随机选择提示词类型
  const promptTypes = ['default', 'concept', 'daily', 'nutrition', 'health', 'behavior', 'interaction']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'concept') {
    prompt = `你是一位养宠理念导师，请分享一个科学养宠的核心概念或相处原则。

要求：
1. 选择一个养宠理念主题：科学养宠三大原则、宠物与家人相处、解读肢体语言、品种与性格关系、文明养宠责任等
2. 内容要点：
   - 理念的核心含义
   - 实际应用方法
   - 常见误区和正确做法
3. 语言温馨易懂
4. 长度150-200字

格式：
养宠理念|理念名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'daily') {
    prompt = `你是一位宠物护理专家，请分享一个日常护理知识或技巧。

要求：
1. 选择一个护理主题：洗澡频率、猫咪清洁、口腔护理、毛发护理、指甲修剪、耳朵清洁等
2. 内容要点：
   - 护理的专业要点
   - 具体操作方法
   - 注意事项
3. 语言实用易懂
4. 长度150-200字

格式：
日常护理|护理名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'nutrition') {
    prompt = `你是一位宠物营养专家，请分享一个科学喂养的知识或技巧。

要求：
1. 选择一个喂养主题：宠物粮选择指南、猫咪肉食特性、禁忌食物、换粮方法、喂食频率和量等
2. 内容要点：
   - 营养知识的专业讲解
   - 具体选择或操作方法
   - 注意事项
3. 语言实用易懂
4. 长度150-200字

格式：
科学喂养|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'health') {
    prompt = `你是一位宠物健康专家，请分享一个健康保健知识或技巧。

要求：
1. 选择一个健康主题：疫苗接种、驱虫知识、疾病预防、急救基础、如何判断宠物生病等
2. 内容要点：
   - 健康知识的专业讲解
   - 具体预防或处理方法
   - 注意事项
3. 语言专业实用
4. 长度150-200字

格式：
健康保健|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'behavior') {
    prompt = `你是一位宠物行为训练师，请分享一个行为训练知识或技巧。

要求：
1. 选择一个训练主题：基础指令训练、猫咪如厕、纠正不良行为、猫咪抓挠问题、社交化训练等
2. 内容要点：
   - 训练原理和要点
   - 具体训练方法
   - 常见问题解决
3. 语言生动实用
4. 长度150-200字

格式：
行为训练|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'interaction') {
    prompt = `你是一位宠物互动专家，请分享一个互动娱乐知识或技巧。

要求：
1. 选择一个互动主题：适合狗狗的游戏、猫咪捕猎游戏、出行安全指南、宠物拍照技巧、给宠物创造仪式感等
2. 内容要点：
   - 互动的方法和要点
   - 具体游戏或活动介绍
   - 注意事项
3. 语言温馨有趣
4. 长度150-200字

格式：
互动娱乐|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深宠物专家，请分享一个实用的养宠知识或技巧。

要求：
1. 养宠领域随机选择：
   - 养宠理念：科学养宠、宠物与家人相处、肢体语言解读、品种性格、文明养宠
   - 日常护理：洗澡清洁、口腔护理、毛发护理、指甲修剪、耳朵清洁
   - 科学喂养：宠物粮选择、肉食特性、食物禁忌、换粮方法、喂食频率
   - 健康保健：疫苗接种、驱虫知识、疾病预防、急救基础、判断生病
   - 行为训练：基础指令、如厕训练、不良行为纠正、猫咪抓挠、社交化
   - 互动娱乐：互动游戏、捕猎游戏、出行安全、宠物拍照、仪式感
2. 内容要点：
   - 核心养宠知识或技巧的专业讲解
   - 实际应用场景（2-3个具体例子）
   - 实用建议或操作步骤
3. 语言要温馨易懂，适合宠物主人学习
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
分类名称|知识标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const pet = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePetToCloud(pet).catch(() => {})
        return pet
      } else if (parts.length === 2) {
        const pet = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        // 保存到云数据库
        savePetToCloud(pet).catch(() => {})
        return pet
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成宠物知识失败:', e)
  }

  // 使用备用宠物库
  const fallback = getRandomPetFromLibrary()
  const result = {
    ...fallback,
    source: '宠物知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  // 保存到云数据库
  savePetToCloud(result).catch(() => {})
  return result
}

// ─── 时尚达人 ─────────────────────────────────────────────────

async function saveFashionToCloud(fashion) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFashions', 'title', fashion.title)
  if (isExists) {
    console.log('[DailyContent] 时尚知识已存在，跳过保存:', fashion.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFashions').add({
      data: {
        title: fashion.title,
        category: fashion.category,
        categoryIcon: fashion.categoryIcon || '✨',
        summary: fashion.summary || '',
        tips: fashion.tips || '',
        source: fashion.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 时尚知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存时尚知识到云数据库失败:', e)
    return false
  }
}

function getRandomFashionFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_FASHION.length)
  return { ...FALLBACK_FASHION[index] }
}

async function generateFashion() {
  const field = FASHION_FIELDS[Math.floor(Math.random() * FASHION_FIELDS.length)]
  const promptTypes = ['default', 'concept', 'trend', 'rule', 'accessory', 'color', 'style']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'concept') {
    prompt = `你是一位时尚理念导师，请分享一个时尚穿搭的核心理念或原则。

要求：
1. 选择一个理念主题：极简主义、胶囊衣橱、个人风格定位、可持续时尚、投资性穿衣等
2. 内容要点：理念的核心含义、实际应用方法、常见误区和正确做法
3. 语言时尚有品味
4. 长度150-200字

格式：
时尚理念|理念名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'trend') {
    prompt = `你是一位流行趋势专家，请分享一个时尚趋势知识。

要求：
1. 选择一个趋势主题：年度流行色应用、复古风回潮、无性别时尚、老钱风、街头风格等
2. 内容要点：趋势的核心特征、如何融入日常搭配、实用建议
3. 语言时髦易懂
4. 长度150-200字

格式：
流行趋势|趋势名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'rule') {
    prompt = `你是一位穿搭法则专家，请分享一个实用的穿搭法则。

要求：
1. 选择一个法则主题：身形穿搭（梨形/苹果/沙漏）、黄金比例、四季叠穿、场合穿搭等
2. 内容要点：法则的具体操作方法、适用场景、实际案例
3. 语言实用易操作
4. 长度150-200字

格式：
穿搭法则|法则名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'accessory') {
    prompt = `你是一位配饰搭配专家，请分享一个配饰搭配技巧。

要求：
1. 选择一个配饰主题：首饰叠戴、包包选择、丝巾用法、帽子造型、眼镜框修饰等
2. 内容要点：搭配技巧和注意事项、不同场合的选择建议
3. 语言精致实用
4. 长度150-200字

格式：
配饰搭配|搭配名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'color') {
    prompt = `你是一位色彩美学专家，请分享一个色彩搭配知识。

要求：
1. 选择一个色彩主题：肤色诊断与定位、配色实战技巧、经典中性色、同色系搭配、互补色运用等
2. 内容要点：色彩知识的专业讲解、具体搭配方案、避坑指南
3. 语言生动易懂
4. 长度150-200字

格式：
色彩美学|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'style') {
    prompt = `你是一位风格塑造专家，请分享一个个人风格打造的知识。

要求：
1. 选择一个风格主题：法式chic、日系风格、职场形象管理、复古风格、街头潮酷等
2. 内容要点：风格的核心要素、如何打造该风格、关键单品推荐
3. 语言优雅有品位
4. 长度150-200字

格式：
风格塑造|风格名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深时尚达人，请分享一个时尚潮流知识或穿搭技巧。

要求：
1. 领域随机选择：
   - 时尚理念：极简主义、胶囊衣橱、可持续时尚、个人风格定位
   - 流行趋势：年度流行色、复古回潮、无性别时尚、老钱风
   - 穿搭法则：身形穿搭、比例调整、叠穿法则、场合穿搭
   - 配饰搭配：首饰叠戴、包包选择、丝巾妙用、帽子造型
   - 色彩美学：肤色诊断、配色实战、中性色穿搭
   - 风格塑造：法式chic、日系风、职场形象、复古风
2. 内容要点：专业知识讲解 + 实际应用场景(2-3个例子) + 实用建议
3. 语言时尚有品味
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const fashion = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveFashionToCloud(fashion).catch(() => {})
        return fashion
      } else if (parts.length === 2) {
        const fashion = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveFashionToCloud(fashion).catch(() => {})
        return fashion
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成时尚知识失败:', e)
  }

  const fallback = getRandomFashionFromLibrary()
  const result = {
    ...fallback,
    source: '时尚知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveFashionToCloud(result).catch(() => {})
  return result
}

// ─── 穿搭达人 ─────────────────────────────────────────────────

async function saveOutfitToCloud(outfit) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyOutfits', 'title', outfit.title)
  if (isExists) {
    console.log('[DailyContent] 穿搭知识已存在，跳过保存:', outfit.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyOutfits').add({
      data: {
        title: outfit.title,
        category: outfit.category,
        categoryIcon: outfit.categoryIcon || '👕',
        summary: outfit.summary || '',
        tips: outfit.tips || '',
        source: outfit.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 穿搭知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存穿搭知识到云数据库失败:', e)
    return false
  }
}

function getRandomOutfitFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_OUTFIT.length)
  return { ...FALLBACK_OUTFIT[index] }
}

async function generateOutfit() {
  const field = OUTFIT_FIELDS[Math.floor(Math.random() * OUTFIT_FIELDS.length)]
  const promptTypes = ['default', 'basic', 'seasonal', 'body', 'item', 'scene', 'pitfall']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'basic') {
    prompt = `你是一位基础穿搭专家，请分享一个基础单品的穿搭知识。

要求：
1. 选择一个单品主题：白T恤、牛仔裤、衬衫、针织衫、西装外套等基础款
2. 内容要点：选购指南、搭配公式、护理保养技巧
3. 语言实用接地气
4. 长度150-200字

格式：
基础穿搭|单品名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'seasonal') {
    prompt = `你是一位季节穿搭专家，请分享一个季节性的穿搭技巧。

要求：
1. 选择季节主题：春季温差应对、夏季清凉穿搭、秋季层次搭配、冬季保暖显瘦等
2. 内容要点：当季穿搭策略、必备单品推荐、材质选择建议
3. 语言应季实用
4. 长度150-200字

格式：
季节穿搭|季节主题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'body') {
    prompt = `你是一位身材修饰专家，请分享一个针对特定身材的穿搭技巧。

要求：
1. 选择身材主题：小个子显高、苹果型遮肚、沙漏型展示曲线、梨形身材平衡、通用修饰技巧等
2. 内容要点：该身材的特点分析、穿搭策略、推荐单品和避雷项
3. language鼓励性强
4. 长度150-200字

格式：
身材修饰|身材类型|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'item') {
    prompt = `你是一位单品解析专家，请深入解析一个经典穿搭单品。

要求：
1. 选择单品主题：小黑裙LBD、风衣、西装外套、白衬衫、针织衫等经典单品
2. 内容要点：单品的历史背景、选购要点、多种搭配方式、投资价值
3. 语言专业有趣
4. 长度150-200字

格式：
单品解析|单品名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'scene') {
    prompt = `你是一位特殊场景穿搭专家，请分享一个特定场合的穿搭攻略。

要求：
1. 选择场合主题：约会穿搭、面试穿搭、拍照穿搭、旅行穿搭、派对穿搭等
2. 内容要点：场合着装要点、穿搭方案推荐、需要注意的细节
3. 语言贴心实用
4. 长度150-200字

格式：
特殊场景|场合名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'pitfall') {
    prompt = `你是一位穿搭避坑专家，请分享一个常见的穿搭误区及纠正方法。

要求：
1. 选择避坑主题：常见穿搭误区、网购避坑、内衣选择错误、尺码问题、配饰过载等
2. 内容要点：误区描述、为什么错、正确的做法
3. 语言幽默实用
4. 长度150-200字

格式：
避坑指南|误区名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深穿搭达人，请分享一个实用的日常穿搭知识或技巧。

要求：
1. 穿搭领域随机选择：
   - 基础穿搭：白T恤、牛仔裤、衬衫、针织衫等基础单品
   - 季节穿搭：春夏秋冬各季穿搭策略
   - 身材修饰：小个子、苹果型、沙漏型、梨形等针对性穿搭
   - 单品解析：小黑裙、风衣、西装、大衣等经典单品深度解读
   - 特殊场景：约会、面试、拍照、旅行等场合穿搭
   - 避坑指南：常见穿搭错误、网购技巧、尺码选择
2. 内容要点：专业讲解 + 具体案例(2-3个) + 实操建议
3. 语言亲切实用
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const outfit = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveOutfitToCloud(outfit).catch(() => {})
        return outfit
      } else if (parts.length === 2) {
        const outfit = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveOutfitToCloud(outfit).catch(() => {})
        return outfit
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成穿搭知识失败:', e)
  }

  const fallback = getRandomOutfitFromLibrary()
  const result = {
    ...fallback,
    source: '穿搭知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveOutfitToCloud(result).catch(() => {})
  return result
}

// ─── 装修达人 ─────────────────────────────────────────────────

async function saveDecorationToCloud(decoration) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyDecorations', 'title', decoration.title)
  if (isExists) {
    console.log('[DailyContent] 装修知识已存在，跳过保存:', decoration.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyDecorations').add({
      data: {
        title: decoration.title,
        category: decoration.category,
        categoryIcon: decoration.categoryIcon || '🏠',
        summary: decoration.summary || '',
        tips: decoration.tips || '',
        source: decoration.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 装修知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存装修知识到云数据库失败:', e)
    return false
  }
}

function getRandomDecorationFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_DECORATION.length)
  return { ...FALLBACK_DECORATION[index] }
}

async function generateDecoration() {
  const field = DECORATION_FIELDS[Math.floor(Math.random() * DECORATION_FIELDS.length)]
  const promptTypes = ['default', 'concept', 'space', 'style', 'material', 'lighting', 'soft']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'concept') {
    prompt = `你是一位装修理念专家，请分享一个装修核心理念或流程知识。

要求：
1. 选择一个理念主题：装修顺序、轻装修重装饰、人性化设计、预算控制等
2. 内容要点：理念的详细解释、执行步骤、注意事项
3. 语言专业通俗
4. 长度150-200字

格式：
装修理念|理念名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'space') {
    prompt = `你是一位空间规划专家，请分享一个空间规划的知识或技巧。

要求：
1. 选择空间主题：小户型扩容、客厅规划、厨房动线、卧室布局、收纳规划等
2. 内容要点：规划原理、尺寸参考、布局建议
3. 语言实用可操作
4. 长度150-200字

格式：
空间规划|空间名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'style') {
    prompt = `你是一位家居风格专家，请分享一种家居风格的特点和打造方法。

要求：
1. 选择风格主题：北欧风、日式原木风、现代简约风、新中式、工业风等
2. 内容要点：风格的核特征、关键元素、配色方案、如何打造
3.语言优美有画面感
4. 长度150-200字

格式：
风格流派|风格名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'material') {
    prompt = `你是一位装修材料专家，请分享一种材料的选择知识。

要求：
1. 选择材料主题：地板选择(木地板vs瓷砖)、墙面材料(乳胶漆/壁纸)、橱柜定制避坑等
2. 内容要点：各种材料的优缺点对比、价格区间、选购要点
3. 语言客观专业
4. 长度150-200字

格式：
材料选择|材料名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'lighting') {
    prompt = `你是一位照明设计专家，请分享一个家庭照明的知识。

要求：
1. 选择照明主题：照明设计系统(分层照明)、无主灯设计、色温选择、各空间照明方案等
2. 内容要点：照明原理、实施方法、参数建议
3. 语言科学易懂
4. 长度150-200字

格式：
照明设计|照明主题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'soft') {
    prompt = `你是一位软装配色专家，请分享一个软装搭配的知识。

要求：
1. 选择软装主题：软装入门、家居配色方案、窗帘地毯选择、绿植搭配、收纳整理等
2. 内容要点：搭配方法和步骤、具体方案推荐、购物顺序
3. 语言温馨实用
4. 长度150-200字

格式：
软装配色|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深装修达人，请分享一个实用的家居装修知识或技巧。

要求：
1. 装修领域随机选择：
   - 装修理念：装修顺序、轻硬装重软装、人性化设计、预算控制
   - 空间规划：小户型扩容、客厅/厨房/卧室规划、收纳系统
   - 风格流派：北欧风、日式原木、现代简约、新中式
   - 材料选择：地板、墙面材料、橱柜定制、防水材料
   - 照明设计：分层照明、无主灯设计、色温与显指
   - 软装配色：配色方案、窗帘地毯、绿植、收纳整理
2. 内容要点：专业讲解 + 具体数据参考(尺寸/价格) + 避坑提醒
3. 语言专业实用
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })

    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)

      if (parts.length >= 3) {
        const decoration = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveDecorationToCloud(decoration).catch(() => {})
        return decoration
      } else if (parts.length === 2) {
        const decoration = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveDecorationToCloud(decoration).catch(() => {})
        return decoration
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成装修知识失败:', e)
  }

  const fallback = getRandomDecorationFromLibrary()
  const result = {
    ...fallback,
    source: '装修知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveDecorationToCloud(result).catch(() => {})
  return result
}

// ─── 玻纤达人 ─────────────────────────────────────────────────

async function saveFiberToCloud(fiber) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyGlassFibers', 'title', fiber.title)
  if (isExists) {
    console.log('[DailyContent] 玻纤知识已存在，跳过保存:', fiber.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyGlassFibers').add({
      data: {
        title: fiber.title,
        category: fiber.category,
        categoryIcon: fiber.categoryIcon || '🧵',
        summary: fiber.summary || '',
        tips: fiber.tips || '',
        source: fiber.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 玻纤知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存玻纤知识到云数据库失败:', e)
    return false
  }
}

function getRandomFiberFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_FIBER.length)
  return { ...FALLBACK_FIBER[index] }
}

async function generateFiber() {
  const field = FIBER_FIELDS[Math.floor(Math.random() * FIBER_FIELDS.length)]
  const promptTypes = ['default', 'type', 'process', 'application', 'equipment', 'quality', 'safety']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'type') {
    prompt = `你是一位玻纤材料专家，请分享一个玻璃纤维类型或品种的知识。

要求：
1. 选择一个主题：E玻纤vsC玻纤区别、短切毡vs连续毡、玻纤布种类与选用、特种玻纤（ECR/AR）、玻纤表面处理等
2. 内容要点：类型的核心特征、优缺点对比、实际选用建议
3. 语言专业易懂
4. 长度150-200字

格式：
纤维类型|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'process') {
    prompt = `你是一位玻纤工艺专家，请分享一个工艺技术知识。

要求：
1. 选择一个工艺主题：手糊工艺关键点、真空导入工艺（VIP）、缠绕工艺、喷射成型、拉挤工艺等
2. 内容要点：工艺流程和操作要点、参数控制、常见问题解决方案
3. 语言专业实用
4. 长度150-200字

格式：
工艺技术|工艺名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'application') {
    prompt = `你是一位玻纤应用专家，请分享一个玻纤应用领域的知识。

要求：
1. 选择一个应用主题：防腐工程、建筑景观、汽车轻量化、船舶、航空、电子电器等
2. 内容要点：应用的优势特点、典型产品、设计选材要点
3. 语言专业有深度
4. 长度150-200字

格式：
应用领域|应用名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'equipment') {
    prompt = `你是一位玻纤设备专家，请分享一个设备维护或操作知识。

要求：
1. 选择一个设备主题：喷射设备维护、固化炉温控、模具制作与保养、设备故障排除等
2. 内容要点：设备操作规范、日常维护要点、故障判断和解决
3. 语言实用接地气
4. 长度150-200字

格式：
设备维护|设备名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'quality') {
    prompt = `你是一位玻纤质量专家，请分享一个质量控制知识。

要求：
1. 选择一个质量主题：常见缺陷分析（气泡/分层/富树脂）、进厂原材料检验、力学性能测试、制品检测方法等
2. 内容要点：质量问题原因分析、预防措施、检测方法
3. 语言专业严谨
4. 长度150-200字

格式：
质量管理|质量主题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'safety') {
    prompt = `你是一位安全生产专家，请分享一个玻纤车间的安全规范知识。

要求：
1. 选择一个安全主题：职业健康防护（粉尘/苯乙烯）、易燃易爆品管理、MEKP固化剂安全操作、劳动防护用品选用等
2. 内容要点：安全风险识别、规范操作规程、应急处理措施
3. 语言严肃但易懂
4. 长度150-200字

格式：
安全规范|安全主题|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深玻纤达人，请分享一个实用的玻纤复合材料知识或技巧。

要求：
1. 领域随机选择：
   - 纤维类型：E玻/C玻、短切毡/连续毡、玻纤布选型、特种玻纤
   - 工艺技术：手糊工艺、真空导入（VIP）、缠绕工艺、喷射成型
   - 应用领域：防腐工程、建筑景观、汽车轻量化、船舶风电
   - 设备维护：喷射设备、固化炉、模具制作、故障排除
   - 质量管理：缺陷分析、原材料检验、性能测试
   - 安全规范：职业防护、溶剂安全、MEKP安全操作
2. 内容要点：专业知识讲解 + 实用操作技巧 + 常见问题解决
3. 语言专业但易懂
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      if (parts.length >= 3) {
        const fiber = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveFiberToCloud(fiber).catch(() => {})
        return fiber
      } else if (parts.length === 2) {
        const fiber = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveFiberToCloud(fiber).catch(() => {})
        return fiber
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成玻纤知识失败:', e)
  }

  const fallback = getRandomFiberFromLibrary()
  const result = {
    ...fallback,
    source: '玻纤知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveFiberToCloud(result).catch(() => {})
  return result
}

// ─── 树脂达人 ─────────────────────────────────────────────────

async function saveResinToCloud(resin) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyResins', 'title', resin.title)
  if (isExists) {
    console.log('[DailyContent] 树脂知识已存在，跳过保存:', resin.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyResins').add({
      data: {
        title: resin.title,
        category: resin.category,
        categoryIcon: resin.categoryIcon || '🧪',
        summary: resin.summary || '',
        tips: resin.tips || '',
        source: resin.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 树脂知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存树脂知识到云数据库失败:', e)
    return false
  }
}

function getRandomResinFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_RESIN.length)
  return { ...FALLBACK_RESIN[index] }
}

async function generateResin() {
  const field = RESIN_FIELDS[Math.floor(Math.random() * RESIN_FIELDS.length)]
  const promptTypes = ['default', 'type', 'handlayup', 'vacuum', 'mold', 'quality', 'safety']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'type') {
    prompt = `你是一位树脂材料专家，请分享一个树脂类型的知识。

要求：
1. 选择一个主题：不饱和聚酯树脂分类（邻苯/间苯/双酚A）、乙烯基酯vs环氧树脂对比、触变树脂应用、低粘度树脂选型等
2. 内容要点：类型性能对比、应用场景、选型建议
3. 语言专业易懂
4. 长度150-200字

格式：
树脂类型|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'handlayup') {
    prompt = `你是一位树脂工艺专家，请分享一个手糊工艺中树脂使用的知识。

要求：
1. 选择一个主题：促进剂固化剂配比、胶衣施工技巧、冬季夏季温度调节、树脂浸透操作规范等
2. 内容要点：操作方法、参数控制、问题预防
3. 语言实用易懂
4. 长度150-200字

格式：
手糊工艺|工艺名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'vacuum') {
    prompt = `你是一位真空工艺专家，请分享一个真空导入或RTM工艺的树脂知识。

要求：
1. 选择一个主题：真空导入树脂选择、RTM工艺参数控制、真空度与浸透、流道设计等
2. 内容要点：工艺原理、参数设定、常见问题
3. 语言专业有深度
4. 长度150-200字

格式：
真空工艺|工艺名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'mold') {
    prompt = `你是一位模具专家，请分享一个FRP模具制作的知识。

要求：
1. 选择一个主题：FRP模具制作流程、模具表面处理、快速模具vs量产模具、模具维护保养等
2. 内容要点：制作步骤、注意事项、维护方法
3. 语言实用
4. 长度150-200字

格式：
模具制作|模具主题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'quality') {
    prompt = `你是一位质量专家，请分享一个树脂或FRP制品质量控制的知识。

要求：
1. 选择一个主题：固化度检测方法、力学性能测试标准、巴氏硬度与固化度关系、质量问题分析等
2. 内容要点：检测方法、质量标准、问题原因分析
3. 语言专业严谨
4. 长度150-200字

格式：
质量控制|质量主题|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'safety') {
    prompt = `你是一位安全专家，请分享一个树脂使用中的安全防护知识。

要求：
1. 选择一个主题：苯乙烯危害与防护、MEKP固化剂危险性、皮肤接触应急处理、车间通风要求等
2. 内容要点：危险因素、预防措施、应急处理
3. language严肃易懂
4. 长度150-200字

格式：
安全防护|安全主题|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深树脂达人，请分享一个实用的不饱和聚酯树脂或FRP工艺知识。

要求：
1. 领域随机选择：
   - 树脂类型：UPR分类、VE/EP对比、触变性/粘度选择
   - 手糊工艺：固化剂配比、胶衣施工、温控技巧
   - 真空工艺：VIP、RTM工艺参数
   - 模具制作：FRP模具、模具维护
   - 质量控制：固化度检测、力学测试
   - 安全防护：苯乙烯、MEKP安全操作
2. 内容要点：专业知识 + 实用操作 + 问题解决
3. 语言专业易懂
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      if (parts.length >= 3) {
        const resin = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveResinToCloud(resin).catch(() => {})
        return resin
      } else if (parts.length === 2) {
        const resin = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveResinToCloud(resin).catch(() => {})
        return resin
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成树脂知识失败:', e)
  }

  const fallback = getRandomResinFromLibrary()
  const result = {
    ...fallback,
    source: '树脂知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveResinToCloud(result).catch(() => {})
  return result
}

// ─── 财税助手 ─────────────────────────────────────────────────

async function saveTaxToCloud(tax) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyTaxs', 'title', tax.title)
  if (isExists) {
    console.log('[DailyContent] 财税知识已存在，跳过保存:', tax.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTaxs').add({
      data: {
        title: tax.title,
        category: tax.category,
        categoryIcon: tax.categoryIcon || '📋',
        summary: tax.summary || '',
        tips: tax.tips || '',
        source: tax.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 财税知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存财税知识到云数据库失败:', e)
    return false
  }
}

function getRandomTaxFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_TAX.length)
  return { ...FALLBACK_TAX[index] }
}

async function generateTax() {
  const field = TAX_FIELDS[Math.floor(Math.random() * TAX_FIELDS.length)]
  const promptTypes = ['default', 'basic', 'planning', 'invoice', 'social', 'report', 'question']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'basic') {
    prompt = `你是一位税务专家，请分享一个增值税或所得税的基础知识。

要求：
1. 选择一个主题：小规模vs一般纳税人区别、增值税税率体系（13%/9%/6%）、企业所得税基础、小微优惠等
2. 内容要点：基本概念、计算方法、适用范围
3. 语言通俗易懂
4. 长度150-200字

格式：
税务基础|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'planning') {
    prompt = `你是一位税务筹划专家，请分享一个合法节税的知识。

要求：
1. 选择一个主题：税收洼地政策运用、高频业务发票节税策略、老板必知的税费优惠政策、研发费用加计扣除等
2. 内容要点：筹划方法、合规边界、实操建议
3. 语言实用
4. 长度150-200字

格式：
税务筹划|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'invoice') {
    prompt = `你是一位发票管理专家，请分享一个发票管理的知识。

要求：
1. 选择一个主题：专票vs普票差异、发票管理红线、发票合规审核要点、"三流一致"要求等
2. 内容要点：管理规定、操作规范、风险提示
3. 语言严谨实用
4. 长度150-200字

格式：
发票管理|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'social') {
    prompt = `你是一位社保公积金专家，请分享一个社保公积金的知识。

要求：
1. 选择一个主题：2024年社保基数与公积金缴存、灵活用工与社保合规、试用期社保规定、社保入税影响等
2. 内容要点：缴纳规则、操作规范、合规建议
3. 语言通俗
4. 长度150-200字

格式：
社保公积金|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'report') {
    prompt = `你是一位财务专家，请分享一个财务报表分析的知识。

要求：
1. 选择一个主题：资产负债表核心指标与预警、利润表结构与经营质量判断、流动比率/资产负债率解读等
2. 内容要点：指标含义、分析方法、预警信号
3. 语言专业易懂
4. 长度150-200字

格式：
财务报表|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'question') {
    prompt = `你是一位财税顾问，请分享一个企业常见的税务风险或财务处理问题。

要求：
1. 选择一个主题：十大税务风险点、会计账务处理常见错误、汇算清缴要点、金税四期预警等
2. 内容要点：风险识别、预防措施、正确做法
3. 语言实用
4. 长度150-200字

格式：
常见问题|问题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深财税顾问，请分享一个实用的企业财税管理知识。

要求：
1. 领域随机选择：
   - 税务基础：小规模/一般纳税人、增值税税率、企业所得税
   - 税务筹划：优惠政策、节税策略、合规边界
   - 发票管理：专票普票、红线合规、审核要点
   - 社保公积金：基数缴存、灵活就业、合规要求
   - 财务报表：资产负债表、利润表、指标分析
   - 常见问题：税务风险、账务处理、金税系统
2. 内容要点：专业讲解 + 实际案例 + 操作建议
3. 语言通俗易懂
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      if (parts.length >= 3) {
        const tax = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveTaxToCloud(tax).catch(() => {})
        return tax
      } else if (parts.length === 2) {
        const tax = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveTaxToCloud(tax).catch(() => {})
        return tax
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成财税知识失败:', e)
  }

  const fallback = getRandomTaxFromLibrary()
  const result = {
    ...fallback,
    source: '财税知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveTaxToCloud(result).catch(() => {})
  return result
}

// ─── 法律顾问 ─────────────────────────────────────────────────

async function saveLawToCloud(law) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyLaws', 'title', law.title)
  if (isExists) {
    console.log('[DailyContent] 法律知识已存在，跳过保存:', law.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLaws').add({
      data: {
        title: law.title,
        category: law.category,
        categoryIcon: law.categoryIcon || '⚖️',
        summary: law.summary || '',
        tips: law.tips || '',
        source: law.source || 'AI导师',
        date: new Date().toISOString().split('T')[0],
        createdAt: db.serverDate()
      }
    })
    console.log('[DailyContent] 法律知识已保存到云数据库')
    return true
  } catch (e) {
    console.error('[DailyContent] 保存法律知识到云数据库失败:', e)
    return false
  }
}

function getRandomLawFromLibrary() {
  const index = Math.floor(Math.random() * FALLBACK_LAW.length)
  return { ...FALLBACK_LAW[index] }
}

async function generateLaw() {
  const field = LAW_FIELDS[Math.floor(Math.random() * LAW_FIELDS.length)]
  const promptTypes = ['default', 'contract', 'labor', 'ip', 'company', 'civil', 'risk']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'contract') {
    prompt = `你是一位企业法务专家，请分享一个合同签订或审查的知识。

要求：
1. 选择一个主题：合同签订致命陷阱、买卖合同核心条款、口头vs书面合同效力、合同管辖约定等
2. 内容要点：法律风险点、正确做法、实用建议
3. 语言专业易懂
4. 长度150-200字

格式：
合同审查|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'labor') {
    prompt = `你是一位劳动法律师，请分享一个劳动关系管理的知识。

要求：
1. 选择一个主题：员工入职到离职合规要点、经济补偿金计算、工伤认定标准、试用期规定等
2. 内容要点：法律规定、操作规范、风险提示
3. 语言实用
4. 长度150-200字

格式：
劳动法务|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'ip') {
    prompt = `你是一位知识产权律师，请分享一个知识产权保护的知识。

要求：
1. 选择一个主题：企业商标保护策略、软件著作权vs商业秘密、专利申请规划、专利vs商业秘密选择等
2. 内容要点：保护方法、申请流程、策略建议
3. 语言专业
4. 长度150-200字

格式：
知识产权|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'company') {
    prompt = `你是一位公司法务专家，请分享一个公司治理的法律知识。

要求：
1. 选择一个主题：股权转让与优先购买权、公司担保的法律风险、对赌协议效力、股东权利义务等
2. 内容要点：法律规定、风险分析、合规建议
3. 语言专业严谨
4. 长度150-200字

格式：
公司法务|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'civil') {
    prompt = `你是一位民事法律专家，请分享一个民事纠纷处理的知识。

要求：
1. 选择一个主题：民间借贷法律要点、诉讼时效的正确理解、证据保全、诉讼管辖等
2. 内容要点：法律规定、实操技巧、风险提示
3. 语言实用易懂
4. 长度150-200字

格式：
民事纠纷|主题名称|正文内容

直接输出，不要任何前缀：`
  } else if (promptType === 'risk') {
    prompt = `你是一位企业合规专家，请分享一个企业法律风险防范的知识。

要求：
1. 选择一个主题：企业家刑事法律红线、虚开发票风险、职务侵占防范、企业合规体系建立等
2. 内容要点：法律红线、风险识别、预防措施
3. 语言严肃有警示性
4. 长度150-200字

格式：
风险防范|主题名称|正文内容

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位资深法律顾问，请分享一个实用的企业经营或个人权益法律知识。

要求：
1. 领域随机选择：
   - 合同审查：签订陷阱、条款要点、口头效力
   - 劳动法务：入职离职、补偿金计算、工伤认定
   - 知识产权：商标保护、著作权、商业秘密、专利
   - 公司法务：股权转让、担保、对赌协议
   - 民事纠纷：民间借贷、诉讼时效、证据保全
   - 风险防范：刑事红线、合规体系、职务侵占
2. 内容要点：法律规定 + 真实案例 + 实操建议
3. 语言专业但易懂
4. 长度150-200字

格式：
分类名称|标题|正文内容

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]

  try {
    const result = await callAI(messages, { temperature: 0.8, maxTokens: 500 })
    if (result && result.length > 20) {
      const parts = result.split('|').map(p => p.trim()).filter(p => p)
      if (parts.length >= 3) {
        const law = {
          category: parts[0] || field.name,
          categoryIcon: field.icon,
          title: parts[1].trim(),
          summary: parts.slice(2).join('|').trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveLawToCloud(law).catch(() => {})
        return law
      } else if (parts.length === 2) {
        const law = {
          category: field.name,
          categoryIcon: field.icon,
          title: parts[0].trim(),
          summary: parts[1].trim(),
          source: 'AI导师',
          isAIGenerated: true,
          date: new Date().toISOString().split('T')[0]
        }
        saveLawToCloud(law).catch(() => {})
        return law
      }
    }
  } catch (e) {
    console.error('[DailyContent] 生成法律知识失败:', e)
  }

  const fallback = getRandomLawFromLibrary()
  const result = {
    ...fallback,
    source: '法律知识库',
    isAIGenerated: false,
    date: new Date().toISOString().split('T')[0]
  }
  saveLawToCloud(result).catch(() => {})
  return result
}

// ─── 官场达人 ─────────────────────────────────────────────────

async function saveOfficialToCloud(item) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyOfficials', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 官场达人已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyOfficials').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存官场达人到云失败:', e.message)
  }
}

async function generateOfficial() {
  const field = OFFICIAL_FIELDS[Math.floor(Math.random() * OFFICIAL_FIELDS.length)]
  const promptTypes = ['official', 'wisdom', 'career']
  const promptType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

  let prompt
  if (promptType === 'official') {
    prompt = `你是一位博学多才的人生导师，擅长分享官场智慧和处世哲学。请分享一条关于"${field.name}"的官场智慧。

要求：
1. 标题简短有吸引力，8-15个字
2. 内容150-200字，包含具体案例或故事，结尾要有升华
3. 实用建议：以"💡"开头，30-50字
4. 4个精炼标签

格式：
官场达人|${field.name}|标题|正文内容|💡实用建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`
  } else if (promptType === 'wisdom') {
    prompt = `你是一个精通人情世故的智者。请分享一个关于"${field.name}"的处世智慧。

要求：
1. 标题简洁有力，8-15个字
2. 内容150-200字，包含具体方法和注意事项
3. 实用建议：以"💡"开头，30-50字
4. 4个精炼标签

格式：
处世智慧|${field.name}|标题|正文内容|💡实用建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`
  } else {
    prompt = `你是一位职场老手。请分享一个关于"${field.name}"的职场技巧。

要求：
1. 标题简洁有力，8-15个字
2. 内容150-200字，包含实用方法和案例
3. 实用建议：以"💡"开头，30-50字
4. 4个精炼标签

格式：
职场技巧|${field.name}|标题|正文内容|💡实用建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`
  }

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: field.name,
        categoryIcon: '🎩',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_OFFICIAL[Math.floor(Math.random() * FALLBACK_OFFICIAL.length)]
    result = {
      category: field.name,
      categoryIcon: '🎩',
      title: fallback.title,
      summary: fallback.content,
      tips: '💡 持续学习，不断提升自己',
      tags: [field.name, '成长', '智慧'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveOfficialToCloud(result).catch(() => {})
  return result
}

// ─── 处事达人 ─────────────────────────────────────────────────

async function saveHandlingToCloud(item) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyHandlings', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 处事达人已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyHandlings').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存处事达人到云失败:', e.message)
  }
}

async function generateHandling() {
  const field = HANDLING_FIELDS[Math.floor(Math.random() * HANDLING_FIELDS.length)]
  const prompt = `你是一个精通人情世故的智者，擅长分享办事技巧和处世之道。请分享一个关于"${field.name}"的处事技巧。

要求：
1. 标题简洁有力，8-15个字，点明核心技巧
2. 内容150-200字，包含具体方法和注意事项，结尾要有升华
3. 办事建议：以"💎"开头，30-50字
4. 4个精炼标签

格式：
处事达人|${field.name}|标题|正文内容|💎办事建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: field.name,
        categoryIcon: '💎',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_HANDLING[Math.floor(Math.random() * FALLBACK_HANDLING.length)]
    result = {
      category: field.name,
      categoryIcon: '💎',
      title: fallback.title,
      summary: fallback.content,
      tips: '💎 细心观察，用心沟通',
      tags: [field.name, '处事', '智慧'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveHandlingToCloud(result).catch(() => {})
  return result
}

// ─── 花艺达人 ─────────────────────────────────────────────────

async function saveFloralToCloud(item) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyFlorals', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 花艺达人已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFlorals').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存花艺达人到云失败:', e.message)
  }
}

async function generateFloral() {
  const field = FLORAL_FIELDS[Math.floor(Math.random() * FLORAL_FIELDS.length)]
  const prompt = `你是一个专业的花艺师，热爱插花艺术和花卉文化。请分享一个关于"${field.name}"的花艺知识。

要求：
1. 标题优美简洁，8-15个字，体现花艺美感
2. 内容150-200字，包含养护要点或插花技巧，结尾要有感悟
3. 养花建议：以"💐"开头，30-50字
4. 4个精炼标签

格式：
花艺达人|${field.name}|标题|正文内容|💐养花建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: field.name,
        categoryIcon: '💐',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_FLORAL[Math.floor(Math.random() * FALLBACK_FLORAL.length)]
    result = {
      category: field.name,
      categoryIcon: '💐',
      title: fallback.title,
      summary: fallback.content,
      tips: '💐 用心感受花的美丽',
      tags: [field.name, '花艺', '养护'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveFloralToCloud(result).catch(() => {})
  return result
}

// ─── 历史典故达人 ─────────────────────────────────────────────────

async function saveHistoryToCloud(item) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyHistorys', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 历史典故已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyHistorys').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存历史典故到云失败:', e.message)
  }
}

async function generateHistory() {
  const field = HISTORY_FIELDS[Math.floor(Math.random() * HISTORY_FIELDS.length)]
  const prompt = `你是一个博古通今的历史学者，擅长讲述有趣的历史故事和典故。请分享一个关于"${field.name}"的历史典故。

要求：
1. 标题有历史感，8-15个字，让人想一探究竟
2. 内容150-200字，包含历史背景、人物故事、事件经过，结尾要有感悟启示
3. 感悟启发：以"📚"开头，30-50字
4. 4个精炼标签

格式：
历史典故|${field.name}|标题|正文内容|📚感悟启发|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: field.name,
        categoryIcon: '📚',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_HISTORY[Math.floor(Math.random() * FALLBACK_HISTORY.length)]
    result = {
      category: field.name,
      categoryIcon: '📚',
      title: fallback.title,
      summary: fallback.content,
      tips: '📚 以史为鉴，可以知兴替',
      tags: [field.name, '历史', '典故'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveHistoryToCloud(result).catch(() => {})
  return result
}

// ─── 军事达人 ─────────────────────────────────────────────────

async function saveMilitaryToCloud(item) {
  // 去重检查：以标题作为唯一标识
  const isExists = await checkContentExists('dailyMilitarys', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 军事达人已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMilitarys').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存军事达人到云失败:', e.message)
  }
}

async function generateMilitary() {
  const field = MILITARY_FIELDS[Math.floor(Math.random() * MILITARY_FIELDS.length)]
  const prompt = `你是一个研究军事历史的专家，对战略战术有独到见解。请分享一个关于"${field.name}"的军事知识。

要求：
1. 标题有气势，8-15个字，体现军事主题
2. 内容150-200字，包含战术分析或战例解读，结尾要有战略启示
3. 战略建议：以"🎖️"开头，30-50字
4. 4个精炼标签

格式：
军事达人|${field.name}|标题|正文内容|🎖️战略建议|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: field.name,
        categoryIcon: '🎖️',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_MILITARY[Math.floor(Math.random() * FALLBACK_MILITARY.length)]
    result = {
      category: field.name,
      categoryIcon: '🎖️',
      title: fallback.title,
      summary: fallback.content,
      tips: '🎖️ 知己知彼，百战不殆',
      tags: [field.name, '军事', '战略'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveMilitaryToCloud(result).catch(() => {})
  return result
}

// ─── 股票期货专家 ─────────────────────────────────────────────────

async function saveStockToCloud(item) {
  const isExists = await checkContentExists('dailyStocks', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 股票期货已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  try {
    const db = wx.cloud.database()
    await db.collection('dailyStocks').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存股票期货到云失败:', e.message)
  }
}

async function generateStock() {
  const category = STOCK_CATEGORIES[Math.floor(Math.random() * STOCK_CATEGORIES.length)]
  const prompt = `你是一位资深股票期货分析师，拥有丰富的投资实战经验。请分享一个关于"${category.name}"的投资知识。

要求：
1. 标题专业醒目，8-15个字，简洁有力
2. 内容200-300字，包含核心概念讲解、实战应用、风险提示，结尾要有投资建议
3. 要点提示：以"📈"开头，50字左右
4. 4个精炼标签

格式：
股票期货|${category.name}|标题|正文内容|📈要点提示|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: category.name,
        categoryIcon: '📈',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_STOCKS[Math.floor(Math.random() * FALLBACK_STOCKS.length)]
    result = {
      category: category.name,
      categoryIcon: '📈',
      title: fallback.title,
      summary: fallback.content,
      tips: '📈 投资有风险，入市需谨慎',
      tags: [category.name, '股票', '期货'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveStockToCloud(result).catch(() => {})
  return result
}

// ─── 经济学专家 ─────────────────────────────────────────────────

async function saveEconomicsToCloud(item) {
  const isExists = await checkContentExists('dailyEconomics', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 经济学已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  try {
    const db = wx.cloud.database()
    await db.collection('dailyEconomics').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存经济学到云失败:', e.message)
  }
}

async function generateEconomics() {
  const category = ECONOMICS_CATEGORIES[Math.floor(Math.random() * ECONOMICS_CATEGORIES.length)]
  const prompt = `你是一位知名经济学家，擅长用通俗易懂的语言讲解经济现象。请分享一个关于"${category.name}"的经济学知识。

要求：
1. 标题有深度，8-15个字，体现经济学智慧
2. 内容200-300字，包含理论讲解、现实案例、实践意义，结尾要有启示
3. 经济洞察：以"💰"开头，50字左右
4. 4个精炼标签

格式：
经济学|${category.name}|标题|正文内容|💰经济洞察|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: category.name,
        categoryIcon: '💰',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_ECONOMICS[Math.floor(Math.random() * FALLBACK_ECONOMICS.length)]
    result = {
      category: category.name,
      categoryIcon: '💰',
      title: fallback.title,
      summary: fallback.content,
      tips: '💰 经济学就在我们身边',
      tags: [category.name, '经济', '分析'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveEconomicsToCloud(result).catch(() => {})
  return result
}

// ─── 生意人助手 ─────────────────────────────────────────────────

async function saveBusinessToCloud(item) {
  const isExists = await checkContentExists('dailyBusinesss', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 生意人已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  try {
    const db = wx.cloud.database()
    await db.collection('dailyBusinesss').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存生意人到云失败:', e.message)
  }
}

async function generateBusiness() {
  const category = BUSINESS_CATEGORIES[Math.floor(Math.random() * BUSINESS_CATEGORIES.length)]
  const prompt = `你是一位成功的民营企业家，有多年创业和经营经验。请分享一个关于"${category.name}"的商业智慧。

要求：
1. 标题接地气，8-15个字，体现实战经验
2. 内容200-300字，包含核心要点、实操方法、避坑指南，结尾要有金句
3. 生意经：以"💼"开头，50字左右
4. 4个精炼标签

格式：
生意经|${category.name}|标题|正文内容|💼生意经|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: category.name,
        categoryIcon: '💼',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_BUSINESS[Math.floor(Math.random() * FALLBACK_BUSINESS.length)]
    result = {
      category: category.name,
      categoryIcon: '💼',
      title: fallback.title,
      summary: fallback.content,
      tips: '💼 诚信经营，久久为功',
      tags: [category.name, '商业', '经营'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveBusinessToCloud(result).catch(() => {})
  return result
}

// ─── 新闻助手 ─────────────────────────────────────────────────

async function saveNewsToCloud(item) {
  const isExists = await checkContentExists('dailyNewss', 'title', item.title)
  if (isExists) {
    console.log('[DailyContent] 新闻已存在，跳过保存:', item.title.substring(0, 20))
    return false
  }
  try {
    const db = wx.cloud.database()
    await db.collection('dailyNewss').add({ data: item })
  } catch (e) {
    console.error('[DailyContent] 保存新闻到云失败:', e.message)
  }
}

async function generateNews() {
  const category = NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)]
  const prompt = `你是一位资深财经记者，对国内外大事有敏锐洞察力。请分享一个关于"${category.name}"的热点解读。

要求：
1. 标题吸引眼球，8-15个字，体现新闻价值
2. 内容200-300字，包含事件背景、影响分析、发展趋势，结尾要有观点
3. 深度点评：以"📰"开头，50字左右
4. 4个精炼标签

格式：
新闻解读|${category.name}|标题|正文内容|📰深度点评|标签1|标签2|标签3|标签4

直接输出，不要任何前缀：`

  const messages = [{ role: 'user', content: prompt }]
  const rawText = await callAI(messages)

  let result
  if (rawText) {
    const parts = rawText.split('|')
    if (parts.length >= 5) {
      const content = parts.slice(3, -4).join('|')
      result = {
        category: category.name,
        categoryIcon: '📰',
        title: parts[2],
        summary: content,
        tips: parts[parts.length - 4],
        tags: parts.slice(-3),
        isAIGenerated: true,
        date: new Date().toISOString().split('T')[0]
      }
    }
  }

  if (!result) {
    const fallback = FALLBACK_NEWS[Math.floor(Math.random() * FALLBACK_NEWS.length)]
    result = {
      category: category.name,
      categoryIcon: '📰',
      title: fallback.title,
      summary: fallback.content,
      tips: '📰 关注时事，把握机遇',
      tags: [category.name, '新闻', '热点'],
      isAIGenerated: false,
      date: new Date().toISOString().split('T')[0]
    }
  }
  saveNewsToCloud(result).catch(() => {})
  return result
}

// ─── 云数据库去重工具方法 ─────────────────────────────────────────────────

/**
 * 所有模块的云数据库集合配置
 * collection: 集合名称
 * uniqueField: 唯一标识字段（用于去重判断）
 */
const COLLECTION_CONFIGS = [
  { collection: 'dailyQuotes', uniqueField: 'content' },
  { collection: 'dailyJokes', uniqueField: 'title' },
  { collection: 'dailyPsychology', uniqueField: 'title' },
  { collection: 'dailyFinance', uniqueField: 'title' },
  { collection: 'dailyLoves', uniqueField: 'content' },
  { collection: 'dailyMovies', uniqueField: 'title' },
  { collection: 'dailyMusics', uniqueField: 'title' },
  { collection: 'dailyTechs', uniqueField: 'title' },
  { collection: 'dailyTcms', uniqueField: 'title' },
  { collection: 'dailyTravels', uniqueField: 'title' },
  { collection: 'dailyFortunes', uniqueField: 'title' },
  { collection: 'dailyLiteratures', uniqueField: 'author' },
  { collection: 'dailyForeignTrades', uniqueField: 'title' },
  { collection: 'dailyECommerces', uniqueField: 'title' },
  { collection: 'dailyMaths', uniqueField: 'title' },
  { collection: 'dailyEnglishes', uniqueField: 'title' },
  { collection: 'dailyProgrammings', uniqueField: 'title' },
  { collection: 'dailyPhotographies', uniqueField: 'title' },
  { collection: 'dailyBeauties', uniqueField: 'title' },
  { collection: 'dailyInvestments', uniqueField: 'title' },
  { collection: 'dailyFishings', uniqueField: 'title' },
  { collection: 'dailyFitnesses', uniqueField: 'title' },
  { collection: 'dailyPets', uniqueField: 'title' },
  { collection: 'dailyFashions', uniqueField: 'title' },
  { collection: 'dailyOutfits', uniqueField: 'title' },
  { collection: 'dailyDecorations', uniqueField: 'title' },
  { collection: 'dailyGlassFibers', uniqueField: 'title' },
  { collection: 'dailyResins', uniqueField: 'title' },
  { collection: 'dailyTaxs', uniqueField: 'title' },
  { collection: 'dailyLaws', uniqueField: 'title' },
  { collection: 'dailyOfficials', uniqueField: 'title' },
  { collection: 'dailyHandlings', uniqueField: 'title' },
  { collection: 'dailyFlorals', uniqueField: 'title' },
  { collection: 'dailyHistorys', uniqueField: 'title' },
  { collection: 'dailyMilitarys', uniqueField: 'title' },
]

/**
 * 去除指定集合中的重复记录
 * @param {string} collectionName - 集合名称
 * @param {string} uniqueField - 唯一标识字段
 * @returns {Promise<object>} - 返回删除结果统计 { total, duplicates, deleted }
 */
async function removeDuplicatesFromCollection(collectionName, uniqueField) {
  const result = { total: 0, duplicates: 0, deleted: 0 }
  
  try {
    const db = wx.cloud.database()
    const _ = db.command
    
    // 获取集合中所有记录
    const res = await db.collection(collectionName).get()
    const records = res.data || []
    result.total = records.length
    
    if (records.length <= 1) {
      console.log(`[DailyContent] ${collectionName} 无重复记录（共${records.length}条）`)
      return result
    }
    
    // 使用 Map 按唯一字段分组，记录每个值的文档ID列表
    const fieldMap = new Map()
    
    for (const record of records) {
      const fieldValue = record[uniqueField]
      if (!fieldValue) continue  // 跳过没有唯一标识字段的记录
      
      if (!fieldMap.has(fieldValue)) {
        fieldMap.set(fieldValue, [])
      }
      fieldMap.get(fieldValue).push(record._id)
    }
    
    // 找出重复的记录，保留第一条，删除其余
    const idsToDelete = []
    
    for (const [fieldValue, ids] of fieldMap) {
      if (ids.length > 1) {
        // 保留第一个，标记其余为删除
        idsToDelete.push(...ids.slice(1))
        result.duplicates += ids.length - 1
      }
    }
    
    // 批量删除重复记录（每次最多删除20条）
    const batchSize = 20
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize)
      try {
        await db.collection(collectionName).where({
          _id: _.in(batch)
        }).remove()
        result.deleted += batch.length
      } catch (e) {
        console.error(`[DailyContent] 删除${collectionName}重复记录失败:`, e.message)
      }
    }
    
    console.log(`[DailyContent] ${collectionName} 去重完成: 总共${result.total}条, 发现重复${result.duplicates}条, 已删除${result.deleted}条`)
    
  } catch (e) {
    console.error(`[DailyContent] 处理${collectionName}失败:`, e.message)
  }
  
  return result
}

/**
 * 去除所有模块云数据库中的重复记录
 * @param {function} onProgress - 进度回调函数 (collectionName, progress, total) => void
 * @returns {Promise<object>} - 返回总体删除结果统计
 */
async function removeAllDuplicates(onProgress) {
  const overallResult = { collections: 0, totalRecords: 0, totalDuplicates: 0, totalDeleted: 0 }
  const results = []
  
  for (let i = 0; i < COLLECTION_CONFIGS.length; i++) {
    const config = COLLECTION_CONFIGS[i]
    
    // 回调进度
    if (onProgress) {
      onProgress(config.collection, i + 1, COLLECTION_CONFIGS.length)
    }
    
    // 处理每个集合
    const result = await removeDuplicatesFromCollection(config.collection, config.uniqueField)
    results.push({
      collection: config.collection,
      ...result
    })
    
    overallResult.collections++
    overallResult.totalRecords += result.total
    overallResult.totalDuplicates += result.duplicates
    overallResult.totalDeleted += result.deleted
  }
  
  console.log('[DailyContent] ════════════════════════════════════')
  console.log('[DailyContent] 所有模块去重完成!')
  console.log(`[DailyContent] 处理集合数: ${overallResult.collections}`)
  console.log(`[DailyContent] 总记录数: ${overallResult.totalRecords}`)
  console.log(`[DailyContent] 发现重复: ${overallResult.totalDuplicates}`)
  console.log(`[DailyContent] 已删除重复: ${overallResult.totalDeleted}`)
  console.log('[DailyContent] ════════════════════════════════════')
  
  return {
    ...overallResult,
    results  // 详细结果
  }
}

/**
 * 检查指定集合的去重情况（不删除）
 * @returns {Promise<object>} - 返回各集合的重复情况
 */
async function checkDuplicates() {
  const checkResult = { collections: 0, totalRecords: 0, totalDuplicates: 0 }
  const details = []
  
  for (const config of COLLECTION_CONFIGS) {
    try {
      const db = wx.cloud.database()
      const res = await db.collection(config.collection).get()
      const records = res.data || []
      
      const fieldMap = new Map()
      let duplicates = 0
      
      for (const record of records) {
        const fieldValue = record[config.uniqueField]
        if (!fieldValue) continue
        
        if (!fieldMap.has(fieldValue)) {
          fieldMap.set(fieldValue, 0)
        }
        fieldMap.set(fieldValue, fieldMap.get(fieldValue) + 1)
      }
      
      // 计算重复数量
      for (const count of fieldMap.values()) {
        if (count > 1) {
          duplicates += count - 1
        }
      }
      
      details.push({
        collection: config.collection,
        total: records.length,
        duplicates: duplicates
      })
      
      checkResult.collections++
      checkResult.totalRecords += records.length
      checkResult.totalDuplicates += duplicates
      
    } catch (e) {
      console.error(`[DailyContent] 检查${config.collection}失败:`, e.message)
      details.push({
        collection: config.collection,
        error: e.message
      })
    }
  }
  
  console.log('[DailyContent] ════════════════════════════════════')
  console.log('[DailyContent] 重复数据检查结果:')
  console.log(`[DailyContent] 检查集合数: ${checkResult.collections}`)
  console.log(`[DailyContent] 总记录数: ${checkResult.totalRecords}`)
  console.log(`[DailyContent] 发现重复: ${checkResult.totalDuplicates}`)
  console.log('[DailyContent] ════════════════════════════════════')
  
  return {
    ...checkResult,
    details
  }
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
    generateProgramming,
    generatePhotography,
    generateBeauty,
    generateInvestment,
    generateFishing,
    generateFitness,
    generatePet,
    generateFashion,
    generateOutfit,
    generateDecoration,
    generateFiber,
    generateResin,
    generateTax,
    generateLaw,
    generateOfficial,
    generateHandling,
    generateFloral,
    generateHistory,
    generateMilitary,
    generateStock,
    generateEconomics,
    generateBusiness,
    generateNews,
  },
  // 云数据库去重工具方法
  removeAllDuplicates,
  removeDuplicatesFromCollection,
  checkDuplicates,
  COLLECTION_CONFIGS,
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
  PROGRAMMING_CATEGORIES,
  FALLBACK_PROGRAMMING,
  PHOTOGRAPHY_FIELDS,
  FALLBACK_PHOTOGRAPHY,
  BEAUTY_FIELDS,
  FALLBACK_BEAUTY,
  INVESTMENT_FIELDS,
  FALLBACK_INVESTMENT,
  FISHING_FIELDS,
  FALLBACK_FISHING,
  FITNESS_FIELDS,
  FALLBACK_FITNESS,
  // 新增4个模块
  STOCK_CATEGORIES,
  FALLBACK_STOCKS,
  ECONOMICS_CATEGORIES,
  FALLBACK_ECONOMICS,
  BUSINESS_CATEGORIES,
  FALLBACK_BUSINESS,
  NEWS_CATEGORIES,
  FALLBACK_NEWS,
}
