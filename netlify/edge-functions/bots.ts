import type { Context } from '@netlify/edge-functions'

export default async (
  request: Request,
  context: Context
): Promise<Response> => {
  const url = new URL(request.url)
  const path = url.pathname.toLowerCase()
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase()

  const blockedPaths: string[] = [
    '/@vite',
    '/.ds_store',
    '/.env',
    '/.git',
    '/.vscode',
    '/_all_dbs',
    '/actuator',
    '/apple-app-site-association',
    '/config.json',
    '/debug',
    '/ecp',
    '/info.php',
    '/index.html',
    '/login.action',
    '/php-cgi',
    '/server',
    '/server-status',
    '/telescope',
    '/v2/_catalog',
    '/wordpress',
    '/wp-admin',
  ]

  const blockedBots: string[] = [
    'ahrefsbot',
    'blexbot',
    'curl',
    'dotbot',
    'megaindex',
    'mj12bot',
    'petalbot',
    'python-requests',
    'seznambot',
    'semrushbot',
    'sogou',
    'wget',
    'yandexbot',
  ]

  if (blockedPaths.some((blocked) => path.startsWith(blocked))) {
    return new Response('Forbidden Path', { status: 403 })
  }

  if (blockedBots.some((bot) => userAgent.includes(bot))) {
    return new Response('Forbidden Bot', { status: 403 })
  }

  return context.next()
}
