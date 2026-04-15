/**
 * tools/generateModuleJsons.js
 * 将现有的 xxxData.js 文件转换为统一格式的 JSON 文件
 * 输出到 cloudData/modules/ 目录
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../miniprogram/utils')
const OUTPUT_DIR = path.join(__dirname, '../cloudData/modules')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// 模块元数据映射（从 dailyModule.js 读取配置）
const MODULE_METADATA = {
  quote: { name: '每日名言', icon: 'icon-quote', color: '#FF6B6B' },
  joke: { name: '每日段子', icon: 'icon-joke', color: '#4ECDC4' },
  psychology: { name: '心理学', icon: 'icon-psychology', color: '#9B59B6' },
  finance: { name: '金融知识', icon: 'icon-finance', color: '#27AE60' },
  love: { name: '情感语录', icon: 'icon-love', color: '#E91E63' },
  movie: { name: '电影推荐', icon: 'icon-movie', color: '#3498DB' },
  music: { name: '音乐分享', icon: 'icon-music', color: '#F39C12' },
  tech: { name: '科技前沿', icon: 'icon-tech', color: '#1ABC9C' },
  tcm: { name: '中医养生', icon: 'icon-tcm', color: '#2ECC71' },
  travel: { name: '旅行攻略', icon: 'icon-travel', color: '#E67E22' },
  fortune: { name: '每日运势', icon: 'icon-fortune', color: '#8E44AD' },
  literature: { name: '文学赏析', icon: 'icon-literature', color: '#D35400' },
  foreignTrade: { name: '外贸资讯', icon: 'icon-trade', color: '#16A085' },
  ecommerce: { name: '电商动态', icon: 'icon-ecommerce', color: '#2980B9' },
  math: { name: '数学趣题', icon: 'icon-math', color: '#8E44AD' },
  english: { name: '英语学习', icon: 'icon-english', color: '#C0392B' },
  programming: { name: '编程技巧', icon: 'icon-code', color: '#27AE60' },
  photography: { name: '摄影技巧', icon: 'icon-camera', color: '#D68910' },
  beauty: { name: '美容护肤', icon: 'icon-beauty', color: '#F38D9C' },
  investment: { name: '投资理财', icon: 'icon-invest', color: '#1E8449' },
  fishing: { name: '钓鱼技巧', icon: 'icon-fish', color: '#3498DB' },
  fitness: { name: '健身指导', icon: 'icon-fitness', color: '#E74C3C' },
  pet: { name: '宠物养护', icon: 'icon-pet', color: '#9B59B6' },
  fashion: { name: '时尚穿搭', icon: 'icon-fashion', color: '#F39C12' },
  outfit: { name: '穿搭推荐', icon: 'icon-outfit', color: '#E91E63' },
  decoration: { name: '家居装饰', icon: 'icon-home', color: '#795548' },
  glassFiber: { name: '玻璃纤维', icon: 'icon-material', color: '#607D8B' },
  resin: { name: '树脂工艺', icon: 'icon-resin', color: '#00BCD4' },
  tax: { name: '税务筹划', icon: 'icon-tax', color: '#FF5722' },
  law: { name: '法律常识', icon: 'icon-law', color: '#455A64' },
  official: { name: '政务服务', icon: 'icon-official', color: '#2196F3' },
  handling: { name: '办事指南', icon: 'icon-handle', color: '#4CAF50' },
  floral: { name: '花卉养护', icon: 'icon-flower', color: '#E91E63' },
  history: { name: '历史故事', icon: 'icon-history', color: '#795548' },
  military: { name: '军事动态', icon: 'icon-military', color: '#607D8B' },
  stock: { name: '股市行情', icon: 'icon-stock', color: '#F44336' },
  economics: { name: '经济观察', icon: 'icon-economy', color: '#FF9800' },
  business: { name: '商业洞察', icon: 'icon-business', color: '#673AB7' },
  news: { name: '每日资讯', icon: 'icon-news', color: '#00BCD4' }
}

// 提示词配置
const PROMPTS = {
  quote: {
    generate: '生成一句励志名言，包含作者',
    share: '「{content}」—— {author}'
  },
  joke: {
    generate: '生成一个幽默段子',
    share: '{content}'
  },
  psychology: {
    generate: '分享一个有趣的心理学效应或知识',
    share: '【心理学】{content}'
  }
}

// 需要加载的模块文件（文件名 -> 模块ID 映射）
const MODULE_FILES = [
  ['quoteData', 'quote'],
  ['jokeData', 'joke'],
  ['psychologyData', 'psychology'],
  ['financeData', 'finance'],
  ['loveData', 'love'],
  ['movieData', 'movie'],
  ['musicData', 'music'],
  ['techData', 'tech'],
  ['tcmData', 'tcm'],
  ['travelData', 'travel'],
  ['fortuneData', 'fortune'],
  ['literatureData', 'literature'],
  ['foreignTradeData', 'foreignTrade'],
  ['eCommerceData', 'ecommerce'],
  ['mathData', 'math'],
  ['englishData', 'english'],
  ['programmingData', 'programming'],
  ['photographyData', 'photography'],
  ['beautyData', 'beauty'],
  ['investmentData', 'investment'],
  ['fishingData', 'fishing'],
  ['fitnessData', 'fitness'],
  ['petData', 'pet'],
  ['fashionData', 'fashion'],
  ['outfitData', 'outfit'],
  ['decorationData', 'decoration'],
  ['glassFiberData', 'glassFiber'],
  ['resinData', 'resin'],
  ['taxData', 'tax'],
  ['lawData', 'law'],
  ['officialData', 'official'],
  ['handlingData', 'handling'],
  ['floralData', 'floral'],
  ['historyData', 'history'],
  ['militaryData', 'military'],
  ['stockData', 'stock'],
  ['economicsData', 'economics'],
  ['businessData', 'business'],
  ['newsData', 'news']
]

function extractFieldsAndFallback(moduleData) {
  const fields = []
  const fallback = []
  
  for (const [key, value] of Object.entries(moduleData)) {
    if (key.includes('FIELD') || key.includes('SCENE') || key.includes('CATEGORY') || key.includes('TYPE')) {
      if (Array.isArray(value)) fields.push(...value)
    }
    if (key.startsWith('FALLBACK_') || key.endsWith('_QUOTES') || key.endsWith('_LIST')) {
      if (Array.isArray(value)) fallback.push(...value)
    }
  }
  
  return { fields, fallback }
}

function processModule(filename, moduleId) {
  const filePath = path.join(DATA_DIR, `${filename}.js`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 跳过: ${filename} (文件不存在)`)
    return null
  }
  
  try {
    // 动态加载模块
    const moduleData = require(filePath)
    const { fields, fallback } = extractFieldsAndFallback(moduleData)
    const metadata = MODULE_METADATA[moduleId] || { name: moduleId, icon: 'icon-star', color: '#999' }
    
    const moduleConfig = {
      id: moduleId,
      name: metadata.name,
      icon: metadata.icon,
      color: metadata.color,
      fields: fields,
      fallback: fallback,
      prompts: PROMPTS[moduleId] || { generate: `生成一条${metadata.name}`, share: '{content}' },
      share: {
        title: metadata.name,
        template: '{content}'
      },
      meta: {
        generated: new Date().toISOString(),
        source: `${filename}.js`
      }
    }
    
    return moduleConfig
  } catch (e) {
    console.log(`❌ 错误: ${filename} - ${e.message}`)
    return null
  }
}

// 生成所有模块 JSON
console.log('📦 开始生成模块 JSON 文件...\n')

const modules = []
let successCount = 0

for (const [filename, moduleId] of MODULE_FILES) {
  const moduleConfig = processModule(filename, moduleId)
  if (moduleConfig) {
    const outputPath = path.join(OUTPUT_DIR, `${moduleConfig.id}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(moduleConfig, null, 2))
    modules.push(moduleConfig)
    successCount++
    console.log(`✅ ${moduleConfig.id}.json (${moduleConfig.fallback.length} 条数据)`)
  }
}

// 生成模块索引
const indexData = {
  version: '1.0.0',
  updated: new Date().toISOString(),
  modules: modules.map(m => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    color: m.color,
    count: m.fallback.length
  }))
}
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(indexData, null, 2))

// 生成首页配置
const homeConfig = {
  version: '1.0.0',
  updated: new Date().toISOString(),
  title: '每日知识口袋',
  modules: modules.map(m => ({
    id: m.id,
    enabled: true,
    order: modules.indexOf(m)
  }))
}
fs.writeFileSync(path.join(OUTPUT_DIR, 'homeConfig.json'), JSON.stringify(homeConfig, null, 2))

console.log(`\n✅ 完成！生成了 ${successCount} 个模块 JSON 文件`)
console.log(`📁 输出目录: ${OUTPUT_DIR}`)
console.log(`📄 索引文件: modules/index.json`)
console.log(`📄 首页配置: modules/homeConfig.json`)
