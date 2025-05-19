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
          <user />
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import { User } from '@vicons/fa'
  import { useDialog } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'

  const { t } = useI18n()
  const dialog = useDialog()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const { clearPullData } = useIndexedDB()

  const dropdownOptions = computed(() => [
    {
      label: t('common.user_profile.user_id', {
        uid: userStore.uid || t('common.user_profile.guest'),
      }),
      key: 'uid',
      disabled: true,
    },
    {
      label: t('common.user_profile.clear_data'),
      key: 'clear',
    },
  ])

  const handleSelect = async (key: string) => {
    if (key === 'clear') {
      dialog.warning({
        title: t('common.user_profile.clear_confirm.title'),
        content: t('common.user_profile.clear_confirm.content'),
        positiveText: t('common.captions.confirm'),
        negativeText: t('common.captions.cancel'),
        onPositiveClick: async () => {
          await clearPullData()
          userStore.reset()
          pullStore.reset()
        },
      })
    }
  }
</script>
