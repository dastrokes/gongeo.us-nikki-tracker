export const useWardrobeSettings = () => {
  const { activeSlot } = useProfileSlots()
  const settings = useLocalStorage<WardrobeSettings>(
    WARDROBE_SETTINGS_STORAGE_KEY,
    createEmptyWardrobeSettings()
  )

  settings.value = normalizeWardrobeSettings(settings.value)

  const activeProfileKey = computed(() => String(activeSlot.value))
  const activeProfileSettings = computed(() =>
    getWardrobeProfileSettings(settings.value, activeProfileKey.value)
  )
  const activeRegionScope = computed(
    () => activeProfileSettings.value.regionScope
  )
  const onboardingCompleted = computed(
    () => activeProfileSettings.value.onboardingCompleted
  )
  const activeShareSettings = computed(() => activeProfileSettings.value.share)

  const updateActiveProfileSettings = (
    updater: (profile: WardrobeProfileSettings) => WardrobeProfileSettings
  ) => {
    settings.value = updateWardrobeProfileSettings(
      settings.value,
      activeProfileKey.value,
      updater
    )
  }

  const setActiveRegionScope = (regionScope: CatalogRegionScope) => {
    updateActiveProfileSettings((profile) => ({
      ...profile,
      regionScope: normalizeCatalogRegionScope(regionScope),
    }))
  }

  const setActiveShareSettings = (share: WardrobeProfileShareSettings) => {
    updateActiveProfileSettings((profile) => ({
      ...profile,
      share,
    }))
  }

  const completeOnboarding = () => {
    updateActiveProfileSettings((profile) => ({
      ...profile,
      onboardingCompleted: true,
    }))
  }

  return {
    settings,
    activeProfileSettings,
    activeRegionScope,
    onboardingCompleted,
    activeShareSettings,
    setActiveRegionScope,
    setActiveShareSettings,
    updateActiveProfileSettings,
    completeOnboarding,
  }
}
