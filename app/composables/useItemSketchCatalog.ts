const CATALOG_INDEX_MANIFEST_PATH = '/catalog/index.json'

const itemSketchCatalog = shallowRef<ItemSketchCatalog | null>(null)
let itemSketchCatalogLoadPromise: Promise<ItemSketchCatalog> | null = null

const isItemSketchCatalog = (value: unknown): value is ItemSketchCatalog => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const record = value as Record<string, unknown>
  return (
    record.schemaVersion === 1 &&
    !!record.items &&
    typeof record.items === 'object' &&
    !Array.isArray(record.items)
  )
}

export const useItemSketchCatalog = () => {
  const load = async () => {
    if (itemSketchCatalog.value) return itemSketchCatalog.value
    if (itemSketchCatalogLoadPromise) return itemSketchCatalogLoadPromise

    itemSketchCatalogLoadPromise = (async () => {
      const revision =
        useRuntimeConfig().public.catalogRevision || getGameVersion()
      const manifest = await $fetch<CatalogIndexManifestResponse>(
        `${CATALOG_INDEX_MANIFEST_PATH}?r=${encodeURIComponent(String(revision))}`
      )
      const file = manifest.files?.sketches
      if (!file?.path) {
        throw new Error('Item sketch catalog file is unavailable')
      }

      const payload = await $fetch<unknown>(file.path)

      if (!isItemSketchCatalog(payload)) {
        throw new Error('Item sketch catalog payload is malformed')
      }

      itemSketchCatalog.value = payload
      return payload
    })()

    try {
      return await itemSketchCatalogLoadPromise
    } finally {
      itemSketchCatalogLoadPromise = null
    }
  }

  const getItemSketch = (itemId: number) =>
    itemSketchCatalog.value?.items[String(itemId)] ?? null

  return {
    catalog: readonly(itemSketchCatalog),
    load,
    getItemSketch,
  }
}
