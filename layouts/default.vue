<template>
  <n-layout
    class="min-h-screen"
    position="absolute"
  >
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
          bordered
          class="fixed top-0 left-0 right-0 bg-white z-50 h-12"
        >
          <div class="max-w-7xl mx-auto">
            <div class="flex row h-12 items-center">
              <NuxtLink
                to="/"
                class="text-xl font-bold text-gray-900 w-64"
              >
                Nikki Resonance
              </NuxtLink>
              <n-menu
                mode="horizontal"
                :options="menuOptions"
                class="hidden sm:flex"
              />

              <div class="flex items-center">
                <n-button
                  quaternary
                  circle
                  class="ml-3"
                >
                  <template #icon>
                    <n-icon><User /></n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-layout-header>
      </transition>

      <n-scrollbar
        class="flex-1 overflow-hidden"
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
</template>

<script setup lang="ts">
  import {
    NLayout,
    NLayoutHeader,
    NMenu,
    NButton,
    NIcon,
    type MenuOption,
  } from 'naive-ui'
  import { User } from '@vicons/fa'
  import { h, ref } from 'vue'
  import { NuxtLink } from '#components'

  const menuOptions: MenuOption[] = [
    {
      label: () =>
        h(NuxtLink, { to: '/tracker' }, { default: () => 'Banner Tracker' }),
      key: 'tracker',
    },
    {
      label: () =>
        h(NuxtLink, { to: '/import' }, { default: () => 'Import Data' }),
      key: 'import',
    },
  ]

  const showHeader = ref(true)
  // const showDrawer = ref(false)
  const lastScrollPosition = ref(0)

  const scrollContainer = ref<HTMLElement | null>(null)

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
