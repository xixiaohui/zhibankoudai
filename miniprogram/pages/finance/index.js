// pages/finance/index.js - 金融管理
const {
  formatDate, formatMoney, getDateRange, genId,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo,
  showSuccess, showError
} = require('../../utils/util');

Page({
  data: {
    // 统计
    monthIncome: 0,
    monthExpense: 0,
    monthBalance: 0,
    budgetMonthly: 0,
    budgetPercent: 0,

    // 筛选
    filterType: 'all', // all/income/expense
    filterPeriod: 'month', // today/week/month/all

    // 记录列表（按日期分组）
    groupedRecords: [],

    // 弹窗
    showAddModal: false,
    showBudgetModal: false,

    // 新增表单
    form: {
      type: 'expense',
      amount: '',
      category: 'food',
      note: '',
      date: '',
    },
    expenseCategories: EXPENSE_CATEGORIES,
    incomeCategories: INCOME_CATEGORIES,

    // 预算表单
    budgetInput: '',

    // 图表数据（分类饼图）
    categoryStats: [],
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const records = wx.getStorageSync('financeRecords') || [];
    const budget = wx.getStorageSync('budget') || { monthly: 0 };

    // 计算本月收支
    const monthRange = getDateRange('month');
    let monthIncome = 0, monthExpense = 0;
    records.forEach(r => {
      if (r.timestamp >= monthRange.start && r.timestamp <= monthRange.end) {
        if (r.type === 'income') monthIncome += r.amount;
        else monthExpense += r.amount;
      }
    });

    const budgetPercent = budget.monthly > 0
      ? Math.min(Math.round(monthExpense / budget.monthly * 100), 100) : 0;

    // 分类统计
    const catMap = {};
    records.filter(r => r.type === 'expense' && r.timestamp >= monthRange.start).forEach(r => {
      const cat = getCategoryInfo(r.category);
      if (!catMap[r.category]) catMap[r.category] = { ...cat, total: 0 };
      catMap[r.category].total += r.amount;
    });
    const categoryStats = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 5);

    this.setData({
      monthIncome,
      monthExpense,
      monthBalance: monthIncome - monthExpense,
      budgetMonthly: budget.monthly,
      budgetPercent,
      categoryStats,
    });

    this.filterRecords(records);
  },

  filterRecords(records) {
    const { filterType, filterPeriod } = this.data;
    if (!records) records = wx.getStorageSync('financeRecords') || [];

    const range = getDateRange(filterPeriod === 'all' ? 'all' : filterPeriod);
    let filtered = records.filter(r => {
      const inRange = r.timestamp >= range.start && r.timestamp <= range.end;
      const typeMatch = filterType === 'all' || r.type === filterType;
      return inRange && typeMatch;
    });

    // 按日期分组
    const groupMap = {};
    filtered.sort((a, b) => b.timestamp - a.timestamp).forEach(r => {
      const dateKey = formatDate(new Date(r.timestamp));
      if (!groupMap[dateKey]) groupMap[dateKey] = { date: dateKey, records: [], income: 0, expense: 0 };
      groupMap[dateKey].records.push({
        ...r,
        catInfo: getCategoryInfo(r.category, r.type),
      });
      if (r.type === 'income') groupMap[dateKey].income += r.amount;
      else groupMap[dateKey].expense += r.amount;
    });

    const groupedRecords = Object.values(groupMap);
    this.setData({ groupedRecords });
  },

  // 切换筛选
  setFilterType(e) {
    this.setData({ filterType: e.currentTarget.dataset.type });
    this.filterRecords();
  },
  setFilterPeriod(e) {
    this.setData({ filterPeriod: e.currentTarget.dataset.period });
    this.filterRecords();
  },

  // 打开新增弹窗
  openAddModal() {
    const today = formatDate(new Date());
    this.setData({
      showAddModal: true,
      form: { type: 'expense', amount: '', category: 'food', note: '', date: today }
    });
  },
  closeAddModal() { this.setData({ showAddModal: false }); },

  // 切换收入/支出
  setFormType(e) {
    const type = e.currentTarget.dataset.type;
    const defaultCat = type === 'expense' ? 'food' : 'salary';
    this.setData({ 'form.type': type, 'form.category': defaultCat });
  },

  setFormCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.key });
  },

  onAmountInput(e) { this.setData({ 'form.amount': e.detail.value }); },
  onNoteInput(e) { this.setData({ 'form.note': e.detail.value }); },
  onDateChange(e) { this.setData({ 'form.date': e.detail.value }); },

  // 保存记录
  saveRecord() {
    const { form } = this.data;
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      showError('请输入有效金额');
      return;
    }

    const records = wx.getStorageSync('financeRecords') || [];
    const dateTs = form.date ? new Date(form.date).getTime() : Date.now();

    records.push({
      id: genId(),
      type: form.type,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      category: form.category,
      note: form.note,
      timestamp: dateTs,
      createAt: Date.now(),
    });

    wx.setStorageSync('financeRecords', records);
    this.setData({ showAddModal: false });
    showSuccess('记录已保存');
    this.loadData();
  },

  // 删除记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('financeRecords') || [];
          records = records.filter(r => r.id !== id);
          wx.setStorageSync('financeRecords', records);
          this.loadData();
          showSuccess('已删除');
        }
      }
    });
  },

  // 预算管理
  openBudgetModal() {
    this.setData({ showBudgetModal: true, budgetInput: String(this.data.budgetMonthly || '') });
  },
  closeBudgetModal() { this.setData({ showBudgetModal: false }); },
  onBudgetInput(e) { this.setData({ budgetInput: e.detail.value }); },
  saveBudget() {
    const val = parseFloat(this.data.budgetInput);
    if (isNaN(val) || val < 0) { showError('请输入有效金额'); return; }
    wx.setStorageSync('budget', { monthly: val });
    this.setData({ showBudgetModal: false });
    this.loadData();
    showSuccess('预算已设置');
  },
});
