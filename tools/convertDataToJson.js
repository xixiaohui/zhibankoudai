/**
 * tools/convertDataToJson.js
 * 
 * 将 utils/*.js 数据文件转换为 JSON 格式
 * 用于上传到云存储
 */

const fs = require('fs')
const path = require('path')

// 读取JS文件，提取数据
function extractJsData(jsFilePath) {
  const content = fs.readFileSync(jsFilePath, 'utf-8')
  
  // 提取 module.exports 内容
  const exportMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\}/s)
  if (!exportMatch) {
    console.log(`  ⚠️  无法解析导出格式: ${path.basename(jsFilePath)}`)
    return null
  }
  
  // 提取变量名
  const varNames = []
  const exportContent = exportMatch[1]
  const keyMatches = exportContent.matchAll(/(\w+):/g)
  for (const match of keyMatches) {
    varNames.push(match[1])
  }
  
  // 创建模拟执行环境
  const varValues = {}
  const varBlocks = exportContent.split(/,\s*(?=\w+:)/g)
  
  // 简单的字符串提取（用于纯数组/对象）
  const result = {}
  for (const varName of varNames) {
    // 尝试匹配 const VAR_NAME = [...]
    const arrayMatch = content.match(new RegExp(`const\\s+${varName}\\s*=\\s*(\\[\\s*[\\s\\S]*?\\])\\s*[,;]`, 'm'))
    const objectMatch = content.match(new RegExp(`const\\s+${varName}\\s*=\\s*(\\{\\s*[\\s\\S]*?\\})\\s*[,;]`, 'm'))
    
    if (arrayMatch) {
      try {
        // 简单验证是否为有效数组
        const testStr = arrayMatch[1]
        if (testStr.includes('[') && testStr.includes(']') && testStr.split('[').length === testStr.split(']').length) {
          result[varName] = 'ARRAY_DATA'
        }
      } catch (e) {}
    } else if (objectMatch) {
      result[varName] = 'OBJECT_DATA'
    } else {
      result[varName] = 'UNKNOWN'
    }
  }
  
  return {
    file: path.basename(jsFilePath),
    exports: Object.keys(result),
    hasArray: Object.values(result).includes('ARRAY_DATA'),
    hasObject: Object.values(result).includes('OBJECT_DATA')
  }
}

// 主函数
function main() {
  const utilsDir = path.join(__dirname, '../miniprogram/utils')
  const outputDir = path.join(__dirname, '../cloudData')
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // 查找所有Data.js文件
  const files = fs.readdirSync(utilsDir)
    .filter(f => f.endsWith('Data.js') && f !== 'cloudData.js' && f !== 'dailyData.js')
    .map(f => path.join(utilsDir, f))
  
  console.log(`📁 找到 ${files.length} 个数据文件\n`)
  
  // 分析每个文件
  const dataInfo = []
  for (const file of files) {
    const info = extractJsData(file)
    if (info) {
      dataInfo.push(info)
      console.log(`✅ ${info.file}: ${info.exports.join(', ')}`)
    }
  }
  
  // 生成模块列表
  const modules = dataInfo.map(info => {
    const moduleName = info.file.replace('Data.js', '')
    return {
      module: moduleName,
      fields: info.exports.filter(e => e.includes('FIELD') || e.includes('SCENE') || e.includes('CATEGORY')),
      data: info.exports.filter(e => e.startsWith('FALLBACK_') || e.endsWith('_DATA') || e.endsWith('_QUOTES'))
    }
  }).filter(m => m.data.length > 0)
  
  // 输出统计
  console.log('\n📊 数据统计:')
  console.log(`   模块数量: ${modules.length}`)
  console.log(`   总字段配置: ${modules.reduce((sum, m) => sum + m.fields.length, 0)}`)
  console.log(`   总数据项: ${modules.reduce((sum, m) => sum + m.data.length, 0)}`)
  
  // 生成说明文件
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    totalModules: modules.length,
    modules: modules.map(m => ({
      moduleType: m.module,
      dataKeys: m.data,
      hasConfig: m.fields.length > 0
    }))
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  )
  
  console.log('\n✅ manifest.json 已生成')
  console.log('\n📝 下一步:')
  console.log('   1. 运行 node tools/exportFullData.js 导出完整数据为 JSON')
  console.log('   2. 在微信开发者工具中上传 cloudData/ 下的 JSON 文件到云存储')
  console.log('   3. 更新 cloudData/fileids.json 配置 cloudID')
}

main()
