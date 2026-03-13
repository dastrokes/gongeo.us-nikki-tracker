type PullStoreData = {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  evo: Record<number, EvoRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
}

export const usePullStoreData = () => {
  const pullStore = usePullStore()
  const { loadData } = useIndexedDB()
  const dataSource = useDataSource()

  const initFromData = async (data: PullStoreData) => {
    const { pulls, edits, evo, pearpal } = data
    const hasPearpal = Object.keys(pearpal).length > 0
    const hasGame =
      Object.keys(pulls).length > 0 || Object.keys(edits).length > 0
    const dataSourceOverride = pullStore.dataSource
    const effectiveDataSource = dataSourceOverride ?? dataSource.value

    pullStore.reset()
    // Preserve import data source
    pullStore.dataSource = dataSourceOverride

    if (hasPearpal && hasGame) {
      if (effectiveDataSource === 'pearpal') {
        await pullStore.processPearpalData(pearpal)
      } else if (effectiveDataSource === 'game') {
        await pullStore.processPullData(pulls, edits)
      } else {
        await pullStore.processAutoData(pulls, edits, pearpal)
      }
    } else if (hasPearpal) {
      await pullStore.processPearpalData(pearpal)
    } else if (hasGame) {
      await pullStore.processPullData(pulls, edits)
    }

    if (Object.keys(evo).length > 0) {
      pullStore.evoData = evo
    }

    return {
      pulls,
      edits,
      evo,
      pearpal,
      hasPearpal,
      hasGame,
    }
  }

  const initFromIndexedDB = async () => {
    const data = await loadData()
    return initFromData(data)
  }

  return {
    initFromIndexedDB,
    initFromData,
  }
}
