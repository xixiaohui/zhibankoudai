// components/posterCanvas/posterCanvas.js
const CANVAS_WIDTH = 750
const CANVAS_HEIGHT = 1200
const PADDING = 48

const { drawImage } = require('./share.js')


Component({
  properties: {
    // 模板：minimal | editorial
    template: {
      type: String,
      value: 'minimal'
    },

    // 主题预设：sand | ink | forest | night
    themePreset: {
      type: String,
      value: 'sand'
    },

    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    author: {
      type: String,
      value: ''
    },
    content: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    },
    moduleName: {
      type: String,
      value: ''
    },

    // 用户信息
    userName: {
      type: String,
      value: ''
    },
    timestamp: {
      type: String,
      value: ''
    },
    userId: {
      type: String,
      value: ''
    },

    qrCodeUrl: {
      type: String,
      value: ''
    },
    footerText: {
      type: String,
      value: '长按识别二维码'
    },
    subFooterText: {
      type: String,
      value: '查看完整内容'
    },

    autoGenerate: {
      type: Boolean,
      value: true
    },

    // 可选覆盖主题色：留空则走 themePreset
    backgroundColor: {
      type: String,
      value: ''
    },
    titleColor: {
      type: String,
      value: ''
    },
    accentColor: {
      type: String,
      value: ''
    },

    contentFontSize: {
      type: Number,
      value: 26
    },
    contentMaxLines: {
      type: Number,
      value: 18
    },
    qrCodeSize: {
      type: Number,
      value: 160
    },
    radius: {
      type: Number,
      value: 24
    },

    enableShadow: {
      type: Boolean,
      value: true
    },
    shadowColor: {
      type: String,
      value: 'rgba(0, 0, 0, 0.08)'
    },
    shadowBlur: {
      type: Number,
      value: 18
    },
    shadowOffsetX: {
      type: Number,
      value: 0
    },
    shadowOffsetY: {
      type: Number,
      value: 8
    }
  },

  data: {
    posterTempFilePath: '',
    isGenerating: false
  },

  lifetimes: {
    ready() {
      this._destroyed = false
      this.initCanvas()
    },
    detached() {
      this._destroyed = true
      this.canvas = null
      this.ctx = null
      this.dpr = 1

      if (this._debounceTimer) clearTimeout(this._debounceTimer)
      if (this._retryTimer) clearTimeout(this._retryTimer)
    }
  },

  observers: {
    'template,themePreset,title,subtitle,author,content,icon,moduleName,userName,timestamp,qrCodeUrl,footerText,subFooterText,autoGenerate,backgroundColor,titleColor,accentColor,contentFontSize,contentMaxLines,qrCodeSize,radius,enableShadow,shadowColor,shadowBlur,shadowOffsetX,shadowOffsetY': function () {
      if (!this.data.autoGenerate) return
      this.debounceGenerate()
    }
  },

  methods: {
    debounceGenerate() {
      if (this._debounceTimer) clearTimeout(this._debounceTimer)
      this._debounceTimer = setTimeout(() => {
        if (!this.ctx || !this.canvas) return
        this.generatePoster()
      }, 120)
    },

    initCanvas() {
      let retryCount = 0
      const maxRetry = 8

      const tryInit = () => {
        if (this._destroyed) return

        const query = this.createSelectorQuery()
        query.select('#posterCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (this._destroyed) return

            const canvasRes = res && res[0]
            if (!canvasRes || !canvasRes.node) {
              retryCount++
              if (retryCount < maxRetry) {
                this._retryTimer = setTimeout(tryInit, 180)
              }
              return
            }

            const canvas = canvasRes.node
            const ctx = canvas.getContext('2d')
            const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2

            canvas.width = CANVAS_WIDTH * dpr
            canvas.height = CANVAS_HEIGHT * dpr
            ctx.scale(dpr, dpr)

            this.canvas = canvas
            this.ctx = ctx
            this.dpr = dpr

            if (this.data.autoGenerate) {
              this.generatePoster()
            }
          })
      }

      this._retryTimer = setTimeout(tryInit, 80)
    },

    async generatePoster() {
      if (!this.ctx || !this.canvas) return
      if (this.data.isGenerating) return

      this.setData({ isGenerating: true })

      try {
        const ctx = this.ctx
        const theme = this.getTheme()
        const template = this.normalizeTemplate(this.data.template)

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        this.drawBackground(ctx, theme, template)

        if (template === 'editorial') {
          this.drawEditorialFrame(ctx, theme)
          this.drawEditorialHeader(ctx, theme)
          this.drawEditorialContent(ctx, theme)
          await this.drawEditorialFooter(ctx, theme)
        } else {
          this.drawMinimalFrame(ctx, theme)
          this.drawMinimalHeader(ctx, theme)
          this.drawMinimalContent(ctx, theme)
          await this.drawMinimalFooter(ctx, theme)
        }

        await this.exportPoster()
      } catch (error) {
        // 安全地处理错误对象
        let errorMessage = '海报生成失败'
        if (error != null) {
          if (typeof error === 'string') {
            errorMessage = error
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.errMsg) {
            errorMessage = error.errMsg
          } else {
            try {
              errorMessage = JSON.stringify(error)
            } catch (e) {
              errorMessage = String(error)
            }
          }
        }
        console.error('【posterCanvas】海报生成失败：', errorMessage)
        this.triggerEvent('error', { error: errorMessage })
      } finally {
        if (!this._destroyed) {
          this.setData({ isGenerating: false })
        }
      }
    },

    normalizeTemplate(template) {
      return template === 'editorial' ? 'editorial' : 'minimal'
    },

    getPresetThemeMap() {
      return {
        sand: {
          background: '#F6F2EA',
          text: '#2B2B2B',
          accent: '#B79C61'
        },
        ink: {
          background: '#F5F5F3',
          text: '#202020',
          accent: '#7D7A73'
        },
        forest: {
          background: '#EEF3EC',
          text: '#243127',
          accent: '#6E8B6B'
        },
        night: {
          background: '#1E2228',
          text: '#F3F0EA',
          accent: '#C2A46E'
        }
      }
    },

    getTheme() {
      const presetMap = this.getPresetThemeMap()
      const presetKey = presetMap[this.data.themePreset] ? this.data.themePreset : 'sand'
      const preset = presetMap[presetKey]

      const background = this.data.backgroundColor || preset.background
      const text = this.data.titleColor || preset.text
      const accent = this.data.accentColor || preset.accent

      const isDark = this.isDarkColor(background)

      return {
        background,
        text,
        accent,
        textSoft: this.toRgba(text, isDark ? 0.82 : 0.72),
        textLight: this.toRgba(text, isDark ? 0.68 : 0.54),
        accentSoft: this.toRgba(accent, isDark ? 0.30 : 0.22),
        accentLine: this.toRgba(accent, isDark ? 0.62 : 0.48),
        accentStrong: this.toRgba(accent, isDark ? 0.92 : 0.82),
        cardFill: isDark ? this.toRgba('#FFFFFF', 0.06) : this.toRgba('#FFFFFF', 0.86),
        qrBg: '#FFFFFF',
        isDark
      }
    },

    drawBackground(ctx, theme, template) {
      ctx.save()
      ctx.fillStyle = theme.background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (template === 'editorial') {
        ctx.fillStyle = theme.accent
        ctx.fillRect(40, 0, 8, CANVAS_HEIGHT)
      } else {
        ctx.fillStyle = theme.accent
        ctx.fillRect(0, 0, CANVAS_WIDTH, 6)
      }

      ctx.restore()
    },

    // =========================
    // minimal 模板
    // =========================
    drawMinimalFrame(ctx, theme) {
      const { radius } = this.data

      ctx.save()

      this.roundRectPath(ctx, 24, 24, CANVAS_WIDTH - 48, CANVAS_HEIGHT - 48, radius)
      ctx.strokeStyle = theme.accentLine
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2 - 42, 58)
      ctx.lineTo(CANVAS_WIDTH / 2 + 42, 58)
      ctx.strokeStyle = theme.accentStrong
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.restore()
    },

    drawMinimalHeader(ctx, theme) {
      const title = this.data.title || '每日分享'
      const { subtitle, author, icon } = this.data
      let y = 98

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.accent
      ctx.font = '500 20px sans-serif'
      ctx.fillText('DAILY SHARE', CANVAS_WIDTH / 2, y)
      ctx.restore()

      y += 42

      if (icon) {
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.font = '44px sans-serif'
        ctx.fillText(icon, CANVAS_WIDTH / 2, y)
        ctx.restore()
        y += 60
      }

      const titleMaxWidth = CANVAS_WIDTH - PADDING * 2 - 40
      const titleFontSize = this.fitTitleFontSize(ctx, title, titleMaxWidth, 30, 46)
      const titleFont = `bold ${titleFontSize}px serif`
      const titleLineHeight = Math.round(titleFontSize * 1.4)
      const titleLines = this.wrapText(ctx, title, titleMaxWidth, titleFont).slice(0, 2)

      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.text
      ctx.font = titleFont

      titleLines.forEach(line => {
        ctx.fillText(line, CANVAS_WIDTH / 2, y)
        y += titleLineHeight
      })
      ctx.restore()

      y += 8
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2 - 90, y)
      ctx.lineTo(CANVAS_WIDTH / 2 + 90, y)
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      if (subtitle) {
        y += 24
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = theme.textSoft
        ctx.font = '22px sans-serif'
        ctx.fillText(subtitle, CANVAS_WIDTH / 2, y)
        ctx.restore()
        y += 34
      }

      if (author) {
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = theme.textLight
        ctx.font = '20px sans-serif'
        ctx.fillText(`— ${author} —`, CANVAS_WIDTH / 2, y)
        ctx.restore()
      }
    },

    drawMinimalContent(ctx, theme) {
      const content = this.data.content || '长按扫码查看精彩内容'
      const {
        radius,
        enableShadow,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        contentFontSize,
        contentMaxLines
      } = this.data

      const cardX = 60
      const cardY = 310
      const cardW = CANVAS_WIDTH - 120
      const cardH = 500

      ctx.save()
      if (enableShadow) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
        ctx.shadowOffsetX = shadowOffsetX
        ctx.shadowOffsetY = shadowOffsetY
      }
      this.roundRectPath(ctx, cardX, cardY, cardW, cardH, radius)
      ctx.fillStyle = theme.cardFill
      ctx.fill()
      ctx.restore()

      ctx.save()
      this.roundRectPath(ctx, cardX, cardY, cardW, cardH, radius)
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.fillStyle = theme.accent
      this.roundRectPath(ctx, cardX + 28, cardY + 28, 6, 44, 3)
      ctx.fill()
      ctx.restore()

      const textX = cardX + 40
      const textY = cardY + 44
      const textMaxWidth = cardW - 80
      const textMaxHeight = cardH - 88

      const layout = this.resolveBodyTextLayout(ctx, content, {
        maxWidth: textMaxWidth,
        maxHeight: textMaxHeight,
        preferredFontSize: contentFontSize,
        maxLines: contentMaxLines,
        lineHeightRatio: 1.8,
        minFontSize: 20
      })

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.text
      ctx.font = `${layout.fontSize}px serif`

      let currentY = textY
      layout.lines.forEach(line => {
        ctx.fillText(line, textX, currentY)
        currentY += layout.lineHeight
      })
      ctx.restore()
    },

    async drawMinimalFooter(ctx, theme) {
      const {
        qrCodeUrl,
        footerText,
        subFooterText,
        moduleName,
        userName,
        timestamp,
        qrCodeSize,
        radius,
        enableShadow,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY
      } = this.data

      const footerTop = 860
      const qrSize = Math.max(100, qrCodeSize)
      const qrPlateSize = qrSize + 20
      const qrX = CANVAS_WIDTH - PADDING - qrSize
      const qrY = footerTop + 34

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(PADDING, footerTop)
      ctx.lineTo(CANVAS_WIDTH - PADDING, footerTop)
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      ctx.fillStyle = theme.text
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(footerText || '长按识别二维码', 68, footerTop + 48)

      let textY = footerTop + 84

      if (moduleName) {
        ctx.fillStyle = theme.accent
        ctx.font = '20px sans-serif'
        ctx.fillText(moduleName, 68, textY)
        textY += 32
      }

      if (subFooterText) {
        ctx.fillStyle = theme.textSoft
        ctx.font = '20px sans-serif'
        ctx.fillText(subFooterText, 68, textY)
        textY += 32
      }

      // 绘制用户名字和时间戳
      if (userName || timestamp) {
        ctx.fillStyle = theme.textLight
        ctx.font = '18px sans-serif'
        if (userName) {
          ctx.fillText(userName, 68, textY)
        }
        if (timestamp) {
          const timeText = userName ? ` · ${timestamp}` : timestamp
          ctx.fillText(timeText, userName ? 68 + ctx.measureText(userName).width + 8 : 68, textY)
        }
      }

      ctx.restore()

      ctx.save()
      if (enableShadow) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
        ctx.shadowOffsetX = shadowOffsetX
        ctx.shadowOffsetY = shadowOffsetY
      }
      this.roundRectPath(ctx, qrX - 10, qrY - 10, qrPlateSize, qrPlateSize, Math.max(radius - 4, 10))
      ctx.fillStyle = theme.cardFill
      ctx.fill()
      ctx.restore()

      ctx.save()
      this.roundRectPath(ctx, qrX - 10, qrY - 10, qrPlateSize, qrPlateSize, Math.max(radius - 4, 10))
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      // const img = await loadImage(canvas, "/images/qrcode.jpg");
      // ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      await this.drawQrImage(ctx, qrCodeUrl, qrX, qrY, qrSize, theme)
    },

    // =========================
    // editorial 模板
    // =========================
    drawEditorialFrame(ctx, theme) {
      ctx.save()

      ctx.strokeStyle = theme.textLight
      ctx.lineWidth = 1
      ctx.strokeRect(68, 54, CANVAS_WIDTH - 120, CANVAS_HEIGHT - 108)

      ctx.beginPath()
      ctx.moveTo(68, 138)
      ctx.lineTo(CANVAS_WIDTH - 52, 138)
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(68, 920)
      ctx.lineTo(CANVAS_WIDTH - 52, 920)
      ctx.strokeStyle = theme.accentSoft
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.restore()
    },

    drawEditorialHeader(ctx, theme) {
      const title = this.data.title || '专题内容'
      const { subtitle, author, icon, moduleName } = this.data

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.accent
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(moduleName || 'EDITORIAL', 82, 82)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.textLight
      ctx.font = '18px sans-serif'
      ctx.fillText('FEATURE', CANVAS_WIDTH - 66, 84)
      ctx.restore()

      let y = 176

      if (icon) {
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.font = '40px sans-serif'
        ctx.fillText(icon, 84, y)
        ctx.restore()
        y += 56
      }

      const titleMaxWidth = CANVAS_WIDTH - 168
      const titleFontSize = this.fitTitleFontSize(ctx, title, titleMaxWidth, 34, 50)
      const titleFont = `bold ${titleFontSize}px serif`
      const titleLineHeight = Math.round(titleFontSize * 1.32)
      const titleLines = this.wrapText(ctx, title, titleMaxWidth, titleFont).slice(0, 3)

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.text
      ctx.font = titleFont

      titleLines.forEach(line => {
        ctx.fillText(line, 84, y)
        y += titleLineHeight
      })
      ctx.restore()

      if (subtitle) {
        y += 10
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = theme.textSoft
        ctx.font = '22px sans-serif'
        ctx.fillText(subtitle, 84, y)
        ctx.restore()
        y += 36
      }

      if (author) {
        ctx.save()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = theme.accent
        ctx.font = '20px sans-serif'
        ctx.fillText(author, 84, y)
        ctx.restore()
      }
    },

    drawEditorialContent(ctx, theme) {
      const content = this.data.content || '请输入正文内容'
      const {
        contentFontSize,
        contentMaxLines
      } = this.data

      const textBlockX = 84
      const textBlockY = 420
      const textBlockW = CANVAS_WIDTH - 168
      const textBlockH = 430

      ctx.save()
      ctx.fillStyle = theme.accent
      ctx.fillRect(textBlockX, textBlockY, 5, 72)
      ctx.restore()

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.textLight
      ctx.font = '18px sans-serif'
      ctx.fillText('CONTENT', textBlockX + 20, textBlockY)
      ctx.restore()

      const bodyY = textBlockY + 48
      const bodyX = textBlockX + 20
      const bodyW = textBlockW - 20
      const bodyH = textBlockH - 48

      const layout = this.resolveBodyTextLayout(ctx, content, {
        maxWidth: bodyW,
        maxHeight: bodyH,
        preferredFontSize: contentFontSize,
        maxLines: contentMaxLines,
        lineHeightRatio: 1.86,
        minFontSize: 20
      })

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = theme.text
      ctx.font = `${layout.fontSize}px serif`

      let currentY = bodyY
      layout.lines.forEach(line => {
        ctx.fillText(line, bodyX, currentY)
        currentY += layout.lineHeight
      })
      ctx.restore()
    },

    async drawEditorialFooter(ctx, theme) {
      const {
        qrCodeUrl,
        footerText,
        subFooterText,
        userName,
        timestamp,
        qrCodeSize,
        radius,
        enableShadow,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY
      } = this.data

      const baseY = 950
      const qrSize = Math.max(110, qrCodeSize)
      const qrX = CANVAS_WIDTH - 84 - qrSize
      const qrY = 966

      ctx.save()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      ctx.fillStyle = theme.text
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(footerText || '长按识别二维码', 84, baseY)

      ctx.fillStyle = theme.textSoft
      ctx.font = '20px sans-serif'
      ctx.fillText(subFooterText || '#智伴口袋', 84, baseY + 36)

      // ctx.fillStyle = theme.accent
      // ctx.font = '18px sans-serif'
      // ctx.fillText('SCAN TO READ', 84, baseY + 74)

      // 绘制用户名字和时间戳
      if (userName || timestamp) {
        ctx.fillStyle = theme.textLight
        ctx.font = '16px sans-serif'
        const userInfoY = baseY + 100
        if (userName) {
          ctx.fillText(userName, 84, userInfoY)
        }
        if (timestamp) {
          const startX = userName ? 84 + ctx.measureText(userName).width + 10 : 84
          ctx.fillText(timestamp, startX, userInfoY)
        }
      }

      ctx.restore()

      ctx.save()
      if (enableShadow) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
        ctx.shadowOffsetX = shadowOffsetX
        ctx.shadowOffsetY = shadowOffsetY
      }
      this.roundRectPath(ctx, qrX + 4, qrY - 18, qrSize + 16, qrSize + 16, Math.max(radius - 6, 8))
      ctx.fillStyle = theme.qrBg || '#FFFFFF'
      ctx.fill()
      ctx.restore()

      ctx.save()
      this.roundRectPath(ctx, qrX + 4, qrY - 18, qrSize + 16, qrSize + 16, Math.max(radius - 6, 8))
      ctx.strokeStyle = theme.textLight || theme.subtitleColor || '#D4CFC5'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      // const img = await loadImage(this.canvas, "/images/qrcode.jpg");
      // ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      
      await this.drawQrImage(ctx, qrCodeUrl, qrX + 14, qrY-10, qrSize, theme)
    },

    // =========================
    // 二维码
    // =========================
  

    async drawQrImage(ctx, qrCodeUrl, x, y, size, theme) {
      
      // const img = await this.loadImage(this.canvas, qrCodeUrl);
      // ctx.drawImage(img, x, y, size, size);

      await drawImage(this.canvas,ctx,qrCodeUrl,x,y,size,size)

    },

    drawQrPlaceholder(ctx, x, y, size, theme) {
      ctx.save()
      // 使用现有属性或默认值
      ctx.fillStyle = theme.accent || '#F5F0E8'
      ctx.fillRect(x, y, size, size)

      ctx.strokeStyle = theme.textLight || theme.subtitleColor || '#D4CFC5'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, size, size)

      const box = Math.round(size * 0.2)
      const gap = Math.round(size * 0.08)

      this.drawFinderBox(ctx, x + gap, y + gap, box, theme)
      this.drawFinderBox(ctx, x + size - gap - box, y + gap, box, theme)
      this.drawFinderBox(ctx, x + gap, y + size - gap - box, box, theme)

      ctx.fillStyle = theme.textLight
      ctx.font = '18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('二维码', x + size / 2, y + size / 2 + 10)

      ctx.restore()
    },

    drawFinderBox(ctx, x, y, size, theme) {
      ctx.save()
      ctx.strokeStyle = theme.text
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, size, size)

      ctx.fillStyle = theme.accent
      ctx.fillRect(x + size * 0.28, y + size * 0.28, size * 0.44, size * 0.44)
      ctx.restore()
    },

    // =========================
    // 文本排版
    // =========================
    fitTitleFontSize(ctx, text, maxWidth, minSize, maxSize) {
      let best = minSize
      let low = minSize
      let high = maxSize

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        const font = `bold ${mid}px serif`
        const lines = this.wrapText(ctx, text, maxWidth, font)
        if (lines.length <= 3) {
          best = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
      return best
    },

    resolveBodyTextLayout(ctx, text, options) {
      const {
        maxWidth,
        maxHeight,
        preferredFontSize,
        maxLines,
        lineHeightRatio,
        minFontSize
      } = options

      let fontSize = preferredFontSize > 0 ? preferredFontSize : 26

      while (fontSize >= minFontSize) {
        const font = `${fontSize}px serif`
        let lines = this.wrapText(ctx, text, maxWidth, font)

        if (lines.length > maxLines) {
          lines = this.limitLines(ctx, lines, maxLines, maxWidth, font)
        }

        const lineHeight = Math.round(fontSize * lineHeightRatio)
        const totalHeight = lines.length * lineHeight

        if (totalHeight <= maxHeight) {
          return { fontSize, lineHeight, lines }
        }

        fontSize -= 1
      }

      const finalFont = `${minFontSize}px serif`
      let finalLines = this.wrapText(ctx, text, maxWidth, finalFont)
      finalLines = this.limitLines(ctx, finalLines, maxLines, maxWidth, finalFont)

      return {
        fontSize: minFontSize,
        lineHeight: Math.round(minFontSize * lineHeightRatio),
        lines: finalLines
      }
    },

    wrapText(ctx, text, maxWidth, font) {
      if (!text) return ['']

      ctx.save()
      ctx.font = font

      const lines = []
      let currentLine = ''

      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const testLine = currentLine + char
        const width = ctx.measureText(testLine).width

        if (width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = char
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        lines.push(currentLine)
      }

      ctx.restore()
      return lines
    },

    limitLines(ctx, lines, maxLines, maxWidth, font) {
      if (lines.length <= maxLines) return lines

      ctx.save()
      ctx.font = font

      const result = lines.slice(0, maxLines)
      let lastLine = result[maxLines - 1]

      while (lastLine.length > 0) {
        const testLine = lastLine + '...'
        if (ctx.measureText(testLine).width <= maxWidth) {
          result[maxLines - 1] = testLine
          break
        }
        lastLine = lastLine.slice(0, -1)
      }

      if (!lastLine) {
        result[maxLines - 1] = '...'
      }

      ctx.restore()
      return result
    },

    // =========================
    // 颜色工具
    // =========================
    isDarkColor(color) {
      // 安全检查：确保 color 是有效字符串
      if (!color || typeof color !== 'string' || !color.startsWith('#')) {
        return false
      }
      const hex = color.replace('#', '')
      const fullHex = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex

      if (fullHex.length !== 6) return false

      const r = parseInt(fullHex.slice(0, 2), 16)
      const g = parseInt(fullHex.slice(2, 4), 16)
      const b = parseInt(fullHex.slice(4, 6), 16)
      
      // 检查 parseInt 结果是否有效
      if (isNaN(r) || isNaN(g) || isNaN(b)) return false
      
      const brightness = (r * 299 + g * 587 + b * 114) / 1000

      return brightness < 145
    },

    toRgba(color, alpha) {
      // 安全检查：确保 color 是有效字符串
      if (!color || typeof color !== 'string') {
        return `rgba(128,128,128,${alpha})` // 返回灰色作为默认值
      }

      if (color.startsWith('rgba(')) return color
      if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
      }

      const hex = color.replace('#', '')
      if (hex.length !== 3 && hex.length !== 6) {
        // 返回默认值而不是无效值
        return `rgba(128,128,128,${alpha})`
      }

      const fullHex = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex

      const r = parseInt(fullHex.slice(0, 2), 16)
      const g = parseInt(fullHex.slice(2, 4), 16)
      const b = parseInt(fullHex.slice(4, 6), 16)

      // 检查 parseInt 结果是否有效
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return `rgba(128,128,128,${alpha})`
      }

      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    // =========================
    // 工具方法
    // =========================
    roundRectPath(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + w, y, x + w, y + h, radius)
      ctx.arcTo(x + w, y + h, x, y + h, radius)
      ctx.arcTo(x, y + h, x, y, radius)
      ctx.arcTo(x, y, x + w, y, radius)
      ctx.closePath()
    },

    getLocalImage(url) {
      return new Promise((resolve, reject) => {
        if (!url) {
          reject(new Error('empty image url'))
          return
        }

        if (url.startsWith('/') || url.startsWith('wxfile://')) {
          resolve(url)
          return
        }

        wx.getImageInfo({
          src: url,
          success: (res) => resolve(res.path),
          fail: reject
        })
      })
    },

    // =========================
    // 导出 / 预览 / 保存
    // =========================
    exportPoster() {
      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: this.canvas,
          x: 0,
          y: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          destWidth: CANVAS_WIDTH * 2,
          destHeight: CANVAS_HEIGHT * 2,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            if (!this._destroyed) {
              this.setData({
                posterTempFilePath: res.tempFilePath
              })
            }
            this.triggerEvent('ready', {
              tempFilePath: res.tempFilePath
            })
            resolve(res.tempFilePath)
          },
          fail: reject
        }, this)
      })
    },

    previewPoster() {
      const filePath = this.data.posterTempFilePath
      if (!filePath) {
        wx.showToast({
          title: '请先生成海报',
          icon: 'none'
        })
        return
      }

      wx.previewImage({
        urls: [filePath],
        current: filePath
      })
    },

    savePoster() {
      const filePath = this.data.posterTempFilePath
      if (!filePath) {
        wx.showToast({
          title: '请先生成海报',
          icon: 'none'
        })
        return
      }

      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          wx.showToast({
            title: '已保存到相册',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('保存失败：', err)
          wx.showToast({
            title: '保存失败，请检查权限',
            icon: 'none'
          })
        }
      })
    },

    getThemePresetByType(type) {
      const map = {
        quote: 'sand',
        joke: 'sand',
        psychology: 'ink',
        finance: 'ink',
        love: 'sand',
        movie: 'night',
        music: 'night',
        tech: 'night',
        tcm: 'forest',
        travel: 'forest',
        literature: 'sand',
        programming: 'night',
        photography: 'ink',
        fitness: 'night',
        pet: 'sand',
        fashion: 'ink'
      }
      return map[type] || 'sand'
    },
    getThemeScheme(mode = 'light', preset = 'paper') {
      const schemes = {
        // =========================
        // 浅色模式
        // =========================
        light: {
          // 1. 纸张米白：最通用
          paper: {
            backgroundColor: '#F6F2EA',
            titleColor: '#2B2B2B',
            contentColor: '#5C5245',
            subtitleColor: '#8E7C67',
            accentColor: '#B79C61',
          },
    
          // 2. 鼠尾草绿：疗愈、自然、松弛
          sage: {
            backgroundColor: '#EEF3EC',
            titleColor: '#243127',
            contentColor: '#4B5D4D',
            subtitleColor: '#7E9180',
            accentColor: '#6E8B6B',
          },
    
          // 3. 雾蓝灰：理性、专业、知识感
          sky: {
            backgroundColor: '#EEF4F7',
            titleColor: '#2F4352',
            contentColor: '#556B79',
            subtitleColor: '#8A9AA5',
            accentColor: '#6D8FA5',
          },
    
          // 4. 柔粉杏：温柔、情感、女性向
          rose: {
            backgroundColor: '#FDF1F3',
            titleColor: '#8C455D',
            contentColor: '#A76679',
            subtitleColor: '#C39BA7',
            accentColor: '#D48A9B',
          },
    
          // 5. 商务浅灰：现代、克制、职场
          business: {
            backgroundColor: '#F5F5F3',
            titleColor: '#202020',
            contentColor: '#4E4A43',
            subtitleColor: '#8F7E62',
            accentColor: '#8F7E62',
          },
    
          // 6. 书卷暖黄：文学、历史、传统内容
          classic: {
            backgroundColor: '#FBF5E8',
            titleColor: '#5A4336',
            contentColor: '#755C4C',
            subtitleColor: '#A18775',
            accentColor: '#B89A6A',
          }
        },
    
        // =========================
        // 深色模式
        // =========================
        dark: {
          // 1. 石墨黑：最通用的深色
          graphite: {
            backgroundColor: '#232427',
            titleColor: '#F2EEE8',
            contentColor: '#D2CAC0',
            subtitleColor: '#9A9288',
            accentColor: '#B79C61',
          },
    
          // 2. 森林夜：疗愈、自然、哲思
          forestNight: {
            backgroundColor: '#1E2822',
            titleColor: '#E9F0E7',
            contentColor: '#C4D0C2',
            subtitleColor: '#89988A',
            accentColor: '#7C9B76',
          },
    
          // 3. 深海蓝：科技、金融、专业
          oceanNight: {
            backgroundColor: '#17212B',
            titleColor: '#ECF3F9',
            contentColor: '#C7D8E5',
            subtitleColor: '#879CAD',
            accentColor: '#6C98B8',
          },
    
          // 4. 暗紫夜：音乐、情绪、电影感
          plumNight: {
            backgroundColor: '#241F2A',
            titleColor: '#F3EDF7',
            contentColor: '#D8CEE2',
            subtitleColor: '#9A8EA8',
            accentColor: '#9C7FB0',
          },
    
          // 5. 赛博深色：科技、编程、未来感
          cyberDark: {
            backgroundColor: '#0F1A22',
            titleColor: '#B8F3FF',
            contentColor: '#D8FBFF',
            subtitleColor: '#68B9C8',
            accentColor: '#35C7E8',
          },
    
          // 6. 金曜黑：金融、权威、神秘、品牌感
          obsidian: {
            backgroundColor: '#1F1F21',
            titleColor: '#F3E8CC',
            contentColor: '#DDCBA1',
            subtitleColor: '#A8956E',
            accentColor: '#D4B16A',
          }
        }
      }
    
      return schemes[mode]?.[preset] || schemes.light.paper
    },

    getThemePresetByType(type) {
      const typeMap = {
        quote: { mode: 'light', preset: 'paper' },
        joke: { mode: 'light', preset: 'paper' },
        psychology: { mode: 'light', preset: 'sky' },
        finance: { mode: 'light', preset: 'sky' },
        love: { mode: 'light', preset: 'rose' },
        movie: { mode: 'light', preset: 'paper' },
        music: { mode: 'light', preset: 'rose' },
        tech: { mode: 'light', preset: 'sky' },
        tcm: { mode: 'light', preset: 'sage' },
        travel: { mode: 'light', preset: 'sage' },
        fortune: { mode: 'light', preset: 'classic' },
        literature: { mode: 'light', preset: 'classic' },
        foreignTrade: { mode: 'light', preset: 'business' },
        ecommerce: { mode: 'light', preset: 'rose' },
        math: { mode: 'light', preset: 'sky' },
        english: { mode: 'light', preset: 'sky' },
        programming: { mode: 'light', preset: 'sky' },
        photography: { mode: 'light', preset: 'paper' },
        beauty: { mode: 'light', preset: 'rose' },
        investment: { mode: 'light', preset: 'sage' },
        fitness: { mode: 'light', preset: 'rose' },
        pet: { mode: 'light', preset: 'paper' },
        fashion: { mode: 'light', preset: 'business' },
        outfit: { mode: 'light', preset: 'business' },
        decoration: { mode: 'light', preset: 'classic' },
        glassFiber: { mode: 'light', preset: 'business' },
        resin: { mode: 'light', preset: 'rose' },
        tax: { mode: 'light', preset: 'sky' },
        law: { mode: 'light', preset: 'sky' },
        official: { mode: 'light', preset: 'business' },
        handling: { mode: 'light', preset: 'sky' },
        floral: { mode: 'light', preset: 'rose' },
        history: { mode: 'light', preset: 'classic' },
        military: { mode: 'light', preset: 'sky' },
        home: { mode: 'light', preset: 'paper' },
        business: { mode: 'light', preset: 'business' },
        bussiness: { mode: 'light', preset: 'business' }
      }
    
      return typeMap[type] || { mode: 'light', preset: 'paper' }
    }
    
    
  }
})
