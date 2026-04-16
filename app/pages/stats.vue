<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <n-card
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
      >
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
          <n-card
            v-for="i in 5"
            :key="i"
            size="small"
            class="text-center rounded-lg"
          >
            <n-skeleton
              height="20px"
              width="80%"
              class="mb-2 mx-auto"
            />
            <n-skeleton
              height="24px"
              width="60%"
              class="mx-auto"
            />
          </n-card>
        </div>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
        ><n-card size="small"> <n-skeleton height="320px" /></n-card>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        content-class="grid grid-cols-1 md:grid-cols-3 gap-4 !p-2 sm:!p-4"
      >
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
        >
          <n-skeleton height="200px" />
        </n-card>
      </n-card>
    </template>

    <div
      v-else-if="!hasData"
      class="space-y-2 sm:space-y-4"
    >
      <!-- No Data State -->
      <n-card class="text-center rounded-xl">
        <n-result
          size="small"
          status="info"
          :title="$t('tracker.no_data.title')"
          :description="$t('tracker.no_data.subtitle')"
        >
          <template #icon>
            <NuxtImg
              :src="getImageSrc('emote', 'think')"
              :alt="$t('tracker.no_data.title')"
              class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
              preset="iconLg"
              fit="cover"
              sizes="160px sm:200px"
            />
          </template>
          <template #footer>
            <n-button
              type="primary"
              class="relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
              @click="navigateTo(localePath('/import'))"
            >
              {{ $t('navigation.import') }}
            </n-button>
          </template>
        </n-result>
      </n-card>

      <!-- Mock Pull Activity Timeline -->
      <n-card
        size="small"
        class="rounded-xl opacity-40"
        content-class="!p-2 sm:!p-4"
      >
        <n-card size="small">
          <div class="h-[320px]">
            <VChart
              :option="mockPullActivityChartOption"
              autoresize
            />
          </div>
        </n-card>
      </n-card>
    </div>

    <div
      v-else
      class="space-y-2 sm:space-y-4"
    >
      <!-- ── Section A: Hero Overview ── -->
      <n-card
        v-show="!maximizedChart"
        content-class="!p-2 sm:!p-4"
        size="small"
        class="rounded-xl"
      >
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <!-- Total Pulls -->
          <n-card
            size="small"
            class="text-center rounded-lg"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.pulls') }}
            </div>
            <div class="text-lg font-medium tabular-nums mt-1">
              <span class="text-amber-500">{{
                pulls5StarBanners.toLocaleString()
              }}</span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">{{
                pulls4StarBanners.toLocaleString()
              }}</span>
            </div>
          </n-card>

          <!-- Banners Pulled -->
          <n-card
            size="small"
            class="text-center rounded-lg"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.banners') }}
            </div>
            <div class="text-lg font-medium tabular-nums mt-1">
              <span class="text-amber-500">{{ bannersPulled5Star }}</span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">{{ bannersPulled4Star }}</span>
            </div>
          </n-card>

          <!-- Outfits Collected -->
          <n-card
            size="small"
            class="text-center rounded-lg"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.outfits') }}
            </div>
            <div class="text-lg font-medium tabular-nums mt-1">
              <span class="text-amber-500">{{ outfitsObtained5Star }}</span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">{{ outfitsObtained4Star }}</span>
            </div>
          </n-card>

          <!-- 5★ / 4★ Count -->
          <n-card
            size="small"
            class="text-center rounded-lg"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.items') }}
            </div>
            <div class="text-lg font-medium tabular-nums mt-1">
              <span class="text-amber-500">
                <n-number-animation
                  :from="0"
                  :to="globalStats.total5StarItems"
                  :duration="2000"
                />
              </span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">
                <n-number-animation
                  :from="0"
                  :to="
                    globalStats.total4StarItems +
                    globalStats.total4StarOnlyItems
                  "
                  :duration="2000"
                />
              </span>
            </div>
          </n-card>

          <!-- Luck Rating -->
          <n-card
            size="small"
            class="text-center rounded-lg"
          >
            <div class="text-sm text-gray-400">
              {{ $t('stats.overview.luck_rating') }}
            </div>
            <div
              class="text-lg font-medium mt-1 flex items-center justify-center gap-2"
            >
              <span class="text-sm">{{ $t('banner.luck.' + luckTier) }}</span>
              <DiceAnimation
                v-if="globalStats.avg5StarPulls > 0"
                :percentile="overallLuckPercentile"
              />
            </div>
          </n-card>

          <div
            class="flex flex-col items-end justify-between h-full py-1 gap-2"
          >
            <div class="flex items-center gap-2">
              <n-tooltip
                trigger="hover"
                :width="200"
              >
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    circle
                    class="text-gray-500"
                  >
                    <template #icon>
                      <n-icon><ExclamationCircle /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ $t('stats.notice_limited') }}
              </n-tooltip>

              <n-button
                size="small"
                type="primary"
                class="relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
                @click="() => navigateTo(localePath('/tracker'))"
              >
                {{ $t('navigation.tracker') }}
              </n-button>
            </div>

            <!-- Data Source Select -->
            <n-select
              v-model:value="effectiveDataSource"
              size="small"
              class="w-36"
              :options="[
                {
                  label: t('common.sources.game'),
                  value: 'game',
                },
                {
                  label: t('common.sources.whimlog'),
                  value: 'pearpal',
                },
                {
                  label: t('common.sources.auto'),
                  value: 'auto',
                },
              ]"
            >
              <template #header>
                <div class="flex items-center justify-between px-1 py-1">
                  <span class="text-sm text-gray-400">
                    {{ t('common.sources.data_source') }}
                  </span>
                  <n-tooltip :width="200">
                    <template #trigger>
                      <n-button
                        size="tiny"
                        text
                        class="ml-2"
                      >
                        <template #icon>
                          <n-icon :depth="3">
                            <ExclamationCircle />
                          </n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ t('common.sources.data_source_tooltip') }}
                    <br />
                    {{ t('common.sources.auto_option') }}
                  </n-tooltip>
                </div>
              </template>
            </n-select>
          </div>
        </div>
      </n-card>

      <!-- ── Section B: Pull Activity Timeline ── -->
      <n-card
        v-show="!maximizedChart || maximizedChart === 'timeline'"
        size="small"
        class="rounded-xl"
        :class="{ '!mt-0 !mb-0': Boolean(maximizedChart) }"
        content-class="!p-2 sm:!p-4"
      >
        <n-card
          size="small"
          class="transition-[height] duration-300"
        >
          <div
            class="transition-[height] duration-300"
            :class="{
              'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                maximizedChart === 'timeline',
              'h-[320px]': maximizedChart !== 'timeline',
            }"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'timeline' ? 'primary' : 'default'"
              @click="toggleMaximize('timeline')"
            >
              <template #icon>
                <n-icon :depth="3">
                  <component
                    :is="
                      maximizedChart === 'timeline' ? CompressAlt : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              :option="pullActivityChartOption"
              autoresize
            />
          </div>
        </n-card>
      </n-card>
      <!-- ── Section E: Distribution Charts ── -->
      <n-card
        v-show="
          !maximizedChart ||
          maximizedChart === 'fiveStar' ||
          maximizedChart === 'fourStar' ||
          maximizedChart === 'fourStarType3'
        "
        size="small"
        class="rounded-xl"
        :class="{ '!mt-0 !mb-0': Boolean(maximizedChart) }"
        content-class="grid grid-cols-1 md:grid-cols-3 gap-4 !p-2 sm:!p-4"
      >
        <!-- 5★ Distribution -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          size="small"
          class="transition-[height] duration-300"
          :class="{ 'col-span-1 sm:col-span-3': maximizedChart === 'fiveStar' }"
        >
          <div
            class="transition-[height] duration-300"
            :class="{
              'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                maximizedChart === 'fiveStar',
              'h-[200px]': maximizedChart !== 'fiveStar',
            }"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fiveStar' ? 'primary' : 'default'"
              @click="toggleMaximize('fiveStar')"
            >
              <template #icon>
                <n-icon :depth="3">
                  <component
                    :is="
                      maximizedChart === 'fiveStar' ? CompressAlt : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              :option="fiveStarDistChartOption"
              autoresize
            />
          </div>
        </n-card>

        <!-- 4★ Distribution (5★ Banner) -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStar'"
          size="small"
          class="transition-[height] duration-300"
          :class="{ 'col-span-1 sm:col-span-3': maximizedChart === 'fourStar' }"
        >
          <div
            class="transition-[height] duration-300"
            :class="{
              'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                maximizedChart === 'fourStar',
              'h-[200px]': maximizedChart !== 'fourStar',
            }"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fourStar' ? 'primary' : 'default'"
              @click="toggleMaximize('fourStar')"
            >
              <template #icon>
                <n-icon :depth="3">
                  <component
                    :is="
                      maximizedChart === 'fourStar' ? CompressAlt : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              :option="fourStarDistChartOption"
              autoresize
            />
          </div>
        </n-card>

        <!-- 4★ Distribution (4★ Banner) -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          size="small"
          class="transition-[height] duration-300"
          :class="{
            'col-span-1 sm:col-span-3': maximizedChart === 'fourStarType3',
          }"
        >
          <div
            class="transition-[height] duration-300"
            :class="{
              'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                maximizedChart === 'fourStarType3',
              'h-[200px]': maximizedChart !== 'fourStarType3',
            }"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fourStarType3' ? 'primary' : 'default'"
              @click="toggleMaximize('fourStarType3')"
            >
              <template #icon>
                <n-icon :depth="3">
                  <component
                    :is="
                      maximizedChart === 'fourStarType3'
                        ? CompressAlt
                        : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              :option="fourStarType3DistChartOption"
              autoresize
            />
          </div>
        </n-card>
      </n-card>

      <div
        v-show="
          !maximizedChart ||
          maximizedChart === 'luckPerBanner' ||
          maximizedChart === 'luckPerBannerType3'
        "
        class="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-4"
      >
        <!-- ── Section C: 5★ Luck Per Banner Chart ── -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'luckPerBanner'"
          size="small"
          class="rounded-xl"
          :class="{ '!mt-0 !mb-0 xl:col-span-2': Boolean(maximizedChart) }"
          content-class="!p-2 sm:!p-4"
        >
          <n-card
            size="small"
            class="transition-[height] duration-300"
          >
            <div
              class="transition-[height] duration-300"
              :class="{
                'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                  maximizedChart === 'luckPerBanner',
                'h-[320px]': maximizedChart !== 'luckPerBanner',
              }"
            >
              <n-button
                size="tiny"
                text
                class="absolute top-4 right-4 z-10"
                :type="
                  maximizedChart === 'luckPerBanner' ? 'primary' : 'default'
                "
                @click="toggleMaximize('luckPerBanner')"
              >
                <template #icon>
                  <n-icon :depth="3">
                    <component
                      :is="
                        maximizedChart === 'luckPerBanner'
                          ? CompressAlt
                          : ExpandAlt
                      "
                    />
                  </n-icon>
                </template>
              </n-button>
              <VChart
                :option="luckPerBannerChartOption"
                autoresize
              />
            </div>
          </n-card>
        </n-card>

        <!-- ── Section D: 4★ Luck Per Banner Chart ── -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'luckPerBannerType3'"
          size="small"
          class="rounded-xl"
          :class="{ '!mt-0 !mb-0 xl:col-span-2': Boolean(maximizedChart) }"
          content-class="!p-2 sm:!p-4"
        >
          <n-card
            size="small"
            class="transition-[height] duration-300"
          >
            <div
              class="transition-[height] duration-300"
              :class="{
                'h-[calc(100vh-116px)] sm:h-[calc(100vh-148px)]':
                  maximizedChart === 'luckPerBannerType3',
                'h-[320px]': maximizedChart !== 'luckPerBannerType3',
              }"
            >
              <n-button
                size="tiny"
                text
                class="absolute top-4 right-4 z-10"
                :type="
                  maximizedChart === 'luckPerBannerType3'
                    ? 'primary'
                    : 'default'
                "
                @click="toggleMaximize('luckPerBannerType3')"
              >
                <template #icon>
                  <n-icon :depth="3">
                    <component
                      :is="
                        maximizedChart === 'luckPerBannerType3'
                          ? CompressAlt
                          : ExpandAlt
                      "
                    />
                  </n-icon>
                </template>
              </n-button>
              <VChart
                :option="luckPerBannerType3ChartOption"
                autoresize
              />
            </div>
          </n-card>
        </n-card>
      </div>

      <!-- ── Section G: Social Share Card ── -->
      <n-card
        v-show="!maximizedChart"
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="text-base font-semibold text-gray-500 dark:text-gray-400">
            {{ $t('stats.share.title') }}
          </div>
          <div class="flex items-center gap-2">
            <n-tooltip
              v-if="!isMobile"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :aria-label="
                    isShareLandscape
                      ? $t('stats.share.landscape')
                      : $t('stats.share.portrait')
                  "
                  @click="toggleShareOrientation"
                >
                  <template #icon>
                    <n-icon :depth="3"><Sync /></n-icon>
                  </template>
                </n-button>
              </template>
              {{
                isShareLandscape
                  ? $t('stats.share.landscape')
                  : $t('stats.share.portrait')
              }}
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  @click="exportShareCard"
                >
                  <template #icon>
                    <n-icon :depth="3"><FileImageRegular /></n-icon>
                  </template>
                </n-button>
              </template>
              {{ $t('stats.share.export_image') }}
            </n-tooltip>
          </div>
        </div>

        <!-- Share Card Container -->
        <div class="flex justify-center">
          <div
            ref="shareCardRef"
            class="w-full max-w-3xl overflow-hidden rounded-2xl"
            :class="
              isShareLandscape ? 'aspect-[16/9]' : 'aspect-[9/16] max-w-sm'
            "
          >
            <!-- Landscape Layout -->
            <div
              v-if="isShareLandscape"
              class="h-full w-full flex overflow-hidden"
              :class="[
                'bg-gradient-to-br',
                shareCardGradient,
                isDark ? 'text-white' : 'text-gray-800',
              ]"
            >
              <!-- Left Panel: Emote + Luck Tier -->
              <div
                class="w-1/3 relative flex flex-col items-center justify-center p-6"
              >
                <NuxtImg
                  :src="shareCardEmoteSrc"
                  :alt="$t('banner.luck.' + luckTier)"
                  class="w-32 h-32 object-contain relative z-10"
                  preset="iconLg"
                  fit="contain"
                  loading="lazy"
                  sizes="128px"
                />
                <div
                  class="text-xl sm:text-2xl font-black mt-3 relative z-10 text-center"
                  :class="shareCardAccentClass"
                >
                  {{ $t('banner.luck.' + luckTier) }}
                </div>
                <div class="text-sm opacity-60 mt-1 relative z-10 text-center">
                  {{
                    $t('tracker.stats.luckier', {
                      percent: overallLuckPercentile.toFixed(1),
                    })
                  }}
                </div>
              </div>

              <!-- Right Panel: Best/Worst Luck + Stats -->
              <div class="flex-1 flex flex-col p-4 bg-white/5 backdrop-blur-sm">
                <div
                  v-if="luckiestBanner || unluckiestBanner"
                  class="flex gap-3 mb-3 h-36"
                >
                  <div
                    v-if="luckiestBanner"
                    class="flex-1 relative rounded-xl overflow-hidden ring-1"
                    :class="isDark ? 'ring-white/10' : 'ring-black/10'"
                  >
                    <NuxtImg
                      :src="getImageSrc('banner', luckiestBanner.bannerId)"
                      :alt="luckiestBannerName"
                      class="absolute inset-0 w-full h-full object-cover"
                      preset="bannerThumb"
                      fit="cover"
                      loading="lazy"
                      sizes="200px"
                    />
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
                    />
                    <div
                      class="relative z-10 h-full flex flex-col justify-end p-3"
                    >
                      <div
                        class="text-xs text-green-400 font-semibold uppercase tracking-wider"
                      >
                        {{ $t('stats.share.best_luck') }}
                      </div>
                      <div class="text-sm font-bold text-white truncate mt-0.5">
                        {{ luckiestBannerName }}
                      </div>
                      <div class="text-xs text-white/70 tabular-nums">
                        {{
                          $t('stats.luck.avg_pulls', {
                            count: luckiestBanner.avg5StarPulls.toFixed(1),
                          })
                        }}
                        ·
                        {{
                          formatLuckPlacement(luckiestBanner.percentile, 'top')
                        }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="unluckiestBanner"
                    class="flex-1 relative rounded-xl overflow-hidden ring-1"
                    :class="isDark ? 'ring-white/10' : 'ring-black/10'"
                  >
                    <NuxtImg
                      :src="getImageSrc('banner', unluckiestBanner.bannerId)"
                      :alt="unluckiestBannerName"
                      class="absolute inset-0 w-full h-full object-cover"
                      preset="bannerThumb"
                      fit="cover"
                      loading="lazy"
                      sizes="200px"
                    />
                    <div
                      class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
                    />
                    <div
                      class="relative z-10 h-full flex flex-col justify-end p-3"
                    >
                      <div
                        class="text-xs text-red-400 font-semibold uppercase tracking-wider"
                      >
                        {{ $t('stats.share.worst_luck') }}
                      </div>
                      <div class="text-sm font-bold text-white truncate mt-0.5">
                        {{ unluckiestBannerName }}
                      </div>
                      <div class="text-xs text-white/70 tabular-nums">
                        {{
                          $t('stats.luck.avg_pulls', {
                            count: unluckiestBanner.avg5StarPulls.toFixed(1),
                          })
                        }}
                        ·
                        {{
                          formatLuckPlacement(
                            unluckiestBanner.percentile,
                            'bottom'
                          )
                        }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div
                  class="grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl p-3 ring-1"
                  :class="
                    isDark
                      ? 'bg-white/5 ring-white/10'
                      : 'bg-black/5 ring-black/10'
                  "
                >
                  <!-- Left Column: Split Stats -->
                  <div class="space-y-3">
                    <div>
                      <div class="text-xs opacity-50">
                        <span class="text-amber-500">5★</span> /
                        <span class="text-sky-500">4★</span>
                        {{ $t('common.pulls') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span class="text-amber-500">{{
                          pulls5StarBanners
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span class="text-sky-500">{{
                          pulls4StarBanners
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs opacity-50">
                        <span class="text-amber-500">5★</span> /
                        <span class="text-sky-500">4★</span>
                        {{ $t('common.banners') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span class="text-amber-500">{{
                          bannersPulled5Star
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span class="text-sky-500">{{
                          bannersPulled4Star
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs opacity-50">
                        <span class="text-amber-500">5★</span> /
                        <span class="text-sky-500">4★</span>
                        {{ $t('common.outfits') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span class="text-amber-500">{{
                          outfitsObtained5Star
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span class="text-sky-500">{{
                          outfitsObtained4Star
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs opacity-50">
                        <span class="text-amber-500">5★</span> /
                        <span class="text-sky-500">4★</span>
                        {{ $t('common.items') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span class="text-amber-500">{{
                          globalStats.total5StarItems
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span class="text-sky-500">
                          {{
                            globalStats.total4StarItems +
                            globalStats.total4StarOnlyItems
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column: Avg Stats -->
                  <div class="space-y-3">
                    <div>
                      <div class="text-xs opacity-50 capitalize">
                        {{ $t('tracker.banner.stats.avg_5star') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        {{ globalStats.avg5StarPulls.toFixed(1) }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs opacity-50 capitalize">
                        {{ $t('common.stats.avg_4star_mixed') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        {{ globalStats.avg4StarPulls.toFixed(1) }}
                      </div>
                    </div>
                    <div>
                      <div class="text-xs opacity-50 capitalize">
                        {{ $t('common.stats.avg_4star_only') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        {{ globalStats.avg4StarOnlyPulls.toFixed(1) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div
                  class="flex items-end justify-end text-xs opacity-40 mt-auto"
                >
                  <span class="inline-flex items-center gap-1.5">
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center rounded-md ring-1"
                      :class="
                        isDark
                          ? 'bg-white/10 ring-white/15'
                          : 'bg-white/70 ring-black/10 shadow-sm'
                      "
                    >
                      <NuxtImg
                        src="images/logo.webp"
                        preset="iconSm"
                        fit="cover"
                        loading="lazy"
                        :alt="$t('navigation.title')"
                        class="h-4 w-4 rounded-sm"
                      />
                    </span>
                    <span>{{ generatedDateLabel }} · gongeo.us</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Portrait Layout -->
            <div
              v-else
              class="relative h-full w-full flex flex-col overflow-hidden"
              :class="[
                'bg-gradient-to-b',
                shareCardGradient,
                isDark ? 'text-white' : 'text-gray-800',
              ]"
            >
              <!-- Hero: Emote + Luck Tier -->
              <div
                class="relative z-10 shrink-0 px-5 pt-5 pb-4 flex flex-col items-center"
              >
                <NuxtImg
                  :src="shareCardEmoteSrc"
                  :alt="$t('banner.luck.' + luckTier)"
                  class="w-32 h-32 object-contain relative z-10"
                  preset="iconLg"
                  fit="contain"
                  loading="lazy"
                  sizes="128px"
                />
                <div
                  class="mt-4 max-w-[240px] text-center text-2xl leading-[0.95] font-black relative z-10"
                  :class="shareCardAccentClass"
                >
                  {{ $t('banner.luck.' + luckTier) }}
                </div>
                <div
                  class="mt-1 max-w-[240px] text-center text-sm opacity-50 leading-tight relative z-10"
                >
                  {{
                    $t('tracker.stats.luckier', {
                      percent: overallLuckPercentile.toFixed(1),
                    })
                  }}
                </div>
              </div>

              <!-- Featured Banners -->
              <div
                v-if="luckiestBanner || unluckiestBanner"
                class="relative z-10 grid grid-cols-1 gap-4 px-4 mb-4"
              >
                <div
                  v-if="luckiestBanner"
                  class="relative rounded-lg overflow-hidden ring-1 min-h-[84px]"
                  :class="isDark ? 'ring-white/10' : 'ring-black/10'"
                >
                  <NuxtImg
                    :src="getImageSrc('banner', luckiestBanner.bannerId)"
                    :alt="luckiestBannerName"
                    class="absolute inset-0 w-full h-full object-cover"
                    preset="bannerThumb"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"
                  />
                  <div
                    class="relative z-10 h-full flex flex-col justify-end p-2"
                  >
                    <div
                      class="text-xs text-green-400 font-semibold uppercase tracking-wider"
                    >
                      {{ $t('stats.share.best_luck') }}
                    </div>
                    <div
                      class="text-xs font-bold leading-tight text-white line-clamp-2"
                    >
                      {{ luckiestBannerName }}
                    </div>
                    <div
                      class="text-xs leading-tight text-white/70 tabular-nums"
                    >
                      {{
                        $t('stats.luck.avg_pulls', {
                          count: luckiestBanner.avg5StarPulls.toFixed(1),
                        })
                      }}
                      ·
                      {{
                        formatLuckPlacement(luckiestBanner.percentile, 'top')
                      }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="unluckiestBanner"
                  class="relative rounded-lg overflow-hidden ring-1 min-h-[84px]"
                  :class="isDark ? 'ring-white/10' : 'ring-black/10'"
                >
                  <NuxtImg
                    :src="getImageSrc('banner', unluckiestBanner.bannerId)"
                    :alt="unluckiestBannerName"
                    class="absolute inset-0 w-full h-full object-cover"
                    preset="bannerThumb"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"
                  />
                  <div
                    class="relative z-10 h-full flex flex-col justify-end p-2"
                  >
                    <div
                      class="text-xs text-red-400 font-semibold uppercase tracking-wider"
                    >
                      {{ $t('stats.share.worst_luck') }}
                    </div>
                    <div
                      class="text-xs font-bold leading-tight text-white line-clamp-2"
                    >
                      {{ unluckiestBannerName }}
                    </div>
                    <div
                      class="text-xs leading-tight text-white/70 tabular-nums"
                    >
                      {{
                        $t('stats.luck.avg_pulls', {
                          count: unluckiestBanner.avg5StarPulls.toFixed(1),
                        })
                      }}
                      ·
                      {{
                        formatLuckPlacement(
                          unluckiestBanner.percentile,
                          'bottom'
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Stats list panel -->
              <div
                class="relative z-10 mx-5 mb-3 rounded-xl p-3 space-y-1 ring-1"
                :class="
                  isDark
                    ? 'bg-white/5 ring-white/10'
                    : 'bg-black/5 ring-black/10'
                "
              >
                <div class="flex justify-between items-center gap-2">
                  <span class="text-xs opacity-50 whitespace-nowrap shrink-0">
                    <span class="text-amber-500">5★</span> /
                    <span class="text-sky-500">4★</span>
                    {{ $t('common.pulls') }}
                  </span>
                  <span
                    class="font-bold tabular-nums whitespace-nowrap shrink-0"
                  >
                    <span class="text-amber-500">{{ pulls5StarBanners }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span class="text-sky-500">{{ pulls4StarBanners }}</span>
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-xs opacity-50 whitespace-nowrap shrink-0">
                    <span class="text-amber-500">5★</span> /
                    <span class="text-sky-500">4★</span>
                    {{ $t('common.banners') }}
                  </span>
                  <span
                    class="font-bold tabular-nums whitespace-nowrap shrink-0"
                  >
                    <span class="text-amber-500">{{ bannersPulled5Star }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span class="text-sky-500">{{ bannersPulled4Star }}</span>
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-xs opacity-50 whitespace-nowrap shrink-0">
                    <span class="text-amber-500">5★</span> /
                    <span class="text-sky-500">4★</span>
                    {{ $t('common.outfits') }}
                  </span>
                  <span
                    class="font-bold tabular-nums whitespace-nowrap shrink-0"
                  >
                    <span class="text-amber-500">{{
                      outfitsObtained5Star
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span class="text-sky-500">{{ outfitsObtained4Star }}</span>
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-xs opacity-50 whitespace-nowrap shrink-0">
                    <span class="text-amber-500">5★</span> /
                    <span class="text-sky-500">4★</span>
                    {{ $t('common.items') }}
                  </span>
                  <span
                    class="font-bold tabular-nums whitespace-nowrap shrink-0"
                  >
                    <span class="text-amber-500">{{
                      globalStats.total5StarItems
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span class="text-sky-500">{{
                      globalStats.total4StarItems +
                      globalStats.total4StarOnlyItems
                    }}</span>
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span
                    class="text-xs opacity-50 capitalize whitespace-nowrap shrink-0"
                  >
                    {{ $t('tracker.banner.stats.avg_5star') }}
                  </span>
                  <span class="font-bold tabular-nums shrink-0">
                    {{ globalStats.avg5StarPulls.toFixed(1) }}
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span
                    class="text-xs opacity-50 capitalize whitespace-nowrap shrink-0"
                  >
                    {{ $t('common.stats.avg_4star_mixed') }}
                  </span>
                  <span class="font-bold tabular-nums shrink-0">
                    {{ globalStats.avg4StarPulls.toFixed(1) }}
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span
                    class="text-xs opacity-50 capitalize whitespace-nowrap shrink-0"
                  >
                    {{ $t('common.stats.avg_4star_only') }}
                  </span>
                  <span class="font-bold tabular-nums shrink-0">
                    {{ globalStats.avg4StarOnlyPulls.toFixed(1) }}
                  </span>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="relative z-10 flex items-center justify-end px-5 pb-3 text-xs opacity-40 mt-auto"
              >
                <span class="inline-flex items-center gap-1.5">
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center rounded-md ring-1"
                    :class="
                      isDark
                        ? 'bg-white/10 ring-white/15'
                        : 'bg-white/70 ring-black/10 shadow-sm'
                    "
                  >
                    <NuxtImg
                      src="images/logo.webp"
                      preset="iconSm"
                      fit="cover"
                      loading="lazy"
                      :alt="$t('navigation.title')"
                      class="h-4 w-4 rounded-sm"
                    />
                  </span>
                  <span>{{ generatedDateLabel }} · gongeo.us</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import {
    ExpandAlt,
    CompressAlt,
    FileImageRegular,
    Sync,
    ExclamationCircle,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import {
    getBannerAvg5StarValueForLuckPercentile,
    getBannerAvg4StarType3ValueForLuckPercentile,
  } from '~/utils/percentile'

  const { t, locale } = useI18n()
  const message = useMessage()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { initFromIndexedDB } = usePullStoreData()
  const pullStore = usePullStore()
  const { globalStats, processedPulls } = storeToRefs(pullStore)
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = computed(() => !breakpoints.greater('sm').value)
  const generatedDateLabel = ref('')
  const localDataSource = useDataSource()
  const effectiveDataSource = computed({
    get: () => pullStore.dataSource ?? localDataSource.value,
    set: (value) => {
      localDataSource.value = value
      pullStore.dataSource = null
    },
  })

  const {
    hasData,
    pulls5StarBanners,
    pulls4StarBanners,
    bannersPulled5Star,
    bannersPulled4Star,
    outfitsObtained5Star,
    outfitsObtained4Star,
    overallLuckPercentile,
    luckTier,
    luckiestBanner,
    unluckiestBanner,
    bannerLuckRanking,
    bannerLuckRankingType3,
    fiveStarDistribution,
    fourStarDistribution,
    fourStarType3Distribution,
    pullActivity,
  } = usePersonalStats()

  // ── Loading ──
  const loading = ref(true)

  // ── Share Card Computed ──
  const shareCardEmoteSrc = computed(() => {
    const emoteByTier: Record<number, string> = {
      1: 'luck-1',
      2: 'luck-2',
      3: 'luck-3',
      4: 'luck-4',
      5: 'luck-5',
      6: 'luck-6',
    }

    return getImageSrc('emote', emoteByTier[luckTier.value] ?? 'think')
  })

  const luckiestBannerName = computed(() => {
    if (!luckiestBanner.value) return ''
    const banner = BANNER_DATA[luckiestBanner.value.bannerId]
    return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
  })
  const unluckiestBannerName = computed(() => {
    if (!unluckiestBanner.value) return ''
    const banner = BANNER_DATA[unluckiestBanner.value.bannerId]
    return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
  })

  const formatLuckPlacement = (
    percentile: number,
    direction: 'top' | 'bottom'
  ) => {
    const placementPercent =
      direction === 'top'
        ? Math.max(0.1, 100 - percentile).toFixed(1)
        : Math.max(0.1, percentile).toFixed(1)

    return t(
      direction === 'top'
        ? 'stats.luck.top_percent'
        : 'stats.luck.bottom_percent',
      { percent: placementPercent }
    )
  }

  const shareCardGradient = computed(() => {
    const tier = luckTier.value
    if (isDark.value) {
      if (tier >= 5) return 'from-[#1a0f2e] via-[#2d1541] to-[#1a0a28]'
      if (tier >= 3) return 'from-[#0f1729] via-[#1a1f3d] to-[#1a1033]'
      if (tier === 2) return 'from-[#1a1a2e] via-[#16213e] to-[#0f0f23]'
      return 'from-[#1a1a1a] via-[#2d1f1f] to-[#1a0f0f]'
    }
    if (tier >= 5) return 'from-[#fef9e7] via-[#fce4ec] to-[#f3e5f5]'
    if (tier >= 3) return 'from-[#f5eeff] via-[#ffe8f5] to-[#fff5e8]'
    if (tier === 2) return 'from-[#e8eaf6] via-[#e1f5fe] to-[#f3e5f5]'
    return 'from-[#fce4ec] via-[#efebe9] to-[#eceff1]'
  })

  const shareCardAccentClass = computed(() => {
    const tier = luckTier.value
    if (tier >= 5) return 'text-amber-400'
    if (tier >= 3) return 'text-purple-400'
    if (tier === 2) return 'text-sky-400'
    return 'text-red-400'
  })

  const loadAndProcessData = async () => {
    loading.value = true
    try {
      await initFromIndexedDB()
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    generatedDateLabel.value = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    if (Object.keys(processedPulls.value).length > 0 && !pullStore.dataSource) {
      loading.value = false
      initializeCharts()
      return
    }

    await loadAndProcessData()

    // Initialize mock charts if no data
    if (!hasData.value) {
      initializeMockCharts()
    }
  })

  watch(effectiveDataSource, (nextSource, previousSource) => {
    if (nextSource === previousSource || loading.value) return
    void loadAndProcessData()
  })

  // Watch for theme and data changes to reinitialize charts
  watch(
    [
      () => isDark.value,
      () => isMobile.value,
      hasData,
      bannerLuckRanking,
      bannerLuckRankingType3,
      fiveStarDistribution,
      fourStarDistribution,
      fourStarType3Distribution,
      pullActivity,
    ],
    () => {
      if (import.meta.client) {
        if (hasData.value) {
          initializeCharts()
        } else {
          initializeMockCharts()
        }
      }
    }
  )

  // ── SEO ──
  useSeoMeta({
    title: () =>
      `${t('navigation.stats')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.stats'),
    ogTitle: () =>
      `${t('navigation.stats')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.stats'),
    twitterTitle: () =>
      `${t('navigation.stats')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.stats'),
  })

  // ── Chart Infrastructure ──
  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  const getChartTextStyle = () => ({
    fontFamily:
      "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    color: isDark.value ? palette.textDark : palette.textLight,
  })

  const maximizedChart = ref<string | null>(null)
  const toggleMaximize = (chartId: string | null) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  watch(maximizedChart, async (activeChart) => {
    if (!import.meta.client) return

    document.body.style.overflow = activeChart ? 'hidden' : ''

    await nextTick()
    window.dispatchEvent(new Event('resize'))

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 320)
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    document.body.style.overflow = ''
  })

  // Chart options
  const pullActivityChartOption = ref({})
  const luckPerBannerChartOption = ref({})
  const luckPerBannerType3ChartOption = ref({})
  const fiveStarDistChartOption = ref({})
  const fourStarDistChartOption = ref({})
  const fourStarType3DistChartOption = ref({})

  // Mock chart option for empty state
  const mockPullActivityChartOption = ref({})

  const resetChartOptions = () => {
    pullActivityChartOption.value = {}
    luckPerBannerChartOption.value = {}
    luckPerBannerType3ChartOption.value = {}
    fiveStarDistChartOption.value = {}
    fourStarDistChartOption.value = {}
    fourStarType3DistChartOption.value = {}
  }

  const initializeCharts = () => {
    if (!hasData.value) {
      resetChartOptions()
      return
    }

    try {
      createPullActivityChart()
      createLuckPerBannerChart()
      createLuckPerBannerType3Chart()
      createFiveStarDistChart()
      createFourStarDistChart()
      createFourStarType3DistChart()
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  }

  // Initialize mock chart for empty state with full timeline
  const initializeMockCharts = () => {
    const textStyle = getChartTextStyle()

    // Get all banners sorted by ID (chronological order)
    const allBannerIds = Object.keys(BANNER_DATA)
      .map(Number)
      .sort((a, b) => a - b)

    // Create mock data for all banners
    const mockBannerLabels = allBannerIds.map((bannerId) => {
      const banner = BANNER_DATA[bannerId]
      return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
    })

    // Generate realistic pull counts with gaps (users don't pull on every banner)
    const mockPullCounts = allBannerIds.map((bannerId) => {
      const banner = BANNER_DATA[bannerId]
      const bannerType = banner?.bannerType || 2

      // 60% chance of having pulls on a banner (40% gap)
      if (Math.random() > 0.6) return 0

      // Different ranges based on banner type
      if (bannerType === 2) {
        // 5★ banners: 100-200 pulls
        return Math.floor(Math.random() * 101) + 100
      } else {
        // 4★ banners (type 1 and 3): 20-40 pulls
        return Math.floor(Math.random() * 21) + 20
      }
    })

    // Calculate cumulative pulls
    const mockCumulative = mockPullCounts.reduce((acc, val, idx) => {
      acc.push((acc[idx - 1] || 0) + val)
      return acc
    }, [] as number[])

    mockPullActivityChartOption.value = {
      textStyle,
      title: {
        text: t('stats.charts.pull_timeline'),
        left: 'center',
        top: 0,
        textStyle: { ...textStyle, fontSize: 16, fontWeight: 'bold' },
      },
      grid: { top: 40, bottom: 0, left: 40, right: 50 },
      xAxis: {
        type: 'category',
        data: mockBannerLabels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? palette.textLight : palette.textDark,
          },
        },
        axisLabel: {
          ...textStyle,
          rotate: isMobile.value ? 90 : 30,
        },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: textStyle,
        },
        {
          type: 'value',
          position: 'right',
          splitLine: { show: false },
          axisLabel: textStyle,
          axisLine: {
            show: true,
            lineStyle: {
              color: isDark.value ? palette.textLight : palette.textDark,
            },
          },
        },
      ],
      series: [
        {
          name: t('common.stats.total_pulls'),
          type: 'bar',
          data: mockPullCounts.map((val, idx) => {
            const bannerId = allBannerIds[idx]
            const bannerType = bannerId ? BANNER_DATA[bannerId]?.bannerType : 2
            const quality = bannerType === 2 ? 5 : 4
            const color = getQualityColor(quality)
            return {
              value: val,
              itemStyle: {
                color: isDark.value ? `${color}99` : `${color}80`,
                borderRadius: [4, 4, 0, 0],
              },
            }
          }),
        },
        {
          name: t('stats.charts.cumulative_pulls'),
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: mockCumulative,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: isDark.value
              ? 'rgba(236, 72, 153, 0.7)'
              : 'rgba(219, 39, 119, 0.6)',
          },
          itemStyle: {
            color: isDark.value
              ? 'rgba(236, 72, 153, 0.7)'
              : 'rgba(219, 39, 119, 0.6)',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: isDark.value
                    ? 'rgba(236, 72, 153, 0.3)'
                    : 'rgba(219, 39, 119, 0.15)',
                },
                { offset: 1, color: 'rgba(236, 72, 153, 0)' },
              ],
            },
          },
        },
      ],
    }
  }

  const highLuckPercentile = 400 / 6
  const midLuckPercentile = 200 / 6

  const fiveStarHighLuckThreshold =
    getBannerAvg5StarValueForLuckPercentile(highLuckPercentile)
  const fiveStarMidLuckThreshold =
    getBannerAvg5StarValueForLuckPercentile(midLuckPercentile)

  const fourStarHighLuckThreshold =
    getBannerAvg4StarType3ValueForLuckPercentile(highLuckPercentile)
  const fourStarMidLuckThreshold =
    getBannerAvg4StarType3ValueForLuckPercentile(midLuckPercentile)

  const get5StarBannerLuckBarColor = (avgPulls: number) => {
    const baseOpacity = 0.5

    if (avgPulls <= 0) return `rgba(156, 163, 175, ${baseOpacity})`
    if (avgPulls <= fiveStarHighLuckThreshold) {
      return `rgba(34, 197, 94, ${baseOpacity})`
    }
    if (avgPulls <= fiveStarMidLuckThreshold) {
      return `rgba(234, 179, 8, ${baseOpacity})`
    }
    return `rgba(239, 68, 68, ${baseOpacity})`
  }

  const get4StarBannerLuckBarColor = (avgPulls: number) => {
    const baseOpacity = 0.5

    if (avgPulls <= 0) return `rgba(156, 163, 175, ${baseOpacity})`
    if (avgPulls <= fourStarHighLuckThreshold) {
      return `rgba(34, 197, 94, ${baseOpacity})`
    }
    if (avgPulls <= fourStarMidLuckThreshold) {
      return `rgba(234, 179, 8, ${baseOpacity})`
    }
    return `rgba(239, 68, 68, ${baseOpacity})`
  }

  const getBannerThumbChartImage = (bannerId: string | number | undefined) => {
    if (!bannerId) return ''

    return nuxtImg(
      getImageSrc('bannerThumb', bannerId.toString()),
      {},
      {
        preset: 'bannerThumb',
      }
    )
  }

  const createLuckBarData = (
    values: number[],
    getBarColor: (value: number) => string
  ) =>
    values.map((value) => ({
      value,
      itemStyle: {
        color: getBarColor(value),
        borderRadius: [0, 4, 4, 0],
      },
    }))

  // ── 5★ Luck Per Banner Chart ──
  const createLuckPerBannerChart = () => {
    const data = bannerLuckRanking.value
    if (data.length === 0) {
      luckPerBannerChartOption.value = {}
      return
    }

    const avg = globalStats.value.avg5StarPulls
    // Sort by avg pulls descending (unluckiest at top) for horizontal bars
    const sorted = [...data].sort((a, b) => b.avg5StarPulls - a.avg5StarPulls)

    const bannerLabels = sorted.map((entry) => {
      const banner = BANNER_DATA[entry.bannerId]
      return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
    })

    const textStyle = getChartTextStyle()

    luckPerBannerChartOption.value = {
      textStyle,
      title: {
        text: t('stats.charts.luck_per_banner'),
        left: 'center',
        top: isMobile.value ? 10 : 0,
        textStyle: { ...textStyle, fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: { dataIndex: number; value: number }[]) => {
          const idx = params[0]?.dataIndex ?? 0
          const entry = sorted[idx]
          if (!entry) return ''
          const banner = BANNER_DATA[entry.bannerId]
          const name = banner?.bannerId
            ? t(`banner.${banner.bannerId}.name`)
            : ''
          const imageUrl = getBannerThumbChartImage(entry.bannerId)
          const imgHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${name}" style="width: 200px; height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;" />`
            : ''

          const isLucky = entry.percentile >= 50
          const displayPercent = isLucky
            ? (100 - entry.percentile).toFixed(1)
            : entry.percentile.toFixed(1)
          const placementText = isLucky
            ? t('stats.luck.top_percent', { percent: displayPercent })
            : t('stats.luck.bottom_percent', { percent: displayPercent })

          return `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="font-weight: bold; margin-bottom: 4px; text-align: center;">${name}</div>
              <div style="text-align: left;">
                <div>${t('stats.luck.avg_pulls', { count: entry.avg5StarPulls.toFixed(1) })}</div>
                <div>${placementText}</div>
              </div>
              ${imgHtml}
            </div>
          `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        top: isMobile.value ? 40 : 30,
        bottom: 0,
        left: isMobile.value ? 100 : 140,
        right: 30,
      },
      xAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLabel: textStyle,
      },
      yAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? palette.textLight : palette.textDark,
          },
        },
        axisLabel: {
          ...textStyle,
          width: isMobile.value ? 90 : 130,
          overflow: 'truncate',
        },
      },
      series: [
        {
          type: 'bar',
          data: createLuckBarData(
            sorted.map((entry) => entry.avg5StarPulls),
            get5StarBannerLuckBarColor
          ),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              type: 'dashed',
            },
            label: {
              formatter: `Avg: ${avg.toFixed(1)}`,
              ...textStyle,
              fontSize: 11,
            },
            data: [{ xAxis: avg }],
          },
        },
      ],
    }
  }

  // ── 4★ Luck Per Banner Chart (Type 3) ──
  const createLuckPerBannerType3Chart = () => {
    const data = bannerLuckRankingType3.value
    if (data.length === 0) {
      luckPerBannerType3ChartOption.value = {}
      return
    }

    const avg = globalStats.value.avg4StarOnlyPulls
    const sorted = [...data].sort((a, b) => b.avg4StarPulls - a.avg4StarPulls)

    const bannerLabels = sorted.map((entry) => {
      const banner = BANNER_DATA[entry.bannerId]
      return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
    })

    const textStyle = getChartTextStyle()

    luckPerBannerType3ChartOption.value = {
      textStyle,
      title: {
        text: t('stats.charts.luck_per_banner_type3'),
        left: 'center',
        top: isMobile.value ? 10 : 0,
        textStyle: { ...textStyle, fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: { dataIndex: number; value: number }[]) => {
          const idx = params[0]?.dataIndex ?? 0
          const entry = sorted[idx]
          if (!entry) return ''
          const banner = BANNER_DATA[entry.bannerId]
          const name = banner?.bannerId
            ? t(`banner.${banner.bannerId}.name`)
            : ''
          const imageUrl = getBannerThumbChartImage(entry.bannerId)
          const imgHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${name}" style="width: 200px; height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;" />`
            : ''

          const isLucky = entry.percentile >= 50
          const displayPercent = isLucky
            ? (100 - entry.percentile).toFixed(1)
            : entry.percentile.toFixed(1)
          const placementText = isLucky
            ? t('stats.luck.top_percent', { percent: displayPercent })
            : t('stats.luck.bottom_percent', { percent: displayPercent })

          return `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="font-weight: bold; margin-bottom: 4px; text-align: center;">${name}</div>
              <div style="text-align: left;">
                <div>${t('stats.luck.avg_pulls', { count: entry.avg4StarPulls.toFixed(1) })}</div>
                <div>${placementText}</div>
              </div>
              ${imgHtml}
            </div>
          `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        top: isMobile.value ? 40 : 30,
        bottom: 0,
        left: isMobile.value ? 100 : 140,
        right: 30,
      },
      xAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLabel: textStyle,
      },
      yAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? palette.textLight : palette.textDark,
          },
        },
        axisLabel: {
          ...textStyle,
          width: isMobile.value ? 90 : 130,
          overflow: 'truncate',
        },
      },
      series: [
        {
          type: 'bar',
          data: createLuckBarData(
            sorted.map((entry) => entry.avg4StarPulls),
            get4StarBannerLuckBarColor
          ),
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              type: 'dashed',
            },
            label: {
              formatter: `Avg: ${avg.toFixed(1)}`,
              ...textStyle,
              fontSize: 11,
            },
            data: [{ xAxis: avg }],
          },
        },
      ],
    }
  }

  // ── Distribution Chart Helper ──
  const createDistributionChartOption = (
    chartData: Record<number, number>,
    titleText: string,
    color: string
  ) => {
    const entries = Object.entries(chartData)
      .map(([k, v]) => [parseInt(k), v] as [number, number])
      .sort(([a], [b]) => a - b)

    if (entries.length === 0) return {}

    const labels = entries.map(([k]) => String(k))
    const values = entries.map(([, v]) => v)
    const total = values.reduce((sum, val) => sum + val, 0)

    let runningTotal = 0
    const cumulativeData = values.map((value) => {
      runningTotal += value
      return (runningTotal / total) * 100
    })

    const textStyle = getChartTextStyle()

    return {
      textStyle,
      title: {
        text: titleText,
        left: 'left',
        top: 0,
        textStyle: { ...textStyle, fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: { axisValue: string; value: number }[]) => {
          const barData = params[0]
          const lineData = params[1]
          if (!barData || !lineData) return ''
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${t('common.charts.number_of_pulls')}: ${barData.axisValue}
            </div>
            <div>${t('stats.charts.frequency')}: <strong>${barData.value}</strong></div>
            <div>${(((barData.value as number) / total) * 100).toFixed(2)}% · ${t('stats.charts.cumulative_pulls')}: <strong>${(lineData.value as number).toFixed(1)}%</strong></div>
          `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: { top: 35, bottom: 0, left: 30, right: 30 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? palette.textLight : palette.textDark,
          },
        },
        axisLabel: textStyle,
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { show: false },
        },
        {
          type: 'value',
          max: 100,
          splitLine: { show: false },
          axisLabel: { show: false },
        },
      ],
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        },
        {
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: cumulativeData,
          symbol: 'circle',
          symbolSize: 3,
          lineStyle: { color: color.replace('0.5', '0.3') },
          itemStyle: { color: color.replace('0.5', '0.3') },
        },
      ],
    }
  }

  const createFiveStarDistChart = () => {
    const data = fiveStarDistribution.value
    if (Object.keys(data).length === 0) {
      fiveStarDistChartOption.value = {}
      return
    }
    fiveStarDistChartOption.value = createDistributionChartOption(
      data,
      t('stats.charts.five_star_distribution'),
      getQualityColor(5) + 'CC'
    )
  }

  const createFourStarDistChart = () => {
    const data = fourStarDistribution.value
    if (Object.keys(data).length === 0) {
      fourStarDistChartOption.value = {}
      return
    }
    fourStarDistChartOption.value = createDistributionChartOption(
      data,
      t('global.charts.four_star_type2_distribution'),
      getQualityColor(4) + 'CC'
    )
  }

  const createFourStarType3DistChart = () => {
    const data = fourStarType3Distribution.value
    if (Object.keys(data).length === 0) {
      fourStarType3DistChartOption.value = {}
      return
    }
    fourStarType3DistChartOption.value = createDistributionChartOption(
      data,
      t('global.charts.four_star_type3_distribution'),
      getQualityColor(4) + 'CC'
    )
  }

  // ── Pull Activity Chart (per banner) ──
  const createPullActivityChart = () => {
    const data = pullActivity.value
    if (data.length === 0) {
      pullActivityChartOption.value = {}
      return
    }

    const bannerLabels = data.map((p) => {
      const banner = BANNER_DATA[p.bannerId]
      return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
    })

    const textStyle = getChartTextStyle()

    pullActivityChartOption.value = {
      textStyle,
      title: {
        text: t('stats.charts.pull_timeline'),
        left: 'center',
        top: 0,
        textStyle: { ...textStyle, fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (
          params: {
            axisValue: string
            value: number
            seriesName: string
            dataIndex: number
          }[]
        ) => {
          const pulls = params[0]
          const cumulative = params[1]
          if (!pulls) return ''

          const bannerObj = data[pulls.dataIndex]
          const bannerId = bannerObj?.bannerId
          const imageUrl = bannerId
            ? nuxtImg(
                getImageSrc('bannerThumb', bannerId.toString()),
                {},
                {
                  preset: 'bannerThumb',
                }
              )
            : ''
          const imgHtml = imageUrl
            ? `<img src="${imageUrl}" alt="${pulls.axisValue}" style="width: 200px; height: 100px; object-cover: cover; border-radius: 4px; margin-top: 8px;" />`
            : ''

          return `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="font-weight: bold; margin-bottom: 4px; text-align: center;">${pulls.axisValue}</div>
              <div style="text-align: left;">
                <div>${t('common.stats.total_pulls')}: <strong>${pulls.value}</strong></div>
                ${cumulative ? `<div>${t('stats.charts.cumulative_pulls')}: <strong>${cumulative.value}</strong></div>` : ''}
              </div>
              ${imgHtml}
            </div>
          `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: { top: 40, bottom: 0, left: 40, right: 50 },
      xAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? palette.textLight : palette.textDark,
          },
        },
        axisLabel: {
          ...textStyle,
          rotate: isMobile.value ? 90 : 30,
        },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: textStyle,
        },
        {
          type: 'value',
          position: 'right',
          splitLine: { show: false },
          axisLabel: textStyle,
          axisLine: {
            show: true,
            lineStyle: {
              color: isDark.value ? palette.textLight : palette.textDark,
            },
          },
        },
      ],
      series: [
        {
          name: t('common.stats.total_pulls'),
          type: 'bar',
          data: data.map((p) => {
            const bannerType = BANNER_DATA[p.bannerId]?.bannerType
            const quality = bannerType === 2 ? 5 : 4
            const color = getQualityColor(quality)
            return {
              value: p.count,
              itemStyle: {
                color: isDark.value ? `${color}99` : `${color}80`,
                borderRadius: [4, 4, 0, 0],
              },
            }
          }),
        },
        {
          name: t('stats.charts.cumulative_pulls'),
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.map((p) => p.cumulative),
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: isDark.value
              ? 'rgba(236, 72, 153, 0.7)'
              : 'rgba(219, 39, 119, 0.6)',
          },
          itemStyle: {
            color: isDark.value
              ? 'rgba(236, 72, 153, 0.7)'
              : 'rgba(219, 39, 119, 0.6)',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: isDark.value
                    ? 'rgba(236, 72, 153, 0.3)'
                    : 'rgba(219, 39, 119, 0.15)',
                },
                { offset: 1, color: 'rgba(236, 72, 153, 0)' },
              ],
            },
          },
        },
      ],
    }
  }

  // ── Share Card Export ──
  const shareCardRef = ref<HTMLElement | null>(null)
  const isShareLandscape = ref(!isMobile.value)
  const toggleShareOrientation = () => {
    isShareLandscape.value = !isShareLandscape.value
  }

  // Force portrait on mobile
  watch(isMobile, (mobile) => {
    if (mobile) isShareLandscape.value = false
  })

  const exportShareCard = async () => {
    if (!shareCardRef.value) return
    message.info(t('stats.share.in_progress'))
    try {
      // Wait for all images in the share card to load
      const images = shareCardRef.value.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject()
          })
        })
      )
      const fileName = `gongeous-stats-${new Date().toISOString().split('T')[0]}.png`
      await exportToPng(shareCardRef.value, fileName)
      message.success(t('stats.share.success'))
    } catch {
      message.error(t('stats.share.error'))
    }
  }
</script>
