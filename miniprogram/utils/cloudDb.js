/**
 * cloudDb.js - 云数据库存储模块
 * 
 * 功能：
 * 1. 聊天消息云端同步
 * 2. 用户记忆云端备份
 * 3. 跨设备数据同步
 * 4. 每日内容管理（客户端AI生成）
 * 
 * 使用云开发数据库进行数据持久化
 */

// 引入客户端AI内容生成模块
const { DailyContent } = require('./dailyContent.js')

// 云数据库集合名称（与 moduleConfig.js 中的 collection 字段一一对应）
const COLLECTIONS = {
  // 系统集合
  CHAT_MESSAGES: 'chatMessages',       // 聊天消息
  CAREERS: 'careers',                  // AI 职业内容
  USER_PROFILE: 'userProfile',          // 用户画像
  USER_MEMORY: 'userMemory',           // 用户记忆
  SETTINGS: 'userSettings',            // 用户设置
  
  // 内容模块集合（50个）
  QUOTE: 'dailyQuotes',                // 名言
  JOKE: 'dailyJokes',                  // 段子
  PSYCHOLOGY: 'dailyPsychologys',     // 心理学
  FINANCE: 'dailyFinances',           // 金融
  LOVE: 'dailyLoves',                 // 情话
  MOVIE: 'dailyMovies',                // 电影
  MUSIC: 'dailyMusics',                // 音乐
  TECH: 'dailyTechs',                  // 科技
  TCM: 'dailyTcms',                    // 中医
  TRAVEL: 'dailyTravels',              // 旅行
  FORTUNE: 'dailyFortunes',           // 运势
  LITERATURE: 'dailyLiteratures',     // 文学
  FOREIGN_TRADE: 'dailyForeignTrades', // 外贸
  ECOMMERCE: 'dailyEcommerces',       // 电商
  MATH: 'dailyMaths',                  // 数学
  ENGLISH: 'dailyEnglishs',            // 英语
  PROGRAMMING: 'dailyProgrammings',    // 编程
  PHOTOGRAPHY: 'dailyPhotographys',   // 摄影
  BEAUTY: 'dailyBeautys',             // 美容
  INVESTMENT: 'dailyInvestments',     // 投资
  FISHING: 'dailyFishings',           // 钓鱼
  FITNESS: 'dailyFitnesss',           // 健身
  PET: 'dailyPets',                    // 宠物
  FASHION: 'dailyFashions',           // 时尚
  OUTFIT: 'dailyOutfits',             // 穿搭
  DECORATION: 'dailyDecorations',     // 家居
  GLASS_FIBER: 'dailyGlassFibers',    // 玻纤
  RESIN: 'dailyResins',               // 树脂
  TAX: 'dailyTaxs',                   // 税务
  LAW: 'dailyLaws',                   // 法律
  OFFICIAL: 'dailyOfficials',         // 政务
  HANDLING: 'dailyHandlings',         // 处事
  FLORAL: 'dailyFlorals',             // 花卉
  HISTORY: 'dailyHistorys',           // 历史
  MILITARY: 'dailyMilitarys',         // 军事
  STOCK: 'dailyStocks',               // 股票
  ECONOMICS: 'dailyEconomics',        // 经济学
  BUSINESS: 'dailyBusinesss',        // 商业
  NEWS: 'dailyNewss',                 // 新闻
  WISDOM_BAG: 'dailyWisdomBags',      // 智慧锦囊
  ROBOT_AI: 'dailyRobotAis',         // 机器人AI
  AMERICAN_EXPERT: 'dailyAmericanExperts', // 美国通
  APPLE: 'dailyApples',               // 苹果开发
  GROWTH: 'dailyGrowths',             // 市场增长
  UI_DESIGNER: 'dailyUiDesigners',    // UI设计
  FUTURES: 'dailyFutures',            // 期货
  FREUD: 'dailyFreuds',               // 弗洛伊德
  FASHION_BRAND: 'dailyFashionBrands', // 服装品牌
  XIN_STUDY: 'dailyXinStudys',       // 心学
  LI_STUDY: 'dailyLiStudys',         // 理学
}

// 模块ID到集合名的映射（用于动态查找）
const MODULE_TO_COLLECTION = {
  quote: 'dailyQuotes',
  joke: 'dailyJokes',
  psychology: 'dailyPsychologys',
  finance: 'dailyFinances',
  love: 'dailyLoves',
  movie: 'dailyMovies',
  music: 'dailyMusics',
  tech: 'dailyTechs',
  tcm: 'dailyTcms',
  travel: 'dailyTravels',
  fortune: 'dailyFortunes',
  literature: 'dailyLiteratures',
  foreignTrade: 'dailyForeignTrades',
  ecommerce: 'dailyEcommerces',
  math: 'dailyMaths',
  english: 'dailyEnglishs',
  programming: 'dailyProgrammings',
  photography: 'dailyPhotographys',
  beauty: 'dailyBeautys',
  investment: 'dailyInvestments',
  fishing: 'dailyFishings',
  fitness: 'dailyFitnesss',
  pet: 'dailyPets',
  fashion: 'dailyFashions',
  outfit: 'dailyOutfits',
  decoration: 'dailyDecorations',
  glassFiber: 'dailyGlassFibers',
  resin: 'dailyResins',
  tax: 'dailyTaxs',
  law: 'dailyLaws',
  official: 'dailyOfficials',
  handling: 'dailyHandlings',
  floral: 'dailyFlorals',
  history: 'dailyHistorys',
  military: 'dailyMilitarys',
  stock: 'dailyStocks',
  economics: 'dailyEconomics',
  business: 'dailyBusinesss',
  news: 'dailyNewss',
  wisdomBag: 'dailyWisdomBags',
  robotAi: 'dailyRobotAis',
  americanExpert: 'dailyAmericanExperts',
  apple: 'dailyApples',
  growth: 'dailyGrowths',
  uiDesigner: 'dailyUiDesigners',
  futures: 'dailyFutures',
  freud: 'dailyFreuds',
  fashionBrand: 'dailyFashionBrands',
  xinStudy: 'dailyXinStudys',
  liStudy: 'dailyLiStudys',
  // 新增模块
  anthropologist: 'dailyAnthropologists',    // 人类学家
  geographer: 'dailyGeographers',             // 地理学家
  historian: 'dailyHistorians',              // 历史学家
  narratologist: 'dailyNarratologists',       // 叙事学家
  psychologist: 'dailyPsychologists',        // 心理学家
  softwareArchitect: 'dailySoftwareArchitects', // 软件架构师
  solidityEngineer: 'dailySolidityEngineers',  // Solidity工程师
  xiaohongshuExpert: 'dailyXiaohongshuExperts', // 小红书专家
  seoExpert: 'dailySeoExperts',               // SEO专家
}

// 云数据库实例
let db = null
let initPromise = null

/**
 * 初始化云数据库
 */
function initCloudDb() {
  if (!wx.cloud) {
    console.log('【CloudDb】微信云开发未初始化')
    return Promise.resolve(false)
  }
  
  if (db) {
    return Promise.resolve(true)
  }
  
  if (initPromise) {
    return initPromise
  }
  
  initPromise = new Promise((resolve) => {
    try {
      db = wx.cloud.database()
      console.log('【CloudDb】云数据库初始化成功')
      resolve(true)
    } catch (e) {
      console.error('【CloudDb】云数据库初始化失败:', e)
      resolve(false)
    }
  })
  
  return initPromise
}

/**
 * 云数据库工具类
 */
class CloudDb {
  constructor() {
    this.db = null
    this.ready = false
  }

  /**
   * 初始化
   */
  async init() {
    this.ready = await initCloudDb()
    this.db = db
    return this.ready
  }

  /**
   * 保存单条聊天消息到云端
   */
  async saveMessage(message) {
    if (!this.ready) await this.init()
    if (!this.ready) return null

    try {
      const openid = await this.getOpenId()
      const result = await this.db.collection(COLLECTIONS.CHAT_MESSAGES).add({
        data: {
          openid,
          ...message,
          createTime: this.db.serverDate(),
          isDeleted: false,
        }
      })
      console.log('【CloudDb】消息保存成功:', result._id)
      return result._id
    } catch (e) {
      console.error('【CloudDb】消息保存失败:', e)
      return null
    }
  }

  /**
   * 批量保存聊天消息
   */
  async saveMessages(messages) {
    if (!this.ready) await this.init()
    if (!this.ready || !messages.length) return []

    const openid = await this.getOpenId()
    const results = []

    // 分批保存，每批最多10条
    const BATCH_SIZE = 10
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE)
      const tasks = batch.map(msg => {
        return this.db.collection(COLLECTIONS.CHAT_MESSAGES).add({
          data: {
            openid,
            ...msg,
            createTime: this.db.serverDate(),
            isDeleted: false,
          }
        })
      })
      
      try {
        const batchResults = await Promise.all(tasks)
        results.push(...batchResults.map(r => r._id))
      } catch (e) {
        console.error('【CloudDb】批量保存失败:', e)
      }
    }

    console.log('【CloudDb】批量保存成功:', results.length, '条')
    return results
  }

  /**
   * 获取聊天历史
   */
  async getMessages(options = {}) {
    if (!this.ready) await this.init()
    if (!this.ready) return []

    try {
      const openid = await this.getOpenId()
      const { limit = 50, offset = 0, mode } = options

      let query = this.db.collection(COLLECTIONS.CHAT_MESSAGES)
        .where({
          openid,
          isDeleted: false,
        })
        .orderBy('createTime', 'asc')
        .skip(offset)
        .limit(limit)

      if (mode) {
        query = query.where({ mode })
      }

      const result = await query.get()
      console.log('【CloudDb】获取消息:', result.data.length, '条')
      return result.data
    } catch (e) {
      console.error('【CloudDb】获取消息失败:', e)
      return []
    }
  }

  /**
   * 保存用户画像到云端
   */
  async saveProfile(profile) {
    if (!this.ready) await this.init()
    if (!this.ready) return false

    try {
      const openid = await this.getOpenId()
      
      // 先查询是否存在
      const exist = await this.db.collection(COLLECTIONS.USER_PROFILE)
        .where({ openid })
        .get()

      if (exist.data.length > 0) {
        // 更新
        await this.db.collection(COLLECTIONS.USER_PROFILE).doc(exist.data[0]._id).update({
          data: {
            ...profile,
            updateTime: this.db.serverDate(),
          }
        })
      } else {
        // 新增
        await this.db.collection(COLLECTIONS.USER_PROFILE).add({
          data: {
            openid,
            ...profile,
            createTime: this.db.serverDate(),
            updateTime: this.db.serverDate(),
          }
        })
      }

      console.log('【CloudDb】用户画像保存成功')
      return true
    } catch (e) {
      console.error('【CloudDb】用户画像保存失败:', e)
      return false
    }
  }

  /**
   * 获取用户画像
   */
  async getProfile() {
    if (!this.ready) await this.init()
    if (!this.ready) return null

    try {
      const openid = await this.getOpenId()
      const result = await this.db.collection(COLLECTIONS.USER_PROFILE)
        .where({ openid })
        .get()

      if (result.data.length > 0) {
        console.log('【CloudDb】获取用户画像成功')
        return result.data[0]
      }
      return null
    } catch (e) {
      console.error('【CloudDb】获取用户画像失败:', e)
      return null
    }
  }

  /**
   * 保存用户记忆到云端
   */
  async saveMemory(memory) {
    if (!this.ready) await this.init()
    if (!this.ready) return false

    try {
      const openid = await this.getOpenId()
      
      const exist = await this.db.collection(COLLECTIONS.USER_MEMORY)
        .where({ openid })
        .get()

      if (exist.data.length > 0) {
        await this.db.collection(COLLECTIONS.USER_MEMORY).doc(exist.data[0]._id).update({
          data: {
            ...memory,
            updateTime: this.db.serverDate(),
          }
        })
      } else {
        await this.db.collection(COLLECTIONS.USER_MEMORY).add({
          data: {
            openid,
            ...memory,
            createTime: this.db.serverDate(),
            updateTime: this.db.serverDate(),
          }
        })
      }

      console.log('【CloudDb】用户记忆保存成功')
      return true
    } catch (e) {
      console.error('【CloudDb】用户记忆保存失败:', e)
      return false
    }
  }

  /**
   * 获取用户记忆
   */
  async getMemory() {
    if (!this.ready) await this.init()
    if (!this.ready) return null

    try {
      const openid = await this.getOpenId()
      const result = await this.db.collection(COLLECTIONS.USER_MEMORY)
        .where({ openid })
        .get()

      if (result.data.length > 0) {
        console.log('【CloudDb】获取用户记忆成功')
        return result.data[0]
      }
      return null
    } catch (e) {
      console.error('【CloudDb】获取用户记忆失败:', e)
      return null
    }
  }

  /**
   * 获取模块对应的集合名
   * @param {string} moduleId - 模块ID
   * @returns {string|null} 集合名
   */
  getCollectionName(moduleId) {
    return MODULE_TO_COLLECTION[moduleId] || null
  }

  /**
   * 保存每日内容到云端（通用方法，支持所有50个模块）
   * @param {string} collection - 云端集合名称（如 'dailyQuotes'）
   * @param {object} content - 内容数据
   * @param {string} moduleId - 模块ID（用于日志记录）
   * @returns {string|null} 保存的记录ID
   */
  async saveDailyContent(collection, content, moduleId) {
    if (!this.ready) await this.init()
    if (!this.ready) return null

    if (!collection) {
      console.error('【CloudDb】集合名称不能为空')
      return null
    }

    try {
      // 检查今日是否已存在该模块的内容（避免重复）
      const today = new Date().toISOString().split('T')[0]
      const exist = await this.db.collection(collection)
        .where({
          date: today,
          isAIGenerated: true
        })
        .get()

      if (exist.data.length > 0) {
        console.log(`【CloudDb】${moduleId} 今日内容已存在，更新`)
        // 更新已有记录
        await this.db.collection(collection).doc(exist.data[0]._id).update({
          data: {
            ...content,
            updateTime: this.db.serverDate(),
          }
        })
        return exist.data[0]._id
      }

      // 添加新记录
      const result = await this.db.collection(collection).add({
        data: {
          ...content,
          moduleId,
          date: today,
          createdAt: this.db.serverDate(),
          isAIGenerated: true,
        }
      })
      console.log(`【CloudDb】${moduleId} 内容保存到 ${collection}:`, result._id)
      return result._id
    } catch (e) {
      console.error(`【CloudDb】${moduleId} 保存到 ${collection} 失败:`, e)
      return null
    }
  }

  /**
   * 批量保存每日内容
   * @param {Array} contents - 内容数组 [{collection, content, moduleId}]
   * @returns {number} 成功保存的数量
   */
  async saveDailyContents(contents) {
    let successCount = 0
    for (const item of contents) {
      const result = await this.saveDailyContent(item.collection, item.content, item.moduleId)
      if (result) successCount++
    }
    console.log(`【CloudDb】批量保存完成: ${successCount}/${contents.length}`)
    return successCount
  }

  /**
   * 从云端获取指定模块的内容列表
   * @param {string} collection - 云端集合名称（如 'dailyQuotes'）
   * @param {object} options - 查询选项 {limit, skip, date}
   */
  async getDailyContents(collection, options = {}) {
    if (!this.ready) await this.init()
    if (!this.ready) return []

    if (!collection) {
      console.error('【CloudDb】集合名称不能为空')
      return []
    }

    try {
      const { limit = 20, skip = 0, date } = options
      let query = this.db.collection(collection)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(limit)

      if (date) {
        query = query.where({ date })
      }

      const result = await query.get()
      console.log(`【CloudDb】获取 ${collection} 内容:`, result.data.length, '条')
      return result.data
    } catch (e) {
      console.error(`【CloudDb】获取 ${collection} 内容失败:`, e)
      return []
    }
  }

  /**
   * 同步本地消息到云端
   */
  async syncMessagesToCloud(localMessages) {
    if (!this.ready) await this.init()
    if (!this.ready || !localMessages.length) return 0

    try {
      const cloudMessages = await this.getMessages({ limit: 200 })
      const cloudIds = new Set(cloudMessages.map(m => m.id))
      
      // 找出需要同步的消息
      const toSync = localMessages.filter(m => !cloudIds.has(m.id))
      
      if (toSync.length > 0) {
        await this.saveMessages(toSync)
        console.log('【CloudDb】同步了', toSync.length, '条消息到云端')
      }
      
      return toSync.length
    } catch (e) {
      console.error('【CloudDb】同步失败:', e)
      return 0
    }
  }

  /**
   * 从云端恢复消息到本地
   */
  async restoreMessagesFromCloud() {
    if (!this.ready) await this.init()
    if (!this.ready) return []

    try {
      const cloudMessages = await this.getMessages({ limit: 200 })
      console.log('【CloudDb】从云端恢复了', cloudMessages.length, '条消息')
      return cloudMessages
    } catch (e) {
      console.error('【CloudDb】恢复失败:', e)
      return []
    }
  }

  /**
   * 删除云端消息
   */
  async deleteMessage(msgId) {
    if (!this.ready) await this.init()
    if (!this.ready) return false

    try {
      await this.db.collection(COLLECTIONS.CHAT_MESSAGES).doc(msgId).update({
        data: {
          isDeleted: true,
          deleteTime: this.db.serverDate(),
        }
      })
      console.log('【CloudDb】消息删除成功:', msgId)
      return true
    } catch (e) {
      console.error('【CloudDb】消息删除失败:', e)
      return false
    }
  }

  /**
   * 获取 OpenId（带本地缓存）
   */
  async getOpenId() {
    // 先检查本地缓存
    const cachedOpenid = wx.getStorageSync('userOpenid')
    if (cachedOpenid) {
      return cachedOpenid
    }
    
    try {
      // 设置超时控制
      const res = await wx.cloud.callFunction({ 
        name: 'login',
        timeout: 5000  // 5秒超时
      })
      const openid = res.result.openid || 'anonymous'
      
      // 缓存到本地
      if (openid !== 'anonymous') {
        wx.setStorageSync('userOpenid', openid)
      }
      
      return openid
    } catch (e) {
      console.error('【CloudDb】获取OpenId失败:', e)
      // 超时或其他错误时返回匿名ID
      return 'anonymous'
    }
  }

  /**
   * 获取或生成每日名言（客户端AI调用）
   * @param {Object} options - 配置选项
   * @param {boolean} options.refresh - 是否强制刷新（忽略缓存）
   */
  async getDailyQuote(options = {}) {
    const { refresh = false } = options
    
    // 如果不强制刷新，优先使用缓存
    if (!refresh) {
      const cached = wx.getStorageSync('dailyQuote')
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('【CloudDb】使用今日缓存名言')
          return cached
        }
      }
    }
    
    try {
      console.log('【CloudDb】客户端AI生成名言...')
      const quote = await DailyContent.generateQuote()
      
      if (quote) {
        wx.setStorageSync('dailyQuote', quote)
        console.log('【CloudDb】名言生成成功:', quote.content?.substring(0, 20), 'AI生成:', quote.isAIGenerated)
        return quote
      }
    } catch (e) {
      console.error('【CloudDb】生成每日名言失败:', e)
    }
    return null
  }

  /**
   * 获取或生成每日搞笑段子（客户端AI调用）
   * @param {Object} options - 配置选项
   * @param {boolean} options.refresh - 是否强制刷新（忽略缓存）
   */
  async getDailyJoke(options = {}) {
    const { refresh = false } = options
    
    // 如果不强制刷新，优先使用缓存
    if (!refresh) {
      const cached = wx.getStorageSync('dailyJoke')
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('【CloudDb】使用今日缓存段子')
          return cached
        }
      }
    }
    
    try {
      console.log('【CloudDb】客户端AI生成段子...')
      const joke = await DailyContent.generateJoke()
      
      if (joke) {
        wx.setStorageSync('dailyJoke', joke)
        console.log('【CloudDb】段子生成成功:', joke.title, 'AI生成:', joke.isAIGenerated)
        return joke
      }
    } catch (e) {
      console.error('【CloudDb】生成每日段子失败:', e)
    }
    return null
  }

  /**
   * 获取或生成每日心理学知识（客户端AI调用）
   * @param {Object} options - 配置选项
   * @param {boolean} options.refresh - 是否强制刷新（忽略缓存）
   */
  async getDailyPsychology(options = {}) {
    const { refresh = false } = options
    
    // 如果不强制刷新，优先使用缓存
    if (!refresh) {
      const cached = wx.getStorageSync('dailyPsychology')
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('【CloudDb】使用今日缓存心理学知识')
          return cached
        }
      }
    }
    
    try {
      console.log('【CloudDb】客户端AI生成心理学知识...')
      const psychology = await DailyContent.generatePsychology()
      
      if (psychology) {
        wx.setStorageSync('dailyPsychology', psychology)
        console.log('【CloudDb】心理学知识生成成功:', psychology.title, 'AI生成:', psychology.isAIGenerated)
        return psychology
      }
    } catch (e) {
      console.error('【CloudDb】生成每日心理学知识失败:', e)
    }
    return null
  }

  /**
   * 获取或生成每日金融知识（客户端AI调用）
   * @param {Object} options - 配置选项
   * @param {boolean} options.refresh - 是否强制刷新（忽略缓存）
   */
  async getDailyFinance(options = {}) {
    const { refresh = false } = options
    
    // 如果不强制刷新，优先使用缓存
    if (!refresh) {
      const cached = wx.getStorageSync('dailyFinance')
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('【CloudDb】使用今日缓存金融知识')
          return cached
        }
      }
    }
    
    try {
      console.log('【CloudDb】客户端AI生成金融知识...')
      const finance = await DailyContent.generateFinance()
      
      if (finance) {
        wx.setStorageSync('dailyFinance', finance)
        console.log('【CloudDb】金融知识生成成功:', finance.title, 'AI生成:', finance.isAIGenerated)
        return finance
      }
    } catch (e) {
      console.error('【CloudDb】生成每日金融知识失败:', e)
    }
    return null
  }

  /**
   * 获取或生成每日情话（客户端AI调用）
   * @param {Object} options - 配置选项
   * @param {boolean} options.refresh - 是否强制刷新（忽略缓存）
   */
  async getDailyLove(options = {}) {
    const { refresh = false } = options
    
    // 如果不强制刷新，优先使用缓存
    if (!refresh) {
      const cached = wx.getStorageSync('dailyLove')
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('【CloudDb】使用今日缓存情话')
          return cached
        }
      }
    }
    
    try {
      console.log('【CloudDb】客户端AI生成情话...')
      const love = await DailyContent.generateLove()
      
      if (love) {
        wx.setStorageSync('dailyLove', love)
        console.log('【CloudDb】情话生成成功:', love.content?.substring(0, 20), 'AI生成:', love.isAIGenerated)
        return love
      }
    } catch (e) {
      console.error('【CloudDb】生成每日情话失败:', e)
    }
    return null
  }
}

// 导出单例
const cloudDb = new CloudDb()

module.exports = {
  cloudDb,
  COLLECTIONS,
  MODULE_TO_COLLECTION,
}
