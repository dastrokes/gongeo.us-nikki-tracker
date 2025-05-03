<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-purple-50"
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
            href="https://ko-fi.com/dastrokes"
            target="_blank"
          >
            <template #icon>
              <n-icon>
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298"
                  />
                </svg>
              </n-icon>
            </template>
            Ko-fi
          </n-button>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord } from '@vicons/fa'

  const faqs = [
    {
      question: 'How are you getting the data?',
      answer:
        'We are using the same API as the in-game pull history page to access Infold Games servers that store the banner pull data. To access the data, we need to authenticate with the Infold Games server using your account cookies.',
    },
    {
      question: 'Will I get banned for using this?',
      answer:
        'This is a third-party tool, so there is always some risk, though it is ultimately up to Infold Games. However, similar tools are widely used in other gacha games (Paimon.moe, Starrailstation, wuwatracker etc.) and also in the Chinese community of Infinity Nikki (小黑盒 游创工坊). Take this information as a reference, and make your own judgement.',
    },
    {
      question: 'What data are you storing?',
      answer:
        'Your pull history is stored locally in your browser, so the next time you visit the site, it will be there unless you clear your browser data. We do not collect any personal information, including the cookies you submitted.',
    },
    {
      question: 'What data is sent to the server?',
      answer:
        'Only your pull statistics are sent to help calculate global stats if you opt in. This includes a hashed version of your UID, and the information of 4* and 5* items you pulled.',
    },
    {
      question: 'Will it work if I play on mobile or PS5?',
      answer:
        'Yes, it does not matter which platform you play on, as long as you log into the Pearpal website on PC using the same account. If you want to do the import on mobile, you will need a browser extension to access cookies, since Developer Tools are not available on mobile, I am able to import using Firefox on Android but the process is not user-friendly thus not recommended.',
    },
    {
      question: 'Do I need to run a script to get my cookies?',
      answer:
        'No, you can get them manually. Open Dev Tools, go to Application > Cookies > https://pearpal.infoldgames.com/, and look for the cookie names you need. Check manual input instructions in the import page for more details.',
    },
    {
      question: 'All banners were processed, but no pulls are showing?',
      answer:
        'Please check that your region and cookie values are correct. Make sure the UID and ID from the cookies are not mixed up.',
    },
    {
      question: 'Why is the permanent banner Distant Sea not showing?',
      answer:
        'Pull data for permanent banners Distant Sea is available in game, it also take longer time and many more requests to process due to the large amount of pulls. It is not included currently on purpose.',
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
