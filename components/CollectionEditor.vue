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
        <n-tooltip :width="200">
          <template #trigger>
            <n-button
              size="tiny"
              text
              class="ml-4 z-10"
            >
              <template #icon>
                <n-icon>
                  <ExclamationCircle />
                </n-icon>
              </template>
            </n-button>
          </template>
          <div class="flex flex-col gap-2 text-sm">
            {{ t('tracker.manual_log.description') }}
            <br />
            {{ t('tracker.manual_log.note') }}
          </div>
        </n-tooltip>
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
                  <NuxtImg
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

              <n-rate
                v-model:value="itemCounts[itemId]"
                clearable
                :count="2"
                :default-value="getItemMinCount(itemId)"
                size="medium"
                :color="
                  selectedOutfit.rarity === 5
                    ? 'rgba(245, 158, 11, 0.8)'
                    : 'rgba(139, 92, 246, 0.8)'
                "
                class="w-full justify-center"
                :disabled="false"
              >
                <n-icon>
                  <Tshirt />
                </n-icon>
              </n-rate>
            </div>
          </div>
        </div>

        <!-- Bulk update section -->
        <div
          class="w-full flex flex-wrap justify-center items-center gap-4"
          :show-label="false"
          :show-feedback="false"
        >
          <div class="flex items-center gap-2">
            <n-rate
              v-model:value="bulkCount"
              clearable
              :count="2"
              :default-value="0"
              size="medium"
              class="ml-4"
              :color="
                selectedOutfit.rarity === 5
                  ? 'rgba(245, 158, 11, 0.8)'
                  : 'rgba(139, 92, 246, 0.8)'
              "
              :disabled="false"
            >
              <n-icon>
                <Tshirt />
              </n-icon>
            </n-rate>

            <n-button
              size="small"
              @click="applyBulkCount"
            >
              {{ t('tracker.manual_log.apply_to_all') }}
            </n-button>
          </div>

          <!-- Evolution level selector (only for banner types 1 or 2 and 5★ outfits) -->
          <div
            v-if="showEvoLevels && selectedOutfit.rarity === 5"
            class="flex items-center gap-2"
          >
            <span class="text-sm"
              >{{ t('tracker.manual_log.evo_level') }}:</span
            >
            <n-tooltip placement="top">
              <template #trigger>
                <n-rate
                  v-model:value="outfitEvoLevel"
                  clearable
                  :count="4"
                  :default-value="0"
                  size="medium"
                  color="rgba(245, 158, 11, 0.8)"
                  @update:value="
                    outfitEvoLevel =
                      outfitEvoLevel === null ? 0 : outfitEvoLevel
                  "
                >
                  <n-icon>
                    <Magic />
                  </n-icon>
                </n-rate>
              </template>
              <div class="text-center">
                {{ t(`banner.outfit.level.${outfitEvoLevel}`) }}
              </div>
            </n-tooltip>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-center gap-2 mt-4">
          <n-button @click="closeDialog">{{
            t('common.captions.cancel')
          }}</n-button>
          <n-button
            type="primary"
            :loading="isSaving"
            @click="saveOutfitEdit"
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
  import { getBannerType } from '~/utils/bannerType'
  import type { PullRecord, EditRecord } from '~/types/pull'
  import { Tshirt, Magic, ExclamationCircle } from '@vicons/fa'

  const { t } = useI18n()
  const message = useMessage()
  const pullStore = usePullStore()

  // Props, emits, and refs
  const props = defineProps<{
    bannerId: number | null
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
  }>()
  const selectedOutfitId = ref<string | null>(null)
  const selectedBanner = ref<BannerData[number] | null>(null)
  const selectedOutfit = ref<(Outfit & { rarity: number }) | null>(null)
  const itemCounts = ref<Record<string, number>>({})
  const outfitEvoLevel = ref(0)
  const importedItemCounts = ref<Record<string, number>>({})
  const bulkCount = ref(0)
  const isSaving = ref(false)

  // Determine if we should show evolution levels based on banner type
  const showEvoLevels = computed(() => {
    if (!props.bannerId) return false
    const bannerType = getBannerType(props.bannerId)
    return bannerType === 1 || bannerType === 2
  })

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
        outfitEvoLevel.value = 0
      }
    },
    { immediate: true }
  )

  // Watch item counts to ensure they don't go below minimum
  watch(
    itemCounts,
    (newCounts) => {
      Object.keys(newCounts).forEach((itemId) => {
        const minCount = getItemMinCount(itemId)
        if (newCounts[itemId] < minCount) {
          itemCounts.value[itemId] = minCount
        }
      })
    },
    { deep: true }
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
        // Ensure the count is at least the imported count
        itemCounts.value[itemId] = Math.max(
          importedCount,
          importedCount + manualCount
        )
      })

      // Get outfit evolution level if available
      if (showEvoLevels.value && outfitInfo.rarity === 5) {
        outfitEvoLevel.value = pullStore.getOutfitEvoLevel(
          props.bannerId as number,
          selectedOutfitId.value
        )
      }

      // Calculate bulkCount as the minimum of all item counts
      if (outfit.items.length > 0) {
        bulkCount.value = Math.min(
          ...outfit.items.map((itemId) => itemCounts.value[itemId] || 0)
        )
      }
    }
  }

  const getItemCounts = (bannerId: number, itemId: string) => {
    const bannerData = pullStore.processedPulls[bannerId]
    if (!bannerData) return { importedCount: 0, manualCount: 0 }

    let importedCount = 0
    let manualCount = 0

    // Go through the raw data to count imported pulls
    const rawData = pullStore.rawPullData[bannerId] || []
    rawData.forEach(([_, id]: PullRecord) => {
      if (id === itemId) {
        importedCount++
      }
    })

    // Count edits from editsByBanner
    const editsData = pullStore.rawEditData[bannerId] || []
    editsData.forEach((edit: EditRecord) => {
      if (edit[1] === itemId) {
        manualCount++
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
      // Only apply bulk count if it's greater than or equal to the minimum allowed (imported) count
      if (bulkCount.value >= minCount) {
        itemCounts.value[itemId] = bulkCount.value
      } else {
        // If bulk count is less than minimum, set to minimum
        itemCounts.value[itemId] = minCount
      }
    })
  }

  const saveOutfitEdit = async () => {
    if (!selectedOutfitId.value || !selectedOutfit.value || !props.bannerId) {
      return
    }

    try {
      isSaving.value = true

      // Load existing data
      const { loadData, saveData } = useIndexedDB()
      const {
        pulls: existingPullData,
        edits: existingEditData,
        evo: existingEvoData,
      } = await loadData()

      // Prepare updated edit data
      const bannerId = props.bannerId as number
      let updatedEditData = { ...existingEditData }
      if (!updatedEditData[bannerId]) {
        updatedEditData[bannerId] = []
      }

      const now = useDateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss').value
      const outfitItemIds = selectedOutfit.value.items

      // Filter out existing edit entries for this outfit's items
      updatedEditData[bannerId] =
        updatedEditData[bannerId]?.filter(
          (edit) => !outfitItemIds.includes(edit[1])
        ) || []

      // Create new edit records based on current counts
      const newEditRecords: EditRecord[] = []

      selectedOutfit.value.items.forEach((itemId) => {
        const newCount = itemCounts.value[itemId] || 0
        const importedCount = importedItemCounts.value[itemId] || 0

        // Only create records for the manually added count (above imported count)
        const manualCount = Math.max(0, newCount - importedCount)

        if (manualCount > 0 && selectedOutfit.value) {
          // Create records for each manual count
          for (let i = 0; i < manualCount; i++) {
            const editRecord: EditRecord = [now, itemId]
            newEditRecords.unshift(editRecord)
          }
        }
      })

      // Add the new edit records
      updatedEditData[bannerId] = [
        ...updatedEditData[bannerId],
        ...newEditRecords,
      ]

      // If the banner has no records, remove it from the edit data
      if (updatedEditData[bannerId].length === 0) {
        updatedEditData = Object.fromEntries(
          Object.entries(updatedEditData).filter(
            ([k]) => k !== bannerId.toString()
          )
        )
      }

      // Update evolution levels if applicable and prepare updated evo data
      let updatedEvoData = { ...existingEvoData }

      // Initialize the banner's evo data if it doesn't exist
      if (!updatedEvoData[bannerId]) {
        updatedEvoData[bannerId] = []
      }

      if (showEvoLevels.value && selectedOutfit.value.rarity === 5) {
        // Remove any existing evo record for this outfit
        updatedEvoData[bannerId] = updatedEvoData[bannerId].filter(
          ([outfitId]) => outfitId !== selectedOutfitId.value
        )

        // Then add the new evo record
        if (outfitEvoLevel.value !== 0) {
          updatedEvoData[bannerId].push([
            selectedOutfitId.value,
            outfitEvoLevel.value,
          ])
        }

        if (updatedEvoData[bannerId].length === 0) {
          updatedEvoData = Object.fromEntries(
            Object.entries(updatedEvoData).filter(
              ([k]) => k !== bannerId.toString()
            )
          )
        }
      }

      // Save to IndexedDB - ensure all data is serializable
      await saveData(existingPullData, updatedEditData, updatedEvoData)

      // Process updated data
      await pullStore.processPullData(
        existingPullData,
        updatedEditData,
        updatedEvoData
      )

      message.success(t('tracker.manual_log.success'))
      emit('close')
    } catch (error) {
      console.error('Failed to save outfit data:', error)
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
