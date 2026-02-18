<template>
  <n-space justify="center">
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          tag="a"
          href="https://discord.gg/qymsW3j4Zw"
          target="_blank"
          rel="noopener noreferrer"
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
          tag="a"
          href="https://ko-fi.com/gongeous"
          target="_blank"
          rel="noopener noreferrer"
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
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          tag="a"
          href="https://twitter.com/gongeo_us"
          target="_blank"
          rel="noopener noreferrer"
        >
          <template #icon>
            <n-icon><Twitter /></n-icon>
          </template>
        </n-button>
      </template>
      {{ $t('default.social.twitter') }}
    </n-tooltip>
    <n-tooltip>
      <template #trigger>
        <n-button
          quaternary
          tag="a"
          href="mailto:contact@gongeo.us"
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
  import { Discord, Twitter, Envelope } from '@vicons/fa'
</script>
