<template>
  <div
    class="inline-flex items-center"
    :class="variant === 'overlay' ? 'gap-1' : 'gap-0.5'"
  >
    <n-dropdown
      v-if="actionMenuOptions.length > 0"
      trigger="click"
      :options="actionMenuOptions"
      :disabled="disabled || loading"
      @select="handleMenuSelect"
    >
      <n-button
        size="small"
        quaternary
        :bordered="false"
        :disabled="disabled"
        :loading="loading"
        class="border transition-all duration-150"
        :class="[
          variant === 'overlay'
            ? 'h-7 w-7 rounded-full ring-1 ring-black/10 backdrop-blur-md dark:ring-white/10'
            : 'h-6 rounded-full px-2 text-xs font-medium',
        ]"
        :style="buttonStyle"
        :aria-label="actionLabel"
      >
        <template #icon>
          <n-icon :size="12">
            <Edit />
          </n-icon>
        </template>
        <span v-if="variant === 'inline'">
          {{ actionLabel }}
        </span>
      </n-button>
    </n-dropdown>

    <n-tooltip
      v-else
      :show-arrow="false"
    >
      <template #trigger>
        <n-button
          size="small"
          quaternary
          :bordered="false"
          :disabled="disabled"
          :loading="loading"
          class="border transition-all duration-150"
          :class="[
            variant === 'overlay'
              ? 'h-7 w-7 rounded-full ring-1 ring-black/10 backdrop-blur-md dark:ring-white/10'
              : 'h-6 rounded-full px-2 text-xs font-medium',
          ]"
          :style="buttonStyle"
          :aria-label="actionLabel"
          @click.stop="$emit('toggle')"
        >
          <template #icon>
            <n-icon :size="12">
              <Edit />
            </n-icon>
          </template>
          <span v-if="variant === 'inline'">
            {{ actionLabel }}
          </span>
        </n-button>
      </template>
      {{ actionLabel }}
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { Edit } from '@vicons/fa'
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
      evoLevel?: number | null
      menuOptions?: WardrobeOwnedButtonMenuOption[]
    }>(),
    {
      variant: 'inline',
      activeLabel: undefined,
      inactiveLabel: undefined,
      quality: undefined,
      evoLevel: null,
      menuOptions: () => [],
    }
  )

  const emit = defineEmits<{
    (e: 'toggle'): void
    (e: 'menu-select', key: string): void
  }>()

  const { t } = useI18n()

  const hasEvoLevel = computed(() => (props.evoLevel ?? 0) > 0)
  const effectiveOwned = computed(() => props.owned || hasEvoLevel.value)

  const actionLabel = computed(() =>
    effectiveOwned.value
      ? t('wardrobe.actions.mark_unowned')
      : t('wardrobe.actions.mark_owned')
  )

  const buttonStyle = computed(() =>
    props.variant === 'overlay'
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
  )

  const actionMenuOptions = computed<WardrobeOwnedButtonMenuOption[]>(() => [
    {
      key: 'toggle-ownership',
      label: actionLabel.value,
    },
    ...props.menuOptions,
  ])

  const handleMenuSelect = (key: string | number) => {
    if (key === 'toggle-ownership') {
      emit('toggle')
      return
    }
    emit('menu-select', String(key))
  }
</script>
