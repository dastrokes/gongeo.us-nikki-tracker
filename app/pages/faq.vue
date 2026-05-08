<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
    >
      <div class="mb-12 text-center">
        <n-h1 class="mb-4 font-bold">{{ $t('faq.title') }}</n-h1>
      </div>

      <div class="space-y-6">
        <n-collapse arrow-placement="right">
          <n-collapse-item
            v-for="(faq, key) in faqs"
            :key="key"
            :title="$t(`faq.questions.${key}.question`)"
          >
            <div class="text-sm">
              <p>{{ $t(`faq.questions.${key}.answer`) }}</p>
            </div>
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

  const faqs = {
    data_source: {},
    ban_risk: {},
    data_storage: {},
    server_data: {},
    platform_support: {},
    cookie_script: {},
    data_loss: {},
    no_pulls: {},
    auto_update: {},
    export: {},
  }
</script>
