const PROP_SOURCE_GROUP_KEYS: Record<PropSource, string> = {
  event: 'event',
  home: 'home',
  resonance: 'limited',
  starlit: 'starlit',
  store: 'pear',
}

const PROP_SOURCE_BY_GROUP_KEY = new Map(
  Object.entries(PROP_SOURCE_GROUP_KEYS).map(([source, groupKey]) => [
    groupKey,
    source as PropSource,
  ])
)

export const resolvePropSourceLabelKey = (source: PropSource) =>
  resolveObtainGroupLabelKey(PROP_SOURCE_GROUP_KEYS[source])

export const resolveObtainGroupKeyFromPropSource = (source: PropSource) =>
  PROP_SOURCE_GROUP_KEYS[source]

export const resolvePropSourceFromObtainGroupKey = (groupKey: string) =>
  PROP_SOURCE_BY_GROUP_KEY.get(groupKey) ?? null
