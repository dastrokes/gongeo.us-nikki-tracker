<template>
  <n-card
    size="small"
    content-class="p-3 sm:p-4"
    :aria-busy="loading"
  >
    <div
      class="relative flex flex-col gap-3"
      :class="
        maximized
          ? 'h-[calc(100dvh-156px)] sm:h-[calc(100dvh-172px)]'
          : heightClass
      "
    >
      <div class="@container">
        <div
          class="grid items-center gap-2"
          :class="
            slots.controls
              ? slots['title-actions']
                ? 'grid-cols-[auto_minmax(0,1fr)] @3xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
                : 'grid-cols-1 @3xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
              : 'grid-cols-[1.5rem_minmax(0,1fr)_1.5rem]'
          "
        >
          <div
            class="flex min-w-0 flex-wrap items-center justify-center gap-2"
            :class="
              slots.controls
                ? slots['title-actions']
                  ? 'col-span-2 row-start-1 @3xl:col-span-1 @3xl:col-start-2'
                  : '@3xl:col-start-2'
                : 'col-start-2'
            "
          >
            <n-skeleton
              v-if="loading"
              height="24px"
              width="220px"
              class="max-w-full"
            />
            <h2
              v-else
              class="min-w-0 text-center text-base leading-6 font-semibold"
            >
              {{ title }}
            </h2>
          </div>
          <div
            v-if="slots['title-actions']"
            class="col-start-1 flex min-w-0 items-center justify-start gap-2"
            :class="
              slots.controls ? 'row-start-2 @3xl:row-start-1' : 'row-start-1'
            "
          >
            <slot name="title-actions" />
          </div>
          <div
            v-if="slots.controls || maximizable"
            class="flex min-w-0 flex-wrap items-center justify-end gap-2"
            :class="
              slots.controls
                ? slots['title-actions']
                  ? 'col-start-2 row-start-2 @3xl:col-start-3 @3xl:row-start-1'
                  : '@3xl:col-start-3'
                : 'col-start-3'
            "
          >
            <slot name="controls" />
            <n-skeleton
              v-if="loading && maximizable"
              height="16px"
              width="16px"
              class="shrink-0"
            />
            <n-button
              v-else-if="maximizable"
              size="tiny"
              text
              class="shrink-0"
              :type="maximized ? 'primary' : 'default'"
              :aria-pressed="maximized"
              @click="emit('toggle')"
            >
              <template #icon>
                <n-icon :depth="3">
                  <component :is="maximized ? CompressAlt : ExpandAlt" />
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </div>
      <div class="min-h-0 flex-1">
        <slot />
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
  import { CompressAlt, ExpandAlt } from '@vicons/fa'

  withDefaults(
    defineProps<{
      title: string
      loading?: boolean
      maximized?: boolean
      maximizable?: boolean
      heightClass?: string
    }>(),
    {
      maximized: false,
      loading: false,
      maximizable: true,
      heightClass: 'h-80',
    }
  )
  const emit = defineEmits<{ toggle: [] }>()
  const slots = useSlots()
</script>
