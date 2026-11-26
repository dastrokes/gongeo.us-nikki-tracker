<script setup lang="ts">
  import { ArrowRight } from '@vicons/fa'
  import { getBannerRankingArchive } from '~~/shared/data/bannerRankingArchives'
  import { rankBannerRankings } from '~~/shared/utils/bannerRankingSnapshot'
  import {
    BANNER_VOTE_SEASONS,
    type BannerVoteSeasonId,
  } from '~~/shared/utils/bannerVoteSeasons'

  const { seasonId } = defineProps<{ seasonId: BannerVoteSeasonId }>()
  const emit = defineEmits<{ personal: [] }>()
  const { t, n } = useI18n()
  const { getImageSrc } = imageProvider()
  const previewId = useId()
  const season = computed(() => BANNER_VOTE_SEASONS[seasonId])
  const podium = computed(() =>
    rankBannerRankings(getBannerRankingArchive(seasonId)?.rankings ?? [])
      .filter((row) => row.rank !== undefined)
      .slice(0, 3)
  )
  const samplePair = computed(() => {
    const bannerIds = season.value.bannerIds
    const otherBanners = bannerIds.filter(
      (id) => !podium.value.some((banner) => banner.banner_id === id)
    )
    return (otherBanners.length >= 2 ? otherBanners : bannerIds).slice(0, 2)
  })
  const rankColors = [
    'bg-amber-300 text-amber-950',
    'bg-slate-200 text-slate-900',
    'bg-orange-200 text-orange-950',
  ]
  const previewCardClass =
    'group flex min-w-0 flex-col gap-4 rounded-2xl border border-[#DDD2E8] bg-[#F5F0FA] p-4 text-start transition-colors hover:border-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:p-5 motion-reduce:transition-none dark:border-[#3A3858] dark:bg-[#1E2035] dark:hover:border-rose-400/60'
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <NuxtLinkLocale
      :to="`/ranking/${seasonId}`"
      :aria-labelledby="`${previewId}-ranking`"
      :class="previewCardClass"
    >
      <ol
        v-if="podium.length"
        role="list"
        class="grid grid-cols-3 gap-2 sm:gap-3"
      >
        <li
          v-for="(banner, index) in podium"
          :key="banner.banner_id"
          class="min-w-0"
        >
          <div class="relative">
            <NuxtImg
              :src="getImageSrc('banner', banner.banner_id)"
              :style="getBannerFocalPointStyle(banner.banner_id)"
              alt=""
              preset="bannerThumb"
              sizes="100px sm:200px"
              width="200"
              height="100"
              class="aspect-3/2 w-full rounded-lg object-cover"
            />
            <span
              class="absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums shadow-sm sm:top-2 sm:left-2 sm:px-2"
              :class="rankColors[index]"
              >#{{ banner.rank }}</span
            >
          </div>
          <p
            class="mt-2 text-xs leading-snug font-semibold wrap-anywhere sm:text-sm"
          >
            {{ t(`banner.${banner.banner_id}.name`) }}
          </p>
          <p
            class="mt-0.5 text-xs text-slate-600 tabular-nums dark:text-slate-300"
          >
            <span class="sr-only">{{ t('vote.rankings.winRate') }} </span>
            {{
              n(banner.win_rate ?? 0, {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })
            }}
          </p>
        </li>
      </ol>
      <span
        :id="`${previewId}-ranking`"
        class="mt-auto flex min-h-10 items-center justify-between gap-3 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-rose-600 motion-reduce:transition-none"
      >
        {{ t(season.archived ? 'vote.event.results' : 'vote.viewRankings') }}
        <n-icon
          :size="14"
          aria-hidden="true"
          class="shrink-0"
          ><ArrowRight
        /></n-icon>
      </span>
    </NuxtLinkLocale>

    <button
      type="button"
      :aria-labelledby="`${previewId}-personal`"
      :aria-describedby="
        samplePair.length === 2
          ? `${previewId}-left ${previewId}-versus ${previewId}-right`
          : undefined
      "
      :class="previewCardClass"
      class="cursor-pointer"
      @click="emit('personal')"
    >
      <span
        v-if="samplePair.length === 2"
        class="block"
      >
        <span class="relative grid grid-cols-2 gap-2 sm:gap-3">
          <NuxtImg
            v-for="id in samplePair"
            :key="id"
            :src="getImageSrc('banner', id)"
            :style="getBannerFocalPointStyle(id)"
            alt=""
            preset="bannerHero"
            sizes="300px"
            width="600"
            height="300"
            class="aspect-9/4 w-full rounded-lg object-cover"
          />
          <span
            :id="`${previewId}-versus`"
            class="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#F5F0FA] bg-white text-xs font-bold text-rose-600 italic shadow-sm sm:size-10 sm:text-sm dark:border-[#1E2035] dark:bg-[#24263D] dark:text-rose-300"
            >{{ t('vote.versus') }}</span
          >
        </span>
        <span class="mt-2 grid grid-cols-2 gap-2 text-center sm:gap-3">
          <span
            v-for="(id, index) in samplePair"
            :id="`${previewId}-${index === 0 ? 'left' : 'right'}`"
            :key="id"
            class="min-w-0 text-xs leading-snug font-semibold wrap-anywhere sm:text-sm"
            >{{ t(`banner.${id}.name`) }}</span
          >
        </span>
      </span>
      <span
        :id="`${previewId}-personal`"
        class="mt-auto flex min-h-10 items-center justify-between gap-3 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors group-hover:bg-rose-50 motion-reduce:transition-none dark:border-rose-400/30 dark:bg-[#24263D] dark:text-rose-200 dark:group-hover:bg-rose-400/10"
      >
        {{ t('vote.usePersonal') }}
        <n-icon
          :size="14"
          aria-hidden="true"
          class="shrink-0"
          ><ArrowRight
        /></n-icon>
      </span>
    </button>
  </div>
</template>
