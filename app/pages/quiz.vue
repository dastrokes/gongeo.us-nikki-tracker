<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-3">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div
        class="grid gap-3 lg:gap-4"
        :class="
          gameState === 'done'
            ? 'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]'
            : 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'
        "
      >
        <div class="flex flex-col gap-2 sm:gap-3">
          <div
            class="flex flex-col gap-2 sm:gap-3"
            :class="
              gameState === 'done' ? '' : 'lg:flex-row lg:items-start lg:gap-4'
            "
          >
            <div
              v-if="gameState !== 'done'"
              class="flex flex-col gap-2 sm:gap-3 lg:w-36"
            >
              <div
                class="relative grid min-h-8 grid-cols-2 gap-2 rounded-lg border border-gray-200/80 bg-gray-50/80 px-2 py-2 text-[10px] text-gray-600 sm:text-xs lg:grid-cols-1 dark:border-gray-700/70 dark:bg-gray-900/40 dark:text-gray-300"
              >
                <div class="flex items-center justify-between gap-2 px-2">
                  <span
                    class="tracking-wide text-gray-500 uppercase dark:text-gray-400"
                    >{{ $t('quiz.round') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 dark:text-gray-100"
                    >{{ roundDisplay }}</span
                  >
                </div>
                <div class="flex items-center justify-between gap-2 px-2">
                  <span
                    class="tracking-wide text-gray-500 uppercase dark:text-gray-400"
                    >{{ $t('quiz.score') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                    >{{ score }}</span
                  >
                </div>
                <div class="flex items-center justify-between gap-2 px-2">
                  <span
                    class="tracking-wide text-gray-500 uppercase dark:text-gray-400"
                    >{{ $t('quiz.streak') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                    >{{ streak }}</span
                  >
                </div>
                <n-popover
                  trigger="click"
                  placement="bottom"
                  content-class="w-40"
                >
                  <template #trigger>
                    <n-button
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                    >
                      <template #icon>
                        <n-icon><Cog /></n-icon>
                      </template>
                    </n-button>
                  </template>
                  <div class="w-40 space-y-3 p-1">
                    <div class="space-y-1">
                      <p
                        class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                      >
                        {{ t('quiz.answer_mode') }}
                      </p>
                      <n-select
                        v-model:value="answerMode"
                        size="small"
                        :options="answerModeOptions"
                      />
                    </div>
                    <div class="space-y-1">
                      <p
                        class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                      >
                        {{ t('quiz.reveal_direction') }}
                      </p>
                      <n-select
                        v-model:value="revealDirection"
                        size="small"
                        :options="revealDirectionOptions"
                      />
                    </div>
                    <div class="space-y-1">
                      <p
                        class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                      >
                        {{ t('quiz.blur') }}
                      </p>
                      <n-slider
                        v-model:value="blurAmount"
                        :min="0"
                        :max="20"
                        :step="1"
                        :tooltip="false"
                      />
                    </div>
                  </div>
                </n-popover>
              </div>
            </div>
            <div class="flex items-center justify-center rounded-xl lg:flex-1">
              <div
                class="relative flex max-w-full items-center justify-center overflow-hidden rounded-xl"
                :class="
                  gameState === 'done'
                    ? 'w-full'
                    : 'mx-auto aspect-2/3 h-[clamp(200px,40vh,360px)]'
                "
              >
                <div
                  v-if="gameState === 'done'"
                  class="grid w-full grid-cols-5 grid-rows-2 gap-2 overflow-hidden rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-700/60 dark:bg-emerald-950/30"
                >
                  <div
                    v-for="(entry, index) in guessedOutfits"
                    :key="`summary-${entry.id}-${index}`"
                    class="flex w-full flex-col gap-1"
                  >
                    <div
                      class="relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-md"
                    >
                      <NuxtImg
                        :src="getImageSrc('outfit', entry.id)"
                        :alt="t(`outfit.${entry.id}.name`)"
                        fit="cover"
                        preset="tallLg"
                        sizes="200px"
                        draggable="false"
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <div
                      class="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-1"
                    >
                      <n-icon
                        size="16"
                        class="shrink-0"
                        :class="getResultIconClass(entry.correct)"
                        :component="entry.correct ? Check : Times"
                      />
                      <p
                        class="h-3.5 max-w-full overflow-hidden text-center text-[10px] leading-3.5 text-ellipsis whitespace-nowrap text-gray-600 sm:h-4 sm:leading-4 dark:text-gray-300"
                      >
                        {{ t(`outfit.${entry.id}.name`) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="!currentOutfitId"
                  class="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
                >
                  <div
                    v-if="gameState === 'idle'"
                    class="flex flex-col items-center gap-3"
                  >
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      {{ t('quiz.instructions') }}
                    </p>
                    <n-button
                      type="primary"
                      size="small"
                      @click="startGame"
                    >
                      {{ t('quiz.start') }}
                    </n-button>
                  </div>
                </div>
                <template v-else>
                  <div
                    v-if="isImageLoading"
                    class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl text-gray-500 dark:text-gray-300"
                  >
                    <n-spin size="large" />
                    <span class="text-xs tracking-widest uppercase">{{
                      t('common.loading')
                    }}</span>
                  </div>
                  <NuxtImg
                    :key="`silhouette-${currentOutfitId}`"
                    :src="getImageSrc('outfit', currentOutfitId)"
                    :alt="currentOutfitName"
                    fit="cover"
                    preset="tallLg"
                    sizes="200px"
                    loading="eager"
                    draggable="false"
                    class="h-full w-auto max-w-full rounded-xl will-change-[clip-path] [transition:clip-path_200ms_linear]"
                    :class="isImageReady ? 'opacity-100' : 'opacity-0'"
                    :style="isRevealed ? undefined : silhouetteStyle"
                    @load="handleOutfitImageLoaded(currentOutfitId)"
                    @error="handleOutfitImageError(currentOutfitId)"
                  />
                  <NuxtImg
                    v-if="isRevealed && isImageReady"
                    :key="`reveal-${currentOutfitId}`"
                    :src="getImageSrc('outfit', currentOutfitId)"
                    :alt="currentOutfitName"
                    fit="cover"
                    preset="tallLg"
                    sizes="200px"
                    draggable="false"
                    class="absolute top-1/2 left-1/2 h-full w-auto max-w-full -translate-x-1/2 -translate-y-1/2 rounded-xl motion-reduce:animate-none"
                    :class="revealAnimationClass"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <template v-if="gameState === 'done'">
            <div
              class="space-y-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 sm:p-5 dark:border-emerald-700/60 dark:bg-emerald-950/30"
            >
              <div class="space-y-1">
                <p
                  class="text-xs tracking-widest text-emerald-700/80 uppercase dark:text-emerald-200/80"
                >
                  {{ $t('quiz.game_complete') }}
                </p>
                <h2
                  class="text-lg font-semibold text-emerald-900 sm:text-xl dark:text-emerald-100"
                >
                  {{ $t('quiz.final_score', { score }) }}
                </h2>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div
                  class="rounded-lg bg-white/80 px-3 py-2 dark:bg-gray-900/40"
                >
                  <p
                    class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                  >
                    {{ $t('quiz.best_streak') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                  >
                    {{ bestStreak }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 px-3 py-2 dark:bg-gray-900/40"
                >
                  <p
                    class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                  >
                    {{ $t('quiz.rounds') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                  >
                    {{ totalRounds }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 px-3 py-2 dark:bg-gray-900/40"
                >
                  <p
                    class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                  >
                    {{ $t('quiz.right') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                  >
                    {{ correctCount }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 px-3 py-2 dark:bg-gray-900/40"
                >
                  <p
                    class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400"
                  >
                    {{ $t('quiz.wrong') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 tabular-nums dark:text-gray-100"
                  >
                    {{ wrongCount }}
                  </p>
                </div>
              </div>
              <n-button
                type="primary"
                class="w-full"
                @click="startGame"
              >
                {{ $t('quiz.play_again') }}
              </n-button>
            </div>
          </template>
          <template v-else>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <template v-if="answerMode === 'select'">
                <template v-if="!isImageReady">
                  <div
                    v-for="index in 4"
                    :key="`option-skeleton-${index}`"
                    class="flex min-h-12 items-center justify-center rounded-lg border border-gray-200/60 px-3 py-2 sm:min-h-14 dark:border-gray-700/60"
                  >
                    <n-skeleton
                      text
                      height="16px"
                      width="80px"
                    />
                  </div>
                </template>
                <template v-else>
                  <n-button
                    v-for="option in options"
                    :key="option"
                    :disabled="roundResult !== 'unanswered'"
                    class="min-h-12 rounded-lg py-2 text-left whitespace-normal disabled:text-gray-900 disabled:opacity-100 sm:min-h-14 dark:disabled:text-gray-100"
                    :class="getOptionClass(option)"
                    @click="submitGuess(option)"
                  >
                    <span class="flex w-full items-start justify-between gap-2">
                      <span
                        class="line-clamp-3 min-w-0 leading-snug font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {{ $t(`outfit.${option}.name`) }}
                      </span>
                      <n-icon
                        v-if="getOptionIcon(option)"
                        :component="getOptionIcon(option)"
                        :class="getOptionIconClass(option)"
                      />
                    </span>
                  </n-button>
                </template>
              </template>
              <template v-else>
                <div class="col-span-full space-y-2">
                  <template v-if="!isImageReady">
                    <div class="flex h-8 items-center justify-center">
                      <n-skeleton
                        height="16px"
                        width="80%"
                      />
                    </div>
                  </template>
                  <n-auto-complete
                    v-else
                    v-model:value="searchQuery"
                    :options="searchOptions"
                    :disabled="roundResult !== 'unanswered'"
                    :placeholder="$t('common.search')"
                    @select="submitSearchGuess"
                    @keyup.enter="submitSearchGuess()"
                  />
                  <p
                    v-if="roundResult === 'wrong' || roundResult === 'revealed'"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ $t('quiz.correct_answer') }}: {{ currentOutfitName }}
                  </p>
                </div>
              </template>
            </div>
            <div class="flex min-h-10 flex-wrap gap-2">
              <template v-if="gameState === 'playing'">
                <n-button
                  v-if="roundResult !== 'unanswered'"
                  type="primary"
                  @click="nextRound"
                >
                  {{ $t('common.next') }}
                </n-button>
                <n-button
                  :disabled="roundResult !== 'unanswered' || !isImageReady"
                  @click="revealRound"
                >
                  {{ $t('common.skip') }}
                </n-button>
              </template>
            </div>
          </template>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import type Fuse from 'fuse.js'
  import { Check, Cog, Times } from '@vicons/fa'

  type RoundResult = 'unanswered' | 'correct' | 'wrong' | 'revealed'
  type GameState = 'idle' | 'playing' | 'done'
  type RevealDirection = 'middle-out' | 'top-down' | 'bottom-up'
  type AnswerMode = 'select' | 'search'
  type OutfitSearchItem = {
    id: string
    name: string
    searchAliases?: string[]
    pinyin?: string[]
    pinyinInitials?: string[]
  }

  const { t, locale, getLocaleMessage } = useI18n()
  const { getImageSrc } = imageProvider()

  const totalRounds = 10
  const roundDuration = 10
  const minimumCorrectPoints = 10
  const timerId = ref<number | null>(null)
  const timerStart = ref<number | null>(null)
  const timeLeft = ref(roundDuration)
  const gameState = ref<GameState>('idle')
  const isRevealed = ref(false)
  const isImageLoading = ref(false)
  const isImageReady = ref(false)
  const roundResult = ref<RoundResult>('unanswered')
  const roundIndex = ref(0)
  const roundIds = ref<string[]>([])
  const currentOutfitId = ref<string | null>(null)
  const options = ref<string[]>([])
  const answerMode = ref<AnswerMode>('select')
  const searchQuery = ref('')
  const selectedId = ref<string | null>(null)
  const score = ref(0)
  const streak = ref(0)
  const bestStreak = ref(0)
  const correctCount = ref(0)
  const wrongCount = ref(0)
  const guessedOutfits = ref<{ id: string; correct: boolean }[]>([])
  const revealDirection = ref<RevealDirection>('middle-out')
  const blurAmount = ref(0)
  const outfitSearchItems = ref<OutfitSearchItem[]>([])
  const fuseInstance = ref<Fuse<OutfitSearchItem> | null>(null)
  const isSearchIndexReady = ref(false)
  const revealDirectionOptions = computed(() => [
    { label: t('quiz.reveal_options.middle_out'), value: 'middle-out' },
    { label: t('quiz.reveal_options.top_down'), value: 'top-down' },
    { label: t('quiz.reveal_options.bottom_up'), value: 'bottom-up' },
  ])
  const answerModeOptions = computed(() => [
    { label: t('common.select'), value: 'select' },
    { label: t('common.search'), value: 'search' },
  ])

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )

  const allOutfitIds = computed(() => {
    const keys = Object.keys(messages.value)
    const ids = keys
      .filter((key) => key.startsWith('outfit.') && key.endsWith('.name'))
      .map((key) => key.slice('outfit.'.length, -'.name'.length))
      .filter((id) => id.length <= 5)
    return Array.from(new Set(ids))
  })

  const currentOutfitName = computed(() =>
    currentOutfitId.value ? t(`outfit.${currentOutfitId.value}.name`) : ''
  )
  const isChineseLocale = computed(
    () => locale.value === 'zh' || locale.value === 'tw'
  )
  const {
    ensurePinyinLoaded,
    getChineseSearchMeta,
    getOutfitSearchAliases,
    getSearchKeys,
  } = useSearchFields(() => isChineseLocale.value)
  const outfitSearchMatchMap = computed(() => {
    const map = new Map<string, string>()
    allOutfitIds.value.forEach((id) => {
      const name = t(`outfit.${id}.name`)
      const aliases = getOutfitSearchAliases(locale.value, id)
      const searchValues = [name, ...aliases]
      searchValues.forEach((value) => {
        const normalized = value.trim().toLowerCase()
        if (normalized) {
          map.set(normalized, id)
        }
      })
    })
    return map
  })
  const searchOptions = computed(() => {
    const query = searchQuery.value.trim()
    const items = outfitSearchItems.value
    if (!query) {
      return items
        .slice(0, 12)
        .map((item) => ({ label: item.name, value: item.name }))
    }
    if (!fuseInstance.value) {
      return []
    }
    return fuseInstance.value.search(query, { limit: 12 }).map((result) => ({
      label: result.item.name,
      value: result.item.name,
    }))
  })

  const buildSearchIndex = async () => {
    if (import.meta.server) return
    isSearchIndexReady.value = false
    if (isChineseLocale.value) {
      await ensurePinyinLoaded()
    }

    const items = allOutfitIds.value.map((id) => {
      const name = t(`outfit.${id}.name`)
      const searchAliases = getOutfitSearchAliases(locale.value, id)
      return {
        id,
        name,
        ...(searchAliases.length > 0 ? { searchAliases } : {}),
        ...getChineseSearchMeta([name, ...searchAliases]),
      }
    })

    const { default: Fuse } = await import('fuse.js')
    fuseInstance.value = new Fuse(items, {
      threshold: 0.3,
      keys: getSearchKeys(),
      includeScore: true,
      minMatchCharLength: 1,
      ignoreDiacritics: true,
    })
    outfitSearchItems.value = items
    isSearchIndexReady.value = true
  }

  const roundDisplay = computed(() => {
    if (gameState.value === 'idle') {
      return `0 / ${totalRounds}`
    }
    const display = Math.min(roundIndex.value + 1, totalRounds)
    return `${display} / ${totalRounds}`
  })

  const revealPercent = computed(() => {
    const progress = (roundDuration - timeLeft.value) / roundDuration
    // Ease-out quadratic for faster initial reveal
    const eased = 1 - Math.pow(1 - progress, 1.5)
    return Math.min(100, Math.max(0, eased * 100))
  })
  const revealClipPath = computed(() => {
    const percent = revealPercent.value
    if (revealDirection.value === 'top-down') {
      return `inset(0 0 ${100 - percent}% 0)`
    }
    if (revealDirection.value === 'bottom-up') {
      return `inset(${100 - percent}% 0 0 0)`
    }
    return `inset(${50 - percent / 2}% 0)`
  })
  const { isDark } = useTheme()

  const revealAnimationClass = computed(() => {
    if (!isRevealed.value) return ''
    if (roundResult.value === 'correct') return 'animate-reveal-success'
    if (roundResult.value === 'wrong') return 'animate-reveal-fail'
    if (roundResult.value === 'revealed') return 'animate-reveal-skip'
    return ''
  })

  const silhouetteStyle = computed(() => {
    const glow = isDark.value
      ? 'drop-shadow(0 0 12px rgba(255,255,255,0.2))'
      : 'drop-shadow(0 0 12px rgba(0,0,0,0.2))'
    return {
      clipPath: revealClipPath.value,
      filter: `blur(${blurAmount.value}px) brightness(0) saturate(100%) ${glow}`,
    }
  })

  const clearTimer = () => {
    if (!import.meta.client) return
    if (timerId.value !== null) {
      window.cancelAnimationFrame(timerId.value)
      timerId.value = null
    }
    timerStart.value = null
  }

  const startTimer = () => {
    if (!import.meta.client) return
    clearTimer()
    timeLeft.value = roundDuration
    const durationMs = roundDuration * 1000
    const tick = (now: number) => {
      if (timerStart.value === null) {
        timerStart.value = now
      }
      const elapsed = now - timerStart.value
      const remaining = Math.max(0, durationMs - elapsed)
      timeLeft.value = remaining / 1000
      if (remaining <= 0) {
        clearTimer()
        timeLeft.value = 0
        return
      }
      timerId.value = window.requestAnimationFrame(tick)
    }
    timerId.value = window.requestAnimationFrame(tick)
  }

  const handleOutfitImageLoaded = (id: string | null) => {
    if (!id || id !== currentOutfitId.value) return
    if (isImageReady.value) return
    isImageLoading.value = false
    isImageReady.value = true
    if (roundResult.value === 'unanswered') {
      startTimer()
    }
  }

  const handleOutfitImageError = (id: string | null) => {
    if (!id || id !== currentOutfitId.value) return
    isImageLoading.value = false
    isImageReady.value = true
    if (roundResult.value === 'unanswered') {
      startTimer()
    }
  }

  const shuffle = (list: string[]) => {
    const copy = [...list]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const valueI = copy[i]
      const valueJ = copy[j]
      if (valueI === undefined || valueJ === undefined) {
        continue
      }
      copy[i] = valueJ
      copy[j] = valueI
    }
    return copy
  }

  const sampleOptions = (pool: string[], count: number) => {
    const copy = [...pool]
    const chosen: string[] = []
    while (chosen.length < count && copy.length > 0) {
      const index = Math.floor(Math.random() * copy.length)
      const picked = copy.splice(index, 1)[0]
      if (picked !== undefined) {
        chosen.push(picked)
      }
    }
    return chosen
  }

  const buildRound = () => {
    const id = roundIds.value[roundIndex.value]
    clearTimer()
    timeLeft.value = roundDuration
    if (!id) {
      currentOutfitId.value = null
      options.value = []
      isImageLoading.value = false
      isImageReady.value = false
      return
    }
    currentOutfitId.value = id
    roundResult.value = 'unanswered'
    selectedId.value = null
    isRevealed.value = false
    searchQuery.value = ''
    isImageLoading.value = true
    isImageReady.value = false
    const pool = allOutfitIds.value.filter((entry) => entry !== id)
    const optionList = sampleOptions(pool, 3)
    optionList.push(id)
    options.value = shuffle(optionList)
  }

  const startGame = () => {
    if (allOutfitIds.value.length < totalRounds + 3) {
      return
    }
    score.value = 0
    streak.value = 0
    bestStreak.value = 0
    correctCount.value = 0
    wrongCount.value = 0
    guessedOutfits.value = []
    roundIndex.value = 0
    roundIds.value = shuffle(allOutfitIds.value).slice(0, totalRounds)
    gameState.value = 'playing'
    buildRound()
  }

  const submitGuess = (option: string) => {
    if (
      roundResult.value !== 'unanswered' ||
      !currentOutfitId.value ||
      !isImageReady.value
    )
      return
    selectedId.value = option
    clearTimer()
    const remainingTime = timeLeft.value
    timeLeft.value = 0
    isRevealed.value = true
    if (option === currentOutfitId.value) {
      score.value += Math.max(
        minimumCorrectPoints,
        Math.round(remainingTime * 10)
      )
      streak.value += 1
      bestStreak.value = Math.max(bestStreak.value, streak.value)
      correctCount.value += 1
      roundResult.value = 'correct'
    } else {
      streak.value = 0
      wrongCount.value += 1
      roundResult.value = 'wrong'
    }
    guessedOutfits.value.push({
      id: currentOutfitId.value,
      correct: option === currentOutfitId.value,
    })
  }
  const resolveSearchMatch = (query: string) => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return null
    const directMatch = outfitSearchMatchMap.value.get(normalized)
    if (directMatch) return directMatch
    if (!fuseInstance.value) return null
    const result = fuseInstance.value.search(query, { limit: 1 })[0]
    return result ? result.item.id : null
  }

  const submitSearchGuess = (value?: string) => {
    if (
      roundResult.value !== 'unanswered' ||
      !currentOutfitId.value ||
      !isImageReady.value
    )
      return
    const query = value ?? searchQuery.value
    const match = resolveSearchMatch(query)
    if (!match) return
    submitGuess(match)
  }

  watch([locale, allOutfitIds], () => {
    outfitSearchItems.value = []
    fuseInstance.value = null
    isSearchIndexReady.value = false

    if (answerMode.value === 'search') {
      buildSearchIndex()
    }
  })

  watch(answerMode, (mode) => {
    if (mode === 'search' && !isSearchIndexReady.value) {
      buildSearchIndex()
    }
  })

  const revealRound = () => {
    if (roundResult.value !== 'unanswered' || !isImageReady.value) return
    clearTimer()
    timeLeft.value = 0
    isRevealed.value = true
    streak.value = 0
    roundResult.value = 'revealed'
    if (currentOutfitId.value) {
      guessedOutfits.value.push({ id: currentOutfitId.value, correct: false })
    }
  }

  const nextRound = () => {
    clearTimer()
    if (roundIndex.value + 1 >= totalRounds) {
      gameState.value = 'done'
      return
    }
    roundIndex.value += 1
    buildRound()
  }

  const getOptionClass = (option: string) => {
    if (roundResult.value === 'unanswered') return ''
    if (option === currentOutfitId.value) {
      return 'border border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100'
    }
    if (option === selectedId.value) {
      return 'border border-rose-500/50 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-100'
    }
    return ''
  }

  const getOptionIcon = (option: string) => {
    if (roundResult.value === 'unanswered') return undefined
    if (option === currentOutfitId.value) return Check
    if (roundResult.value === 'wrong' && option === selectedId.value) {
      return Times
    }
    return undefined
  }

  const getOptionIconClass = (option: string) => {
    if (option === currentOutfitId.value) {
      return `shrink-0 text-base ${getResultIconClass(true)}`
    }
    return `shrink-0 text-base ${getResultIconClass(false)}`
  }

  const getResultIconClass = (isCorrect: boolean) =>
    isCorrect
      ? 'text-emerald-600 dark:text-emerald-300'
      : 'text-rose-600 dark:text-rose-300'

  onBeforeUnmount(() => {
    clearTimer()
  })

  const pageTitle = computed(
    () =>
      `${t('quiz.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const description = computed(() => t('quiz.meta_description'))

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })
</script>
