// pages/poster/index.js - 分享海报页面
const app = getApp()

// 海报配置
const POSTER_CONFIGS = {
  quote: {
    icon: '📜',
    appName: '智伴AI',
    typeName: '今日名言',
    slogan: '读名言 · 品人生',
    bgGradientStart: '#F8F6FF',
    bgGradientEnd: '#E8E4FF',
    accentColor: '#7C6AFF'
  },
  joke: {
    icon: '😂',
    appName: '智伴AI',
    typeName: '今日段子',
    slogan: '每天一笑 · 心情更好',
    bgGradientStart: '#FFF8F0',
    bgGradientEnd: '#FFE4D6',
    accentColor: '#FF9A76'
  },
  psychology: {
    icon: '🧠',
    appName: '智伴AI',
    typeName: '每日心理',
    slogan: '懂心理学 · 更懂自己',
    bgGradientStart: '#F0FFF4',
    bgGradientEnd: '#D4EDDA',
    accentColor: '#6BCB77'
  },
  finance: {
    icon: '💰',
    appName: '智伴AI',
    typeName: '每日金融',
    slogan: '学金融 · 懂生活',
    bgGradientStart: '#F0F7FF',
    bgGradientEnd: '#D6E9FF',
    accentColor: '#2196F3'
  },
  love: {
    icon: '💕',
    appName: '智伴AI',
    typeName: '每日情话',
    slogan: '甜言蜜语 · 暖心相伴',
    bgGradientStart: '#FFF0F5',
    bgGradientEnd: '#FFE4EC',
    accentColor: '#FF6B9D'
  },
  foreignTrade: {
    icon: '💼',
    appName: '智伴AI',
    typeName: '外贸助手',
    slogan: '外贸干货 · 业务赋能',
    bgGradientStart: '#E3F2FD',
    bgGradientEnd: '#BBDEFB',
    accentColor: '#1565C0'
  },
  ecommerce: {
    icon: '🛒',
    appName: '智伴AI',
    typeName: '电商运营助手',
    slogan: '电商干货 · 运营赋能',
    bgGradientStart: '#FFF3E0',
    bgGradientEnd: '#FFE0B2',
    accentColor: '#FF6B00'
  },
  math: {
    icon: '📐',
    appName: '智伴AI',
    typeName: '中学数学助手',
    slogan: '数学知识 · 学习助手',
    bgGradientStart: '#F3E5F5',
    bgGradientEnd: '#E1BEE7',
    accentColor: '#6A1B9A'
  },
  english: {
    icon: '📚',
    appName: '智伴AI',
    typeName: '中学英语助手',
    slogan: '英语知识 · 学习助手',
    bgGradientStart: '#FFEBEE',
    bgGradientEnd: '#FFCDD2',
    accentColor: '#D32F2F'
  },
  home: {
    icon: '💝',
    appName: '智伴AI',
    typeName: '温暖陪伴',
    slogan: '随时随地 · 温暖陪伴',
    bgGradientStart: '#F8F6FF',
    bgGradientEnd: '#E8E4FF',
    accentColor: '#7C6AFF'
  }
}

Page({
  data: {
    // 分享内容
    shareTitle: '智伴AI - 智能陪伴助手',
    shareSubtitle: '随时随地，温暖陪伴',
    shareAuthor: '',
    shareContent: '',
    shareSubtitle: '',
    modeIcon: '🤖',
    modeName: '陪伴模式',
    quote: '',
    
    // 海报类型
    posterType: 'home',
    posterConfig: POSTER_CONFIGS.home,
    
    // 当前日期
    currentDate: '',
    
    // 海报生成相关
    posterImagePath: '',
  },

  onLoad(options) {
    // 设置当前日期
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[now.getDay()]
    this.setData({
      currentDate: `${month}月${day}日 ${weekday}`
    })
    
    // 解码参数
    const type = options.type || 'home'
    const title = decodeURIComponent(options.title || '')
    const author = decodeURIComponent(options.author || '')
    const content = decodeURIComponent(options.content || '')
    const subtitle = decodeURIComponent(options.subtitle || '')
    
    // 根据类型设置海报配置和内容
    const config = POSTER_CONFIGS[type] || POSTER_CONFIGS.home
    
    this.setData({
      posterType: type,
      posterConfig: config,
      shareTitle: title,
      shareAuthor: author,
      shareContent: content,
      shareSubtitle: subtitle
    })
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: config.typeName + '海报'
    })
    
    console.log('【Poster】海报页面加载', { type, title, author, content, subtitle })
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
    const config = this.data.posterConfig
    const title = this.data.shareTitle || config.typeName
    return {
      title: `${config.icon} ${title} - 智伴AI分享`,
      imageUrl: '/images/share-cover.png',
      query: 'from=poster'
    }
  },

  // 页面分享配置
  onShareAppMessage(res) {
    const config = this.data.posterConfig
    const title = this.data.shareTitle || config.typeName
    return {
      title: `${config.icon} ${title} - 智伴AI分享`,
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  }
})
