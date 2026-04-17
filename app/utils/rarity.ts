export const RARITY_COLORS = {
  5: '#f59e0b', // amber-500
  4: '#0ea5e9', // sky-500
  3: '#14b8a6', // teal-500
  2: '#64748b', // slate-500
} as const

const BG_COLORS = {
  5: '#FFFBEB', // bg-amber-50
  4: '#EFF8FF', // bg-sky-50
  3: '#F0FDFA', // bg-teal-50
  2: '#F9FAFB', // bg-slate-50
} as const

export const getQualityColor = (quality: number) => {
  return (
    RARITY_COLORS[quality as keyof typeof RARITY_COLORS] || RARITY_COLORS[2]
  )
}

export const getQualityTextTheme = (quality: number) => {
  const color = getQualityColor(quality)

  // These are optimized for a "theme-like" look: low opacity background, vibrant text
  return {
    color: `${color}25`, // ~15% opacity background
    textColor: color,
    borderColor: `${color}40`, // ~25% opacity border
  }
}

/**
 * Returns a Naive UI Tag color object
 */
export const getQualityTagTheme = (quality: number) => {
  const textColor = RARITY_COLORS[quality as keyof typeof RARITY_COLORS]
  return {
    color: `${BG_COLORS[quality as keyof typeof BG_COLORS]}66`,
    textColor,
    borderColor: `${textColor}80`,
  }
}

/**
 * Returns a Naive UI Button color properties
 */
export const getQualityButtonTheme = (quality: number, active: boolean) => {
  const color = getQualityColor(quality)

  if (active) {
    return {
      color: color,
      textColor: '#FFFFFF',
    }
  }

  return {
    color: `${color}1A`,
    textColor: color,
  }
}

/**
 * Returns a style object for a subtle quality-colored overlay
 */
export const getQualityOverlayStyle = (quality: number) => {
  const color = getQualityColor(quality)
  // ~10% opacity for a very subtle tint
  return {
    backgroundColor: `${color}1A`,
  }
}

export const getQualityRingStyle = (quality: number) => {
  const color = getQualityColor(quality)
  return {
    outline: `2px outset ${color}66`,
  }
}

export const getQualityGradient = (quality: number) => {
  switch (quality) {
    case 5:
      return 'bg-linear-to-br from-amber-50 to-amber-200 ring-amber-200/20 hover:ring-amber-200/80 dark:from-amber-900 dark:to-amber-950 dark:ring-amber-900/20 dark:hover:ring-amber-900/80'
    case 4:
      return 'bg-linear-to-br from-sky-50 to-sky-200 ring-sky-200/20 hover:ring-sky-200/80 dark:from-sky-900 dark:to-sky-950 dark:ring-sky-900/20 dark:hover:ring-sky-900/80'
    case 3:
      return 'bg-linear-to-br from-teal-50 to-teal-200 ring-teal-200/20 hover:ring-teal-200/80 dark:from-teal-900 dark:to-teal-950 dark:ring-teal-900/20 dark:hover:ring-teal-900/80'
    case 2:
      return 'bg-linear-to-br from-slate-50 to-slate-200 ring-slate-200/20 hover:ring-slate-200/80 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-800/20 dark:hover:ring-slate-800/80'
    default:
      return 'bg-linear-to-br from-slate-50 to-slate-200 ring-slate-200/20 hover:ring-slate-200/80 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-800/20 dark:hover:ring-slate-800/80'
  }
}

export const getCardImageSeparationStyle = (isDark: boolean) => {
  return {
    filter: isDark
      ? 'drop-shadow(0 4px 8px rgba(2,6,23,0.16))'
      : 'drop-shadow(0 3px 6px rgba(15,23,42,0.08))',
  }
}
