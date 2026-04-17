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

// 云函数配置
const CLOUD_CONFIG = {
  cloudEnabled: true,         // 是否启用云端同步
  maxRetries: 2,              // 最大重试次数
  retryDelay: 1000,           // 重试延迟(ms)
  timeout: 10000,             // 超时时间(ms)
}

// 云函数调用（带重试机制）
async function callCloudFunction(name, data, retries = 0) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data,
      config: {
        timeout: CLOUD_CONFIG.timeout
      }
    })
    return res
  } catch (e) {
    // 判断是否应该重试
    const isNetworkError = e.message?.includes('Failed to fetch') ||
                          e.message?.includes('request:fail') ||
                          e.message?.includes('timeout') ||
                          e.errMsg?.includes('Failed to fetch') ||
                          e.errMsg?.includes('request:fail')
    
    if (isNetworkError && retries < CLOUD_CONFIG.maxRetries) {
      console.log(`[UserManager] 云函数调用失败，${CLOUD_CONFIG.retryDelay * (retries + 1)}ms 后重试 (${retries + 1}/${CLOUD_CONFIG.maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, CLOUD_CONFIG.retryDelay * (retries + 1)))
      return callCloudFunction(name, data, retries + 1)
    }
    
    throw e
  }
}

/**
 * 检查网络状态
 */
function checkNetwork() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none')
      },
      fail: () => resolve(false)
    })
  })
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
    // 检查网络状态
    const hasNetwork = await checkNetwork()
    if (!hasNetwork || !CLOUD_CONFIG.cloudEnabled) {
      throw new Error('network unavailable')
    }
    
    const res = await callCloudFunction('userManager', {
      action: 'getOrCreate',
      data: {
        nickname: getLocalNickname()
      }
    })
    
    if (res.result && res.result.success) {
      userId = res.result.user.userId
      // 缓存到本地
      wx.setStorageSync(STORAGE_KEYS.USER_ID, userId)
      return userId
    }
  } catch (e) {
    console.warn('[UserManager] 云端获取用户ID失败，将使用临时ID')
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
  if (!nickname) return
  
  // 检查是否启用云端同步
  if (!CLOUD_CONFIG.cloudEnabled) {
    console.log('[UserManager] 云端同步已禁用')
    return
  }
  
  try {
    const hasNetwork = await checkNetwork()
    if (!hasNetwork) {
      console.log('[UserManager] 网络不可用，跳过昵称同步')
      return
    }
    
    await callCloudFunction('userManager', {
      action: 'bindNickname',
      data: { nickname }
    })
    console.log('[UserManager] 昵称同步成功')
  } catch (e) {
    // 静默处理网络错误，避免日志刷屏
    console.log('[UserManager] 昵称同步失败，将在下次网络恢复时重试')
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
  
  // 同步昵称到云端（静默处理，避免网络问题影响主流程）
  const nickname = getLocalNickname()
  if (nickname) {
    syncNickname(nickname)  // 不等待完成
  }
  
  console.log('[UserManager] 用户初始化完成')
}

/**
 * 启用/禁用云端同步
 */
function setCloudEnabled(enabled) {
  CLOUD_CONFIG.cloudEnabled = enabled
}

module.exports = {
  getUserId,
  getNickname,
  syncNickname,
  getUserInfo,
  initUser,
  setCloudEnabled,
  STORAGE_KEYS
}
