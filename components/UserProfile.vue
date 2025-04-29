<template>
  <n-dropdown
    trigger="click"
    :options="dropdownOptions"
    @select="handleSelect"
  >
    <n-button
      text
      aria-label="User profile menu"
    >
      <template #icon>
        <n-icon size="20">
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

  const dialog = useDialog()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const { clearPullData } = useIndexedDB()

  const dropdownOptions = computed(() => [
    {
      label: `User ID: ${userStore.uid || 'Not Set'}`,
      key: 'uid',
      disabled: true,
    },
    {
      label: 'Clear Local Data',
      key: 'clear',
      props: {
        style: 'color: var(--n-item-text-color-error);',
      },
    },
  ])

  const handleSelect = async (key: string) => {
    if (key === 'clear') {
      dialog.warning({
        title: 'Clear Local Data',
        content:
          'Are you sure you want to clear all local data? This action cannot be undone.',
        positiveText: 'Yes',
        negativeText: 'No',
        onPositiveClick: async () => {
          await clearPullData()
          pullStore.reset()
          window.location.reload()
        },
      })
    }
  }
</script>
