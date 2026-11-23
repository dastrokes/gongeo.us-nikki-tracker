<template>
  <div
    ref="previewFrame"
    class="max-w-full min-w-0 overflow-hidden"
    :class="
      exportMode
        ? 'h-[1440px] w-[1080px] rounded-[40px]'
        : 'aspect-3/4 w-full rounded-xl'
    "
  >
    <article
      class="flex h-[1440px] w-[1080px] origin-top-left flex-col overflow-hidden rounded-[40px] border-2 border-[#ddd2e8] bg-[#fffafb] p-[32px] text-slate-900 shadow-[0_4px_20px_rgb(15_23_42/0.05)]"
      :style="canvasStyle"
    >
      <SharePosterHeader
        large
        :version="version"
      >
        <slot name="title" />
        <template
          v-if="$slots.aside"
          #aside
        >
          <slot name="aside" />
        </template>
      </SharePosterHeader>
      <slot />
    </article>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ exportMode?: boolean; version?: string | null }>()
  const previewFrame = ref<HTMLElement | null>(null)
  const previewScale = ref(0)
  let resizeObserver: ResizeObserver | undefined

  const canvasStyle = computed(() =>
    props.exportMode
      ? undefined
      : {
          opacity: previewScale.value ? '1' : '0',
          transform: `scale(${previewScale.value})`,
        }
  )

  onMounted(() => {
    const frame = previewFrame.value
    if (props.exportMode || !frame) return

    const updateScale = () => {
      previewScale.value = frame.clientWidth / 1080
    }
    updateScale()
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(frame)
  })

  onBeforeUnmount(() => resizeObserver?.disconnect())
</script>
