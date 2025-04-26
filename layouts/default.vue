<template>
  <n-layout
    class="min-h-screen"
    position="absolute"
  >
    <n-layout
      has-sider
      position="absolute"
    >
      <n-layout-sider
        collapse-mode="width"
        :native-scrollbar="false"
        :collapsed-width="isMobileScreen ? 0 : 60"
        :width="200"
        :collapsed="!showSider"
        :show-trigger="!isMobileScreen"
        @collapse="showSider = false"
        @expand="showSider = true"
      >
        <n-menu
          :collapsed="!showSider"
          :collapsed-width="isMobileScreen ? 0 : 60"
          :collapsed-icon-size="16"
          :options="menuOptions"
          class="pt-12"
        />
      </n-layout-sider>

      <n-layout>
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
            class="fixed top-0 right-0 z-50 h-12"
          >
            <div class="flex h-12 items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <n-button
                  quaternary
                  class="sm:hidden"
                  @click="showSider = !showSider"
                >
                  <template #icon>
                    <n-icon>
                      <bars />
                    </n-icon>
                  </template>
                </n-button>
                <NuxtLink
                  to="/"
                  class="text-xl font-bold pl-2"
                >
                  Nikki Tracker
                </NuxtLink>
              </div>
            </div>
          </n-layout-header>
        </transition>

        <n-scrollbar
          class="flex-1 overflow-hidden bg-rose-50"
          @scroll="onScroll"
        >
          <div
            ref="scrollContainer"
            class="h-full overflow-y-auto px-4 py-6"
          >
            <slot />
          </div>
        </n-scrollbar>
      </n-layout>
    </n-layout>
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
    type MenuOption,
  } from 'naive-ui'
  import { FileImport, Book, Bars } from '@vicons/fa'
  import { h, ref, onMounted, onUnmounted } from 'vue'
  import { NuxtLink } from '#components'

  function renderIcon(icon: Component) {
    return () => h(NIcon, null, { default: () => h(icon) })
  }

  const menuOptions: MenuOption[] = [
    {
      label: () =>
        h(NuxtLink, { to: '/import' }, { default: () => 'Import Data' }),
      key: 'import',
      icon: renderIcon(FileImport),
    },
    {
      label: () =>
        h(NuxtLink, { to: '/tracker' }, { default: () => 'Resonance Tracker' }),
      key: 'tracker',
      icon: renderIcon(Book),
    },
  ]

  const showHeader = ref(true)
  const showSider = ref(false)
  const lastScrollPosition = ref(0)
  const scrollContainer = ref<HTMLElement | null>(null)

  // Add mobile screen detection
  const isMobileScreen = ref(false)

  const updateScreenSize = () => {
    isMobileScreen.value = window.innerWidth < 640 // 640px is Tailwind's 'sm' breakpoint
  }

  onMounted(() => {
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize)
  })

  const onScroll = (e: Event) => {
    const target = e.target as HTMLElement
    const currentScrollPosition = target.scrollTop

    // Show header at the top and when scrolling up
    showHeader.value =
      currentScrollPosition < 100 ||
      currentScrollPosition < lastScrollPosition.value

    lastScrollPosition.value = currentScrollPosition
  }
</script>

<style lang="scss" scoped>
  .n-scroll-area {
    height: calc(100vh - 48px);
  }
</style>
