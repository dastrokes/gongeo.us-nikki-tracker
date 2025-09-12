<template>
  <div class="min-h-screen flex items-center justify-center">
    <n-result
      size="huge"
      status="404"
      :title="t('error.defaultTitle')"
      :description="t('error.defaultMessage')"
      :sub-title="t('error.notFound')"
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
  const localePath = useLocalePath()
  const { t } = useI18n()

  const handleError = () => {
    navigateTo(localePath('/'))
  }
</script>
