<template>
  <div class="min-h-screen flex items-center justify-center">
    <n-result
      size="huge"
      :status="error?.statusCode === 404 ? '404' : 'error'"
      :title="error?.statusCode?.toString() || t('error.defaultTitle')"
      :description="t('error.defaultMessage')"
      :sub-title="
        error?.statusCode === 404 ? t('error.notFound') : t('error.unexpected')
      "
    >
      <template #footer>
        <n-button
          round
          @click="handleError"
        >
          {{ t('error.returnHome') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app'

  defineProps<{
    error: NuxtError
  }>()

  const localePath = useLocalePath()
  const { t } = useI18n()

  const handleError = () => {
    clearError({ redirect: localePath('/') })
  }
</script>
