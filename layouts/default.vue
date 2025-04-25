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
        :collapsed-width="60"
        :width="200"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="60"
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
            <div class="flex row h-12 items-center pl-6">
              <NuxtLink
                to="/"
                class="text-xl font-bold text-gray-900 w-96"
              >
                Infinity Nikki Resonance Tracker
              </NuxtLink>
            </div>
          </n-layout-header>
        </transition>

        <n-scrollbar
          class="flex-1 overflow-hidden bg-rose-100"
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
    type MenuOption,
  } from 'naive-ui'
  import { FileImport, Book } from '@vicons/fa'
  import { h, ref } from 'vue'
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
  const collapsed = ref(false)
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
