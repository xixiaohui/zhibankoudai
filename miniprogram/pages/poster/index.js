// miniprogram/pages/poster/index.js
// 海报分享页面
// 适配 posterCanvas 组件和 dailyCard 组件的完整功能

const { MODULE_CONFIGS } = require('../../utils/dailyModule.js')
const { getUserId, getNickname } = require('../../utils/userManager.js')

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
      
      // 【用户信息】
      userName: '',       // 用户名字
      timestamp: '',     // 时间戳
      
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

  truncateContent(content, maxLength = 300) {
    const decoded = decodeURIComponent(content || "");
    return decoded.length > maxLength
      ? decoded.slice(0, maxLength) + "..."
      : decoded;
  },

  /**
   * 获取用户信息（昵称、用户ID和时间戳）
   */
  async getUserInfo() {
    // 获取当前时间戳
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const timestamp = `${year}.${month}.${day} ${hours}:${minutes}`
    
    // 获取用户昵称
    const nickname = getNickname()
    const userName = nickname || '智伴用户'
    
    // 获取用户ID
    const userId = await getUserId()
    
    return { userName, nickname, userId, timestamp }
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
    
    // 获取用户信息（异步）
    const userInfo = await this.getUserInfo()
    
    // 先设置基础配置，让组件可以渲染
    const posterConfig = {
      ...this.data.posterConfig,
      
      // 内容
      title: decodeURIComponent(title),
      content: this.truncateContent(content),
      subtitle: decodeURIComponent(subtitle),
      icon: decodeURIComponent(icon),
      author: decodeURIComponent(author),
      // slogan 替换 footerText，模块名称显示在slogan下方
      footerText: slogan,
      subFooterText: '',
      moduleName: moduleName,
      
      // 用户信息
      userId: userInfo.userId,
      userName: userInfo.userName,
      timestamp: userInfo.timestamp,
      
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
      apple: '用Swift编织苹果生态',
      growth: '数据驱动，敏捷增长',
      uiDesigner: '用设计创造美好体验',
      futures: '洞察大宗，运筹期货',
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
        backgroundColor: '#F7F1E8',
        titleColor: '#4E3B2F',
        contentColor: '#6A5547',
        subtitleColor: '#9A8573',
      },
  
      // 段子笑话 - 活泼轻松
      joke: {
        backgroundColor: '#FFF8ED',
        titleColor: '#C96A2B',
        contentColor: '#7A5A42',
        subtitleColor: '#B29378',
      },
  
      // 心理学 - 专业稳重
      psychology: {
        backgroundColor: '#EEF3F6',
        titleColor: '#314656',
        contentColor: '#4B6271',
        subtitleColor: '#7E93A0',
      },
  
      // 金融理财 - 高端专业
      finance: {
        backgroundColor: '#F3F6F8',
        titleColor: '#1F3B57',
        contentColor: '#35516C',
        subtitleColor: '#70879D',
      },
  
      // 情话 - 浪漫温柔
      love: {
        backgroundColor: '#FFF1F5',
        titleColor: '#B4476B',
        contentColor: '#C86A88',
        subtitleColor: '#D9A1B4',
      },
  
      // 电影 - 文艺深邃
      movie: {
        backgroundColor: '#202124',
        titleColor: '#F1ECE4',
        contentColor: '#D1C7BB',
        subtitleColor: '#9A9187',
      },
  
      // 音乐 - 律动质感
      music: {
        backgroundColor: '#1E2230',
        titleColor: '#F1F1F1',
        contentColor: '#C9CFD8',
        subtitleColor: '#8D97A6',
      },
  
      // 科技 - 前沿冷峻
      tech: {
        backgroundColor: '#0F1C26',
        titleColor: '#8DEBFF',
        contentColor: '#C6F7FF',
        subtitleColor: '#58BDD3',
      },
  
      // 中医养生 - 传统健康
      tcm: {
        backgroundColor: '#F4F1E6',
        titleColor: '#42603B',
        contentColor: '#5E7B55',
        subtitleColor: '#92A082',
      },
  
      // 旅游 - 清新自然
      travel: {
        backgroundColor: '#EDF6F2',
        titleColor: '#23695E',
        contentColor: '#3D877A',
        subtitleColor: '#82B4A9',
      },
  
      // 易经卦象 - 神秘深邃
      fortune: {
        backgroundColor: '#252B30',
        titleColor: '#D8B86A',
        contentColor: '#E6CC92',
        subtitleColor: '#A99972',
      },
  
      // 文学 - 典雅书香
      literature: {
        backgroundColor: '#FBF5E8',
        titleColor: '#5A4336',
        contentColor: '#755C4C',
        subtitleColor: '#A18775',
      },
  
      // 外贸 - 专业商务
      foreignTrade: {
        backgroundColor: '#EEF4FA',
        titleColor: '#2A5D91',
        contentColor: '#4474A5',
        subtitleColor: '#7EA3C6',
      },
  
      // 电商 - 明快但不廉价
      ecommerce: {
        backgroundColor: '#FFF3F6',
        titleColor: '#B84B72',
        contentColor: '#D06A8D',
        subtitleColor: '#DDA1B5',
      },
  
      // 数学 - 理性知识
      math: {
        backgroundColor: '#EEF0FA',
        titleColor: '#4652A8',
        contentColor: '#6672C0',
        subtitleColor: '#98A0D6',
      },
  
      // 英语 - 清爽学习
      english: {
        backgroundColor: '#EEF6FC',
        titleColor: '#2E6EA6',
        contentColor: '#4C89BE',
        subtitleColor: '#8CB5D5',
      },
  
      // 编程 - 深色极客
      programming: {
        backgroundColor: '#1C1F24',
        titleColor: '#78D6FF',
        contentColor: '#BFEFFF',
        subtitleColor: '#63B6CC',
      },
  
      // 摄影 - 高级灰
      photography: {
        backgroundColor: '#2A2A2A',
        titleColor: '#F5F3EE',
        contentColor: '#D8D4CD',
        subtitleColor: '#A4A09A',
      },
  
      // 美妆 - 柔和明亮
      beauty: {
        backgroundColor: '#FFF5EC',
        titleColor: '#C2672D',
        contentColor: '#D8874E',
        subtitleColor: '#E7B287',
      },
  
      // 投资 - 稳定成长
      investment: {
        backgroundColor: '#EDF5EE',
        titleColor: '#295A36',
        contentColor: '#437750',
        subtitleColor: '#7DA287',
      },
  
      // 健身 - 力量感
      fitness: {
        backgroundColor: '#1F1F1F',
        titleColor: '#FF7B47',
        contentColor: '#FFAB86',
        subtitleColor: '#B58A78',
      },
  
      // 宠物 - 温暖可爱
      pet: {
        backgroundColor: '#FFF8ED',
        titleColor: '#D1892D',
        contentColor: '#E2A146',
        subtitleColor: '#E7C28A',
      },
  
      // 时尚 - 极简高级
      fashion: {
        backgroundColor: '#F6F6F4',
        titleColor: '#2B2B2B',
        contentColor: '#555555',
        subtitleColor: '#8D8D8D',
      },
  
      // 穿搭 - 冷调现代
      outfit: {
        backgroundColor: '#F0F3F4',
        titleColor: '#4B5D66',
        contentColor: '#687C86',
        subtitleColor: '#95A5AD',
      },
  
      // 家装 - 温润家居
      decoration: {
        backgroundColor: '#F2ECE7',
        titleColor: '#644D40',
        contentColor: '#7E6658',
        subtitleColor: '#A18C7F',
      },
  
      // 玻璃纤维 - 工业理性
      glassFiber: {
        backgroundColor: '#ECECEC',
        titleColor: '#4A4A4A',
        contentColor: '#686868',
        subtitleColor: '#949494',
      },
  
      // 树脂 - 材料质感
      resin: {
        backgroundColor: '#F6EFF9',
        titleColor: '#72459B',
        contentColor: '#8D63B1',
        subtitleColor: '#B197C9',
      },
  
      // 税务 - 稳重权威
      tax: {
        backgroundColor: '#EEF0F8',
        titleColor: '#3B4B9A',
        contentColor: '#5967B2',
        subtitleColor: '#8C97CC',
      },
  
      // 法律 - 冷静克制
      law: {
        backgroundColor: '#EEF2F3',
        titleColor: '#2F3B42',
        contentColor: '#4D5D67',
        subtitleColor: '#80909A',
      },
  
      // 公文/官方 - 稳定规范
      official: {
        backgroundColor: '#FFF6D9',
        titleColor: '#9E6A12',
        contentColor: '#B57A1D',
        subtitleColor: '#D19B4B',
      },
  
      // 办理/流程类 - 清晰明确
      handling: {
        backgroundColor: '#F6EFF8',
        titleColor: '#69408D',
        contentColor: '#8458A7',
        subtitleColor: '#A98BC0',
      },
  
      // 花艺 - 柔美自然
      floral: {
        backgroundColor: '#FDEEF2',
        titleColor: '#A84A68',
        contentColor: '#C06985',
        subtitleColor: '#DCA1B3',
      },
  
      // 历史 - 旧纸卷轴感
      history: {
        backgroundColor: '#FBF4E5',
        titleColor: '#6F5647',
        contentColor: '#8A6E5D',
        subtitleColor: '#B19786',
      },
  
      // 军事 - 冷峻克制
      military: {
        backgroundColor: '#DDE3E6',
        titleColor: '#324047',
        contentColor: '#4A5B63',
        subtitleColor: '#73848C',
      },
  
      // 默认首页/其他
      home: {
        backgroundColor: '#F6F2EA',
        titleColor: '#2B2B2B',
        contentColor: '#5C5245',
        subtitleColor: '#B79C61',
      },
  
      // 商务
      business: {
        backgroundColor: '#F5F5F3',
        titleColor: '#202020',
        contentColor: '#4E4A43',
        subtitleColor: '#8F7E62',
      },

      // 果核学堂 - Apple蓝
      apple: {
        backgroundColor: '#F0F7FF',
        titleColor: '#0056B3',
        contentColor: '#1E5AA8',
        subtitleColor: '#007AFF',
      },

      // 市场品牌增长专家 - 活力粉红
      growth: {
        backgroundColor: '#FFF0F5',
        titleColor: '#C2185B',
        contentColor: '#E91E63',
        subtitleColor: '#F48FB1',
      },

      // UI设计师专家 - 优雅紫
      uiDesigner: {
        backgroundColor: '#F5F0FF',
        titleColor: '#6A1B9A',
        contentColor: '#9C27B0',
        subtitleColor: '#CE93D8',
      },

      // 大宗贸易期货专家 - 热情橙红
      futures: {
        backgroundColor: '#FBE9E7',
        titleColor: '#D84315',
        contentColor: '#FF5722',
        subtitleColor: '#FFAB91',
      },

    }
  
    return colorSchemes[type] || colorSchemes.home
  },
  
  // ========= 二维码相关 =========

  async fetchQrCodeUrl(sharePath, appId) {
    try {
      // 优先使用本地二维码图片
      const localQrCode = '/images/qrcode.jpg'
      
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
    const error = e.detail?.error
    console.error('【海报页面】海报生成失败：', error)
    
    this.setData({
      isGenerating: false
    })
    
    // 安全地提取错误信息
    let errorMsg = '海报生成失败'
    if (error) {
      if (typeof error === 'string') {
        errorMsg = error
      } else if (error.message) {
        errorMsg = error.message
      } else if (error.errMsg) {
        errorMsg = error.errMsg
      }
    }
    
    wx.showToast({
      title: errorMsg,
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
