<template>
  <div class="mx-auto max-w-5xl space-y-2 sm:space-y-3">
    <ShareStudioEntry v-if="!mode" />

    <template v-else>
      <div
        class="relative mb-3 flex min-h-11 items-center justify-center sm:mb-6 sm:justify-start sm:gap-3"
      >
        <n-button
          circle
          quaternary
          size="large"
          class="absolute left-0 sm:relative"
          :aria-label="t('creation_hub.back')"
          @click="backToCreationHub"
        >
          <template #icon
            ><n-icon><ArrowLeft /></n-icon
          ></template>
        </n-button>
        <div class="min-w-0 px-12 text-center sm:px-0 sm:text-left">
          <h1
            class="text-xl leading-tight font-bold text-slate-900 sm:text-3xl dark:text-slate-50"
          >
            {{ modeTitle }}
          </h1>
          <p
            class="mt-1 hidden max-w-2xl text-sm leading-6 text-slate-600 sm:block dark:text-slate-300"
          >
            {{ modeDescription }}
          </p>
        </div>
      </div>

      <ThemeCardStudio v-if="mode === 'themes'" />
      <BannerRankingStudio v-else />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ArrowLeft } from '@vicons/fa'

  type CreationMode = 'themes' | 'ranking'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const mode = computed<CreationMode | null>(() => {
    if (route.query.t) return 'themes'
    const value = route.query.mode?.toString()
    return value === 'themes' || value === 'ranking' ? value : null
  })
  const modeTitle = computed(() =>
    mode.value === 'themes'
      ? t('creation_hub.outfit_card.title')
      : t('creation_hub.banner_ranking.title')
  )
  const modeDescription = computed(() =>
    mode.value === 'themes'
      ? t('creation_hub.outfit_card.description')
      : t('creation_hub.banner_ranking.description')
  )

  const backToCreationHub = () => router.push({ query: {} })

  useSeoMeta({
    title: () =>
      `${mode.value ? modeTitle.value : t('navigation.creation_hub')} - ${t('navigation.title')}`,
    description: () => t('meta.description.creation_hub'),
    ogTitle: () =>
      `${mode.value ? modeTitle.value : t('navigation.creation_hub')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.creation_hub'),
    twitterTitle: () =>
      `${mode.value ? modeTitle.value : t('navigation.creation_hub')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.creation_hub'),
  })
</script>
