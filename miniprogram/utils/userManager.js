/**
 * utils/userManager.js - 用户管理客户端工具
 * 
 * 功能：
 * 1. 获取或创建用户唯一标识 (userId)
 * 2. 同步用户昵称到云端
 * 3. 统一管理用户信息
 */

const STORAGE_KEYS = {
  USER_ID: 'userId',           // 本地存储的用户ID
  USER_INFO: 'userProfile',   // 用户基本信息（含昵称）
}

/**
 * 获取用户ID（确保唯一标识存在）
 * @returns {Promise<string>} 用户ID
 */
async function getUserId() {
  // 1. 先检查本地缓存
  let userId = wx.getStorageSync(STORAGE_KEYS.USER_ID)
  
  if (userId) {
    return userId
  }
  
  // 2. 本地没有，从云端获取或创建
  try {
    const res = await wx.cloud.callFunction({
      name: 'userManager',
      data: {
        action: 'getOrCreate',
        data: {
          nickname: getLocalNickname()
        }
      }
    })
    
    if (res.result && res.result.success) {
      userId = res.result.user.userId
      // 缓存到本地
      wx.setStorageSync(STORAGE_KEYS.USER_ID, userId)
      return userId
    }
  } catch (e) {
    console.error('[UserManager] 获取用户ID失败:', e)
  }
  
  // 3. 云函数调用失败，生成临时ID
  userId = 'TEMP_' + Date.now()
  wx.setStorageSync(STORAGE_KEYS.USER_ID, userId)
  return userId
}

/**
 * 获取本地昵称（从 userProfile 中）
 */
function getLocalNickname() {
  try {
    const profile = wx.getStorageSync(STORAGE_KEYS.USER_INFO)
    return profile?.nickname || ''
  } catch (e) {
    return ''
  }
}

/**
 * 获取用户信息（昵称）
 */
function getNickname() {
  return getLocalNickname() || '智伴用户'
}

/**
 * 同步昵称到云端（当用户修改昵称时调用）
 * @param {string} nickname - 昵称
 */
async function syncNickname(nickname) {
  try {
    await wx.cloud.callFunction({
      name: 'userManager',
      data: {
        action: 'bindNickname',
        data: { nickname }
      }
    })
    console.log('[UserManager] 昵称同步成功')
  } catch (e) {
    console.error('[UserManager] 昵称同步失败:', e)
  }
}

/**
 * 获取完整的用户信息对象
 * @returns {Promise<object>} 用户信息 { userId, nickname, timestamp }
 */
async function getUserInfo() {
  const userId = await getUserId()
  const nickname = getNickname()
  const now = new Date()
  const timestamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  return {
    userId,
    nickname,
    timestamp,
    userName: nickname  // 兼容字段
  }
}

/**
 * 初始化用户（应用启动时调用一次）
 */
async function initUser() {
  // 确保用户ID存在
  await getUserId()
  
  // 同步昵称到云端
  const nickname = getLocalNickname()
  if (nickname) {
    await syncNickname(nickname)
  }
  
  console.log('[UserManager] 用户初始化完成')
}

module.exports = {
  getUserId,
  getNickname,
  syncNickname,
  getUserInfo,
  initUser,
  STORAGE_KEYS
}
