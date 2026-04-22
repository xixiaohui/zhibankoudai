// pages/dailyTest/dailyTest.js - 每日内容组件测试页面
Page({
  data: {},

  onLoad() {
    console.log('【测试页面】组件测试页面加载')
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '智伴口袋 - 每日精选内容',
      imageUrl: '/images/share-cover.png',
      query: 'from=dailyTest'
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '智伴AI - 每日精选内容',
      path: '/pages/dailyTest/index',
      imageUrl: '/images/share-cover.png',
      desc: '每天一点，美好生活~'
    }
  },
})
