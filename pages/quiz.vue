<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-3">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:!p-3"
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
              <div class="flex justify-start lg:justify-center">
                <n-popover
                  trigger="click"
                  placement="bottom-start"
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
                  <div class="w-56 space-y-3 p-1">
                    <div class="space-y-1">
                      <p
                        class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
                        class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
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
              <div
                class="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 min-h-[28px] lg:grid-cols-1 rounded-lg border border-gray-200/80 dark:border-gray-700/70 bg-gray-50/80 dark:bg-gray-900/40 px-2 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >{{ t('quiz.round') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 dark:text-gray-100"
                    >{{ roundDisplay }}</span
                  >
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >{{ t('quiz.score') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
                    >{{ score }}</span
                  >
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >{{ t('quiz.streak') }}</span
                  >
                  <span
                    class="font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
                    >{{ streak }}</span
                  >
                </div>
              </div>
            </div>
            <div class="rounded-xl flex items-center justify-center lg:flex-1">
              <div
                class="relative aspect-[2/3] max-w-full flex items-center justify-center overflow-hidden rounded-xl"
                :class="
                  gameState === 'done'
                    ? 'h-[clamp(200px,38vh,420px)] sm:h-[clamp(240px,48vh,520px)] w-full'
                    : 'h-[clamp(200px,40vh,360px)] mx-auto'
                "
              >
                <div
                  v-if="gameState === 'done'"
                  class="absolute inset-0 grid h-full w-full grid-cols-5 grid-rows-2 gap-2 overflow-hidden rounded-xl border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-3"
                >
                  <div
                    v-for="(entry, index) in guessedOutfits"
                    :key="`summary-${entry.id}-${index}`"
                    class="relative aspect-[2/3] w-full overflow-hidden rounded-md"
                  >
                    <NuxtImg
                      :src="getImageSrc('outfit', entry.id)"
                      :alt="t(`outfit.${entry.id}.name`)"
                      width="120"
                      height="180"
                      fit="cover"
                      preset="tallSm"
                      class="h-full w-full object-cover"
                    />
                    <span
                      class="absolute right-4 top-4 inline-flex h-2 w-2 items-center justify-center rounded-full bg-white/90 shadow-sm dark:bg-gray-900/80"
                      :class="
                        entry.correct
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-300'
                      "
                    >
                      <n-icon :component="entry.correct ? Check : Times" />
                    </span>
                  </div>
                </div>
                <div
                  v-else-if="!currentOutfitId"
                  class="absolute inset-0 flex items-center justify-center border-2 border-dashed rounded-xl border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400"
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
                  <NuxtImg
                    :key="`silhouette-${currentOutfitId}`"
                    :src="getImageSrc('outfit', currentOutfitId)"
                    :alt="currentOutfitName"
                    width="300"
                    height="450"
                    fit="cover"
                    preset="tallLg"
                    class="h-full w-auto max-w-full rounded-xl [transition:clip-path_200ms_linear] [will-change:clip-path]"
                    :style="isRevealed ? undefined : silhouetteStyle"
                  />
                  <NuxtImg
                    v-if="isRevealed"
                    :key="`reveal-${currentOutfitId}`"
                    :src="getImageSrc('outfit', currentOutfitId)"
                    :alt="currentOutfitName"
                    width="300"
                    height="450"
                    fit="cover"
                    preset="tallLg"
                    class="absolute left-1/2 top-1/2 h-full w-auto max-w-full -translate-x-1/2 -translate-y-1/2 rounded-xl"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <template v-if="gameState === 'done'">
            <div
              class="rounded-xl border border-emerald-200/70 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-3"
            >
              <div class="space-y-1">
                <p
                  class="text-xs uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-200/80"
                >
                  {{ t('quiz.game_complete') }}
                </p>
                <h2
                  class="text-lg sm:text-xl font-semibold text-emerald-900 dark:text-emerald-100"
                >
                  {{ t('quiz.final_score', { score }) }}
                </h2>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div
                  class="rounded-lg bg-white/80 dark:bg-gray-900/40 px-3 py-2"
                >
                  <p
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {{ t('quiz.best_streak') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
                  >
                    {{ bestStreak }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 dark:bg-gray-900/40 px-3 py-2"
                >
                  <p
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {{ t('quiz.rounds') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
                  >
                    {{ totalRounds }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 dark:bg-gray-900/40 px-3 py-2"
                >
                  <p
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {{ t('quiz.right') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
                  >
                    {{ correctCount }}
                  </p>
                </div>
                <div
                  class="rounded-lg bg-white/80 dark:bg-gray-900/40 px-3 py-2"
                >
                  <p
                    class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {{ t('quiz.wrong') }}
                  </p>
                  <p
                    class="text-base font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
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
                {{ t('quiz.play_again') }}
              </n-button>
            </div>
          </template>
          <template v-else>
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <n-button
                v-for="option in options"
                :key="option"
                :disabled="roundResult !== 'unanswered'"
                class="text-left whitespace-normal rounded-lg"
                :type="getOptionType(option)"
                @click="submitGuess(option)"
              >
                <span class="flex w-full items-center justify-between gap-2">
                  <span
                    class="min-w-0 font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug pb-0.5"
                  >
                    {{ t(`outfit.${option}.name`) }}
                  </span>
                  <n-icon
                    v-if="getOptionIcon(option)"
                    :component="getOptionIcon(option)"
                    :class="getOptionIconClass(option)"
                  />
                </span>
              </n-button>
            </div>
            <div class="flex flex-wrap gap-2 min-h-[40px]">
              <template v-if="gameState === 'playing'">
                <n-button
                  v-if="roundResult !== 'unanswered'"
                  type="primary"
                  @click="nextRound"
                >
                  {{ t('quiz.next') }}
                </n-button>
                <n-button
                  :disabled="roundResult !== 'unanswered'"
                  @click="revealRound"
                >
                  {{ t('quiz.skip') }}
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
  import { Check, Cog, Times } from '@vicons/fa'

  type RoundResult = 'unanswered' | 'correct' | 'wrong' | 'revealed'
  type GameState = 'idle' | 'playing' | 'done'
  type RevealDirection = 'middle-out' | 'top-down' | 'bottom-up'

  const { t, locale, getLocaleMessage } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()

  const totalRounds = 10
  const roundDuration = 10
  const minimumCorrectPoints = 10
  const timerId = ref<number | null>(null)
  const timerStart = ref<number | null>(null)
  const timeLeft = ref(roundDuration)
  const gameState = ref<GameState>('idle')
  const isRevealed = ref(false)
  const roundResult = ref<RoundResult>('unanswered')
  const roundIndex = ref(0)
  const roundIds = ref<string[]>([])
  const currentOutfitId = ref<string | null>(null)
  const options = ref<string[]>([])
  const selectedId = ref<string | null>(null)
  const score = ref(0)
  const streak = ref(0)
  const bestStreak = ref(0)
  const correctCount = ref(0)
  const wrongCount = ref(0)
  const guessedOutfits = ref<{ id: string; correct: boolean }[]>([])
  const revealDirection = ref<RevealDirection>('middle-out')
  const blurAmount = ref(0)
  const revealDirectionOptions = computed(() => [
    { label: t('quiz.reveal_options.middle_out'), value: 'middle-out' },
    { label: t('quiz.reveal_options.top_down'), value: 'top-down' },
    { label: t('quiz.reveal_options.bottom_up'), value: 'bottom-up' },
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

  const roundDisplay = computed(() => {
    if (gameState.value === 'idle') {
      return `0 / ${totalRounds}`
    }
    const display = Math.min(roundIndex.value + 1, totalRounds)
    return `${display} / ${totalRounds}`
  })

  const revealPercent = computed(() => {
    const progress = (roundDuration - timeLeft.value) / roundDuration
    return Math.min(100, Math.max(0, progress * 100))
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
    if (!id) {
      currentOutfitId.value = null
      options.value = []
      return
    }
    currentOutfitId.value = id
    roundResult.value = 'unanswered'
    selectedId.value = null
    isRevealed.value = false
    const pool = allOutfitIds.value.filter((entry) => entry !== id)
    const optionList = sampleOptions(pool, 3)
    optionList.push(id)
    options.value = shuffle(optionList)
    startTimer()
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
    if (roundResult.value !== 'unanswered' || !currentOutfitId.value) return
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

  const revealRound = () => {
    if (roundResult.value !== 'unanswered') return
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

  const getOptionType = (option: string) => {
    if (roundResult.value === 'unanswered') return 'default'
    if (option === currentOutfitId.value) return 'success'
    if (option === selectedId.value) return 'error'
    return 'default'
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
      return 'shrink-0 text-base text-emerald-600 dark:text-emerald-300'
    }
    return 'shrink-0 text-base text-rose-600 dark:text-rose-300'
  }

  onBeforeUnmount(() => {
    clearTimer()
  })

  const siteUrl = useRuntimeConfig().public.siteUrl
  const pageTitle = computed(
    () =>
      `${t('quiz.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const description = computed(() => t('quiz.meta_description'))
  const canonicalPath = computed(() => localePath('/quiz'))

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    ogType: 'website',
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${canonicalPath.value}` }],
  }))
</script>
