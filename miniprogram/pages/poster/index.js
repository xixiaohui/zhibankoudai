// miniprogram/pages/poster/index.js
// 海报分享页面
// 适配 posterCanvas 组件和 dailyCard 组件的完整功能

const { MODULE_CONFIGS } = require('../../utils/dailyModule.js')

Page({
  data: {
    // ========= 海报配置参数 =========
    // 对应 posterCanvas 组件的所有 properties
    posterConfig: {
      // 【基础内容】
      title: '',
      content: '',
      subtitle: '',      // 副标题/元信息（来自 dailyCard）
      icon: '',           // 图标（来自 dailyCard）
      author: '',         // 作者（来自 dailyCard）
      qrCodeUrl: '/images/qrcode.jpg',
      footerText: '长按识别二维码',
      subFooterText: '',
      moduleName: '',     // 模块名称（显示在slogan下方）
      
      // 【样式配置】
      backgroundColor: '#F8F4EC',
      titleColor: '#4A3427',
      contentColor: '#463A30',
      subtitleColor: '#7A6B5A',  // 副标题颜色
      contentFontSize: 28,
      contentMaxLines: 8,
      qrCodeSize: 170,
      radius: 28,
      
      // 【阴影配置】
      enableShadow: true,
      shadowColor: 'rgba(0,0,0,0.12)',
      shadowBlur: 20,
      shadowOffsetX: 0,
      shadowOffsetY: 10,
      
      // 【控制】
      autoGenerate: false  // 等待二维码加载完成后再自动生成
    },
    
    // ========= 页面状态 =========
    isLoading: true,
    posterReady: false,
    isGenerating: false,
    
    // ========= 分享配置 =========
    sharePath: '/pages/index/index',
    shareTitle: '智伴口袋',
    
    // ========= 原始参数（用于调试） =========
    rawParams: {},
  },

  // ========= 页面生命周期 =========
  
  onLoad(options) {
    console.log('【海报页面】onLoad:', options)
    this.initShareMenu()

    console.log('【海报页面】options:', options)
    this.initPosterData(options)
  },

  onShow() {
    // 如果海报已就绪但二维码为空，尝试刷新
    if (this.data.posterReady && !this.data.posterConfig.qrCodeUrl) {
      console.log('【海报页面】海报已就绪但二维码为空，尝试刷新')
      this.regeneratePoster()
    }else{
      console.log('【海报页面】海报已就绪但二维码为空，不刷新')
    }
  },

  onPullDownRefresh() {
    this.regeneratePoster().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // ========= 分享功能 =========
  
  onShareAppMessage() {
    const { posterConfig } = this.data
    const title = posterConfig.icon 
      ? `${posterConfig.icon} ${posterConfig.title}` 
      : posterConfig.title || '每日分享'
    return {
      title,
      path: this.data.sharePath,
      imageUrl: '',
    }
  },

  onShareTimeline() {
    const { posterConfig } = this.data
    const title = posterConfig.icon 
      ? `${posterConfig.icon} ${posterConfig.title}` 
      : posterConfig.title || '每日分享'
    return {
      title,
      query: `from=poster`,
    }
  },

  // ========= 初始化方法 =========

  initShareMenu() {
    wx.getSystemInfo({
      success: (res) => {
        const isSupportShareTimeline = res.SDKVersion >= '2.11.0'
        wx.showShareMenu({
          withShareTicket: true,
          menus: isSupportShareTimeline ? ['shareAppMessage', 'shareTimeline'] : ['shareAppMessage']
        }).catch(err => console.error('分享菜单配置失败：', err))
      },
      fail: () => {
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage']
        }).catch(err => console.error('分享菜单配置失败：', err))
      }
    })
  },

  async initPosterData(options) {
    // 保存原始参数
    console.log('【海报页面】原始参数:', options)
    
    // 解析 URL 参数
    const {
      type = 'home',           // 类型：quote/joke/psychology/finance/love/movie/...
      title = '每日分享',
      content = '',
      subtitle = '',            // 副标题/元信息
      icon = '',                // 图标 emoji
      author = '',              // 作者
      category = '',
      
      // 样式参数
      bgColor,
      titleColor,
      contentColor,
      subtitleColor,
      fontSize,
      maxLines,
      qrSize,
      radius,
      
      // 其他
      appId = 'wx0ae2b5c7f8de7fef',
    } = options || {}

    // 构建分享路径
    const sharePath = category
      ? `/pages/index/index?from=poster&category=${category}`
      : `/pages/index/index?from=poster`

    // 根据类型获取默认配色、slogan 和模块名称
    const colorScheme = this.getColorSchemeByType(type)
    const slogan = this.getModuleSlogan(type)
    const moduleName = this.getModuleName(type)
    
    // 先设置基础配置，让组件可以渲染
    const posterConfig = {
      ...this.data.posterConfig,
      
      // 内容
      title: decodeURIComponent(title),
      content: decodeURIComponent(content),
      subtitle: decodeURIComponent(subtitle),
      icon: decodeURIComponent(icon),
      author: decodeURIComponent(author),
      // slogan 替换 footerText，模块名称显示在slogan下方
      footerText: slogan,
      subFooterText: '',
      moduleName: moduleName,
      
      // 样式：优先使用URL参数，其次使用类型默认值
      backgroundColor: bgColor ? decodeURIComponent(bgColor) : colorScheme.backgroundColor,
      titleColor: titleColor ? decodeURIComponent(titleColor) : colorScheme.titleColor,
      contentColor: contentColor ? decodeURIComponent(contentColor) : colorScheme.contentColor,
      subtitleColor: subtitleColor ? decodeURIComponent(subtitleColor) : colorScheme.subtitleColor,
      contentFontSize: fontSize ? parseInt(fontSize) : 26,
      contentMaxLines: maxLines ? parseInt(maxLines) : 20,  // 增加到20行，不截断
      qrCodeSize: qrSize ? parseInt(qrSize) : 170,
      radius: radius ? parseInt(radius) : 28,
      
      // 先不自动生成，等待二维码加载完成
      autoGenerate: false,
    }

    // 先隐藏 loading，让组件渲染
    this.setData({
      sharePath,
      shareTitle: posterConfig.title,
      posterConfig,
      isLoading: false,  // 立即隐藏 loading，让组件渲染
      posterReady: false,
      isGenerating: false,
      rawParams: options,
    })

    // 获取二维码后再自动生成
    await this.fetchQrCodeUrl(sharePath, appId)
  },

  /**
   * 根据模块类型获取 slogan
   */
  getModuleSlogan(type) {
    const slogans = {
      quote: '让智慧照亮生活',
      joke: '笑一笑，十年少',
      psychology: '了解内心，遇见更好的自己',
      finance: '开启财富自由之路',
      love: '用爱点亮每一天',
      movie: '光影之间，遇见故事',
      music: '用音符治愈心灵',
      tech: '探索未知，改变世界',
      tcm: '传承千年，守护健康',
      travel: '脚步丈量世界，心灵感悟人生',
      fortune: '知命而行，顺势而为',
      literature: '书香门第，智慧人生',
      foreignTrade: '货通全球，贸易无忧',
      ecommerce: '玩转电商，赢在未来',
      math: '数学之美，思维之力',
      english: '掌握语言，拥抱世界',
      programming: '代码改变世界',
      photography: '捕捉瞬间，定格永恒',
      beauty: '遇见更美的自己',
      investment: '让钱为你工作',
      fishing: '静享垂钓之乐',
      fitness: '自律即自由',
      pet: '爱它，就给它最好的',
      fashion: '引领潮流，定义时尚',
      outfit: '穿出你的风格',
      decoration: '装点生活，美化家园',
      glassFiber: '材料创新，品质生活',
      resin: '工艺之美，匠心独运',
      tax: '合规经营，省心省力',
      law: '知法用法，权益保障',
      official: '洞悉人情世故，驾驭职场风云',
      handling: '高情商，好人缘',
      floral: '花语无声，美好相伴',
      history: '以史为鉴，可以知兴替',
      military: '知己知彼，百战不殆',
      home: '每天一点，美好生活',
    }
    return slogans[type] || '每天一点，美好生活'
  },

  /**
   * 根据模块类型获取模块名称
   */
  getModuleName(type) {
    const config = MODULE_CONFIGS[type]
    if (config && config.name) {
      return config.name
    }
    return ''  // 默认不显示模块名称
  },

  /**
   * 根据类型获取配色方案
   * 对应 dailyCard 组件的 MODULE_CONFIGS
   */
  getColorSchemeByType(type) {
    const colorSchemes = {
      // 名言警句 - 文艺复古
      quote: {
        backgroundColor: '#F8F4EC',
        titleColor: '#4A3427',
        contentColor: '#5C4A3D',
        subtitleColor: '#8B7355',
      },
      // 段子笑话 - 活泼轻松
      joke: {
        backgroundColor: '#FFF8E7',
        titleColor: '#E67E22',
        contentColor: '#6B4E31',
        subtitleColor: '#9B7B5C',
      },
      // 心理学 - 专业稳重
      psychology: {
        backgroundColor: '#F0F4F8',
        titleColor: '#2C3E50',
        contentColor: '#34495E',
        subtitleColor: '#7F8C8D',
      },
      // 金融理财 - 高端专业
      finance: {
        backgroundColor: '#F5F7FA',
        titleColor: '#1A3A5C',
        contentColor: '#2C5282',
        subtitleColor: '#4A6FA5',
      },
      // 情话 - 浪漫温馨
      love: {
        backgroundColor: '#FFF0F5',
        titleColor: '#C2185B',
        contentColor: '#E91E63',
        subtitleColor: '#F48FB1',
      },
      // 电影 - 文艺深邃
      movie: {
        backgroundColor: '#1C1C1C',
        titleColor: '#E0E0E0',
        contentColor: '#BDBDBD',
        subtitleColor: '#9E9E9E',
      },
      // 音乐 - 律动活力
      music: {
        backgroundColor: '#1A1A2E',
        titleColor: '#EAEAEA',
        contentColor: '#C4C4C4',
        subtitleColor: '#888888',
      },
      // 科技 - 前沿冷峻
      tech: {
        backgroundColor: '#0D1B2A',
        titleColor: '#00D4FF',
        contentColor: '#7FDBFF',
        subtitleColor: '#39CCCC',
      },
      // 中医养生 - 传统健康
      tcm: {
        backgroundColor: '#F5F5DC',
        titleColor: '#2E7D32',
        contentColor: '#388E3C',
        subtitleColor: '#689F38',
      },
      // 旅游 - 清新自然
      travel: {
        backgroundColor: '#E8F5E9',
        titleColor: '#00695C',
        contentColor: '#00897B',
        subtitleColor: '#26A69A',
      },
      // 易经卦象 - 神秘深邃
      fortune: {
        backgroundColor: '#263238',
        titleColor: '#FFD700',
        contentColor: '#FFC107',
        subtitleColor: '#FFD54F',
      },
      // 文学 - 典雅书香
      literature: {
        backgroundColor: '#FFF8E1',
        titleColor: '#5D4037',
        contentColor: '#6D4C41',
        subtitleColor: '#8D6E63',
      },
      // 外贸/电商/职场类 - 专业商务
      foreignTrade: {
        backgroundColor: '#E3F2FD',
        titleColor: '#1565C0',
        contentColor: '#1976D2',
        subtitleColor: '#42A5F5',
      },
      ecommerce: {
        backgroundColor: '#FCE4EC',
        titleColor: '#C2185B',
        contentColor: '#D81B60',
        subtitleColor: '#EC407A',
      },
      // 学习类 - 知识清新
      math: {
        backgroundColor: '#E8EAF6',
        titleColor: '#3949AB',
        contentColor: '#5C6BC0',
        subtitleColor: '#7986CB',
      },
      english: {
        backgroundColor: '#E3F2FD',
        titleColor: '#1565C0',
        contentColor: '#1E88E5',
        subtitleColor: '#42A5F5',
      },
      programming: {
        backgroundColor: '#1E1E1E',
        titleColor: '#4FC3F7',
        contentColor: '#81D4FA',
        subtitleColor: '#4DD0E1',
      },
      // 达人生活类 - 时尚活力
      photography: {
        backgroundColor: '#2C2C2C',
        titleColor: '#FAFAFA',
        contentColor: '#E0E0E0',
        subtitleColor: '#BDBDBD',
      },
      beauty: {
        backgroundColor: '#FFF3E0',
        titleColor: '#E65100',
        contentColor: '#F57C00',
        subtitleColor: '#FFB74D',
      },
      investment: {
        backgroundColor: '#E8F5E9',
        titleColor: '#1B5E20',
        contentColor: '#2E7D32',
        subtitleColor: '#43A047',
      },
      fitness: {
        backgroundColor: '#1A1A1A',
        titleColor: '#FF5722',
        contentColor: '#FF7043',
        subtitleColor: '#FF8A65',
      },
      pet: {
        backgroundColor: '#FFF8E1',
        titleColor: '#FF8F00',
        contentColor: '#FFA000',
        subtitleColor: '#FFB300',
      },
      fashion: {
        backgroundColor: '#F5F5F5',
        titleColor: '#212121',
        contentColor: '#424242',
        subtitleColor: '#757575',
      },
      outfit: {
        backgroundColor: '#ECEFF1',
        titleColor: '#455A64',
        contentColor: '#607D8B',
        subtitleColor: '#78909C',
      },
      decoration: {
        backgroundColor: '#EFEBE9',
        titleColor: '#5D4037',
        contentColor: '#6D4C41',
        subtitleColor: '#8D6E63',
      },
      // 专业材料类
      glassFiber: {
        backgroundColor: '#E0E0E0',
        titleColor: '#424242',
        contentColor: '#616161',
        subtitleColor: '#757575',
      },
      resin: {
        backgroundColor: '#F3E5F5',
        titleColor: '#7B1FA2',
        contentColor: '#9C27B0',
        subtitleColor: '#AB47BC',
      },
      tax: {
        backgroundColor: '#E8EAF6',
        titleColor: '#303F9F',
        contentColor: '#3F51B5',
        subtitleColor: '#5C6BC0',
      },
      law: {
        backgroundColor: '#ECEFF1',
        titleColor: '#263238',
        contentColor: '#37474F',
        subtitleColor: '#546E7A',
      },
      official: {
        backgroundColor: '#FFECB3',
        titleColor: '#F57F17',
        contentColor: '#FF6F00',
        subtitleColor: '#FF8F00',
      },
      handling: {
        backgroundColor: '#F3E5F5',
        titleColor: '#6A1B9A',
        contentColor: '#7B1FA2',
        subtitleColor: '#8E24AA',
      },
      floral: {
        backgroundColor: '#FCE4EC',
        titleColor: '#AD1457',
        contentColor: '#C2185B',
        subtitleColor: '#D81B60',
      },
      history: {
        backgroundColor: '#FFF8E1',
        titleColor: '#795548',
        contentColor: '#8D6E63',
        subtitleColor: '#A1887F',
      },
      military: {
        backgroundColor: '#CFD8DC',
        titleColor: '#263238',
        contentColor: '#37474F',
        subtitleColor: '#455A64',
      },
      // 默认（首页/其他）
      home: {
        backgroundColor: '#F6F2EA',
        titleColor: '#2B2B2B',
        contentColor: '#B79C61',
        subtitleColor: '#B79C61',
      },
      //商务
      bussiness:{
        backgroundColor: '#F5F5F3',
        titleColor: '#202020',
        contentColor: '#8F7E62',
        subtitleColor: '#8F7E62',
      }
    }
    
    return colorSchemes[type] || colorSchemes.home
  },

  // ========= 二维码相关 =========

  async fetchQrCodeUrl(sharePath, appId) {
    try {
      // 优先使用本地二维码图片
      const localQrCode = '../../images/qrcode.jpg'
      
      this.setData({
        'posterConfig.qrCodeUrl': localQrCode,
        'posterConfig.autoGenerate': true,
        isLoading: false,
        posterReady: true
      })

    } catch (err) {
      console.warn('【海报页面】二维码加载失败：', err)
      
      // 使用空字符串触发占位样式
      this.setData({
        'posterConfig.qrCodeUrl': '/miniprogram/images/qrcode.jpg',
        'posterConfig.autoGenerate': true,
        isLoading: false,
        posterReady: true
      })
    }
  },

  /**
   * 调用云函数获取小程序码
   */
  /**
 * 通过云函数获取小程序二维码
 * @param {string} sharePath - 分享路径，用于生成二维码
 * @returns {Promise<string>} 返回二维码临时文件路径
 * @throws {Error} 当云函数调用失败或返回无效数据时抛出错误
 * @description 如果云函数调用失败，会尝试使用本地备用二维码
 */
async getCloudQrCode(sharePath) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'wxacode',
        data: {
          scene: `from=poster`,
          page: 'pages/index/index',
          width: 280,
          autoColor: false,
          lineColor: { r: 185, g: 151, b: 91 },
          isHyaline: true,
        },
        timeout: 10000
      })

      if (res.result && res.result.buffer) {
        // 将 base64 转为临时文件
        const filePath = `${wx.env.USER_DATA_PATH}/poster_qrcode.png`
        const fs = wx.getFileSystemManager()
        fs.writeFileSync(filePath, res.result.buffer, 'base64')
        return filePath
      }

      throw new Error(res.result?.error || '获取二维码失败')
    } catch (err) {
      console.warn('【海报页面】云函数调用失败：', err)
      
      // 备用方案：尝试使用本地图片
      return this.getLocalQrCode()
    }
  },

  /**
   * 获取本地二维码（备用方案）
   */
  getLocalQrCode() {
    return new Promise((resolve) => {
      // 方案1: 返回本地静态二维码图片
      return '/images/qrcode.jpg'
      
      // 方案2: 返回空字符串，使用组件占位样式
      resolve('')
    })
  },

  /**
   * 重新生成海报（刷新二维码）
   */
  regeneratePoster() {
    this.setData({ isLoading: true })
    return this.fetchQrCodeUrl(this.data.sharePath)
  },

  // ========= 组件事件回调 =========

  /**
   * 海报生成成功
   * 对应 posterCanvas 的 ready 事件
   */
  onPosterReady(e) {
    console.log('【海报页面】海报生成成功：', e.detail.tempFilePath)
    this.setData({
      posterReady: true,
      isGenerating: false,
      isLoading: false,
      'posterConfig.posterTempFilePath': e.detail.tempFilePath
    })

    console.log('【海报页面】posterTempFilePath 设置为:', this.data.posterConfig.posterTempFilePath)
  },

  /**
   * 海报图片加载失败
   */
  onImageError(e) {
    console.error('【海报页面】海报图片加载失败：', e.detail.errMsg)
    // 尝试重新生成
    wx.showToast({
      title: '海报加载失败，正在重新生成...',
      icon: 'none'
    })
    this.handleGenerate()
  },

  /**
   * 海报生成失败
   * 对应 posterCanvas 的 error 事件
   */
  onPosterError(e) {
    console.error('【海报页面】海报生成失败：', e.detail.error)
    this.setData({
      isGenerating: false
    })
    wx.showToast({
      title: '海报生成失败',
      icon: 'none'
    })
  },

  // ========= 操作按钮 =========

  /**
   * 重新生成海报
   * 调用 posterCanvas 的 generatePoster 方法
   */
  handleGenerate() {
    // 重置生成状态，允许重新生成
    this.setData({ isGenerating: false })
    
    const comp = this.selectComponent('#posterCanvas')
    if (comp) {
      this.setData({ isGenerating: true })
      comp.generatePoster()
    } else {
      // 组件未加载，等待一下再试
      wx.showToast({ title: '组件加载中，请稍候...', icon: 'none' })
      setTimeout(() => {
        this.handleGenerate()
      }, 500)
    }
  },

  /**
   * 预览海报
   * 调用 posterCanvas 的 previewPoster 方法
   */
  handlePreview() {
    const comp = this.selectComponent('#posterCanvas')
    if (comp) {
      comp.previewPoster()
    }
  },

  /**
   * 保存海报到相册
   * 调用 posterCanvas 的 savePoster 方法
   */
  handleSave() {
    const comp = this.selectComponent('#posterCanvas')
    if (comp) {
      comp.savePoster()
    }
  },

  // ========= 动态更新海报配置 =========

  /**
   * 更新海报标题
   */
  updateTitle(title) {
    this.setData({ 'posterConfig.title': title })
  },

  /**
   * 更新海报内容
   */
  updateContent(content) {
    this.setData({ 'posterConfig.content': content })
  },

  /**
   * 更新背景色
   */
  updateBackgroundColor(color) {
    this.setData({ 'posterConfig.backgroundColor': color })
  },

  /**
   * 更新所有配置（批量更新）
   */
  updateConfig(config) {
    const updates = {}
    Object.keys(config).forEach(key => {
      updates[`posterConfig.${key}`] = config[key]
    })
    this.setData(updates)
  },
})
