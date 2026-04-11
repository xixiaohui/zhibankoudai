// components/dailyCard/dailyCard.js - 每日内容卡片组件
const { MODULE_TYPES, MODULE_CONFIGS, FALLBACK_DATA, AI_PROMPTS } = require('../../utils/dailyModule.js')
const { DailyContent } = require('../../utils/dailyContent.js')

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
  },

  lifetimes: {
    attached() {
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
      const config = MODULE_CONFIGS[this.properties.moduleType]
      if (!config) {
        console.error('[DailyCard] 未知的模块类型:', this.properties.moduleType)
        return
      }
      this.setData({ config })

      // 加载缓存
      const cached = wx.getStorageSync(config.storageKey)
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          this.setData({ content: cached })
          this._buildTags(cached)
        }
      }
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

    // 加载内容
    async loadContent() {
      const { config } = this.data
      if (!config) return

      // 先检查缓存
      const cached = wx.getStorageSync(config.storageKey)
      if (cached) {
        const today = new Date().toISOString().split('T')[0]
        if (cached.date === today) {
          this.setData({ content: cached })
          this._buildTags(cached)
          return
        }
      }

      // 触发加载
      await this._fetchContent(false)
    },

    // 刷新内容
    async onRefresh() {
      if (this.data.isLoading) return
      await this._fetchContent(true)
    },

    // 获取内容（统一入口）
    async _fetchContent(refresh = false) {
      const { config, moduleType } = this.data
      if (!config || this.data.isLoading) return

      this.setData({ isLoading: true })

      try {
        let content

        // 根据类型获取内容
        switch (moduleType) {
          case MODULE_TYPES.QUOTE:
            content = await this._getDailyQuote(refresh)
            break
          case MODULE_TYPES.JOKE:
            content = await this._getDailyJoke(refresh)
            break
          case MODULE_TYPES.PSYCHOLOGY:
            content = await this._getDailyPsychology(refresh)
            break
          case MODULE_TYPES.FINANCE:
            content = await this._getDailyFinance(refresh)
            break
          case MODULE_TYPES.LOVE:
            content = await this._getDailyLove(refresh)
            break
          case MODULE_TYPES.MOVIE:
            content = await this._getDailyMovie(refresh)
            break
          case MODULE_TYPES.MUSIC:
            content = await this._getDailyMusic(refresh)
            break
          case MODULE_TYPES.TECH:
            content = await this._getDailyTech(refresh)
            break
          case MODULE_TYPES.TCM:
            content = await this._getDailyTcm(refresh)
            break
          case MODULE_TYPES.TRAVEL:
            content = await this._getDailyTravel(refresh)
            break
          case MODULE_TYPES.FORTUNE:
            content = await this._getDailyFortune(refresh)
            break
          case MODULE_TYPES.LITERATURE:
            content = await this._getDailyLiterature(refresh)
            break
          case MODULE_TYPES.FOREIGN_TRADE:
            content = await this._getDailyForeignTrade(refresh)
            break
          case MODULE_TYPES.ECOMMERCE:
            content = await this._getDailyECommerce(refresh)
            break
          case MODULE_TYPES.MATH:
            content = await this._getDailyMath(refresh)
            break
          case MODULE_TYPES.ENGLISH:
            content = await this._getDailyEnglish(refresh)
            break
          default:
            throw new Error('未知的模块类型')
        }

        if (content) {
          // 缓存到本地
          wx.setStorageSync(config.storageKey, content)
          // 保存到云数据库
          await this._saveToCloud(content)
          // 更新UI
          this.setData({ content })
          this._buildTags(content)
          // 触发事件
          this.triggerEvent('contentchange', { content, moduleType })
        }
      } catch (e) {
        console.error(`[DailyCard] 获取内容失败 (${moduleType}):`, e)
        wx.showToast({ title: '获取失败，请重试', icon: 'none' })
      } finally {
        this.setData({ isLoading: false })
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
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.text)}&author=${encodeURIComponent(content.author)}&subtitle=${encodeURIComponent(content.domainName || '名言')}&icon=${encodeURIComponent(content.domainIcon || '📜')}`
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
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.content)}&author=${encodeURIComponent(content.author)}&subtitle=${encodeURIComponent(content.source || content.categoryName)}&icon=${encodeURIComponent(content.categoryIcon || '💕')}`
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
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🔮')}`
          break
        case 'literature':
          url = `/pages/poster/index`
          params += `&title=${encodeURIComponent(content.author)}&content=${encodeURIComponent(content.summary)}&subtitle=${encodeURIComponent(content.works ? content.works.join('、') : '')}&icon=${encodeURIComponent('📚')}`
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
      }

      wx.navigateTo({ url: `${url}?${params}` })
    },
  },
})
