<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="space-y-2 sm:space-y-4">
        <div class="text-center space-y-2">
          <n-h2 class="font-bold">{{ t('profile.manage_profiles') }}</n-h2>
          <n-text class="text-sm">{{ t('profile.subtitle') }}</n-text>
        </div>

        <n-card
          size="small"
          class="rounded-xl p-2"
          content-class="p-4"
        >
          <div class="flex gap-3 flex-row items-center justify-between">
            <div class="space-y-1">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                {{ t('profile.account_label') }}
              </div>
              <div class="font-semibold text-slate-900 dark:text-slate-100">
                <template v-if="initialized">
                  {{ accountLabel }}
                </template>
                <n-skeleton
                  v-else
                  text
                  class="w-36"
                />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <n-tag
                size="small"
                :type="user ? 'success' : 'warning'"
              >
                {{
                  user
                    ? t('default.user_profile.signed_in')
                    : t('default.user_profile.guest')
                }}
              </n-tag>
              <n-button
                v-if="!user"
                size="small"
                @click="handleSignIn"
              >
                <template #icon>
                  <n-icon>
                    <SignInAlt />
                  </n-icon>
                </template>
                {{ t('login.sign_in') }}
              </n-button>
            </div>
          </div>
        </n-card>

        <div class="grid gap-2 sm:gap-4 grid-cols-1 lg:grid-cols-3">
          <n-card
            v-for="(slot, index) in slots"
            :key="index"
            size="small"
            class="rounded-xl p-2"
            content-class="p-4"
          >
            <div class="relative">
              <div class="flex items-start gap-3">
                <div class="min-w-0 pr-24 sm:pr-28">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="font-semibold">
                      {{
                        slot.exists
                          ? getSlotLabel(index + 1)
                          : t('profile.profile_slot', {
                              number: index + 1,
                            })
                      }}
                    </div>
                    <n-tag
                      v-if="activeSlot === index + 1"
                      size="small"
                      type="success"
                    >
                      {{ t('default.user_profile.profiles.active') }}
                    </n-tag>
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    {{ t('profile.profile_slot', { number: index + 1 }) }}
                  </div>
                </div>
              </div>
              <div
                class="absolute top-0 right-0 flex flex-col items-end gap-2 text-xs text-slate-500 dark:text-slate-400"
              >
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-icon
                      size="18"
                      :class="getLocalStatusClass(index + 1)"
                    >
                      <Hdd />
                    </n-icon>
                  </template>
                  <span class="inline-flex items-center gap-1">
                    <span>{{ `${t('profile.status.local')}:` }}</span>
                    <template v-if="!localStatusReady">
                      <span>{{ t('common.loading') }}</span>
                    </template>
                    <n-icon
                      v-else
                      size="18"
                      :class="getLocalStatusClass(index + 1)"
                    >
                      <component :is="getLocalStatusIcon(index + 1)" />
                    </n-icon>
                  </span>
                </n-tooltip>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-icon
                      size="18"
                      :class="getCloudStatusClass(index + 1)"
                    >
                      <Cloud />
                    </n-icon>
                  </template>
                  <span class="inline-flex items-center gap-1">
                    <span>{{ `${t('profile.status.cloud')}:` }}</span>
                    <template v-if="!cloudStatusReady">
                      <span>{{ t('common.loading') }}</span>
                    </template>
                    <n-icon
                      v-else
                      size="18"
                      :class="getCloudStatusClass(index + 1)"
                    >
                      <component :is="getCloudStatusIcon(index + 1)" />
                    </n-icon>
                  </span>
                </n-tooltip>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-icon
                      size="18"
                      :class="getLastSyncClass(index + 1)"
                    >
                      <Clock />
                    </n-icon>
                  </template>
                  {{
                    `${t('profile.status.last_sync')}: ${getLastSyncLabel(index + 1)}`
                  }}
                </n-tooltip>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <n-button
                v-if="!slot.exists"
                size="small"
                circle
                @click="handleCreateProfile(index + 1)"
              >
                <n-icon>
                  <Plus />
                </n-icon>
              </n-button>

              <template v-else>
                <n-button
                  size="small"
                  circle
                  :disabled="activeSlot === index + 1"
                  :aria-label="t('profile.switch')"
                  :title="t('profile.switch')"
                  @click="handleSwitchProfile(index + 1)"
                >
                  <n-icon>
                    <ExchangeAlt />
                  </n-icon>
                </n-button>
                <n-button
                  size="small"
                  circle
                  secondary
                  :aria-label="t('profile.rename')"
                  :title="t('profile.rename')"
                  @click="confirmRenameProfile(index + 1)"
                >
                  <n-icon>
                    <PencilAlt />
                  </n-icon>
                </n-button>
                <n-button
                  v-if="index + 1 > 1"
                  size="small"
                  circle
                  tertiary
                  type="error"
                  :aria-label="t('common.profile.delete_profile')"
                  :title="t('common.profile.delete_profile')"
                  @click="confirmDeleteProfile(index + 1)"
                >
                  <n-icon>
                    <TrashAlt />
                  </n-icon>
                </n-button>
              </template>
            </div>
          </n-card>
        </div>

        <n-card
          size="small"
          class="rounded-xl p-2"
          content-class="p-4"
        >
          <div class="flex gap-3 flex-row items-center justify-between">
            <div class="space-y-1">
              <div class="text-sm text-slate-500 dark:text-slate-400">
                <template v-if="initialized">
                  {{ actionTargetLabel }}
                </template>
                <n-skeleton
                  v-else
                  text
                  class="w-44"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <n-switch v-model:value="applyToAllProfiles">
                <template #checked>{{ t('profile.all_profiles') }}</template>
                <template #unchecked>{{
                  t('profile.active_profile')
                }}</template>
              </n-switch>
            </div>
          </div>
          <div
            class="mt-4 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            <n-button @click="handleUpload">
              <template #icon>
                <n-icon>
                  <Upload />
                </n-icon>
              </template>
              {{ t('common.profile.upload_data') }}
            </n-button>
            <n-button @click="handleSync">
              <template #icon>
                <n-icon>
                  <Sync />
                </n-icon>
              </template>
              {{ t('common.profile.sync_data') }}
            </n-button>
            <n-button @click="handleClearCloud">
              <template #icon>
                <n-icon>
                  <TrashAlt />
                </n-icon>
              </template>
              {{ t('common.profile.clear_cloud_data') }}
            </n-button>
            <n-button @click="handleClearLocal">
              <template #icon>
                <n-icon>
                  <Trash />
                </n-icon>
              </template>
              {{ $t('common.profile.clear_local_data') }}
            </n-button>
          </div>
        </n-card>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { NInput } from 'naive-ui'
  import {
    CheckCircle,
    Cloud,
    Clock,
    ExchangeAlt,
    ExclamationTriangle,
    Hdd,
    PencilAlt,
    Plus,
    SignInAlt,
    Sync,
    Trash,
    TrashAlt,
    Upload,
  } from '@vicons/fa'
  import { intlLocaleMap } from '~/locales/locales'

  const { t, locale } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const { resetToDefaults } = useTrackerSettings()
  const { clearSlotData, loadData } = useIndexedDB()
  const { user, initialized } = useAuth()
  const { uploadData, syncData, clearCloudData, getRemoteSlotsWithData } =
    useDataSync()
  const { initFromIndexedDB } = usePullStoreData()
  const {
    slots,
    activeSlot,
    addProfile,
    deleteProfile,
    renameProfile,
    switchProfile,
  } = useProfileSlots()

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

  const renameValue = ref('')
  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))
  const accountLabel = computed(() => {
    if (!user.value) return t('default.user_profile.guest')
    const displayName =
      user.value.user_metadata?.custom_claims?.global_name || user.value.email
    return displayName || t('default.user_profile.guest')
  })
  const allProfilesLabel = computed(() => t('profile.all_profiles'))
  const applyToAllProfiles = ref(false)
  const existingSlotNumbers = computed(() =>
    slots.value
      .map((slot, index) => (slot.exists ? index + 1 : null))
      .filter((slot): slot is number => slot !== null)
  )
  const slotNumbers = computed(() => slots.value.map((_, index) => index + 1))
  const actionTargetLabel = computed(() =>
    applyToAllProfiles.value ? allProfilesLabel.value : activeProfileLabel.value
  )
  const intlLocale = computed(() => intlLocaleMap[locale.value] || 'en-US')
  const cloudSlots = ref<number[]>([])
  const cloudStatusReady = ref(false)
  const localStatusReady = ref(false)
  const localDataStatus = ref<Record<number, boolean>>({})

  useSeoMeta({
    title: () =>
      `${t('profile.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('profile.subtitle'),
    ogTitle: () =>
      `${t('profile.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('profile.subtitle'),
    twitterTitle: () =>
      `${t('profile.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('profile.subtitle'),
  })

  const hydratePullStoreFromIndexedDB = async () => {
    await initFromIndexedDB()
  }

  const handleSignIn = async () => {
    await navigateTo(`${localePath('/login')}`)
  }

  const formatLastSync = (isoValue: string | null | undefined): string => {
    if (!isoValue) return t('profile.status.never')
    const parsed = new Date(isoValue)
    if (Number.isNaN(parsed.getTime())) return t('profile.status.never')
    return parsed.toLocaleString(intlLocale.value, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getLastSyncLabel = (slot: number): string => {
    const slotData = slots.value[slot - 1]
    return formatLastSync(slotData?.lastSyncAt ?? null)
  }

  const getLocalStatusClass = (slot: number): string => {
    if (!localStatusReady.value) return 'text-slate-400'
    const hasData = localDataStatus.value[slot] ?? false
    return hasData ? 'text-emerald-500' : 'text-slate-400'
  }

  const getCloudStatusClass = (slot: number): string => {
    if (!cloudStatusReady.value) return 'text-slate-400'
    return cloudSlots.value.includes(slot)
      ? 'text-emerald-500'
      : 'text-slate-400'
  }

  const getLocalStatusIcon = (slot: number) => {
    const hasData = localDataStatus.value[slot] ?? false
    return hasData ? CheckCircle : ExclamationTriangle
  }

  const getCloudStatusIcon = (slot: number) => {
    return cloudSlots.value.includes(slot) ? CheckCircle : ExclamationTriangle
  }

  const getLastSyncClass = (slot: number): string => {
    const lastSyncAt = slots.value[slot - 1]?.lastSyncAt
    return lastSyncAt ? 'text-slate-500' : 'text-slate-400'
  }

  const requireAuth = async () => {
    if (user.value) return true
    await handleSignIn()
    return false
  }

  const refreshCloudStatus = async (): Promise<number[]> => {
    if (!user.value?.id) {
      cloudSlots.value = []
      cloudStatusReady.value = true
      return []
    }
    cloudStatusReady.value = false
    const remoteSlots = await getRemoteSlotsWithData()
    cloudSlots.value = remoteSlots
    cloudStatusReady.value = true
    return remoteSlots
  }

  const refreshLocalStatus = async (): Promise<void> => {
    localStatusReady.value = false
    const results = await Promise.all(
      slotNumbers.value.map(async (slot) => {
        const data = await loadData(slot)
        const hasData =
          Object.keys(data.pulls).length > 0 ||
          Object.keys(data.edits).length > 0 ||
          Object.keys(data.evo).length > 0 ||
          Object.keys(data.pearpal).length > 0
        return [slot, hasData] as const
      })
    )
    const nextStatus: Record<number, boolean> = {}
    results.forEach(([slot, hasData]) => {
      nextStatus[slot] = hasData
    })
    localDataStatus.value = nextStatus
    localStatusReady.value = true
  }

  const handleUploadToCloud = async () => {
    if (!(await requireAuth())) return

    dialog.warning({
      title: t('common.profile.upload_data'),
      content: t('default.user_profile.sync.confirm_upload.content', {
        profile: activeProfileLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        try {
          message.loading(t('common.loading'))
          const result = await uploadData()
          if (result.success) {
            message.success(t('default.user_profile.sync.upload_success'))
            await refreshCloudStatus()
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

  const ensureMissingProfilesForSync = async (): Promise<number[] | null> => {
    const remoteSlots = await refreshCloudStatus()
    if (remoteSlots.length === 0) {
      return []
    }

    const missingSlots = remoteSlots.filter(
      (slot) => !existingSlotNumbers.value.includes(slot)
    )
    if (missingSlots.length === 0) {
      return remoteSlots
    }

    const missingLabels = missingSlots
      .map((slot) => getSlotLabel(slot))
      .join(', ')

    return await new Promise((resolve) => {
      dialog.warning({
        title: t('default.user_profile.sync.missing_profiles.title'),
        content: t('default.user_profile.sync.missing_profiles.content', {
          profiles: missingLabels,
        }),
        positiveText: t('default.user_profile.sync.missing_profiles.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => {
          missingSlots.forEach((slot) => addProfile(slot))
          refreshLocalStatus()
          resolve(remoteSlots)
        },
        onNegativeClick: () => resolve(null),
        onClose: () => resolve(null),
      })
    })
  }

  const handleSyncFromCloud = async () => {
    if (!(await requireAuth())) return

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
            await refreshLocalStatus()
            await refreshCloudStatus()
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

  const handleClearCloudData = async () => {
    if (!(await requireAuth())) return

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
            await refreshCloudStatus()
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

  const handleClearLocalActive = () => {
    dialog.warning({
      title: t('common.profile.clear_local_data'),
      content: t('default.user_profile.clear_local_confirm.content', {
        profile: activeProfileLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        message.loading(t('common.loading'))
        await clearSlotData(activeSlot.value)
        userStore.reset()
        pullStore.reset()
        resetToDefaults()
        await hydratePullStoreFromIndexedDB()
        await refreshLocalStatus()
        message.success(t('default.user_profile.clear_success'))
      },
    })
  }

  const runCloudActionForSlots = async (
    slotsToRun: number[],
    action: (slot: number) => Promise<{ success: boolean }>,
    successMessage: string,
    errorMessage: string,
    options?: { allowEmptySuccess?: boolean }
  ) => {
    if (slotsToRun.length === 0) {
      if (options?.allowEmptySuccess) {
        message.success(successMessage)
      } else {
        message.error(errorMessage)
      }
      return
    }

    let hasFailure = false
    for (const slot of slotsToRun) {
      const result = await action(slot)
      if (!result.success) {
        hasFailure = true
      }
    }

    if (hasFailure) {
      message.error(errorMessage)
    } else {
      message.success(successMessage)
    }
  }

  const getSlotsWithLocalData = async (
    slotsToCheck: number[]
  ): Promise<number[]> => {
    const results = await Promise.all(
      slotsToCheck.map(async (slot) => {
        const data = await loadData(slot)
        const hasData =
          Object.keys(data.pulls).length > 0 ||
          Object.keys(data.edits).length > 0 ||
          Object.keys(data.evo).length > 0 ||
          Object.keys(data.pearpal).length > 0
        return hasData ? slot : null
      })
    )

    return results.filter((slot): slot is number => slot !== null)
  }

  const handleUploadAllProfiles = async () => {
    if (!(await requireAuth())) return

    dialog.warning({
      title: t('common.profile.upload_data'),
      content: t('default.user_profile.sync.confirm_upload.content', {
        profile: allProfilesLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        try {
          message.loading(t('common.loading'))
          const slotsToUpload = await getSlotsWithLocalData(
            existingSlotNumbers.value
          )
          await runCloudActionForSlots(
            slotsToUpload,
            uploadData,
            t('default.user_profile.sync.upload_success'),
            t('default.user_profile.sync.upload_error'),
            { allowEmptySuccess: true }
          )
          await refreshCloudStatus()
        } catch (error) {
          console.error('Upload all profiles error:', error)
          message.error(t('default.user_profile.sync.upload_error'))
        }
      },
    })
  }

  const handleSyncAllProfiles = async () => {
    if (!(await requireAuth())) return

    const remoteSlots = await ensureMissingProfilesForSync()
    if (!remoteSlots) return

    dialog.warning({
      title: t('common.profile.sync_data'),
      content: t('default.user_profile.sync.confirm_sync.content', {
        profile: allProfilesLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        try {
          message.loading(t('common.loading'))
          await runCloudActionForSlots(
            remoteSlots,
            syncData,
            t('default.user_profile.sync.sync_success'),
            t('default.user_profile.sync.sync_error')
          )
          await hydratePullStoreFromIndexedDB()
          await refreshLocalStatus()
          await refreshCloudStatus()
        } catch (error) {
          console.error('Sync all profiles error:', error)
          message.error(t('default.user_profile.sync.sync_error'))
        }
      },
    })
  }

  const handleClearCloudAllProfiles = async () => {
    if (!(await requireAuth())) return

    const remoteSlots = await refreshCloudStatus()

    dialog.warning({
      title: t('common.profile.clear_cloud_data'),
      content: t('default.user_profile.clear_cloud_confirm.content', {
        profile: allProfilesLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        try {
          message.loading(t('common.loading'))
          await runCloudActionForSlots(
            remoteSlots,
            clearCloudData,
            t('default.user_profile.clear_cloud_success'),
            t('default.user_profile.clear_cloud_error'),
            { allowEmptySuccess: true }
          )
          await refreshCloudStatus()
        } catch (error) {
          console.error('Clear cloud data all profiles error:', error)
          message.error(t('default.user_profile.clear_cloud_error'))
        }
      },
    })
  }

  const handleClearLocalAll = () => {
    dialog.warning({
      title: t('common.profile.clear_local_data'),
      content: t('default.user_profile.clear_local_confirm.content', {
        profile: allProfilesLabel.value,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        message.loading(t('common.loading'))
        for (let slot = 1; slot <= slots.value.length; slot += 1) {
          await clearSlotData(slot)
        }
        userStore.reset()
        pullStore.reset()
        resetToDefaults()
        await hydratePullStoreFromIndexedDB()
        await refreshLocalStatus()
        message.success(t('default.user_profile.clear_success'))
      },
    })
  }

  const handleUpload = async () => {
    if (applyToAllProfiles.value) {
      await handleUploadAllProfiles()
      return
    }

    await handleUploadToCloud()
  }

  const handleSync = async () => {
    if (applyToAllProfiles.value) {
      await handleSyncAllProfiles()
      return
    }

    await handleSyncFromCloud()
  }

  const handleClearCloud = async () => {
    if (applyToAllProfiles.value) {
      await handleClearCloudAllProfiles()
      return
    }

    await handleClearCloudData()
  }

  const handleClearLocal = async () => {
    if (applyToAllProfiles.value) {
      handleClearLocalAll()
      return
    }

    handleClearLocalActive()
  }

  const confirmRenameProfile = (slot: number) => {
    const profileLabel = getSlotLabel(slot)
    renameValue.value = profileLabel
    dialog.create({
      title: t('profile.rename_title'),
      content: () =>
        h(NInput, {
          value: renameValue.value,
          placeholder: t('profile.rename_placeholder'),
          maxlength: 30,
          onUpdateValue: (value: string) => {
            renameValue.value = value
          },
        }),
      positiveText: t('common.save'),
      negativeText: t('common.cancel'),
      onPositiveClick: () => {
        const success = renameProfile(slot, renameValue.value)
        if (!success) {
          message.error(t('profile.rename_error'))
          return false
        }
        message.success(t('profile.rename_success'))
        return true
      },
    })
  }

  const confirmDeleteProfile = (slot: number) => {
    const profileLabel = getSlotLabel(slot)
    dialog.warning({
      title: t('common.profile.delete_profile'),
      content: t('default.user_profile.profiles.delete_confirm.content', {
        profile: profileLabel,
      }),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        if (user.value) {
          const cloudDeleteResult = await clearCloudData(slot)
          if (!cloudDeleteResult.success) {
            message.error(t('default.user_profile.clear_cloud_error'))
            return
          }
        }

        await clearSlotData(slot)
        const wasActive = activeSlot.value === slot
        if (deleteProfile(slot)) {
          if (wasActive) {
            await hydratePullStoreFromIndexedDB()
          }
          message.success(t('default.user_profile.profiles.deleted_success'))
        }
      },
    })
  }

  const handleCreateProfile = async (slot: number) => {
    const created = addProfile(slot)
    if (created) {
      switchProfile(slot)
      await hydratePullStoreFromIndexedDB()
      await refreshLocalStatus()
      message.success(t('default.user_profile.profiles.created_success'))
    }
  }

  const handleSwitchProfile = async (slot: number) => {
    if (switchProfile(slot)) {
      await hydratePullStoreFromIndexedDB()
      await refreshLocalStatus()
      message.success(
        t('default.user_profile.profiles.switched_success', {
          profile: getSlotLabel(slot),
        })
      )
    }
  }

  watch(
    [user, initialized],
    async ([nextUser, isInitialized]) => {
      if (!isInitialized) return
      await refreshLocalStatus()
      if (nextUser?.id) {
        await refreshCloudStatus()
      } else {
        cloudSlots.value = []
        cloudStatusReady.value = true
      }
    },
    { immediate: true }
  )
</script>
