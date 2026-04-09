// pages/mood/index.js - 情绪记录页面
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    // 情绪选项
    moods: [
      { id: '开心', emoji: '😄', color: '#FFD93D', selected: false },
      { id: '平静', emoji: '😌', color: '#6BCB77', selected: false },
      { id: '焦虑', emoji: '😰', color: '#FF8B8B', selected: false },
      { id: '低落', emoji: '😔', color: '#A8A8A8', selected: false },
      { id: '疲惫', emoji: '😫', color: '#C4A7E7', selected: false },
      { id: '烦闷', emoji: '😤', color: '#FF6B6B', selected: false },
    ],
    
    // 当前选中的情绪
    selectedMood: null,
    
    // 输入内容
    note: '',
    
    // 历史记录
    recentRecords: [],
    
    // 本周情绪统计
    moodStats: {},
    
    // 情绪统计最大值（用于进度条计算）
    moodStatsMax: 1,
    
    // 是否有统计数据
    hasMoodStats: false,
    
    // UI状态
    showNoteInput: false,
    isSubmitting: false,
  },

  onLoad() {
    this.loadMoodRecords()
    this.calculateMoodStats()
  },

  onShow() {
    this.loadMoodRecords()
  },

  // 加载情绪记录
  loadMoodRecords() {
    const records = wx.getStorageSync('moodRecords') || []
    // 获取最近7条记录
    const recentRecords = records.slice(0, 7)
    this.setData({ recentRecords })
  },

  // 计算本周情绪统计
  calculateMoodStats() {
    const records = wx.getStorageSync('moodRecords') || []
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weekRecords = records.filter(record => {
      const recordDate = new Date(record.date.replace(/-/g, '/'))
      return recordDate >= weekAgo
    })
    
    const stats = {}
    weekRecords.forEach(record => {
      if (!stats[record.mood]) {
        stats[record.mood] = 0
      }
      stats[record.mood]++
    })
    
    // 计算最大值（用于进度条百分比）
    const values = Object.values(stats)
    const maxValue = values.length > 0 ? Math.max(...values) : 1
    
    this.setData({ 
      moodStats: stats,
      moodStatsMax: maxValue,
      hasMoodStats: values.length > 0,
    })
  },

  // 选择情绪
  onSelectMood(e) {
    const moodId = e.currentTarget.dataset.id
    const moods = this.data.moods.map(mood => ({
      ...mood,
      selected: mood.id === moodId
    }))
    
    this.setData({
      moods,
      selectedMood: moodId,
      showNoteInput: true,
    })
    
    // 自动滚动到输入区域
    setTimeout(() => {
      wx.pageScrollTo({
        scrollTop: 500,
        duration: 300
      })
    }, 100)
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交情绪记录
  onSubmit() {
    if (!this.data.selectedMood) {
      wx.showToast({ title: '请选择一个情绪', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })
    
    // 保存情绪记录
    const record = app.saveMoodRecord(this.data.selectedMood, this.data.note)
    
    // 如果是负面情绪，提供安慰建议
    const negativeMoods = ['焦虑', '低落', '疲惫', '烦闷']
    if (negativeMoods.includes(this.data.selectedMood)) {
      setTimeout(() => {
        this.showComfortSuggestion()
      }, 1000)
    }
    
    // 重置表单
    setTimeout(() => {
      const moods = this.data.moods.map(mood => ({
        ...mood,
        selected: false
      }))
      
      this.setData({
        moods,
        selectedMood: null,
        note: '',
        showNoteInput: false,
        isSubmitting: false,
      })
      
      // 重新加载数据
      this.loadMoodRecords()
      this.calculateMoodStats()
      
      wx.showToast({ title: '记录成功', icon: 'success' })
    }, 500)
  },

  // 显示安慰建议
  showComfortSuggestion() {
    const suggestions = {
      '焦虑': '试着深呼吸几次，或者写下来让你焦虑的事情，可能会感觉好一些 🌈',
      '低落': '低落的时候可以听听喜欢的音乐，或者做一些简单的事情转移注意力 🎵',
      '疲惫': '累了就休息一下吧，休息好了才能走更远的路 🛏️',
      '烦闷': '换个环境走走，或者找人聊聊天，可能会发现新的视角 🌳',
    }
    
    const suggestion = suggestions[this.data.selectedMood] || '记得对自己温柔一点，你已经做得很好了 💗'
    
    wx.showModal({
      title: '小建议',
      content: suggestion,
      showCancel: false,
      confirmText: '谢谢',
    })
  },

  // 快捷记录（无备注）
  onQuickRecord(e) {
    const moodId = e.currentTarget.dataset.id
    const record = app.saveMoodRecord(moodId, '')
    
    // 显示反馈
    wx.showToast({ 
      title: `记录了${moodId}${util.getMoodEmoji(moodId)}`, 
      icon: 'success',
      duration: 1500 
    })
    
    // 重新加载数据
    setTimeout(() => {
      this.loadMoodRecords()
      this.calculateMoodStats()
    }, 500)
  },

  // 查看情绪详情
  onViewRecordDetail(e) {
    const record = e.currentTarget.dataset.record
    const timeStr = util.formatTimeDisplay(new Date(record.date + ' ' + record.time))
    
    let content = `时间：${timeStr}\n情绪：${record.mood}${util.getMoodEmoji(record.mood)}`
    if (record.note) {
      content += `\n备注：${record.note}`
    }
    
    wx.showModal({
      title: '情绪记录详情',
      content: content,
      showCancel: false,
      confirmText: '好的',
    })
  },

  // 开始陪伴对话（基于当前情绪）
  onStartChatWithMood() {
    if (!this.data.selectedMood) {
      wx.navigateTo({
        url: '/pages/chat/index?mode=comfort&title=安慰陪伴',
      })
      return
    }
    
    const negativeMoods = ['焦虑', '低落', '疲惫', '烦闷']
    const mode = negativeMoods.includes(this.data.selectedMood) ? 'comfort' : 'chat'
    const modeName = negativeMoods.includes(this.data.selectedMood) ? '安慰陪伴' : '聊聊心情'
    
    wx.navigateTo({
      url: `/pages/chat/index?mode=${mode}&title=${modeName}`,
    })
  },

  // 查看情绪趋势
  onViewMoodTrend() {
    wx.showModal({
      title: '本周情绪趋势',
      content: this.generateTrendSummary(),
      showCancel: false,
      confirmText: '了解',
    })
  },

  // 生成趋势摘要
  generateTrendSummary() {
    const stats = this.data.moodStats
    if (Object.keys(stats).length === 0) {
      return '本周还没有记录情绪，开始记录来观察你的情绪变化吧 📈'
    }
    
    const total = Object.values(stats).reduce((a, b) => a + b, 0)
    const mostFrequent = Object.entries(stats).sort((a, b) => b[1] - a[1])[0]
    
    let summary = `本周记录了${total}次情绪\n`
    summary += `出现最多的是：${mostFrequent[0]}${util.getMoodEmoji(mostFrequent[0])}（${mostFrequent[1]}次）\n\n`
    
    const positiveCount = stats['开心'] || 0 + stats['平静'] || 0
    const negativeCount = total - positiveCount
    
    if (positiveCount > negativeCount) {
      summary += '整体来看，你这周的情绪状态还不错 🌟'
    } else if (negativeCount > positiveCount) {
      summary += '这周可能有些挑战，记得多照顾自己 💗'
    } else {
      summary += '情绪比较平稳，继续保持 😊'
    }
    
    return summary
  },
})