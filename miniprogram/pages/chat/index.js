// pages/chat/index.js - 陪伴对话页面
const app = getApp()
const util = require('../../utils/util.js')
const { SYSTEM_PROMPTS, AI_CONFIG } = require('../../utils/aiConfig.js')
const { PocketMemory } = require('../../utils/memory.js')
const { cloudDb } = require('../../utils/cloudDb.js')

// 最大对话历史长度
const MAX_HISTORY = 30

// 当前流式回复的ID
let streamingMessageId = null

// 记忆管理器实例
let memoryManager = null

// 云数据库实例
let cloudDbInstance = null

Page({
  data: {
    // 导航栏高度
    navBarHeight: 20,
    
    // 对话模式
    mode: 'chat',
    modeName: '随便聊',
    modeIcon: '☕',
    modeColor: '#FFCA28',
    
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
    
    // 模式列表
    chatModes: [
      { id: 'comfort', name: '安慰', icon: '🤗', color: '#F472B6' },
      { id: 'reflect', name: '理清', icon: '💭', color: '#34D399' },
      { id: 'action', name: '督促', icon: '💪', color: '#60A5FA' },
      { id: 'chat', name: '闲聊', icon: '☕', color: '#FFCA28' },
      { id: 'night', name: '夜深', icon: '🌙', color: '#A78BFA' },
      { id: 'study', name: '学习', icon: '📚', color: '#2DD4BF' },
      { id: 'creative', name: '脑洞', icon: '🎨', color: '#FB923C' },
    ],
    
    // 用户记忆
    userMemory: null,
  },

  onLoad(options) {
    console.log('【Chat】页面加载', options)
    
    // 初始化云数据库
    this.initCloudDb()
    
    // 初始化智能记忆管理器
    memoryManager = new PocketMemory()
    
    // 从参数获取模式
    if (options.mode) {
      const modeInfo = this.getModeById(options.mode)
      this.setData({
        mode: options.mode,
        modeName: modeInfo.name,
        modeIcon: modeInfo.icon,
        modeColor: modeInfo.color,
      })
    }

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
      cloudDbInstance = cloudDb
      await cloudDbInstance.init()
      console.log('【Chat】云数据库初始化成功')
      
      // 尝试同步本地消息到云端
      const localMessages = wx.getStorageSync('chatHistory') || []
      if (localMessages.length > 0) {
        await cloudDbInstance.syncMessagesToCloud(localMessages)
      }
    } catch (e) {
      console.log('【Chat】云数据库初始化失败，使用本地存储')
    }
  },

  onShow() {
    console.log('【Chat】页面显示')
    
    // 清理残留的流式状态（防止重复显示等待样式）
    const messages = this.data.messages.map(msg => {
      if (msg.isStreaming) {
        return { ...msg, isStreaming: false }
      }
      return msg
    })
    
    if (messages.length !== this.data.messages.length) {
      this.setData({ messages })
      // 同时更新 storage
      this.saveMessagesToStorage(messages)
    }
  },

  onHide() {
    console.log('【Chat】页面隐藏')
    // 确保流式状态被清理
    const messages = this.data.messages.map(msg => {
      if (msg.isStreaming) {
        return { ...msg, isStreaming: false }
      }
      return msg
    })
    this.saveMessagesToStorage(messages)
  },

  // 获取模式信息
  getModeById(modeId) {
    const mode = this.data.chatModes.find(m => m.id === modeId)
    return mode || this.data.chatModes[3]
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

  // 关于
  onAbout() {
    this.setData({ showMenu: false })
    wx.showModal({
      title: '关于智伴AI',
      content: '智伴AI - 您的智能陪伴助手\n\n版本: 1.0.0\n\n随时随地，陪伴左右',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 加载对话历史
  loadChatHistory() {
    let history = wx.getStorageSync('chatHistory') || []
    console.log('【Chat】加载历史记录:', history.length, '条')
    
    // 过滤掉残留的流式消息（isStreaming: true）
    history = history.filter(msg => {
      if (msg.isStreaming) {
        console.log('【Chat】过滤残留流式消息:', msg.id)
        return false
      }
      return true
    })
    
    // 保存清理后的历史
    wx.setStorageSync('chatHistory', history)
    
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
      // 有历史记录，滚动到最新消息
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
    
    console.log('【Chat】用户记忆已加载:', this.data.userMemory)
  },

  // 发送欢迎消息
  sendWelcomeMessage() {
    const { mode, userMemory } = this.data
    const name = userMemory?.nickname || '朋友'
    
    const hour = new Date().getHours()
    let timeGreeting = ''
    if (hour >= 5 && hour < 12) {
      timeGreeting = '早'
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = '下午好'
    } else {
      timeGreeting = '晚上好'
    }
    
    let welcomeText = ''
    switch(mode) {
      case 'comfort':
        const comfortOpenings = [`嘿 ${name}，我在了`, `${name}~ 我在呢`, `来找我了啊，我一直在`]
        welcomeText = comfortOpenings[Math.floor(Math.random() * comfortOpenings.length)]
        break
      case 'reflect':
        const reflectOpenings = [`${name}，想理理什么事？`, `${name}，我在听`, `准备好了吗？慢慢说`]
        welcomeText = reflectOpenings[Math.floor(Math.random() * reflectOpenings.length)]
        break
      case 'action':
        const actionOpenings = [`动起来！${name}`, `${name}，准备好了吗`, `来，开干！`]
        welcomeText = actionOpenings[Math.floor(Math.random() * actionOpenings.length)]
        break
      case 'night':
        const nightOpenings = [`${name}，夜深了`, `${name}~ 这么晚还没睡？`, `嘿 ${name}，我陪你`]
        welcomeText = nightOpenings[Math.floor(Math.random() * nightOpenings.length)]
        break
      case 'study':
        const studyOpenings = [`学习时间到 ${name}！`, `${name}，有什么想问的？`, `${name}~准备好学习了吗`]
        welcomeText = studyOpenings[Math.floor(Math.random() * studyOpenings.length)]
        break
      case 'creative':
        const creativeOpenings = [`${name}！来开脑洞吧`, `嘿 ${name}，想聊点什么脑洞大开的事？`, `${name}~准备好创意爆发了吗`]
        welcomeText = creativeOpenings[Math.floor(Math.random() * creativeOpenings.length)]
        break
      default:
        const chatOpenings = [`${timeGreeting} ${name}`, `${name}！来啦~`, `${name}~ ${timeGreeting}`, `嘿 ${name}，想聊啥？`]
        welcomeText = chatOpenings[Math.floor(Math.random() * chatOpenings.length)]
    }
    
    if (userMemory?.recentMood && mode === 'comfort') {
      const moodEmoji = util.getMoodEmoji(userMemory.recentMood.mood)
      welcomeText += `\n\n看到你心情有点${userMemory.recentMood.mood}${moodEmoji}`
    }

    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: welcomeText,
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      mode: mode,
      uniqueId: `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    this.addMessage(welcomeMessage)
  },

  // 保存消息到存储
  saveMessagesToStorage(messages) {
    try {
      // 只保存最近的消息
      const recentMessages = messages.slice(-50)
      wx.setStorageSync('chatHistory', recentMessages)
    } catch (e) {
      console.error('【Chat】保存消息失败:', e)
    }
  },

  // 添加消息
  addMessage(message) {
    console.log('【Chat】添加消息:', message.type, message.content.substring(0, 30))
    const messages = [...this.data.messages, message]
    this.setData({ messages })
    
    const history = wx.getStorageSync('chatHistory') || []
    history.push(message)
    if (history.length > 100) history.shift()
    wx.setStorageSync('chatHistory', history)
    
    // 同时保存到云端
    if (cloudDbInstance) {
      cloudDbInstance.saveMessage(message).catch(e => {
        console.log('【Chat】云端保存消息失败，将在下一次同步')
      })
    }
    
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
    console.log('【Chat】点击发送, 内容:', content)
    
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
    
    // 获取历史消息（不含刚发的用户消息，取最近8条）
    const allMessages = this.data.messages
    const history = allMessages.slice(-9, -1).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
    
    console.log('【Chat】历史消息:', history.length, '条')
    
    this.callAIStream(content, history)
  },

  // 调用AI
  async callAIStream(userMessage, history) {
    const { mode, userMemory } = this.data
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
      mode: mode,
      uniqueId: aiUniqueId,
      isStreaming: true
    }
    
    this.addMessage(aiMessage)
    this.setData({ isStreaming: true })
    
    // 构建消息（带 system prompt）
    const messagesWithSystem = this.buildMessages(userMessage, mode, userName, history)
    console.log('【Chat】带system的messages数量:', messagesWithSystem.length)
    
    // 尝试不带 system prompt 的简单消息
    const simpleMessages = [
      ...(history ? history.slice(-3).map(m => ({
        role: m.role || (m.type === 'user' ? 'user' : 'assistant'),
        content: String(m.content || '').trim()
      })) : []),
      { role: "user", content: String(userMessage || '').trim() }
    ]
    console.log('【Chat】简化messages数量:', simpleMessages.length)
    
    console.log('【Chat】开始调用AI...')
    
    let res = null
    
    try {
      // 方案1：尝试带 system prompt
      console.log('【Chat】尝试方案1: 带system prompt')
      res = await wx.cloud.extend.AI.createModel(AI_CONFIG.provider).streamText({
        data: {
          model: AI_CONFIG.model,
          messages: messagesWithSystem,
        }
      });
      console.log('【Chat】方案1成功!')
    } catch (err1) {
      console.error('【Chat】方案1失败:', err1.message || err1)
      
      try {
        // 方案2：尝试不带 system prompt
        console.log('【Chat】尝试方案2: 不带system prompt')
        res = await wx.cloud.extend.AI.createModel(AI_CONFIG.provider).streamText({
          data: {
            model: AI_CONFIG.model,
            messages: simpleMessages,
          }
        });
        console.log('【Chat】方案2成功!')
      } catch (err2) {
        console.error('【Chat】方案2也失败:', err2.message || err2)
        console.error('【Chat】所有方案都失败了，使用本地回复')
        const localReply = this.generateLocalResponse(userMessage, mode)
        this.finishStreamingMessage(aiMessageId, localReply, true)
        return
      }
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
          console.log('【AI思考】:', think.substring(0, 50));
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

      console.log('【Chat】AI回复完成')
      this.finishStreamingMessage(aiMessageId)
    } catch (err) {
      console.error('【Chat】流式处理失败:', err);
      const localReply = this.generateLocalResponse(userMessage, mode)
      this.finishStreamingMessage(aiMessageId, localReply, true)
    }
  },

  // 构建对话消息
  buildMessages(userMsg, mode, userName, history) {
    const modeConfig = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat
    let systemPrompt = typeof modeConfig === 'string' ? modeConfig : (modeConfig?.prompt || '你是智伴，用户的朋友。')
    
    // 清理 system prompt 中的特殊字符
    systemPrompt = systemPrompt.replace(/\x00-\x1F/g, '').trim()
    
    // 注入智能记忆上下文
    if (memoryManager) {
      const memoryContext = memoryManager.buildAIControlContext()
      systemPrompt += memoryContext
    }
    
    // 限制 system prompt 总长度
    const MAX_PROMPT_LENGTH = 1500
    if (systemPrompt.length > MAX_PROMPT_LENGTH) {
      systemPrompt = systemPrompt.substring(0, MAX_PROMPT_LENGTH)
      console.log('【Chat】system prompt 已截断至', MAX_PROMPT_LENGTH, '字符')
    }
    
    const messages = [
      { role: "system", content: systemPrompt }
    ]
    
    console.log('【Chat】system prompt 长度:', systemPrompt.length, '字符')

    // 添加对话历史（最近6轮）
    if (history && history.length > 0) {
      history.slice(-6).forEach(msg => {
        const content = String(msg.content || '').trim()
        if (content) {
          messages.push({ 
            role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'), 
            content: content 
          })
        }
      })
    }
    
    // 确保 userMsg 是字符串
    const userContent = String(userMsg || '').trim()
    messages.push({ role: "user", content: userContent })
    
    return messages
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
      // 流式输出时使用立即滚动，确保跟上输入速度
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
      const history = wx.getStorageSync('chatHistory') || []
      history.push({ ...messages[index] })
      if (history.length > 100) history.shift()
      wx.setStorageSync('chatHistory', history)
      
      this.setData({ 
        messages,
        isAIThinking: false,
        isStreaming: false,
      })
      
      // 完成后也滚动一次确保可见
      this.scrollToBottom(true)
      
      streamingMessageId = null
      
      // 智能记忆学习
      if (userMessage && userMessage.type === 'user' && memoryManager) {
        memoryManager.learnFromConversation(userMessage.content, content)
        console.log('【Chat】记忆学习完成')
        
        // 如果是目标模式，提取目标
        if (this.data.mode === 'action' && userMessage.content.includes('想')) {
          memoryManager.addGoal(userMessage.content)
        }
      }
    }
    
    // 反思模式保存重要内容
    if (this.data.mode === 'reflect' && content && content.length > 15) {
      app.addShortTermEvent(content, this.data.userMemory?.recentMood?.mood || '')
    }
  },

  // 本地降级回复
  generateLocalResponse(userContent, mode) {
    const lowerMsg = userContent.toLowerCase()
    
    if (/^[嗨嗨?]*hi|hey|你好|您好/.test(lowerMsg)) {
      return [`嗨~`, `嘿！`, `来啦~`][Math.floor(Math.random() * 3)]
    }
    if (/^早(上)?好/.test(lowerMsg)) return '早啊！今天怎么样？'
    if (/晚安|睡了|睡觉/.test(lowerMsg)) return '晚安~ 好梦哦 🌙'
    
    if (/开心|高兴|快乐/.test(lowerMsg)) return '发生什么好事了？说来听听 🎉'
    if (/难过|伤心|难受/.test(lowerMsg)) return mode === 'comfort' ? '嗯，我在听着。怎么了？' : '怎么啦？我在呢'
    if (/压力|焦虑|担心/.test(lowerMsg)) return '我懂那种感觉...是因为什么事呢？'
    if (/累|困|疲惫/.test(lowerMsg)) return '辛苦啦！今天忙什么了？'
    
    if (/吃饭|吃了/.test(lowerMsg)) return '吃了什么好吃的？'
    if (/工作|上班/.test(lowerMsg)) return '今天工作顺利吗？'
    if (/学习|考试/.test(lowerMsg)) return '复习得怎么样了？'
    if (/谢谢|感谢/.test(lowerMsg)) return '能帮到你我也很开心~'
    
    if (/吗|？/.test(userContent)) {
      if (mode === 'reflect') return '你觉得呢？'
      return '这个问题我也说不太准...你怎么看呢？'
    }
    
    const replies = {
      comfort: ['嗯嗯，继续说', '我在呢', '这样啊...', '然后呢？'],
      reflect: ['你觉得呢？', '然后呢？', '还有吗？'],
      action: ['走！做起来！', '先从哪开始？', '我陪你！'],
      chat: ['哦哦，是吗？', '然后呢？', '嗯嗯，说下去'],
    }
    
    const list = replies[mode] || replies.chat
    return list[Math.floor(Math.random() * list.length)]
  },

  // 选择模式（顶部标签点击）
  onSelectMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.mode) return
    
    const modeInfo = this.getModeById(mode)
    
    this.setData({
      mode: mode,
      modeName: modeInfo.name,
      modeIcon: modeInfo.icon,
      modeColor: modeInfo.color,
    })
    
    const profile = wx.getStorageSync('userProfile') || {}
    profile.lastChatMode = mode
    wx.setStorageSync('userProfile', profile)
    
    const modeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `已切换到${modeInfo.name}模式 ${modeInfo.icon}\n开始新的对话吧~`,
      time: util.formatTime(new Date()),
      date: new Date().toISOString().split('T')[0],
      mode: mode,
      uniqueId: `mode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    
    // 清空历史并发送模式切换消息
    this.setData({ messages: [] })
    wx.setStorageSync('chatHistory', [])
    this.addMessage(modeMessage)
  },

  onClearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空当前对话吗？',
      confirmColor: '#6366F1',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] })
          wx.setStorageSync('chatHistory', [])
          setTimeout(() => this.sendWelcomeMessage(), 300)
          wx.showToast({ title: '对话已清空', icon: 'success' })
        }
      }
    })
  },

  scrollToBottom(immediate = false) {
    if (immediate) {
      // 立即滚动：使用 scroll-top 设置一个很大的值
      this.setData({ scrollTop: 99999 })
    } else {
      // 使用 scroll-into-view 更平滑地滚动
      this.setData({ scrollIntoView: 'msg-bottom' })
      setTimeout(() => {
        this.setData({ scrollIntoView: '' })
      }, 400)
    }
  },

  // 滚动到顶部
  onScrollUpper() {
    // 可以实现加载更多历史消息
  },

  // 返回主页面
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  // 返回主页（TabBar页面）
  goToHome() {
    wx.switchTab({ url: '/pages/index/index' })
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
          this.setData({ messages: [], showDateDivider: false })
          wx.removeStorageSync('chatHistory')
          setTimeout(() => this.sendWelcomeMessage(), 300)
        }
      }
    })
  },

  // 分享给好友
  onShareApp() {
    this.setData({ showMenu: false })
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 分享海报
  onShareToTimeline() {
    this.setData({ showMenu: false })
    wx.navigateTo({ url: '/pages/poster/index?type=chat' })
  },

  formatTimeDisplay(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr.replace(/-/g, '/'))
    return util.formatTimeDisplay(date)
  },
})
