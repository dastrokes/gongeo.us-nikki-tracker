export interface TrackerSettings {
  sortBanner: boolean
  sortItems: boolean
  combineOutfits: boolean
  show4StarItems: boolean
  showMissingPieces: boolean
  showEmptyBanners: boolean
  showDuplicates: boolean
}

export const useTrackerSettings = () => {
  const settings = useLocalStorage<TrackerSettings>(
    'gongeous-tracker-settings',
    {
      sortBanner: false,
      sortItems: false,
      combineOutfits: false,
      show4StarItems: false,
      showMissingPieces: false,
      showEmptyBanners: false,
      showDuplicates: false,
    }
  )

  const resetToDefaults = () => {
    settings.value = {
      sortBanner: false,
      sortItems: false,
      combineOutfits: false,
      show4StarItems: false,
      showMissingPieces: false,
      showEmptyBanners: false,
      showDuplicates: false,
    }
  }

  return {
    settings,
    resetToDefaults,
  }
}

export type DataSource = 'game' | 'pearpal'

export const useDataSource = () => {
  const dataSource = useLocalStorage<DataSource>('gongeous-data-source', 'game')
  return dataSource
}
