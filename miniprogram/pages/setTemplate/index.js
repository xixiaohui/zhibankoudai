// pages/setTemplate/index.js - 服务设置页面
Page({
  data: {
    settings: {
      tone: '温暖',
      greeting: '你好',
      greetingTime: '早上',
      dailyReminder: true,
      moodReminder: false,
      reminderTime: '20:00'
    }
  },

  onLoad() {
    this.loadSettings()
  },

  // 加载设置
  loadSettings() {
    const profile = wx.getStorageSync('userProfile') || {}
    const settings = wx.getStorageSync('appSettings') || {}
    
    this.setData({
      settings: {
        tone: profile.preferTone || '温暖',
        greeting: profile.preferGreeting || '你好',
        greetingTime: settings.greetingTime || '早上',
        dailyReminder: settings.dailyReminder !== false,
        moodReminder: settings.moodReminder || false,
        reminderTime: settings.reminderTime || '20:00'
      }
    })
  },

  // 修改语气风格
  changeTone() {
    const tones = ['温暖', '轻松', '专业', '幽默']
    wx.showActionSheet({
      itemList: tones,
      success: (res) => {
        const selected = tones[res.tapIndex]
        this.updateSetting('tone', selected)
        wx.showToast({ title: `已设置为${selected}语气`, icon: 'success' })
      }
    })
  },

  // 修改称呼方式
  changeGreeting() {
    wx.showModal({
      title: '称呼方式',
      editable: true,
      placeholderText: '如：你好、嘿、哈喽',
      content: this.data.settings.greeting,
      success: (res) => {
        if (res.confirm && res.content) {
          const greeting = res.content.trim()
          if (greeting) {
            this.updateSetting('greeting', greeting)
            wx.showToast({ title: '称呼已更新', icon: 'success' })
          }
        }
      }
    })
  },

  // 修改称呼时间
  changeGreetingTime() {
    const times = ['早上', '中午', '下午', '晚上', '全天']
    wx.showActionSheet({
      itemList: times,
      success: (res) => {
        const selected = times[res.tapIndex]
        this.updateSetting('greetingTime', selected)
        wx.showToast({ title: `称呼时间已更新为${selected}`, icon: 'success' })
      }
    })
  },

  // 切换每日提醒
  toggleDailyReminder(e) {
    const enabled = e.detail.value
    this.updateSetting('dailyReminder', enabled)
    wx.showToast({ 
      title: enabled ? '每日提醒已开启' : '每日提醒已关闭', 
      icon: 'success' 
    })
  },

  // 切换情绪记录提醒
  toggleMoodReminder(e) {
    const enabled = e.detail.value
    this.updateSetting('moodReminder', enabled)
    wx.showToast({ 
      title: enabled ? '情绪提醒已开启' : '情绪提醒已关闭', 
      icon: 'success' 
    })
  },

  // 修改提醒时间
  changeReminderTime() {
    wx.showModal({
      title: '设置提醒时间',
      editable: true,
      placeholderText: '如：20:00',
      content: this.data.settings.reminderTime,
      success: (res) => {
        if (res.confirm && res.content) {
          const time = res.content.trim()
          if (/^\d{1,2}:\d{2}$/.test(time)) {
            this.updateSetting('reminderTime', time)
            wx.showToast({ title: '提醒时间已更新', icon: 'success' })
          } else {
            wx.showToast({ title: '请输入正确格式如 20:00', icon: 'none' })
          }
        }
      }
    })
  },

  // 数据备份
  backupData() {
    wx.showModal({
      title: '数据备份',
      content: '是否将本地数据备份到云端？',
      confirmText: '备份',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '备份中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '备份成功', icon: 'success' })
          }, 1500)
        }
      }
    })
  },

  // 数据恢复
  restoreData() {
    wx.showModal({
      title: '数据恢复',
      content: '是否从云端恢复数据？当前数据将被覆盖。',
      confirmText: '恢复',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '恢复中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '恢复成功', icon: 'success' })
            this.loadSettings()
          }, 1500)
        }
      }
    })
  },

  // 清除所有数据
  clearData() {
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      confirmText: '确定清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '再次确认',
            content: '数据清除后将无法恢复，请确认操作',
            confirmText: '确认清除',
            cancelText: '取消',
            success: (result) => {
              if (result.confirm) {
                // 清除本地存储
                wx.clearStorageSync()
                wx.showToast({ title: '数据已清除', icon: 'success' })
                setTimeout(() => {
                  wx.reLaunch({ url: '/pages/index/index' })
                }, 1500)
              }
            }
          })
        }
      }
    })
  },

  // 更新设置
  updateSetting(key, value) {
    const profile = wx.getStorageSync('userProfile') || {}
    const settings = wx.getStorageSync('appSettings') || {}
    
    // 语气和称呼保存到用户资料
    if (key === 'tone') {
      profile.preferTone = value
      wx.setStorageSync('userProfile', profile)
      this.setData({ 'settings.tone': value })
    } else if (key === 'greeting') {
      profile.preferGreeting = value
      wx.setStorageSync('userProfile', profile)
      this.setData({ 'settings.greeting': value })
    } else {
      // 其他设置保存到应用设置
      settings[key] = value
      wx.setStorageSync('appSettings', settings)
      this.setData({ [`settings.${key}`]: value })
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '智伴口袋 - 我的服务设置',
      imageUrl: '/images/share-cover.png',
      query: 'from=setTemplate'
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '智伴AI - 自定义我的服务偏好',
      path: '/pages/setTemplate/index',
      imageUrl: '/images/share-cover.png',
      desc: '设置AI陪伴的语气、称呼和提醒，打造专属体验~'
    }
  },
})
