<template>
  <div class="mx-auto max-w-4xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-4 sm:p-6"
    >
      <div class="mb-8 text-center">
        <n-h1 class="mb-0 font-bold">{{ $t('faq.title') }}</n-h1>
      </div>

      <div class="space-y-6">
        <n-collapse arrow-placement="right">
          <n-collapse-item
            v-for="key in faqKeys"
            :key="key"
            :title="$t(`faq.questions.${key}.question`)"
          >
            <p class="text-sm leading-6">
              {{ $t(`faq.questions.${key}.answer`) }}
            </p>
          </n-collapse-item>
          <n-collapse-item title="gongeous?">
            <div class="text-sm">
              <GongeousCard />
            </div>
          </n-collapse-item>
        </n-collapse>

        <SocialLinks />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  useSeoMeta({
    title: () =>
      `${t('navigation.faq')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.faq'),
    ogTitle: () =>
      `${t('navigation.faq')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.faq'),
    twitterTitle: () =>
      `${t('navigation.faq')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.faq'),
  })

  const faqKeys = [
    'data_source',
    'platform_support',
    'cookie_script',
    'data_loss',
    'auto_update',
    'data_storage',
    'cloud_sync',
    'ban_risk',
    'server_data',
  ] as const
</script>
