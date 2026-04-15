/**
 * tools/batchUpload.js
 * 批量上传 cloudData 到云存储
 * 
 * 使用方式：在微信开发者工具控制台中运行
 * 注意：需要在云函数中调用
 */

// 需要上传的文件列表
const FILES = [
  // 配置
  'cloudData/config/appConfig.json',
  'cloudData/config/homeModules.json',
  
  // 索引
  'cloudData/modules/index.json',
  
  // AI提示词
  'cloudData/prompts/aiPrompts.json',
  
  // 模块数据
  'cloudData/modules/quote.json',
  'cloudData/modules/joke.json',
  'cloudData/modules/psychology.json',
  'cloudData/modules/finance.json',
  'cloudData/modules/love.json',
  'cloudData/modules/movie.json',
  'cloudData/modules/music.json',
  'cloudData/modules/tech.json',
  'cloudData/modules/tcm.json',
  'cloudData/modules/travel.json',
  'cloudData/modules/fortune.json',
  'cloudData/modules/literature.json',
  'cloudData/modules/foreignTrade.json',
  'cloudData/modules/ecommerce.json',
  'cloudData/modules/math.json',
  'cloudData/modules/english.json',
  'cloudData/modules/programming.json',
  'cloudData/modules/photography.json',
  'cloudData/modules/beauty.json',
  'cloudData/modules/investment.json',
  'cloudData/modules/fishing.json',
  'cloudData/modules/fitness.json',
  'cloudData/modules/pet.json',
  'cloudData/modules/fashion.json',
  'cloudData/modules/outfit.json',
  'cloudData/modules/decoration.json',
  'cloudData/modules/glassFiber.json',
  'cloudData/modules/resin.json',
  'cloudData/modules/tax.json',
  'cloudData/modules/law.json',
  'cloudData/modules/official.json',
  'cloudData/modules/handling.json',
  'cloudData/modules/floral.json',
  'cloudData/modules/history.json',
  'cloudData/modules/military.json',
  'cloudData/modules/stock.json',
  'cloudData/modules/economics.json',
  'cloudData/modules/business.json',
  'cloudData/modules/news.json',
]

// 同步执行（在小程序端使用）
async function uploadAll() {
  const results = []
  let success = 0
  let fail = 0
  
  for (const cloudPath of FILES) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'uploadCloudData',
        data: { 
          cloudPath: cloudPath,
          localPath: `${wx.env.USER_DATA_PATH}/${cloudPath}`
        }
      })
      
      if (res.result.success) {
        success++
        console.log(`✅ ${cloudPath}`)
      } else {
        fail++
        console.log(`❌ ${cloudPath}: ${res.result.error}`)
      }
    } catch (e) {
      fail++
      console.log(`❌ ${cloudPath}: ${e.message}`)
    }
  }
  
  console.log(`\n📊 完成: 成功 ${success}, 失败 ${fail}`)
  return { success, fail }
}

// 导出
module.exports = { uploadAll, FILES }
