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
    '/zh',
    '/zh/*',
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
    '/favicon.ico',
    '/robots.txt',
    '/gongeous.js',
    '/sitemap.xml',
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
  '_all_dbs',
  'actuator',
  'admin',
  'ads.txt',
  'apple-app-site-association',
  'autoload.php',
  'backup',
  'bak',
  'config',
  'config.json',
  'config.php',
  'console',
  'cpanel',
  'crossdomain.xml',
  'debug',
  'ecp',
  'elmah.axd',
  'env.php',
  'error.log',
  'info.php',
  'index.html',
  'jenkins',
  'jmx-console',
  'login',
  'login.action',
  'logout',
  'mysql',
  'pma',
  'php-cgi',
  'phpinfo',
  'phpmyadmin',
  'proxyheader.php',
  'root',
  'server',
  'server-info',
  'server-status',
  'setup-config.php',
  'shell',
  'sftp-config.json',
  'sql',
  'sqladmin',
  'status',
  'swagger',
  'telescope',
  'test',
  'upload',
  'v2/_catalog',
  'version',
  'web-console',
  'wordpress',
  'wp-admin',
  'wp-content',
  'wp-includes',
  'wp-json',
  'wp-login',
  'wp-login.php',
  'xdebug',
  'xmlrpc.php',
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
