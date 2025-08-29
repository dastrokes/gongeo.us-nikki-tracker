<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center mb-12">
        <n-h1 class="font-bold mb-4">{{ t('about.title') }}</n-h1>
      </div>

      <div>
        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">
            {{ t('about.infinityNikkiAssets.title') }}
          </n-h2>
          <p>
            {{ t('about.infinityNikkiAssets.content') }}
          </p>
          <p class="mt-4">
            {{ t('about.infinityNikkiAssets.acknowledgment') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">
            {{ t('about.dataAndStats.title') }}
          </n-h2>
          <p>
            {{ t('about.dataAndStats.content') }}
          </p>
          <p class="mt-4">
            {{ t('about.dataAndStats.insights') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">{{
            t('about.intellectualProperty.title')
          }}</n-h2>
          <p>
            {{ t('about.intellectualProperty.content') }}
          </p>
          <p class="mt-4">
            {{ t('about.intellectualProperty.siteContent') }}
          </p>
          <p class="mt-4">
            {{ t('about.intellectualProperty.usage') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">{{
            t('about.dataCollection.title')
          }}</n-h2>
          <p>{{ t('about.dataCollection.content') }}</p>
          <p class="mt-4">{{ t('about.dataCollection.pullHistory') }}</p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">{{
            t('about.accountSecurity.title')
          }}</n-h2>
          <p>{{ t('about.accountSecurity.content') }}</p>
          <p class="mt-4">{{ t('about.accountSecurity.security') }}</p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">{{
            t('about.analytics.title')
          }}</n-h2>
          <p>
            {{ t('about.analytics.content') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="font-semibold mb-4">{{
            t('about.errorMonitoring.title')
          }}</n-h2>
          <p>
            {{ t('about.errorMonitoring.message') }}
          </p>
        </section>

        <SocialLinks />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { cardStyle } = useCardStyle()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl

  useHead({
    title: t('navigation.about') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.about'),
      },
      {
        property: 'og:title',
        content: t('navigation.about') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.about'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.about') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.about'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/about')}` }],
  })
</script>
