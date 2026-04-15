# 云端数据架构重构文档

## 📋 概述

将项目从分散的 41 个 JS 数据文件重构为统一格式的 JSON 文件，一个模块一个文件，统一从云存储加载。

## 🏗️ 新架构

```
cloudStorage/
└── modules/                    # 一个模块一个JSON (云存储)
    ├── index.json             # 模块索引
    ├── homeConfig.json        # 首页配置
    ├── quote.json             # 每日名言
    ├── joke.json              # 每日段子
    └── ...

miniprogram/
├── utils/
│   └── cloudData.js          # 统一数据加载器
└── ...
```

## 📦 模块 JSON 格式

```json
{
  "id": "quote",
  "name": "每日名言",
  "icon": "icon-quote",
  "color": "#FF6B6B",
  "fields": [
    { "id": "poetry", "name": "古诗词", "icon": "📜" }
  ],
  "fallback": [
    { "content": "...", "title": "...", "subtitle": "..." }
  ],
  "prompts": {
    "generate": "生成一句名言...",
    "share": "分享语模板..."
  },
  "share": {
    "title": "每日名言",
    "template": "「{content}」—— {author}"
  }
}
```

## 🔧 cloudData.js API

```javascript
const cloudData = require('./utils/cloudData.js')

// 初始化 (app.js 中调用)
cloudData.init()

// 获取单个模块完整数据
const module = cloudData.getModule('quote')
module.fallback   // 备用数据
module.fields     // 分类字段
module.prompts    // AI提示词

// 获取每日固定数据 (按日期种子)
const item = cloudData.getDailyItem('quote')

// 获取随机数据
const random = cloudData.getRandomItem('quote')

// 获取模块列表
const list = cloudData.getModuleList()

// 获取首页配置
const config = cloudData.getHomeConfig()

// 获取启用的模块ID
const enabled = cloudData.getEnabledModules()

// 获取AI提示词
const prompt = cloudData.getPrompt('quote', 'generate')

// 获取分享模板
const template = cloudData.getShareTemplate('quote')
```

## ➕ 添加新模块步骤

### 1. 创建数据文件
在 `miniprogram/utils/` 创建 `xxxData.js`：
```javascript
const XXX_FIELDS = [...]  // 分类配置
const FALLBACK_XXX = [...] // 数据

module.exports = { XXX_FIELDS, FALLBACK_XXX }
```

### 2. 更新元数据
编辑 `tools/generateModuleJsons.js`：
```javascript
const MODULE_FILES = [
  // ... 其他模块
  ['xxxData', 'xxx']  // 添加
]
const MODULE_METADATA = {
  xxx: { name: '模块名', icon: 'icon-xxx', color: '#123' }
}
```

### 3. 注册模块
编辑 `dailyModule.js`：
```javascript
const MODULE_TYPES = { XXX: 'xxx' }
const MODULE_CONFIGS = {
  xxx: { name: '模块名', icon: 'icon-xxx', color: '#123', prompt: '...' }
}
```

### 4. 导出到云端
```bash
node tools/generateModuleJsons.js
```

### 5. 上传到云存储
在微信开发者工具中：
1. 打开云开发控制台 → 存储
2. 上传 `cloudData/modules/` 下所有 JSON 文件

### 6. 更新首页配置
编辑 `cloudData/modules/homeConfig.json`，添加新模块：
```json
{
  "modules": [
    { "id": "xxx", "enabled": true, "order": 40 }
  ]
}
```

## 📁 文件清单

| 文件 | 用途 |
|------|------|
| `cloudData/modules/*.json` | 各模块数据 (39个) |
| `cloudData/modules/index.json` | 模块索引 |
| `cloudData/modules/homeConfig.json` | 首页配置 |
| `tools/generateModuleJsons.js` | 数据导出脚本 |
| `miniprogram/utils/cloudData.js` | 数据加载器 |

## 🔄 数据更新流程

1. 修改本地 `xxxData.js`
2. 运行 `node tools/generateModuleJsons.js`
3. 上传更新的 JSON 到云存储

## 📱 各页面数据来源

| 页面 | 数据来源 |
|------|----------|
| 首页 | `getModuleList()` + `getDailyItem()` |
| 列表页 | `getModule('xxx').fallback` |
| 详情页 | `getModule('xxx')` |
| 海报页 | `getShareTemplate()` |
| AI生成 | `getPrompt()` |
