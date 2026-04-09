// pages/mine/index.js - 我的
const { formatDate } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    stats: {
      records: 0,
      notes: 0,
      todos: 0,
      skills: 0,
      projects: 0,
    },
    menuList: [
      { icon: '🎯', label: '专家资料', desc: '管理个人名片', action: 'expert' },
      { icon: '💰', label: '财务统计', desc: '查看收支分析', action: 'finance' },
      { icon: '📊', label: '学习报告', desc: '学习进度概览', action: 'study' },
      { icon: '🌱', label: '生活管理', desc: '待办、习惯打卡', action: 'life' },
      { icon: '🔔', label: '消息通知', desc: '通知权限管理', action: 'notify' },
      { icon: '🗂️', label: '数据备份', desc: '备份与恢复', action: 'backup' },
      { icon: '⚙️', label: '偏好设置', desc: '个性化配置', action: 'settings' },
      { icon: '❓', label: '使用帮助', desc: '功能指引', action: 'help' },
    ],
    appVersion: '1.0.0',
  },

  onShow() {
    this.loadStats();
    this.loadUserInfo();
  },

  loadStats() {
    const records = wx.getStorageSync('financeRecords') || [];
    const notes = wx.getStorageSync('studyNotes') || [];
    const todos = wx.getStorageSync('todoList') || [];
    const skills = wx.getStorageSync('expertSkills') || [];
    const projects = wx.getStorageSync('expertProjects') || [];

    this.setData({
      stats: {
        records: records.length,
        notes: notes.length,
        todos: todos.filter(t => t.done).length,
        skills: skills.length,
        projects: projects.length,
      }
    });
  },

  loadUserInfo() {
    const savedUser = wx.getStorageSync('expertProfile');
    if (savedUser && savedUser.name) {
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
      expert: () => wx.switchTab({ url: '/pages/expert/index' }),
      finance: () => wx.showToast({ title: '财务功能开发中', icon: 'none' }),
      study: () => wx.showToast({ title: '学习功能开发中', icon: 'none' }),
      life: () => wx.showToast({ title: '生活功能开发中', icon: 'none' }),
      notify: () => wx.openSetting(),
      backup: () => this.doBackup(),
      settings: () => this.openSettings(),
      help: () => this.showHelp(),
    };
    if (actionMap[action]) actionMap[action]();
  },

  openSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存', '重置所有数据'],
      success: (res) => {
        if (res.tapIndex === 0) this.clearCache();
        if (res.tapIndex === 1) this.resetData();
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
      expertProfile: wx.getStorageSync('expertProfile') || {},
      expertSkills: wx.getStorageSync('expertSkills') || [],
      expertProjects: wx.getStorageSync('expertProjects') || [],
      expertKnowledge: wx.getStorageSync('expertKnowledge') || [],
      financeRecords: wx.getStorageSync('financeRecords') || [],
      studyNotes: wx.getStorageSync('studyNotes') || [],
      todoList: wx.getStorageSync('todoList') || [],
      habits: wx.getStorageSync('habits') || [],
      budget: wx.getStorageSync('budget') || {},
      exportTime: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
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
      content: '📍 首页：总览所有模块\n🎯 专家库：管理个人名片、技能、项目\n🤖 AI助手：智能问答助手\n\n💡 提示：定期备份数据防止丢失\n\n如有问题欢迎反馈！',
      showCancel: false
    });
  },
});
