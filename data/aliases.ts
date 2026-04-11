export type OutfitSearchAliasMap = Partial<
  Record<string, Partial<Record<string, readonly string[]>>>
>

/**
 * Search-only outfit aliases. Canonical display names stay in app/locales.
 */
export const OUTFIT_SEARCH_ALIASES: OutfitSearchAliasMap = {
  zh: {
    10001: ['气球套'],
    10117: ['烟花套'],
    10126: ['蝴蝶套'],
    10129: ['纸鹤套'],
    10154: ['教母套', '酵母套'],
    10161: ['精灵套'],
    10162: ['鱼套'],
    10178: ['鸟套'],
    10183: ['八音盒套'],
    10223: ['玩偶套'],
    10231: ['蛇套'],
    10239: ['歌剧套'],
    10250: ['女巫套'],
    10268: ['小红帽', '小红帽套'],
    10293: ['萤火虫套'],
    10330: ['龙套'],
    10331: ['猫套'],
    10349: ['神女套'],
    10350: ['圣女套'],
    10352: ['扇套'],
    10353: ['鹿套'],
    10355: ['独角兽套'],
  },
  en: {
    10001: ['balloon'],
    10117: ['firework'],
    10126: ['butterfly'],
    10129: ['paper crane'],
    10161: ['fairy'],
    10162: ['mermaid'],
    10183: ['music box'],
    10223: ['doll'],
    10231: ['sith', 'snake'],
    10239: ['opera'],
    10268: ['red riding hood'],
    10330: ['loong', 'dragon'],
    10331: ['cat'],
    10353: ['deer'],
    10355: ['unicorn'],
  },
}

const normalizeAliases = (aliases: readonly string[] | undefined): string[] =>
  Array.from(
    new Set((aliases ?? []).map((alias) => alias.trim()).filter(Boolean))
  )

export const getOutfitSearchAliases = (
  locale: string,
  outfitId: string | number
): string[] =>
  normalizeAliases(OUTFIT_SEARCH_ALIASES[locale]?.[String(outfitId)])
