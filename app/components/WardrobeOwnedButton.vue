<template>
  <div
    class="inline-flex items-center"
    :class="variant === 'overlay' ? 'gap-1' : 'gap-0.5'"
  >
    <n-tooltip :show-arrow="false">
      <template #trigger>
        <n-button
          :circle="variant === 'overlay'"
          size="small"
          quaternary
          :bordered="false"
          :disabled="disabled"
          :loading="loading"
          class="border transition-all duration-150"
          :class="[
            variant === 'overlay'
              ? 'h-7 w-7 shadow-sm backdrop-blur-md hover:-translate-y-px hover:shadow-md'
              : 'h-6 rounded-full px-1.5 text-xs font-medium',
          ]"
          :style="buttonStyle"
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

    <n-dropdown
      v-if="menuOptions.length > 0"
      trigger="click"
      :options="menuOptions"
      :disabled="disabled || loading"
      @select="handleMenuSelect"
    >
      <n-button
        :circle="variant === 'overlay'"
        size="small"
        quaternary
        :bordered="false"
        :disabled="disabled || loading"
        class="border transition-all duration-150"
        :class="[
          variant === 'overlay'
            ? 'h-7 w-7 shadow-sm backdrop-blur-md hover:-translate-y-px hover:shadow-md'
            : 'h-6 rounded-full px-1.5 text-xs font-medium',
        ]"
        :style="menuButtonStyle"
        :aria-label="t('wardrobe.actions.more_mark_options')"
        @click.stop
      >
        <template #icon>
          <n-icon :size="12">
            <EllipsisH />
          </n-icon>
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>

<script setup lang="ts">
  import { CheckCircle, EllipsisH, Plus } from '@vicons/fa'
  import type { DropdownOption } from 'naive-ui'

  export type WardrobeOwnedButtonMenuOption = DropdownOption & {
    key: string
  }

  const props = withDefaults(
    defineProps<{
      owned: boolean
      disabled?: boolean
      loading?: boolean
      variant?: 'inline' | 'overlay'
      activeLabel?: string
      inactiveLabel?: string
      quality?: number
      menuOptions?: WardrobeOwnedButtonMenuOption[]
    }>(),
    {
      variant: 'inline',
      activeLabel: undefined,
      inactiveLabel: undefined,
      quality: undefined,
      menuOptions: () => [],
    }
  )

  const emit = defineEmits<{
    (e: 'toggle'): void
    (e: 'menu-select', key: string): void
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

  const buttonStyle = computed(() => {
    if (props.owned && props.quality !== undefined) {
      const color = getQualityColor(props.quality)
      if (props.variant === 'overlay') {
        return {
          borderColor: `${color}b3`,
          backgroundColor: `${color}e6`,
          color: '#ffffff',
        }
      }
      return {
        borderColor: `${color}40`,
        backgroundColor: `${color}1a`,
        color,
      }
    }

    // fallback fixed colors
    if (props.owned) {
      return props.variant === 'overlay'
        ? {
            borderColor: 'rgb(110 231 183 / 0.7)',
            backgroundColor: 'rgb(16 185 129 / 0.9)',
            color: '#ffffff',
          }
        : {
            borderColor: 'rgb(167 243 208 / 0.8)',
            backgroundColor: 'rgb(236 253 245 / 0.8)',
            color: 'rgb(4 120 87)',
          }
    }

    return props.variant === 'overlay'
      ? {
          borderColor: 'rgba(255,255,255,0.7)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          color: 'rgb(55 65 81)',
        }
      : {
          borderColor: 'rgb(229 231 235)',
          backgroundColor: 'rgb(249 250 251 / 0.7)',
          color: 'rgb(75 85 99)',
        }
  })

  const menuButtonStyle = computed(() => ({
    ...buttonStyle.value,
    opacity: props.owned ? 0.95 : 0.9,
  }))

  const handleMenuSelect = (key: string | number) => {
    emit('menu-select', String(key))
  }
</script>
