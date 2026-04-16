/**
 * 云函数：fixFortunesContent
 * 修复 dailyFortunes 的 content 字段，去除 " || " 问题
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 获取 dailyFortunes 中所有记录
    const { data: records } = await db.collection('dailyFortunes')
      .limit(1000)
      .get()
    
    let updatedCount = 0
    
    for (const record of records) {
      // 修复 content 字段中的 " || " 问题
      if (record.content && record.content.includes(' || ')) {
        const fixedContent = record.summary || ''
        await db.collection('dailyFortunes')
          .doc(record._id)
          .update({
            data: { content: fixedContent }
          })
        updatedCount++
      }
    }
    
    return {
      success: true,
      message: '修复完成',
      total: records.length,
      updated: updatedCount
    }
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
