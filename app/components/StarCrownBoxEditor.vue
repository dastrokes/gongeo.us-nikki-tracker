<template>
  <div class="space-y-4">
    <p class="text-sm opacity-80">
      {{ hintText }}
    </p>

    <!-- One slot per box; click a slot to pick the piece it gave -->
    <div class="grid grid-cols-4 gap-3">
      <div
        v-for="(threshold, boxIndex) in thresholds"
        :key="threshold"
        class="flex min-w-0 flex-col items-center gap-1.5"
      >
        <n-popover
          trigger="click"
          placement="bottom"
          :show="openBox === boxIndex"
          :disabled="!canEdit(boxIndex)"
          @update:show="(show: boolean) => (openBox = show ? boxIndex : null)"
        >
          <template #trigger>
            <button
              type="button"
              class="relative flex size-16 items-center justify-center rounded-lg transition focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden disabled:cursor-not-allowed sm:size-20"
              :class="
                selections[boxIndex]
                  ? [getQualityGradient(STAR_CROWN_QUALITY), 'ring-1']
                  : 'border-2 border-dashed border-gray-300 dark:border-gray-600'
              "
              :disabled="!canEdit(boxIndex)"
              :aria-label="slotLabel(threshold, boxIndex)"
              :title="slotLabel(threshold, boxIndex)"
            >
              <NuxtImg
                v-if="selections[boxIndex]"
                :src="getImageSrc('itemIcon', selections[boxIndex]!)"
                alt=""
                class="size-full rounded-lg object-cover"
                preset="iconLg"
                fit="cover"
                sizes="120px"
              />
              <n-icon
                v-else
                size="22"
                class="opacity-50"
              >
                <Lock v-if="boxIndex >= earnedCount" />
                <Plus v-else />
              </n-icon>
            </button>
          </template>

          <!-- Piece picker -->
          <div class="flex max-w-72 flex-wrap justify-center gap-2">
            <button
              v-for="itemId in boxOptions(boxIndex)"
              :key="itemId"
              type="button"
              class="relative size-12 rounded-md transition focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden"
              :class="[
                getQualityGradient(STAR_CROWN_QUALITY),
                selections[boxIndex] === itemId
                  ? 'ring-2 ring-violet-500 dark:ring-violet-400'
                  : 'ring-1',
              ]"
              :aria-label="optionTitle(boxIndex, itemId)"
              :aria-pressed="selections[boxIndex] === itemId"
              :title="optionTitle(boxIndex, itemId)"
              @click="pickPiece(boxIndex, itemId)"
            >
              <NuxtImg
                :src="getImageSrc('itemIcon', itemId)"
                alt=""
                class="size-full rounded-md object-cover"
                preset="iconLg"
                fit="cover"
                loading="lazy"
                sizes="60px"
              />
              <span
                v-if="selections[boxIndex] === itemId"
                class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-violet-500 text-white shadow-sm dark:bg-violet-400 dark:text-slate-950"
              >
                <n-icon size="11"><Check /></n-icon>
              </span>
              <span
                v-else-if="swapBoxIndex(boxIndex, itemId) !== null"
                class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-violet-300 dark:bg-slate-900 dark:text-violet-300 dark:ring-violet-500/60"
              >
                <n-icon size="10"><ExchangeAlt /></n-icon>
              </span>
            </button>
          </div>
          <div
            v-if="selections[boxIndex]"
            class="mt-2 flex justify-center"
          >
            <n-button
              size="tiny"
              quaternary
              @click="pickPiece(boxIndex, null)"
            >
              {{ t('tracker.manual_log.box_clear') }}
            </n-button>
          </div>
        </n-popover>

        <span class="text-xs font-medium tabular-nums">
          {{ t('tracker.manual_log.box_label', { pulls: threshold }) }}
        </span>
        <span
          class="line-clamp-2 w-full text-center text-[11px] leading-tight opacity-70"
        >
          {{ boxStatus(boxIndex) }}
        </span>
      </div>
    </div>

    <div class="flex justify-center gap-2">
      <n-button @click="emit('close')">{{ t('common.cancel') }}</n-button>
      <n-button
        v-if="!readOnly"
        type="primary"
        :loading="isSaving"
        @click="saveBoxes"
      >
        {{ t('common.save') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Check, ExchangeAlt, Lock, Plus } from '@vicons/fa'
  import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'

  // Deep-Sea Treasure Box rewards for one Star Crown outfit. Rows are stored
  // in the starCrownBox store; Pear-Pal rows are exact and shown read-only.
  const props = defineProps<{
    bannerId: number
    outfitId: string
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
  }>()

  const { t } = useI18n()
  const message = useMessage()
  const pullStore = usePullStore()
  const { getImageSrc } = imageProvider()
  const { initFromData } = usePullStoreData()

  const thresholds = computed(() => getStarCrownBoxThresholds(props.outfitId))
  const outfitItemIds = computed(
    () => OUTFIT_DATA[props.outfitId as OutfitKey]?.items ?? []
  )

  const selections = ref<(string | null)[]>([])
  const earnedCount = ref(0)
  const readOnly = ref(false)
  const autoFilled = ref(false)
  const isSaving = ref(false)

  const hintText = computed(() => {
    if (readOnly.value) return t('tracker.manual_log.box_pearpal')
    if (autoFilled.value) return t('tracker.manual_log.box_autofill')
    return t('tracker.manual_log.box_description')
  })

  // Header text for a box: the chosen piece, "pick", or "not reached yet".
  const boxStatus = (boxIndex: number) => {
    if (boxIndex >= earnedCount.value) return t('tracker.manual_log.box_locked')
    const itemId = selections.value[boxIndex]
    return itemId ? t(`item.${itemId}.name`) : t('tracker.manual_log.box_pick')
  }

  const openBox = ref<number | null>(null)

  const canEdit = (boxIndex: number) =>
    !readOnly.value && boxIndex < earnedCount.value

  const slotLabel = (threshold: number, boxIndex: number) =>
    `${t('tracker.manual_log.box_label', { pulls: threshold })}: ${boxStatus(boxIndex)}`

  // Picking a piece another box holds swaps the two boxes.
  const pickPiece = (boxIndex: number, itemId: string | null) => {
    if (!canEdit(boxIndex)) return
    const otherIndex = itemId ? swapBoxIndex(boxIndex, itemId) : null
    if (otherIndex !== null) {
      selections.value[otherIndex] = selections.value[boxIndex] ?? null
    }
    selections.value[boxIndex] = itemId
    openBox.value = null
  }

  // Pull positions of this outfit's pieces and when each box opened, for the
  // game-rule options.
  const piecePulls = ref<StarCrownPiecePull[]>([])
  const boxOpenAfter = ref<number[]>([])

  // Only pieces the game could have given this box; the current choice stays
  // visible so it can be cleared.
  const optionsFor = (picks: (string | null)[], boxIndex: number) =>
    getStarCrownBoxOptions(
      outfitItemIds.value,
      piecePulls.value,
      boxOpenAfter.value,
      picks,
      boxIndex
    )

  const boxRound = (picks: (string | null)[], boxIndex: number) =>
    getStarCrownBoxRound(
      outfitItemIds.value,
      piecePulls.value,
      boxOpenAfter.value,
      picks,
      boxIndex
    )

  // The other box holding `itemId` when it is in the same set as `boxIndex`
  // and swapping keeps both boxes within the game rules; otherwise null.
  // Boxes of different sets never swap (the piece is just another copy).
  const swapBoxIndex = (boxIndex: number, itemId: string): number | null => {
    const picks = selections.value
    const round = boxRound(picks, boxIndex)
    const otherIndex = picks.findIndex(
      (pick, index) =>
        index !== boxIndex &&
        index < earnedCount.value &&
        pick === itemId &&
        boxRound(picks, index) === round
    )
    if (otherIndex < 0) return null
    const swapped = [...picks]
    swapped[boxIndex] = itemId
    swapped[otherIndex] = picks[boxIndex] ?? null
    const valid =
      optionsFor(swapped, boxIndex).includes(itemId) &&
      (!swapped[otherIndex] ||
        optionsFor(swapped, otherIndex).includes(swapped[otherIndex]!))
    return valid ? otherIndex : null
  }

  const boxOptions = (boxIndex: number) => {
    const options = optionsFor(selections.value, boxIndex)
    const current = selections.value[boxIndex]
    const swappable = outfitItemIds.value.filter(
      (itemId) =>
        !options.includes(itemId) && swapBoxIndex(boxIndex, itemId) !== null
    )
    const list = [...options, ...swappable]
    return current && !list.includes(current) ? [current, ...list] : list
  }

  const optionTitle = (boxIndex: number, itemId: string) => {
    const name = t(`item.${itemId}.name`)
    const otherIndex = swapBoxIndex(boxIndex, itemId)
    if (otherIndex === null || selections.value[boxIndex] === itemId) {
      return name
    }
    return `${name} · ${t('tracker.manual_log.box_swap', {
      pulls: thresholds.value[otherIndex],
    })}`
  }

  const isOutfitReward = (reward: StarCrownBoxReward) =>
    outfitItemIds.value.includes(reward.itemId)

  const loadBoxes = async () => {
    const { loadData } = useIndexedDB()
    const { starCrownBox, pulls } = await loadData()
    const rewards = (starCrownBox[props.bannerId] ?? []).filter(isOutfitReward)
    const entries = getStarCrownBoxEntries(rewards)
    const boxCount = thresholds.value.length
    const totalPulls =
      pullStore.processedPulls[props.bannerId]?.stats.totalPulls ?? 0

    // Pear-Pal pull totals can run short; its box list is canon.
    readOnly.value = rewards.some((reward) => reward.source === 'pearpal')
    earnedCount.value = Math.min(
      boxCount,
      Math.max(
        getStarCrownBoxesEarned(props.outfitId, totalPulls),
        ...entries.map((entry) => entry.boxIndex + 1)
      )
    )

    const processedBanner = pullStore.processedPulls[props.bannerId]
    piecePulls.value = (processedBanner?.pulls ?? [])
      .filter(
        (pull) =>
          pull.pullIndex > 0 && outfitItemIds.value.includes(pull.itemId)
      )
      .map(({ itemId, pullIndex }) => ({ itemId, pullIndex }))
    // Game history has pull times (10-pull batches); use them only when the
    // tracker shows that history (Pear-Pal positions differ).
    const gamePulls = pulls[props.bannerId] ?? []
    const pullTimes =
      gamePulls.length === totalPulls
        ? [...gamePulls].reverse().map(([time]) => time)
        : undefined
    const openAfter = getStarCrownBoxOpenAfter(
      props.outfitId,
      totalPulls,
      pullTimes
    )
    // Boxes Pear-Pal reports beyond the pull count open at their threshold.
    boxOpenAfter.value = thresholds.value
      .slice(0, earnedCount.value)
      .map((threshold, index) => openAfter[index] ?? threshold)

    const next: (string | null)[] = Array.from({ length: boxCount }, () => null)
    if (entries.length > 0) {
      entries.forEach(({ itemId, boxIndex }) => {
        if (boxIndex < boxCount) next[boxIndex] = itemId
      })
      autoFilled.value = false
    } else {
      // Same inference the tracker uses when nothing is saved.
      const suggestion = inferStarCrownBoxPieces(
        outfitItemIds.value,
        piecePulls.value,
        boxOpenAfter.value
      )
      suggestion.forEach((itemId, boxIndex) => {
        next[boxIndex] = itemId
      })
      autoFilled.value = suggestion.some(Boolean)
    }
    selections.value = next
  }

  const saveBoxes = async () => {
    if (readOnly.value) return
    try {
      isSaving.value = true
      const { loadData, saveStarCrownBoxData } = useIndexedDB()
      const { starCrownBox } = await loadData()
      const otherRewards = (starCrownBox[props.bannerId] ?? []).filter(
        (reward) => !isOutfitReward(reward)
      )
      const picks = selections.value.slice(0, earnedCount.value)
      // Store each box's real set (a box copy can duplicate a pulled piece).
      const rewards = createManualStarCrownBoxRewards(picks, (boxIndex) =>
        boxRound(picks, boxIndex)
      )
      await saveStarCrownBoxData({
        [props.bannerId]: [...otherRewards, ...rewards],
      })
      await initFromData(await loadData())
      message.success(t('tracker.manual_log.box_saved'))
      emit('close')
    } catch (error) {
      console.error('Failed to save treasure boxes:', error)
      message.error(t('tracker.manual_log.error'))
    } finally {
      isSaving.value = false
    }
  }

  watch(() => [props.bannerId, props.outfitId], loadBoxes, { immediate: true })
</script>
