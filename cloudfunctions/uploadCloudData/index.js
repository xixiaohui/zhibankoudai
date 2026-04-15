/**

云函数: tools/uploadCloudData/index.js
调用方式: wx.cloud.callFunction({ name: 'uploadCloudData' })

功能: 将本地 cloudData 目录下的所有 JSON 文件上传到云存储
*/
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const fs = require('fs')
const path = require('path')

exports.main = async (event, context) => {
  const cloudPath = event.cloudPath  // e.g. 'cloudData/modules/quote.json'
  const localPath = event.localPath  // e.g. '/path/to/local/quote.json'
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(localPath)) {
      return { success: false, error: '本地文件不存在' }
    }
    
    // 上传到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fs.readFileSync(localPath)
    })
    
    return {
      success: true,
      fileID: uploadResult.fileID,
      cloudPath: cloudPath
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
