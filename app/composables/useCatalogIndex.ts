import type { ShallowRef } from 'vue'

type CatalogIndexStatus = 'idle' | 'loading' | 'ready' | 'error'

const CATALOG_INDEX_MANIFEST_PATH = '/catalog/index.json'
const CATALOG_INDEX_PARTS = [
  'items',
  'outfits',
  'makeups',
  'momo',
  'outfitItems',
  'makeupItems',
  'makeupOutfits',
  'momoOutfits',
] as const satisfies readonly CatalogIndexPartKey[]

const catalogIndex = shallowRef<CatalogLocalIndex | null>(null)
const catalogManifest = shallowRef<CatalogIndexManifestResponse | null>(null)
const catalogIndexStatus = ref<CatalogIndexStatus>('idle')
const catalogIndexError = ref<Error | null>(null)
let catalogManifestLoadPromise: Promise<void> | null = null
const catalogPartLoadPromises = new Map<CatalogIndexPartKey, Promise<void>>()
const catalogLoadedParts = new Set<CatalogIndexPartKey>()
const catalogPartData: {
  items?: ItemListEntry[]
  outfits?: OutfitListEntry[]
  makeups?: ItemListEntry[]
  momo?: MomoListEntry[]
  outfitItems?: Record<string, number[]>
  makeupItems?: Record<string, number[]>
  makeupOutfits?: Record<string, number[]>
  momoOutfits?: Record<string, number[]>
} = {}

const isCatalogIndexPart = (part: string): part is CatalogIndexPartKey =>
  CATALOG_INDEX_PARTS.includes(part as CatalogIndexPartKey)

const normalizeRequestedParts = (
  parts: readonly CatalogIndexPartKey[] = CATALOG_INDEX_PARTS
) => [...new Set(parts)]

const validateCatalogManifest = (manifest: CatalogIndexManifestResponse) => {
  const expectedVersion = getGameVersion()
  if (manifest.gameVersion !== expectedVersion) {
    throw new Error(
      `Catalog index version mismatch: expected ${expectedVersion}, got ${manifest.gameVersion}`
    )
  }

  const hasLegacyPayload =
    Array.isArray(manifest.items) &&
    Array.isArray(manifest.outfits) &&
    Array.isArray(manifest.makeups) &&
    Array.isArray(manifest.momo) &&
    !!manifest.outfitItems &&
    typeof manifest.outfitItems === 'object'

  if (hasLegacyPayload) return

  if (!manifest.files || typeof manifest.files !== 'object') {
    throw new Error('Catalog index manifest is malformed')
  }

  for (const part of CATALOG_INDEX_PARTS) {
    const file = manifest.files[part]
    if (
      !file ||
      typeof file.path !== 'string' ||
      typeof file.hash !== 'string' ||
      typeof file.bytes !== 'number'
    ) {
      throw new Error(`Catalog index manifest is missing ${part}`)
    }
  }
}

const rebuildCatalogLocalIndex = () => {
  catalogIndex.value = createCatalogLocalIndex({
    items: catalogPartData.items,
    outfits: catalogPartData.outfits,
    makeups: catalogPartData.makeups,
    momo: catalogPartData.momo,
    outfitItems: catalogPartData.outfitItems,
    makeupItems: catalogPartData.makeupItems,
    makeupOutfits: catalogPartData.makeupOutfits,
    momoOutfits: catalogPartData.momoOutfits,
  })
}

const applyLegacyManifestPayload = (manifest: CatalogIndexManifestResponse) => {
  catalogPartData.items = manifest.items ?? []
  catalogPartData.outfits = manifest.outfits ?? []
  catalogPartData.makeups = manifest.makeups ?? []
  catalogPartData.momo = manifest.momo ?? []
  catalogPartData.outfitItems = manifest.outfitItems ?? {}
  catalogPartData.makeupItems = manifest.makeupItems ?? {}
  catalogPartData.makeupOutfits = manifest.makeupOutfits ?? {}
  catalogPartData.momoOutfits = manifest.momoOutfits ?? {}
  CATALOG_INDEX_PARTS.forEach((part) => catalogLoadedParts.add(part))
  rebuildCatalogLocalIndex()
}

const loadCatalogManifest = async () => {
  if (catalogManifest.value) return
  if (catalogManifestLoadPromise) return catalogManifestLoadPromise

  catalogIndexStatus.value = 'loading'
  catalogIndexError.value = null

  catalogManifestLoadPromise = (async () => {
    try {
      const manifest = await $fetch<CatalogIndexManifestResponse>(
        CATALOG_INDEX_MANIFEST_PATH,
        {
          query: {
            v: getGameVersion(),
          },
        }
      )

      validateCatalogManifest(manifest)
      catalogManifest.value = manifest

      if (!manifest.files) {
        applyLegacyManifestPayload(manifest)
      }
    } catch (e) {
      const normalizedError = toError(e, 'Failed to load catalog index')
      catalogManifest.value = null
      catalogIndex.value = null
      catalogIndexError.value = normalizedError
      catalogIndexStatus.value = 'error'
      throw normalizedError
    } finally {
      catalogManifestLoadPromise = null
    }
  })()

  return catalogManifestLoadPromise
}

const validateCatalogPart = (part: CatalogIndexPartKey, value: unknown) => {
  const valid =
    part === 'outfitItems' ||
    part === 'makeupItems' ||
    part === 'makeupOutfits' ||
    part === 'momoOutfits'
      ? !!value && typeof value === 'object' && !Array.isArray(value)
      : Array.isArray(value)

  if (!valid) {
    throw new Error(`Catalog ${part} payload is malformed`)
  }
}

const loadCatalogPart = async (part: CatalogIndexPartKey) => {
  if (catalogLoadedParts.has(part)) return
  const existingPromise = catalogPartLoadPromises.get(part)
  if (existingPromise) return existingPromise

  const manifest = catalogManifest.value
  const file = manifest?.files?.[part]
  if (!file) {
    throw new Error(`Catalog ${part} file is unavailable`)
  }

  const loadPromise = (async () => {
    const payload = await $fetch<unknown>(file.path)
    const decodedPayload = decodeCatalogPartPayload(part, payload)
    validateCatalogPart(part, decodedPayload)
    catalogPartData[part] = decodedPayload as never
    catalogLoadedParts.add(part)
    rebuildCatalogLocalIndex()
  })()

  catalogPartLoadPromises.set(part, loadPromise)

  try {
    await loadPromise
  } finally {
    catalogPartLoadPromises.delete(part)
  }
}

const loadCatalogIndex = async (parts?: readonly CatalogIndexPartKey[]) => {
  const requestedParts = normalizeRequestedParts(parts)
  if (requestedParts.every((part) => catalogLoadedParts.has(part))) {
    catalogIndexStatus.value = 'ready'
    return
  }

  catalogIndexStatus.value = 'loading'
  catalogIndexError.value = null

  try {
    await loadCatalogManifest()
    await Promise.all(requestedParts.map((part) => loadCatalogPart(part)))
    catalogIndexStatus.value = 'ready'
  } catch (e) {
    const normalizedError = toError(e, 'Failed to load catalog index')
    catalogIndexError.value = normalizedError
    catalogIndexStatus.value = 'error'
    throw normalizedError
  }
}

const loadCatalogEntity = async (
  entity: 'item' | 'outfit' | 'makeup' | 'momo'
) => {
  const parts: CatalogIndexPartKey[] =
    entity === 'item'
      ? ['items']
      : entity === 'outfit'
        ? ['outfits', 'outfitItems']
        : entity === 'makeup'
          ? ['makeups', 'makeupItems', 'makeupOutfits']
          : ['momo']

  await loadCatalogIndex(parts)
}

export const useCatalogIndex = (): {
  index: ShallowRef<CatalogLocalIndex | null>
  status: Ref<CatalogIndexStatus>
  error: Ref<Error | null>
  load: (parts?: readonly CatalogIndexPartKey[]) => Promise<void>
  loadEntity: (entity: 'item' | 'outfit' | 'makeup' | 'momo') => Promise<void>
  hasPart: (part: CatalogIndexPartKey) => boolean
} => ({
  index: catalogIndex,
  status: catalogIndexStatus,
  error: catalogIndexError,
  load: loadCatalogIndex,
  loadEntity: loadCatalogEntity,
  hasPart: (part) => isCatalogIndexPart(part) && catalogLoadedParts.has(part),
})
