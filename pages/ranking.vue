<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Stats -->
    <n-card
      v-if="stats"
      size="small"
      class="rounded-xl"
    >
      <div class="flex flex-col sm:flex-row items-start gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1">
          <n-statistic :label="t('vote.stats.totalVotes')">
            <template #default>
              <n-number-animation
                :from="0"
                :to="stats.totalVotes"
                :duration="1000"
              />
            </template>
            <template #suffix>
              <n-icon><Poll /></n-icon>
            </template>
          </n-statistic>
          <n-statistic :label="t('vote.stats.totalVoters')">
            <template #default>
              <n-number-animation
                :from="0"
                :to="stats.totalVoters"
                :duration="1000"
              />
            </template>
            <template #suffix>
              <n-icon><Users /></n-icon>
            </template>
          </n-statistic>
          <n-statistic :label="t('vote.stats.avgVotes')">
            <template #default>
              <n-number-animation
                :from="0"
                :to="stats.averageVotesPerVoter"
                :duration="1000"
                :precision="1"
              />
            </template>
            <template #suffix>
              <n-icon><ChartBar /></n-icon>
            </template>
          </n-statistic>
        </div>
        <div class="flex gap-2 self-center sm:self-start">
          <n-tooltip :delay="500">
            <template #trigger>
              <n-button
                text
                size="small"
                circle
                @click="navigateToVote"
              >
                <template #icon>
                  <n-icon><CheckSquare /></n-icon>
                </template>
              </n-button>
            </template>
            {{ t('vote.rankings.voteMore') }}
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <n-button
                text
                :loading="rankingsLoading"
                size="small"
                circle
                @click="refreshRankings"
              >
                <template #icon>
                  <n-icon><Sync /></n-icon>
                </template>
              </n-button>
            </template>
            {{ t('vote.rankings.refresh') }}
          </n-tooltip>
        </div>
      </div>
    </n-card>

    <!-- Rankings Table - Desktop -->
    <n-card
      v-if="rankings.length > 0"
      size="small"
      class="rounded-xl hidden md:block"
    >
      <n-data-table
        :columns="columns"
        :data="rankings"
        :loading="rankingsLoading"
        :pagination="false"
        :bordered="false"
      />
    </n-card>

    <!-- Rankings List - Mobile -->
    <div
      v-if="rankings.length > 0"
      class="md:hidden space-y-2"
    >
      <n-card
        v-for="ranking in rankings"
        :key="ranking.banner_id"
        size="small"
        class="rounded-xl"
      >
        <!-- Rank, Banner Image & Name - All in one row -->
        <div class="flex items-center gap-3 mb-3">
          <!-- Rank -->
          <div class="flex items-center gap-1 flex-shrink-0 w-12">
            <span class="font-bold text-lg">{{ ranking.rank }}</span>
            <n-icon
              v-if="ranking.rank === 1"
              size="20"
              class="text-yellow-500"
            >
              <Trophy />
            </n-icon>
            <n-icon
              v-else-if="ranking.rank === 2"
              size="20"
              class="text-gray-400"
            >
              <Trophy />
            </n-icon>
            <n-icon
              v-else-if="ranking.rank === 3"
              size="20"
              class="text-amber-600"
            >
              <Trophy />
            </n-icon>
          </div>

          <!-- Banner Image -->
          <img
            :src="`/images/banners/thumbnails/${ranking.banner_id}.webp`"
            :alt="t(`banner.${ranking.banner_id}.name`)"
            class="w-24 h-12 rounded object-cover flex-shrink-0"
          />

          <!-- Banner Name -->
          <div class="flex-1 min-w-0 font-medium">
            {{ t(`banner.${ranking.banner_id}.name`) }}
          </div>
        </div>

        <!-- Stats Grid -->
        <div
          class="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('vote.rankings.elo') }}
            </div>
            <div class="font-mono font-semibold">
              {{ Math.round(ranking.elo_rating) }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('vote.rankings.winRate') }}
            </div>
            <div class="font-mono font-semibold">
              {{ ((ranking.win_rate ?? 0) * 100).toFixed(1) }}%
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('vote.rankings.totalVotes') }}
            </div>
            <div class="font-semibold">
              {{ ranking.total_votes ?? 0 }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('vote.rankings.wins') }}
            </div>
            <div class="font-semibold text-green-600 dark:text-green-400">
              {{ ranking.wins }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('vote.rankings.losses') }}
            </div>
            <div class="font-semibold text-red-600 dark:text-red-400">
              {{ ranking.losses }}
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- Loading State -->
    <n-card
      v-else-if="rankingsLoading"
      size="small"
      class="rounded-xl"
    >
      <div class="flex items-center justify-center min-h-[300px]">
        <n-spin size="large" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Poll, Trophy, Users, ChartBar, Sync, CheckSquare } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import type { BannerRanking, VoteStats } from '~/types/vote'
  import type { DataTableColumns } from 'naive-ui'
  import { h, resolveComponent } from 'vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const message = useMessage()
  const { getRankings } = useBannerVote()

  const rankingsLoading = ref(false)
  const rankings = ref<BannerRanking[]>([])
  const stats = ref<VoteStats | null>(null)

  // Table columns
  const columns: DataTableColumns<BannerRanking> = [
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
      title: t('vote.rankings.banner'),
      key: 'banner',
      minWidth: 250,
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h('div', { class: 'flex items-center gap-3' }, [
          h('img', {
            src: `/images/banners/thumbnails/${row.banner_id}.webp`,
            alt: t(`banner.${row.banner_id}.name`),
            class: 'w-20 h-10 rounded object-cover flex-shrink-0',
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
      title: t('vote.rankings.elo'),
      key: 'elo_rating',
      width: 120,
      render: (row) => {
        return h('span', { class: 'font-mono' }, Math.round(row.elo_rating))
      },
      sorter: (a, b) => b.elo_rating - a.elo_rating,
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
      title: t('vote.rankings.totalVotes'),
      key: 'total_votes',
      width: 120,
      render: (row) => {
        return h('span', row.total_votes ?? 0)
      },
      sorter: (a, b) => (b.total_votes ?? 0) - (a.total_votes ?? 0),
    },
  ]

  const loadRankings = async () => {
    try {
      rankingsLoading.value = true
      const data = await getRankings()
      // Add rank property to each ranking based on initial ELO order
      rankings.value = data.rankings.map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
      }))
      stats.value = data.stats
    } catch (error) {
      console.error('Failed to load rankings:', error)
      message.error(t('vote.errors.loadRankingsFailed'))
    } finally {
      rankingsLoading.value = false
    }
  }

  const refreshRankings = () => {
    loadRankings()
  }

  const navigateToVote = () => {
    router.push(localePath('/vote'))
  }

  // Load initial data
  onMounted(() => {
    loadRankings()
  })

  // Define page metadata
  definePageMeta({
    name: 'ranking',
  })

  // SEO
  useHead(() => ({
    title: t('vote.rankings.title') + ' - ' + t('navigation.subtitle'),
  }))
</script>
