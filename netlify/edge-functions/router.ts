import type { Context, Config } from '@netlify/edge-functions'

// Define locales directly with just language codes
const defaultLocale = 'en'
const localeCodes = [
  'en',
  'de',
  'es',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'pt',
  'th',
  'tw',
  'zh',
]

// Define the specific routes that exist in the application
const definedRoutes = [
  '/',
  '/about',
  '/faq',
  '/global',
  '/import',
  '/login',
  '/timeline',
  '/quiz',
  '/tracker',
  '/banners',
  '/banners/:id',
  '/outfits',
  '/outfits/:id',
  '/items',
  '/items/:id',
  '/vote',
  '/ranking',
  '/error',
]

const localePaths = localeCodes
  .filter((code) => code !== defaultLocale)
  .flatMap((code) =>
    definedRoutes.map((route) =>
      route === '/' ? `/${code}` : `/${code}${route}`
    )
  ) as `/${string}`[]

const singularToPlural = {
  banner: 'banners',
  outfit: 'outfits',
  item: 'items',
} as const

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

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  const normalizedUserAgent = userAgent.toLowerCase()
  return blockedUserAgents.some((blocked) =>
    normalizedUserAgent.includes(blocked)
  )
}

export const config: Config = {
  path: ['/*'],
  excludedPath: [
    ...definedRoutes,
    ...localePaths,

    // APIs
    '/api/ping',
    '/api/stats',
    '/api/items',
    '/api/items/:id',
    '/api/outfits',
    '/api/outfits/:id',

    // Static Nuxt assets
    '/_nuxt/**.json',
    '/_nuxt/**.js',
    '/_nuxt/**.js.map',
    '/_nuxt/**.css',

    // Nuxt payload files
    '**/_payload.json',

    // i18n files
    '/_i18n/**/messages.json',

    // Fonts and other internal assets
    '/_fonts/**.woff',
    '/_fonts/**.woff2',

    // Public images and static content
    '/images/**.png',
    '/.netlify/images**', // Netlify Image CDN endpoint
    '/_ipx/**',

    // Other static files
    '/apple-touch-icon*.png',
    '/favicon.ico',
    '/loading.webp',
    '/bg.webp',
    '/gongeous.js',
    '/66641125bbad403d994c7d7af32e196b.txt',
    '/robots.txt',
    '/ads.txt',
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/__sitemap__/en.xml',
    '/__sitemap__/de.xml',
    '/__sitemap__/es.xml',
    '/__sitemap__/fr.xml',
    '/__sitemap__/id.xml',
    '/__sitemap__/it.xml',
    '/__sitemap__/ja.xml',
    '/__sitemap__/ko.xml',
    '/__sitemap__/pt.xml',
    '/__sitemap__/th.xml',
    '/__sitemap__/zh-TW.xml',
    '/__sitemap__/zh-CN.xml',
    '/__sitemap__/style.xsl',
    '/og.png',
  ] as `/${string}`[],
}

// Helper function to parse cookies
function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim())
  const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`))

  return targetCookie ? targetCookie.split('=')[1] || null : null
}

export default async (request: Request, context: Context) => {
  if (isBlockedUserAgent(request.headers.get('user-agent'))) {
    return new Response('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const path = url.pathname
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .toLowerCase()

  const segments = path.split('/').filter(Boolean)
  const maybeLocale =
    segments[0] && localeCodes.includes(segments[0]) ? segments[0] : null
  const singular = maybeLocale ? segments[1] : segments[0]

  if (singular && singular in singularToPlural) {
    const plural = singularToPlural[singular as keyof typeof singularToPlural]
    const rest = segments.slice(maybeLocale ? 2 : 1)
    const targetPath = `/${maybeLocale ? `${maybeLocale}/` : ''}${plural}${
      rest.length ? `/${rest.join('/')}` : ''
    }`
    const redirectUrl = new URL(targetPath + url.search, url.origin)
    return Response.redirect(redirectUrl.toString(), 301)
  }

  // Check if the path matches any excluded path pattern
  const excludedPaths = Array.isArray(config.excludedPath)
    ? config.excludedPath
    : [config.excludedPath]
  const isExcluded = excludedPaths.some((excludedPath) => {
    if (!excludedPath) return false
    // Convert excluded path to regex pattern
    const pattern = excludedPath
      .replace(/\*/g, '.*') // Convert * to .*
      .replace(/:/g, '[^/]+') // Convert :param to [^/]+
      .replace(/\//g, '\\/') // Escape forward slashes
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(path)
  })

  // If path is not in excluded paths, redirect to appropriate error page
  if (!isExcluded) {
    // Get locale from cookies
    const cookieHeader = request.headers.get('cookie')
    const detectedLocale =
      getCookieValue(cookieHeader, 'i18n_redirected') ||
      getCookieValue(cookieHeader, 'locale')

    // Validate and use the detected locale
    const validLocale =
      detectedLocale &&
      localeCodes.includes(detectedLocale) &&
      detectedLocale !== defaultLocale
        ? detectedLocale
        : null

    // Redirect to the appropriate error page
    const errorPath = validLocale ? `/${validLocale}/error` : '/error'
    return new URL(errorPath, request.url)
  }

  return context.next()
}
