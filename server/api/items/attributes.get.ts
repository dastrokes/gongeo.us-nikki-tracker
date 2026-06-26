type AttributeMatchRpcRow = {
  item_id?: number | string | null
}

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>
}

const ATTRIBUTE_MATCH_CACHE_VERSION = 'item-attributes-matches-v1'

export default defineCachedApiEventHandler(
  async (event) => {
    const query = parseItemAttributeMatchQuery(getQuery(event))
    const supabase = useSupabaseDataClient()
    const rpcClient = supabase as unknown as RpcCapableClient

    try {
      const { data, error } = await withSupabaseRetry(() =>
        rpcClient.rpc(
          'list_item_attribute_ids',
          buildItemAttributeMatchRpcParams(query)
        )
      )

      if (error) {
        throw error
      }

      const ids = ((data as AttributeMatchRpcRow[] | null) ?? [])
        .map((row) => Number(row.item_id))
        .filter((itemId) => Number.isSafeInteger(itemId))

      return {
        ids,
        total: ids.length,
        revision: `${getGameVersion()}:${ATTRIBUTE_MATCH_CACHE_VERSION}`,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(
        error,
        'Failed to fetch item attribute matches'
      )
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch item attribute matches: ${message}`)
        throw createUpstreamUnavailableError('item attribute matches')
      }

      console.error(`Failed to fetch item attribute matches: ${message}`)
      throw createInternalError('item attribute matches')
    }
  },
  {
    cache: false,
    headers: {
      varyQuery: true,
    },
    profile: 'search',
  }
)
