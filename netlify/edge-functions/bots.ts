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
    '/_nuxt/**',

    // Fonts and other internal assets
    '/_fonts/**',

    // Public images and static content
    '/images/**',
    '/.netlify/images', // Netlify Image CDN endpoint
    '/_ipx/**',

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
    '/__sitemap__/**',
    '/og.png',
  ] as `/${string}`[],
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

  // If path is not in excluded paths, redirect to error page
  if (!isExcluded) {
    return new URL('/error', request.url)
  }

  return context.next()
}
