import { createHash, createHmac } from 'node:crypto'

const requireEnvironmentValue = (name: string) => {
  const value = process.env[name]?.trim() ?? ''
  if (!value) throw new Error(`${name} is required for feedback`)
  return value
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)])
  )
}

const stableStringify = (value: unknown) => JSON.stringify(stableValue(value))

export const createCatalogFeedbackApplyRequest = ({
  suggestion,
  searchTexts,
}: {
  suggestion: FeedbackSuggestion
  searchTexts: Record<'en' | 'zh', string>
}): FeedbackCatalogApplyRequest => {
  const body: FeedbackCatalogApplyBody = {
    operationId: `feedback-apply-${suggestion.id}`,
    baseSnapshot: suggestion.baseSnapshot,
    proposedPatch: suggestion.proposedPatch,
    changedFields: suggestion.changedFields,
    searchTexts,
  }

  const payload = Buffer.from(
    JSON.stringify({
      bodyHash: createHash('sha256')
        .update(stableStringify(body))
        .digest('base64url'),
      expiresAt: Math.floor(Date.now() / 1000) + 300,
      itemId: suggestion.entityId,
    })
  ).toString('base64url')
  const signature = createHmac(
    'sha256',
    requireEnvironmentValue('CLOUDFLARE_DATA_TOKEN')
  )
    .update(payload)
    .digest('base64url')

  return {
    token: `v1.${payload}.${signature}`,
    body,
  }
}
