// cloudfunctions/wxacode/index.js
// 获取小程序码云函数
// 支持生成无限制小程序码

const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取 access_token
async function getAccessToken() {
  // 从云函数上下文获取 APPID
  const wxContext = cloud.getWXContext()
  const appid = process.env.APPID || wxContext.APPID
  const secret = process.env.SECRET
  
  // 如果没有配置 secret，返回错误提示
  if (!secret) {
    throw new Error('请在云开发控制台配置 SECRETE 环境变量')
  }

  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
    
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (result.access_token) {
            resolve(result.access_token)
          } else {
            reject(new Error(result.errmsg || '获取access_token失败'))
          }
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// 获取无限制小程序码
async function getWxacode(accessToken, options) {
  const { scene = 'from=poster', page = 'pages/index/index', width = 280, auto_color = false, line_color = { r: 0, g: 0, b: 0 }, is_hyaline = false } = options

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      scene,
      page,
      width,
      auto_color,
      line_color,
      is_hyaline
    })

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        
        // 检查是否返回错误
        try {
          const text = buffer.toString('utf8')
          const json = JSON.parse(text)
          
          if (json.errcode) {
            console.error('微信API错误：', json)
            reject(new Error(json.errmsg || `微信API错误码：${json.errcode}`))
            return
          }
        } catch (e) {
          // 不是JSON格式，说明是图片数据
        }
        
        // 返回图片 Buffer（转为 base64）
        resolve({
          buffer: buffer.toString('base64'),
          contentType: 'image/png'
        })
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

exports.main = async (event, context) => {
  console.log('【wxacode】接收参数：', event)
  
  try {
    // 获取 access_token
    const accessToken = await getAccessToken()
    console.log('【wxacode】获取access_token成功')
    
    // 获取小程序码
    const result = await getWxacode(accessToken, event)
    console.log('【wxacode】获取小程序码成功')
    
    return result
    
  } catch (err) {
    console.error('【wxacode】错误：', err.message)
    
    return {
      success: false,
      error: err.message,
      tip: '请确保在云开发控制台的环境变量中配置了 SECRET（小程序密钥）'
    }
  }
}
