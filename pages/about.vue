<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-purple-50"
      no-title
    >
      <div class="text-center mb-12">
        <h1 class="text-2xl font-bold mb-4">Disclaimer and Privacy Policy</h1>
        <p class="text-gray-600 mb-4">
          Last updated: {{ new Date().toLocaleDateString() }}
        </p>
      </div>

      <div class="prose prose-lg">
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-4">
            Infinity Nikki Assets Disclaimer
          </h2>
          <p>
            gongeo.us is an independent fan-made platform with no affiliation,
            endorsement, or partnership with Infinity Nikki or Infold Games. All
            official game assets, visuals, and content are the sole property of
            Infold Games and are used here for community and educational
            purposes only. We do not claim any rights to this content.
          </p>
          <p class="mt-4">
            By using this platform, you acknowledge that it is unaffiliated with
            the game's developers and that you accept any risks involved with
            accessing unofficial or third-party content.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-4">
            Data and Statistics Disclaimer
          </h2>
          <p>
            All gameplay statistics and data presented through gongeo.us are
            user-generated and shared voluntarily. They are not sourced from
            Infold Games and should not be interpreted as official game
            information. The data reflects only a subset of the player base and
            may not accurately represent the broader community or trends.
          </p>
          <p class="mt-4">
            Insights offered are for informational use and should be viewed with
            an understanding of their community-driven nature.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-4">Intellectual Property</h2>
          <p>
            gongeo.us is a standalone fan project. All Infinity Nikki-related
            trademarks, game content, and intellectual property remain the
            rights of Infold Games and their licensors.
          </p>
          <p class="mt-4">
            Unless otherwise specified, the site's original code, design, and
            custom assets are owned by the gongeo.us and protected under
            applicable copyright and intellectual property laws. You may not
            copy, reuse, or distribute this material without express permission.
          </p>
          <p class="mt-4">
            This platform is provided "as-is" for personal and non-commercial
            use only.
          </p>
        </section>

        <div class="prose prose-lg">
          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4">
              Data Collection and Storage
            </h2>
            <p>
              We collect minimal information to provide our service. We do not
              collect or store any personal information or cookies. Cookies and
              UID you submitted will only be sent to Infold server to verify
              your account and retrieve your pull history.
            </p>
            <p class="mt-4">
              Your pull history is stored locally in your browser. Your pull
              statistics will be used to calculate global stats if you opt in.
              The pull statistics you send will include a hashed version of your
              UID, and the information of 4* and 5* items you pulled.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Data Security</h2>
            <p>
              Your data is stored locally in your browser. While we implement
              security measures, please note that no method of transmission over
              the internet is 100% secure.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Analytics and Tracking</h2>
            <p>
              This website uses GoatCounter, a privacy-friendly analytics tool,
              to collect anonymous usage statistics. GoatCounter:
            </p>
            <ul class="list-disc list-inside ml-4 mt-2">
              <li>Does not use cookies or store any personal data</li>
              <li>Does not track individual users or create user profiles</li>
              <li>
                Only collects basic information like page views and referrers
              </li>
              <li>Is open source and self-hosted</li>
            </ul>
            <p class="mt-4">
              If you have an ad blocker or privacy extension enabled, you may
              see a "Failed to load resource" error for GoatCounter. This is
              normal and won't affect the functionality of the website.
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
          </section>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord } from '@vicons/fa'
</script>
