<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-purple-50/50"
      no-title
    >
      <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div class="prose prose-lg">
        <p class="text-gray-600 mb-4">
          Last updated: {{ new Date().toLocaleDateString() }}
        </p>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4">
            Data Collection and Storage
          </h2>
          <p>We collect minimal information to provide our service:</p>
          <ul class="list-disc pl-6 mt-2">
            <li>
              We do not collect or store any personal information or cookies
            </li>
            <li>
              Cookies and UID you submitted will only be sent to Infold server
              to verify your account and retrieve your pull history
            </li>
            <li>Your pull history is stored locally in your browser</li>
            <li>
              Your pull statistics will be used to calculate global stats if you
              opt in
            </li>
            <li>
              The pull statistics you send will include a hashed version of your
              UID, and the information of 4* and 5* items you pulled
            </li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold mb-4">Data Security</h2>
          <p>
            Your data is stored locally in your browser. While we implement
            security measures, please note that no method of transmission over
            the internet is 100% secure.
          </p>
        </section>

        <section class="mb-8">
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
        </section>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord, Reddit } from '@vicons/fa'
</script>
