import type { Context, Config } from '@netlify/edge-functions'

export const config: Config = {
  path: ['/*'],
  excludedPath: [
    '/', // homepage
    '/about',
    '/banner',
    '/banner/*',
    '/faq',
    '/global',
    '/import',
    '/tracker',
    '/en',
    '/en/*',
    '/de',
    '/de/*',
    // Add more locales as needed...

    // Static Nuxt assets
    '/_nuxt/**',

    // Fonts and other internal assets
    '/_fonts/**',

    // Public images and static content
    '/images/**',
    '/.netlify/images', // Netlify Image CDN endpoint

    // Other static files
    '/apple-touch-icon*.png',
    '/favicon.ico',
    '/gongeous.js',
    '/robots.txt',
    '/sitemap.xml',
    '/og.png',
  ],
}

// Malicious bots only (strict, no legit crawlers included)
const blockedBots = [
  'curl',
  'wget',
  'python-requests',
  'censys',
  'zoomeye',
  'linkextractor',
  'binance',
  'scrapy',
  'httpclient',
  'http_get',
]

// Blocklist of common sensitive paths targeted by bots
const blockedKeywords = [
  '@vite',
  '.ds_store',
  '.env',
  '.git',
  '.svn',
  '.vscode',
  '.well-known',
  '_all_dbs',
  'actuator',
  'admin',
  'ads.txt',
  'apple-app-site-association',
  'autoload',
  'backup',
  'bak',
  'blog',
  'catalog',
  'config',
  'console',
  'cpanel',
  'crossdomain',
  'debug',
  'ecp',
  'elmah',
  'env',
  'error',
  'info',
  'index',
  'jenkins',
  'jmx',
  'login',
  'logout',
  'mysql',
  'opt',
  'pma',
  'php',
  'proxyheader',
  'root',
  'server',
  'setup',
  'shell',
  'sftp',
  'sql',
  'status',
  'swagger',
  'telescope',
  'test',
  'upload',
  'version',
  'web-console',
  'wordpress',
  'wp',
  'xdebug',
  'xmlrpc',
  'owa',
]

export default (
  request: Request,
  context: Context
): Response | Promise<Response> => {
  const url = new URL(request.url)
  const path = url.pathname
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .toLowerCase()
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase()

  // Check for malicious path patterns
  if (blockedKeywords.some((keyword) => path.includes(keyword))) {
    return new Response(null, { status: 404 })
  }

  // Check for malicious bots
  if (blockedBots.some((bot) => userAgent.includes(bot))) {
    return new Response(null, { status: 404 })
  }

  return context.next()
}
