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
      :aria-label="t('accessibility.user_profile_menu')"
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
    SignInAlt,
    SignOutAlt,
    Upload,
    Sync,
    TrashAlt,
    Trash,
  } from '@vicons/fa'
  import { useDialog, useMessage, NIcon } from 'naive-ui'
  import type { DropdownOption } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'
  import { useTrackerSettings } from '~/composables/useTrackerSettings'
  import { useAuth } from '~/composables/useAuth'
  import { useDataSync } from '~/composables/useDataSync'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const dialog = useDialog()
  const message = useMessage()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const { clearData } = useIndexedDB()
  const { user, signOut } = useAuth()
  const { uploadData, syncData, clearCloudData } = useDataSync()
  const { resetToDefaults } = useTrackerSettings()

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const dropdownOptions = computed((): DropdownOption[] => {
    const options: DropdownOption[] = []

    // User info section
    if (user.value) {
      // Show username/email if logged in
      options.push({
        label: user.value.user_metadata?.name || user.value.email,
        key: 'uid',
        icon: renderIcon(User),
      })
    } else {
      // Show UID if not logged in but has UID, otherwise show guest
      const localUid = userStore.getUid || t('common.user_profile.guest')
      options.push({
        label: localUid,
        key: 'uid',
        icon: renderIcon(User),
      })
    }

    // Auth actions
    if (user.value) {
      options.push({
        label: t('common.user_profile.sign_out'),
        key: 'signout',
        icon: renderIcon(SignOutAlt),
      })

      // Sync options - only show when authenticated
      options.push({
        type: 'divider',
        key: 'sync-divider',
      })

      options.push({
        label: t('common.user_profile.upload_data'),
        key: 'upload',
        icon: renderIcon(Upload),
      })

      options.push({
        label: t('common.user_profile.sync_data'),
        key: 'sync',
        icon: renderIcon(Sync),
      })
    } else {
      options.push({
        label: t('common.user_profile.sign_in'),
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
        label: t('common.user_profile.clear_cloud_data'),
        key: 'clear-cloud',
        icon: renderIcon(TrashAlt),
      })
    }

    options.push({
      label: t('common.user_profile.clear_local_data'),
      key: 'clear',
      icon: renderIcon(Trash),
    })

    return options
  })

  const handleSelect = async (key: string): Promise<void> => {
    if (key === 'signin') {
      await navigateTo(`${localePath('/login')}`)
      return
    }

    if (key === 'signout') {
      try {
        await signOut()
        message.success(t('common.user_profile.sign_out_success'))
      } catch (error) {
        message.error(t('common.user_profile.sign_out_error'))
        console.error('Sign out error:', error)
      }
    }

    if (key === 'upload') {
      dialog.warning({
        title: t('common.user_profile.sync.confirm_upload.title'),
        content: t('common.user_profile.sync.confirm_upload.content'),
        positiveText: t('common.captions.confirm'),
        negativeText: t('common.captions.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.captions.loading'))

            // Check if data exists in IndexedDB
            const { loadData } = useIndexedDB()
            const existingData = await loadData()

            const hasLocalData =
              Object.keys(existingData.pulls).length > 0 ||
              Object.keys(existingData.edits).length > 0 ||
              Object.keys(existingData.evo).length > 0 ||
              Object.keys(existingData.pearpal).length > 0

            if (!hasLocalData) {
              // Load data from IndexedDB first
              const { loadData } = useIndexedDB()
              const { pulls, edits, evo, pearpal } = await loadData()

              // Process pearpal tracker data first if available
              if (Object.keys(pearpal).length > 0) {
                await pullStore.processPearpalData(pearpal)
              } else if (
                Object.keys(pulls).length > 0 ||
                Object.keys(edits).length > 0
              ) {
                // Process pull and edit data if no pearpal data
                await pullStore.processPullData(pulls, edits)
              }

              // Process evolution data
              if (Object.keys(evo).length > 0) {
                pullStore.evoData = evo
              }
            }

            const result = await uploadData()
            if (result.success) {
              message.success(t('common.user_profile.sync.upload_success'))
            } else {
              message.error(t('common.user_profile.sync.upload_error'))
            }
          } catch (error) {
            console.error('Upload error:', error)
            message.error(t('common.user_profile.sync.upload_error'))
          }
        },
      })
    }

    if (key === 'sync') {
      dialog.warning({
        title: t('common.user_profile.sync.confirm_sync.title'),
        content: t('common.user_profile.sync.confirm_sync.content'),
        positiveText: t('common.captions.confirm'),
        negativeText: t('common.captions.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.captions.loading'))
            const result = await syncData()
            if (result.success) {
              message.success(t('common.user_profile.sync.sync_success'))
            } else {
              message.error(t('common.user_profile.sync.sync_error'))
            }
          } catch (error) {
            console.error('Sync error:', error)
            message.error(t('common.user_profile.sync.sync_error'))
          }
        },
      })
    }

    if (key === 'clear-cloud') {
      dialog.warning({
        title: t('common.user_profile.clear_cloud_confirm.title'),
        content: t('common.user_profile.clear_cloud_confirm.content'),
        positiveText: t('common.captions.confirm'),
        negativeText: t('common.captions.cancel'),
        onPositiveClick: async () => {
          try {
            message.loading(t('common.captions.loading'))
            const result = await clearCloudData()
            if (result.success) {
              message.success(t('common.user_profile.clear_cloud_success'))
            } else {
              message.error(t('common.user_profile.clear_cloud_error'))
            }
          } catch (error) {
            console.error('Clear cloud data error:', error)
            message.error(t('common.user_profile.clear_cloud_error'))
          }
        },
      })
    }

    if (key === 'clear') {
      dialog.warning({
        title: t('common.user_profile.clear_local_confirm.title'),
        content: t('common.user_profile.clear_local_confirm.content'),
        positiveText: t('common.captions.confirm'),
        negativeText: t('common.captions.cancel'),
        onPositiveClick: async () => {
          await clearData()
          userStore.reset()
          pullStore.reset()
          resetToDefaults()
          message.success(t('common.user_profile.clear_success'))
        },
      })
    }
  }
</script>
