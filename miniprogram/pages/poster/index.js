// pages/poster/index.js - 分享海报页面
const app = getApp()

Page({
  data: {
    // 分享内容
    shareTitle: '智伴AI - 智能陪伴助手',
    shareSubtitle: '随时随地，温暖陪伴',
    modeIcon: '🤖',
    modeName: '陪伴模式',
    quote: '',
    
    // 海报生成相关
    posterImagePath: '',
  },

  onLoad(options) {
    // 根据来源设置分享内容
    if (options.type === 'chat') {
      const chatHistory = wx.getStorageSync('chatHistory') || []
      const lastMessages = chatHistory.slice(-4)
      
      // 获取最近的消息作为引用
      if (lastMessages.length > 0) {
        const lastAiMsg = lastMessages.filter(m => m.type === 'ai').pop()
        if (lastAiMsg && lastAiMsg.content.length <= 50) {
          this.setData({ quote: lastAiMsg.content })
        } else if (lastAiMsg) {
          this.setData({ quote: lastAiMsg.content.substring(0, 50) + '...' })
        }
      }
      
      // 获取当前模式
      const userProfile = wx.getStorageSync('userProfile') || {}
      this.setData({
        shareTitle: '智伴AI - 智能陪伴助手',
        shareSubtitle: '随时随地，温暖陪伴',
        modeIcon: '☕',
        modeName: '闲聊模式'
      })
    } else if (options.type === 'home') {
      this.setData({
        shareTitle: '发现智伴AI - 你的智能陪伴助手',
        shareSubtitle: '多种陪伴模式，温暖你的每一天',
        modeIcon: '💝',
        modeName: '温暖陪伴'
      })
    }
    
    console.log('【Poster】海报页面加载', options)
  },

  onShow() {
    // 设置分享信息
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给好友
  onShareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 保存海报图片
  onSavePoster() {
    wx.showLoading({ title: '正在生成海报...' })
    
    // 提示：实际项目中需要使用 canvas 生成海报
    // 这里提供简化版本，实际使用时需要用 canvas API 绘制并导出
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '提示',
        content: '海报生成需要调用 Canvas API，建议在正式项目中使用 wxml2canvas 或原生 canvas 实现。这里展示的是海报预览效果。',
        showCancel: false,
        confirmText: '知道了'
      })
    }, 1000)
  },

  // 预览海报
  onPreviewPoster() {
    if (this.data.posterImagePath) {
      wx.previewImage({
        urls: [this.data.posterImagePath]
      })
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: this.data.shareTitle,
      imageUrl: '/images/share-cover.png',
      query: 'from=poster'
    }
  },

  // 页面分享配置
  onShareAppMessage(res) {
    return {
      title: this.data.shareTitle,
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  }
})
