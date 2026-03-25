// pages/study/index.js - 学习提升
const { formatDate, genId, STUDY_CATEGORIES, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    // 统计
    totalNotes: 0,
    todayMinutes: 0,
    streakDays: 0,

    // 分类筛选
    activeCategory: 'all',
    categories: [
      { key: 'all', label: '全部', icon: '📋' },
      ...STUDY_CATEGORIES,
    ],

    // 笔记列表
    notes: [],
    filteredNotes: [],

    // 弹窗
    showAddModal: false,
    showDetailModal: false,

    // 表单
    form: {
      title: '',
      content: '',
      category: 'tech',
      duration: '',
      tags: '',
      icon: '',
    },
    studyCategories: STUDY_CATEGORIES,

    // 详情
    currentNote: null,

    // 搜索
    searchKeyword: '',

    // 学习计时器
    isTimerRunning: false,
    timerSeconds: 0,
    timerDisplay: '00:00',
  },

  onShow() {
    this.loadData();
  },

  onUnload() {
    this.stopTimer();
  },

  loadData() {
    const notes = wx.getStorageSync('studyNotes') || [];
    const todayStr = formatDate(new Date());
    const studyLog = wx.getStorageSync('studyLog') || {};

    // 统计
    const todayMinutes = studyLog[todayStr] || 0;
    const totalNotes = notes.length;

    // 连续学习天数
    let streakDays = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = formatDate(d);
      if (studyLog[key] > 0) streakDays++;
      else break;
    }

    this.setData({ notes, totalNotes, todayMinutes, streakDays });
    this.filterNotes(notes);
  },

  filterNotes(notes) {
    if (!notes) notes = this.data.notes;
    const { activeCategory, searchKeyword } = this.data;

    let filtered = notes;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(n => n.category === activeCategory);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(kw) ||
        n.content.toLowerCase().includes(kw) ||
        (n.tags && n.tags.toLowerCase().includes(kw))
      );
    }

    // 按时间倒序
    filtered = [...filtered].sort((a, b) => b.createAt - a.createAt);

    // 获取分类信息
    const withCatInfo = filtered.map(n => {
      const cat = STUDY_CATEGORIES.find(c => c.key === n.category) || STUDY_CATEGORIES[0];
      return { ...n, catInfo: cat };
    });

    this.setData({ filteredNotes: withCatInfo });
  },

  setCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.key });
    this.filterNotes();
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.filterNotes();
  },

  // 打开新增
  openAddModal() {
    this.setData({
      showAddModal: true,
      form: { title: '', content: '', category: 'tech', duration: '', tags: '', icon: '📝' }
    });
  },
  closeAddModal() { this.setData({ showAddModal: false }); },

  setFormCategory(e) { this.setData({ 'form.category': e.currentTarget.dataset.key }); },
  onTitleInput(e) { this.setData({ 'form.title': e.detail.value }); },
  onContentInput(e) { this.setData({ 'form.content': e.detail.value }); },
  onDurationInput(e) { this.setData({ 'form.duration': e.detail.value }); },
  onTagsInput(e) { this.setData({ 'form.tags': e.detail.value }); },

  saveNote() {
    const { form } = this.data;
    if (!form.title.trim()) { showError('请输入标题'); return; }
    if (!form.content.trim()) { showError('请输入内容'); return; }

    const notes = wx.getStorageSync('studyNotes') || [];
    const cat = STUDY_CATEGORIES.find(c => c.key === form.category);
    const today = formatDate(new Date());

    notes.push({
      id: genId(),
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      duration: parseInt(form.duration) || 0,
      tags: form.tags.trim(),
      icon: cat ? cat.icon : '📝',
      date: today,
      createAt: Date.now(),
    });

    wx.setStorageSync('studyNotes', notes);

    // 更新学习日志
    if (form.duration > 0) {
      const log = wx.getStorageSync('studyLog') || {};
      log[today] = (log[today] || 0) + parseInt(form.duration);
      wx.setStorageSync('studyLog', log);
    }

    this.setData({ showAddModal: false });
    this.loadData();
    showSuccess('笔记已保存');
  },

  // 查看详情
  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      const cat = STUDY_CATEGORIES.find(c => c.key === note.category) || STUDY_CATEGORIES[0];
      this.setData({ showDetailModal: true, currentNote: { ...note, catInfo: cat } });
    }
  },
  closeDetail() { this.setData({ showDetailModal: false, currentNote: null }); },

  // 删除笔记
  deleteNote(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条笔记吗？',
      success: (res) => {
        if (res.confirm) {
          let notes = wx.getStorageSync('studyNotes') || [];
          notes = notes.filter(n => n.id !== id);
          wx.setStorageSync('studyNotes', notes);
          this.setData({ showDetailModal: false, currentNote: null });
          this.loadData();
          showSuccess('已删除');
        }
      }
    });
  },

  // 学习计时器
  startTimer() {
    if (this.data.isTimerRunning) return;
    this.setData({ isTimerRunning: true });
    this._timerInterval = setInterval(() => {
      const s = this.data.timerSeconds + 1;
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      this.setData({ timerSeconds: s, timerDisplay: `${m}:${sec}` });
    }, 1000);
  },

  stopTimer() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    this.setData({ isTimerRunning: false });
  },

  resetTimer() {
    this.stopTimer();
    // 保存今日学习时间
    if (this.data.timerSeconds > 0) {
      const today = formatDate(new Date());
      const log = wx.getStorageSync('studyLog') || {};
      log[today] = (log[today] || 0) + Math.floor(this.data.timerSeconds / 60);
      wx.setStorageSync('studyLog', log);
      showSuccess(`已记录 ${Math.floor(this.data.timerSeconds / 60)} 分钟学习时间`);
    }
    this.setData({ timerSeconds: 0, timerDisplay: '00:00' });
    this.loadData();
  },
});
