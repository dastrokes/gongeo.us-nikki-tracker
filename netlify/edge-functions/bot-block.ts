import type { Context } from '@netlify/edge-functions'

// All entries are lowercase and matched as substrings against the UA header.
// Keep this as a hard-block list only for low-value / abusive / high-cost agents.
// Do NOT add useful search, ad, image, or social-preview bots here.

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

  // AI / model / commercial data crawlers
  'amazonbot',
  'anthropic-ai',
  'applebot-extended',
  'bytespider',
  'claudebot',
  'claude-searchbot',
  'cohere-ai',
  'diffbot',
  'facebookbot',
  'google-extended',
  'gptbot',
  'imagesiftbot',
  'meta-externalagent',
  'meta-webindexer',
  'omigili',
  'omigilibot',

  // SEO / backlink / rank-tracking crawlers
  'ahrefsbot',
  'blexbot',
  'dotbot',
  'exabot',
  'linkdexbot',
  'megaindex',
  'mj12bot',
  'rogerbot',
  'semrushbot',
  'serankingbacklinksbot',
  'serpstatbot',
  'seznambot',
  'sistrix',

  // Broad data aggregators / legacy crawlers
  'barkrowler',
  'cazoodlebot',
  'ccbot',
  'gigabot',
  'magpie-crawler',
  'proximic',
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
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === '/robots.txt') {
    return context.next()
  }

  const categoryHeader = request.headers.get('netlify-agent-category')
  const category = categoryHeader?.toLowerCase().split(';')[0]

  const userAgent = request.headers.get('user-agent')
  if (isBlockedUserAgent(userAgent)) {
    console.log('bot-block:', {
      path: pathname,
      userAgent,
      category,
    })
    return new Response('Forbidden', { status: 403 })
  }

  if (category && !botCategories.has(category)) {
    return context.next()
  }

  const sitemapMatch = pathname.match(/^\/__sitemap__\/([A-Za-z-]+)\.xml$/)
  if (sitemapMatch) {
    const locale = sitemapMatch[1]
    if (!locale) {
      return context.next()
    }

    let targetLocale: string | null = null

    if (locale === 'zh-Hant') {
      targetLocale = 'zh-CN'
    } else if (locale === 'zh-Hans') {
      targetLocale = 'zh-TW'
    } else if (
      locale.includes('-') &&
      locale !== 'zh-CN' &&
      locale !== 'zh-TW'
    ) {
      const [baseLocale] = locale.split('-')
      targetLocale = (baseLocale ?? locale).toLowerCase()
    }

    if (targetLocale && targetLocale !== locale) {
      url.pathname = `/__sitemap__/${targetLocale}.xml`
      return Response.redirect(url.toString(), 301)
    }
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
