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
                class="text-gray-600 hover:text-gray-900"
              >
                <template #icon>
                  <n-icon><Discord /></n-icon>
                </template>
              </n-button>
            </template>
            Discord
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
                class="text-gray-600 hover:text-gray-900"
              >
                <template #icon>
                  <n-icon>
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      style="width: 16px; height: 16px"
                    >
                      <path
                        d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298"
                      />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </template>
            Ko-fi
          </n-tooltip>
        </div>
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
    Discord,
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
