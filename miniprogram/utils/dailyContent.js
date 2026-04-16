/**
 * utils/dailyContent.js - 每日内容客户端生成模块 (重构版)
 * 
 * 功能：客户端直接调用 AI 生成每日内容
 * 使用 wx.cloud.extend.AI.createModel() 进行流式调用
 * 
 * 数据来源：云端 aiPrompts.json (prompts/aiPrompts.json)
 * 
 * 使用方式：
 *   const { DailyContent } = require('./dailyContent.js')
 *   const content = await DailyContent.generateQuote(onChunk, onDone)
 */

const AI_CONFIG = require('./aiConfig.js')
const cloudData = require('./cloudData.js')

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
  } catch (err) {
    console.error('[DailyContent] AI调用失败:', err)
    throw err
  }
}

/**
 * 构建用户消息
 */
function buildUserMessage(prompt) {
  return {
    role: 'user',
    content: prompt
  }
}

/**
 * 格式化日期
 */
function formatDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// ─── 各模块生成函数 ─────────────────────────────────────────────────

// 本地备用提示词（确保即使 cloudData 未初始化也能工作）- 统一200-500字
const LOCAL_PROMPTS_FALLBACK = {
  quote: {
    generate: "你是一位文学大师。请生成经典名言或诗句，要求有深度，启迪人心，涵盖古今中外。内容长度200-500字。输出JSON：{\"title\":\"作者名\",\"content\":\"名言200-500字\",\"source\":\"出处\",\"era\":\"古代/现代\",\"region\":\"国内/国外\"}",
    share: "「{content}」\\n—— {title}"
  },
  joke: {
    generate: "你是一位幽默段子手。请生成幽默段子，贴近生活，有趣但不低俗。内容长度200-500字。输出JSON：{\"title\":\"段子标题\",\"content\":\"段子正文200-500字\"}",
    share: "{content}"
  },
  psychology: {
    generate: "你是一位资深心理咨询师。请分享心理学知识，介绍经典心理学效应，解释原理，举例说明，提供应用方法。内容长度200-500字。输出JSON：{\"title\":\"心理效应\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🧠【心理学】{title}\\n\\n{content}"
  },
  finance: {
    generate: "你是一位资深金融顾问。请分享实用的金融知识，解释金融概念，提供理财建议。内容长度200-500字。输出JSON：{\"title\":\"主题\",\"content\":\"详细解释200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
    share: "💳【金融】{title}\\n\\n{content}"
  },
  love: {
    generate: "你是一位情感作家。请写温暖人心的情感语录，表达对爱情/亲情/友情的感悟，真诚动人。内容长度200-500字。输出JSON：{\"author\":\"署名\",\"content\":\"正文200-500字\",\"category\":\"情感类型\",\"subtitle\":\"一句话15字内\"}",
    share: "💕 {content}"
  },
  movie: {
    generate: "你是一位资深影评人。请推荐电影，介绍基本信息，分析亮点，说明推荐理由和适合人群。内容长度200-500字。输出JSON：{\"title\":\"电影名\",\"content\":\"推荐理由200-500字\",\"category\":\"类型\",\"director\":\"导演\",\"subtitle\":\"一句话15字内\"}",
    share: "🎬【{title}】\\n\\n{content}\\n\\n#电影推荐"
  },
  music: {
    generate: "你是一位资深音乐评论人。请推荐歌曲，介绍创作背景，分析歌词和旋律，分享推荐理由。内容长度200-500字。输出JSON：{\"title\":\"歌名\",\"artist\":\"歌手\",\"content\":\"推荐理由200-500字\",\"album\":\"专辑\",\"subtitle\":\"一句话15字内\"}",
    share: "🎵【{title}】\\n\\n{content}\\n\\n#音乐分享"
  },
  tech: {
    generate: "你是一位科技记者。请分享科技前沿动态，介绍背景和原理，分析对未来影响。内容长度200-500字。输出JSON：{\"title\":\"新闻标题\",\"content\":\"详细介绍200-500字\",\"category\":\"科技领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🔬【科技前沿】{title}\\n\\n{content}"
  },
  tcm: {
    generate: "你是一位资深中医师。请分享中医养生知识，介绍养生方法和操作步骤，说明适用人群和注意事项。内容长度200-500字。输出JSON：{\"title\":\"养生主题\",\"content\":\"详细介绍200-500字\",\"category\":\"养生领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🍃【中医养生】{title}\\n\\n{content}"
  },
  travel: {
    generate: "你是一位资深旅行家。请推荐旅行目的地，介绍景点、美食、文化体验，提供实用建议。内容长度200-500字。输出JSON：{\"title\":\"目的地\",\"content\":\"旅行攻略200-500字\",\"location\":\"位置\",\"subtitle\":\"一句话15字内\"}",
    share: "🌍【{title}】旅行推荐\\n\\n{content}\\n\\n#旅行攻略"
  },
  fortune: {
    generate: "你是一位玄学研究者。请生成今日运势分析，从事业、财运、感情、健康多维度分析，给出开运建议。内容长度200-500字。输出JSON：{\"title\":\"星座/生肖\",\"content\":\"运势分析200-500字\",\"luckyDirection\":\"方位\",\"luckyNumber\":\"数字\",\"luckyColor\":\"颜色\"}",
    share: "🔮【{title}】今日运势\\n\\n{content}"
  },
  english: {
    generate: "你是一位英语教学专家。请分享实用的英语知识点，解释含义用法，提供例句，说明使用场景。内容长度200-500字。输出JSON：{\"title\":\"知识点\",\"content\":\"详细解释200-500字\",\"category\":\"英语领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🇬🇧【英语学习】{title}\\n\\n{content}"
  },
  fitness: {
    generate: "你是一位资深健身教练。请分享健身知识，说明动作要领、呼吸方法、发力技巧，指出常见错误。内容长度200-500字。输出JSON：{\"title\":\"动作名称\",\"content\":\"训练指南200-500字\",\"category\":\"健身领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🏋️【健身指导】{title}\\n\\n{content}"
  },
  news: {
    generate: "你是一位资深新闻编辑。请总结今日重要新闻，介绍背景、经过、影响。内容长度200-500字。输出JSON：{\"title\":\"今日要闻\",\"content\":\"新闻分析200-500字\",\"category\":\"新闻\",\"subtitle\":\"一句话15字内\"}",
    share: "📰【今日要闻】\\n\\n{content}"
  },
  apple: {
    generate: "你是一位苹果开发专家。请分享iOS/Swift开发知识点，介绍原理和应用场景，提供实用技巧。内容长度200-500字。输出JSON：{\"title\":\"知识点\",\"content\":\"详细介绍200-500字\",\"category\":\"所属领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🍎【苹果开发】{title}\\n\\n{content}"
  },
  growth: {
    generate: "你是一位市场品牌增长专家。请分享增长营销知识，介绍方法论，提供实操技巧和成功案例。内容长度200-500字。输出JSON：{\"title\":\"增长主题\",\"content\":\"详细介绍200-500字\",\"category\":\"所属领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🚀【市场增长】{title}\\n\\n{content}"
  },
  uiDesigner: {
    generate: "你是一位资深UI设计师。请分享UI设计知识，介绍设计原则和原理，说明操作步骤和设计要点。内容长度200-500字。输出JSON：{\"title\":\"设计主题\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
    share: "🎨【UI设计】{title}\\n\\n{content}"
  },
  futures: {
    generate: "你是一位资深大宗贸易期货专家。请分享期货交易知识，介绍期货品种原理，说明分析要点和实战技巧，强调风险管理。内容长度200-500字。输出JSON：{\"title\":\"期货主题\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
    share: "📊【大宗期货】{title}\\n\\n{content}"
  }
}

/**
 * 获取模块提示词（从云端，带本地备用）
 */
function getPrompt(moduleId) {
  // 优先从 cloudData 获取（如果已初始化）
  const cloudPrompt = cloudData.getPrompt(moduleId)
  if (cloudPrompt) return cloudPrompt
  
  // 回退到本地备用提示词
  const localPrompt = LOCAL_PROMPTS_FALLBACK[moduleId]
  if (localPrompt) {
    console.log(`[DailyContent] 使用本地备用提示词: ${moduleId}`)
    return localPrompt
  }
  
  return null
}

// ─── AI 输出解析 ────────────────────────────────────────────────────

/**
 * 解析 AI 返回的 JSON 文本
 * @param {string} text - AI 原始输出
 * @returns {object|null} 解析后的 JSON 对象
 */
function parseAIJson(text) {
  if (!text) return null
  
  // 尝试提取 JSON 代码块
  let jsonStr = text.trim()
  
  // 处理 ```json ... ``` 格式
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }
  
  // 尝试直接解析
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    // 尝试提取 { ... } 部分
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0])
      } catch (e2) {
        console.warn('[DailyContent] JSON 解析失败:', braceMatch[0].substring(0, 100))
      }
    }
  }
  return null
}

/**
 * 统一内容格式 - 将 AI 输出转换为标准格式
 * 统一规范：所有模块必须包含 title 和 content
 * 兼容兜底数据字段名
 */
function normalizeContent(moduleId, aiResult) {
  const json = typeof aiResult === 'string' ? parseAIJson(aiResult) : aiResult
  if (!json) return null
  
  const today = new Date().toISOString().split('T')[0]
  
  switch (moduleId) {
    case 'quote':
      return {
        // 核心字段
        title: json.author || json.title || json.作者 || '',
        content: json.content || json.quote || json.text || aiResult,
        text: json.content || json.quote || json.text || aiResult, // 模板读取字段
        // 附加字段
        subtitle: json.source || json.book || json['出处'] || '',
        category: json.category || json.分类 || '名言',
        categoryIcon: getCategoryIcon(json.category),
        era: json.era === '古代' || json.era === '古代' ? 'ancient' : 'modern',
        region: json.region === '国外' || json.region === '外国' ? 'foreign' : 'china',
        date: today,
        isAIGenerated: true
      }
      
    case 'joke':
      return {
        title: json.title || '段子',
        content: json.content || json.joke || json.text || aiResult,
        scene: json.scene || json.category || '生活',
        sceneIcon: json.sceneIcon || getSceneIcon(json.scene),
        date: today,
        isAIGenerated: true
      }
      
    case 'psychology':
      return {
        title: json.title || json.name || json.field || '心理效应',
        content: json.content || json.summary || json.explanation || json['原理'] || aiResult,
        // 兼容兜底数据的 field 字段
        field: json.field || json.category || '心理学',
        category: json.category || json.field || '心理学',
        categoryIcon: '🧠',
        summary: json.summary || json.explanation || '',
        explanation: json.explanation || '',
        example: json.example || json['例子'] || '',
        application: json.application || json['应用'] || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'finance':
      return {
        title: json.title || json.theme || '金融知识',
        content: json.content || json.summary || aiResult,
        category: json.category || '金融',
        categoryIcon: '💰',
        summary: json.summary || json.content || '',
        advice: json.advice || json.tip || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'love':
      return {
        title: json.author || json.title || '',
        content: json.content || json.text || aiResult,
        text: json.content || json.text || aiResult, // 模板读取字段
        // 兼容兜底数据的 author 和 source
        author: json.author || json.title || '',
        source: json.source || '',
        category: json.category || '情话',
        categoryIcon: '💕',
        date: today,
        isAIGenerated: true
      }
      
    case 'movie':
      return {
        title: json.title || json.name || '电影推荐',
        content: json.content || json.summary || json.reason || aiResult,
        // 兼容兜底数据的 genre
        category: json.category || json.type || json.genre || '电影',
        genre: json.genre || json.category || '电影',
        genreIcon: json.genreIcon || '🎬',
        categoryIcon: json.categoryIcon || '🎬',
        rating: json.rating || '',
        director: json.director || '',
        year: json.year || '',
        summary: json.summary || json.content || '',
        quote: json.quote || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'music':
      return {
        title: json.title || json.song || '歌曲推荐',
        content: json.content || json.reason || aiResult,
        summary: json.summary || json.content || '', // 模板读取字段
        description: json.content || json.reason || '', // 模板读取字段
        artist: json.artist || '',
        category: json.category || json.genre || '音乐',
        categoryIcon: '🎵',
        year: json.year || '',
        album: json.album || '',
        lyric: json.lyric || '',
        duration: json.duration || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'tech':
      return {
        title: json.title || '科技前沿',
        content: json.content || json.summary || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '科技',
        categoryIcon: '🚀',
        significance: json.significance || json['意义'] || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'tcm':
      return {
        title: json.title || '中医养生',
        content: json.content || json.summary || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '养生',
        categoryIcon: '🌿',
        method: json.method || json.steps || '',
        caution: json.caution || json.note || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'travel':
      return {
        title: json.title || '目的地',
        content: json.content || json.summary || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '旅行',
        categoryIcon: '✈️',
        location: json.location || '',
        tips: json.tips || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'english':
      return {
        title: json.title || json.word || '英语知识点',
        content: json.content || json.summary || json.example || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '英语',
        categoryIcon: '🔤',
        meaning: json.meaning || '',
        usage: json.usage || '',
        example: json.example || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'fitness':
      return {
        title: json.title || json.name || '健身动作',
        content: json.content || json.summary || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '健身',
        categoryIcon: '💪',
        steps: json.steps || '',
        caution: json.caution || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'fortune':
      return {
        title: json.title || '运势',
        content: json.content || json.summary || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '星座',
        categoryIcon: '🔮',
        luckyDirection: json.luckyDirection || json['luckyDirection'] || '',
        luckyNumber: json.luckyNumber || json['luckyNumber'] || '',
        luckyColor: json.luckyColor || json['luckyColor'] || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'news':
      return {
        title: json.title || '今日要闻',
        content: json.content || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || '资讯',
        categoryIcon: '📰',
        keywords: json.keywords || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'literature':
      return {
        title: json.title || '文学赏析',
        content: json.content || json.text || aiResult,
        summary: json.summary || json.content || '', // 模板读取字段
        author: json.author || '',
        era: json.era || '',
        region: json.region || '',
        quote: json.quote || '',
        category: json.category || '文学',
        categoryIcon: '📚',
        works: json.works || [],
        date: today,
        isAIGenerated: true
      }
      
    // 以下模块尚未定义单独的处理，统一使用通用格式
    case 'foreignTrade':
    case 'ecommerce':
    case 'math':
    case 'photography':
    case 'beauty':
    case 'investment':
    case 'fishing':
    case 'pet':
    case 'fashion':
    case 'outfit':
    case 'decoration':
    case 'glassFiber':
    case 'resin':
    case 'tax':
    case 'law':
    case 'official':
    case 'handling':
    case 'floral':
    case 'history':
    case 'military':
    case 'stock':
    case 'economics':
    case 'business':
      return {
        title: json.title || json.name || moduleId,
        content: json.content || json.text || aiResult,
        summary: json.summary || json.content || json.text || '',
        category: json.category || '',
        categoryIcon: json.categoryIcon || '📌',
        tips: json.tips || json.advice || '',
        date: today,
        isAIGenerated: true
      }
      
    case 'programming':
      return {
        title: json.title || '编程概念',
        content: json.content || json.text || aiResult,
        summary: json.content || json.text || '',  // 编程模块用 content 作为 summary
        category: '编程',
        categoryIcon: '💻',
        date: today,
        isAIGenerated: true
      }

    case 'apple':
      return {
        title: json.title || '苹果开发',
        content: json.content || json.text || aiResult,
        summary: json.summary || json.content || '',
        category: json.category || 'iOS开发',
        categoryIcon: '🍎',
        date: today,
        isAIGenerated: true
      }
      
    default:
      // 通用格式
      return {
        title: json.title || '内容',
        content: json.content || json.text || aiResult,
        date: today,
        isAIGenerated: true
      }
  }
}

/**
 * 获取分类图标
 */
function getCategoryIcon(category) {
  const icons = {
    '古诗词': '📜', '唐诗': '📜', '宋词': '📜', '诗词': '📜',
    '现代名言': '💬', '名言': '💬',
    '外国名言': '📚', '外国': '📚',
    '人生哲理': '✨', '哲理': '✨'
  }
  return icons[category] || '📌'
}

/**
 * 获取场景图标
 */
function getSceneIcon(scene) {
  const icons = {
    '职场': '💼', '工作': '💼',
    '生活': '🏠', '日常': '🏠',
    '校园': '📚', '学校': '📚',
    '社交': '👫', '人际': '👫'
  }
  return icons[scene] || '💬'
}

// ─── 统一生成函数 ──────────────────────────────────────────────────

/**
 * 统一的内容生成器
 * @param {string} moduleId - 模块ID
 * @param {string} userPrompt - 用户提示词
 * @param {function} onChunk - 流式回调
 * @param {number} maxTokens - 最大token数
 */
async function generateContent(moduleId, userPrompt, onChunk, maxTokens = 500) {
  const messages = [buildUserMessage(userPrompt)]
  
  let fullText = ''
  
  const handleChunk = (text) => {
    fullText += text
    onChunk && onChunk(fullText)
  }
  
  const result = await callAIStream(messages, handleChunk, { maxTokens })
  
  // 统一格式
  const content = normalizeContent(moduleId, result)
  if (!content) {
    throw new Error(`${moduleId} 格式解析失败`)
  }
  
  return content
}

// ─── 名言生成 ─────────────────────────────────────────────────────

const DailyContent = {
  /**
   * 生成今日名言
   */
  async generateQuote(onChunk, onDone) {
    const promptData = getPrompt('quote')
    if (!promptData) {
      throw new Error('获取名言提示词失败')
    }
    
    const today = formatDate()
    const userPrompt = promptData.generate.replace('{今日日期}', today)
    const messages = [buildUserMessage(userPrompt)]
    
    let fullText = ''
    
    const handleChunk = (text) => {
      fullText += text
      onChunk && onChunk(fullText)
    }
    
    const result = await callAIStream(messages, handleChunk, { maxTokens: 800 })
    
    // 统一格式
    const content = normalizeContent('quote', result)
    if (!content) {
      throw new Error('名言格式解析失败')
    }
    
    onDone && onDone(content)
    return content
  },

  /**
   * 生成今日段子
   */
  async generateJoke(onChunk, onDone) {
    const promptData = getPrompt('joke')
    if (!promptData) {
      throw new Error('获取段子提示词失败')
    }
    
    const today = formatDate()
    const userPrompt = promptData.generate.replace('{今日日期}', today)
    const messages = [buildUserMessage(userPrompt)]
    
    let fullText = ''
    
    const handleChunk = (text) => {
      fullText += text
      onChunk && onChunk(fullText)
    }
    
    const result = await callAIStream(messages, handleChunk, { maxTokens: 800 })
    
    // 统一格式
    const content = normalizeContent('joke', result)
    if (!content) {
      throw new Error('段子格式解析失败')
    }
    
    onDone && onDone(content)
    return content
  },

  /**
   * 生成心理学知识
   */
  async generatePsychology(onChunk, onDone) {
    const promptData = getPrompt('psychology')
    if (!promptData) throw new Error('获取心理学提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('psychology', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成金融知识
   */
  async generateFinance(onChunk, onDone) {
    const promptData = getPrompt('finance')
    if (!promptData) throw new Error('获取金融提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('finance', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成情话
   */
  async generateLove(onChunk, onDone) {
    const promptData = getPrompt('love')
    if (!promptData) throw new Error('获取情话提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('love', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成电影推荐
   */
  async generateMovie(onChunk, onDone) {
    const promptData = getPrompt('movie')
    if (!promptData) throw new Error('获取电影提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('movie', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成音乐推荐
   */
  async generateMusic(onChunk, onDone) {
    const promptData = getPrompt('music')
    if (!promptData) throw new Error('获取音乐提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('music', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成科技前沿
   */
  async generateTech(onChunk, onDone) {
    const promptData = getPrompt('tech')
    if (!promptData) throw new Error('获取科技提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('tech', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成中医养生
   */
  async generateTCM(onChunk, onDone) {
    const promptData = getPrompt('tcm')
    if (!promptData) throw new Error('获取中医提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('tcm', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  // 别名（小写）- 兼容 dailyCard 调用
  async generateTcm(onChunk, onDone) {
    return this.generateTCM(onChunk, onDone)
  },

  /**
   * 生成旅行推荐
   */
  async generateTravel(onChunk, onDone) {
    const promptData = getPrompt('travel')
    if (!promptData) throw new Error('获取旅行提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('travel', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成运势分析
   */
  async generateFortune(onChunk, onDone) {
    const promptData = getPrompt('fortune')
    if (!promptData) {
      throw new Error('获取运势提示词失败')
    }
    
    const today = formatDate()
    const userPrompt = promptData.generate.replace('{今日日期}', today)
    const content = await generateContent('fortune', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成文学赏析
   */
  async generateLiterature(onChunk, onDone) {
    const promptData = getPrompt('literature')
    if (!promptData) throw new Error('获取文学提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('literature', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成外贸资讯
   */
  async generateForeignTrade(onChunk, onDone) {
    const promptData = getPrompt('foreignTrade')
    if (!promptData) throw new Error('获取外贸提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('foreignTrade', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成电商知识
   */
  async generateECommerce(onChunk, onDone) {
    const promptData = getPrompt('ecommerce')
    if (!promptData) throw new Error('获取电商提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('ecommerce', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成数学趣题
   */
  async generateMath(onChunk, onDone) {
    const promptData = getPrompt('math')
    if (!promptData) throw new Error('获取数学提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('math', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成英语知识
   */
  async generateEnglish(onChunk, onDone) {
    const promptData = getPrompt('english')
    if (!promptData) throw new Error('获取英语提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('english', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成编程概念
   */
  async generateProgramming(onChunk, onDone) {
    const promptData = getPrompt('programming')
    if (!promptData) throw new Error('获取编程提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('programming', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成摄影技巧
   */
  async generatePhotography(onChunk, onDone) {
    const promptData = getPrompt('photography')
    if (!promptData) throw new Error('获取摄影提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('photography', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成美容护肤
   */
  async generateBeauty(onChunk, onDone) {
    const promptData = getPrompt('beauty')
    if (!promptData) throw new Error('获取美容提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('beauty', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成投资理财
   */
  async generateInvestment(onChunk, onDone) {
    const promptData = getPrompt('investment')
    if (!promptData) throw new Error('获取投资提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('investment', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成钓鱼技巧
   */
  async generateFishing(onChunk, onDone) {
    const promptData = getPrompt('fishing')
    if (!promptData) throw new Error('获取钓鱼提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('fishing', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成健身知识
   */
  async generateFitness(onChunk, onDone) {
    const promptData = getPrompt('fitness')
    if (!promptData) throw new Error('获取健身提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('fitness', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成宠物知识
   */
  async generatePet(onChunk, onDone) {
    const promptData = getPrompt('pet')
    if (!promptData) throw new Error('获取宠物提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('pet', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成时尚知识
   */
  async generateFashion(onChunk, onDone) {
    const promptData = getPrompt('fashion')
    if (!promptData) throw new Error('获取时尚提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('fashion', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成穿搭推荐
   */
  async generateOutfit(onChunk, onDone) {
    const promptData = getPrompt('outfit')
    if (!promptData) throw new Error('获取穿搭提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('outfit', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成家居装饰
   */
  async generateDecoration(onChunk, onDone) {
    const promptData = getPrompt('decoration')
    if (!promptData) throw new Error('获取家居提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('decoration', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成玻纤知识
   */
  async generateGlassFiber(onChunk, onDone) {
    const promptData = getPrompt('glassFiber')
    if (!promptData) throw new Error('获取玻纤提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('glassFiber', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  // 别名（小写）- 兼容 dailyCard 调用
  async generateFiber(onChunk, onDone) {
    return this.generateGlassFiber(onChunk, onDone)
  },

  /**
   * 生成树脂工艺
   */
  async generateResin(onChunk, onDone) {
    const promptData = getPrompt('resin')
    if (!promptData) throw new Error('获取树脂提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('resin', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成税务知识
   */
  async generateTax(onChunk, onDone) {
    const promptData = getPrompt('tax')
    if (!promptData) throw new Error('获取税务提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('tax', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成法律常识
   */
  async generateLaw(onChunk, onDone) {
    const promptData = getPrompt('law')
    if (!promptData) throw new Error('获取法律提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('law', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成政务服务
   */
  async generateOfficial(onChunk, onDone) {
    const promptData = getPrompt('official')
    if (!promptData) throw new Error('获取政务提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('official', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成处事指南
   */
  async generateHandling(onChunk, onDone) {
    const promptData = getPrompt('handling')
    if (!promptData) throw new Error('获取处事提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('handling', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成花卉养护
   */
  async generateFloral(onChunk, onDone) {
    const promptData = getPrompt('floral')
    if (!promptData) throw new Error('获取花卉提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('floral', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成历史故事
   */
  async generateHistory(onChunk, onDone) {
    const promptData = getPrompt('history')
    if (!promptData) throw new Error('获取历史提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('history', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成军事动态
   */
  async generateMilitary(onChunk, onDone) {
    const promptData = getPrompt('military')
    if (!promptData) throw new Error('获取军事提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('military', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成股票知识
   */
  async generateStock(onChunk, onDone) {
    const promptData = getPrompt('stock')
    if (!promptData) throw new Error('获取股票提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('stock', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成经济学知识
   */
  async generateEconomics(onChunk, onDone) {
    const promptData = getPrompt('economics')
    if (!promptData) throw new Error('获取经济学提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('economics', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成商业洞察
   */
  async generateBusiness(onChunk, onDone) {
    const promptData = getPrompt('business')
    if (!promptData) throw new Error('获取商业提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('business', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成新闻摘要
   */
  async generateNews(onChunk, onDone) {
    const promptData = getPrompt('news')
    if (!promptData) throw new Error('获取新闻提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('news', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成果核学堂 - Apple开发知识
   */
  async generateApple(onChunk, onDone) {
    const promptData = getPrompt('apple')
    if (!promptData) throw new Error('获取果核学堂提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('apple', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成市场品牌增长专家
   */
  async generateGrowth(onChunk, onDone) {
    const promptData = getPrompt('growth')
    if (!promptData) throw new Error('获取市场增长提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('growth', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成UI设计师专家
   */
  async generateUiDesigner(onChunk, onDone) {
    const promptData = getPrompt('uiDesigner')
    if (!promptData) throw new Error('获取UI设计提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('uiDesigner', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 生成大宗贸易期货专家
   */
  async generateFutures(onChunk, onDone) {
    const promptData = getPrompt('futures')
    if (!promptData) throw new Error('获取期货提示词失败')
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent('futures', userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  },

  /**
   * 通用生成函数（根据模块ID）
   */
  async generate(moduleId, onChunk, onDone) {
    const methodName = 'generate' + moduleId.charAt(0).toUpperCase() + moduleId.slice(1)
    
    if (typeof DailyContent[methodName] === 'function') {
      return DailyContent[methodName](onChunk, onDone)
    }
    
    // 使用通用AI调用
    const promptData = getPrompt(moduleId)
    if (!promptData) {
      throw new Error(`获取 ${moduleId} 提示词失败`)
    }
    
    const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
    const content = await generateContent(moduleId, userPrompt, onChunk, 800)
    onDone && onDone(content)
    return content
  }
}

module.exports = {
  DailyContent
}
