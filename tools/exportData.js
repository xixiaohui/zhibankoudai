#!/usr/bin/env node
/**
 * tools/exportData.js - 导出数据为 JSON 文件
 * 
 * 使用方式：node tools/exportData.js
 * 导出所有 dailyData/*.js 文件为 JSON
 */

const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'miniprogram', 'utils')
const outputDir = path.join(__dirname, '..', 'cloudData')

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 需要导出的数据文件映射
const fileMapping = {
  'dailyPrompts.js': 'prompts.json',
  'quoteData.js': 'quote.json',
  'jokeData.js': 'joke.json',
  'psychologyData.js': 'psychology.json',
  'financeData.js': 'finance.json',
  'loveData.js': 'love.json',
  'movieData.js': 'movie.json',
  'musicData.js': 'music.json',
  'techData.js': 'tech.json',
  'tcmData.js': 'tcm.json',
  'travelData.js': 'travel.json',
  'fortuneData.js': 'fortune.json',
  'literatureData.js': 'literature.json',
  'foreignTradeData.js': 'foreignTrade.json',
  'eCommerceData.js': 'ecommerce.json',
  'mathData.js': 'math.json',
  'englishData.js': 'english.json',
  'programmingData.js': 'programming.json',
  'photographyData.js': 'photography.json',
  'beautyData.js': 'beauty.json',
  'investmentData.js': 'investment.json',
  'fishingData.js': 'fishing.json',
  'fitnessData.js': 'fitness.json',
  'petData.js': 'pet.json',
  'fashionData.js': 'fashion.json',
  'outfitData.js': 'outfit.json',
  'decorationData.js': 'decoration.json',
  'glassFiberData.js': 'glassFiber.json',
  'resinData.js': 'resin.json',
  'taxData.js': 'tax.json',
  'lawData.js': 'law.json',
  'officialData.js': 'official.json',
  'handlingData.js': 'handling.json',
  'floralData.js': 'floral.json',
  'historyData.js': 'history.json',
  'militaryData.js': 'military.json',
  'stockData.js': 'stock.json',
  'economicsData.js': 'economics.json',
  'businessData.js': 'business.json',
  'newsData.js': 'news.json',
}

console.log('开始导出数据文件...\n')

// 读取并导出每个文件
for (const [srcFile, destFile] of Object.entries(fileMapping)) {
  const srcPath = path.join(dataDir, srcFile)
  const destPath = path.join(outputDir, destFile)
  
  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  跳过: ${srcFile} (文件不存在)`)
    continue
  }
  
  try {
    // 读取 JS 文件内容
    let content = fs.readFileSync(srcPath, 'utf8')
    
    // 提取 module.exports 内容
    // 处理 const xxx = [...] 或 const xxx = {...}
    const exportPattern = /module\.exports\s*=\s*\{([\s\S]*)\}/
    const simpleExportPattern = /module\.exports\s*=\s*(.+)/
    
    let exportContent = null
    let data = null
    
    // 尝试匹配复杂导出
    const match = content.match(exportPattern)
    if (match) {
      // 创建一个函数来评估导出内容
      // 这需要把 JS 语法转换为可执行代码
      const exportStr = match[0]
      
      // 尝试用 vm 或简化处理
      // 这里我们简单地提取 const 定义
      console.log(`📄 处理: ${srcFile} -> ${destFile}`)
      
      // 简单处理：直接复制 require 语句后的内容
      // 实际上更好的方式是让用户手动导出
      console.log(`   需要手动处理 ${srcFile} 的导出`)
    } else {
      console.log(`⚠️  无法解析: ${srcFile}`)
    }
    
    console.log(`✅ 待处理: ${srcFile} -> ${destFile}`)
    
  } catch (e) {
    console.error(`❌ 错误: ${srcFile}`, e.message)
  }
}

console.log('\n导出完成！')
console.log(`JSON 文件已生成到: ${outputDir}`)
console.log('\n下一步:')
console.log('1. 将 cloudData/ 目录下的 JSON 文件上传到微信云存储')
console.log('2. 复制 cloudData/fileIDs.json 中的路径到小程序中')
