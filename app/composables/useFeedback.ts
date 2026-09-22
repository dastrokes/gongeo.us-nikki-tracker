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
    itemType,
    baseSnapshot,
    proposedPatch,
  }: {
    entityType: FeedbackEntityType
    entityId: number
    itemType: string
    baseSnapshot: ItemTagFeedbackSnapshot
    proposedPatch: ItemTagFeedbackSnapshot
  }) => {
    const headers = await requireAuthHeaders()

    return $fetch<SubmitFeedbackResponse>('/api/feedback', {
      method: 'POST',
      headers,
      body: {
        entityType,
        entityId,
        itemType,
        baseSnapshot,
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
    action: FeedbackMaintainerAction
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

  const applySuggestion = (suggestion: FeedbackSuggestion) =>
    (async () => {
      const headers = await requireAuthHeaders()
      const prepared = await runMaintainerAction({
        suggestionId: suggestion.id,
        action: 'apply',
      })
      if (!prepared.catalogApply) {
        throw new Error('Catalog apply request was not prepared')
      }

      const catalogResponse = await $fetch<{
        result?: {
          operationId?: unknown
          itemId?: unknown
          purgedTags?: unknown
          searchNamespaces?: unknown
          revision?: unknown
          replayed?: unknown
        }
      }>(getDataApiUrl(`/_internal/catalog/items/${suggestion.entityId}`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${prepared.catalogApply.token}`,
        },
        body: prepared.catalogApply.body,
      })
      const result = catalogResponse.result
      if (
        !result ||
        typeof result.operationId !== 'string' ||
        Number(result.itemId) !== suggestion.entityId ||
        !Array.isArray(result.purgedTags) ||
        !Array.isArray(result.searchNamespaces) ||
        typeof result.revision !== 'string' ||
        typeof result.replayed !== 'boolean'
      ) {
        throw new Error('Catalog data API returned an invalid write result')
      }

      const applyResult: FeedbackMaintainerApplyResult = {
        applyId: result.operationId,
        touchedItemIds: [suggestion.entityId],
        purgedCacheTags: result.purgedTags as string[],
        searchNamespaces: result.searchNamespaces as string[],
        revision: result.revision,
        replayed: result.replayed,
      }
      return $fetch<FeedbackMaintainerActionResponse>(
        '/api/feedback/admin/complete',
        {
          method: 'POST',
          headers,
          body: { suggestionId: suggestion.id, applyResult },
        }
      )
    })()

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
