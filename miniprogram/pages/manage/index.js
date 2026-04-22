// pages/manage/index.js - 助手管理页面
const moduleConfig = require('../../utils/moduleConfig.js')

// 本地存储的 key
const STORAGE_KEY = 'moduleVisibility'

Page({
  data: {
    modules: [],
    enabledCount: 0
  },

  onLoad() {
    this.loadModules()
  },

  // 加载模块配置
  loadModules() {
    // 从本地配置读取所有模块
    const allModules = moduleConfig.DEFAULT_MODULE_CONFIG.modules || []
    
    // 从本地存储读取可见性设置
    let visibility = wx.getStorageSync(STORAGE_KEY)
    
    // 首次运行：默认只开启第一个模块（时光絮语）
    if (!visibility) {
      visibility = {}
     
      wx.setStorageSync(STORAGE_KEY, visibility)
      console.log('[Manage] 首次运行，默认开启:', allModules[0]?.name)
    }
    
    // 合并配置：本地设置优先，否则使用默认值（默认都是关闭）
    const modules = allModules.map(m => ({
      ...m,
      enabled: visibility[m.id] === true  // 只在明确为 true 时开启
    }))
    
    // 按 order 排序
    modules.sort((a, b) => a.order - b.order)
    
    const enabledCount = modules.filter(m => m.enabled).length
    
    this.setData({ modules, enabledCount })
  },

  // 切换模块开关
  toggleModule(e) {
    const moduleId = e.currentTarget.dataset.id
    const enabled = e.detail.value
    
    // 获取当前设置
    const visibility = wx.getStorageSync(STORAGE_KEY) || {}
    
    // 更新设置
    visibility[moduleId] = enabled
    wx.setStorageSync(STORAGE_KEY, visibility)
    
    // 更新本地数据
    const modules = this.data.modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, enabled }
      }
      return m
    })
    
    const enabledCount = modules.filter(m => m.enabled).length
    
    this.setData({ modules, enabledCount })
    
    // 提示
    wx.showToast({
      title: enabled ? '已开启' : '已隐藏',
      icon: 'success',
      duration: 1000
    })
  },

  // 重置所有设置
  resetAll() {
    wx.showModal({
      title: '重置设置',
      content: '确定要关闭所有模块吗？首次运行将只开启「时光絮语」',
      confirmText: '重置',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储，重新初始化
          wx.removeStorageSync(STORAGE_KEY)
          this.loadModules()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  // 开启全部模块
  enableAll() {
    const visibility = {}
    this.data.modules.forEach(m => {
      visibility[m.id] = true
    })
    wx.setStorageSync(STORAGE_KEY, visibility)

    const modules = this.data.modules.map(m => ({
      ...m,
      enabled: true
    }))

    this.setData({ modules, enabledCount: modules.length })
    wx.showToast({ title: '已全部开启', icon: 'success' })
  },

  // 关闭全部模块
  disableAll() {
    const visibility = {}
    this.data.modules.forEach(m => {
      visibility[m.id] = false
    })
    wx.setStorageSync(STORAGE_KEY, visibility)

    const modules = this.data.modules.map(m => ({
      ...m,
      enabled: false
    }))

    this.setData({ modules, enabledCount: 0 })
    wx.showToast({ title: '已全部关闭', icon: 'success' })
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '智伴口袋 - 自定义我的AI助手',
      imageUrl: '/images/share-cover.png',
      query: 'from=manage'
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '智伴AI - 自定义我的AI助手',
      path: '/pages/manage/index',
      imageUrl: '/images/share-cover.png',
      desc: '管理我的AI助手模块，打造专属的智能陪伴体验~'
    }
  },
})
