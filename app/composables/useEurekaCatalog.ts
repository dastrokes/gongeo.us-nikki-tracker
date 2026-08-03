const validateEurekaCatalog = (entries: readonly EurekaCatalogEntry[]) => {
  const eurekaIds = new Set<number>()
  const colorIds = new Set<number>()
  const positions = new Set<EurekaPosition>(['head', 'hands', 'feet'])
  const styles = new Set<EurekaStyle>([
    'elegant',
    'fresh',
    'sweet',
    'sexy',
    'cool',
  ])

  entries.forEach((entry) => {
    if (
      !Number.isSafeInteger(entry.id) ||
      entry.id <= 0 ||
      eurekaIds.has(entry.id) ||
      !positions.has(entry.position) ||
      !styles.has(entry.mainStyle) ||
      ![3, 4, 5].includes(entry.quality) ||
      !Array.isArray(entry.colors) ||
      entry.colors.length === 0
    ) {
      throw new Error('Invalid Eureka catalog entry')
    }
    eurekaIds.add(entry.id)

    entry.colors.forEach((color) => {
      if (
        !Number.isSafeInteger(color.id) ||
        color.id <= 0 ||
        colorIds.has(color.id)
      ) {
        throw new Error('Invalid Eureka catalog color')
      }
      colorIds.add(color.id)
    })
  })
}

export const useEurekaCatalog = () => {
  const catalogIndex = useCatalogIndex()
  const validated = useState<boolean>('eureka:catalog-validated', () => false)

  const entries = computed(() => catalogIndex.eurekas.value)
  const entryById = computed(
    () => new Map(entries.value.map((entry) => [entry.id, entry]))
  )
  const allColorIds = computed(() =>
    entries.value.flatMap((entry) => entry.colors.map((color) => color.id))
  )
  const loading = computed(() => catalogIndex.status.value === 'loading')
  const error = computed(() => catalogIndex.error.value)

  const load = async () => {
    await catalogIndex.load(['eurekas'])
    if (!validated.value) {
      validateEurekaCatalog(entries.value)
      validated.value = true
    }
  }

  const retry = async () => {
    validated.value = false
    await load()
  }

  return {
    entries,
    entryById,
    allColorIds,
    loading,
    error,
    load,
    retry,
  }
}
