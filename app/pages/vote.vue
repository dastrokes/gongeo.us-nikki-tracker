<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Voting Interface -->
    <n-card
      size="small"
      class="rounded-xl"
    >
      <div v-if="!loading && currentPair">
        <div
          :key="`${currentPair.banner1.id}-${currentPair.banner2.id}`"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative transition-all duration-500 ease-out"
          :class="{
            'opacity-0 scale-95 blur-xs': isTransitioning,
            'opacity-100 scale-100 blur-0': !isTransitioning,
          }"
        >
          <!-- Banner 1 -->
          <div class="relative">
            <div
              class="relative group cursor-pointer transition-all duration-300 ease-out"
              :class="{
                'scale-[0.96] sm:scale-[0.95] opacity-60':
                  selectedBanner === currentPair.banner2.id,
                'hover:scale-[1.01]': selectedBanner !== currentPair.banner1.id,
              }"
              @click="selectBanner(currentPair.banner1.id)"
            >
              <div
                class="relative aspect-2/1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all duration-300"
                :class="{
                  'ring-4 ring-sky-500/80 dark:ring-sky-400/80 shadow-2xl':
                    selectedBanner === currentPair.banner1.id,
                  'ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600':
                    selectedBanner !== currentPair.banner1.id,
                }"
              >
                <NuxtImg
                  :src="currentPair.banner1.image"
                  :alt="$t(`banner.${currentPair.banner1.id}.name`)"
                  class="w-full h-full object-cover transition-transform duration-300"
                  :class="{
                    'scale-105': selectedBanner === currentPair.banner1.id,
                  }"
                  preset="bannerHero"
                  fit="cover"
                  loading="eager"
                  sizes="400px sm:800px"
                />
                <div
                  v-if="selectedBanner === currentPair.banner1.id"
                  class="absolute inset-0 bg-transparent flex items-center justify-center animate-in fade-in duration-300"
                >
                  <div class="relative">
                    <div
                      class="absolute inset-0 bg-white dark:bg-gray-900 rounded-full blur-xl opacity-50 animate-pulse"
                    />
                    <div
                      class="relative bg-white dark:bg-gray-800 rounded-full p-2 shadow-2xl ring-4 ring-white/50 dark:ring-gray-700/50 animate-in zoom-in duration-300 flex items-center justify-center"
                    >
                      <n-icon
                        size="40"
                        class="text-sky-500 dark:text-sky-400 block leading-none"
                      >
                        <CheckCircle />
                      </n-icon>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-300"
                />
              </div>
            </div>
            <div class="mt-2 sm:mt-3 text-center">
              <NuxtLinkLocale
                :to="`/banners/${currentPair.banner1.id}`"
                target="_blank"
                class="hover:opacity-80 transition-opacity inline-flex items-center gap-1"
              >
                <n-icon
                  size="16"
                  class="text-gray-500 dark:text-gray-400"
                >
                  <CalendarDay />
                </n-icon>
                <n-text
                  strong
                  class="text-sm sm:text-base"
                  >{{ $t(`banner.${currentPair.banner1.id}.name`) }}</n-text
                >
              </NuxtLinkLocale>
            </div>
          </div>

          <!-- Banner 2 -->
          <div class="relative">
            <div
              class="relative group cursor-pointer transition-all duration-300 ease-out"
              :class="{
                'scale-[0.96] sm:scale-[0.95] opacity-60':
                  selectedBanner === currentPair.banner1.id,
                'hover:scale-[1.01]': selectedBanner !== currentPair.banner2.id,
              }"
              @click="selectBanner(currentPair.banner2.id)"
            >
              <div
                class="relative aspect-2/1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all duration-300"
                :class="{
                  'ring-4 ring-sky-500/80 dark:ring-sky-400/80 shadow-2xl':
                    selectedBanner === currentPair.banner2.id,
                  'ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600':
                    selectedBanner !== currentPair.banner2.id,
                }"
              >
                <NuxtImg
                  :src="currentPair.banner2.image"
                  :alt="$t(`banner.${currentPair.banner2.id}.name`)"
                  class="w-full h-full object-cover transition-transform duration-300"
                  :class="{
                    'scale-105': selectedBanner === currentPair.banner2.id,
                  }"
                  preset="bannerHero"
                  fit="cover"
                  loading="eager"
                  sizes="400px sm:800px"
                />
                <div
                  v-if="selectedBanner === currentPair.banner2.id"
                  class="absolute inset-0 bg-transparent flex items-center justify-center animate-in fade-in duration-300"
                >
                  <div class="relative">
                    <div
                      class="absolute inset-0 bg-white dark:bg-gray-900 rounded-full blur-xl opacity-50 animate-pulse"
                    />
                    <div
                      class="relative bg-white dark:bg-gray-800 rounded-full p-2 shadow-2xl ring-4 ring-white/50 dark:ring-gray-700/50 animate-in zoom-in duration-300 flex items-center justify-center"
                    >
                      <n-icon
                        size="40"
                        class="text-sky-500 dark:text-sky-400 block leading-none"
                      >
                        <CheckCircle />
                      </n-icon>
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all duration-300"
                />
              </div>
            </div>
            <div class="mt-2 sm:mt-3 text-center">
              <NuxtLinkLocale
                :to="`/banners/${currentPair.banner2.id}`"
                target="_blank"
                class="hover:opacity-80 transition-opacity inline-flex items-center gap-1"
              >
                <n-icon
                  size="16"
                  class="text-gray-500 dark:text-gray-400"
                >
                  <CalendarDay />
                </n-icon>
                <n-text
                  strong
                  class="text-sm sm:text-base"
                  >{{ $t(`banner.${currentPair.banner2.id}.name`) }}</n-text
                >
              </NuxtLinkLocale>
            </div>
          </div>
        </div>

        <!-- Submit and Skip Buttons -->
        <div
          class="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4 justify-center items-center"
        >
          <!-- Voting Closed Message (community mode only) -->
          <n-text
            v-if="!isPersonalMode"
            class="text-sm max-w-96 text-gray-500 dark:text-gray-400"
          >
            {{ $t('vote.errors.votingClosed') }}
          </n-text>

          <div
            class="flex flex-col-reverse sm:flex-row justify-center items-center gap-3 sm:gap-4"
          >
            <!-- Info and Toggle (below on mobile, inline on desktop) -->
            <div class="flex items-center gap-2">
              <n-tooltip
                :width="250"
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <n-button
                    text
                    size="large"
                    :disabled="submitting || skipping"
                    class="px-2"
                  >
                    <n-icon
                      size="20"
                      class="text-amber-500 dark:text-amber-400"
                    >
                      <InfoCircle />
                    </n-icon>
                  </n-button>
                </template>
                <div class="max-w-xs space-y-2">
                  <div>{{ t('vote.howItWorks') }}</div>
                  <div>{{ t('vote.abuseNotice') }}</div>
                </div>
              </n-tooltip>

              <n-tooltip
                :width="250"
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <n-switch
                    :value="isPersonalMode"
                    :disabled="submitting || skipping"
                    @update:value="setMode"
                  >
                    <template #checked>
                      <n-icon><User /></n-icon>
                    </template>
                    <template #unchecked>
                      <n-icon><Users /></n-icon>
                    </template>
                  </n-switch>
                </template>
                <div class="max-w-xs">
                  <div class="font-semibold mb-1">
                    {{
                      isPersonalMode
                        ? t('vote.mode.personal')
                        : t('vote.mode.community')
                    }}
                  </div>
                  <div>
                    {{
                      isPersonalMode
                        ? t('vote.mode.personalDesc')
                        : t('vote.mode.communityDesc')
                    }}
                  </div>
                </div>
              </n-tooltip>
            </div>

            <!-- Action Buttons -->
            <div
              v-if="isPersonalMode"
              class="flex items-center gap-3 sm:gap-4"
            >
              <n-tooltip
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <n-button
                    secondary
                    size="large"
                    @click="navigateToRankings"
                  >
                    <template #icon>
                      <n-icon>
                        <ListOl />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('vote.viewRankings') }}
              </n-tooltip>
              <n-button
                secondary
                size="large"
                :disabled="submitting || skipping"
                :loading="skipping"
                @click="handleSkip"
              >
                {{ t('common.skip') }}
              </n-button>
              <n-button
                type="primary"
                size="large"
                :disabled="!selectedBanner || submitting || skipping"
                :loading="submitting"
                @click="handleVote"
              >
                {{ t('common.submit') }}
              </n-button>
            </div>
            <div
              v-else
              class="flex items-center gap-3 sm:gap-4"
            >
              <n-tooltip
                trigger="hover"
                placement="top"
              >
                <template #trigger>
                  <n-button
                    secondary
                    size="large"
                    @click="navigateToRankings"
                  >
                    <template #icon>
                      <n-icon>
                        <ListOl />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('vote.viewRankings') }}
              </n-tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <!-- Skeleton Banner 1 -->
          <div class="relative">
            <div class="relative aspect-2/1 rounded-xl overflow-hidden">
              <n-skeleton
                class="absolute inset-0 w-full h-full"
                :sharp="false"
              />
            </div>
            <div class="mt-2 sm:mt-3 text-center">
              <n-skeleton
                text
                :width="120"
                :height="20"
                class="mx-auto"
              />
            </div>
          </div>

          <!-- Skeleton Banner 2 -->
          <div class="relative">
            <div class="relative aspect-2/1 rounded-xl overflow-hidden">
              <n-skeleton
                class="absolute inset-0 w-full h-full"
                :sharp="false"
              />
            </div>
            <div class="mt-2 sm:mt-3 text-center">
              <n-skeleton
                text
                :width="120"
                :height="20"
                class="mx-auto"
              />
            </div>
          </div>
        </div>

        <!-- Skeleton Buttons -->
        <div
          class="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-center items-center gap-3 sm:gap-4"
        >
          <!-- Info and Toggle Skeleton -->
          <div class="flex items-center gap-2">
            <n-skeleton
              circle
              :width="24"
              :height="24"
            />
            <n-skeleton
              :width="56"
              :height="24"
              :sharp="false"
            />
          </div>

          <!-- Action Buttons Skeleton -->
          <div class="flex items-center gap-3 sm:gap-4">
            <n-skeleton
              :width="44"
              :height="40"
              :sharp="false"
            />
            <n-skeleton
              :width="80"
              :height="40"
              :sharp="false"
            />
            <n-skeleton
              :width="100"
              :height="40"
              :sharp="false"
            />
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import {
    CheckCircle,
    CalendarDay,
    InfoCircle,
    ListOl,
    User,
    Users,
  } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const message = useMessage()
  const { getVotePair } = useBannerVote()
  const { getPersonalVotePair, submitPersonalVote } = usePersonalVote()

  const loading = ref(true)
  const submitting = ref(false)
  const skipping = ref(false)
  const isTransitioning = ref(false)
  const currentPair = ref<{
    banner1: { id: number; image: string }
    banner2: { id: number; image: string }
  } | null>(null)
  const selectedBanner = ref<number | null>(null)

  // Mode toggle state (community/personal) - using shared composable
  const { isPersonalMode, setMode: setVotingMode } = useVotingMode()

  // Wrapper to reload pair when mode changes
  const setMode = (value: boolean) => {
    setVotingMode(value)
    // Reload pair when mode changes to get appropriate pair for the mode
    loadPair()
  }

  // Load initial pair
  const loadPair = async () => {
    try {
      selectedBanner.value = null

      // Trigger transition if not initial load
      if (currentPair.value) {
        isTransitioning.value = true
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Conditionally use personal or community voting
      let newPair
      if (isPersonalMode.value) {
        // Personal voting - synchronous, no API call
        newPair = getPersonalVotePair()
      } else {
        // Community voting - async API call
        newPair = await getVotePair()
      }

      currentPair.value = newPair
      loading.value = false

      // Trigger zoom in after content is rendered
      await new Promise((resolve) => setTimeout(resolve, 100))
      isTransitioning.value = false
    } catch (error) {
      console.error('Failed to load vote pair:', error)
      message.error(t('vote.errors.loadFailed'))
      isTransitioning.value = false
      loading.value = false
    }
  }

  const selectBanner = (bannerId: number) => {
    selectedBanner.value = bannerId
  }

  const handleVote = async () => {
    if (!currentPair.value || !selectedBanner.value) return

    try {
      submitting.value = true

      // Conditionally submit personal or community vote
      if (isPersonalMode.value) {
        // Personal voting - synchronous localStorage operation
        submitPersonalVote(
          currentPair.value.banner1.id,
          currentPair.value.banner2.id,
          selectedBanner.value
        )
        message.success(t('vote.success'))
        await loadPair()
      } else {
        // Community voting is disabled - this should not be reached due to disabled button
        message.warning(t('vote.errors.votingClosed'), {
          duration: 5000,
        })
        submitting.value = false
        return
      }
    } catch (error: unknown) {
      console.error('Failed to submit vote:', error)

      // Check if it's a rate limit error (community voting only)
      const errorMessage = error instanceof Error ? error.message : ''
      if (
        errorMessage.includes('Rate limit exceeded') ||
        errorMessage.includes('Too many votes')
      ) {
        message.warning(t('vote.errors.rateLimit'))
      } else {
        message.error(t('vote.errors.submitFailed'))
      }
    } finally {
      submitting.value = false
    }
  }

  const handleSkip = async () => {
    if (!currentPair.value || submitting.value || skipping.value) return

    try {
      skipping.value = true
      // Load next pair without submitting a vote
      // Works for both personal and community modes
      await loadPair()
    } catch (error) {
      console.error('Failed to skip pair:', error)
      message.error(t('vote.errors.loadFailed'))
    } finally {
      skipping.value = false
    }
  }

  const navigateToRankings = () => {
    navigateTo(localePath('/ranking'))
  }

  // Load initial data
  onMounted(() => {
    loadPair()
  })

  // SEO
  useSeoMeta({
    title: () =>
      `${t('navigation.vote')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('vote.description'),
    ogTitle: () =>
      `${t('navigation.vote')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('vote.description'),
    twitterTitle: () =>
      `${t('navigation.vote')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('vote.description'),
  })
</script>
