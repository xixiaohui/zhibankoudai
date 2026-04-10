/**
 * 云函数 - 初始化云数据库集合
 * 用于创建聊天消息、用户画像、用户记忆等集合
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 集合配置
const COLLECTIONS = [
  {
    name: 'chatMessages',
    description: '聊天消息存储',
    fields: {
      openid: 'string',
      type: 'string',        // user / ai
      content: 'string',
      mode: 'string',
      time: 'string',
      date: 'string',
      uniqueId: 'string',
      isStreaming: 'boolean',
      createTime: 'date',
      isDeleted: 'boolean'
    }
  },
  {
    name: 'userProfile',
    description: '用户画像',
    fields: {
      openid: 'string',
      nickname: 'string',
      gender: 'string',
      occupation: 'string',
      location: 'string',
      communication: 'object',
      interests: 'array',
      personality: 'object',
      lifestyle: 'object',
      createTime: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'userMemory',
    description: '用户记忆',
    fields: {
      openid: 'string',
      shortTerm: 'object',
      longTerm: 'object',
      learnedFacts: 'array',
      createTime: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'moodRecords',
    description: '情绪记录',
    fields: {
      openid: 'string',
      mood: 'string',
      emoji: 'string',
      note: 'string',
      date: 'string',
      time: 'string',
      createTime: 'date'
    }
  },
  {
    name: 'userSettings',
    description: '用户设置',
    fields: {
      openid: 'string',
      theme: 'string',
      notifications: 'object',
      privacy: 'object',
      createTime: 'date',
      updateTime: 'date'
    }
  }
]

exports.main = async (event, context) => {
  const { action, collectionName } = event
  
  try {
    switch (action) {
      case 'createCollections':
        // 创建所有集合
        const created = []
        for (const col of COLLECTIONS) {
          try {
            // 尝试创建集合（如果已存在会报错，忽略即可）
            await db.createCollection(col.name)
            console.log(`Collection ${col.name} created`)
            created.push(col.name)
          } catch (e) {
            if (e.errCode === -502005) {
              // 集合已存在
              console.log(`Collection ${col.name} already exists`)
              created.push(col.name)
            } else {
              console.error(`Error creating ${col.name}:`, e)
            }
          }
        }
        return { success: true, created }
        
      case 'createOne':
        // 创建单个集合
        if (!collectionName) {
          return { success: false, error: 'collectionName is required' }
        }
        try {
          await db.createCollection(collectionName)
          return { success: true, collectionName }
        } catch (e) {
          if (e.errCode === -502005) {
            return { success: true, collectionName, message: 'already exists' }
          }
          return { success: false, error: e.message }
        }
        
      case 'listCollections':
        // 列出所有集合（需要管理员权限）
        return { success: true, collections: COLLECTIONS }
        
      case 'initIndexes':
        // 初始化索引
        const indexes = {
          chatMessages: [
            { name: 'openid_time', fields: [{ name: 'openid', order: 'asc' }, { name: 'createTime', order: 'desc' }] },
            { name: 'openid_mode', fields: [{ name: 'openid', order: 'asc' }, { name: 'mode', order: 'asc' }] }
          ],
          moodRecords: [
            { name: 'openid_date', fields: [{ name: 'openid', order: 'asc' }, { name: 'date', order: 'desc' }] }
          ]
        }
        return { success: true, indexes }
        
      default:
        return { success: false, error: 'Unknown action' }
    }
  } catch (e) {
    console.error('initDb error:', e)
    return { success: false, error: e.message }
  }
}
