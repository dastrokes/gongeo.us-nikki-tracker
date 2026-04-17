<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="space-y-4">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0">
            <h1 class="text-lg font-semibold leading-tight sm:text-2xl">
              {{ t('feedback.queue_title') }}
            </h1>
          </div>

          <div class="flex items-center gap-2 self-start">
            <NuxtLinkLocale
              :to="guidelinesPath"
              class="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
            >
              {{ t('feedback.guidelines_action') }}
            </NuxtLinkLocale>
            <n-button
              size="small"
              quaternary
              @click="refreshQueue"
            >
              {{ t('feedback.refresh') }}
            </n-button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          <div class="space-y-1.5">
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.mode_filter_label') }}
            </div>
            <n-radio-group
              v-model:value="viewMode"
              size="small"
            >
              <n-radio-button value="vote">
                {{ t('feedback.mode_vote') }}
              </n-radio-button>
              <n-radio-button value="list">
                {{ t('feedback.mode_list') }}
              </n-radio-button>
            </n-radio-group>
          </div>
          <div
            v-if="showScopeFilter"
            class="space-y-1.5"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.scope_filter_label') }}
            </div>
            <n-select
              :value="scope"
              size="small"
              :options="scopeOptions"
              :show-checkmark="false"
              @update:value="handleScopeChange"
            />
          </div>
          <div class="space-y-1.5">
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.sort_filter_label') }}
            </div>
            <n-select
              v-model:value="sort"
              size="small"
              :options="sortOptions"
              :show-checkmark="false"
            />
          </div>
          <div class="space-y-1.5">
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.status_filter_label') }}
            </div>
            <n-select
              v-model:value="status"
              size="small"
              :options="statusOptions"
              :show-checkmark="false"
            />
          </div>
          <div
            v-if="showReviewStateFilter"
            class="space-y-1.5"
          >
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.review_state_filter_label') }}
            </div>
            <n-select
              v-model:value="reviewState"
              size="small"
              :options="reviewStateOptions"
              :show-checkmark="false"
              :placeholder="t('feedback.review_filter')"
            />
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-3 sm:p-4"
    >
      <div class="space-y-4 sm:space-y-5">
        <n-spin :show="loading">
          <div
            v-if="displayedSuggestions.length > 0"
            class="space-y-3"
          >
            <FeedbackSuggestionCard
              v-for="suggestion in displayedSuggestions"
              :key="suggestion.id"
              :suggestion="suggestion"
              :user-vote="viewerVotes[suggestion.id] ?? null"
              :show-actions="true"
              :show-maintainer-actions="isMaintainer"
              :show-previous-action="
                isVoteMode &&
                suggestion.id === currentSuggestion?.id &&
                Boolean(lastDismissedSuggestionId)
              "
              :show-skip-action="isVoteMode"
              :previous-disabled="
                isVoteMode &&
                (votingSuggestionId !== null ||
                  maintainerActionSuggestionId !== null)
              "
              :voting="
                votingSuggestionId === suggestion.id ||
                maintainerActionSuggestionId === suggestion.id
              "
              :maintainer-busy="maintainerActionSuggestionId === suggestion.id"
              :maintainer-busy-action="
                maintainerActionSuggestionId === suggestion.id
                  ? maintainerAction
                  : null
              "
              @vote="handleVote(suggestion, $event)"
              @maintainer-action="handleMaintainerAction(suggestion, $event)"
              @previous="restorePreviousSuggestion"
              @skip="skipSuggestion(suggestion.id)"
            />
          </div>

          <div
            v-else-if="isBootstrappingQueue"
            class="grid animate-pulse gap-4 lg:grid-cols-[200px_minmax(0,1fr)]"
          >
            <div
              class="aspect-2/3 rounded-3xl bg-black/5 dark:bg-white/5"
            ></div>
            <div class="space-y-4">
              <div
                class="h-6 w-40 rounded-full bg-black/5 dark:bg-white/5"
              ></div>
              <div class="grid gap-3 xl:grid-cols-2">
                <div class="h-24 rounded-2xl bg-black/5 dark:bg-white/5"></div>
                <div class="h-24 rounded-2xl bg-black/5 dark:bg-white/5"></div>
              </div>
              <div class="h-16 rounded-2xl bg-black/5 dark:bg-white/5"></div>
            </div>
          </div>

          <div
            v-else
            class="rounded-3xl border border-dashed border-black/10 px-4 py-12 text-center dark:border-white/15"
          >
            <div class="text-base font-semibold">
              {{ emptyStateTitle }}
            </div>
          </div>
        </n-spin>

        <div
          v-if="totalPages > 1"
          class="flex justify-center pt-2"
        >
          <n-pagination
            v-model:page="page"
            :page-count="totalPages"
            :page-slot="7"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const guidelinesPath = computed(() => localePath('/guideline'))
  const message = useMessage()
  const { user, initialized, initAuth } = useAuth()
  const {
    applySuggestion,
    approveSuggestion,
    fetchFeedbackQueue,
    fetchViewerState,
    rejectSuggestion,
    voteSuggestion,
  } = useFeedback()

  const getDefaultReviewState = (): FeedbackReviewState =>
    user.value ? 'unreviewed' : 'all'
  type FeedbackViewMode = 'vote' | 'list'

  const parseSort = (value: string | null): FeedbackSortKey => {
    if (value === 'top' || value === 'new') return value
    return 'needs-review'
  }

  const serializeSort = (value: FeedbackSortKey) =>
    value === 'needs-review' ? 'review' : value

  const getDefaultStatus = (
    selectedScope: FeedbackScope
  ): FeedbackSuggestionStatus | 'all' =>
    selectedScope === 'mine' ? 'all' : 'open'

  const isFeedbackStatusFilter = (
    value: string | null
  ): value is FeedbackSuggestionStatus | 'all' =>
    value === 'open' ||
    value === 'accepted' ||
    value === 'rejected' ||
    value === 'applied' ||
    value === 'all'

  const parseStatus = (
    value: string | null,
    fallback: FeedbackSuggestionStatus | 'all' = 'open'
  ): FeedbackSuggestionStatus | 'all' =>
    isFeedbackStatusFilter(value) ? value : fallback

  const parsePage = (value: string | null) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 1) return 1
    return Math.floor(parsed)
  }

  const parseReviewState = (value: string | null): FeedbackReviewState =>
    value === 'all' || value === 'voted' || value === 'unreviewed'
      ? value
      : getDefaultReviewState()

  const parseScope = (value: string | null): FeedbackScope =>
    value === 'mine' ? 'mine' : 'all'
  const parseViewMode = (value: string | null): FeedbackViewMode =>
    value === 'list' ? 'list' : 'vote'

  const initialScope = parseScope(route.query.scope?.toString() ?? null)
  const scope = ref<FeedbackScope>(initialScope)
  const viewMode = ref<FeedbackViewMode>(
    parseViewMode(route.query.mode?.toString() ?? null)
  )
  const sort = ref<FeedbackSortKey>(
    parseSort(route.query.sort?.toString() ?? null)
  )
  const status = ref<FeedbackSuggestionStatus | 'all'>(
    parseStatus(
      route.query.status?.toString() ?? null,
      getDefaultStatus(initialScope)
    )
  )
  const reviewState = ref<FeedbackReviewState>(
    parseReviewState(route.query.state?.toString() ?? null)
  )
  const hasExplicitReviewStateQuery = computed(() => {
    const value = route.query.state?.toString() ?? null
    return value === 'all' || value === 'voted' || value === 'unreviewed'
  })
  const hasExplicitStatusQuery = computed(() =>
    isFeedbackStatusFilter(route.query.status?.toString() ?? null)
  )
  const page = ref(parsePage(route.query.page?.toString() ?? null))
  const loading = ref(true)
  const queue = ref<FeedbackSuggestion[]>([])
  const totalPages = ref(0)
  const viewerVotes = ref<Record<string, FeedbackVoteValue | null>>({})
  const isMaintainer = ref(false)
  const hiddenSuggestionIds = ref<string[]>([])
  const dismissalHistory = ref<string[]>([])
  const votingSuggestionId = ref<string | null>(null)
  const maintainerActionSuggestionId = ref<string | null>(null)
  const maintainerAction = ref<FeedbackMaintainerAction | null>(null)
  let viewerStateRequestId = 0
  const isMineScope = computed(
    () => scope.value === 'mine' && Boolean(user.value)
  )
  const showScopeFilter = computed(
    () => initialized.value && Boolean(user.value)
  )
  const showReviewStateFilter = computed(
    () => initialized.value && Boolean(user.value) && !isMineScope.value
  )
  const effectiveReviewState = computed<FeedbackReviewState>(() =>
    isMineScope.value ? 'all' : reviewState.value
  )
  const isVoteMode = computed(() => viewMode.value === 'vote')

  const handleScopeChange = (value: string) => {
    const nextScope = parseScope(value)
    scope.value = nextScope

    if (nextScope === 'mine') {
      status.value = 'all'
    }
  }

  const feedbackQuery = computed(() => ({
    mode: viewMode.value,
    scope: scope.value,
    sort: serializeSort(sort.value),
    status: status.value,
    state: effectiveReviewState.value,
    page: String(page.value),
  }))

  const hasSyncedQuery = computed(() => {
    const queryKeys = Object.keys(route.query)
    if (
      queryKeys.some(
        (key) =>
          !['mode', 'scope', 'sort', 'status', 'state', 'page'].includes(key)
      )
    ) {
      return false
    }

    return (
      route.query.mode?.toString() === feedbackQuery.value.mode &&
      route.query.scope?.toString() === feedbackQuery.value.scope &&
      route.query.sort?.toString() === feedbackQuery.value.sort &&
      route.query.status?.toString() === feedbackQuery.value.status &&
      route.query.state?.toString() === feedbackQuery.value.state &&
      route.query.page?.toString() === feedbackQuery.value.page
    )
  })

  const syncQuery = async () => {
    if (hasSyncedQuery.value) return

    await router.replace({
      query: feedbackQuery.value,
    })
  }

  const resetViewerState = () => {
    viewerVotes.value = {}
    isMaintainer.value = false
  }

  const loadViewerState = async (
    suggestions: FeedbackSuggestion[],
    requestId: number
  ) => {
    try {
      const viewerState = await fetchViewerState(
        suggestions.map((entry) => entry.id)
      )
      if (requestId !== viewerStateRequestId) return

      isMaintainer.value = viewerState.isMaintainer
      viewerVotes.value = suggestions.reduce<
        Record<string, FeedbackVoteValue | null>
      >((accumulator, suggestion) => {
        accumulator[suggestion.id] = viewerState.votes[suggestion.id] ?? null
        return accumulator
      }, {})
    } catch (error) {
      if (requestId !== viewerStateRequestId) return

      resetViewerState()
      console.error('Failed to load feedback viewer state:', error)
    }
  }

  const refreshQueue = async () => {
    const requestId = ++viewerStateRequestId
    loading.value = true
    try {
      const response = await fetchFeedbackQueue({
        entityType: 'item',
        scope: scope.value,
        sort: sort.value,
        status: status.value,
        reviewState: effectiveReviewState.value,
        page: page.value,
      })
      if (requestId !== viewerStateRequestId) return

      queue.value = response.data
      totalPages.value = response.totalPages
      hiddenSuggestionIds.value = []
      dismissalHistory.value = []

      if (user.value && response.data.length > 0) {
        isMaintainer.value = false
        viewerVotes.value = queue.value.reduce<
          Record<string, FeedbackVoteValue | null>
        >((accumulator, suggestion) => {
          accumulator[suggestion.id] = null
          return accumulator
        }, {})
        void loadViewerState(response.data, requestId)
      } else {
        resetViewerState()
      }
    } catch (error) {
      if (requestId !== viewerStateRequestId) return

      resetViewerState()
      message.error(t('feedback.load_failed'))
      console.error('Failed to load feedback queue:', error)
    } finally {
      if (requestId === viewerStateRequestId) {
        loading.value = false
      }
    }
  }

  watch(viewMode, async () => {
    hiddenSuggestionIds.value = []
    dismissalHistory.value = []

    if (!initialized.value) return
    await syncQuery()
  })

  watch([scope, sort, status, reviewState], () => {
    if (!initialized.value) return
    if (page.value !== 1) {
      page.value = 1
    }
  })

  watch([scope, sort, status, reviewState, page], async () => {
    if (!initialized.value) return
    await syncQuery()
    await refreshQueue()
  })

  watch(
    () => [initialized.value, user.value?.id] as const,
    async ([isInitialized, _userId]) => {
      if (!isInitialized) return

      if (!user.value) {
        if (scope.value !== 'all') {
          scope.value = 'all'
          if (!hasExplicitStatusQuery.value) {
            status.value = getDefaultStatus('all')
          }
          return
        }

        if (reviewState.value !== 'all') {
          reviewState.value = 'all'
          return
        }

        await syncQuery()
        await refreshQueue()
        return
      }

      if (isMineScope.value) {
        await syncQuery()
        await refreshQueue()
        return
      }

      if (hasExplicitReviewStateQuery.value) {
        await syncQuery()
        await refreshQueue()
        return
      }

      const nextDefaultReviewState = getDefaultReviewState()
      if (reviewState.value !== nextDefaultReviewState) {
        reviewState.value = nextDefaultReviewState
        return
      }

      await syncQuery()
      await refreshQueue()
    },
    { immediate: true }
  )

  onMounted(async () => {
    await initAuth()
  })

  const visibleQueue = computed(() =>
    queue.value.filter(
      (suggestion) => !hiddenSuggestionIds.value.includes(suggestion.id)
    )
  )
  const currentSuggestion = computed(() => visibleQueue.value[0] ?? null)
  const displayedSuggestions = computed(() =>
    isVoteMode.value
      ? currentSuggestion.value
        ? [currentSuggestion.value]
        : []
      : queue.value
  )
  const isBootstrappingQueue = computed(
    () => loading.value && queue.value.length === 0
  )
  const emptyStateTitle = computed(() =>
    isMineScope.value
      ? t('feedback.scope_mine_empty')
      : isVoteMode.value
        ? t('feedback.quick_review_empty')
        : t('feedback.list_empty')
  )
  const lastDismissedSuggestionId = computed(() => {
    const suggestionIds = dismissalHistory.value
    return suggestionIds.length > 0
      ? suggestionIds[suggestionIds.length - 1]
      : null
  })

  const ensureLoggedIn = async () => {
    if (user.value) return true
    message.warning(t('feedback.login_required'))
    await navigateTo(localePath('/login'))
    return false
  }

  const patchSuggestion = (updatedSuggestion: FeedbackSuggestion) => {
    queue.value = queue.value.map((entry) =>
      entry.id === updatedSuggestion.id ? updatedSuggestion : entry
    )
  }

  const dismissSuggestion = (suggestionId: string) => {
    if (hiddenSuggestionIds.value.includes(suggestionId)) return

    hiddenSuggestionIds.value = [...hiddenSuggestionIds.value, suggestionId]
    dismissalHistory.value = [...dismissalHistory.value, suggestionId]
  }

  const handleVote = async (
    suggestion: FeedbackSuggestion,
    vote: FeedbackVoteValue | null
  ) => {
    if (!(await ensureLoggedIn())) return false

    viewerStateRequestId += 1
    votingSuggestionId.value = suggestion.id
    try {
      const response = await voteSuggestion({
        suggestionId: suggestion.id,
        vote,
      })
      viewerVotes.value = {
        ...viewerVotes.value,
        [suggestion.id]: response.vote,
      }
      patchSuggestion(response.suggestion)
      if (isVoteMode.value) {
        dismissSuggestion(suggestion.id)
      }
      return true
    } catch (error) {
      message.error(t('feedback.vote_failed'))
      console.error('Failed to update feedback vote:', error)
      return false
    } finally {
      votingSuggestionId.value = null
    }
  }

  const skipSuggestion = (suggestionId: string) => {
    dismissSuggestion(suggestionId)
  }

  const getActionErrorMessage = (error: unknown, fallbackKey: string) => {
    const responseMessage =
      error &&
      typeof error === 'object' &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof error.data.message === 'string'
        ? error.data.message
        : null

    return responseMessage || t(fallbackKey)
  }

  const handleMaintainerAction = async (
    suggestion: FeedbackSuggestion,
    action: FeedbackMaintainerAction
  ) => {
    if (maintainerActionSuggestionId.value) {
      return false
    }

    maintainerActionSuggestionId.value = suggestion.id
    maintainerAction.value = action
    try {
      if (action === 'approve') {
        await approveSuggestion(suggestion.id)
        message.success(t('feedback.approve_success'))
      } else if (action === 'reject') {
        await rejectSuggestion(suggestion.id)
        message.success(t('feedback.reject_success'))
      } else {
        await applySuggestion(suggestion.id)
        message.success(t('feedback.apply_success'))
      }

      await refreshQueue()
      return true
    } catch (error) {
      const fallbackKey =
        action === 'approve'
          ? 'feedback.admin.approve_failed'
          : action === 'reject'
            ? 'feedback.admin.reject_failed'
            : 'feedback.admin.apply_failed'
      message.error(getActionErrorMessage(error, fallbackKey))
      console.error(`Failed to ${action} feedback suggestion:`, error)
      return false
    } finally {
      maintainerActionSuggestionId.value = null
      maintainerAction.value = null
    }
  }

  const restorePreviousSuggestion = () => {
    const suggestionId = lastDismissedSuggestionId.value
    if (!suggestionId) return

    hiddenSuggestionIds.value = hiddenSuggestionIds.value.filter(
      (entryId) => entryId !== suggestionId
    )
    dismissalHistory.value = dismissalHistory.value.slice(0, -1)
  }

  const sortOptions = computed(() => [
    { label: t('feedback.sort_needs_review'), value: 'needs-review' },
    { label: t('feedback.sort_top'), value: 'top' },
    { label: t('common.sort.newest_first'), value: 'new' },
  ])

  const statusOptions = computed(() => [
    { label: t('feedback.status_open'), value: 'open' },
    { label: t('feedback.status_all'), value: 'all' },
    { label: t('feedback.status_accepted'), value: 'accepted' },
    { label: t('feedback.status_rejected'), value: 'rejected' },
    { label: t('feedback.status_applied'), value: 'applied' },
  ])

  const scopeOptions = computed(() => [
    { label: t('feedback.scope_all'), value: 'all' },
    { label: t('feedback.scope_mine'), value: 'mine' },
  ])

  const reviewStateOptions = computed(() => [
    {
      label: t('feedback.review_state_unreviewed'),
      value: 'unreviewed',
    },
    { label: t('common.all'), value: 'all' },
    { label: t('feedback.review_state_voted'), value: 'voted' },
  ])

  useSeoMeta({
    title: () =>
      `${t('feedback.queue_title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogTitle: () =>
      `${t('feedback.queue_title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterTitle: () =>
      `${t('feedback.queue_title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('feedback.page_description'),
    ogDescription: () => t('feedback.page_description'),
    twitterDescription: () => t('feedback.page_description'),
  })
</script>
