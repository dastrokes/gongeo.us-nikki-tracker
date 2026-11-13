<script setup lang="ts">
  defineOptions({ inheritAttrs: false })
  const { t } = useI18n()
  const open = shallowRef(false)
  const descriptionId = useId()
</script>

<template>
  <n-tooltip
    :show="open"
    trigger="hover"
    @update:show="open = $event"
  >
    <template #trigger>
      <button
        v-bind="$attrs"
        type="button"
        aria-disabled="true"
        :aria-describedby="descriptionId"
        class="cursor-not-allowed text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:text-slate-400"
        @focus="open = true"
        @blur="open = false"
        @click="open = true"
        @keydown.esc="open = false"
      >
        <slot />
      </button>
    </template>
    {{ t('vote.rankingsUnavailable') }}
  </n-tooltip>
  <span
    :id="descriptionId"
    hidden
    >{{ t('vote.rankingsUnavailable') }}</span
  >
</template>
