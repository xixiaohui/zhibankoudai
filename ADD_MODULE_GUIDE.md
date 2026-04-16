# 新增模块完整指南

> 本指南详细说明在「每日知识口袋」小程序中新增一个模块的完整步骤。

---

## 一、新增模块配置清单

### 1.1 云端配置文件（共5个）

| 序号 | 文件路径 | 操作内容 |
|:----:|----------|----------|
| 1 | `cloudData/modules/{moduleId}.json` | 创建模块配置文件 |
| 2 | `cloudData/modules/index.json` | 注册模块到索引 |
| 3 | `cloudData/config/homeModules.json` | 添加首页模块配置 |
| 4 | `cloudData/modules/homeConfig.json` | 添加首页布局配置 |
| 5 | `cloudData/prompts/aiPrompts.json` | 添加AI生成提示词 |

### 1.2 本地代码文件（共6个）

| 序号 | 文件路径 | 操作内容 |
|:----:|----------|----------|
| 6 | `miniprogram/utils/cloudData.js` | LOCAL_PROMPTS + DEFAULT_STYLES + ICON_TO_EMOJI |
| 7 | `miniprogram/utils/dailyContent.js` | LOCAL_PROMPTS_FALLBACK + generateXXX 函数 |
| 8 | `miniprogram/utils/dailyModule.js` | MODULE_TYPES + MODULE_CONFIGS |
| 9 | `miniprogram/components/dailyCard/dailyCard.js` | 常量 + 4个函数/switch |
| 10 | `miniprogram/pages/index/index.wxml` | 添加首页卡片组件 |
| 11 | `miniprogram/components/dailyCard/dailyCard.wxml` | 添加卡片渲染模板 |

### 1.3 云数据库（1个）

| 序号 | 操作 | 说明 |
|:----:|------|------|
| 12 | 创建云数据库集合 | `daily{模块名}` |

---

## 二、云端配置（第1-5步）

### 步骤1：创建模块配置文件

**文件路径**：`cloudData/modules/{moduleId}.json`

**模板**：
```json
{
  "id": "模块ID",
  "name": "模块显示名称",
  "icon": "icon-xxx",
  "color": "#颜色代码",
  "fields": [
    { "id": "field1", "name": "分类1", "icon": "emoji" },
    { "id": "field2", "name": "分类2", "icon": "emoji" }
  ],
  "version": "1.0.0",
  "updated": "YYYY-MM-DD",
  "fallback": [
    {
      "title": "默认内容标题",
      "category": "所属分类",
      "categoryIcon": "emoji",
      "content": "默认内容正文（200-500字）",
      "subtitle": "一句话总结（15字内）"
    }
  ],
  "share": {
    "title": "分享标题",
    "template": "{content}"
  }
}
```

**参数说明**：
| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 唯一标识 | `freud` |
| `name` | 显示名称 | `弗洛伊德学术专家` |
| `icon` | 图标名称 | `icon-freud` |
| `color` | 主题颜色 | `#6D4C41` |
| `fields` | 内容分类数组 | 见示例 |
| `fallback` | 兜底数据（至少5条） | 见示例 |
| `updated` | 更新日期 | `2026-04-16` |

---

### 步骤2：注册模块到索引

**文件路径**：`cloudData/modules/index.json`

在 modules 数组末尾添加：
```json
{
  "id": "模块ID",
  "name": "模块名称",
  "icon": "icon-xxx",
  "color": "#颜色代码",
  "count": 10
}
```

---

### 步骤3：添加首页模块配置

**文件路径**：`cloudData/config/homeModules.json`

在 modules 数组末尾添加：
```json
{ "id": "模块ID", "enabled": true, "order": 45, "showOnHome": true }
```

**参数说明**：
| 参数 | 说明 | 示例 |
|------|------|------|
| `id` | 模块ID | `freud` |
| `enabled` | 是否启用 | `true` |
| `order` | 排列顺序（数字越小越靠前） | `45` |
| `showOnHome` | 是否在首页显示卡片 | `true` |

---

### 步骤4：添加首页布局配置

**文件路径**：`cloudData/modules/homeConfig.json`

在 `modules` 数组末尾添加：
```json
{
  "id": "模块ID",
  "enabled": true,
  "order": 44
}
```

---

### 步骤5：添加AI提示词

**文件路径**：`cloudData/prompts/aiPrompts.json`

在 prompts 对象末尾添加：
```json
"模块ID": {
  "generate": "你是一位XXX专家。请分享XXX知识，要求：\n1. 涵盖XXX主题\n2. 介绍背景、原理和适用场景\n3. 详细说明具体内容和应用\n4. 内容长度控制在200-500字之间\n\n请直接输出JSON格式，不要有其他内容：\n{\"title\":\"主题名称\",\"content\":\"详细介绍200-500字\",\"category\":\"所属领域\",\"subtitle\":\"一句话总结15字内\"}",
  "share": "emoji【{title}】\n\n{content}\n\n#标签1 #标签2"
}
```

---

### 步骤6：上传云存储（重要！）

**必须上传以下文件到云存储，否则客户端无法拉取最新配置**

#### 上传路径：`cloudData/`

需要上传的5个文件：
| 序号 | 本地文件 | 云存储路径 |
|:----:|----------|------------|
| 1 | `cloudData/modules/{moduleId}.json` | `cloudData/modules/{moduleId}.json` |
| 2 | `cloudData/modules/index.json` | `cloudData/modules/index.json` |
| 3 | `cloudData/config/homeModules.json` | `cloudData/config/homeModules.json` |
| 4 | `cloudData/modules/homeConfig.json` | `cloudData/modules/homeConfig.json` |
| 5 | `cloudData/prompts/aiPrompts.json` | `cloudData/prompts/aiPrompts.json` |

#### 上传方式

**方式1：微信开发者工具（推荐）**

1. 打开微信开发者工具
2. 点击顶部「云开发」按钮，进入云开发控制台
3. 左侧菜单选择「存储」
4. 点击「上传文件」
5. 依次上传上述5个文件到 `cloudData/` 目录下

**方式2：CloudBase CLI**

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 上传 cloudData 目录
tcb storage upload ./cloudData cloudData --envId 你的环境ID
```

**方式3：MCP 工具（实验性）**

```json
{
  "action": "upload",
  "localPath": "cloudData",
  "cloudPath": "cloudData",
  "isDirectory": true
}
```

⚠️ **注意**：新增模块后必须重新上传这些文件，客户端才能拉取到最新配置。

---

## 三、本地代码配置（第7-11步）

### 步骤7：cloudData.js 三处配置

**文件路径**：`miniprogram/utils/cloudData.js`

#### 7.1 LOCAL_PROMPTS（本地备用提示词）

在 `LOCAL_PROMPTS` 对象中添加：
```js
模块ID: {
  generate: "你是一位XXX专家...输出JSON：{\"title\":\"主题\",\"content\":\"详细介绍\",\"category\":\"领域\",\"subtitle\":\"一句话\"}",
  share: "emoji【{title}】\n\n{content}"
}
```

#### 7.2 DEFAULT_STYLES（模块样式配置）

在 `DEFAULT_STYLES` 对象末尾添加：
```js
freud: {
  id: 'freud', name: '弗洛伊德学术专家', icon: '🧠', color: '#6D4C41', storageKey: 'dailyFreud', posterType: 'freud',
  refreshText: '换一条', loadingText: '精神分析专家正在为你解读...', placeholderText: '点击「换一条」探索潜意识世界',
  tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: '精神分析' },
  colors: generateColors('#6D4C41')
}
```

**参数说明**：
| 参数 | 说明 |
|------|------|
| `id` | 模块ID |
| `name` | 显示名称 |
| `icon` | emoji图标 |
| `color` | 主题颜色 |
| `storageKey` | 本地存储键名 |
| `posterType` | 海报类型（用于分享跳转） |
| `refreshText` | 刷新按钮文字 |
| `loadingText` | 加载中提示文字 |
| `placeholderText` | 占位提示文字 |
| `tags` | 标签配置 |
| `colors` | 颜色配置（由 generateColors 函数生成） |

#### 7.3 ICON_TO_EMOJI（图标映射）

在 `ICON_TO_EMOJI` 对象末尾添加：
```js
'icon-模块ID': '🧠',
```

---

### 步骤8：dailyContent.js 两处配置

**文件路径**：`miniprogram/utils/dailyContent.js`

#### 8.1 LOCAL_PROMPTS_FALLBACK（本地提示词兜底）

在 `LOCAL_PROMPTS_FALLBACK` 对象中添加与 cloudData.js 相同的配置。

#### 8.2 generateXXX 函数（内容生成）

在 `generateFutures` 函数后面添加：
```js
/**
 * 生成模块名称
 */
async generate模块方法名(onChunk, onDone) {
  const promptData = getPrompt('模块ID')
  if (!promptData) throw new Error('获取XXX提示词失败')
  const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
  const content = await generateContent('模块ID', userPrompt, onChunk, 800)
  onDone && onDone(content)
  return content
},
```

---

### 步骤9：dailyModule.js 两处配置

**文件路径**：`miniprogram/utils/dailyModule.js`

#### 9.1 MODULE_TYPES（模块类型常量）

在 `MODULE_TYPES` 对象中添加：
```js
MODULE_TYPES.模块常量名: '模块ID', // 模块中文名
// 示例：
MODULE_TYPES.FREUD: 'freud', // 弗洛伊德学术专家
```

#### 9.2 MODULE_CONFIGS（模块配置）

在 `MODULE_CONFIGS` 对象中添加：
```js
[MODULE_TYPES.模块常量名]: {
  id: MODULE_TYPES.模块常量名,
  name: '模块中文名',
  icon: '🧠',
  storageKey: 'daily模块名',
  collection: 'daily模块名',
  cacheEnabled: true,
  colors: {
    primary: '#颜色代码',
    gradientStart: '#FFFFFF',
    gradientEnd: '#颜色浅色版',
    accent: '#颜色代码',
    text: '#文字颜色',
    textSecondary: '#次要文字颜色',
    bg: 'rgba(颜色, 0.1)',
    shadow: 'rgba(颜色, 0.15)',
  },
  tags: {
    category: { field: 'category', icon: 'categoryIcon' },
    ai: 'AI标签',
  },
  aiTags: ['标签1', '标签2'],
  refreshText: '换一条',
  loadingText: '正在为你生成...',
  placeholderText: '点击「换一条」获取内容',
  posterType: '模块ID',
  slogan: '模块口号',
},
```

---

### 步骤10：dailyCard.js 四处配置

**文件路径**：`miniprogram/components/dailyCard/dailyCard.js`

#### 10.1 MODULE_TYPES 常量

在 `MODULE_TYPES` 对象末尾添加：
```js
FREUD: 'freud'
```

#### 10.2 _fetchContent 的 switch 分支

在 switch 语句中添加：
```js
case MODULE_TYPES.模块常量名:
  return await this._getDaily模块方法名(refresh)
```

#### 10.3 _getDailyXXX 函数

在最后一个 `_getDailyXXX` 函数后面添加：
```js
// 获取模块名称
async _getDaily模块方法名(refresh) {
  if (!refresh) {
    const cached = wx.getStorageSync('daily模块名')
    if (cached) {
      const today = new Date().toISOString().split('T')[0]
      if (cached.date === today) return cached
    }
  }
  const content = await DailyContent.generate模块方法名()
  return content
},
```

#### 10.4 collectionMap 映射

在 `collectionMap` 对象中添加：
```js
[MODULE_TYPES.模块常量名]: 'daily模块名',
```

#### 10.5 onShare 的 switch 分支

在 `onShare` 函数的 switch 语句中添加（用于海报分享跳转）：
```js
case '模块ID':
  url = `/pages/poster/index`
  params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary || content.content)}&subtitle=${encodeURIComponent((content.categoryIcon || '🧠') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🧠')}`
  break
```

---

### 步骤11：前端页面配置

#### 11.1 首页卡片组件

**文件路径**：`miniprogram/pages/index/index.wxml`

在 `futures` 模块后面添加：
```xml
<!-- 模块名称 - 配置ID: 模块ID -->
<daily-card moduleType="模块ID" />
```

#### 11.2 卡片渲染模板

**文件路径**：`miniprogram/components/dailyCard/dailyCard.wxml`

在 `futures` 块后面添加渲染模板：
```xml
<!-- 模块名称 -->
<block wx:elif="{{moduleType === '模块ID'}}">
  <view class="trade-header" style="border-bottom: 1rpx solid {{config.colors.bg}};">
    <text class="trade-title" style="color: {{config.colors.primary}};">{{content.title}}</text>
    <text class="trade-category" style="color: {{config.colors.accent}};">{{content.categoryIcon || '🧠'}} {{content.category}}</text>
  </view>
  <view class="trade-summary" style="color: {{config.colors.textSecondary}};">{{content.summary || content.content}}</view>
  <view class="trade-tips" wx:if="{{content.subtitle}}" style="color: {{config.colors.accent}}; background: {{config.colors.bg}};">
    <text>🧠 {{content.subtitle}}</text>
  </view>
  <view class="trade-tags" wx:if="{{content.tags && content.tags.length > 0}}">
    <block wx:for="{{content.tags}}" wx:key="index">
      <text class="trade-tag" style="background: {{config.colors.bg}}; color: {{config.colors.accent}};">{{item}}</text>
    </block>
  </view>
</block>
```

---

## 四、云数据库配置（第12步）

### 步骤12：创建云数据库集合

**重要**：每个新增模块需要在云数据库中创建对应的集合，用于存储用户生成的内容。

#### 集合命名规范

**格式**：`daily{模块名驼峰}`

| 模块ID | 云数据库集合名 |
|--------|---------------|
| quote | `dailyQuotes` |
| joke | `dailyJokes` |
| psychology | `dailyPsychology` |
| finance | `dailyFinance` |
| love | `dailyLoves` |
| movie | `dailyMovies` |
| music | `dailyMusics` |
| growth | `dailyGrowth` |
| uiDesigner | `dailyUiDesigner` |
| futures | `dailyFutures` |
| freud | `dailyFreud` |

#### 创建方式

**方式1：云开发控制台**
1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 进入「云开发」→「数据库」
3. 点击「新建集合」
4. 输入集合名称（按上述规范命名）
5. 设置集合权限

**方式2：MCP 工具**
```json
{
  "action": "createCollection",
  "collectionName": "daily模块名"
}
```

---

## 五、参考示例：freud 模块

以下是以「弗洛伊德学术专家」模块为例的完整配置：

### 云端配置

**cloudData/modules/freud.json**：
```json
{
  "id": "freud",
  "name": "弗洛伊德学术专家",
  "icon": "icon-freud",
  "color": "#6D4C41",
  "fields": [
    { "id": "psychoanalysis", "name": "精神分析", "icon": "🧠" },
    { "id": "dream", "name": "释梦理论", "icon": "💭" },
    { "id": "personality", "name": "人格结构", "icon": "🔮" },
    { "id": "neurosis", "name": "神经症理论", "icon": "⚕️" },
    { "id": "social", "name": "社会文化", "icon": "🏛️" }
  ],
  "version": "1.0.0",
  "updated": "2026-04-16",
  "fallback": [
    {
      "title": "潜意识理论",
      "category": "精神分析",
      "categoryIcon": "🧠",
      "content": "弗洛伊德认为人的心理分为意识、前意识和潜意识三个层次...",
      "subtitle": "冰山之下的心理世界"
    }
  ],
  "share": {
    "title": "弗洛伊德学术专家",
    "template": "{content}"
  }
}
```

### 本地代码

**dailyModule.js - MODULE_TYPES**：
```js
FREUD: 'freud', // 弗洛伊德学术专家
```

**dailyModule.js - MODULE_CONFIGS**：
```js
[MODULE_TYPES.FREUD]: {
  id: MODULE_TYPES.FREUD,
  name: '弗洛伊德学术专家',
  icon: '🧠',
  storageKey: 'dailyFreud',
  collection: 'dailyFreud',
  cacheEnabled: true,
  colors: {
    primary: '#6D4C41',
    gradientStart: '#FFFFFF',
    gradientEnd: '#EFEBE9',
    accent: '#6D4C41',
    text: '#4E342E',
    textSecondary: '#6D4C41',
    bg: 'rgba(109, 76, 65, 0.1)',
    shadow: 'rgba(109, 76, 65, 0.15)',
  },
  tags: {
    category: { field: 'category', icon: 'categoryIcon' },
    ai: '精神分析',
  },
  aiTags: ['弗洛伊德', '精神分析'],
  refreshText: '换一条',
  loadingText: '精神分析专家正在为你解读...',
  placeholderText: '点击「换一条」探索潜意识世界',
  posterType: 'freud',
  slogan: '探索潜意识，理解真实的自己',
},
```

**dailyContent.js - generateFreud**：
```js
async generateFreud(onChunk, onDone) {
  const promptData = getPrompt('freud')
  if (!promptData) throw new Error('获取弗洛伊德提示词失败')
  const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
  const content = await generateContent('freud', userPrompt, onChunk, 800)
  onDone && onDone(content)
  return content
},
```

**dailyCard.js - switch分支（_fetchContent）**：
```js
case MODULE_TYPES.FREUD:
  return await this._getDailyFreud(refresh)
```

**dailyCard.js - _getDailyFreud 函数**：
```js
async _getDailyFreud(refresh) {
  if (!refresh) {
    const cached = wx.getStorageSync('dailyFreud')
    if (cached) {
      const today = new Date().toISOString().split('T')[0]
      if (cached.date === today) return cached
    }
  }
  const content = await DailyContent.generateFreud()
  return content
},
```

**dailyCard.js - collectionMap**：
```js
[MODULE_TYPES.FREUD]: 'dailyFreud',
```

**dailyCard.js - onShare 分支**：
```js
case 'freud':
  url = `/pages/poster/index`
  params += `&title=${encodeURIComponent(content.title)}&content=${encodeURIComponent(content.summary || content.content)}&subtitle=${encodeURIComponent((content.categoryIcon || '🧠') + ' ' + content.category)}&icon=${encodeURIComponent(content.categoryIcon || '🧠')}`
  break
```

**index.wxml**：
```xml
<!-- 弗洛伊德学术专家 - 配置ID: freud -->
<daily-card moduleType="freud" />
```

**dailyCard.wxml - 渲染模板**：
```xml
<block wx:elif="{{moduleType === 'freud'}}">
  <view class="trade-header" style="border-bottom: 1rpx solid {{config.colors.bg}};">
    <text class="trade-title" style="color: {{config.colors.primary}};">{{content.title}}</text>
    <text class="trade-category" style="color: {{config.colors.accent}};">{{content.categoryIcon || '🧠'}} {{content.category}}</text>
  </view>
  <view class="trade-summary" style="color: {{config.colors.textSecondary}};">{{content.summary || content.content}}</view>
  <view class="trade-tips" wx:if="{{content.subtitle}}" style="color: {{config.colors.accent}}; background: {{config.colors.bg}};">
    <text>🧠 {{content.subtitle}}</text>
  </view>
  <view class="trade-tags" wx:if="{{content.tags && content.tags.length > 0}}">
    <block wx:for="{{content.tags}}" wx:key="index">
      <text class="trade-tag" style="background: {{config.colors.bg}}; color: {{config.colors.accent}};">{{item}}</text>
    </block>
  </view>
</block>
```

---

## 六、注意事项

1. **内容长度**：AI生成内容统一限制为 200-500 字符
2. **subtitle**：一句话总结统一为 15 字以内
3. **模块ID**：唯一标识，不能与其他模块重复
4. **icon**：使用 iconfont 图标名称（如 `icon-freud`）或 emoji
5. **fallback**：至少添加 5 条默认内容作为兜底数据
6. **上传后**：客户端需要清除缓存或重新拉取才能生效
7. **命名规范**：方法名使用 PascalCase，常量名使用 UPPER_SNAKE_CASE
8. **海报分享**：必须添加 onShare switch 分支，否则分享按钮无法跳转到海报页面

---

## 七、快速检查清单

新增模块时，逐项确认以下内容（共 22 项）：

### 云端配置（5项）
- [ ] `cloudData/modules/{moduleId}.json` - 模块配置文件
- [ ] `cloudData/modules/index.json` - 索引注册
- [ ] `cloudData/config/homeModules.json` - 首页配置
- [ ] `cloudData/modules/homeConfig.json` - 布局配置
- [ ] `cloudData/prompts/aiPrompts.json` - AI提示词

### cloudData.js（3项）
- [ ] `LOCAL_PROMPTS` - 本地提示词
- [ ] `DEFAULT_STYLES` - 模块样式配置
- [ ] `ICON_TO_EMOJI` - 图标映射

### dailyContent.js（2项）
- [ ] `LOCAL_PROMPTS_FALLBACK` - 本地提示词兜底
- [ ] `generateXXX` 函数 - 内容生成函数

### dailyModule.js（2项）
- [ ] `MODULE_TYPES` - 模块类型常量
- [ ] `MODULE_CONFIGS` - 模块配置

### dailyCard.js（5项）
- [ ] `MODULE_TYPES` 常量
- [ ] `_fetchContent` switch 分支
- [ ] `_getDailyXXX` 函数
- [ ] `collectionMap` 映射
- [ ] `onShare` switch 分支（海报跳转）

### 前端页面（2项）
- [ ] `pages/index/index.wxml` - 首页卡片组件
- [ ] `dailyCard.wxml` - 卡片渲染模板

### 云数据库（1项）
- [ ] 云数据库集合已创建（集合名：`daily{模块名}`）

---

## 八、常见问题

### Q1: 卡片不显示？
检查以下配置：
1. `homeModules.json` 中 `showOnHome: true`
2. `DEFAULT_STYLES` 中是否有该模块配置
3. `pages/index/index.wxml` 中是否有卡片组件

### Q2: 点击分享无反应？
检查 `dailyCard.js` 中 `onShare` 函数是否有该模块的 switch 分支。

### Q3: 内容生成失败？
1. 检查 `LOCAL_PROMPTS` 和 `generateXXX` 函数是否配置
2. 检查 `cloudData/prompts/aiPrompts.json` 是否已上传
3. 查看控制台错误信息

### Q4: 海报页面显示空白？
检查 `onShare` 参数是否正确传递了 `title`、`content`、`subtitle`、`icon`。

### Q5: 卡片内容显示 undefined？
检查模块的展示字段是否有必要的防护：
1. 使用 `wx:if="{{content.fieldName}}"` 包裹可选字段
2. 使用 `{{content.fieldName || content.alternateField}}` 提供备用字段
3. 电影模块：`rating`、`director`、`year` 字段需要加判断
4. 音乐模块：`artist`、`year` 字段需要加判断

---

## 九、问题修复记录

### 修复 2026-04-16：fashionBrand 模块配置缺失

**问题描述**：
页面加载时提示 `Error: module 'utils/dailyContent.js' is not defined`，原因是 `LOCAL_PROMPTS_FALLBACK` 对象中缺少 `fashionBrand` 配置。

**修复内容**：
1. 在 `miniprogram/utils/dailyContent.js` 的 `LOCAL_PROMPTS_FALLBACK` 中添加：
```javascript
fashionBrand: {
  generate: "你是一位世界服装品牌研究专家...",
  share: "👔【世界服装品牌】{title}\n\n{content}"
}
```

2. 添加 `generateFashionBrand` 函数：
```javascript
async generateFashionBrand(onChunk, onDone) {
  const promptData = getPrompt('fashionBrand')
  if (!promptData) throw new Error('获取服装品牌提示词失败')
  const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
  const content = await generateContent('fashionBrand', userPrompt, onChunk, 800)
  onDone && onDone(content)
  return content
}
```

3. 在 `miniprogram/utils/cloudData.js` 的 `DEFAULT_STYLES` 中添加：
```javascript
fashionBrand: {
  id: 'fashionBrand', name: '世界服装品牌大师', icon: '👔', color: '#D4AF37',
  storageKey: 'dailyFashionBrand', posterType: 'fashionBrand',
  refreshText: '换一条', loadingText: '品牌大师正在为你解读...',
  placeholderText: '点击「换一条」探索品牌世界',
  tags: { category: { field: 'category', icon: 'categoryIcon' }, ai: '品牌专家' },
  colors: generateColors('#D4AF37')
}
```

4. 在 `ICON_TO_EMOJI` 中添加：
```javascript
'icon-fashionBrand': '👔',
```

### 修复 2026-04-16：字段 undefined 显示问题

**问题描述**：
部分模块（如 movie、music）的展示字段在 AI 返回数据缺失时会显示 `undefined`。

**修复内容**：
1. `movie` 模块：
   - `rating` 字段外层添加 `wx:if="{{content.rating}}"`
   - `director`、`year` 外层添加 `wx:if` 判断
   - `summary` 使用 `{{content.summary || content.content}}` 备用

2. `music` 模块：
   - `artist`、`year` 外层添加 `wx:if` 判断
   - `content` 改为 `{{content.description || content.content}}` 备用

3. 删除 `ICON_TO_EMOJI` 中的重复项 `icon-ui`

**防护建议**：新增模块时，确保 WXML 模板中对可选字段添加 `wx:if` 判断或使用 `||` 提供备用值。
