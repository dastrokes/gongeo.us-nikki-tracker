import { purgeCache } from '@netlify/functions'

export const purgeNetlifyCacheIds = async (
  cacheIds: readonly string[]
): Promise<string[]> => {
  const tags = [
    ...new Set(cacheIds.map((cacheId) => cacheId.trim()).filter(Boolean)),
  ]

  if (tags.length === 0) return []

  await purgeCache({
    tags,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  })

  return tags
}
