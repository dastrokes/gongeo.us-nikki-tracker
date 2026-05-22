<template>
  <n-tooltip>
    <template #trigger>
      <n-button
        :circle="variant === 'overlay'"
        size="small"
        quaternary
        :disabled="disabled"
        :loading="loading"
        class="wardrobe-owned-button border transition-all duration-150"
        :class="[
          variant === 'overlay'
            ? 'h-7 w-7 shadow-sm backdrop-blur-md hover:-translate-y-px hover:shadow-md'
            : 'h-6 rounded-full px-1.5 text-xs font-medium',
          owned ? ownedClass : unownedClass,
        ]"
        :aria-label="actionLabel"
        @click.stop="$emit('toggle')"
      >
        <template #icon>
          <n-icon :size="owned ? 13 : 12">
            <CheckCircle v-if="owned" />
            <Plus v-else />
          </n-icon>
        </template>
        <span v-if="variant === 'inline'">
          {{ label }}
        </span>
      </n-button>
    </template>
    {{ actionLabel }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import { CheckCircle, Plus } from '@vicons/fa'

  const props = withDefaults(
    defineProps<{
      owned: boolean
      disabled?: boolean
      loading?: boolean
      variant?: 'inline' | 'overlay'
      activeLabel?: string
      inactiveLabel?: string
    }>(),
    {
      variant: 'inline',
      activeLabel: undefined,
      inactiveLabel: undefined,
    }
  )

  defineEmits<{
    (e: 'toggle'): void
  }>()

  const { t } = useI18n()

  const label = computed(() =>
    props.owned
      ? (props.activeLabel ?? t('wardrobe.status.owned'))
      : (props.inactiveLabel ?? t('wardrobe.status.missing'))
  )

  const actionLabel = computed(() =>
    props.owned
      ? t('wardrobe.actions.mark_unowned')
      : t('wardrobe.actions.mark_owned')
  )

  const ownedClass = computed(() =>
    props.variant === 'overlay'
      ? 'border-emerald-300/70 bg-emerald-500/90 text-white hover:bg-emerald-500 dark:border-emerald-400/50'
      : 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/80 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300'
  )

  const unownedClass = computed(() =>
    props.variant === 'overlay'
      ? 'border-white/70 bg-white/85 text-gray-700 hover:bg-white dark:border-white/15 dark:bg-gray-950/80 dark:text-gray-200'
      : 'border-gray-200 bg-gray-50/70 text-gray-600 hover:bg-gray-100/80 dark:border-gray-700 dark:bg-gray-950/50 dark:text-gray-300 dark:hover:bg-gray-900'
  )
</script>

<style scoped>
  .wardrobe-owned-button :deep(.n-button__border),
  .wardrobe-owned-button :deep(.n-button__state-border) {
    display: none;
  }
</style>
