<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2 h-[calc(100vh-160px)] sm:h-[calc(100vh-110px)]"
      :style="cardStyle"
    >
      <ClientOnly>
        <template #fallback>
          <!-- Skeleton placeholder -->
          <div
            class="h-full p-4 grid gap-3"
            style="grid-template-rows: repeat(6, 1fr)"
          >
            <div
              v-for="(width, index) in barWidths"
              :key="index"
              class="flex items-center space-x-2 h-full"
            >
              <n-skeleton class="w-20 h-full" />
              <n-skeleton :class="`${width} h-full rounded`" />
            </div>
          </div>
        </template>

        <iframe
          src="https://flo.uri.sh/visualisation/24691802/embed"
          class="flourish-embed-iframe"
          frameborder="0"
          scrolling="no"
          style="width: 100%; height: 100%"
          sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        ></iframe>
      </ClientOnly>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const barWidths = ['w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2', 'w-2/5']
  const { cardStyle } = useCardStyle()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/timeline')}` }],
  }))
</script>
