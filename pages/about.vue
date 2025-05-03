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
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord, Reddit } from '@vicons/fa'
</script>
