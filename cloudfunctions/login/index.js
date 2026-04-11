/**
 * login 云函数 - 获取用户 OpenId（轻量版）
 * 
 * 功能：快速获取用户唯一标识 OpenId
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('【Login】云函数被调用')
  
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext()
    
    // 获取用户 OpenId
    const openid = wxContext.OPENID || 'anonymous'
    const appid = wxContext.APPID || ''
    
    console.log('【Login】获取到 OpenId:', openid)
    
    return {
      success: true,
      openid: openid,
      appid: appid,
    }
    
  } catch (error) {
    console.error('【Login】云函数执行失败:', error)
    return {
      success: false,
      openid: 'anonymous',
      error: error.message,
    }
  }
}
