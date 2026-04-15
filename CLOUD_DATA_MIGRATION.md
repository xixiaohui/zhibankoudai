# 云端数据迁移指南

## 📦 已导出的数据文件

```
cloudData/
├── allData.json       813 KB  ⭐ 主要数据文件（39个模块）
├── promptsMeta.json    12 KB  提示词结构元数据
├── fileids.json         3 KB  云存储文件ID配置
└── README.md           (本文件)
```

## 🚀 上传到云存储

### 方式一：微信开发者工具（推荐）

1. 打开微信开发者工具
2. 进入「云开发」控制台
3. 点击左侧「存储」
4. 创建目录 `dailyData`
5. 上传 `cloudData/allData.json` 到该目录
6. 复制返回的 **cloudID**，例如：`cloud://xxx.dailyData/allData.json`

### 方式二：云开发 CLI

```bash
tcb cb storage upload cloudData/allData.json dailyData/
```

## ⚙️ 配置 cloudID

上传后，将 cloudID 填入 `cloudData/fileids.json`：

```json
{
  "allData": {
    "cloudID": "cloud://your-env-id.dailyData/allData.json",
    "updated": "2026-04-15"
  }
}
```

## 📱 客户端使用方式

### 1. 在 app.js 中初始化

```javascript
// app.js
const cloudData = require('./utils/cloudData.js')

App({
  onLaunch() {
    // 初始化云数据（异步，首次加载后缓存）
    cloudData.init()
  }
})
```

### 2. 组件中按需获取

```javascript
// components/dailyCard/dailyCard.js
const cloudData = require('../../utils/cloudData.js')

// 获取单个模块数据
const quotes = cloudData.getModuleData('quote')
const quoteFallback = quotes ? quotes.FAMOUS_QUOTES : []

// 获取配置字段
const quoteFields = cloudData.getFields('quote')  // QUOTE_FIELDS

// 获取提示词（从本地JS）
const { DAILY_PROMPTS } = require('../../utils/dailyPrompts.js')
const quotePrompt = DAILY_PROMPTS.quote.poetry
```

### 3. 智能降级策略

```javascript
async _loadContent() {
  // 1. 先尝试从云端获取
  const cloudData = require('../../utils/cloudData.js')
  const data = cloudData.getModuleData(this.properties.moduleType)
  
  if (data && data.FAMOUS_QUOTES?.length > 0) {
    this.setData({ content: data.FAMOUS_QUOTES[0] })
    return
  }
  
  // 2. 云端没有，尝试本地
  try {
    const localData = require(`../../utils/${this.properties.moduleType}Data.js`)
    // 使用本地数据...
  } catch (e) {
    // 3. 本地也没有，显示空状态
    this.setData({ content: null })
  }
}
```

## 🔄 数据更新流程

1. 修改 `miniprogram/utils/*.js` 源文件
2. 运行 `node tools/exportFullData.js` 重新导出
3. 上传新文件到云存储（覆盖原文件）
4. 客户端下次启动时自动拉取最新数据

## 📊 数据结构说明

```javascript
// cloudData.getModuleData('quote') 返回
{
  "QUOTE_FIELDS": [
    { "id": "poetry", "name": "古诗词", "icon": "📜" },
    { "id": "modern", "name": "现代名言", "icon": "💬" }
  ],
  "FAMOUS_QUOTES": [
    { "content": "...", "title": "作者", "subtitle": "出处" }
  ]
}
```

## ⚠️ 注意事项

1. **首次加载**：云端数据约 813KB，首次加载需要网络
2. **缓存策略**：数据会缓存到本地 storage，过期后自动刷新
3. **离线支持**：本地 `xxxData.js` 文件作为 fallback
4. **提示词**：AI 提示词保留在 `dailyPrompts.js`，不上传到云存储

## 🛠️ 工具脚本

```bash
# 导出所有数据为 JSON
node tools/exportFullData.js

# 导出提示词元数据
node tools/exportPrompts.js

# 分析数据文件结构
node tools/convertDataToJson.js
```
