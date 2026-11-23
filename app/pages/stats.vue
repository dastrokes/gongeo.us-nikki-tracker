<template>
  <div
    ref="pageRef"
    class="mx-auto max-w-7xl space-y-2 sm:space-y-4"
  >
    <!-- Loading State -->
    <template v-if="loading">
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
          <n-card
            v-for="i in 5"
            :key="i"
            size="small"
            class="rounded-lg text-center"
          >
            <n-skeleton
              height="20px"
              width="80%"
              class="mx-auto mb-2"
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
        content-class="p-2 sm:p-4"
      >
        <StatsChartPanel
          :title="t('stats.charts.pull_timeline')"
          loading
        >
          <n-skeleton height="100%" />
        </StatsChartPanel>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatsChartPanel
          v-for="title in [
            'stats.charts.five_star_distribution',
            'global.charts.four_star_type2_distribution',
            'global.charts.four_star_type3_distribution',
          ]"
          :key="title"
          :title="t(title)"
          loading
          height-class="h-56"
        >
          <n-skeleton height="100%" />
        </StatsChartPanel>
      </n-card>
    </template>

    <div
      v-else-if="!hasData"
      class="space-y-2 sm:space-y-4"
    >
      <!-- No Data State -->
      <n-card class="rounded-xl text-center">
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
              class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
              preset="iconLg"
              fit="cover"
              sizes="120px"
            />
          </template>
          <template #footer>
            <n-button
              type="primary"
              class="after:animate-button-shimmer relative overflow-hidden after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:content-[''] motion-reduce:after:animate-none"
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
        content-class="p-2 sm:p-4"
      >
        <StatsChartPanel
          :maximizable="false"
          :title="t('stats.charts.pull_timeline')"
        >
          <StatsChart :option="mockPullActivityChartOption" />
        </StatsChartPanel>
      </n-card>
    </div>

    <div
      v-else
      class="space-y-2 sm:space-y-4"
    >
      <!-- ── Section A: Hero Overview ── -->
      <n-card
        v-show="!maximizedChart"
        content-class="p-2 sm:p-4"
        size="small"
        class="rounded-xl"
      >
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <!-- Total Pulls -->
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.pulls') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <span class="text-amber-500">
                <n-number-animation
                  :from="0"
                  :to="pulls5StarBanners"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">
                <n-number-animation
                  :from="0"
                  :to="pulls4StarBanners"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
            </div>
          </n-card>

          <!-- Banners Pulled -->
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.banners') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <span class="text-amber-500">
                <n-number-animation
                  :from="0"
                  :to="bannersPulled5Star"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">
                <n-number-animation
                  :from="0"
                  :to="bannersPulled4Star"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
            </div>
          </n-card>

          <!-- Outfits Collected -->
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.outfits') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <span class="text-amber-500">
                <n-number-animation
                  :from="0"
                  :to="outfitsObtained5Star"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
              <span class="mx-1 text-gray-400">/</span>
              <span class="text-sky-500">
                <n-number-animation
                  :from="0"
                  :to="outfitsObtained4Star"
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
            </div>
          </n-card>

          <!-- 5★ / 4★ Count -->
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              <span class="text-amber-500">5★</span>
              <span class="mx-1">/</span>
              <span class="text-sky-500">4★</span>
              {{ $t('common.items') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <span class="text-amber-500">
                <n-number-animation
                  :from="0"
                  :to="globalStats.total5StarItems"
                  :duration="numberAnimationDuration"
                  show-separator
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
                  :duration="numberAnimationDuration"
                  show-separator
                />
              </span>
            </div>
          </n-card>

          <!-- Luck Rating -->
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('stats.overview.luck_rating') }}
            </div>
            <div
              class="mt-1 flex items-center justify-center gap-2 text-lg font-medium"
            >
              <span class="text-sm">{{ $t('banner.luck.' + luckTier) }}</span>
              <DiceAnimation
                v-if="globalStats.avg5StarPulls > 0"
                :percentile="overallLuckPercentile"
              />
            </div>
          </n-card>

          <div
            class="flex h-full flex-col items-end justify-between gap-2 py-1"
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
                class="after:animate-button-shimmer relative overflow-hidden after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:content-[''] motion-reduce:after:animate-none"
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
        :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
        content-class="p-2 sm:p-4"
      >
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'timeline'"
          :maximized="maximizedChart === 'timeline'"
          :title="t('stats.charts.pull_timeline')"
          @toggle="toggleMaximize('timeline')"
        >
          <StatsChart
            :option="pullActivityChartOption"
            :compact-tooltip="isMobile"
          />
        </StatsChartPanel>
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
        :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
        content-class="p-2 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <!-- 5★ Distribution -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          :maximized="maximizedChart === 'fiveStar'"
          :title="t('stats.charts.five_star_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fiveStar' }"
          @toggle="toggleMaximize('fiveStar')"
        >
          <StatsChart :option="fiveStarDistChartOption" />
        </StatsChartPanel>

        <!-- 4★ Distribution (5★ Banner) -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fourStar'"
          :maximized="maximizedChart === 'fourStar'"
          :title="t('global.charts.four_star_type2_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fourStar' }"
          @toggle="toggleMaximize('fourStar')"
        >
          <StatsChart :option="fourStarDistChartOption" />
        </StatsChartPanel>

        <!-- 4★ Distribution (4★ Banner) -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          :maximized="maximizedChart === 'fourStarType3'"
          :title="t('global.charts.four_star_type3_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fourStarType3' }"
          @toggle="toggleMaximize('fourStarType3')"
        >
          <StatsChart :option="fourStarType3DistChartOption" />
        </StatsChartPanel>
      </n-card>

      <div
        v-show="
          !maximizedChart ||
          maximizedChart === 'luckPerBanner' ||
          maximizedChart === 'luckPerBannerType3'
        "
      >
        <div class="grid grid-cols-1 gap-2 sm:gap-4 xl:grid-cols-2">
          <!-- ── Section C: 5★ Luck Per Banner Chart ── -->
          <n-card
            v-show="!maximizedChart || maximizedChart === 'luckPerBanner'"
            size="small"
            class="rounded-xl"
            :class="{ 'mt-0 mb-0 xl:col-span-2': Boolean(maximizedChart) }"
            content-class="p-2 sm:p-4"
          >
            <StatsChartPanel
              v-show="!maximizedChart || maximizedChart === 'luckPerBanner'"
              :maximized="maximizedChart === 'luckPerBanner'"
              :title="t('stats.charts.luck_per_banner')"
              height-class="h-[var(--luck-chart-height)] sm:h-80"
              :style="{ '--luck-chart-height': luckPerBannerChartHeight }"
              @toggle="toggleMaximize('luckPerBanner')"
            >
              <StatsChart
                :option="luckPerBannerChartOption"
                :compact-tooltip="isMobile"
              />
            </StatsChartPanel>
          </n-card>

          <!-- ── Section D: 4★ Luck Per Banner Chart ── -->
          <n-card
            v-show="!maximizedChart || maximizedChart === 'luckPerBannerType3'"
            size="small"
            class="rounded-xl"
            :class="{ 'mt-0 mb-0 xl:col-span-2': Boolean(maximizedChart) }"
            content-class="p-2 sm:p-4"
          >
            <StatsChartPanel
              v-show="
                !maximizedChart || maximizedChart === 'luckPerBannerType3'
              "
              :maximized="maximizedChart === 'luckPerBannerType3'"
              :title="t('stats.charts.luck_per_banner_type3')"
              height-class="h-[var(--luck-chart-height)] sm:h-80"
              :style="{ '--luck-chart-height': luckPerBannerType3ChartHeight }"
              @toggle="toggleMaximize('luckPerBannerType3')"
            >
              <StatsChart
                :option="luckPerBannerType3ChartOption"
                :compact-tooltip="isMobile"
              />
            </StatsChartPanel>
          </n-card>
        </div>
      </div>

      <!-- ── Section G: Social Share Card ── -->
      <n-card
        v-show="!maximizedChart"
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold text-gray-500 dark:text-gray-400">
            {{ $t('common.share_card') }}
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
                      ? $t('common.orientation.landscape')
                      : $t('common.orientation.portrait')
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
                  ? $t('common.orientation.landscape')
                  : $t('common.orientation.portrait')
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
              {{ $t('common.export_as_image') }}
            </n-tooltip>
          </div>
        </div>

        <!-- Share Card Container -->
        <div class="flex justify-center">
          <div
            ref="shareCardRef"
            class="@container w-full max-w-3xl overflow-hidden rounded-2xl bg-[#fffafb] text-slate-900 ring-1 ring-[#ddd2e8] ring-inset dark:bg-[#1e2035] dark:text-slate-100 dark:ring-[#3a3858]"
            :class="isShareLandscape ? 'aspect-video' : 'aspect-9/16 max-w-sm'"
          >
            <!-- Landscape Layout -->
            <div
              v-if="isShareLandscape"
              class="flex h-full w-full gap-3 overflow-hidden p-4"
            >
              <div class="flex w-1/3 min-w-0 flex-col">
                <SharePosterHeader>{{
                  $t('navigation.stats')
                }}</SharePosterHeader>
                <div
                  class="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center"
                >
                  <NuxtImg
                    :src="shareCardEmoteSrc"
                    alt=""
                    class="size-[clamp(4rem,15cqw,8rem)] object-contain"
                    preset="iconLg"
                    fit="contain"
                    loading="lazy"
                    sizes="120px"
                  />
                  <div
                    class="text-xl leading-tight font-bold"
                    :class="shareCardAccentClass"
                  >
                    {{ $t('banner.luck.' + luckTier) }}
                  </div>
                  <div
                    class="text-sm leading-tight text-slate-600 dark:text-slate-300"
                  >
                    {{
                      $t('tracker.stats.luckier', {
                        percent: overallLuckPercentile.toFixed(1),
                      })
                    }}
                  </div>
                </div>
              </div>

              <!-- Right Panel: Best/Worst Luck + Stats -->
              <div class="flex min-w-0 flex-1 flex-col gap-2.5">
                <div
                  v-if="luckiestBanner || unluckiestBanner"
                  class="flex min-h-0 flex-1 gap-2"
                >
                  <div
                    v-if="luckiestBanner"
                    class="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-white ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
                  >
                    <NuxtImg
                      :src="getImageSrc('banner', luckiestBanner.bannerId)"
                      :alt="luckiestBannerName"
                      class="absolute inset-0 h-full w-full object-cover"
                      preset="bannerThumb"
                      fit="cover"
                      loading="lazy"
                      sizes="200px"
                    />
                    <div
                      class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20"
                    />
                    <div
                      class="relative z-10 flex h-full flex-col justify-end p-3"
                    >
                      <div
                        class="text-xs font-semibold tracking-wider text-green-400 uppercase"
                      >
                        {{ $t('stats.share.best_luck') }}
                      </div>
                      <div class="mt-0.5 truncate text-sm font-bold text-white">
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
                    class="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-white ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
                  >
                    <NuxtImg
                      :src="getImageSrc('banner', unluckiestBanner.bannerId)"
                      :alt="unluckiestBannerName"
                      class="absolute inset-0 h-full w-full object-cover"
                      preset="bannerThumb"
                      fit="cover"
                      loading="lazy"
                      sizes="200px"
                    />
                    <div
                      class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20"
                    />
                    <div
                      class="relative z-10 flex h-full flex-col justify-end p-3"
                    >
                      <div
                        class="text-xs font-semibold tracking-wider text-red-400 uppercase"
                      >
                        {{ $t('stats.share.worst_luck') }}
                      </div>
                      <div class="mt-0.5 truncate text-sm font-bold text-white">
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
                  class="grid flex-1 grid-cols-2 gap-x-3 rounded-xl bg-white p-2.5 ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
                >
                  <!-- Left Column: Split Stats -->
                  <div class="grid content-evenly gap-2">
                    <div>
                      <div class="text-xs text-slate-600 dark:text-slate-300">
                        <span :style="fiveStarPosterText">5★</span>
                        /
                        <span :style="fourStarPosterText">4★</span>
                        {{ $t('common.pulls') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span :style="fiveStarPosterText">{{
                          pulls5StarBanners
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span :style="fourStarPosterText">{{
                          pulls4StarBanners
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-slate-600 dark:text-slate-300">
                        <span :style="fiveStarPosterText">5★</span>
                        /
                        <span :style="fourStarPosterText">4★</span>
                        {{ $t('common.banners') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span :style="fiveStarPosterText">{{
                          bannersPulled5Star
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span :style="fourStarPosterText">{{
                          bannersPulled4Star
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-slate-600 dark:text-slate-300">
                        <span :style="fiveStarPosterText">5★</span>
                        /
                        <span :style="fourStarPosterText">4★</span>
                        {{ $t('common.outfits') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span :style="fiveStarPosterText">{{
                          outfitsObtained5Star
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span :style="fourStarPosterText">{{
                          outfitsObtained4Star
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs text-slate-600 dark:text-slate-300">
                        <span :style="fiveStarPosterText">5★</span>
                        /
                        <span :style="fourStarPosterText">4★</span>
                        {{ $t('common.items') }}
                      </div>
                      <div class="text-sm font-bold tabular-nums">
                        <span :style="fiveStarPosterText">{{
                          globalStats.total5StarItems
                        }}</span>
                        <span class="mx-0.5 text-gray-400">/</span>
                        <span :style="fourStarPosterText">
                          {{
                            globalStats.total4StarItems +
                            globalStats.total4StarOnlyItems
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Right Column: Avg Stats -->
                  <div class="grid content-evenly gap-2">
                    <div>
                      <div
                        class="text-xs text-slate-600 capitalize dark:text-slate-300"
                      >
                        {{ $t('tracker.banner.stats.avg_5star') }}
                      </div>
                      <div
                        class="text-sm font-bold tabular-nums"
                        :style="fiveStarPosterText"
                      >
                        {{ globalStats.avg5StarPulls.toFixed(1) }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs text-slate-600 capitalize dark:text-slate-300"
                      >
                        {{ $t('common.stats.avg_4star_mixed') }}
                      </div>
                      <div
                        class="text-sm font-bold tabular-nums"
                        :style="fourStarPosterText"
                      >
                        {{ globalStats.avg4StarPulls.toFixed(1) }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs text-slate-600 capitalize dark:text-slate-300"
                      >
                        {{ $t('common.stats.avg_4star_only') }}
                      </div>
                      <div
                        class="text-sm font-bold tabular-nums"
                        :style="fourStarPosterText"
                      >
                        {{ globalStats.avg4StarOnlyPulls.toFixed(1) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Portrait Layout -->
            <div
              v-else
              class="flex h-full w-full flex-col gap-[clamp(0.5rem,3cqw,0.75rem)] overflow-hidden p-[4cqw]"
            >
              <SharePosterHeader>{{
                $t('navigation.stats')
              }}</SharePosterHeader>

              <!-- Hero: Emote + Luck Tier -->
              <div
                class="flex shrink-0 flex-col items-center justify-center gap-1 py-1.5 text-center @max-[340px]:flex-row @max-[340px]:gap-2 @max-[340px]:text-left"
              >
                <NuxtImg
                  :src="shareCardEmoteSrc"
                  alt=""
                  class="size-[clamp(3.5rem,20cqw,5rem)] shrink-0 object-contain"
                  preset="iconLg"
                  fit="contain"
                  loading="lazy"
                  sizes="120px"
                />
                <div class="min-w-0 space-y-1">
                  <div
                    class="text-xl leading-tight font-bold @max-[340px]:text-base"
                    :class="shareCardAccentClass"
                  >
                    {{ $t('banner.luck.' + luckTier) }}
                  </div>
                  <div
                    class="text-xs leading-tight text-slate-600 dark:text-slate-300"
                  >
                    {{
                      $t('tracker.stats.luckier', {
                        percent: overallLuckPercentile.toFixed(1),
                      })
                    }}
                  </div>
                </div>
              </div>

              <!-- Featured Banners -->
              <div
                v-if="luckiestBanner || unluckiestBanner"
                class="grid grow auto-rows-fr grid-cols-1 gap-2"
              >
                <div
                  v-if="luckiestBanner"
                  class="relative min-h-[clamp(3.5rem,22cqw,5.5rem)] overflow-hidden rounded-xl bg-white ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
                >
                  <NuxtImg
                    :src="getImageSrc('banner', luckiestBanner.bannerId)"
                    :alt="luckiestBannerName"
                    class="absolute inset-0 h-full w-full object-cover"
                    preset="bannerThumb"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div
                    class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10"
                  />
                  <div
                    class="relative z-10 flex h-full flex-col justify-end p-2"
                  >
                    <div
                      class="text-xs font-semibold tracking-wider text-green-400 uppercase"
                    >
                      {{ $t('stats.share.best_luck') }}
                    </div>
                    <div
                      class="line-clamp-2 text-xs leading-tight font-bold text-white"
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
                  class="relative min-h-[clamp(3.5rem,22cqw,5.5rem)] overflow-hidden rounded-xl bg-white ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
                >
                  <NuxtImg
                    :src="getImageSrc('banner', unluckiestBanner.bannerId)"
                    :alt="unluckiestBannerName"
                    class="absolute inset-0 h-full w-full object-cover"
                    preset="bannerThumb"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div
                    class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10"
                  />
                  <div
                    class="relative z-10 flex h-full flex-col justify-end p-2"
                  >
                    <div
                      class="text-xs font-semibold tracking-wider text-red-400 uppercase"
                    >
                      {{ $t('stats.share.worst_luck') }}
                    </div>
                    <div
                      class="line-clamp-2 text-xs leading-tight font-bold text-white"
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
                class="flex grow flex-col justify-evenly gap-[clamp(0.25rem,1.5cqw,0.375rem)] rounded-xl bg-white p-2.5 text-sm leading-tight ring-1 ring-[#ddd2e8] dark:bg-white/5 dark:ring-[#3a3858]"
              >
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span :style="fiveStarPosterText">5★</span> /
                    <span :style="fourStarPosterText">4★</span>
                    {{ $t('common.pulls') }}
                  </span>
                  <span
                    class="shrink-0 font-bold whitespace-nowrap tabular-nums"
                  >
                    <span :style="fiveStarPosterText">{{
                      pulls5StarBanners
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span :style="fourStarPosterText">{{
                      pulls4StarBanners
                    }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span :style="fiveStarPosterText">5★</span> /
                    <span :style="fourStarPosterText">4★</span>
                    {{ $t('common.banners') }}
                  </span>
                  <span
                    class="shrink-0 font-bold whitespace-nowrap tabular-nums"
                  >
                    <span :style="fiveStarPosterText">{{
                      bannersPulled5Star
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span :style="fourStarPosterText">{{
                      bannersPulled4Star
                    }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span :style="fiveStarPosterText">5★</span> /
                    <span :style="fourStarPosterText">4★</span>
                    {{ $t('common.outfits') }}
                  </span>
                  <span
                    class="shrink-0 font-bold whitespace-nowrap tabular-nums"
                  >
                    <span :style="fiveStarPosterText">{{
                      outfitsObtained5Star
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span :style="fourStarPosterText">{{
                      outfitsObtained4Star
                    }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span :style="fiveStarPosterText">5★</span> /
                    <span :style="fourStarPosterText">4★</span>
                    {{ $t('common.items') }}
                  </span>
                  <span
                    class="shrink-0 font-bold whitespace-nowrap tabular-nums"
                  >
                    <span :style="fiveStarPosterText">{{
                      globalStats.total5StarItems
                    }}</span>
                    <span class="mx-0.5 text-gray-400">/</span>
                    <span :style="fourStarPosterText">{{
                      globalStats.total4StarItems +
                      globalStats.total4StarOnlyItems
                    }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 capitalize dark:text-slate-300"
                  >
                    {{ $t('tracker.banner.stats.avg_5star') }}
                  </span>
                  <span
                    class="shrink-0 font-bold tabular-nums"
                    :style="fiveStarPosterText"
                  >
                    {{ globalStats.avg5StarPulls.toFixed(1) }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 capitalize dark:text-slate-300"
                  >
                    {{ $t('common.stats.avg_4star_mixed') }}
                  </span>
                  <span
                    class="shrink-0 font-bold tabular-nums"
                    :style="fourStarPosterText"
                  >
                    {{ globalStats.avg4StarPulls.toFixed(1) }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span
                    class="min-w-0 text-xs text-slate-600 capitalize dark:text-slate-300"
                  >
                    {{ $t('common.stats.avg_4star_only') }}
                  </span>
                  <span
                    class="shrink-0 font-bold tabular-nums"
                    :style="fourStarPosterText"
                  >
                    {{ globalStats.avg4StarOnlyPulls.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind, usePreferredReducedMotion } from '@vueuse/core'
  import { FileImageRegular, Sync, ExclamationCircle } from '@vicons/fa'
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
  const reducedMotion = usePreferredReducedMotion()
  const numberAnimationDuration = computed(() =>
    reducedMotion.value === 'reduce' ? 0 : 2000
  )

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

  const getPosterRarityText = (quality: number) => {
    const color = getQualityColor(quality)
    return {
      color: isDark.value ? color : `color-mix(in srgb, ${color} 60%, #0f172a)`,
    }
  }
  const fiveStarPosterText = computed(() => getPosterRarityText(5))
  const fourStarPosterText = computed(() => getPosterRarityText(4))

  const shareCardAccentClass = computed(() => {
    const tier = luckTier.value
    if (tier >= 5) return 'text-amber-700 dark:text-amber-300'
    if (tier >= 3) return 'text-violet-700 dark:text-violet-300'
    if (tier === 2) return 'text-sky-700 dark:text-sky-300'
    return 'text-red-700 dark:text-red-300'
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
      locale,
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

  const pageRef = ref<HTMLElement | null>(null)
  const { maximizedChart, toggleMaximize } = useStatsChartMaximize(pageRef)

  // Chart options
  const pullActivityChartOption = ref({})
  const luckPerBannerChartOption = ref({})
  const luckPerBannerType3ChartOption = ref({})
  const luckPerBannerChartHeight = computed(() =>
    getMobileBannerChartHeight(bannerLuckRanking.value.length)
  )
  const luckPerBannerType3ChartHeight = computed(() =>
    getMobileBannerChartHeight(bannerLuckRankingType3.value.length)
  )
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

      grid: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'category',
        data: mockBannerLabels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: {
          ...textStyle,
          fontSize: 12,
          width: isMobile.value ? 52 : 160,
          height: isMobile.value ? 32 : undefined,
          lineHeight: 16,
          overflow: 'truncate',
          ellipsis: '…',
          hideOverlap: true,
          rotate: isMobile.value ? 0 : 30,
          formatter: isMobile.value
            ? createBannerChartLabelFormatter(52, textStyle.fontFamily)
            : undefined,
        },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
        },
        {
          type: 'value',
          position: 'right',
          splitLine: { show: false },
          axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
          axisLine: { show: false },
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
            ? `<img src="${imageUrl}" alt="${name}" style="width: ${isMobile.value ? 120 : 200}px; height: ${isMobile.value ? 60 : 100}px; object-fit: cover; border-radius: 4px; margin-top: 8px;" />`
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
        top: 8,
        bottom: isMobile.value ? 8 : 24,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'value',
        show: !isMobile.value,
        splitLine: { show: false },
        axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: {
          ...textStyle,
          fontSize: 12,
          width: isMobile.value ? 100 : 130,
          height: isMobile.value ? 32 : undefined,
          lineHeight: 16,
          overflow: 'truncate',
          ellipsis: '…',
          interval: isMobile.value ? 0 : 'auto',
          formatter: isMobile.value
            ? createBannerChartLabelFormatter(100, textStyle.fontFamily)
            : undefined,
        },
      },
      series: [
        {
          type: 'bar',
          data: createLuckBarData(
            sorted.map((entry) => entry.avg5StarPulls),
            get5StarBannerLuckBarColor
          ),
          barMaxWidth: isMobile.value ? 24 : undefined,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              type: 'dashed',
            },
            label: {
              formatter: t('stats.luck.avg_pulls', { count: avg.toFixed(1) }),
              ...textStyle,
              fontSize: 12,
              position: 'insideEndTop',
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
            ? `<img src="${imageUrl}" alt="${name}" style="width: ${isMobile.value ? 120 : 200}px; height: ${isMobile.value ? 60 : 100}px; object-fit: cover; border-radius: 4px; margin-top: 8px;" />`
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
        top: 8,
        bottom: isMobile.value ? 8 : 24,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'value',
        show: !isMobile.value,
        splitLine: { show: false },
        axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: {
          ...textStyle,
          fontSize: 12,
          width: isMobile.value ? 100 : 130,
          height: isMobile.value ? 32 : undefined,
          lineHeight: 16,
          overflow: 'truncate',
          ellipsis: '…',
          interval: isMobile.value ? 0 : 'auto',
          formatter: isMobile.value
            ? createBannerChartLabelFormatter(100, textStyle.fontFamily)
            : undefined,
        },
      },
      series: [
        {
          type: 'bar',
          data: createLuckBarData(
            sorted.map((entry) => entry.avg4StarPulls),
            get4StarBannerLuckBarColor
          ),
          barMaxWidth: isMobile.value ? 24 : undefined,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              type: 'dashed',
            },
            label: {
              formatter: t('stats.luck.avg_pulls', { count: avg.toFixed(1) }),
              ...textStyle,
              fontSize: 12,
              position: 'insideEndTop',
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
      grid: {
        top: 8,
        bottom: 24,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
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
            ? `<img src="${imageUrl}" alt="${pulls.axisValue}" style="width: ${isMobile.value ? 120 : 200}px; height: ${isMobile.value ? 60 : 100}px; object-fit: cover; border-radius: 4px; margin-top: 8px;" />`
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
      grid: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'category',
        data: bannerLabels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: {
          ...textStyle,
          fontSize: 12,
          width: isMobile.value ? 52 : 160,
          height: isMobile.value ? 32 : undefined,
          lineHeight: 16,
          overflow: 'truncate',
          ellipsis: '…',
          hideOverlap: true,
          margin: 12,
          rotate: isMobile.value ? 0 : 30,
          formatter: isMobile.value
            ? createBannerChartLabelFormatter(52, textStyle.fontFamily)
            : undefined,
        },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
        },
        {
          type: 'value',
          position: 'right',
          splitLine: { show: false },
          axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
          axisLine: { show: false },
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
