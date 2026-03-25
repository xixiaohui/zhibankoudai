// pages/index/index.js - 首页
const { formatDate, formatMoney, getDateRange } = require('../../utils/util');

Page({
  data: {
    greeting: '',
    dateStr: '',
    todayIncome: 0,
    todayExpense: 0,
    monthExpense: 0,
    budget: { monthly: 0, used: 0 },
    budgetPercent: 0,
    todoList: [],
    studyNotes: [],
    quickEntries: [
      { icon: '💰', label: '记账', path: '/pages/finance/index', color: '#6C63FF', bg: '#EEF0FF' },
      { icon: '📚', label: '学习', path: '/pages/study/index', color: '#43D9AD', bg: '#E8FBF5' },
      { icon: '✅', label: '待办', path: '/pages/life/index', color: '#FFB347', bg: '#FFF8E1' },
      { icon: '🤖', label: 'AI助手', path: '/pages/ai/index', color: '#FF6584', bg: '#FFF0F3' },
    ],
    tips: [
      '每天记账5分钟，财务清晰一整年 💡',
      '学习是最好的投资，坚持每天进步一点 📈',
      '规律作息，身体是革命的本钱 🌱',
      '有问题问AI，让学习更高效 🚀',
      '记录今天的收支，掌控明天的生活 💼',
    ],
    currentTip: 0,
    weatherIcon: '☀️',
  },

  onShow() {
    this.initPage();
  },

  initPage() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';
    if (hours < 6) greeting = '深夜了，注意休息 🌙';
    else if (hours < 9) greeting = '早上好，新的一天开始了 🌅';
    else if (hours < 12) greeting = '上午好，元气满满 ☀️';
    else if (hours < 14) greeting = '中午好，记得休息哦 🌞';
    else if (hours < 18) greeting = '下午好，保持专注 💪';
    else if (hours < 21) greeting = '晚上好，充实的一天 🌆';
    else greeting = '晚上好，放松一下吧 🌃';

    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`;

    this.setData({ greeting, dateStr });
    this.loadFinanceData();
    this.loadTodoData();
    this.loadStudyData();
    this.startTipRotation();
  },

  loadFinanceData() {
    const records = wx.getStorageSync('financeRecords') || [];
    const budget = wx.getStorageSync('budget') || { monthly: 0, used: 0 };
    const todayRange = getDateRange('today');
    const monthRange = getDateRange('month');

    let todayIncome = 0, todayExpense = 0, monthExpense = 0;

    records.forEach(r => {
      if (r.timestamp >= todayRange.start && r.timestamp <= todayRange.end) {
        if (r.type === 'income') todayIncome += r.amount;
        else todayExpense += r.amount;
      }
      if (r.timestamp >= monthRange.start && r.timestamp <= monthRange.end) {
        if (r.type === 'expense') monthExpense += r.amount;
      }
    });

    const budgetPercent = budget.monthly > 0
      ? Math.min(Math.round(monthExpense / budget.monthly * 100), 100)
      : 0;

    this.setData({
      todayIncome,
      todayExpense,
      monthExpense,
      budget: { ...budget, used: monthExpense },
      budgetPercent,
    });
  },

  loadTodoData() {
    const todos = wx.getStorageSync('todoList') || [];
    const pending = todos.filter(t => !t.done).slice(0, 3);
    this.setData({ todoList: pending });
  },

  loadStudyData() {
    const notes = wx.getStorageSync('studyNotes') || [];
    this.setData({ studyNotes: notes.slice(0, 2) });
  },

  startTipRotation() {
    if (this._tipTimer) clearInterval(this._tipTimer);
    this._tipTimer = setInterval(() => {
      const next = (this.data.currentTip + 1) % this.data.tips.length;
      this.setData({ currentTip: next });
    }, 4000);
  },

  onUnload() {
    if (this._tipTimer) clearInterval(this._tipTimer);
  },

  // 快捷入口跳转
  goTo(e) {
    const path = e.currentTarget.dataset.path;
    wx.switchTab({ url: path });
  },

  // 跳转到记账
  goFinance() { wx.switchTab({ url: '/pages/finance/index' }); },
  goStudy() { wx.switchTab({ url: '/pages/study/index' }); },
  goLife() { wx.switchTab({ url: '/pages/life/index' }); },
  goAI() { wx.switchTab({ url: '/pages/ai/index' }); },
});
