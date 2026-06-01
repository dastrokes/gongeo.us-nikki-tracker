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
        <span
          v-if="hasEvoLevel"
          class="flex flex-col items-center gap-px"
        >
          <n-icon :size="13">
            <component :is="evoStatusIcon" />
          </n-icon>
          <span
            v-if="maxEvoLevel === 1"
            class="h-1 w-2.5 rounded-full bg-current"
          />
          <span
            v-else
            class="flex items-center gap-px"
          >
            <span
              v-for="level in maxEvoLevel"
              :key="`badge-evo-${level}`"
              class="h-1 w-1 rounded-full"
              :class="
                level <= normalizedEvoLevel ? 'bg-current' : 'bg-current/30'
              "
            />
          </span>
        </span>
        <n-icon
          v-else
          :size="13"
        >
          <component :is="statusIcon" />
        </n-icon>
      </div>
    </template>
    {{ label }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import {
    CheckCircle,
    ArrowAltCircleUp,
    Adjust,
    TimesCircle,
  } from '@vicons/fa'

  const props = withDefaults(
    defineProps<{
      status:
        | WardrobeOutfitStatus
        | 'item-owned'
        | 'glowup-owned'
        | 'evo-owned'
        | null
      owned?: number
      total?: number
      showMissing?: boolean
      quality?: number
      evoLevel?: number | null
      glowUpOwned?: boolean
    }>(),
    {
      owned: 0,
      total: 0,
      showMissing: false,
      quality: undefined,
      evoLevel: null,
      glowUpOwned: false,
    }
  )

  const { t } = useI18n()

  const maxEvoLevel = computed(() => (props.quality === 4 ? 1 : 3))
  const normalizedEvoLevel = computed(() =>
    props.status === 'evo-owned'
      ? Math.min(Math.max(props.evoLevel ?? 0, 0), maxEvoLevel.value)
      : 0
  )
  const hasEvoLevel = computed(() => normalizedEvoLevel.value > 0)

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
    if (
      props.status === 'owned' ||
      props.status === 'item-owned' ||
      props.status === 'glowup-owned' ||
      props.status === 'evo-owned'
    ) {
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
    if (
      props.status === 'owned' ||
      props.status === 'item-owned' ||
      props.status === 'evo-owned'
    ) {
      return CheckCircle
    }
    if (props.status === 'glowup-owned') return ArrowAltCircleUp
    if (props.status === 'partial') return Adjust
    return TimesCircle
  })
  const evoStatusIcon = computed(() =>
    props.glowUpOwned ? ArrowAltCircleUp : CheckCircle
  )

  const label = computed(() => {
    if (props.status === 'owned' || props.status === 'item-owned') {
      return t('wardrobe.status.owned')
    }
    if (props.status === 'glowup-owned') {
      return t('wardrobe.status.glowup_owned')
    }
    if (props.status === 'evo-owned') {
      const evoLabel = props.evoLevel
        ? t('wardrobe.status.evo_level_owned', {
            level: normalizedEvoLevel.value,
          })
        : t('wardrobe.status.owned')
      return props.glowUpOwned
        ? `${evoLabel} / ${t('wardrobe.status.glowup_owned')}`
        : evoLabel
    }
    if (props.status === 'partial') {
      return `${props.owned}/${props.total}`
    }
    return `${props.owned}/${props.total}`
  })
</script>
