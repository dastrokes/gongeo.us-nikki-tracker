import type { Context } from '@netlify/edge-functions'

const blockedUserAgents = [
  'nuclei',
  'go-http-client',
  'node/simplecrawler',
  'magpie-crawler',
  'blexbot',
  'gigabot',
  'barkrowler',
  'wikido',
  'riddler',
  'zoominfobot',
  'cazoodlebot',
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'yandexbot',
  'bytespider',
]

const botCategories = new Set([
  'ai-agent',
  'page-preview',
  'crawler',
  'tooling',
  'other',
  'none',
])

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  const normalizedUserAgent = userAgent.toLowerCase()
  return blockedUserAgents.some((blocked) =>
    normalizedUserAgent.includes(blocked)
  )
}

export default async (request: Request, context: Context) => {
  const categoryHeader = request.headers.get('netlify-agent-category')
  const category = categoryHeader?.toLowerCase().split(';')[0]

  if (category && !botCategories.has(category)) {
    return context.next()
  }

  if (isBlockedUserAgent(request.headers.get('user-agent'))) {
    return new Response('Forbidden', { status: 403 })
  }

  return context.next()
}
