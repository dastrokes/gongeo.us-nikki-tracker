<template>
  <n-select
    :value="version === 'all' ? null : version"
    size="small"
    class="w-48 max-w-full"
    :options="options"
    :disabled="disabled"
    :aria-label="t('banner.version')"
    :placeholder="t('compendium.filter_version')"
    :consistent-menu-width="false"
    clearable
    @update:value="version = $event ?? 'all'"
  />
</template>

<script setup lang="ts">
  const props = defineProps<{
    versions: readonly string[]
    disabled?: boolean
  }>()
  const version = defineModel<string>({ required: true })
  const { t } = useI18n()
  const options = computed(() => [
    { label: t('common.all'), value: 'all' },
    ...props.versions.map((value) => ({
      label: formatVersionFilterLabel(value, t),
      value,
    })),
  ])
</script>
