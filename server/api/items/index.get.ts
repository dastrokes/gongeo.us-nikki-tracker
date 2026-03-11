import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import {
  defineCachedApiEventHandler,
  GAME_VERSION_HEADER,
} from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import {
  createInternalError,
  createUpstreamUnavailableError,
} from '~/utils/apiErrors'
import { toErrorMessage } from '~/utils/errors'
import {
  normalizeTraitKey,
  resolveStyleI18nKeyFromProps,
  resolveTagI18nKeys,
  STYLE_BY_KEY,
  TAG_BY_KEY,
} from '~/utils/itemInfo'
import {
  isTransientSupabaseError,
  withSupabaseRetry,
} from '~/utils/supabaseRetry'
import {
  getVersionPrefixRange,
  getVersionRangeFromPrefix,
} from '~/utils/contentVersion'
import { resolveObtainIdsFromValue } from '~/utils/obtainGroups'

type ItemSortRow = {
  id: number
  quality: number
  obtain_type?: number | null
}

type ItemRow = {
  id: number
  quality: number
  type: string
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
}

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>
}

const BASE_ITEM_PREFIX_RANGES = [
  [1020000000, 1020999999],
  [1021000000, 1021999999],
  [1027000000, 1027999999],
  [1028000000, 1028999999],
  [1029000000, 1029999999],
] as const

const DEFAULT_PAGE_SIZE = 18
const TIERLIST_PAGE_SIZE = 200
const ALLOWED_PAGE_SIZES = new Set([DEFAULT_PAGE_SIZE, TIERLIST_PAGE_SIZE])

const parsePageSize = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE
  const normalized = Math.floor(parsed)
  return ALLOWED_PAGE_SIZES.has(normalized) ? normalized : DEFAULT_PAGE_SIZE
}

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedApiEventHandler(
  async (event) => {
    const query = getQuery(event)
    const qualityParam = query.quality?.toString().trim() ?? ''
    const qualityParsed = qualityParam ? Number(qualityParam) : null
    const invalidQuality =
      qualityParam.length > 0 && !Number.isFinite(qualityParsed)
    const quality = invalidQuality ? null : qualityParsed
    const type = query.type?.toString() || null
    const styleParam = query.style?.toString() || null
    const labelParam = query.label?.toString() || null
    const versionParam = query.version?.toString() || null
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const page =
      Number.isNaN(Number(query.page)) || Number(query.page) < 1
        ? 1
        : Number(query.page ?? 1)
    const pageSize = parsePageSize(query.pageSize ?? query.page_size)
    const useCompactPayload = pageSize === TIERLIST_PAGE_SIZE
    const from = (page - 1) * pageSize
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const labelFilter = normalizedLabel ? TAG_BY_KEY.get(normalizedLabel) : null
    const versionPrefixRange = versionParam
      ? getVersionPrefixRange(versionParam)
      : null
    const obtainTypeRange = versionPrefixRange
      ? {
          min: getVersionRangeFromPrefix(versionPrefixRange.min, 2).min,
          max: getVersionRangeFromPrefix(versionPrefixRange.max, 2).max,
        }
      : null
    const obtainIds = sourceParam
      ? resolveObtainIdsFromValue(sourceParam)
      : null

    if (
      invalidQuality ||
      (styleParam && !styleFilter) ||
      (labelParam && !labelFilter) ||
      (versionParam && obtainTypeRange === null) ||
      (sourceParam && (!obtainIds || obtainIds.length === 0))
    ) {
      return {
        data: [],
        total: 0,
        page,
        totalPages: 0,
      }
    }

    const supabase = useSupabaseDataClient()
    const rpcClient = supabase as unknown as RpcCapableClient

    try {
      const baseItemRangeFilters = BASE_ITEM_PREFIX_RANGES.map(
        ([min, max]) => `and(id.gte.${min},id.lte.${max})`
      ).join(',')

      const applyItemFilters = <
        T extends {
          gte: (column: string, value: number) => T
          lte: (column: string, value: number) => T
          eq: (column: string, value: number | string) => T
          in: (column: string, values: number[]) => T
          contains: (column: string, values: Array<number | string>) => T
        },
      >(
        queryBuilder: T
      ): T => {
        let filteredQuery = queryBuilder

        if (obtainTypeRange) {
          filteredQuery = filteredQuery
            .gte('obtain_type', obtainTypeRange.min)
            .lte('obtain_type', obtainTypeRange.max)
        }

        if (quality !== null && quality !== undefined) {
          filteredQuery = filteredQuery.eq('quality', quality)
        }

        if (type && type !== 'all') {
          filteredQuery = filteredQuery.eq('type', type)
        }

        if (obtainIds) {
          filteredQuery = filteredQuery.in('obtain_type', obtainIds)
        }

        if (styleFilter) {
          filteredQuery = filteredQuery.eq('style_key', styleFilter.key)
        }

        if (labelFilter) {
          filteredQuery = filteredQuery.contains('tags', [labelFilter.id])
        }

        return filteredQuery
      }

      const countQuery = applyItemFilters(
        supabase
          .from('items')
          .select('id', { head: true, count: 'exact' })
          .or(baseItemRangeFilters)
      )

      const { count, error: countError } = await withSupabaseRetry(
        () => countQuery
      )

      if (countError) {
        throw countError
      }

      const total = Math.max(0, count ?? 0)
      const totalPages = total ? Math.ceil(total / pageSize) : 0

      if (useCompactPayload && total > TIERLIST_PAGE_SIZE) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (from >= total) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      const rpcType = type && type !== 'all' ? type : null
      const rpcParams: Record<string, unknown> = {
        p_page: page,
        p_page_size: pageSize,
        p_quality: quality ?? null,
        p_type: rpcType,
        p_style_key: styleFilter?.key ?? null,
        p_label_id: labelFilter?.id ?? null,
        p_obtain_min: obtainTypeRange?.min ?? null,
        p_obtain_max: obtainTypeRange?.max ?? null,
        p_obtain_ids: obtainIds ?? null,
      }
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_items_sorted_page', rpcParams)
      )

      if (rpcError) {
        throw rpcError
      }

      const pageRows = (rpcData as ItemSortRow[] | null) ?? []

      if (pageRows.length === 0) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (useCompactPayload) {
        return {
          data: pageRows.map((row) => ({
            id: row.id,
            quality: row.quality,
          })),
          total,
          page,
          totalPages,
        }
      }

      const pageIds = pageRows.map((row) => row.id)
      const { data: detailData, error: detailError } = await withSupabaseRetry(
        () =>
          supabase
            .from('items')
            .select('id, quality, type, props, style_key, tags, obtain_type')
            .in('id', pageIds)
      )

      if (detailError) {
        throw detailError
      }

      const detailRows = (detailData as ItemRow[] | null) ?? []
      const detailById = new Map<number, ItemRow>(
        detailRows.map((row) => [row.id, row])
      )
      const orderedRows = pageIds
        .map((id) => detailById.get(id))
        .filter((row): row is ItemRow => Boolean(row))

      return {
        data: orderedRows.map((item) => ({
          id: item.id,
          quality: item.quality,
          type: item.type,
          obtain_type: item.obtain_type ?? null,
          style:
            (item.style_key
              ? STYLE_BY_KEY.get(item.style_key)?.i18nKey
              : null) ?? resolveStyleI18nKeyFromProps(item.props),
          labels: resolveTagI18nKeys(item.tags),
        })),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch items')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch items: ${message}`)
        throw createUpstreamUnavailableError('items')
      }
      console.error(`Failed to fetch items: ${message}`)
      throw createInternalError('items')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'items-list',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const page = query.page ? Number(query.page) : 1
        const pageSize = parsePageSize(query.pageSize ?? query.page_size)
        const qualityParam = query.quality?.toString().trim() ?? ''
        const qualityParsed = qualityParam ? Number(qualityParam) : null
        const quality = qualityParam
          ? Number.isFinite(qualityParsed)
            ? qualityParsed
            : 'invalid'
          : 'all'
        const type = query.type?.toString() || 'all'
        const style = query.style?.toString() || 'all'
        const label = query.label?.toString() || 'all'
        const itemVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        return `${version}:items:p${page}:ps${pageSize}:q${quality}:t${type}:s${style}:l${label}:v${itemVersion}:src${source}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'catalog',
  }
)
