<template>
  <n-tooltip :show-arrow="false">
    <template #trigger>
      <n-button
        size="small"
        quaternary
        circle
        class="shrink-0"
        :type="saved ? 'primary' : 'default'"
        :disabled="!ready"
        :aria-busy="savingBannerId === bannerId"
        :aria-pressed="saved"
        :aria-label="actionLabel"
        @click.stop="handleToggle"
      >
        <template #icon>
          <span
            class="relative inline-flex"
            aria-hidden="true"
          >
            <n-icon
              :size="16"
              :class="{ 'wish-heart-pop': celebrating }"
            >
              <Heart v-if="saved" />
              <HeartRegular v-else />
            </n-icon>
            <SvgIcon
              v-if="celebrating"
              name="sparkles"
              class="wish-sparkles"
            />
          </span>
        </template>
      </n-button>
    </template>
    {{ actionLabel }}
  </n-tooltip>
</template>

<script setup lang="ts">
  import { Heart, HeartRegular } from '@vicons/fa'
  const props = defineProps<{ bannerId: number }>()
  const { t } = useI18n()
  const message = useMessage()
  const { isSaved, toggle, ready, canMutate, savingBannerId } =
    useBannerWishlist()
  const saved = computed(() => isSaved(props.bannerId))
  const celebrating = ref(false)
  const { start: startCelebration, stop: stopCelebration } = useTimeoutFn(
    () => (celebrating.value = false),
    550,
    { immediate: false }
  )
  const actionLabel = computed(() =>
    t(saved.value ? 'wishlist.remove' : 'wishlist.add')
  )
  const handleToggle = async () => {
    if (!canMutate.value) return
    const wasSaved = saved.value
    celebrating.value = false
    stopCelebration()
    try {
      await toggle(props.bannerId)
      if (!wasSaved && saved.value) {
        celebrating.value = true
        startCelebration()
      }
    } catch {
      message.error(t('wishlist.error'))
    }
  }
</script>

<style scoped>
  .wish-heart-pop {
    animation: wish-heart-pop 380ms ease-out;
  }

  .wish-sparkles {
    position: absolute;
    top: -8px;
    right: -9px;
    width: 13px;
    height: 13px;
    color: #fb7185;
    pointer-events: none;
    animation: wish-sparkle 500ms ease-out both;
  }

  @keyframes wish-heart-pop {
    40% {
      transform: scale(1.3) rotate(-8deg);
    }
    75% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes wish-sparkle {
    0% {
      opacity: 0;
      transform: translate(-3px, 3px) scale(0.5);
    }
    35% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(2px, -3px) scale(0.8);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wish-heart-pop {
      animation: none;
    }

    .wish-sparkles {
      display: none;
    }
  }
</style>
