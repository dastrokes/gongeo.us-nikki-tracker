export interface DeferredSectionRenderOptions {
  rootMargin?: string
  threshold?: number
}

export const useDeferredSectionRender = (
  target: Ref<HTMLElement | null>,
  options: DeferredSectionRenderOptions = {}
) => {
  const shouldRender = ref(false)
  let stopObserver: (() => void) | null = null

  const renderNow = () => {
    if (shouldRender.value) return

    shouldRender.value = true
    stopObserver?.()
  }

  const { stop } = useIntersectionObserver(
    target,
    (entries) => {
      if (entries[0]?.isIntersecting) {
        renderNow()
      }
    },
    {
      rootMargin: options.rootMargin ?? '400px',
      threshold: options.threshold ?? 0,
    }
  )
  stopObserver = stop

  onMounted(() => {
    if (!('IntersectionObserver' in window)) {
      renderNow()
    }
  })

  onUnmounted(() => {
    stopObserver?.()
  })

  return {
    shouldRender,
    renderNow,
  }
}
