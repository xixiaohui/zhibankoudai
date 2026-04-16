// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 所有需要清理的集合列表
const COLLECTIONS = [
  'dailyQuotes', 'dailyJokes', 'dailyPsychology', 'dailyFinance',
  'dailyLoves', 'dailyMovies', 'dailyMusics', 'dailyTechs',
  'dailyTcms', 'dailyTravels', 'dailyFortunes', 'dailyLiteratures',
  'dailyForeignTrades', 'dailyECommerces', 'dailyMaths', 'dailyEnglishes',
  'dailyProgrammings', 'dailyPhotographies', 'dailyBeauties', 'dailyInvestments',
  'dailyFishings', 'dailyFitnesses', 'dailyPets', 'dailyFashions',
  'dailyOutfits', 'dailyDecorations', 'dailyGlassFibers', 'dailyResins',
  'dailyTaxs', 'dailyLaws', 'dailyOfficials', 'dailyHandlings',
  'dailyFlorals', 'dailyHistorys', 'dailyMilitarys', 'dailyStocks',
  'dailyEconomics', 'dailyBusinesss', 'dailyNewss'
]

/**
 * 清理指定集合的重复数据
 * 每个日期只保留最新的一条记录
 */
async function cleanCollection(db, collectionName) {
  const collection = db.collection(collectionName)
  
  // 查询所有记录
  const { data: allRecords } = await collection.orderBy('createdAt', 'desc').limit(500).get()
  
  if (allRecords.length === 0) {
    return { collection: collectionName, total: 0, deleted: 0 }
  }
  
  // 按日期分组，保留最新的一条
  const dateMap = new Map() // date -> record
  const recordsToDelete = []
  
  for (const record of allRecords) {
    const date = record.date || 'unknown'
    if (!dateMap.has(date)) {
      dateMap.set(date, record._id)
    } else {
      // 如果已存在同日期的记录，标记这条为删除
      recordsToDelete.push(record._id)
    }
  }
  
  // 删除重复记录
  let deletedCount = 0
  for (const id of recordsToDelete) {
    try {
      await collection.doc(id).remove()
      deletedCount++
    } catch (e) {
      console.error(`删除记录 ${id} 失败:`, e.message)
    }
  }
  
  return {
    collection: collectionName,
    total: allRecords.length,
    unique: dateMap.size,
    deleted: deletedCount
  }
}

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const db = cloud.database()
  const results = []
  
  // 清理所有集合
  for (const collectionName of COLLECTIONS) {
    try {
      const result = await cleanCollection(db, collectionName)
      results.push(result)
      console.log(`${collectionName}: 删除 ${result.deleted}/${result.total} 条`)
    } catch (e) {
      console.error(`${collectionName} 清理失败:`, e.message)
      results.push({ collection: collectionName, error: e.message })
    }
  }
  
  // 汇总
  const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0)
  
  return {
    success: true,
    message: `清理完成，共删除 ${totalDeleted} 条重复记录`,
    results
  }
}
