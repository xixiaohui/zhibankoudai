// miniprogram/pages/careerCardList/index.js - AI 职业内容生成页面
const { cloudDb, COLLECTIONS } = require('../../utils/cloudDb.js')
const { AI_CONFIG } = require('../../utils/aiConfig.js')
const { careerGuideData } = require('../../utils/careerGuideData.js')

// 构建 careerMap 便于快速查找
const careerMap = {}
if (careerGuideData && careerGuideData.categories) {
  careerGuideData.categories.forEach(cat => {
    if (cat.careers) {
      cat.careers.forEach(career => {
        careerMap[career.id] = career
      })
    }
  })
}

// 云存储配置
const CLOUD_PATH = 'cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/career'

Page({
  data: {
    // 当前 Agent 数据
    agent: null,
    agentId: '',
    
    // 内容列表
    contents: [],
    
    // 加载状态
    isLoading: false,
    isGenerating: false,
    generatingProgress: '',
    
    // 当前输入
    customPrompt: '',
    
    // 提示词模板
    promptTemplates: [
      { id: 'summary', name: '📝 职业简介', template: '请为{careerName}写一段200字的专业简介' },
      { id: 'skill', name: '💡 核心技能', template: '请列举{careerName}最重要的5项核心技能' },
      { id: 'advice', name: '🌟 发展建议', template: '给想从事{careerName}的人3条发展建议' },
      { id: 'question', name: '❓ 常见问题', template: '关于{careerName}，人们常问的5个问题及其解答' },
      { id: 'custom', name: '✨ 自定义', template: '' },
    ],
    selectedTemplate: { id: 'summary', name: '📝 职业简介', template: '请为{careerName}写一段200字的专业简介' },
    customPrompt: '请为该职业写一段200字的专业简介',
  },

  onLoad(options) {
    console.log('【CareerCardList】页面加载', options)
    
    // 初始化云数据库
    this.initCloudDb()
    
    // 获取 Agent 数据
    if (options.id) {
      this.setData({ agentId: options.id })
      this._loadAgent(options.id)
    }
    
    // 加载已有内容
    this.loadContents()
    
    // 设置默认选中的模板
    const defaultTemplate = this.data.promptTemplates[0]
    this.setData({
      selectedTemplate: defaultTemplate,
      customPrompt: defaultTemplate.template.replace('{careerName}', '该职业')
    })
  },

  // 从云存储加载 Agent 数据
  async _loadAgent(agentId) {
    this.setData({ isLoading: true })
    
    console.log('【CareerCardList】开始加载 Agent:', agentId)
    console.log('【CareerCardList】careerMap 大小:', Object.keys(careerMap).length)
    
    // 首先检查本地缓存
    const cached = careerMap[agentId]
    console.log('【CareerCardList】本地缓存:', cached ? '存在' : '不存在')
    
    if (cached) {
      // 先设置本地数据
      this.setData({ 
        agent: cached,
        isLoading: false 
      })
      wx.setNavigationBarTitle({
        title: `${cached.emoji || '🤖'} ${cached.name || cached.nameEn}`
      })
    }
    
    try {
      // 尝试从云存储下载详细数据
      const cloudPath = `${CLOUD_PATH}/${agentId}.json`
      console.log('【CareerCardList】从云存储下载:', cloudPath)
      
      const res = await wx.cloud.downloadFile({
        fileID: cloudPath
      })
      
      const fs = wx.getFileSystemManager()
      const content = fs.readFileSync(res.tempFilePath, 'utf8')
      const cloudData = JSON.parse(content)
      
      console.log('【CareerCardList】云存储数据加载成功:', agentId)
      
      // 合并数据：用云存储数据增强本地数据
      const agent = {
        ...cached,
        ...cloudData,
        id: agentId
      }
      
      this.setData({ agent })
      
      wx.setNavigationBarTitle({
        title: `${agent.emoji || '🤖'} ${agent.name || agent.nameEn}`
      })
      
    } catch (e) {
      console.error('【CareerCardList】云存储加载失败，使用本地数据:', e.message || e)
      // 如果本地没有数据，提示错误
      if (!cached) {
        wx.showToast({ title: '职业数据不存在', icon: 'error' })
      }
    }
  },

  onShow() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 初始化云数据库
  async initCloudDb() {
    try {
      await cloudDb.init()
      console.log('【CareerCardList】云数据库初始化成功')
    } catch (e) {
      console.error('【CareerCardList】云数据库初始化失败:', e)
    }
  },

  // 加载已有内容
  async loadContents() {
    const { agentId } = this.data
    if (!agentId) return
    
    this.setData({ isLoading: true })
    
    try {
      // 从云数据库获取该职业的内容
      const contents = await this._getCareerContents(agentId)
      this.setData({ contents })
    } catch (e) {
      console.error('【CareerCardList】加载内容失败:', e)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 获取职业内容（直接从云数据库）
  async _getCareerContents(careerId) {
    if (!cloudDb.db) {
      await cloudDb.init()
    }
    
    try {
      const openid = await cloudDb.getOpenId()
      
      const result = await cloudDb.db.collection(COLLECTIONS.CAREERS)
        .where({ 
          career: careerId,
          isDeleted: false 
        })
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()
      
      // 处理日期显示
      const contents = result.data.map(item => ({
        ...item,
        createdAtDisplay: this._formatDate(item.createdAt)
      }))
      
      console.log('【CareerCardList】获取职业内容:', contents.length, '条')
      return contents
    } catch (e) {
      console.error('【CareerCardList】获取职业内容失败:', e)
      return []
    }
  },

  // 格式化日期
  _formatDate(date) {
    if (!date) return ''
    try {
      const d = date instanceof Date ? date : new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      return ''
    }
  },

  // 选择提示词模板
  onSelectTemplate(e) {
    const { template } = e.currentTarget.dataset
    const { agent } = this.data
    
    // 替换模板中的占位符
    let prompt = template.template || ''
    if (agent) {
      const careerName = agent.name || agent.nameEn || '该职业'
      prompt = prompt.replace(/\{careerName\}/g, careerName)
    }
    
    this.setData({ 
      selectedTemplate: template,
      customPrompt: prompt
    })
  },

  // 输入自定义提示词
  onPromptInput(e) {
    this.setData({ customPrompt: e.detail.value })
  },

  // 构建 AI 提示词
  _buildPrompt(agent, userPrompt) {
    const name = agent.name || agent.nameEn || agent.id
    const description = agent.description || agent.descriptionEn || ''
    const expertise = (agent.expertise || []).join(', ')
    const coreMission = (agent.coreMission || []).join('\n')

    return `你是一位专业的${name}。

## 职业信息
${description}

## 核心职责
${coreMission}

## 专业领域
${expertise}

## 用户需求
${userPrompt}

## 要求
1. 生成的内容必须至少 250 个中文字符
2. 内容要专业、详细、有深度
3. 使用 Markdown 格式组织内容
4. 用中文回答`
  },

  // 调用 AI 生成内容
  async _callAI(prompt) {
    console.log('【CareerCardList】调用 AI 生成内容...')
    console.log('【CareerCardList】Prompt 长度:', prompt.length)
    
    let fullText = ''
    
    try {
      // 创建模型实例
      const aiModel = wx.cloud.extend.AI.createModel(AI_CONFIG.provider)
      
      // 使用流式生成
      const res = await aiModel.streamText({
        data: {
          model: AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 2500,
        }
      })
      
      console.log('【CareerCardList】开始接收流式响应...')
      
      // 使用 for await 处理流式响应
      for await (const event of res.eventStream) {
        if (event.data === '[DONE]') break
        
        try {
          const data = JSON.parse(event.data)
          const text = data?.choices?.[0]?.delta?.content
          if (text) {
            fullText += text
            this.setData({ generatingProgress: `已生成 ${fullText.length} 字...` })
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      console.log('【CareerCardList】AI 生成完成，总字数:', fullText.length)
      return fullText
      
    } catch (err) {
      console.error('【CareerCardList】AI 生成错误:', err)
      throw err
    }
  },

  // 生成单条内容
  async onGenerateOne() {
    const { agent, customPrompt } = this.data
    
    if (!agent) {
      wx.showToast({ title: '缺少职业数据', icon: 'error' })
      return
    }
    
    if (!customPrompt.trim()) {
      wx.showToast({ title: '请输入提示词', icon: 'error' })
      return
    }
    
    this.setData({ isGenerating: true, generatingProgress: '正在生成...' })
    
    try {
      // 构建提示词
      const prompt = this._buildPrompt(agent, customPrompt)
      
      // 调用 AI
      const response = await this._callAI(prompt)
      
      if (!response || !response.trim()) {
        wx.showToast({ title: '生成内容为空', icon: 'error' })
        return
      }
      
      // 保存到云端
      const result = await cloudDb.db.collection(COLLECTIONS.CAREERS).add({
        data: {
          openid: await cloudDb.getOpenId(),
          title: this._extractTitle(customPrompt),
          content: response.trim(),
          career: agent.id,
          careerName: agent.name || agent.nameEn,
          careerEmoji: agent.emoji || '🤖',
          prompt: customPrompt,
          isAIGenerated: true,
          createdAt: cloudDb.db.serverDate(),
          isDeleted: false,
        }
      })
      
      if (result._id) {
        wx.showToast({ title: '生成成功', icon: 'success' })
        // 清空输入
        this.setData({ customPrompt: '', selectedTemplate: null })
        // 刷新列表
        await this.loadContents()
      } else {
        wx.showToast({ title: '保存失败', icon: 'error' })
      }
      
    } catch (e) {
      console.error('【CareerCardList】生成内容失败:', e)
      wx.showToast({ title: '生成失败: ' + (e.message || '未知错误'), icon: 'error' })
    } finally {
      this.setData({ isGenerating: false, generatingProgress: '' })
    }
  },

  // 从提示词提取标题
  _extractTitle(prompt) {
    // 去掉常见前缀
    let title = prompt
      .replace(/^请为[^\s]+\s*/, '')
      .replace(/^请列举[^\s]+\s*/, '')
      .replace(/^给[^\s]+\s*/, '')
      .replace(/^关于[^\s]+\s*/, '')
      .replace(/^[\u4e00-\u9fa5]+[^\u4e00-\u9fa5]*/, '')
    
    // 截取前20个字符
    if (title.length > 20) {
      title = title.substring(0, 20) + '...'
    }
    
    return title || 'AI 生成内容'
  },

  // 查看内容详情
  onContentTap(e) {
    const { content } = e.currentTarget.dataset
    if (!content) return
    
    wx.showModal({
      title: content.title,
      content: content.content,
      showCancel: true,
      confirmText: '复制',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: `${content.title}\n\n${content.content}`,
            success: () => {
              wx.showToast({ title: '已复制', icon: 'success' })
            }
          })
        }
      }
    })
  },

  // 跳转到海报页
  onGoPoster(e) {
    const { content } = e.currentTarget.dataset
    if (!content) return
    
    // 使用 JSON 字符串传递，避免长内容编码问题
    const posterData = {
      title: content.title || 'AI 生成内容',
      content: content.content || '',
      subtitle: content.careerName ? `${content.careerEmoji || '🤖'} ${content.careerName}` : '',
      icon: content.careerEmoji || '🤖',
      moduleName: 'AI 职业指南'
    }
    
    wx.navigateTo({
      url: `/pages/poster/index?data=${encodeURIComponent(JSON.stringify(posterData))}`
    })
  },

  // 刷新内容
  onRefresh() {
    this.loadContents()
  },

  // 分享
  onShareAppMessage() {
    const { agent } = this.data
    return {
      title: `${agent?.emoji || '🤖'} ${agent?.name || '职业指南'} - AI 生成内容`,
      path: `/pages/careerCardList/index?id=${this.data.agentId}`
    }
  },
})
