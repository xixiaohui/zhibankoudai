/**
 * dailyContent.js - 每日内容生成模块
 * 负责生成每日内容的核心逻辑
 */

const { AI_PROMPTS } = require('./dailyPrompts.js')
const { callAI } = require('./ai.js')

// ─── 引入数据模块 ─────────────────────────────────────────────────

// 引入兜底数据
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

// ─── 工具函数 ─────────────────────────────────────────────────────

/**
 * 获取随机项
 */
function getRandomItem(arr) {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 获取不重复的随机项
 */
function getRandomItems(arr, count) {
  if (!arr || arr.length === 0) return []
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

/**
 * 获取今日日期字符串
 */
function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

/**
 * 解析 AI 返回的 JSON 内容
 */
function parseAIResponse(rawText) {
  if (!rawText) return null
  try {
    let jsonStr = rawText.trim()

    // 移除常见的markdown代码块标记
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    jsonStr = jsonStr.replace(/^```\s*/i, '').replace(/\s*```$/i, '')

    // 移除可能的前缀文字（如 "以下是JSON：" 等）
    const jsonStart = jsonStr.indexOf('{')
    if (jsonStart > 0) {
      jsonStr = jsonStr.substring(jsonStart)
    }

    // 修复常见的乱码和格式问题
    jsonStr = jsonStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
      .replace(/,\s*([\]}])/g, '$1')  // 移除多余逗号
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // 确保属性名有引号
      .replace(/'/g, '"') // 替换单引号为双引号
      .replace(/：/g, ':') // 中文冒号转英文
      .replace(/，/g, ',') // 中文逗号处理（保留在字符串内）

    // 找到完整的JSON对象
    let startIdx = jsonStr.indexOf('{')
    let endIdx = jsonStr.lastIndexOf('}')

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      console.warn('[parseAIResponse] 未找到有效的JSON对象')
      console.warn('原始文本:', rawText.substring(0, 200))
      return null
    }

    jsonStr = jsonStr.substring(startIdx, endIdx + 1)

    // 解析JSON
    const result = JSON.parse(jsonStr)

    // 验证必要字段
    if (!result.title || !result.summary) {
      console.warn('[parseAIResponse] JSON缺少必要字段')
      return null
    }

    // 清理文本内容中的多余空白
    if (result.title) result.title = result.title.trim()
    if (result.summary) result.summary = result.summary.replace(/\s+/g, ' ').trim()
    if (result.tips) result.tips = result.tips.trim()
    if (Array.isArray(result.tags)) {
      result.tags = result.tags.map(t => String(t).trim()).filter(t => t)
    }

    return result
  } catch (e) {
    console.warn('[parseAIResponse] JSON解析失败:', e.message)
    console.warn('原始文本:', rawText.substring(0, 300))
    return null
  }
}

// ─── 云数据库操作 ─────────────────────────────────────────────────

/**
 * 保存名言到云数据库
 */
async function saveQuoteToCloud(quote) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyQuotes').add({ data: quote })
  } catch (e) {
    console.log('[DailyContent] 保存名言到云失败:', e.message)
  }
}

/**
 * 保存段子到云数据库
 */
async function saveJokeToCloud(joke) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyJokes').add({ data: joke })
  } catch (e) {
    console.log('[DailyContent] 保存段子到云失败:', e.message)
  }
}

/**
 * 保存心理学到云数据库
 */
async function savePsychologyToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPsychologys').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存心理学到云失败:', e.message)
  }
}

/**
 * 保存金融到云数据库
 */
async function saveFinanceToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFinances').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存金融到云失败:', e.message)
  }
}

/**
 * 保存情话到云数据库
 */
async function saveLoveToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLoves').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存情话到云失败:', e.message)
  }
}

/**
 * 保存电影到云数据库
 */
async function saveMovieToCloud(movie) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMovies').add({ data: movie })
  } catch (e) {
    console.log('[DailyContent] 保存电影到云失败:', e.message)
  }
}

/**
 * 保存音乐到云数据库
 */
async function saveMusicToCloud(music) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMusics').add({ data: music })
  } catch (e) {
    console.log('[DailyContent] 保存音乐到云失败:', e.message)
  }
}

/**
 * 保存科技到云数据库
 */
async function saveTechToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTechs').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存科技到云失败:', e.message)
  }
}

/**
 * 保存中医到云数据库
 */
async function saveTcmToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTcms').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存中医到云失败:', e.message)
  }
}

/**
 * 保存旅游到云数据库
 */
async function saveTravelToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTravels').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存旅游到云失败:', e.message)
  }
}

/**
 * 保存运势到云数据库
 */
async function saveFortuneToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFortunes').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存运势到云失败:', e.message)
  }
}

/**
 * 保存文学到云数据库
 */
async function saveLiteratureToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLiteratures').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存文学到云失败:', e.message)
  }
}

/**
 * 保存外贸到云数据库
 */
async function saveForeignTradeToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyForeignTrades').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存外贸到云失败:', e.message)
  }
}

/**
 * 保存电商到云数据库
 */
async function saveEcommerceToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyCommerces').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存电商到云失败:', e.message)
  }
}

/**
 * 保存数学到云数据库
 */
async function saveMathToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMaths').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存数学到云失败:', e.message)
  }
}

/**
 * 保存英语到云数据库
 */
async function saveEnglishToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyEnglishs').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存英语到云失败:', e.message)
  }
}

/**
 * 保存编程到云数据库
 */
async function saveProgrammingToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyProgrammings').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存编程到云失败:', e.message)
  }
}

/**
 * 保存摄影到云数据库
 */
async function savePhotographyToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPhotographys').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存摄影到云失败:', e.message)
  }
}

/**
 * 保存美妆到云数据库
 */
async function saveBeautyToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyBeautys').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存美妆到云失败:', e.message)
  }
}

/**
 * 保存投资到云数据库
 */
async function saveInvestmentToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyInvestments').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存投资到云失败:', e.message)
  }
}

/**
 * 保存钓鱼到云数据库
 */
async function saveFishingToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFishings').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存钓鱼到云失败:', e.message)
  }
}

/**
 * 保存健身到云数据库
 */
async function saveFitnessToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFitnesss').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存健身到云失败:', e.message)
  }
}

/**
 * 保存宠物到云数据库
 */
async function savePetToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyPets').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存宠物到云失败:', e.message)
  }
}

/**
 * 保存时尚到云数据库
 */
async function saveFashionToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFashions').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存时尚到云失败:', e.message)
  }
}

/**
 * 保存穿搭到云数据库
 */
async function saveOutfitToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyOutfits').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存穿搭到云失败:', e.message)
  }
}

/**
 * 保存装修到云数据库
 */
async function saveDecorationToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyDecorations').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存装修到云失败:', e.message)
  }
}

/**
 * 保存玻纤到云数据库
 */
async function saveGlassFiberToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyGlassFibers').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存玻纤到云失败:', e.message)
  }
}

/**
 * 保存树脂到云数据库
 */
async function saveResinToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyResins').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存树脂到云失败:', e.message)
  }
}

/**
 * 保存财税到云数据库
 */
async function saveTaxToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyTaxs').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存财税到云失败:', e.message)
  }
}

/**
 * 保存法律到云数据库
 */
async function saveLawToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyLaws').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存法律到云失败:', e.message)
  }
}

/**
 * 保存官场到云数据库
 */
async function saveOfficialToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyOfficials').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存官场到云失败:', e.message)
  }
}

/**
 * 保存处事到云数据库
 */
async function saveHandlingToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyHandlings').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存处事到云失败:', e.message)
  }
}

/**
 * 保存花艺到云数据库
 */
async function saveFloralToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyFlorals').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存花艺到云失败:', e.message)
  }
}

/**
 * 保存历史到云数据库
 */
async function saveHistoryToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyHistorys').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存历史到云失败:', e.message)
  }
}

/**
 * 保存军事到云数据库
 */
async function saveMilitaryToCloud(item) {
  try {
    const db = wx.cloud.database()
    await db.collection('dailyMilitarys').add({ data: item })
  } catch (e) {
    console.log('[DailyContent] 保存军事到云失败:', e.message)
  }
}

// ─── 从本地库获取随机内容 ─────────────────────────────────────────

function getRandomQuoteFromLibrary() {
  return getRandomItem(FALLBACK_QUOTES)
}

function getRandomJokeFromLibrary() {
  return getRandomItem(FALLBACK_JOKES)
}

function getRandomPsychologyFromLibrary() {
  return getRandomItem(FALLBACK_PSYCHOLOGY)
}

function getRandomFinanceFromLibrary() {
  return getRandomItem(FALLBACK_FINANCE)
}

function getRandomLoveFromLibrary() {
  return getRandomItem(FALLBACK_LOVE)
}

function getRandomMovieFromLibrary() {
  return getRandomItem(FALLBACK_MOVIES)
}

function getRandomMusicFromLibrary() {
  return getRandomItem(FALLBACK_MUSICS)
}

function getRandomTechFromLibrary() {
  return getRandomItem(FALLBACK_TECHS)
}

function getRandomTcmFromLibrary() {
  return getRandomItem(FALLBACK_TCMS)
}

function getRandomTravelFromLibrary() {
  return getRandomItem(FALLBACK_TRAVELS)
}

function getRandomFortuneFromLibrary() {
  return getRandomItem(FALLBACK_FORTUNES)
}

function getRandomLiteratureFromLibrary() {
  return getRandomItem(FALLBACK_AUTHORS)
}

function getRandomForeignTradeFromLibrary() {
  return getRandomItem(FALLBACK_FOREIGN_TRADES)
}

function getRandomEcommerceFromLibrary() {
  return getRandomItem(FALLBACK_ECOMMERCE)
}

function getRandomMathFromLibrary() {
  return getRandomItem(FALLBACK_MATH)
}

function getRandomEnglishFromLibrary() {
  return getRandomItem(FALLBACK_ENGLISH)
}

function getRandomProgrammingFromLibrary() {
  return getRandomItem(FALLBACK_PROGRAMMING)
}

function getRandomPhotographyFromLibrary() {
  return getRandomItem(FALLBACK_PHOTOGRAPHY)
}

function getRandomBeautyFromLibrary() {
  return getRandomItem(FALLBACK_BEAUTY)
}

function getRandomInvestmentFromLibrary() {
  return getRandomItem(FALLBACK_INVESTMENT)
}

function getRandomFishingFromLibrary() {
  return getRandomItem(FALLBACK_FISHING)
}

function getRandomFitnessFromLibrary() {
  return getRandomItem(FALLBACK_FITNESS)
}

function getRandomPetFromLibrary() {
  return getRandomItem(FALLBACK_PET)
}

function getRandomFashionFromLibrary() {
  return getRandomItem(FALLBACK_FASHION)
}

function getRandomOutfitFromLibrary() {
  return getRandomItem(FALLBACK_OUTFIT)
}

function getRandomDecorationFromLibrary() {
  return getRandomItem(FALLBACK_DECORATION)
}

function getRandomGlassFiberFromLibrary() {
  return getRandomItem(FALLBACK_FIBER)
}

function getRandomResinFromLibrary() {
  return getRandomItem(FALLBACK_RESIN)
}

function getRandomTaxFromLibrary() {
  return getRandomItem(FALLBACK_TAX)
}

function getRandomLawFromLibrary() {
  return getRandomItem(FALLBACK_LAW)
}

function getRandomOfficialFromLibrary() {
  return getRandomItem(FALLBACK_OFFICIAL)
}

function getRandomHandlingFromLibrary() {
  return getRandomItem(FALLBACK_HANDLING)
}

function getRandomFloralFromLibrary() {
  return getRandomItem(FALLBACK_FLORAL)
}

function getRandomHistoryFromLibrary() {
  return getRandomItem(FALLBACK_HISTORY)
}

function getRandomMilitaryFromLibrary() {
  return getRandomItem(FALLBACK_MILITARY)
}

// ─── 生成内容函数 ─────────────────────────────────────────────────

async function generateQuote() {
  const result = getRandomQuoteFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveQuoteToCloud(result)
  }
  return result
}

async function generateJoke() {
  const result = getRandomJokeFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveJokeToCloud(result)
  }
  return result
}

async function generatePsychology() {
  const result = getRandomPsychologyFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    savePsychologyToCloud(result)
  }
  return result
}

async function generateFinance() {
  const result = getRandomFinanceFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveFinanceToCloud(result)
  }
  return result
}

async function generateLove() {
  const result = getRandomLoveFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveLoveToCloud(result)
  }
  return result
}

async function generateMovie() {
  const result = getRandomMovieFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveMovieToCloud(result)
  }
  return result
}

async function generateMusic() {
  const result = getRandomMusicFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveMusicToCloud(result)
  }
  return result
}

async function generateTech() {
  const result = getRandomTechFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveTechToCloud(result)
  }
  return result
}

async function generateTcm() {
  const result = getRandomTcmFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveTcmToCloud(result)
  }
  return result
}

async function generateTravel() {
  const result = getRandomTravelFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveTravelToCloud(result)
  }
  return result
}

async function generateFortune() {
  const result = getRandomFortuneFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveFortuneToCloud(result)
  }
  return result
}

async function generateLiterature() {
  const result = getRandomLiteratureFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveLiteratureToCloud(result)
  }
  return result
}

async function generateForeignTrade() {
  const result = getRandomForeignTradeFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveForeignTradeToCloud(result)
  }
  return result
}

async function generateEcommerce() {
  const result = getRandomEcommerceFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveEcommerceToCloud(result)
  }
  return result
}

async function generateMath() {
  const result = getRandomMathFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveMathToCloud(result)
  }
  return result
}

async function generateEnglish() {
  const result = getRandomEnglishFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveEnglishToCloud(result)
  }
  return result
}

async function generateProgramming() {
  const result = getRandomProgrammingFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveProgrammingToCloud(result)
  }
  return result
}

async function generatePhotography() {
  const result = getRandomPhotographyFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    savePhotographyToCloud(result)
  }
  return result
}

async function generateBeauty() {
  const result = getRandomBeautyFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveBeautyToCloud(result)
  }
  return result
}

async function generateInvestment() {
  const result = getRandomInvestmentFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveInvestmentToCloud(result)
  }
  return result
}

async function generateFishing() {
  const result = getRandomFishingFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveFishingToCloud(result)
  }
  return result
}

async function generateFitness() {
  const result = getRandomFitnessFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveFitnessToCloud(result)
  }
  return result
}

async function generatePet() {
  const result = getRandomPetFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    savePetToCloud(result)
  }
  return result
}

async function generateFashion() {
  const result = getRandomFashionFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveFashionToCloud(result)
  }
  return result
}

async function generateOutfit() {
  const result = getRandomOutfitFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveOutfitToCloud(result)
  }
  return result
}

async function generateDecoration() {
  const result = getRandomDecorationFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveDecorationToCloud(result)
  }
  return result
}

async function generateGlassFiber() {
  const result = getRandomGlassFiberFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveGlassFiberToCloud(result)
  }
  return result
}

async function generateResin() {
  const result = getRandomResinFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveResinToCloud(result)
  }
  return result
}

async function generateTax() {
  const result = getRandomTaxFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveTaxToCloud(result)
  }
  return result
}

async function generateLaw() {
  const result = getRandomLawFromLibrary()
  if (result) {
    result.date = getTodayString()
    result.isAIGenerated = false
    saveLawToCloud(result)
  }
  return result
}

async function generateOfficial() {
  const category = getRandomItem(OFFICIAL_FIELDS)
  const prompt = AI_PROMPTS.official

  try {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user(category) }
    ]
    const rawText = await callAI('dailyOfficial', messages, { temperature: 0.8, maxTokens: 800 })
    const content = parseAIResponse(rawText)

    if (content) {
      const result = {
        ...content,
        category,
        categoryIcon: '🎩',
        date: getTodayString(),
        isAIGenerated: true
      }
      saveOfficialToCloud(result)
      return result
    }
  } catch (err) {
    console.warn('[Official] AI生成失败，使用兜底数据:', err.message)
  }

  // 兜底：使用本地数据
  const fallback = getRandomOfficialFromLibrary()
  if (fallback) {
    fallback.date = getTodayString()
    fallback.isAIGenerated = false
  }
  return fallback
}

async function generateHandling() {
  const category = getRandomItem(HANDLING_FIELDS)
  const prompt = AI_PROMPTS.handling

  try {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user(category) }
    ]
    const rawText = await callAI('dailyHandling', messages, { temperature: 0.8, maxTokens: 800 })
    const content = parseAIResponse(rawText)

    if (content) {
      const result = {
        ...content,
        category,
        categoryIcon: '💎',
        date: getTodayString(),
        isAIGenerated: true
      }
      saveHandlingToCloud(result)
      return result
    }
  } catch (err) {
    console.warn('[Handling] AI生成失败，使用兜底数据:', err.message)
  }

  // 兜底：使用本地数据
  const fallback = getRandomHandlingFromLibrary()
  if (fallback) {
    fallback.date = getTodayString()
    fallback.isAIGenerated = false
  }
  return fallback
}

async function generateFloral() {
  const category = getRandomItem(FLORAL_FIELDS)
  const prompt = AI_PROMPTS.floral

  try {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user(category) }
    ]
    const rawText = await callAI('dailyFloral', messages, { temperature: 0.8, maxTokens: 800 })
    const content = parseAIResponse(rawText)

    if (content) {
      const result = {
        ...content,
        category,
        categoryIcon: '💐',
        date: getTodayString(),
        isAIGenerated: true
      }
      saveFloralToCloud(result)
      return result
    }
  } catch (err) {
    console.warn('[Floral] AI生成失败，使用兜底数据:', err.message)
  }

  // 兜底：使用本地数据
  const fallback = getRandomFloralFromLibrary()
  if (fallback) {
    fallback.date = getTodayString()
    fallback.isAIGenerated = false
  }
  return fallback
}

async function generateHistory() {
  const category = getRandomItem(HISTORY_FIELDS)
  const prompt = AI_PROMPTS.history

  try {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user(category) }
    ]
    const rawText = await callAI('dailyHistory', messages, { temperature: 0.8, maxTokens: 800 })
    const content = parseAIResponse(rawText)

    if (content) {
      const result = {
        ...content,
        category,
        categoryIcon: '📚',
        date: getTodayString(),
        isAIGenerated: true
      }
      saveHistoryToCloud(result)
      return result
    }
  } catch (err) {
    console.warn('[History] AI生成失败，使用兜底数据:', err.message)
  }

  // 兜底：使用本地数据
  const fallback = getRandomHistoryFromLibrary()
  if (fallback) {
    fallback.date = getTodayString()
    fallback.isAIGenerated = false
  }
  return fallback
}

async function generateMilitary() {
  const category = getRandomItem(MILITARY_FIELDS)
  const prompt = AI_PROMPTS.military

  try {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user(category) }
    ]
    const rawText = await callAI('dailyMilitary', messages, { temperature: 0.8, maxTokens: 800 })
    const content = parseAIResponse(rawText)

    if (content) {
      const result = {
        ...content,
        category,
        categoryIcon: '🎖️',
        date: getTodayString(),
        isAIGenerated: true
      }
      saveMilitaryToCloud(result)
      return result
    }
  } catch (err) {
    console.warn('[Military] AI生成失败，使用兜底数据:', err.message)
  }

  // 兜底：使用本地数据
  const fallback = getRandomMilitaryFromLibrary()
  if (fallback) {
    fallback.date = getTodayString()
    fallback.isAIGenerated = false
  }
  return fallback
}

// ─── 导出 ───────────────────────────────────────────────────────

const DailyContent = {
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
  generateEcommerce,
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
  generateGlassFiber,
  generateResin,
  generateTax,
  generateLaw,
  generateOfficial,
  generateHandling,
  generateFloral,
  generateHistory,
  generateMilitary,
}

module.exports = { DailyContent }
