import type { Context, Config } from '@netlify/edge-functions'

// Define locales directly with just language codes
const defaultLocale = 'en'
const localeCodes = ['en', 'de', 'zh']

// Define the specific routes that exist in the application
const definedRoutes = [
  '/',
  '/about',
  '/faq',
  '/global',
  '/import',
  '/login',
  '/timeline',
  '/tracker',
  '/banner',
  '/banner/:id',
  '/error',
]

const localePaths = localeCodes
  .filter((code) => code !== defaultLocale)
  .flatMap((code) =>
    definedRoutes.map((route) =>
      route === '/' ? `/${code}` : `/${code}${route}`
    )
  ) as `/${string}`[]

export const config: Config = {
  path: ['/*'],
  excludedPath: [
    ...definedRoutes,
    ...localePaths,

    // APIs
    '/api/ping',
    '/api/stats',

    // Static Nuxt assets
    '/_nuxt/**.js',
    '/_nuxt/**.js.map',

    // Nuxt payload files
    '**/_payload.json',

    // i18n files
    '/_i18n/**/messages.json',

    // Fonts and other internal assets
    '/_fonts/**.woff',
    '/_fonts/**.woff2',

    // Public images and static content
    '/images/**.webp',
    '/.netlify/images/**.webp', // Netlify Image CDN endpoint
    '/_ipx/**.webp',

    // Other static files
    '/apple-touch-icon*.png',
    '/favicon.ico',
    '/gongeous.js',
    '/66641125bbad403d994c7d7af32e196b.txt',
    '/robots.txt',
    '/llms.txt',
    '/ads.txt',
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/__sitemap__/**.xml',
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
  const url = new URL(request.url)
  const path = url.pathname
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .toLowerCase()

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
