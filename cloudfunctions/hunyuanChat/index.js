const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { action, message, mode, history, userInfo } = event;

  // 快速响应：getOpenId
  if (action === "getOpenId") {
    const wxContext = cloud.getWXContext();
    return { openid: wxContext.OPENID };
  }

  // 聊天请求
  if (action === "chat") {
    if (!message) {
      return { success: false, error: "消息不能为空" };
    }

    const userName = userInfo?.nickname || '朋友';
    const userMsg = message.trim();

    // 优先使用本地智能回复
    const localReply = generateSmartReply(userMsg, mode, userName);
    
    // 尝试调用云开发AI
    try {
      const model = cloud.extend.AI.createModel("hunyuan-exp");
      const result = await model.generateText({
        model: "hunyuan-turbos-latest",
        messages: buildMessages(userMsg, mode, userName, history),
        max_tokens: 512,
        temperature: 0.8,
      });

      const content = result?.choices?.[0]?.message?.content?.trim();
      if (content) {
        return { success: true, content, source: "ai" };
      }
    } catch (err) {
      console.error("AI调用失败，使用本地回复:", err.message || err);
    }

    // 降级到本地回复
    return { success: true, content: localReply, source: "local" };
  }

  return { success: false, error: "未知操作" };
};

// 构建对话消息
function buildMessages(userMsg, mode, userName, history) {
  const systemPrompts = {
    comfort: `你叫口袋伙伴，是${userName}的好朋友。说话要像朋友聊天，简短自然（30-100字）。不要像机器人那样说话。${userName}可能在倾诉，耐心陪伴就好。`,
    reflect: `你叫口袋伙伴，是${userName}的好朋友。用开放式问题帮${userName}理清思路，简短有启发（30-100字）。像朋友间深度交流，不要说教。`,
    action: `你叫口袋伙伴，是${userName}的好朋友。鼓励${userName}行动起来，简短有力（20-80字）。把大目标拆成小步骤，积极但不施压。`,
    chat: `你叫口袋伙伴，是${userName}最轻松的朋友。聊天随意自然，简短有趣（30-80字）。可以八卦、吐槽、分享趣事。`
  };

  const messages = [
    { role: "system", content: systemPrompts[mode] || systemPrompts.chat }
  ];

  // 添加对话历史
  if (history && history.length > 0) {
    history.slice(-8).forEach(msg => {
      messages.push({ 
        role: msg.type === "user" ? "user" : "assistant", 
        content: msg.content 
      });
    });
  }
  
  messages.push({ role: "user", content: userMsg });
  return messages;
}

// 本地智能回复 - 更丰富更自然
function generateSmartReply(message, mode, userName) {
  const msg = message.trim();
  const lowerMsg = msg.toLowerCase();
  
  // ===== 问候类 =====
  if (/^[嗨嗨?]*hi|hey|你好|您好/.test(lowerMsg)) {
    const greetings = [
      `嗨~ ${userName}！`,
      `嘿！${userName}`,
      `来啦~`,
      `${userName}！好久不见`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  if (/^早(上)?好/.test(lowerMsg) || lowerMsg === '早') {
    return Math.random() > 0.5 ? '早啊！今天怎么样？' : '早上好~睡得好吗？';
  }
  
  if (/晚安|睡了|睡觉/.test(lowerMsg)) {
    return '晚安~ 好梦哦 🌙';
  }
  
  // ===== 情绪类 =====
  // 开心
  if (/开心|高兴|快乐|爽|棒/.test(lowerMsg) && !/不/.test(lowerMsg)) {
    const replies = [
      '发生什么好事了？说来听听 🎉',
      '哇！这么好！',
      '太棒了！',
      '感觉你今天运气不错呀',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // 难过
  if (/难过|伤心|难受|痛苦|崩溃|委屈/.test(lowerMsg)) {
    if (mode === 'comfort') {
      return '嗯，我在听着。怎么了？';
    }
    return '怎么啦？我在呢';
  }
  
  // 压力大/焦虑
  if (/压力|焦虑|担心|害怕|紧张|睡不着/.test(lowerMsg)) {
    const replies = [
      '我懂那种感觉...是因为什么事呢？',
      '深呼吸...能说说吗？',
      '慢慢来，别急',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // 累
  if (/累|困|疲惫|困倦/.test(lowerMsg)) {
    const replies = [
      '辛苦啦！今天忙什么了？',
      '休息一下吧 🌙',
      '是身体累还是心累？',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // 生气
  if (/生气|气死我了|不爽|烦|讨厌/.test(lowerMsg)) {
    return '谁惹你生气了？说说';
  }
  
  // 无聊
  if (/无聊|没事干|闲/.test(lowerMsg)) {
    const replies = [
      '要不找点事做？',
      '想聊点什么吗？',
      '有什么感兴趣的事吗？',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // ===== 日常类 =====
  if (/吃饭|吃了|午餐|晚餐/.test(lowerMsg)) {
    return '吃了什么好吃的？';
  }
  
  if (/天气|下雨|晴天|热|冷/.test(lowerMsg)) {
    return '你们那边天气怎么样？';
  }
  
  if (/工作|上班/.test(lowerMsg)) {
    return '今天工作顺利吗？';
  }
  
  if (/学习|考试|作业|复习/.test(lowerMsg)) {
    return '复习得怎么样了？';
  }
  
  if (/周末|放假/.test(lowerMsg)) {
    return '周末有什么计划？';
  }
  
  if (/运动|跑步|健身|打球/.test(lowerMsg)) {
    return '动起来啦！感觉怎么样？';
  }
  
  // ===== 感谢类 =====
  if (/谢谢|感谢|感恩|帮你了/.test(lowerMsg)) {
    return '能帮到你我也很开心~';
  }
  
  // ===== 肯定类 =====
  if (/对的|是的|没错|就是|好/.test(lowerMsg) && msg.length < 10) {
    const replies = ['嗯嗯', '对~', '明白', '好嘞', '知道了'];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // ===== 否定类 =====
  if (/不是|不对|没|别/.test(lowerMsg) && msg.length < 10) {
    return '那是怎么回事？';
  }
  
  // ===== 问题类 =====
  if (/吗|？|\?/.test(msg)) {
    if (mode === 'reflect') {
      const replies = ['你觉得呢？', '你怎么看？', '继续说', '还有呢？'];
      return replies[Math.floor(Math.random() * replies.length)];
    }
    if (mode === 'action') {
      const replies = ['想好了就开始吧！', '先迈出第一步？', '一起加油！'];
      return replies[Math.floor(Math.random() * replies.length)];
    }
    const replies = [
      '这个问题我也说不太准...',
      '你怎么看呢？',
      '有意思，继续说',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  
  // ===== 默认回复 =====
  const defaultReplies = {
    comfort: ['嗯嗯，继续说', '我在呢', '这样啊...', '嗯，听到了', '然后呢？', '我懂那种感觉', '真的啊？', '后来呢？'],
    reflect: ['你觉得呢？', '然后呢？', '还有吗？', '让我也听听', '你觉得主要原因是什么？', '还有别的吗？', '你自己怎么看？'],
    action: ['走！做起来！', '先从哪开始？', '我陪你！', '来，开干！', '冲冲冲！', '一起加油！'],
    chat: ['哦哦，是吗？', '然后呢？', '嗯嗯，说下去', '这个有意思', '后来怎么样了？', '真的吗？', '哈哈', '哎呦，不错'],
  };

  const list = defaultReplies[mode] || defaultReplies.chat;
  return list[Math.floor(Math.random() * list.length)];
}
