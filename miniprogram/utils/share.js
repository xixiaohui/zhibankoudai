/**
 * share.js - 分享工具
 * 提供统一的分享到朋友圈和分享给朋友的配置
 */

// 默认分享配置
const DEFAULT_SHARE = {
  title: '智伴口袋 - 你的智能陪伴助手',
  path: '/pages/index/index',
  imageUrl: '/images/share-cover.png',
  desc: '随时随地，陪伴左右。记录心情、规划目标、与AI对话，让智伴成为你的贴心伙伴~'
}

/**
 * 获取分享给朋友的配置
 * @param {Object} options - 自定义配置
 * @param {string} options.title - 分享标题
 * @param {string} options.path - 分享路径
 * @param {string} options.imageUrl - 图片URL
 * @param {string} options.desc - 描述
 * @returns {Object} 分享配置
 */
function getShareAppMessage(options = {}) {
  return {
    title: options.title || DEFAULT_SHARE.title,
    path: options.path || DEFAULT_SHARE.path,
    imageUrl: options.imageUrl || DEFAULT_SHARE.imageUrl,
    desc: options.desc || DEFAULT_SHARE.desc
  }
}

/**
 * 获取分享到朋友圈的配置
 * @param {Object} options - 自定义配置
 * @param {string} options.title - 分享标题
 * @param {string} options.imageUrl - 图片URL
 * @returns {Object} 朋友圈分享配置
 */
function getShareTimeline(options = {}) {
  return {
    title: options.title || DEFAULT_SHARE.title,
    imageUrl: options.imageUrl || DEFAULT_SHARE.imageUrl,
    query: options.query || ''
  }
}

/**
 * 注册分享菜单（在 onShow 中调用）
 * @param {Object} that - 页面实例
 */
function registerShareMenu(that) {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

/**
 * 分享给朋友
 * @param {Object} options - 自定义配置
 */
function onShareAppMessage(options = {}) {
  return getShareAppMessage(options)
}

/**
 * 分享到朋友圈
 * @param {Object} options - 自定义配置
 */
function onShareTimeline(options = {}) {
  return getShareTimeline(options)
}

module.exports = {
  DEFAULT_SHARE,
  getShareAppMessage,
  getShareTimeline,
  registerShareMenu,
  onShareAppMessage,
  onShareTimeline
}
