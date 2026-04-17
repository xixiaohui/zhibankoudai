// pages/detail/index.js - 内容详情页
const moduleConfig = require('../../utils/moduleConfig.js')

// 模块类型常量
const MODULE_TYPES = {
  QUOTE: 'quote',
  JOKE: 'joke',
  PSYCHOLOGY: 'psychology',
  FINANCE: 'finance',
  LOVE: 'love',
  // ... 其他类型（按需添加）
}

Page({
  data: {
    // 当前模块
    currentModule: null,
    // 内容数据
    content: null,
    // 展示内容
    displayTitle: '',
    displaySubtitle: '',
    displayContent: '',
    displayTags: [],
    displayExtra: '',
    // 海报弹窗
    showPoster: false,
    posterType: 'default',
  },

  onLoad(options) {
    // 解析参数
    const { moduleId, data } = options
    if (!moduleId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    // 获取模块配置
    const module = moduleConfig.DEFAULT_MODULE_CONFIG.modules.find(m => m.id === moduleId)
    if (!module) {
      wx.showToast({ title: '模块不存在', icon: 'none' })
      wx.navigateBack()
      return
    }

    // 解析内容数据
    let content = {}
    try {
      content = data ? JSON.parse(decodeURIComponent(data)) : {}
    } catch (e) {
      console.error('解析内容数据失败', e)
    }

    // 格式化展示内容
    const displayData = this._formatDisplay(module.id, content)

    this.setData({
      currentModule: module,
      content: content,
      posterType: module.posterType || moduleId,
      ...displayData
    })

    // 设置页面标题
    wx.setNavigationBarTitle({ title: module.name || '详情' })
  },

  onShow() {
    // 开启分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 格式化各模块的展示内容
  _formatDisplay(moduleId, content) {
    let displayTitle = ''
    let displaySubtitle = ''
    let displayContent = ''
    let displayTags = []
    let displayExtra = ''

    switch (moduleId) {
      case MODULE_TYPES.QUOTE:
        displayTitle = content.text || content.content || ''
        displaySubtitle = content.author ? `—— ${content.author}` : ''
        displayContent = content.summary || ''
        displayTags = [
          content.domainIcon && content.domainName ? { text: `${content.domainIcon} ${content.domainName}`, isHighlight: false } : null,
          content.era ? { text: content.era === 'ancient' ? '📜 古训' : '✨ 今言', isHighlight: false } : null
        ].filter(Boolean)
        break

      case MODULE_TYPES.JOKE:
        displayTitle = content.title || ''
        displaySubtitle = content.scene ? `${content.sceneIcon || '😂'} ${content.scene}` : ''
        displayContent = content.content || ''
        displayTags = content.tips ? [{ text: `💡 ${content.tips}`, isHighlight: true }] : []
        break

      case MODULE_TYPES.PSYCHOLOGY:
        displayTitle = content.title || ''
        displaySubtitle = content.field ? `${content.fieldIcon || '🧠'} ${content.field}` : ''
        displayContent = content.content || content.summary || ''
        displayTags = content.tips ? [{ text: `📝 ${content.tips}`, isHighlight: true }] : []
        displayExtra = content.analysis || ''
        break

      case MODULE_TYPES.FINANCE:
        displayTitle = content.title || ''
        displaySubtitle = content.category ? `${content.categoryIcon || '💰'} ${content.category}` : ''
        displayContent = content.content || ''
        displayTags = content.keyPoints ? content.keyPoints.map((p, i) => ({ text: `${i + 1}. ${p}`, isHighlight: false })) : []
        displayExtra = content.warning || ''
        break

      case MODULE_TYPES.LOVE:
        displayTitle = content.content || content.text || ''
        displaySubtitle = content.author ? `—— ${content.author}` : ''
        displayContent = content.source || ''
        displayTags = content.category ? [{ text: `💕 ${content.category}`, isHighlight: false }] : []
        break

      case MODULE_TYPES.MOVIE:
        displayTitle = content.title || ''
        displaySubtitle = `${content.director || ''} | ${content.year || ''}年 | ⭐${content.rating || ''}`
        displayContent = content.summary || ''
        displayTags = content.quote ? [{ text: `"${content.quote}"`, isHighlight: false }] : []
        displayExtra = `🎬 ${content.genre || ''}`
        break

      case MODULE_TYPES.MUSIC:
        displayTitle = content.title || ''
        displaySubtitle = `${content.artist || ''} | ${content.album || ''} | ${content.year || ''}`
        displayContent = content.description || ''
        displayTags = content.lyric ? [{ text: `🎵 ${content.lyric}`, isHighlight: false }] : []
        break

      case MODULE_TYPES.TECH:
        displayTitle = content.title || ''
        displaySubtitle = content.category ? `${content.categoryIcon || '🚀'} ${content.category}` : ''
        displayContent = content.summary || content.content || ''
        displayTags = content.impact ? [{ text: `💡 ${content.impact}`, isHighlight: true }] : []
        break

      case MODULE_TYPES.TCM:
        displayTitle = content.title || ''
        displaySubtitle = content.category ? `${content.categoryIcon || '🌿'} ${content.category}` : ''
        displayContent = content.summary || ''
        displayTags = content.tips ? [{ text: `📝 ${content.tips}`, isHighlight: true }] : []
        displayExtra = content.usage || ''
        break

      case MODULE_TYPES.TRAVEL:
        displayTitle = content.title || ''
        displaySubtitle = content.region ? `${content.regionIcon || '✈️'} ${content.region}` : ''
        displayContent = content.summary || ''
        displayTags = content.tips ? [{ text: `📍 ${content.tips}`, isHighlight: true }] : []
        displayExtra = content.bestTime ? `🗓️ 最佳时间：${content.bestTime}` : ''
        break

      case MODULE_TYPES.FORTUNE:
        displayTitle = content.title || ''
        displaySubtitle = content.category ? `${content.categoryIcon || '🔮'} ${content.category}` : ''
        displayContent = content.summary || ''
        displayTags = [
          content.luckyDir ? { text: `🧭 幸运方位：${content.luckyDir}`, isHighlight: true } : null,
          content.luckyColor ? { text: `🎨 幸运色：${content.luckyColor}`, isHighlight: true } : null,
          content.luckyNum ? { text: `🔢 幸运数：${content.luckyNum}`, isHighlight: true } : null
        ].filter(Boolean)
        break

      case MODULE_TYPES.LITERATURE:
        displayTitle = content.author || ''
        displaySubtitle = `${content.era || ''} · ${content.region || ''}`
        displayContent = content.summary || ''
        displayTags = content.quote ? [{ text: `"${content.quote}"`, isHighlight: false }] : []
        displayExtra = content.style ? `📚 ${content.style}` : ''
        break

      default:
        displayTitle = content.title || content.text || content.content || ''
        displaySubtitle = content.subtitle || content.author || ''
        displayContent = content.summary || content.content || ''
    }

    return {
      displayTitle,
      displaySubtitle,
      displayContent,
      displayTags,
      displayExtra
    }
  },

  // 跳转到海报页面
  onGeneratePoster() {
    const { currentModule, content } = this.data
    if (!currentModule || !content) {
      wx.showToast({ title: '数据加载中', icon: 'none' })
      return
    }

    // 构建海报页面参数
    const params = {
      type: currentModule.id,
      title: encodeURIComponent(content.text || content.title || content.content || ''),
      content: encodeURIComponent(content.summary || content.content || ''),
      subtitle: encodeURIComponent(this._buildSubtitle(currentModule.id, content)),
      icon: encodeURIComponent(currentModule.icon || ''),
      author: encodeURIComponent(content.author || ''),
      category: currentModule.id,
      bgColor: encodeURIComponent(currentModule.colors?.bg || '#F6F2EA'),
      titleColor: encodeURIComponent(currentModule.colors?.primary || '#2B2B2B'),
      contentColor: encodeURIComponent(currentModule.colors?.text || '#5C5245'),
    }

    // 构建 URL 参数
    const queryString = Object.entries(params)
      .filter(([_, v]) => v && v !== 'undefined' && v !== 'null')
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    wx.navigateTo({
      url: `/pages/poster/index?${queryString}`
    })
  },

  // 构建副标题
  _buildSubtitle(moduleId, content) {
    switch (moduleId) {
      case MODULE_TYPES.QUOTE:
        return content.author || content.domainName || ''
      case MODULE_TYPES.JOKE:
        return content.scene ? `${content.sceneIcon || ''} ${content.scene}` : ''
      case MODULE_TYPES.PSYCHOLOGY:
        return content.field ? `${content.fieldIcon || ''} ${content.field}` : ''
      case MODULE_TYPES.FINANCE:
        return content.category ? `${content.categoryIcon || ''} ${content.category}` : ''
      case MODULE_TYPES.LOVE:
        return content.author || ''
      case MODULE_TYPES.MOVIE:
        return [content.director, content.year && `${content.year}年`, content.rating && `⭐${content.rating}`].filter(Boolean).join(' | ')
      case MODULE_TYPES.MUSIC:
        return [content.artist, content.album, content.year].filter(Boolean).join(' | ')
      case MODULE_TYPES.TECH:
        return content.category ? `${content.categoryIcon || ''} ${content.category}` : ''
      case MODULE_TYPES.TCM:
        return content.category ? `${content.categoryIcon || ''} ${content.category}` : ''
      case MODULE_TYPES.TRAVEL:
        return content.region ? `${content.regionIcon || ''} ${content.region}` : ''
      case MODULE_TYPES.FORTUNE:
        return content.category ? `${content.categoryIcon || ''} ${content.category}` : ''
      case MODULE_TYPES.LITERATURE:
        return [content.era, content.region].filter(Boolean).join(' · ')
      default:
        return content.subtitle || ''
    }
  },

  // 关闭海报弹窗
  onClosePoster() {
    this.setData({ showPoster: false })
  },

  // 海报保存成功
  onPosterSave(e) {
    console.log('海报保存成功', e.detail)
  },

  // 保存海报到相册
  onSavePoster() {
    wx.showLoading({ title: '生成中...' })
    
    // 延迟确保组件渲染
    setTimeout(() => {
      const posterComponent = this.selectComponent('#posterCanvas')
      if (posterComponent) {
        posterComponent.saveToAlbum().catch(err => {
          wx.showToast({ title: '生成失败', icon: 'none' })
          console.error('保存失败', err)
        })
      } else {
        wx.hideLoading()
        wx.showToast({ title: '组件未加载', icon: 'none' })
      }
    }, 300)
  },

  // 复制内容
  onCopyContent() {
    const { displayTitle, displaySubtitle, displayContent, currentModule } = this.data
    let textToCopy = ''
    
    if (currentModule.id === MODULE_TYPES.QUOTE) {
      textToCopy = `${displayTitle}\n${displaySubtitle}`
    } else if (currentModule.id === MODULE_TYPES.LOVE) {
      textToCopy = `${displayTitle}\n${displaySubtitle}`
    } else {
      textToCopy = [displayTitle, displaySubtitle, displayContent].filter(Boolean).join('\n\n')
    }
    
    wx.setClipboardData({
      data: `${textToCopy}\n\n——来自 智伴AI`,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 分享给好友
  onShareAppMessage() {
    const { currentModule, displayTitle } = this.data
    return {
      title: `${currentModule.icon} ${displayTitle}`,
      path: '/pages/detail/index',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { currentModule, displayTitle } = this.data
    return {
      title: `${currentModule.icon} ${displayTitle} - 智伴AI`,
      query: ''
    }
  }
})
