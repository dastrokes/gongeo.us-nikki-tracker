const PEARPAL_MAP_HOSTS = {
  cn: 'https://myl.nuanpaper.com',
  global: 'https://pearpal.infoldgames.com',
} as const

export const createPearpalMapUrl = (
  location: ItemSketchChestLocation,
  regionScope: 'cn' | 'global'
) => {
  const url = new URL('/tools/map', PEARPAL_MAP_HOSTS[regionScope])
  url.searchParams.set('lat', String(location.lat))
  url.searchParams.set('lng', String(location.lng))
  url.searchParams.set('selectedCatalogIds', '16')
  url.searchParams.set('worldId', location.worldId)
  url.searchParams.set('zoom', '9')
  return url.toString()
}
