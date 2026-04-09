// pages/expert/index.js - 个人专家资料库
const { formatDate, genId, showSuccess, showError } = require('../../utils/util');

// 技能分类配置
const SKILL_CATEGORIES = [
  { key: 'frontend', label: '前端技术', icon: '🎨', color: '#6C63FF' },
  { key: 'backend', label: '后端技术', icon: '⚙️', color: '#43D9AD' },
  { key: 'database', label: '数据库', icon: '💾', color: '#FFB347' },
  { key: 'devops', label: 'DevOps', icon: '🚀', color: '#FF6584' },
  { key: 'tool', label: '工具软件', icon: '🔧', color: '#9C27B0' },
  { key: 'soft', label: '软技能', icon: '🤝', color: '#4CAF50' },
];

// 项目分类配置
const PROJECT_CATEGORIES = [
  { key: 'web', label: 'Web应用', icon: '🌐', color: '#6C63FF' },
  { key: 'miniapp', label: '小程序', icon: '📱', color: '#43D9AD' },
  { key: 'mobile', label: '移动端', icon: '📲', color: '#FFB347' },
  { key: 'desktop', label: '桌面端', icon: '🖥️', color: '#FF6584' },
  { key: 'backend', label: '后端服务', icon: '⚙️', color: '#9C27B0' },
  { key: 'ai', label: 'AI项目', icon: '🤖', color: '#4CAF50' },
];

Page({
  data: {
    // 专家资料
    expertProfile: {
      name: '',
      title: '',
      avatar: '',
      bio: '',
      email: '',
      phone: '',
      github: '',
      website: '',
      skills: [],
      level: 'junior',
    },

    // 当前Tab
    activeTab: 'profile',
    tabs: [
      { key: 'profile', label: '个人名片', icon: '👤' },
      { key: 'skills', label: '技能管理', icon: '🎯' },
      { key: 'projects', label: '项目经验', icon: '📁' },
      { key: 'knowledge', label: '知识卡片', icon: '📚' },
    ],

    // 技能相关
    skills: [],
    skillCategories: SKILL_CATEGORIES,
    showAddSkill: false,
    skillForm: { name: '', category: 'frontend', level: 3, desc: '' },
    skillLevels: [
      { value: 1, label: '了解' },
      { value: 2, label: '熟悉' },
      { value: 3, label: '掌握' },
      { value: 4, label: '精通' },
      { value: 5, label: '专家' },
    ],

    // 项目相关
    projects: [],
    projectCategories: PROJECT_CATEGORIES,
    showAddProject: false,
    projectForm: {
      name: '',
      category: 'web',
      role: '',
      desc: '',
      techStack: '',
      link: '',
      status: 'progress',
      startDate: '',
      endDate: '',
      highlights: '',
    },
    projectStatus: [
      { key: 'planning', label: '规划中', color: '#9E9E9E' },
      { key: 'progress', label: '进行中', color: '#6C63FF' },
      { key: 'completed', label: '已完成', color: '#43D9AD' },
      { key: 'paused', label: '已暂停', color: '#FFB347' },
    ],

    // 知识卡片相关
    knowledgeCards: [],
    showAddKnowledge: false,
    knowledgeForm: {
      title: '',
      content: '',
      tags: '',
      category: 'tech',
    },
    knowledgeCategories: SKILL_CATEGORIES,

    // 展示模式
    viewMode: 'edit',

    // 统计数据
    stats: {
      totalSkills: 0,
      totalProjects: 0,
      totalKnowledge: 0,
      skillStats: {},
    },
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const profile = wx.getStorageSync('expertProfile') || {
      name: '',
      title: '',
      avatar: '',
      bio: '',
      email: '',
      phone: '',
      github: '',
      website: '',
      level: 'junior',
    };

    const skills = wx.getStorageSync('expertSkills') || [];
    const projects = wx.getStorageSync('expertProjects') || [];
    const knowledgeCards = wx.getStorageSync('expertKnowledge') || [];

    const skillStats = {};
    SKILL_CATEGORIES.forEach(cat => {
      skillStats[cat.key] = skills.filter(s => s.category === cat.key).length;
    });

    this.setData({
      expertProfile: profile,
      skills,
      projects,
      knowledgeCards,
      stats: {
        totalSkills: skills.length,
        totalProjects: projects.length,
        totalKnowledge: knowledgeCards.length,
        skillStats,
      }
    });
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // ===== 专家资料 =====
  onProfileInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.currentTarget.dataset.value;
    if (value !== undefined) {
      this.setData({ 'expertProfile.level': value });
    } else {
      this.setData({ [`expertProfile.${field}`]: e.detail.value });
    }
  },

  saveProfile() {
    const profile = this.data.expertProfile;
    wx.setStorageSync('expertProfile', profile);
    showSuccess('资料已保存');
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ 'expertProfile.avatar': tempFilePath });
      }
    });
  },

  // ===== 技能管理 =====
  openAddSkill() {
    this.setData({
      showAddSkill: true,
      skillForm: { name: '', category: 'frontend', level: 3, desc: '' }
    });
  },
  closeAddSkill() {
    this.setData({ showAddSkill: false });
  },

  onSkillInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`skillForm.${field}`]: e.detail.value });
  },

  setSkillCategory(e) {
    this.setData({ 'skillForm.category': e.currentTarget.dataset.category });
  },

  setSkillLevel(e) {
    this.setData({ 'skillForm.level': e.currentTarget.dataset.level });
  },

  saveSkill() {
    const { skillForm } = this.data;
    if (!skillForm.name.trim()) {
      showError('请输入技能名称');
      return;
    }

    const skills = wx.getStorageSync('expertSkills') || [];
    const cat = SKILL_CATEGORIES.find(c => c.key === skillForm.category);

    skills.push({
      id: genId(),
      name: skillForm.name.trim(),
      category: skillForm.category,
      level: skillForm.level,
      desc: skillForm.desc.trim(),
      icon: cat ? cat.icon : '💡',
      createAt: Date.now(),
    });

    wx.setStorageSync('expertSkills', skills);
    this.setData({ showAddSkill: false });
    this.loadData();
    showSuccess('技能已添加');
  },

  deleteSkill(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除技能',
      content: '确定要删除这个技能吗？',
      success: (res) => {
        if (res.confirm) {
          let skills = wx.getStorageSync('expertSkills') || [];
          skills = skills.filter(s => s.id !== id);
          wx.setStorageSync('expertSkills', skills);
          this.loadData();
          showSuccess('已删除');
        }
      }
    });
  },

  // ===== 项目经验 =====
  openAddProject() {
    this.setData({
      showAddProject: true,
      projectForm: {
        name: '',
        category: 'web',
        role: '',
        desc: '',
        techStack: '',
        link: '',
        status: 'progress',
        startDate: formatDate(new Date()),
        endDate: '',
        highlights: '',
      }
    });
  },
  closeAddProject() {
    this.setData({ showAddProject: false });
  },

  onProjectInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`projectForm.${field}`]: e.detail.value });
  },

  setProjectCategory(e) {
    this.setData({ 'projectForm.category': e.currentTarget.dataset.category });
  },

  setProjectStatus(e) {
    this.setData({ 'projectForm.status': e.currentTarget.dataset.status });
  },

  onProjectDateChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`projectForm.${field}`]: e.detail.value });
  },

  saveProject() {
    const { projectForm } = this.data;
    if (!projectForm.name.trim()) {
      showError('请输入项目名称');
      return;
    }
    if (!projectForm.desc.trim()) {
      showError('请输入项目描述');
      return;
    }

    const projects = wx.getStorageSync('expertProjects') || [];
    const cat = PROJECT_CATEGORIES.find(c => c.key === projectForm.category);

    projects.push({
      id: genId(),
      name: projectForm.name.trim(),
      category: projectForm.category,
      categoryIcon: cat ? cat.icon : '📁',
      role: projectForm.role.trim(),
      desc: projectForm.desc.trim(),
      techStack: projectForm.techStack.trim(),
      link: projectForm.link.trim(),
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      highlights: projectForm.highlights.trim(),
      createAt: Date.now(),
    });

    wx.setStorageSync('expertProjects', projects);
    this.setData({ showAddProject: false });
    this.loadData();
    showSuccess('项目已添加');
  },

  deleteProject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除项目',
      content: '确定要删除这个项目吗？',
      success: (res) => {
        if (res.confirm) {
          let projects = wx.getStorageSync('expertProjects') || [];
          projects = projects.filter(p => p.id !== id);
          wx.setStorageSync('expertProjects', projects);
          this.loadData();
          showSuccess('已删除');
        }
      }
    });
  },

  // ===== 知识卡片 =====
  openAddKnowledge() {
    this.setData({
      showAddKnowledge: true,
      knowledgeForm: {
        title: '',
        content: '',
        tags: '',
        category: 'tech',
      }
    });
  },
  closeAddKnowledge() {
    this.setData({ showAddKnowledge: false });
  },

  onKnowledgeInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`knowledgeForm.${field}`]: e.detail.value });
  },

  setKnowledgeCategory(e) {
    this.setData({ 'knowledgeForm.category': e.currentTarget.dataset.category });
  },

  saveKnowledge() {
    const { knowledgeForm } = this.data;
    if (!knowledgeForm.title.trim()) {
      showError('请输入标题');
      return;
    }
    if (!knowledgeForm.content.trim()) {
      showError('请输入内容');
      return;
    }

    const cards = wx.getStorageSync('expertKnowledge') || [];
    const cat = SKILL_CATEGORIES.find(c => c.key === knowledgeForm.category);

    cards.push({
      id: genId(),
      title: knowledgeForm.title.trim(),
      content: knowledgeForm.content.trim(),
      tags: knowledgeForm.tags.trim(),
      category: knowledgeForm.category,
      icon: cat ? cat.icon : '📝',
      createAt: Date.now(),
      date: formatDate(new Date()),
    });

    wx.setStorageSync('expertKnowledge', cards);
    this.setData({ showAddKnowledge: false });
    this.loadData();
    showSuccess('知识卡片已添加');
  },

  deleteKnowledge(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除卡片',
      content: '确定要删除这个知识卡片吗？',
      success: (res) => {
        if (res.confirm) {
          let cards = wx.getStorageSync('expertKnowledge') || [];
          cards = cards.filter(k => k.id !== id);
          wx.setStorageSync('expertKnowledge', cards);
          this.loadData();
          showSuccess('已删除');
        }
      }
    });
  },

  // 预览名片
  previewCard() {
    this.setData({ viewMode: 'preview' });
  },

  editCard() {
    this.setData({ viewMode: 'edit' });
  },

  // 分享名片
  shareCard() {
    wx.showModal({
      title: '分享名片',
      content: '可以将您的专家资料导出为图片分享',
      confirmText: '生成分享图',
      success: (res) => {
        if (res.confirm) {
          showSuccess('功能开发中，敬请期待');
        }
      }
    });
  },

  // 复制信息
  copyInfo(e) {
    const text = e.currentTarget.dataset.text;
    if (text) {
      wx.setClipboardData({
        data: text,
        success: () => showSuccess('已复制到剪贴板')
      });
    }
  },
});
