import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { createError } from 'h3'

import type {
  FeedbackMaintainerAction,
  FeedbackMaintainerActionRequest,
  FeedbackMaintainerActionResponse,
  FeedbackSuggestion,
} from '#shared/types/feedback'
import { toErrorMessage } from '#shared/utils/errors'

type PublishScriptResult = {
  publishId?: string | null
  reportPath?: string | null
  touchedItemIds?: unknown
}

let maintainerActionInFlight = false

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const createConflictError = (message: string) =>
  createError({
    statusCode: 409,
    statusMessage: message,
    message,
  })

const normalizeAction = (value: unknown): FeedbackMaintainerAction => {
  if (value === 'approve' || value === 'reject' || value === 'apply') {
    return value
  }

  throw createBadRequestError('Invalid feedback maintainer action')
}

const parseScriptJson = <T>(stdout: string, scriptPath: string): T => {
  const normalized = stdout.trim()
  if (!normalized) {
    throw new Error(`Script returned no JSON output: ${scriptPath}`)
  }

  try {
    return JSON.parse(normalized) as T
  } catch (error) {
    throw new Error(
      `Failed to parse JSON output from ${path.basename(scriptPath)}: ${toErrorMessage(error)}`
    )
  }
}

const runNodeScript = <T>({
  scriptRelativePath,
  args,
}: {
  scriptRelativePath: string
  args: string[]
}) => {
  const scriptPath = path.resolve(process.cwd(), scriptRelativePath)
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    stdio: 'pipe',
  })

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        result.stdout?.trim() ||
        `Script failed with exit code ${result.status ?? 'unknown'}: ${scriptPath}`
    )
  }

  return parseScriptJson<T>(result.stdout ?? '', scriptPath)
}

const normalizeTouchedItemIds = (value: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry))
        .map((entry) => Math.floor(entry))
    )
  ).sort((left, right) => left - right)

const extractApplyResult = (publishResult: PublishScriptResult) => {
  const publishId =
    typeof publishResult.publishId === 'string' &&
    publishResult.publishId.trim()
      ? publishResult.publishId.trim()
      : null
  const reportPath =
    typeof publishResult.reportPath === 'string' &&
    publishResult.reportPath.trim()
      ? publishResult.reportPath.trim()
      : null

  if (!publishId || !reportPath) {
    throw new Error('Publish script did not return publish metadata')
  }

  return {
    publishId,
    reportPath,
    touchedItemIds: normalizeTouchedItemIds(publishResult.touchedItemIds),
  }
}

const requireItemSuggestion = (suggestion: FeedbackSuggestion) => {
  if (suggestion.entityType !== 'item') {
    throw createBadRequestError('Only item feedback is supported')
  }

  return suggestion
}

const runApplyAction = ({
  suggestion,
  suggestionId,
  maintainer,
}: {
  suggestion: FeedbackSuggestion
  suggestionId: string
  maintainer: string
}) => {
  requireItemSuggestion(suggestion)

  if (suggestion.status === 'open') {
    const publishResult = runNodeScript<PublishScriptResult>({
      scriptRelativePath: 'scripts/item-search-publish.mjs',
      args: [
        '--scope',
        'feedback-selected',
        '--overrides-only',
        '--feedback-id',
        suggestionId,
        '--maintainer',
        maintainer,
      ],
    })

    return extractApplyResult(publishResult)
  }

  if (suggestion.status === 'accepted') {
    const publishResult = runNodeScript<PublishScriptResult>({
      scriptRelativePath: 'scripts/item-search-publish.mjs',
      args: [
        '--scope',
        'item-ids',
        '--overrides-only',
        '--item-id',
        String(suggestion.entityId),
        '--maintainer',
        maintainer,
      ],
    })
    const applyResult = extractApplyResult(publishResult)

    runNodeScript({
      scriptRelativePath: 'scripts/item-search-feedback.mjs',
      args: ['mark-applied', '--id', suggestionId],
    })

    return applyResult
  }

  throw createBadRequestError(
    'Only open or accepted suggestions can be applied'
  )
}

export default defineEventHandler(async (event) => {
  if (maintainerActionInFlight) {
    throw createConflictError('Another feedback maintainer action is running')
  }

  maintainerActionInFlight = true

  try {
    const user = await requireLocalItemSearchMaintainerUser(event)
    const body = (await readBody(event)) as FeedbackMaintainerActionRequest
    const suggestionId =
      typeof body?.suggestionId === 'string' ? body.suggestionId.trim() : ''
    const action = normalizeAction(body?.action)

    if (!suggestionId) {
      throw createBadRequestError('Feedback suggestion id is required')
    }

    const suggestion = await getFeedbackSuggestionById(suggestionId)
    if (!suggestion) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feedback suggestion not found',
        message: 'Feedback suggestion not found',
      })
    }

    const maintainer = user.email?.trim() || user.id
    let applyResult = null

    if (action === 'approve') {
      if (suggestion.status !== 'open') {
        throw createBadRequestError('Only open suggestions can be approved')
      }

      runNodeScript({
        scriptRelativePath: 'scripts/item-search-feedback.mjs',
        args: ['promote', '--id', suggestionId, '--maintainer', maintainer],
      })
    } else if (action === 'reject') {
      if (suggestion.status !== 'open' && suggestion.status !== 'accepted') {
        throw createBadRequestError(
          'Only open or accepted suggestions can be rejected'
        )
      }

      runNodeScript({
        scriptRelativePath: 'scripts/item-search-feedback.mjs',
        args: ['reject', '--id', suggestionId, '--maintainer', maintainer],
      })
    } else {
      applyResult = runApplyAction({
        suggestion,
        suggestionId,
        maintainer,
      })
    }

    const refreshedSuggestion = await getFeedbackSuggestionById(suggestionId)
    if (!refreshedSuggestion) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to refresh feedback suggestion',
        message: 'Failed to refresh feedback suggestion',
      })
    }

    return {
      suggestion: refreshedSuggestion,
      applyResult,
    } satisfies FeedbackMaintainerActionResponse
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      throw error
    }

    const message = toErrorMessage(
      error,
      'Failed to run feedback maintainer action'
    )
    console.error(`Failed to run feedback maintainer action: ${message}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to run feedback maintainer action',
      message: 'Failed to run feedback maintainer action',
    })
  } finally {
    maintainerActionInFlight = false
  }
})
