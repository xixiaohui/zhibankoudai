// miniprogram/app.js
const util = require('./utils/util.js')

App({
  globalData: {
    userInfo: null,
    // 口袋记忆核心数据
    pocketMemory: {
      // 用户基本信息
      profile: {
        nickname: '',
        preferGreeting: '你好', // 称呼偏好
        preferTone: '温暖', // 语气偏好：温暖/轻松/专业
        joinDate: '', // 入驻日期
      },
      // 短期记忆（最近7天）
      shortTerm: {
        recentEvents: [], // 最近发生的事 {date, content, mood}
        recentMood: [], // 最近情绪 {date, mood, note}
        currentGoals: [], // 当前目标
        pendingMatters: [], // 待跟进事项
      },
      // 长期记忆
      longTerm: {
        preferences: {}, // 偏好设置
        patterns: {}, // 用户模式
        milestones: [], // 里程碑事件
      },
      // 记忆统计
      stats: {
        totalChats: 0, // 总对话次数
        totalMoodRecords: 0, // 情绪记录次数
        consecutiveDays: 0, // 连续陪伴天数
        lastVisitDate: '', // 上次访问日期
        weeklyMoods: [], // 本周情绪记录
      }
    }
  },

  onLaunch() {
    // 初始化本地存储
    this.initStorage()
    // 加载口袋记忆
    this.loadPocketMemory()
    // 检查连续天数
    this.checkConsecutiveDays()
  },

  // 初始化存储
  initStorage() {
    if (!wx.getStorageSync('userProfile')) {
      wx.setStorageSync('userProfile', {
        nickname: '',
        preferGreeting: '你好',
        preferTone: '温暖',
        joinDate: util.formatTime(new Date()),
      })
    }
    if (!wx.getStorageSync('shortTermMemory')) {
      wx.setStorageSync('shortTermMemory', {
        recentEvents: [],
        recentMood: [],
        currentGoals: [],
        pendingMatters: [],
      })
    }
    if (!wx.getStorageSync('longTermMemory')) {
      wx.setStorageSync('longTermMemory', {
        preferences: {},
        patterns: {},
        milestones: [],
      })
    }
    if (!wx.getStorageSync('moodRecords')) {
      wx.setStorageSync('moodRecords', [])
    }
    if (!wx.getStorageSync('chatHistory')) {
      wx.setStorageSync('chatHistory', [])
    }
    if (!wx.getStorageSync('dailyCards')) {
      wx.setStorageSync('dailyCards', [])
    }
    if (!wx.getStorageSync('stats')) {
      wx.setStorageSync('stats', {
        totalChats: 0,
        totalMoodRecords: 0,
        consecutiveDays: 0,
        lastVisitDate: '',
        weeklyMoods: [],
      })
    }
  },

  // 加载口袋记忆
  loadPocketMemory() {
    const profile = wx.getStorageSync('userProfile')
    const shortTerm = wx.getStorageSync('shortTermMemory')
    const longTerm = wx.getStorageSync('longTermMemory')
    const stats = wx.getStorageSync('stats')

    this.globalData.pocketMemory = {
      profile: profile || this.globalData.pocketMemory.profile,
      shortTerm: shortTerm || this.globalData.pocketMemory.shortTerm,
      longTerm: longTerm || this.globalData.pocketMemory.longTerm,
      stats: stats || this.globalData.pocketMemory.stats,
    }
  },

  // 检查连续陪伴天数
  checkConsecutiveDays() {
    const stats = wx.getStorageSync('stats') || { consecutiveDays: 0, lastVisitDate: '' }
    const today = util.formatDate(new Date())
    const lastVisit = stats.lastVisitDate

    if (!lastVisit) {
      // 首次访问
      stats.consecutiveDays = 1
      stats.lastVisitDate = today
    } else if (lastVisit === today) {
      // 今天已访问
    } else {
      const yesterday = util.formatDate(new Date(Date.now() - 86400000))
      if (lastVisit === yesterday) {
        // 昨天访问过，连续天数+1
        stats.consecutiveDays += 1
      } else {
        // 中断了，重置
        stats.consecutiveDays = 1
      }
    }
    stats.lastVisitDate = today
    wx.setStorageSync('stats', stats)
    this.globalData.pocketMemory.stats = stats
  },

  // 保存情绪记录
  saveMoodRecord(mood, note = '') {
    const records = wx.getStorageSync('moodRecords') || []
    const stats = wx.getStorageSync('stats') || { totalMoodRecords: 0 }
    const shortTerm = wx.getStorageSync('shortTermMemory') || { recentMood: [] }

    const record = {
      id: Date.now(),
      date: util.formatDate(new Date()),
      time: util.formatTime(new Date()),
      mood: mood,
      note: note,
    }

    records.unshift(record)
    if (records.length > 100) records.pop()

    wx.setStorageSync('moodRecords', records)

    // 更新统计
    stats.totalMoodRecords += 1
    const today = util.formatDate(new Date())
    const todayMood = shortTerm.recentMood.find(m => m.date === today)
    if (todayMood) {
      todayMood.mood = mood
    } else {
      shortTerm.recentMood.unshift({ date: today, mood: mood })
    }
    // 保持最近7天
    if (shortTerm.recentMood.length > 7) shortTerm.recentMood.pop()
    
    wx.setStorageSync('stats', stats)
    wx.setStorageSync('shortTermMemory', shortTerm)
    
    return record
  },

  // 添加事件到短期记忆
  addShortTermEvent(content, mood = '') {
    const shortTerm = wx.getStorageSync('shortTermMemory') || { recentEvents: [] }
    const today = util.formatDate(new Date())

    shortTerm.recentEvents.unshift({
      id: Date.now(),
      date: today,
      content: content,
      mood: mood,
    })

    // 保持最近7天，每天最多3条
    const todayEvents = shortTerm.recentEvents.filter(e => e.date === today)
    if (todayEvents.length > 3) {
      shortTerm.recentEvents = shortTerm.recentEvents.slice(0, 7 * 3)
    } else {
      shortTerm.recentEvents = shortTerm.recentEvents.slice(0, 20)
    }

    wx.setStorageSync('shortTermMemory', shortTerm)
  },

  // 添加目标
  addGoal(goal, deadline = '') {
    const shortTerm = wx.getStorageSync('shortTermMemory') || { currentGoals: [] }
    shortTerm.currentGoals.unshift({
      id: Date.now(),
      content: goal,
      deadline: deadline,
      createdAt: util.formatTime(new Date()),
      completed: false,
    })
    wx.setStorageSync('shortTermMemory', shortTerm)
  },

  // 完成目标
  completeGoal(goalId) {
    const shortTerm = wx.getStorageSync('shortTermMemory') || { currentGoals: [] }
    const goal = shortTerm.currentGoals.find(g => g.id === goalId)
    if (goal) {
      goal.completed = true
      goal.completedAt = util.formatTime(new Date())
      // 添加到里程碑
      const longTerm = wx.getStorageSync('longTermMemory') || { milestones: [] }
      longTerm.milestones.unshift({
        date: util.formatDate(new Date()),
        content: `完成了目标：${goal.content}`,
        type: 'goal',
      })
      wx.setStorageSync('longTermMemory', longTerm)
    }
    wx.setStorageSync('shortTermMemory', shortTerm)
  },

  // 获取问候语
  getGreeting() {
    const profile = wx.getStorageSync('userProfile')
    const hour = new Date().getHours()
    const nickname = profile.nickname || '朋友'
    
    let timeGreeting = ''
    if (hour < 6) timeGreeting = '凌晨好'
    else if (hour < 9) timeGreeting = '早上好'
    else if (hour < 12) timeGreeting = '上午好'
    else if (hour < 14) timeGreeting = '中午好'
    else if (hour < 18) timeGreeting = '下午好'
    else if (hour < 22) timeGreeting = '晚上好'
    else timeGreeting = '夜深了'

    return {
      text: `${timeGreeting}，${nickname}`,
      time: timeGreeting,
      hour: hour,
    }
  },

  // 生成每日陪伴卡片
  generateDailyCard() {
    const profile = wx.getStorageSync('userProfile')
    const shortTerm = wx.getStorageSync('shortTermMemory') || { currentGoals: [] }
    const stats = wx.getStorageSync('stats') || { consecutiveDays: 0 }
    const moodRecords = wx.getStorageSync('moodRecords') || []
    
    // 获取最近7天情绪
    const recentMoods = moodRecords.slice(0, 7)
    
    // 情绪统计
    const moodCount = { '开心': 0, '平静': 0, '焦虑': 0, '低落': 0, '疲惫': 0, '烦闷': 0 }
    recentMoods.forEach(m => {
      if (moodCount[m.mood] !== undefined) moodCount[m.mood]++
    })
    
    // 找出最高频情绪
    let topMood = '平静'
    let maxCount = 0
    Object.entries(moodCount).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count
        topMood = mood
      }
    })

    // 生成鼓励语
    const encouragements = {
      '开心': ['保持这份好心情，它会感染身边的每一个人 🌟', '今天的你闪闪发光，继续保持 ✨'],
      '平静': ['平和是最好的状态，享受这份宁静 🍃', '静下心来，你已经做得很好了 💫'],
      '焦虑': ['深呼吸，一切都会慢慢好起来的 🌈', '别担心，你比自己想象的更强大 💪'],
      '低落': ['累了就休息，休息好了再出发 🌙', '低落只是暂时的，阳光总在风雨后 ☀️'],
      '疲惫': ['休息不是放弃，是为了走更远的路 🌸', '给自己一个小小的假期吧 🎈'],
      '烦闷': ['换个角度看问题，也许会有新发现 💡', '烦闷会过去的，美好的事情正在发生 🌻'],
    }

    const moodEncouragements = encouragements[topMood] || encouragements['平静']
    const encouragement = moodEncouragements[Math.floor(Math.random() * moodEncouragements.length)]

    // 本周回顾
    const weekReview = recentMoods.length > 0 
      ? `这周你记录了${recentMoods.length}次心情，${topMood}是你最多的情绪状态`
      : '这周还没有记录心情哦，点击下方开始记录吧'

    // 今日建议
    const suggestions = [
      '记得多喝水，保持好状态 💧',
      '适当休息，别太累了哦 🌙',
      '今天的你也在努力，真棒 🌟',
      '可以找个时间深呼吸放松一下 🧘',
      '和身边的人分享你的心情吧 💬',
    ]
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

    // 待办提醒
    const pendingGoals = shortTerm.currentGoals.filter(g => !g.completed).slice(0, 2)
    const pendingText = pendingGoals.length > 0 
      ? `待完成：${pendingGoals.map(g => g.content).join('、')}`
      : ''

    return {
      date: util.formatDate(new Date()),
      encouragement: encouragement,
      weekReview: weekReview,
      suggestion: suggestion,
      pendingText: pendingText,
      consecutiveDays: stats.consecutiveDays,
      topMood: topMood,
      moodTrend: recentMoods.map(m => m.mood),
    }
  },

  // 保存每日卡片
  saveDailyCard(card) {
    const cards = wx.getStorageSync('dailyCards') || []
    const today = util.formatDate(new Date())
    
    // 检查今天是否已有卡片
    const existingIndex = cards.findIndex(c => c.date === today)
    if (existingIndex >= 0) {
      cards[existingIndex] = card
    } else {
      cards.unshift(card)
    }
    
    if (cards.length > 30) cards.pop()
    wx.setStorageSync('dailyCards', cards)
    return card
  },

  // 更新对话统计
  updateChatStats() {
    const stats = wx.getStorageSync('stats') || { totalChats: 0 }
    stats.totalChats = (stats.totalChats || 0) + 1
    wx.setStorageSync('stats', stats)
  },
})
