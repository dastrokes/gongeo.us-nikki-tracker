<template>
  <n-card class="w-full max-w-5xl">
    <div class="space-y-4">
      <n-form-item
        :show-label="false"
        :show-feedback="false"
      >
        <n-select
          v-model:value="selectedOutfitId"
          class="w-60"
          :options="outfitOptions"
          @update:value="loadOutfitData"
        />
      </n-form-item>

      <template v-if="selectedOutfitId && selectedOutfit">
        <!-- Items section -->
        <div class="rounded-lg">
          <div
            class="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
          >
            <div
              v-for="itemId in selectedOutfit.items"
              :key="itemId"
              class="space-y-2"
            >
              <n-tooltip>
                <template #trigger>
                  <DynamicImg
                    :src="`/images/items/${itemId}.webp`"
                    :alt="itemId"
                    class="w-full aspect-square object-cover rounded-md"
                    format="webp"
                    width="120"
                    height="120"
                    fit="cover"
                    loading="lazy"
                    placeholder="/images/loading.webp"
                    sizes="(max-width: 640px) 80px, 120px"
                  />
                </template>
                <div class="text-center">
                  <div class="font-medium">
                    {{ t(`item.${itemId}.name`) }}
                  </div>
                  <div class="text-sm">
                    {{ t(`items.types.${getItemType(itemId)}`) }}
                  </div>
                </div>
              </n-tooltip>

              <n-input-number
                v-model:value="itemCounts[itemId]"
                :min="getItemMinCount(itemId)"
                :max="2"
                size="small"
                placeholder="0"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Bulk update section -->
        <n-form-item
          class="w-full"
          :show-label="false"
          :show-feedback="false"
        >
          <div class="flex justify-between items-center gap-2">
            <n-input-number
              v-model:value="bulkCount"
              class="w-full"
              :min="0"
              :max="2"
              size="small"
              placeholder="0"
            />
            <n-button
              size="small"
              @click="applyBulkCount"
            >
              {{ t('tracker.manual_log.apply_to_all') }}
            </n-button>
          </div>
        </n-form-item>

        <!-- Action buttons -->
        <div class="flex justify-end gap-2 mt-2">
          <n-button @click="closeDialog">{{
            t('common.captions.cancel')
          }}</n-button>
          <n-button
            type="primary"
            :loading="isSaving"
            @click="saveManualLog"
          >
            {{ t('tracker.manual_log.save') }}
          </n-button>
        </div>
      </template>
    </div>
  </n-card>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useMessage } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'
  import type { Outfit } from '~/types/outfit'
  import type { BannerData } from '~/types/banner'
  import { usePullStore } from '~/stores/pull'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { getItemType } from '~/utils/itemType'
  import type { PullRecord } from '~/types/pull'

  const { t } = useI18n()
  const message = useMessage()
  const pullStore = usePullStore()

  // Props, emits, and refs
  const props = defineProps<{
    bannerId: number | null
  }>()

  const emit = defineEmits(['close', 'saved'])
  const selectedOutfitId = ref<string | null>(null)
  const selectedBanner = ref<BannerData[number] | null>(null)
  const selectedOutfit = ref<(Outfit & { rarity: number }) | null>(null)
  const itemCounts = ref<Record<string, number>>({})
  const importedItemCounts = ref<Record<string, number>>({})
  const bulkCount = ref(0)
  const isSaving = ref(false)

  // Watch for changes in bannerId prop
  watch(
    () => props.bannerId,
    (newBannerId) => {
      if (newBannerId) {
        selectedBanner.value = BANNER_DATA[newBannerId]
        selectedOutfitId.value = null
        selectedOutfit.value = null
        itemCounts.value = {}
        importedItemCounts.value = {}
      }
    },
    { immediate: true }
  )

  // Get outfits from the specified banner
  const bannerOutfits = computed(() => {
    if (!props.bannerId || !selectedBanner.value) return []

    const banner = selectedBanner.value
    const outfits: { outfitId: string; rarity: number }[] = []

    // Add 5★ outfits
    banner.outfit5StarId?.forEach((id: string) => {
      outfits.push({
        outfitId: id,
        rarity: 5,
      })
    })

    // Add 4★ outfits
    banner.outfit4StarId?.forEach((id: string) => {
      outfits.push({
        outfitId: id,
        rarity: 4,
      })
    })

    return outfits
  })

  // Computed values
  const outfitOptions = computed(() => {
    return bannerOutfits.value
      .map((outfit) => {
        const rarity = outfit.rarity
        return {
          label: `${t(`outfit.${outfit.outfitId}.name`)} (${rarity}★)`,
          value: outfit.outfitId,
          rarity,
        }
      })
      .sort((a, b) => {
        // Sort by rarity (5★ first) then by name
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity
        }
        return a.label.localeCompare(b.label)
      })
  })

  // Methods
  const loadOutfitData = async () => {
    if (!selectedOutfitId.value || !props.bannerId) return

    // Get outfit data
    const outfit = OUTFIT_DATA[selectedOutfitId.value as OutfitKey]
    if (outfit) {
      // Find the outfit's rarity from our banner outfits array
      const outfitInfo = bannerOutfits.value.find(
        (o) => o.outfitId === selectedOutfitId.value
      )
      if (!outfitInfo) return

      selectedOutfit.value = {
        ...outfit,
        rarity: outfitInfo.rarity,
      }

      // Initialize item counts - only show what's already in the data
      itemCounts.value = {}
      importedItemCounts.value = {}

      outfit.items.forEach((itemId) => {
        // Check if the item already exists in the user's pull data
        const { importedCount, manualCount } = getItemCounts(
          props.bannerId as number,
          itemId
        )

        importedItemCounts.value[itemId] = importedCount
        itemCounts.value[itemId] = importedCount + manualCount
      })
    }
  }

  const getItemCounts = (bannerId: number, itemId: string) => {
    const bannerData = pullStore.processedPulls[bannerId]
    if (!bannerData) return { importedCount: 0, manualCount: 0 }

    let importedCount = 0
    let manualCount = 0

    // Go through the raw data to separate manual and imported counts
    const rawData = pullStore.rawPullData[bannerId] || []

    rawData.forEach(([timestamp, id]: PullRecord) => {
      if (id === itemId) {
        if (timestamp === 'manual') {
          manualCount++
        } else {
          importedCount++
        }
      }
    })

    return { importedCount, manualCount }
  }

  const getItemMinCount = (itemId: string) => {
    return importedItemCounts.value[itemId] || 0
  }

  const applyBulkCount = () => {
    if (!selectedOutfit.value) return

    selectedOutfit.value.items.forEach((itemId) => {
      const minCount = getItemMinCount(itemId)
      // Only apply bulk count if it's greater than the minimum allowed (imported) count
      if (bulkCount.value >= minCount) {
        itemCounts.value[itemId] = bulkCount.value
      }
    })
  }

  const saveManualLog = async () => {
    if (!selectedOutfitId.value || !selectedOutfit.value || !props.bannerId) {
      return
    }

    try {
      isSaving.value = true

      // Create manual log entries
      const manualRecords: PullRecord[] = []

      selectedOutfit.value.items.forEach((itemId) => {
        const newCount = itemCounts.value[itemId] || 0
        const importedCount = importedItemCounts.value[itemId] || 0

        // Only add items with a count higher than imported counts
        if (newCount > importedCount) {
          manualRecords.push(['manual', itemId])
        }
      })

      // Load existing data
      const { loadPullData, savePullData, clearPullData } = useIndexedDB()
      const existingData = (await loadPullData()) || {}

      // Prepare updated data
      const bannerId = props.bannerId as number
      let updatedData = { ...existingData }
      if (!updatedData[bannerId]) {
        updatedData[bannerId] = []
      }

      // Filter out existing manual entries for this outfit's items
      const itemIdsToFilter = selectedOutfit.value.items
      updatedData[bannerId] = updatedData[bannerId].filter(
        ([pullId, itemId]) =>
          !(pullId === 'manual' && itemIdsToFilter.includes(itemId))
      )

      // Add the new manual records
      updatedData[bannerId] = [...updatedData[bannerId], ...manualRecords]

      if (updatedData[bannerId].length === 0) {
        updatedData = Object.fromEntries(
          Object.entries(updatedData).filter(([k]) => k !== bannerId.toString())
        )
      }

      // Save to IndexedDB
      await clearPullData()
      await savePullData(updatedData)

      // Process updated data
      await pullStore.processPullData(updatedData)

      message.success(t('tracker.manual_log.success'))
      emit('close')
    } catch (error) {
      console.error('Failed to save manual log:', error)
      message.error(t('tracker.manual_log.error'))
    } finally {
      isSaving.value = false
    }
  }

  const closeDialog = () => {
    emit('close')
  }

  // Initialize
  onMounted(() => {
    // Initialize with banner selected from props
    if (props.bannerId) {
      selectedBanner.value = BANNER_DATA[props.bannerId]
      selectedOutfitId.value =
        selectedBanner.value?.outfit5StarId?.[0] ||
        selectedBanner.value?.outfit4StarId?.[0] ||
        null
      loadOutfitData()
    }
  })
</script>
