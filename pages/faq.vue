<script setup lang="ts">
  import { Discord } from '@vicons/fa'

  const faqs = []
</script>

<template>
  <div class="max-w-7xl h-[80vh] mx-auto space-y-4">
    <n-card
      class="rounded-xl"
      no-title
    >
      <div class="text-center mb-12">
        <h1 class="text-2xl font-bold mb-4">Frequently Asked Questions</h1>
      </div>

      <div class="space-y-6">
        <n-collapse arrow-placement="right">
          <n-collapse-item
            v-for="(faq, index) in faqs"
            :key="index"
            :title="faq.question"
          >
            <div class="prose dark:prose-invert max-w-none">
              <p>{{ faq.answer }}</p>
            </div>
          </n-collapse-item>
        </n-collapse>

        <n-space justify="center">
          <n-button
            tag="a"
            href="https://discord.gg/rRnkB9HQ"
            target="_blank"
          >
            <template #icon>
              <n-icon><Discord /></n-icon>
            </template>
            Join Discord
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
  .prose {
    @apply text-gray-600 dark:text-gray-300;
  }
</style>
