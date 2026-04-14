import type { User } from '@supabase/supabase-js'
import { createError, getHeader, type H3Event } from 'h3'

const DEFAULT_ITEM_SEARCH_MAINTAINER_ALLOWED_HOSTS = [
  'gongeo.us',
  'www.gongeo.us',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
] as const

const getBearerToken = (event: H3Event) => {
  const authorization = getHeader(event, 'authorization')
  if (!authorization) return null

  const [scheme, token] = authorization.split(' ', 2)
  if (!scheme || !token) return null
  if (scheme.toLowerCase() !== 'bearer') return null

  const normalized = token.trim()
  return normalized || null
}

const getItemSearchMaintainerEmailSet = () =>
  new Set(
    String(process.env.MAINTAINER_EMAILS ?? '')
      .split(/[,\n]/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  )

const normalizeRequestHost = (value?: string | null) => {
  const candidate = value?.split(',')[0]?.trim().toLowerCase()
  if (!candidate) return null

  const withoutProtocol = candidate.replace(/^https?:\/\//, '')
  if (withoutProtocol.startsWith('[')) {
    const endBracketIndex = withoutProtocol.indexOf(']')
    return endBracketIndex === -1
      ? withoutProtocol.replace(/\.$/, '')
      : withoutProtocol.slice(0, endBracketIndex + 1).replace(/\.$/, '')
  }

  return withoutProtocol.split(':')[0]?.replace(/\.$/, '') || null
}

const getItemSearchMaintainerAllowedHostSet = () =>
  new Set(
    [
      ...DEFAULT_ITEM_SEARCH_MAINTAINER_ALLOWED_HOSTS,
      ...String(process.env.ITEM_SEARCH_MAINTAINER_ALLOWED_HOSTS ?? '')
        .split(/[,\n]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ]
      .map((entry) => normalizeRequestHost(entry))
      .filter((entry): entry is string => Boolean(entry))
  )

const getRequestHost = (event: H3Event) =>
  normalizeRequestHost(
    getHeader(event, 'x-forwarded-host') ?? getHeader(event, 'host')
  )

const isItemSearchMaintainerHost = (event: H3Event) => {
  const requestHost = getRequestHost(event)
  if (!requestHost) return false

  return getItemSearchMaintainerAllowedHostSet().has(requestHost)
}

export const isItemSearchMaintainerUser = (
  user: User | null,
  event: H3Event
) => {
  if (!user?.email || !isItemSearchMaintainerHost(event)) {
    return false
  }

  return getItemSearchMaintainerEmailSet().has(user.email.trim().toLowerCase())
}

export const getAuthenticatedUser = async (
  event: H3Event
): Promise<User | null> => {
  const token = getBearerToken(event)
  if (!token) return null

  const supabase = useSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

export const requireAuthenticatedUser = async (event: H3Event) => {
  const user = await getAuthenticatedUser(event)
  if (user) return user

  throw createError({
    statusCode: 401,
    statusMessage: 'Authentication required',
    message: 'Authentication required',
  })
}

export const requireItemSearchMaintainerUser = async (event: H3Event) => {
  const user = await requireAuthenticatedUser(event)
  if (isItemSearchMaintainerUser(user, event)) {
    return user
  }

  throw createError({
    statusCode: 403,
    statusMessage:
      'Maintainer access is not available for this account or host',
    message: 'Maintainer access is not available for this account or host',
  })
}
