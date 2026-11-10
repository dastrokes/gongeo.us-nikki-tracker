<template>
  <div
    class="lucky-machine-reveal absolute inset-0 grid place-items-center"
    :class="{
      'is-spinning': phase === 'spinning',
      'is-holding': phase === 'holding',
      'is-revealing': phase === 'revealing',
    }"
    aria-hidden="true"
  >
    <div class="lucky-machine-frame relative aspect-4/5 w-[min(90%,18rem)]">
      <GachaponMachineSvg
        class="h-full w-full drop-shadow-lg"
        :pulling="reducedMotion !== 'reduce'"
        @pulled="leverReady = true"
      />
    </div>

    <div class="lucky-icon-reel">
      <div
        class="lucky-icon-track"
        :style="{ '--reel-count': Math.max(images.length, 1) }"
        @animationend.self="holdWinner"
      >
        <NuxtImg
          v-for="(src, index) in images"
          :key="`${index}-${src}`"
          :src="src"
          alt=""
          class="lucky-icon-image box-border block aspect-square w-full object-contain p-[10%]"
          preset="iconLg"
          sizes="120px"
          fit="contain"
          loading="eager"
          @load="markReady(index)"
          @error="markReady(index)"
        />
      </div>
    </div>

    <div
      v-if="winnerImage"
      class="lucky-machine-winner"
    >
      <NuxtImg
        :src="winnerImage"
        alt=""
        preset="iconLg"
        sizes="120px"
        fit="contain"
        class="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { usePreferredReducedMotion } from '@vueuse/core'

  const props = defineProps<{ images: string[]; previewReady: boolean }>()
  const emit = defineEmits<{ settled: [] }>()
  const reducedMotion = usePreferredReducedMotion()
  const phase = ref<'waiting' | 'spinning' | 'holding' | 'revealing'>('waiting')
  const leverReady = ref(false)
  const imagesReady = ref(false)
  const holdFinished = ref(false)
  const winnerImage = computed(() => props.images.at(-1))
  const readyImages = new Set<number>()
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let preloadTimeout: ReturnType<typeof setTimeout> | undefined
  let isDisposed = false

  const schedule = (callback: () => void, duration: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      callback()
    }, duration)
    timers.add(timer)
    return timer
  }

  const markReady = (index: number) => {
    readyImages.add(index)
    if (readyImages.size !== props.images.length) return
    clearTimeout(preloadTimeout)
    imagesReady.value = true
  }

  watch(
    () => props.images,
    (images) => {
      if (!images.length) return
      // Images prepare during the lever movement; a slow asset cannot block a pull.
      preloadTimeout = schedule(() => (imagesReady.value = true), 1200)
    },
    { immediate: true }
  )

  watch([leverReady, imagesReady], ([lever, images]) => {
    if (lever && images && phase.value === 'waiting') phase.value = 'spinning'
  })

  const holdWinner = () => {
    if (phase.value !== 'spinning') return
    phase.value = 'holding'
    schedule(
      () => (holdFinished.value = true),
      reducedMotion.value === 'reduce' ? 0 : 160
    )
  }

  watch([holdFinished, () => props.previewReady], async ([held, ready]) => {
    if (!held || !ready || phase.value !== 'holding') return
    phase.value = 'revealing'
    // Keep this same icon mounted as the preview fades in behind it.
    await nextTick()
    if (!isDisposed) emit('settled')
  })

  watch(
    reducedMotion,
    (motion) => {
      if (motion === 'reduce') leverReady.value = true
    },
    { immediate: true }
  )

  onUnmounted(() => {
    isDisposed = true
    for (const timer of timers) clearTimeout(timer)
  })
</script>

<style scoped>
  .lucky-machine-frame {
    transition:
      opacity 450ms ease,
      transform 450ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  :is(.is-spinning, .is-holding, .is-revealing) .lucky-machine-frame {
    opacity: 0;
    transform: scale(0.98);
  }

  .lucky-icon-reel {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0;
    mask-image: linear-gradient(transparent, black 22%, black 78%, transparent);
    transform: scale(0.98);
    transition:
      opacity 450ms ease,
      transform 450ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .is-spinning .lucky-icon-reel {
    opacity: 1;
    transform: scale(1);
  }

  .is-holding .lucky-icon-reel,
  .is-revealing .lucky-icon-reel {
    opacity: 0;
    transform: scale(1);
    transition: none;
  }

  .lucky-icon-track {
    position: absolute;
    top: 50%;
    left: 7%;
    width: 86%;
    transform: translateY(calc(-50% / var(--reel-count)));
  }

  :is(.is-spinning, .is-holding, .is-revealing) .lucky-icon-track {
    animation: lucky-icon-spin 1.6s cubic-bezier(0.12, 0.65, 0.18, 1) forwards;
    will-change: transform;
  }

  .lucky-machine-winner {
    position: absolute;
    left: 50%;
    /* Match the final reel cell before expanding into the preview. */
    top: 50%;
    width: 86%;
    aspect-ratio: 1;
    padding: 8.6%;
    box-sizing: border-box;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition:
      width 650ms cubic-bezier(0.22, 1, 0.36, 1),
      padding 650ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .is-holding .lucky-machine-winner,
  .is-revealing .lucky-machine-winner {
    opacity: 1;
  }

  .is-revealing .lucky-machine-winner {
    width: 100%;
    padding: 0;
  }

  @keyframes lucky-icon-spin {
    from {
      transform: translateY(calc(-50% / var(--reel-count)));
      filter: blur(4px);
    }
    70% {
      filter: blur(0);
    }
    to {
      transform: translateY(calc(-100% + 50% / var(--reel-count)));
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lucky-machine-frame,
    .lucky-icon-reel,
    .lucky-machine-winner {
      transition: none;
    }

    .lucky-machine-frame,
    .lucky-icon-reel {
      transform: none;
    }

    :is(.is-spinning, .is-holding, .is-revealing) .lucky-icon-track {
      animation-duration: 1ms;
    }
  }
</style>
