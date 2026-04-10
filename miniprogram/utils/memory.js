/**
 * memory.js - 智伴口袋智能记忆系统
 * 
 * 生产级别的用户记忆管理：
 * 1. 用户画像 - 基础信息、性格特征、沟通偏好
 * 2. 短期记忆 - 当前状态、最近事件、待办事项
 * 3. 长期记忆 - 重要事件、习惯模式、关系记忆
 * 4. 对话摘要 - 智能提取关键信息
 * 5. 记忆检索 - 快速获取相关记忆
 * 
 * 更新日期: 2026-04-10
 */

// ─── 存储键名 ────────────────────────────────────────────────
const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',      // 用户画像
  SHORT_TERM: 'shortTermMemory',    // 短期记忆
  LONG_TERM: 'longTermMemory',      // 长期记忆
  MEMORY_EXTRACTS: 'memoryExtracts', // 对话摘要
  CHAT_HISTORY: 'chatHistory',      // 原始对话历史
  LEARNED_FACTS: 'learnedFacts',    // 从对话中学到的事实
};

// ─── 记忆过期时间 ────────────────────────────────────────────
const EXPIRE_DAYS = {
  SHORT_TERM: 7,      // 短期记忆7天
  RECENT_EVENT: 3,    // 最近事件3天
  GOAL: 30,           // 目标30天
};

// ─── 最大存储数量 ────────────────────────────────────────────
const MAX_LIMITS = {
  SHORT_TERM_EVENTS: 20,
  SHORT_TERM_GOALS: 10,
  LONG_TERM_MILESTONES: 50,
  LEARNED_FACTS: 100,
  CHAT_HISTORY: 200,
};

/**
 * 智能记忆管理器
 */
class PocketMemory {
  constructor() {
    this.init()
  }

  // ─── 初始化 ──────────────────────────────────────────────
  init() {
    // 确保所有存储键都存在
    this.ensureStorage(STORAGE_KEYS.USER_PROFILE, this.getDefaultProfile())
    this.ensureStorage(STORAGE_KEYS.SHORT_TERM, this.getDefaultShortTerm())
    this.ensureStorage(STORAGE_KEYS.LONG_TERM, this.getDefaultLongTerm())
    this.ensureStorage(STORAGE_KEYS.LEARNED_FACTS, [])
    this.ensureStorage(STORAGE_KEYS.CHAT_HISTORY, [])
    this.ensureStorage(STORAGE_KEYS.MEMORY_EXTRACTS, [])
  }

  // ─── 默认数据结构 ────────────────────────────────────────
  getDefaultProfile() {
    return {
      // 基础信息
      nickname: '',
      gender: '',           // 性别
      age: '',              // 年龄（模糊：学生/工作党/自由职业等）
      occupation: '',       // 职业
      location: '',        // 所在地
      
      // 性格特征（从对话中学习）
      personality: {
        introverted: 0.5,   // 内向程度 0-1
        emotional: 0.5,     // 情感丰富度 0-1
        optimistic: 0.5,    // 乐观程度 0-1
        patient: 0.5,       // 耐心程度 0-1
      },
      
      // 沟通偏好
      communication: {
        tone: '温暖',        // 温暖/轻松/专业/俏皮
        emoji: '偶尔',       // 从不/偶尔/经常
        greeting: '你好',
        length: '适中',      // 简短/适中/详细
      },
      
      // 兴趣领域
      interests: [],
      
      // 生活状态
      lifestyle: {
        sleepPattern: '',    // 早睡型/夜猫子
        workStyle: '',       // 忙碌/轻松
        socialLevel: '',     // 独处/社交
      },
      
      // 元数据
      createdAt: Date.now(),
      updatedAt: Date.now(),
      learnCount: 0,        // 学习次数
    }
  }

  getDefaultShortTerm() {
    return {
      // 当前状态
      currentMood: null,      // 当前心情
      currentGoal: null,      // 当前目标
      currentChallenge: null, // 当前困扰
      
      // 最近事件（按时间排序）
      recentEvents: [],
      
      // 最近情绪
      recentMoods: [],
      
      // 当前目标
      activeGoals: [],
      
      // 待跟进事项
      pendingMatters: [],
      
      // 最后更新时间
      lastUpdated: Date.now(),
    }
  }

  getDefaultLongTerm() {
    return {
      // 重要记忆（里程碑）
      milestones: [],
      
      // 习惯模式
      habits: [],
      
      // 重要关系
      relationships: [],
      
      // 价值观倾向
      values: [],
      
      // 禁忌话题
      sensitiveTopics: [],
      
      // 成就记录
      achievements: [],
    }
  }

  // ─── 存储操作 ─────────────────────────────────────────────
  ensureStorage(key, defaultValue) {
    if (!wx.getStorageSync(key)) {
      wx.setStorageSync(key, defaultValue)
    }
  }

  getProfile() {
    let profile = wx.getStorageSync(STORAGE_KEYS.USER_PROFILE) || this.getDefaultProfile()
    // 确保所有必要字段存在（兼容老数据）
    const defaults = this.getDefaultProfile()
    let needsUpdate = false
    for (const key in defaults) {
      if (profile[key] === undefined) {
        profile[key] = defaults[key]
        needsUpdate = true
      }
    }
    // 如果有更新，保存回去
    if (needsUpdate) {
      wx.setStorageSync(STORAGE_KEYS.USER_PROFILE, profile)
    }
    return profile
  }

  updateProfile(updates) {
    const profile = this.getProfile()
    Object.assign(profile, updates, { updatedAt: Date.now() })
    wx.setStorageSync(STORAGE_KEYS.USER_PROFILE, profile)
    return profile
  }

  getShortTerm() {
    let shortTerm = wx.getStorageSync(STORAGE_KEYS.SHORT_TERM) || this.getDefaultShortTerm()
    // 确保所有必要字段存在（兼容老数据）
    const defaults = this.getDefaultShortTerm()
    let needsUpdate = false
    for (const key in defaults) {
      if (shortTerm[key] === undefined) {
        shortTerm[key] = defaults[key]
        needsUpdate = true
      }
    }
    if (needsUpdate) {
      wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
    }
    return shortTerm
  }

  getLongTerm() {
    let longTerm = wx.getStorageSync(STORAGE_KEYS.LONG_TERM) || this.getDefaultLongTerm()
    // 确保所有必要字段存在（兼容老数据）
    const defaults = this.getDefaultLongTerm()
    let needsUpdate = false
    for (const key in defaults) {
      if (longTerm[key] === undefined) {
        longTerm[key] = defaults[key]
        needsUpdate = true
      }
    }
    if (needsUpdate) {
      wx.setStorageSync(STORAGE_KEYS.LONG_TERM, longTerm)
    }
    return longTerm
  }

  getLearnedFacts() {
    return wx.getStorageSync(STORAGE_KEYS.LEARNED_FACTS) || []
  }

  getChatHistory() {
    return wx.getStorageSync(STORAGE_KEYS.CHAT_HISTORY) || []
  }

  // ─── 记忆学习（从对话中提取信息）──────────────────────────
  /**
   * 从用户消息中提取并学习信息
   * @param {string} userMessage - 用户消息
   * @param {string} aiResponse - AI回复
   */
  learnFromConversation(userMessage, aiResponse) {
    const facts = this.extractFacts(userMessage, aiResponse)
    this.saveLearnedFacts(facts)
    this.updateShortTermFromFacts(facts)
    this.cleanupExpiredData()
  }

  /**
   * 从对话中提取关键信息
   */
  extractFacts(userMessage, aiResponse) {
    const facts = []
    const text = userMessage.toLowerCase()
    
    // 提取时间相关
    const timePatterns = [
      { pattern: /明天|后天|下(周|月)/, type: 'time_reference' },
      { pattern: /上周|上周|上周|上个月/, type: 'past_time' },
      { pattern: /最近|这几天|这段时间/, type: 'recent_time' },
    ]
    
    // 提取情绪关键词
    const moodKeywords = {
      positive: ['开心|高兴|快乐|兴奋|满足|幸福|激动|棒|太好了'],
      negative: ['难过|伤心|沮丧|焦虑|担心|害怕|压力|烦|累'],
      neutral: ['一般|还行|普通|平常'],
    }
    
    // 提取人名
    const namePattern = /(?:叫|是|名叫|名字叫)\s*([^\s,，.!？]{2,8})/g
    let match
    while ((match = namePattern.exec(userMessage)) !== null) {
      facts.push({ type: 'person', value: match[1], context: userMessage.substring(0, 50) })
    }
    
    // 提取地点
    const locationPattern = /(?:在|住在|来自)\s*([^\s,，.!？]{2,10})/g
    while ((match = locationPattern.exec(userMessage)) !== null) {
      facts.push({ type: 'location', value: match[1], context: userMessage.substring(0, 50) })
    }
    
    // 提取事件
    const eventPattern = /(?:要|准备|计划|打算)(.{5,30})/g
    while ((match = eventPattern.exec(userMessage)) !== null) {
      facts.push({ type: 'plan', value: match[1].trim(), context: userMessage.substring(0, 50) })
    }
    
    // 提取目标
    const goalPattern = /(?:想|想要|希望能|目标是|想成为)(.{5,30})/g
    while ((match = goalPattern.exec(userMessage)) !== null) {
      facts.push({ type: 'goal', value: match[1].trim(), context: userMessage.substring(0, 50) })
    }
    
    // 提取偏好
    const preferencePatterns = [
      { pattern: /喜欢\s*(.{2,20})/, type: 'like' },
      { pattern: /讨厌|不喜欢\s*(.{2,20})/, type: 'dislike' },
      { pattern: /擅长\s*(.{2,20})/, type: 'skill' },
      { pattern: /(?:工作|学习)是?\s*(.{2,20})/, type: 'occupation' },
    ]
    
    preferencePatterns.forEach(({ pattern, type }) => {
      const regex = new RegExp(pattern, 'g')
      while ((match = regex.exec(userMessage)) !== null) {
        facts.push({ type, value: match[1].trim(), context: userMessage.substring(0, 50) })
      }
    })
    
    return facts
  }

  /**
   * 保存学习到的事实
   */
  saveLearnedFacts(facts) {
    if (!facts || facts.length === 0) return
    
    let learnedFacts = this.getLearnedFacts()
    const now = Date.now()
    
    facts.forEach(fact => {
      // 检查是否已存在相似的事实（避免重复）
      const exists = learnedFacts.some(f => 
        f.type === fact.type && f.value === fact.value
      )
      
      if (!exists) {
        learnedFacts.push({
          ...fact,
          learnedAt: now,
          lastUsed: now,
          useCount: 0,
        })
      } else {
        // 更新使用时间
        const existing = learnedFacts.find(f => 
          f.type === fact.type && f.value === fact.value
        )
        if (existing) {
          existing.lastUsed = now
          existing.useCount = (existing.useCount || 0) + 1
        }
      }
    })
    
    // 保持数量限制
    if (learnedFacts.length > MAX_LIMITS.LEARNED_FACTS) {
      // 按使用频率和更新时间排序，保留重要的
      learnedFacts = learnedFacts
        .sort((a, b) => (b.useCount * 10 + b.lastUsed) - (a.useCount * 10 + a.lastUsed))
        .slice(0, MAX_LIMITS.LEARNED_FACTS)
    }
    
    wx.setStorageSync(STORAGE_KEYS.LEARNED_FACTS, learnedFacts)
    
    // 更新profile的学习次数
    const profile = this.getProfile()
    profile.learnCount = learnedFacts.length
    this.updateProfile(profile)
  }

  /**
   * 从学到的事实更新短期记忆
   */
  updateShortTermFromFacts(facts) {
    const shortTerm = this.getShortTerm()
    const now = Date.now()
    
    facts.forEach(fact => {
      switch (fact.type) {
        case 'plan':
        case 'goal':
          // 添加到活跃目标
          if (!shortTerm.activeGoals.some(g => g.value === fact.value)) {
            shortTerm.activeGoals.push({
              ...fact,
              status: 'in_progress',
              createdAt: now,
              updatedAt: now,
            })
            // 限制数量
            if (shortTerm.activeGoals.length > MAX_LIMITS.SHORT_TERM_GOALS) {
              shortTerm.activeGoals = shortTerm.activeGoals.slice(-MAX_LIMITS.SHORT_TERM_GOALS)
            }
          }
          break
          
        case 'like':
          // 更新偏好
          const profile = this.getProfile()
          if (!profile.interests) {
            profile.interests = []
          }
          if (!profile.interests.includes(fact.value)) {
            profile.interests.push(fact.value)
            this.updateProfile(profile)
          }
          break
          
        case 'location':
          // 更新位置
          const p = this.getProfile()
          if (!p.location || fact.value !== p.location) {
            this.updateProfile({ location: fact.value })
          }
          break
      }
    })
    
    shortTerm.lastUpdated = now
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  // ─── 记忆检索 ─────────────────────────────────────────────
  /**
   * 获取所有需要注入的上下文记忆
   * @param {number} contextDays - 上下文天数范围
   */
  getContextMemory(contextDays = 7) {
    const profile = this.getProfile()
    const shortTerm = this.getShortTerm()
    const longTerm = this.getLongTerm()
    const learnedFacts = this.getLearnedFacts()
    const now = Date.now()
    
    // 过滤有效期内的事实
    const validFacts = learnedFacts.filter(f => {
      const daysSinceLearned = (now - f.lastUsed) / (1000 * 60 * 60 * 24)
      return daysSinceLearned < contextDays || f.useCount > 2
    })
    
    return {
      // 用户画像摘要
      profileSummary: this.generateProfileSummary(profile),
      
      // 当前状态
      currentState: {
        mood: shortTerm.currentMood,
        goal: (shortTerm.activeGoals && shortTerm.activeGoals[0]) || null,
        pendingMatters: (shortTerm.pendingMatters || []).slice(0, 3),
      },
      
      // 重要事实（高价值记忆，限制 5 个）
      keyFacts: validFacts
        .filter(f => f.useCount > 0)
        .sort((a, b) => b.useCount - a.useCount)
        .slice(0, 5)
        .map(f => `${f.type === 'like' ? '喜欢' : f.type === 'goal' ? '目标' : f.type === 'person' ? '认识' : ''}${f.value}`),
      
      // 最近事件
      recentEvents: (shortTerm.recentEvents || []).slice(0, 5),
      
      // 活跃目标
      activeGoals: (shortTerm.activeGoals || []).map(g => g.value),
      
      // 沟通偏好
      communication: profile.communication,
      
      // 性格特点
      personality: profile.personality,
    }
  }

  /**
   * 生成用户画像摘要
   */
  generateProfileSummary(profile) {
    const parts = []
    
    if (profile.nickname) {
      parts.push(`称呼：${profile.nickname}`)
    }
    
    if (profile.occupation) {
      parts.push(`职业：${profile.occupation}`)
    }
    
    if (profile.location) {
      parts.push(`所在地：${profile.location}`)
    }
    
    if (profile.interests && profile.interests.length > 0) {
      parts.push(`兴趣：${profile.interests.slice(0, 5).join('、')}`)
    }
    
    return parts.length > 0 ? parts.join('；') : '尚不了解'
  }

  /**
   * 获取特定类型的记忆
   * @param {string} type - 记忆类型
   */
  getFactsByType(type) {
    const facts = this.getLearnedFacts()
    return facts.filter(f => f.type === type)
  }

  // ─── 状态更新 ─────────────────────────────────────────────
  /**
   * 更新当前心情
   */
  updateMood(mood, note = '') {
    const shortTerm = this.getShortTerm()
    const now = Date.now()
    
    shortTerm.currentMood = { mood, note, timestamp: now }
    shortTerm.recentMoods.unshift({ mood, note, timestamp: now })
    
    // 保持最近情绪记录
    if (shortTerm.recentMoods.length > 10) {
      shortTerm.recentMoods = shortTerm.recentMoods.slice(0, 10)
    }
    
    shortTerm.lastUpdated = now
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  /**
   * 添加目标
   */
  addGoal(goal) {
    const shortTerm = this.getShortTerm()
    const now = Date.now()
    
    const goalObj = {
      id: now,
      value: goal,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }
    
    shortTerm.activeGoals.unshift(goalObj)
    
    // 限制数量
    if (shortTerm.activeGoals.length > MAX_LIMITS.SHORT_TERM_GOALS) {
      shortTerm.activeGoals = shortTerm.activeGoals.slice(0, MAX_LIMITS.SHORT_TERM_GOALS)
    }
    
    shortTerm.lastUpdated = now
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  /**
   * 完成目标
   */
  completeGoal(goalId) {
    const shortTerm = this.getShortTerm()
    const goal = shortTerm.activeGoals.find(g => g.id === goalId)
    
    if (goal) {
      goal.status = 'completed'
      goal.completedAt = Date.now()
      
      // 移动到长期记忆
      const longTerm = this.getLongTerm()
      longTerm.milestones.push({
        type: 'goal_completed',
        content: goal.value,
        completedAt: goal.completedAt,
      })
      wx.setStorageSync(STORAGE_KEYS.LONG_TERM, longTerm)
    }
    
    // 从活跃目标中移除
    shortTerm.activeGoals = shortTerm.activeGoals.filter(g => g.id !== goalId)
    shortTerm.lastUpdated = Date.now()
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  /**
   * 添加最近事件
   */
  addRecentEvent(event) {
    const shortTerm = this.getShortTerm()
    const now = Date.now()
    
    shortTerm.recentEvents.unshift({
      id: now,
      content: event,
      timestamp: now,
    })
    
    // 限制数量
    if (shortTerm.recentEvents.length > MAX_LIMITS.SHORT_TERM_EVENTS) {
      shortTerm.recentEvents = shortTerm.recentEvents.slice(0, MAX_LIMITS.SHORT_TERM_EVENTS)
    }
    
    shortTerm.lastUpdated = now
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  // ─── 清理过期数据 ─────────────────────────────────────────
  cleanupExpiredData() {
    const now = Date.now()
    const shortTerm = this.getShortTerm()
    let changed = false
    
    // 清理过期的短期记忆
    shortTerm.recentEvents = shortTerm.recentEvents.filter(e => {
      const days = (now - e.timestamp) / (1000 * 60 * 60 * 24)
      return days < EXPIRE_DAYS.SHORT_TERM
    })
    
    shortTerm.recentMoods = shortTerm.recentMoods.filter(m => {
      const days = (now - m.timestamp) / (1000 * 60 * 60 * 24)
      return days < EXPIRE_DAYS.SHORT_TERM
    })
    
    // 清理过期目标
    shortTerm.activeGoals = shortTerm.activeGoals.filter(g => {
      if (g.status === 'completed') return false
      const days = (now - g.createdAt) / (1000 * 60 * 60 * 24)
      return days < EXPIRE_DAYS.GOAL
    })
    
    wx.setStorageSync(STORAGE_KEYS.SHORT_TERM, shortTerm)
  }

  // ─── 记忆统计 ─────────────────────────────────────────────
  getStats() {
    const profile = this.getProfile()
    const shortTerm = this.getShortTerm()
    const learnedFacts = this.getLearnedFacts()
    const chatHistory = this.getChatHistory()
    
    return {
      profileComplete: this.calculateProfileCompleteness(profile),
      learnedFactsCount: learnedFacts.length,
      activeGoalsCount: shortTerm.activeGoals.length,
      totalConversations: chatHistory.filter(m => m.type === 'user').length,
      memoryHealth: this.getMemoryHealth(),
    }
  }

  calculateProfileCompleteness(profile) {
    const fields = ['nickname', 'gender', 'occupation', 'location', 'interests']
    const filled = fields.filter(f => {
      const val = profile[f]
      return val && (Array.isArray(val) ? val.length > 0 : true)
    }).length
    return Math.round((filled / fields.length) * 100)
  }

  getMemoryHealth() {
    const learnedFacts = this.getLearnedFacts()
    const shortTerm = this.getShortTerm()
    
    let score = 50
    
    // 根据学到的事实数量加分
    if (learnedFacts.length > 20) score += 20
    else if (learnedFacts.length > 10) score += 10
    else if (learnedFacts.length > 5) score += 5
    
    // 根据活跃目标数量加分
    if (shortTerm.activeGoals.length > 0) score += 10
    
    // 根据最近更新时间加分
    if (shortTerm.lastUpdated) {
      const hoursSince = (Date.now() - shortTerm.lastUpdated) / (1000 * 60 * 60)
      if (hoursSince < 24) score += 20
      else if (hoursSince < 72) score += 10
    }
    
    return Math.min(100, score)
  }

  // ─── 导出给AI的上下文 ──────────────────────────────────────
  /**
   * 生成注入到AI系统提示词的上下文
   * ⚠️ 限制总长度避免 400 错误
   */
  buildAIControlContext() {
    const memory = this.getContextMemory()
    const profile = this.getProfile()
    
    // 限制上下文总长度不超过 300 字符
    const MAX_CONTEXT_LENGTH = 300
    
    let context = '\n\n【关于主人】\n'
    
    // 用户基本信息
    const nickname = profile.nickname || '朋友'
    context += `主人叫${nickname}。\n`
    
    // 沟通偏好（安全访问）
    const comm = profile.communication || { tone: '温暖', emoji: '偶尔' }
    context += `语气：${comm.tone}${comm.emoji !== '从不' ? `，${comm.emoji}用emoji` : ''}。\n`
    
    // 兴趣（限制最多 3 个）
    if (memory.keyFacts && memory.keyFacts.length > 0) {
      const topFacts = memory.keyFacts.slice(0, 3)
      context += `特点：${topFacts.join('、')}。\n`
    }
    
    // 当前目标（限制最多 2 个）
    if (memory.activeGoals && memory.activeGoals.length > 0) {
      const topGoals = memory.activeGoals.slice(0, 2)
      context += `目标：${topGoals.join('、')}。\n`
    }
    
    // 当前心情
    if (memory.currentState && memory.currentState.mood) {
      context += `心情：${memory.currentState.mood}。\n`
    }
    
    // 深夜提醒
    const hour = new Date().getHours()
    if (hour >= 22 || hour < 6) {
      context += '夜深了，温柔一些。\n'
    }
    
    // 截断超长上下文
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = context.substring(0, MAX_CONTEXT_LENGTH) + '...'
    }
    
    return context
  }
}

// ─── 导出单例 ───────────────────────────────────────────────
module.exports = {
  PocketMemory,
  STORAGE_KEYS,
  EXPIRE_DAYS,
  MAX_LIMITS,
}
