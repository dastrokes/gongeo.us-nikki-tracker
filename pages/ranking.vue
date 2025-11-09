<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Stats -->
    <n-card
      v-if="stats"
      size="small"
      class="rounded-xl"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1">
          <n-statistic
            :label="t('vote.stats.totalVotes')"
            :value="stats.totalVotes"
          >
            <template #suffix>
              <n-icon><Poll /></n-icon>
            </template>
          </n-statistic>
          <n-statistic
            :label="t('vote.stats.totalVoters')"
            :value="stats.totalVoters"
          >
            <template #suffix>
              <n-icon><Users /></n-icon>
            </template>
          </n-statistic>
          <n-statistic
            :label="t('vote.stats.avgVotes')"
            :value="stats.averageVotesPerVoter.toFixed(1)"
          >
            <template #suffix>
              <n-icon><ChartBar /></n-icon>
            </template>
          </n-statistic>
        </div>
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
      </div>
    </n-card>

    <!-- Rankings Table -->
    <n-card
      v-if="rankings.length > 0"
      size="small"
      class="rounded-xl"
    >
      <n-data-table
        :columns="columns"
        :data="rankings"
        :loading="rankingsLoading"
        :pagination="false"
        :bordered="false"
      />
    </n-card>

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

    <!-- Vote More Button -->
    <div class="flex justify-center mt-4">
      <n-button
        type="primary"
        size="large"
        @click="navigateToVote"
      >
        {{ t('vote.rankings.voteMore') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Poll, Trophy, Users, ChartBar, Sync } from '@vicons/fa'
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
      render: (_row, index) => {
        const rank = index + 1
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
          icon
            ? h(
                resolveComponent('n-icon'),
                { size: 20, class: color },
                { default: () => h(icon) }
              )
            : null,
          h('span', { class: 'font-bold' }, rank),
        ])
      },
    },
    {
      title: t('vote.rankings.banner'),
      key: 'banner',
      render: (row) => {
        const banner = BANNER_DATA[row.banner_id]
        if (!banner) return '-'

        return h('div', { class: 'flex items-center gap-3' }, [
          h('img', {
            src: `/images/banners/${row.banner_id}.webp`,
            alt: t(`banner.${row.banner_id}.name`),
            class: 'w-16 h-8 rounded object-cover',
          }),
          h('span', t(`banner.${row.banner_id}.name`)),
        ])
      },
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
      rankings.value = data.rankings
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
