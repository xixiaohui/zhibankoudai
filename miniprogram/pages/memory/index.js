// pages/memory/index.js - 口袋记忆页面
const app = getApp()
const util = require('../../utils/util.js')
const { syncNickname } = require('../../utils/userManager.js')

Page({
  data: {
    // 用户资料
    profile: null,
    
    // 短期记忆
    shortTerm: {
      recentEvents: [],
      recentMood: [],
      currentGoals: [],
      pendingMatters: [],
    },
    
    // 长期记忆
    longTerm: {
      preferences: {},
      patterns: {},
      milestones: [],
    },
    
    // 统计信息
    stats: {
      consecutiveDays: 0,
      totalChats: 0,
      totalMoodRecords: 0,
    },
    
    // 当前激活的标签页
    activeTab: 'profile',
    tabs: [
      { id: 'profile', name: '个人资料', icon: '👤' },
      { id: 'recent', name: '近期状态', icon: '📊' },
      { id: 'goals', name: '目标追踪', icon: '🎯' },
      { id: 'milestones', name: '里程碑', icon: '🏆' },
    ],
    
    // UI状态
    isEditingProfile: false,
    editProfileData: {},
    
    // 计算属性
    ongoingGoalsCount: 0,
    completedGoalsCount: 0,
  },

  onLoad(options) {
    this.loadMemoryData()
    
    // 支持通过 URL 参数指定默认 tab
    if (options && options.tab) {
      const validTabs = ['profile', 'recent', 'goals', 'milestones']
      if (validTabs.includes(options.tab)) {
        this.setData({ activeTab: options.tab })
      }
    }
  },

  onShow() {
    this.loadMemoryData()
  },

  // 加载记忆数据
  loadMemoryData() {
    const profile = wx.getStorageSync('userProfile') || {}
    const shortTerm = wx.getStorageSync('shortTermMemory') || {
      recentEvents: [],
      recentMood: [],
      currentGoals: [],
      pendingMatters: [],
    }
    const longTerm = wx.getStorageSync('longTermMemory') || {
      preferences: {},
      patterns: {},
      milestones: [],
    }
    const stats = wx.getStorageSync('stats') || {}

    // 计算进行中和已完成的目标数量
    const ongoingGoalsCount = shortTerm.currentGoals.filter(g => !g.completed).length
    const completedGoalsCount = shortTerm.currentGoals.filter(g => g.completed).length

    this.setData({
      profile,
      shortTerm,
      longTerm,
      stats,
      ongoingGoalsCount,
      completedGoalsCount,
    })
  },

  // 切换标签页
  onTabChange(e) {
    const tabId = e.currentTarget.dataset.tab
    this.setData({ activeTab: tabId })
  },

  // ========== 个人资料相关 ==========
  
  // 开始编辑个人资料
  onEditProfile() {
    this.setData({
      isEditingProfile: true,
      editProfileData: { ...this.data.profile }
    })
  },

  // 输入处理
  onProfileInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    
    this.setData({
      [`editProfileData.${field}`]: value
    })
  },

  // 选择语气偏好
  onSelectTone(e) {
    const tone = e.currentTarget.dataset.tone
    this.setData({
      'editProfileData.preferTone': tone
    })
  },

  // 保存个人资料
  onSaveProfile() {
    const { editProfileData } = this.data
    
    // 验证昵称
    if (!editProfileData.nickname || editProfileData.nickname.trim().length === 0) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    
    if (editProfileData.nickname.length > 10) {
      wx.showToast({ title: '昵称不能超过10个字', icon: 'none' })
      return
    }

    // 保存到本地存储
    const profile = {
      nickname: editProfileData.nickname.trim(),
      preferGreeting: editProfileData.preferGreeting || '你好',
      preferTone: editProfileData.preferTone || '温暖',
      joinDate: editProfileData.joinDate || util.formatDate(new Date()),
    }
    
    wx.setStorageSync('userProfile', profile)
    
    this.setData({
      profile,
      isEditingProfile: false,
      editProfileData: {},
    })
    
    // 同步昵称到云端
    syncNickname(profile.nickname).catch(e => console.warn('昵称同步失败:', e))
    
    wx.showToast({ title: '资料已更新', icon: 'success' })
  },

  // 取消编辑
  onCancelEdit() {
    this.setData({
      isEditingProfile: false,
      editProfileData: {},
    })
  },

  // ========== 目标相关 ==========
  
  // 添加新目标
  onAddGoal() {
    wx.showModal({
      title: '添加目标',
      editable: true,
      placeholderText: '比如：每周运动3次、完成项目报告',
      success: (res) => {
        if (res.confirm && res.content) {
          app.addGoal(res.content)
          this.loadMemoryData()
          wx.showToast({ title: '目标已添加', icon: 'success' })
        }
      }
    })
  },

  // 完成目标
  onCompleteGoal(e) {
    const goalId = e.currentTarget.dataset.id
    app.completeGoal(goalId)
    this.loadMemoryData()
    wx.showToast({ title: '太棒了！🎉', icon: 'success' })
  },

  // 删除目标
  onDeleteGoal(e) {
    const goalId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除目标',
      content: '确定要删除这个目标吗？',
      success: (res) => {
        if (res.confirm) {
          const shortTerm = wx.getStorageSync('shortTermMemory')
          shortTerm.currentGoals = shortTerm.currentGoals.filter(g => g.id !== goalId)
          wx.setStorageSync('shortTermMemory', shortTerm)
          this.loadMemoryData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // ========== 事件相关 ==========
  
  // 添加事件
  onAddEvent() {
    wx.showModal({
      title: '记录事件',
      editable: true,
      placeholderText: '今天发生了什么重要的事？',
      success: (res) => {
        if (res.confirm && res.content) {
          app.addShortTermEvent(res.content)
          this.loadMemoryData()
          wx.showToast({ title: '事件已记录', icon: 'success' })
        }
      }
    })
  },

  // 删除事件
  onDeleteEvent(e) {
    const eventId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除事件',
      content: '确定要删除这个事件记录吗？',
      success: (res) => {
        if (res.confirm) {
          const shortTerm = wx.getStorageSync('shortTermMemory')
          shortTerm.recentEvents = shortTerm.recentEvents.filter(e => e.id !== eventId)
          wx.setStorageSync('shortTermMemory', shortTerm)
          this.loadMemoryData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // ========== 统计相关 ==========
  
  // 生成统计摘要
  generateStatsSummary() {
    const { stats } = this.data
    
    let summary = ''
    
    if (stats.consecutiveDays > 0) {
      summary += `已连续陪伴 ${stats.consecutiveDays} 天\n`
    }
    
    if (stats.totalChats > 0) {
      summary += `累计对话 ${stats.totalChats} 次\n`
    }
    
    if (stats.totalMoodRecords > 0) {
      summary += `情绪记录 ${stats.totalMoodRecords} 次\n`
    }
    
    const activeGoals = this.data.ongoingGoalsCount
    if (activeGoals > 0) {
      summary += `进行中目标 ${activeGoals} 个`
    }
    
    return summary || '还没有统计数据，开始使用吧！'
  },
  
  // 获取情绪emoji
  getMoodEmoji(mood) {
    return util.getMoodEmoji(mood)
  },
  
  // 格式化日期显示
  formatDateDisplay(dateStr) {
    return util.formatDateDisplay(dateStr)
  },

  // 查看详细统计
  onViewStatsDetail() {
    const { stats } = this.data
    const profile = this.data.profile
    
    let content = `👤 ${profile.nickname || '用户'}\n`
    content += `加入时间：${profile.joinDate || '未知'}\n\n`
    
    content += `📊 使用统计：\n`
    content += `· 连续陪伴：${stats.consecutiveDays || 0} 天\n`
    content += `· 累计对话：${stats.totalChats || 0} 次\n`
    content += `· 情绪记录：${stats.totalMoodRecords || 0} 次\n`
    content += `· 最后访问：${stats.lastVisitDate || '未知'}\n\n`
    
    content += `🎯 陪伴偏好：\n`
    content += `· 称呼偏好：${profile.preferGreeting || '你好'}\n`
    content += `· 语气偏好：${profile.preferTone || '温暖'}\n`
    
    wx.showModal({
      title: '详细统计',
      content: content,
      showCancel: false,
      confirmText: '好的',
    })
  },

  // 清空记忆（谨慎使用）
  onClearMemory() {
    wx.showModal({
      title: '清空记忆',
      content: '这将清除所有个人数据和记忆，确定要继续吗？',
      confirmText: '清空',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          // 重置所有存储
          wx.setStorageSync('userProfile', {
            nickname: '',
            preferGreeting: '你好',
            preferTone: '温暖',
            joinDate: util.formatDate(new Date()),
          })
          
          wx.setStorageSync('shortTermMemory', {
            recentEvents: [],
            recentMood: [],
            currentGoals: [],
            pendingMatters: [],
          })
          
          wx.setStorageSync('longTermMemory', {
            preferences: {},
            patterns: {},
            milestones: [],
          })
          
          wx.setStorageSync('stats', {
            totalChats: 0,
            totalMoodRecords: 0,
            consecutiveDays: 0,
            lastVisitDate: '',
            weeklyMoods: [],
          })
          
          wx.setStorageSync('moodRecords', [])
          wx.setStorageSync('chatHistory', [])
          wx.setStorageSync('dailyCards', [])
          
          this.loadMemoryData()
          
          wx.showToast({ title: '记忆已清空', icon: 'success' })
          wx.showModal({
            title: '重置完成',
            content: '所有个人数据已清除，现在可以重新开始使用',
            showCancel: false,
            confirmText: '好的',
          })
        }
      }
    })
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我的智伴记忆 - 智能陪伴助手',
      imageUrl: '/images/share-cover.png',
      query: 'from=memory'
    }
  },

  // 页面分享配置
  onShareAppMessage(res) {
    return {
      title: '查看我的陪伴记忆 - 智伴AI',
      path: '/pages/memory/index',
      imageUrl: '/images/share-cover.png'
    }
  },
})