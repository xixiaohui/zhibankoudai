// 每日一卦 - 易经、星座等占卜知识数据

// 易经八卦基础数据
const BAGUA_DATA = [
  {
    name: '乾卦',
    symbol: '☰',
    nature: '天',
    attribute: '健',
    meaning: '创造、宇宙、领导力',
    description: '乾为天，刚健中正，象征积极进取、自强不息的精神。六爻纯阳，代表最旺盛的生命力和创造力。'
  },
  {
    name: '坤卦',
    symbol: '☷',
    nature: '地',
    attribute: '顺',
    meaning: '包容、大地、顺从',
    description: '坤为地，柔顺厚重，象征大地的包容与承载。六爻纯阴，代表包容、谦让、柔顺的德行。'
  },
  {
    name: '屯卦',
    symbol: '�证券公司',
    nature: '水/雷',
    attribute: '起始',
    meaning: '初生、艰难、积累',
    description: '水雷屯，象征万物初生时的艰难与希望。如同婴儿初生，需要经历艰难才能成长。'
  },
  {
    name: '蒙卦',
    symbol: '䷃',
    nature: '山/水',
    attribute: '启蒙',
    meaning: '启蒙、童蒙、求知',
    description: '山水蒙，象征教育的开始。如同山泉流出，需要引导才能成材。教化之道，在于因材施教。'
  },
  {
    name: '需卦',
    symbol: '䷓',
    nature: '水/天',
    attribute: '等待',
    meaning: '等待、需求、耐心',
    description: '水天需，象征需要等待才能获得。如同云上于天，需要时机成熟方能降雨。'
  },
  {
    name: '讼卦',
    symbol: '䷠',
    nature: '天/水',
    attribute: '争讼',
    meaning: '争议、诉讼、矛盾',
    description: '天水讼，象征争讼和矛盾。君子以做事谋始，避免争端的产生。'
  },
  {
    name: '师卦',
    symbol: '䷆',
    nature: '地/水',
    attribute: '军队',
    meaning: '军队、领导、纪律',
    description: '地水师，象征军队和群众。君子以容民畜众，需要正确的领导和严明的纪律。'
  },
  {
    name: '比卦',
    symbol: '䷇',
    nature: '地/水',
    attribute: '亲比',
    meaning: '亲近、团结、辅佐',
    description: '水地比，象征亲比和团结。君子以建万国，亲诸侯，体现出和谐的人际关系。'
  }
];

// 十二星座基础数据
const ZODIAC_DATA = [
  {
    name: '白羊座',
    symbol: '♈',
    date: '3.21-4.19',
    element: '火',
    planet: '火星',
    trait: '勇敢、直接、热情',
    description: '黄道第一个星座，代表新生和开始。白羊座的人充满活力和行动力，喜欢挑战和创新。'
  },
  {
    name: '金牛座',
    symbol: '♉',
    date: '4.20-5.20',
    element: '土',
    planet: '金星',
    trait: '稳定、务实、执着',
    description: '代表稳定和坚持。金牛座的人脚踏实地，重视物质安全和感官享受，有很强的耐力。'
  },
  {
    name: '双子座',
    symbol: '♊',
    date: '5.21-6.21',
    element: '风',
    planet: '水星',
    trait: '多变、好奇、机智',
    description: '代表沟通和交流。双子座的人思维敏捷，善于表达，适应能力强，喜欢新鲜事物。'
  },
  {
    name: '巨蟹座',
    symbol: '♋',
    date: '6.22-7.22',
    element: '水',
    planet: '月亮',
    trait: '敏感、温柔、保护',
    description: '代表家庭和情感。巨蟹座的人情感细腻，重视家庭，有强烈的保护欲和忠诚度。'
  },
  {
    name: '狮子座',
    symbol: '♌',
    date: '7.23-8.22',
    element: '火',
    planet: '太阳',
    trait: '自信、热情、领导',
    description: '代表创造和领导。狮子座的人自信满满，喜欢成为焦点，具有天生的领导能力和表演天赋。'
  },
  {
    name: '处女座',
    symbol: '♍',
    date: '8.23-9.22',
    element: '土',
    planet: '水星',
    trait: '完美、分析、细致',
    description: '代表秩序和服务。处女座的人追求完美，注重细节，善于分析和整理，有很强的服务意识。'
  },
  {
    name: '天秤座',
    symbol: '♎',
    date: '9.23-10.23',
    element: '风',
    planet: '金星',
    trait: '和谐、公正、社交',
    description: '代表平衡和公正。天秤座的人追求和谐，善于社交，有很强的审美能力和社交技巧。'
  },
  {
    name: '天蝎座',
    symbol: '♏',
    date: '10.24-11.22',
    element: '水',
    planet: '冥王星',
    trait: '深沉、神秘、执着',
    description: '代表转化和深奥。天蝎座的人情感深沉，直觉敏锐，有很强的洞察力和意志力。'
  },
  {
    name: '射手座',
    symbol: '♐',
    date: '11.23-12.21',
    element: '火',
    planet: '木星',
    trait: '乐观、冒险、智慧',
    description: '代表探索和自由。射手座的人热爱自由，喜欢冒险，追求知识和真理，乐观向上。'
  },
  {
    name: '摩羯座',
    symbol: '♑',
    date: '12.22-1.19',
    element: '土',
    planet: '土星',
    trait: '务实、责任、坚韧',
    description: '代表责任和成就。摩羯座的人脚踏实地，有强烈的责任感和事业心，能够坚持到底。'
  },
  {
    name: '水瓶座',
    symbol: '♒',
    date: '1.20-2.18',
    element: '风',
    planet: '天王星',
    trait: '创新、独立、人道',
    description: '代表创新和人道。水瓶座的人思维独特，重视自由和平等，有很强的创造力和人道主义精神。'
  },
  {
    name: '双鱼座',
    symbol: '♓',
    date: '2.19-3.20',
    element: '水',
    planet: '海王星',
    trait: '浪漫、敏感、直觉',
    description: '代表梦想和灵性。双鱼座的人情感丰富，富有想象力，直觉敏锐，有很强的艺术天赋。'
  }
];

// 生肖基础数据
const CHINESE_ZODIAC_DATA = [
  {
    name: '鼠',
    year: '子',
    trait: '机智、灵活、适应力强',
    lucky: ['2', '3'],
    description: '鼠年出生的人聪明伶俐，善于交际，适应能力极强，能够在各种环境中生存和发展。'
  },
  {
    name: '牛',
    year: '丑',
    trait: '踏实、勤奋、耐力',
    lucky: ['1', '9'],
    description: '牛年出生的人勤劳朴实，脚踏实地，有很强的耐力和毅力，能够坚持完成目标。'
  },
  {
    name: '虎',
    year: '寅',
    trait: '勇敢、自信、领导力',
    lucky: ['3', '4'],
    description: '虎年出生的人充满活力和自信，有天生的领导能力，勇敢果断，喜欢挑战。'
  },
  {
    name: '兔',
    year: '卯',
    trait: '温和、细腻、善良',
    lucky: ['2', '8'],
    description: '兔年出生的人性格温和，举止优雅，心思细腻，富有同情心，善于处理人际关系。'
  },
  {
    name: '龙',
    year: '辰',
    trait: '自信、热情、魅力',
    lucky: ['1', '6'],
    description: '龙年出生的人天生具有领导气质，充满活力和热情，有很强的魅力和影响力。'
  },
  {
    name: '蛇',
    year: '巳',
    trait: '智慧、神秘、直觉',
    lucky: ['2', '8'],
    description: '蛇年出生的人思维敏捷，洞察力强，性格沉稳，有很强的直觉和智慧。'
  },
  {
    name: '马',
    year: '午',
    trait: '活力、热情、自由',
    lucky: ['5', '7'],
    description: '马年出生的人热情开朗，追求自由，行动力强，喜欢旅行和探索新事物。'
  },
  {
    name: '羊',
    year: '未',
    trait: '温和、善良、艺术',
    lucky: ['3', '9'],
    description: '羊年出生的人性格温和，心地善良，有艺术气质，善于表达和沟通。'
  },
  {
    name: '猴',
    year: '申',
    trait: '机智、灵活、幽默',
    lucky: ['1', '7'],
    description: '猴年出生的人聪明机智，反应敏捷，善于交际，有很强的幽默感和创造力。'
  },
  {
    name: '鸡',
    year: '酉',
    trait: '勤奋、守时、精确',
    lucky: ['5', '8'],
    description: '鸡年出生的人勤奋努力，注重细节，守时守信用，有很强的组织能力。'
  },
  {
    name: '狗',
    year: '戌',
    trait: '忠诚、勇敢、正义',
    lucky: ['3', '4'],
    description: '狗年出生的人忠诚可靠，正直勇敢，有很强的责任感，是值得信赖的朋友。'
  },
  {
    name: '猪',
    year: '亥',
    trait: '真诚、善良、乐观',
    lucky: ['2', '5'],
    description: '猪年出生的人真诚待人，乐观开朗，心胸宽广，有很强的包容心和同情心。'
  }
];

// 占卜类型
const FORTUNE_TYPES = [
  { id: 'bagua', name: '易经八卦', icon: '☰' },
  { id: 'zodiac', name: '星座解读', icon: '♈' },
  { id: 'chinese', name: '生肖运势', icon: '🐾' }
];

// 导出数据
module.exports = {
  BAGUA_DATA,
  ZODIAC_DATA,
  CHINESE_ZODIAC_DATA,
  FORTUNE_TYPES,
  // 合并所有fallback数据
  getFORTUNE_DATA() {
    return [
      ...BAGUA_DATA,
      ...ZODIAC_DATA,
      ...CHINESE_ZODIAC_DATA
    ];
  }
};

// 简化导出，供其他模块使用
module.exports.FALLBACK_FORTUNES = [
  ...BAGUA_DATA,
  ...ZODIAC_DATA,
  ...CHINESE_ZODIAC_DATA
];
