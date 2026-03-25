// pages/ai/index.js - AI智伴助手（接入 hunyuan-turbos 流式对话）
const { genId, formatTime, showError } = require('../../utils/util');

Page({
  data: {
    // 消息列表
    messages: [],

    // 输入
    inputText: '',
    isComposing: false,  // 是否正在生成

    // 系统人设
    systemPrompt: '你是"智伴"，一个聪明、友好的AI助手。你擅长金融理财建议、学习规划、生活技巧，能给用户提供实用的建议和知识。回答简洁有重点，善用表情符号让对话更生动。',

    // 快速提问
    quickQuestions: [
      '💰 如何制定家庭预算？',
      '📚 推荐高效学习方法',
      '🌱 养成好习惯的技巧',
      '📈 基金投资入门指南',
      '⏰ 时间管理最佳实践',
      '🍎 健康饮食小建议',
    ],

    // 历史会话
    chatSessions: [],
    showSessionPanel: false,

    // 思考状态
    isThinking: false,
    thinkContent: '',
    showThink: false,

    // 滚动
    scrollToMessage: '',
  },

  onLoad() {
    this.loadHistory();
    // 添加欢迎消息
    const welcomeMsg = {
      id: genId(),
      role: 'assistant',
      content: '你好！我是智伴AI助手 🤖\n\n我可以帮你：\n• 💰 **财务规划** - 记账建议、预算制定\n• 📚 **学习提升** - 知识讲解、学习规划\n• 🌱 **生活技巧** - 效率提升、健康建议\n\n有什么想聊的，直接告诉我吧！',
      time: formatTime(new Date()),
      timestamp: Date.now(),
    };
    this.setData({ messages: [welcomeMsg] });
  },

  loadHistory() {
    const history = wx.getStorageSync('chatHistory') || [];
    const sessions = wx.getStorageSync('chatSessions') || [];
    this.setData({ chatSessions: sessions.slice(0, 10) });
  },

  // 输入处理
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 快速提问
  askQuick(e) {
    const question = e.currentTarget.dataset.q.replace(/^[^\s]+\s/, ''); // 去掉emoji前缀
    this.setData({ inputText: question });
    this.sendMessage();
  },

  // 发送消息
  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isComposing) return;

    const userMsg = {
      id: genId(),
      role: 'user',
      content: text,
      time: formatTime(new Date()),
      timestamp: Date.now(),
    };

    const messages = [...this.data.messages, userMsg];
    this.setData({
      messages,
      inputText: '',
      isComposing: true,
      isThinking: false,
      thinkContent: '',
    });

    this.scrollToBottom();

    // 添加 AI 占位消息
    const aiMsgId = genId();
    const aiMsg = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      time: formatTime(new Date()),
      timestamp: Date.now(),
      loading: true,
      thinking: '',
    };
    const msgsWithAI = [...messages, aiMsg];
    this.setData({ messages: msgsWithAI });

    try {
      await this.callAI(text, aiMsgId, messages);
    } catch (err) {
      console.error('AI调用失败:', err);
      this.updateAIMessage(aiMsgId, '抱歉，AI响应出现了问题，请稍后重试 😅', false);
    }

    this.setData({ isComposing: false });
    this.saveHistory();
  },

  // 调用 hunyuan-turbos AI（流式）
  async callAI(userText, aiMsgId, previousMessages) {
    // 构建上下文（最近10条）
    const contextMessages = previousMessages
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))
      .filter(m => m.content);

    // 加入系统prompt
    const fullMessages = [
      { role: 'system', content: this.data.systemPrompt },
      ...contextMessages,
      { role: 'user', content: userText },
    ];

    let fullContent = '';
    let thinkContent = '';

    try {
      // 使用微信云开发 AI 扩展
      const res = await wx.cloud.extend.AI.createModel(
        'hunyuan-exp'
      ).streamText({
        data: {
          model: 'hunyuan-turbos-latest',
          messages: fullMessages,
          stream: true,
        }
      });

      for await (let event of res.eventStream) {
        if (event.data === '[DONE]') break;

        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          continue;
        }

        // 思维链内容（hunyuan-r1等支持）
        const think = data?.choices?.[0]?.delta?.reasoning_content;
        if (think) {
          thinkContent += think;
          this.updateAIThinking(aiMsgId, thinkContent);
        }

        // 正文内容
        const text = data?.choices?.[0]?.delta?.content;
        if (text) {
          fullContent += text;
          this.updateAIMessage(aiMsgId, fullContent, true);
          this.scrollToBottom();
        }
      }

      // 流式结束
      this.updateAIMessage(aiMsgId, fullContent || '（无内容）', false);
      if (thinkContent) {
        this.updateAIThinkFinal(aiMsgId, thinkContent);
      }

    } catch (err) {
      console.error('流式调用失败:', err);
      throw err;
    }
  },

  // 更新AI消息内容
  updateAIMessage(id, content, loading) {
    const msgs = this.data.messages.map(m => {
      if (m.id === id) {
        return { ...m, content, loading: loading || false };
      }
      return m;
    });
    this.setData({ messages: msgs });
  },

  // 更新思维链（流式中）
  updateAIThinking(id, thinking) {
    const msgs = this.data.messages.map(m => {
      if (m.id === id) return { ...m, thinking, hasThinking: true };
      return m;
    });
    this.setData({ messages: msgs });
  },

  // 思维链最终结果
  updateAIThinkFinal(id, thinking) {
    const msgs = this.data.messages.map(m => {
      if (m.id === id) return { ...m, thinking, hasThinking: true, thinkDone: true };
      return m;
    });
    this.setData({ messages: msgs });
  },

  // 滚动到底部
  scrollToBottom() {
    const msgs = this.data.messages;
    if (msgs.length > 0) {
      this.setData({ scrollToMessage: 'msg_' + msgs[msgs.length - 1].id });
    }
  },

  // 展开/收起思维链
  toggleThink(e) {
    const id = e.currentTarget.dataset.id;
    const msgs = this.data.messages.map(m => {
      if (m.id === id) return { ...m, showThinking: !m.showThinking };
      return m;
    });
    this.setData({ messages: msgs });
  },

  // 复制消息
  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  // 清空对话
  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          const welcomeMsg = {
            id: genId(),
            role: 'assistant',
            content: '对话已清空 🗑️\n\n有什么新问题，尽管问我！',
            time: formatTime(new Date()),
            timestamp: Date.now(),
          };
          this.setData({ messages: [welcomeMsg] });
          wx.setStorageSync('chatHistory', []);
        }
      }
    });
  },

  // 保存历史
  saveHistory() {
    const msgs = this.data.messages.filter(m => !m.loading);
    wx.setStorageSync('chatHistory', msgs.slice(-50));
  },

  // 切换系统角色
  switchRole(e) {
    const role = e.currentTarget.dataset.role;
    const prompts = {
      general: '你是"智伴"，一个聪明、友好的AI助手，擅长金融、学习和生活建议。',
      finance: '你是"智伴财经顾问"，专注于个人理财、投资规划、预算管理，给出专业且易懂的财务建议。',
      study: '你是"智伴学习导师"，擅长各类知识讲解、学习方法指导，帮助用户高效学习提升。',
      life: '你是"智伴生活助手"，专注于生活技巧、健康习惯、效率提升，给出实用的生活建议。',
    };
    if (prompts[role]) {
      this.setData({ systemPrompt: prompts[role] });
      wx.showToast({ title: '已切换角色', icon: 'success' });
    }
  },

  onInputFocus() {
    setTimeout(() => this.scrollToBottom(), 300);
  },
});
