// pages/mine/index.js - 我的
const { formatDate } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    stats: {
      records: 0,
      notes: 0,
      todos: 0,
      habits: 0,
    },
    menuList: [
      { icon: '💰', label: '财务统计', desc: '查看收支分析', action: 'finance' },
      { icon: '📊', label: '学习报告', desc: '学习进度概览', action: 'study' },
      { icon: '🎯', label: '目标管理', desc: '设置人生目标', action: 'goals' },
      { icon: '⚙️', label: '偏好设置', desc: '个性化配置', action: 'settings' },
      { icon: '🔔', label: '消息通知', desc: '通知权限管理', action: 'notify' },
      { icon: '🗂️', label: '数据备份', desc: '备份与恢复', action: 'backup' },
      { icon: '❓', label: '使用帮助', desc: '功能指引', action: 'help' },
      { icon: '⭐', label: '给个好评', desc: '支持我们', action: 'rate' },
    ],
    appVersion: '1.0.0',
    joinDate: formatDate(new Date()),
  },

  onShow() {
    this.loadStats();
    this.loadUserInfo();
  },

  loadStats() {
    const records = wx.getStorageSync('financeRecords') || [];
    const notes = wx.getStorageSync('studyNotes') || [];
    const todos = wx.getStorageSync('todoList') || [];
    const habits = wx.getStorageSync('habits') || [];
    this.setData({
      stats: {
        records: records.length,
        notes: notes.length,
        todos: todos.filter(t => t.done).length,
        habits: habits.length,
      }
    });
  },

  loadUserInfo() {
    const savedUser = wx.getStorageSync('userInfo');
    if (savedUser) {
      this.setData({ userInfo: savedUser });
    }
  },

  // 登录/获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于展示您的个人信息',
      success: (res) => {
        const userInfo = res.userInfo;
        wx.setStorageSync('userInfo', userInfo);
        this.setData({ userInfo });
        wx.showToast({ title: '登录成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '取消登录', icon: 'none' });
      }
    });
  },

  onMenuTap(e) {
    const action = e.currentTarget.dataset.action;
    const actionMap = {
      finance: () => wx.switchTab({ url: '/pages/finance/index' }),
      study: () => wx.switchTab({ url: '/pages/study/index' }),
      goals: () => wx.showToast({ title: '目标管理开发中', icon: 'none' }),
      settings: () => this.openSettings(),
      notify: () => wx.openSetting(),
      backup: () => this.doBackup(),
      help: () => this.showHelp(),
      rate: () => wx.showToast({ title: '感谢您的支持！', icon: 'success' }),
    };
    if (actionMap[action]) actionMap[action]();
  },

  openSettings() {
    wx.showActionSheet({
      itemList: ['切换深色/浅色模式', '清除缓存', '重置所有数据'],
      success: (res) => {
        if (res.tapIndex === 1) this.clearCache();
        if (res.tapIndex === 2) this.resetData();
      }
    });
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除图片等缓存，不影响数据',
      success: (res) => {
        if (res.confirm) wx.showToast({ title: '缓存已清除', icon: 'success' });
      }
    });
  },

  resetData() {
    wx.showModal({
      title: '⚠️ 重置数据',
      content: '将清除所有本地数据，此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '数据已重置', icon: 'success' });
          this.loadStats();
        }
      }
    });
  },

  doBackup() {
    const data = {
      financeRecords: wx.getStorageSync('financeRecords') || [],
      studyNotes: wx.getStorageSync('studyNotes') || [],
      todoList: wx.getStorageSync('todoList') || [],
      habits: wx.getStorageSync('habits') || [],
      budget: wx.getStorageSync('budget') || {},
      exportTime: new Date().toISOString(),
    };
    const json = JSON.stringify(data);
    wx.setClipboardData({
      data: json,
      success: () => wx.showModal({
        title: '备份成功',
        content: '数据已复制到剪贴板，请保存到备忘录',
        showCancel: false
      })
    });
  },

  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '📍 首页：总览所有模块\n💰 财务：记录收支，设置预算\n📚 学习：记笔记，专注计时\n🌱 生活：待办、习惯打卡\n🤖 AI：智能问答助手\n\n如有问题欢迎反馈！',
      showCancel: false
    });
  },
});
