import type {
  FeedbackEntityType,
  FeedbackListResponse,
  FeedbackMaintainerActionResponse,
  FeedbackReviewState,
  FeedbackScope,
  FeedbackSortKey,
  FeedbackSuggestionStatus,
  FeedbackViewerStateResponse,
  FeedbackVoteValue,
  ItemTagFeedbackField,
  ItemTagFeedbackSnapshot,
  SubmitFeedbackResponse,
  VoteFeedbackResponse,
} from '#shared/types/feedback'

type FetchFeedbackParams = {
  entityType?: FeedbackEntityType
  entityId?: number
  status?: FeedbackSuggestionStatus | 'all'
  changedField?: ItemTagFeedbackField
  reviewState?: FeedbackReviewState
  scope?: FeedbackScope
  sort?: FeedbackSortKey
  page?: number
}

export const useFeedback = () => {
  const supabase = useSupabaseClient()

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token?.trim()
    if (!token) return null

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const requireAuthHeaders = async () => {
    const headers = await getAuthHeaders()
    if (headers) return headers

    throw new Error('Authentication required')
  }

  const fetchFeedbackQueue = async (
    params: FetchFeedbackParams = {}
  ): Promise<FeedbackListResponse> => {
    const headers = await getAuthHeaders()

    return $fetch<FeedbackListResponse>('/api/feedback', {
      params,
      headers: headers ?? undefined,
    })
  }

  const fetchViewerState = async (
    suggestionIds: string[]
  ): Promise<FeedbackViewerStateResponse> => {
    const headers = await getAuthHeaders()
    if (!headers) {
      return {
        votes: {},
        isMaintainer: false,
      }
    }

    return $fetch<FeedbackViewerStateResponse>('/api/feedback/me', {
      headers,
      params: {
        ids: suggestionIds.length > 0 ? suggestionIds.join(',') : undefined,
      },
    })
  }

  const submitSuggestion = async ({
    entityType,
    entityId,
    proposedPatch,
  }: {
    entityType: FeedbackEntityType
    entityId: number
    proposedPatch: ItemTagFeedbackSnapshot
  }) => {
    const headers = await requireAuthHeaders()

    return $fetch<SubmitFeedbackResponse>('/api/feedback', {
      method: 'POST',
      headers,
      body: {
        entityType,
        entityId,
        proposedPatch,
      },
    })
  }

  const voteSuggestion = async ({
    suggestionId,
    vote,
  }: {
    suggestionId: string
    vote: FeedbackVoteValue | null
  }) => {
    const headers = await requireAuthHeaders()

    return $fetch<VoteFeedbackResponse>('/api/feedback/vote', {
      method: 'POST',
      headers,
      body: {
        suggestionId,
        vote,
      },
    })
  }

  const runMaintainerAction = async ({
    suggestionId,
    action,
  }: {
    suggestionId: string
    action: 'approve' | 'reject' | 'apply'
  }) => {
    const headers = await requireAuthHeaders()

    return $fetch<FeedbackMaintainerActionResponse>('/api/feedback/admin', {
      method: 'POST',
      headers,
      body: {
        suggestionId,
        action,
      },
    })
  }

  const approveSuggestion = (suggestionId: string) =>
    runMaintainerAction({
      suggestionId,
      action: 'approve',
    })

  const rejectSuggestion = (suggestionId: string) =>
    runMaintainerAction({
      suggestionId,
      action: 'reject',
    })

  const applySuggestion = (suggestionId: string) =>
    runMaintainerAction({
      suggestionId,
      action: 'apply',
    })

  return {
    applySuggestion,
    approveSuggestion,
    fetchFeedbackQueue,
    fetchViewerState,
    rejectSuggestion,
    submitSuggestion,
    voteSuggestion,
  }
}
