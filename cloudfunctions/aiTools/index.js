const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 天气查询（示例）
async function getWeather(city) {
  // 这里可以接入真实天气API
  const weatherMap = {
    北京: { weather: "晴", temp: "26°C", icon: "☀️" },
    上海: { weather: "多云", temp: "24°C", icon: "⛅" },
    广州: { weather: "阵雨", temp: "28°C", icon: "🌦️" },
    深圳: { weather: "晴", temp: "29°C", icon: "☀️" },
  };
  return weatherMap[city] || { weather: "多云", temp: "25°C", icon: "⛅" };
}

// 发送邮件通知（示例）
async function sendEmail(to, subject, content) {
  // 这里可以接入真实邮件服务
  console.log(`发送邮件到: ${to}, 主题: ${subject}`);
  return { success: true };
}

// 定时任务处理
async function handleScheduledTask(taskType, taskData) {
  switch (taskType) {
    case "dailyReminder":
      // 每日提醒
      return await processDailyReminder(taskData);
    case "moodCheck":
      // 心情检查
      return await moodCheckIn(taskData);
    case "goalProgress":
      // 目标进度检查
      return await checkGoalProgress(taskData);
    default:
      return { success: false, error: "未知的任务类型" };
  }
}

async function processDailyReminder(data) {
  const { openid, reminderType, message } = data;
  // 可以发送订阅消息或模板消息
  return { success: true, message: "提醒已发送" };
}

async function moodCheckIn(data) {
  const { openid } = data;
  // 检查用户今天是否记录心情
  const db = cloud.database();
  const today = new Date().toISOString().split("T")[0];
  const check = await db
    .collection("moodRecords")
    .where({
      _openid: openid,
      date: db.command.like(`${today}%`),
    })
    .count();
  return {
    checked: check.total > 0,
    needReminder: check.total === 0,
  };
}

async function checkGoalProgress(data) {
  const { openid } = data;
  // 检查长期目标进度
  const db = cloud.database();
  const goals = await db
    .collection("goals")
    .where({
      _openid: openid,
      completed: false,
    })
    .get();
  return { pendingGoals: goals.data.length };
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action, ...params } = event;

  switch (action) {
    case "getWeather":
      return await getWeather(params.city);
    case "sendEmail":
      return await sendEmail(params.to, params.subject, params.content);
    case "scheduledTask":
      return await handleScheduledTask(params.taskType, params.taskData);
    default:
      return { success: false, error: "未知操作" };
  }
};
