import type { ShallowRef } from 'vue'

type CatalogIndexStatus = 'idle' | 'loading' | 'ready' | 'error'

const CATALOG_INDEX_MANIFEST_PATH = '/catalog/index.json'

const catalogIndex = shallowRef<CatalogLocalIndex | null>(null)
const catalogIndexStatus = ref<CatalogIndexStatus>('idle')
const catalogIndexError = ref<Error | null>(null)
let catalogIndexLoadPromise: Promise<void> | null = null

const validateCatalogManifest = (manifest: CatalogIndexManifestResponse) => {
  const expectedVersion = getGameVersion()
  if (manifest.gameVersion !== expectedVersion) {
    throw new Error(
      `Catalog index version mismatch: expected ${expectedVersion}, got ${manifest.gameVersion}`
    )
  }

  if (
    !Array.isArray(manifest.items) ||
    !Array.isArray(manifest.outfits) ||
    !Array.isArray(manifest.makeups) ||
    !Array.isArray(manifest.momo) ||
    !manifest.outfitItems ||
    typeof manifest.outfitItems !== 'object'
  ) {
    throw new Error('Catalog index manifest is malformed')
  }
}

const loadCatalogIndex = async () => {
  if (catalogIndexStatus.value === 'ready') return
  if (catalogIndexLoadPromise) return catalogIndexLoadPromise

  catalogIndexStatus.value = 'loading'
  catalogIndexError.value = null

  catalogIndexLoadPromise = (async () => {
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

      catalogIndex.value = createCatalogLocalIndex({
        items: manifest.items,
        outfits: manifest.outfits,
        makeups: manifest.makeups,
        momo: manifest.momo,
        outfitItems: manifest.outfitItems,
      })
      catalogIndexStatus.value = 'ready'
    } catch (e) {
      const normalizedError = toError(e, 'Failed to load catalog index')
      catalogIndex.value = null
      catalogIndexError.value = normalizedError
      catalogIndexStatus.value = 'error'
      throw normalizedError
    } finally {
      catalogIndexLoadPromise = null
    }
  })()

  return catalogIndexLoadPromise
}

export const useCatalogIndex = (): {
  index: ShallowRef<CatalogLocalIndex | null>
  status: Ref<CatalogIndexStatus>
  error: Ref<Error | null>
  load: () => Promise<void>
} => ({
  index: catalogIndex,
  status: catalogIndexStatus,
  error: catalogIndexError,
  load: loadCatalogIndex,
})
