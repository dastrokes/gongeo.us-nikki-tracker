<script setup lang="ts">
  import { CalendarDay, CheckCircle } from '@vicons/fa'
  import { isBannerVoteSeason } from '~~/shared/utils/bannerVoteSeasons'

  definePageMeta({
    key: (route) => route.path,
    validate: (route) =>
      route.params.season === undefined ||
      isBannerVoteSeason(route.params.season),
  })
  const { id: seasonId, season, phase } = useBannerVoteSeason()
  const { t } = useI18n()
  const { getVotePair, submitVote, refreshFailed } = useBannerVote(seasonId)
  const { getPersonalVotePair, submitPersonalVote } = usePersonalVote(seasonId)
  const { isPersonalMode, setMode } = useVotingMode(seasonId)
  const message = useMessage()
  const loading = shallowRef(false)
  const submitting = shallowRef(false)
  const loadFailed = shallowRef(false)
  const unavailable = shallowRef(false)
  const currentPair = shallowRef<VotePair | null>(null)
  const selectedBanner = shallowRef<number | null>(null)
  // Keep the payload and UUID after a network failure, so Retry is idempotent.
  const pendingVote = shallowRef<{ id: string; winner: number } | null>(null)
  const displayPhase = computed(() =>
    unavailable.value && phase.value === 'open' ? 'paused' : phase.value
  )
  const canVote = computed(
    () => isPersonalMode.value || displayPhase.value === 'open'
  )
  const pairBanners = computed(() =>
    currentPair.value
      ? [currentPair.value.banner1, currentPair.value.banner2]
      : []
  )
  let loadVersion = 0

  const loadPair = async () => {
    const version = ++loadVersion
    selectedBanner.value = null
    pendingVote.value = null
    loadFailed.value = false
    currentPair.value = null
    if (!canVote.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const pair = isPersonalMode.value
        ? getPersonalVotePair()
        : await getVotePair()
      if (version === loadVersion) currentPair.value = pair
    } catch {
      if (version === loadVersion) loadFailed.value = true
    } finally {
      if (version === loadVersion) loading.value = false
    }
  }

  const selectBanner = (id: number) => {
    if (!submitting.value && !loading.value && !pendingVote.value)
      selectedBanner.value = id
  }

  const handleVote = async () => {
    if (
      !currentPair.value ||
      selectedBanner.value === null ||
      submitting.value ||
      loading.value ||
      !canVote.value
    )
      return
    const { banner1, banner2 } = currentPair.value
    submitting.value = true
    try {
      if (isPersonalMode.value) {
        submitPersonalVote(banner1.id, banner2.id, selectedBanner.value)
      } else {
        pendingVote.value ??= {
          id: crypto.randomUUID(),
          winner: selectedBanner.value,
        }
        await submitVote(
          banner1.id,
          banner2.id,
          pendingVote.value.winner,
          pendingVote.value.id
        )
      }
      message.success(t('vote.success'), { duration: 1500 })
      await loadPair()
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      if (code.includes('VOTING_CLOSED')) {
        unavailable.value = true
        message.warning(t('vote.errors.votingClosed'))
      } else if (code.includes('RATE_LIMIT')) {
        message.warning(t('vote.errors.rateLimit'))
      } else if (code.includes('FINGERPRINT_UNAVAILABLE')) {
        message.warning(t('vote.fingerprintUnavailable'))
      } else {
        message.error(t('vote.errors.submitFailed'))
      }
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    watch(
      [isPersonalMode, canVote],
      () => {
        void loadPair()
      },
      { immediate: true }
    )
  })
  onUnmounted(() => {
    loadVersion++
  })

  useSeoMeta({
    title: () =>
      `${t('vote.seasons.title', { season: t(`version.${season.version}`) })} - ${t('navigation.title')}`,
    description: () => t('vote.description'),
  })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 sm:px-0">
    <BannerVoteSeasonHeader
      :season="seasonId"
      :phase="displayPhase"
      view="vote"
      :personal="isPersonalMode"
      :busy="submitting"
      @update:personal="setMode"
    />
    <n-card
      size="small"
      class="rounded-2xl"
    >
      <n-alert
        v-if="!isPersonalMode && refreshFailed && currentPair && !loadFailed"
        type="warning"
        class="mb-4"
        >{{ t('vote.refreshFailed') }}</n-alert
      >
      <div
        v-if="loading"
        class="grid gap-4 md:grid-cols-2"
        role="status"
        :aria-label="t('common.loading')"
      >
        <n-skeleton
          v-for="index in 2"
          :key="index"
          class="aspect-2/1 h-auto! rounded-xl"
        />
      </div>
      <n-alert
        v-else-if="loadFailed"
        type="error"
      >
        <p class="mb-3">{{ t('vote.errors.loadFailed') }}</p>
        <n-button
          secondary
          @click="loadPair"
          >{{ t('vote.retry') }}</n-button
        >
      </n-alert>
      <n-alert
        v-else-if="!canVote"
        type="info"
      >
        <p class="mb-3">{{ t('vote.errors.votingClosed') }}</p>
        <n-button
          secondary
          @click="setMode(true)"
          >{{ t('vote.usePersonal') }}</n-button
        >
      </n-alert>
      <div
        v-else-if="currentPair && canVote"
        class="space-y-5"
      >
        <div class="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div
            v-for="banner in pairBanners"
            :key="banner.id"
          >
            <button
              type="button"
              :aria-pressed="selectedBanner === banner.id"
              :disabled="submitting || !!pendingVote"
              class="group relative block w-full cursor-pointer overflow-hidden rounded-xl transition-[scale,opacity,box-shadow] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 disabled:cursor-wait motion-reduce:transition-none"
              :class="
                selectedBanner === banner.id
                  ? 'shadow-xl ring-4 ring-sky-500/80 dark:ring-sky-400/80'
                  : selectedBanner !== null
                    ? 'opacity-60 ring-2 ring-transparent motion-safe:scale-[0.96] motion-safe:sm:scale-[0.95]'
                    : 'ring-2 ring-transparent enabled:hover:ring-slate-300 motion-safe:enabled:hover:scale-[1.01] dark:enabled:hover:ring-slate-600'
              "
              @click="selectBanner(banner.id)"
            >
              <NuxtImg
                :src="banner.image"
                :alt="t(`banner.${banner.id}.name`)"
                preset="bannerHero"
                fit="cover"
                loading="eager"
                sizes="300px sm:600px"
                class="aspect-2/1 w-full object-cover transition-transform duration-300 ease-out motion-reduce:transition-none"
                :class="{
                  'motion-safe:scale-105': selectedBanner === banner.id,
                }"
              />
              <span
                v-if="selectedBanner !== banner.id"
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 transition-colors duration-300 ease-out group-enabled:group-hover:bg-black/5 motion-reduce:transition-none dark:group-enabled:group-hover:bg-white/5"
              />
              <span
                v-if="selectedBanner === banner.id"
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span
                  class="flex items-center justify-center rounded-full bg-white p-2 shadow-xl ring-4 ring-white/50 dark:bg-slate-800 dark:ring-slate-700/50"
                >
                  <n-icon
                    :size="40"
                    class="block leading-none text-sky-500 dark:text-sky-400"
                    ><CheckCircle
                  /></n-icon>
                </span>
              </span>
            </button>
            <div class="mt-2 text-center sm:mt-3">
              <NuxtLinkLocale
                :to="getBannerDetailPath(banner.id)"
                target="_blank"
                :aria-label="
                  t('vote.bannerDetails', {
                    banner: t(`banner.${banner.id}.name`),
                  })
                "
                class="inline-flex items-center gap-1 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-rose-500"
              >
                <n-icon
                  size="16"
                  aria-hidden="true"
                  class="shrink-0 text-gray-500 dark:text-gray-400"
                >
                  <CalendarDay />
                </n-icon>
                <n-text
                  strong
                  class="text-sm sm:text-base"
                  >{{ t(`banner.${banner.id}.name`) }}</n-text
                >
              </NuxtLinkLocale>
            </div>
          </div>
        </div>
        <div
          class="sticky bottom-3 z-10 mx-auto flex max-w-md gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:pt-1 md:shadow-none dark:border-slate-700 dark:bg-slate-900/95 dark:md:bg-transparent"
        >
          <n-button
            secondary
            size="large"
            class="flex-1"
            :disabled="submitting || loading"
            @click="loadPair"
            >{{ t('common.skip') }}</n-button
          >
          <n-button
            type="primary"
            size="large"
            class="flex-1"
            :disabled="selectedBanner === null || loading"
            :loading="submitting"
            @click="handleVote"
            >{{ t(pendingVote ? 'vote.retry' : 'vote.submit') }}</n-button
          >
        </div>
      </div>
    </n-card>
  </div>
</template>
