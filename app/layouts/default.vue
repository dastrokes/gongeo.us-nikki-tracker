<template>
  <n-layout
    ref="layoutRef"
    has-sider
    position="absolute"
  >
    <n-layout-header
      class="fixed top-0 right-0 z-50 h-12 backdrop-blur-md bg-[linear-gradient(to_right,_rgb(232,221,249),_rgb(252,228,236),_rgb(253,237,220))] dark:bg-[linear-gradient(to_right,_rgb(30,27,75),_rgb(88,28,100),_rgb(120,40,70))] border-b border-white/20 dark:border-white/5"
    >
      <div class="flex h-12 items-center justify-between relative z-10">
        <div class="flex items-center">
          <n-button
            text
            class="w-12 hover:scale-110 transition-transform"
            :aria-label="$t('default.accessibility.toggle_menu')"
            @click="showSider = !showSider"
            ><n-icon>
              <Bars />
            </n-icon>
          </n-button>
          <NuxtLinkLocale
            no-prefetch
            to="/"
            class="pl-2"
            @click.prevent="showSider = false"
          >
            <span
              class="text-xl font-bold transition-all duration-300 hover:opacity-80 hover:drop-shadow-sm"
              >{{ $t('navigation.title') }}</span
            >
          </NuxtLinkLocale>
        </div>

        <div class="flex gap-4 pr-4">
          <LazySearchBar />
          <LanguageSwitcher />
          <ThemeSwitcher />
          <UserProfile />
        </div>
      </div>
    </n-layout-header>

    <n-layout-sider
      collapse-mode="width"
      :collapsed-width="48"
      :width="200"
      :collapsed="!showSider"
      class="fixed top-0 left-0 h-full shadow-lg z-40 transition-all duration-300 ease-in-out transform bg-[linear-gradient(to_bottom,_rgb(232,221,249),_rgb(252,228,236),_rgb(253,237,220))] dark:bg-[linear-gradient(to_bottom,_rgb(30,27,75),_rgb(88,28,100),_rgb(120,40,70))]"
      :class="{
        '-translate-x-full 2xl:-translate-x-0': !showSider,
        'translate-x-0': showSider,
      }"
    >
      <div class="flex h-full min-h-0 flex-col">
        <!-- Top Menu -->
        <n-scrollbar class="mt-12 flex-1 min-h-0">
          <n-menu
            class="[&_.n-menu-item-content-header]:pl-2"
            :collapsed="!showSider"
            :collapsed-width="48"
            :collapsed-icon-size="16"
            :icon-size="16"
            :indent="16"
            :root-indent="16"
            :options="topMenuOptions"
            :value="activeMenuItem"
            @update:value="handleMenuSelect"
          />
        </n-scrollbar>
      </div>
    </n-layout-sider>

    <n-layout-content
      ref="scrollbarRef"
      class="mt-12 min-h-[calc(100vh-3rem)] bg-[#F8FAFC] dark:bg-[#101014] bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,221,249,0.56)_0%,transparent_68%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,28,100,0.36)_0%,transparent_68%)]"
      :native-scrollbar="false"
      @scroll="onScroll"
    >
      <div class="flex min-h-[calc(100vh-3rem)] flex-col px-2 pt-2 sm:pt-4">
        <div class="flex-1">
          <slot />
        </div>

        <!-- ── Site Footer ── -->
        <n-layout-footer
          class="mt-12 border-t border-gray-400/20 dark:border-white/8 bg-gradient-to-r from-[#f5f0fa]/80 via-[#fff0f5]/80 to-[#fffacd]/50 dark:from-[#1a1b2e]/80 dark:via-[#2d1b36]/80 dark:to-[#3d1b2e]/50 backdrop-blur-sm"
        >
          <div class="max-w-5xl mx-auto p-4">
            <!-- Main footer content -->
            <div
              class="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center lg:grid-cols-[auto_auto_auto] lg:justify-between"
            >
              <!-- Left side: Branding & Social -->
              <div
                class="flex flex-col items-center gap-6 md:items-start lg:justify-self-start"
              >
                <!-- Branding -->
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white/60 p-2 shadow-sm ring-1 ring-purple-200/50 dark:bg-slate-800/60 dark:ring-purple-600/30 backdrop-blur-sm"
                  >
                    <NuxtImg
                      src="images/logo.webp"
                      preset="iconSm"
                      fit="cover"
                      loading="lazy"
                      :alt="$t('navigation.title')"
                      class="h-full w-full"
                    />
                  </div>
                  <div class="text-left">
                    <p
                      class="text-xs font-semibold uppercase tracking-widest text-rose-500/80 dark:text-rose-300/80"
                    >
                      {{ $t('meta.game_title') }}
                    </p>
                    <p class="font-semibold text-xl leading-tight">
                      {{ $t('navigation.title') }}
                    </p>
                  </div>
                </div>

                <!-- Social Links -->
                <div>
                  <SocialLinks />
                </div>
              </div>

              <div
                class="flex flex-wrap items-center justify-center gap-2.5 md:px-2 lg:justify-self-center lg:px-0"
              >
                <n-tooltip
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <a
                      href="https://discord.gg/qymsW3j4Zw"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="$t('default.social.discord')"
                      class="group relative inline-flex aspect-square w-16 items-center justify-center"
                    >
                      <div
                        class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-rose-200/50 shadow-[0_8px_18px_rgba(244,114,182,0.10)] dark:border-black/20 dark:shadow-[0_6px_14px_rgba(2,6,23,0.10)]"
                      >
                        <NuxtImg
                          :src="getImageSrc('emote', 'hi')"
                          preset="iconSm"
                          sizes="60px"
                          class="relative h-[80%] w-[80%] object-contain transition-transform duration-300 -rotate-[5deg] group-hover:-rotate-[10deg]"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                  </template>
                  {{ $t('default.social.discord') }}
                </n-tooltip>
                <n-tooltip
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <a
                      href="https://ko-fi.com/gongeous"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="$t('default.social.kofi')"
                      class="group relative inline-flex aspect-square w-16 items-center justify-center"
                    >
                      <div
                        class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-pink-200/50 shadow-[0_8px_18px_rgba(244,114,182,0.10)] dark:border-black/20 dark:shadow-[0_6px_14px_rgba(2,6,23,0.10)]"
                      >
                        <NuxtImg
                          :src="getImageSrc('emote', 'love')"
                          preset="iconSm"
                          sizes="60px"
                          class="relative h-[93%] w-[93%] object-contain transition-transform duration-300 group-hover:translate-y-[-2px]"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                  </template>
                  {{ $t('default.social.kofi') }}
                </n-tooltip>

                <n-tooltip
                  trigger="hover"
                  placement="top"
                >
                  <template #trigger>
                    <a
                      href="https://x.com/gongeo_us"
                      target="_blank"
                      rel="noopener noreferrer"
                      :aria-label="$t('default.social.twitter')"
                      class="group relative inline-flex aspect-square w-16 items-center justify-center"
                    >
                      <div
                        class="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-sky-200/50 shadow-[0_8px_18px_rgba(56,189,248,0.10)] dark:border-black/20 dark:shadow-[0_6px_14px_rgba(2,6,23,0.10)]"
                      >
                        <NuxtImg
                          :src="getImageSrc('emote', 'news')"
                          preset="iconSm"
                          sizes="60px"
                          class="relative h-[80%] w-[80%] object-contain transition-transform duration-300 group-hover:translate-x-[-2px]"
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                  </template>
                  {{ $t('default.social.twitter') }}
                </n-tooltip>
              </div>

              <!-- Right side: Link groups -->
              <div
                class="flex flex-col flex-wrap justify-center gap-x-12 gap-y-8 pt-2 text-sm sm:flex-row md:justify-end lg:justify-self-end"
              >
                <div
                  v-for="(group, index) in footerLinkGroups"
                  :key="index"
                  class="flex flex-col items-center sm:items-start gap-3"
                >
                  <template
                    v-for="link in group.items"
                    :key="link.key"
                  >
                    <NuxtLinkLocale
                      v-if="!link.to"
                      no-prefetch
                      :to="`/${link.key}`"
                      class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors no-underline font-medium"
                    >
                      {{ $t(link.label) }}
                    </NuxtLinkLocale>
                    <a
                      v-else
                      :href="link.to"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors no-underline font-medium"
                    >
                      {{ $t(link.label) }}
                    </a>
                  </template>
                </div>
              </div>
            </div>

            <!-- Bottom: copyright + disclaimer -->
            <n-divider class="!my-4" />
            <div
              class="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1"
            >
              <n-popover
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <p
                    class="cursor-help hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {{ $t('default.copyright') }}
                  </p>
                </template>
                <div class="max-w-xs text-left text-xs">
                  <p>{{ $t('default.disclaimer.content') }}</p>
                  <p class="mt-1">{{ $t('default.disclaimer.rights') }}</p>
                </div>
              </n-popover>
              <p class="flex items-center justify-center gap-1 p-2">
                <span>{{ $t('default.built_with') }}</span>
                <a
                  href="https://www.netlify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-teal-500 hover:text-teal-600 transition-colors no-underline font-medium"
                  >Netlify</a
                >
                <span>·</span>
                <a
                  href="https://nuxt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-green-500 hover:text-green-600 transition-colors no-underline font-medium"
                  >Nuxt</a
                >
              </p>
            </div>
          </div>
        </n-layout-footer>
      </div>
    </n-layout-content>

    <!-- Scroll to top button -->
    <n-button
      ghost
      circle
      size="small"
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 opacity-60 hover:opacity-100 transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[0_0_10px_rgba(244,63,94,0.25),0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_14px_rgba(244,63,94,0.4),0_0_28px_rgba(168,85,247,0.25)]"
      :class="{
        'translate-y-0': showScrollTop,
        'translate-y-16': !showScrollTop,
      }"
      :aria-label="t('default.accessibility.scroll_to_top')"
      @click="scrollToTop"
    >
      <n-icon>
        <ArrowUp />
      </n-icon>
    </n-button>

    <button
      v-if="showSider"
      class="fixed inset-0 z-30 2xl:hidden bg-black/10 dark:bg-black/20 cursor-default focus:outline-none"
      :aria-label="$t('default.accessibility.close_menu')"
      @click="showSider = false"
    />

    <div
      v-if="loading"
      class="fixed inset-0 z-[9999] pointer-events-auto select-none cursor-progress bg-black/10 dark:bg-black/20"
      aria-hidden="true"
    />
  </n-layout>
</template>

<script setup lang="ts">
  import { NIcon, type MenuOption } from 'naive-ui'
  import {
    FileImport,
    Book,
    Bars,
    Globe,
    PuzzlePiece,
    CalendarAlt,
    ArrowUp,
    AlignRight,
    Tshirt,
    ListAlt,
    SortAmountDown,
    ChartBar,
  } from '@vicons/fa'
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { locale } = useI18n()
  const { getImageSrc } = imageProvider()
  const nuxtApp = useNuxtApp()
  const loading = useState<boolean>('loading', () => false)

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const route = useRoute()
  nuxtApp.hook('page:start', () => {
    loading.value = true
  })

  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => {
      loading.value = false
    })
  })

  nuxtApp.hook('app:error', () => {
    loading.value = false
  })

  const topMenuOptions = computed<MenuOption[]>(() => [
    {
      label: t('navigation.tracker'),
      key: 'tracker',
      icon: renderIcon(Book),
    },
    {
      label: t('navigation.stats'),
      key: 'stats',
      icon: renderIcon(ChartBar),
    },
    {
      label: t('navigation.global'),
      key: 'global',
      icon: renderIcon(Globe),
    },
    {
      label: t('navigation.import'),
      key: 'import',
      icon: renderIcon(FileImport),
    },
    {
      label: t('navigation.banner'),
      key: 'banners',
      icon: renderIcon(CalendarAlt),
    },
    {
      label: t('navigation.timeline'),
      key: 'timeline',
      icon: renderIcon(AlignRight),
    },
    {
      label: t('navigation.outfit'),
      key: 'outfits',
      icon: renderIcon(Tshirt),
    },
    {
      label: t('navigation.item'),
      key: 'items',
      icon: renderIcon(ListAlt),
    },
    {
      label: t('navigation.tierlist'),
      key: 'tierlist',
      icon: renderIcon(SortAmountDown),
    },
    {
      label: t('quiz.title'),
      key: 'quiz',
      icon: renderIcon(PuzzlePiece),
    },
  ])

  // Footer navigation link groups
  const footerLinkGroups = computed<
    {
      items: { key: string; label: string; to?: string }[]
    }[]
  >(() => [
    {
      items: [
        { key: 'faq', label: 'navigation.faq' },
        { key: 'about', label: 'navigation.about' },
      ],
    },
    {
      items: [
        {
          key: 'discord',
          label: 'navigation.join_community',
          to: 'https://discord.gg/qymsW3j4Zw',
        },
        {
          key: 'kofi',
          label: 'navigation.support_website',
          to: 'https://ko-fi.com/gongeous',
        },
        {
          key: 'crowdin',
          label: 'default.language_switcher.help_translate',
          to: 'https://crowdin.com/project/gongeous',
        },
      ],
    },
    {
      items: [
        {
          key: 'official',
          label: 'navigation.official_website',
          to:
            locale.value === 'zh'
              ? 'https://infinitynikki.nuanpaper.com'
              : 'https://infinitynikki.infoldgames.com',
        },
        {
          key: 'nuan5',
          label: 'navigation.nuan5pro',
          to: 'https://nuan5.pro',
        },
      ],
    },
  ])

  const activeMenuItem = computed(() => {
    // Get the path without locale prefix
    const pathSegments = route.path.split('/').filter(Boolean)

    // Remove locale prefix if present
    const locales = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ja', 'ko', 'zh', 'tw']
    const firstSegment = pathSegments[0] || ''
    const isLocalePrefix = locales.includes(firstSegment)

    // Get the main route segment (after locale if present)
    const mainSegment = isLocalePrefix ? pathSegments[1] : pathSegments[0]

    // Return the main segment or empty string for home
    return mainSegment || ''
  })

  const handleMenuSelect = (key: string) => {
    navigateTo(localePath(`/${key}`))
    showSider.value = false
  }

  const showSider = ref(false)
  const showScrollTop = ref(false)
  const scrollbarRef = ref<HTMLElement | null>(null)

  const scrollToTop = () => {
    scrollbarRef.value?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    // Show scroll to top button when scrolled down more than 1000px
    showScrollTop.value = target.scrollTop > 1000
  }

  watch(
    () => route.fullPath,
    () => {
      // Scroll to top on route change
      if (scrollbarRef.value) {
        scrollbarRef.value.scrollTo({
          top: 0,
          behavior: 'instant',
        })
      }
    }
  )

  // Setup swipe handling
  const layoutRef = ref<HTMLElement | null>(null)
  const { direction } = useSwipe(layoutRef, {
    threshold: 50,
    onSwipe() {
      if (direction.value === 'left' && showSider.value) {
        showSider.value = false
      }
    },
  })
</script>
