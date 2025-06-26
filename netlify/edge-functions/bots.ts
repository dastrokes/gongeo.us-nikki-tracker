import type { Context, Config } from '@netlify/edge-functions'

// Define locales directly with just language codes
const defaultLocale = 'en'
const localeCodes = ['en', 'de', 'zh']

const localePaths = localeCodes
  .filter((code) => code !== defaultLocale)
  .flatMap((code) => [`/${code}`, `/${code}/*`]) as `/${string}`[]

export const config: Config = {
  path: ['/*'],
  excludedPath: [
    '/',
    '/about',
    '/banner',
    '/banner/*',
    '/faq',
    '/global',
    '/import',
    '/tracker',

    ...localePaths,

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
    '/*sitemap*',
    '/og.png',
  ] as `/${string}`[],
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
  'conf',
  'console',
  'cpanel',
  'credential',
  'crossdomain',
  'db',
  'debug',
  'ecp',
  'elmah',
  'env',
  'error',
  'helper',
  'info',
  'index',
  'ipfs',
  'jenkins',
  'jmx',
  'log',
  'login',
  'logout',
  'main',
  'maven',
  'mysql',
  'opt',
  'owa',
  'pma',
  'php',
  'properties',
  'proxyheader',
  'py',
  'root',
  'server',
  'service',
  'setting',
  'setup',
  'shell',
  'sftp',
  'sql',
  'ssh',
  'status',
  'swagger',
  'telescope',
  'test',
  'upload',
  'version',
  'web-console',
  'wordpress',
  'wp',
  'user',
  'utility',
  'xdebug',
  'xmlrpc',
  'yaml',
  'yml',
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
