<template>
  <n-space
    justify="center"
    :wrap-item="false"
  >
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://discord.gg/qymsW3j4Zw"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-indigo-400 hover:!text-indigo-500 dark:hover:!text-indigo-300"
        >
          <template #icon>
            <n-icon><Discord /></n-icon>
          </template>
        </n-button>
      </template>
      {{ $t('default.social.discord') }}
    </n-tooltip>
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://ko-fi.com/gongeous"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-rose-400 hover:!text-rose-500 dark:hover:!text-rose-300"
        >
          <template #icon>
            <n-icon>
              <SvgIcon name="kofi" />
            </n-icon>
          </template>
        </n-button>
      </template>
      {{ $t('default.social.kofi') }}
    </n-tooltip>
    <n-tooltip v-if="locale !== 'zh'">
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://x.com/gongeo_us"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-sky-400 hover:!text-sky-500 dark:hover:!text-sky-300"
        >
          <template #icon>
            <n-icon><Twitter /></n-icon>
          </template>
        </n-button>
      </template>
      {{ $t('default.social.twitter') }}
    </n-tooltip>
    <n-tooltip v-else>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://xhslink.com/m/AY4e3m1ZAjk"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-red-500 hover:!text-red-600 dark:!text-red-400 dark:hover:!text-red-300"
        >
          <template #icon>
            <n-icon>
              <SvgIcon name="rednote" />
            </n-icon>
          </template>
        </n-button>
      </template>
      小红书
    </n-tooltip>

    <n-tooltip v-if="locale !== 'zh'">
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://www.youtube.com/@gongeo_us"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-red-500 hover:!text-red-600 dark:!text-red-400 dark:hover:!text-red-300"
        >
          <template #icon>
            <n-icon><Youtube /></n-icon>
          </template>
        </n-button>
      </template>
      YouTube
    </n-tooltip>
    <n-tooltip v-else>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://space.bilibili.com/3546802821270136"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-sky-400 hover:!text-sky-500 dark:hover:!text-sky-300"
        >
          <template #icon>
            <n-icon>
              <SvgIcon name="bilibili" />
            </n-icon>
          </template>
        </n-button>
      </template>
      哔哩哔哩
    </n-tooltip>
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="https://github.com/dastrokes/gongeo.us-nikki-tracker"
          target="_blank"
          rel="noopener noreferrer"
          class="!text-slate-600 hover:!text-slate-800 dark:!text-slate-400 dark:hover:!text-slate-200"
        >
          <template #icon>
            <n-icon><Github /></n-icon>
          </template>
        </n-button>
      </template>
      GitHub
    </n-tooltip>
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          circle
          size="large"
          tag="a"
          href="mailto:contact@gongeo.us"
          class="!text-amber-500 hover:!text-amber-600 dark:!text-amber-400 dark:hover:!text-amber-300"
        >
          <template #icon>
            <n-icon><Envelope /></n-icon>
          </template>
        </n-button>
      </template>
      {{ $t('default.social.email') }}
    </n-tooltip>
  </n-space>
</template>

<script setup lang="ts">
  import { Discord, Envelope, Github, Twitter, Youtube } from '@vicons/fa'

  const { locale } = useI18n()
</script>
