// components/dailyCard/dailyCard.js - 每日内容卡片组件
const { MODULE_TYPES, MODULE_CONFIGS, FALLBACK_DATA } = require('../../utils/dailyModule.js')
const { DailyContent } = require('../../utils/dailyContent.js')
const { getModuleConfigSync, getModuleConfig } = require('../../utils/moduleConfig.js')
const cloudData = require('../../utils/cloudData.js')

// 全局请求队列，控制同时发起的 AI 请求数量
const MAX_CONCURRENT_REQUESTS = 3
let currentRequestCount = 0
const pendingRequests = []

/**
 * 请求队列管理
 */
function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      if (currentRequestCount >= MAX_CONCURRENT_REQUESTS) {
        // 等待后再试
        setTimeout(() => execute().then(resolve).catch(reject), 500)
        return
      }
      currentRequestCount++
      try {
        const result = await fn()
        resolve(result)
      } catch (err) {
        reject(err)
      } finally {
        currentRequestCount--
        // 执行下一个等待中的请求
        if (pendingRequests.length > 0) {
          const next = pendingRequests.shift()
          next()
        }
      }
    }
    pendingRequests.push(execute)
    // 随机延迟 0-1.5 秒，避免同时发起大量请求
    const delay = Math.random() * 1500
    setTimeout(() => execute(), delay)
  })
}

/**
 * 获取兜底数据（使用日期作为种子，保证每天固定）
 * 优先级：云端数据 > 本地 JS 数据
 */
function getFallbackContent(moduleType, config) {
  console.log('[DailyCard] getFallbackContent, moduleType:', moduleType)
  
  // 1. 优先从云端数据获取
  let fallbackList = null
  
  // 尝试从 cloudData 获取
  const cloudModuleData = cloudData.getModuleData(moduleType)
  if (cloudModuleData) {
    // 查找 FALLBACK_ 开头的数组
    const fallbackKey = Object.keys(cloudModuleData).find(k => 
      k.startsWith('FALLBACK_') || k.endsWith('_QUOTES') || k.endsWith('_DATA') || k.endsWith('_SCENES')
    )
    if (fallbackKey && Array.isArray(cloudModuleData[fallbackKey])) {
      fallbackList = cloudModuleData[fallbackKey]
      console.log('[DailyCard] 使用云端数据:', fallbackList.length + ' 条')
    }
  }
  
  // 2. 降级到本地 JS 数据
  if (!fallbackList || fallbackList.length === 0) {
    fallbackList = FALLBACK_DATA[moduleType]
    console.log('[DailyCard] 使用本地数据:', fallbackList ? fallbackList.length + ' 条' : '无数据')
  }
  
  if (!fallbackList || fallbackList.length === 0) {
    return null
  }
  if (!fallbackList || fallbackList.length === 0) {
    return null
  }
  
  // 使用日期种子，保证每天看到相同内容
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % fallbackList.length

  
  const fallback = { ...fallbackList[index] }
  
  // 统一字段映射：统一为 title + content 格式，方便海报生成
  // 注：quote/love 数据已统一使用新字段名，无需额外映射
  if (moduleType === 'quote') {
    // 时光絮语: 字段已统一为 { content, title, subtitle, categoryIcon, category }
    // 兼容处理：如果存在旧字段名则映射，否则直接使用
    if (fallback.text && !fallback.content) {
      fallback.title = fallback.author || '佚名'
      fallback.content = fallback.text || ''
      fallback.subtitle = fallback.work || ''
      fallback.category = fallback.domainName || '名言'
      fallback.categoryIcon = fallback.domainIcon || '📜'
      // 删除原始字段
      delete fallback.text
      delete fallback.author
      delete fallback.work
      delete fallback.domainName
      delete fallback.domainIcon
    } else {
      // 新格式字段，确保必需字段有默认值
      fallback.title = fallback.title || '佚名'
      fallback.content = fallback.content || ''
      fallback.subtitle = fallback.subtitle || ''
      fallback.categoryIcon = fallback.categoryIcon || '📜'
      fallback.category = fallback.category || '名言'
    }
  } else if (moduleType === 'love') {
    // 心动絮语: title=出处, content=情话, subtitle=作者
    fallback.title = fallback.source || (fallback.category ? getLoveCategoryName(fallback.category) : '情话')
    fallback.content = fallback.content || ''
    fallback.subtitle = fallback.author || '佚名'
    fallback.categoryIcon = getLoveCategoryIcon(fallback.category)
    // 删除原始字段
    delete fallback.category
  } else if (moduleType === 'fortune') {
    // 卦象玄机: title=卦名, content=描述, subtitle=卦象属性
    fallback.title = fallback.name
    fallback.content = fallback.description || '卦象'
    fallback.subtitle = fallback.nature || fallback.attribute || '玄学'
    fallback.category = fallback.nature || fallback.element || fallback.trait || '玄学'
    fallback.categoryIcon = fallback.symbol || '🔮'
    // 删除原始字段
    delete fallback.name
    delete fallback.description
    delete fallback.symbol
    delete fallback.nature
    delete fallback.attribute
    delete fallback.meaning
    delete fallback.element
    delete fallback.planet
    delete fallback.trait
    delete fallback.date
    delete fallback.year
  }
  
  fallback.date = today.toISOString().split('T')[0]
  fallback.isAIGenerated = false
  fallback.isFallback = true
  
  // 添加来源标记
  if (!fallback.source) {
    fallback.source = config.name || '每日推荐'
  }
  
  return fallback
}

/**
 * 获取情话分类名称
 */
function getLoveCategoryName(category) {
  const categoryNames = {
    classic: '经典古风',
    modern: '甜蜜现代',
    celebrity: '名人情话',
    poetry: '诗词传情'
  }
  return categoryNames[category] || '情话'
}

/**
 * 获取情话分类图标
 */
function getLoveCategoryIcon(category) {
  const categoryIcons = {
    classic: '🌸',
    modern: '💕',
    celebrity: '⭐',
    poetry: '📜'
  }
  return categoryIcons[category] || '💕'
}

Component({
  properties: {
    // 板块类型：quote/joke/psychology/finance/love/movie
    moduleType: {
      type: String,
      value: MODULE_TYPES.QUOTE,
    },
  },

  data: {
    config: null,
    content: null,
    isLoading: false,
    tags: [],
    isAILoading: false, // AI生成中（用于显示加载动画）
    hasAIRefreshed: false, // 是否已经过AI刷新过
  },

  lifetimes: {
    attached() {
      console.log('[DailyCard] attached 执行, moduleType:', this.properties.moduleType)
      this._initModule()
    },
  },

  pageLifetimes: {
    show() {
      // 页面显示时检查是否需要加载
      if (!this.data.content) {
        this.loadContent()
      }
    },
  },

  methods: {
  // 初始化模块配置
  _initModule() {
    const moduleType = this.properties.moduleType
    console.log('[DailyCard] _initModule 开始, moduleType:', moduleType)
      
    // 1. 优先从本地缓存的配置读取（同步，快速）
    const cloudConfig = getModuleConfigSync()
    console.log('[DailyCard] cloudConfig:', cloudConfig ? '有数据' : '无数据', 
                 cloudConfig?.modules?.length ? cloudConfig.modules.length + ' 个模块' : '')
    
    const moduleConfig = cloudConfig?.modules?.find(m => m.id === moduleType)
    console.log('[DailyCard] moduleConfig:', moduleConfig ? '找到' : '未找到', moduleType)
    
    if (moduleConfig) {
      // 使用云配置文件中的配置
      const config = {
        ...moduleConfig,
        id: moduleType,
      }
      console.log('[DailyCard] 使用云端配置:', config.name)
      this.setData({ config })
      this._loadContent(config)
    } else {
      // 2. 降级到硬编码配置
      const config = MODULE_CONFIGS[moduleType]
      console.log('[DailyCard] 使用硬编码配置:', config ? config.name : '未找到')
      if (!config) {
        console.error('[DailyCard] 未知的模块类型:', moduleType)
        return
      }
      this.setData({ config })
      this._loadContent(config)
      
      // 3. 异步尝试加载云配置（更新缓存）
      this._syncCloudConfig()
    }
  },

    // 异步同步云配置到本地
    async _syncCloudConfig() {
      try {
        await getModuleConfig()
      } catch (e) {
        // 静默失败，使用硬编码配置
      }
    },

    // 加载内容（从配置读取后执行）
    _loadContent(config) {
      console.log('[DailyCard] _loadContent 开始, storageKey:', config.storageKey)

      // 1. 先检查缓存（今天的数据直接使用）
      const cached = wx.getStorageSync(config.storageKey)
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          console.log('[DailyCard] 使用缓存数据')
          this.setData({ content: cached, hasAIRefreshed: cached.isAIGenerated || false })
          this._buildTags(cached)
          return
        }
      }

      // 2. 无缓存时，立即显示兜底数据（不调用AI）
      console.log('[DailyCard] 无缓存，获取兜底数据')
      const fallback = getFallbackContent(this.properties.moduleType, config)
      console.log('[DailyCard] fallback 结果:', fallback ? '有数据' : '无数据')
      if (fallback) {
        this.setData({ content: fallback })
        this._buildTags(fallback)
      }
      // 初始化时不调用AI，仅用户点击"换一条"时才触发
    },

    // 构建标签
    _buildTags(content) {
      const { config } = this.data
      if (!config || !content) return

      const tags = []
      const tagConfig = config.tags || {}

      // 处理字段标签
      for (const [key, value] of Object.entries(tagConfig)) {
        if (key === 'ai') {
          if (content.isAIGenerated) {
            tags.push({ type: 'ai', text: value || 'AI' })
          }
        } else if (key === 'era') {
          if (content.era) {
            const eraText = content.era === 'ancient' ? '古训' : '今言'
            tags.push({ type: 'meta', text: eraText })
          }
        } else if (key === 'region') {
          if (content.region) {
            tags.push({ type: 'meta', text: content.region === 'china' ? '🇨🇳' : '🌍' })
          }
        } else if (key === 'scene') {
          if (content.scene) {
            tags.push({ type: 'field', text: content.scene, icon: content.sceneIcon || '💬' })
          }
        } else if (key === 'year') {
          if (content.year) {
            tags.push({ type: 'meta', text: content.year + '年' })
          }
        } else if (key === 'director') {
          if (content.director) {
            tags.push({ type: 'meta', text: content.director })
          }
        } else if (key === 'rating') {
          if (content.rating) {
            tags.push({ type: 'rating', text: '⭐ ' + content.rating })
          }
        } else if (typeof value === 'object' && value.field) {
          // { field: 'xxx', icon: 'xxx' } 格式
          const fieldValue = content[value.field]
          const iconValue = value.icon ? content[value.icon] : ''
          if (fieldValue) {
            tags.push({ type: 'field', text: fieldValue, icon: iconValue })
          }
        }
      }

      this.setData({ tags })
    },

    // 加载内容（仅从缓存/兜底加载，不调AI）
    loadContent() {
      const { config } = this.data
      if (!config) return

      // 先检查缓存
      const cached = wx.getStorageSync(config.storageKey)
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          this.setData({ content: cached, hasAIRefreshed: cached.isAIGenerated || false })
          this._buildTags(cached)
          return
        }
      }

      // 无缓存，显示兜底（不调用AI）
      const fallback = getFallbackContent(this.properties.moduleType, config)
      if (fallback) {
        this.setData({ content: fallback })
        this._buildTags(fallback)
      }
    },

    // 刷新内容（用户点击"换一条"，强制调用AI）
    async onRefresh() {
      if (this.data.isLoading) return
      await this._fetchContent(true)
    },

    // 获取内容（统一入口）
    async _fetchContent(refresh = false) {
      const { config, moduleType } = this.data
      if (!config || this.data.isLoading) return

      this.setData({ isLoading: true, isAILoading: true })

      try {
        let content

        // 根据类型获取内容（使用请求队列控制并发）
        const getContentFn = async () => {
          switch (moduleType) {
            case MODULE_TYPES.QUOTE:
              return await this._getDailyQuote(refresh)
            case MODULE_TYPES.JOKE:
              return await this._getDailyJoke(refresh)
            case MODULE_TYPES.PSYCHOLOGY:
              return await this._getDailyPsychology(refresh)
            case MODULE_TYPES.FINANCE:
              return await this._getDailyFinance(refresh)
            case MODULE_TYPES.LOVE:
              return await this._getDailyLove(refresh)
            case MODULE_TYPES.MOVIE:
              return await this._getDailyMovie(refresh)
            case MODULE_TYPES.MUSIC:
              return await this._getDailyMusic(refresh)
            case MODULE_TYPES.TECH:
              return await this._getDailyTech(refresh)
            case MODULE_TYPES.TCM:
              return await this._getDailyTcm(refresh)
            case MODULE_TYPES.TRAVEL:
              return await this._getDailyTravel(refresh)
            case MODULE_TYPES.FORTUNE:
              return await this._getDailyFortune(refresh)
            case MODULE_TYPES.LITERATURE:
              return await this._getDailyLiterature(refresh)
            case MODULE_TYPES.FOREIGN_TRADE:
              return await this._getDailyForeignTrade(refresh)
            case MODULE_TYPES.ECOMMERCE:
              return await this._getDailyECommerce(refresh)
            case MODULE_TYPES.MATH:
              return await this._getDailyMath(refresh)
            case MODULE_TYPES.ENGLISH:
              return await this._getDailyEnglish(refresh)
            case MODULE_TYPES.PROGRAMMING:
              return await this._getDailyProgramming(refresh)
            case MODULE_TYPES.PHOTOGRAPHY:
              return await this._getDailyPhotography(refresh)
            case MODULE_TYPES.BEAUTY:
              return await this._getDailyBeauty(refresh)
            case MODULE_TYPES.INVESTMENT:
              return await this._getDailyInvestment(refresh)
            case MODULE_TYPES.FISHING:
              return await this._getDailyFishing(refresh)
            case MODULE_TYPES.FITNESS:
              return await this._getDailyFitness(refresh)
            case MODULE_TYPES.PET:
              return await this._getDailyPet(refresh)
            case MODULE_TYPES.FASHION:
              return await this._getDailyFashion(refresh)
            case MODULE_TYPES.OUTFIT:
              return await this._getDailyOutfit(refresh)
            case MODULE_TYPES.DECORATION:
              return await this._getDailyDecoration(refresh)
            case MODULE_TYPES.GLASS_FIBER:
              return await this._getDailyGlassFiber(refresh)
            case MODULE_TYPES.RESIN:
              return await this._getDailyResin(refresh)
            case MODULE_TYPES.TAX:
              return await this._getDailyTax(refresh)
            case MODULE_TYPES.LAW:
              return await this._getDailyLaw(refresh)
            case MODULE_TYPES.OFFICIAL:
              return await this._getDailyOfficial(refresh)
            case MODULE_TYPES.HANDLING:
              return await this._getDailyHandling(refresh)
            case MODULE_TYPES.FLORAL:
              return await this._getDailyFloral(refresh)
            case MODULE_TYPES.HISTORY:
              return await this._getDailyHistory(refresh)
            case MODULE_TYPES.MILITARY:
              return await this._getDailyMilitary(refresh)
            case MODULE_TYPES.STOCK:
              return await this._getDailyStock(refresh)
            case MODULE_TYPES.ECONOMICS:
              return await this._getDailyEconomics(refresh)
            case MODULE_TYPES.BUSINESS:
              return await this._getDailyBusiness(refresh)
            case MODULE_TYPES.NEWS:
              return await this._getDailyNews(refresh)
            default:
              throw new Error('未知的模块类型')
          }
        }

        content = await enqueueRequest(getContentFn)

        if (content) {
          // 缓存到本地
          wx.setStorageSync(config.storageKey, content)
          // 保存到云数据库
          await this._saveToCloud(content)
          // 更新UI
          this.setData({ 
            content,
            hasAIRefreshed: true
          })
          this._buildTags(content)
          // 触发事件
          this.triggerEvent('contentchange', { content, moduleType })
        }
      } catch (e) {
        console.error(`[DailyCard] AI生成失败 (${moduleType}):`, e?.message || e)
        // AI生成失败时，如果有兜底数据就保持，没有则提示（用户主动刷新时）
        if (refresh && !this.data.content) {
          wx.showToast({ title: '获取失败，请重试', icon: 'none' })
        }
      } finally {
        this.setData({ isLoading: false, isAILoading: false })
      }
    },

    // 获取每日名言
    async _getDailyQuote(refresh) {
      // 检查缓存
      if (!refresh) {
        const cached = wx.getStorageSync('dailyQuote')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      // AI生成
      const content = await DailyContent.generateQuote()
      return content
    },

    // 获取每日段子
    async _getDailyJoke(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyJoke')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateJoke()
      return content
    },

    // 获取每日心理学
    async _getDailyPsychology(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyPsychology')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generatePsychology()
      return content
    },

    // 获取每日金融
    async _getDailyFinance(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFinance')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFinance()
      return content
    },

    // 获取每日情话
    async _getDailyLove(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyLove')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateLove()
      return content
    },

    // 获取每日电影
    async _getDailyMovie(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyMovie')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateMovie()
      return content
    },

    // 获取每日音乐
    async _getDailyMusic(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyMusic')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateMusic()
      return content
    },

    // 获取每日科技
    async _getDailyTech(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyTech')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateTech()
      return content
    },

    // 获取每日中医
    async _getDailyTcm(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyTcm')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateTcm()
      return content
    },

    // 获取每日旅游
    async _getDailyTravel(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyTravel')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateTravel()
      return content
    },

    // 获取每日一卦
    async _getDailyFortune(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFortune')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFortune()
      return content
    },

    // 获取每日文学
    async _getDailyLiterature(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyLiterature')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateLiterature()
      return content
    },

    // 获取外贸助手
    async _getDailyForeignTrade(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyForeignTrade')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateForeignTrade()
      return content
    },

    // 获取电商运营助手
    async _getDailyECommerce(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyECommerce')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateECommerce()
      return content
    },

    // 获取中学数学助手
    async _getDailyMath(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyMath')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateMath()
      return content
    },

    // 获取中学英语助手
    async _getDailyEnglish(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyEnglish')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateEnglish()
      return content
    },

    // 获取计算机编程助手
    async _getDailyProgramming(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyProgramming')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateProgramming()
      return content
    },

    // 获取摄影达人
    async _getDailyPhotography(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyPhotography')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generatePhotography()
      return content
    },

    // 获取美妆达人
    async _getDailyBeauty(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyBeauty')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateBeauty()
      return content
    },

    // 获取投资理财达人
    async _getDailyInvestment(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyInvestment')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateInvestment()
      return content
    },

    // 获取钓鱼达人
    async _getDailyFishing(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFishing')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFishing()
      return content
    },

    // 获取健身达人
    async _getDailyFitness(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFitness')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFitness()
      return content
    },

    // 获取宠物达人
    async _getDailyPet(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyPet')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generatePet()
      return content
    },

    // 获取时尚达人
    async _getDailyFashion(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFashion')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFashion()
      return content
    },

    // 获取穿搭达人
    async _getDailyOutfit(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyOutfit')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateOutfit()
      return content
    },

    // 获取装修达人
    async _getDailyDecoration(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyDecoration')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateDecoration()
      return content
    },

    // 获取玻纤达人
    async _getDailyGlassFiber(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyGlassFiber')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFiber()
      return content
    },

    // 获取树脂达人
    async _getDailyResin(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyResin')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateResin()
      return content
    },

    // 获取财税助手
    async _getDailyTax(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyTax')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateTax()
      return content
    },

    // 获取法律顾问
    async _getDailyLaw(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyLaw')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateLaw()
      return content
    },

    // 获取官场达人
    async _getDailyOfficial(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyOfficial')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateOfficial()
      return content
    },

    // 获取处事达人
    async _getDailyHandling(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyHandling')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateHandling()
      return content
    },

    // 获取花艺达人
    async _getDailyFloral(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyFloral')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateFloral()
      return content
    },

    // 获取历史典故达人
    async _getDailyHistory(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyHistory')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateHistory()
      return content
    },

    // 获取军事达人
    async _getDailyMilitary(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyMilitary')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }

      const content = await DailyContent.generateMilitary()
      return content
    },

    // 获取股票期货专家
    async _getDailyStock(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyStock')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }
      const content = await DailyContent.generateStock()
      return content
    },

    // 获取经济学专家
    async _getDailyEconomics(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyEconomics')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }
      const content = await DailyContent.generateEconomics()
      return content
    },

    // 获取生意人助手
    async _getDailyBusiness(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyBusiness')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }
      const content = await DailyContent.generateBusiness()
      return content
    },

    // 获取新闻助手
    async _getDailyNews(refresh) {
      if (!refresh) {
        const cached = wx.getStorageSync('dailyNews')
        if (cached) {
          const today = new Date().toISOString().split('T')[0]
          if (cached.date === today) return cached
        }
      }
      const content = await DailyContent.generateNews()
      return content
    },

    // 保存到云数据库
    async _saveToCloud(content) {
      const { moduleType } = this.data

      try {
        const db = wx.cloud.database()
        const collectionMap = {
          [MODULE_TYPES.QUOTE]: 'dailyQuotes',
          [MODULE_TYPES.JOKE]: 'dailyJokes',
          [MODULE_TYPES.PSYCHOLOGY]: 'dailyPsychology',
          [MODULE_TYPES.FINANCE]: 'dailyFinance',
          [MODULE_TYPES.LOVE]: 'dailyLoves',
          [MODULE_TYPES.MOVIE]: 'dailyMovies',
          [MODULE_TYPES.MUSIC]: 'dailyMusics',
          [MODULE_TYPES.TECH]: 'dailyTechs',
          [MODULE_TYPES.TCM]: 'dailyTcms',
          [MODULE_TYPES.TRAVEL]: 'dailyTravels',
          [MODULE_TYPES.FORTUNE]: 'dailyFortunes',
          [MODULE_TYPES.LITERATURE]: 'dailyLiteratures',
          [MODULE_TYPES.FOREIGN_TRADE]: 'dailyForeignTrades',
          [MODULE_TYPES.ECOMMERCE]: 'dailyECommerces',
          [MODULE_TYPES.MATH]: 'dailyMaths',
          [MODULE_TYPES.ENGLISH]: 'dailyEnglishes',
          [MODULE_TYPES.PROGRAMMING]: 'dailyProgrammings',
          [MODULE_TYPES.PHOTOGRAPHY]: 'dailyPhotographies',
          [MODULE_TYPES.BEAUTY]: 'dailyBeauties',
          [MODULE_TYPES.INVESTMENT]: 'dailyInvestments',
          [MODULE_TYPES.FISHING]: 'dailyFishings',
          [MODULE_TYPES.FITNESS]: 'dailyFitnesses',
          [MODULE_TYPES.PET]: 'dailyPets',
          [MODULE_TYPES.FASHION]: 'dailyFashions',
          [MODULE_TYPES.OUTFIT]: 'dailyOutfits',
          [MODULE_TYPES.DECORATION]: 'dailyDecorations',
          [MODULE_TYPES.GLASS_FIBER]: 'dailyGlassFibers',
          [MODULE_TYPES.RESIN]: 'dailyResins',
          [MODULE_TYPES.TAX]: 'dailyTaxs',
          [MODULE_TYPES.LAW]: 'dailyLaws',
          [MODULE_TYPES.OFFICIAL]: 'dailyOfficials',
          [MODULE_TYPES.HANDLING]: 'dailyHandlings',
          [MODULE_TYPES.FLORAL]: 'dailyFlorals',
          [MODULE_TYPES.HISTORY]: 'dailyHistorys',
          [MODULE_TYPES.MILITARY]: 'dailyMilitarys',
          [MODULE_TYPES.STOCK]: 'dailyStocks',
          [MODULE_TYPES.ECONOMICS]: 'dailyEconomics',
          [MODULE_TYPES.BUSINESS]: 'dailyBusinesss',
          [MODULE_TYPES.NEWS]: 'dailyNewss',
        }

        const collection = collectionMap[moduleType]
        if (!collection) return

        await db.collection(collection).add({
          data: {
            ...content,
            createdAt: db.serverDate(),
          }
        })
        console.log(`[DailyCard] 内容已保存到云数据库 (${collection})`)
      } catch (e) {
        console.error(`[DailyCard] 保存到云数据库失败:`, e.message)
      }
    },


    // 分享
    onShare() {
      const { content, config } = this.data
      if (!content) {
        wx.showToast({ title: `暂无${config.name}可分享`, icon: 'none' })
        return
      }

      // 构建分享参数
      let url, params = `type=${config.posterType}`

      switch (config.posterType) {
        case 'quote':
          // 时光絮语: title=名言内容, author=作者, subtitle=出处
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.subtitle)}&content=${encodeURIComponent(content.content + ' - ' + content.title)}&icon=${encodeURIComponent(content.categoryIcon || '📜')}`
          break
        case 'joke':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.content)}&subtitle=${encodeURIComponent('场景：' + content.scene)}&icon=${encodeURIComponent(content.sceneIcon || '💬')}`
          break
        case 'psychology':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.content)}&subtitle=${encodeURIComponent(content.field)}&icon=${encodeURIComponent(content.fieldIcon || '🧠')}`
          break
        case 'finance':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.content)}&subtitle=${encodeURIComponent(content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💰')}`
          break
        case 'love':
          // 心动絮语: title=情话内容, author=作者, subtitle=出处
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.content)}&subtitle=${encodeURIComponent(content.author)}&icon=${encodeURIComponent(content.categoryIcon || '💕')}`
          break
        case 'movie':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.director + ' | ' + content.year + ' | 评分 ' + content.rating)}&icon=${encodeURIComponent(content.genreIcon || '🎬')}`
          break
        case 'music':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.description)}&subtitle=${encodeURIComponent(content.artist + ' | ' + content.year)}&icon=${encodeURIComponent(content.genreIcon || '🎵')}`
          break
        case 'tech':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🔬')}`
          break
        case 'tcm':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🌿')}`
          break
        case 'travel':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.region)}&icon=${encodeURIComponent(content.regionIcon || '🌍')}`
          break
        case 'fortune':
          // 卦象玄机: title=卦名, content=描述, subtitle=属性
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.content)}&subtitle=${encodeURIComponent(content.subtitle || content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🔮')}`
          break
        case 'literature':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.author)}&content=${encodeURIComponent(content.summary +"【"+ content.quote +"】")}&subtitle=${encodeURIComponent(content.works ? content.works.join('、') : '')}&icon=${encodeURIComponent('📚')}`
          break
        case 'foreignTrade':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💼') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💼')}`
          break
        case 'ecommerce':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🛒') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🛒')}`
          break
        case 'math':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📐') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📐')}`
          break
        case 'english':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📚') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📚')}`
          break
        case 'programming':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💻') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💻')}`
          break
        case 'photography':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📷') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📷')}`
          break
        case 'beauty':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💄') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💄')}`
          break
        case 'investment':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💰') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💰')}`
          break
        case 'fishing':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🎣') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🎣')}`
          break
        case 'fitness':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💪') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💪')}`
          break
        case 'pet':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🐾') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🐾')}`
          break
        case 'fashion':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '✨') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '✨')}`
          break
        case 'outfit':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '👕') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '👕')}`
          break
        case 'decoration':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🏠') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🏠')}`
          break
        case 'glassFiber':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🧵') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🧵')}`
          break
        case 'resin':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🧪') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🧪')}`
          break
        case 'tax':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📋') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📋')}`
          break
        case 'law':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '⚖️') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '⚖️')}`
          break
        case 'official':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🎩') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🎩')}`
          break
        case 'handling':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💎') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💎')}`
          break
        case 'floral':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💐') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💐')}`
          break
        case 'history':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📚') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📚')}`
          break
        case 'military':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '🎖️') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🎖️')}`
          break
        case 'stock':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📈') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📈')}`
          break
        case 'economics':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💰') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💰')}`
          break
        case 'business':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '💼') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '💼')}`
          break
        case 'news':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent((content.categoryIcon || '📰') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '📰')}`
          break
      }

      wx.navigateTo({ url: `${url}?${params}` })
    },

    // 查看更多（跳转列表页）
    onViewMore() {
      const { moduleType, config } = this.data
      wx.navigateTo({
        url: `/pages/list/index?type=${moduleType}`
      })
    },
  },
})
