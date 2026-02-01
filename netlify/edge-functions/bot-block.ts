import type { Context } from '@netlify/edge-functions'

// All entries are lowercase and matched as substrings against the UA header.
const blockedUserAgents = [
  // Security scanners / brute-force tooling
  'acunetix',
  'dirb',
  'dirbuster',
  'gobuster',
  'masscan',
  'netsparker',
  'nikto',
  'nmap',
  'nuclei',
  'openvas',
  'sqlmap',
  'wpscan',
  'zgrab',

  // SEO / backlink / data crawlers
  'ahrefsbot',
  'blexbot',
  'ccbot',
  'dotbot',
  'exabot',
  'linkdexbot',
  'megaindex',
  'mj12bot',
  'rogerbot',
  'seznambot',
  'semrushbot',
  'serpstatbot',
  'sistrix',

  // Data aggregators / legacy crawlers
  'barkrowler',
  'cazoodlebot',
  'gigabot',
  'magpie-crawler',
  'riddler',
  'wikido',
  'zoominfobot',

  // Tooling / libraries
  'go-http-client',
  'node/simplecrawler',
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
  const pathname = new URL(request.url).pathname
  if (pathname === '/robots.txt') {
    return context.next()
  }

  const categoryHeader = request.headers.get('netlify-agent-category')
  const category = categoryHeader?.toLowerCase().split(';')[0]

  if (category && !botCategories.has(category)) {
    return context.next()
  }

  const userAgent = request.headers.get('user-agent')
  if (isBlockedUserAgent(userAgent)) {
    console.log('bot-block:', {
      path: pathname,
      userAgent,
      category,
    })
    return new Response('Forbidden', { status: 403 })
  }

  if (category && category !== 'none') {
    console.log('bot-allow:', {
      path: pathname,
      userAgent,
      category,
    })
  }

  return context.next()
}
