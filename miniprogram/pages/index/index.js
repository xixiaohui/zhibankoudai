// pages/index/index.js - 智伴口袋首页
const app = getApp()
const util = require('../../utils/util.js')

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
    
    // 近期状态
    recentMood: null,
    pendingGoals: [],
    consecutiveDays: 0,
    
    // UI状态
    showNicknameModal: false,
    nicknameInput: '',
  },

  onLoad() {
    // 检查昵称设置
    this.checkNickname()
  },

  onShow() {
    // 每次显示时加载数据
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 检查昵称
  checkNickname() {
    const profile = wx.getStorageSync('userProfile')
    if (!profile || !profile.nickname) {
      this.setData({ showNicknameModal: true })
    }
  },

  // 工具函数绑定
  getMoodEmoji(mood) {
    return util.getMoodEmoji(mood)
  },

  formatRelativeTime(timeStr) {
    return util.formatRelativeTime(timeStr)
  },

  formatDateDisplay(dateStr) {
    return util.formatDateDisplay(dateStr)
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
  },

  // ========== 用户交互处理 ==========
  
  // 处理主要动作点击
  onMainAction(e) {
    const actionId = e.currentTarget.dataset.id
    
    switch(actionId) {
      case 'chat':
        // 跳转到聊天页，显示模式选择
        wx.navigateTo({
          url: '/pages/chat/index',
        })
        break
      case 'mood':
        // 跳转到心情记录页
        wx.switchTab({ url: '/pages/mood/index' })
        break
      case 'start':
        // 开始随机陪伴对话
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

  // 空操作（用于阻止事件穿透）
  noop() {
    // do nothing
  },
})