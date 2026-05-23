<template>
  <n-tooltip
    v-if="visible"
    trigger="hover"
    :show-arrow="false"
  >
    <template #trigger>
      <div
        class="inline-flex h-5 w-5 items-center justify-center"
        :style="iconStyle"
        :aria-label="label"
      >
        <n-icon :size="13">
          <component :is="statusIcon" />
        </n-icon>
      </div>
    </template>
    {{ label }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import { CheckCircle, Adjust, TimesCircle } from '@vicons/fa'

  const props = withDefaults(
    defineProps<{
      status: WardrobeOutfitStatus | 'item-owned' | null
      owned?: number
      total?: number
      showMissing?: boolean
      quality?: number
    }>(),
    {
      owned: 0,
      total: 0,
      showMissing: false,
      quality: undefined,
    }
  )

  const { t } = useI18n()

  const visible = computed(() => {
    if (!props.status) return false
    if (props.status === 'missing') return props.showMissing
    return true
  })

  const iconStyle = computed(() => {
    if (props.quality !== undefined) {
      const color = getQualityColor(props.quality)
      return {
        color,
      }
    }

    // fallback: status-based fixed colors
    if (props.status === 'owned' || props.status === 'item-owned') {
      return {
        color: 'rgb(167 243 208)',
      }
    }
    if (props.status === 'partial') {
      return {
        color: 'rgb(253 230 138)',
      }
    }
    return {
      color: 'rgba(255,255,255,0.9)',
    }
  })

  const statusIcon = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return CheckCircle
    }
    if (props.status === 'partial') return Adjust
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
