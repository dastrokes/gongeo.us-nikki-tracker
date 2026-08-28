export const CATALOG_INDEX_PARTS = [
  'items',
  'outfits',
  'makeups',
  'momo',
  'eurekas',
  'props',
  'outfitItems',
  'makeupItems',
  'makeupOutfits',
  'momoOutfits',
] as const satisfies readonly CatalogIndexPartKey[]

const CATALOG_INDEX_MANIFEST_PATH = '/catalog/index.json'

const catalogManifest = shallowRef<CatalogIndexManifestResponse | null>(null)
let catalogManifestLoadPromise: Promise<CatalogIndexManifestResponse> | null =
  null

const isLandingPreviewSet = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const preview = value as Partial<CatalogLandingPreviewSet>
  return (
    Number.isSafeInteger(preview.outfit) &&
    Number.isSafeInteger(preview.item) &&
    Number.isSafeInteger(preview.makeup) &&
    Number.isSafeInteger(preview.momo)
  )
}

const validateCatalogManifest = (manifest: CatalogIndexManifestResponse) => {
  const expectedVersion = getGameVersion()
  if (manifest.gameVersion !== expectedVersion) {
    throw new Error(
      `Catalog index version mismatch: expected ${expectedVersion}, got ${manifest.gameVersion}`
    )
  }

  if (
    !manifest.landingPreview ||
    !isLandingPreviewSet(manifest.landingPreview)
  ) {
    throw new Error('Catalog index manifest is missing a landing preview')
  }

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

const loadCatalogManifest = async () => {
  if (catalogManifest.value) return catalogManifest.value
  if (catalogManifestLoadPromise) return catalogManifestLoadPromise

  catalogManifestLoadPromise = (async () => {
    const revision =
      useRuntimeConfig().public.catalogRevision || getGameVersion()
    const manifest = await $fetch<CatalogIndexManifestResponse>(
      `${CATALOG_INDEX_MANIFEST_PATH}?r=${encodeURIComponent(String(revision))}`
    )

    validateCatalogManifest(manifest)
    catalogManifest.value = manifest
    return manifest
  })()

  try {
    return await catalogManifestLoadPromise
  } finally {
    catalogManifestLoadPromise = null
  }
}

export const useCatalogManifest = () => ({
  manifest: readonly(catalogManifest),
  load: loadCatalogManifest,
})
