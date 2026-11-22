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
      class="flex h-[1440px] w-[1080px] origin-top-left flex-col overflow-hidden rounded-[40px] border-2 border-[#DDD2E8] bg-[#fffafb] p-[32px] text-slate-900 shadow-[0_4px_20px_rgb(15_23_42/0.05)]"
      :style="canvasStyle"
    >
      <header class="flex h-[88px] shrink-0 items-center gap-5">
        <div
          class="flex size-[88px] shrink-0 items-center justify-center rounded-[24px] bg-white p-[14px] shadow-sm ring-1 ring-black/5"
        >
          <img
            src="/images/logo.webp"
            alt=""
            class="h-full w-full object-contain"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[25px] leading-8 font-semibold tracking-wide text-slate-500"
          >
            gongeo.us · Infinity Nikki
          </p>
          <h2
            class="flex min-w-0 items-baseline gap-4 text-[48px] leading-[1.12] font-bold text-slate-900"
          >
            <span class="min-w-0 truncate">
              <slot name="title" />
            </span>
            <span
              v-if="version"
              class="shrink-0 text-[32px] font-semibold whitespace-nowrap text-rose-700 tabular-nums"
            >
              {{ version }}
            </span>
          </h2>
        </div>
        <div
          v-if="$slots.aside"
          class="shrink-0 self-start"
        >
          <slot name="aside" />
        </div>
      </header>
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
