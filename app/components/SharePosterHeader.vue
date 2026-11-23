<template>
  <header
    class="flex min-w-0 shrink-0 items-center"
    :class="large ? 'h-[88px] gap-5' : 'gap-2.5'"
  >
    <div
      class="flex shrink-0 items-center justify-center bg-white shadow-sm ring-1 ring-black/5"
      :class="
        large
          ? 'size-[88px] rounded-[24px] p-[14px]'
          : 'size-10 rounded-xl p-1.5'
      "
    >
      <img
        src="/images/logo.webp"
        alt=""
        class="h-full w-full object-contain"
      />
    </div>
    <div class="min-w-0 flex-1">
      <p
        class="font-semibold tracking-wide text-slate-500"
        :class="
          large
            ? 'text-[25px] leading-8'
            : 'truncate text-[10px] leading-tight dark:text-slate-300'
        "
      >
        gongeo.us · Infinity Nikki
      </p>
      <h2
        class="flex min-w-0 items-baseline font-bold"
        :class="
          large ? 'gap-3 text-[48px] leading-[1.12]' : 'text-lg leading-tight'
        "
      >
        <span
          class="min-w-0"
          :class="large ? 'truncate' : 'wrap-break-word'"
          ><slot
        /></span>
        <span
          v-if="version"
          class="shrink-0 whitespace-nowrap"
        >
          · <span class="text-rose-700 tabular-nums">{{ version }}</span>
        </span>
      </h2>
      <p
        v-if="caption"
        class="truncate text-[10px] leading-tight font-medium text-rose-700 dark:text-rose-300"
      >
        {{ caption }}
      </p>
    </div>
    <div
      v-if="$slots.aside"
      class="shrink-0 self-start"
    >
      <slot name="aside" />
    </div>
  </header>
</template>

<script setup lang="ts">
  defineProps<{ large?: boolean; version?: string | null; caption?: string }>()
</script>
