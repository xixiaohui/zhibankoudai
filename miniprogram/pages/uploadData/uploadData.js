// miniprogram/pages/uploadData/uploadData.js

// 需要上传的文件列表
const FILES_TO_UPLOAD = [
  // 配置
  { local: 'cloudData/config/appConfig.json', cloud: 'cloudData/config/appConfig.json' },
  { local: 'cloudData/config/homeModules.json', cloud: 'cloudData/config/homeModules.json' },
  
  // 索引
  { local: 'cloudData/modules/index.json', cloud: 'cloudData/modules/index.json' },
  
  // AI提示词
  { local: 'cloudData/prompts/aiPrompts.json', cloud: 'cloudData/prompts/aiPrompts.json' },
  
  // 模块数据
  { local: 'cloudData/modules/quote.json', cloud: 'cloudData/modules/quote.json' },
  { local: 'cloudData/modules/joke.json', cloud: 'cloudData/modules/joke.json' },
  { local: 'cloudData/modules/psychology.json', cloud: 'cloudData/modules/psychology.json' },
  { local: 'cloudData/modules/finance.json', cloud: 'cloudData/modules/finance.json' },
  { local: 'cloudData/modules/love.json', cloud: 'cloudData/modules/love.json' },
  { local: 'cloudData/modules/movie.json', cloud: 'cloudData/modules/movie.json' },
  { local: 'cloudData/modules/music.json', cloud: 'cloudData/modules/music.json' },
  { local: 'cloudData/modules/tech.json', cloud: 'cloudData/modules/tech.json' },
  { local: 'cloudData/modules/tcm.json', cloud: 'cloudData/modules/tcm.json' },
  { local: 'cloudData/modules/travel.json', cloud: 'cloudData/modules/travel.json' },
  { local: 'cloudData/modules/fortune.json', cloud: 'cloudData/modules/fortune.json' },
  { local: 'cloudData/modules/literature.json', cloud: 'cloudData/modules/literature.json' },
  { local: 'cloudData/modules/foreignTrade.json', cloud: 'cloudData/modules/foreignTrade.json' },
  { local: 'cloudData/modules/ecommerce.json', cloud: 'cloudData/modules/ecommerce.json' },
  { local: 'cloudData/modules/math.json', cloud: 'cloudData/modules/math.json' },
  { local: 'cloudData/modules/english.json', cloud: 'cloudData/modules/english.json' },
  { local: 'cloudData/modules/programming.json', cloud: 'cloudData/modules/programming.json' },
  { local: 'cloudData/modules/photography.json', cloud: 'cloudData/modules/photography.json' },
  { local: 'cloudData/modules/beauty.json', cloud: 'cloudData/modules/beauty.json' },
  { local: 'cloudData/modules/investment.json', cloud: 'cloudData/modules/investment.json' },
  { local: 'cloudData/modules/fishing.json', cloud: 'cloudData/modules/fishing.json' },
  { local: 'cloudData/modules/fitness.json', cloud: 'cloudData/modules/fitness.json' },
  { local: 'cloudData/modules/pet.json', cloud: 'cloudData/modules/pet.json' },
  { local: 'cloudData/modules/fashion.json', cloud: 'cloudData/modules/fashion.json' },
  { local: 'cloudData/modules/outfit.json', cloud: 'cloudData/modules/outfit.json' },
  { local: 'cloudData/modules/decoration.json', cloud: 'cloudData/modules/decoration.json' },
  { local: 'cloudData/modules/glassFiber.json', cloud: 'cloudData/modules/glassFiber.json' },
  { local: 'cloudData/modules/resin.json', cloud: 'cloudData/modules/resin.json' },
  { local: 'cloudData/modules/tax.json', cloud: 'cloudData/modules/tax.json' },
  { local: 'cloudData/modules/law.json', cloud: 'cloudData/modules/law.json' },
  { local: 'cloudData/modules/official.json', cloud: 'cloudData/modules/official.json' },
  { local: 'cloudData/modules/handling.json', cloud: 'cloudData/modules/handling.json' },
  { local: 'cloudData/modules/floral.json', cloud: 'cloudData/modules/floral.json' },
  { local: 'cloudData/modules/history.json', cloud: 'cloudData/modules/history.json' },
  { local: 'cloudData/modules/military.json', cloud: 'cloudData/modules/military.json' },
  { local: 'cloudData/modules/stock.json', cloud: 'cloudData/modules/stock.json' },
  { local: 'cloudData/modules/economics.json', cloud: 'cloudData/modules/economics.json' },
  { local: 'cloudData/modules/business.json', cloud: 'cloudData/modules/business.json' },
  { local: 'cloudData/modules/news.json', cloud: 'cloudData/modules/news.json' },
]

Page({
  data: {
    uploading: false,
    progress: '0 / ' + FILES_TO_UPLOAD.length,
    logs: []
  },

  onLoad() {
    this.addLog('info', '准备上传 ' + FILES_TO_UPLOAD.length + ' 个文件')
  },

  addLog(type, msg) {
    const logs = this.data.logs
    logs.push({ type, msg })
    // 只保留最近100条
    if (logs.length > 100) logs.shift()
    this.setData({ logs })
  },

  async startUpload() {
    if (this.data.uploading) return

    this.setData({ uploading: true, logs: [] })
    this.addLog('info', '开始上传...')

    let success = 0
    let fail = 0

    for (let i = 0; i < FILES_TO_UPLOAD.length; i++) {
      const file = FILES_TO_UPLOAD[i]
      this.setData({ progress: (i + 1) + ' / ' + FILES_TO_UPLOAD.length })

      try {
        // 读取本地文件
        const fileContent = wx.getFileSystemManager().readFileSync(file.local)
        
        // 上传到云存储
        const res = await wx.cloud.uploadFile({
          cloudPath: file.cloud,
          fileContent: fileContent
        })

        success++
        this.addLog('success', '✅ ' + file.cloud)
      } catch (e) {
        fail++
        this.addLog('error', '❌ ' + file.cloud + ': ' + (e.message || e.errMsg || '未知错误'))
      }
    }

    this.setData({ uploading: false })
    this.addLog('info', '-----------------------------------')
    this.addLog(success === FILES_TO_UPLOAD.length ? 'success' : 'warn', 
      `完成！成功: ${success}, 失败: ${fail}`)
    
    if (success === FILES_TO_UPLOAD.length) {
      wx.showToast({ title: '全部上传成功！', icon: 'success' })
    } else {
      wx.showToast({ title: '部分文件上传失败', icon: 'none' })
    }
  }
})
