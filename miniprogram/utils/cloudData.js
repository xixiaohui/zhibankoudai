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
  ]
}

// 本地应用配置
const LOCAL_APP_CONFIG = {
  version: "1.0.0",
  appName: "智伴口袋",
  updateUrl: ""
}

// 本地AI提示词（云端不可用时的备用）
const LOCAL_PROMPTS = {
  prompts: {
    quote: {
      generate: "你是一位文学大师和人生导师。请生成一条经典名言或诗句，要求有深度，能启迪人心。输出：名言内容：[文字]\\n作者：[作者]\\n出处：[简介]\\n分类：[分类]",
      share: "「{content}」\\n—— {title}"
    },
    joke: {
      generate: "你是一位幽默段子手。请生成一个幽默段子（100-200字），贴近生活，有趣但不低俗。输出格式：【段子】\\n[正文]",
      share: "{content}"
    },
    psychology: {
      generate: "你是一位资深心理咨询师。请分享一个心理学知识，要求通俗易懂，有实用建议。输出格式：【心理效应】[名称]\\n📖 原理解释：[简明解释]\\n💡 生活实例：[例子]\\n✅ 实用建议：[如何应用]",
      share: "🧠【心理学】{title}\\n\\n{content}"
    },
    finance: {
      generate: "你是一位资深金融顾问。请分享一个实用的金融小知识，要求实用、通俗。输出格式：【金融知识】[主题]\\n[核心内容]\\n💰 实践建议：[建议]",
      share: "💳【金融】{title}\\n\\n{content}"
    },
    love: {
      generate: "你是一位情感作家。请写一段温暖人心的情感语录（100字内），真诚动人。输出格式：【情话】\\n[正文]",
      share: "💕 {content}"
    },
    movie: {
      generate: "你是一位资深影评人。请推荐一部电影，简述类型、推荐理由、适合人群。输出格式：🎬【电影名】\\n📽️ 类型：[类型]\\n🌟 推荐理由：[3点]\\n👥 适合人群：[描述]",
      share: "🎬【{title}】\\n\\n{content}\\n\\n#电影推荐"
    },
    music: {
      generate: "你是一位资深音乐评论人。请推荐一首歌曲，简述基本信息、推荐理由、适合场景。输出格式：🎵【歌名】- 歌手\\n📀 专辑：[专辑]\\n🎧 推荐理由：[3点]\\n☕ 适合场景：[场景]",
      share: "🎵【{title}】\\n\\n{content}\\n\\n#音乐分享"
    },
    tech: {
      generate: "你是一位科技记者。请分享一个科技前沿动态（150字内），通俗易懂。输出格式：🚀【新闻标题】\\n[简要内容]\\n💡 意义：[对普通人的影响]",
      share: "🔬【科技前沿】{title}\\n\\n{content}"
    },
    tcm: {
      generate: "你是一位资深中医师。请分享一个中医养生小知识，说明适用人群和操作方法。输出格式：🌿【养生主题】\\n📖 原理：[简述]\\n🍵 方法：[步骤]\\n👥 适合人群：[描述]",
      share: "🍃【中医养生】{title}\\n\\n{content}"
    },
    travel: {
      generate: "你是一位资深旅行家。请推荐一个旅行目的地，介绍特色、景点、建议。输出格式：✈️【目的地】\\n📍 位置：[位置]\\n🌟 亮点：[3-5个]\\n💰 预算：[参考价格]",
      share: "🌍【{title}】旅行推荐\\n\\n{content}\\n\\n#旅行攻略"
    },
    fortune: {
      generate: "你是一位玄学研究者。请生成今日运势简析，从事业、财运、感情、健康多维度分析。输出格式：🔮【星座】今日运势\\n💼 事业：[建议]\\n💰 财运：[提示]\\n💕 感情：[提示]\\n🌟 开运方位：[方位]",
      share: "🔮【{title}】今日运势\\n\\n{content}"
    },
    english: {
      generate: "你是一位英语教学专家。请分享一个实用的英语知识点（100字内），提供例句和使用场景。输出格式：📝【知识点】\\n📖 含义：[解释]\\n💬 例句：[英文例句 - 中文翻译]\\n🎯 场景：[何时用]",
      share: "🇬🇧【英语学习】{title}\\n\\n{content}"
    },
    fitness: {
      generate: "你是一位资深健身教练。请分享一个实用的健身知识，详细说明动作要领和注意事项。输出格式：💪【动作名称】\\n🎯 目标：[肌肉/效果]\\n📝 要领：[步骤]\\n❌ 常见错误：[避免什么]",
      share: "🏋️【健身指导】{title}\\n\\n{content}"
    },
    news: {
      generate: "你是一位资深新闻编辑。请总结今日重要新闻（3-5条），每条50字内。输出格式：📰【今日要闻】\\n\\n1️⃣ 【分类】标题\\n   简述\\n\\n2️⃣ ...",
      share: "📰【今日要闻】\\n\\n{content}"
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
    // 云存储文件不存在时静默处理，使用 DEFAULT_STYLES 中的配置兜底
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
}

/**
 * 获取模块配置（完整样式配置）
 * 合并：云端索引信息 + 默认样式 + 首页配置
 */
function getModuleConfig(moduleId) {
  // 1. 获取基础信息（从索引）
  const indexInfo = indexCache?.modules?.find(m => m.id === moduleId) || {}
  
  // 2. 获取默认样式
  const defaultStyle = DEFAULT_STYLES[moduleId] || {}
  
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
