# 新增模块完整指南

> 本指南详细说明在「每日知识口袋」小程序中新增一个模块的完整步骤。

---

## 一、新增模块配置清单

### 1.1 核心配置文件（1个）

| 序号 | 文件路径 | 操作内容 |
|:----:|----------|----------|
| 1 | `miniprogram/utils/moduleConfig.js` | 在 `DEFAULT_MODULE_CONFIG.modules` 中添加模块配置 |

### 1.2 AI内容生成配置（1个）

| 序号 | 文件路径 | 操作内容 |
|:----:|----------|----------|
| 2 | `miniprogram/utils/dailyContent.js` | `LOCAL_PROMPTS_FALLBACK` + `generateXXX` 函数 + `normalizeContent` 逻辑 |

### 1.3 前端页面配置（2个）

| 序号 | 文件路径 | 操作内容 |
|:----:|----------|----------|
| 3 | `miniprogram/pages/index/index.wxml` | 添加首页卡片组件 |
| 4 | `miniprogram/components/dailyCard/dailyCard.wxml` | 添加卡片渲染模板 |

### 1.4 云数据库（1个）

| 序号 | 操作 | 说明 |
|:----:|------|------|
| 5 | 创建云数据库集合 | `daily{模块名驼峰}` |

---

## 二、详细配置步骤

### 步骤1：moduleConfig.js（核心配置）

**文件路径**：`miniprogram/utils/moduleConfig.js`

在 `DEFAULT_MODULE_CONFIG.modules` 数组末尾添加模块配置：

```javascript
{
  id: '模块ID',
  name: '模块显示名称',
  icon: '🔮',
  storageKey: 'daily模块名',
  collection: 'daily模块名s',  // ⚠️ 云数据库集合名（复数形式）
  cacheEnabled: true,
  enabled: true,
  order: 51,  // 排列顺序（数字越大越靠后）
  colors: {
    primary: '#颜色代码',
    gradientStart: '#FFFFFF',
    gradientEnd: '#浅色版本',
    accent: '#颜色代码',
    text: '#文字颜色',
    textSecondary: '#次要文字颜色',
    bg: 'rgba(颜色, 0.1)',
    shadow: 'rgba(颜色, 0.15)'
  },
  tags: {
    category: { field: 'category', icon: 'categoryIcon' },
    ai: 'AI'
  },
  aiTags: ['标签1', '标签2'],
  refreshText: '换一条',
  loadingText: '内容加载中...',
  placeholderText: '点击「换一条」获取内容',
  posterType: '模块ID',  // ⚠️ 与 id 保持一致
  slogan: '模块口号'
}
```

**⚠️ 重要说明**：
- `collection` 字段是云数据库集合名，用于存储用户生成的内容
- `posterType` 必须与 `id` 保持一致，用于分享跳转
- `storageKey` 用于本地存储缓存

---

### 步骤2：dailyContent.js（AI生成）

**文件路径**：`miniprogram/utils/dailyContent.js`

#### 2.1 添加提示词配置

在 `LOCAL_PROMPTS_FALLBACK` 对象中添加：

```javascript
模块ID: {
  generate: "你是一位XXX专家。请分享XXX知识，要求：\n1. 涵盖XXX主题\n2. 介绍背景、原理和适用场景\n3. 内容长度200-500字\n\n输出JSON格式：\n{\"title\":\"主题名称\",\"content\":\"详细介绍200-500字\",\"category\":\"所属领域\",\"subtitle\":\"一句话15字内\"}",
  share: "emoji【{title}】\n\n{content}"
}
```

#### 2.2 添加 normalizeContent 逻辑

在 `normalizeContent` 函数的 `switch (moduleId)` 中添加 case：

```javascript
case '模块ID':
  return {
    title: json.title || json.name || '内容',
    content: json.content || aiResult,
    summary: json.summary || json.content || '',
    category: json.category || '领域',
    categoryIcon: json.categoryIcon || '🔮',
    date: today,
    isAIGenerated: true
  }
```

**注意**：如果模块需要特殊字段（如 movie 需要 rating、director 等），请参考现有模块添加对应字段。

#### 2.3 添加 generateXXX 函数

在 `DailyContent` 对象中添加：

```javascript
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

### 步骤3：首页卡片组件

**文件路径**：`miniprogram/pages/index/index.wxml`

在 `futures` 模块后面添加：

```xml
<!-- 模块名称 - 配置ID: 模块ID -->
<daily-card moduleType="模块ID" />
```

---

### 步骤4：卡片渲染模板

**文件路径**：`miniprogram/components/dailyCard/dailyCard.wxml`

在 `futures` 块后面添加渲染模板：

```xml
<!-- 模块名称 -->
<block wx:elif="{{moduleType === '模块ID'}}">
  <view class="trade-header" style="border-bottom: 1rpx solid {{config.colors.bg}};">
    <text class="trade-title" style="color: {{config.colors.primary}};">{{content.title}}</text>
    <text class="trade-category" style="color: {{config.colors.accent}};">{{content.categoryIcon || '🔮'}} {{content.category}}</text>
  </view>
  <view class="trade-summary" style="color: {{config.colors.textSecondary}};">{{content.summary || content.content}}</view>
  <view class="trade-tips" wx:if="{{content.subtitle}}" style="color: {{config.colors.accent}}; background: {{config.colors.bg}};">
    <text>{{config.icon}} {{content.subtitle}}</text>
  </view>
  <view class="trade-tags" wx:if="{{content.tags && content.tags.length > 0}}">
    <block wx:for="{{content.tags}}" wx:key="index">
      <text class="trade-tag" style="background: {{config.colors.bg}}; color: {{config.colors.accent}};">{{item}}</text>
    </block>
  </view>
</block>
```

**说明**：
- `config.colors.primary` - 主色调（标题）
- `config.colors.accent` - 强调色（分类标签）
- `config.colors.bg` - 背景色（分割线、标签背景）
- `config.colors.textSecondary` - 次要文字色（正文）
- `content.title` - 标题
- `content.category` - 分类
- `content.categoryIcon` - 分类图标（emoji）
- `content.summary` - 摘要（优先使用）
- `content.content` - 正文（备用）
- `content.subtitle` - 副标题/一句话总结

---

### 步骤5：创建云数据库集合

**重要**：每个新增模块需要在云数据库中创建对应的集合。

#### 集合命名规范

| 模块ID | 云数据库集合名 |
|--------|---------------|
| quote | dailyQuotes |
| joke | dailyJokes |
| psychology | dailyPsychologys |
| finance | dailyFinances |
| love | dailyLoves |
| movie | dailyMovies |
| music | dailyMusics |
| tech | dailyTechs |
| tcm | dailyTcms |
| travel | dailyTravels |
| fortune | dailyFortunes |
| literature | dailyLiteratures |
| foreignTrade | dailyForeignTrades |
| ecommerce | dailyEcommerces |
| math | dailyMaths |
| english | dailyEnglishs |
| programming | dailyProgrammings |
| photography | dailyPhotographys |
| beauty | dailyBeautys |
| investment | dailyInvestments |
| fishing | dailyFishings |
| fitness | dailyFitnesss |
| pet | dailyPets |
| fashion | dailyFashions |
| outfit | dailyOutfits |
| decoration | dailyDecorations |
| glassFiber | dailyGlassFibers |
| resin | dailyResins |
| tax | dailyTaxs |
| law | dailyLaws |
| official | dailyOfficials |
| handling | dailyHandlings |
| floral | dailyFlorals |
| history | dailyHistorys |
| military | dailyMilitarys |
| stock | dailyStocks |
| economics | dailyEconomics |
| business | dailyBusinesss |
| news | dailyNewss |
| apple | dailyApples |
| growth | dailyGrowths |
| uiDesigner | dailyUiDesigners |
| futures | dailyFutures |
| freud | dailyFreuds |
| fashionBrand | dailyFashionBrands |
| robotAi | dailyRobotAis |
| americanExpert | dailyAmericanExperts |
| xinStudy | dailyXinStudys |
| liStudy | dailyLiStudys |
| wisdomBag | dailyWisdomBags |

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

## 三、参考示例

### 3.1 moduleConfig.js 配置示例

```javascript
{
  id: 'xinStudy',
  name: '心学大师',
  icon: '💭',
  storageKey: 'dailyXinStudy',
  collection: 'dailyXinStudys',
  cacheEnabled: true,
  enabled: true,
  order: 49,
  colors: {
    primary: '#00695C',
    gradientStart: '#FFFFFF',
    gradientEnd: '#E0F2F1',
    accent: '#004D40',
    text: '#004D40',
    textSecondary: '#00695C',
    bg: 'rgba(0, 105, 92, 0.1)',
    shadow: 'rgba(0, 105, 92, 0.15)'
  },
  tags: {
    category: { field: 'category', icon: 'categoryIcon' },
    ai: 'AI导师'
  },
  aiTags: ['心学', '王阳明'],
  refreshText: '换一条',
  loadingText: '心学智慧解读中...',
  placeholderText: '点击「换一条」学习心学智慧',
  posterType: 'xinStudy',
  slogan: '知行合一，致良知'
}
```

### 3.2 dailyContent.js 配置示例

```javascript
// LOCAL_PROMPTS_FALLBACK 中添加
xinStudy: {
  generate: "你是一位阳明心学研究专家。请分享心学智慧，涵盖知行合一、致良知，事上练、心外无物等。介绍心学思想的背景、原理和现实意义。内容长度200-500字。输出JSON：{\"title\":\"主题名称\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
  share: "🔥【心学大师】{title}\n\n{content}"
}

// DailyContent 对象中添加
async generateXinStudy(onChunk, onDone) {
  const promptData = getPrompt('xinStudy')
  if (!promptData) throw new Error('获取心学提示词失败')
  const userPrompt = promptData.generate.replace('{今日日期}', formatDate())
  const content = await generateContent('xinStudy', userPrompt, onChunk, 800)
  onDone && onDone(content)
  return content
},
```

### 3.3 index.wxml 配置示例

```xml
<!-- 心学大师 - 配置ID: xinStudy -->
<daily-card moduleType="xinStudy" />
```

### 3.4 dailyCard.wxml 配置示例

```xml
<!-- 心学大师 -->
<block wx:elif="{{moduleType === 'xinStudy'}}">
  <view class="trade-header" style="border-bottom: 1rpx solid {{config.colors.bg}};">
    <text class="trade-title" style="color: {{config.colors.primary}};">{{content.title}}</text>
    <text class="trade-category" style="color: {{config.colors.accent}};">{{content.categoryIcon || '💭'}} {{content.category}}</text>
  </view>
  <view class="trade-summary" style="color: {{config.colors.textSecondary}};">{{content.summary || content.content}}</view>
  <view class="trade-tips" wx:if="{{content.subtitle}}" style="color: {{config.colors.accent}}; background: {{config.colors.bg}};">
    <text>💭 {{content.subtitle}}</text>
  </view>
</block>
```

---

## 四、注意事项

1. **collection 命名**：云数据库集合名统一使用复数形式（加 s），如 `dailyXinStudys`
2. **posterType**：必须与 `id` 保持一致，用于分享功能跳转
3. **storageKey**：用于本地存储缓存，建议格式 `daily{模块名}`
4. **内容长度**：AI生成内容统一限制为 200-500 字符
5. **subtitle**：一句话总结统一为 15 字以内
6. **模块ID**：唯一标识，不能与其他模块重复
7. **icon**：使用 emoji 作为图标
8. **排序**：通过 `order` 字段控制，越小越靠前

---

## 五、快速检查清单

新增模块时，逐项确认以下内容（共 5 项）：

### 模块配置（1项）
- [ ] `moduleConfig.js` - `DEFAULT_MODULE_CONFIG.modules` 中添加模块配置

### AI内容生成（1项）
- [ ] `dailyContent.js` - `LOCAL_PROMPTS_FALLBACK` + `generateXXX` 函数

### 前端页面（2项）
- [ ] `pages/index/index.wxml` - 添加首页卡片组件
- [ ] `dailyCard.wxml` - 添加卡片渲染模板

### 云数据库（1项）
- [ ] 云数据库集合已创建（集合名：`daily{模块名}s`）

---

## 六、常见问题

### Q1: 卡片不显示？
检查以下配置：
1. `moduleConfig.js` 中 `enabled: true`
2. `pages/index/index.wxml` 中是否有卡片组件

### Q2: 点击分享无反应？
检查 `dailyCard.js` 中 `onShare` 函数是否有该模块的 switch 分支（需要添加）。

### Q3: 内容生成失败？
1. 检查 `LOCAL_PROMPTS_FALLBACK` 是否配置
2. 检查 `generateXXX` 函数是否添加
3. 查看控制台错误信息

### Q4: 云端保存失败？
检查 `moduleConfig.js` 中 `collection` 字段是否正确，且云数据库集合是否存在。

### Q5: 卡片内容显示 undefined？
检查 WXML 模板中对可选字段添加 `wx:if` 判断或使用 `||` 提供备用值。

---

## 七、架构说明

### 数据流程

```
用户点击"换一条"
    ↓
dailyCard.js _fetchContent()
    ↓
调用 DailyContent.generateXXX()
    ↓
dailyContent.js 调用 AI 生成内容
    ↓
返回标准化内容对象
    ↓
缓存到本地 (wx.setStorageSync)
    ↓
保存到云数据库 (_saveToCloud)
    ↓
更新UI显示
```

### 云数据库存储逻辑

`_saveToCloud` 方法会自动：
1. 从 `moduleConfig.js` 获取 `collection` 名称
2. 检查今日是否已存在该模块的内容
3. 存在则更新，不存在则新增
4. 记录 `userId`、`userName`、`date`、`createdAt` 等元信息

**无需手动配置 collectionMap**，所有配置都在 `moduleConfig.js` 中统一管理。

---

## 八、更新日志

### 2026-04-18：架构优化

**变更说明**：
1. 移除 `dailyCard.js` 中的 `collectionMap` 硬编码
2. 统一由 `moduleConfig.js` 提供 `collection` 配置
3. `_saveToCloud` 方法自动从配置获取集合名
4. 避免重复保存：`dailyContent.js` 中的 `generateXXX` 不再自动保存
5. 统一保存逻辑由 `dailyCard.js` 的 `_saveToCloud` 负责

**配置简化**：
- 不再需要手动配置 `collectionMap`
- 不再需要手动配置云端配置文件
- 所有配置集中在 `moduleConfig.js` 和 `dailyContent.js` 中
