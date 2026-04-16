<template>
  <n-layout position="absolute">
    <n-layout-header
      class="fixed inset-x-0 top-0 z-50 h-14 bg-transparent backdrop-blur-xl backdrop-saturate-50 border-b border-white/20 bg-[linear-gradient(to_right,_rgba(232,221,249,0.78),_rgba(252,228,236,0.76),_rgba(253,237,220,0.74))] dark:border-white/5 dark:bg-[linear-gradient(to_right,_rgba(30,27,75,0.82),_rgba(88,28,100,0.78),_rgba(120,40,70,0.76))]"
    >
      <div
        class="mx-auto flex h-full max-w-7xl items-center gap-4 px-3 sm:gap-5 sm:px-5"
      >
        <div class="flex min-w-0 items-center gap-1 sm:gap-2">
          <n-button
            text
            class="h-12 w-12 shrink-0 transition-transform hover:scale-110 lg:hidden"
            :aria-label="$t('default.accessibility.toggle_menu')"
            @click="openMobileDrawer"
          >
            <n-icon>
              <Bars />
            </n-icon>
          </n-button>

          <NuxtLinkLocale
            no-prefetch
            to="/"
            class="flex min-w-0 items-center gap-2 pl-1 text-inherit no-underline sm:gap-2.5"
            @click="closeAllMenus"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/60 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:bg-slate-800/40 dark:ring-white/5"
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

            <span
              class="truncate text-xl font-bold hover:opacity-80 hover:drop-shadow-sm"
            >
              {{ $t('navigation.title') }}
            </span>
          </NuxtLinkLocale>
        </div>

        <div
          class="hidden flex-1 items-center justify-center gap-1.5 lg:flex xl:gap-3"
        >
          <div
            v-for="group in navigationGroups"
            :key="group.key"
            class="relative"
            @mouseenter="openDesktopMenu(group.key)"
            @mouseleave="scheduleCloseDesktopMenu"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 px-4 py-2 text-md font-semibold"
              :class="
                isNavGroupActive(group.key) || openDesktopGroup === group.key
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
              "
            >
              {{ group.label }}
              <n-icon
                size="10"
                class="mt-px shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openDesktopGroup === group.key }"
              >
                <CaretDown />
              </n-icon>
            </button>

            <div
              class="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform"
            >
              <n-collapse-transition
                appear
                :show="openDesktopGroup === group.key"
              >
                <div
                  class="min-w-[200px] origin-top rounded-xl border border-black/[0.06] bg-white p-1.5 ring-1 ring-black/5 dark:border-white/[0.02] dark:bg-slate-900 dark:ring-white/5"
                >
                  <button
                    v-for="item in group.items"
                    :key="item.key"
                    type="button"
                    class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    :class="
                      isNavItemActive(item.key)
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    "
                    @click="handleMenuSelect(item.key)"
                  >
                    <n-icon
                      size="16"
                      class="shrink-0"
                      :class="
                        isNavItemActive(item.key)
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                      "
                    >
                      <component :is="item.icon" />
                    </n-icon>
                    <span>{{ item.label }}</span>
                  </button>
                </div>
              </n-collapse-transition>
            </div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <LazySearchBar />

          <div
            class="flex items-center gap-3 border-l border-slate-400/80 pl-3 dark:border-white/25"
          >
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <UserProfile />
        </div>
      </div>
    </n-layout-header>

    <n-layout-content
      ref="scrollbarRef"
      position="absolute"
      class="!top-0 bg-[#F8FAFC] bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,221,249,0.56)_0%,transparent_68%)] dark:bg-[#101014] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,28,100,0.36)_0%,transparent_68%)]"
      :native-scrollbar="false"
      :scrollbar-props="{ verticalRailStyle: { top: '3.5rem' } }"
      @scroll="onScroll"
    >
      <div class="flex min-h-screen flex-col px-2 pt-16 sm:pt-[4.5rem]">
        <div class="flex-1">
          <slot />
        </div>

        <n-layout-footer
          class="mt-12 border-t border-gray-400/20 bg-gradient-to-r from-[#f5f0fa]/80 via-[#fff0f5]/80 to-[#fffacd]/50 backdrop-blur-sm dark:border-white/8 dark:from-[#1a1b2e]/80 dark:via-[#2d1b36]/80 dark:to-[#3d1b2e]/50"
        >
          <div class="mx-auto max-w-5xl p-4">
            <div
              class="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center lg:grid-cols-[auto_auto_auto] lg:justify-between"
            >
              <div
                class="flex flex-col items-center gap-6 md:items-start lg:justify-self-start"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:bg-slate-800/40 dark:ring-white/5 sm:h-12 sm:w-12"
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
                    <p class="text-xl font-semibold leading-tight">
                      {{ $t('navigation.title') }}
                    </p>
                  </div>
                </div>

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
                          class="relative h-[80%] w-[80%] -rotate-[5deg] object-contain transition-transform duration-300 group-hover:-rotate-[10deg]"
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

              <div
                class="flex flex-col flex-wrap justify-center gap-x-12 gap-y-8 pt-2 text-sm sm:flex-row md:justify-end lg:justify-self-end"
              >
                <div
                  v-for="(group, index) in footerLinkGroups"
                  :key="index"
                  class="flex flex-col items-center gap-3 sm:items-start"
                >
                  <template
                    v-for="link in group.items"
                    :key="link.key"
                  >
                    <NuxtLinkLocale
                      v-if="!link.to"
                      no-prefetch
                      :to="`/${link.key}`"
                      class="font-medium text-gray-500 no-underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      {{ $t(link.label) }}
                    </NuxtLinkLocale>
                    <a
                      v-else
                      :href="link.to"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="font-medium text-gray-500 no-underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      {{ $t(link.label) }}
                    </a>
                  </template>
                </div>
              </div>
            </div>

            <n-divider class="!my-4" />
            <div
              class="space-y-1 text-center text-xs text-gray-400 dark:text-gray-500"
            >
              <n-popover
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <p
                    class="cursor-help hover:text-gray-600 dark:hover:text-gray-300"
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
                  class="font-medium text-teal-500 no-underline hover:text-teal-600"
                >
                  Netlify
                </a>
                <span>·</span>
                <a
                  href="https://nuxt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-green-500 no-underline hover:text-green-600"
                >
                  Nuxt
                </a>
              </p>
            </div>
          </div>
        </n-layout-footer>
      </div>
    </n-layout-content>

    <n-button
      ghost
      circle
      size="small"
      class="fixed bottom-4 right-4 z-20 bg-white opacity-60 shadow-[0_0_10px_rgba(244,63,94,0.25),0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 ease-in-out hover:bg-slate-100 hover:opacity-100 hover:shadow-[0_0_14px_rgba(244,63,94,0.4),0_0_28px_rgba(168,85,247,0.25)] dark:bg-slate-800 dark:hover:bg-slate-700 sm:bottom-8 sm:right-8"
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

    <n-drawer
      v-model:show="mobileDrawerOpen"
      placement="left"
      :width="320"
    >
      <n-drawer-content
        :closable="false"
        body-content-class="!p-0"
      >
        <div class="flex h-full flex-col bg-white dark:bg-slate-900">
          <div
            class="flex h-14 items-center justify-between gap-3 border-b border-white/20 bg-[linear-gradient(to_right,_rgb(232,221,249),_rgb(252,228,236),_rgb(253,237,220))] px-3 backdrop-blur-md dark:border-white/5 dark:bg-[linear-gradient(to_right,_rgb(30,27,75),_rgb(88,28,100),_rgb(120,40,70))]"
          >
            <div class="flex min-w-0 items-center gap-1 sm:gap-2">
              <n-button
                text
                class="h-12 w-12 shrink-0 transition-transform hover:scale-110"
                :aria-label="$t('default.accessibility.toggle_menu')"
                @click="mobileDrawerOpen = false"
              >
                <n-icon>
                  <Times />
                </n-icon>
              </n-button>

              <NuxtLinkLocale
                no-prefetch
                to="/"
                class="flex min-w-0 items-center gap-2 pl-1 text-inherit no-underline sm:gap-2.5"
                @click="mobileDrawerOpen = false"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/60 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:bg-slate-800/40 dark:ring-white/5"
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

                <span
                  class="truncate text-xl font-bold hover:opacity-80 hover:drop-shadow-sm"
                >
                  {{ $t('navigation.title') }}
                </span>
              </NuxtLinkLocale>
            </div>
          </div>

          <n-scrollbar class="flex-1 px-3 pb-4 pt-2">
            <div class="space-y-1">
              <div
                v-for="group in navigationGroups"
                :key="group.key"
                class="pb-1"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-1.5 px-4 py-2 text-left text-md font-semibold"
                  :class="
                    isNavGroupActive(group.key) ||
                    expandedMobileGroup === group.key
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50'
                  "
                  @click="toggleMobileGroup(group.key)"
                >
                  <span>{{ group.label }}</span>
                  <n-icon
                    class="transition-transform duration-200"
                    size="14"
                    :class="{ 'rotate-180': expandedMobileGroup === group.key }"
                  >
                    <CaretDown />
                  </n-icon>
                </button>

                <n-collapse-transition
                  appear
                  :show="expandedMobileGroup === group.key"
                >
                  <div class="space-y-0.5 px-1 pb-2">
                    <button
                      v-for="item in group.items"
                      :key="item.key"
                      type="button"
                      class="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      :class="
                        isNavItemActive(item.key)
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      "
                      @click="handleMenuSelect(item.key)"
                    >
                      <n-icon
                        size="18"
                        class="shrink-0"
                        :class="
                          isNavItemActive(item.key)
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                        "
                      >
                        <component :is="item.icon" />
                      </n-icon>
                      <span>{{ item.label }}</span>
                    </button>
                  </div>
                </n-collapse-transition>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </n-drawer-content>
    </n-drawer>

    <div
      v-if="loading"
      class="fixed inset-0 z-[9999] cursor-progress select-none bg-black/10 pointer-events-auto dark:bg-black/20"
      aria-hidden="true"
    />
  </n-layout>
</template>

<script setup lang="ts">
  import { NIcon } from 'naive-ui'
  import {
    FileImport,
    Book,
    Bars,
    Times,
    Globe,
    PuzzlePiece,
    CalendarAlt,
    ArrowUp,
    AlignRight,
    Tshirt,
    ListAlt,
    SortAmountDown,
    ChartBar,
    CaretDown,
    Search,
    CommentDots,
  } from '@vicons/fa'

  type NavigationItem = {
    key: string
    label: string
    icon: Component
  }

  type NavigationGroup = {
    key: string
    label: string
    items: NavigationItem[]
  }

  const { t, locale, locales } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const { getImageSrc } = imageProvider()
  const nuxtApp = useNuxtApp()
  const loading = useState<boolean>('loading', () => false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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

  const navigationGroups = computed<NavigationGroup[]>(() => [
    {
      key: 'data',
      label: t('navigation.groups.data'),
      items: [
        { key: 'tracker', label: t('navigation.tracker'), icon: Book },
        { key: 'stats', label: t('navigation.stats'), icon: ChartBar },
        { key: 'import', label: t('navigation.import'), icon: FileImport },
      ],
    },
    {
      key: 'banner',
      label: t('navigation.groups.banner'),
      items: [
        { key: 'banners', label: t('navigation.banner'), icon: CalendarAlt },
        { key: 'timeline', label: t('navigation.timeline'), icon: AlignRight },
        { key: 'global', label: t('navigation.global'), icon: Globe },
      ],
    },
    {
      key: 'compendium',
      label: t('navigation.groups.compendium'),
      items: [
        { key: 'search', label: t('search_page.title'), icon: Search },
        { key: 'outfits', label: t('navigation.outfit'), icon: Tshirt },
        { key: 'items', label: t('navigation.item'), icon: ListAlt },
      ],
    },
    {
      key: 'community',
      label: t('navigation.groups.community'),
      items: [
        {
          key: 'tierlist',
          label: t('navigation.tierlist'),
          icon: SortAmountDown,
        },
        { key: 'quiz', label: t('quiz.title'), icon: PuzzlePiece },
        {
          key: 'feedback',
          label: t('feedback.queue_title'),
          icon: CommentDots,
        },
      ],
    },
  ])

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

  const routeLocaleCodes = computed(() =>
    (locales.value as { code: string }[]).map((entry) => entry.code)
  )

  const activeRouteSegment = computed(() => {
    const pathSegments = route.path.split('/').filter(Boolean)
    const firstSegment = pathSegments[0] || ''
    const isLocalePrefix = routeLocaleCodes.value.includes(firstSegment)
    const mainSegment = isLocalePrefix ? pathSegments[1] : pathSegments[0]

    return mainSegment || ''
  })

  const navItemGroupMap = computed<Record<string, string>>(() => {
    const map = Object.fromEntries(
      navigationGroups.value.flatMap((group) =>
        group.items.map((item) => [item.key, group.key] as const)
      )
    )

    return {
      ...map,
      vote: 'community',
      ranking: 'community',
    }
  })

  const activeNavGroupKey = computed(
    () => navItemGroupMap.value[activeRouteSegment.value] ?? null
  )

  const openDesktopGroup = ref<string | null>(null)
  const mobileDrawerOpen = ref(false)
  const expandedMobileGroup = ref<string | null>(null)
  const showScrollTop = ref(false)
  const scrollbarRef = ref<HTMLElement | null>(null)

  const isNavItemActive = (key: string) => activeRouteSegment.value === key
  const isNavGroupActive = (groupKey: string) =>
    activeNavGroupKey.value === groupKey

  const closeAllMenus = () => {
    openDesktopGroup.value = null
    mobileDrawerOpen.value = false
  }

  const openMobileDrawer = () => {
    openDesktopGroup.value = null
    expandedMobileGroup.value =
      activeNavGroupKey.value ?? navigationGroups.value[0]?.key ?? null
    mobileDrawerOpen.value = true
  }

  const toggleMobileGroup = (groupKey: string) => {
    expandedMobileGroup.value =
      expandedMobileGroup.value === groupKey ? null : groupKey
  }

  const desktopCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const openDesktopMenu = (groupKey: string) => {
    if (desktopCloseTimer.value) {
      clearTimeout(desktopCloseTimer.value)
      desktopCloseTimer.value = null
    }
    openDesktopGroup.value = groupKey
  }

  const scheduleCloseDesktopMenu = () => {
    desktopCloseTimer.value = setTimeout(() => {
      openDesktopGroup.value = null
      desktopCloseTimer.value = null
    }, 120)
  }

  const handleMenuSelect = async (key: string) => {
    closeAllMenus()
    await navigateTo(localePath(`/${key}`))
  }

  const scrollToTop = () => {
    scrollbarRef.value?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const onScroll = (event: Event) => {
    const target = event.target as HTMLElement
    showScrollTop.value = target.scrollTop > 1000
  }

  const { direction } = useSwipe(() => (import.meta.client ? window : null), {
    threshold: 50,
    onSwipe() {
      if (direction.value === 'left' && mobileDrawerOpen.value) {
        mobileDrawerOpen.value = false
      }
    },
  })

  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeAllMenus()
    }
  }

  watch(
    () => route.fullPath,
    () => {
      openDesktopGroup.value = null
      mobileDrawerOpen.value = false
      expandedMobileGroup.value = activeNavGroupKey.value

      if (scrollbarRef.value) {
        scrollbarRef.value.scrollTo({
          top: 0,
          behavior: 'instant',
        })
      }
    }
  )

  watch(isDesktop, (value) => {
    if (value) {
      mobileDrawerOpen.value = false
    }
  })

  onMounted(() => {
    expandedMobileGroup.value =
      activeNavGroupKey.value ?? navigationGroups.value[0]?.key ?? null
    window.addEventListener('keydown', handleGlobalKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown)
    if (desktopCloseTimer.value) clearTimeout(desktopCloseTimer.value)
  })
</script>
