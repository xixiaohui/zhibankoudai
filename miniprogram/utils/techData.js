/**
 * techData.js - 每日科技兜底数据
 * 
 * 当AI生成失败时使用的备用科技知识数据
 * 包含科技动态与常识，每天根据日期自动选择
 */

const FALLBACK_TECHS = [
  {
    title: 'ChatGPT与大型语言模型',
    category: 'AI人工智能',
    categoryIcon: '🤖',
    summary: '大型语言模型（LLM）是基于深度学习技术训练的自然语言处理系统，能够理解和生成人类语言。ChatGPT便是其中的代表性应用，它能够进行对话、写作、编程等多种任务。',
    impact: '正在深刻改变各行各业的工作方式',
    tags: ['AI', 'LLM', 'ChatGPT', '前沿']
  },
  {
    title: '量子计算基础知识',
    category: '量子科技',
    categoryIcon: '⚛️',
    summary: '量子计算利用量子力学的叠加和纠缠特性进行信息处理，相比传统计算机，在特定问题上具有指数级加速优势。谷歌、IBM等科技巨头正在竞相研发量子计算机。',
    impact: '未来可能颠覆密码学、药物研发等领域',
    tags: ['量子', '计算', '前沿', '硬科技']
  },
  {
    title: '5G与6G通信技术',
    category: '通信技术',
    categoryIcon: '📡',
    summary: '5G网络已全面商用，理论下载速度可达10Gbps，延迟低至1毫秒。而6G研究已经启动，预计2030年商用，将实现空天地海一体化通信。',
    impact: '5G已广泛应用于智能制造、远程医疗等领域',
    tags: ['5G', '6G', '通信', '基础设施']
  },
  {
    title: '区块链与Web3',
    category: '区块链',
    categoryIcon: '🔗',
    summary: '区块链是一种去中心化的分布式账本技术，通过加密算法确保数据不可篡改。NFT、元宇宙、Web3等概念都建立在区块链技术之上。',
    impact: '正在探索数字资产确权与去中心化应用',
    tags: ['区块链', 'Web3', 'NFT', '去中心化']
  },
  {
    title: '半导体芯片制造工艺',
    category: '芯片技术',
    categoryIcon: '💾',
    summary: '芯片制造已达到3nm工艺节点，相当于头发丝直径的万分之一。台积电、三星是全球最先进的芯片代工厂，我国也在大力发展自主芯片产业。',
    impact: '芯片是现代科技的"心脏"，关乎国家安全',
    tags: ['芯片', '半导体', '制造', '核心科技']
  },
  {
    title: '云计算与边缘计算',
    category: '云计算',
    categoryIcon: '☁️',
    summary: '云计算将计算资源集中管理，通过网络提供服务。边缘计算则将计算能力下沉到网络边缘，降低延迟。两者结合，实现云边协同。',
    impact: '是企业数字化转型的基础设施',
    tags: ['云', '边缘计算', '基础设施', '数字化']
  },
  {
    title: '智能驾驶技术现状',
    category: '自动驾驶',
    categoryIcon: '🚗',
    summary: '自动驾驶分为L1-L5五个等级，目前主流车型达到L2级别，部分实现L3。特斯拉FSD、华为ADS、小鹏XNGP是代表方案。完全无人驾驶仍面临技术和法规挑战。',
    impact: '将重塑出行方式，减少交通事故',
    tags: ['自动驾驶', 'AI', '新能源', '未来出行']
  },
  {
    title: '脑机接口技术',
    category: '脑科学',
    categoryIcon: '🧠',
    summary: '脑机接口（BCI）实现大脑与外部设备直接通信。Neuralink已实现人脑植入芯片，能够控制鼠标。斯坦福大学实现了瘫痪患者通过思维打字。',
    impact: '有望帮助瘫痪患者恢复运动能力',
    tags: ['BCI', '脑机接口', 'Neuralink', '前沿']
  },
  {
    title: '物联网（IoT）应用',
    category: '物联网',
    categoryIcon: '🌐',
    summary: '物联网让万物互联，从智能家居到智慧城市，传感器收集数据，云平台进行分析。目前全球IoT设备已超过150亿台。',
    impact: '构建智慧城市的基础，实现精细化管理',
    tags: ['IoT', '传感器', '智慧城市', '万物互联']
  },
  {
    title: 'AR/VR/MR技术区别',
    category: '虚拟现实',
    categoryIcon: '🥽',
    summary: 'AR增强现实在现实叠加虚拟信息，VR完全沉浸虚拟世界，MR混合现实则实现虚实交互。苹果Vision Pro引领MR时代。',
    impact: '将重新定义人机交互方式',
    tags: ['AR', 'VR', 'MR', '元宇宙']
  },
  {
    title: '新能源电池技术',
    category: '新能源',
    categoryIcon: '🔋',
    summary: '锂电池能量密度持续提升，固态电池成为研发热点。宁德时代麒麟电池、特斯拉4680电池、比亚迪刀片电池各具特色。',
    impact: '推动新能源汽车续航突破1000公里',
    tags: ['电池', '新能源', '固态电池', '续航']
  },
  {
    title: '卫星互联网星座',
    category: '航天科技',
    categoryIcon: '🛰️',
    summary: 'SpaceX星链已发射超5000颗卫星，提供全球宽带接入。亚马逊Kuiper、OneWeb也在建设卫星互联网。我国鸿雁、虹云工程稳步推进。',
    impact: '实现全球无缝网络覆盖，偏远地区受益',
    tags: ['卫星', '星链', '互联网', '航天']
  },
  {
    title: 'ChatGPT与AIGC浪潮',
    category: 'AI人工智能',
    categoryIcon: '🤖',
    summary: 'AIGC（AI生成内容）正在爆发，ChatGPT写文案、Midjourney画图、Sora生成视频。GPT-4o实现实时语音对话，AI Agent成为新方向。',
    impact: '每个人都可以成为创作者',
    tags: ['AIGC', '生成式AI', '大模型', '内容创作']
  },
  {
    title: '基因编辑与CRISPR',
    category: '生物科技',
    categoryIcon: '🧬',
    summary: 'CRISPR基因编辑技术获得诺贝尔奖，可精准修改DNA序列。已用于治疗遗传疾病、改良农作物。我国在基因治疗领域处于国际前列。',
    impact: '有望根治遗传病，改变农业',
    tags: ['CRISPR', '基因', '生物科技', '医疗']
  },
  {
    title: '数字人民币特点',
    category: '数字货币',
    categoryIcon: '💰',
    summary: '数字人民币（e-CNY）是中国央行数字货币，具有双离线支付、可控匿名等特性。目前试点城市超过26个，应用场景不断拓展。',
    impact: '推动数字经济发展，提升支付效率',
    tags: ['数字人民币', 'CBDC', '数字货币', '支付']
  },
  {
    title: '人形机器人发展',
    category: '机器人',
    categoryIcon: '🤖',
    summary: '特斯拉Optimus、Figure 01、小米CyberOne等人形机器人相继亮相。它们能够行走、抓取、对话，未来有望走进家庭。',
    impact: '可能成为下一代智能终端',
    tags: ['机器人', '人形', 'AI', '自动化']
  },
  {
    title: '隐私计算技术',
    category: '网络安全',
    categoryIcon: '🔐',
    summary: '隐私计算包括联邦学习、多方安全计算、可信执行环境等技术，实现"数据可用不可见"，在保护隐私的同时释放数据价值。',
    impact: '解决数据流通与隐私保护的矛盾',
    tags: ['隐私计算', '联邦学习', '数据安全', '合规']
  },
  {
    title: '碳中和与绿色科技',
    category: '绿色科技',
    categoryIcon: '🌱',
    summary: '碳中和目标推动绿色科技发展，包括碳捕集、储能、氢能等技术。光伏、风电成本已低于火电，绿氢成为新方向。',
    impact: '应对气候变化，实现可持续发展',
    tags: ['碳中和', '新能源', '储能', '氢能']
  },
  {
    title: '智能穿戴设备演进',
    category: '可穿戴设备',
    categoryIcon: '⌚',
    summary: '智能手表可监测心率、血氧、睡眠，智能眼镜集成AR功能，智能戒指专注健康管理。苹果、华为、三星引领行业发展。',
    impact: '让健康监测成为日常习惯',
    tags: ['可穿戴', '健康', 'IoT', '消费电子']
  },
  {
    title: '开源大模型趋势',
    category: 'AI人工智能',
    categoryIcon: '🤖',
    summary: 'Llama、Mistral等开源大模型涌现，降低AI应用门槛。国产开源模型如ChatGLM、Qwen、Baichuan也在快速追赶。',
    impact: '推动AI技术普惠，中小企业受益',
    tags: ['开源', '大模型', 'LLM', 'AI普惠']
  },
  {
    title: '3D打印技术应用',
    category: '先进制造',
    categoryIcon: '🖨️',
    summary: '3D打印从原型制作进入批量化生产，金属打印用于航空发动机，生物打印可制造器官。建筑3D打印实现24小时建房。',
    impact: '革新制造业，实现个性化定制',
    tags: ['3D打印', '增材制造', '智能制造', '创新']
  },
  {
    title: '低空经济发展',
    category: '航空科技',
    categoryIcon: '🚁',
    summary: 'eVTOL（电动垂直起降飞行器）成为新风口，美团、顺丰布局无人机配送。深圳、上海率先开放城市低空航线。',
    impact: '万亿级新赛道，重塑城市出行',
    tags: ['eVTOL', '无人机', '低空经济', '新赛道']
  },
  {
    title: '大模型Agent技术',
    category: 'AI人工智能',
    categoryIcon: '🤖',
    summary: 'AI Agent能够自主规划、调用工具、执行任务。AutoGPT、GPTs、钉钉AI助理是典型应用。Agent将重塑软件交互方式。',
    impact: 'AI从工具升级为助手',
    tags: ['Agent', 'AI助手', '大模型', '自动化']
  },
  {
    title: '固态硬盘vs机械硬盘',
    category: '存储技术',
    categoryIcon: '💾',
    summary: 'SSD固态硬盘读写速度是HDD的10倍以上，但价格更高。PCIe 5.0 SSD速度可达14GB/s。存储技术向着更快、更大、更便宜发展。',
    impact: '加速数据处理，提升用户体验',
    tags: ['SSD', '存储', '硬盘', '性能']
  },
  {
    title: '智能家居生态',
    category: '智能家居',
    categoryIcon: '🏠',
    summary: '米家、华为鸿蒙、苹果HomeKit构建智能家居生态。一个APP控制全屋设备，语音助手实现自然交互。Matter协议打破生态壁垒。',
    impact: '让家更智能，生活更便捷',
    tags: ['智能家居', 'IoT', 'Matter', '全屋智能']
  },
  {
    title: '硅光子技术',
    category: '光通信',
    categoryIcon: '💡',
    summary: '硅光子技术用光子替代电子传输数据，速度快、功耗低。英伟达、Intel积极布局，将用于AI数据中心互联。',
    impact: '突破算力瓶颈，支撑AI发展',
    tags: ['硅光子', '光通信', 'AI基础设施', '高速']
  },
  {
    title: '数字孪生技术',
    category: '数字技术',
    categoryIcon: '👥',
    summary: '数字孪生创建物理世界的虚拟映射，已用于智慧城市、工业制造、自动驾驶仿真。故宫、雄安新区都有数字孪生应用。',
    impact: '优化决策，提升效率',
    tags: ['数字孪生', '元宇宙', '仿真', '智慧城市']
  },
  {
    title: '鸿蒙操作系统',
    category: '操作系统',
    categoryIcon: '📱',
    summary: '鸿蒙HarmonyOS是华为自研操作系统，采用微内核架构，支持手机、电脑、汽车、智能家居多设备协同。鸿蒙生态设备超8亿台。',
    impact: '打破安卓、iOS垄断，实现万物互联',
    tags: ['鸿蒙', 'HarmonyOS', '操作系统', '国产']
  },
  {
    title: 'AI手机新时代',
    category: 'AI人工智能',
    categoryIcon: '🤖',
    summary: 'AI手机集成端侧大模型，实现本地AI能力。三星Galaxy S24、OPPO Find X7、荣耀Magic6主打AI摄影、AI助手、AI搜索等功能。',
    impact: '手机从智能升级为AI终端',
    tags: ['AI手机', '端侧大模型', '生成式AI', '消费电子']
  }
]

// 科技领域分类配置
const TECH_CATEGORIES = [
  {
    id: 'ai',
    name: 'AI人工智能',
    icon: '🤖',
    topics: ['大模型', '机器学习', '计算机视觉', '自然语言处理']
  },
  {
    id: 'blockchain',
    name: '区块链',
    icon: '🔗',
    topics: ['Web3', 'DeFi', 'NFT', '数字资产']
  },
  {
    id: 'chip',
    name: '芯片技术',
    icon: '💾',
    topics: ['半导体', '制造工艺', '国产替代', '芯片设计']
  },
  {
    id: 'communication',
    name: '通信技术',
    icon: '📡',
    topics: ['5G/6G', '卫星通信', '光通信', '物联网']
  },
  {
    id: 'energy',
    name: '新能源',
    icon: '🔋',
    topics: ['锂电池', '氢能', '光伏', '储能技术']
  },
  {
    id: 'bio',
    name: '生物科技',
    icon: '🧬',
    topics: ['基因编辑', '细胞治疗', '合成生物', '精准医疗']
  },
  {
    id: 'aerospace',
    name: '航天科技',
    icon: '🛰️',
    topics: ['火箭回收', '卫星互联网', '深空探测', '商业航天']
  },
  {
    id: 'manufacturing',
    name: '先进制造',
    icon: '🏭',
    topics: ['工业4.0', '3D打印', '机器人', '智能工厂']
  }
]

module.exports = {
  FALLBACK_TECHS,
  TECH_CATEGORIES
}
