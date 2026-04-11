/**
 * dailyModule.js - 每日内容模块配置
 * 
 * 定义所有每日板块的配置信息，包括：
 * - 板块基本信息（名称、图标、颜色）
 * - AI生成提示词
 * - 兜底数据
 * - 海报分享配置
 */

// 引入各板块兜底数据
const { FALLBACK_QUOTES } = require('./quoteData.js')
const { FALLBACK_JOKES } = require('./jokeData.js')
const { FALLBACK_PSYCHOLOGY } = require('./psychologyData.js')
const { FALLBACK_FINANCE } = require('./financeData.js')
const { FALLBACK_LOVE } = require('./loveData.js')
const { FALLBACK_MOVIES } = require('./movieData.js')
const { FALLBACK_MUSICS } = require('./musicData.js')
const { FALLBACK_TECHS } = require('./techData.js')
const { FALLBACK_TCMS } = require('./tcmData.js')
const { FALLBACK_TRAVELS } = require('./travelData.js')
const { FALLBACK_FORTUNES } = require('./fortuneData.js')
const { FALLBACK_AUTHORS } = require('./literatureData.js')
const { FALLBACK_FOREIGN_TRADES } = require('./foreignTradeData.js')
const { FALLBACK_ECOMMERCE } = require('./eCommerceData.js')
const { FALLBACK_MATH } = require('./mathData.js')
const { FALLBACK_ENGLISH } = require('./englishData.js')
const { FALLBACK_PROGRAMMING } = require('./programmingData.js')

// ─── 板块类型定义 ─────────────────────────────────────────────────
const MODULE_TYPES = {
  QUOTE: 'quote',        // 今日名言
  JOKE: 'joke',          // 今日段子
  PSYCHOLOGY: 'psychology', // 每日心理
  FINANCE: 'finance',    // 每日金融
  LOVE: 'love',          // 每日情话
  MOVIE: 'movie',        // 每日电影
  MUSIC: 'music',        // 每日音乐
  TECH: 'tech',          // 每日科技
  TCM: 'tcm',            // 每日中医
  TRAVEL: 'travel',      // 每日旅游
  FORTUNE: 'fortune',    // 每日一卦
  LITERATURE: 'literature', // 每日文学
  FOREIGN_TRADE: 'foreignTrade', // 外贸助手
  ECOMMERCE: 'ecommerce', // 电商运营助手
  MATH: 'math', // 中学数学助手
  ENGLISH: 'english', // 中学英语助手
  PROGRAMMING: 'programming', // 计算机编程助手
}

// ─── 板块配置 ─────────────────────────────────────────────────────
const MODULE_CONFIGS = {
  [MODULE_TYPES.QUOTE]: {
    id: MODULE_TYPES.QUOTE,
    name: '今日名言',
    icon: '📜',
    storageKey: 'dailyQuote',
    collection: 'dailyQuotes',
    cacheEnabled: true,
    colors: {
      primary: '#7C6AFF',
      gradientStart: '#FFFFFF',
      gradientEnd: '#F8F6FF',
      accent: '#7C6AFF',
      text: '#333333',
      textSecondary: '#666666',
      bg: 'rgba(124, 106, 255, 0.1)',
      shadow: 'rgba(124, 106, 255, 0.12)',
    },
    tags: {
      domain: { field: 'domainName', icon: 'domainIcon' },
      ai: 'AI',
      era: 'era',
      region: 'region',
    },
    aiTags: ['名言', '诗词'],
    refreshText: '换一句',
    loadingText: 'AI正在为你创作名言...',
    placeholderText: '点击「换一句」让AI为你创作名言',
    posterType: 'quote',
  },

  [MODULE_TYPES.JOKE]: {
    id: MODULE_TYPES.JOKE,
    name: '今日段子',
    icon: '😂',
    storageKey: 'dailyJoke',
    collection: 'dailyJokes',
    cacheEnabled: true,
    colors: {
      primary: '#FF9A76',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF5F0',
      accent: '#FF9A76',
      text: '#444444',
      textSecondary: '#666666',
      bg: 'rgba(255, 154, 118, 0.1)',
      shadow: 'rgba(255, 154, 118, 0.1)',
    },
    tags: {
      title: 'title',
      scene: 'scene',
      ai: 'AI创作',
    },
    aiTags: ['段子', '搞笑'],
    refreshText: '换一条',
    loadingText: 'AI正在创作段子...',
    placeholderText: '点击「换一条」让AI为你创作段子',
    posterType: 'joke',
  },

  [MODULE_TYPES.PSYCHOLOGY]: {
    id: MODULE_TYPES.PSYCHOLOGY,
    name: '每日心理',
    icon: '🧠',
    storageKey: 'dailyPsychology',
    collection: 'dailyPsychology',
    cacheEnabled: true,
    colors: {
      primary: '#6BCB77',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E8F5E9',
      accent: '#4CAF50',
      text: '#2E7D32',
      textSecondary: '#444444',
      bg: 'rgba(76, 175, 80, 0.1)',
      shadow: 'rgba(76, 175, 80, 0.15)',
    },
    tags: {
      field: { field: 'field', icon: 'fieldIcon' },
      ai: 'AI专家',
    },
    aiTags: ['心理学', '知识'],
    refreshText: '换一条',
    loadingText: '心理学专家正在为你解读...',
    placeholderText: '点击「换一条」获取心理学小知识',
    posterType: 'psychology',
  },

  [MODULE_TYPES.FINANCE]: {
    id: MODULE_TYPES.FINANCE,
    name: '每日金融',
    icon: '💰',
    storageKey: 'dailyFinance',
    collection: 'dailyFinance',
    cacheEnabled: true,
    colors: {
      primary: '#2196F3',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E3F2FD',
      accent: '#1976D2',
      text: '#1565C0',
      textSecondary: '#444444',
      bg: 'rgba(33, 150, 243, 0.1)',
      shadow: 'rgba(33, 150, 243, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI顾问',
    },
    aiTags: ['金融', '知识'],
    refreshText: '换一条',
    loadingText: '金融顾问正在为你讲解...',
    placeholderText: '点击「换一条」获取金融小知识',
    posterType: 'finance',
  },

  [MODULE_TYPES.LOVE]: {
    id: MODULE_TYPES.LOVE,
    name: '每日情话',
    icon: '💕',
    storageKey: 'dailyLove',
    collection: 'dailyLoves',
    cacheEnabled: true,
    colors: {
      primary: '#FF6B9D',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF0F5',
      accent: '#FF6B9D',
      text: '#333333',
      textSecondary: '#FF6B9D',
      bg: 'rgba(255, 107, 157, 0.1)',
      shadow: 'rgba(255, 107, 157, 0.15)',
    },
    tags: {
      category: { field: 'categoryName', icon: 'categoryIcon' },
      ai: 'AI创作',
    },
    aiTags: ['情话', '甜蜜'],
    refreshText: '换一条',
    loadingText: '正在为你创作甜蜜情话...',
    placeholderText: '点击「换一条」获取甜蜜情话',
    posterType: 'love',
  },

  [MODULE_TYPES.MOVIE]: {
    id: MODULE_TYPES.MOVIE,
    name: '每日电影',
    icon: '🎬',
    storageKey: 'dailyMovie',
    collection: 'dailyMovies',
    cacheEnabled: true,
    colors: {
      primary: '#E91E63',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FCE4EC',
      accent: '#E91E63',
      text: '#333333',
      textSecondary: '#E91E63',
      bg: 'rgba(233, 30, 99, 0.08)',
      shadow: 'rgba(233, 30, 99, 0.15)',
    },
    tags: {
      genre: { field: 'genre', icon: 'genreIcon' },
      year: 'year',
      director: 'director',
      rating: 'rating',
      ai: 'AI推荐',
    },
    aiTags: ['电影', '推荐'],
    refreshText: '换一部',
    loadingText: 'AI正在为你推荐电影...',
    placeholderText: '点击「换一部」获取电影推荐',
    posterType: 'movie',
  },

  [MODULE_TYPES.MUSIC]: {
    id: MODULE_TYPES.MUSIC,
    name: '每日音乐',
    icon: '🎵',
    storageKey: 'dailyMusic',
    collection: 'dailyMusics',
    cacheEnabled: true,
    colors: {
      primary: '#9C27B0',
      gradientStart: '#FFFFFF',
      gradientEnd: '#F3E5F5',
      accent: '#9C27B0',
      text: '#333333',
      textSecondary: '#9C27B0',
      bg: 'rgba(156, 39, 176, 0.08)',
      shadow: 'rgba(156, 39, 176, 0.15)',
    },
    tags: {
      genre: { field: 'genre', icon: 'genreIcon' },
      artist: 'artist',
      year: 'year',
      mood: { field: 'mood', icon: 'moodIcon' },
      ai: 'AI推荐',
    },
    aiTags: ['音乐', '推荐'],
    refreshText: '换一首',
    loadingText: 'AI正在为你推荐音乐...',
    placeholderText: '点击「换一首」获取音乐推荐',
    posterType: 'music',
  },

  [MODULE_TYPES.TECH]: {
    id: MODULE_TYPES.TECH,
    name: '每日科技',
    icon: '🔬',
    storageKey: 'dailyTech',
    collection: 'dailyTechs',
    cacheEnabled: true,
    colors: {
      primary: '#00BCD4',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E0F7FA',
      accent: '#00BCD4',
      text: '#333333',
      textSecondary: '#00BCD4',
      bg: 'rgba(0, 188, 212, 0.08)',
      shadow: 'rgba(0, 188, 212, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI解读',
    },
    aiTags: ['科技', '知识'],
    refreshText: '换一条',
    loadingText: '科技达人在为你解读...',
    placeholderText: '点击「换一条」获取科技新知',
    posterType: 'tech',
  },

  [MODULE_TYPES.TCM]: {
    id: MODULE_TYPES.TCM,
    name: '每日中医',
    icon: '🌿',
    storageKey: 'dailyTcm',
    collection: 'dailyTcms',
    cacheEnabled: true,
    colors: {
      primary: '#4CAF50',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E8F5E9',
      accent: '#388E3C',
      text: '#2E7D32',
      textSecondary: '#558B2F',
      bg: 'rgba(76, 175, 80, 0.1)',
      shadow: 'rgba(76, 175, 80, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI中医',
    },
    aiTags: ['中医', '养生'],
    refreshText: '换一条',
    loadingText: '中医专家正在为你解读...',
    placeholderText: '点击「换一条」获取中医养生知识',
    posterType: 'tcm',
  },

  [MODULE_TYPES.TRAVEL]: {
    id: MODULE_TYPES.TRAVEL,
    name: '每日旅游',
    icon: '🌍',
    storageKey: 'dailyTravel',
    collection: 'dailyTravels',
    cacheEnabled: true,
    colors: {
      primary: '#FF9800',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF8E1',
      accent: '#F57C00',
      text: '#E65100',
      textSecondary: '#FF8F00',
      bg: 'rgba(255, 152, 0, 0.1)',
      shadow: 'rgba(255, 152, 0, 0.15)',
    },
    tags: {
      region: { field: 'region', icon: 'regionIcon' },
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导游',
    },
    aiTags: ['旅游', '景点'],
    refreshText: '换一个',
    loadingText: 'AI导游正在为你介绍...',
    placeholderText: '点击「换一个」探索世界名胜',
    posterType: 'travel',
  },

  [MODULE_TYPES.FORTUNE]: {
    id: MODULE_TYPES.FORTUNE,
    name: '每日一卦',
    icon: '🔮',
    storageKey: 'dailyFortune',
    collection: 'dailyFortunes',
    cacheEnabled: true,
    colors: {
      primary: '#9C27B0',
      gradientStart: '#FFFFFF',
      gradientEnd: '#F3E5F5',
      accent: '#7B1FA2',
      text: '#6A1B9A',
      textSecondary: '#8E24AA',
      bg: 'rgba(156, 39, 176, 0.1)',
      shadow: 'rgba(156, 39, 176, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI占卜',
    },
    aiTags: ['占卜', '易经'],
    refreshText: '换一卦',
    loadingText: '卦象解读中...',
    placeholderText: '点击「换一卦」获取今日卦象',
    posterType: 'fortune',
  },

  [MODULE_TYPES.LITERATURE]: {
    id: MODULE_TYPES.LITERATURE,
    name: '每日文学',
    icon: '📚',
    storageKey: 'dailyLiterature',
    collection: 'dailyLiteratures',
    cacheEnabled: true,
    colors: {
      primary: '#8B4513',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF8F0',
      accent: '#A0522D',
      text: '#5D4037',
      textSecondary: '#795548',
      bg: 'rgba(139, 69, 19, 0.1)',
      shadow: 'rgba(139, 69, 19, 0.15)',
    },
    tags: {
      era: { field: 'era', icon: 'eraIcon' },
      region: 'region',
      ai: 'AI推荐',
    },
    aiTags: ['文学', '作家'],
    refreshText: '换一位',
    loadingText: '文学大师正在为你介绍...',
    placeholderText: '点击「换一位」了解文学大师',
    posterType: 'literature',
  },

  [MODULE_TYPES.FOREIGN_TRADE]: {
    id: MODULE_TYPES.FOREIGN_TRADE,
    name: '外贸助手',
    icon: '💼',
    storageKey: 'dailyForeignTrade',
    collection: 'dailyForeignTrades',
    cacheEnabled: true,
    colors: {
      primary: '#1565C0',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E3F2FD',
      accent: '#1976D2',
      text: '#0D47A1',
      textSecondary: '#2196F3',
      bg: 'rgba(21, 101, 192, 0.1)',
      shadow: 'rgba(21, 101, 192, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI分享',
    },
    aiTags: ['外贸', '业务'],
    refreshText: '换一条',
    loadingText: '外贸干货正在加载...',
    placeholderText: '点击「换一条」获取外贸知识',
    posterType: 'foreignTrade',
  },

  [MODULE_TYPES.ECOMMERCE]: {
    id: MODULE_TYPES.ECOMMERCE,
    name: '电商运营助手',
    icon: '🛒',
    storageKey: 'dailyECommerce',
    collection: 'dailyECommerces',
    cacheEnabled: true,
    colors: {
      primary: '#FF6B00',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF3E0',
      accent: '#E65100',
      text: '#BF360C',
      textSecondary: '#FF8F00',
      bg: 'rgba(255, 111, 0, 0.1)',
      shadow: 'rgba(255, 111, 0, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI分享',
    },
    aiTags: ['电商', '运营'],
    refreshText: '换一条',
    loadingText: '电商干货正在加载...',
    placeholderText: '点击「换一条」获取运营知识',
    posterType: 'ecommerce',
  },

  [MODULE_TYPES.MATH]: {
    id: MODULE_TYPES.MATH,
    name: '中学数学助手',
    icon: '📐',
    storageKey: 'dailyMath',
    collection: 'dailyMaths',
    cacheEnabled: true,
    colors: {
      primary: '#6A1B9A',
      gradientStart: '#FFFFFF',
      gradientEnd: '#F3E5F5',
      accent: '#8E24AA',
      text: '#4A148C',
      textSecondary: '#AB47BC',
      bg: 'rgba(106, 27, 154, 0.1)',
      shadow: 'rgba(106, 27, 154, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI分享',
    },
    aiTags: ['数学', '学习'],
    refreshText: '换一条',
    loadingText: '数学知识正在加载...',
    placeholderText: '点击「换一条」获取数学知识',
    posterType: 'math',
  },

  [MODULE_TYPES.ENGLISH]: {
    id: MODULE_TYPES.ENGLISH,
    name: '中学英语助手',
    icon: '📚',
    storageKey: 'dailyEnglish',
    collection: 'dailyEnglishes',
    cacheEnabled: true,
    colors: {
      primary: '#D32F2F',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFEBEE',
      accent: '#E53935',
      text: '#B71C1C',
      textSecondary: '#EF5350',
      bg: 'rgba(211, 47, 47, 0.1)',
      shadow: 'rgba(211, 47, 47, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI分享',
    },
    aiTags: ['英语', '学习'],
    refreshText: '换一条',
    loadingText: '英语知识正在加载...',
    placeholderText: '点击「换一条」获取英语知识',
    posterType: 'english',
  },

  [MODULE_TYPES.PROGRAMMING]: {
    id: MODULE_TYPES.PROGRAMMING,
    name: '计算机编程助手',
    icon: '💻',
    storageKey: 'dailyProgramming',
    collection: 'dailyProgrammings',
    cacheEnabled: true,
    colors: {
      primary: '#1565C0',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E3F2FD',
      accent: '#1976D2',
      text: '#0D47A1',
      textSecondary: '#42A5F5',
      bg: 'rgba(21, 101, 192, 0.1)',
      shadow: 'rgba(21, 101, 192, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI分享',
    },
    aiTags: ['编程', '开发'],
    refreshText: '换一条',
    loadingText: '编程知识正在加载...',
    placeholderText: '点击「换一条」获取编程知识',
    posterType: 'programming',
  },
}

// ─── 兜底数据映射 ─────────────────────────────────────────────────
const FALLBACK_DATA = {
  [MODULE_TYPES.QUOTE]: FALLBACK_QUOTES,
  [MODULE_TYPES.JOKE]: FALLBACK_JOKES,
  [MODULE_TYPES.PSYCHOLOGY]: FALLBACK_PSYCHOLOGY,
  [MODULE_TYPES.FINANCE]: FALLBACK_FINANCE,
  [MODULE_TYPES.LOVE]: FALLBACK_LOVE,
  [MODULE_TYPES.MOVIE]: FALLBACK_MOVIES,
  [MODULE_TYPES.MUSIC]: FALLBACK_MUSICS,
  [MODULE_TYPES.TECH]: FALLBACK_TECHS,
  [MODULE_TYPES.TCM]: FALLBACK_TCMS,
  [MODULE_TYPES.TRAVEL]: FALLBACK_TRAVELS,
  [MODULE_TYPES.FORTUNE]: FALLBACK_FORTUNES,
  [MODULE_TYPES.LITERATURE]: FALLBACK_AUTHORS,
  [MODULE_TYPES.FOREIGN_TRADE]: FALLBACK_FOREIGN_TRADES,
  [MODULE_TYPES.ECOMMERCE]: FALLBACK_ECOMMERCE,
  [MODULE_TYPES.MATH]: FALLBACK_MATH,
  [MODULE_TYPES.ENGLISH]: FALLBACK_ENGLISH,
  [MODULE_TYPES.PROGRAMMING]: FALLBACK_PROGRAMMING,
}

// ─── AI生成提示词 ─────────────────────────────────────────────────
const AI_PROMPTS = {
  [MODULE_TYPES.QUOTE]: {
    poetry: `请从中国古典诗词库中查找或创作一句经典诗词名句（必须是真实存在的古诗词，不得杜撰），要求：
1. 主题随机选择：春天、夏天、秋天、冬天、山水、思乡、友情、人生、离别、思念
2. 必须是真实的、广泛流传的经典诗句
3. 注明作者、朝代和诗题

格式：诗句|作者|朝代|诗题

直接输出，示例：但愿人长久，千里共婵娟。|苏轼|宋|水调歌头
直接输出，不要任何前缀说明：`,

    quote: `请从世界名言库中查找一句经典名人名言（必须是真实存在的名言，不得杜撰），要求：
1. 主题随机选择：人生哲理、励志名言、情感感悟、生活智慧、读书感悟、处世哲学
2. 必须是真实的、广泛流传的经典名言
3. 注明作者和出处

格式：名言内容|作者|出处

直接输出，不要任何前缀说明：`,
  },

  [MODULE_TYPES.JOKE]: {
    default: `请创作一段搞笑段子，要求：
1. 场景随机选择：社交尴尬、工作日常、校园趣事、生活琐事、家庭温馨、旅行见闻
2. 200字以内，要完整有趣
3. 接地气，有共鸣感
4. 结局反转或意外最好
5. 可以有轻微夸张但不要低俗

格式要求：
标题|正文内容（标题和内容用|分隔）

直接输出：`,

    scene: '段子',
  },

  [MODULE_TYPES.PSYCHOLOGY]: {
    default: `你是一位资深心理学专家，请用通俗易懂的语言，分享一个实用的心理学知识。

要求：
1. 心理学领域随机选择：认知心理学、社会心理学、发展心理学、情绪管理、行为心理学、人际关系
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

直接输出，不要任何前缀：`,

    field: '心理学',
  },

  [MODULE_TYPES.FINANCE]: {
    default: `你是一位专业金融顾问，请用通俗易懂的语言，分享一个实用的金融知识常识。

要求：
1. 金融领域随机选择：投资理财基础、储蓄与消费、风险与保险、信用与贷款、基金与股票、经济热点
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

直接输出，不要任何前缀：`,

    field: '金融',
  },

  [MODULE_TYPES.LOVE]: {
    default: `请创作一句甜蜜情话，要求：
1. 风格随机选择：古风、现代、名人风格、诗词化用
2. 表达恋人间的思念、爱慕、承诺等情感
3. 意境优美，语言生动
4. 15-50字

格式：情话内容|风格分类

直接输出，不要任何前缀说明：`,

    classic: `请创作一句古风情话，要求：
1. 仿古诗词风格，文言文或半文言
2. 表达恋人间的思念、爱慕、承诺等情感
3. 意境优美，含蓄深情
4. 15-30字

直接输出一句古风情话，不要任何前缀说明：`,

    modern: `请创作一句现代甜蜜情话，要求：
1. 浪漫温馨，甜蜜撩人
2. 表达对爱人的思念、喜欢、深情
3. 语言生动，可以有点俏皮
4. 15-40字

直接输出一句现代情话，不要任何前缀说明：`,

    celebrity: `请创作一句名人风格的情话，要求：
1. 仿名家写作风格，如沈从文、张爱玲、三毛、王小波等
2. 文笔优美，感情真挚
3. 富有文学气息和感染力
4. 20-50字

直接输出一句名人风格情话，不要任何前缀说明：`,

    poetry: `请从中国古典诗词中挑选或化用一句经典的爱情诗句，要求：
1. 必须是真实存在的古诗词名句
2. 表达爱情、思念、相思等情感
3. 注明出处和作者
4. 格式：诗句|出处|作者

直接输出，格式示例：两情若是久长时，又岂在朝朝暮暮。|鹊桥仙|秦观`,
  },

  [MODULE_TYPES.MOVIE]: {
    default: `你是一位资深影评人，请推荐一部经典电影。

要求：
1. 电影类型随机选择：剧情、喜剧、科幻、动画、爱情、悬疑、奇幻、动作
2. 可以是中国电影或外国电影，优先推荐9分以上的高分经典
3. 内容要点：
   - 电影基本信息（片名、导演、年份、评分）
   - 剧情简介（不剧透关键情节，100字以内）
   - 一句推荐理由或经典台词（可以是电影中的原话）
4. 语言要生动有感染力，激发观众的观影兴趣
5. 格式清晰，便于阅读

格式要求：
片名|导演|年份|评分|类型|类型图标|剧情简介|推荐理由/经典台词|标签1,标签2,标签3

直接输出，不要任何前缀：`,

    classic: `你是一位资深影评人，请推荐一部影史经典高分电影。

要求：
1. 选择豆瓣9分以上的经典电影
2. 可以是任何类型：剧情、爱情、科幻、动画等
3. 必须是真正有深度、有口碑、经得起时间考验的经典之作

格式：
片名|导演|年份|评分|类型|剧情简介|经典台词|标签

直接输出，不要任何前缀：`,

    recent: `你是一位资深影评人，请推荐一部近年上映的口碑佳作。

要求：
1. 选择2018年以后上映的8.5分以上电影
2. 类型不限，优先推荐有新意、有深度的作品
3. 可以是院线片或流媒体佳作

格式：
片名|导演|年份|评分|类型|剧情简介|推荐理由|标签

直接输出，不要任何前缀：`,

    chinese: `你是一位资深影评人，请推荐一部国产经典电影。

要求：
1. 选择中国（包括港澳台）的优秀电影
2. 优先推荐有深度、有情怀、展现中国文化特色的作品
3. 可以是任何年代的作品

格式：
片名|导演|年份|评分|类型|剧情简介|推荐理由|标签

直接输出，不要任何前缀：`,

    animation: `你是一位资深影评人，请推荐一部经典动画电影。

要求：
1. 可以是任何国家的优秀动画：宫崎骏、皮克斯、迪士尼、国产动画等
2. 选择真正有深度、老少皆宜的动画佳作
3. 可以是二维或三维动画

格式：
片名|导演|年份|评分|剧情简介|推荐理由|经典台词|标签

直接输出，不要任何前缀：`,

    field: '电影',
  },

  [MODULE_TYPES.MUSIC]: {
    default: `你是一位资深音乐评论人，请推荐一首经典音乐作品。

要求：
1. 音乐类型随机选择：古典、流行、影视原声、民族音乐、新世纪、爵士
2. 可以是中国音乐或外国音乐，优先推荐真正有艺术价值和情感共鸣的作品
3. 内容要点：
   - 音乐基本信息（曲名、艺术家、年代、类型）
   - 音乐简介（音乐风格、创作背景，100字以内）
   - 一句推荐理由或经典歌词/乐句
   - 推荐给什么情绪或场景听
4. 语言要生动有感染力，激发听众的共鸣
5. 格式清晰，便于阅读

格式要求：
曲名|艺术家|年代|类型|类型图标|专辑|时长|音乐简介|推荐理由/经典歌词|音乐情绪|情绪图标|标签1,标签2,标签3

直接输出，不要任何前缀：`,

    classical: `你是一位资深古典音乐评论人，请推荐一首经典古典音乐作品。

要求：
1. 选择古典音乐史上的经典作品
2. 可以是任何时期：巴洛克、古典主义、浪漫主义、现代
3. 必须是真正有深度、有艺术价值的作品

格式：
曲名|艺术家|年代|类型|专辑|时长|音乐简介|推荐理由|情绪|情绪图标|标签

直接输出，不要任何前缀：`,

    chinese: `你是一位资深音乐评论人，请推荐一首中国经典音乐作品。

要求：
1. 选择中国（包括港澳台）的优秀音乐作品
2. 可以是任何类型：古典、流行、民乐、影视原声
3. 优先推荐展现中国文化特色或有深度情感的作品

格式：
曲名|艺术家|年代|类型|专辑|简介|推荐理由|情绪|情绪图标|标签

直接输出，不要任何前缀：`,

    field: '音乐',
  },

  [MODULE_TYPES.TECH]: {
    default: `你是一位科技科普达人，请用通俗易懂的语言，分享一个实用的科技知识或最新科技动态。

要求：
1. 科技领域随机选择：AI人工智能、区块链、芯片技术、通信技术、新能源、生物科技、航天科技、先进制造
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

直接输出，不要任何前缀：`,

    ai: `你是一位AI科技专家，请分享一个当前最热门、最前沿的AI科技动态或知识。

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

直接输出，不要任何前缀：`,

    china: `你是一位科技评论员，请分享一个中国科技发展的亮点或成就。

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

直接输出，不要任何前缀：`,

    field: '科技',
  },

  [MODULE_TYPES.TCM]: {
    default: `你是一位资深中医养生专家，请用通俗易懂的语言，分享一个实用的中医药养生知识或日常保健方法。

要求：
1. 中医领域随机选择：时节养生(二十四节气)、药食同源、穴位保健、传统功法(八段锦、五禽戏)、体质调理、食疗药膳、脏腑养护、特色疗法(艾灸、拔罐、刮痧)
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

直接输出，不要任何前缀：`,

    herb: `你是一位中医养生专家，请分享一味中药或药食同源食材的养生知识。

要求：
1. 选择常用中药材：人参、黄芪、当归、枸杞、山药、茯苓、陈皮、三七、西洋参、灵芝等
2. 内容要点：
   - 性味归经功效
   - 适用人群
   - 使用方法
   - 注意事项
3. 语言通俗，体现中医智慧
4. 长度150-200字

格式：
药食同源|养生标题|正文内容

直接输出，不要任何前缀：`,

    therapy: `你是一位中医理疗专家，请分享一种中医外治法的养生保健知识。

要求：
1. 选择一种特色疗法：艾灸、拔罐、刮痧、推拿、足浴、耳穴压豆等
2. 内容要点：
   - 疗法原理
   - 适应症
   - 操作方法
   - 注意事项
3. 语言通俗易懂，实用性强
4. 长度150-200字

格式：
特色疗法|疗法名称|正文内容

直接输出，不要任何前缀：`,

    field: '中医',
  },

  [MODULE_TYPES.TRAVEL]: {
    default: `你是一位资深旅行达人，请分享一个世界各地著名的旅游景点或名胜古迹。

要求：
1. 旅游目的地随机选择：
   - 亚洲：日本、韩国、泰国、新加坡、印度、柬埔寨、印尼马尔代夫
   - 欧洲：法国、英国、意大利、西班牙、德国、瑞士、捷克
   - 美洲：美国、墨西哥、秘鲁、阿根廷、智利复活节岛
   - 大洋洲：澳大利亚、新西兰
   - 非洲：埃及、摩洛哥、肯尼亚
   - 中东：阿联酋迪拜、约旦、土耳其
2. 内容要点：
   - 景点名称和位置
   - 历史背景和文化意义
   - 游览亮点和特色
   - 实用旅游建议
3. 语言生动有趣，激发旅行欲望
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
地区名称|景点名称|正文内容（景点介绍+游览建议）

直接输出，不要任何前缀：`,

    natural: `你是一位自然风光摄影师，请分享一个世界上最美的自然景观。

要求：
1. 目的地包括：挪威峡湾、新西兰冰川、玻利维亚天空之境、冰岛极光、非洲草原、瑞士雪山、日本富士山、张家界天门山等
2. 内容要点：
   - 自然景观特色
   - 最佳观赏季节和时间
   - 摄影技巧
   - 游览建议
3. 语言优美浪漫，体现大自然魅力
4. 长度150-200字

格式：
地区|景点名称|正文内容

直接输出，不要任何前缀：`,

    cultural: `你是一位文化历史专家，请分享一个世界文化遗产的故事。

要求：
1. 选择世界遗产：长城、故宫、吴哥窟、庞贝古城、马丘比丘、佩特拉古城等
2. 内容要点：
   - 历史背景
   - 文化价值
   - 保护意义
   - 参观提示
3. 语言有文化底蕴，体现历史厚重感
4. 长度150-200字

格式：
地区|遗产名称|正文内容

直接输出，不要任何前缀：`,

    field: '旅游',
  },

  [MODULE_TYPES.FORTUNE]: {
    default: `你是一位资深易学大师，请分享一个易经八卦或星座的智慧解读。

要求：
1. 随机选择以下主题之一：
   - 易经八卦：乾、坤、屯、蒙、需、讼、师、比等基础卦象
   - 十二星座：白羊、金牛、双子、巨蟹、狮子、处女、天秤、天蝎、射手、摩羯、水瓶、双鱼
   - 生肖运势：鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪
2. 内容要点：
   - 卦象/星座/生肖的基本象征意义
   - 今日运势特点或生活智慧
   - 实用建议或启示
3. 语言神秘而富有哲理，体现传统文化智慧
4. 长度控制在150-200字
5. 格式要便于阅读和理解

格式要求：
用|分隔各部分，结构如下：
类型名称|标题|正文内容（象征意义+智慧解读+实用建议）

直接输出，不要任何前缀：`,

    bagua: `你是一位易经学者，请分享一个易经八卦的智慧解读。

要求：
1. 选择一个卦象：乾、坤、屯、蒙、需、讼、师、比、小畜、履、同人、大有等
2. 内容要点：
   - 卦象的基本含义（卦名、卦象、象征）
   - 核心智慧或启示
   - 生活中的应用指导
3. 语言古朴典雅，体现易经智慧
4. 长度150-200字

格式：
易经八卦|卦象名称|正文内容

直接输出，不要任何前缀：`,

    zodiac: `你是一位星座研究专家，请分享一个星座的性格特点或生活智慧。

要求：
1. 选择一个星座：白羊、金牛、双子、巨蟹、狮子、处女、天秤、天蝎、射手、摩羯、水瓶、双鱼
2. 内容要点：
   - 星座的基本特征（日期、守护星、元素）
   - 性格优点或特点
   - 与人相处之道或生活建议
3. 语言生动有趣，贴近年轻人
4. 长度150-200字

格式：
星座解读|星座名称|正文内容

直接输出，不要任何前缀：`,

    chinese: `你是一位民俗文化专家，请分享一个生肖的文化寓意或生活智慧。

要求：
1. 选择一个生肖：鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪
2. 内容要点：
   - 生肖的文化象征
   - 性格特点或命运特征
   - 与其他生肖的关系或相处之道
3. 语言通俗易懂，体现传统文化
4. 长度150-200字

格式：
生肖解读|生肖名称|正文内容

直接输出，不要任何前缀：`,

    field: '占卜',
  },

  [MODULE_TYPES.LITERATURE]: {
    default: `你是一位资深文学评论家，请介绍一位著名作家及其代表作品。

要求：
1. 随机选择一位作家：
   - 中国作家：鲁迅、钱钟书、沈从文、张爱玲、莫言、余华、路遥、王小波、林语堂、老舍、巴金、曹雪芹、施耐庵、罗贯中、吴承恩等
   - 外国作家：莎士比亚、托尔斯泰、雨果、海明威、马尔克斯、卡夫卡、简·奥斯汀、狄更斯、加缪、太宰治、川端康成、村上春树等
2. 内容要点：
   - 作家简介（生卒年、国籍、文学地位）
   - 代表作品介绍（2-3部作品的背景和特色）
   - 一句经典名言或名句
   - 阅读建议或推荐理由
3. 语言优美有文采，体现文学魅力
4. 长度控制在150-200字

格式要求：
用|分隔各部分，结构如下：
作家姓名|时代/国籍|代表作1,代表作2,代表作3|正文内容（简介+作品特色+名言+推荐）|经典名言|标签1,标签2,标签3

直接输出，不要任何前缀：`,

    chinese: `你是一位中国文学研究专家，请介绍一位中国文学大师及其代表作。

要求：
1. 选择一位中国经典作家：鲁迅、老舍、沈从文、钱钟书、巴金、曹雪芹、茅盾、郭沫若、路遥、莫言、余华、王安忆等
2. 内容要点：
   - 作家生平与文学地位
   - 代表作品的文学价值
   - 经典片段或名句赏析
   - 对中国文学的贡献
3. 语言有文化底蕴，体现中国文学之美
4. 长度150-200字

格式：
作家姓名|时代|代表作1,代表作2|正文内容|名言|标签

直接输出，不要任何前缀：`,

    foreign: `你是一位世界文学研究专家，请介绍一位外国文学大师及其代表作。

要求：
1. 选择一位世界著名作家：莎士比亚、托尔斯泰、雨果、海明威、马尔克斯、卡夫卡、福楼拜、陀思妥耶夫斯基、简·奥斯汀、狄更斯等
2. 内容要点：
   - 作家生平与文学成就
   - 代表作品介绍
   - 在世界文学中的地位
   - 阅读推荐
3. 语言优美开阔，体现世界文学魅力
4. 长度150-200字

格式：
作家姓名|国籍/时代|代表作1,代表作2|正文内容|名言|标签

直接输出，不要任何前缀：`,

    field: '文学',
  },

  [MODULE_TYPES.FOREIGN_TRADE]: {
    default: `你是一位资深外贸专家，请分享一个实用的外贸业务知识或技巧。

要求：
1. 外贸知识随机选择：
   - 贸易术语（FOB、CIF、EXW等）
   - 付款方式（L/C、T/T、D/P等）
   - 货运物流（海运、空运、集装箱）
   - 报关报检（HS编码、原产地证）
   - 客户开发（邮件、展会、社交）
   - 合同条款与风险防范
2. 内容要点：
   - 概念或知识点的专业解释（让从业者温故知新）
   - 实际应用场景或案例（2-3个实用例子）
   - 操作建议或注意事项（简明实用）
3. 语言要专业实用，符合外贸行业风格
4. 长度控制在150-200字
5. 内容要有价值、有深度、接地气

格式要求：
用|分隔各部分，结构如下：
领域名称|知识标题|正文内容（知识点介绍+实用建议+注意事项）

直接输出，不要任何前缀：`,

    term: `你是一位外贸培训讲师，请解释一个外贸专业术语的含义和应用。

要求：
1. 选择一个外贸常用术语：FOB、CIF、EXW、CFR、CPT、CIP、DAP、DDP、L/C、T/T、D/P、D/A、MOQ、HS Code、提单B/L、产地证CO等
2. 内容要点：
   - 术语的全称和中文含义
   - 买卖双方的责任划分
   - 适用场景和注意事项
3. 语言简洁专业，便于理解记忆
4. 长度150-200字

格式：
术语解读|术语名称|正文内容

直接输出，不要任何前缀：`,

    payment: `你是一位外贸财务专家，请分享一种外贸付款方式的使用技巧。

要求：
1. 选择一种付款方式：L/C信用证、T/T电汇、D/P付款交单、D/A承兑交单、DPs等
2. 内容要点：
   - 付款方式的操作流程
   - 优缺点分析
   - 风险点和防范措施
   - 适用客户类型
3. 语言专业严谨，有实操指导价值
4. 长度150-200字

格式：
付款方式|方式名称|正文内容

直接输出，不要任何前缀：`,

    logistics: `你是一位国际物流专家，请分享一个货运物流的知识或技巧。

要求：
1. 选择一个物流主题：集装箱规格、海运整箱/拼箱、空运流程、目的港清关、货运保险、唛头包装等
2. 内容要点：
   - 物流环节的操作要点
   - 常见问题与解决方案
   - 成本优化建议
3. 语言实用易懂，贴近业务需求
4. 长度150-200字

格式：
物流货运|主题名称|正文内容

直接输出，不要任何前缀：`,

    field: '外贸',
  },

  [MODULE_TYPES.ECOMMERCE]: {
    default: `你是一位资深电商运营专家，请分享一个实用的电商运营知识或技巧。

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

直接输出，不要任何前缀：`,

    selection: `你是一位电商选品专家，请分享一个电商选品的策略或技巧。

要求：
1. 选择一个选品主题：蓝海市场挖掘、竞品分析、利润核算、产品差异化、供应链选品等
2. 内容要点：
   - 选品方法或策略的核心要点
   - 实际操作步骤或工具推荐
   - 常见误区或注意事项
3. 语言专业实用，便于落地执行
4. 长度150-200字

格式：
选品策略|策略名称|正文内容

直接输出，不要任何前缀：`,

    promotion: `你是一位电商营销专家，请分享一个营销推广的技巧或方法。

要求：
1. 选择一个营销主题：直播带货技巧、短视频种草、私域流量运营、爆款打造、活动策划等
2. 内容要点：
   - 营销方法的核心原理
   - 实操步骤和关键点
   - 效果提升建议
3. 语言生动有趣，有实操价值
4. 长度150-200字

格式：
营销推广|方法名称|正文内容

直接输出，不要任何前缀：`,

    data: `你是一位电商数据分析师，请分享一个数据分析的技巧或思路。

要求：
1. 选择一个数据分析主题：流量分析、转化漏斗、ROI优化、用户画像、竞品监控等
2. 内容要点：
   - 分析维度和指标解读
   - 数据背后的业务含义
   - 优化建议和行动方案
3. 语言逻辑清晰，有数据思维
4. 长度150-200字

格式：
数据分析|分析主题|正文内容

直接输出，不要任何前缀：`,

    field: '电商',
  },

  [MODULE_TYPES.MATH]: {
    default: `你是一位资深数学教师，请分享一个中学数学的核心知识点、重难点或学习技巧。

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

直接输出，不要任何前缀：`,

    algebra: `你是一位数学竞赛教练，请分享一个代数方面的核心知识点或解题技巧。

要求：
1. 选择一个代数主题：一元二次方程、韦达定理、分式方程、二次根式、因式分解技巧等
2. 内容要点：
   - 核心概念和公式
   - 典型例题或应用场景
   - 易错点和注意事项
3. 语言清晰严谨，适合有一定基础的学生
4. 长度150-200字

格式：
代数基础|知识名称|正文内容

直接输出，不要任何前缀：`,

    geometry: `你是一位几何教学专家，请分享一个几何证明的核心方法或定理应用。

要求：
1. 选择一个几何主题：全等三角形、相似三角形、圆幂定理、勾股定理及其逆定理等
2. 内容要点：
   - 定理或方法的准确表述
   - 应用条件和典型场景
   - 证明思路或解题技巧
3. 语言逻辑清晰，有证明过程
4. 长度150-200字

格式：
几何证明|定理名称|正文内容

直接输出，不要任何前缀：`,

    function: `你是一位高中数学教师，请分享一个函数与图像的核心知识点。

要求：
1. 选择一个函数主题：一次函数、反比例函数、二次函数、指数函数、对数函数、三角函数等
2. 内容要点：
   - 函数的基本性质（定义域、值域、单调性、奇偶性）
   - 图像特征和应用
   - 典型问题解法
3. 语言结合图像直观讲解
4. 长度150-200字

格式：
函数图像|函数名称|正文内容

直接输出，不要任何前缀：`,

    field: '数学',
  },

  [MODULE_TYPES.ENGLISH]: {
    default: `你是一位资深英语教师，请分享一个中学英语的核心知识点、学习技巧或应试方法。

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

直接输出，不要任何前缀：`,

    grammar: `你是一位英语语法专家，请分享一个语法知识点或辨析。

要求：
1. 选择一个语法主题：时态语态、非谓语动词、定语从句、名词性从句、状语从句、虚拟语气、情态动词、介词搭配、冠词用法等
2. 内容要点：
   - 核心规则或用法讲解
   - 易错点和辨析
   - 记忆口诀或联想方法
3. 语言清晰准确，适合中学生理解
4. 长度150-200字

格式：
语法基础|语法名称|正文内容

直接输出，不要任何前缀：`,

    vocabulary: `你是一位英语词汇教学专家，请分享一个词汇学习方法或近义词辨析。

要求：
1. 选择一个词汇主题：词根词缀记忆、词义辨析、短语动词、固定搭配、同义词反义词等
2. 内容要点：
   - 记忆方法或辨析要点
   - 典型例句或对比
   - 使用注意事项
3. 语言生动有趣，便于记忆
4. 长度150-200字

格式：
词汇记忆|主题名称|正文内容

直接输出，不要任何前缀：`,

    reading: `你是一位英语阅读教学专家，请分享一个阅读理解的解题技巧。

要求：
1. 选择一个阅读主题：猜词义技巧、长难句分析、主旨大意题、细节题、推理判断题、任务型阅读等
2. 内容要点：
   - 解题方法的步骤讲解
   - 具体例子演示
   - 常见陷阱和应对策略
3. 语言逻辑清晰，有实操性
4. 长度150-200字

格式：
阅读技巧|技巧名称|正文内容

直接输出，不要任何前缀：`,

    writing: `你是一位英语写作教学专家，请分享一个写作提升技巧或模板。

要求：
1. 选择一个写作主题：开头结尾模板、连接词使用、句型升级、高级词汇替换、图表作文、看图写话等
2. 内容要点：
   - 技巧或模板的核心要点
   - 示例展示
   - 使用建议和注意事项
3. 语言实用易懂，便于模仿
4. 长度150-200字

格式：
写作技巧|技巧名称|正文内容

直接输出，不要任何前缀：`,

    listening: `你是一位英语听力教学专家，请分享一个听力提升技巧或场景词汇。

要求：
1. 选择一个听力主题：数字听力、场景词汇、听力预测、听写技巧、英美发音差异等
2. 内容要点：
   - 技巧或词汇的要点讲解
   - 常见陷阱和应对方法
   - 练习建议
3. 语言简洁实用，有针对性
4. 长度150-200字

格式：
听力训练|主题名称|正文内容

直接输出，不要任何前缀：`,

    field: '英语',
  },

  [MODULE_TYPES.PROGRAMMING]: {
    default: `你是一位资深全栈工程师，请分享一个计算机编程领域的核心知识点、开发技巧或最佳实践。

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

直接输出，不要任何前缀：`,

    frontend: `你是一位前端技术专家，请分享一个前端开发的核心知识点或技巧。

要求：
1. 选择一个前端主题：React/Vue组件设计、CSS Flexbox/Grid、性能优化、TypeScript类型系统、前端工程化等
2. 内容要点：
   - 核心概念或原理
   - 实际应用示例
   - 最佳实践建议
3. 语言简洁专业，有代码示例
4. 长度150-200字

格式：
前端开发|主题名称|正文内容

直接输出，不要任何前缀：`,

    backend: `你是一位后端架构师，请分享一个后端开发的核心知识点或架构技巧。

要求：
1. 选择一个后端主题：RESTful API设计、微服务架构、缓存策略、认证授权、数据库优化、消息队列等
2. 内容要点：
   - 核心原理或架构思想
   - 实际应用场景
   - 性能优化建议
3. 语言逻辑清晰，有架构思维
4. 长度150-200字

格式：
后端开发|主题名称|正文内容

直接输出，不要任何前缀：`,

    database: `你是一位数据库专家，请分享一个数据库相关的核心知识点或优化技巧。

要求：
1. 选择一个数据库主题：索引原理、事务隔离、SQL优化、NoSQL应用、缓存策略、数据建模等
2. 内容要点：
   - 核心原理讲解
   - 实际案例分析
   - 优化建议
3. 语言专业严谨
4. 长度150-200字

格式：
数据库|主题名称|正文内容

直接输出，不要任何前缀：`,

    devops: `你是一位DevOps工程师，请分享一个DevOps领域的核心知识点或工具使用技巧。

要求：
1. 选择一个DevOps主题：Docker容器化、K8s编排、Git工作流、CI/CD流水线、监控告警、云原生等
2. 内容要点：
   - 核心概念或工具用法
   - 实战技巧
   - 避坑指南
3. 语言实用性强
4. 长度150-200字

格式：
DevOps|主题名称|正文内容

直接输出，不要任何前缀：`,

    algorithm: `你是一位算法竞赛教练，请分享一个算法或数据结构的核心知识点或解题技巧。

要求：
1. 选择一个算法主题：排序算法、查找算法、树和图算法、动态规划、贪心算法等
2. 内容要点：
   - 算法原理或数据结构特点
   - 适用场景
   - 实现要点或优化技巧
3. 语言逻辑清晰，有思辨性
4. 长度150-200字

格式：
算法与数据结构|主题名称|正文内容

直接输出，不要任何前缀：`,

    field: '编程',
  },
}

// ─── 导出 ───────────────────────────────────────────────────────
module.exports = {
  MODULE_TYPES,
  MODULE_CONFIGS,
  FALLBACK_DATA,
  AI_PROMPTS,
}
