// pages/test/index.js - 功能测试页面
const { cloudDb } = require('../../utils/cloudDb.js')
const { PocketMemory } = require('../../utils/memory.js')

Page({
  data: {
    testing: {
      initDb: false,
      saveMsg: false,
      getMsg: false,
    },
    localStats: {
      chatHistory: 0,
      moodRecords: 0,
      profile: '',
    },
    memoryStats: {
      health: 0,
      learnedFacts: 0,
      activeGoals: 0,
      totalConversations: 0,
    },
    logs: [],
  },

  onLoad() {
    this.refreshStats()
  },

  onShow() {
    this.refreshStats()
  },

  // 刷新统计数据
  refreshStats() {
    // 本地存储统计
    const chatHistory = wx.getStorageSync('chatHistory') || []
    const moodRecords = wx.getStorageSync('moodRecords') || []
    const profile = wx.getStorageSync('userProfile') || {}
    
    this.setData({
      localStats: {
        chatHistory: chatHistory.length,
        moodRecords: moodRecords.length,
        profile: profile.nickname || '',
      }
    })

    // 记忆系统统计
    try {
      const memory = new PocketMemory()
      const stats = memory.getStats()
      this.setData({
        memoryStats: {
          health: stats.memoryHealth || 0,
          learnedFacts: stats.learnedFactsCount || 0,
          activeGoals: stats.activeGoalsCount || 0,
          totalConversations: stats.totalConversations || 0,
        }
      })
    } catch (e) {
      console.error('获取记忆统计失败:', e)
    }
  },

  // 添加日志
  addLog(type, msg) {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    const logs = [...this.data.logs, { type, msg, time }]
    // 最多保留50条
    if (logs.length > 50) logs.shift()
    
    this.setData({ logs })
    console.log(`[${type.toUpperCase()}] ${msg}`)
  },

  // 测试初始化云数据库
  async onTestInitDb() {
    this.setData({ 'testing.initDb': true })
    this.addLog('info', '开始初始化云数据库...')

    try {
      // 调用云函数创建集合
      const result = await wx.cloud.callFunction({
        name: 'initDb',
        data: { action: 'createCollections' }
      })

      if (result.result.success) {
        this.addLog('success', `云数据库初始化成功！创建了: ${result.result.created.join(', ')}`)
        wx.showToast({ title: '初始化成功', icon: 'success' })
      } else {
        this.addLog('error', `初始化失败: ${result.result.error}`)
        wx.showToast({ title: '初始化失败', icon: 'none' })
      }
    } catch (e) {
      this.addLog('error', `云函数调用失败: ${e.message || e.errMsg}`)
      this.addLog('info', '请先部署 initDb 云函数')
      wx.showToast({ title: '请先部署云函数', icon: 'none' })
    }

    this.setData({ 'testing.initDb': false })
  },

  // 测试保存消息
  async onTestSaveMessage() {
    this.setData({ 'testing.saveMsg': true })
    this.addLog('info', '开始测试保存消息...')

    try {
      const cloudDbInstance = cloudDb
      await cloudDbInstance.init()

      const testMessage = {
        id: Date.now(),
        type: 'user',
        content: '这是一条测试消息',
        mode: 'chat',
        time: new Date().toLocaleTimeString(),
        date: new Date().toISOString().split('T')[0],
        uniqueId: `test_${Date.now()}`,
      }

      const msgId = await cloudDbInstance.saveMessage(testMessage)
      
      if (msgId) {
        this.addLog('success', `消息保存成功，ID: ${msgId}`)
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        this.addLog('error', '消息保存失败')
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    } catch (e) {
      this.addLog('error', `保存消息失败: ${e.message || e.errMsg || e}`)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }

    this.setData({ 'testing.saveMsg': false })
  },

  // 测试获取消息
  async onTestGetMessages() {
    this.setData({ 'testing.getMsg': true })
    this.addLog('info', '开始测试获取消息...')

    try {
      const cloudDbInstance = cloudDb
      await cloudDbInstance.init()

      const messages = await cloudDbInstance.getMessages({ limit: 10 })
      
      this.addLog('success', `获取到 ${messages.length} 条消息`)
      
      if (messages.length > 0) {
        this.addLog('info', `最新消息: ${messages[messages.length - 1].content.substring(0, 30)}...`)
      }
      
      wx.showToast({ title: `获取到${messages.length}条`, icon: 'success' })
    } catch (e) {
      this.addLog('error', `获取消息失败: ${e.message || e.errMsg || e}`)
      wx.showToast({ title: '获取失败', icon: 'none' })
    }

    this.setData({ 'testing.getMsg': false })
  },

  // 清空本地聊天记录
  onClearLocalChat() {
    wx.showModal({
      title: '清空聊天记录',
      content: '确定要清空所有本地聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('chatHistory')
          this.refreshStats()
          this.addLog('success', '本地聊天记录已清空')
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // 清空情绪记录
  onClearMoodRecords() {
    wx.showModal({
      title: '清空情绪记录',
      content: '确定要清空所有情绪记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('moodRecords')
          this.refreshStats()
          this.addLog('success', '情绪记录已清空')
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // 查看用户画像
  onViewProfile() {
    const profile = wx.getStorageSync('userProfile') || {}
    const profileStr = JSON.stringify(profile, null, 2)
    
    wx.showModal({
      title: '用户画像',
      content: profileStr.substring(0, 500),
      showCancel: true,
      cancelText: '关闭',
      confirmText: '查看更多',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: profileStr,
            success: () => {
              wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
            }
          })
        }
      }
    })
  },

  // 清空日志
  onClearLogs() {
    this.setData({ logs: [] })
  },

  // 页面跳转
  goToChat() {
    wx.navigateTo({ url: '/pages/chat/index' })
  },

  goToMood() {
    wx.switchTab({ url: '/pages/mood/index' })
  },

  goToMemory() {
    wx.switchTab({ url: '/pages/memory/index' })
  },

  goToHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },
})
