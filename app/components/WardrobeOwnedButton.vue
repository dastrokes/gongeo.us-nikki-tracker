<template>
  <n-tooltip>
    <template #trigger>
      <n-button
        circle
        size="small"
        :type="owned ? 'primary' : 'default'"
        :disabled="disabled"
        :loading="loading"
        :aria-label="
          owned
            ? t('wardrobe.actions.mark_unowned')
            : t('wardrobe.actions.mark_owned')
        "
        @click.stop="$emit('toggle')"
      >
        <template #icon>
          <n-icon>
            <CheckCircle v-if="owned" />
            <Plus v-else />
          </n-icon>
        </template>
      </n-button>
    </template>
    {{ owned ? t('wardrobe.status.owned') : t('wardrobe.actions.mark_owned') }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import { CheckCircle, Plus } from '@vicons/fa'

  defineProps<{
    owned: boolean
    disabled?: boolean
    loading?: boolean
  }>()

  defineEmits<{
    (e: 'toggle'): void
  }>()

  const { t } = useI18n()
</script>
