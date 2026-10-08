<template>
  <div
    ref="containerRef"
    class="relative h-full w-full"
  >
    <VChart
      ref="chartRef"
      :option="preparedOption"
    />
    <n-skeleton
      v-if="!ready"
      height="100%"
      class="absolute inset-0"
    />
  </div>
</template>

<script setup lang="ts">
  import type VChartComponent from 'vue-echarts'
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core'

  const props = defineProps<{
    option: ECOption
    preloadImages?: boolean
  }>()
  const chartRef = shallowRef<InstanceType<typeof VChartComponent> | null>(null)
  const containerRef = ref<HTMLElement | null>(null)
  const preparedOption = shallowRef<ECOption>()
  const ready = ref(false)
  const reducedMotion = usePreferredReducedMotion()
  const images = new Map<string, Promise<HTMLImageElement | undefined>>()
  let revision = 0
  let frame = 0

  const resizeChart = () => {
    const chart = chartRef.value
    if (!chart?.chart || chart.isDisposed()) return
    const container = chart.getDom()
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return
    if (
      Math.round(chart.getWidth()) !== width ||
      Math.round(chart.getHeight()) !== height
    ) {
      chart.resize({ width, height, animation: { duration: 0 }, silent: true })
    }
  }

  useResizeObserver(containerRef, resizeChart)

  const loadImage = (src: string) => {
    const cached = images.get(src)
    if (cached) return cached

    const pending = new Promise<HTMLImageElement | undefined>((resolve) => {
      const image = new Image()
      let finished = false
      const finish = (loaded?: HTMLImageElement) => {
        if (finished) return
        finished = true
        clearTimeout(timeout)
        image.onload = null
        image.onerror = null
        if (!loaded) images.delete(src)
        resolve(loaded)
      }
      const timeout = setTimeout(() => finish(), 10000)
      image.onload = () => {
        void image
          .decode()
          .catch(() => undefined)
          .then(() => finish(image))
      }
      image.onerror = () => finish()
      image.src = src
    })
    images.set(src, pending)
    return pending
  }

  const prepareAxis = async <T extends ECOption['xAxis'] | ECOption['yAxis']>(
    axis: T
  ): Promise<T> => {
    if (Array.isArray(axis)) {
      return (await Promise.all(axis.map(prepareAxis))) as T
    }
    const label = axis?.axisLabel
    if (!label?.rich) return axis

    const rich = Object.fromEntries(
      await Promise.all(
        Object.entries(label.rich).map(async ([key, style]) => {
          const background = style.backgroundColor
          if (
            !background ||
            typeof background !== 'object' ||
            typeof background.image !== 'string'
          ) {
            return [key, style]
          }
          const image = await loadImage(background.image)
          return [
            key,
            image
              ? { ...style, backgroundColor: { ...background, image } }
              : style,
          ]
        })
      )
    )
    return { ...axis, axisLabel: { ...label, rich } } as T
  }

  watch(
    [
      () => chartRef.value?.chart,
      () => props.option,
      reducedMotion,
      () => props.preloadImages,
    ],
    async ([chart, source]) => {
      const currentRevision = ++revision
      cancelAnimationFrame(frame)
      if (!chart || chart.isDisposed()) return
      if (Object.keys(source).length === 0) {
        chartRef.value?.clear()
        preparedOption.value = undefined
        ready.value = false
        return
      }

      const option = { ...source }
      if (props.preloadImages) {
        const [xAxis, yAxis] = await Promise.all([
          prepareAxis(source.xAxis),
          prepareAxis(source.yAxis),
        ])
        option.xAxis = xAxis
        option.yAxis = yAxis
      }
      if (currentRevision !== revision || chart.isDisposed()) return

      await nextTick()
      if (currentRevision !== revision || chart.isDisposed()) return
      frame = requestAnimationFrame(() => {
        if (currentRevision !== revision || chart.isDisposed()) return
        resizeChart()
        preparedOption.value = {
          ...option,
          animation:
            reducedMotion.value !== 'reduce' && (option.animation ?? true),
        }
        ready.value = true
      })
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    revision++
    cancelAnimationFrame(frame)
  })
</script>
