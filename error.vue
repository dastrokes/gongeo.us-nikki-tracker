<template>
  <div class="min-h-screen flex items-center justify-center">
    <n-result
      class="w-full max-w-xs"
      size="small"
      status="404"
      :title="t('error.404')"
      :description="t('error.notFound')"
    >
      <template #icon>
        <NuxtImg
          src="/images/404.png"
          alt="404"
          class="w-2/3 h-2/3 object-cover"
          width="400"
          height="400"
          fit="cover"
          sizes="200px"
        />
      </template>
      <template #footer>
        <n-button
          round
          @click="handleError"
        >
          <template #icon>
            <n-icon>
              <Home />
            </n-icon>
          </template>
          {{ t('error.returnHome') }}
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  import type { Composer } from 'vue-i18n'
  import { Home } from '@vicons/fa'

  const localePath = useLocalePath()

  const getTranslation = (): ((key: string) => string) => {
    try {
      const { t } = useI18n()
      return t
    } catch {
      const i18n = useNuxtApp().$i18n as Composer | undefined
      return (key: string) => {
        try {
          return i18n?.t?.(key) || key
        } catch {
          return key
        }
      }
    }
  }

  const t = getTranslation()

  const handleError = () => {
    navigateTo(localePath('/'))
  }
</script>
