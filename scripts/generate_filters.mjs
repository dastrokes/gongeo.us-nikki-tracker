import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const attributePath = path.join(repoRoot, 'data', 'attribute.json')

const raw = fs.readFileSync(attributePath, 'utf8')
const data = JSON.parse(raw)

const fields = new Map()

for (const item of data) {
  const field = item.field
  const value = item.value

  if (!fields.has(field)) {
    fields.set(field, new Set())
  }

  fields.get(field).add(value)
}

const sortedFields = Object.fromEntries(
  Array.from(fields.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([field, values]) => [field, Array.from(values).sort()])
)

const commonMap = {
  long: { en: 'Long', zh: '长', tw: '長' },
  medium: { en: 'Medium', zh: '中', tw: '中' },
  short: { en: 'Short', zh: '短', tw: '短' },
  very_long: { en: 'Very Long', zh: '特长', tw: '特長' },
  mini: { en: 'Mini', zh: '超短', tw: '超短' },
  maxi: { en: 'Maxi', zh: '超长', tw: '超長' },
  midi: { en: 'Midi', zh: '中长', tw: '中長' },
  floor_length: { en: 'Floor Length', zh: '拖地', tw: '拖地' },
  knee_length: { en: 'Knee Length', zh: '及膝', tw: '及膝' },
  ankle_length: { en: 'Ankle Length', zh: '及踝', tw: '及踝' },
  upper_thigh: { en: 'Upper Thigh', zh: '大腿中部', tw: '大腿中部' },
  mid_calf: { en: 'Mid-Calf', zh: '小腿中部', tw: '小腿中部' },
  mid_thigh: { en: 'Mid-Thigh', zh: '大腿中部', tw: '大腿中部' },
  low: { en: 'Low', zh: '低', tw: '低' },
  high: { en: 'High', zh: '高', tw: '高' },
  flat: { en: 'Flat', zh: '平底', tw: '平底' },
  fitted: { en: 'Fitted', zh: '修身', tw: '修身' },
  regular: { en: 'Regular', zh: '合身', tw: '合身' },
  loose: { en: 'Loose', zh: '宽松', tw: '寬鬆' },
  oversized: { en: 'Oversized', zh: '廓形', tw: '廓形' },
  bodycon: { en: 'Bodycon', zh: '紧身', tw: '緊身' },
  straight: { en: 'Straight', zh: '直', tw: '直' },
  curly: { en: 'Curly', zh: '卷', tw: '捲' },
  wavy: { en: 'Wavy', zh: '波浪', tw: '波浪' },
  asymmetric: { en: 'Asymmetric', zh: '不对称', tw: '不對稱' },
  sleeveless: { en: 'Sleeveless', zh: '无袖', tw: '無袖' },
  elbow: { en: 'Elbow', zh: '五分袖', tw: '五分袖' },
  three_quarter: { en: 'Three-Quarter', zh: '七分袖', tw: '七分袖' },
  extra_long: { en: 'Extra Long', zh: '超长', tw: '超長' },
  ankle: { en: 'Ankle', zh: '短筒/及踝', tw: '短筒/及踝' },
  knee: { en: 'Knee', zh: '及膝/长筒', tw: '及膝/長筒' },
  over_knee: { en: 'Over-Knee', zh: '过膝', tw: '過膝' },
  thigh_high: { en: 'Thigh High', zh: '大腿/超长筒', tw: '大腿/超長筒' },
  knee_high: { en: 'Knee High', zh: '及膝/长筒', tw: '及膝/長筒' },
  lace: { en: 'Lace', zh: '蕾丝', tw: '蕾絲' },
  satin: { en: 'Satin', zh: '缎面', tw: '緞面' },
  leather: { en: 'Leather', zh: '皮革', tw: '皮革' },
  chiffon: { en: 'Chiffon', zh: '雪纺', tw: '雪紡' },
  velvet: { en: 'Velvet', zh: '丝绒', tw: '絲絨' },
  denim: { en: 'Denim', zh: '牛仔', tw: '牛仔' },
  fur: { en: 'Fur', zh: '仿皮草', tw: '仿皮草' },
  knit: { en: 'Knit', zh: '针织', tw: '針織' },
  sheer: { en: 'Sheer', zh: '透视', tw: '透視' },
  tulle: { en: 'Tulle', zh: '网纱', tw: '網紗' },
  wool: { en: 'Wool', zh: '羊毛', tw: '羊毛' },
  tweed: { en: 'Tweed', zh: '粗呢', tw: '粗呢' },
  suede: { en: 'Suede', zh: '磨砂皮', tw: '磨砂皮' },
  floral: { en: 'Floral', zh: '花纹', tw: '花紋' },
  flower: { en: 'Flower', zh: '花朵', tw: '花朵' },
  polka_dot: { en: 'Polka Dot', zh: '波点', tw: '波點' },
  striped: { en: 'Striped', zh: '条纹', tw: '條紋' },
  plaid: { en: 'Plaid', zh: '格纹', tw: '格紋' },
  checkered: { en: 'Checkered', zh: '棋盘格', tw: '棋盤格' },
  animal_print: { en: 'Animal Print', zh: '动物纹', tw: '動物紋' },
  camouflage: { en: 'Camouflage', zh: '迷彩', tw: '迷彩' },
  heart: { en: 'Heart', zh: '心形', tw: '心形' },
  star: { en: 'Star', zh: '星形', tw: '星形' },
  moon: { en: 'Moon', zh: '月亮', tw: '月亮' },
  cloud: { en: 'Cloud', zh: '云', tw: '雲' },
  snowflake: { en: 'Snowflake', zh: '雪花', tw: '雪花' },
  butterfly: { en: 'Butterfly', zh: '蝴蝶', tw: '蝴蝶' },
  bird: { en: 'Bird', zh: '鸟', tw: '鳥' },
  fish: { en: 'Fish', zh: '鱼', tw: '魚' },
  dragon: { en: 'Dragon', zh: '龙', tw: '龍' },
  gradient: { en: 'Gradient', zh: '渐变', tw: '漸變' },
  blunt_bangs: { en: 'Blunt Bangs', zh: '齐刘海', tw: '齊瀏海' },
  curtain_bangs: { en: 'Curtain Bangs', zh: '八字刘海', tw: '八字瀏海' },
  wispy_bangs: { en: 'Wispy Bangs', zh: '空气刘海', tw: '空氣瀏海' },
  no_bangs: { en: 'No Bangs', zh: '无刘海', tw: '無瀏海' },
  side_swept_bangs: { en: 'Side Swept Bangs', zh: '斜刘海', tw: '斜瀏海' },
  layered_cut: { en: 'Layered Cut', zh: '层次剪', tw: '層次剪' },
  bob: { en: 'Bob', zh: '波波头', tw: '波波頭' },
  blunt_cut: { en: 'Blunt Cut', zh: '齐切', tw: '齊切' },
  wolf_cut: { en: 'Wolf Cut', zh: '鲻鱼头', tw: '鯔魚頭' },
  hime_cut: { en: 'Hime Cut', zh: '姬发式', tw: '姬髮式' },
  pixie_cut: { en: 'Pixie Cut', zh: '精灵头', tw: '精靈頭' },
  shag: { en: 'Shag', zh: '蓬松发', tw: '蓬鬆髮' },
  block: { en: 'Block', zh: '粗跟', tw: '粗跟' },
  stiletto: { en: 'Stiletto', zh: '细高跟', tw: '細高跟' },
  wedge: { en: 'Wedge', zh: '坡跟', tw: '坡跟' },
  kitten: { en: 'Kitten', zh: '猫跟', tw: '貓跟' },
  shorts: { en: 'Shorts', zh: '短裤', tw: '短褲' },
  pants: { en: 'Pants', zh: '裤子', tw: '褲子' },
  skirt: { en: 'Skirt', zh: '半筒裙/半身裙', tw: '半筒裙/半身裙' },
  dress: { en: 'Dress', zh: '连衣裙', tw: '連衣裙' },
}

const titleCaseToken = (value) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const translateValue = (field, value) => {
  if (commonMap[value]) {
    const { en, zh, tw } = commonMap[value]

    if (field === 'hair_length' || field === 'texture') {
      if (value === 'straight') return ['Straight', '直发', '直髮']
      if (value === 'curly') return ['Curly', '卷发', '捲髮']
    }

    return [en, zh, tw]
  }

  const en = titleCaseToken(value)
  let zh = ''
  let tw = ''

  if (field === 'hair_length') {
    if (value.includes('long')) {
      zh = '长发'
      tw = '長髮'
    }
    if (value.includes('short')) {
      zh = '短发'
      tw = '短髮'
    }
    if (value.includes('medium')) {
      zh = '中发'
      tw = '中髮'
    }
  } else if (field === 'top_length') {
    if (value.includes('waist')) {
      zh = '齐腰'
      tw = '齊腰'
    }
    if (value.includes('hip')) {
      zh = '及臀'
      tw = '及臀'
    }
  }

  return [en, zh, tw]
}

const enTranslations = {}
const zhTranslations = {}
const twTranslations = {}

for (const [field, values] of Object.entries(sortedFields)) {
  enTranslations[field] = {}
  zhTranslations[field] = {}
  twTranslations[field] = {}

  for (const value of values) {
    const [en, zh, tw] = translateValue(field, value)
    enTranslations[field][value] = en
    zhTranslations[field][value] = zh
    twTranslations[field][value] = tw
  }
}

for (const [lang, translations] of [
  ['en', enTranslations],
  ['zh', zhTranslations],
  ['tw', twTranslations],
]) {
  const outputPath = path.join(repoRoot, 'app', 'locales', lang, 'filter.json')

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ filter: translations }, null, 2)}\n`,
    'utf8'
  )
}

console.log('Done')
