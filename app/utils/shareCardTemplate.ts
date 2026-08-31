import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'

export type ShareCardTemplateId = 'default' | 'custom'

export type ShareCardTemplate = {
  id: ShareCardTemplateId
  name: string
  prompts: string[]
}

type ShareCardTemplatePayload = [
  version: 1,
  name: string,
  ...categories: string[],
]

const SHARE_CARD_TEMPLATE_COMPRESSION_PREFIX = 'z'

export const cleanShareCardTemplateText = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export const encodeShareCardTemplateParam = (template: ShareCardTemplate) => {
  const payload: ShareCardTemplatePayload = [
    1,
    cleanShareCardTemplateText(template.name, 40),
    ...template.prompts
      .slice(0, 9)
      .map((category) => cleanShareCardTemplateText(category, 32)),
  ]
  const compressed = zlibSync(strToU8(JSON.stringify(payload)), { level: 9 })
  return `${SHARE_CARD_TEMPLATE_COMPRESSION_PREFIX}${toBase64Url(compressed)}`
}

export const parseShareCardTemplateParam = (
  value: unknown
): ShareCardTemplate | null => {
  if (
    typeof value !== 'string' ||
    !value.startsWith(SHARE_CARD_TEMPLATE_COMPRESSION_PREFIX) ||
    value.length > 2048
  )
    return null

  try {
    const compressed = fromBase64Url(value.slice(1))
    const decompressed = unzlibSync(compressed, {
      out: new Uint8Array(2048),
    })
    if (decompressed.length === 2048) return null
    const payload = JSON.parse(
      strFromU8(decompressed)
    ) as ShareCardTemplatePayload
    if (!Array.isArray(payload) || payload.length !== 11 || payload[0] !== 1)
      return null

    const name = cleanShareCardTemplateText(payload[1], 40)
    const prompts = payload
      .slice(2)
      .map((category) => cleanShareCardTemplateText(category, 32))

    return name && prompts.length === 9 && prompts.every(Boolean)
      ? { id: 'custom', name, prompts }
      : null
  } catch {
    return null
  }
}
