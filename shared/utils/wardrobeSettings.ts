import {
  normalizeCatalogRegionScope,
  type CatalogRegionScope,
} from './catalogAvailability'

export const WARDROBE_SETTINGS_STORAGE_KEY = 'gongeous-wardrobe-settings'
export const WARDROBE_SETTINGS_VERSION = 1 as const

export type WardrobeProfileShareSettings = Record<string, unknown>

export type WardrobeProfileSettings = {
  regionScope: CatalogRegionScope
  onboardingCompleted: boolean
  share: WardrobeProfileShareSettings
}

export type WardrobeSettings = {
  version: typeof WARDROBE_SETTINGS_VERSION
  profiles: Record<string, WardrobeProfileSettings>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export const createDefaultWardrobeProfileSettings =
  (): WardrobeProfileSettings => ({
    regionScope: 'global',
    onboardingCompleted: false,
    share: {},
  })

export const createEmptyWardrobeSettings = (): WardrobeSettings => ({
  version: WARDROBE_SETTINGS_VERSION,
  profiles: {},
})

const normalizeShareSettings = (
  value: unknown
): WardrobeProfileShareSettings => (isRecord(value) ? { ...value } : {})

const normalizeWardrobeProfileSettings = (
  value: unknown
): WardrobeProfileSettings => {
  const record = isRecord(value) ? value : {}

  return {
    regionScope: normalizeCatalogRegionScope(record.regionScope),
    onboardingCompleted:
      typeof record.onboardingCompleted === 'boolean'
        ? record.onboardingCompleted
        : false,
    share: normalizeShareSettings(record.share),
  }
}

export const normalizeWardrobeSettings = (
  value: unknown,
  _legacyShare?: unknown
): WardrobeSettings => {
  const record = isRecord(value) ? value : {}
  const rawProfiles = isRecord(record.profiles) ? record.profiles : {}
  const profileKeys = new Set(Object.keys(rawProfiles))
  const profiles: Record<string, WardrobeProfileSettings> = {}

  profileKeys.forEach((profileKey) => {
    profiles[profileKey] = normalizeWardrobeProfileSettings(
      rawProfiles[profileKey]
    )
  })

  return {
    version: WARDROBE_SETTINGS_VERSION,
    profiles,
  }
}

export const getWardrobeProfileSettings = (
  settings: WardrobeSettings,
  profileKey: string
): WardrobeProfileSettings =>
  settings.profiles[profileKey] ?? createDefaultWardrobeProfileSettings()

export const updateWardrobeProfileSettings = (
  settings: WardrobeSettings,
  profileKey: string,
  updater: (profile: WardrobeProfileSettings) => WardrobeProfileSettings
): WardrobeSettings => {
  const current = getWardrobeProfileSettings(settings, profileKey)

  return normalizeWardrobeSettings({
    ...settings,
    profiles: {
      ...settings.profiles,
      [profileKey]: updater(current),
    },
  })
}
