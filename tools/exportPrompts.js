/**
 * tools/exportPrompts.js
 * 
 * 导出 dailyPrompts.js 为 JSON 格式
 * 特别处理模板字符串
 */

const fs = require('fs')
const path = require('path')

// 读取并解析 dailyPrompts.js
const content = fs.readFileSync(
  path.join(__dirname, '../miniprogram/utils/dailyPrompts.js'),
  'utf-8'
)

// 提取 DAILY_PROMPTS 对象
const match = content.match(/const DAILY_PROMPTS\s*=\s*\{([\s\S]*)\}\s*;?\s*$/)
if (!match) {
  console.error('❌ 无法解析 DAILY_PROMPTS')
  process.exit(1)
}

// 简单解析：提取模块名和子键
const moduleNames = []
const regex = /^\s*(\w+):\s*\{$/gm
let m
while ((m = regex.exec(match[1])) !== null) {
  moduleNames.push(m[1])
}

console.log(`📋 发现 ${moduleNames.length} 个模块的提示词:`)
console.log(moduleNames.join(', '))

// 创建简化的提示词结构（只包含字段信息，不包含完整prompt文本）
// 完整prompt会保留在JS文件中作为fallback
const promptsMeta = {}

for (const mod of moduleNames) {
  // 匹配子模块
  const modRegex = new RegExp(`${mod}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},?\\s*(?=\\w+:|\\})`, 'm')
  const modMatch = content.match(modRegex)
  
  if (modMatch) {
    const subModules = []
    const subRegex = /(\w+):\s*\{/g
    let sm
    while ((sm = subRegex.exec(modMatch[1])) !== null) {
      subModules.push(sm[1])
    }
    promptsMeta[mod] = {
      subModules,
      hasFullPrompt: true  // 标记完整prompt在JS文件中
    }
  }
}

// 保存元数据
const output = {
  version: '1.0.0',
  type: 'prompts',
  generated: new Date().toISOString(),
  totalModules: moduleNames.length,
  modules: promptsMeta
}

const outputPath = path.join(__dirname, '../cloudData/promptsMeta.json')
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

console.log(`\n✅ promptsMeta.json 已生成`)
console.log(`📏 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)

// 提示：dailyPrompts.js 保持原样，作为本地fallback
console.log('\n📝 注意:')
console.log('   - dailyPrompts.js 保持原样，作为本地fallback')
console.log('   - promptsMeta.json 仅包含结构信息，用于云端按需加载')
console.log('   - 完整提示词数据由客户端从JS文件读取')
