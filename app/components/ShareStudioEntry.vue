<template>
  <div class="space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-2xl"
      content-class="p-4 sm:p-5"
    >
      <section aria-labelledby="create-title">
        <h1
          id="create-title"
          class="text-2xl leading-tight font-bold text-slate-900 dark:text-white"
        >
          {{ t('navigation.creation_hub') }}
        </h1>
        <p
          class="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300"
        >
          {{ t('creation_hub.description') }}
        </p>
      </section>
    </n-card>

    <div class="grid min-w-0 grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
      <NuxtLink
        :to="{ query: { mode: 'themes' } }"
        class="group block min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden"
      >
        <n-card
          size="small"
          class="h-full min-w-0 rounded-2xl transition-[border-color,box-shadow] duration-200 group-hover:border-rose-300 group-hover:shadow-[0_4px_16px_rgb(244_63_94/0.10)]"
          content-class="flex h-full flex-col p-4 sm:p-5"
        >
          <div class="flex min-h-[84px] items-start gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/60"
            >
              <n-icon size="18"><Tshirt /></n-icon>
            </span>
            <div class="min-w-0">
              <h2
                class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50"
              >
                {{ t('creation_hub.outfit_card.title') }}
              </h2>
              <p
                class="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300"
              >
                {{ t('creation_hub.outfit_card.description') }}
              </p>
            </div>
          </div>

          <div class="mx-auto mt-4 w-full max-w-[360px]">
            <ThemeCardPoster
              :prompts="previewPrompts"
              :selected-ids="previewOutfitIds"
              :outfits="previewOutfitsById"
            />
          </div>

          <div
            class="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-rose-500 dark:border-slate-700"
          >
            <span>{{ t('creation_hub.open') }}</span>
            <n-icon
              size="14"
              class="flex size-7 items-center justify-center rounded-full bg-rose-50 transition-colors group-hover:bg-rose-100 dark:bg-rose-950/40 dark:group-hover:bg-rose-950/70"
            >
              <ChevronRight />
            </n-icon>
          </div>
        </n-card>
      </NuxtLink>

      <NuxtLink
        :to="{ query: { mode: 'ranking' } }"
        class="group block min-w-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden"
      >
        <n-card
          size="small"
          class="h-full min-w-0 rounded-2xl transition-[border-color,box-shadow] duration-200 group-hover:border-rose-300 group-hover:shadow-[0_4px_16px_rgb(244_63_94/0.10)]"
          content-class="flex h-full flex-col p-4 sm:p-5"
        >
          <div class="flex min-h-[84px] items-start gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/60"
            >
              <n-icon size="18"><SortAmountDown /></n-icon>
            </span>
            <div class="min-w-0">
              <h2
                class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50"
              >
                {{ t('creation_hub.banner_ranking.title') }}
              </h2>
              <p
                class="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300"
              >
                {{ t('creation_hub.banner_ranking.description') }}
              </p>
            </div>
          </div>

          <div class="mx-auto mt-4 w-full max-w-[360px]">
            <BannerRankingPoster :banners="previewBanners" />
          </div>

          <div
            class="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-rose-500 dark:border-slate-700"
          >
            <span>{{ t('creation_hub.open') }}</span>
            <n-icon
              size="14"
              class="flex size-7 items-center justify-center rounded-full bg-rose-50 transition-colors group-hover:bg-rose-100 dark:bg-rose-950/40 dark:group-hover:bg-rose-950/70"
            >
              <ChevronRight />
            </n-icon>
          </div>
        </n-card>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ChevronRight, SortAmountDown, Tshirt } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'

  const { t, tm, rt } = useI18n()
  const { getImageSrc } = imageProvider()
  const catalog = useCatalogIndex()

  const newestLimitedBanners = Object.values(BANNER_DATA)
    .filter(
      (banner) =>
        (banner.bannerType === 2 || banner.bannerType === 3) &&
        banner.runs.length > 0
    )
    .sort((left, right) => {
      const releaseDifference = (right.runs[0]?.start ?? '').localeCompare(
        left.runs[0]?.start ?? ''
      )
      return releaseDifference || right.bannerId - left.bannerId
    })
  const newestFiveStarOutfitIds = newestLimitedBanners.flatMap((banner) =>
    banner.bannerType === 2 ? banner.outfit5StarId : []
  )
  const newestFourStarOutfitIds = newestLimitedBanners.flatMap(
    (banner) => banner.outfit4StarId
  )
  const newestCompanionOutfitIds = newestLimitedBanners.flatMap((banner) =>
    banner.bannerType === 2 ? banner.outfit4StarId : []
  )
  const newestLimitedOutfitIds = newestLimitedBanners.flatMap((banner) => [
    ...banner.outfit5StarId,
    ...banner.outfit4StarId,
  ])
  const createFallbackOutfitIds = () => {
    const selected: Array<string | number> = []
    const used = new Set<string>()
    const addNewest = (ids: Array<string | number>) => {
      const id = ids.find((candidate) => !used.has(String(candidate)))
      if (id == null) return
      used.add(String(id))
      selected.push(id)
    }

    addNewest(newestFiveStarOutfitIds)
    addNewest(newestFourStarOutfitIds)
    addNewest(newestCompanionOutfitIds)
    for (const id of newestLimitedOutfitIds) {
      if (selected.length >= 9) break
      if (used.has(String(id))) continue
      used.add(String(id))
      selected.push(id)
    }
    return selected
  }
  const fallbackOutfitIds = createFallbackOutfitIds()
  const previewOutfitIds = ref<Array<string | number>>([...fallbackOutfitIds])
  const outfitQualityById = computed(
    () =>
      new Map(
        (catalog.index.value?.outfits ?? []).map((outfit) => [
          String(outfit.id),
          outfit.quality,
        ])
      )
  )
  const previewOutfits = computed(() =>
    previewOutfitIds.value.map((id) => ({
      id,
      name: t(`outfit.${id}.name`),
      quality: outfitQualityById.value.get(String(id)),
    }))
  )
  const previewOutfitsById = computed(() =>
    Object.fromEntries(
      previewOutfits.value.map((outfit) => [String(outfit.id), outfit])
    )
  )

  const fallbackBanners = Object.values(BANNER_DATA)
    .filter((banner) => banner.bannerType !== 1 && banner.runs.length > 0)
    .sort((left, right) => right.bannerId - left.bannerId)
    .slice(0, 10)
  const previewBannerIds = ref(fallbackBanners.map((banner) => banner.bannerId))
  const previewBanners = computed(() =>
    previewBannerIds.value
      .map((id) => BANNER_DATA[id])
      .filter((banner) => banner && banner.bannerType !== 1)
      .map((banner) => ({
        bannerId: banner.bannerId,
        name: t(`banner.${banner.bannerId}.name`),
        image: getImageSrc('bannerThumb', banner.bannerId),
      }))
  )

  const previewPrompts = computed(() =>
    (tm('creation_hub.outfit_card.prompts') as string[]).map((prompt) =>
      rt(prompt)
    )
  )

  onMounted(async () => {
    try {
      const storedTheme = localStorage.getItem('gongeous-studio-theme')
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme) as {
          selections?: { default?: Array<string | number | null> }
        }
        const selected = parsed.selections?.default
        if (
          Array.isArray(selected) &&
          selected.length === 9 &&
          selected.every((id) => id != null)
        )
          previewOutfitIds.value = selected as Array<string | number>
      }
    } catch {
      previewOutfitIds.value = [...fallbackOutfitIds]
    }

    try {
      const storedRanking = localStorage.getItem('gongeous-studio-ranking')
      if (storedRanking) {
        const parsed = JSON.parse(storedRanking) as {
          limited?: { rankedIds?: number[] }
        }
        const ranked = parsed.limited?.rankedIds
        if (
          Array.isArray(ranked) &&
          ranked.length === 10 &&
          new Set(ranked).size === 10 &&
          ranked.every((id) => BANNER_DATA[id]?.bannerType !== 1)
        )
          previewBannerIds.value = ranked
      }
    } catch {
      previewBannerIds.value = fallbackBanners.map((banner) => banner.bannerId)
    }
    await catalog.load(['outfits'])
  })
</script>
