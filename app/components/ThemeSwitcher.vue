<template>
  <button
    type="button"
    :aria-label="$t('default.accessibility.theme_switcher')"
    :aria-pressed="isDark"
    class="group relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center justify-between overflow-hidden rounded-full bg-black/3 p-0.75 text-slate-500 transition-colors duration-200 hover:bg-black/5 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-rose-500/80 focus-visible:outline-hidden motion-reduce:transition-none dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-200"
    @click="toggleTheme"
  >
    <span
      class="absolute top-0.75 left-0.75 h-5.5 w-5.5 rounded-full bg-white/75 shadow-xs transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-slate-700/70"
      :class="{ 'translate-x-6': isDark }"
      aria-hidden="true"
    />

    <n-icon
      size="16"
      class="relative z-10 ml-0.75 transition-colors duration-200 motion-reduce:transition-none"
      :class="isDark ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800'"
    >
      <SvgIcon name="theme-sun" />
    </n-icon>

    <n-icon
      size="16"
      class="relative z-10 mr-0.75 transition-colors duration-200 motion-reduce:transition-none"
      :class="isDark ? 'text-white' : 'text-slate-400'"
    >
      <SvgIcon name="theme-moon" />
    </n-icon>
  </button>
</template>

<script setup lang="ts">
  const { isDark, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }
</script>
