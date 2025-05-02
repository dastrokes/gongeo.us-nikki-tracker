<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-purple-50/50"
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
            class="text-gray-600 dark:text-gray-300"
          >
            <div class="max-w-none text-sm">
              <p>{{ faq.answer }}</p>
            </div>
          </n-collapse-item>
        </n-collapse>

        <n-space justify="center">
          <n-button
            tag="a"
            href="https://discord.gg/qymsW3j4Zw"
            target="_blank"
          >
            <template #icon>
              <n-icon><Discord /></n-icon>
            </template>
            Discord
          </n-button>
          <n-button
            tag="a"
            href="https://www.reddit.com/user/dastrokes/"
            target="_blank"
          >
            <template #icon>
              <n-icon><Reddit /></n-icon>
            </template>
            Reddit
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord, Reddit } from '@vicons/fa'

  const faqs = [
    {
      question: 'Will I get banned for using this?',
      answer:
        'This is a third-party tool, so it is ultimately up to Infold. However, similar tools are commonly used in other gacha games and in the Chinese community of Infinity Nikki (小黑盒 游创工坊).',
    },
    {
      question: 'What data are you storing?',
      answer:
        'Your pull history is stored locally in your browser, so the next time you visit the site, it will be there unless you clear your browser data. We do not collect any personal information, including the cookies you submitted.',
    },
    {
      question: 'What data is sent to the server?',
      answer:
        'Only your pull statistics are sent to help calculate global stats. This includes a hashed version of your UID, your pulls for each banner, and the timestamps.',
    },
    {
      question: 'Does it work if I play on mobile or PS5?',
      answer:
        'Yes, it does not matter which platform you play on, as long as you log into the Pearpal website on PC using the same account. If you want to do the import on mobile, you will need a browser extension to access cookies, since Developer Tools are not available on mobile.',
    },
    {
      question: 'Do I need to run a script to get my cookies?',
      answer:
        'No, you can get them manually. Open Dev Tools, go to Application > Cookies > https://pearpal.infoldgames.com/, and look for the cookie names you need.',
    },
    {
      question: 'All banners were processed, but no pulls are showing?',
      answer:
        'Please check that your region and cookie values are correct. Make sure the UID and ID from the cookies are not mixed up.',
    },
    {
      question: 'Why is the Distant Sea banner not showing?',
      answer:
        'Pull data for permanent banners Distant Sea availabe in game, it also take longer to process due to the large amount of pulls. It is not included currently on purpose.',
    },
    {
      question: 'How can I export my pull history?',
      answer:
        'You can export your pull history as a PNG image or a JSON file. If your browser data is cleared, you can use the JSON file to restore your history.',
    },
  ]
</script>

<style scoped>
  .prose {
    @apply text-gray-600 dark:text-gray-300;
  }
</style>
