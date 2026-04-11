/**
 * utils/dailyData.js - 每日内容数据汇总
 * 
 * 功能：汇总导出所有板块数据配置
 * 各模块独立文件：
 * - quoteData.js: 名言数据
 * - jokeData.js: 段子数据
 * - psychologyData.js: 心理学数据
 * - financeData.js: 金融数据
 * - loveData.js: 情话数据
 */

const { QUOTE_FIELDS, FAMOUS_QUOTES } = require('./quoteData.js')
const { JOKE_SCENES, FALLBACK_JOKES } = require('./jokeData.js')
const { PSYCHOLOGY_FIELDS, FALLBACK_PSYCHOLOGY } = require('./psychologyData.js')
const { FINANCE_FIELDS, FALLBACK_FINANCE } = require('./financeData.js')
const { LOVE_FIELDS, FALLBACK_LOVE } = require('./loveData.js')

module.exports = {
  // 名言板块
  QUOTE_FIELDS,
  FAMOUS_QUOTES,
  // 段子板块
  JOKE_SCENES,
  FALLBACK_JOKES,
  // 心理学板块
  PSYCHOLOGY_FIELDS,
  FALLBACK_PSYCHOLOGY,
  // 金融板块
  FINANCE_FIELDS,
  FALLBACK_FINANCE,
  // 情话板块
  LOVE_FIELDS,
  FALLBACK_LOVE,
}
