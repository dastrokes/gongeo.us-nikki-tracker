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
              @click="showSider = !showSider"
              ><n-icon>
                <bars />
              </n-icon>
            </n-button>
            <NuxtLink
              to="/"
              class="pl-2 font-bold text-xl"
            >
              <span class="text-2xl font-serif italic transform scale-y-130"
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
        :collapsed-width="isMobileScreen ? 0 : 48"
        :width="200"
        :collapsed="!showSider"
        class="fixed top-0 left-0 h-full w-64 shadow-lg z-10 bg-gradient-to-b from-sky-100 via-purple-100 to-pink-100"
        @collapse="showSider = false"
        @expand="showSider = true"
      >
        <n-menu
          class="mt-12"
          :collapsed="!showSider"
          :collapsed-width="isMobileScreen ? 0 : 48"
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
        class="flex-1 overflow-hidden bg-pink-50"
        @scroll="onScroll"
      >
        <div
          ref="scrollContainer"
          class="h-full overflow-y-hidden px-0 py-16"
        >
          <slot />
        </div>
      </n-scrollbar>
    </n-layout-content>
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
  import {
    FileImport,
    Book,
    Bars,
    QuestionCircleRegular,
    Globe,
  } from '@vicons/fa'
  import { h, ref, onMounted, onUnmounted, computed } from 'vue'
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
        label: 'FAQ',
        key: 'faq',
        icon: renderIcon(QuestionCircleRegular),
      },
    ].map((option) => ({
      ...option,
      active: route.path.startsWith(`/${option.key}`),
    }))
  )

  // Handle menu selection
  const handleMenuSelect = (key: string) => {
    router.push(`/${key}`)
    if (isMobileScreen.value) {
      showSider.value = false
    }
  }

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

  :deep(.n-menu-item.n-menu-item--active) {
    background-color: rgba(255, 255, 255, 0.3);
  }
</style>
