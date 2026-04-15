/**
 * utils/cloudData.js - 云端数据加载器
 * 
 * 功能：从云存储按需加载数据，支持本地缓存
 * 特点：
 *   - 本地缓存优先，减少网络请求
 *   - 异步更新，不阻塞UI
 *   - 按需加载，只加载需要的模块数据
 *   - 支持多个云端文件
 */

const ENV_ID = 'zhiban-4g34epre1ce6ce1c'

// ═══════════════════════════════════════════════════════════════════════════
// 云存储文件配置
// ═══════════════════════════════════════════════════════════════════════════

const CLOUD_FILES = {
  allData: {
    cloudID: `cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/dailyData/allData.json`,
    storageKey: 'cloudAllData',
    storageExpireKey: 'cloudAllData_expire'
  },
  promptsMeta: {
    cloudID: `cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/dailyData/promptsMeta.json`,
    storageKey: 'cloudPromptsMeta',
    storageExpireKey: 'cloudPromptsMeta_expire'
  },
  prompts: {
    cloudID: `cloud://zhiban-4g34epre1ce6ce1c.7a68-zhiban-4g34epre1ce6ce1c-1415458762/dailyData/prompts.json`,
    storageKey: 'cloudPrompts',
    storageExpireKey: 'cloudPrompts_expire'
  }
}

const CACHE_EXPIRE_MS = 24 * 60 * 60 * 1000 // 24小时过期

// ═══════════════════════════════════════════════════════════════════════════
// 内存缓存
// ═══════════════════════════════════════════════════════════════════════════

const memoryCache = {}

function setMemoryCache(key, data) {
  memoryCache[key] = data
}

function getMemoryCache(key) {
  return memoryCache[key] || null
}

// ═══════════════════════════════════════════════════════════════════════════
// 存储操作
// ═══════════════════════════════════════════════════════════════════════════

function getFromStorage(fileKey) {
  const config = CLOUD_FILES[fileKey]
  if (!config) return null
  
  try {
    const data = wx.getStorageSync(config.storageKey)
    const expire = wx.getStorageSync(config.storageExpireKey) || 0
    
    if (data && Date.now() < expire) {
      return data
    }
  } catch (e) {
    console.warn(`[CloudData] 读取 ${fileKey} 本地缓存失败:`, e)
  }
  return null
}

function saveToStorage(fileKey, data) {
  const config = CLOUD_FILES[fileKey]
  if (!config) return
  
  try {
    wx.setStorageSync(config.storageKey, data)
    wx.setStorageSync(config.storageExpireKey, Date.now() + CACHE_EXPIRE_MS)
  } catch (e) {
    console.warn(`[CloudData] 保存 ${fileKey} 本地缓存失败:`, e)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 云存储加载
// ═══════════════════════════════════════════════════════════════════════════

function loadFromCloud(fileKey) {
  const config = CLOUD_FILES[fileKey]
  if (!config) {
    return Promise.reject(new Error('未知的文件键: ' + fileKey))
  }
  
  return new Promise((resolve, reject) => {
    console.log(`[CloudData] 下载 ${fileKey}:`, config.cloudID)
    wx.cloud.downloadFile({
      fileID: config.cloudID,
      success: (res) => {
        console.log(`[CloudData] ${fileKey} 下载成功`)
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: 'utf8',
          success: (fileRes) => {
            try {
              const data = JSON.parse(fileRes.data)
              console.log(`[CloudData] ${fileKey} 解析成功`)
              resolve(data)
            } catch (e) {
              console.error(`[CloudData] ${fileKey} JSON解析失败:`, e)
              reject(new Error('JSON解析失败'))
            }
          },
          fail: (e) => {
            console.error(`[CloudData] ${fileKey} 读取文件失败:`, e)
            reject(e)
          }
        })
      },
      fail: (e) => {
        console.error(`[CloudData] ${fileKey} 下载文件失败:`, e)
        reject(e)
      }
    })
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// 对外接口
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 初始化并预加载数据（推荐在 app.js 中调用）
 * @param {string[]} fileKeys - 要预加载的文件键，默认加载 allData
 */
function init(fileKeys = ['allData']) {
  for (const key of fileKeys) {
    const cached = getFromStorage(key)
    if (cached) {
      setMemoryCache(key, cached)
      
      // 异步更新
      loadFromCloud(key).then(data => {
        setMemoryCache(key, data)
        saveToStorage(key, data)
        console.log(`[CloudData] ${key} 云端数据已更新`)
      }).catch(e => {
        console.warn(`[CloudData] ${key} 同步云端数据失败:`, e.message || e)
      })
    } else {
      // 强制加载
      loadFromCloud(key).then(data => {
        setMemoryCache(key, data)
        saveToStorage(key, data)
        console.log(`[CloudData] ${key} 首次加载成功`)
      }).catch(e => {
        console.warn(`[CloudData] ${key} 加载失败:`, e.message || e)
      })
    }
  }
}

/**
 * 获取单个模块数据
 * @param {string} moduleKey - 模块键名 (如 'quote', 'joke', 'psychology')
 * @returns {Object|null} 模块数据对象
 */
function getModuleData(moduleKey) {
  const allData = getMemoryCache('allData') || getFromStorage('allData')
  if (!allData) {
    console.log(`[CloudData] getModuleData: 无缓存数据`)
    return null
  }
  
  // 支持两种格式：直接是 key 或 modules.key
  if (allData[moduleKey]) {
    return allData[moduleKey]
  }
  if (allData.modules && allData.modules[moduleKey]) {
    return allData.modules[moduleKey]
  }
  
  console.log(`[CloudData] getModuleData: 未找到 ${moduleKey}`)
  return null
}

/**
 * 获取模块的配置字段（xxx_FIELDS, xxx_SCENES）
 * @param {string} moduleKey - 模块键名
 * @returns {Array|null}
 */
function getFields(moduleKey) {
  const moduleData = getModuleData(moduleKey)
  if (!moduleData) return null
  
  // 查找配置字段
  const configKeys = Object.keys(moduleData).filter(k => 
    k.includes('FIELD') || k.includes('SCENE') || k.includes('CATEGORY')
  )
  if (configKeys.length > 0) {
    return moduleData[configKeys[0]]
  }
  return null
}

/**
 * 获取模块的 fallback 数据数组
 * @param {string} moduleKey - 模块键名
 * @returns {Array|null}
 */
function getFallbackData(moduleKey) {
  const moduleData = getModuleData(moduleKey)
  if (!moduleData) return null
  
  // 查找数据数组
  const dataKeys = Object.keys(moduleData).filter(k => 
    k.startsWith('FALLBACK_') || k.endsWith('_DATA') || 
    k.endsWith('_QUOTES') || k.endsWith('_SCENES') || k.endsWith('_LIST')
  )
  if (dataKeys.length > 0) {
    return moduleData[dataKeys[0]]
  }
  return null
}

/**
 * 获取提示词元数据
 * @param {string} moduleKey - 模块键名
 * @returns {Object|null}
 */
function getPromptMeta(moduleKey) {
  const promptsMeta = getMemoryCache('promptsMeta') || getFromStorage('promptsMeta')
  if (!promptsMeta || !promptsMeta.modules) return null
  return promptsMeta.modules[moduleKey] || null
}

/**
 * 获取所有已缓存的数据
 * @returns {Object|null}
 */
function getAllData() {
  return getMemoryCache('allData') || getFromStorage('allData')
}

/**
 * 检查云存储是否可用
 */
function isCloudAvailable() {
  return wx.cloud !== undefined
}

/**
 * 清除所有缓存
 */
function clearCache() {
  Object.keys(memoryCache).forEach(k => delete memoryCache[k])
  
  for (const key of Object.keys(CLOUD_FILES)) {
    const config = CLOUD_FILES[key]
    try {
      wx.removeStorageSync(config.storageKey)
      wx.removeStorageSync(config.storageExpireKey)
    } catch (e) {
      console.warn(`[CloudData] 清除 ${key} 缓存失败:`, e)
    }
  }
  console.log('[CloudData] 所有缓存已清除')
}

/**
 * 获取缓存状态
 */
function getCacheStatus() {
  const status = {}
  for (const key of Object.keys(CLOUD_FILES)) {
    const config = CLOUD_FILES[key]
    try {
      const data = wx.getStorageSync(config.storageKey)
      const expire = wx.getStorageSync(config.storageExpireKey) || 0
      status[key] = {
        cached: !!data,
        expired: data && Date.now() >= expire
      }
    } catch (e) {
      status[key] = { cached: false, error: true }
    }
  }
  return status
}

module.exports = {
  init,
  getModuleData,
  getFields,
  getFallbackData,
  getPromptMeta,
  getAllData,
  isCloudAvailable,
  clearCache,
  getCacheStatus,
  ENV_ID,
  CLOUD_FILES,
}
