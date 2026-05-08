<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
    >
      <div class="mb-12 text-center">
        <n-h1 class="mb-4 font-bold">{{ $t('about.title') }}</n-h1>
      </div>

      <div>
        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">
            {{ $t('about.infinityNikkiAssets.title') }}
          </n-h2>
          <p>
            {{ $t('about.infinityNikkiAssets.content') }}
          </p>
          <p class="mt-4">
            {{ $t('about.infinityNikkiAssets.acknowledgment') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">
            {{ $t('about.dataAndStats.title') }}
          </n-h2>
          <p>
            {{ $t('about.dataAndStats.content') }}
          </p>
          <p class="mt-4">
            {{ $t('about.dataAndStats.insights') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.intellectualProperty.title')
          }}</n-h2>
          <p>
            {{ $t('about.intellectualProperty.content') }}
          </p>
          <p class="mt-4">
            {{ $t('about.intellectualProperty.siteContent') }}
          </p>
          <p class="mt-4">
            {{ $t('about.intellectualProperty.usage') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.dataCollection.title')
          }}</n-h2>
          <p>{{ $t('about.dataCollection.content') }}</p>
          <p class="mt-4">{{ $t('about.dataCollection.pullHistory') }}</p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.accountSecurity.title')
          }}</n-h2>
          <p>{{ $t('about.accountSecurity.content') }}</p>
          <p class="mt-4">{{ $t('about.accountSecurity.security') }}</p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.advertising.title')
          }}</n-h2>
          <p>{{ $t('about.advertising.content') }}</p>
          <p class="mt-4">{{ $t('about.advertising.eeaNotice') }}</p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.analytics.title')
          }}</n-h2>
          <p>
            {{ $t('about.analytics.content') }}
          </p>
        </section>

        <section class="mb-8">
          <n-h2 class="mb-4 font-semibold">{{
            $t('about.errorMonitoring.title')
          }}</n-h2>
          <p>
            {{ $t('about.errorMonitoring.message') }}
          </p>
        </section>

        <SocialLinks />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  useSeoMeta({
    title: () =>
      `${t('navigation.about')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.about'),
    ogTitle: () =>
      `${t('navigation.about')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.about'),
    twitterTitle: () =>
      `${t('navigation.about')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.about'),
  })
</script>
