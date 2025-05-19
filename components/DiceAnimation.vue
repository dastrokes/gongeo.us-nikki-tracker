<template>
  <n-icon
    depth="3"
    class="origin-center transform transition-transform duration-500 ease-in-out"
    :style="{
      transform: isAnimating ? `rotate(${rotation}deg)` : 'rotate(45deg)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    }"
  >
    <component
      :is="isAnimating ? diceComponents[currentFace] : finalDice"
      class="transition-all duration-300 ease-in-out"
    />
  </n-icon>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import {
    DiceOne,
    DiceTwo,
    DiceThree,
    DiceFour,
    DiceFive,
    DiceSix,
  } from '@vicons/fa'

  const props = defineProps<{
    finalValue: number // 1-6 representing final dice value
    animationDuration?: number // in milliseconds, defaults to 3000
  }>()

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

  const finalDice = computed(() => diceComponents[props.finalValue - 1])

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
    isAnimating.value = true
    faceInterval = setInterval(cycleDiceFaces, 500) // Faster face changes

    // Stop after animation duration
    setTimeout(() => {
      if (faceInterval) {
        clearInterval(faceInterval)
        faceInterval = null
      }
      isAnimating.value = false
      rotation.value = 0 // Reset rotation
    }, props.animationDuration || 3000)
  })

  onUnmounted(() => {
    if (faceInterval) {
      clearInterval(faceInterval)
      faceInterval = null
    }
  })
</script>
