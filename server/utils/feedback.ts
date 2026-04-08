import { createHash } from 'node:crypto'

import { createError } from 'h3'

import { useSupabaseDataClient } from '~/composables/useSupabaseClient'

import type {
  FeedbackEntityType,
  FeedbackListResponse,
  FeedbackReviewState,
  FeedbackScope,
  FeedbackSortKey,
  FeedbackSuggestion,
  FeedbackSuggestionStatus,
  FeedbackVoteValue,
  ItemTagFeedbackField,
  ItemTagFeedbackPatch,
  ItemTagFeedbackSnapshot,
} from '#shared/types/feedback'
import type { ItemSearchMetadata } from '#shared/types/itemSearch'
import {
  ALL_ITEM_TAG_FEEDBACK_FIELDS,
  FEEDBACK_PAGE_SIZE,
  buildItemTagFeedbackPatch,
  createItemTagFeedbackSnapshot,
  hasItemTagFeedbackChanges,
  normalizeItemTagFeedbackSnapshot,
  stableSerializeFeedbackRecord,
} from '#shared/utils/feedback'
import { hydrateItemSearchMetadata } from '#shared/utils/itemSearch'

type FeedbackSuggestionRow = {
  id?: string | null
  entity_type?: string | null
  entity_id?: number | string | null
  base_snapshot?: Record<string, unknown> | null
  base_signature?: string | null
  proposed_patch?: Record<string, unknown> | null
  changed_fields?: string[] | null
  status?: string | null
  user_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  agree_count?: number | string | null
  disagree_count?: number | string | null
  score?: number | string | null
  total_votes?: number | string | null
}

type FeedbackItemTypeRow = {
  id?: number | string | null
  type?: string | null
}

type FeedbackVoteRow = {
  suggestion_id?: string | null
  vote_value?: number | string | null
}

type FeedbackSourceItemRow = {
  id?: number | string | null
  type?: string | null
  item_attributes?:
    | {
        item_id?: number | string | null
        item_type?: string | null
        category?: string | null
        subcategory?: string | null
        metadata?: Record<string, unknown> | null
      }
    | Array<{
        item_id?: number | string | null
        item_type?: string | null
        category?: string | null
        subcategory?: string | null
        metadata?: Record<string, unknown> | null
      }>
    | null
}

export interface FeedbackSourceItem {
  entityType: 'item'
  entityId: number
  itemType: string
  metadata: ItemSearchMetadata | null
}

type ListFeedbackOptions = {
  entityType?: FeedbackEntityType | null
  entityId?: number | null
  status?: FeedbackSuggestionStatus | null
  changedField?: ItemTagFeedbackField | null
  reviewState?: FeedbackReviewState
  scope?: FeedbackScope
  userId?: string | null
  sort: FeedbackSortKey
  page: number
  pageSize?: number
}

type CreateFeedbackSuggestionInput = {
  entityType: FeedbackEntityType
  entityId: number
  baseSnapshot: ItemTagFeedbackSnapshot
  proposedPatch: ItemTagFeedbackPatch
  changedFields: ItemTagFeedbackField[]
  userId: string
}

const normalizeCount = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

const normalizeEntityId = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.floor(parsed)
}

const createSignature = (value: string) =>
  createHash('sha256').update(value).digest('hex')

const formatPostgrestInFilterValues = (values: string[]) =>
  `(${values
    .map((value) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join(',')})`

const mapSuggestionRow = (
  row: FeedbackSuggestionRow | null | undefined
): FeedbackSuggestion | null => {
  if (!row?.id) return null
  if (row.entity_type !== 'item' && row.entity_type !== 'outfit') return null

  const entityId = normalizeEntityId(row.entity_id)
  if (entityId === null) return null

  const createdAt = row.created_at || null
  const updatedAt = row.updated_at || createdAt
  if (!createdAt || !updatedAt || !row.base_signature) {
    return null
  }

  const status = row.status
  if (
    status !== 'open' &&
    status !== 'accepted' &&
    status !== 'rejected' &&
    status !== 'applied'
  ) {
    return null
  }

  return {
    id: row.id,
    entityType: row.entity_type,
    entityId,
    itemType: null,
    baseSnapshot: normalizeItemTagFeedbackSnapshot(row.base_snapshot ?? {}),
    baseSignature: row.base_signature,
    proposedPatch: normalizeItemTagFeedbackSnapshot(row.proposed_patch ?? {}),
    changedFields: (row.changed_fields ?? []).filter(
      (field): field is ItemTagFeedbackField =>
        typeof field === 'string' &&
        ALL_ITEM_TAG_FEEDBACK_FIELDS.includes(field as ItemTagFeedbackField)
    ),
    status,
    userId: row.user_id ?? null,
    createdAt,
    updatedAt,
    agreeCount: normalizeCount(row.agree_count),
    disagreeCount: normalizeCount(row.disagree_count),
    score: Number(row.score ?? 0) || 0,
    totalVotes: normalizeCount(row.total_votes),
  }
}

const attachSuggestionItemTypes = async (
  suggestions: FeedbackSuggestion[]
): Promise<FeedbackSuggestion[]> => {
  const itemEntityIds = Array.from(
    new Set(
      suggestions
        .filter((suggestion) => suggestion.entityType === 'item')
        .map((suggestion) => suggestion.entityId)
    )
  )

  if (itemEntityIds.length === 0) {
    return suggestions
  }

  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase.from('items').select('id,type').in('id', itemEntityIds)
  )

  if (error) {
    throw error
  }

  const itemTypeById = new Map<number, string | null>()
  ;((data as FeedbackItemTypeRow[] | null) ?? []).forEach((row) => {
    const entityId = normalizeEntityId(row.id)
    if (entityId === null) return
    itemTypeById.set(entityId, row.type?.trim() || null)
  })

  return suggestions.map((suggestion) =>
    suggestion.entityType === 'item'
      ? {
          ...suggestion,
          itemType: itemTypeById.get(suggestion.entityId) ?? null,
        }
      : suggestion
  )
}

export const listFeedbackSuggestions = async ({
  entityType = null,
  entityId = null,
  status = 'open',
  changedField = null,
  reviewState = 'all',
  scope = 'all',
  userId = null,
  sort,
  page,
  pageSize = FEEDBACK_PAGE_SIZE,
}: ListFeedbackOptions): Promise<FeedbackListResponse> => {
  const supabase = useSupabaseDataClient()
  const safePageSize = Math.max(1, Math.min(pageSize, 50))
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  let query = supabase.from('feedback_queue').select('*', { count: 'exact' })
  const isMineScope = scope === 'mine' && Boolean(userId)
  const shouldFilterReviewed = userId && reviewState !== 'all' && !isMineScope

  if (shouldFilterReviewed) {
    const { data: votedRows, error: votedRowsError } = await withSupabaseRetry(
      () =>
        supabase
          .from('feedback_votes')
          .select('suggestion_id')
          .eq('user_id', userId)
    )

    if (votedRowsError) {
      throw votedRowsError
    }

    const votedSuggestionIds = Array.from(
      new Set(
        ((votedRows as Array<{ suggestion_id?: string | null }> | null) ?? [])
          .map((row) => row.suggestion_id?.trim() ?? '')
          .filter(Boolean)
      )
    )

    if (reviewState === 'voted') {
      if (votedSuggestionIds.length === 0) {
        return {
          data: [],
          total: 0,
          page: safePage,
          totalPages: 0,
        }
      }

      query = query.in('id', votedSuggestionIds)
    } else if (votedSuggestionIds.length > 0) {
      query = query.not(
        'id',
        'in',
        formatPostgrestInFilterValues(votedSuggestionIds)
      )
    }
  }

  if (entityType) {
    query = query.eq('entity_type', entityType)
  }

  if (entityId !== null && entityId !== undefined) {
    query = query.eq('entity_id', entityId)
  }

  if (isMineScope && userId) {
    query = query.eq('user_id', userId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (changedField) {
    query = query.contains('changed_fields', [changedField])
  }

  if (sort === 'top') {
    query = query
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
  } else if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query
      .order('total_votes', { ascending: true })
      .order('created_at', { ascending: false })
  }

  const pagedQuery = query.range(from, to)

  const { data, count, error } = await withSupabaseRetry(() => pagedQuery)

  if (error) {
    throw error
  }

  const suggestions = ((data as FeedbackSuggestionRow[] | null) ?? [])
    .map(mapSuggestionRow)
    .filter((entry): entry is FeedbackSuggestion => Boolean(entry))
  const total = count ?? 0

  return {
    data: await attachSuggestionItemTypes(suggestions),
    total,
    page: safePage,
    totalPages: total > 0 ? Math.ceil(total / safePageSize) : 0,
  }
}

export const hasOpenFeedbackSuggestions = async ({
  entityType,
  entityId,
}: {
  entityType: FeedbackEntityType
  entityId: number
}) => {
  const supabase = useSupabaseDataClient()
  const { count, error } = await withSupabaseRetry(() =>
    supabase
      .from('feedback_queue')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'open')
  )

  if (error) {
    throw error
  }

  return (count ?? 0) > 0
}

export const getFeedbackVotesForUser = async (
  suggestionIds: string[],
  userId: string
) => {
  if (suggestionIds.length === 0) {
    return {}
  }

  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('feedback_votes')
      .select('suggestion_id,vote_value')
      .eq('user_id', userId)
      .in('suggestion_id', suggestionIds)
  )

  if (error) {
    throw error
  }

  const entries: Array<[string, FeedbackVoteValue | null]> = []

  ;((data as FeedbackVoteRow[] | null) ?? []).forEach((row) => {
    if (!row.suggestion_id) return
    const voteValue = Number(row.vote_value)
    if (voteValue !== -1 && voteValue !== 1) {
      entries.push([row.suggestion_id, null])
      return
    }
    entries.push([row.suggestion_id, voteValue as FeedbackVoteValue])
  })

  return Object.fromEntries(entries) as Record<string, FeedbackVoteValue | null>
}

export const getFeedbackSuggestionById = async (id: string) => {
  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase.from('feedback_queue').select('*').eq('id', id).maybeSingle()
  )

  if (error) {
    throw error
  }

  const suggestion = mapSuggestionRow(
    (data as FeedbackSuggestionRow | null) ?? null
  )
  if (!suggestion) {
    return null
  }

  const [enrichedSuggestion] = await attachSuggestionItemTypes([suggestion])
  return enrichedSuggestion ?? null
}

export const getFeedbackSourceItem = async (
  entityId: number
): Promise<FeedbackSourceItem | null> => {
  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('items')
      .select(
        'id,type,item_attributes(item_id,item_type,category,subcategory,metadata)'
      )
      .eq('id', entityId)
      .maybeSingle()
  )

  if (error) {
    throw error
  }

  const row = (data as FeedbackSourceItemRow | null) ?? null
  if (!row?.id || !row.type) return null

  const entityValue = normalizeEntityId(row.id)
  if (entityValue === null) return null

  const rawAttributes = Array.isArray(row.item_attributes)
    ? (row.item_attributes[0] ?? null)
    : row.item_attributes

  const metadata = rawAttributes
    ? hydrateItemSearchMetadata({
        metadata: rawAttributes.metadata ?? null,
        itemId: rawAttributes.item_id ?? entityValue,
        itemType: rawAttributes.item_type ?? row.type,
        category: rawAttributes.category ?? null,
        subcategory: rawAttributes.subcategory ?? null,
      })
    : null

  return {
    entityType: 'item',
    entityId: entityValue,
    itemType: row.type,
    metadata,
  }
}

export const buildFeedbackCreationInput = ({
  entityType,
  entityId,
  metadata,
  itemType,
  nextSnapshot,
  userId,
}: {
  entityType: FeedbackEntityType
  entityId: number
  metadata: ItemSearchMetadata | null
  itemType?: string | null
  nextSnapshot: Record<string, unknown>
  userId: string
}): CreateFeedbackSuggestionInput => {
  const baseSnapshot = createItemTagFeedbackSnapshot(metadata, itemType)
  const normalizedNextSnapshot = normalizeItemTagFeedbackSnapshot(
    nextSnapshot,
    itemType
  )
  const proposedPatch = buildItemTagFeedbackPatch(
    baseSnapshot,
    normalizedNextSnapshot,
    itemType
  )

  if (!hasItemTagFeedbackChanges(proposedPatch)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Feedback has no changes',
      message: 'Feedback has no changes',
    })
  }

  return {
    entityType,
    entityId,
    baseSnapshot,
    proposedPatch,
    changedFields: Object.keys(proposedPatch) as ItemTagFeedbackField[],
    userId,
  }
}

const upsertFeedbackVote = async (
  suggestionId: string,
  userId: string,
  voteValue: FeedbackVoteValue
) => {
  const supabase = useSupabaseDataClient()
  const now = new Date().toISOString()
  const { error } = await withSupabaseRetry(() =>
    supabase.from('feedback_votes').upsert(
      {
        suggestion_id: suggestionId,
        user_id: userId,
        vote_value: voteValue,
        updated_at: now,
      } as never,
      {
        onConflict: 'suggestion_id,user_id',
        ignoreDuplicates: false,
      }
    )
  )

  if (error) {
    throw error
  }
}

export const createFeedbackSuggestion = async ({
  entityType,
  entityId,
  baseSnapshot,
  proposedPatch,
  changedFields,
  userId,
}: CreateFeedbackSuggestionInput) => {
  const supabase = useSupabaseDataClient()
  const baseSignature = createSignature(
    stableSerializeFeedbackRecord(baseSnapshot)
  )

  const now = new Date().toISOString()
  const insertPayload = {
    entity_type: entityType,
    entity_id: entityId,
    base_snapshot: baseSnapshot,
    base_signature: baseSignature,
    proposed_patch: proposedPatch,
    changed_fields: changedFields,
    status: 'open',
    user_id: userId,
    created_at: now,
    updated_at: now,
  }

  let insertedId: string | null = null

  try {
    const { data, error } = await withSupabaseRetry(() =>
      supabase
        .from('feedback_suggestions')
        .insert(insertPayload as never)
        .select('id')
        .single()
    )

    if (error) {
      throw error
    }

    insertedId = (data as { id?: string | null } | null)?.id ?? null
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Feedback already pending for this item',
        message: 'Feedback already pending for this item',
      })
    }

    throw error
  }

  if (!insertedId) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create feedback suggestion',
      message: 'Failed to create feedback suggestion',
    })
  }

  await upsertFeedbackVote(insertedId, userId, 1)

  const createdSuggestion = await getFeedbackSuggestionById(insertedId)
  if (!createdSuggestion) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load feedback suggestion',
      message: 'Failed to load feedback suggestion',
    })
  }

  return {
    suggestion: createdSuggestion,
  }
}

export const updateFeedbackVote = async ({
  suggestionId,
  userId,
  vote,
}: {
  suggestionId: string
  userId: string
  vote: FeedbackVoteValue | null
}) => {
  const supabase = useSupabaseDataClient()
  const suggestion = await getFeedbackSuggestionById(suggestionId)

  if (!suggestion) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Feedback suggestion not found',
      message: 'Feedback suggestion not found',
    })
  }

  if (suggestion.status !== 'open') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Feedback suggestion is closed',
      message: 'Feedback suggestion is closed',
    })
  }

  if (vote === null) {
    const { error } = await withSupabaseRetry(() =>
      supabase
        .from('feedback_votes')
        .delete()
        .eq('suggestion_id', suggestionId)
        .eq('user_id', userId)
    )

    if (error) {
      throw error
    }
  } else {
    await upsertFeedbackVote(suggestionId, userId, vote)
  }

  const updatedSuggestion = await getFeedbackSuggestionById(suggestionId)
  if (!updatedSuggestion) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load feedback suggestion',
      message: 'Failed to load feedback suggestion',
    })
  }

  return updatedSuggestion
}
