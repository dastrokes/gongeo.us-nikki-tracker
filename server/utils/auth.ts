import type { User } from '@supabase/supabase-js'
import { createError, getHeader, type H3Event } from 'h3'

import { useSupabaseClient } from '~/composables/useSupabaseClient'

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
    String(process.env.ITEM_SEARCH_MAINTAINER_EMAILS ?? '')
      .split(/[,\n]/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  )

export const isLocalItemSearchMaintainerMode = () =>
  String(process.env.ITEM_SEARCH_MAINTAINER_MODE ?? '')
    .trim()
    .toLowerCase() === 'local'

export const isItemSearchMaintainerUser = (user: User | null) => {
  if (!user?.email || !isLocalItemSearchMaintainerMode()) {
    return false
  }

  return getItemSearchMaintainerEmailSet().has(user.email.trim().toLowerCase())
}

export const getAuthenticatedUser = async (
  event: H3Event
): Promise<User | null> => {
  const token = getBearerToken(event)
  if (!token) return null

  const supabase = useSupabaseClient('server')
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

export const requireLocalItemSearchMaintainerUser = async (event: H3Event) => {
  const user = await requireAuthenticatedUser(event)
  if (isItemSearchMaintainerUser(user)) {
    return user
  }

  throw createError({
    statusCode: 403,
    statusMessage: 'Maintainer access is only available locally',
    message: 'Maintainer access is only available locally',
  })
}
