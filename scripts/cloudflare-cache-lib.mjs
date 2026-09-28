import { normalizeCacheTags } from './netlify-cache-lib.mjs'

const MAX_PURGE_TAGS = 100
const CLOUDFLARE_CACHE_TAG_PATTERNS = [
  /^(?:item|outfit|makeup|momo)-details$/,
  /^(?:item|outfit|makeup|momo)-detail-[1-9]\d*$/,
  /^item-search$/,
  /^stats$/,
  /^stats-(?:0|[1-9]\d*)$/,
]

export const isCloudflareCacheTag = (tag) =>
  CLOUDFLARE_CACHE_TAG_PATTERNS.some((pattern) => pattern.test(tag))

export const getCloudflareCacheTags = (tags) =>
  normalizeCacheTags(tags).filter(isCloudflareCacheTag)

export async function purgeCloudflareCache({
  tags,
  url = process.env.CLOUDFLARE_CACHE_PURGE_URL,
  token = process.env.CLOUDFLARE_DATA_TOKEN,
  fetchFn = globalThis.fetch,
  batchSize = MAX_PURGE_TAGS,
} = {}) {
  const purgeUrl = String(url ?? '').trim()
  const purgeToken = String(token ?? '').trim()

  if (!purgeUrl) {
    throw new Error(
      'CLOUDFLARE_CACHE_PURGE_URL is required to purge Cloudflare Worker cache'
    )
  }
  if (!purgeToken) {
    throw new Error(
      'CLOUDFLARE_DATA_TOKEN is required to purge Cloudflare Worker cache'
    )
  }
  if (typeof fetchFn !== 'function') {
    throw new Error('fetch is required to purge Cloudflare Worker cache')
  }

  const cacheTags = getCloudflareCacheTags(tags ?? [])
  if (cacheTags.length === 0) {
    throw new Error('At least one Cloudflare Worker cache tag is required')
  }

  const batches = []
  for (let index = 0; index < cacheTags.length; index += batchSize) {
    const batch = cacheTags.slice(index, index + batchSize)
    const response = await fetchFn(purgeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${purgeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags: batch }),
    })
    const text = await response.text().catch(() => '')
    if (!response.ok) {
      throw new Error(
        `Cloudflare Worker cache purge failed with ${response.status}: ${text}`
      )
    }
    batches.push({ status: response.status, body: text, cacheTags: batch })
  }

  return { cacheTags, batches }
}
