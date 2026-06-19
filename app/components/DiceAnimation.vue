<template>
  <div class="flex items-center justify-center">
    <n-popover
      :width="200"
      trigger="click"
    >
      <template #trigger>
        <n-button
          text
          circle
          :aria-label="t('default.accessibility.luck_stats')"
        >
          <n-icon
            class="origin-center"
            size="16px"
            :depth="3"
            :component="isAnimating ? diceComponents[currentFace] : finalDice"
            :style="{
              transform: isAnimating
                ? `rotate(${rotation}deg)`
                : 'rotate(45deg)',
              transition: 'transform 0.5s ease-in-out',
            }"
          />
        </n-button>
      </template>
      <div class="flex flex-wrap gap-2">
        <div
          v-if="props.title"
          class="w-full text-sm font-medium"
        >
          {{ props.title }}: {{ props.percentile.toFixed(0) }} / 100
        </div>
        <div
          v-if="summaryText"
          class="text-sm"
        >
          {{ summaryText }}
        </div>
        <div
          v-if="props.description"
          class="w-full text-sm opacity-80"
        >
          {{ props.description }}
        </div>
        <div
          v-if="props.itemIds?.length"
          class="flex w-full gap-1"
        >
          <NuxtImg
            v-for="itemId in props.itemIds"
            :key="itemId"
            :src="getImageSrc('itemIcon', itemId)"
            :alt="t(`item.${itemId}.name`, itemId)"
            preset="iconSm"
            class="size-10 rounded-md bg-gray-100 object-contain p-0.5 dark:bg-gray-800"
          />
        </div>
        <div
          v-if="props.note"
          class="w-full text-sm opacity-80"
        >
          {{ props.note }}
        </div>
        <div
          v-for="i in 6"
          :key="i"
          class="flex w-fit items-center gap-2 text-sm"
          :class="
            getLuckDice(props.percentile) === i ? 'font-bold' : 'opacity-50'
          "
        >
          <n-icon
            :depth="getLuckDice(props.percentile) === i ? 2 : 5"
            class="rotate-45"
            :component="diceComponents[i - 1]"
          />
          {{ t('banner.luck.' + i) }}
        </div>
      </div>
    </n-popover>
  </div>
</template>

<script setup lang="ts">
  import {
    DiceOne,
    DiceTwo,
    DiceThree,
    DiceFour,
    DiceFive,
    DiceSix,
  } from '@vicons/fa'

  const props = defineProps<{
    percentile: number
    title?: string
    summary?: string
    description?: string
    note?: string
    itemIds?: string[]
  }>()

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const summaryText = computed(() => {
    if (props.summary !== undefined) return props.summary
    if (props.description) return ''

    return t('tracker.stats.luckier', {
      percent: props.percentile.toFixed(1),
    })
  })
  const isAnimating = ref(false)
  const currentFace = ref(0)
  const rotation = ref(45)
  const diceComponents = [
    DiceOne,
    DiceTwo,
    DiceThree,
    DiceFour,
    DiceFive,
    DiceSix,
  ]

  const getLuckDice = (percentile: number) => {
    if (percentile < 100 / 6) return 1
    if (percentile < 200 / 6) return 2
    if (percentile < 300 / 6) return 3
    if (percentile < 400 / 6) return 4
    if (percentile < 500 / 6) return 5
    return 6
  }

  const finalDice = computed(
    () => diceComponents[getLuckDice(props.percentile) - 1]
  )

  let faceInterval: NodeJS.Timeout | null = null

  // Function to get random dice face
  const getRandomFace = () => {
    return Math.floor(Math.random() * diceComponents.length)
  }

  // Function to cycle through dice faces
  const cycleDiceFaces = () => {
    currentFace.value = getRandomFace()
    rotation.value += 90
  }

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return

    isAnimating.value = true
    faceInterval = setInterval(cycleDiceFaces, 500)

    // Stop after animation duration
    setTimeout(() => {
      if (faceInterval) {
        clearInterval(faceInterval)
        faceInterval = null
      }
      isAnimating.value = false
      rotation.value = 0 // Reset rotation
    }, 3000)
  })

  onUnmounted(() => {
    if (faceInterval) {
      clearInterval(faceInterval)
      faceInterval = null
    }
  })
</script>
