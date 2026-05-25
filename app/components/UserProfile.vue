<template>
  <n-dropdown
    trigger="click"
    :options="dropdownOptions"
    @select="handleSelect"
  >
    <n-button
      text
      size="tiny"
      class="flex items-center"
      :aria-label="$t('default.accessibility.user_profile_menu')"
    >
      <template #icon>
        <n-icon>
          <User />
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import {
    User,
    UserTag,
    SignInAlt,
    SignOutAlt,
    Upload,
    Sync,
    TrashAlt,
    Trash,
  } from '@vicons/fa'
  import { NAlert, NIcon } from 'naive-ui'
  import type {
    DropdownDividerOption,
    DropdownGroupOption,
    DropdownOption,
    DropdownRenderOption,
  } from 'naive-ui'

  type DropdownMixedOption =
    | DropdownOption
    | DropdownGroupOption
    | DropdownDividerOption
    | DropdownRenderOption

  const { t } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const { clearData, loadData, loadWardrobe } = useIndexedDB()
  const { user, signOut } = useAuth()
  const { uploadData, syncData, clearCloudData } = useDataSync()
  const { resetToDefaults } = useTrackerSettings()
  const { slots, activeSlot, switchProfile } = useProfileSlots()
  const { initFromData, initFromIndexedDB } = usePullStoreData()

  const DEFAULT_PROFILE_LABEL = 'Default'
  const PROFILE_LABEL_PREFIX = 'Profile '

  const isDefaultLabel = (slot: number, label?: string): boolean => {
    if (!label) return true
    const normalized = label.trim()
    if (slot === 1) {
      return normalized === DEFAULT_PROFILE_LABEL
    }
    return normalized === `${PROFILE_LABEL_PREFIX}${slot}`
  }

  const getSlotLabel = (slot: number): string => {
    const label = slots.value[slot - 1]?.label
    if (!label || isDefaultLabel(slot, label)) {
      return slot === 1
        ? t('profile.default_profile')
        : t('profile.profile_slot', { number: slot })
    }
    return label
  }

  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))
  const accountLabel = computed(() => {
    if (!user.value) return t('default.user_profile.guest')
    const displayName =
      user.value.user_metadata?.custom_claims?.global_name || user.value.email
    return displayName || t('default.user_profile.guest')
  })

  type ProfileUploadDataState = {
    hasResonanceData: boolean
    hasWardrobeData: boolean
  }

  const hasResonanceBackupData = (data: {
    pulls: Record<number, PullRecord[]>
    edits: Record<number, EditRecord[]>
    evo: Record<number, EvoRecord[]>
    pearpal: Record<number, PearpalTrackerItem[]>
  }): boolean =>
    Object.keys(data.pulls).length > 0 ||
    Object.keys(data.edits).length > 0 ||
    Object.keys(data.evo).length > 0 ||
    Object.keys(data.pearpal).length > 0

  const hasWardrobeBackupData = (wardrobe: WardrobeData | undefined): boolean =>
    Boolean(
      wardrobe &&
      (wardrobe.ownedItemIds.length > 0 ||
        wardrobe.ownedMakeupIds.length > 0 ||
        wardrobe.ownedMomoIds.length > 0)
    )

  const hasProfileBackupData = (state: ProfileUploadDataState): boolean =>
    state.hasResonanceData || state.hasWardrobeData

  const getProfileUploadWarningKeys = (state: ProfileUploadDataState) => {
    const warnings: string[] = []
    if (!state.hasResonanceData) {
      warnings.push(
        'default.user_profile.sync.confirm_upload.empty_resonance_warning'
      )
    }
    if (!state.hasWardrobeData) {
      warnings.push(
        'default.user_profile.sync.confirm_upload.empty_wardrobe_warning'
      )
    }
    return warnings
  }

  const renderProfileUploadConfirmation = (
    content: string,
    warnings: readonly string[]
  ) =>
    h('div', { class: 'space-y-3' }, [
      h('p', { class: 'm-0' }, content),
      ...warnings.map((warning) =>
        h(
          NAlert,
          {
            key: warning,
            type: 'warning',
            showIcon: true,
            bordered: true,
          },
          { default: () => warning }
        )
      ),
    ])

  const getActiveProfileUploadDataState =
    async (): Promise<ProfileUploadDataState> => {
      const data = await loadData(activeSlot.value)
      const wardrobe = await loadWardrobe(activeSlot.value)
      return {
        hasResonanceData: hasResonanceBackupData(data),
        hasWardrobeData: hasWardrobeBackupData(wardrobe),
      }
    }

  const getUploadConfirmationContent = (state: ProfileUploadDataState) => () =>
    renderProfileUploadConfirmation(
      t('default.user_profile.sync.confirm_upload.content', {
        profile: activeProfileLabel.value,
      }),
      getProfileUploadWarningKeys(state).map((key) => t(key))
    )

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const existingProfileCount = computed(
    () => slots.value.filter((slot) => slot.exists).length
  )

  const profileMenuChildren = computed((): DropdownMixedOption[] => {
    const children: DropdownMixedOption[] = slots.value
      .map((slot, index): DropdownOption | null => {
        if (!slot.exists) return null
        const slotNumber = index + 1
        return {
          label: getSlotLabel(slotNumber),
          key: `profile-switch-${slotNumber}`,
          disabled: activeSlot.value === slotNumber,
        }
      })
      .filter((option): option is DropdownOption => option !== null)

    return children
  })

  const dropdownOptions = computed((): DropdownMixedOption[] => {
    const options: DropdownMixedOption[] = [
      {
        label: accountLabel.value,
        key: 'account',
        icon: renderIcon(User),
      },
      {
        label: activeProfileLabel.value,
        key: 'profile-menu',
        icon: renderIcon(UserTag),
        children: profileMenuChildren.value,
        show: existingProfileCount.value > 1,
      },
      {
        type: 'divider',
        key: 'manage-divider',
      },
    ]

    // Auth actions
    if (user.value) {
      options.push({
        label: t('default.user_profile.sign_out'),
        key: 'signout',
        icon: renderIcon(SignOutAlt),
      })

      // Sync options - only show when authenticated
      options.push({
        type: 'divider',
        key: 'sync-divider',
      })

      options.push({
        label: t('common.profile.upload_data'),
        key: 'upload',
        icon: renderIcon(Upload),
      })

      options.push({
        label: t('common.profile.sync_data'),
        key: 'sync',
        icon: renderIcon(Sync),
      })
    } else {
      options.push({
        label: t('login.sign_in'),
        key: 'signin',
        icon: renderIcon(SignInAlt),
      })
    }

    // Clear data option
    options.push({
      type: 'divider',
      key: 'clear-divider',
    })

    if (user.value) {
      options.push({
        label: t('common.profile.clear_cloud_data'),
        key: 'clear-cloud',
        icon: renderIcon(TrashAlt),
      })
    }

    options.push({
      label: t('common.profile.clear_local_data'),
      key: 'clear',
      icon: renderIcon(Trash),
    })

    return options
  })

  const handleProfileSwitch = async (slot: number) => {
    if (!switchProfile(slot)) return
    await initFromIndexedDB()
    message.success(
      t('default.user_profile.profiles.switched_success', {
        profile: getSlotLabel(slot),
      })
    )
  }

  const handleSelect = async (key: string) => {
    if (key === 'account') {
      await navigateTo(`${localePath('/profile')}`)
      return
    }

    if (key.startsWith('profile-switch-')) {
      const slot = Number(key.replace('profile-switch-', ''))
      if (Number.isFinite(slot)) {
        await handleProfileSwitch(slot)
      }
      return
    }

    if (key === 'signin') {
      await navigateTo(`${localePath('/login')}`)
      return
    }

    if (key === 'signout') {
      try {
        await signOut()
        message.success(t('default.user_profile.sign_out_success'))
      } catch (error) {
        message.error(t('default.user_profile.sign_out_error'))
        console.error('Sign out error:', error)
      }
    }

    if (key === 'upload') {
      const uploadDataState = await getActiveProfileUploadDataState()
      dialog.warning({
        title: t('common.profile.upload_data'),
        content: getUploadConfirmationContent(uploadDataState),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.loading'))

            if (!hasProfileBackupData(uploadDataState)) {
              // Load data from IndexedDB first
              const { pulls, edits, evo, pearpal } = await loadData()
              await initFromData({ pulls, edits, evo, pearpal })
            }

            const result = await uploadData()
            if (result.success) {
              message.success(t('default.user_profile.sync.upload_success'))
            } else {
              message.error(t('default.user_profile.sync.upload_error'))
            }
          } catch (error) {
            console.error('Upload error:', error)
            message.error(t('default.user_profile.sync.upload_error'))
          }
        },
      })
    }

    if (key === 'sync') {
      dialog.warning({
        title: t('common.profile.sync_data'),
        content: t('default.user_profile.sync.confirm_sync.content', {
          profile: activeProfileLabel.value,
        }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.loading'))
            const result = await syncData()
            if (result.success) {
              message.success(t('default.user_profile.sync.sync_success'))
            } else {
              message.error(t('default.user_profile.sync.sync_error'))
            }
          } catch (error) {
            console.error('Sync error:', error)
            message.error(t('default.user_profile.sync.sync_error'))
          }
        },
      })
    }

    if (key === 'clear-cloud') {
      dialog.warning({
        title: t('common.profile.clear_cloud_data'),
        content: t('default.user_profile.clear_cloud_confirm.content', {
          profile: activeProfileLabel.value,
        }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.loading'))
            const result = await clearCloudData()
            if (result.success) {
              message.success(t('default.user_profile.clear_cloud_success'))
            } else {
              message.error(t('default.user_profile.clear_cloud_error'))
            }
          } catch (error) {
            console.error('Clear cloud data error:', error)
            message.error(t('default.user_profile.clear_cloud_error'))
          }
        },
      })
    }

    if (key === 'clear') {
      dialog.warning({
        title: t('common.profile.clear_local_data'),
        content: t('default.user_profile.clear_local_confirm.content', {
          profile: activeProfileLabel.value,
        }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: async () => {
          await clearData()
          userStore.reset()
          pullStore.reset()
          resetToDefaults()
          message.success(t('default.user_profile.clear_success'))
        },
      })
    }
  }
</script>
