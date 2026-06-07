export type EntityMessageSection =
  | 'banner'
  | 'item'
  | 'makeup'
  | 'momo'
  | 'outfit'

export type EntityMessageDictionary = Record<string, unknown>

export type EntityNameMessageEntry = {
  section: EntityMessageSection
  id: string
  name: string
}

const ENTITY_NAME_KEY_PATTERN =
  /^(banner|item|makeup|momo|outfit)\.(\d+)\.name$/

export const unwrapLocaleMessages = (
  messagesModule: unknown
): EntityMessageDictionary => {
  if (
    messagesModule &&
    typeof messagesModule === 'object' &&
    'default' in messagesModule
  ) {
    const defaultMessages = (messagesModule as { default?: unknown }).default
    if (defaultMessages && typeof defaultMessages === 'object') {
      return defaultMessages as EntityMessageDictionary
    }
  }

  return messagesModule && typeof messagesModule === 'object'
    ? (messagesModule as EntityMessageDictionary)
    : {}
}

export const getLocaleMessageText = (message: unknown): string | null => {
  if (typeof message === 'string') return message
  if (!message || typeof message !== 'object') return null

  const body = (message as { body?: unknown }).body
  if (!body || typeof body !== 'object') return null

  const staticText = (body as { static?: unknown }).static
  if (typeof staticText === 'string') return staticText

  const items = (body as { items?: unknown }).items
  if (!Array.isArray(items)) return null

  const text = items
    .map((item) =>
      item && typeof item === 'object'
        ? (item as { value?: unknown }).value
        : null
    )
    .filter((value): value is string => typeof value === 'string')
    .join('')

  return text || null
}

export const getEntityNameMessageEntries = (
  messages: EntityMessageDictionary,
  sectionFilter?: EntityMessageSection
): EntityNameMessageEntry[] =>
  Object.entries(messages).flatMap(([key, message]) => {
    const match = key.match(ENTITY_NAME_KEY_PATTERN)
    const section = match?.[1] as EntityMessageSection | undefined
    const id = match?.[2]
    if (!section || !id || (sectionFilter && section !== sectionFilter)) {
      return []
    }

    const name = getLocaleMessageText(message)
    return name ? [{ section, id, name }] : []
  })

export const getEntityNameMessageIds = (
  messages: EntityMessageDictionary,
  section: EntityMessageSection,
  options: { idFilter?: (id: string) => boolean } = {}
) =>
  Array.from(
    new Set(
      getEntityNameMessageEntries(messages, section)
        .map((entry) => entry.id)
        .filter(options.idFilter ?? (() => true))
    )
  )
