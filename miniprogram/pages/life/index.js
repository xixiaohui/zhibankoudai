// pages/life/index.js - 日常生活
const { formatDate, formatTime, genId, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    // 待办统计
    totalTodos: 0,
    doneTodos: 0,
    pendingTodos: 0,

    // 待办列表
    todos: [],
    todoFilter: 'pending', // all/pending/done

    // 添加待办弹窗
    showAddTodo: false,
    todoForm: { text: '', priority: 'mid', deadline: '' },

    // 日程提醒
    reminders: [],
    showAddReminder: false,
    reminderForm: { title: '', time: '', note: '' },

    // 生活工具
    lifeTools: [
      { icon: '📅', label: '日历', color: '#6C63FF', bg: '#EEF0FF', action: 'calendar' },
      { icon: '⏰', label: '提醒', color: '#FF6584', bg: '#FFF0F3', action: 'reminder' },
      { icon: '📍', label: '位置', color: '#43D9AD', bg: '#E8FBF5', action: 'location' },
      { icon: '🌤️', label: '天气', color: '#FFB347', bg: '#FFF8E1', action: 'weather' },
      { icon: '🔢', label: '计算', color: '#9C27B0', bg: '#F3E5F5', action: 'calc' },
      { icon: '📷', label: '扫码', color: '#2196F3', bg: '#E3F2FD', action: 'scan' },
    ],

    // 习惯打卡
    habits: [],
    showAddHabit: false,
    habitForm: { name: '', icon: '', color: '#6C63FF' },
    habitIcons: ['🏃', '💧', '📖', '🧘', '🥗', '😴', '💊', '🎵', '✍️', '🏋️'],
    habitColors: ['#6C63FF', '#FF6584', '#43D9AD', '#FFB347', '#FF5252', '#4CAF50'],
    todayStr: '',
  },

  onShow() {
    const today = formatDate(new Date());
    this.setData({ todayStr: today });
    this.loadData();
  },

  loadData() {
    this.loadTodos();
    this.loadReminders();
    this.loadHabits();
  },

  loadTodos() {
    const all = wx.getStorageSync('todoList') || [];
    const done = all.filter(t => t.done).length;
    const pending = all.length - done;
    this.setData({ todos: all, totalTodos: all.length, doneTodos: done, pendingTodos: pending });
    this.filterTodos(all);
  },

  filterTodos(todos) {
    if (!todos) todos = this.data.todos;
    const { todoFilter } = this.data;
    let filtered = todos;
    if (todoFilter === 'pending') filtered = todos.filter(t => !t.done);
    else if (todoFilter === 'done') filtered = todos.filter(t => t.done);

    // 排序：优先级高的在前
    const priorityOrder = { high: 0, mid: 1, low: 2 };
    filtered = [...filtered].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
    this.setData({ todos: filtered });
  },

  setTodoFilter(e) {
    this.setData({ todoFilter: e.currentTarget.dataset.filter });
    this.filterTodos(wx.getStorageSync('todoList') || []);
  },

  // 切换完成状态
  toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    let todos = wx.getStorageSync('todoList') || [];
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.done = !todo.done;
      todo.doneAt = todo.done ? Date.now() : null;
      wx.setStorageSync('todoList', todos);
      this.loadTodos();
      if (todo.done) showSuccess('已完成 🎉');
    }
  },

  // 新增待办
  openAddTodo() {
    const today = formatDate(new Date());
    this.setData({ showAddTodo: true, todoForm: { text: '', priority: 'mid', deadline: today } });
  },
  closeAddTodo() { this.setData({ showAddTodo: false }); },

  onTodoInput(e) { this.setData({ 'todoForm.text': e.detail.value }); },
  setTodoPriority(e) { this.setData({ 'todoForm.priority': e.currentTarget.dataset.priority }); },
  onDeadlineChange(e) { this.setData({ 'todoForm.deadline': e.detail.value }); },

  saveTodo() {
    const { todoForm } = this.data;
    if (!todoForm.text.trim()) { showError('请输入内容'); return; }
    let todos = wx.getStorageSync('todoList') || [];
    todos.push({
      id: genId(),
      text: todoForm.text.trim(),
      priority: todoForm.priority,
      deadline: todoForm.deadline,
      done: false,
      createAt: Date.now(),
    });
    wx.setStorageSync('todoList', todos);
    this.setData({ showAddTodo: false });
    this.loadTodos();
    showSuccess('待办已添加');
  },

  // 删除待办
  deleteTodo(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除待办',
      content: '确定删除这个待办吗？',
      success: (res) => {
        if (res.confirm) {
          let todos = wx.getStorageSync('todoList') || [];
          todos = todos.filter(t => t.id !== id);
          wx.setStorageSync('todoList', todos);
          this.loadTodos();
        }
      }
    });
  },

  // 提醒
  loadReminders() {
    const all = wx.getStorageSync('reminders') || [];
    this.setData({ reminders: all.slice(0, 3) });
  },

  openAddReminder() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.setData({ showAddReminder: true, reminderForm: { title: '', time: timeStr, note: '' } });
  },
  closeAddReminder() { this.setData({ showAddReminder: false }); },

  onReminderTitleInput(e) { this.setData({ 'reminderForm.title': e.detail.value }); },
  onReminderTimeChange(e) { this.setData({ 'reminderForm.time': e.detail.value }); },
  onReminderNoteInput(e) { this.setData({ 'reminderForm.note': e.detail.value }); },

  saveReminder() {
    const { reminderForm } = this.data;
    if (!reminderForm.title.trim()) { showError('请输入标题'); return; }
    let reminders = wx.getStorageSync('reminders') || [];
    reminders.push({
      id: genId(),
      title: reminderForm.title.trim(),
      time: reminderForm.time,
      note: reminderForm.note.trim(),
      date: this.data.todayStr,
      createAt: Date.now(),
    });
    wx.setStorageSync('reminders', reminders);
    this.setData({ showAddReminder: false });
    this.loadReminders();
    showSuccess('提醒已设置');
  },

  // 工具入口
  onToolTap(e) {
    const action = e.currentTarget.dataset.action;
    const toolMap = {
      calendar: () => wx.showToast({ title: '请在设备日历中查看', icon: 'none' }),
      reminder: () => this.openAddReminder(),
      location: () => wx.getLocation({ type: 'wgs84', success: (res) => wx.showModal({ title: '当前位置', content: `纬度: ${res.latitude.toFixed(4)}\n经度: ${res.longitude.toFixed(4)}`, showCancel: false }) }),
      weather: () => wx.showToast({ title: '请接入天气API', icon: 'none' }),
      calc: () => wx.showToast({ title: '计算器功能开发中', icon: 'none' }),
      scan: () => wx.scanCode({ success: (res) => wx.showModal({ title: '扫码结果', content: res.result, showCancel: false }) }),
    };
    if (toolMap[action]) toolMap[action]();
  },

  // 习惯打卡
  loadHabits() {
    const habits = wx.getStorageSync('habits') || [];
    const today = this.data.todayStr;
    const withCheck = habits.map(h => ({
      ...h,
      checkedToday: (h.checkDays || []).includes(today),
    }));
    this.setData({ habits: withCheck });
  },

  openAddHabit() { this.setData({ showAddHabit: true, habitForm: { name: '', icon: '🏃', color: '#6C63FF' } }); },
  closeAddHabit() { this.setData({ showAddHabit: false }); },

  onHabitNameInput(e) { this.setData({ 'habitForm.name': e.detail.value }); },
  selectHabitIcon(e) { this.setData({ 'habitForm.icon': e.currentTarget.dataset.icon }); },
  selectHabitColor(e) { this.setData({ 'habitForm.color': e.currentTarget.dataset.color }); },

  saveHabit() {
    const { habitForm } = this.data;
    if (!habitForm.name.trim()) { showError('请输入习惯名称'); return; }
    let habits = wx.getStorageSync('habits') || [];
    habits.push({ id: genId(), name: habitForm.name.trim(), icon: habitForm.icon, color: habitForm.color, checkDays: [], createAt: Date.now() });
    wx.setStorageSync('habits', habits);
    this.setData({ showAddHabit: false });
    this.loadHabits();
    showSuccess('习惯已添加');
  },

  checkHabit(e) {
    const id = e.currentTarget.dataset.id;
    const today = this.data.todayStr;
    let habits = wx.getStorageSync('habits') || [];
    const habit = habits.find(h => h.id === id);
    if (habit) {
      if (!habit.checkDays) habit.checkDays = [];
      if (habit.checkDays.includes(today)) {
        habit.checkDays = habit.checkDays.filter(d => d !== today);
      } else {
        habit.checkDays.push(today);
        showSuccess(`${habit.icon} 打卡成功！`);
      }
      wx.setStorageSync('habits', habits);
      this.loadHabits();
    }
  },
});
