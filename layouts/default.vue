<template>
  <n-layout
    ref="layoutRef"
    has-sider
    position="absolute"
  >
    <n-layout-header
      class="fixed top-0 right-0 z-50 h-12"
      :style="{
        background: isDark
          ? 'linear-gradient(to right, rgb(12, 74, 110), rgb(88, 28, 135), rgb(115, 55, 137))'
          : 'linear-gradient(to right, rgb(224, 242, 254), rgb(243, 232, 255), rgb(252, 231, 243))',
      }"
    >
      <div class="flex h-12 items-center justify-between">
        <div class="flex items-center">
          <n-button
            text
            class="w-12"
            :aria-label="t('accessibility.toggle_menu')"
            @click="showSider = !showSider"
            ><n-icon>
              <Bars />
            </n-icon>
          </n-button>
          <NuxtLink
            :to="localePath('/')"
            class="pl-2"
            @click.prevent="showSider = false"
          >
            <span
              class="text-xl font-bold"
              :class="locale === 'zh' ? 'align-baseline' : 'align-super'"
              >{{ t('navigation.title') }}</span
            >
          </NuxtLink>
        </div>
        <div class="flex gap-4 pr-4">
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
      class="fixed top-0 left-0 h-full shadow-lg z-40 transition-all duration-300 ease-in-out transform"
      :style="{
        background: isDark
          ? 'linear-gradient(to bottom, rgb(12, 74, 110), rgb(88, 28, 135), rgb(115, 55, 137))'
          : 'linear-gradient(to bottom, rgb(224, 242, 254), rgb(243, 232, 255), rgb(252, 231, 243))',
      }"
      :class="{
        '-translate-x-full xl:-translate-x-0': !showSider,
        'translate-x-0': showSider,
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Top Menu -->
        <n-menu
          class="mt-12 [&_.n-menu-item-content-header]:pl-2"
          :collapsed="!showSider"
          :collapsed-width="48"
          :collapsed-icon-size="16"
          :icon-size="16"
          :indent="16"
          :root-indent="16"
          :options="topMenuOptions"
          :value="route.path.split('/').pop()"
          @update:value="handleMenuSelect"
        />

        <!-- Spacer pushes the bottom menu to the bottom -->
        <div class="mt-auto">
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
      class="mt-12"
      :class="isDark ? '#0f172a' : '#fafafa'"
      :native-scrollbar="false"
      @scroll="onScroll"
    >
      <div
        ref="contentRef"
        class="h-full top-24 px-2 pt-2 sm:pt-4 pb-14 sm:pb-10"
      >
        <slot />
      </div>
    </n-layout-content>

    <n-layout-footer
      class="text-center text-sm opacity-80 mb-2 fixed bottom-0 left-0 right-0 bg-transparent transition-transform duration-300 ease-in-out"
      :class="{
        'translate-y-0': showFooter,
        'translate-y-12': !showFooter,
      }"
      :style="{
        color: isDark ? 'rgb(156, 163, 175)' : 'rgb(75, 85, 99)',
      }"
    >
      <n-tooltip
        :width="250"
        trigger="hover"
        placement="top"
      >
        <template #trigger>
          <p class="cursor-help sm:mx-auto mx-12 max-w-sm">
            {{ t('common.copyright') }}
          </p>
        </template>
        <div class="max-w-xs text-left">
          <p>
            {{ t('common.disclaimer.content') }}
          </p>
          <p class="mt-1">
            {{ t('common.disclaimer.rights') }}
          </p>
        </div>
      </n-tooltip>
    </n-layout-footer>

    <div
      v-if="showSider"
      class="fixed inset-0 z-30 xl:hidden"
      :class="isDark ? 'bg-black/15' : 'bg-black/5'"
      @click="showSider = false"
    />

    <!-- Scroll to top button -->
    <n-button
      ghost
      circle
      size="small"
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 opacity-60 hover:opacity-100 transition-transform duration-300 ease-in-out"
      :class="{
        'translate-y-0': showScrollTop,
        'translate-y-16': !showScrollTop,
      }"
      :style="{
        background: isDark ? 'rgb(31, 41, 55)' : 'white',
        '&:hover': {
          background: isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)',
        },
      }"
      :aria-label="t('accessibility.scroll_to_top')"
      @click="scrollToTop"
    >
      <n-icon>
        <ArrowUp />
      </n-icon>
    </n-button>
  </n-layout>
</template>

<script setup lang="ts">
  import {
    NLayout,
    NLayoutHeader,
    NLayoutSider,
    NMenu,
    NIcon,
    NButton,
    NLayoutFooter,
    NTooltip,
    type MenuOption,
  } from 'naive-ui'
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
  } from '@vicons/fa'
  import { h, ref, computed, watch } from 'vue'
  import { NuxtLink } from '#components'
  import UserProfile from '~/components/UserProfile.vue'
  import LanguageSwitcher from '~/components/LanguageSwitcher.vue'
  import KoFi from '~/components/icons/KoFi.vue'
  import { useUserStore } from '~/stores/user'
  import { useSwipe } from '@vueuse/core'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { locale } = useI18n()

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const route = useRoute()
  const router = useRouter()

  const siteUrl = useRuntimeConfig().public.siteUrl

  useHead({
    htmlAttrs: {
      lang: locale.value,
    },
    title: t('meta.title'),
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: t('meta.description.default'),
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'dastrokes' },
      {
        name: 'keywords',
        content: t('meta.keywords'),
      },
      {
        property: 'og:site_name',
        content: t('meta.title'),
      },
      {
        property: 'og:title',
        content: t('meta.title'),
      },
      {
        property: 'og:description',
        content: t('meta.description.default'),
      },
      {
        property: 'og:image',
        content: `${siteUrl}/og.png`,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: t('meta.title'),
      },
      {
        name: 'twitter:description',
        content: t('meta.description.default'),
      },
      {
        name: 'twitter:image',
        content: `${siteUrl}/og.png`,
      },
      {
        name: 'twitter:site',
        content: '@gongeo_us',
      },
      {
        name: 'twitter:creator',
        content: '@gongeo_us',
      },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'canonical', href: `${siteUrl}${localePath(route.path)}` },
    ],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: t('meta.title'),
          description: t('meta.description.default'),
          url: siteUrl,
          applicationCategory: 'Game Tool',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript. Requires HTML5.',
          author: {
            '@type': 'Person',
            name: 'dastrokes',
          },
          inLanguage: 'en',
          isFree: true,
        }),
      },
      {
        async: true,
        defer: true,
        src: '/gongeous.js',
        'data-host-url': 'https://gongeous-api.netlify.app',
        'data-website-id': 'dd22ab5d-2045-4450-aaff-f513339b5ca6',
      },
    ],
  })

  const topMenuOptions = computed<MenuOption[]>(() =>
    [
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
        key: 'banner',
        icon: renderIcon(CalendarAlt),
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
    ].map((option) => ({
      ...option,
    }))
  )

  const bottomMenuOptions = computed<MenuOption[]>(() =>
    [
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
            t('common.discord')
          ),
        key: 'discord',
        icon: renderIcon(Discord),
      },
      {
        label: () =>
          h(
            'a',
            {
              href: 'https://ko-fi.com/dastrokes',
              target: '_blank',
              rel: 'noopener noreferrer',
              class: 'no-underline text-inherit',
            },
            t('common.ko_fi')
          ),
        key: 'ko-fi',
        icon: renderIcon(KoFi),
      },
    ].map((option) => ({
      ...option,
    }))
  )

  const handleMenuSelect = (key: string) => {
    router.push(localePath(`/${key}`))
    showSider.value = false
  }

  const showSider = ref(false)
  const showFooter = ref(true)
  const showScrollTop = ref(false)
  const lastScrollPosition = ref(0)
  const scrollbarRef = ref<HTMLElement | null>(null)
  const contentRef = ref<HTMLElement | null>(null)

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

    lastScrollPosition.value = currentScrollPosition
  }

  watch(
    () => route.path,
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

  watch(locale, (newLocale) => {
    useHead({
      htmlAttrs: {
        lang: newLocale,
      },
    })
  })

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
