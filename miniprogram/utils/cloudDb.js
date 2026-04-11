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

// 云数据库集合名称
const COLLECTIONS = {
  CHAT_MESSAGES: 'chatMessages',    // 聊天消息
  USER_PROFILE: 'userProfile',       // 用户画像
  USER_MEMORY: 'userMemory',        // 用户记忆
  SETTINGS: 'userSettings',          // 用户设置
  DAILY_QUOTE: 'dailyQuotes',        // 每日名言
  DAILY_JOKE: 'dailyJokes',          // 每日段子
  DAILY_PSYCHOLOGY: 'dailyPsychology', // 每日心理学
  DAILY_FINANCE: 'dailyFinance',     // 每日金融
  DAILY_LOVE: 'dailyLoves',          // 每日情话
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
}
