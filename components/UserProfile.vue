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
  import { User } from '@vicons/fa'
  import { useDialog, useMessage } from 'naive-ui'
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

  // Remove auth initialization from here since it's done in app.vue

  const dropdownOptions = computed((): DropdownOption[] => {
    const options: DropdownOption[] = []

    // User info section
    if (user.value) {
      options.push({
        label: t('common.user_profile.user_id', {
          uid:
            user.value.user_metadata?.custom_claims?.global_name ||
            user.value.email ||
            user.value.id.slice(0, 8),
        }),
        key: 'uid',
      })
    } else {
      options.push({
        label: t('common.user_profile.user_id', {
          uid: t('common.user_profile.guest'),
        }),
        key: 'uid',
      })
    }

    // Auth actions
    if (user.value) {
      options.push({
        label: t('common.user_profile.sign_out'),
        key: 'signout',
      })

      // Sync options - only show when authenticated
      options.push({
        type: 'divider',
        key: 'sync-divider',
      })

      options.push({
        label: t('common.user_profile.upload_data'),
        key: 'upload',
      })

      options.push({
        label: t('common.user_profile.sync_data'),
        key: 'sync',
      })
    } else {
      // options.push({
      //   label: t('common.user_profile.sign_in'),
      //   key: 'signin',
      // })
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
      })
    }

    options.push({
      label: t('common.user_profile.clear_local_data'),
      key: 'clear',
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

            // Check if local data is populated, if not load from IndexedDB first
            const hasLocalData =
              Object.keys(pullStore.rawPullData).length > 0 ||
              Object.keys(pullStore.rawEditData).length > 0 ||
              Object.keys(pullStore.rawEvoData).length > 0

            if (!hasLocalData) {
              // Load data from IndexedDB first
              const { loadData } = useIndexedDB()
              const { pulls, edits, evo } = await loadData()

              // Process the loaded data in the store
              await pullStore.processPullData(pulls, edits, evo)
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
          const { resetToDefaults } = useTrackerSettings()
          resetToDefaults()
          message.success(t('common.user_profile.clear_success'))
        },
      })
    }
  }
</script>
