# 智伴口袋 (ZhiBanKouDai)

> 您的个人专家资料库小程序 - 每日知识陪伴与专业内容聚合平台

## 🎯 项目定位

本项目是一个**内容聚合类小程序**，核心功能是每日为用户提供不同领域的专业内容（名言警句、专业知识、实用技巧等），并支持 AI 生成内容、海报分享等功能。

**设计目标**：一次开发，适配多平台（微信小程序 → Flutter/Web/其他端）

---

## 📁 核心目录结构

```
zhibankoudai/
├── miniprogram/                    # 🔷 核心前端代码目录
│   ├── app.js                      # 应用入口，初始化全局状态
│   ├── app.json                    # 全局路由、窗口配置
│   ├── app.wxss                    # 全局样式（CSS 变量定义）
│   ├── components/                 # 🔶 可复用组件库
│   │   └── dailyCard/              # 📦 每日内容卡片组件（核心）
│   │       ├── dailyCard.js       # 组件逻辑
│   │       ├── dailyCard.wxml     # 组件模板
│   │       ├── dailyCard.wxss     # 组件样式
│   │       └── dailyCard.json     # 组件配置
│   ├── pages/                      # 🔶 页面目录
│   │   ├── index/                  # 首页 - 模块列表展示
│   │   ├── careerGuide/            # 职业指南页
│   │   └── poster/                # 海报生成页
│   ├── utils/                      # 🔶 工具函数
│   │   ├── moduleConfig.js         # 📦 模块配置（名称、图标、颜色）
│   │   ├── cloudData.js            # 📦 云端数据同步与本地缓存
│   │   ├── dailyContent.js         # 📦 兜底内容生成（无网络时）
│   │   └── ...                     # 其他工具函数
│   └── images/                     # 静态图片资源
├── cloudData/                      # 📦 云端配置数据（JSON）
│   ├── moduleConfig.json           # 模块配置文件（云端同步）
│   └── modules/                    # 各模块独立配置
│       ├── quote.json             # 每日名言配置+兜底数据
│       ├── idiom.json             # 歇后语俗语配置+兜底数据
│       └── ...                     # 其他模块配置
├── cloudfunctions/                 # 云函数目录（腾讯云）
│   └── aiContent/                  # AI 内容生成云函数
├── tools/                          # 构建/部署脚本
└── project.config.json             # 微信开发者工具配置
```

---

## 🏗️ 架构设计模式

### 1. 模块化架构

项目采用**配置驱动**的模块化设计：

```
模块配置 (JSON) → 动态加载 → 统一组件渲染
```

**每个模块包含**：
- `id`: 唯一标识
- `name`: 显示名称
- `icon/color`: 样式配置
- `generate`: AI 生成提示词
- `fallback`: 兜底数据（离线时使用）
- `share`: 分享文案模板

### 2. 数据流向

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ cloudData/  │ →  │ cloudData.js│ →  │ dailyCard   │
│   JSON      │    │   同步      │    │   组件      │
└─────────────┘    └─────────────┘    └─────────────┘
                                          │
                                          ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ poster.js   │ ←  │ 云函数 AI   │ ←  │ 用户交互    │
│   海报生成  │    │   生成      │    │   刷新      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3. 缓存策略

| 场景 | 存储方式 | Key 格式 |
|------|---------|---------|
| 模块配置 | `localStorage` | `moduleConfig` |
| 内容缓存 | `localStorage` | `daily{ModuleName}` |
| 用户数据 | `localStorage` | `userInfo` |

---

## 🔑 核心模块说明

### 模块类型枚举 (`MODULE_TYPES`)

位于 `moduleConfig.js`，定义所有支持的模块：

```javascript
const MODULE_TYPES = {
  QUOTE: 'quote',           // 每日名言
  JOKE: 'joke',             // 幽默笑话
  PSYCHOLOGY: 'psychology', // 心理学
  FINANCE: 'finance',       // 财经
  IDIOM: 'idiom',           // 歇后语俗语
  SEO_EXPERT: 'seoExpert',  // SEO专家
  // ... 更多模块
}
```

### 内容生成流程

```
1. 检查本地缓存 → 命中且未过期 → 直接返回
2. 请求云端数据库 → 成功 → 更新缓存并返回
3. 无网络/失败 → 使用 fallback 兜底数据
4. AI 云函数（可选）→ 生成新内容 → 更新数据库
```

### 兜底数据格式

```json
{
  "id": "quote",
  "name": "每日名言",
  "fallback": [
    {
      "content": "名言内容",
      "title": "作者",
      "subtitle": "出处",
      "category": "分类",
      "categoryIcon": "📜"
    }
  ]
}
```

---

## 📱 跨平台迁移指南（→ Flutter）

### 可直接复用部分

| 类别 | 文件 | 说明 |
|------|------|------|
| 配置数据 | `cloudData/*.json` | 模块配置、兜底数据 |
| 工具函数 | `utils/*.js` | 缓存、日志、工具类 |
| 业务逻辑 | `utils/cloudData.js` | 数据同步、模块管理 |

### 需要适配部分

| 类别 | 微信 API | Flutter 替换方案 |
|------|---------|------------------|
| 页面路由 | `wx.navigateTo` | `Navigator.push` |
| 网络请求 | `wx.request` | `dio` / `http` |
| 本地存储 | `wx.setStorage` | `shared_preferences` |
| 海报生成 | 微信 Canvas | `flutter_colorpicker` + `screenshot` |
| 分享功能 | `wx.showShareMenu` | `share_plus` |
| AI 调用 | 云函数 | REST API |

### 迁移优先级

1. **P0 - 数据层**：迁移 `cloudData.js` 逻辑，使用 Dart 重写
2. **P0 - 组件层**：重构 `dailyCard` 组件为 Flutter Widget
3. **P1 - 页面层**：迁移 `pages/index` 等页面
4. **P2 - 平台特有**：海报生成、分享、登录等

### Flutter 项目结构建议

```
lib/
├── models/                 # 数据模型（对应 JSON schema）
│   ├── module_config.dart
│   └── daily_content.dart
├── services/               # 业务服务（对应 utils/）
│   ├── data_service.dart   # 数据同步（cloudData.js）
│   ├── cache_service.dart  # 缓存管理
│   └── ai_service.dart     # AI 内容生成
├── widgets/                # 通用组件（对应 components/）
│   └── daily_card.dart     # 每日内容卡片
├── pages/                  # 页面
│   └── home_page.dart
└── main.dart
```

---

## 🛠️ 技术栈

### 当前（微信小程序）

- **框架**：微信小程序原生
- **视图层**：WXML + WXSS + JavaScript
- **后端**：腾讯云云开发
- **存储**：本地缓存 + 云数据库
- **AI**：云函数调用大模型

### 目标（Flutter）

- **框架**：Flutter 3.x
- **状态管理**：Provider / Riverpod / GetX
- **网络**：Dio
- **存储**：SharedPreferences + Hive
- **AI**：REST API 调用

---

## 🚀 本地开发

```bash
# 1. 使用微信开发者工具导入项目
# 2. 设置 AppID
# 3. 编译运行

# 云函数部署
cd cloudfunctions/aiContent
npm install
npm run deploy
```

---

## 📋 模块列表（持续更新）

| ID | 名称 | 图标 | 说明 |
|----|------|------|------|
| quote | 每日名言 | 📜 | 名言警句、诗词歌赋 |
| joke | 幽默笑话 | 😄 | 轻松一刻 |
| psychology | 心理学 | 🧠 | 心理小知识 |
| finance | 财经 | 💰 | 投资理财 |
| idiom | 歇后语俗语 | 📝 | 民间智慧 |
| seoExpert | SEO专家 | 🔍 | 搜索引擎优化 |
| ... | 更多 | ... | 持续添加中 |

---

## 📄 License

MIT License
