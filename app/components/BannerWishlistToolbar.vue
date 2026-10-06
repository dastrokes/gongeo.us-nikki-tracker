<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <n-button-group
        class="shrink-0"
        role="group"
        :aria-label="t('common.banners')"
      >
        <n-button
          size="small"
          :type="!value ? 'primary' : 'default'"
          :aria-pressed="!value"
          @click="value = false"
          >{{ t('banner.all_banners') }}</n-button
        >
        <n-button
          size="small"
          :type="value ? 'primary' : 'default'"
          :aria-pressed="value"
          :disabled="!ready"
          @click="value = true"
        >
          <span class="tabular-nums">{{
            ready ? t('wishlist.filter', { count }) : t('wishlist.title')
          }}</span>
        </n-button>
      </n-button-group>
      <div
        class="order-2 ml-auto flex flex-wrap items-center justify-end gap-2 lg:order-3 lg:ml-0"
      >
        <slot />
      </div>
      <div
        v-if="$slots.filters"
        class="order-3 w-full min-w-0 lg:order-2 lg:ml-auto lg:w-auto"
      >
        <slot name="filters" />
      </div>
    </div>
    <n-alert
      v-if="error"
      type="error"
      :title="t('wishlist.error')"
    >
      <n-button
        size="small"
        @click="init({ force: true })"
        >{{ t('common.retry') }}</n-button
      >
    </n-alert>
  </div>
</template>

<script setup lang="ts">
  const value = defineModel<boolean>('value', { required: true })
  const { t } = useI18n()
  const { count, ready, error, init } = useBannerWishlist()
</script>
