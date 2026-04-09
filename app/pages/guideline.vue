<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0"
      content-class="!p-4 sm:!p-5"
    >
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0 space-y-2">
          <h1 class="text-xl font-semibold leading-tight sm:text-2xl">
            {{ t('feedback.guidelines.page_title') }}
          </h1>
        </div>

        <NuxtLinkLocale
          :to="localePath('/feedback')"
          class="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
        >
          {{ t('feedback.back_to_queue') }}
        </NuxtLinkLocale>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0"
      content-class="!p-4 sm:!p-5"
    >
      <FeedbackGuidelinesPanel />
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const localePath = useLocalePath()

  useSeoMeta({
    title: () =>
      `${t('feedback.guidelines.page_title')} - ${t('navigation.title')}`,
    ogTitle: () =>
      `${t('feedback.guidelines.page_title')} - ${t('navigation.title')}`,
    twitterTitle: () =>
      `${t('feedback.guidelines.page_title')} - ${t('navigation.title')}`,
    description: () => t('feedback.guidelines.page_description'),
    ogDescription: () => t('feedback.guidelines.page_description'),
    twitterDescription: () => t('feedback.guidelines.page_description'),
  })
</script>
