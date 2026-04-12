import type {
  ItemSearchAdvancedScalarField,
  ItemSearchArrayField,
} from './itemSearch'

export type FeedbackEntityType = 'item' | 'outfit'

export type FeedbackSuggestionStatus =
  | 'open'
  | 'accepted'
  | 'rejected'
  | 'applied'

export type FeedbackSortKey = 'needs-review' | 'top' | 'new'
export type FeedbackReviewState = 'unreviewed' | 'all' | 'voted'
export type FeedbackScope = 'all' | 'mine'

export type FeedbackVoteValue = -1 | 1
export type FeedbackMaintainerAction = 'approve' | 'reject' | 'apply'

export type ItemTagFeedbackScalarField =
  | 'category'
  | 'subcategory'
  | ItemSearchAdvancedScalarField

export type ItemTagFeedbackMultiField = ItemSearchArrayField
export type ItemTagFeedbackField =
  | ItemTagFeedbackScalarField
  | ItemTagFeedbackMultiField
export type ItemTagFeedbackValue = string | string[] | null

export type ItemTagFeedbackSnapshot = Partial<
  Record<ItemTagFeedbackField, ItemTagFeedbackValue>
>

export type ItemTagFeedbackPatch = ItemTagFeedbackSnapshot

export interface FeedbackSuggestion {
  id: string
  entityType: FeedbackEntityType
  entityId: number
  itemType: string | null
  baseSnapshot: ItemTagFeedbackSnapshot
  baseSignature: string
  proposedPatch: ItemTagFeedbackPatch
  changedFields: ItemTagFeedbackField[]
  status: FeedbackSuggestionStatus
  userId: string | null
  createdAt: string
  updatedAt: string
  agreeCount: number
  disagreeCount: number
  score: number
  totalVotes: number
}

export interface FeedbackListResponse {
  data: FeedbackSuggestion[]
  total: number
  page: number
  totalPages: number
}

export interface FeedbackViewerStateResponse {
  votes: Record<string, FeedbackVoteValue | null>
  isMaintainer: boolean
}

export interface SubmitFeedbackResponse {
  suggestion: FeedbackSuggestion
}

export interface VoteFeedbackResponse {
  suggestion: FeedbackSuggestion
  vote: FeedbackVoteValue | null
}

export interface FeedbackMaintainerActionRequest {
  suggestionId: string
  action: FeedbackMaintainerAction
}

export interface FeedbackMaintainerApplyResult {
  applyId: string
  touchedItemIds: number[]
  searchNamespaces: string[]
}

export interface FeedbackMaintainerActionResponse {
  suggestion: FeedbackSuggestion
  applyResult: FeedbackMaintainerApplyResult | null
}
