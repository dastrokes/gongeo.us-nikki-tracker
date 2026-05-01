<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Stats -->
    <n-card
      v-if="stats"
      size="small"
      class="rounded-xl"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="grid grid-cols-3 gap-3 sm:flex-1 sm:gap-4">
            <div class="text-center sm:text-left">
              <div
                class="mb-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400"
              >
                {{
                  isPersonalMode
                    ? $t('common.stats.personal_votes')
                    : $t('common.stats.total_votes')
                }}
              </div>
              <div
                class="flex items-center justify-center gap-2 sm:justify-start"
              >
                <n-icon
                  :depth="3"
                  size="20"
                >
                  <Poll />
                </n-icon>
                <span class="text-md font-semibold tabular-nums sm:text-2xl">
                  <n-number-animation
                    :from="0"
                    :to="stats.totalVotes"
                    :duration="5000"
                  />
                </span>
              </div>
            </div>
            <div
              v-if="!isPersonalMode"
              class="text-center sm:text-left"
            >
              <div
                class="mb-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400"
              >
                {{ $t('common.stats.total_voters') }}
              </div>
              <div
                class="flex items-center justify-center gap-2 sm:justify-start"
              >
                <n-icon
                  :depth="3"
                  size="20"
                >
                  <Users />
                </n-icon>
                <span class="text-md font-semibold tabular-nums sm:text-2xl">
                  <n-number-animation
                    :from="0"
                    :to="stats.totalVoters"
                    :duration="3000"
                  />
                </span>
              </div>
            </div>
            <div
              v-if="!isPersonalMode"
              class="text-center sm:text-left"
            >
              <div
                class="mb-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400"
              >
                {{ $t('common.stats.avg_votes') }}
              </div>
              <div
                class="flex items-center justify-center gap-2 sm:justify-start"
              >
                <n-icon
                  :depth="3"
                  size="20"
                >
                  <ChartBar />
                </n-icon>
                <span class="text-md font-semibold tabular-nums sm:text-2xl">
                  <n-number-animation
                    :from="0"
                    :to="stats.totalVotes / stats.totalVoters"
                    :duration="1000"
                    :precision="1"
                  />
                </span>
              </div>
            </div>
          </div>
          <div
            class="flex flex-row justify-center gap-2 sm:flex-col sm:justify-start sm:self-start"
          >
            <div class="flex items-center justify-end gap-2">
              <n-tooltip
                :width="250"
                trigger="hover"
                placement="bottom"
              >
                <template #trigger>
                  <n-switch
                    :value="isPersonalMode"
                    @update:value="setMode"
                  >
                    <template #checked>
                      <n-icon><User /></n-icon>
                    </template>
                    <template #unchecked>
                      <n-icon><Users /></n-icon>
                    </template>
                  </n-switch>
                </template>
                <div class="max-w-xs">
                  <div class="mb-1 font-semibold">
                    {{
                      isPersonalMode
                        ? t('vote.mode.personal')
                        : t('vote.mode.community')
                    }}
                  </div>
                  <div>
                    {{
                      isPersonalMode
                        ? t('vote.mode.personalDesc')
                        : t('vote.mode.communityDesc')
                    }}
                  </div>
                </div>
              </n-tooltip>
              <n-tooltip
                v-if="!isPersonalMode"
                :width="250"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    text
                    size="small"
                  >
                    <template #icon>
                      <n-icon><CalendarAlt /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('vote.rankings.votingPeriod') }}:
                {{
                  new Date(2025, 10, 12).toLocaleDateString(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
                -
                {{
                  new Date(2025, 10, 25).toLocaleDateString(locale, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </n-tooltip>
              <n-tooltip
                v-if="lastUpdated && !isPersonalMode"
                :width="250"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    text
                    size="small"
                  >
                    <template #icon>
                      <n-icon><InfoCircle /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('vote.rankings.lastUpdated') }}:
                {{
                  lastUpdated.toLocaleString(locale, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }}
              </n-tooltip>
            </div>
            <n-button
              secondary
              size="small"
              @click="navigateToVote"
            >
              <template #icon>
                <n-icon><CheckSquare /></n-icon>
              </template>
              {{ t('vote.rankings.voteMore') }}
            </n-button>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Stats Skeleton -->
    <n-card
      v-if="!stats && rankingsLoading"
      size="small"
      class="rounded-xl"
    >
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="grid grid-cols-3 gap-3 sm:flex-1 sm:gap-4">
          <div
            v-for="i in 3"
            :key="i"
            class="space-y-1 text-center sm:text-left"
          >
            <div>
              <n-skeleton
                text
                :height="20"
                :width="64"
              />
            </div>
            <div>
              <n-skeleton
                text
                :height="24"
                :width="48"
              />
            </div>
          </div>
        </div>
        <div
          class="flex flex-row justify-center gap-2 sm:flex-col sm:justify-start sm:self-start"
        >
          <div class="flex items-center justify-end gap-2">
            <n-skeleton
              :width="60"
              :height="24"
              :sharp="false"
            />
            <n-skeleton
              circle
              :width="24"
              :height="24"
            />
          </div>
          <n-skeleton
            :width="100"
            :height="26"
            :sharp="false"
          />
        </div>
      </div>
    </n-card>

    <!-- Rankings Table - Responsive -->
    <n-card
      size="small"
      class="rounded-xl"
    >
      <n-data-table
        :columns="isMobile ? mobileColumns : columns"
        :data="rankings"
        :loading="rankingsLoading"
        :bordered="false"
        :row-props="rowProps"
        single-line
        class="cursor-pointer"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import {
    Poll,
    Trophy,
    Users,
    ChartBar,
    InfoCircle,
    CheckSquare,
    User,
    CalendarAlt,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import type { DataTableColumns } from 'naive-ui'
  import { breakpointsTailwind } from '@vueuse/core'

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const { getRankings } = useBannerVote()
  const { getPersonalRankings } = usePersonalVote()

  const rankingsLoading = ref(true)
  const rankings = ref<BannerRanking[]>([])
  const stats = ref<VoteStats | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Mode toggle state (community/personal) - using shared composable
  const { isPersonalMode, setMode: setVotingMode } = useVotingMode()

  // Wrapper to reload rankings when mode changes
  const setMode = (value: boolean) => {
    setVotingMode(value)
  }

  // Initialize breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = ref(false)

  onMounted(() => {
    watchEffect(() => {
      isMobile.value = !breakpoints.greater('sm').value
    })
  })

  // Mobile columns - compact view
  const mobileColumns: DataTableColumns<BannerRanking> = [
    {
      title: '#',
      key: 'rank',
      width: 20,
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
          h('span', { class: 'font-bold text-sm' }, rank),
          icon
            ? h(
                resolveComponent('n-icon'),
                { size: 14, class: color },
                { default: () => h(icon) }
              )
            : null,
        ])
      },
      sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    },
    {
      title: t('common.banner'),
      key: 'banner',
      width: 160,
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h('div', { class: 'flex flex-col gap-2 py-1' }, [
          h(resolveComponent('NuxtImg'), {
            src: getImageSrc('bannerThumb', row.banner_id),
            alt: t(`banner.${row.banner_id}.name`),
            class: 'w-16 h-8 rounded-sm object-cover shrink-0',
            preset: 'bannerThumb',
            width: 200,
            height: 100,
            loading: 'lazy',
          }),
          h(
            'span',
            { class: 'text-sm font-medium truncate max-w-50' },
            t(`banner.${row.banner_id}.name`)
          ),
          h('div', { class: 'flex gap-3 text-sm' }, [
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
        ])
      },
      sorter: (a, b) => a.banner_id - b.banner_id,
    },
    {
      title: t('vote.rankings.winsLosses'),
      key: 'wins_losses',
      width: 90,
      render: (row) => {
        return h('div', { class: 'flex flex-col gap-1 text-sm font-mono' }, [
          h(
            'span',
            { class: 'text-green-600 dark:text-green-400 font-semibold' },
            [
              h('span', { class: 'inline-block text-right w-10' }, row.wins),
              ` ${t('vote.rankings.winsShort')}`,
            ]
          ),
          h('span', { class: 'text-red-600 dark:text-red-400 font-semibold' }, [
            h('span', { class: 'inline-block text-right w-10' }, row.losses),
            ` ${t('vote.rankings.lossesShort')}`,
          ]),
        ])
      },
      sorter: (a, b) => b.wins - a.wins,
    },
  ]

  // Desktop columns - full view (computed to react to mode changes)
  const columns = computed<DataTableColumns<BannerRanking>>(() => [
    {
      title: t('vote.rankings.rank'),
      key: 'rank',
      width: 80,
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
          h('span', { class: 'font-bold' }, rank),
          icon
            ? h(
                resolveComponent('n-icon'),
                { size: 20, class: color },
                { default: () => h(icon) }
              )
            : null,
        ])
      },
      sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    },
    {
      title: t('common.banner'),
      key: 'banner',
      width: 250,
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h('div', { class: 'flex items-center gap-3' }, [
          h(resolveComponent('NuxtImg'), {
            src: getImageSrc('bannerThumb', row.banner_id),
            alt: t(`banner.${row.banner_id}.name`),
            class: 'w-20 h-10 rounded-sm object-cover shrink-0',
            preset: 'bannerThumb',
            width: 200,
            height: 100,
            loading: 'lazy',
          }),
          h(
            'span',
            { class: 'whitespace-normal' },
            t(`banner.${row.banner_id}.name`)
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

  const loadRankings = async () => {
    try {
      rankingsLoading.value = true

      if (isPersonalMode.value) {
        // Load personal rankings from localStorage
        const data = getPersonalRankings()
        rankings.value = data.rankings
        stats.value = data.stats
      } else {
        // Load community rankings from API
        const data = await getRankings()
        // Sort by win rate (descending) and add rank property
        const sortedRankings = [...data.rankings].sort(
          (a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0)
        )
        rankings.value = sortedRankings.map((ranking, index) => ({
          ...ranking,
          rank: index + 1,
        }))
        stats.value = data.stats
        lastUpdated.value = new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Failed to load rankings:', error)
      message.error(t('vote.errors.loadRankingsFailed'))
    } finally {
      rankingsLoading.value = false
    }
  }

  const navigateToVote = () => {
    navigateTo(localePath('/vote'))
  }

  const navigateToBanner = (bannerId: number) => {
    navigateTo(localePath(`/banners/${bannerId}`))
  }

  const rowProps = (row: BannerRanking) => {
    return {
      style: 'cursor: pointer;',
      onClick: () => {
        navigateToBanner(row.banner_id)
      },
    }
  }

  // Watch mode changes and reload rankings
  watch(isPersonalMode, () => {
    loadRankings()
  })

  // Load initial data
  onMounted(() => {
    loadRankings()
  })

  // SEO
  useSeoMeta({
    title: () =>
      `${t('vote.rankings.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('vote.rankings.description'),
    ogTitle: () =>
      `${t('vote.rankings.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('vote.rankings.description'),
    twitterTitle: () =>
      `${t('vote.rankings.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('vote.rankings.description'),
  })
</script>
