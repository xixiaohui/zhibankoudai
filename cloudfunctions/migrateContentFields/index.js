/**
 * 云函数：migrateContentFields
 * 迁移旧数据，补充缺失的字段
 * 确保 normalizeContent 后存入的数据能被模板正确读取
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 需要迁移的集合及其字段映射
const migrations = [
  {
    collection: 'dailyMusics',
    // 使用 sourceField 作为默认值
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      if (!record.summary) {
        updates.summary = record.content || record.description || ''
        if (updates.summary) needUpdate = true
      }
      if (!record.description) {
        updates.description = record.summary || record.content || ''
        if (updates.description) needUpdate = true
      }
      if (!record.content) {
        updates.content = record.summary || record.description || ''
        if (updates.content) needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  },
  {
    collection: 'dailyFortunes',
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      // 如果没有 content 但有 summary，用 summary 填充
      if (!record.content && record.summary) {
        updates.content = record.summary
        needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  },
  {
    collection: 'dailyLiteratures',
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      if (!record.title && record.author) {
        updates.title = record.author
        needUpdate = true
      }
      if (!record.content && record.summary) {
        updates.content = record.summary
        needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  },
  {
    collection: 'dailyQuotes',
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      if (!record.title && record.author) {
        updates.title = record.author
        needUpdate = true
      }
      if (!record.content && record.text) {
        updates.content = record.text
        needUpdate = true
      }
      if (!record.text) {
        updates.text = record.content || record.text || ''
        if (updates.text) needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  },
  {
    collection: 'dailyLoves',
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      if (!record.title && record.author) {
        updates.title = record.author
        needUpdate = true
      }
      if (!record.content && record.text) {
        updates.content = record.text
        needUpdate = true
      }
      if (!record.text) {
        updates.text = record.content || record.text || ''
        if (updates.text) needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  },
  {
    collection: 'dailyMovies',
    updateFn: (record) => {
      const updates = {}
      let needUpdate = false
      
      if (!record.content && record.summary) {
        updates.content = record.summary
        needUpdate = true
      }
      if (record.quote === undefined) {
        updates.quote = ''
        needUpdate = true
      }
      
      return needUpdate ? updates : null
    }
  }
]

exports.main = async (event, context) => {
  const results = []
  
  for (const migration of migrations) {
    try {
      // 获取集合中所有记录
      const { data: records } = await db.collection(migration.collection)
        .limit(1000)
        .get()
      
      let updatedCount = 0
      
      for (const record of records) {
        const updateData = migration.updateFn(record)
        
        if (updateData) {
          await db.collection(migration.collection)
            .doc(record._id)
            .update({
              data: updateData
            })
          updatedCount++
        }
      }
      
      results.push({
        collection: migration.collection,
        total: records.length,
        updated: updatedCount,
        success: true
      })
      
    } catch (e) {
      results.push({
        collection: migration.collection,
        error: e.message,
        success: false
      })
    }
  }
  
  return {
    success: true,
    message: '数据迁移完成',
    results
  }
}
