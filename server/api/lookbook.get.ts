const LOOKBOOK_API_BASE_URL = 'https://api-nikki.ranaxro.com/conv-clothdiydata'
const LOOKBOOK_CODE_PATTERN = /^[A-Za-z0-9]{11}#$/
const LOOKBOOK_REQUEST_TIMEOUT_MS = 10000
const SKIN_TONE_CLOTH_TYPE = 86
const IGNORED_LOOKBOOK_ITEM_IDS = new Set([
  1021860042, 1022860042, 1023860042, 1020860231,
])

type LookbookPayload = {
  clothes?: Array<{
    cloth?: {
      id?: unknown
      outfit?: unknown
      cloth_type?: unknown
    }
    diy?: unknown
  }>
}

type DyeColorPayload = {
  rgba?: unknown
  color_grid?: unknown
}

type NormalizedLookbookDyeSwatch = {
  targetGroupId: number
  featureTag: number
  paletteId: number
  slot: number | null
  color: string
}

type NormalizedLookbookDyeItem = {
  itemId: number
  outfitId: number | null
  dyes: NormalizedLookbookDyeSwatch[]
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

const linearChannelToSrgb = (value: number) => {
  const channel = Math.max(0, Math.min(1, value))
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055
}

const rgbaToHex = (value: unknown) => {
  if (
    !Array.isArray(value) ||
    value.length < 3 ||
    value.slice(0, 3).some((channel) => !Number.isFinite(Number(channel)))
  ) {
    return null
  }

  return `#${value
    .slice(0, 3)
    .map((channel) =>
      Math.round(linearChannelToSrgb(Number(channel)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

const normalizeDyeSwatch = (
  value: unknown,
  targetGroupId: number,
  featureTag: number
): NormalizedLookbookDyeSwatch | null => {
  if (!value || typeof value !== 'object') return null

  const color = value as DyeColorPayload
  const colorGrid = Number(color.color_grid)
  const hex = rgbaToHex(color.rgba)
  if (!Number.isInteger(colorGrid) || !hex) return null

  return {
    targetGroupId,
    featureTag,
    paletteId: colorGrid < 0 ? -1 : 1 + Math.floor(colorGrid / 8),
    slot: colorGrid < 0 ? null : colorGrid % 8 || 8,
    color: hex,
  }
}

const normalizeDyes = (value: unknown): NormalizedLookbookDyeSwatch[] => {
  if (!value || typeof value !== 'object') return []

  const outfitDye = (value as { outfit_dye?: unknown }).outfit_dye
  if (!Array.isArray(outfitDye)) return []

  return outfitDye
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null

      const general = (entry as { General?: unknown }).General
      const hair = (entry as { Hair?: unknown }).Hair
      const dye = general ?? hair
      if (!dye || typeof dye !== 'object') return null

      const targetGroupId = Number(
        (dye as { target_group_id?: unknown }).target_group_id
      )
      const featureTag = Number((dye as { feature_tag?: unknown }).feature_tag)
      if (!Number.isInteger(targetGroupId) || !Number.isInteger(featureTag)) {
        return null
      }

      const color = general
        ? (dye as { color?: unknown }).color
        : (dye as { color_0?: unknown }).color_0
      return normalizeDyeSwatch(color, targetGroupId, featureTag)
    })
    .filter((dye): dye is NormalizedLookbookDyeSwatch => dye !== null)
}

const normalizeClothes = (value: unknown) => {
  if (!Array.isArray(value)) return null

  const clothes = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null

      const cloth = (entry as { cloth?: unknown }).cloth
      if (!cloth || typeof cloth !== 'object') return null
      if (isIgnoredLookbookCloth(cloth)) return null

      const id = Number((cloth as { id?: unknown }).id)
      if (!Number.isSafeInteger(id) || id <= 0) return null

      const outfitId = Number((cloth as { outfit?: unknown }).outfit)
      return {
        itemId: id,
        outfitId:
          Number.isSafeInteger(outfitId) && outfitId > 0 ? outfitId : null,
        dyes: normalizeDyes((entry as { diy?: unknown }).diy),
      }
    })
    .filter((cloth): cloth is NormalizedLookbookDyeItem => cloth !== null)

  return {
    wearingClothes: clothes.map((cloth) => cloth.itemId),
    dyeItems: clothes.filter((cloth) => cloth.dyes.length > 0),
  }
}

const parseLookbookPayload = (value: string) => {
  try {
    const payload = JSON.parse(value) as LookbookPayload
    return normalizeClothes(payload.clothes)
  } catch {
    return null
  }
}

class LookbookUpstreamCodeError extends Error {}

const fetchLookbookPayload = async (code: string) => {
  const url = `${LOOKBOOK_API_BASE_URL}?${encodeURIComponent(code)}`
  const response = await fetch(url, {
    signal: AbortSignal.timeout(LOOKBOOK_REQUEST_TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    if (
      response.status === 404 ||
      response.status === 400 ||
      (response.status === 502 &&
        (await response.text()).trim() === 'Upstream API error: 404')
    ) {
      throw new LookbookUpstreamCodeError(
        `Lookbook upstream rejected code with ${response.status}`
      )
    }
    throw new Error(
      `Lookbook upstream failed with ${response.status} ${response.statusText}`
    )
  }

  return await response.text()
}

export default defineCachedApiEventHandler(
  async (event) => {
    const code = normalizeLookbookCode(getQuery(event).code)

    try {
      const payload = await fetchLookbookPayload(code)
      const lookbook = parseLookbookPayload(payload)

      if (!lookbook) {
        throw new Error('Lookbook upstream response is missing clothes')
      }

      return {
        code,
        ...lookbook,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      if (error instanceof LookbookUpstreamCodeError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid lookbook code',
          message: 'Invalid lookbook code',
          data: { code: 'INVALID_LOOKBOOK_CODE' },
        })
      }

      const message = toErrorMessage(error, 'Failed to decode lookbook')
      console.error(`Failed to decode lookbook ${code}: ${message}`)
      const upstreamError = createUpstreamUnavailableError('lookbook')
      setResponseStatus(
        event,
        upstreamError.statusCode,
        upstreamError.statusMessage
      )
      return upstreamError.toJSON()
    }
  },
  {
    cache: false,
    headers: {
      varyQuery: true,
    },
    profile: 'lookbook',
  }
)
