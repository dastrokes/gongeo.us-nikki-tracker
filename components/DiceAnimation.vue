<template>
  <n-icon
    depth="3"
    class="origin-center"
    :component="isAnimating ? diceComponents[currentFace] : finalDice"
    :style="{
      transform: isAnimating ? `rotate(${rotation}deg)` : 'rotate(45deg)',
      transition: 'transform 0.5s ease-in-out',
    }"
  />
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
    finalValue: number
    animationDuration?: number
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
    faceInterval = setInterval(cycleDiceFaces, 500)

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
