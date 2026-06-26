const NETLIFY_PURGE_URL = 'https://api.netlify.com/api/v1/purge'
const MAX_PURGE_TAGS = 500
const ITEM_SEARCH_TAG = 'item-search'

export const itemDetailCacheId = (id) => `item-detail-${String(id).trim()}`

export const normalizeCacheTags = (tags) => [
  ...new Set(
    tags
      .map((tag) => String(tag ?? '').trim())
      .filter(Boolean)
  ),
]

export const buildItemSearchCacheTags = (itemIds, { localesOnly = false } = {}) => {
  if (localesOnly) return [ITEM_SEARCH_TAG]

  return normalizeCacheTags([
    ITEM_SEARCH_TAG,
    ...itemIds.map((id) => itemDetailCacheId(id)),
  ])
}

export const batchCacheTags = (tags, batchSize = MAX_PURGE_TAGS) => {
  const normalized = normalizeCacheTags(tags)
  const withoutItemSearch = normalized.filter((tag) => tag !== ITEM_SEARCH_TAG)
  const ordered = normalized.includes(ITEM_SEARCH_TAG)
    ? [ITEM_SEARCH_TAG, ...withoutItemSearch]
    : withoutItemSearch
  const batches = []

  for (let index = 0; index < ordered.length; index += batchSize) {
    batches.push(ordered.slice(index, index + batchSize))
  }

  return batches
}

export async function purgeNetlifyCache({
  tags,
  siteId = process.env.NETLIFY_SITE_ID,
  token = process.env.NETLIFY_AUTH_TOKEN,
  fetchFn = globalThis.fetch,
  batchSize = MAX_PURGE_TAGS,
} = {}) {
  if (!siteId) {
    throw new Error('NETLIFY_SITE_ID is required to purge Netlify cache')
  }

  if (!token) {
    throw new Error('NETLIFY_AUTH_TOKEN is required to purge Netlify cache')
  }

  if (typeof fetchFn !== 'function') {
    throw new Error('fetch is required to purge Netlify cache')
  }

  const batches = batchCacheTags(tags ?? [], batchSize)
  if (batches.length === 0) {
    throw new Error('At least one cache tag is required to purge Netlify cache')
  }

  const results = []

  for (const batch of batches) {
    const response = await fetchFn(NETLIFY_PURGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site_id: siteId,
        cache_tags: batch,
      }),
    })

    const text = await response.text().catch(() => '')
    if (!response.ok) {
      throw new Error(
        `Netlify cache purge failed with ${response.status}: ${text}`
      )
    }

    results.push({
      status: response.status,
      body: text,
      cacheTags: batch,
    })
  }

  return {
    cacheTags: batches.flat(),
    batches: results,
  }
}
