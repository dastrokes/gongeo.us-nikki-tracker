<template>
  <n-layout
    has-sider
    position="absolute"
  >
    <n-layout-header
      class="fixed top-0 right-0 z-20 h-12"
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
              <bars />
            </n-icon>
          </n-button>
          <NuxtLink
            :to="localePath('/')"
            class="pl-2"
          >
            <span class="text-xl font-bold font-sans leading-none"
              >gongeo.us</span
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
      class="fixed top-0 left-0 h-full shadow-lg z-10 transition-all duration-300 ease-in-out transform"
      :style="{
        background: isDark
          ? 'linear-gradient(to bottom, rgb(12, 74, 110), rgb(88, 28, 135), rgb(115, 55, 137))'
          : 'linear-gradient(to bottom, rgb(224, 242, 254), rgb(243, 232, 255), rgb(252, 231, 243))',
      }"
      :class="{
        '-translate-x-full sm:-translate-x-0': !showSider,
        'translate-x-0': showSider,
      }"
    >
      <n-menu
        class="mt-12 [&_.n-menu-item-content-header]:pl-2"
        :collapsed="!showSider"
        :collapsed-width="48"
        :collapsed-icon-size="16"
        :icon-size="16"
        :indent="16"
        :root-indent="16"
        :options="menuOptions"
        :value="route.path.split('/').pop()"
        @update:value="handleMenuSelect"
      />
      <div
        class="absolute bottom-4 left-0 right-0 flex justify-center"
        :class="{
          'flex-col space-y-4': !showSider,
          'space-x-4': showSider,
        }"
      >
        <n-tooltip
          trigger="hover"
          placement="top"
        >
          <template #trigger>
            <n-button
              text
              tag="a"
              href="https://discord.gg/qymsW3j4Zw"
              target="_blank"
              :class="
                isDark
                  ? 'text-gray-300 hover:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              "
              :aria-label="t('accessibility.join_discord')"
            >
              <template #icon>
                <n-icon><Discord /></n-icon>
              </template>
            </n-button>
          </template>
          {{ t('common.discord') }}
        </n-tooltip>
        <n-tooltip
          trigger="hover"
          placement="top"
        >
          <template #trigger>
            <n-button
              text
              tag="a"
              href="https://ko-fi.com/dastrokes"
              target="_blank"
              :class="
                isDark
                  ? 'text-gray-300 hover:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              "
              :aria-label="t('accessibility.support_ko_fi')"
            >
              <template #icon>
                <n-icon>
                  <KoFi />
                </n-icon>
              </template>
            </n-button>
          </template>
          {{ t('common.ko_fi') }}
        </n-tooltip>
      </div>
    </n-layout-sider>

    <n-layout-content
      ref="scrollbarRef"
      :native-scrollbar="false"
      @scroll="onScroll"
    >
      <div class="h-full py-12 sm:pt-16">
        <slot />
      </div>
    </n-layout-content>

    <n-layout-footer
      class="text-center text-sm py-2 fixed bottom-0 left-0 right-0 bg-transparent transition-transform duration-300 ease-in-out"
      :class="{
        'translate-y-0': showFooter,
        'translate-y-16': !showFooter,
      }"
      :style="{
        color: isDark ? 'rgb(156, 163, 175)' : 'rgb(75, 85, 99)',
      }"
    >
      <n-tooltip
        trigger="hover"
        placement="top"
        :theme-overrides="{
          common: {
            borderRadius: '8px',
          },
          peers: {
            Popover: {
              color: '#ffffff',
              textColor: '#000000',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            },
          },
        }"
      >
        <template #trigger>
          <p class="cursor-help">
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

    <!-- Scroll to top button -->
    <n-button
      ghost
      circle
      size="small"
      class="fixed bottom-8 right-8 z-50 transition-transform duration-300 ease-in-out"
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
      :aria-label="t('common.scroll_to_top')"
      @click="scrollToTop"
    >
      <n-icon size="small">
        <arrow-up />
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
  } from '@vicons/fa'
  import { h, ref, computed } from 'vue'
  import { NuxtLink } from '#components'
  import UserProfile from '~/components/UserProfile.vue'
  import LanguageSwitcher from '~/components/LanguageSwitcher.vue'
  import KoFi from '~/components/icons/KoFi.vue'
  import { useUserStore } from '~/stores/user'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const route = useRoute()
  const router = useRouter()

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://gongeous.netlify.app/'

  useHead({
    htmlAttrs: {
      lang: 'en',
    },
    title: t('meta.title'),
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: t('meta.description'),
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'dastrokes' },
      {
        name: 'keywords',
        content: t('meta.keywords'),
      },
      {
        name: 'yandex-verification',
        content: `8343c5759c772c9e`,
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
        content: t('meta.description'),
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
          description: t('meta.description'),
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
        'data-goatcounter': 'https://gongeous.goatcounter.com/count',
        async: true,
        src: '//gc.zgo.at/count.js',
      },
    ],
  })

  const menuOptions = computed<MenuOption[]>(() =>
    [
      {
        label: t('navigation.resonance_tracker'),
        key: 'tracker',
        icon: renderIcon(Book),
      },
      {
        label: t('navigation.import_data'),
        key: 'import',
        icon: renderIcon(FileImport),
      },
      {
        label: t('navigation.global_data'),
        key: 'global',
        icon: renderIcon(Globe),
      },
      {
        label: t('navigation.banner_history'),
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

  // Handle menu selection
  const handleMenuSelect = (key: string) => {
    router.push(localePath(`/${key}`))
    showSider.value = false
  }

  const showSider = ref(false)
  const showFooter = ref(true)
  const showScrollTop = ref(false)
  const lastScrollPosition = ref(0)
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
      scrollHeight - (currentScrollPosition + clientHeight) < 100

    lastScrollPosition.value = currentScrollPosition
  }
</script>
