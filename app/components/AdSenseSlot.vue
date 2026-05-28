<template>
  <div
    role="complementary"
    :aria-label="t('about.advertising.title')"
    class="adsense-slot mx-auto mt-4 h-[100px] w-80 max-w-[calc(100vw-24px)] overflow-hidden sm:mt-8 sm:h-[90px] sm:w-[728px] sm:max-w-[calc(100vw-32px)]"
  >
    <ClientOnly>
      <ins
        v-if="shouldShowAdElement"
        ref="adElement"
        class="adsbygoogle"
        :style="adStyle"
        :data-ad-client="ADSENSE_CLIENT"
        :data-ad-slot="ADSENSE_SLOT"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </ClientOnly>

    <n-card
      v-if="shouldShowFallback"
      size="small"
      content-class="flex h-full items-center justify-between gap-2 p-3 text-left sm:gap-4 sm:p-4"
      class="h-full w-full rounded-xl p-0"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 p-2 shadow-xs ring-1 ring-black/5 sm:h-12 sm:w-12 dark:bg-slate-800/70 dark:ring-white/10"
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
        <div class="hidden min-w-0 sm:block">
          <p
            class="truncate text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-200"
          >
            {{ t('navigation.support_website') }}
          </p>
          <p
            class="mt-1 line-clamp-1 max-w-md text-xs text-slate-500 sm:text-sm dark:text-slate-400"
          >
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
        :aria-label="t('default.social.kofi')"
        class="shrink-0"
      >
        <template #icon>
          <n-icon>
            <SvgIcon name="kofi" />
          </n-icon>
        </template>
        <span>{{ t('default.social.kofi') }}</span>
      </n-button>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  type AdSenseQueue = Array<Record<string, unknown>>
  type AdSenseStatus = 'loading' | 'filled' | 'fallback'

  declare global {
    interface Window {
      adsbygoogle?: AdSenseQueue
    }
  }

  const ADSENSE_CLIENT = 'ca-pub-9717879492261560'
  const ADSENSE_SLOT = '8191507909'
  const FALLBACK_TIMEOUT_MS = 3000

  const { t } = useI18n()
  const config = useRuntimeConfig()
  const adElement = ref<HTMLElement | null>(null)
  const hasRequestedAd = ref(false)
  const adStatus = ref<AdSenseStatus>('loading')
  const fallbackTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  let observer: MutationObserver | null = null
  const isAdSenseEnabled = computed(() => Boolean(config.public.adsenseEnabled))
  const adStyle = {
    display: 'block',
    height: '100%',
    maxHeight: '100%',
    width: '100%',
  }
  const shouldShowAdElement = computed(
    () => isAdSenseEnabled.value && adStatus.value !== 'fallback'
  )
  const shouldShowFallback = computed(
    () => !isAdSenseEnabled.value || adStatus.value === 'fallback'
  )
  const clearFallbackTimer = () => {
    if (!fallbackTimer.value) return

    clearTimeout(fallbackTimer.value)
    fallbackTimer.value = null
  }

  const setAdFallback = () => {
    if (adStatus.value === 'filled') return

    adStatus.value = 'fallback'
    clearFallbackTimer()
    observer?.disconnect()
    observer = null
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
    }, FALLBACK_TIMEOUT_MS)
  }

  const requestAd = async () => {
    if (!import.meta.client || !isAdSenseEnabled.value || hasRequestedAd.value)
      return

    hasRequestedAd.value = true
    await nextTick()

    if (!adElement.value) {
      hasRequestedAd.value = false
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
      startFallbackTimer()
    } catch {
      setAdFallback()
    }
  }

  onMounted(() => {
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
