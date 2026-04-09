// miniprogram/utils/util.js

// 格式化时间
function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

// 格式化日期显示
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === formatDate(today)) return '今天'
  if (dateStr === formatDate(yesterday)) return '昨天'
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

// 格式化时间显示
function formatTimeDisplay(date) {
  const hour = date.getHours()
  const minute = date.getMinutes()
  
  if (hour < 6) return `凌晨 ${formatNumber(hour)}:${formatNumber(minute)}`
  if (hour < 9) return `早上 ${formatNumber(hour)}:${formatNumber(minute)}`
  if (hour < 12) return `上午 ${formatNumber(hour)}:${formatNumber(minute)}`
  if (hour < 14) return `中午 ${formatNumber(hour)}:${formatNumber(minute)}`
  if (hour < 18) return `下午 ${formatNumber(hour)}:${formatNumber(minute)}`
  if (hour < 22) return `晚上 ${formatNumber(hour)}:${formatNumber(minute)}`
  return `深夜 ${formatNumber(hour)}:${formatNumber(minute)}`
}

// 补零
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 相对时间
function formatRelativeTime(dateStr) {
  const date = new Date(dateStr.replace(/-/g, '/'))
  const now = new Date()
  const diff = now - date
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return Math.floor(diff / day) + '天前'
  return formatDateDisplay(dateStr.replace(/\//g, '-'))
}

// 情绪emoji映射
const moodEmoji = {
  '开心': '😄',
  '平静': '😌',
  '焦虑': '😰',
  '低落': '😔',
  '疲惫': '😫',
  '烦闷': '😤',
}

// 获取情绪emoji
function getMoodEmoji(mood) {
  return moodEmoji[mood] || '😊'
}

// 情绪颜色映射
const moodColors = {
  '开心': '#FFD93D',
  '平静': '#6BCB77',
  '焦虑': '#FF8B8B',
  '低落': '#A8A8A8',
  '疲惫': '#C4A7E7',
  '烦闷': '#FF6B6B',
}

// 获取情绪颜色
function getMoodColor(mood) {
  return moodColors[mood] || '#999999'
}

// 陪伴模式
const chatModes = [
  { id: 'comfort', name: '安慰我一下', icon: '🤗', color: '#FFB3BA', prompt: '请用温暖、理解的方式安慰我。我现在心情不太好，需要被理解和接纳。不要说教，只要陪伴和倾听。' },
  { id: 'reflect', name: '帮我理一理', icon: '💭', color: '#BAFFC9', prompt: '请帮我整理思路，梳理当前的情况和情绪。用提问的方式引导我思考，但不要替我做决定。' },
  { id: 'action', name: '督促我开始', icon: '💪', color: '#BAE1FF', prompt: '请督促我行动起来。我知道自己该做什么但总是拖延，需要你推我一把。用积极但不施压的方式鼓励我。' },
  { id: 'chat', name: '随便聊聊', icon: '☕', color: '#FFFFBA', prompt: '我们随便聊聊吧。可以分享有趣的事情，或者问问我今天过得怎么样。保持轻松友好的氛围。' },
]

// 获取陪伴模式
function getChatModes() {
  return chatModes
}

// 获取模式信息
function getModeById(modeId) {
  return chatModes.find(m => m.id === modeId) || chatModes[3]
}

// AI回复生成器（模拟）
function generateAIResponse(userMessage, modeId, memory) {
  const mode = getModeById(modeId)
  const responses = {
    comfort: [
      '我听到了，你现在一定很不容易 💗',
      '谢谢你愿意和我分享这些，你并不孤单',
      '这种感觉我理解，给自己一点时间，会好起来的',
      '不管怎样，我都在这里陪着你',
    ],
    reflect: [
      '让我帮你理一理...你现在主要在烦恼什么呢？',
      '我们可以一件事一件事来看，先说说最近让你最困扰的是什么？',
      '听起来你在思考一些重要的事情，慢慢来，不着急',
    ],
    action: [
      '好的！让我们开始吧！你想做的第一件事是什么？',
      '动起来就已经成功了一半！我相信你可以的 💪',
      '今天先迈出小小的一步，我们一起加油！',
    ],
    chat: [
      '今天怎么样？有什么有趣的事情想和我分享吗？',
      '我很好奇你最近在忙什么？',
      '聊聊吧，我对你的生活很感兴趣 😊',
    ],
  }
  
  const modeResponses = responses[modeId] || responses.chat
  return modeResponses[Math.floor(Math.random() * modeResponses.length)]
}

// 问候语集合
const greetings = {
  morning: [
    '早安！新的一天又开始了 🌅',
    '早上好！今天也要元气满满哦',
    '早起的你很棒！今天有什么计划？',
  ],
  afternoon: [
    '下午好！工作学习顺利吗？',
    '午后的时光很惬意呢 ☀️',
  ],
  evening: [
    '晚上好！今天辛苦了 🌙',
    '傍晚时分，感觉怎么样？',
    '夜色渐浓，我来陪你聊聊天',
  ],
  lateNight: [
    '夜深了，还不休息吗？ 🌃',
    '这么晚还在，说明你在认真生活',
  ],
}

// 获取时段问候语
function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 6 || hour >= 22) return greetings.lateNight[Math.floor(Math.random() * greetings.lateNight.length)]
  if (hour < 12) return greetings.morning[Math.floor(Math.random() * greetings.morning.length)]
  return greetings.evening[Math.floor(Math.random() * greetings.evening.length)]
}

// 导出
module.exports = {
  formatTime,
  formatDate,
  formatDateDisplay,
  formatTimeDisplay,
  formatRelativeTime,
  getMoodEmoji,
  getMoodColor,
  getChatModes,
  getModeById,
  generateAIResponse,
  getTimeGreeting,
}
