// utils/util.js - 智伴口袋通用工具

/**
 * 格式化日期
 */
const formatDate = (date) => {
  if (!date) date = new Date();
  if (typeof date === 'number') date = new Date(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 格式化时间
 */
const formatTime = (date) => {
  if (!date) date = new Date();
  if (typeof date === 'number') date = new Date(date);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * 格式化日期时间
 */
const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * 格式化金额（保留2位小数，千分位）
 */
const formatMoney = (amount) => {
  if (isNaN(amount)) return '0.00';
  return parseFloat(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * 获取今天、本周、本月的日期范围
 */
const getDateRange = (type) => {
  const now = new Date();
  let start, end;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (type === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (type === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  } else if (type === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(0);
  }
  return { start: start.getTime(), end: end.getTime() };
};

/**
 * 生成唯一ID
 */
const genId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
};

/**
 * 深拷贝
 */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * 防抖
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * 获取相对时间描述
 */
const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
  return formatDate(new Date(timestamp));
};

/**
 * 支出分类配置
 */
const EXPENSE_CATEGORIES = [
  { key: 'food', label: '餐饮', icon: '🍜', color: '#FF6584' },
  { key: 'transport', label: '交通', icon: '🚇', color: '#6C63FF' },
  { key: 'shopping', label: '购物', icon: '🛍️', color: '#FFB347' },
  { key: 'entertainment', label: '娱乐', icon: '🎮', color: '#43D9AD' },
  { key: 'medical', label: '医疗', icon: '💊', color: '#FF5252' },
  { key: 'education', label: '教育', icon: '📚', color: '#4CAF50' },
  { key: 'housing', label: '住房', icon: '🏠', color: '#9C27B0' },
  { key: 'communication', label: '通讯', icon: '📱', color: '#2196F3' },
  { key: 'fitness', label: '运动', icon: '💪', color: '#FF9800' },
  { key: 'other', label: '其他', icon: '💡', color: '#607D8B' },
];

const INCOME_CATEGORIES = [
  { key: 'salary', label: '工资', icon: '💼', color: '#4CAF50' },
  { key: 'bonus', label: '奖金', icon: '🎁', color: '#FFB347' },
  { key: 'investment', label: '理财', icon: '📈', color: '#6C63FF' },
  { key: 'freelance', label: '兼职', icon: '💻', color: '#43D9AD' },
  { key: 'gift', label: '红包', icon: '🧧', color: '#FF6584' },
  { key: 'other', label: '其他', icon: '✨', color: '#607D8B' },
];

/**
 * 获取分类信息
 */
const getCategoryInfo = (key, type = 'expense') => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find(c => c.key === key) || list[list.length - 1];
};

/**
 * 学习分类
 */
const STUDY_CATEGORIES = [
  { key: 'tech', label: '技术', icon: '💻', color: '#6C63FF' },
  { key: 'language', label: '语言', icon: '🌍', color: '#43D9AD' },
  { key: 'finance', label: '金融', icon: '📊', color: '#FFB347' },
  { key: 'reading', label: '阅读', icon: '📖', color: '#FF6584' },
  { key: 'career', label: '职场', icon: '🏢', color: '#4CAF50' },
  { key: 'life', label: '生活', icon: '🌱', color: '#9C27B0' },
];

/**
 * 提示弹窗
 */
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({ title, icon, duration });
};

const showSuccess = (title) => showToast(title, 'success');
const showError = (title) => showToast(title, 'none');
const showLoading = (title = '加载中...') => wx.showLoading({ title, mask: true });
const hideLoading = () => wx.hideLoading();

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  formatMoney,
  getDateRange,
  genId,
  deepClone,
  debounce,
  getRelativeTime,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  STUDY_CATEGORIES,
  getCategoryInfo,
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
};
