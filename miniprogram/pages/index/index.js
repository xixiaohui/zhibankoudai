// pages/index/index.js - 智伴口袋首页 (云端数据版)
const app = getApp()
const util = require('../../utils/util.js')
const cloudData = require('../../utils/cloudData.js')

Page({
  data: {
    // 用户信息
    nickname: '',
    greeting: '',
    timeOfDay: '',
    
    // 首页核心动作
    mainActions: [
      { id: 'chat', name: '今天想聊点什么', desc: '随时倾诉，我在这里', icon: '💬', color: '#7C6AFF' },
      { id: 'mood', name: '记录一下现在的心情', desc: '标记此刻的感受', icon: '📝', color: '#FF9A76' },
      { id: 'start', name: '开始今日陪伴', desc: '开启一段陪伴对话', icon: '🌟', color: '#6BCB77' },
    ],
    
    // 陪伴模式快捷入口
    quickModes: util.getChatModes(),
    
    // 每日卡片
    dailyCard: null,
    
    // 动态模块列表（从云端配置读取）
    enabledModules: [],
    homeModules: [],
    
    // 近期状态
    recentMood: null,
    pendingGoals: [],
    consecutiveDays: 0,
    
    // UI状态
    showNicknameModal: false,
    nicknameInput: '',
    showBackTop: false,
    scrollTop: 0,
    refreshKey: 0,
    
    // 加载状态
    isLoading: true,
  },

  onLoad() {
    // 检查昵称设置
    this.checkNickname()
    // 初始化云端数据（确保配置已加载）
    this.initCloudData()
  },

  onShow() {
    // 每次显示时加载基础数据
    this.loadData()
    
    // 每次显示时刷新模块显示状态（从本地存储读取最新设置）
    this._refreshModules().then(() => {
      // 刷新完成后通知卡片组件
      this._notifyCardsRefresh()
    })
  },

  // 刷新模块显示状态和加载数据
  async _refreshModules() {
    // 确保云端数据已初始化
    await cloudData.initAsync()
    
    const homeModules = cloudData.getOrderedHomeModules()
    const finalModules = this.applyLocalSettings(homeModules)
    const enabledModules = finalModules.filter(m => m.enabled).map(m => m.id)
    
    console.log('[Index] _refreshModules 刷新模块:', {
      total: finalModules.length,
      enabled: enabledModules.length,
      enabledIds: enabledModules
    })
    
    this.setData({
      homeModules: finalModules,
      enabledModules
    })
    
    // 返回启用的模块数量
    return { total: finalModules.length, enabled: enabledModules.length }
  },
  
  // 通知所有卡片组件刷新本地设置
  _notifyCardsRefresh() {
    // 使用 setData 触发更新，确保页面状态变化
    this.setData({ refreshKey: Date.now() }, () => {
      // 延迟执行，等待组件状态更新
      setTimeout(() => {
        const cards = this.selectAllComponents('.daily-card-refresh')
        console.log('[Index] 找到卡片组件数量:', cards.length)
        cards.forEach(card => {
          if (card && card.checkLocalSettings) {
            card.checkLocalSettings()
          }
        })
      }, 100)
    })
  },

  onReady() {
    // 页面Ready后，等待云端数据加载完成
    this.waitForCloudData()
  },

  onPullDownRefresh() {
    // 下拉刷新：重新加载云端数据
    cloudData.clearCache()
    this.initCloudData().then(() => {
      this.loadData()
      wx.stopPullDownRefresh()
    })
  },

  // 初始化云端数据
  async initCloudData() {
    this.setData({ isLoading: true })
    try {
      await cloudData.init()
      // 加载完成后更新UI
      const homeModules = cloudData.getOrderedHomeModules()
      // 应用本地用户设置
      const finalModules = this.applyLocalSettings(homeModules)
      const enabledModules = finalModules.filter(m => m.enabled).map(m => m.id)
      this.setData({
        homeModules: finalModules,
        enabledModules,
        isLoading: false
      })
      console.log('[Index] 云端数据初始化完成', { 
        homeModulesCount: finalModules.length,
        enabledCount: enabledModules.length 
      })
    } catch (e) {
      console.error('[Index] 云端数据初始化失败:', e)
      this.setData({ isLoading: false })
    }
  },

  // 应用本地用户设置到模块
  applyLocalSettings(homeModules) {
    // 从本地存储读取可见性设置
    const visibility = wx.getStorageSync('moduleVisibility') || {}
    
    // 合并用户设置：只有明确设置为 true 才显示
    return homeModules.map(m => ({
      ...m,
      enabled: visibility[m.id] === true
    }))
  },

  // 等待云端数据加载
  waitForCloudData() {
    if (cloudData.initPromise) {
      cloudData.initPromise.then(() => {
        const homeModules = cloudData.getOrderedHomeModules()
        const finalModules = this.applyLocalSettings(homeModules)
        const enabledModules = finalModules.filter(m => m.enabled).map(m => m.id)
        this.setData({
          homeModules: finalModules,
          enabledModules,
          isLoading: false
        })
      })
    }
  },

  // 页面滚动事件
  onPageScroll(e) {
    const showBackTop = e.scrollTop > 500
    if (showBackTop !== this.data.showBackTop) {
      this.setData({ showBackTop })
    }
  },

  // 回到顶部
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    this.setData({ showBackTop: false })
  },

  // 检查昵称
  checkNickname() {
    const profile = wx.getStorageSync('userProfile')
    if (!profile || !profile.nickname) {
      this.setData({ showNicknameModal: true })
    }
  },

  // 加载首页数据
  loadData() {
    // 获取问候语
    const greetingData = app.getGreeting()
    this.setData({
      greeting: greetingData.text,
      timeOfDay: greetingData.time,
    })

    // 获取用户昵称
    const profile = wx.getStorageSync('userProfile')
    if (profile && profile.nickname) {
      this.setData({ nickname: profile.nickname })
    }

    // 获取/生成今日卡片
    let dailyCard = app.generateDailyCard()
    app.saveDailyCard(dailyCard)
    this.setData({ dailyCard })

    // 获取统计数据
    const stats = wx.getStorageSync('stats') || { consecutiveDays: 0 }
    this.setData({ consecutiveDays: stats.consecutiveDays || 0 })

    // 获取最近情绪
    const moodRecords = wx.getStorageSync('moodRecords') || []
    if (moodRecords.length > 0) {
      this.setData({ recentMood: moodRecords[0] })
    }

    // 获取待完成目标
    const shortTerm = wx.getStorageSync('shortTermMemory') || { currentGoals: [] }
    const pendingGoals = (shortTerm.currentGoals || [])
      .filter(g => !g.completed)
      .slice(0, 3)
    this.setData({ pendingGoals })
    
    // 更新云端模块数据（如果已加载），并应用本地设置
    if (cloudData.initPromise) {
      cloudData.initPromise.then(() => {
        const homeModules = cloudData.getOrderedHomeModules()
        const finalModules = this.applyLocalSettings(homeModules)
        const enabledModules = finalModules.filter(m => m.enabled).map(m => m.id)
        this.setData({
          homeModules: finalModules,
          enabledModules,
          isLoading: false
        })
      })
    }
  },

  // ========== 用户交互处理 ==========
  
  // 处理主要动作点击
  onMainAction(e) {
    const actionId = e.currentTarget.dataset.id
    
    switch(actionId) {
      case 'chat':
        wx.navigateTo({ url: '/pages/chat/index' })
        break
      case 'mood':
        wx.switchTab({ url: '/pages/mood/index' })
        break
      case 'start':
        const modes = util.getChatModes()
        const randomMode = modes[Math.floor(Math.random() * modes.length)]
        wx.navigateTo({
          url: `/pages/chat/index?mode=${randomMode.id}&title=${randomMode.name}`,
        })
        break
    }
  },

  // 快速模式点击
  onQuickMode(e) {
    const mode = e.currentTarget.dataset.mode
    wx.navigateTo({
      url: `/pages/chat/index?mode=${mode.id}&title=${mode.name}`,
    })
  },

  // 查看每日卡片详情
  onViewCard() {
    if (this.data.dailyCard) {
      wx.showModal({
        title: '今日陪伴卡片',
        content: `${this.data.dailyCard.encouragement}\n\n${this.data.dailyCard.weekReview}\n\n${this.data.dailyCard.suggestion}`,
        showCancel: false,
        confirmText: '好的',
      })
    }
  },

  // 查看记忆
  onViewMemory() {
    wx.switchTab({ url: '/pages/memory/index' })
  },

  // 添加新目标
  onAddGoal() {
    wx.showModal({
      title: '添加小目标',
      editable: true,
      placeholderText: '比如：看完这本书、完成工作报告',
      success: (res) => {
        if (res.confirm && res.content) {
          app.addGoal(res.content)
          this.loadData()
          wx.showToast({ title: '目标已添加', icon: 'success' })
        }
      }
    })
  },

  // 完成目标
  onCompleteGoal(e) {
    const goalId = e.currentTarget.dataset.id
    app.completeGoal(goalId)
    this.loadData()
    wx.showToast({ title: '太棒了！🎉', icon: 'success' })
  },

  // ========== 昵称设置 ==========
  
  // 输入昵称
  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  // 保存昵称
  saveNickname() {
    const nickname = this.data.nicknameInput.trim()
    if (!nickname) {
      wx.showToast({ title: '请输入你的称呼', icon: 'none' })
      return
    }
    if (nickname.length > 10) {
      wx.showToast({ title: '称呼太长了', icon: 'none' })
      return
    }

    const profile = wx.getStorageSync('userProfile') || {}
    profile.nickname = nickname
    if (!profile.joinDate) {
      profile.joinDate = util.formatDate(new Date())
    }
    wx.setStorageSync('userProfile', profile)

    this.setData({ 
      showNicknameModal: false,
      nickname: nickname
    })
    
    // 更新问候语
    const greetingData = app.getGreeting()
    this.setData({ greeting: greetingData.text })
    
    wx.showToast({ title: '设置成功', icon: 'success' })
  },

  // 关闭昵称弹窗
  closeNicknameModal() {
    const profile = wx.getStorageSync('userProfile')
    if (profile && profile.nickname) {
      this.setData({ showNicknameModal: false })
    } else {
      wx.showToast({ title: '请设置你的称呼', icon: 'none' })
    }
  },

  // 分享卡片
  onShareCard() {
    wx.navigateTo({ url: '/pages/poster/index?type=home' })
  },

  // 跳转到模块管理页面
  goToManage() {
    wx.navigateTo({ url: '/pages/manage/index' })
  },

  // 空操作
  noop() {},

  // 分享到朋友圈
  onShareTimeline() {
    const profile = wx.getStorageSync('userProfile') || {}
    const nickname = profile.nickname || '朋友'
    return {
      title: `${nickname} 的智伴AI - 智能陪伴助手`,
      imageUrl: '/images/share-cover.png',
      query: 'from=timeline'
    }
  },

  // 页面分享配置
  onShareAppMessage(res) {
    const profile = wx.getStorageSync('userProfile') || {}
    const nickname = profile.nickname || '朋友'
    return {
      title: `${nickname} 邀请你体验智伴AI - 智能陪伴助手`,
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  }
})
