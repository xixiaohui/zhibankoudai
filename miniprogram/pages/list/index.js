// pages/list/index.js - 内容列表页
const moduleConfig = require('../../utils/moduleConfig.js')

// 模块类型常量
const MODULE_TYPES = {
  QUOTE: 'quote',
  JOKE: 'joke',
  PSYCHOLOGY: 'psychology',
  FINANCE: 'finance',
  LOVE: 'love',
  MOVIE: 'movie',
  MUSIC: 'music',
  TECH: 'tech',
  TCM: 'tcm',
  TRAVEL: 'travel',
  FORTUNE: 'fortune',
  LITERATURE: 'literature',
  FOREIGN_TRADE: 'foreignTrade',
  ECOMMERCE: 'ecommerce',
  MATH: 'math',
  ENGLISH: 'english',
  PROGRAMMING: 'programming',
  PHOTOGRAPHY: 'photography',
  BEAUTY: 'beauty',
  INVESTMENT: 'investment',
  FISHING: 'fishing',
  FITNESS: 'fitness',
  PET: 'pet',
  FASHION: 'fashion',
  OUTFIT: 'outfit',
  DECORATION: 'decoration',
  GLASS_FIBER: 'glassFiber',
  RESIN: 'resin',
  TAX: 'tax',
  LAW: 'law',
  OFFICIAL: 'official',
  HANDLING: 'handling',
  FLORAL: 'floral',
  HISTORY: 'history',
  MILITARY: 'military',
  STOCK: 'stock',
  ECONOMICS: 'economics',
  BUSINESS: 'business',
  NEWS: 'news',
  WISDOM_BAG: 'wisdomBag',
  ROBOT_AI: 'robotAi',
  AMERICAN_EXPERT: 'americanExpert',
  APPLE: 'apple',
  GROWTH: 'growth',
  UI_DESIGNER: 'uiDesigner',
  FUTURES: 'futures',
  FREUD: 'freud',
  FASHION_BRAND: 'fashionBrand',
  XIN_STUDY: 'xinStudy',
  LI_STUDY: 'liStudy',
  ANTHROPOLOGIST: 'anthropologist',
  GEOGRAPHER: 'geographer',
  HISTORIAN: 'historian',
  NARRATOLOGIST: 'narratologist',
  PSYCHOLOGIST: 'psychologist',
  SOFTWARE_ARCHITECT: 'softwareArchitect',
  SOLIDITY_ENGINEER: 'solidityEngineer',
  XIAOHONGSHU_EXPERT: 'xiaohongshuExpert',
  SEO_EXPERT: 'seoExpert'
}

Page({
  data: {
    // 所有模块列表
    modules: [],
    // 当前选中的模块
    currentModule: null,
    // 内容列表
    contentList: [],
    // 分页
    page: 1,
    pageSize: 15,
    hasMore: true,
    // 加载状态
    isLoading: false,
    isLoadingMore: false,
    // 下拉刷新状态
    isRefreshing: false,
    // 空状态
    isEmpty: false,
    // 横向滚动位置
    scrollLeft: 0,
    // 内容区域滚动位置
    contentScrollTop: 0,
  },

  // 页面缓存标识（静态属性）
  _cacheKey: 'list_page_cache',
  // 是否首次加载
  _isFirstLoad: true,
  // 是否从详情页返回
  _isBackFromDetail: false,

  onLoad(options) {
    this._initModules()
    
    // 如果有传入模块类型，默认选中
    if (options.type) {
      const module = this.data.modules.find(m => m.id === options.type)
      if (module) {
        this.setData({ currentModule: module })
        // 延迟滚动到选中模块位置，确保 DOM 渲染完成
        setTimeout(() => {
          this._scrollToCurrentModule()
        }, 300)
        this._loadData()
      }
    } else {
      // 默认选中第一个模块
      if (this.data.modules.length > 0) {
        this.setData({ currentModule: this.data.modules[0] })
        // 延迟滚动到选中模块位置，确保 DOM 渲染完成
        setTimeout(() => {
          this._scrollToCurrentModule()
        }, 300)
        this._loadData()
      }
    }
  },

  onShow() {
    // 从详情页返回，恢复滚动位置
    if (this._isBackFromDetail && this.data.currentModule) {
      const cache = this._getCache()
      if (cache && cache.moduleId === this.data.currentModule.id) {
        // 恢复缓存数据
        this.setData({
          contentList: cache.contentList || [],
          page: cache.page || 1,
          hasMore: cache.hasMore !== false,
          isEmpty: cache.isEmpty || false,
          scrollLeft: cache.scrollLeft || 0,
        })
        // 延迟恢复滚动位置，确保 DOM 渲染完成
        setTimeout(() => {
          if (cache.contentScrollTop > 0) {
            this.setData({ contentScrollTop: cache.contentScrollTop })
          }
          // 恢复导航滚动位置
          if (cache.scrollLeft > 0) {
            this.setData({ scrollLeft: cache.scrollLeft })
          }
        }, 100)
      }
    }
    this._isBackFromDetail = false
  },

  onPageScroll(e) {
    // 页面级别滚动（横向导航区域滚动时触发）
    this._saveScrollPosition(e.scrollTop)
  },
  
  // 内容区域滚动事件
  onContentScroll(e) {
    const scrollTop = e.detail.scrollTop
    this._saveScrollPosition(scrollTop)
    // 实时保存到 data（用于缓存）
    this.setData({ contentScrollTop: scrollTop })
  },

  onHide() {
    // 页面隐藏时保存缓存
    this._saveCache()
  },

  onUnload() {
    // 页面卸载时保存缓存
    this._saveCache()
  },

  // 获取缓存
  _getCache() {
    try {
      const cache = wx.getStorageSync(this._cacheKey)
      return cache || null
    } catch (e) {
      return null
    }
  },

  // 保存缓存
  _saveCache() {
    if (!this.data.currentModule) return
    try {
      const cacheData = {
        moduleId: this.data.currentModule.id,
        moduleName: this.data.currentModule.name,
        contentList: this.data.contentList,
        page: this.data.page,
        hasMore: this.data.hasMore,
        isEmpty: this.data.isEmpty,
        scrollLeft: this.data.scrollLeft,
        contentScrollTop: this.data.contentScrollTop,
        updatedAt: Date.now()
      }
      wx.setStorageSync(this._cacheKey, cacheData)
    } catch (e) {
      console.error('保存缓存失败', e)
    }
  },

  // 记录滚动位置
  _saveScrollPosition(scrollTop) {
    this._currentScrollTop = scrollTop
  },

  onPullDownRefresh() {
    // 下拉刷新：强制从云端获取最新数据
    this.onRefresh()
  },
  
  // 下拉刷新（scroll-view 触发）
  onRefresh() {
    if (this.data.isRefreshing) return
    this.setData({ isRefreshing: true })
    this._loadData({ forceRefresh: true }).finally(() => {
      this.setData({ isRefreshing: false })
    })
  },

  onReachBottom() {
    this.onLoadMore()
  },
  
  // 加载更多（scroll-view 触发）
  onLoadMore() {
    if (this.data.hasMore && !this.data.isLoadingMore) {
      this._loadMore()
    }
  },

  // 初始化模块列表
  _initModules() {
    const modules = moduleConfig.DEFAULT_MODULE_CONFIG.modules.map(config => ({
      id: config.id,
      name: config.name,
      icon: config.icon,
      colors: config.colors,
      collection: config.collection,
    }))
    this.setData({ modules })
  },

  // 切换模块
  onModuleChange(e) {
    const index = e.currentTarget.dataset.index
    const module = this.data.modules[index]
    if (module && module.id !== this.data.currentModule?.id) {
      // 切换模块时保存当前模块缓存
      this._saveCache()
      
      this.setData({
        currentModule: module,
        contentList: [],
        page: 1,
        hasMore: true,
        isEmpty: false,
        contentScrollTop: 0,
      })
      // 滚动到选中模块位置
      this._scrollToCurrentModule()
      
      // 尝试加载缓存，缓存命中则不请求云端
      if (this._loadFromCache()) {
        console.log('[List] 使用缓存数据')
      } else {
        this._loadData()
      }
    }
  },
  
  // 从缓存加载数据
  _loadFromCache() {
    const cache = this._getCache()
    if (cache && cache.moduleId === this.data.currentModule.id) {
      // 检查缓存是否过期（24小时）
      if (Date.now() - cache.updatedAt < 24 * 60 * 60 * 1000) {
        this.setData({
          contentList: cache.contentList || [],
          page: cache.page || 1,
          hasMore: cache.hasMore !== false,
          isEmpty: cache.isEmpty || false,
        })
        return true
      }
    }
    return false
  },

  // 滚动到当前选中模块（居中显示）
  _scrollToCurrentModule() {
    const { modules, currentModule } = this.data
    if (!currentModule) return

    const index = modules.findIndex(m => m.id === currentModule.id)
    if (index < 0) return

    // 使用 SelectorQuery 动态获取 nav-inner 和当前 nav-item 的位置信息
    const query = wx.createSelectorQuery()
    query.select('#moduleNav').boundingClientRect()
    query.select('.nav-inner').boundingClientRect()
    query.selectAll('.nav-item').boundingClientRect((rects) => {
      if (!rects || rects.length === 0) return

      const screenWidth = wx.getSystemInfoSync().windowWidth

      // 获取 nav-inner 的位置（作为相对基准）
      const navInner = rects[0] || { left: 0 }
      // 获取当前选中项的位置
      const currentRect = rects[index]
      if (!currentRect) return

      // 计算相对位置：当前项相对于 nav-inner 的偏移
      const relativeLeft = currentRect.left - navInner.left

      // 计算居中位置：相对偏移 - (屏幕宽度/2) + (当前项宽度/2)
      const scrollLeft = relativeLeft - screenWidth / 2 + currentRect.width / 2

      this.setData({ scrollLeft: Math.max(0, scrollLeft) })
    })
    query.exec()
  },

  // 加载数据（优先从缓存，失败后拉取云端）
  async _loadData(options = {}) {
    const { currentModule, page, pageSize } = this.data
    if (!currentModule || this.data.isLoading) return

    const { forceRefresh = false } = options
    
    // 如果不是强制刷新，尝试使用缓存
    if (!forceRefresh) {
      const cache = this._getCache()
      if (cache && cache.moduleId === currentModule.id && cache.contentList?.length > 0) {
        // 检查缓存是否过期（24小时）
        if (Date.now() - cache.updatedAt < 24 * 60 * 60 * 1000) {
          console.log('[List] 使用缓存数据，跳过云端请求')
          this.setData({
            contentList: cache.contentList,
            page: cache.page,
            hasMore: cache.hasMore,
            isEmpty: cache.isEmpty,
          })
          return
        }
      }
    }

    this.setData({ isLoading: true, isEmpty: false })

    try {
      const db = wx.cloud.database()
      const collection = db.collection(currentModule.collection)
      
      // 获取总数
      const countResult = await collection.count()
      const total = countResult.total
      
      // 查询数据（按日期倒序，最新的在前面）
      const result = await collection
        .orderBy('date', 'desc')
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()

      // 编程模块需要解析代码块
      const contentList = result.data.map(item => {
        if (currentModule.id === 'programming' && item.summary) {
          return this._parseCodeBlocks(item)
        }
        return item
      })

      this.setData({
        contentList,
        hasMore: page * pageSize < total,
        isEmpty: contentList.length === 0,
      })
      
      // 保存到缓存
      this._saveCache()
      
      // 恢复滚动位置
      setTimeout(() => {
        const cache = this._getCache()
        if (cache && cache.contentScrollTop > 0) {
          this.setData({ contentScrollTop: cache.contentScrollTop })
        }
      }, 100)
      
    } catch (e) {
      console.error('加载数据失败:', e)
      // 云端加载失败，尝试使用缓存兜底
      const cache = this._getCache()
      if (cache && cache.moduleId === currentModule.id && cache.contentList?.length > 0) {
        console.log('[List] 云端加载失败，使用缓存兜底')
        this.setData({
          contentList: cache.contentList,
          page: cache.page,
          hasMore: cache.hasMore,
          isEmpty: cache.isEmpty,
        })
        wx.showToast({ title: '使用缓存数据', icon: 'none', duration: 1500 })
      } else {
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
        this.setData({ isEmpty: true })
      }
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 加载更多
  async _loadMore() {
    const { currentModule, page, pageSize, contentList, hasMore } = this.data
    if (!currentModule || this.data.isLoadingMore || !hasMore) return

    this.setData({ isLoadingMore: true })

    try {
      const db = wx.cloud.database()
      const nextPage = page + 1
      
      const result = await db.collection(currentModule.collection)
        .orderBy('date', 'desc')
        .orderBy('createdAt', 'desc')
        .skip((nextPage - 1) * pageSize)
        .limit(pageSize)
        .get()

      // 编程模块需要解析代码块
      const newItems = result.data.map(item => {
        if (currentModule.id === 'programming' && item.summary) {
          return this._parseCodeBlocks(item)
        }
        return item
      })

      this.setData({
        contentList: [...contentList, ...newItems],
        page: nextPage,
        hasMore: result.data.length === pageSize,
      })
    } catch (e) {
      console.error('加载更多失败:', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ isLoadingMore: false })
    }
  },

  // 解析编程模块中的代码块
  _parseCodeBlocks(content) {
    if (!content || !content.summary) return content

    const summary = content.summary
    const codeBlocks = []
    
    // 分割文本和代码块
    // 格式: 内容 |代码示例: 代码内容 |其他内容
    const parts = summary.split(/(?=\|[^\S\r\n]*(?:代码示例|示例代码)[：:]?\s*)/)
    
    parts.forEach(part => {
      const codeMatch = part.match(/^[^\S\r\n]*\|[^\S\r\n]*(?:代码示例|示例代码)[：:]?\s*([\s\S]*?)$/i)
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1].trim()
        if (code) {
          codeBlocks.push({
            code: code,
            language: this._detectLanguage(code)
          })
        }
      }
    })

    // 清理 summary 中的代码部分（用于普通文本展示）
    content.cleanSummary = summary
      .replace(/\|[^\S\r\n]*(?:代码示例|示例代码)[：:]?\s*[\s\S]*?(?=\s*(?:\|[^\S\r\n]*[^\n|]+|$))/gi, '')
      .trim()
    
    // 存储代码块
    content.codeBlocks = codeBlocks
    
    return content
  },

  // 检测代码语言
  _detectLanguage(code) {
    if (!code) return 'code'
    
    // 简单的语言检测
    if (/^(import|export|const|let|var|function|class|interface|type)\s/m.test(code)) return 'javascript'
    if (/^(def|class|import|from|if __name__|async def)\s/m.test(code)) return 'python'
    if (/^(package|import|func|struct|type|var|const)\s/m.test(code)) return 'go'
    if (/^(public|private|class|interface|void|static|import)\s/m.test(code)) return 'java'
    if (/^(<\?php|namespace|use|class|function|public|private|protected)\s/m.test(code)) return 'php'
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/m.test(code)) return 'sql'
    if (/[{}\[\];]/.test(code) && /[<>]/.test(code)) return 'html'
    if (/[#{}]\s*\w/.test(code) && /[@:"]/.test(code)) return 'css'
    
    return 'code'
  },

  // 复制代码
  onCopyCode(e) {
    const code = e.currentTarget.dataset.code
    if (!code) return
    
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '代码已复制', icon: 'none' })
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' })
      }
    })
  },

  // 点击卡片查看详情（跳转详情页）
  onCardTap(e) {
    const content = e.currentTarget.dataset.content
    const { currentModule } = this.data
    if (!content || !currentModule) return

    // 标记从详情页返回，恢复滚动位置
    this._isBackFromDetail = true
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/index?moduleId=${currentModule.id}&data=${encodeURIComponent(JSON.stringify(content))}`,
    })
  },

  // 分享内容
  onShare(e) {
    const content = e.currentTarget.dataset.content
    const { currentModule } = this.data
    if (!content || !currentModule) return

    let shareTitle = ''
    let shareContent = ''
    let shareAuthor = ''

    switch (currentModule.id) {
      case MODULE_TYPES.QUOTE:
        shareTitle = content.text || ''
        shareContent = content.content || ''
        shareAuthor = content.author || ''
        break
      case MODULE_TYPES.LOVE:
        shareTitle = content.content || ''
        shareContent = content.summary || ''
        shareAuthor = content.author || ''
        break
      default:
        shareTitle = content.title || ''
        shareContent = content.summary || content.content || ''
        shareAuthor = content.source || content.author || ''
    }

    // 获取配色方案（与海报页面保持一致）
    const colors = currentModule.colors || {}
    const bgColor = encodeURIComponent(colors.gradientEnd || '#F6F2EA')
    const titleColor = encodeURIComponent(colors.primary || '#2B2B2B')
    const contentColor = encodeURIComponent(colors.text || '#5C5245')
    const subtitleColor = encodeURIComponent(colors.textSecondary || '#B79C61')

    // 跳转参数：包含完整配色和内容字段
    const params = [
      `type=${currentModule.posterType || currentModule.id}`,
      `title=${encodeURIComponent(shareTitle)}`,
      `content=${encodeURIComponent(shareContent)}`,
      `subtitle=${encodeURIComponent(currentModule.icon + ' ' + currentModule.name)}`,
      `icon=${encodeURIComponent(currentModule.icon || '')}`,
      `author=${encodeURIComponent(shareAuthor)}`,
      `bgColor=${bgColor}`,
      `titleColor=${titleColor}`,
      `contentColor=${contentColor}`,
      `subtitleColor=${subtitleColor}`,
      `category=${encodeURIComponent(currentModule.id)}`
    ].join('&')

    wx.navigateTo({
      url: `/pages/poster/index?${params}`,
    })
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { currentModule } = this.data
    return {
      title: `${currentModule?.icon || '📖'} ${currentModule?.name || '精选内容'} - 智伴口袋`,
      imageUrl: '/images/share-cover.png',
      query: `from=list&module=${currentModule?.id}`
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    const { currentModule } = this.data
    return {
      title: `${currentModule?.icon || '📖'} ${currentModule?.name || '精选内容'} - 智伴口袋`,
      path: `/pages/list/index?moduleId=${currentModule?.id}`,
      imageUrl: '/images/share-cover.png',
      desc: `${currentModule?.description || '每天一点，美好生活'}`
    }
  },
})
