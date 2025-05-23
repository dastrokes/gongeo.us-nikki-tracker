<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center mb-12">
        <n-h1 class="font-bold mb-4">{{ t('faq.title') }}</n-h1>
      </div>

      <div class="space-y-6">
        <n-collapse arrow-placement="right">
          <n-collapse-item
            v-for="(faq, key) in faqs"
            :key="key"
            :title="t(`faq.questions.${key}.question`)"
            class="text-gray-600 dark:text-gray-300"
          >
            <div class="max-w-none text-sm">
              <p>{{ t(`faq.questions.${key}.answer`) }}</p>
            </div>
          </n-collapse-item>
        </n-collapse>

        <n-space justify="center">
          <n-button
            tag="a"
            href="https://discord.gg/qymsW3j4Zw"
            target="_blank"
          >
            <template #icon>
              <n-icon><Discord /></n-icon>
            </template>
            {{ t('common.discord') }}
          </n-button>
          <n-button
            tag="a"
            href="https://ko-fi.com/dastrokes"
            target="_blank"
          >
            <template #icon>
              <n-icon>
                <KoFi />
              </n-icon>
            </template>
            {{ t('common.ko_fi') }}
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord } from '@vicons/fa'
  import { useCardStyle } from '~/composables/useCardStyle'
  import KoFi from '~/components/icons/KoFi.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl

  useHead({
    title: t('navigation.faq') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.faq'),
      },
      {
        property: 'og:title',
        content: t('navigation.faq') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.tracker'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/faq')}` }],
  })

  const faqs = {
    data_source: {},
    ban_risk: {},
    data_storage: {},
    server_data: {},
    platform_support: {},
    cookie_script: {},
    no_pulls: {},
    auto_update: {},
    export: {},
  }

  const { cardStyle } = useCardStyle()
</script>
