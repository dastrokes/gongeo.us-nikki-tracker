<script setup lang="ts">
  import { Discord } from '@vicons/fa'

  const faqs = [
    {
      question: 'Will I get banned for using this?',
      answer:
        'This is a third party tool and it is ultimately up to Infold. However, similar tools are widely used in other games and in Chinese community of Inifinity Nikki.',
    },
    {
      question: 'What data are you storing?',
      answer:
        'Your pull statistics will be stored in your browser. We do not store any personal information including your cookies.',
    },
    {
      question: 'What data is will be sent to the server?',
      answer:
        'Your pull statistics will be sent to the server to calculate global pull statistics. This data will include your hashed UID, your pull statistics for each banner and the timestamp of the data.',
    },
    {
      question: 'Do I need to run the script to get cookies?',
      answer:
        'No, you can go to the Dev Tools -> Application -> Cookies -> https://pearpal.infoldgames.com/ -> cookie-name to get the cookies and fill in the form manually.',
    },
    {
      question: 'All banners are processed but no pulls are showing?',
      answer:
        'Please double check the region and cookie you are sending are correct.',
    },
    {
      question: 'Permanent banner Distant Sea is not showing?',
      answer:
        'Permanent banners records are available in game. It would also take longer to process, so far now it is not available.',
    },
    {
      question: 'How do I export my pull history?',
      answer:
        'You can export your pull history to PNG image or JSON file. You can use the JSON file to import your pull history in case your browser data is removed.',
    },
  ]
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-4">
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
            href="https://discord.gg/K92RAEvCXx"
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
