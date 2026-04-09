// pages/ai/index.js - AI助手
const { genId, formatTime, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    // 消息列表
    messages: [],

    // 输入相关
    inputValue: '',
    inputFocus: false,

    // 状态
    isTyping: false,
    showQuickQuestions: true,

    // 快捷问题
    quickQuestions: [
      '帮我制定一个学习计划',
      '如何提高编程能力？',
      '推荐一些高效工具',
      '如何管理时间？',
      '写一段代码示例',
      '解释一下这个概念',
    ],

    // 用户信息
    userInfo: null,
  },

  onLoad() {
    this.loadChatHistory();
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  onUnload() {
    this.saveChatHistory();
  },

  loadChatHistory() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({ messages: history, showQuickQuestions: history.length === 0 });
  },

  loadUserInfo() {
    const user = wx.getStorageSync('expertProfile');
    if (user && user.name) {
      this.setData({ userInfo: user });
    }
  },

  saveChatHistory() {
    wx.setStorageSync('chatHistory', this.data.messages);
  },

  // 输入处理
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 发送消息
  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;
    if (this.data.isTyping) return;

    // 添加用户消息
    const userMsg = {
      id: genId(),
      role: 'user',
      content: text,
      time: formatTime(new Date()),
    };

    this.setData({
      messages: [...this.data.messages, userMsg],
      inputValue: '',
      showQuickQuestions: false,
      isTyping: true,
    });

    this.saveChatHistory();

    // 模拟AI回复
    this.generateAIResponse(text);
  },

  // 生成AI回复
  generateAIResponse(userText) {
    // 这里是模拟的AI回复，实际项目中可以接入真实的AI API
    setTimeout(() => {
      const aiResponses = [
        '您好！作为智伴口袋的AI助手，我很乐意为您服务。根据您的问题，让我来为您详细解答...',
        '这是一个很好的问题！我建议您可以从以下几个方面来考虑：\n\n1. 首先明确目标\n2. 制定具体计划\n3. 坚持执行\n4. 定期复盘\n\n希望这些建议对您有帮助！',
        '根据您的情况，我推荐您尝试以下方法：\n\n💡 番茄工作法\n💡 每日清单\n💡 定期总结\n\n坚持一段时间后，您会看到明显的进步！',
        '很高兴为您解答！作为一个全栈助手，我可以帮助您：\n\n📚 学习方面\n💼 工作方面\n🌱 生活方面\n\n有什么具体问题，随时问我！',
        '这个问题很有意思！让我来帮您分析：\n\n首先，核心要点是...\n其次，需要注意的是...\n\n如果您有更多细节想了解，请告诉我！',
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMsg = {
        id: genId(),
        role: 'assistant',
        content: randomResponse,
        time: formatTime(new Date()),
      };

      this.setData({
        messages: [...this.data.messages, aiMsg],
        isTyping: false,
      });

      this.saveChatHistory();
    }, 1000 + Math.random() * 1000);
  },

  // 点击快捷问题
  onQuickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputValue: question }, () => {
      this.sendMessage();
    });
  },

  // 清除聊天
  clearChat() {
    wx.showModal({
      title: '清除聊天',
      content: '确定要清除所有聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [], showQuickQuestions: true });
          wx.removeStorageSync('chatHistory');
          showSuccess('聊天记录已清除');
        }
      }
    });
  },

  // 复制消息
  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => showSuccess('已复制到剪贴板')
    });
  },

  // 重新发送
  resendMessage(e) {
    const index = e.currentTarget.dataset.index;
    const msg = this.data.messages[index];
    if (msg.role === 'user') {
      // 删除这条消息和AI的回复
      const newMessages = this.data.messages.slice(0, index);
      this.setData({ messages: newMessages, isTyping: true });
      this.generateAIResponse(msg.content);
    }
  },
});
