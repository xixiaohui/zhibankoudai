// miniprogram/pages/careerGuideDetail/index.js - AI Agent 详情页
const { careerGuideData } = require('../../utils/careerGuideData.js')

// 构建 careerMap 便于快速查找
const careerMap = {}
if (careerGuideData && careerGuideData.categories) {
  careerGuideData.categories.forEach(cat => {
    if (cat.careers) {
      cat.careers.forEach(career => {
        careerMap[career.id] = career
      })
    }
  })
}

// 云存储配置
const CLOUD_PATH = 'cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/career'

Page({
  data: {
    agentId: '',
    agent: null,
    posterConfig: null,
    isLoading: true,
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.setData({ agentId: id })
      this._loadAgent(id)
    }
  },

  // 加载 Agent 数据（从云存储获取）
  async _loadAgent(agentId) {
    this.setData({ isLoading: true })
    
    try {
      // 首先检查本地缓存是否有基础数据
      const cached = careerMap[agentId]
      
      // 从云存储下载 JSON 文件
      const cloudPath = `${CLOUD_PATH}/${agentId}.json`
      console.log('【CareerDetail】从云存储下载:', cloudPath)
      
      const res = await wx.cloud.downloadFile({
        fileID: cloudPath
      })
      
      // 读取文件内容
      const fs = wx.getFileSystemManager()
      const content = fs.readFileSync(res.tempFilePath, 'utf8')
      const cloudData = JSON.parse(content)
      
      console.log('【CareerDetail】云存储数据加载成功:', agentId)
      
      // 合并数据：使用云存储的详细数据，保留本地的基础信息
      const agent = {
        ...cached,           // 本地基础数据（id, name, emoji, category 等）
        ...cloudData,         // 云存储详细数据（会覆盖）
        id: agentId           // 确保 id 正确
      }
      
      // 预处理数据
      const processedAgent = this._processAgent(agent)
      this.setData({ 
        agent: processedAgent,
        isLoading: false 
      })
      
    } catch (e) {
      console.error('【CareerDetail】云存储加载失败:', e)
      
      // 降级：尝试使用本地数据
      const cached = careerMap[agentId]
      if (cached) {
        console.log('【CareerDetail】降级使用本地数据')
        const processedAgent = this._processAgent(cached)
        this.setData({ 
          agent: processedAgent,
          isLoading: false 
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' })
        this.setData({ isLoading: false })
      }
    }
  },

  // 处理 Agent 数据
  _processAgent(agent) {
    // 确保所有数组字段存在
    const fields = [
      'coreMission', 'technicalDeliverables', 'workflow', 'communicationStyle',
      'successMetrics', 'tools', 'personality', 'background', 'expertise',
      'criticalRules', 'advancedCapabilities', 'researchDeliverables', 'learningMemory'
    ]
    
    fields.forEach(field => {
      if (!agent[field]) {
        agent[field] = []
      }
    })
    
    // 清理 Markdown 格式
    return this._cleanMarkdown(agent)
  },

  // 清理 Markdown 格式
  _cleanMarkdown(obj) {
    if (typeof obj === 'string') {
      return obj
        .replace(/#+\s*/g, '')
        .replace(/\*\*/g, '')
        .replace(/`{1,3}/g, '')
        .trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this._cleanMarkdown(item))
    }
    if (obj && typeof obj === 'object') {
      const result = {}
      for (const key in obj) {
        if (key.startsWith('_')) continue
        result[key] = this._cleanMarkdown(obj[key])
      }
      return result
    }
    return obj
  },

  // 生成海报
  onSharePoster() {
    const { agent } = this.data
    if (!agent) return

    wx.showLoading({ title: '生成中...' })

    const posterConfig = {
      width: 375,
      height: 550,
      backgroundColor: agent.color || '#6366F1',
      elements: []
    }

    posterConfig.elements.push({
      type: 'rect',
      x: 0, y: 0,
      width: posterConfig.width,
      height: 280,
      backgroundColor: agent.color || '#6366F1'
    })

    posterConfig.elements.push({
      type: 'text',
      x: posterConfig.width / 2,
      y: 100,
      text: `${agent.emoji || '🤖'} AI Agent`,
      fontSize: 28,
      color: '#FFFFFF',
      align: 'center'
    })

    posterConfig.elements.push({
      type: 'text',
      x: posterConfig.width / 2,
      y: 180,
      text: agent.name || agent.nameEn || '',
      fontSize: 36,
      color: '#FFFFFF',
      fontWeight: 'bold',
      align: 'center'
    })

    posterConfig.elements.push({
      type: 'roundRect',
      x: posterConfig.width / 2 - 60,
      y: 230,
      width: 120,
      height: 32,
      radius: 16,
      fillColor: 'rgba(255,255,255,0.2)'
    })

    posterConfig.elements.push({
      type: 'text',
      x: posterConfig.width / 2,
      y: 252,
      text: `${agent.categoryIcon || '📂'} ${agent.categoryName || agent.categoryNameEn || ''}`,
      fontSize: 14,
      color: '#FFFFFF',
      align: 'center'
    })

    posterConfig.elements.push({
      type: 'rect',
      x: 0, y: 280,
      width: posterConfig.width,
      height: 270,
      fillColor: '#FFFFFF'
    })

    posterConfig.elements.push({
      type: 'text',
      x: 24, y: 310,
      text: '💡 Description',
      fontSize: 16,
      color: '#333333',
      fontWeight: 'bold'
    })

    const desc = agent.description || agent.descriptionEn || ''
    const shortDesc = desc.length > 80 ? desc.substring(0, 80) + '...' : desc
    posterConfig.elements.push({
      type: 'text',
      x: 24, y: 340,
      text: shortDesc,
      fontSize: 12,
      color: '#666666',
      lineHeight: 20,
      maxLines: 3
    })

    posterConfig.elements.push({
      type: 'text',
      x: 24, y: 400,
      text: '🎯 Core Mission',
      fontSize: 16,
      color: '#333333',
      fontWeight: 'bold'
    })

    const skills = (agent.coreMission || []).slice(0, 3)
    const skillsText = skills.map((s, i) => `${i + 1}. ${String(s).substring(0, 30)}`).join('\n')
    posterConfig.elements.push({
      type: 'text',
      x: 24, y: 430,
      text: skillsText,
      fontSize: 12,
      color: '#666666',
      lineHeight: 18
    })

    posterConfig.elements.push({
      type: 'rect',
      x: 0, y: 480,
      width: posterConfig.width,
      height: 70,
      fillColor: '#F5F5F5'
    })

    posterConfig.elements.push({
      type: 'text',
      x: posterConfig.width / 2,
      y: 510,
      text: '长按识别查看更多 AI Agent',
      fontSize: 12,
      color: '#999999',
      align: 'center'
    })

    this.setData({ posterConfig })
    this._drawPoster(posterConfig)
  },

  _drawPoster(config) {
    const canvas = wx.createCanvasContext('posterCanvas')

    canvas.setFillStyle(config.backgroundColor)
    canvas.fillRect(0, 0, config.width, config.height)

    config.elements.forEach(el => {
      if (el.type === 'rect') {
        canvas.setFillStyle(el.backgroundColor || '#FFFFFF')
        canvas.fillRect(el.x, el.y, el.width, el.height)
      } else if (el.type === 'roundRect') {
        canvas.setFillStyle(el.fillColor || '#FFFFFF')
        this._roundRect(canvas, el.x, el.y, el.width, el.height, el.radius || 0)
        canvas.fill()
      } else if (el.type === 'text') {
        canvas.setFillStyle(el.color || '#000000')
        canvas.setFontSize(el.fontSize || 14)
        canvas.setTextAlign(el.align || 'left')
        if (el.fontWeight === 'bold') {
          canvas.setFontWeight('bold')
        }
        if (el.maxLines) {
          const lines = this._wrapText(el.text, el.maxLines * 20, el.fontSize)
          lines.slice(0, el.maxLines).forEach((line, i) => {
            canvas.fillText(line, el.x, el.y + i * (el.lineHeight || 16))
          })
        } else {
          canvas.fillText(el.text, el.x, el.y)
        }
      }
    })

    canvas.draw()

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '海报已生成', icon: 'success' })
    }, 500)
  },

  _roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  },

  _wrapText(text, maxWidth, fontSize) {
    const chars = text.split('')
    const lines = []
    let currentLine = ''

    chars.forEach(char => {
      const testLine = currentLine + char
      if (testLine.length * fontSize * 0.5 > maxWidth) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines
  },

  onSaveToClipboard() {
    wx.showLoading({ title: '生成中...' })
    wx.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      success: (res) => {
        wx.hideLoading()
        wx.previewImage({
          urls: [res.tempFilePath],
          success: () => {
            wx.showToast({ title: '长按保存图片', icon: 'success' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'error' })
      }
    })
  },

  onCopyContent(e) {
    const { text } = e.currentTarget.dataset
    if (text) {
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({ title: '已复制', icon: 'success' })
        }
      })
    }
  },

  // 跳转到 AI 生成内容页面
  onGenerateContent() {
    const { agent } = this.data
    if (!agent) return

    wx.navigateTo({
      url: `/pages/careerCardList/index?id=${agent.id}`
    })
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { agent } = this.data
    return {
      title: `${agent?.emoji || '🤖'} ${agent?.name || '职业'} - 职业发展指南`,
      imageUrl: '/images/share-cover.png',
      query: `from=careerDetail&id=${agent?.id}`
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    const { agent } = this.data
    return {
      title: `${agent?.emoji || '🤖'} ${agent?.name || '职业'} - 职业发展指南`,
      path: `/pages/careerGuideDetail/index?id=${this.data.agentId}`,
      imageUrl: '/images/share-cover.png',
      desc: `${agent?.description || '了解这个职业的发展前景和要求'}`
    }
  },
})
