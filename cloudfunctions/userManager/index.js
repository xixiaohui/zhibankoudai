/**
 * userManager 云函数 - 用户管理
 * 
 * 功能：
 * 1. 获取或创建用户记录
 * 2. 更新用户信息
 * 3. 查询用户生成记录
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('【UserManager】action:', action, 'openid:', openid)
  
  try {
    switch (action) {
      case 'getOrCreate':
        return await getOrCreateUser(openid, data)
      
      case 'update':
        return await updateUser(openid, data)
      
      case 'getStats':
        return await getUserStats(openid)
      
      case 'bindNickname':
        return await bindNickname(openid, data)
      
      case 'deleteUser':
        return await deleteUser(openid)
      
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('【UserManager】执行失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取或创建用户
 */
async function getOrCreateUser(openid, data = {}) {
  // 先查询用户是否存在
  const { data: users } = await db.collection('users')
    .where({ openid })
    .limit(1)
    .get()
  
  if (users && users.length > 0) {
    // 用户已存在，返回用户信息
    console.log('【UserManager】用户已存在:', users[0]._id)
    return {
      success: true,
      user: users[0],
      isNew: false
    }
  }
  
  // 创建新用户
  const now = new Date()
  const userInfo = {
    openid,
    userId: generateUserId(),  // 生成唯一用户ID
    nickname: data.nickname || '智伴用户',
    avatar: data.avatar || '',
    createdAt: now,
    updatedAt: now,
    // 统计信息
    stats: {
      totalGenerations: 0,     // 总生成次数
      quoteCount: 0,           // 名言生成次数
      jokeCount: 0,            // 段子生成次数
      psychologyCount: 0,      // 心理学生成次数
      wisdomBagCount: 0,       // 智慧锦囊生成次数
      // 其他模块计数...
    },
    // 用户设置
    settings: {
      preferTone: data.preferTone || '温暖',
      preferGreeting: data.preferGreeting || '你好',
    }
  }
  
  const res = await db.collection('users').add({
    data: userInfo
  })
  
  console.log('【UserManager】新用户创建成功:', res._id)
  
  return {
    success: true,
    user: { _id: res._id, ...userInfo },
    isNew: true
  }
}

/**
 * 更新用户信息
 */
async function updateUser(openid, data) {
  const updateData = {
    updatedAt: new Date()
  }
  
  // 只更新允许的字段
  const allowedFields = ['nickname', 'avatar', 'settings']
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field]
    }
  }
  
  const res = await db.collection('users')
    .where({ openid })
    .update({ data: updateData })
  
  console.log('【UserManager】用户更新成功:', res.updated)
  
  return {
    success: true,
    updated: res.updated
  }
}

/**
 * 绑定昵称（从本地存储同步到云端）
 */
async function bindNickname(openid, data) {
  const { nickname } = data
  if (!nickname) {
    return { success: false, error: '昵称不能为空' }
  }
  
  // 先获取用户
  const { data: users } = await db.collection('users')
    .where({ openid })
    .limit(1)
    .get()
  
  if (!users || users.length === 0) {
    // 用户不存在，先创建
    const result = await getOrCreateUser(openid, { nickname })
    return result
  }
  
  // 更新昵称
  await db.collection('users')
    .doc(users[0]._id)
    .update({
      data: {
        nickname,
        updatedAt: new Date()
      }
    })
  
  return {
    success: true,
    nickname
  }
}

/**
 * 获取用户统计
 */
async function getUserStats(openid) {
  const { data: users } = await db.collection('users')
    .where({ openid })
    .limit(1)
    .get()
  
  if (!users || users.length === 0) {
    return {
      success: true,
      stats: null
    }
  }
  
  return {
    success: true,
    stats: users[0].stats || {}
  }
}

/**
 * 生成唯一用户ID（格式: U + 时间戳后8位 + 随机4位）
 */
function generateUserId() {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `U${timestamp}${random}`
}

/**
 * 删除用户（清除登录状态时调用）
 */
async function deleteUser(openid) {
  if (!openid) {
    return { success: false, error: 'openid 不能为空' }
  }
  
  try {
    // 查询用户
    const { data: users } = await db.collection('users')
      .where({ openid })
      .limit(1)
      .get()
    
    if (!users || users.length === 0) {
      console.log('【UserManager】删除用户：用户不存在')
      return { success: true, message: '用户不存在' }
    }
    
    // 删除用户记录
    await db.collection('users').doc(users[0]._id).remove()
    
    console.log('【UserManager】删除用户成功:', users[0]._id)
    return { success: true }
    
  } catch (error) {
    console.error('【UserManager】删除用户失败:', error)
    return { success: false, error: error.message }
  }
}
