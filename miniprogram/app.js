// app.js - 智伴口袋
App({
  onLaunch: function () {
    this.globalData = {
      env: "", // 填入你的云开发环境ID
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
  },

  globalData: {
    env: '',
    userInfo: null,
  }
});
