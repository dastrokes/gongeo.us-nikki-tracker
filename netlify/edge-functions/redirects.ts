import type { Context } from '@netlify/edge-functions'

const localeCodes = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ja', 'ko', 'zh', 'tw']

const singularToPlural = {
  banner: 'banners',
  outfit: 'outfits',
  item: 'items',
} as const

function normalizePath(pathname: string): string {
  const cleaned = pathname.replace(/\/+/g, '/').replace(/\/$/, '').toLowerCase()
  return cleaned.length ? cleaned : '/'
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const path = normalizePath(url.pathname)
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) {
    return context.next()
  }

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
    console.log('redirects:', {
      from: path,
      to: targetPath,
    })
    return Response.redirect(redirectUrl.toString(), 301)
  }

  return context.next()
}
