// pages/careerChat/index.js - 职业助手聊天页面
const app = getApp()
const util = require('../../utils/util.js')
const { AI_CONFIG } = require('../../utils/aiConfig.js')
const { PocketMemory } = require('../../utils/memory.js')
const { cloudDb, COLLECTIONS } = require('../../utils/cloudDb.js')

// 最大对话历史长度
const MAX_HISTORY = 30

// 当前流式回复的ID
let streamingMessageId = null

// 记忆管理器实例
let memoryManager = null

Page({
  data: {
    // 导航栏高度
    navBarHeight: 20,
    
    // 当前职业信息
    career: null,
    careerName: '',
    
    // 对话相关
    messages: [],
    inputValue: '',
    isAIThinking: false,
    
    // 流式输出
    isStreaming: false,
    
    // UI状态
    scrollTop: 0,
    scrollIntoView: '',
    showDateDivider: false,
    currentDate: '',
    
    // 菜单状态
    showMenu: false,
    
    // 用户记忆
    userMemory: null,
  },

  onLoad(options) {
    console.log('【CareerChat】页面加载', options)
    
    // 解析职业信息
    if (options.careerName) {
      this.setData({ careerName: decodeURIComponent(options.careerName) })
    }
    
    // 初始化云数据库
    this.initCloudDb()
    
    // 初始化智能记忆管理器
    memoryManager = new PocketMemory()
    
    // 加载对话历史
    this.loadChatHistory()
    
    // 加载用户记忆
    this.loadUserMemory()
    
    // 设置当前日期
    this.setData({
      currentDate: util.formatDateDisplay(new Date().toISOString().split('T')[0])
    })
  },

  // 初始化云数据库
  async initCloudDb() {
    try {
      await cloudDb.init()
      console.log('【CareerChat】云数据库初始化成功')
    } catch (e) {
      console.log('【CareerChat】云数据库初始化失败，使用本地存储')
    }
  },

  onShow() {
    console.log('【CareerChat】页面显示')
    
    // 清理残留的流式状态
    const messages = this.data.messages.map(msg => {
      if (msg.isStreaming) {
        return { ...msg, isStreaming: false }
      }
      return msg
    })
    
    if (messages.length !== this.data.messages.length) {
      this.setData({ messages })
      this.saveMessagesToStorage(messages)
    }
  },

  onHide() {
    console.log('【CareerChat】页面隐藏')
    const messages = this.data.messages.map(msg => {
      if (msg.isStreaming) {
        return { ...msg, isStreaming: false }
      }
      return msg
    })
    this.saveMessagesToStorage(messages)
  },

  onUnload() {
    wx.hideKeyboard()
  },

  // 文本框获取焦点 - 滚动到底部
  onTextareaFocus() {
    setTimeout(() => this.scrollToBottom(true), 100)
  },

  // 文本框失去焦点
  onTextareaBlur() {
    // nothing to do
  },

  // 切换菜单显示
  toggleMenu() {
    this.setData({ showMenu: !this.data.showMenu })
  },

  // 查看记忆
  onViewMemory() {
    this.setData({ showMenu: false })
    wx.navigateTo({ url: '/pages/memory/index' })
  },

  // 加载对话历史
  loadChatHistory() {
    const careerName = this.data.careerName
    const storageKey = careerName ? `careerChatHistory_${careerName}` : 'careerChatHistory'
    let history = wx.getStorageSync(storageKey) || []
    console.log('【CareerChat】加载历史记录:', history.length, '条')
    
    // 过滤掉残留的流式消息
    history = history.filter(msg => {
      if (msg.isStreaming) {
        console.log('【CareerChat】过滤残留流式消息:', msg.id)
        return false
      }
      return true
    })
    
    wx.setStorageSync(storageKey, history)
    
    const recentHistory = history.slice(-MAX_HISTORY)
    this.setData({ 
      messages: recentHistory,
      isLoading: false
    })
    
    if (recentHistory.length > 0) {
      const lastDate = recentHistory[recentHistory.length - 1].date || ''
      this.setData({ 
        showDateDivider: true,
        currentDate: lastDate ? util.formatDateDisplay(lastDate) : util.formatDateDisplay(new Date().toISOString().split('T')[0])
      })
    }
    
    // 如果是新对话，发送欢迎消息
    if (recentHistory.length === 0) {
      setTimeout(() => this.sendWelcomeMessage(), 300)
    } else {
      setTimeout(() => this.scrollToBottom(true), 100)
    }
  },

  // 加载用户记忆
  loadUserMemory() {
    const profile = wx.getStorageSync('userProfile') || {}
    const shortTerm = wx.getStorageSync('shortTermMemory') || {}
    const stats = wx.getStorageSync('stats') || {}
    
    const pendingGoals = (shortTerm.currentGoals || []).filter(g => !g.completed)
    
    this.setData({
      userMemory: {
        nickname: profile.nickname || '朋友',
        recentMood: shortTerm.recentMood ? shortTerm.recentMood[0] : null,
        pendingGoals: pendingGoals,
        consecutiveDays: stats.consecutiveDays || 0,
      }
    })
    
    console.log('【CareerChat】用户记忆已加载:', this.data.userMemory)
  },

  // 发送欢迎消息
  sendWelcomeMessage() {
    const { careerName, userMemory } = this.data
    const name = userMemory?.nickname || '朋友'
    
    const hour = new Date().getHours()
    let timeGreeting = ''
    if (hour >= 5 && hour < 12) {
      timeGreeting = '上午好'
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = '下午好'
    } else {
      timeGreeting = '晚上好'
    }
    
    let welcomeText = ''
    if (careerName) {
      welcomeText = `${timeGreeting} ${name}！\n\n我是职业发展助手，专门帮助你了解和分析「${careerName}」这个职业。\n\n你可以问我：\n• 这个职业具体做什么？\n• 需要哪些技能和素质？\n• 发展前景和薪资如何？\n• 如何入行和提升？\n\n有什么想了解的吗？`
    } else {
      welcomeText = `${timeGreeting} ${name}！\n\n我是职业发展助手，可以帮你：\n• 了解不同职业的特点\n• 分析职业发展前景\n• 规划职业成长路径\n• 解答职业困惑\n\n你目前对哪个职业感兴趣呢？`
    }

    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: welcomeText,
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      uniqueId: `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    this.addMessage(welcomeMessage)
  },

  // 保存消息到存储
  saveMessagesToStorage(messages) {
    try {
      const storageKey = this.data.careerName ? `careerChatHistory_${this.data.careerName}` : 'careerChatHistory'
      const recentMessages = messages.slice(-50)
      wx.setStorageSync(storageKey, recentMessages)
    } catch (e) {
      console.error('【CareerChat】保存消息失败:', e)
    }
  },

  // 添加消息
  addMessage(message) {
    console.log('【CareerChat】添加消息:', message.type, message.content.substring(0, 30))
    const messages = [...this.data.messages, message]
    this.setData({ messages })
    
    const storageKey = this.data.careerName ? `careerChatHistory_${this.data.careerName}` : 'careerChatHistory'
    const history = wx.getStorageSync(storageKey) || []
    history.push(message)
    if (history.length > 100) history.shift()
    wx.setStorageSync(storageKey, history)
    
    if (message.type === 'user') {
      app.updateChatStats()
    }
    
    setTimeout(() => this.scrollToBottom(), 150)
  },

  // 输入处理
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 发送消息
  onSend() {
    const content = this.data.inputValue.trim()
    console.log('【CareerChat】点击发送, 内容:', content)
    
    if (!content) return
    if (this.data.isAIThinking) return
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content,
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      uniqueId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    this.setData({ inputValue: '', isAIThinking: true })
    this.addMessage(userMessage)
    
    // 获取历史消息
    const allMessages = this.data.messages
    const history = allMessages.slice(-9, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
    
    console.log('【CareerChat】历史消息:', history.length, '条')
    
    this.callAIStream(content, history)
  },

  // 调用AI
  async callAIStream(userMessage, history) {
    const { careerName, userMemory } = this.data
    const userName = userMemory?.nickname || '朋友'
    
    // 创建AI消息占位
    const aiMessageId = Date.now() + 1
    streamingMessageId = aiMessageId
    const aiUniqueId = `ai_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`
    
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      uniqueId: aiUniqueId,
      isStreaming: true
    }
    
    this.addMessage(aiMessage)
    this.setData({ isStreaming: true })
    
    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(careerName, userName)
    
    // 构建完整消息
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map(m => ({ 
        role: m.role || (m.type === 'user' ? 'user' : 'assistant'), 
        content: String(m.content || '').trim() 
      })),
      { role: "user", content: String(userMessage || '').trim() }
    ]
    
    console.log('【CareerChat】system prompt:', systemPrompt.substring(0, 100))
    console.log('【CareerChat】messages数量:', messagesWithSystem.length)
    
    let res = null
    
    try {
      res = await wx.cloud.extend.AI.createModel(AI_CONFIG.provider).streamText({
        data: {
          model: AI_CONFIG.model,
          messages: messagesWithSystem,
        }
      });
      console.log('【CareerChat】AI调用成功!')
    } catch (err) {
      console.error('【CareerChat】AI调用失败:', err.message || err)
      const localReply = this.generateLocalResponse(userMessage, careerName)
      this.finishStreamingMessage(aiMessageId, localReply, true)
      return
    }
    
    // 处理流式响应
    try {
      for await (const event of res.eventStream) {
        if (event.data === '[DONE]') {
          break;
        }

        const data = JSON.parse(event.data);

        // 跳过思考内容
        const think = data?.choices?.[0]?.delta?.reasoning_content;
        if (think) {
          continue;
        }

        // 获取正文内容
        const text = data?.choices?.[0]?.delta?.content;
        if (text) {
          if (streamingMessageId === aiMessageId) {
            this.updateStreamingMessage(aiMessageId, text, true)
          }
        }
      }

      console.log('【CareerChat】AI回复完成')
      this.finishStreamingMessage(aiMessageId)
    } catch (err) {
      console.error('【CareerChat】流式处理失败:', err);
      const localReply = this.generateLocalResponse(userMessage, careerName)
      this.finishStreamingMessage(aiMessageId, localReply, true)
    }
  },

  // 构建职业助手系统提示词
  buildSystemPrompt(careerName, userName) {
    let prompt = `你是专业的职业发展顾问助手，名字叫"智职业"。

你的职责是帮助用户了解和分析职业，提供专业、实用、有价值的职业建议。

沟通风格：
• 专业但不晦涩，用通俗易懂的语言解释职业知识
• 温暖友好，像一位值得信赖的职业导师
• 回答有条理，适当使用emoji增加可读性
• 根据用户的问题，给出具体可操作的建议

你可以帮助用户：
1. 分析职业的工作内容、技能要求、发展路径
2. 提供行业趋势和就业前景分析
3. 给出学习建议和入行指南
4. 解答职业发展中的困惑和疑问

注意事项：
• 如果用户询问的职业你不了解，可以坦诚说明并提供一般性建议
• 不要编造具体的薪资数据，可以说"一般而言"或"视情况而定"
• 鼓励用户结合自身兴趣和能力做出职业选择
• 如果用户提到职业名称，尽量给出有针对性的分析`

    // 注入记忆上下文
    if (memoryManager) {
      const memoryContext = memoryManager.buildAIControlContext()
      prompt += memoryContext
    }
    
    return prompt
  },

  // 更新流式消息
  updateStreamingMessage(msgId, newText, append = false) {
    const messages = this.data.messages
    const index = messages.findIndex(m => m.id === msgId)
    
    if (index !== -1) {
      if (append) {
        messages[index].content += newText
      } else {
        messages[index].content = newText
      }
      this.setData({ messages })
      this.scrollToBottom(true)
    }
  },

  // 完成流式消息
  finishStreamingMessage(msgId, content, useLocal = false) {
    const messages = this.data.messages
    const index = messages.findIndex(m => m.id === msgId)
    
    // 获取AI回复前的用户消息
    const userIndex = index - 1
    const userMessage = userIndex >= 0 ? messages[userIndex] : null
    
    if (index !== -1) {
      if (content !== undefined) {
        messages[index].content = content
      }
      messages[index].isStreaming = false
      
      // 保存到历史
      const storageKey = this.data.careerName ? `careerChatHistory_${this.data.careerName}` : 'careerChatHistory'
      const history = wx.getStorageSync(storageKey) || []
      history.push({ ...messages[index] })
      if (history.length > 100) history.shift()
      wx.setStorageSync(storageKey, history)
      
      this.setData({ 
        messages,
        isAIThinking: false,
        isStreaming: false,
      })
      
      this.scrollToBottom(true)
      streamingMessageId = null
      
      // 智能记忆学习
      if (userMessage && userMessage.type === 'user' && memoryManager) {
        memoryManager.learnFromConversation(userMessage.content, content)
        console.log('【CareerChat】记忆学习完成')
      }
    }
  },

  // 本地降级回复
  generateLocalResponse(userContent, careerName) {
    const lowerMsg = userContent.toLowerCase()
    
    if (/^[嗨嗨?]*hi|hey|你好|您好/.test(lowerMsg)) {
      return careerName ? `你好！关于「${careerName}」这个职业，有什么想了解的吗？` : '你好！请问你对哪个职业感兴趣呢？'
    }
    if (/^早(上)?好/.test(lowerMsg)) return careerName ? `早！今天我们来聊聊「${careerName}」吧，有什么问题吗？` : '早！有什么职业想了解的吗？'
    if (/晚安|谢谢/.test(lowerMsg)) return '很高兴能帮到你！有需要随时问我~'
    if (/吗|？/.test(userContent)) return careerName ? `关于「${careerName}」，你可以具体说说想了解哪方面吗？比如工作内容、技能要求、发展前景等。` : '你可以告诉我感兴趣的职业名称，我来帮你分析~'
    
    const replies = [
      '这个问题很有深度，让我来帮你分析一下...',
      '关于这个职业，我有一些建议给你...',
      '好的，让我从专业角度给你一些参考...',
      '这个话题很有意思，我们来详细聊聊...',
    ]
    
    return replies[Math.floor(Math.random() * replies.length)]
  },

  scrollToBottom(immediate = false) {
    if (immediate) {
      this.setData({ scrollTop: 99999 })
    } else {
      this.setData({ scrollIntoView: 'msg-bottom' })
      setTimeout(() => {
        this.setData({ scrollIntoView: '' })
      }, 400)
    }
  },

  // 快捷问题点击
  onQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    if (!question || this.data.isAIThinking) return
    
    this.setData({ inputValue: question })
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      uniqueId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    this.setData({ inputValue: '', isAIThinking: true })
    this.addMessage(userMessage)
    
    // 获取历史消息
    const allMessages = this.data.messages
    const history = allMessages.slice(-9, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
    
    this.callAIStream(question, history)
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/careerGuide/index' })
      }
    })
  },

  // 清空对话
  onClearChat() {
    this.setData({ showMenu: false })
    wx.showModal({
      title: '清空对话',
      content: '确定要清空当前对话吗？',
      confirmColor: '#6192D6',
      success: (res) => {
        if (res.confirm) {
          const storageKey = this.data.careerName ? `careerChatHistory_${this.data.careerName}` : 'careerChatHistory'
          this.setData({ messages: [], showDateDivider: false })
          wx.removeStorageSync(storageKey)
          setTimeout(() => this.sendWelcomeMessage(), 300)
        }
      }
    })
  },

  // 分享给好友
  onShareApp() {
    this.setData({ showMenu: false })
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { careerName } = this.data
    return {
      title: careerName ? `关于「${careerName}」的职业问答` : '职业发展助手 - 智伴AI',
      imageUrl: '/images/share-cover.png',
      query: 'from=careerChat'
    }
  },

  // 页面分享配置
  onShareAppMessage() {
    const { careerName } = this.data
    return {
      title: careerName ? `关于「${careerName}」的职业问答` : '职业发展助手 - 智伴AI',
      path: '/pages/careerChat/index',
      imageUrl: '/images/share-cover.png',
      desc: '专业的职业发展顾问助手，帮你了解和分析职业~'
    }
  },

  formatTimeDisplay(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr.replace(/-/g, '/'))
    return util.formatTimeDisplay(date)
  },
})
