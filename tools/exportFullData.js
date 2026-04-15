/**
 * tools/exportFullData.js
 * 
 * 导出所有模块数据为 JSON 格式
 * 用于上传到云存储
 */

const fs = require('fs')
const path = require('path')

// 清除 require 缓存的辅助函数
function cleanRequireCache() {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('miniprogram/utils')) {
      delete require.cache[key]
    }
  })
}

// 导出指定模块的数据
function exportModuleData(moduleName) {
  try {
    cleanRequireCache()
    const dataPath = path.join(__dirname, `../miniprogram/utils/${moduleName}Data.js`)
    if (!fs.existsSync(dataPath)) {
      return null
    }
    const data = require(dataPath)
    return data
  } catch (e) {
    console.log(`  ⚠️  加载失败 ${moduleName}: ${e.message}`)
    return null
  }
}

// 模块列表
const modules = [
  'beauty', 'business', 'decoration', 'eCommerce', 'economics',
  'english', 'fashion', 'finance', 'fishing', 'fitness',
  'floral', 'foreignTrade', 'fortune', 'glassFiber', 'handling',
  'history', 'investment', 'joke', 'law', 'literature',
  'love', 'math', 'military', 'movie', 'music',
  'news', 'official', 'outfit', 'pet', 'photography',
  'programming', 'psychology', 'quote', 'resin', 'stock',
  'tax', 'tcm', 'tech', 'travel', 'dailyPrompts'
]

console.log('📦 开始导出数据...\n')

const allData = {
  version: '1.0.0',
  generated: new Date().toISOString(),
  modules: {}
}

let successCount = 0
let errorCount = 0

for (const moduleName of modules) {
  const data = exportModuleData(moduleName)
  if (data) {
    // 提取模块名（去除Data后缀）
    const key = moduleName === 'dailyPrompts' ? 'dailyPrompts' : moduleName
    allData.modules[key] = data
    successCount++
    console.log(`✅ ${moduleName}Data.js`)
  } else {
    errorCount++
    console.log(`❌ ${moduleName}Data.js`)
  }
}

console.log(`\n📊 导出完成: ${successCount} 成功, ${errorCount} 失败`)

// 保存到文件
const outputPath = path.join(__dirname, '../cloudData/allData.json')
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8')

const stats = fs.statSync(outputPath)
console.log(`\n💾 已保存到: ${outputPath}`)
console.log(`📏 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
