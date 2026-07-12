<template>
  <div
    ref="carouselRef"
    class="relative h-full w-full touch-pan-y overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
    role="group"
    aria-roledescription="carousel"
  >
    <div
      v-for="(banner, slideIndex) in banners"
      :key="getSlideKey(slideIndex)"
      class="absolute inset-0"
      :class="
        slideIndex === activeIndex
          ? 'pointer-events-auto'
          : 'pointer-events-none'
      "
      :style="{
        transitionDuration: '1000ms',
        transitionTimingFunction: 'ease-in-out',
        transitionProperty: 'opacity',
        willChange: 'opacity',
        backfaceVisibility: 'hidden',
        opacity: slideIndex === activeIndex ? '1' : '0',
      }"
      :aria-hidden="slideIndex === activeIndex ? 'false' : 'true'"
    >
      <NuxtLinkLocale
        no-prefetch
        :to="getBannerDetailPath(banner.bannerId)"
        class="relative block h-full w-full overflow-hidden rounded-xl transition-opacity duration-200 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden focus-visible:ring-inset"
        @click.capture="handleSlideClickCapture"
      >
        <div
          class="absolute inset-0 z-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <NuxtImg
            v-if="shouldRenderSlideImage(slideIndex)"
            :src="getImageSrc('banner', banner.bannerId)"
            :alt="t(`banner.${banner.bannerId}.name`)"
            class="h-full w-full object-cover"
            preset="bannerHero"
            fit="cover"
            :loading="slideIndex === activeIndex ? 'eager' : 'lazy'"
            :fetchpriority="getSlideFetchPriority(slideIndex)"
            sizes="300px sm:600px"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-white/10"
          />
        </div>
        <n-tooltip
          overlap
          placement="top-end"
          class="m-2 cursor-pointer rounded-lg px-2 py-1 text-xs"
          @click.stop.prevent="
            navigateTo(localePath(getBannerDetailPath(banner.bannerId)))
          "
        >
          <template #trigger>
            <div class="absolute inset-0 z-10" />
          </template>
          <span class="inline-flex items-center gap-2">
            {{ t('navigation.banner_detail') }}
            <n-icon><ExternalLinkAlt /></n-icon>
          </span>
        </n-tooltip>
      </NuxtLinkLocale>

      <n-tag
        v-if="formattedTime"
        round
        :bordered="false"
        size="small"
        class="absolute right-2 bottom-2 z-20 origin-bottom-right scale-90 bg-white/80! text-slate-700! shadow-sm ring-1 ring-black/10 backdrop-blur-md sm:scale-100 dark:bg-slate-950/70! dark:text-white! dark:ring-white/15"
      >
        {{ formattedTime }}
        <template #icon>
          <n-icon size="12">
            <HourglassHalf />
          </n-icon>
        </template>
      </n-tag>
      <n-tag
        v-if="banner.runs.length > 1"
        round
        :bordered="false"
        size="small"
        class="absolute top-2 left-2 z-20 origin-top-left scale-90 bg-white/80! text-slate-700! shadow-sm ring-1 ring-black/10 backdrop-blur-md sm:scale-100 dark:bg-slate-950/70! dark:text-white! dark:ring-white/15"
      >
        {{ $t('default.rerun') }}
      </n-tag>
    </div>

    <div
      v-if="hasMultipleSlides"
      class="absolute bottom-2 left-2 z-10 flex gap-2 rounded-full p-1"
    >
      <button
        v-for="(banner, index) in banners"
        :key="`dot-${banner.bannerId}`"
        :class="[
          'block aspect-square h-2 shrink-0 cursor-pointer rounded-full transition-all duration-300 hover:opacity-80',
          activeIndex === index
            ? 'scale-125 bg-slate-50 opacity-100 shadow-xs'
            : 'bg-slate-50 opacity-50',
        ]"
        type="button"
        :aria-label="t(`banner.${banner.bannerId}.name`)"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ExternalLinkAlt, HourglassHalf } from '@vicons/fa'
  import { intlLocaleMap } from '~/locales/locales'

  const autoAdvanceMs = 10000

  const props = defineProps<{
    banners: Banner[]
    targetTime: Date
    priority?: boolean
  }>()

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const initialNow = useState<number>('banner-carousel-now', () => Date.now())

  const carouselRef = ref<HTMLElement | null>(null)
  const activeIndex = ref(0)
  const loadedSlideIndexes = ref<number[]>([0])
  const hasMultipleSlides = computed(() => props.banners.length > 1)
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null
  const didSwipe = ref(false)
  const now = ref(initialNow.value)

  const normalizeIndex = (value: number) => {
    const total = props.banners.length
    if (total <= 0) return 0
    return ((value % total) + total) % total
  }

  const getBanner = (index: number) => props.banners[index] as Banner

  const getSlideKey = (index: number) => {
    const banner = getBanner(index)
    return `${banner.bannerId}-${index}`
  }

  const clearAutoAdvanceTimer = () => {
    if (!autoAdvanceTimer) return
    clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }

  const restartAutoAdvance = () => {
    clearAutoAdvanceTimer()
    if (!import.meta.client) return
    if (!hasMultipleSlides.value || autoAdvanceMs <= 0) return

    autoAdvanceTimer = setTimeout(() => {
      activeIndex.value = normalizeIndex(activeIndex.value + 1)
    }, autoAdvanceMs)
  }

  const goTo = (index: number) => {
    if (props.banners.length === 0) return
    activeIndex.value = normalizeIndex(index)
  }

  const shouldRenderSlideImage = (index: number) =>
    index === activeIndex.value || loadedSlideIndexes.value.includes(index)

  const getSlideFetchPriority = (index: number) =>
    props.priority && index === activeIndex.value ? 'high' : 'auto'

  const next = () => {
    if (!hasMultipleSlides.value) return
    goTo(activeIndex.value + 1)
  }

  const prev = () => {
    if (!hasMultipleSlides.value) return
    goTo(activeIndex.value - 1)
  }

  useSwipe(carouselRef, {
    threshold: 50,
    onSwipeStart() {
      didSwipe.value = false
    },
    onSwipeEnd(_, direction) {
      if (!hasMultipleSlides.value) return

      if (direction === 'left') {
        didSwipe.value = true
        next()
        return
      }

      if (direction === 'right') {
        didSwipe.value = true
        prev()
      }
    },
  })

  const handleSlideClickCapture = (event: MouseEvent) => {
    if (!didSwipe.value) return
    event.preventDefault()
    event.stopPropagation()
    didSwipe.value = false
  }

  watch(
    () => props.banners.length,
    () => {
      activeIndex.value = normalizeIndex(activeIndex.value)
      loadedSlideIndexes.value = [activeIndex.value]
      restartAutoAdvance()
    },
    { immediate: true }
  )

  watch(
    () => autoAdvanceMs,
    () => {
      restartAutoAdvance()
    }
  )

  watch(activeIndex, (nextIndex, previousIndex) => {
    if (!loadedSlideIndexes.value.includes(nextIndex)) {
      loadedSlideIndexes.value = [...loadedSlideIndexes.value, nextIndex]
    }

    if (
      props.banners.length === 0 ||
      previousIndex === undefined ||
      previousIndex < 0 ||
      previousIndex >= props.banners.length ||
      nextIndex === previousIndex
    ) {
      restartAutoAdvance()
      return
    }

    restartAutoAdvance()
  })

  const formattedTime = computed(() => {
    const diffInMs = props.targetTime.getTime() - now.value
    if (diffInMs <= 0) return ''

    const diffInHours = diffInMs / (1000 * 60 * 60)
    const days = Math.floor(diffInHours / 24)
    const hours = Math.floor(diffInHours % 24)
    const intlLocale = intlLocaleMap[locale.value] || 'en-US'
    const parts: string[] = []

    try {
      const dayFormatter = new Intl.NumberFormat(intlLocale, {
        style: 'unit',
        unit: 'day',
        unitDisplay: 'long',
      })
      const hourFormatter = new Intl.NumberFormat(intlLocale, {
        style: 'unit',
        unit: 'hour',
        unitDisplay: 'long',
      })

      if (days > 0) {
        parts.push(dayFormatter.format(days))
      }
      if (hours > 0) {
        parts.push(hourFormatter.format(hours))
      }
    } catch {
      const rtf = new Intl.RelativeTimeFormat(intlLocale, {
        numeric: 'always',
        style: 'long',
      })

      if (days > 0) {
        parts.push(rtf.format(days, 'day').replace(/^in /, ''))
      }
      if (hours > 0) {
        parts.push(rtf.format(hours, 'hour').replace(/^in /, ''))
      }
    }

    return parts.join(' ')
  })

  onMounted(() => {
    now.value = Date.now()
  })

  onBeforeUnmount(() => {
    clearAutoAdvanceTimer()
  })
</script>
