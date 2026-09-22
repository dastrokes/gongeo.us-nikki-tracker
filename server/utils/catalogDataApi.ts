type CatalogItemDetailResponse = {
  id?: unknown
  message?: unknown
  item_attributes?: {
    category?: unknown
    subcategory?: unknown
    metadata?: unknown
  } | null
}

export type CatalogFeedbackItem = {
  id: number
  itemAttributes: {
    category: string | null
    subcategory: string | null
    metadata: Record<string, unknown> | null
  } | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const requireEnvironmentValue = (name: string) => {
  const value = process.env[name]?.trim() ?? ''
  if (!value) throw new Error(`${name} is required for feedback`)
  return value
}

const getCatalogItemAdminUrl = (itemId: number) => {
  const url = new URL(requireEnvironmentValue('CLOUDFLARE_CATALOG_WRITE_URL'))
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/${encodeURIComponent(String(itemId))}`
  url.search = ''
  url.hash = ''
  return url
}

export const fetchCatalogItemForFeedback = async (
  itemId: number
): Promise<CatalogFeedbackItem | null> => {
  const response = await fetch(getCatalogItemAdminUrl(itemId), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${requireEnvironmentValue('CLOUDFLARE_DATA_TOKEN')}`,
    },
    signal: AbortSignal.timeout(10_000),
  })
  const payload = (await response
    .json()
    .catch(() => null)) as CatalogItemDetailResponse | null

  if (response.status === 404) return null
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string'
        ? `: ${payload.message}`
        : ''
    throw new Error(`Catalog data API returned ${response.status}${message}`)
  }

  if (!payload) throw new Error('Catalog data API returned invalid JSON')
  const id = Number(payload.id)
  if (!Number.isSafeInteger(id) || id !== itemId) {
    throw new Error('Catalog data API returned an invalid item')
  }

  const attributes = payload.item_attributes
  if (!attributes) return { id, itemAttributes: null }
  const category =
    typeof attributes.category === 'string' ? attributes.category : null
  const subcategory =
    typeof attributes.subcategory === 'string' ? attributes.subcategory : null
  const metadata = isRecord(attributes.metadata) ? attributes.metadata : null

  return {
    id,
    itemAttributes: { category, subcategory, metadata },
  }
}
