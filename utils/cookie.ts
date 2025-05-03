import { useCookie } from '#imports'

export const set = (
  key: string,
  value: string,
  ttl: number = 24 * 60 * 60 * 1000
) => {
  const cookie = useCookie(key, {
    maxAge: Math.floor(ttl / 1000), // Convert milliseconds to seconds
  })
  cookie.value = value
}

export const get = (key: string): string | null => {
  const cookie = useCookie(key)
  return cookie.value || null
}

export const remove = (key: string): void => {
  const cookie = useCookie(key)
  cookie.value = null
}
