<template>
  <div class="mx-auto max-w-5xl space-y-3 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-3 sm:p-5"
    >
      <div
        class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl leading-tight font-bold">
              {{ t('wardrobe.title') }}
            </h1>
            <n-tag
              size="small"
              :bordered="false"
              type="info"
            >
              {{ activeProfileLabel }}
            </n-tag>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ t('wardrobe.subtitle') }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLinkLocale to="/profile">
            <n-button size="small">
              <template #icon>
                <n-icon><User /></n-icon>
              </template>
              {{ t('wardrobe.manage_profiles') }}
            </n-button>
          </NuxtLinkLocale>
          <n-button
            size="small"
            type="primary"
            :loading="importing"
            :disabled="!canMutate"
            @click="handleTrackerImport"
          >
            <template #icon>
              <n-icon><Upload /></n-icon>
            </template>
            {{ t('wardrobe.import_tracker') }}
          </n-button>
        </div>
      </div>
    </n-card>

    <n-alert
      v-if="wardrobeError"
      type="error"
      :title="t('wardrobe.storage_unavailable')"
    >
      <div class="space-y-3">
        <p>{{ wardrobeError.message }}</p>
        <n-button
          size="small"
          @click="retry"
        >
          {{ t('wardrobe.storage_recovery') }}
        </n-button>
      </div>
    </n-alert>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <n-card
        size="small"
        class="rounded-xl"
      >
        <div class="space-y-1">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ t('wardrobe.owned_items') }}
          </div>
          <div class="text-3xl font-bold tabular-nums">
            <n-skeleton
              v-if="loading && !initialized"
              text
              width="72px"
            />
            <span v-else>{{ ownedItemIds.length }}</span>
          </div>
        </div>
      </n-card>

      <n-card
        size="small"
        class="rounded-xl sm:col-span-2"
      >
        <div class="flex h-full flex-col justify-between gap-3">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ t('wardrobe.import_tracker_description') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <NuxtLinkLocale
              :to="{ path: '/items', query: { wardrobe: 'missing' } }"
            >
              <n-button size="small">
                {{ t('wardrobe.open_items') }}
              </n-button>
            </NuxtLinkLocale>
            <NuxtLinkLocale
              :to="{ path: '/outfits', query: { wardrobe: 'partial' } }"
            >
              <n-button size="small">
                {{ t('wardrobe.open_outfits') }}
              </n-button>
            </NuxtLinkLocale>
          </div>
        </div>
      </n-card>
    </div>

    <n-card
      v-if="initialized && ownedItemIds.length === 0"
      size="small"
      class="rounded-xl"
    >
      <n-result
        size="small"
        status="info"
        :title="t('wardrobe.empty_title')"
        :description="t('wardrobe.empty_description')"
      >
        <template #footer>
          <div class="flex justify-center gap-2">
            <NuxtLinkLocale to="/items">
              <n-button type="primary">
                {{ t('wardrobe.open_items') }}
              </n-button>
            </NuxtLinkLocale>
            <NuxtLinkLocale to="/tracker">
              <n-button>
                {{ t('navigation.tracker') }}
              </n-button>
            </NuxtLinkLocale>
          </div>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Upload, User } from '@vicons/fa'

  const { t } = useI18n()
  const message = useMessage()
  const { activeSlot, getSlotLabel } = useProfileSlots()
  const {
    ownedItemIds,
    initialized,
    loading,
    error: wardrobeError,
    canMutate,
    retry,
    importOwnedItemsFromTracker,
  } = useWardrobe()

  const importing = ref(false)
  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))

  const handleTrackerImport = async () => {
    importing.value = true
    try {
      const result = await importOwnedItemsFromTracker()
      if (result.found === 0) {
        message.info(t('wardrobe.import_empty'))
        return
      }
      message.success(
        t('wardrobe.import_success', {
          found: result.found,
          imported: result.imported,
        })
      )
    } catch {
      message.error(t('wardrobe.import_error'))
    } finally {
      importing.value = false
    }
  }

  useSeoMeta({
    title: () =>
      `${t('wardrobe.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.wardrobe'),
  })
</script>
