<template>
  <n-layout
    has-sider
    position="absolute"
  >
    <transition
      enter-active-class="transition duration-300 ease-in-out transform"
      leave-active-class="transition duration-300 ease-in-out transform"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <n-layout-header
        v-show="showHeader"
        class="fixed top-0 right-0 z-20 h-12 bg-gradient-to-r from-sky-100 via-purple-100 to-pink-100"
      >
        <div class="flex h-12 items-center justify-between">
          <div class="flex items-center">
            <n-button
              text
              class="w-12"
              aria-label="Toggle navigation menu"
              @click="showSider = !showSider"
              ><n-icon>
                <bars />
              </n-icon>
            </n-button>
            <NuxtLink
              to="/"
              class="pl-2"
            >
              <span
                class="text-xl font-bold font-sans transform scale-y-130 leading-none"
                >gongeo.us</span
              >
            </NuxtLink>
          </div>
          <div class="flex items-center pr-4">
            <UserProfile />
          </div>
        </div>
      </n-layout-header>
    </transition>

    <transition name="slide">
      <n-layout-sider
        collapse-mode="width"
        :native-scrollbar="false"
        :collapsed-width="48"
        :width="200"
        :collapsed="!showSider"
        class="fixed top-0 left-0 h-full shadow-lg z-10 bg-gradient-to-b from-sky-100 via-purple-100 to-pink-100 transition-all duration-300"
        :class="{
          'w-48 -translate-x-full sm:translate-x-0': !showSider,
          'w-64 translate-x-0': showSider,
        }"
        @collapse="showSider = false"
        @expand="showSider = true"
      >
        <n-menu
          class="mt-12"
          :collapsed="!showSider"
          :collapsed-width="48"
          :collapsed-icon-size="16"
          :icon-size="16"
          :indent="16"
          :root-indent="16"
          :options="menuOptions"
          :value="route.path.split('/')[1]"
          @update:value="handleMenuSelect"
        />
      </n-layout-sider>
    </transition>

    <n-layout-content>
      <n-scrollbar
        ref="scrollbarRef"
        class="flex-1 overflow-hidden bg-pink-50"
        @scroll="onScroll"
      >
        <div class="h-full pt-16 pb-10">
          <slot />
        </div>
      </n-scrollbar>
    </n-layout-content>

    <!-- Scroll to top button -->
    <transition
      enter-active-class="transition duration-300 ease-in-out transform"
      leave-active-class="transition duration-300 ease-in-out transform"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <n-button
        v-show="showScrollTop"
        circle
        size="small"
        class="fixed bottom-10 right-10 z-50 bg-white shadow-lg hover:bg-gray-100"
        @click="scrollToTop"
      >
        <n-icon size="small">
          <arrow-up />
        </n-icon>
      </n-button>
    </transition>

    <transition
      enter-active-class="transition duration-300 ease-in-out transform"
      leave-active-class="transition duration-300 ease-in-out transform"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <n-layout-footer
        v-show="showFooter"
        class="text-center text-sm text-gray-600 py-2 fixed bottom-0 left-0 right-0 bg-transparent"
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
              © 2025 gongeo.us © Infold Games All Rights Reserved.
            </p>
          </template>
          <div class="max-w-xs text-left">
            <p>
              This is an independent fan project, not affiliated with or
              endorsed by Infold/Paper Games.
            </p>
            <p class="mt-1">
              All game assets, content, and trademarks belong to their
              respective owners.
            </p>
          </div>
        </n-tooltip>
      </n-layout-footer>
    </transition>
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
  } from '@vicons/fa'
  import { h, ref, computed } from 'vue'
  import { NuxtLink } from '#components'
  import { useRoute, useRouter } from '#app'
  import UserProfile from '~/components/UserProfile.vue'

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const route = useRoute()
  const router = useRouter()

  const menuOptions = computed<MenuOption[]>(() =>
    [
      {
        label: 'Resonance Tracker',
        key: 'tracker',
        icon: renderIcon(Book),
      },
      {
        label: 'Import Data',
        key: 'import',
        icon: renderIcon(FileImport),
      },
      {
        label: 'Global Data',
        key: 'global',
        icon: renderIcon(Globe),
        disabled: true,
      },
      {
        label: 'Banner History',
        key: 'banner',
        icon: renderIcon(CalendarAlt),
      },
      {
        label: 'FAQ',
        key: 'faq',
        icon: renderIcon(QuestionCircle),
      },
      {
        label: 'About',
        key: 'about',
        icon: renderIcon(InfoCircle),
      },
    ].map((option) => ({
      ...option,
      active: route.path.startsWith(`/${option.key}`),
    }))
  )

  // Handle menu selection
  const handleMenuSelect = (key: string) => {
    router.push(`/${key}`)
    if (window.innerWidth < 640) {
      showSider.value = false
    }
  }

  const showHeader = ref(true)
  const showSider = ref(false)
  const showFooter = ref(true)
  const showScrollTop = ref(false)
  const lastScrollPosition = ref(0)
  const scrollbarRef = ref<HTMLElement | null>(null)

  const scrollToTop = () => {
    if (scrollbarRef.value) {
      scrollbarRef.value.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    const currentScrollPosition = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    // Show scroll to top button when scrolled down more than 300px
    showScrollTop.value = currentScrollPosition > 500

    // Show footer when near the bottom (within 150px)
    showFooter.value =
      scrollHeight - (currentScrollPosition + clientHeight) < 150

    lastScrollPosition.value = currentScrollPosition
  }
</script>

<style lang="scss" scoped>
  .n-scroll-area {
    height: calc(100vh - 48px);
  }

  :deep(.n-menu-item.n-menu-item--active) {
    background-color: rgba(255, 255, 255, 0.3);
  }
</style>
