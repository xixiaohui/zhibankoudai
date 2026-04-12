// components/posterCanvas/posterCanvas.js - 海报画布组件
Component({
  properties: {
    posterType: { type: String, value: 'default' },
    content: { type: Object, value: {} },
    visible: { type: Boolean, value: false }
  },

  data: {
    posterPath: '',
    isGenerating: false,
    canvasWidth: 300,
    canvasHeight: 375
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        this._generateAndShow()
      }
    }
  },

  lifetimes: {
    attached() {
      this._initCanvas()
    }
  },

  methods: {
    // 初始化画布尺寸
    _initCanvas() {
      const sysInfo = wx.getSystemInfoSync()
      // 使用固定尺寸，海报宽度300px，高度375px (4:5比例)
      const posterWidth = 300
      const posterHeight = 375
      this.setData({ canvasWidth: posterWidth, canvasHeight: posterHeight })
    },

    // 生成并显示海报
    async _generateAndShow() {
      if (this.data.isGenerating) return
      this.setData({ isGenerating: true, posterPath: '' })
      try {
        const path = await this._drawPoster()
        this.setData({ posterPath: path })
      } catch (err) {
        console.error('生成海报失败', err)
        wx.showToast({ title: '生成失败', icon: 'none' })
      } finally {
        this.setData({ isGenerating: false })
      }
    },

    // 绘制海报
    _drawPoster() {
      return new Promise((resolve, reject) => {
        const config = this._getConfig()
        const content = this.properties.content
        
        const posterWidth = 300
        const posterHeight = 375

        const ctx = wx.createCanvasContext('posterCanvas', this)

        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, posterHeight)
        gradient.addColorStop(0, config.bgGradientStart)
        gradient.addColorStop(1, config.bgGradientEnd)
        ctx.setFillStyle(gradient)
        ctx.fillRect(0, 0, posterWidth, posterHeight)

        // 内容区域参数
        const padding = 24
        const boxRadius = 16
        const boxWidth = posterWidth - padding * 2
        const boxHeight = posterHeight - padding * 2
        const boxX = padding
        const boxY = padding

        // 绘制白色内容卡片
        ctx.setFillStyle('#FFFFFF')
        this._roundRect(ctx, boxX, boxY, boxWidth, boxHeight, boxRadius)
        ctx.fill()

        // 绘制内容
        const contentTop = boxY + 40
        this._drawContent(ctx, posterWidth, contentTop, boxWidth, config, content)

        // 底部品牌信息
        const brandY = boxY + boxHeight - 65

        // 品牌名称
        ctx.setFillStyle('#000000')
        ctx.setFontSize(14)
        ctx.setTextAlign('center')
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('智伴AI', posterWidth / 2, brandY)

        // Slogan
        ctx.setFillStyle('#999999')
        ctx.setFontSize(10)
        ctx.font = '10px sans-serif'
        ctx.fillText(config.slogan, posterWidth / 2, brandY + 18)

        // 品牌图标（渐变圆形 + AI）
        const iconY = brandY + 32
        const iconRadius = 13
        const iconX = posterWidth / 2
        
        const iconGradient = ctx.createLinearGradient(iconX - iconRadius, iconY - iconRadius, iconX + iconRadius, iconY + iconRadius)
        iconGradient.addColorStop(0, config.bgGradientStart)
        iconGradient.addColorStop(1, config.bgGradientEnd)
        ctx.setFillStyle(iconGradient)
        ctx.beginPath()
        ctx.arc(iconX, iconY, iconRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.setFillStyle('#FFFFFF')
        ctx.setFontSize(10)
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText('AI', iconX, iconY + 4)

        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'posterCanvas',
              quality: 1,
              success: (res) => {
                console.log('海报生成成功', res.tempFilePath)
                resolve(res.tempFilePath)
              },
              fail: (err) => {
                console.error('canvasToTempFilePath失败', err)
                reject(err)
              }
            }, this)
          }, 200)
        })
      })
    },

    // 获取配置
    _getConfig() {
      const configs = {
        quote: { icon: '📜', slogan: '读名言 · 品人生', bgGradientStart: '#7C6AFF', bgGradientEnd: '#9B8AFF' },
        joke: { icon: '😂', slogan: '每天一笑 · 心情更好', bgGradientStart: '#FF9A76', bgGradientEnd: '#FFB599' },
        psychology: { icon: '🧠', slogan: '懂心理学 · 更懂自己', bgGradientStart: '#6BCB77', bgGradientEnd: '#8ED897' },
        finance: { icon: '💰', slogan: '学金融 · 懂生活', bgGradientStart: '#2196F3', bgGradientEnd: '#64B5F6' },
        love: { icon: '💕', slogan: '甜言蜜语 · 暖心相伴', bgGradientStart: '#FF6B9D', bgGradientEnd: '#FF9BB5' },
        movie: { icon: '🎬', slogan: '光影人生 · 品味经典', bgGradientStart: '#E94057', bgGradientEnd: '#F27121' },
        music: { icon: '🎵', slogan: '聆听美好 · 感悟生活', bgGradientStart: '#8E2DE2', bgGradientEnd: '#A855F7' },
        tech: { icon: '🚀', slogan: '科技前沿 · 洞见未来', bgGradientStart: '#0C3483', bgGradientEnd: '#4facfe' },
        tcm: { icon: '🌿', slogan: '传承经典 · 养生之道', bgGradientStart: '#56AB2F', bgGradientEnd: '#A8E063' },
        travel: { icon: '✈️', slogan: '足不出户 · 走遍天下', bgGradientStart: '#00B4DB', bgGradientEnd: '#0083b0' },
        fortune: { icon: '🔮', slogan: '每日一卦 · 指引人生', bgGradientStart: '#6C5CE7', bgGradientEnd: '#A29BFE' },
        literature: { icon: '📚', slogan: '品味经典 · 涵养心灵', bgGradientStart: '#8B4513', bgGradientEnd: '#D4A574' }
      }
      return configs[this.properties.posterType] || configs.quote
    },

    // 绘制内容
    _drawContent(ctx, canvasWidth, startY, boxWidth, config, content) {
      const title = content.title || content.text || content.content || '精彩内容'
      const author = content.author || ''
      const summary = content.summary || content.description || ''
      
      const centerX = canvasWidth / 2
      const maxWidth = boxWidth - 40

      // 顶部图标
      ctx.setFontSize(30)
      ctx.setTextAlign('center')
      ctx.fillText(config.icon, centerX, startY + 5)

      // 标题
      ctx.setFillStyle('#000000')
      ctx.setFontSize(16)
      ctx.font = 'bold 16px sans-serif'
      let titleY = startY + 38
      const titleLines = this._wrapText(ctx, title, maxWidth, 18)
      titleLines.forEach(line => {
        ctx.fillText(line, centerX, titleY)
        titleY += 24
      })

      // 作者
      if (author) {
        ctx.setFillStyle('#666666')
        ctx.setFontSize(12)
        ctx.fillText(`—— ${author}`, centerX, titleY + 10)
        titleY += 26
      }

      // 分割线
      if (summary) {
        ctx.setFillStyle('#EEEEEE')
        ctx.fillRect(centerX - 25, titleY + 8, 50, 1)
        titleY += 28

        // 摘要内容
        ctx.setFillStyle('#333333')
        ctx.setFontSize(12)
        const descLines = this._wrapText(ctx, summary, maxWidth, 14)
        descLines.slice(0, 4).forEach(line => {
          ctx.fillText(line, centerX, titleY)
          titleY += 18
        })
      }

      // 标签
      const tag = content.domainName || content.scene || content.field || content.quote
      if (tag) {
        titleY += 8
        const tagText = content.quote ? `"${content.quote}"` : `${content.domainIcon || content.sceneIcon || content.fieldIcon || '📌'} ${tag}`
        
        ctx.setFontSize(11)
        const textWidth = this._measureText(ctx, tagText)
        const tagWidth = Math.min(textWidth + 20, maxWidth)
        
        ctx.setFillStyle('#F5F5F5')
        this._roundRect(ctx, centerX - tagWidth / 2, titleY, tagWidth, 24, 12)
        ctx.fill()
        
        ctx.setFillStyle('#666666')
        ctx.fillText(tagText, centerX, titleY + 15)
      }
    },

    // 测量文字宽度
    _measureText(ctx, text) {
      let width = 0
      for (let i = 0; i < text.length; i++) {
        width += ctx.measureText(text[i]).width || 12
      }
      return width
    },

    // 文字换行
    _wrapText(ctx, text, maxWidth, fontSize) {
      ctx.setFontSize(fontSize)
      const chars = text.split('')
      let line = ''
      const lines = []
      for (const char of chars) {
        const testLine = line + char
        const testWidth = this._measureText(ctx, testLine)
        if (testWidth > maxWidth && line) {
          lines.push(line)
          line = char
        } else {
          line = testLine
        }
      }
      if (line) lines.push(line)
      return lines
    },

    // 圆角矩形
    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r)
      ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
      ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r)
      ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.closePath()
    },

    // 关闭弹窗
    closePoster() {
      this.triggerEvent('close')
    },

    // 保存到相册
    saveToAlbum() {
      return new Promise(async (resolve, reject) => {
        if (!this.data.posterPath) {
          await this._generateAndShow()
        }
        try {
          await wx.saveImageToPhotosAlbum({ filePath: this.data.posterPath })
          wx.showToast({ title: '已保存到相册', icon: 'success' })
          this.triggerEvent('save', { success: true })
          resolve(true)
        } catch (err) {
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '请允许保存到相册权限',
              confirmText: '去设置',
              success: (res) => { if (res.confirm) wx.openSetting() }
            })
          }
          this.triggerEvent('save', { success: false, error: err })
          reject(err)
        }
      })
    },

    // 预览海报
    previewPoster() {
      if (!this.data.posterPath) {
        this._generateAndShow().then(() => {
          wx.previewImage({ urls: [this.data.posterPath] })
        })
      } else {
        wx.previewImage({ urls: [this.data.posterPath] })
      }
    }
  }
})
