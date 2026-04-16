# 新增模块完整指南

## 快速步骤

添加新模块时，按以下 6 个步骤执行：

| 步骤 | 文件位置 | 操作内容 |
|------|----------|----------|
| 1 | `cloudData/modules/{moduleId}.json` | 创建模块配置文件 |
| 2 | `cloudData/modules/index.json` | 注册模块到索引 |
| 3 | `cloudData/config/homeModules.json` | 添加首页模块配置 |
| 4 | `cloudData/modules/homeConfig.json` | 添加首页布局配置 |
| 5 | `cloudData/prompts/aiPrompts.json` | 添加AI生成提示词 |
| 6 | 云存储 | 上传 cloudData/ 配置文件 |

---

## 详细说明

### 步骤1：创建模块配置文件

**文件路径**：`cloudData/modules/{moduleId}.json`

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

---

### 步骤2：注册模块到索引

**文件路径**：`cloudData/modules/index.json`

在模块列表中添加：
```json
{
  "id": "模块ID",
  "name": "模块名称",
  "category": "所属大类",
  "subcategory": "所属小类",
  "status": "normal"
}
```

---

### 步骤3：添加首页模块配置

**文件路径**：`cloudData/config/homeModules.json`

在 modules 数组中添加：
```json
{
  "moduleId": "模块ID",
  "name": "模块名称",
  "icon": "emoji或icon名称",
  "color": "#颜色代码",
  "show": true,
  "order": 10
}
```

---

### 步骤4：添加首页布局配置

**文件路径**：`cloudData/modules/homeConfig.json`

在对应页面区域的 modules 数组中添加：
```json
{
  "moduleId": "模块ID",
  "layout": "card",
  "cols": 2,
  "showTitle": true,
  "order": 10
}
```

---

### 步骤5：添加AI提示词

**文件路径**：`cloudData/prompts/aiPrompts.json`

在 prompts 对象中添加：
```json
"模块ID": {
  "generate": "你是一位XXX专家。请分享XXX知识...内容长度200-500字。输出JSON：{\"title\":\"主题\",\"content\":\"详细介绍200-500字\",\"category\":\"领域\",\"subtitle\":\"一句话15字内\"}",
  "share": "emoji【{title}】\\n\\n{content}"
}
```

---

### 步骤6：同步本地备用提示词

**文件路径**：
- `miniprogram/utils/cloudData.js`（LOCAL_PROMPTS）
- `miniprogram/utils/dailyContent.js`（LOCAL_PROMPTS_FALLBACK）

在两个文件的本地提示词对象中添加相同的 generate/share 配置。

---

### 步骤7：上传云存储

使用 CloudBase MCP 工具上传 cloudData 目录：
- `cloudData/modules/{moduleId}.json`
- `cloudData/modules/index.json`
- `cloudData/config/homeModules.json`
- `cloudData/modules/homeConfig.json`
- `cloudData/prompts/aiPrompts.json`

---

## 注意事项

1. **内容长度**：AI生成内容统一限制为 200-500 字符
2. **subtitle**：一句话总结统一为 15 字以内
3. **模块ID**：唯一标识，不能与其他模块重复
4. **icon**：使用 iconfont 图标名称或 emoji
5. **fallback**：至少添加 5 条默认内容作为兜底数据
6. **上传后**：客户端需要清除缓存或重新拉取才能生效

---

## ⚠️ 必须：创建云数据库集合

**重要**：每个新增模块需要在云数据库中创建对应的集合，用于存储用户生成的内容。

### 集合命名规范

**格式**：`daily{模块名驼峰}` 或 `{模块ID}`

**示例**：
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

### 创建方式

**方式1：云开发控制台**
1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 进入「云开发」→「数据库」
3. 点击「新建集合」
4. 输入集合名称（按上述规范命名）
5. 设置集合权限

**方式2：MCP 工具**
使用 `writeNoSqlDatabaseStructure` 工具创建集合

### 集合权限配置

建议设置为「仅创建者可读写」或根据业务需求调整：
```json
{
  "read": true,
  "create": true,
  "update": true,
  "delete": true
}
```

---

## 快速检查清单

新增模块前，确认以下内容都已完成：

- [ ] `cloudData/modules/{moduleId}.json` - 模块配置
- [ ] `cloudData/modules/index.json` - 索引注册
- [ ] `cloudData/config/homeModules.json` - 首页配置
- [ ] `cloudData/modules/homeConfig.json` - 布局配置
- [ ] `cloudData/prompts/aiPrompts.json` - AI提示词
- [ ] `miniprogram/utils/cloudData.js` - 本地提示词
- [ ] `miniprogram/utils/dailyContent.js` - 本地提示词
- [ ] 云存储上传完成
- [ ] **云数据库集合已创建**（集合名：`daily{模块名}`）
