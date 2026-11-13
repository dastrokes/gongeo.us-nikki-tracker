<script setup lang="ts">
  import { InfoCircle } from '@vicons/fa'
  import {
    BANNER_VOTE_SEASONS,
    isBannerRankingAvailable,
    type BannerVoteSeasonId,
    type BannerVotePhase,
  } from '~~/shared/utils/bannerVoteSeasons'

  const {
    season,
    phase,
    view,
    personal,
    busy = false,
  } = defineProps<{
    season: BannerVoteSeasonId
    phase: BannerVotePhase
    view: 'ranking' | 'vote'
    personal: boolean
    busy?: boolean
  }>()
  const emit = defineEmits<{ 'update:personal': [value: boolean] }>()
  const helpOpen = shallowRef(false)
  watch(
    () => personal,
    () => {
      helpOpen.value = false
    }
  )
  const { t } = useI18n()
  const localePath = useLocalePath()
  const options = computed(() =>
    Object.values(BANNER_VOTE_SEASONS).map((entry) => ({
      value: entry.id,
      label: t(`version.${entry.version}`),
    }))
  )
  const changeSeason = (value: string) =>
    navigateTo(localePath(`/${view}/${value}`))
</script>

<template>
  <section
    class="space-y-5"
    :aria-label="t('vote.seasons.choose')"
  >
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="w-full text-2xl font-bold sm:w-auto sm:text-3xl">
        {{
          t('vote.seasons.title', {
            season: t(`version.${BANNER_VOTE_SEASONS[season].version}`),
          })
        }}
      </h1>
      <n-tag
        size="small"
        :bordered="false"
        :type="phase === 'open' ? 'success' : 'default'"
        >{{ t(`vote.seasons.${phase}`) }}</n-tag
      >
      <n-select
        :value="season"
        :options="options"
        :aria-label="t('vote.seasons.choose')"
        class="ml-auto w-40!"
        @update:value="changeSeason"
      />
    </div>
    <div
      class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-700"
    >
      <nav
        :aria-label="t('vote.navigation')"
        class="flex gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800"
      >
        <template
          v-for="page in ['vote', 'ranking'] as const"
          :key="page"
        >
          <BannerRankingUnavailable
            v-if="
              page === 'ranking' &&
              !personal &&
              !isBannerRankingAvailable(season)
            "
            class="rounded-full px-2 py-2 font-medium sm:px-5"
            >{{ t('vote.navigationRanking') }}</BannerRankingUnavailable
          >
          <NuxtLinkLocale
            v-else
            :to="`/${page}/${season}`"
            :aria-current="view === page ? 'page' : undefined"
            class="rounded-full px-2 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:px-5"
            :class="
              view === page
                ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-700 dark:text-rose-300'
                : 'text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300'
            "
            >{{
              t(
                page === 'vote'
                  ? 'vote.navigationVote'
                  : 'vote.navigationRanking'
              )
            }}</NuxtLinkLocale
          >
        </template>
      </nav>
      <div class="flex items-center gap-1">
        <n-radio-group
          :value="personal ? 'personal' : 'community'"
          :disabled="busy"
          :aria-label="t('vote.modeLabel')"
          @update:value="emit('update:personal', $event === 'personal')"
        >
          <n-radio-button
            value="community"
            :disabled="view === 'ranking' && !isBannerRankingAvailable(season)"
            >{{ t('vote.mode.community') }}</n-radio-button
          >
          <n-radio-button value="personal">{{
            t('vote.mode.personal')
          }}</n-radio-button>
        </n-radio-group>
        <n-tooltip
          :show="helpOpen"
          :width="280"
          trigger="hover"
          @update:show="helpOpen = $event"
        >
          <template #trigger>
            <n-button
              quaternary
              circle
              size="tiny"
              :aria-label="t('vote.info')"
              @focus="helpOpen = true"
              @blur="helpOpen = false"
              @click="helpOpen = true"
              @keydown.esc="helpOpen = false"
            >
              <template #icon
                ><n-icon><InfoCircle /></n-icon
              ></template>
            </n-button>
          </template>
          {{
            t(
              personal
                ? 'vote.mode.personalDesc'
                : phase === 'open'
                  ? 'vote.abuseNotice'
                  : 'vote.errors.votingClosed'
            )
          }}
        </n-tooltip>
      </div>
    </div>
  </section>
</template>
