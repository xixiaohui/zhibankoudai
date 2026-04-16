/**
 * utils/cloudData.js - 云端数据加载器 (完整版)
 * 
 * 统一数据架构：
 * - modules/index.json: 模块索引（基础信息）
 * - config/homeModules.json: 首页模块配置（顺序、启用状态）
 * - modules/{id}.json: 各模块详细配置（分类、备用数据、AI提示词）
 * - prompts/aiPrompts.json: AI提示词
 * 
 * 使用方式：
 *   const cloudData = require('./cloudData.js')
 *   
 *   // 初始化（App启动时调用）
 *   await cloudData.init()
 *   
 *   // 获取模块配置（完整样式）
 *   const config = cloudData.getModuleConfig('quote')
 *   
 *   // 获取模块数据
 *   const data = cloudData.getModule('quote')
 *   data.fallback  // 备用数据
 *   data.fields    // 分类字段
 *   
 *   // 获取AI提示词
 *   const prompt = cloudData.getPrompt('quote')
 *   
 *   // 获取首页模块列表
 *   const homeModules = cloudData.getHomeModules()
 */

// 云存储路径配置（注意：不需要完整cloud://前缀，downloadFile会自动拼接）
const CLOUD_PATH = {
  INDEX: 'cloudData/modules/index.json',
  MODULE: (id) => `cloudData/modules/${id}.json`,
  APP_CONFIG: 'cloudData/config/appConfig.json',
  HOME_MODULES: 'cloudData/config/homeModules.json',
  AI_PROMPTS: 'cloudData/prompts/aiPrompts.json'
}

// 云环境ID
const CLOUD_ENV = 'zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762'

// 内存缓存
let moduleCache = {}       // { moduleId: moduleData }
let indexCache = null      // 模块索引
let appConfigCache = null  // 全局配置
let homeConfigCache = null // 首页配置
let promptsCache = null    // AI提示词
let isInitialized = false
let initPromise = null

// ─── 本地备用配置（云存储不可用时使用）─────────────────────────────

// 本地首页模块配置
const LOCAL_HOME_MODULES = {
  version: "1.0.0",
  updated: "2026-04-15",
  modules: [
    { id: "quote", enabled: true, order: 1 },
    { id: "joke", enabled: true, order: 2 },
    { id: "psychology", enabled: true, order: 3 },
    { id: "finance", enabled: true, order: 4 },
    { id: "love", enabled: true, order: 5 },
    { id: "movie", enabled: true, order: 6 },
    { id: "music", enabled: true, order: 7 },
    { id: "tech", enabled: true, order: 8 },
    { id: "tcm", enabled: true, order: 9 },
    { id: "travel", enabled: true, order: 10 },
    { id: "fortune", enabled: false, order: 11 },
    { id: "literature", enabled: false, order: 12 },
    { id: "english", enabled: true, order: 13 },
    { id: "fitness", enabled: true, order: 14 },
    { id: "food", enabled: true, order: 15 },
    { id: "history", enabled: false, order: 16 },
    { id: "news", enabled: true, order: 17 },
    { id: "apple", enabled: true, order: 18 },
  ]
}

// 本地应用配置
const LOCAL_APP_CONFIG = {
  version: "1.0.0",
  appName: "智伴口袋",
  updateUrl: ""
}

// 本地AI提示词（云端不可用时的备用）- 统一200-500字
const LOCAL_PROMPTS = {
  prompts: {
    quote: {
      generate: "你是一位文学大师。请生成经典名言或诗句，要求有深度，启迪人心，涵盖古今中外。内容长度200-500字。输出JSON：{\"title\":\"作者名\",\"content\":\"名言200-500字\",\"source\":\"出处\",\"era\":\"古代/现代\",\"region\":\"国内/国外\"}",
      share: "「{content}」\\n—— {title}"
    },
    joke: {
      generate: "你是一位幽默段子手。请生成幽默段子，贴近生活，有趣但不低俗。内容长度200-500字。输出JSON：{\"title\":\"段子标题\",\"content\":\"段子正文200-500字\"}",
      share: "{content}"
    },
    psychology: {
      generate: "你是一位资深心理咨询师。请分享心理学知识，介绍经典心理学效应，解释原理，举例说明，提供应用方法。内容长度200-500字。输出JSON：{\"title\":\"心理效应\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话总结15字内\"}",
      share: "🧠【心理学】{title}\\n\\n{content}"
    },
    finance: {
      generate: "你是一位资深金融顾问。请分享实用的金融知识，解释金融概念，提供理财建议。内容长度200-500字。输出JSON：{\"title\":\"主题\",\"content\":\"详细解释200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话总结15字内\"}",
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
  },
  system: {
    temperature: 0.7,
    maxTokens: 600,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.2
  }
}

// ─── 颜色辅助函数 ────────────────────────────────────────────────
/**
 * 根据主色生成完整的颜色配置
 */
function generateColors(primary) {
  // 将 hex 颜色转为 rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 100, g: 100, b: 150 }
  }
  
  const rgb = hexToRgb(primary)
  const rgba = (a) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`
  
  // 计算浅色变体
  const lightR = Math.min(255, rgb.r + 50)
  const lightG = Math.min(255, rgb.g + 50)
  const lightB = Math.min(255, rgb.b + 50)
  
  return {
    primary: primary,
    accent: primary,
    text: '#333333',
    textSecondary: '#666666',
    bg: rgba(0.1),
    shadow: rgba(0.15),
    gradientStart: '#FFFFFF',
    gradientEnd: `rgb(${lightR}, ${lightG}, ${lightB})`
  }
}

// ─── 默认模块样式配置（用于快速渲染）─────────────────────────────
const DEFAULT_STYLES = {
  quote: {
    id: 'quote', name: '时光絮语', icon: '📜', color: '#7C6AFF',
    storageKey: 'dailyQuote', posterType: 'quote', slogan: '让智慧照亮生活',
    refreshText: '换一句', loadingText: '名言正在送达...', placeholderText: '点击「换一句」让AI为你创作名言',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI', era: 'era', region: 'region' },
    colors: generateColors('#7C6AFF')
  },
  joke: {
    id: 'joke', name: '段子时光', icon: '😂', color: '#FF9A76',
    storageKey: 'dailyJoke', posterType: 'joke', slogan: '笑一笑，十年少',
    refreshText: '换一个', loadingText: '段子正在赶来的路上...', placeholderText: '点击「换一个」让AI为你创作段子',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#FF9A76')
  },
  psychology: {
    id: 'psychology', name: '心理解析', icon: '🧠', color: '#9B59B6',
    storageKey: 'dailyPsychology', posterType: 'psychology', slogan: '读懂内心，遇见更好的自己',
    refreshText: '换一个', loadingText: '正在分析...', placeholderText: '点击「换一个」获取心理学知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#9B59B6')
  },
  finance: {
    id: 'finance', name: '财富视窗', icon: '💹', color: '#27AE60',
    storageKey: 'dailyFinance', posterType: 'finance', slogan: '洞察财富趋势',
    refreshText: '换一条', loadingText: '财经要闻加载中...', placeholderText: '点击「换一条」获取财经资讯',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#27AE60')
  },
  love: {
    id: 'love', name: '甜蜜时刻', icon: '💕', color: '#E91E63',
    storageKey: 'dailyLove', posterType: 'love', slogan: '爱要大声说出来',
    refreshText: '换一句', loadingText: '甜蜜情话生成中...', placeholderText: '点击「换一句」让AI为你写情话',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#E91E63')
  },
  movie: {
    id: 'movie', name: '光影世界', icon: '🎬', color: '#3498DB',
    storageKey: 'dailyMovie', posterType: 'movie', slogan: '光影人生，品味百态',
    refreshText: '换一部', loadingText: '好片推荐生成中...', placeholderText: '点击「换一部」获取电影推荐',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI', rating: 'rating', director: 'director' },
    colors: generateColors('#3498DB')
  },
  music: {
    id: 'music', name: '音乐时光', icon: '🎵', color: '#F39C12',
    storageKey: 'dailyMusic', posterType: 'music', slogan: '音乐是灵魂的粮食',
    refreshText: '换一首', loadingText: '好歌正在播放...', placeholderText: '点击「换一首」获取音乐推荐',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#F39C12')
  },
  tech: {
    id: 'tech', name: '科技前沿', icon: '🚀', color: '#1ABC9C',
    storageKey: 'dailyTech', posterType: 'tech', slogan: '科技改变世界',
    refreshText: '换一条', loadingText: '科技前沿加载中...', placeholderText: '点击「换一条」获取科技资讯',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#1ABC9C')
  },
  tcm: {
    id: 'tcm', name: '中医养生', icon: '🌿', color: '#2ECC71',
    storageKey: 'dailyTcm', posterType: 'tcm', slogan: '传承千年中医智慧',
    refreshText: '换一条', loadingText: '养生知识加载中...', placeholderText: '点击「换一条」获取养生知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#2ECC71')
  },
  travel: {
    id: 'travel', name: '旅行日记', icon: '✈️', color: '#E67E22',
    storageKey: 'dailyTravel', posterType: 'travel', slogan: '世界那么大，我想去看看',
    refreshText: '换一处', loadingText: '旅行攻略生成中...', placeholderText: '点击「换一处」获取旅行推荐',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#E67E22')
  },
  fortune: {
    id: 'fortune', name: '每日一卦', icon: '☯️', color: '#8E44AD',
    storageKey: 'dailyFortune', posterType: 'fortune', slogan: '知命而行，顺势而为',
    refreshText: '再算一卦', loadingText: '卦象解读中...', placeholderText: '点击「再算一卦」获取今日运势',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#8E44AD')
  },
  literature: {
    id: 'literature', name: '文学殿堂', icon: '📚', color: '#D35400', storageKey: 'dailyLiterature', posterType: 'literature',
    refreshText: '换一篇', loadingText: '文学作品加载中...', placeholderText: '点击「换一篇」获取文学推荐',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#D35400')
  },
  foreignTrade: {
    id: 'foreignTrade', name: '外贸助手', icon: '🌐', color: '#16A085', storageKey: 'dailyForeignTrade', posterType: 'foreignTrade',
    refreshText: '换一条', loadingText: '外贸知识加载中...', placeholderText: '点击「换一条」获取外贸知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#16A085')
  },
  ecommerce: {
    id: 'ecommerce', name: '电商运营', icon: '🛒', color: '#2980B9', storageKey: 'dailyEcommerce', posterType: 'ecommerce',
    refreshText: '换一条', loadingText: '运营知识加载中...', placeholderText: '点击「换一条」获取电商运营知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#2980B9')
  },
  math: {
    id: 'math', name: '数学达人', icon: '📐', color: '#8E44AD', storageKey: 'dailyMath', posterType: 'math',
    refreshText: '换一道', loadingText: '数学题目加载中...', placeholderText: '点击「换一道」获取数学知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#8E44AD')
  },
  english: {
    id: 'english', name: '英语达人', icon: '🔤', color: '#C0392B', storageKey: 'dailyEnglish', posterType: 'english',
    refreshText: '换一句', loadingText: '英语知识加载中...', placeholderText: '点击「换一句」获取英语知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#C0392B')
  },
  programming: {
    id: 'programming', name: '编程导师', icon: '💻', color: '#27AE60', storageKey: 'dailyProgramming', posterType: 'programming',
    refreshText: '换一条', loadingText: '编程知识加载中...', placeholderText: '点击「换一条」获取编程技巧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#27AE60')
  },
  photography: {
    id: 'photography', name: '摄影大师', icon: '📷', color: '#D68910', storageKey: 'dailyPhotography', posterType: 'photography',
    refreshText: '换一条', loadingText: '摄影技巧加载中...', placeholderText: '点击「换一条」获取摄影技巧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#D68910')
  },
  beauty: {
    id: 'beauty', name: '美妆达人', icon: '💄', color: '#F38D9C', storageKey: 'dailyBeauty', posterType: 'beauty',
    refreshText: '换一条', loadingText: '美妆知识加载中...', placeholderText: '点击「换一条」获取美妆技巧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#F38D9C')
  },
  investment: {
    id: 'investment', name: '投资顾问', icon: '📈', color: '#1E8449', storageKey: 'dailyInvestment', posterType: 'investment',
    refreshText: '换一条', loadingText: '投资知识加载中...', placeholderText: '点击「换一条」获取投资建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#1E8449')
  },
  fishing: {
    id: 'fishing', name: '钓鱼达人', icon: '🎣', color: '#3498DB', storageKey: 'dailyFishing', posterType: 'fishing',
    refreshText: '换一条', loadingText: '钓鱼技巧加载中...', placeholderText: '点击「换一条」获取钓鱼技巧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#3498DB')
  },
  fitness: {
    id: 'fitness', name: '健身教练', icon: '💪', color: '#E74C3C', storageKey: 'dailyFitness', posterType: 'fitness',
    refreshText: '换一条', loadingText: '健身知识加载中...', placeholderText: '点击「换一条」获取健身建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#E74C3C')
  },
  pet: {
    id: 'pet', name: '宠物专家', icon: '🐾', color: '#9B59B6', storageKey: 'dailyPet', posterType: 'pet',
    refreshText: '换一条', loadingText: '宠物知识加载中...', placeholderText: '点击「换一条」获取宠物知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#9B59B6')
  },
  fashion: {
    id: 'fashion', name: '时尚教主', icon: '👗', color: '#F39C12', storageKey: 'dailyFashion', posterType: 'fashion',
    refreshText: '换一条', loadingText: '时尚资讯加载中...', placeholderText: '点击「换一条」获取时尚建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#F39C12')
  },
  outfit: {
    id: 'outfit', name: '穿搭指南', icon: '👔', color: '#E91E63', storageKey: 'dailyOutfit', posterType: 'outfit',
    refreshText: '换一套', loadingText: '穿搭推荐加载中...', placeholderText: '点击「换一套」获取穿搭建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#E91E63')
  },
  decoration: {
    id: 'decoration', name: '装修顾问', icon: '🏠', color: '#795548', storageKey: 'dailyDecoration', posterType: 'decoration',
    refreshText: '换一条', loadingText: '装修知识加载中...', placeholderText: '点击「换一条」获取装修建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#795548')
  },
  glassFiber: {
    id: 'glassFiber', name: '玻纤专家', icon: '🧵', color: '#607D8B', storageKey: 'dailyGlassFiber', posterType: 'glassFiber',
    refreshText: '换一条', loadingText: '玻纤知识加载中...', placeholderText: '点击「换一条」获取玻纤知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#607D8B')
  },
  resin: {
    id: 'resin', name: '树脂达人', icon: '🧪', color: '#00BCD4', storageKey: 'dailyResin', posterType: 'resin',
    refreshText: '换一条', loadingText: '树脂知识加载中...', placeholderText: '点击「换一条」获取树脂知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#00BCD4')
  },
  tax: {
    id: 'tax', name: '财税顾问', icon: '📋', color: '#FF5722', storageKey: 'dailyTax', posterType: 'tax',
    refreshText: '换一条', loadingText: '财税知识加载中...', placeholderText: '点击「换一条」获取财税建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#FF5722')
  },
  law: {
    id: 'law', name: '法律顾问', icon: '⚖️', color: '#455A64', storageKey: 'dailyLaw', posterType: 'law',
    refreshText: '换一条', loadingText: '法律知识加载中...', placeholderText: '点击「换一条」获取法律知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#455A64')
  },
  official: {
    id: 'official', name: '职场达人', icon: '🎩', color: '#2196F3', storageKey: 'dailyOfficial', posterType: 'official',
    refreshText: '换一条', loadingText: '职场知识加载中...', placeholderText: '点击「换一条」获取职场建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#2196F3')
  },
  handling: {
    id: 'handling', name: '处事高手', icon: '💎', color: '#4CAF50', storageKey: 'dailyHandling', posterType: 'handling',
    refreshText: '换一条', loadingText: '处事技巧加载中...', placeholderText: '点击「换一条」获取处事建议',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#4CAF50')
  },
  floral: {
    id: 'floral', name: '花艺师', icon: '💐', color: '#E91E63', storageKey: 'dailyFloral', posterType: 'floral',
    refreshText: '换一条', loadingText: '花艺知识加载中...', placeholderText: '点击「换一条」获取花艺技巧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#E91E63')
  },
  history: {
    id: 'history', name: '历史明镜', icon: '📜', color: '#795548', storageKey: 'dailyHistory', posterType: 'history',
    refreshText: '换一篇', loadingText: '历史知识加载中...', placeholderText: '点击「换一篇」获取历史典故',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#795548')
  },
  military: {
    id: 'military', name: '军事观察', icon: '🎖️', color: '#607D8B', storageKey: 'dailyMilitary', posterType: 'military',
    refreshText: '换一条', loadingText: '军事资讯加载中...', placeholderText: '点击「换一条」获取军事观察',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
    colors: generateColors('#607D8B')
  },
  stock: {
    id: 'stock', name: '股海明灯', icon: '📈', color: '#F44336', storageKey: 'dailyStock', posterType: 'stock',
    refreshText: '换一条', loadingText: '股票分析加载中...', placeholderText: '点击「换一条」获取股票分析',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI专家' },
    colors: generateColors('#F44336')
  },
  economics: {
    id: 'economics', name: '经济视窗', icon: '💰', color: '#FF9800', storageKey: 'dailyEconomics', posterType: 'economics',
    refreshText: '换一条', loadingText: '经济分析加载中...', placeholderText: '点击「换一条」获取经济视点',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI专家' },
    colors: generateColors('#FF9800')
  },
  business: {
    id: 'business', name: '商道智慧', icon: '💼', color: '#673AB7', storageKey: 'dailyBusiness', posterType: 'business',
    refreshText: '换一条', loadingText: '商业智慧加载中...', placeholderText: '点击「换一条」获取商业智慧',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI导师' },
    colors: generateColors('#673AB7')
  },
  news: {
    id: 'news', name: '资讯前沿', icon: '📰', color: '#00BCD4', storageKey: 'dailyNews', posterType: 'news',
    refreshText: '换一条', loadingText: '资讯加载中...', placeholderText: '点击「换一条」获取最新资讯',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI解读' },
    colors: generateColors('#00BCD4')
  },
  apple: {
    id: 'apple', name: '果核学堂', icon: '🍎', color: '#007AFF', storageKey: 'dailyApple', posterType: 'apple',
    refreshText: '换一条', loadingText: '苹果开发专家正在为你讲解...', placeholderText: '点击「换一条」学习苹果开发知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI专家' },
    colors: generateColors('#007AFF')
  },
  growth: {
    id: 'growth', name: '市场品牌增长专家', icon: '🚀', color: '#E91E63', storageKey: 'dailyGrowth', posterType: 'growth',
    refreshText: '换一条', loadingText: '增长专家正在为你分析...', placeholderText: '点击「换一条」获取增长策略',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: '增长专家' },
    colors: generateColors('#E91E63')
  },
  uiDesigner: {
    id: 'uiDesigner', name: 'UI设计师专家', icon: '🎨', color: '#9C27B0', storageKey: 'dailyUiDesigner', posterType: 'uiDesigner',
    refreshText: '换一条', loadingText: 'UI设计专家正在为你讲解...', placeholderText: '点击「换一条」获取设计灵感',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: '设计专家' },
    colors: generateColors('#9C27B0')
  },
  futures: {
    id: 'futures', name: '大宗贸易期货专家', icon: '📊', color: '#FF5722', storageKey: 'dailyFutures', posterType: 'futures',
    refreshText: '换一条', loadingText: '期货专家正在为你分析...', placeholderText: '点击「换一条」获取期货知识',
    tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: '期货专家' },
    colors: generateColors('#FF5722')
  }
}

/**
 * 初始化 - 加载所有配置
 */
function init() {
  if (initPromise) return initPromise
  
  initPromise = Promise.all([
    loadIndex(),
    loadAppConfig(),
    loadHomeConfig(),
    loadPrompts()
  ]).then(() => {
    isInitialized = true
    console.log('[CloudData] 初始化完成')
    console.log(`[CloudData] 模块: ${getModuleList().length}个`)
    console.log(`[CloudData] 首页展示: ${getHomeEnabledCount()}个`)
  }).catch(e => {
    console.error('[CloudData] 初始化失败:', e)
  })
  
  return initPromise
}

/**
 * 异步初始化（返回 Promise）
 */
function initAsync() {
  return init()
}

/**
 * 获取云存储文件ID
 * @param {string} path - 云端路径，如 'cloudData/modules/index.json'
 * @returns {string} 完整的cloud:// fileID
 */
function getCloudID(path) {
  // 确保使用正确的 cloud:// 格式
  return `cloud://${CLOUD_ENV}/${path}`
}

/**
 * 加载模块索引
 */
async function loadIndex() {
  try {
    const res = await wx.cloud.downloadFile({
      fileID: getCloudID(CLOUD_PATH.INDEX)
    })
    
    const data = await readFile(res.tempFilePath)
    indexCache = JSON.parse(data)
    console.log(`[CloudData] 加载索引: ${indexCache.modules?.length || 0} 个模块`)
    return indexCache
  } catch (e) {
    console.warn('[CloudData] 云端索引不可用，使用默认索引')
    // 使用 DEFAULT_STYLES 生成索引
    indexCache = {
      modules: Object.keys(DEFAULT_STYLES).map(id => ({
        id,
        name: DEFAULT_STYLES[id].name || id,
        icon: DEFAULT_STYLES[id].icon || '📌',
        color: DEFAULT_STYLES[id].color || '#666666'
      }))
    }
    return indexCache
  }
}

/**
 * 读取本地文件
 */
function readFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'utf8',
      success: (res) => resolve(res.data),
      fail: reject
    })
  })
}

/**
 * 获取所有模块列表（索引信息）
 */
function getModuleList() {
  return indexCache?.modules || []
}

/**
 * 获取首页展示的模块数
 */
function getHomeEnabledCount() {
  return getHomeModules().filter(m => m.enabled).length
}

/**
 * 加载全局配置
 */
async function loadAppConfig() {
  try {
    const res = await wx.cloud.downloadFile({
      fileID: getCloudID(CLOUD_PATH.APP_CONFIG)
    })
    const data = await readFile(res.tempFilePath)
    appConfigCache = JSON.parse(data)
    console.log('[CloudData] 加载全局配置成功')
    return appConfigCache
  } catch (e) {
    console.warn('[CloudData] 云端配置不可用，使用本地配置')
    appConfigCache = LOCAL_APP_CONFIG
    return appConfigCache
  }
}

/**
 * 获取全局配置
 */
function getAppConfig() {
  return appConfigCache || {}
}

/**
 * 加载首页配置
 */
async function loadHomeConfig() {
  try {
    const res = await wx.cloud.downloadFile({
      fileID: getCloudID(CLOUD_PATH.HOME_MODULES)
    })
    const data = await readFile(res.tempFilePath)
    homeConfigCache = JSON.parse(data)
    console.log('[CloudData] 加载首页配置成功')
    return homeConfigCache
  } catch (e) {
    console.warn('[CloudData] 云端首页配置不可用，使用本地配置')
    homeConfigCache = LOCAL_HOME_MODULES
    return homeConfigCache
  }
}

/**
 * 获取首页配置
 */
function getHomeConfig() {
  return homeConfigCache || {}
}

/**
 * 加载AI提示词
 */
async function loadPrompts() {
  try {
    const res = await wx.cloud.downloadFile({
      fileID: getCloudID(CLOUD_PATH.AI_PROMPTS)
    })
    const data = await readFile(res.tempFilePath)
    promptsCache = JSON.parse(data)
    // 支持两种数据结构：prompts.modules 或 prompts（直接是模块对象）
    const promptsObj = promptsCache?.prompts || promptsCache?.modules || {}
    console.log(`[CloudData] 加载AI提示词: ${Object.keys(promptsObj).length} 个`)
    return promptsCache
  } catch (e) {
    console.warn('[CloudData] 云端AI提示词不可用，使用本地提示词')
    promptsCache = LOCAL_PROMPTS
    return promptsCache
  }
}

/**
 * 获取AI提示词
 * @param {string} moduleId - 模块ID
 * @returns {object|null} 提示词配置 { generate, share } 或 null
 */
function getPrompt(moduleId) {
  // 支持两种数据结构：prompts.modules.xxx 或 prompts.xxx
  const promptObj = promptsCache?.prompts || promptsCache?.modules || {}
  return promptObj[moduleId] || null
}

/**
 * 获取单个模块数据（带缓存）
 */
async function getModule(moduleId) {
  // 优先返回缓存
  if (moduleCache[moduleId]) {
    return moduleCache[moduleId]
  }
  
  try {
    const res = await wx.cloud.downloadFile({
      fileID: getCloudID(CLOUD_PATH.MODULE(moduleId))
    })
    const data = await readFile(res.tempFilePath)
    const moduleData = JSON.parse(data)
    
    // 缓存起来
    moduleCache[moduleId] = moduleData
    console.log(`[CloudData] 加载模块: ${moduleId}`)
    
    return moduleData
  } catch (e) {
    // 云存储文件不存在时，使用本地备用数据
    console.warn(`[CloudData] 云端模块 ${moduleId} 不可用，尝试使用本地备用数据`)
    
    // apple 模块本地备用数据
    if (moduleId === 'apple') {
      const localFallback = {
        version: "1.0.0",
        updated: "2026-04-16",
        fallback: [
          { title: "Swift Optional", category: "Swift", categoryIcon: "💻", content: "Swift 的 Optional 类型用于处理值缺失的情况。使用 ? 表示值可能为 nil，让编译器帮助避免空指针异常。", subtitle: "安全处理空值" },
          { title: "UIViewController 生命周期", category: "iOS", categoryIcon: "🍎", content: "ViewController 的主要生命周期：viewDidLoad、viewWillAppear、viewDidAppear、viewWillDisappear、viewDidDisappear。理解生命周期对管理资源和状态至关重要。", subtitle: "视图控制器生命周期" },
          { title: "SwiftUI 状态管理", category: "SwiftUI", categoryIcon: "🎨", content: "SwiftUI 使用 @State、@Binding、@ObservedObject 管理状态。@State 用于简单值类型，@ObservedObject 用于引用类型。", subtitle: "响应式编程" },
          { title: "Core Data 入门", category: "iOS", categoryIcon: "🗄️", content: "Core Data 是 Apple 的持久化框架。使用 NSManagedObject 表示实体，NSManagedObjectContext 进行操作。适用于复杂数据和大量数据场景。", subtitle: "数据持久化" },
          { title: "GCD 并发编程", category: "iOS", categoryIcon: "⚡", content: "GCD 是 Apple 的并发框架。使用 DispatchQueue 管理任务，主队列用于UI，工作队列用于耗时任务。", subtitle: "多线程编程" },
          { title: "Auto Layout 约束", category: "UIKit", categoryIcon: "📐", content: "Auto Layout 通过约束描述视图关系。使用 SnapKit 简化约束：view.snp.makeConstraints { make in make.edges.equalToSuperview() }", subtitle: "响应式布局" },
          { title: "Protocol 协议", category: "Swift", categoryIcon: "🤝", content: "Swift 协议定义方法、属性的蓝图，可被类、结构体、枚举实现。广泛用于依赖注入和委托模式。", subtitle: "面向协议编程" },
          { title: "Combine 响应式框架", category: "Swift", categoryIcon: "🔄", content: "Combine 是响应式框架，核心：Publisher 发布数据、Subscriber 订阅数据。常用操作符：map、filter、reduce。", subtitle: "函数式编程" },
          { title: "Xcode 调试技巧", category: "开发工具", categoryIcon: "🔧", content: "LLDB 命令：po 打印对象，expr 执行代码；Watchpoint 监控变量；Memory Graph 排查内存泄漏。", subtitle: "提升开发效率" },
          { title: "App Store 审核", category: "上架指南", categoryIcon: "📱", content: "App Store 审核注意：1. 功能完整无闪退；2. 无虚假内容；3. 描述与功能一致；4. 付费需说明。", subtitle: "上架注意事项" }
        ]
      }
      moduleCache[moduleId] = localFallback
      console.log(`[CloudData] 使用本地备用数据: ${moduleId}`)
      return localFallback
    }

    // growth 模块本地备用数据
    if (moduleId === 'growth') {
      const localFallback = {
        version: "1.0.0",
        updated: "2026-04-16",
        fallback: [
          { title: "AARRR增长模型", category: "用户获取", categoryIcon: "🎯", content: "AARRR模型即Acquisition（获取）、Activation（激活）、Retention（留存）、Revenue（变现）、Referral（推荐）。它是硅谷风险投资人戴夫·麦克卢尔提出的海盗指标，帮助创业公司理解用户生命周期。", subtitle: "海盗指标法" },
          { title: "用户增长飞轮", category: "用户留存", categoryIcon: "🔄", content: "增长飞轮是杰夫·贝索斯提出的核心商业理念。通过不断提升用户体验，形成『用户增长→更多选择→更低价格→更好体验』的正向循环，最终形成自动运转的飞轮效应。", subtitle: "亚马逊增长飞轮" },
          { title: "RFM用户分层模型", category: "数据与实验", categoryIcon: "📊", content: "RFM模型是客户管理中的经典方法论：Recency（最近一次消费）、Frequency（消费频率）、Monetary（消费金额）。通过这三个维度将用户分为8类，实现精细化运营。", subtitle: "精准用户分层" },
          { title: "转化率优化CRO", category: "转化优化", categoryIcon: "📈", content: "转化率优化(CRO)是一套系统性的方法，通过用户研究、数据分析、A/B测试等手段，不断优化用户体验和页面设计，提升从访客到付费用户的转化比例。", subtitle: "提升转化效率" },
          { title: "裂变营销策略", category: "用户获取", categoryIcon: "🎯", content: "裂变营销借助社交网络的病毒式传播特性，通过老用户分享带来新用户，实现低成本的用户增长。常见形式包括拼团、分销、邀请有礼、分享红包等。", subtitle: "社交裂变增长" }
        ]
      }
      moduleCache[moduleId] = localFallback
      console.log(`[CloudData] 使用本地备用数据: ${moduleId}`)
      return localFallback
    }

    // uiDesigner 模块本地备用数据
    if (moduleId === 'uiDesigner') {
      const localFallback = {
        version: "1.0.0",
        updated: "2026-04-16",
        fallback: [
          { title: "Figma组件变体设计", category: "设计系统", categoryIcon: "🧩", content: "组件变体（Variants）是Figma推出的强大功能，允许在同一组件内创建多个状态的组合。通过设置属性和变体，可以高效管理按钮、表单、卡片等组件的不同状态，大幅提升设计效率和一致性。", subtitle: "提升组件复用性" },
          { title: "格式塔原则在UI中的应用", category: "视觉设计", categoryIcon: "🎨", content: "格式塔心理学原则包括接近性、相似性、闭合性、连续性等，设计师可以利用这些原则引导用户视觉流向。良好的视觉层次让用户自然地按照设计师意图浏览页面，提升信息传达效率。", subtitle: "视觉层次构建" },
          { title: "微交互设计细节", category: "交互设计", categoryIcon: "🖱️", content: "微交互是指产品中那些细微但重要的交互细节，如按钮点击反馈、加载状态提示、下拉刷新动画等。优秀的微交互能够增强用户体验的愉悦感和信任度，让产品更加生动有趣。", subtitle: "细节决定体验" },
          { title: "设计系统Token化", category: "设计系统", categoryIcon: "🧩", content: "Design Token是设计属性的抽象概念，如颜色、间距、阴影等。通过Token化，设计系统可以在不同平台间保持一致性，同时便于主题切换和动态样式调整。", subtitle: "设计一致性保障" },
          { title: "品牌视觉一致性", category: "品牌设计", categoryIcon: "🏷️", content: "品牌视觉一致性是指在所有触点上保持统一的视觉语言，包括Logo使用、色彩体系、字体选择、图形元素等。一致性强的品牌能够建立用户认知和信任，提升品牌辨识度。", subtitle: "品牌识别建设" }
        ]
      }
      moduleCache[moduleId] = localFallback
      console.log(`[CloudData] 使用本地备用数据: ${moduleId}`)
      return localFallback
    }

    // futures 模块本地备用数据
    if (moduleId === 'futures') {
      const localFallback = {
        version: "1.0.0",
        updated: "2026-04-16",
        fallback: [
          { title: "原油期货交易基础", category: "能源化工", categoryIcon: "⚡", content: "原油期货是最重要的能源类期货品种之一，主要包括WTI原油和布伦特原油。交易原油期货需要关注地缘政治、OPEC产能、库存数据等因素。WTI原油在纽约商品交易所交易，布伦特原油在伦敦洲际交易所交易。", subtitle: "能源期货入门" },
          { title: "黄金期货投资策略", category: "金属矿产", categoryIcon: "🔩", content: "黄金作为避险资产，其期货价格受美元走势、通胀预期、地缘政治等因素影响。COMEX黄金是全球最大的黄金期货市场。投资者常使用黄金对冲通胀风险和股市波动风险。", subtitle: "避险资产配置" },
          { title: "大豆期货产业链分析", category: "农产品", categoryIcon: "🌾", content: "大豆期货是重要的农产品期货，涉及CBOT大豆和国内豆粕、豆油合约。影响大豆价格的因素包括南美产量、美国种植面积、天气变化、中国采购需求等。", subtitle: "农产品期货" },
          { title: "铜期货的宏观经济属性", category: "金属矿产", categoryIcon: "🔩", content: "铜被称为'经济晴雨表'，因其与宏观经济走势高度相关。铜期货交易需关注全球制造业PMI、房地产数据、新能源需求等因素。COMEX铜是全球铜定价的重要参考。", subtitle: "铜博士指标" },
          { title: "天然气期货季节性规律", category: "能源化工", categoryIcon: "⚡", content: "天然气期货价格呈现明显的季节性特征，冬季取暖需求推高价格，夏季发电需求次之。页岩气产量、LNG出口、库存水平是影响天然气价格的关键因素。", subtitle: "能源季节波动" }
        ]
      }
      moduleCache[moduleId] = localFallback
      console.log(`[CloudData] 使用本地备用数据: ${moduleId}`)
      return localFallback
    }

    return null
  }
}

/**
 * 图标名称转 emoji 映射
 */
const ICON_TO_EMOJI = {
  'icon-quote': '📜',
  'icon-joke': '😂',
  'icon-psychology': '🧠',
  'icon-finance': '💹',
  'icon-love': '💕',
  'icon-movie': '🎬',
  'icon-music': '🎵',
  'icon-tech': '🚀',
  'icon-tcm': '🌿',
  'icon-travel': '✈️',
  'icon-fortune': '☯️',
  'icon-literature': '📚',
  'icon-trade': '🌐',
  'icon-ecommerce': '🛒',
  'icon-math': '📐',
  'icon-english': '🔤',
  'icon-programming': '💻',
  'icon-photography': '📷',
  'icon-beauty': '💄',
  'icon-investment': '💰',
  'icon-fishing': '🎣',
  'icon-fitness': '💪',
  'icon-pet': '🐾',
  'icon-fashion': '✨',
  'icon-outfit': '👗',
  'icon-decoration': '🏠',
  'icon-glassFiber': '🧵',
  'icon-resin': '🧪',
  'icon-tax': '📋',
  'icon-law': '⚖️',
  'icon-official': '🎩',
  'icon-handling': '💎',
  'icon-floral': '💐',
  'icon-history': '📜',
  'icon-military': '🎖️',
  'icon-stock': '📈',
  'icon-economics': '💰',
  'icon-business': '💼',
  'icon-news': '📰',
  'icon-apple': '🍎',
  'icon-growth': '🚀',
  'icon-ui': '🎨',
  'icon-ui': '🎨',
  'icon-futures': '📊',
}

/**
 * 获取模块配置（完整样式配置）
 * 合并：云端索引信息 + 默认样式 + 首页配置
 */
function getModuleConfig(moduleId) {
  // 1. 获取基础信息（从索引）
  const indexInfo = indexCache?.modules?.find(m => m.id === moduleId) || {}
  
  // 2. 获取默认样式（关键：DEFAULT_STYLES 必须存在）
  const defaultStyle = DEFAULT_STYLES[moduleId] || {}
  if (!defaultStyle.id) {
    console.warn(`[CloudData] getModuleConfig: ${moduleId} 在 DEFAULT_STYLES 中未找到配置`)
  }
  
  // 3. 获取首页配置
  const homeConfig = homeConfigCache?.modules?.find(m => m.id === moduleId) || {}
  
  // 4. 合并配置（defaultStyle 优先级最高，防止被 indexInfo 覆盖）
  const merged = {
    ...indexInfo,
    ...defaultStyle,
    ...homeConfig,
  }
  
  // 5. 确保必需字段有值
  merged.id = moduleId
  merged.name = merged.name || defaultStyle.name || indexInfo.name || moduleId
  merged.color = merged.color || defaultStyle.color || indexInfo.color || '#666666'
  merged.icon = merged.icon || defaultStyle.icon || '📌'
  // 如果 icon 是图标名称（如 "icon-quote"），转换为 emoji
  if (merged.icon && ICON_TO_EMOJI[merged.icon]) {
    merged.icon = ICON_TO_EMOJI[merged.icon]
  }
  merged.enabled = homeConfig.enabled !== false
  merged.order = homeConfig.order !== undefined ? homeConfig.order : 999
  
  return merged
}

/**
 * 预加载首页模块数据
 */
async function preloadHomeModules() {
  const homeModules = getHomeConfig().modules || []
  const promises = homeModules
    .filter(m => m.enabled)
    .slice(0, 12)
    .map(m => getModule(m.id))
  
  await Promise.all(promises)
  console.log('[CloudData] 首页模块预加载完成')
}

/**
 * 获取每日固定内容（使用日期种子）
 */
function getDailyItem(moduleId) {
  const module = moduleCache[moduleId]
  if (!module || !module.fallback || !module.fallback.length) {
    return null
  }
  
  // 使用日期作为种子，确保每天固定
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  
  // 根据种子选择固定的索引
  const index = seed % module.fallback.length
  return { ...module.fallback[index] }
}

/**
 * 获取分享模板
 */
function getShareTemplate(moduleId) {
  const module = moduleCache[moduleId]
  return module?.share || null
}

/**
 * 获取首页模块列表（带完整配置）
 */
function getHomeModules() {
  const config = getHomeConfig()
  const modules = config.modules || []
  
  return modules.map(item => {
    return getModuleConfig(item.id)
  }).sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * 获取首页模块配置（带顺序）
 */
function getOrderedHomeModules() {
  return getHomeModules()
}

/**
 * 检查模块是否启用
 */
function isModuleEnabled(moduleId) {
  const config = getAppConfig()
  const disabled = config.disabledModules || []
  return !disabled.includes(moduleId)
}

/**
 * 获取模块信息（基础信息，不含完整数据）
 */
function getModuleInfo(moduleId) {
  const list = getModuleList()
  return list.find(m => m.id === moduleId) || null
}

/**
 * 获取所有模块ID列表
 */
function getAllModuleIds() {
  return Object.keys(DEFAULT_STYLES)
}

/**
 * 清除缓存
 */
function clearCache() {
  moduleCache = {}
  indexCache = null
  appConfigCache = null
  homeConfigCache = null
  promptsCache = null
  isInitialized = false
  initPromise = null
  console.log('[CloudData] 缓存已清除')
}

// 导出
module.exports = {
  // 初始化
  init,
  initAsync,
  clearCache,
  
  // 模块数据
  getModule,
  getModuleList,
  getModuleInfo,
  getModuleConfig,
  getAllModuleIds,
  getDailyItem,
  getShareTemplate,
  
  // 配置
  getAppConfig,
  getHomeConfig,
  getHomeModules,
  getOrderedHomeModules,
  getHomeEnabledCount,
  isModuleEnabled,
  
  // AI提示词
  getPrompt,
  
  // 预加载
  preloadHomeModules,
  
  // 常量
  DEFAULT_STYLES
}
