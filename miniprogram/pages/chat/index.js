// pages/chat/index.js - 陪伴对话页面
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 对话模式
    mode: 'chat', // 默认模式
    modeName: '随便聊聊',
    modeIcon: '☕',
    modeColor: '#FFFFBA',
    
    // 对话相关
    messages: [],
    inputValue: '',
    isAIThinking: false,
    
    // 用户记忆信息
    userMemory: null,
    
    // UI状态
    showModeSelect: false,
  },

  onLoad(options) {
    // 从参数获取模式
    if (options.mode) {
      const modeInfo = util.getModeById(options.mode)
      this.setData({
        mode: options.mode,
        modeName: options.title || modeInfo.name,
        modeIcon: modeInfo.icon,
        modeColor: modeInfo.color,
      })
    } else {
      // 默认模式信息
      const modeInfo = util.getModeById('chat')
      this.setData({
        modeName: modeInfo.name,
        modeIcon: modeInfo.icon,
        modeColor: modeInfo.color,
      })
    }

    // 加载对话历史
    this.loadChatHistory()
    
    // 加载用户记忆
    this.loadUserMemory()
    
    // 如果是新对话，发送欢迎消息
    if (this.data.messages.length === 0) {
      this.sendWelcomeMessage()
    }
  },

  // 加载对话历史
  loadChatHistory() {
    const history = wx.getStorageSync('chatHistory') || []
    // 只显示最近50条消息
    const recentHistory = history.slice(-50)
    this.setData({ messages: recentHistory })
  },

  // 加载用户记忆
  loadUserMemory() {
    const profile = wx.getStorageSync('userProfile')
    const shortTerm = wx.getStorageSync('shortTermMemory')
    const stats = wx.getStorageSync('stats')
    
    this.setData({
      userMemory: {
        nickname: profile?.nickname || '朋友',
        recentMood: shortTerm?.recentMood?.[0] || null,
        pendingGoals: shortTerm?.currentGoals?.filter(g => !g.completed) || [],
        consecutiveDays: stats?.consecutiveDays || 0,
      }
    })
  },

  // 发送欢迎消息
  sendWelcomeMessage() {
    const { mode, userMemory } = this.data
    const modeInfo = util.getModeById(mode)
    
    let welcomeText = ''
    switch(mode) {
      case 'comfort':
        welcomeText = `我在这里陪着你，${userMemory.nickname}。有什么想倾诉的都可以告诉我 🤗`
        break
      case 'reflect':
        welcomeText = `我们一起理一理思路，${userMemory.nickname}。慢慢来，不着急 💭`
        break
      case 'action':
        welcomeText = `准备好行动起来了吗，${userMemory.nickname}？今天我们可以一起完成些什么！ 💪`
        break
      default:
        welcomeText = `嗨，${userMemory.nickname}！今天想聊点什么？ ☕`
    }
    
    // 根据记忆添加个性化内容
    if (userMemory.recentMood) {
      const moodEmoji = util.getMoodEmoji(userMemory.recentMood.mood)
      welcomeText += `\n\n我看到你最近的心情是${userMemory.recentMood.mood}${moodEmoji}，想和我聊聊这个吗？`
    }
    
    if (userMemory.pendingGoals.length > 0) {
      welcomeText += `\n\n你还有${userMemory.pendingGoals.length}个目标在进行中，需要我帮你推进吗？`
    }

    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: welcomeText,
      time: util.formatTime(new Date()),
      mode: mode,
    }
    
    this.addMessage(welcomeMessage)
  },

  // 添加消息
  addMessage(message) {
    const messages = [...this.data.messages, message]
    this.setData({ messages })
    
    // 保存到历史记录
    const history = wx.getStorageSync('chatHistory') || []
    history.push(message)
    if (history.length > 100) history.shift() // 限制历史记录数量
    wx.setStorageSync('chatHistory', history)
    
    // 更新对话统计
    if (message.type === 'user') {
      app.updateChatStats()
    }
    
    // 滚动到底部
    setTimeout(() => {
      this.scrollToBottom()
    }, 100)
  },

  // 输入处理
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 发送消息
  onSend() {
    const content = this.data.inputValue.trim()
    if (!content) return
    
    // 用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content,
      time: util.formatTime(new Date()),
      mode: this.data.mode,
    }
    
    this.addMessage(userMessage)
    this.setData({ inputValue: '', isAIThinking: true })
    
    // 模拟AI思考延迟
    setTimeout(() => {
      this.generateAIResponse(content)
    }, 800)
  },

  // 生成AI回复
  generateAIResponse(userContent) {
    const { mode, userMemory } = this.data
    
    // 获取短期记忆作为上下文
    const shortTerm = wx.getStorageSync('shortTermMemory')
    const memory = {
      nickname: userMemory.nickname,
      recentMood: userMemory.recentMood,
      pendingGoals: userMemory.pendingGoals,
      recentEvents: shortTerm?.recentEvents || [],
    }
    
    // 使用工具函数生成回复
    let aiResponse = util.generateAIResponse(userContent, mode, memory)
    
    // 如果是安慰模式且有负面情绪，添加特别回应
    if (mode === 'comfort' && this.containsNegativeWords(userContent)) {
      const comfortResponses = [
        '我知道你现在一定很难受，但请相信这只是暂时的 🌈',
        '你的感受是真实的，也是重要的。我在这里陪着你 💗',
        '深呼吸，给自己一点时间和空间，你已经很勇敢了 🕊️',
      ]
      aiResponse = comfortResponses[Math.floor(Math.random() * comfortResponses.length)]
    }
    
    // 如果是行动模式且包含目标相关词汇，添加跟进
    if (mode === 'action' && this.containsGoalWords(userContent)) {
      const actionResponses = [
        '太好了！有了明确的方向，我们一步步来 🎯',
        '这个目标很棒！今天可以先做哪一小步呢？ 👣',
        '行动的力量超乎想象，相信你能做到！ 🚀',
      ]
      aiResponse = actionResponses[Math.floor(Math.random() * actionResponses.length)]
    }
    
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponse,
      time: util.formatTime(new Date()),
      mode: mode,
    }
    
    this.addMessage(aiMessage)
    this.setData({ isAIThinking: false })
    
    // 如果是反思模式，可能记录到短期记忆
    if (mode === 'reflect' && this.isSignificantContent(userContent)) {
      app.addShortTermEvent(userContent, userMemory.recentMood?.mood || '')
    }
  },

  // 辅助函数：检查是否包含负面词汇
  containsNegativeWords(text) {
    const negativeWords = ['难受', '痛苦', '难过', '伤心', '崩溃', '绝望', '压力', '焦虑', '抑郁']
    return negativeWords.some(word => text.includes(word))
  },

  // 辅助函数：检查是否包含目标词汇
  containsGoalWords(text) {
    const goalWords = ['目标', '计划', '完成', '做', '学习', '工作', '项目', '任务', '清单']
    return goalWords.some(word => text.includes(word))
  },

  // 辅助函数：检查是否重要内容
  isSignificantContent(text) {
    return text.length > 10 && !text.includes('?') && !text.includes('吗') && !text.includes('呢')
  },

  // 切换模式
  onSwitchMode() {
    this.setData({ showModeSelect: true })
  },

  // 选择模式
  onSelectMode(e) {
    const mode = e.currentTarget.dataset.mode
    const modeInfo = util.getModeById(mode)
    
    this.setData({
      mode: mode,
      modeName: modeInfo.name,
      modeIcon: modeInfo.icon,
      modeColor: modeInfo.color,
      showModeSelect: false,
    })
    
    // 发送模式切换提示
    const modeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `已切换到${modeInfo.name}模式，${modeInfo.icon} 现在我们可以开始${modeInfo.name.toLowerCase()}了`,
      time: util.formatTime(new Date()),
      mode: mode,
    }
    
    this.addMessage(modeMessage)
  },

  // 关闭模式选择
  onCloseModeSelect() {
    this.setData({ showModeSelect: false })
  },

  // 清空对话
  onClearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空当前对话吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] })
          // 不清除历史记录，只清空当前视图
          wx.showToast({ title: '对话已清空', icon: 'success' })
        }
      }
    })
  },

  // 滚动到底部
  scrollToBottom() {
    wx.createSelectorQuery()
      .select('.messages-container')
      .boundingClientRect(rect => {
        wx.pageScrollTo({
          scrollTop: rect.height,
          duration: 300
        })
      })
      .exec()
  },

  // 阻止事件冒泡
  noop() {},
})