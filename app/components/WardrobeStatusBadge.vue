<template>
  <n-tag
    v-if="visible"
    size="small"
    round
    :bordered="false"
    :type="tagType"
    class="shadow-sm"
  >
    <span class="flex items-center gap-1">
      <n-icon v-if="status === 'owned'">
        <CheckCircle />
      </n-icon>
      <span>{{ label }}</span>
    </span>
  </n-tag>
</template>

<script setup lang="ts">
  import { CheckCircle } from '@vicons/fa'

  const props = withDefaults(
    defineProps<{
      status: WardrobeOutfitStatus | 'item-owned' | null
      owned?: number
      total?: number
      showMissing?: boolean
    }>(),
    {
      owned: 0,
      total: 0,
      showMissing: false,
    }
  )

  const { t } = useI18n()

  const visible = computed(() => {
    if (!props.status) return false
    if (props.status === 'missing') return props.showMissing
    return true
  })

  const tagType = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return 'success'
    }
    if (props.status === 'partial') return 'warning'
    return 'default'
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
