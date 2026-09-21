type CatalogItemDetailResponse = {
  id?: unknown
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

const getCatalogDataApiBaseUrl = () => {
  const configured = useRuntimeConfig().public.dataApiBaseUrl
  const baseUrl = typeof configured === 'string' ? configured.trim() : ''
  if (!baseUrl) {
    throw new Error('NUXT_PUBLIC_DATA_API_BASE_URL is required for feedback')
  }
  return baseUrl.replace(/\/+$/, '')
}

export const fetchCatalogItemForFeedback = async (
  itemId: number
): Promise<CatalogFeedbackItem | null> => {
  const response = await fetch(
    `${getCatalogDataApiBaseUrl()}/items/${encodeURIComponent(String(itemId))}?lang=en`,
    { signal: AbortSignal.timeout(10_000) }
  )

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Catalog data API returned ${response.status}`)
  }

  const payload = (await response.json()) as CatalogItemDetailResponse
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
