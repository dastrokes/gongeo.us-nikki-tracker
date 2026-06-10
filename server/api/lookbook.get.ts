import type { H3Event } from 'h3'

const LOOKBOOK_API_BASE_URL = 'https://api-nikki.ranaxro.com/conv-clothdiydata'
const LOOKBOOK_CODE_PATTERN = /^[A-Za-z0-9]{11}#$/
const LOOKBOOK_CACHE_MAX_AGE = 60 * 60 * 24 * 365
const SKIN_TONE_CLOTH_TYPE = 86
const IGNORED_LOOKBOOK_ITEM_IDS = new Set([
  1021860042, 1022860042, 1023860042, 1020860231,
])

type LookbookPayload = {
  clothes?: Array<{
    cloth?: {
      id?: unknown
      cloth_type?: unknown
    }
  }>
}

const normalizeLookbookCode = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value
  let code = typeof raw === 'string' ? raw.trim() : ''

  if (/^[A-Za-z0-9]{11}$/.test(code)) {
    code = `${code}#`
  }

  if (!code || !LOOKBOOK_CODE_PATTERN.test(code)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid lookbook code',
      message: 'Invalid lookbook code',
      data: { code: 'INVALID_LOOKBOOK_CODE' },
    })
  }

  return code
}

const isIgnoredLookbookCloth = (cloth: {
  id?: unknown
  cloth_type?: unknown
}) => {
  const clothType = Number(cloth.cloth_type)
  const id = Number(cloth.id)

  return (
    clothType === SKIN_TONE_CLOTH_TYPE ||
    (Number.isSafeInteger(id) && IGNORED_LOOKBOOK_ITEM_IDS.has(id))
  )
}

const normalizeClothes = (value: unknown) => {
  if (!Array.isArray(value)) return null

  const itemIds = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null

      const cloth = (entry as { cloth?: unknown }).cloth
      if (!cloth || typeof cloth !== 'object') return null
      if (isIgnoredLookbookCloth(cloth)) return null

      const id = Number((cloth as { id?: unknown }).id)
      return Number.isSafeInteger(id) && id > 0 ? id : null
    })
    .filter((id): id is number => id !== null)

  return itemIds
}

const parseLookbookPayload = (value: string) => {
  try {
    const payload = JSON.parse(value) as LookbookPayload
    return normalizeClothes(payload.clothes)
  } catch {
    return null
  }
}

const fetchLookbookPayload = async (code: string) => {
  const url = `${LOOKBOOK_API_BASE_URL}?${encodeURIComponent(code)}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Lookbook upstream failed with ${response.status} ${response.statusText}`
    )
  }

  return await response.text()
}

export default defineCachedApiEventHandler(
  async (event): Promise<LookbookDecodeResponse> => {
    const code = normalizeLookbookCode(getQuery(event).code)

    try {
      const payload = await fetchLookbookPayload(code)
      const wearingClothes = parseLookbookPayload(payload)

      if (!wearingClothes) {
        throw new Error('Lookbook upstream response is missing clothes')
      }

      return {
        code,
        wearingClothes,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to decode lookbook')
      console.error(`Failed to decode lookbook ${code}: ${message}`)
      throw createUpstreamUnavailableError('lookbook')
    }
  },
  {
    cache: {
      maxAge: LOOKBOOK_CACHE_MAX_AGE,
      staleMaxAge: LOOKBOOK_CACHE_MAX_AGE,
      name: 'lookbook',
      getKey: (event: H3Event) => {
        const code = normalizeLookbookCode(getQuery(event).code)
        return `${getGameVersion()}:lookbook:${code}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'search',
  }
)
