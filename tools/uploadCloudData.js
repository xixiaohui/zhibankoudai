/**
 * tools/uploadCloudData.js
 * 上传 cloudData 到云存储
 * 
 * 使用方式：node tools/uploadCloudData.js
 */

const fs = require('fs')
const path = require('path')

// 云环境ID
const CLOUD_ENV = 'zhiban-4g34epre1ce6ce1c'

// 需要上传的文件映射：本地路径 -> 云端路径
const FILES_TO_UPLOAD = [
  // 模块索引
  ['cloudData/modules/index.json', 'cloudData/modules/index.json'],
  
  // 首页配置
  ['cloudData/config/homeModules.json', 'cloudData/config/homeModules.json'],
  ['cloudData/config/appConfig.json', 'cloudData/config/appConfig.json'],
  
  // AI提示词
  ['cloudData/prompts/aiPrompts.json', 'cloudData/prompts/aiPrompts.json'],
  
  // 各模块数据
  ['cloudData/modules/quote.json', 'cloudData/modules/quote.json'],
  ['cloudData/modules/joke.json', 'cloudData/modules/joke.json'],
  ['cloudData/modules/psychology.json', 'cloudData/modules/psychology.json'],
  ['cloudData/modules/finance.json', 'cloudData/modules/finance.json'],
  ['cloudData/modules/love.json', 'cloudData/modules/love.json'],
  ['cloudData/modules/movie.json', 'cloudData/modules/movie.json'],
  ['cloudData/modules/music.json', 'cloudData/modules/music.json'],
  ['cloudData/modules/tech.json', 'cloudData/modules/tech.json'],
  ['cloudData/modules/tcm.json', 'cloudData/modules/tcm.json'],
  ['cloudData/modules/travel.json', 'cloudData/modules/travel.json'],
  ['cloudData/modules/fortune.json', 'cloudData/modules/fortune.json'],
  ['cloudData/modules/literature.json', 'cloudData/modules/literature.json'],
  ['cloudData/modules/foreignTrade.json', 'cloudData/modules/foreignTrade.json'],
  ['cloudData/modules/ecommerce.json', 'cloudData/modules/ecommerce.json'],
  ['cloudData/modules/math.json', 'cloudData/modules/math.json'],
  ['cloudData/modules/english.json', 'cloudData/modules/english.json'],
  ['cloudData/modules/programming.json', 'cloudData/modules/programming.json'],
  ['cloudData/modules/photography.json', 'cloudData/modules/photography.json'],
  ['cloudData/modules/beauty.json', 'cloudData/modules/beauty.json'],
  ['cloudData/modules/investment.json', 'cloudData/modules/investment.json'],
  ['cloudData/modules/fishing.json', 'cloudData/modules/fishing.json'],
  ['cloudData/modules/fitness.json', 'cloudData/modules/fitness.json'],
  ['cloudData/modules/pet.json', 'cloudData/modules/pet.json'],
  ['cloudData/modules/fashion.json', 'cloudData/modules/fashion.json'],
  ['cloudData/modules/outfit.json', 'cloudData/modules/outfit.json'],
  ['cloudData/modules/decoration.json', 'cloudData/modules/decoration.json'],
  ['cloudData/modules/glassFiber.json', 'cloudData/modules/glassFiber.json'],
  ['cloudData/modules/resin.json', 'cloudData/modules/resin.json'],
  ['cloudData/modules/tax.json', 'cloudData/modules/tax.json'],
  ['cloudData/modules/law.json', 'cloudData/modules/law.json'],
  ['cloudData/modules/official.json', 'cloudData/modules/official.json'],
  ['cloudData/modules/handling.json', 'cloudData/modules/handling.json'],
  ['cloudData/modules/floral.json', 'cloudData/modules/floral.json'],
  ['cloudData/modules/history.json', 'cloudData/modules/history.json'],
  ['cloudData/modules/military.json', 'cloudData/modules/military.json'],
  ['cloudData/modules/stock.json', 'cloudData/modules/stock.json'],
  ['cloudData/modules/economics.json', 'cloudData/modules/economics.json'],
  ['cloudData/modules/business.json', 'cloudData/modules/business.json'],
  ['cloudData/modules/news.json', 'cloudData/modules/news.json'],
]

async function uploadFile(localPath, cloudPath) {
  return new Promise((resolve, reject) => {
    // 检查本地文件是否存在
    if (!fs.existsSync(localPath)) {
      console.log(`❌ 本地文件不存在: ${localPath}`)
      resolve({ success: false, error: 'file not found' })
      return
    }
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: localPath,
      config: {
        env: CLOUD_ENV
      },
      success: res => {
        console.log(`✅ 上传成功: ${cloudPath}`)
        resolve({ success: true, fileID: res.fileID })
      },
      fail: err => {
        console.log(`❌ 上传失败: ${cloudPath}`, err)
        resolve({ success: false, error: err })
      }
    })
  })
}

async function main() {
  console.log('🚀 开始上传 cloudData 到云存储...')
  console.log(`📦 共 ${FILES_TO_UPLOAD.length} 个文件\n`)
  
  let successCount = 0
  let failCount = 0
  
  for (const [localPath, cloudPath] of FILES_TO_UPLOAD) {
    const result = await uploadFile(localPath, cloudPath)
    if (result.success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  console.log(`\n📊 上传完成: 成功 ${successCount}, 失败 ${failCount}`)
}

main()
