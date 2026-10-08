export const useStatsChartMaximize = (pageRef: Ref<HTMLElement | null>) => {
  const maximizedChart = ref<string | null>(null)
  const toggleMaximize = (chartId: string | null) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  let previousScrollTop = 0
  let previousOverflow = ''
  let scrollElement: HTMLElement | null = null
  watch(maximizedChart, async (activeChart, previousChart) => {
    if (!import.meta.client) return
    const container = pageRef.value?.closest<HTMLElement>(
      '.app-layout-native-scrollbar'
    )
    if (!container) return
    if (activeChart && !previousChart) {
      previousScrollTop = container.scrollTop
      previousOverflow = container.style.overflow
      scrollElement = container
    }
    container.style.overflow = activeChart ? 'hidden' : previousOverflow
    await nextTick()
    if (maximizedChart.value !== activeChart || !pageRef.value) return
    container.scrollTo({
      top: activeChart ? 0 : previousScrollTop,
      behavior: 'instant',
    })
    if (!activeChart) scrollElement = null
  })
  onBeforeUnmount(() => {
    if (scrollElement) scrollElement.style.overflow = previousOverflow
  })

  return { maximizedChart, toggleMaximize }
}
