// app.js - 智伴口袋
App({
  onLaunch: function () {
    this.globalData = {
      env: "",
      userInfo: null,
      theme: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        accent: '#43D9AD',
        warning: '#FFB347',
        bg: '#F7F8FC',
      }
    };

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 初始化本地数据
    this.initLocalData();
  },

  // 初始化本地存储默认数据
  initLocalData() {
    if (!wx.getStorageSync('financeRecords')) {
      wx.setStorageSync('financeRecords', []);
    }
    if (!wx.getStorageSync('studyNotes')) {
      wx.setStorageSync('studyNotes', []);
    }
    if (!wx.getStorageSync('todoList')) {
      wx.setStorageSync('todoList', []);
    }
    if (!wx.getStorageSync('chatHistory')) {
      wx.setStorageSync('chatHistory', []);
    }
    if (!wx.getStorageSync('budget')) {
      wx.setStorageSync('budget', { monthly: 0, used: 0 });
    }
    if (!wx.getStorageSync('expertProfile')) {
      wx.setStorageSync('expertProfile', {
        name: '',
        title: '',
        avatar: '',
        bio: '',
        email: '',
        phone: '',
        github: '',
        website: '',
        level: 'junior',
      });
    }
    if (!wx.getStorageSync('expertSkills')) {
      wx.setStorageSync('expertSkills', []);
    }
    if (!wx.getStorageSync('expertProjects')) {
      wx.setStorageSync('expertProjects', []);
    }
    if (!wx.getStorageSync('expertKnowledge')) {
      wx.setStorageSync('expertKnowledge', []);
    }
    if (!wx.getStorageSync('habits')) {
      wx.setStorageSync('habits', []);
    }
    if (!wx.getStorageSync('reminders')) {
      wx.setStorageSync('reminders', []);
    }
    if (!wx.getStorageSync('studyLog')) {
      wx.setStorageSync('studyLog', {});
    }
  },

  globalData: {
    env: '',
    userInfo: null,
  }
});
