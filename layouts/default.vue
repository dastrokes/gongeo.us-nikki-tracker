<template>
  <n-layout
    ref="layoutRef"
    has-sider
    position="absolute"
  >
    <n-layout-header
      class="fixed top-0 right-0 z-50 h-12 bg-[linear-gradient(to_right,_rgb(224,242,254),_rgb(243,232,255),_rgb(252,231,243))] dark:bg-[linear-gradient(to_right,_rgb(12,74,110),_rgb(88,28,135),_rgb(115,55,137))]"
    >
      <div class="flex h-12 items-center justify-between">
        <div class="flex items-center">
          <n-button
            text
            class="w-12"
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
              class="text-xl font-bold"
              :class="locale === 'zh' ? 'align-baseline' : 'align-super'"
              >{{ $t('navigation.title') }}</span
            >
          </NuxtLinkLocale>
        </div>

        <div class="flex gap-4 pr-4">
          <SearchBar />
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
      class="fixed top-0 left-0 h-full shadow-lg z-40 transition-all duration-300 ease-in-out transform bg-[linear-gradient(to_bottom,_rgb(224,242,254),_rgb(243,232,255),_rgb(252,231,243))] dark:bg-[linear-gradient(to_bottom,_rgb(12,74,110),_rgb(88,28,135),_rgb(115,55,137))]"
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

        <!-- Spacer pushes the bottom menu to the bottom -->
        <div class="shrink-0">
          <n-menu
            class="[&_.n-menu-item-content-header]:pl-2"
            :collapsed="!showSider"
            :collapsed-width="48"
            :collapsed-icon-size="16"
            :icon-size="16"
            :indent="16"
            :root-indent="16"
            :options="bottomMenuOptions"
          />
        </div>
      </div>
    </n-layout-sider>

    <n-layout-content
      ref="scrollbarRef"
      class="mt-12 bg-[#f8fafc] dark:bg-[#101014]"
      :native-scrollbar="false"
      @scroll="onScroll"
    >
      <div class="h-full top-24 px-2 pt-2 sm:pt-4 pb-14 sm:pb-10">
        <slot />
      </div>
    </n-layout-content>

    <n-layout-footer
      class="text-center text-sm opacity-80 mb-2 fixed bottom-0 left-0 right-0 bg-transparent transition-transform duration-300 ease-in-out text-slate-600 dark:text-slate-200"
      :class="{
        'translate-y-0': showFooter,
        'translate-y-12': !showFooter,
      }"
    >
      <n-tooltip
        :width="250"
        trigger="hover"
        placement="top"
      >
        <template #trigger>
          <p class="cursor-help sm:mx-auto mx-12 max-w-sm">
            {{ $t('default.copyright') }}
          </p>
        </template>
        <div class="max-w-xs text-left">
          <p>
            {{ t('default.disclaimer.content') }}
          </p>
          <p class="mt-1">
            {{ t('default.disclaimer.rights') }}
          </p>
        </div>
      </n-tooltip>
    </n-layout-footer>

    <!-- Scroll to top button -->
    <n-button
      ghost
      circle
      size="small"
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 opacity-60 hover:opacity-100 transition-transform duration-300 ease-in-out bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
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

    <div
      v-if="showSider"
      class="fixed inset-0 z-30 2xl:hidden bg-black/10 dark:bg-black/20"
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
    QuestionCircle,
    Globe,
    CalendarAlt,
    ArrowUp,
    InfoCircle,
    Discord,
    Magic,
    Poll,
    Tshirt,
    ListAlt,
    SortAmountDown,
  } from '@vicons/fa'
  import KoFi from '~/components/icons/KoFi.vue'
  import Netlify from '~/components/icons/Netlify.vue'
  import { useSwipe } from '@vueuse/core'
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { locale } = useI18n()
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
      label: t('navigation.import'),
      key: 'import',
      icon: renderIcon(FileImport),
    },
    {
      label: t('navigation.global'),
      key: 'global',
      icon: renderIcon(Globe),
    },
    {
      label: t('navigation.banner'),
      key: 'banners',
      icon: renderIcon(CalendarAlt),
    },
    {
      label: t('common.outfits'),
      key: 'outfits',
      icon: renderIcon(Tshirt),
    },
    {
      label: t('common.items'),
      key: 'items',
      icon: renderIcon(ListAlt),
    },
    {
      label: t('navigation.tierlist'),
      key: 'tierlist',
      icon: renderIcon(SortAmountDown),
    },
    {
      label: t('navigation.vote'),
      key: 'ranking',
      icon: renderIcon(Poll),
    },
    {
      label: t('navigation.faq'),
      key: 'faq',
      icon: renderIcon(QuestionCircle),
    },
    {
      label: t('navigation.about'),
      key: 'about',
      icon: renderIcon(InfoCircle),
    },
  ])

  const bottomMenuOptions = computed<MenuOption[]>(() => [
    {
      label: () =>
        h(
          'a',
          {
            href: 'https://nuan5.pro',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'no-underline text-inherit',
          },
          t('navigation.nuan5pro')
        ),
      key: 'nuan5pro',
      icon: renderIcon(Magic),
    },
    {
      label: () =>
        h(
          'a',
          {
            href: 'https://discord.gg/qymsW3j4Zw',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'no-underline text-inherit',
          },
          'Discord'
        ),
      key: 'discord',
      icon: renderIcon(Discord),
    },
    {
      label: () =>
        h(
          'a',
          {
            href: 'https://ko-fi.com/gongeous',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'no-underline text-inherit',
          },
          'Ko-fi'
        ),
      key: 'ko-fi',
      icon: renderIcon(KoFi),
    },
    {
      label: () =>
        h(
          'a',
          {
            href: 'https://www.netlify.com/',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'no-underline text-inherit',
          },
          'Built with Netlify'
        ),
      key: 'netlify',
      icon: renderIcon(Netlify),
    },
  ])

  const activeMenuItem = computed(() => {
    // Get the path without locale prefix
    const pathSegments = route.path.split('/').filter(Boolean)

    // Remove locale prefix if present
    const locales = [
      'en',
      'de',
      'es',
      'fr',
      'id',
      'it',
      'ja',
      'ko',
      'pt',
      'th',
      'zh',
      'tw',
    ]
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
  const showFooter = ref(true)
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
    const currentScrollPosition = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    // Show scroll to top button when scrolled down more than 1000px
    showScrollTop.value = currentScrollPosition > 1000

    // Show footer when near the bottom (within 100px)
    showFooter.value =
      scrollHeight - (currentScrollPosition + clientHeight) < 100 ||
      currentScrollPosition < 50
  }

  watch(
    () => route.fullPath,
    () => {
      // Show footer on route change
      showFooter.value = true
      // Scroll to top
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
