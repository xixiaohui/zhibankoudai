// pages/list/index.js - 内容列表页
const { MODULE_CONFIGS, MODULE_TYPES } = require('../../utils/dailyModule.js')

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
    // 空状态
    isEmpty: false,
    // 横向滚动位置
    scrollLeft: 0,
  },

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
        this._loadData()
      }
    }
  },

  // 页面缓存标识（静态属性）
  _cacheKey: 'list_page_cache',

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
        this._loadData()
      }
    }
  },

  onShow() {
    // 检查是否有缓存，如果有则恢复缓存数据
    if (this.data.currentModule) {
      const cache = this._getCache()
      if (cache && cache.moduleId === this.data.currentModule.id && cache.contentList?.length > 0) {
        // 恢复缓存数据
        this.setData({
          contentList: cache.contentList,
          page: cache.page,
          hasMore: cache.hasMore,
          isEmpty: cache.isEmpty,
          scrollLeft: cache.scrollLeft || 0,
        })
        // 更新滚动位置（延迟确保DOM渲染）
        setTimeout(() => {
          wx.createSelectorQuery().select('#moduleNav').boundingClientRect((rect) => {
            if (rect && cache.scrollLeft > 0) {
              this.setData({ scrollLeft: cache.scrollLeft })
            }
          }).exec()
        }, 100)
      }
    }
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
    if (!this.data.currentModule || !this.data.contentList.length) return
    try {
      wx.setStorageSync(this._cacheKey, {
        moduleId: this.data.currentModule.id,
        contentList: this.data.contentList,
        page: this.data.page,
        hasMore: this.data.hasMore,
        isEmpty: this.data.isEmpty,
        scrollLeft: this.data.scrollLeft,
      })
    } catch (e) {
      console.error('保存缓存失败', e)
    }
  },

  onPullDownRefresh() {
    this._loadData()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoadingMore) {
      this._loadMore()
    }
  },

  // 初始化模块列表
  _initModules() {
    const modules = Object.values(MODULE_CONFIGS).map(config => ({
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
      this.setData({
        currentModule: module,
        contentList: [],
        page: 1,
        hasMore: true,
        isEmpty: false,
      })
      // 滚动到选中模块位置
      this._scrollToCurrentModule()
      this._loadData()
    }
  },

  // 滚动到当前选中模块（居中显示）
  _scrollToCurrentModule() {
    const { modules, currentModule } = this.data
    if (!currentModule) return

    const index = modules.findIndex(m => m.id === currentModule.id)
    if (index < 0) return

    // 动态获取屏幕宽度和标签尺寸
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth  // px
    const tabWidth = 172  // 每个tab宽度约172rpx
    // rpx转px: 1rpx = screenWidth/750 px
    const tabWidthPx = tabWidth * screenWidth / 750
    const screenWidthPx = screenWidth
    
    // 计算居中位置：标签起始位置 - 屏幕一半 + 标签一半
    const scrollLeft = Math.max(0, index * tabWidthPx - screenWidthPx / 2 + tabWidthPx / 2)

    this.setData({ scrollLeft })
  },

  // 加载数据
  async _loadData() {
    const { currentModule, page, pageSize } = this.data
    if (!currentModule || this.data.isLoading) return

    this.setData({ isLoading: true, isEmpty: false })

    try {
      const db = wx.cloud.database()
      const collection = db.collection(currentModule.collection)
      
      // 获取总数
      const countResult = await collection.count()
      const total = countResult.total
      
      // 查询数据
      const result = await collection
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()

      this.setData({
        contentList: result.data,
        hasMore: page * pageSize < total,
        isEmpty: result.data.length === 0,
      })
    } catch (e) {
      console.error('加载数据失败:', e)
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      this.setData({ isEmpty: true })
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
        .orderBy('createdAt', 'desc')
        .skip((nextPage - 1) * pageSize)
        .limit(pageSize)
        .get()

      this.setData({
        contentList: [...contentList, ...result.data],
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

  // 点击卡片查看详情（跳转详情页）
  onCardTap(e) {
    const content = e.currentTarget.dataset.content
    const { currentModule } = this.data
    if (!content || !currentModule) return

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

    switch (currentModule.id) {
      case MODULE_TYPES.QUOTE:
        shareTitle = content.text || ''
        shareContent = `—— ${content.author || ''}`
        break
      case MODULE_TYPES.LOVE:
        shareTitle = content.content || ''
        shareContent = content.author ? `—— ${content.author}` : ''
        break
      default:
        shareTitle = content.title || ''
        shareContent = content.summary || content.content || ''
    }

    wx.navigateTo({
      url: `/pages/poster/index?type=${currentModule.posterType}&title=${encodeURIComponent(shareTitle)}&content=${encodeURIComponent(shareContent)}&subtitle=${encodeURIComponent(currentModule.icon + ' ' + currentModule.name)}`,
    })
  },
})
