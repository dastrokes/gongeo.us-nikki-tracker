<template>
  <n-tooltip
    v-if="visible"
    trigger="hover"
  >
    <template #trigger>
      <div
        class="inline-flex items-center justify-center"
        :class="[variantClass, badgeClass]"
        :aria-label="label"
      >
        <n-icon :size="variant === 'overlay' ? 13 : 12">
          <component :is="statusIcon" />
        </n-icon>
      </div>
    </template>
    {{ label }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import { CheckCircle, ExclamationCircle, TimesCircle } from '@vicons/fa'

  const props = withDefaults(
    defineProps<{
      status: WardrobeOutfitStatus | 'item-owned' | null
      owned?: number
      total?: number
      showMissing?: boolean
      variant?: 'inline' | 'overlay'
    }>(),
    {
      owned: 0,
      total: 0,
      showMissing: false,
      variant: 'inline',
    }
  )

  const { t } = useI18n()

  const visible = computed(() => {
    if (!props.status) return false
    if (props.status === 'missing') return props.showMissing
    return true
  })

  const badgeClass = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return props.variant === 'overlay'
        ? 'text-emerald-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
        : 'text-emerald-500 dark:text-emerald-300'
    }
    if (props.status === 'partial') {
      return props.variant === 'overlay'
        ? 'text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
        : 'text-amber-500 dark:text-amber-300'
    }
    return props.variant === 'overlay'
      ? 'text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
      : 'text-gray-400 dark:text-gray-300'
  })

  const variantClass = computed(() =>
    props.variant === 'overlay' ? 'h-5 w-5' : 'h-4 w-4'
  )

  const statusIcon = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return CheckCircle
    }
    if (props.status === 'partial') return ExclamationCircle
    return TimesCircle
  })

  const label = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return t('wardrobe.status.owned')
    }
    if (props.status === 'partial') {
      return t('wardrobe.status.progress', {
        owned: props.owned,
        total: props.total,
      })
    }
    return t('wardrobe.status.progress', {
      owned: props.owned,
      total: props.total,
    })
  })
</script>
