import S0033 from './S0033'
import S0093 from './S0093'
import S0105 from './S0105'
import S0114 from './S0114'
import S0126 from './S0126'
import S0145 from './S0145'
import S0161 from './S0161'
import S0163 from './S0163'
import S0164 from './S0164'
import S0165 from './S0165'
import S0223 from './S0223'
import S0226 from './S0226'

const OUTFIT_DATA = {
  S0033,
  S0093,
  S0105,
  S0114,
  S0126,
  S0145,
  S0161,
  S0163,
  S0164,
  S0165,
  S0223,
  S0226,
} as const

export type OutfitKey = keyof typeof OUTFIT_DATA
export default OUTFIT_DATA
