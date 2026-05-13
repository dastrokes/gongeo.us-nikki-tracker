interface MakeupRow {
  id: number
  quality: number
  type: string
  style_key?: string | null
  obtain_type?: number | null
  description?: string
}

interface MakeupTranslation {
  description?: string | null
  language_code?: string | null
}

interface MakeupItemRow {
  makeup_id: number
}

interface MakeupRelationRow {
  full_makeup_id: number
  makeup_id: number
}

interface ParentMakeupRow {
  full_makeup_id: number
}

interface MakeupOutfitRow {
  outfit_id: number
}

interface OutfitRow {
  id: number
  quality: number
  outfit_items?: Array<{
    items: {
      id: number
      quality: number
      type: string
    }
  }>
}

const MAKEUP_TYPE_ORDER = new Map([
  ['baseMakeup', 1],
  ['eyebrows', 2],
  ['eyelashes', 3],
  ['contactLenses', 4],
  ['lips', 5],
  ['fullMakeup', 99],
])

const sortMakeupsByType = (rows: MakeupRow[]): MakeupRow[] =>
  [...rows].sort((left, right) => {
    const leftOrder = MAKEUP_TYPE_ORDER.get(left.type) ?? 999
    const rightOrder = MAKEUP_TYPE_ORDER.get(right.type) ?? 999
    return leftOrder - rightOrder || left.id - right.id
  })

const sortByIdList = <T extends { id: number }>(
  rows: T[],
  ids: number[]
): T[] => {
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...rows].sort(
    (left, right) =>
      (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(right.id) ?? Number.MAX_SAFE_INTEGER) || left.id - right.id
  )
}

const getRelatedFullMakeupIds = (baseId: number): number[] => {
  const baseIdString = baseId.toString()
  if (baseIdString.length < 3) return [baseId]

  const suffix = baseIdString.slice(-2)
  if (suffix !== '01' && suffix !== '03') return [baseId]

  const prefix = baseIdString.slice(0, -2)
  return [Number(`${prefix}01`), Number(`${prefix}03`)]
}

export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event)

    if (!id || isNaN(id)) {
      throw createInvalidIdError('makeup')
    }

    const supabase = useSupabaseDataClient()

    try {
      const { data, error } = await withSupabaseRetry(() =>
        supabase
          .from('makeups')
          .select('id,quality,type,style_key,obtain_type')
          .eq('id', id)
          .single()
      )

      if (error) {
        if (error.code === 'PGRST116') {
          throw createNotFoundError('makeup')
        }
        throw error
      }

      const makeup = {
        ...(data as MakeupRow),
        kind: 'makeup' as const,
        components: [] as MakeupRow[],
        related_outfits: [] as OutfitRow[],
        variations: [] as MakeupRow[],
      }

      if (makeup.type !== 'fullMakeup' && languageCode) {
        const translationCodes = Array.from(new Set([languageCode, 'en']))
        const { data: translationRows, error: translationError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeup_translations')
              .select('description,language_code')
              .eq('makeup_id', id)
              .in('language_code', translationCodes)
          )

        if (translationError) {
          throw translationError
        }

        const translations =
          (translationRows as MakeupTranslation[] | null) ?? []
        const translation = translations.find(
          (t) => t.language_code === languageCode
        )
        const enTranslation = translations.find((t) => t.language_code === 'en')

        makeup.description =
          translation?.description || enTranslation?.description || ''
      }

      if (makeup.type !== 'fullMakeup') {
        const relatedItemIds = getRelatedItemIds(id, makeup.quality)
        if (relatedItemIds.length > 1) {
          const { data: relatedMakeups, error: relatedMakeupsError } =
            await withSupabaseRetry(() =>
              supabase
                .from('makeups')
                .select('id,quality,type,style_key,obtain_type')
                .in('id', relatedItemIds)
            )

          if (relatedMakeupsError) {
            throw relatedMakeupsError
          }

          makeup.variations = sortByIdList(
            (relatedMakeups as MakeupRow[] | null) ?? [],
            relatedItemIds
          )
        }

        const { data: parentRows, error: parentRowsError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeup_items')
              .select('full_makeup_id')
              .eq('makeup_id', id)
          )

        if (parentRowsError) {
          throw parentRowsError
        }

        const parentIds = ((parentRows as ParentMakeupRow[] | null) ?? [])
          .map((row) => row.full_makeup_id)
          .filter((makeupId) => typeof makeupId === 'number')

        if (parentIds.length > 0) {
          const { data: fullMakeups, error: fullMakeupsError } =
            await withSupabaseRetry(() =>
              supabase
                .from('makeups')
                .select('id,quality,type,style_key,obtain_type')
                .in('id', parentIds)
            )

          if (fullMakeupsError) {
            throw fullMakeupsError
          }

          const parentFullMakeups = sortByIdList(
            (fullMakeups as MakeupRow[] | null) ?? [],
            parentIds
          )
          const variationIds = new Set(makeup.variations.map((row) => row.id))
          makeup.variations = [
            ...makeup.variations,
            ...parentFullMakeups.filter((row) => !variationIds.has(row.id)),
          ]

          const { data: componentRelationRows, error: componentRelationError } =
            await withSupabaseRetry(() =>
              supabase
                .from('makeup_items')
                .select('full_makeup_id,makeup_id')
                .in('full_makeup_id', parentIds)
            )

          if (componentRelationError) {
            throw componentRelationError
          }

          const componentRelations =
            (componentRelationRows as MakeupRelationRow[] | null) ?? []
          const componentIds = Array.from(
            new Set(componentRelations.map((row) => row.makeup_id))
          )

          if (componentIds.length > 0) {
            const { data: components, error: componentsError } =
              await withSupabaseRetry(() =>
                supabase
                  .from('makeups')
                  .select('id,quality,type,style_key,obtain_type')
                  .in('id', componentIds)
              )

            if (componentsError) {
              throw componentsError
            }

            makeup.components = sortMakeupsByType(
              (components as MakeupRow[] | null) ?? []
            )
          }

          const { data: outfitRows, error: outfitRowsError } =
            await withSupabaseRetry(() =>
              supabase
                .from('makeup_outfits')
                .select('outfit_id')
                .in('full_makeup_id', parentIds)
            )

          if (outfitRowsError) {
            throw outfitRowsError
          }

          const outfitIds = Array.from(
            new Set(
              ((outfitRows as MakeupOutfitRow[] | null) ?? [])
                .map((row) => row.outfit_id)
                .filter((outfitId) => typeof outfitId === 'number')
            )
          )

          if (outfitIds.length > 0) {
            const { data: outfits, error: outfitsError } =
              await withSupabaseRetry(() =>
                supabase
                  .from('outfits')
                  .select('id,quality,outfit_items(items(id,quality,type))')
                  .in('id', outfitIds)
              )

            if (outfitsError) {
              throw outfitsError
            }

            makeup.related_outfits = (
              (outfits as OutfitRow[] | null) ?? []
            ).sort((left, right) => left.id - right.id)
          }
        }

        return makeup
      }

      const relatedFullMakeupIds = getRelatedFullMakeupIds(id)
      if (relatedFullMakeupIds.length > 1) {
        const { data: relatedFullMakeups, error: relatedFullMakeupsError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeups')
              .select('id,quality,type,style_key,obtain_type')
              .in('id', relatedFullMakeupIds)
          )

        if (relatedFullMakeupsError) {
          throw relatedFullMakeupsError
        }

        makeup.variations = sortByIdList(
          (relatedFullMakeups as MakeupRow[] | null) ?? [],
          relatedFullMakeupIds
        )
      }

      const { data: componentRows, error: componentError } =
        await withSupabaseRetry(() =>
          supabase
            .from('makeup_items')
            .select('makeup_id')
            .eq('full_makeup_id', id)
        )

      if (componentError) {
        throw componentError
      }

      const componentIds = ((componentRows as MakeupItemRow[] | null) ?? [])
        .map((row) => row.makeup_id)
        .filter((makeupId) => typeof makeupId === 'number')

      if (componentIds.length > 0) {
        const { data: components, error: componentsError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeups')
              .select('id,quality,type,style_key,obtain_type')
              .in('id', componentIds)
          )

        if (componentsError) {
          throw componentsError
        }

        makeup.components = sortMakeupsByType(
          (components as MakeupRow[] | null) ?? []
        )
      }

      const { data: outfitRows, error: outfitRowsError } =
        await withSupabaseRetry(() =>
          supabase
            .from('makeup_outfits')
            .select('outfit_id')
            .eq('full_makeup_id', id)
        )

      if (outfitRowsError) {
        throw outfitRowsError
      }

      const outfitIds = Array.from(
        new Set(
          ((outfitRows as MakeupOutfitRow[] | null) ?? [])
            .map((row) => row.outfit_id)
            .filter((outfitId) => typeof outfitId === 'number')
        )
      )

      if (outfitIds.length > 0) {
        const { data: outfits, error: outfitsError } = await withSupabaseRetry(
          () =>
            supabase
              .from('outfits')
              .select('id,quality,outfit_items(items(id,quality,type))')
              .in('id', outfitIds)
        )

        if (outfitsError) {
          throw outfitsError
        }

        makeup.related_outfits = ((outfits as OutfitRow[] | null) ?? []).sort(
          (left, right) => left.id - right.id
        )
      }

      return makeup
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, `Failed to fetch makeup ${id}`)
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch makeup ${id}: ${message}`)
        throw createUpstreamUnavailableError('makeup')
      }
      console.error(`Failed to fetch makeup ${id}: ${message}`)
      throw createInternalError('makeup')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'makeup-detail',
      getKey: (event) => {
        const id = getRouterParam(event, 'id')
        const languageCode = resolveRequestLocale(event)
        return `makeup:${id}:${languageCode}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
    },
    profile: 'catalog',
  }
)
