/**
 * moduleConfig.js - 模块配置管理器
 * 
 * 从云存储读取模块配置，实现配置与代码分离
 * 支持动态增删模块，无需修改代码
 */

const MODULE_CONFIG_KEY = 'moduleConfig'
const CONFIG_CACHE_TIME = 3600000 // 缓存1小时

// 默认模块配置（首次加载或云存储无数据时使用）
const DEFAULT_MODULE_CONFIG = {
  version: '1.0.0',
  modules: [
    {
      id: 'quote',
      name: '时光絮语',
      icon: '📜',
      storageKey: 'dailyQuote',
      collection: 'dailyQuotes',
      cacheEnabled: true,
      enabled: true,
      order: 1,
      colors: {
        primary: '#5C6BC0',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8EAF6',
        accent: '#3949AB',
        text: '#283593',
        textSecondary: '#5C6BC0',
        bg: 'rgba(92, 107, 192, 0.1)',
        shadow: 'rgba(92, 107, 192, 0.15)'
      },
      tags: { category: { field: 'author', icon: 'authorIcon' }, ai: 'AI' },
      aiTags: ['名言', '金句'],
      refreshText: '换一句',
      loadingText: '名言正在送达...',
      placeholderText: '点击「换一句」获取今日名言',
      posterType: 'quote',
      slogan: '名人名言，智慧启迪'
    },
    {
      id: 'joke',
      name: '轻松一刻',
      icon: '😄',
      storageKey: 'dailyJoke',
      collection: 'dailyJokes',
      cacheEnabled: true,
      enabled: true,
      order: 2,
      colors: {
        primary: '#FF7043',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FBE9E7',
        accent: '#F4511E',
        text: '#D84315',
        textSecondary: '#FF7043',
        bg: 'rgba(255, 112, 67, 0.1)',
        shadow: 'rgba(255, 112, 67, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['段子', '幽默'],
      refreshText: '换一个',
      loadingText: '段子正在赶来的路上...',
      placeholderText: '点击「换一个」获取轻松一刻',
      posterType: 'joke',
      slogan: '笑一笑，十年少'
    },
    {
      id: 'psychology',
      name: '心理解析',
      icon: '🧠',
      storageKey: 'dailyPsychology',
      collection: 'dailyPsychologys',
      cacheEnabled: true,
      enabled: true,
      order: 3,
      colors: {
        primary: '#7E57C2',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EDE7F6',
        accent: '#5E35B1',
        text: '#4527A0',
        textSecondary: '#7E57C2',
        bg: 'rgba(126, 87, 194, 0.1)',
        shadow: 'rgba(126, 87, 194, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['心理', '情感'],
      refreshText: '换一个',
      loadingText: '正在分析...',
      placeholderText: '点击「换一个」获取心理知识',
      posterType: 'psychology',
      slogan: '读懂内心，遇见更好的自己'
    },
    {
      id: 'finance',
      name: '财富视窗',
      icon: '💹',
      storageKey: 'dailyFinance',
      collection: 'dailyFinances',
      cacheEnabled: true,
      enabled: true,
      order: 4,
      colors: {
        primary: '#26A69A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F2F1',
        accent: '#00897B',
        text: '#00695C',
        textSecondary: '#26A69A',
        bg: 'rgba(38, 166, 154, 0.1)',
        shadow: 'rgba(38, 166, 154, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['金融', '经济'],
      refreshText: '换一条',
      loadingText: '财经要闻加载中...',
      placeholderText: '点击「换一条」获取财经资讯',
      posterType: 'finance',
      slogan: '洞察财富趋势'
    },
    {
      id: 'love',
      name: '甜蜜时刻',
      icon: '💕',
      storageKey: 'dailyLove',
      collection: 'dailyLoves',
      cacheEnabled: true,
      enabled: true,
      order: 5,
      colors: {
        primary: '#EC407A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FCE4EC',
        accent: '#D81B60',
        text: '#C2185B',
        textSecondary: '#EC407A',
        bg: 'rgba(236, 64, 122, 0.1)',
        shadow: 'rgba(236, 64, 122, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['情话', '甜蜜'],
      refreshText: '换一句',
      loadingText: '甜蜜情话生成中...',
      placeholderText: '点击「换一句」获取甜蜜情话',
      posterType: 'love',
      slogan: '爱要大声说出来'
    },
    {
      id: 'movie',
      name: '光影世界',
      icon: '🎬',
      storageKey: 'dailyMovie',
      collection: 'dailyMovies',
      cacheEnabled: true,
      enabled: true,
      order: 6,
      colors: {
        primary: '#EF5350',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFEBEE',
        accent: '#E53935',
        text: '#C62828',
        textSecondary: '#EF5350',
        bg: 'rgba(239, 83, 80, 0.1)',
        shadow: 'rgba(239, 83, 80, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['电影', '影评'],
      refreshText: '换一部',
      loadingText: '好片推荐生成中...',
      placeholderText: '点击「换一部」获取电影推荐',
      posterType: 'movie',
      slogan: '光影人生，品味百态'
    },
    {
      id: 'music',
      name: '音乐时光',
      icon: '🎵',
      storageKey: 'dailyMusic',
      collection: 'dailyMusics',
      cacheEnabled: true,
      enabled: true,
      order: 7,
      colors: {
        primary: '#AB47BC',
        gradientStart: '#FFFFFF',
        gradientEnd: '#F3E5F5',
        accent: '#8E24AA',
        text: '#7B1FA2',
        textSecondary: '#AB47BC',
        bg: 'rgba(171, 71, 188, 0.1)',
        shadow: 'rgba(171, 71, 188, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['音乐', '歌单'],
      refreshText: '换一首',
      loadingText: '好歌正在播放...',
      placeholderText: '点击「换一首」获取音乐推荐',
      posterType: 'music',
      slogan: '音乐是灵魂的粮食'
    },
    {
      id: 'tech',
      name: '科技前沿',
      icon: '🚀',
      storageKey: 'dailyTech',
      collection: 'dailyTechs',
      cacheEnabled: true,
      enabled: true,
      order: 8,
      colors: {
        primary: '#42A5F5',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E3F2FD',
        accent: '#1E88E5',
        text: '#1565C0',
        textSecondary: '#42A5F5',
        bg: 'rgba(66, 165, 245, 0.1)',
        shadow: 'rgba(66, 165, 245, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['科技', '前沿'],
      refreshText: '换一条',
      loadingText: '科技前沿加载中...',
      placeholderText: '点击「换一条」获取科技资讯',
      posterType: 'tech',
      slogan: '科技改变世界'
    },
    {
      id: 'tcm',
      name: '中医养生',
      icon: '🌿',
      storageKey: 'dailyTcm',
      collection: 'dailyTcms',
      cacheEnabled: true,
      enabled: true,
      order: 9,
      colors: {
        primary: '#66BB6A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8F5E9',
        accent: '#43A047',
        text: '#2E7D32',
        textSecondary: '#66BB6A',
        bg: 'rgba(102, 187, 106, 0.1)',
        shadow: 'rgba(102, 187, 106, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['中医', '养生'],
      refreshText: '换一条',
      loadingText: '养生知识加载中...',
      placeholderText: '点击「换一条」获取中医养生知识',
      posterType: 'tcm',
      slogan: '传承千年中医智慧'
    },
    {
      id: 'travel',
      name: '旅行日记',
      icon: '✈️',
      storageKey: 'dailyTravel',
      collection: 'dailyTravels',
      cacheEnabled: true,
      enabled: true,
      order: 10,
      colors: {
        primary: '#26C6DA',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F7FA',
        accent: '#00ACC1',
        text: '#00838F',
        textSecondary: '#26C6DA',
        bg: 'rgba(38, 198, 218, 0.1)',
        shadow: 'rgba(38, 198, 218, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['旅行', '目的地'],
      refreshText: '换一处',
      loadingText: '旅行攻略生成中...',
      placeholderText: '点击「换一处」获取旅行推荐',
      posterType: 'travel',
      slogan: '世界那么大，我想去看看'
    },
    {
      id: 'fortune',
      name: '每日一卦',
      icon: '☯️',
      storageKey: 'dailyFortune',
      collection: 'dailyFortunes',
      cacheEnabled: true,
      enabled: true,
      order: 11,
      colors: {
        primary: '#8D6E63',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EFEBE9',
        accent: '#6D4C41',
        text: '#4E342E',
        textSecondary: '#8D6E63',
        bg: 'rgba(141, 110, 99, 0.1)',
        shadow: 'rgba(141, 110, 99, 0.15)'
      },
      tags: { category: { field: 'hexagram', icon: 'hexagramIcon' }, ai: 'AI' },
      aiTags: ['易经', '卦象'],
      refreshText: '再算一卦',
      loadingText: '卦象解读中...',
      placeholderText: '点击「再算一卦」获取今日运势',
      posterType: 'fortune',
      slogan: '知命而行，顺势而为'
    },
    {
      id: 'literature',
      name: '文学殿堂',
      icon: '📚',
      storageKey: 'dailyLiterature',
      collection: 'dailyLiteratures',
      cacheEnabled: true,
      enabled: true,
      order: 12,
      colors: {
        primary: '#78909C',
        gradientStart: '#FFFFFF',
        gradientEnd: '#ECEFF1',
        accent: '#546E7A',
        text: '#37474F',
        textSecondary: '#78909C',
        bg: 'rgba(120, 144, 156, 0.1)',
        shadow: 'rgba(120, 144, 156, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['文学', '名著'],
      refreshText: '换一篇',
      loadingText: '文学佳作加载中...',
      placeholderText: '点击「换一篇」获取文学推荐',
      posterType: 'literature',
      slogan: '腹有诗书气自华'
    },
    {
      id: 'foreignTrade',
      name: '外贸助手',
      icon: '🌐',
      storageKey: 'dailyForeignTrade',
      collection: 'dailyForeignTrades',
      cacheEnabled: true,
      enabled: true,
      order: 13,
      colors: {
        primary: '#5C6BC0',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8EAF6',
        accent: '#3949AB',
        text: '#283593',
        textSecondary: '#5C6BC0',
        bg: 'rgba(92, 107, 192, 0.1)',
        shadow: 'rgba(92, 107, 192, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['外贸', '跨境'],
      refreshText: '换一条',
      loadingText: '外贸知识加载中...',
      placeholderText: '点击「换一条」获取外贸知识',
      posterType: 'foreignTrade',
      slogan: '货通天下，买卖全球'
    },
    {
      id: 'ecommerce',
      name: '电商运营',
      icon: '🛒',
      storageKey: 'dailyEcommerce',
      collection: 'dailyEcommerces',
      cacheEnabled: true,
      enabled: true,
      order: 14,
      colors: {
        primary: '#FF7043',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FBE9E7',
        accent: '#F4511E',
        text: '#D84315',
        textSecondary: '#FF7043',
        bg: 'rgba(255, 112, 67, 0.1)',
        shadow: 'rgba(255, 112, 67, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['电商', '运营'],
      refreshText: '换一条',
      loadingText: '运营技巧加载中...',
      placeholderText: '点击「换一条」获取电商运营技巧',
      posterType: 'ecommerce',
      slogan: '运营有道，销量无忧'
    },
    {
      id: 'math',
      name: '数学达人',
      icon: '📐',
      storageKey: 'dailyMath',
      collection: 'dailyMaths',
      cacheEnabled: true,
      enabled: true,
      order: 15,
      colors: {
        primary: '#7E57C2',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EDE7F6',
        accent: '#5E35B1',
        text: '#4527A0',
        textSecondary: '#7E57C2',
        bg: 'rgba(126, 87, 194, 0.1)',
        shadow: 'rgba(126, 87, 194, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['数学', '解题'],
      refreshText: '换一道',
      loadingText: '数学题加载中...',
      placeholderText: '点击「换一道」获取数学知识',
      posterType: 'math',
      slogan: '数学是科学的语言'
    },
    {
      id: 'english',
      name: '英语达人',
      icon: '🔤',
      storageKey: 'dailyEnglish',
      collection: 'dailyEnglishs',
      cacheEnabled: true,
      enabled: true,
      order: 16,
      colors: {
        primary: '#42A5F5',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E3F2FD',
        accent: '#1E88E5',
        text: '#1565C0',
        textSecondary: '#42A5F5',
        bg: 'rgba(66, 165, 245, 0.1)',
        shadow: 'rgba(66, 165, 245, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['英语', '学习'],
      refreshText: '换一条',
      loadingText: '英语知识加载中...',
      placeholderText: '点击「换一条」获取英语知识',
      posterType: 'english',
      slogan: 'English is a global language'
    },
    {
      id: 'programming',
      name: '编程导师',
      icon: '💻',
      storageKey: 'dailyProgramming',
      collection: 'dailyProgrammings',
      cacheEnabled: true,
      enabled: true,
      order: 17,
      colors: {
        primary: '#26A69A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F2F1',
        accent: '#00897B',
        text: '#00695C',
        textSecondary: '#26A69A',
        bg: 'rgba(38, 166, 154, 0.1)',
        shadow: 'rgba(38, 166, 154, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['编程', '代码'],
      refreshText: '换一条',
      loadingText: '代码技巧加载中...',
      placeholderText: '点击「换一条」获取编程技巧',
      posterType: 'programming',
      slogan: '代码改变世界'
    },
    {
      id: 'photography',
      name: '摄影大师',
      icon: '📷',
      storageKey: 'dailyPhotography',
      collection: 'dailyPhotographys',
      cacheEnabled: true,
      enabled: true,
      order: 18,
      colors: {
        primary: '#EC407A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FCE4EC',
        accent: '#D81B60',
        text: '#C2185B',
        textSecondary: '#EC407A',
        bg: 'rgba(236, 64, 122, 0.1)',
        shadow: 'rgba(236, 64, 122, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['摄影', '技巧'],
      refreshText: '换一条',
      loadingText: '摄影技巧加载中...',
      placeholderText: '点击「换一条」获取摄影技巧',
      posterType: 'photography',
      slogan: '用镜头捕捉美好'
    },
    {
      id: 'beauty',
      name: '美妆达人',
      icon: '💄',
      storageKey: 'dailyBeauty',
      collection: 'dailyBeautys',
      cacheEnabled: true,
      enabled: true,
      order: 19,
      colors: {
        primary: '#EF5350',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFEBEE',
        accent: '#E53935',
        text: '#C62828',
        textSecondary: '#EF5350',
        bg: 'rgba(239, 83, 80, 0.1)',
        shadow: 'rgba(239, 83, 80, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['美妆', '护肤'],
      refreshText: '换一条',
      loadingText: '美妆知识加载中...',
      placeholderText: '点击「换一条」获取美妆知识',
      posterType: 'beauty',
      slogan: ' beauty is in the details'
    },
    {
      id: 'investment',
      name: '投资顾问',
      icon: '📈',
      storageKey: 'dailyInvestment',
      collection: 'dailyInvestments',
      cacheEnabled: true,
      enabled: true,
      order: 20,
      colors: {
        primary: '#66BB6A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8F5E9',
        accent: '#43A047',
        text: '#2E7D32',
        textSecondary: '#66BB6A',
        bg: 'rgba(102, 187, 106, 0.1)',
        shadow: 'rgba(102, 187, 106, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['投资', '理财'],
      refreshText: '换一条',
      loadingText: '投资知识加载中...',
      placeholderText: '点击「换一条」获取投资知识',
      posterType: 'investment',
      slogan: '稳健投资，财富增值'
    },
    {
      id: 'fishing',
      name: '钓鱼达人',
      icon: '🎣',
      storageKey: 'dailyFishing',
      collection: 'dailyFishings',
      cacheEnabled: true,
      enabled: true,
      order: 21,
      colors: {
        primary: '#26C6DA',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F7FA',
        accent: '#00ACC1',
        text: '#00838F',
        textSecondary: '#26C6DA',
        bg: 'rgba(38, 198, 218, 0.1)',
        shadow: 'rgba(38, 198, 218, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['钓鱼', '技巧'],
      refreshText: '换一条',
      loadingText: '钓鱼技巧加载中...',
      placeholderText: '点击「换一条」获取钓鱼技巧',
      posterType: 'fishing',
      slogan: '钓鱼是一种生活态度'
    },
    {
      id: 'fitness',
      name: '健身教练',
      icon: '💪',
      storageKey: 'dailyFitness',
      collection: 'dailyFitnesss',
      cacheEnabled: true,
      enabled: true,
      order: 22,
      colors: {
        primary: '#AB47BC',
        gradientStart: '#FFFFFF',
        gradientEnd: '#F3E5F5',
        accent: '#8E24AA',
        text: '#7B1FA2',
        textSecondary: '#AB47BC',
        bg: 'rgba(171, 71, 188, 0.1)',
        shadow: 'rgba(171, 71, 188, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['健身', '运动'],
      refreshText: '换一条',
      loadingText: '健身知识加载中...',
      placeholderText: '点击「换一条」获取健身知识',
      posterType: 'fitness',
      slogan: '生命在于运动'
    },
    {
      id: 'pet',
      name: '宠物专家',
      icon: '🐾',
      storageKey: 'dailyPet',
      collection: 'dailyPets',
      cacheEnabled: true,
      enabled: true,
      order: 23,
      colors: {
        primary: '#8D6E63',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EFEBE9',
        accent: '#6D4C41',
        text: '#4E342E',
        textSecondary: '#8D6E63',
        bg: 'rgba(141, 110, 99, 0.1)',
        shadow: 'rgba(141, 110, 99, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['宠物', '养护'],
      refreshText: '换一条',
      loadingText: '宠物知识加载中...',
      placeholderText: '点击「换一条」获取宠物知识',
      posterType: 'pet',
      slogan: '宠物是人类的好朋友'
    },
    {
      id: 'fashion',
      name: '时尚教主',
      icon: '👗',
      storageKey: 'dailyFashion',
      collection: 'dailyFashions',
      cacheEnabled: true,
      enabled: true,
      order: 24,
      colors: {
        primary: '#78909C',
        gradientStart: '#FFFFFF',
        gradientEnd: '#ECEFF1',
        accent: '#546E7A',
        text: '#37474F',
        textSecondary: '#78909C',
        bg: 'rgba(120, 144, 156, 0.1)',
        shadow: 'rgba(120, 144, 156, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['时尚', '潮流'],
      refreshText: '换一条',
      loadingText: '时尚资讯加载中...',
      placeholderText: '点击「换一条」获取时尚资讯',
      posterType: 'fashion',
      slogan: ' fashion is what you buy, style is what you do with it'
    },
    {
      id: 'outfit',
      name: '穿搭指南',
      icon: '👔',
      storageKey: 'dailyOutfit',
      collection: 'dailyOutfits',
      cacheEnabled: true,
      enabled: true,
      order: 25,
      colors: {
        primary: '#5C6BC0',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8EAF6',
        accent: '#3949AB',
        text: '#283593',
        textSecondary: '#5C6BC0',
        bg: 'rgba(92, 107, 192, 0.1)',
        shadow: 'rgba(92, 107, 192, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['穿搭', '搭配'],
      refreshText: '换一条',
      loadingText: '穿搭指南加载中...',
      placeholderText: '点击「换一条」获取穿搭指南',
      posterType: 'outfit',
      slogan: '穿出风格，活出精彩'
    },
    {
      id: 'decoration',
      name: '装修顾问',
      icon: '🏠',
      storageKey: 'dailyDecoration',
      collection: 'dailyDecorations',
      cacheEnabled: true,
      enabled: true,
      order: 26,
      colors: {
        primary: '#FF7043',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FBE9E7',
        accent: '#F4511E',
        text: '#D84315',
        textSecondary: '#FF7043',
        bg: 'rgba(255, 112, 67, 0.1)',
        shadow: 'rgba(255, 112, 67, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['装修', '家居'],
      refreshText: '换一条',
      loadingText: '装修知识加载中...',
      placeholderText: '点击「换一条」获取装修知识',
      posterType: 'decoration',
      slogan: '让家更温馨'
    },
    {
      id: 'glassFiber',
      name: '玻纤专家',
      icon: '🧵',
      storageKey: 'dailyGlassFiber',
      collection: 'dailyGlassFibers',
      cacheEnabled: true,
      enabled: true,
      order: 27,
      colors: {
        primary: '#7E57C2',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EDE7F6',
        accent: '#5E35B1',
        text: '#4527A0',
        textSecondary: '#7E57C2',
        bg: 'rgba(126, 87, 194, 0.1)',
        shadow: 'rgba(126, 87, 194, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['玻纤', '材料'],
      refreshText: '换一条',
      loadingText: '玻纤知识加载中...',
      placeholderText: '点击「换一条」获取玻纤知识',
      posterType: 'glassFiber',
      slogan: '专业材料，专业品质'
    },
    {
      id: 'resin',
      name: '树脂达人',
      icon: '🧪',
      storageKey: 'dailyResin',
      collection: 'dailyResins',
      cacheEnabled: true,
      enabled: true,
      order: 28,
      colors: {
        primary: '#42A5F5',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E3F2FD',
        accent: '#1E88E5',
        text: '#1565C0',
        textSecondary: '#42A5F5',
        bg: 'rgba(66, 165, 245, 0.1)',
        shadow: 'rgba(66, 165, 245, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['树脂', '化工'],
      refreshText: '换一条',
      loadingText: '树脂知识加载中...',
      placeholderText: '点击「换一条」获取树脂知识',
      posterType: 'resin',
      slogan: '材料科学，应用无限'
    },
    {
      id: 'tax',
      name: '财税顾问',
      icon: '📋',
      storageKey: 'dailyTax',
      collection: 'dailyTaxs',
      cacheEnabled: true,
      enabled: true,
      order: 29,
      colors: {
        primary: '#26A69A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F2F1',
        accent: '#00897B',
        text: '#00695C',
        textSecondary: '#26A69A',
        bg: 'rgba(38, 166, 154, 0.1)',
        shadow: 'rgba(38, 166, 154, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['财税', '税务'],
      refreshText: '换一条',
      loadingText: '财税知识加载中...',
      placeholderText: '点击「换一条」获取财税知识',
      posterType: 'tax',
      slogan: '合理节税，依法纳税'
    },
    {
      id: 'law',
      name: '法律顾问',
      icon: '⚖️',
      storageKey: 'dailyLaw',
      collection: 'dailyLaws',
      cacheEnabled: true,
      enabled: true,
      order: 30,
      colors: {
        primary: '#EC407A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FCE4EC',
        accent: '#D81B60',
        text: '#C2185B',
        textSecondary: '#EC407A',
        bg: 'rgba(236, 64, 122, 0.1)',
        shadow: 'rgba(236, 64, 122, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['法律', '维权'],
      refreshText: '换一条',
      loadingText: '法律知识加载中...',
      placeholderText: '点击「换一条」获取法律知识',
      posterType: 'law',
      slogan: '知法用法，保护自己'
    },
    {
      id: 'official',
      name: '职场达人',
      icon: '🎩',
      storageKey: 'dailyOfficial',
      collection: 'dailyOfficials',
      cacheEnabled: true,
      enabled: true,
      order: 31,
      colors: {
        primary: '#EF5350',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFEBEE',
        accent: '#E53935',
        text: '#C62828',
        textSecondary: '#EF5350',
        bg: 'rgba(239, 83, 80, 0.1)',
        shadow: 'rgba(239, 83, 80, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['职场', '人际'],
      refreshText: '换一条',
      loadingText: '职场知识加载中...',
      placeholderText: '点击「换一条」获取职场知识',
      posterType: 'official',
      slogan: '职场如战场，智慧取胜'
    },
    {
      id: 'handling',
      name: '处事高手',
      icon: '💎',
      storageKey: 'dailyHandling',
      collection: 'dailyHandlings',
      cacheEnabled: true,
      enabled: true,
      order: 32,
      colors: {
        primary: '#66BB6A',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8F5E9',
        accent: '#43A047',
        text: '#2E7D32',
        textSecondary: '#66BB6A',
        bg: 'rgba(102, 187, 106, 0.1)',
        shadow: 'rgba(102, 187, 106, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['处事', '情商'],
      refreshText: '换一条',
      loadingText: '处事智慧加载中...',
      placeholderText: '点击「换一条」获取处事智慧',
      posterType: 'handling',
      slogan: '世事洞明皆学问'
    },
    {
      id: 'floral',
      name: '花艺师',
      icon: '💐',
      storageKey: 'dailyFloral',
      collection: 'dailyFlorals',
      cacheEnabled: true,
      enabled: true,
      order: 33,
      colors: {
        primary: '#26C6DA',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F7FA',
        accent: '#00ACC1',
        text: '#00838F',
        textSecondary: '#26C6DA',
        bg: 'rgba(38, 198, 218, 0.1)',
        shadow: 'rgba(38, 198, 218, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['花艺', '插花'],
      refreshText: '换一条',
      loadingText: '花艺知识加载中...',
      placeholderText: '点击「换一条」获取花艺知识',
      posterType: 'floral',
      slogan: '花语人生，芬芳四季'
    },
    {
      id: 'history',
      name: '历史明镜',
      icon: '📚',
      storageKey: 'dailyHistory',
      collection: 'dailyHistorys',
      cacheEnabled: true,
      enabled: true,
      order: 34,
      colors: {
        primary: '#AB47BC',
        gradientStart: '#FFFFFF',
        gradientEnd: '#F3E5F5',
        accent: '#8E24AA',
        text: '#7B1FA2',
        textSecondary: '#AB47BC',
        bg: 'rgba(171, 71, 188, 0.1)',
        shadow: 'rgba(171, 71, 188, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['历史', '典故'],
      refreshText: '换一条',
      loadingText: '历史典故加载中...',
      placeholderText: '点击「换一条」获取历史典故',
      posterType: 'history',
      slogan: '以史为鉴，可以知兴替'
    },
    {
      id: 'military',
      name: '军事观察',
      icon: '🎖️',
      storageKey: 'dailyMilitary',
      collection: 'dailyMilitarys',
      cacheEnabled: true,
      enabled: true,
      order: 35,
      colors: {
        primary: '#8D6E63',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EFEBE9',
        accent: '#6D4C41',
        text: '#4E342E',
        textSecondary: '#8D6E63',
        bg: 'rgba(141, 110, 99, 0.1)',
        shadow: 'rgba(141, 110, 99, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI' },
      aiTags: ['军事', '战略'],
      refreshText: '换一条',
      loadingText: '军事知识加载中...',
      placeholderText: '点击「换一条」获取军事知识',
      posterType: 'military',
      slogan: '知己知彼，百战不殆'
    },
    {
      id: 'stock',
      name: '股海明灯',
      icon: '📈',
      storageKey: 'dailyStock',
      collection: 'dailyStocks',
      cacheEnabled: true,
      enabled: true,
      order: 36,
      colors: {
        primary: '#1E88E5',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E3F2FD',
        accent: '#1565C0',
        text: '#0D47A1',
        textSecondary: '#1976D2',
        bg: 'rgba(30, 136, 229, 0.1)',
        shadow: 'rgba(30, 136, 229, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI专家' },
      aiTags: ['股票', '期货'],
      refreshText: '换一条',
      loadingText: '投资专家正在为你分析...',
      placeholderText: '点击「换一条」获取投资知识',
      posterType: 'stock',
      slogan: '理性投资，稳健增值'
    },
    {
      id: 'economics',
      name: '经济视窗',
      icon: '💰',
      storageKey: 'dailyEconomics',
      collection: 'dailyEconomics',
      cacheEnabled: true,
      enabled: true,
      order: 37,
      colors: {
        primary: '#00897B',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E0F2F1',
        accent: '#00695C',
        text: '#004D40',
        textSecondary: '#00796B',
        bg: 'rgba(0, 137, 123, 0.1)',
        shadow: 'rgba(0, 137, 123, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI专家' },
      aiTags: ['经济', '分析'],
      refreshText: '换一条',
      loadingText: '经济学家正在为你解读...',
      placeholderText: '点击「换一条」学习经济学知识',
      posterType: 'economics',
      slogan: '洞悉经济，把握趋势'
    },
    {
      id: 'business',
      name: '商道智慧',
      icon: '💼',
      storageKey: 'dailyBusiness',
      collection: 'dailyBusinesss',
      cacheEnabled: true,
      enabled: true,
      order: 38,
      colors: {
        primary: '#6D4C41',
        gradientStart: '#FFFFFF',
        gradientEnd: '#EFEBE9',
        accent: '#5D4037',
        text: '#3E2723',
        textSecondary: '#4E342E',
        bg: 'rgba(109, 76, 65, 0.1)',
        shadow: 'rgba(109, 76, 65, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI导师' },
      aiTags: ['商业', '经营'],
      refreshText: '换一条',
      loadingText: '商业导师正在为你指点...',
      placeholderText: '点击「换一条」学习商业智慧',
      posterType: 'business',
      slogan: '商道即人道，赢在格局'
    },
    {
      id: 'news',
      name: '资讯前沿',
      icon: '📰',
      storageKey: 'dailyNews',
      collection: 'dailyNewss',
      cacheEnabled: true,
      enabled: true,
      order: 39,
      colors: {
        primary: '#D32F2F',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFEBEE',
        accent: '#C62828',
        text: '#B71C1C',
        textSecondary: '#C62828',
        bg: 'rgba(211, 47, 47, 0.1)',
        shadow: 'rgba(211, 47, 47, 0.15)'
      },
      tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: 'AI解读' },
      aiTags: ['新闻', '热点'],
      refreshText: '换一条',
      loadingText: '媒体专家正在为你解读...',
      placeholderText: '点击「换一条」获取新闻解读',
      posterType: 'news',
      slogan: '资讯为王，洞察为先'
    }
  ]
}

// 内存缓存
let moduleConfigCache = null
let cacheTime = 0

/**
 * 获取模块配置
 * @param {boolean} forceRefresh 是否强制从云存储刷新
 * @returns {Promise<Object>} 模块配置对象
 */
async function getModuleConfig(forceRefresh = false) {
  const now = Date.now()
  
  // 检查内存缓存
  if (!forceRefresh && moduleConfigCache && (now - cacheTime) < CONFIG_CACHE_TIME) {
    return moduleConfigCache
  }
  
  try {
    // 尝试从云存储读取
    const cloudConfig = await loadFromCloud()
    if (cloudConfig) {
      moduleConfigCache = cloudConfig
      cacheTime = now
      // 缓存到本地
      wx.setStorageSync(MODULE_CONFIG_KEY, cloudConfig)
      return cloudConfig
    }
  } catch (e) {
    console.error('[ModuleConfig] 云存储读取失败:', e)
  }
  
  // 尝试从本地存储读取
  try {
    const localConfig = wx.getStorageSync(MODULE_CONFIG_KEY)
    // 确保是有效对象
    if (localConfig && typeof localConfig === 'object' && Array.isArray(localConfig.modules)) {
      moduleConfigCache = localConfig
      cacheTime = now
      return localConfig
    }
  } catch (e) {
    console.warn('[ModuleConfig] 读取本地存储失败:', e)
  }
  
  // 使用默认配置
  moduleConfigCache = DEFAULT_MODULE_CONFIG
  cacheTime = now
  return DEFAULT_MODULE_CONFIG
}

/**
 * 从云存储加载配置
 */
async function loadFromCloud() {
  return new Promise((resolve) => {
    // 云存储中的 JSON 配置文件路径
    const cloudPath = 'cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/moduleConfig.json'
    
    wx.cloud.downloadFile({
      fileID: cloudPath,  // 直接使用云存储路径
      success: (res) => {
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: 'utf8',  // 明确指定 UTF-8 编码
          success: (readRes) => {
            try {
              const content = readRes.data
              // 确保 content 是字符串
              if (typeof content !== 'string') {
                console.warn('[ModuleConfig] 文件内容不是字符串类型')
                resolve(null)
                return
              }
              // 解析 JSON
              const config = JSON.parse(content)
              // 验证配置格式
              if (!config || !Array.isArray(config.modules)) {
                console.warn('[ModuleConfig] 配置格式无效')
                resolve(null)
                return
              }
              resolve(config)
            } catch (e) {
              console.error('[ModuleConfig] JSON解析失败:', e, '原始内容:', readRes.data)
              resolve(null)
            }
          },
          fail: (err) => {
            console.error('[ModuleConfig] 文件读取失败:', err)
            resolve(null)
          }
        })
      },
      fail: (err) => {
        console.error('[ModuleConfig] 云存储下载失败:', err)
        resolve(null)
      }
    })
  })
}

/**
 * 获取启用的模块列表（按order排序）
 * @returns {Promise<Array>} 模块列表
 */
async function getEnabledModules() {
  const config = await getModuleConfig()
  return config.modules
    .filter(m => m.enabled)
    .sort((a, b) => a.order - b.order)
}

/**
 * 根据ID获取模块配置
 * @param {string} moduleId 模块ID
 * @returns {Promise<Object|null>} 模块配置
 */
async function getModuleById(moduleId) {
  const config = await getModuleConfig()
  return config.modules.find(m => m.id === moduleId) || null
}

/**
 * 保存配置到云存储（管理员功能）
 * @param {Object} config 配置对象
 */
async function saveConfigToCloud(config) {
  const tempPath = wx.env.USER_DATA_PATH + '/moduleConfig.json'
  
  return new Promise((resolve, reject) => {
    // 写入临时文件
    wx.getFileSystemManager().writeFile({
      filePath: tempPath,
      data: JSON.stringify(config, null, 2),
      encoding: 'utf8',
      success: () => {
        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: 'moduleConfig.json',
          filePath: tempPath,
          success: (res) => {
            console.log('[ModuleConfig] 配置已上传:', res.fileID)
            // 更新内存缓存
            moduleConfigCache = config
            cacheTime = Date.now()
            resolve(res)
          },
          fail: reject
        })
      },
      fail: reject
    })
  })
}

/**
 * 同步获取配置（从本地缓存，用于onLoad等生命周期）
 * @returns {Object} 本地缓存的配置
 */
function getModuleConfigSync() {
  // 优先使用内存缓存
  if (moduleConfigCache) {
    return moduleConfigCache
  }
  
  // 尝试从本地存储读取
  try {
    const localConfig = wx.getStorageSync(MODULE_CONFIG_KEY)
    // 确保是有效对象
    if (localConfig && typeof localConfig === 'object' && Array.isArray(localConfig.modules)) {
      return localConfig
    }
  } catch (e) {
    console.warn('[ModuleConfig] 读取本地缓存失败:', e)
  }
  
  // 返回默认配置
  return DEFAULT_MODULE_CONFIG
}

module.exports = {
  getModuleConfig,
  getEnabledModules,
  getModuleById,
  saveConfigToCloud,
  getModuleConfigSync,
  DEFAULT_MODULE_CONFIG,
  MODULE_CONFIG_KEY
}
