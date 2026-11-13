<script setup lang="ts">
  import { ArrowRight, Trophy } from '@vicons/fa'
  import { useIntervalFn, useNow } from '@vueuse/core'
  import {
    BANNER_VOTE_SEASONS,
    LIVE_BANNER_VOTE_SEASON,
    getBannerVotePhase,
  } from '~~/shared/utils/bannerVoteSeasons'

  const { t } = useI18n()
  const season = BANNER_VOTE_SEASONS[LIVE_BANNER_VOTE_SEASON]
  const { getImageSrc } = imageProvider()
  const previews = season.bannerIds.slice(0, 2).map((id) => ({
    id,
    image: getImageSrc('banner', id),
  }))
  const now = useNow({
    scheduler: (callback) => useIntervalFn(callback, 30000),
  })
  const phase = computed(() => getBannerVotePhase(season, now.value.getTime()))
  const mainPath = computed(() =>
    phase.value === 'open' ? '/vote' : `/ranking/${LIVE_BANNER_VOTE_SEASON}`
  )
  const rankingLabel = computed(() =>
    t(phase.value === 'closed' ? 'vote.event.results' : 'vote.viewRankings')
  )
</script>

<template>
  <section
    v-if="!season.archived"
    aria-labelledby="landing-banner-vote-title"
    class="mx-auto w-full max-w-4xl rounded-2xl border border-[#DDD2E8] bg-[#F5F0FA] p-4 sm:px-6 sm:py-5 dark:border-[#3A3858] dark:bg-[#1E2035]"
  >
    <div
      class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6"
    >
      <div
        aria-hidden="true"
        class="relative aspect-3/1 w-40 sm:row-span-2 sm:aspect-4/1 sm:w-64 lg:row-span-1 lg:w-72"
      >
        <div
          class="absolute inset-0 grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg bg-[#DDD2E8] dark:bg-[#3A3858]"
        >
          <NuxtImg
            v-for="preview in previews"
            :key="preview.id"
            :src="preview.image"
            :style="getBannerFocalPointStyle(preview.id)"
            alt=""
            preset="bannerThumb"
            sizes="100px sm:200px"
            width="200"
            height="100"
            loading="lazy"
            class="h-full w-full min-w-0 object-cover"
          />
        </div>
        <span
          class="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#F5F0FA] bg-white text-xs font-bold text-rose-600 italic shadow-sm sm:h-8 sm:w-8 dark:border-[#1E2035] dark:bg-[#24263D] dark:text-rose-300"
        >
          {{ t('vote.versus') }}
        </span>
      </div>
      <div class="min-w-0">
        <span
          class="mb-2 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-300"
        >
          <n-icon
            :size="12"
            aria-hidden="true"
            ><Trophy
          /></n-icon>
          {{ t('vote.mode.community') }}
        </span>
        <h2
          id="landing-banner-vote-title"
          class="text-xl leading-snug font-semibold text-slate-900 dark:text-slate-100"
        >
          {{
            t('vote.seasons.title', {
              season: t(`version.${season.version}`),
            })
          }}
        </h2>
      </div>
      <div
        class="col-span-2 flex flex-wrap items-center gap-3 text-sm sm:col-span-1 sm:col-start-2 lg:col-start-3 lg:gap-4"
      >
        <NuxtLinkLocale
          no-prefetch
          :to="mainPath"
          class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white shadow-[0_4px_12px_rgb(244_63_94/0.12)] transition-colors hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:flex-none"
        >
          {{ phase === 'open' ? t('vote.event.vote') : rankingLabel }}
          <n-icon
            :size="12"
            aria-hidden="true"
            ><ArrowRight
          /></n-icon>
        </NuxtLinkLocale>
        <NuxtLinkLocale
          v-if="phase === 'open'"
          no-prefetch
          to="/ranking"
          class="inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-2 font-medium text-slate-600 underline-offset-4 transition-colors hover:text-rose-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:flex-none dark:text-slate-300 dark:hover:text-rose-300"
          >{{ t('vote.viewRankings') }}</NuxtLinkLocale
        >
      </div>
    </div>
  </section>
</template>
