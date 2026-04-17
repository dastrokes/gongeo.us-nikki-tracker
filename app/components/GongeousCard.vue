<template>
  <div
    class="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-zinc-100 p-4 shadow-xs"
  >
    <div class="flex items-start justify-between gap-2 mx-4">
      <div class="mt-1">
        <div class="relative inline-flex">
          <p
            class="relative inline-block text-2xl font-black lowercase tracking-widest text-transparent bg-linear-to-r from-fuchsia-500 via-rose-500 to-amber-400 bg-clip-text sm:text-3xl"
          >
            gongeous!
          </p>
        </div>
      </div>

      <a
        href="https://www.reddit.com/r/InfinityNikki/comments/1iemh6m/this_snapshot_changed_my_lifes_trajectory/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#ff4500] transition-transform duration-200 hover:scale-110"
        @click.stop
      >
        <n-icon size="24">
          <Reddit />
        </n-icon>
      </a>
    </div>

    <div class="relative mt-4">
      <NuxtImg
        src="/images/gongeous.webp"
        alt="gongeous"
        loading="lazy"
        width="400"
        height="300"
        fit="cover"
        class="w-full h-full -rotate-1 rounded-2xl border border-slate-200 shadow-lg transition-transform duration-300 hover:rotate-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Reddit } from '@vicons/fa'
</script>
