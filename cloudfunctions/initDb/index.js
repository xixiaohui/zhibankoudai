/**
 * 云函数 - 初始化云数据库集合
 * 用于创建聊天消息、用户画像、用户记忆等集合
 * 以及每日内容模块的云数据库集合
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 基础集合配置
const BASE_COLLECTIONS = [
  {
    name: 'chatMessages',
    description: '聊天消息存储',
    fields: {
      openid: 'string',
      type: 'string',
      content: 'string',
      mode: 'string',
      time: 'string',
      date: 'string',
      uniqueId: 'string',
      isStreaming: 'boolean',
      createTime: 'date',
      isDeleted: 'boolean'
    }
  },
  {
    name: 'userProfile',
    description: '用户画像',
    fields: {
      openid: 'string',
      nickname: 'string',
      gender: 'string',
      occupation: 'string',
      location: 'string',
      communication: 'object',
      interests: 'array',
      personality: 'object',
      lifestyle: 'object',
      createTime: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'userMemory',
    description: '用户记忆',
    fields: {
      openid: 'string',
      shortTerm: 'object',
      longTerm: 'object',
      learnedFacts: 'array',
      createTime: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'moodRecords',
    description: '情绪记录',
    fields: {
      openid: 'string',
      mood: 'string',
      emoji: 'string',
      note: 'string',
      date: 'string',
      time: 'string',
      createTime: 'date'
    }
  },
  {
    name: 'userSettings',
    description: '用户设置',
    fields: {
      openid: 'string',
      theme: 'string',
      notifications: 'object',
      privacy: 'object',
      createTime: 'date',
      updateTime: 'date'
    }
  }
]

// 每日内容模块集合（AI生成内容存储）
const CONTENT_COLLECTIONS = [
  {
    name: 'dailySoftwareArchitects',
    description: '软件架构师助手 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailySolidityEngineers',
    description: 'Solidity智能合约工程师 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyXiaohongshuExperts',
    description: '小红书专家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailySeoExperts',
    description: 'SEO专家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyAnthropologists',
    description: '人类学家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyGeographers',
    description: '地理学家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyHistorians',
    description: '历史学家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyNarratologists',
    description: '叙事学家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  },
  {
    name: 'dailyPsychologists',
    description: '心理学家 - AI生成内容',
    fields: {
      title: 'string',
      content: 'string',
      category: 'string',
      categoryIcon: 'string',
      subtitle: 'string',
      date: 'string',
      moduleId: 'string',
      isAIGenerated: 'boolean',
      createdAt: 'date',
      updateTime: 'date'
    }
  }
]

// 所有集合
const COLLECTIONS = [...BASE_COLLECTIONS, ...CONTENT_COLLECTIONS]

exports.main = async (event, context) => {
  const { action, collectionName } = event
  
  try {
    switch (action) {
      case 'createCollections':
        // 创建所有集合
        const created = []
        for (const col of COLLECTIONS) {
          try {
            // 尝试创建集合（如果已存在会报错，忽略即可）
            await db.createCollection(col.name)
            console.log(`Collection ${col.name} created`)
            created.push(col.name)
          } catch (e) {
            if (e.errCode === -502005) {
              // 集合已存在
              console.log(`Collection ${col.name} already exists`)
              created.push(col.name)
            } else {
              console.error(`Error creating ${col.name}:`, e)
            }
          }
        }
        return { success: true, created }
        
      case 'createOne':
        // 创建单个集合
        if (!collectionName) {
          return { success: false, error: 'collectionName is required' }
        }
        try {
          await db.createCollection(collectionName)
          return { success: true, collectionName }
        } catch (e) {
          if (e.errCode === -502005) {
            return { success: true, collectionName, message: 'already exists' }
          }
          return { success: false, error: e.message }
        }
        
      case 'listCollections':
        // 列出所有集合（需要管理员权限）
        return { success: true, collections: COLLECTIONS }
        
      case 'initIndexes':
        // 初始化索引
        const indexes = {
          chatMessages: [
            { name: 'openid_time', fields: [{ name: 'openid', order: 'asc' }, { name: 'createTime', order: 'desc' }] },
            { name: 'openid_mode', fields: [{ name: 'openid', order: 'asc' }, { name: 'mode', order: 'asc' }] }
          ],
          moodRecords: [
            { name: 'openid_date', fields: [{ name: 'openid', order: 'asc' }, { name: 'date', order: 'desc' }] }
          ]
        }
        return { success: true, indexes }

      case 'initNewModuleData':
        // 初始化新模块的AI生成内容到云数据库
        const newModuleData = {
          dailySoftwareArchitects: {
            moduleId: 'softwareArchitect',
            data: [
              { title: '微服务 vs 单体架构的权衡', category: '系统设计', categoryIcon: '🏗️', content: '选择微服务还是单体架构，需要考虑团队规模、业务复杂度和技术成熟度。小团队、简单业务适合单体，可快速迭代；大团队、复杂业务适合微服务，可独立部署扩展。但微服务带来分布式系统的复杂性：服务治理、链路追踪、数据一致性都是挑战。建议从单体开始，逐步拆分，避免过度设计。', subtitle: '架构选型指南' },
              { title: '聚合根的设计原则', category: '领域驱动设计', categoryIcon: '🎯', content: '聚合根是DDD的核心概念，它保证聚合内数据一致性。设计聚合根应遵循：聚合内对象紧耦合，聚合间通过ID引用；聚合应该小而完整，一个聚合只包含一个实体；聚合根负责保护业务不变式，外部只能通过聚合根修改内部状态。好的聚合设计能让业务逻辑清晰，减少并发冲突。', subtitle: 'DDD核心概念' },
              { title: 'CQRS模式的实践应用', category: '架构模式', categoryIcon: '📐', content: 'CQRS（命令查询职责分离）将读写操作分离，可针对读优化或写优化分别设计。写侧处理复杂业务逻辑，维护领域模型；读侧可直接映射到视图数据结构，支持高性能查询。事件溯源是CQRS的好搭档，用事件记录状态变化历史。但CQRS也带来最终一致性和事件处理的复杂度，适合写多读多且读写差异大的场景。', subtitle: '读写分离设计' },
              { title: '一致性级别选择的艺术', category: '权衡分析', categoryIcon: '⚖️', content: 'CAP定理告诉我们分布式系统无法同时满足一致性、可用性和分区容错。但现实是网络分区很少发生，所以大多数场景可以选择高可用。强一致性带来性能损耗和可用性降低，弱一致性提供更好性能和可用性。BASE理论（基本可用、软状态、最终一致）指导我们在一致性级别上做出业务可接受的权衡。', subtitle: '分布式系统基础' }
            ]
          },
          dailySolidityEngineers: {
            moduleId: 'solidityEngineer',
            data: [
              { title: 'Solidity中的权限控制设计', category: 'EVM合约开发', categoryIcon: '⛓️', content: '智能合约的权限控制至关重要。使用onlyOwner修饰符限制管理员操作，采用多签钱包实现更高级别安全。推荐使用OpenZeppelin的AccessControl库实现基于角色的权限，支持灵活的角色分配和权限撤销。权限检查应该在所有状态修改函数的最前面执行，防止权限升级攻击。', subtitle: '合约安全基础' },
              { title: '存储变量的Gas优化技巧', category: 'Gas优化', categoryIcon: '⛽', content: 'Storage是最昂贵的操作。优化技巧：使用assembly直接操作memory可节省Gas；将相关数据打包到单个slot（如bool+uint128组合）；删除不再使用的数据释放Gas；避免在循环中读取storage，使用memory缓存。memory和calldata的选择也很重要，calldata参数更便宜。理解EVM Gas消耗模型是优化的基础。', subtitle: 'Gas优化技巧' },
              { title: 'AMM自动做市商核心原理', category: 'DeFi开发', categoryIcon: '💰', content: 'Uniswap采用恒定乘积公式 x*y=k 实现自动做市商。交易者可以随时按公式价格买卖，流动性提供者存入资产对赚取手续费。流动性与交易量越大，价格滑点越小。流动性挖矿激励用户提供流动性，但无常损失（Impermanent Loss）需要警惕。理解AMM数学原理，才能设计出合理的DEX机制。', subtitle: 'DeFi核心机制' },
              { title: '防止重入攻击的七种方法', category: '安全最佳实践', categoryIcon: '🛡️', content: '重入攻击是智能合约最常见的安全漏洞。防护方法：1. Checks-Effects-Interactions模式，先检查再修改状态最后交互；2. 使用ReentrancyGuard互斥锁；3. 转账前更新状态；4. 限制转账金额或频率；5. 使用pullPayment替代pushPayment；6. 遵循CEI模式；7. 合约间调用使用低级别call而非直接转账。安全审计必须覆盖所有外部调用点。', subtitle: '合约安全防护' }
            ]
          },
          dailyXiaohongshuExperts: {
            moduleId: 'xiaohongshuExpert',
            data: [
              { title: '如何写出让人想收藏的种草笔记', category: '生活方式内容', categoryIcon: '✨', content: '小红书种草笔记的核心是真实感和实用性。开头用痛点引发共鸣，中间详细展示使用体验和效果，最后给出具体建议。善用emoji和表情符号增加亲和力，图片要高质量且真实。关键词布局要自然，让笔记更容易被搜索到。收藏率比点赞更重要，说明用户真的觉得有用。', subtitle: '种草笔记技巧' },
              { title: '小红书热点选题的三大黄金法则', category: '趋势驱动策略', categoryIcon: '🔥', content: '第一，追热点要快，在热度上升期发布；第二，热点要与账号定位契合，不是所有热点都要追；第三，独特定角度比重复内容更容易出圈。关注小红书官方话题和热门挑战，及时参与。建立选题库，平时积累素材，热点来临时快速产出。', subtitle: '热点选题方法' },
              { title: '小红书爆款标题公式拆解', category: '内容创作技巧', categoryIcon: '✍️', content: '爆款标题公式：数字+情绪词+关键词。比如「3步｜真心建议所有女生学会这个，显白又高级」。数字增加可信度，情绪词引发共鸣，关键词利于搜索。前三秒决定用户是否点开，正文第一句要承接标题的期待。学会设置悬念，让用户忍不住想看下去。', subtitle: '标题写作技巧' },
              { title: '小红书账号定位的黄金三角', category: '涨粉运营', categoryIcon: '📈', content: '账号定位三角：我是谁（人设）、我能提供什么（价值）、我有什么不同（差异化）。垂直细分领域更容易获得精准粉丝。头像、昵称、简介要统一风格，形成记忆点。保持更新频率，建立粉丝期待。评论区互动是涨粉的重要场景，真诚回复能增加粉丝粘性。', subtitle: '账号定位指南' }
            ]
          },
          dailySeoExperts: {
            moduleId: 'seoExpert',
            data: [
              { title: 'Core Web Vitals与搜索排名', category: '技术SEO', categoryIcon: '🔧', content: 'Google已将Core Web Vitals纳入排名因素。LCP（最大内容绘制）应控制在2.5秒内，优化图片和使用CDN是关键；FID（首次输入延迟）需低于100毫秒，减少JavaScript阻塞；CLS（累积布局偏移）应小于0.1，优化图片尺寸和广告位。定期使用PageSpeed Insights检测，持续监控用户体验指标。', subtitle: '页面体验优化' },
              { title: '长尾关键词的正确打开方式', category: '内容策略', categoryIcon: '📝', content: '长尾关键词竞争小、转化高，是中小网站的流量蓝海。挖掘方法：分析搜索建议和related searches；使用AnswerThePublic找问答型长尾；研究竞品未覆盖的细分场景。内容布局：标题含长尾词、正文自然出现3-5次、URL和图片Alt文本都要覆盖。长尾内容积累形成词库，长期带来稳定流量。', subtitle: '关键词策略' },
              { title: '高质量外链的获取策略', category: '链接建设', categoryIcon: '🔗', content: '外链质量比数量更重要。推荐策略：1. 创作高质量原创内容，自然吸引外链；2. 客座博客，在相关行业网站投稿；3. broken link building，帮别人修复死链同时获得推荐；4. 资源页面链接，在目录网站提交；5. 社交媒体虽然nofollow，但能增加曝光和间接权重。避免购买链接和链接农场，小心Google惩罚。', subtitle: '外链建设技巧' },
              { title: '搜索意图分析与内容匹配', category: '数据分析', categoryIcon: '📊', content: '搜索意图分四类：信息型（了解知识）、导航型（找网站）、交易型（购买意图）、商业调查型（比较决策）。针对不同意图创作不同内容：信息型提供全面知识；交易型优化产品页面和CTA；商业调查型做对比评测。SEMrush和Ahrefs可分析竞品排名意图，据此调整内容策略，满足用户真实需求。', subtitle: '意图分析方法' }
            ]
          }
        }

        const results = []
        const today = new Date().toISOString().split('T')[0]

        for (const [collectionName, config] of Object.entries(newModuleData)) {
          try {
            for (const item of config.data) {
              await db.collection(collectionName).add({
                data: {
                  ...item,
                  moduleId: config.moduleId,
                  date: today,
                  createdAt: db.serverDate(),
                  isAIGenerated: true
                }
              })
            }
            results.push({ collection: collectionName, status: 'success', count: config.data.length })
            console.log(`Initialized ${collectionName} with ${config.data.length} items`)
          } catch (e) {
            if (e.errCode === -502005) {
              results.push({ collection: collectionName, status: 'collection_not_exists' })
            } else {
              results.push({ collection: collectionName, status: 'error', message: e.message })
            }
          }
        }

        return { success: true, results }

      case 'createNewModuleCollections':
        // 仅创建新模块的集合
        const newCollections = CONTENT_COLLECTIONS.map(c => c.name)
        const created = []
        for (const name of newCollections) {
          try {
            await db.createCollection(name)
            console.log(`Collection ${name} created`)
            created.push(name)
          } catch (e) {
            if (e.errCode === -502005) {
              created.push(name + ' (exists)')
            } else {
              console.error(`Error creating ${name}:`, e)
            }
          }
        }
        return { success: true, created }
        
      default:
        return { success: false, error: 'Unknown action' }
    }
  } catch (e) {
    console.error('initDb error:', e)
    return { success: false, error: e.message }
  }
}
