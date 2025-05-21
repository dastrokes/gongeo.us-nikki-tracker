import S0001 from './S0001'
import S0033 from './S0033'
import S0056 from './S0056'
import S0058 from './S0058'
import S0084 from './S0084'
import S0092 from './S0092'
import S0093 from './S0093'
import S0096 from './S0096'
import S0097 from './S0097'
import S0105 from './S0105'
import S0107 from './S0107'
import S0113 from './S0113'
import S0114 from './S0114'
import S0117 from './S0117'
import S0123 from './S0123'
import S0126 from './S0126'
import S0129 from './S0129'
import S0132 from './S0132'
import S0143 from './S0143'
import S0145 from './S0145'
import S0153 from './S0153'
import S0161 from './S0161'
import S0162 from './S0162'
import S0163 from './S0163'
import S0164 from './S0164'
import S0165 from './S0165'
import S0166 from './S0166'
import S0167 from './S0167'
import S0178 from './S0178'
import S0179 from './S0179'
import S0181 from './S0181'
import S0183 from './S0183'
import S0197 from './S0197'
import S0208 from './S0208'
import S0223 from './S0223'
import S0226 from './S0226'
import S0227 from './S0227'
import S0228 from './S0228'

const OUTFIT_DATA = {
  S0001,
  S0033,
  S0056,
  S0058,
  S0084,
  S0092,
  S0093,
  S0096,
  S0097,
  S0105,
  S0107,
  S0113,
  S0114,
  S0117,
  S0123,
  S0126,
  S0129,
  S0132,
  S0143,
  S0145,
  S0153,
  S0161,
  S0162,
  S0163,
  S0164,
  S0165,
  S0166,
  S0167,
  S0178,
  S0179,
  S0181,
  S0183,
  S0197,
  S0208,
  S0223,
  S0226,
  S0227,
  S0228,
} as const

export type OutfitKey = keyof typeof OUTFIT_DATA
export default OUTFIT_DATA
