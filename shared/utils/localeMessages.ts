export type LocaleMessageDictionary = Record<string, unknown>

const isMessageRecord = (value: unknown): value is LocaleMessageDictionary =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isCompiledMessage = (value: LocaleMessageDictionary) => 'body' in value

const collectLocaleMessageKeys = (
  value: unknown,
  prefix: string,
  results: string[]
) => {
  if (!isMessageRecord(value) || isCompiledMessage(value)) {
    results.push(prefix)
    return
  }

  Object.entries(value).forEach(([key, child]) => {
    collectLocaleMessageKeys(child, prefix ? `${prefix}.${key}` : key, results)
  })
}

export const getLocaleMessageKeys = (
  messages: LocaleMessageDictionary,
  namespace?: string
) => {
  const results: string[] = []
  const namespacePrefix = namespace ? `${namespace}.` : null

  Object.entries(messages).forEach(([key, value]) => {
    if (namespacePrefix && key.startsWith(namespacePrefix)) {
      results.push(key)
      return
    }

    if (namespace && key !== namespace) return
    collectLocaleMessageKeys(value, key, results)
  })

  return Array.from(new Set(results))
}

export const getLocaleMessageValue = (
  messages: LocaleMessageDictionary,
  key: string
) => {
  if (Object.prototype.hasOwnProperty.call(messages, key)) {
    return messages[key]
  }

  return key.split('.').reduce<unknown>((value, segment) => {
    return isMessageRecord(value) ? value[segment] : undefined
  }, messages)
}

export const getLocaleMessageNumericIds = (
  messages: LocaleMessageDictionary,
  namespace: string,
  field = 'name'
) =>
  Array.from(
    new Set(
      getLocaleMessageKeys(messages, namespace).flatMap((key) => {
        const [keyNamespace, id, keyField] = key.split('.')
        if (
          keyNamespace !== namespace ||
          keyField !== field ||
          !id ||
          !/^\d+$/.test(id)
        ) {
          return []
        }

        return [Number(id)]
      })
    )
  )
