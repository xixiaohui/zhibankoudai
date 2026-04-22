// miniprogram/pages/careerGuide/index.js - AI Agent 职业列表页
const { careerGuideData } = require('../../utils/careerGuideData.js')

Page({
  data: {
    // 分类列表
    categories: [],
    // 所有职业（扁平化）
    allAgents: [],
    // 当前展开的分类
    expandedCategories: {},
    // 搜索关键词
    searchKeyword: '',
    // 过滤后的分类
    filteredCategories: [],
    // 是否显示详情弹窗
    showAgentModal: false,
    // 当前选中的 Agent
    currentAgent: null,
  },

  onLoad(options) {
    this._initCareerData()
  },

  onShow() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 初始化职业数据
  _initCareerData() {
    const { categories } = careerGuideData
    
    // 扁平化所有 Agent
    const allAgents = []
    const categoryMap = {}
    
    categories.forEach(cat => {
      categoryMap[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, agents: [] }
      cat.careers.forEach(agent => {
        allAgents.push({
          ...agent,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        })
        categoryMap[cat.id].agents.push({
          ...agent,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        })
      })
    })
    
    // 默认展开第一个分类
    const expandedCategories = {}
    if (categories.length > 0) {
      expandedCategories[categories[0].id] = true
    }

    this.setData({
      categories: categories,
      allAgents: allAgents,
      filteredCategories: categories,
      expandedCategories,
    })
  },

  // 切换分类展开/收起
  toggleCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    const expandedCategories = { ...this.data.expandedCategories }
    expandedCategories[categoryId] = !expandedCategories[categoryId]
    this.setData({ expandedCategories })
  },

  // 点击 Agent 卡片
  onAgentTap(e) {
    const agent = e.currentTarget.dataset.agent
    wx.navigateTo({
      url: `/pages/careerGuideDetail/index?id=${agent.id}&category=${agent.categoryId}`
    })
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ searchKeyword: keyword })
    this._filterData(keyword)
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ searchKeyword: '', filteredCategories: this.data.categories })
  },

  // 过滤数据
  _filterData(keyword) {
    if (!keyword) {
      this.setData({ filteredCategories: this.data.categories })
      return
    }

    const { categories } = this.data
    const filtered = categories
      .map(cat => ({
        ...cat,
        careers: cat.careers.filter(agent =>
          agent.name.toLowerCase().includes(keyword) ||
          agent.description.toLowerCase().includes(keyword) ||
          (agent.skills && agent.skills.some(s => s.toLowerCase().includes(keyword)))
        )
      }))
      .filter(cat => cat.careers.length > 0)

    this.setData({ filteredCategories: filtered })
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'AI职业指南 - 探索你的职业之路',
      imageUrl: '/images/share-cover.png',
      query: 'from=careerGuide'
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: 'AI职业指南 - 探索你的职业之路',
      path: '/pages/careerGuide/index',
      imageUrl: '/images/share-cover.png',
      desc: '了解各行业发展趋势，探索适合自己的职业方向~'
    }
  },
})
