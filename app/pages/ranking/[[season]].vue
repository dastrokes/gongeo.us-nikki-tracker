<script setup lang="ts">
  import { CaretDown, CaretUp, Trophy } from '@vicons/fa'
  import type { DataTableColumns, DataTableThemeOverrides } from 'naive-ui'
  import { breakpointsTailwind } from '@vueuse/core'
  import { BANNER_DATA } from '~~/data/banners'
  import { isBannerVoteSeason } from '~~/shared/utils/bannerVoteSeasons'
  import type { BannerRankingSnapshot } from '~~/shared/types/vote'
  import { rankBannerRankings } from '~~/shared/utils/bannerRankingSnapshot'

  definePageMeta({
    key: (route) => route.path,
    validate: (route) =>
      route.params.season === undefined ||
      isBannerVoteSeason(route.params.season),
  })
  const { id: seasonId, season, phase } = useBannerVoteSeason()
  const { t, n } = useI18n()
  const { getImageSrc } = imageProvider()
  const localePath = useLocalePath()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isCompact = shallowRef(false)
  const { getRankings, snapshot, refreshFailed } = useBannerVote(seasonId)
  const { getPersonalRankings } = usePersonalVote(seasonId)
  const { isPersonalMode, setMode } = useVotingMode(seasonId)
  const loading = shallowRef(true)
  const loadFailed = shallowRef(false)
  const rankings = shallowRef<BannerRanking[]>([])
  const stats = shallowRef<VoteStats | null>(null)
  const lastUpdated = shallowRef<string | null>(null)
  let loadVersion = 0
  const tableTheme: DataTableThemeOverrides = {
    tdColor: 'transparent',
    thColor: 'transparent',
    tdColorHover: 'rgba(148, 163, 184, 0.08)',
    thColorHover: 'rgba(148, 163, 184, 0.08)',
    tdColorSorting: 'rgba(148, 163, 184, 0.04)',
    thColorSorting: 'rgba(148, 163, 184, 0.04)',
    borderColor: 'rgba(148, 163, 184, 0.16)',
  }

  const renderRankChange = (row: BannerRanking) => {
    const change = row.rank_change
    if (!change) return null
    const up = change > 0
    return h(
      'span',
      {
        class: `inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
          up
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`,
      },
      [
        h(
          resolveComponent('n-icon'),
          { size: 10 },
          { default: () => h(up ? CaretUp : CaretDown) }
        ),
        Math.abs(change),
      ]
    )
  }

  const renderBannerThumbnail = (bannerId: number) =>
    h(resolveComponent('NuxtImg'), {
      src: getImageSrc('bannerThumb', bannerId),
      alt: '',
      class:
        'aspect-2/1 w-full max-w-40 shrink-0 rounded-md object-cover min-[480px]:w-40 lg:w-36 xl:w-44 xl:max-w-44',
      preset: 'bannerThumb',
      sizes: '200px',
      width: 200,
      height: 100,
      loading: 'lazy',
    })

  // Compact table for phones and tablets.
  const mobileColumns: DataTableColumns<BannerRanking> = [
    {
      title: '#',
      key: 'rank',
      width: 40,
      align: 'center',
      render: (row) => {
        const rank = row.rank
        let icon = null
        let color = ''

        if (rank === 1) {
          icon = Trophy
          color = 'text-yellow-500'
        } else if (rank === 2) {
          icon = Trophy
          color = 'text-gray-400'
        } else if (rank === 3) {
          icon = Trophy
          color = 'text-amber-600'
        }

        return h('div', { class: 'flex flex-col items-center gap-0.5' }, [
          h(
            'span',
            { class: 'text-sm font-bold wrap-anywhere' },
            rank ?? t('vote.unranked')
          ),
          icon
            ? h(
                resolveComponent('n-icon'),
                { size: 14, class: color },
                { default: () => h(icon) }
              )
            : null,
          renderRankChange(row),
        ])
      },
      sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    },
    {
      title: t('common.banner'),
      key: 'banner',
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h(
          'div',
          {
            class:
              'flex min-w-0 flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-3',
          },
          [
            renderBannerThumbnail(row.banner_id),
            h('div', { class: 'min-w-0 space-y-1' }, [
              h(
                resolveComponent('NuxtLinkLocale'),
                {
                  to: getBannerDetailPath(row.banner_id),
                  class:
                    'text-sm font-medium wrap-anywhere hover:underline focus-visible:outline-2 focus-visible:outline-rose-500',
                },
                () => t(`banner.${row.banner_id}.name`)
              ),
              h('div', { class: 'flex flex-wrap gap-x-2 gap-y-0.5 text-xs' }, [
                h('span', { class: 'font-mono' }, [
                  h(
                    'span',
                    { class: 'text-gray-500 dark:text-gray-400' },
                    `${t('vote.rankings.winRateShort')}: `
                  ),
                  h(
                    'span',
                    { class: 'font-semibold' },
                    `${((row.win_rate ?? 0) * 100).toFixed(1)}%`
                  ),
                ]),
                isPersonalMode.value
                  ? h('span', { class: 'font-mono' }, [
                      h(
                        'span',
                        { class: 'text-gray-500 dark:text-gray-400' },
                        `${t('vote.rankings.eloShort')}: `
                      ),
                      h(
                        'span',
                        { class: 'font-semibold' },
                        Math.round(row.elo_rating)
                      ),
                    ])
                  : null,
              ]),
            ]),
          ]
        )
      },
      sorter: (a, b) => a.banner_id - b.banner_id,
    },
    {
      title: t('vote.rankings.winsLosses'),
      key: 'wins_losses',
      width: 88,
      render: (row) => {
        return h(
          'div',
          { class: 'flex flex-col items-end gap-1 text-xs tabular-nums' },
          [
            h(
              'span',
              { class: 'text-green-600 dark:text-green-400 font-semibold' },
              `${row.wins} ${t('vote.rankings.winsShort')}`
            ),
            h(
              'span',
              { class: 'text-red-600 dark:text-red-400 font-semibold' },
              `${row.losses} ${t('vote.rankings.lossesShort')}`
            ),
          ]
        )
      },
      sorter: (a, b) => b.wins - a.wins,
    },
  ]

  // Desktop columns - full view (computed to react to mode changes)
  const columns = computed<DataTableColumns<BannerRanking>>(() => [
    {
      title: t('vote.rankings.rank'),
      key: 'rank',
      width: 104,
      render: (row) => {
        const rank = row.rank
        let icon = null
        let color = ''

        if (rank === 1) {
          icon = Trophy
          color = 'text-yellow-500'
        } else if (rank === 2) {
          icon = Trophy
          color = 'text-gray-400'
        } else if (rank === 3) {
          icon = Trophy
          color = 'text-amber-600'
        }

        return h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'font-bold' }, rank ?? t('vote.unranked')),
          icon
            ? h(
                resolveComponent('n-icon'),
                { size: 20, class: color },
                { default: () => h(icon) }
              )
            : null,
          renderRankChange(row),
        ])
      },
      sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    },
    {
      title: t('common.banner'),
      key: 'banner',
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h('div', { class: 'flex min-w-0 items-center gap-4' }, [
          renderBannerThumbnail(row.banner_id),
          h(
            resolveComponent('NuxtLinkLocale'),
            {
              to: getBannerDetailPath(row.banner_id),
              class:
                'min-w-0 font-medium wrap-anywhere hover:underline focus-visible:outline-2 focus-visible:outline-rose-500',
            },
            () => t(`banner.${row.banner_id}.name`)
          ),
        ])
      },
      sorter: (a, b) => a.banner_id - b.banner_id,
    },
    {
      title: t('vote.rankings.winRate'),
      key: 'win_rate',
      width: 120,
      render: (row) => {
        const rate = ((row.win_rate ?? 0) * 100).toFixed(1)
        return h('span', { class: 'font-mono' }, `${rate}%`)
      },
      sorter: (a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0),
    },
    {
      title: t('vote.rankings.wins'),
      key: 'wins',
      width: 100,
      render: (row) => {
        return h(
          'span',
          { class: 'text-green-600 dark:text-green-400' },
          row.wins
        )
      },
      sorter: (a, b) => b.wins - a.wins,
    },
    {
      title: t('vote.rankings.losses'),
      key: 'losses',
      width: 100,
      render: (row) => {
        return h(
          'span',
          { class: 'text-red-600 dark:text-red-400' },
          row.losses
        )
      },
      sorter: (a, b) => b.losses - a.losses,
    },
    {
      title: t('common.stats.total_votes'),
      key: 'total_votes',
      width: 120,
      render: (row) => {
        return h('span', row.total_votes ?? 0)
      },
      sorter: (a, b) => (b.total_votes ?? 0) - (a.total_votes ?? 0),
    },
    ...(isPersonalMode.value
      ? [
          {
            title: t('vote.rankings.elo'),
            key: 'elo_rating',
            width: 120,
            render: (row: BannerRanking) => {
              return h(
                'span',
                { class: 'font-mono' },
                Math.round(row.elo_rating)
              )
            },
            sorter: (a: BannerRanking, b: BannerRanking) =>
              b.elo_rating - a.elo_rating,
          },
        ]
      : []),
  ])

  const rowProps = (row: BannerRanking) => ({
    style: 'cursor: pointer;',
    onClick: () => navigateTo(localePath(getBannerDetailPath(row.banner_id))),
  })

  const applyCommunityRankings = (data: BannerRankingSnapshot) => {
    const previousRanks = new Map(
      rankBannerRankings(data.previous_rankings ?? []).map((row) => [
        row.banner_id,
        row.rank,
      ])
    )
    rankings.value = rankBannerRankings(data.rankings).map((row) => {
      const previousRank = previousRanks.get(row.banner_id)
      return {
        ...row,
        rank_change:
          row.rank && previousRank ? previousRank - row.rank : undefined,
      }
    })
    stats.value = data.stats
    lastUpdated.value = data.updated_at
  }
  const loadRankings = async () => {
    const version = ++loadVersion
    const personal = isPersonalMode.value
    loading.value = true
    loadFailed.value = false
    try {
      if (personal) {
        const data = getPersonalRankings()
        rankings.value = data.rankings
        stats.value = data.stats
        lastUpdated.value = null
      } else {
        const data = await getRankings(true)
        if (version === loadVersion) applyCommunityRankings(data)
      }
    } catch {
      if (version !== loadVersion) return
      if (!personal && snapshot.value) applyCommunityRankings(snapshot.value)
      else loadFailed.value = true
    } finally {
      if (version === loadVersion) loading.value = false
    }
  }
  const intlLocale = useIntlLocale()
  const updatedAtLabel = computed(() =>
    lastUpdated.value
      ? new Date(lastUpdated.value).toLocaleString(intlLocale.value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
        })
      : null
  )
  onMounted(() => {
    const hasWideTable = breakpoints.greaterOrEqual('lg')
    watchEffect(() => {
      isCompact.value = !hasWideTable.value
    })
    watch(
      isPersonalMode,
      () => {
        rankings.value = []
        stats.value = null
        lastUpdated.value = null
        void loadRankings()
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
    description: () => t('vote.rankings.description'),
  })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 sm:px-0">
    <BannerVoteSeasonHeader
      :season="seasonId"
      :phase="phase"
      view="ranking"
      :personal="isPersonalMode"
      @update:personal="setMode"
    />
    <n-alert
      v-if="!isPersonalMode && refreshFailed && stats"
      type="warning"
      >{{ t('vote.refreshFailed') }}</n-alert
    >
    <n-alert
      v-if="loadFailed"
      type="error"
    >
      <p class="mb-3">{{ t('vote.errors.loadRankingsFailed') }}</p>
      <n-button
        secondary
        :loading="loading"
        @click="loadRankings"
        >{{ t('vote.retry') }}</n-button
      >
    </n-alert>
    <div
      v-if="stats"
      class="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <dl class="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt class="text-sm text-slate-600 dark:text-slate-300">
            {{
              t(
                isPersonalMode
                  ? 'common.stats.personal_votes'
                  : 'common.stats.total_votes'
              )
            }}
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ n(stats.totalVotes) }}
          </dd>
        </div>
        <div v-if="!isPersonalMode">
          <dt class="text-sm text-slate-600 dark:text-slate-300">
            {{ t('common.stats.total_voters') }}
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ n(stats.totalVoters) }}
          </dd>
        </div>
        <div v-if="!isPersonalMode">
          <dt class="text-sm text-slate-600 dark:text-slate-300">
            {{ t('common.stats.avg_votes') }}
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ stats.averageVotesPerVoter.toFixed(1) }}
          </dd>
        </div>
      </dl>
      <NuxtLinkLocale
        v-if="isPersonalMode || phase === 'open'"
        :to="`/vote/${seasonId}`"
        class="rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >{{ t('vote.rankings.voteMore') }}</NuxtLinkLocale
      >
    </div>
    <div
      v-if="loading && !stats"
      class="space-y-4"
      role="status"
      :aria-label="t('common.loading')"
    >
      <n-skeleton
        :height="100"
        class="rounded-2xl"
      />
      <n-skeleton
        v-for="index in 4"
        :key="index"
        :height="88"
        class="rounded-xl"
      />
    </div>
    <template v-else-if="stats">
      <p
        v-if="updatedAtLabel && !isPersonalMode"
        class="text-sm text-slate-600 dark:text-slate-300"
      >
        {{ t('vote.rankings.lastUpdated') }}: {{ updatedAtLabel }}
      </p>
      <n-card
        size="small"
        class="rounded-xl"
        :content-style="{ padding: isCompact ? '0 4px' : '0 12px' }"
      >
        <n-data-table
          :columns="isCompact ? mobileColumns : columns"
          :data="rankings"
          :loading="loading"
          :bordered="false"
          :row-props="rowProps"
          single-line
          :theme-overrides="tableTheme"
          :size="isCompact ? 'small' : 'medium'"
        />
      </n-card>
    </template>
  </div>
</template>
