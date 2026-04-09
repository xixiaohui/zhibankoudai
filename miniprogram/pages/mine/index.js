// pages/mine/index.js - 我的页面
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 用户信息
    userProfile: null,
    stats: null,
    
    // 功能列表
    functions: [
      { id: 'profile', name: '个人资料', icon: '👤', color: '#7C6AFF', desc: '查看和编辑个人资料' },
      { id: 'settings', name: '偏好设置', icon: '⚙️', color: '#6BCB77', desc: '调整陪伴偏好和通知' },
      { id: 'about', name: '关于智伴', icon: '💡', color: '#FFD93D', desc: '了解产品理念和版本信息' },
      { id: 'feedback', name: '意见反馈', icon: '📮', color: '#FF9A76', desc: '告诉我们你的想法和建议' },
      { id: 'share', name: '分享给朋友', icon: '📢', color: '#6BCB77', desc: '邀请朋友一起使用' },
      { id: 'privacy', name: '隐私协议', icon: '🔒', color: '#A8A8A8', desc: '查看隐私保护政策' },
    ],
    
    // 数据统计
    dataStats: [
      { label: '陪伴天数', value: 0, unit: '天' },
      { label: '对话次数', value: 0, unit: '次' },
      { label: '情绪记录', value: 0, unit: '次' },
      { label: '完成目标', value: 0, unit: '个' },
    ],
    
    // 版本信息
    version: '1.0.0',
  },

  onLoad() {
    this.loadUserData()
  },

  onShow() {
    this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
    const profile = wx.getStorageSync('userProfile') || {}
    const stats = wx.getStorageSync('stats') || {}
    const shortTerm = wx.getStorageSync('shortTermMemory') || { currentGoals: [] }
    
    // 计算完成目标数量
    const completedGoals = shortTerm.currentGoals.filter(g => g.completed).length
    
    this.setData({
      userProfile: profile,
      stats: stats,
      dataStats: [
        { label: '陪伴天数', value: stats.consecutiveDays || 0, unit: '天' },
        { label: '对话次数', value: stats.totalChats || 0, unit: '次' },
        { label: '情绪记录', value: stats.totalMoodRecords || 0, unit: '次' },
        { label: '完成目标', value: completedGoals, unit: '个' },
      ]
    })
  },

  // 功能点击处理
  onFunctionTap(e) {
    const functionId = e.currentTarget.dataset.id
    
    switch(functionId) {
      case 'profile':
        wx.switchTab({ url: '/pages/memory/index' })
        break
        
      case 'settings':
        this.showSettings()
        break
        
      case 'about':
        this.showAbout()
        break
        
      case 'feedback':
        this.showFeedback()
        break
        
      case 'share':
        this.shareApp()
        break
        
      case 'privacy':
        this.showPrivacy()
        break
    }
  },

  // 显示设置
  showSettings() {
    const profile = this.data.userProfile
    
    wx.showActionSheet({
      itemList: [
        '语气偏好：' + (profile.preferTone || '温暖'),
        '称呼偏好：' + (profile.preferGreeting || '你好'),
        '通知提醒',
        '数据备份',
      ],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.selectTonePreference()
            break
          case 1:
            this.selectGreetingPreference()
            break
          case 2:
            this.toggleNotifications()
            break
          case 3:
            this.backupData()
            break
        }
      }
    })
  },

  // 选择语气偏好
  selectTonePreference() {
    const tones = ['温暖', '轻松', '专业']
    const currentTone = this.data.userProfile.preferTone || '温暖'
    const currentIndex = tones.indexOf(currentTone)
    
    wx.showActionSheet({
      itemList: tones,
      success: (res) => {
        const selectedTone = tones[res.tapIndex]
        const profile = wx.getStorageSync('userProfile') || {}
        profile.preferTone = selectedTone
        wx.setStorageSync('userProfile', profile)
        
        this.setData({
          'userProfile.preferTone': selectedTone
        })
        
        wx.showToast({ 
          title: `已设置为${selectedTone}语气`, 
          icon: 'success' 
        })
      }
    })
  },

  // 选择称呼偏好
  selectGreetingPreference() {
    wx.showModal({
      title: '设置称呼偏好',
      editable: true,
      placeholderText: '比如：你好、嘿、哈喽',
      content: this.data.userProfile.preferGreeting || '你好',
      success: (res) => {
        if (res.confirm && res.content) {
          const greeting = res.content.trim()
          if (greeting) {
            const profile = wx.getStorageSync('userProfile') || {}
            profile.preferGreeting = greeting
            wx.setStorageSync('userProfile', profile)
            
            this.setData({
              'userProfile.preferGreeting': greeting
            })
            
            wx.showToast({ title: '称呼偏好已更新', icon: 'success' })
          }
        }
      }
    })
  },

  // 切换通知设置
  toggleNotifications() {
    wx.showModal({
      title: '通知提醒',
      content: '每日陪伴提醒和情绪记录提醒',
      confirmText: '开启提醒',
      cancelText: '关闭提醒',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '提醒已开启', icon: 'success' })
          // 实际项目中这里会调用微信订阅消息API
        } else {
          wx.showToast({ title: '提醒已关闭', icon: 'success' })
        }
      }
    })
  },

  // 数据备份
  backupData() {
    wx.showModal({
      title: '数据备份',
      content: '将你的记忆数据备份到云端（仅限演示）',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '备份中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '备份完成', icon: 'success' })
          }, 1500)
        }
      }
    })
  },

  // 显示关于信息
  showAbout() {
    wx.showModal({
      title: '关于智伴口袋',
      content: `版本：${this.data.version}\n\n一个放在微信里的"随身 AI 陪伴助手"，帮助用户倾诉、记录、提醒、鼓励、复盘，在碎片时间里提供轻量但持续的情绪与成长支持。\n\n愿成为你口袋里的温暖陪伴 💗`,
      showCancel: false,
      confirmText: '了解',
    })
  },

  // 显示反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      editable: true,
      placeholderText: '请告诉我们你的想法或建议...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showLoading({ title: '提交中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '感谢你的反馈！', icon: 'success' })
          }, 1000)
        }
      }
    })
  },

  // 分享应用
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showToast({ 
      title: '分享面板已打开', 
      icon: 'success',
      duration: 2000 
    })
  },

  // 显示隐私协议
  showPrivacy() {
    const privacyContent = `隐私保护协议

1. 数据收集
我们仅收集必要的用户数据以提供陪伴服务，包括：
- 昵称和偏好设置
- 情绪记录和对话内容
- 使用统计信息

2. 数据使用
你的数据仅用于：
- 提供个性化陪伴服务
- 改善产品体验
- 生成统计报告

3. 数据安全
所有数据存储在本地设备，除非你明确同意，否则不会上传到服务器。

4. 数据删除
你可以随时在"记忆"页面清空所有个人数据。

5. 联系我们
如有隐私相关问题，请通过意见反馈联系我们。`

    wx.showModal({
      title: '隐私协议',
      content: privacyContent,
      confirmText: '同意',
      cancelText: '关闭',
      showCancel: true,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '感谢你的信任', icon: 'success' })
        }
      }
    })
  },

  // 查看使用指南
  onViewGuide() {
    wx.showModal({
      title: '使用指南',
      content: '💬 聊天陪伴：选择不同模式进行对话\n📝 情绪记录：标记每天的心情状态\n🎯 目标追踪：设定和完成小目标\n📊 记忆查看：回顾你的成长轨迹\n\n随时回来，我都在这里 💗',
      showCancel: false,
      confirmText: '开始使用',
    })
  },

  // 导出数据
  onExportData() {
    wx.showModal({
      title: '导出数据',
      content: '将你的记忆数据导出为文本文件（仅限演示）',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '生成中...' })
          
          setTimeout(() => {
            const profile = this.data.userProfile
            const stats = this.data.stats
            
            let exportText = `智伴口袋 - 个人数据报告\n`
            exportText += `生成时间：${util.formatTime(new Date())}\n`
            exportText += `昵称：${profile.nickname || '未设置'}\n`
            exportText += `加入时间：${profile.joinDate || '未知'}\n\n`
            
            exportText += `使用统计：\n`
            exportText += `- 连续陪伴：${stats.consecutiveDays || 0} 天\n`
            exportText += `- 对话次数：${stats.totalChats || 0} 次\n`
            exportText += `- 情绪记录：${stats.totalMoodRecords || 0} 次\n\n`
            
            exportText += `感谢使用智伴口袋 💗\n`
            exportText += `数据仅保存在本地设备，请妥善保管。`
            
            wx.hideLoading()
            
            wx.showModal({
              title: '数据报告',
              content: exportText,
              showCancel: true,
              cancelText: '关闭',
              confirmText: '复制',
              success: (res) => {
                if (res.confirm) {
                  wx.setClipboardData({
                    data: exportText,
                    success: () => {
                      wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
                    }
                  })
                }
              }
            })
          }, 1500)
        }
      }
    })
  },

  // 用户分享回调
  onShareAppMessage() {
    return {
      title: '智伴口袋 - 你的随身AI陪伴助手',
      path: '/pages/index/index',
      imageUrl: '/images/avatar.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '智伴口袋 | 温暖陪伴，触手可及',
      query: '',
      imageUrl: '/images/avatar.png'
    }
  },
})