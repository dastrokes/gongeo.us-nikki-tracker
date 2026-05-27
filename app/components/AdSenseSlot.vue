<template>
  <div
    v-if="shouldRenderSlot"
    role="complementary"
    :aria-label="t('about.advertising.title')"
    :class="containerClasses"
  >
    <ClientOnly>
      <ins
        v-if="isAdSenseEnabled"
        ref="adElement"
        class="adsbygoogle"
        :style="adStyle"
        :data-ad-client="ADSENSE_CLIENT"
        :data-ad-slot="adConfig.slot"
        :data-ad-format="adConfig.format"
        v-bind="adConfig.attributes"
      />
    </ClientOnly>

    <n-card
      v-if="shouldShowFallback"
      size="small"
      content-class="flex flex-col items-center justify-center gap-4 p-3 text-center sm:flex-row sm:p-4"
      :class="fallbackClasses"
    >
      <div
        class="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 p-2 shadow-xs ring-1 ring-black/5 dark:bg-slate-800/70 dark:ring-white/10"
        >
          <NuxtImg
            src="images/logo.webp"
            preset="iconSm"
            fit="cover"
            loading="lazy"
            :alt="t('navigation.title')"
            class="h-full w-full"
          />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {{ t('navigation.support_website') }}
          </p>
          <p class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {{ t('default.description') }}
          </p>
        </div>
      </div>
      <n-button
        size="small"
        secondary
        tag="a"
        href="https://ko-fi.com/gongeous"
        target="_blank"
        rel="noopener noreferrer"
      >
        <template #icon>
          <n-icon>
            <SvgIcon name="kofi" />
          </n-icon>
        </template>
        {{ t('default.social.kofi') }}
      </n-button>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  type AdSenseVariant = 'display' | 'in-feed'

  type AdSenseConfig = {
    slot: string
    format: string
    attributes: Record<string, string>
    containerClass: string
    fallbackClass: string
  }

  type AdSenseQueue = Array<Record<string, unknown>>
  type AdSenseStatus = 'loading' | 'filled' | 'fallback'

  declare global {
    interface Window {
      adsbygoogle?: AdSenseQueue
    }
  }

  const ADSENSE_CLIENT = 'ca-pub-9717879492261560'
  const AD_CONFIG = {
    display: {
      slot: '8191507909',
      format: 'auto',
      attributes: {
        'data-full-width-responsive': 'true',
      },
      containerClass:
        'min-h-[120px] border-y border-slate-200/70 py-4 dark:border-white/10 sm:min-h-[160px]',
      fallbackClass: 'min-h-[112px] rounded-xl p-0 sm:min-h-[132px] sm:p-2',
    },
    'in-feed': {
      slot: '3174984944',
      format: 'fluid',
      attributes: {
        'data-ad-layout-key': '-gw-3+1f-3d+2z',
      },
      containerClass: '',
      fallbackClass: '',
    },
  } satisfies Record<AdSenseVariant, AdSenseConfig>

  const props = withDefaults(
    defineProps<{
      variant?: AdSenseVariant
    }>(),
    {
      variant: 'display',
    }
  )
  const emit = defineEmits<{
    collapse: []
  }>()

  const { t } = useI18n()
  const config = useRuntimeConfig()
  const adElement = ref<HTMLElement | null>(null)
  const hasRequestedAd = ref(false)
  const adStatus = ref<AdSenseStatus>('loading')
  const fallbackTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  let observer: MutationObserver | null = null
  const adStyle = { display: 'block' }
  const isAdSenseEnabled = computed(() => Boolean(config.public.adsenseEnabled))
  const adConfig = computed(() => AD_CONFIG[props.variant])
  const isInFeedAd = computed(() => props.variant === 'in-feed')
  const shouldRenderSlot = computed(
    () =>
      props.variant === 'display' ||
      (isAdSenseEnabled.value && adStatus.value !== 'fallback')
  )
  const shouldShowFallback = computed(
    () =>
      props.variant === 'display' &&
      (!isAdSenseEnabled.value || adStatus.value === 'fallback')
  )
  const containerClasses = computed(() => [
    'adsense-slot w-full overflow-hidden',
    adConfig.value.containerClass,
  ])
  const fallbackClasses = computed(() => [adConfig.value.fallbackClass])

  const clearFallbackTimer = () => {
    if (!fallbackTimer.value) return

    clearTimeout(fallbackTimer.value)
    fallbackTimer.value = null
  }

  const setAdFallback = () => {
    if (adStatus.value === 'filled') return

    adStatus.value = 'fallback'
    clearFallbackTimer()

    if (isInFeedAd.value) {
      emit('collapse')
    }
  }

  const updateAdStatus = () => {
    const element = adElement.value
    if (!element) return

    if (element.dataset.adStatus === 'filled') {
      adStatus.value = 'filled'
      clearFallbackTimer()
      observer?.disconnect()
      observer = null
      return
    }

    if (element.dataset.adStatus === 'unfilled') {
      setAdFallback()
    }
  }

  const observeAdStatus = () => {
    if (!import.meta.client || !adElement.value || observer) return

    observer = new MutationObserver(updateAdStatus)
    observer.observe(adElement.value, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
    })
  }

  const startFallbackTimer = () => {
    clearFallbackTimer()
    fallbackTimer.value = window.setTimeout(() => {
      updateAdStatus()

      if (adStatus.value !== 'filled') {
        setAdFallback()
      }
    }, 3000)
  }

  const requestAd = async () => {
    if (!import.meta.client || !isAdSenseEnabled.value || hasRequestedAd.value)
      return

    await nextTick()

    if (!adElement.value) {
      return
    }

    observeAdStatus()

    if (adElement.value.dataset.adsbygoogleStatus === 'done') {
      updateAdStatus()

      if (adStatus.value !== 'filled') {
        startFallbackTimer()
      }

      return
    }

    const adsbygoogle = window.adsbygoogle ?? []
    window.adsbygoogle = adsbygoogle

    try {
      adsbygoogle.push({})
      hasRequestedAd.value = true
      startFallbackTimer()
    } catch {
      hasRequestedAd.value = true
      setAdFallback()
    }
  }

  onMounted(() => {
    if (!isAdSenseEnabled.value && isInFeedAd.value) {
      emit('collapse')
      return
    }

    void requestAd()
  })

  watch(
    adElement,
    (element) => {
      if (!element) return

      observeAdStatus()
      void requestAd()
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    clearFallbackTimer()
    observer?.disconnect()
  })
</script>
