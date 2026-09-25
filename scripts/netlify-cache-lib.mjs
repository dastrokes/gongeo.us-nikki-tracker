const NETLIFY_PURGE_URL = 'https://api.netlify.com/api/v1/purge'
const MAX_PURGE_TAGS = 500

export const normalizeCacheTags = (tags) => [
  ...new Set(tags.map((tag) => String(tag ?? '').trim()).filter(Boolean)),
]

export const batchCacheTags = (tags, batchSize = MAX_PURGE_TAGS) => {
  const normalized = normalizeCacheTags(tags)
  const batches = []

  for (let index = 0; index < normalized.length; index += batchSize) {
    batches.push(normalized.slice(index, index + batchSize))
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
