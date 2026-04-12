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
const { FALLBACK_PHOTOGRAPHY } = require('./photographyData.js')
const { FALLBACK_BEAUTY } = require('./beautyData.js')
const { FALLBACK_INVESTMENT } = require('./investmentData.js')
const { FALLBACK_FISHING } = require('./fishingData.js')
const { FALLBACK_FITNESS } = require('./fitnessData.js')
const { FALLBACK_PET } = require('./petData.js')
const { FALLBACK_FASHION } = require('./fashionData.js')
const { FALLBACK_OUTFIT } = require('./outfitData.js')
const { FALLBACK_DECORATION } = require('./decorationData.js')
const { FALLBACK_FIBER } = require('./glassFiberData.js')
const { FALLBACK_RESIN } = require('./resinData.js')
const { FALLBACK_TAX } = require('./taxData.js')
const { FALLBACK_LAW } = require('./lawData.js')

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
  PHOTOGRAPHY: 'photography', // 摄影达人
  BEAUTY: 'beauty', // 美妆达人
  INVESTMENT: 'investment', // 投资理财达人
  FISHING: 'fishing', // 钓鱼达人
  FITNESS: 'fitness', // 健身达人
  PET: 'pet', // 宠物达人
  FASHION: 'fashion', // 时尚达人
  OUTFIT: 'outfit', // 穿搭达人
  DECORATION: 'decoration', // 装修达人
  GLASS_FIBER: 'glassFiber', // 玻纤达人
  RESIN: 'resin', // 树脂达人
  TAX: 'tax', // 财税助手
  LAW: 'law', // 法律顾问
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

  [MODULE_TYPES.PHOTOGRAPHY]: {
    id: MODULE_TYPES.PHOTOGRAPHY,
    name: '摄影达人',
    icon: '📷',
    storageKey: 'dailyPhotography',
    collection: 'dailyPhotographies',
    cacheEnabled: true,
    colors: {
      primary: '#E65100',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF3E0',
      accent: '#FF6D00',
      text: '#BF360C',
      textSecondary: '#FF8F00',
      bg: 'rgba(230, 81, 0, 0.1)',
      shadow: 'rgba(230, 81, 0, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['摄影', '技巧'],
    refreshText: '换一条',
    loadingText: '摄影导师正在为你讲解...',
    placeholderText: '点击「换一条」学习摄影技巧',
    posterType: 'photography',
  },

  [MODULE_TYPES.BEAUTY]: {
    id: MODULE_TYPES.BEAUTY,
    name: '美妆达人',
    icon: '💄',
    storageKey: 'dailyBeauty',
    collection: 'dailyBeauties',
    cacheEnabled: true,
    colors: {
      primary: '#E91E63',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FCE4EC',
      accent: '#EC407A',
      text: '#AD1457',
      textSecondary: '#C2185B',
      bg: 'rgba(233, 30, 99, 0.1)',
      shadow: 'rgba(233, 30, 99, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['美妆', '护肤'],
    refreshText: '换一条',
    loadingText: '美妆导师正在为你讲解...',
    placeholderText: '点击「换一条」学习美妆技巧',
    posterType: 'beauty',
  },

  [MODULE_TYPES.INVESTMENT]: {
    id: MODULE_TYPES.INVESTMENT,
    name: '投资理财达人',
    icon: '💰',
    storageKey: 'dailyInvestment',
    collection: 'dailyInvestments',
    cacheEnabled: true,
    colors: {
      primary: '#00897B',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E0F2F1',
      accent: '#26A69A',
      text: '#004D40',
      textSecondary: '#00695C',
      bg: 'rgba(0, 137, 123, 0.1)',
      shadow: 'rgba(0, 137, 123, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['投资', '理财'],
    refreshText: '换一条',
    loadingText: '理财导师正在为你讲解...',
    placeholderText: '点击「换一条」学习投资理财知识',
    posterType: 'investment',
  },

  [MODULE_TYPES.FISHING]: {
    id: MODULE_TYPES.FISHING,
    name: '钓鱼达人',
    icon: '🎣',
    storageKey: 'dailyFishing',
    collection: 'dailyFishings',
    cacheEnabled: true,
    colors: {
      primary: '#1565C0',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E3F2FD',
      accent: '#1976D2',
      text: '#0D47A1',
      textSecondary: '#1565C0',
      bg: 'rgba(21, 101, 192, 0.1)',
      shadow: 'rgba(21, 101, 192, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['钓鱼', '技巧'],
    refreshText: '换一条',
    loadingText: '钓鱼大师正在为你讲解...',
    placeholderText: '点击「换一条」学习钓鱼技巧',
    posterType: 'fishing',
  },
  [MODULE_TYPES.FITNESS]: {
    id: MODULE_TYPES.FITNESS,
    name: '健身达人',
    icon: '💪',
    storageKey: 'dailyFitness',
    collection: 'dailyFitnesses',
    cacheEnabled: true,
    colors: {
      primary: '#E53935',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFEBEE',
      accent: '#D32F2F',
      text: '#B71C1C',
      textSecondary: '#C62828',
      bg: 'rgba(229, 57, 53, 0.1)',
      shadow: 'rgba(229, 57, 53, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['健身', '技巧'],
    refreshText: '换一条',
    loadingText: '健身教练正在为你讲解...',
    placeholderText: '点击「换一条」学习健身知识',
    posterType: 'fitness',
  },
  [MODULE_TYPES.PET]: {
    id: MODULE_TYPES.PET,
    name: '宠物达人',
    icon: '🐾',
    storageKey: 'dailyPet',
    collection: 'dailyPets',
    cacheEnabled: true,
    colors: {
      primary: '#FF9800',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FFF3E0',
      accent: '#F57C00',
      text: '#E65100',
      textSecondary: '#FF8F00',
      bg: 'rgba(255, 152, 0, 0.1)',
      shadow: 'rgba(255, 152, 0, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['宠物', '技巧'],
    refreshText: '换一条',
    loadingText: '宠物专家正在为你讲解...',
    placeholderText: '点击「换一条」学习养宠知识',
    posterType: 'pet',
  },
  [MODULE_TYPES.FASHION]: {
    id: MODULE_TYPES.FASHION,
    name: '时尚达人',
    icon: '✨',
    storageKey: 'dailyFashion',
    collection: 'dailyFashions',
    cacheEnabled: true,
    colors: {
      primary: '#E040FB',
      gradientStart: '#FFFFFF',
      gradientEnd: '#F3E5F5',
      accent: '#AA00FF',
      text: '#7B1FA2',
      textSecondary: '#9C27B0',
      bg: 'rgba(224, 64, 251, 0.1)',
      shadow: 'rgba(224, 64, 251, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['时尚', '潮流'],
    refreshText: '换一条',
    loadingText: '时尚顾问正在为你讲解...',
    placeholderText: '点击「换一条」学习时尚知识',
    posterType: 'fashion',
  },
  [MODULE_TYPES.OUTFIT]: {
    id: MODULE_TYPES.OUTFIT,
    name: '穿搭达人',
    icon: '👗',
    storageKey: 'dailyOutfit',
    collection: 'dailyOutfits',
    cacheEnabled: true,
    colors: {
      primary: '#EC407A',
      gradientStart: '#FFFFFF',
      gradientEnd: '#FCE4EC',
      accent: '#D81B60',
      text: '#AD1457',
      textSecondary: '#C2185B',
      bg: 'rgba(236, 64, 122, 0.1)',
      shadow: 'rgba(236, 64, 122, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['穿搭', '技巧'],
    refreshText: '换一条',
    loadingText: '穿搭导师正在为你讲解...',
    placeholderText: '点击「换一条」学习穿搭技巧',
    posterType: 'outfit',
  },
  [MODULE_TYPES.DECORATION]: {
    id: MODULE_TYPES.DECORATION,
    name: '装修达人',
    icon: '🏠',
    storageKey: 'dailyDecoration',
    collection: 'dailyDecorations',
    cacheEnabled: true,
    colors: {
      primary: '#26A69A',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E0F2F1',
      accent: '#00897B',
      text: '#00695C',
      textSecondary: '#00796B',
      bg: 'rgba(38, 166, 154, 0.1)',
      shadow: 'rgba(38, 166, 154, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['装修', '设计'],
    refreshText: '换一条',
    loadingText: '装修设计师正在为你讲解...',
    placeholderText: '点击「换一条」学习装修知识',
    posterType: 'decoration',
  },
  [MODULE_TYPES.GLASS_FIBER]: {
    id: MODULE_TYPES.GLASS_FIBER,
    name: '玻纤达人',
    icon: '🧵',
    storageKey: 'dailyGlassFiber',
    collection: 'dailyGlassFibers',
    cacheEnabled: true,
    colors: {
      primary: '#42A5F5',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E3F2FD',
      accent: '#1976D2',
      text: '#0D47A1',
      textSecondary: '#1565C0',
      bg: 'rgba(66, 165, 245, 0.1)',
      shadow: 'rgba(66, 165, 245, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['玻纤', '工艺'],
    refreshText: '换一条',
    loadingText: '玻纤专家正在为你讲解...',
    placeholderText: '点击「换一条」学习玻纤知识',
    posterType: 'glassFiber',
  },
  [MODULE_TYPES.RESIN]: {
    id: MODULE_TYPES.RESIN,
    name: '树脂达人',
    icon: '🧪',
    storageKey: 'dailyResin',
    collection: 'dailyResins',
    cacheEnabled: true,
    colors: {
      primary: '#7E57C2',
      gradientStart: '#FFFFFF',
      gradientEnd: '#EDE7F6',
      accent: '#5E35B1',
      text: '#311B92',
      textSecondary: '#4527A0',
      bg: 'rgba(126, 87, 194, 0.1)',
      shadow: 'rgba(126, 87, 194, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['树脂', '工艺'],
    refreshText: '换一条',
    loadingText: '树脂专家正在为你讲解...',
    placeholderText: '点击「换一条」学习树脂知识',
    posterType: 'resin',
  },
  [MODULE_TYPES.TAX]: {
    id: MODULE_TYPES.TAX,
    name: '财税助手',
    icon: '📋',
    storageKey: 'dailyTax',
    collection: 'dailyTaxs',
    cacheEnabled: true,
    colors: {
      primary: '#66BB6A',
      gradientStart: '#FFFFFF',
      gradientEnd: '#E8F5E9',
      accent: '#388E3C',
      text: '#1B5E20',
      textSecondary: '#2E7D32',
      bg: 'rgba(102, 187, 106, 0.1)',
      shadow: 'rgba(102, 187, 106, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['财税', '政策'],
    refreshText: '换一条',
    loadingText: '财税专家正在为你讲解...',
    placeholderText: '点击「换一条」学习财税知识',
    posterType: 'tax',
  },
  [MODULE_TYPES.LAW]: {
    id: MODULE_TYPES.LAW,
    name: '法律顾问',
    icon: '⚖️',
    storageKey: 'dailyLaw',
    collection: 'dailyLaws',
    cacheEnabled: true,
    colors: {
      primary: '#78909C',
      gradientStart: '#FFFFFF',
      gradientEnd: '#ECEFF1',
      accent: '#455A64',
      text: '#263238',
      textSecondary: '#37474F',
      bg: 'rgba(120, 144, 156, 0.1)',
      shadow: 'rgba(120, 144, 156, 0.15)',
    },
    tags: {
      category: { field: 'category', icon: 'categoryIcon' },
      ai: 'AI导师',
    },
    aiTags: ['法律', '合规'],
    refreshText: '换一条',
    loadingText: '法律顾问正在为你讲解...',
    placeholderText: '点击「换一条」学习法律知识',
    posterType: 'law',
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
  [MODULE_TYPES.PHOTOGRAPHY]: FALLBACK_PHOTOGRAPHY,
  [MODULE_TYPES.BEAUTY]: FALLBACK_BEAUTY,
  [MODULE_TYPES.INVESTMENT]: FALLBACK_INVESTMENT,
  [MODULE_TYPES.FISHING]: FALLBACK_FISHING,
  [MODULE_TYPES.FITNESS]: FALLBACK_FITNESS,
  [MODULE_TYPES.PET]: FALLBACK_PET,
  [MODULE_TYPES.FASHION]: FALLBACK_FASHION,
  [MODULE_TYPES.OUTFIT]: FALLBACK_OUTFIT,
  [MODULE_TYPES.DECORATION]: FALLBACK_DECORATION,
  [MODULE_TYPES.GLASS_FIBER]: FALLBACK_FIBER,
  [MODULE_TYPES.RESIN]: FALLBACK_RESIN,
  [MODULE_TYPES.TAX]: FALLBACK_TAX,
  [MODULE_TYPES.LAW]: FALLBACK_LAW,
}

// ─── AI提示词（从 dailyPrompts.js 引入）────────────────────────────
const { AI_PROMPTS } = require('./dailyPrompts.js')

// ─── 导出 ───────────────────────────────────────────────────────
module.exports = {
  MODULE_TYPES,
  MODULE_CONFIGS,
  FALLBACK_DATA,
  AI_PROMPTS,
}

