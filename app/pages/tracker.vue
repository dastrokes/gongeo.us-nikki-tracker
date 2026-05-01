<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <!-- Stats Header Skeleton -->
      <n-card
        content-class="px-2 sm:px-4"
        size="small"
        class="rounded-xl"
      >
        <div class="grid grow grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
          <div class="flex items-center justify-end gap-2">
            <n-skeleton
              circle
              width="18px"
              height="18px"
            />
            <n-skeleton
              circle
              width="18px"
              height="18px"
            />
            <n-skeleton
              circle
              width="18px"
              height="18px"
            />
          </div>
        </div>
      </n-card>

      <!-- Banner Cards Skeleton -->
      <div class="space-y-2 sm:space-y-4">
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
          class="rounded-xl"
          content-class="px-2 sm:px-4"
        >
          <div class="space-y-2">
            <!-- Banner Header Skeleton -->
            <div class="flex items-center justify-between">
              <div
                class="flex flex-col items-start gap-2 sm:flex-row sm:items-center"
              >
                <n-skeleton
                  text
                  width="180px"
                  height="20px"
                />
                <div class="flex flex-wrap gap-2">
                  <n-skeleton
                    round
                    width="120px"
                    height="20px"
                  />
                  <n-skeleton
                    round
                    width="120px"
                    height="20px"
                  />
                </div>
              </div>
              <div class="flex shrink-0 gap-2">
                <n-skeleton
                  circle
                  width="18px"
                  height="18px"
                />
                <n-skeleton
                  circle
                  width="18px"
                  height="18px"
                />
                <n-skeleton
                  circle
                  width="18px"
                  height="18px"
                />
              </div>
            </div>
            <!-- Items Grid Skeleton -->
            <div class="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
              <n-skeleton
                :repeat="10"
                class="aspect-square h-full w-full rounded-lg"
              />
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <div
      v-else
      class="png-export-container"
    >
      <div
        v-if="!hasAnyData"
        class="space-y-2 sm:space-y-4"
      >
        <!-- No Data Message -->
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
                sizes="160px sm:200px"
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

        <!-- Sample Banners -->
        <div class="space-y-2 sm:space-y-4">
          <template
            v-for="banner in sampleBanners"
            :key="banner.bannerId"
          >
            <n-card
              content-class="px-2 sm:px-4"
              size="small"
              class="relative min-h-30 rounded-xl opacity-40 sm:min-h-40"
            >
              <div
                class="absolute top-2 right-2 z-10 flex min-h-8 items-center gap-2 sm:right-4"
              >
                <DiceAnimation
                  :percentile="
                    banner.bannerType === 3
                      ? getBannerAvg4StarType3Percentile(
                          banner.stats.avg4StarOnlyPulls
                        )
                      : getBannerAvg5StarPercentile(banner.stats.avg5StarPulls)
                  "
                />
              </div>

              <!-- Banner Header -->
              <div
                class="flex w-full flex-col gap-2 pr-16 sm:flex-row sm:items-center sm:pr-20 lg:pr-56"
              >
                <NuxtLinkLocale
                  no-prefetch
                  :to="`/banners/${banner.bannerId}`"
                  class="inline-flex min-h-8 items-center transition-opacity hover:opacity-95"
                >
                  <n-gradient-text
                    :size="18"
                    class="m-0 font-medium wrap-break-word"
                    :type="banner.bannerType === 2 ? 'warning' : 'info'"
                  >
                    {{ $t(`banner.${banner.bannerId}.name`) }}
                  </n-gradient-text>
                </NuxtLinkLocale>

                <div
                  class="flex w-full flex-wrap gap-2 sm:w-[calc(100%-200px)]"
                >
                  <template
                    v-for="outfit in banner.outfits"
                    :key="outfit.id"
                  >
                    <div class="flex items-center gap-2">
                      <NuxtLinkLocale
                        no-prefetch
                        :to="`/outfits/${outfit.id}`"
                        class="inline w-fit cursor-pointer transition-opacity hover:opacity-80"
                      >
                        <n-tag
                          :color="getQualityTextTheme(outfit.quality)"
                          :bordered="false"
                          round
                          size="small"
                          class="cursor-pointer gap-1 px-2"
                        >
                          <span class="flex items-center gap-1">
                            {{ $t(`outfit.${outfit.id}.name`) }}
                            {{ outfit.quality }}
                            <n-icon> <Star /> </n-icon
                            ><n-icon v-if="outfit.completion >= 1"
                              ><CheckCircle
                            /></n-icon>
                          </span>
                        </n-tag>
                      </NuxtLinkLocale>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Sample Stats -->
              <div
                class="text-md mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 pr-16 text-gray-400 sm:pr-20 lg:absolute lg:top-2 lg:right-14 lg:mt-0 lg:flex-nowrap lg:pr-0"
              >
                <div class="whitespace-nowrap">
                  <span>{{ t('common.stats.total_pulls') }}:</span>
                  <span
                    class="ml-1 text-lg font-medium text-gray-600 dark:text-gray-200"
                    >{{ banner.stats.totalPulls }}</span
                  >
                </div>
                <div
                  v-if="banner.bannerType === 1 || banner.bannerType === 2"
                  class="whitespace-nowrap"
                >
                  <span>{{ t('tracker.banner.stats.avg_5star') }}:</span>
                  <span class="ml-1 text-lg font-medium text-amber-500">{{
                    banner.stats.avg5StarPulls.toFixed(2)
                  }}</span>
                </div>
                <div
                  v-if="banner.bannerType === 3"
                  class="whitespace-nowrap"
                >
                  <span>{{ t('tracker.banner.stats.avg_4star') }}:</span>
                  <span class="ml-1 text-lg font-medium text-blue-500">{{
                    banner.stats.avg4StarOnlyPulls.toFixed(2)
                  }}</span>
                </div>
              </div>

              <!-- Sample Items Grid -->
              <div
                class="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10"
              >
                <ItemDataCard
                  v-for="item in banner.pulls"
                  :key="`${item.itemId}-${item.count}`"
                  :item="item"
                />
              </div>
            </n-card>
          </template>
        </div>
      </div>

      <div
        v-if="hasAnyData"
        class="space-y-2 sm:space-y-4"
      >
        <!-- Stats Header -->
        <n-card
          content-class="px-2 sm:px-4"
          size="small"
          class="rounded-xl"
        >
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <n-card
              size="small"
              class="rounded-lg text-center"
            >
              <div class="text-sm text-gray-400">
                {{ t('common.stats.total_pulls') }}
              </div>
              <div
                class="mt-1 flex items-center justify-center gap-2 text-lg font-medium tabular-nums"
              >
                <n-number-animation
                  :from="0"
                  :to="globalStats.totalPulls"
                  :duration="5000"
                />
                <n-tooltip
                  :width="200"
                  trigger="click"
                >
                  <template #trigger>
                    <n-button
                      v-show="!exporting"
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                    >
                      <n-icon
                        size="20"
                        depth="3"
                      >
                        <Users />
                      </n-icon>
                    </n-button>
                  </template>
                  {{
                    t('tracker.stats.more_pulls', {
                      percent: getTotalPullsPercentile(
                        globalStats.totalPulls
                      ).toFixed(1),
                    })
                  }}
                </n-tooltip>
              </div>
            </n-card>

            <n-card
              size="small"
              class="rounded-lg text-center"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.total_5star_4star') }}
              </div>
              <div class="mt-1 text-lg font-medium tabular-nums">
                <n-number-animation
                  :from="0"
                  :to="globalStats.total5StarItems"
                  :duration="3000"
                />
                /
                <n-number-animation
                  :from="0"
                  :to="
                    globalStats.total4StarItems +
                    globalStats.total4StarOnlyItems
                  "
                  :duration="3000"
                />
              </div>
            </n-card>

            <n-card
              size="small"
              class="rounded-lg text-center"
            >
              <div class="text-sm text-gray-400">
                {{ t('common.stats.avg_5star') }}
              </div>
              <div
                class="mt-1 flex items-center justify-center gap-2 text-lg font-medium tabular-nums"
              >
                <span class="inline-block min-w-[4ch] text-right">
                  <n-number-animation
                    :from="0"
                    :to="globalStats.avg5StarPulls"
                    :duration="2000"
                    :precision="2"
                  />
                </span>
                <DiceAnimation
                  v-if="globalStats.avg5StarPulls > 0"
                  :percentile="getAvg5StarPercentile(globalStats.avg5StarPulls)"
                />
              </div>
            </n-card>

            <n-card
              size="small"
              class="rounded-lg text-center"
            >
              <div class="text-sm text-gray-400">
                {{ t('common.stats.avg_4star_mixed') }}
              </div>
              <div
                class="mt-1 flex items-center justify-center gap-2 text-lg font-medium tabular-nums"
              >
                <span class="inline-block min-w-[3ch] text-right">
                  <n-number-animation
                    :from="0"
                    :to="globalStats.avg4StarPulls"
                    :duration="2000"
                    :precision="2"
                  />
                </span>
                <DiceAnimation
                  v-if="globalStats.avg4StarPulls > 0"
                  :percentile="
                    getAvg4StarType2Percentile(globalStats.avg4StarPulls)
                  "
                />
              </div>
            </n-card>

            <n-card
              size="small"
              class="rounded-lg text-center"
            >
              <div class="text-sm text-gray-400">
                {{ t('common.stats.avg_4star_only') }}
              </div>
              <div
                class="mt-1 flex items-center justify-center gap-2 text-lg font-medium tabular-nums"
              >
                <span class="inline-block min-w-[3ch] text-right">
                  <n-number-animation
                    :from="0"
                    :to="globalStats.avg4StarOnlyPulls"
                    :duration="2000"
                    :precision="2"
                  />
                </span>
                <DiceAnimation
                  v-if="globalStats.avg4StarOnlyPulls > 0"
                  :percentile="
                    getAvg4StarType3Percentile(globalStats.avg4StarOnlyPulls)
                  "
                />
              </div>
            </n-card>

            <n-card
              v-if="exporting"
              size="small"
              class="rounded-lg text-center"
            >
              <p class="text-sm text-gray-400">
                {{ t('tracker.export.generated_from') }}
              </p>
              <p class="inline-flex items-center justify-center gap-2 text-xl">
                <NuxtImg
                  src="images/logo.webp"
                  preset="iconSm"
                  fit="cover"
                  loading="lazy"
                  :alt="t('navigation.title')"
                  class="h-6 w-6 rounded-md"
                />
                <span>{{ t('navigation.title') }}</span>
              </p>
            </n-card>

            <div
              v-if="!exporting"
              class="flex h-full flex-col items-end justify-between gap-2 py-1"
            >
              <div class="flex items-center gap-2">
                <!-- Export Button -->
                <n-popover
                  trigger="manual"
                  :show="showPopover"
                  @clickoutside="showPopover = false"
                >
                  <template #trigger>
                    <n-button
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                      @click="showPopover = !showPopover"
                    >
                      <template #icon>
                        <n-icon>
                          <Download />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  <div class="w-28 space-y-2 text-center">
                    <n-button
                      text
                      class="text-gray-400 hover:text-gray-600"
                      @click="exportPNG"
                    >
                      <template #icon>
                        <n-icon>
                          <FileImageRegular />
                        </n-icon>
                      </template>
                      {{ t('tracker.export.png') }}
                    </n-button>
                    <n-button
                      block
                      text
                      class="text-gray-400 hover:text-gray-600"
                      @click="exportJSON"
                    >
                      <template #icon>
                        <n-icon>
                          <FileExport />
                        </n-icon>
                      </template>
                      {{ t('tracker.export.json') }}
                    </n-button>
                  </div>
                </n-popover>

                <!-- Settings Button -->
                <n-popover trigger="click">
                  <template #trigger>
                    <n-button
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                    >
                      <template #icon>
                        <n-icon>
                          <Cog />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  <div class="min-w-50">
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.sortBanner">
                          <template #checked>{{
                            $t('common.sort.oldest_first')
                          }}</template>
                          <template #unchecked>{{
                            $t('common.sort.newest_first')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.banner_order') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.sortItems">
                          <template #checked>{{
                            $t('common.sort.oldest_first')
                          }}</template>
                          <template #unchecked>{{
                            $t('common.sort.newest_first')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.item_order') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.combineOutfits">
                          <template #checked>{{
                            $t('tracker.banner.settings.combined')
                          }}</template>
                          <template #unchecked>{{
                            $t('tracker.banner.settings.separated')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.outfit_display') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.show4StarItems">
                          <template #checked>{{ $t('common.show') }}</template>
                          <template #unchecked>{{
                            $t('common.hide')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.show_4star') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.showDuplicates">
                          <template #checked>{{ $t('common.show') }}</template>
                          <template #unchecked>{{
                            $t('common.hide')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.duplicate_items') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.showMissingPieces">
                          <template #checked>{{ $t('common.show') }}</template>
                          <template #unchecked>{{
                            $t('common.hide')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.show_missing') }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <n-switch v-model:value="settings.showEmptyBanners">
                          <template #checked>{{ $t('common.show') }}</template>
                          <template #unchecked>{{
                            $t('common.hide')
                          }}</template>
                        </n-switch>
                        <span class="ml-3 text-sm text-gray-400">
                          {{ t('tracker.banner.settings.empty_banners') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </n-popover>

                <n-button
                  size="small"
                  type="primary"
                  class="after:animate-button-shimmer relative overflow-hidden after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:content-[''] motion-reduce:after:animate-none"
                  @click="() => navigateTo(localePath('/stats'))"
                >
                  {{ $t('navigation.stats') }}
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

        <!-- Banner List -->
        <div class="space-y-2 sm:space-y-4">
          <template
            v-for="banner in sortedBanners"
            :key="banner.bannerId"
          >
            <n-card
              content-class="px-2 sm:px-4"
              size="small"
              class="relative min-h-30 rounded-xl sm:min-h-40"
            >
              <!-- Banner Header -->

              <div
                class="flex w-full flex-col gap-2 pr-28 sm:flex-row sm:items-center sm:pr-32 lg:pr-80"
              >
                <div class="flex items-center gap-2">
                  <NuxtLinkLocale
                    no-prefetch
                    :to="`/banners/${banner.bannerId}`"
                    class="inline-flex min-h-8 items-center transition-opacity hover:opacity-95"
                  >
                    <n-gradient-text
                      :size="18"
                      class="m-0 font-medium wrap-break-word"
                      :type="banner.bannerType === 2 ? 'warning' : 'info'"
                    >
                      {{ $t(`banner.${banner.bannerId}.name`) }}
                    </n-gradient-text>
                  </NuxtLinkLocale>
                </div>

                <div
                  class="flex w-full flex-wrap gap-2 sm:w-[calc(100%-200px)]"
                >
                  <template
                    v-for="outfit in banner.outfits"
                    :key="outfit.id"
                  >
                    <NuxtLinkLocale
                      no-prefetch
                      :to="`/outfits/${outfit.id}`"
                      class="inline-block"
                    >
                      <n-tag
                        :color="getQualityTextTheme(outfit.quality)"
                        :bordered="false"
                        round
                        size="small"
                        class="cursor-pointer gap-1 px-2 transition-opacity hover:opacity-80"
                      >
                        <span class="flex items-center gap-1">
                          {{ $t(`outfit.${outfit.id}.name`) }}
                          {{ outfit.quality }}
                          <n-icon> <Star /> </n-icon
                          ><n-icon v-if="outfit.completion >= 1"
                            ><CheckCircle
                          /></n-icon>
                        </span>
                      </n-tag>
                    </NuxtLinkLocale>
                  </template>
                </div>
              </div>

              <div
                class="text-md mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 pr-28 text-gray-400 sm:pr-32 lg:absolute lg:top-2 lg:right-28 lg:mt-0 lg:flex-nowrap lg:pr-0"
              >
                <div class="whitespace-nowrap">
                  <span>{{ t('common.stats.total_pulls') }}:</span>
                  <span
                    class="ml-1 text-lg font-medium text-gray-600 dark:text-gray-200"
                    >{{ banner.stats.totalPulls }}</span
                  >
                </div>
                <div
                  v-if="banner.bannerType === 1 || banner.bannerType === 2"
                  class="whitespace-nowrap"
                >
                  <span>{{ t('tracker.banner.stats.avg_5star') }}:</span>
                  <span class="ml-1 text-lg font-medium text-amber-500">{{
                    banner.stats.avg5StarPulls.toFixed(2)
                  }}</span>
                </div>
                <div
                  v-if="banner.bannerType === 3"
                  class="whitespace-nowrap"
                >
                  <span>{{ t('tracker.banner.stats.avg_4star') }}:</span>
                  <span class="ml-1 text-lg font-medium text-blue-500">{{
                    banner.stats.avg4StarOnlyPulls.toFixed(2)
                  }}</span>
                </div>
              </div>

              <div
                class="absolute top-2 right-2 z-10 flex min-h-8 items-center gap-2 sm:right-4"
              >
                <DiceAnimation
                  v-if="banner.stats.totalPulls > 0"
                  :percentile="
                    banner.bannerType === 3
                      ? getBannerAvg4StarType3Percentile(
                          banner.stats.avg4StarOnlyPulls
                        )
                      : getBannerAvg5StarPercentile(banner.stats.avg5StarPulls)
                  "
                />

                <!-- Stats Button -->
                <n-popover
                  v-if="banner.stats.totalPulls > 0"
                  trigger="manual"
                  :show="openStatsBannerId === banner.bannerId"
                  @clickoutside="openStatsBannerId = null"
                >
                  <template #trigger>
                    <n-button
                      v-show="!exporting"
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                      @click="toggleStatsPopover(banner.bannerId)"
                    >
                      <template #icon>
                        <n-icon>
                          <ChartBarRegular />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  <div class="min-w-40">
                    <div class="space-y-2 px-2 text-base">
                      <div class="flex justify-between">
                        <span class="text-sm">
                          {{ t('common.stats.total_pulls') }}
                        </span>
                        <span class="font-medium">{{
                          banner.stats.totalPulls
                        }}</span>
                      </div>
                      <div
                        v-if="
                          banner.bannerType === 1 || banner.bannerType === 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.total_5star') }}
                        </span>
                        <span class="font-medium text-amber-500">{{
                          banner.stats.total5StarItems
                        }}</span>
                      </div>
                      <div
                        v-if="
                          banner.bannerType === 1 || banner.bannerType === 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.avg_5star') }}
                        </span>
                        <span class="font-medium text-amber-500">{{
                          banner.stats.avg5StarPulls.toFixed(2)
                        }}</span>
                      </div>
                      <div
                        v-if="
                          (banner.bannerType === 1 ||
                            banner.bannerType === 2) &&
                          banner.stats.completion < 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.pity_5star') }}
                        </span>
                        <span class="font-medium">{{
                          banner.stats.pity5Star
                        }}</span>
                      </div>
                      <div
                        v-if="
                          banner.bannerType === 1 || banner.bannerType === 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.total_4star') }}
                        </span>
                        <span class="font-medium text-blue-500">{{
                          banner.stats.total4StarItems
                        }}</span>
                      </div>
                      <div
                        v-if="
                          banner.bannerType === 1 || banner.bannerType === 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.avg_4star') }}
                        </span>
                        <span class="font-medium text-blue-500">{{
                          banner.stats.avg4StarPulls.toFixed(2)
                        }}</span>
                      </div>
                      <div
                        v-if="banner.bannerType === 3"
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.total_4star') }}
                        </span>
                        <span class="font-medium text-blue-500">{{
                          banner.stats.total4StarOnlyItems
                        }}</span>
                      </div>
                      <div
                        v-if="banner.bannerType === 3"
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.avg_4star') }}
                        </span>
                        <span class="font-medium text-blue-500">{{
                          banner.stats.avg4StarOnlyPulls.toFixed(2)
                        }}</span>
                      </div>
                      <div
                        v-if="
                          banner.bannerType === 3 && banner.stats.completion < 2
                        "
                        class="flex justify-between"
                      >
                        <span class="text-sm">
                          {{ t('tracker.banner.stats.pity_4star') }}
                        </span>
                        <span class="font-medium">{{
                          banner.stats.pity4Star
                        }}</span>
                      </div>
                    </div>
                  </div>
                </n-popover>

                <n-button
                  v-if="!exporting"
                  text
                  size="small"
                  class="text-gray-500"
                  @click="
                    () => {
                      selectedBannerId = banner.bannerId
                      showCollectionEditor = true
                    }
                  "
                >
                  <template #icon>
                    <n-icon><Edit /></n-icon>
                  </template>
                </n-button>
              </div>

              <!-- Combined Outfits View -->
              <template v-if="settings.combineOutfits">
                <div
                  class="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10"
                >
                  <ItemDataCard
                    v-for="pull in banner.combinedPulls"
                    :key="`${pull.itemId}-${pull.count}`"
                    :item="pull"
                  />
                </div>
              </template>

              <!-- Separated Outfits View -->
              <template v-else>
                <div
                  v-for="outfitGroup in banner.separatedOutfitPulls"
                  :key="outfitGroup.outfitId"
                  class="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10"
                >
                  <ItemDataCard
                    v-for="pull in outfitGroup.pulls"
                    :key="`${pull.itemId}-${pull.count}`"
                    :item="pull"
                  />
                </div>
              </template>
            </n-card>
          </template>
        </div>
      </div>
    </div>

    <!-- Collection Editor Modal -->
    <n-modal
      v-model:show="showCollectionEditor"
      class="w-full max-w-5xl"
      transform-origin="center"
    >
      <template #default>
        <CollectionEditor
          :banner-id="selectedBannerId"
          @close="showCollectionEditor = false"
        />
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import {
    Cog,
    ChartBarRegular,
    CheckCircle,
    Star,
    FileImageRegular,
    FileExport,
    Users,
    Download,
    Edit,
    ExclamationCircle,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import OUTFIT_DATA from '~~/data/outfits'

  const message = useMessage()
  const { t } = useI18n()
  const pullStore = usePullStore()
  const { processedPulls, globalStats } = storeToRefs(pullStore)
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const { initFromIndexedDB } = usePullStoreData()
  const { loadData } = useIndexedDB()
  const { activeSlot, slots } = useProfileSlots()

  const loading = ref(true)
  const showPopover = ref(false)
  const exporting = ref(false)
  const showCollectionEditor = ref(false)
  const selectedBannerId = ref<number | null>(null)
  const openStatsBannerId = ref<number | null>(null)
  const localDataSource = useDataSource()
  const effectiveDataSource = computed({
    get: () => pullStore.dataSource ?? localDataSource.value,
    set: (value) => {
      localDataSource.value = value
      pullStore.dataSource = null
    },
  })

  // Check if there's any data to display
  const hasAnyData = computed(() => {
    return Object.keys(processedPulls.value).length > 0
  })

  // Get sample banners for display when no data is available
  const sampleBanners = computed(() => {
    const bannerIds = Object.keys(BANNER_DATA)
      .map(Number)
      .sort((a, b) => b - a)

    // Check if we have any banner IDs before proceeding
    if (bannerIds.length === 0) {
      return []
    }

    // Get all banners from the latest minor version
    const latestVersion = BANNER_DATA[bannerIds[0]!]!.runs?.[0]?.version || ''

    const latestVersionBanners = bannerIds.filter((bannerId) => {
      const bannerData = BANNER_DATA[bannerId]
      return bannerData?.runs?.[0]?.version === latestVersion
    })

    // Seeded random number generator for consistent results
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    return latestVersionBanners
      .map((bannerId) => {
        const bannerData = BANNER_DATA[bannerId]
        if (!bannerData) return null

        let currentPullIndex = 0
        const is4StarBanner = bannerData.bannerType === 3

        // Get all items from all outfits in this banner with realistic pull counts
        const allItems = bannerData.outfit5StarId
          .concat(bannerData.outfit4StarId)
          .flatMap((outfitId, outfitIndex) => {
            const outfitData = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
            if (!outfitData?.items) return []

            return outfitData.items.map((itemId, itemIndex) => {
              const quality = bannerData.outfit5StarId.includes(outfitId)
                ? 5
                : 4

              // Generate realistic pulls to obtain based on quality and banner type
              let pullsToObtain: number
              const seed = bannerId * 1000 + outfitIndex * 100 + itemIndex

              if (is4StarBanner) {
                // 4★ banner: 3-5 pulls per item
                pullsToObtain = Math.floor(seededRandom(seed) * 3) + 3
              } else {
                // 5★/mixed banner
                if (quality === 5) {
                  // 5★ items: 12-20 pulls
                  pullsToObtain = Math.floor(seededRandom(seed) * 9) + 12
                } else {
                  // 4★ items in mixed banner: 3-5 pulls
                  pullsToObtain = Math.floor(seededRandom(seed) * 3) + 3
                }
              }

              currentPullIndex += pullsToObtain

              return {
                itemId: itemId,
                outfitId: outfitId,
                quality: quality,
                count: 1,
                pullIndex: currentPullIndex,
                pullsToObtain: pullsToObtain,
                obtainedAt: '',
                bannerId: bannerData.bannerId,
              }
            })
          })

        // Calculate realistic stats based on the generated pull data
        const totalPulls = currentPullIndex
        const fiveStarItems = allItems.filter((item) => item.quality === 5)
        const fourStarItems = allItems.filter((item) => item.quality === 4)

        const total5StarItems = fiveStarItems.length
        const total4StarItems = is4StarBanner ? 0 : fourStarItems.length
        const total4StarOnlyItems = is4StarBanner ? fourStarItems.length : 0

        const avg5StarPulls =
          total5StarItems > 0
            ? fiveStarItems.reduce((sum, item) => sum + item.pullsToObtain, 0) /
              total5StarItems
            : 0

        const avg4StarPulls =
          total4StarItems > 0
            ? fourStarItems.reduce((sum, item) => sum + item.pullsToObtain, 0) /
              total4StarItems
            : 0

        const avg4StarOnlyPulls =
          total4StarOnlyItems > 0
            ? fourStarItems.reduce((sum, item) => sum + item.pullsToObtain, 0) /
              total4StarOnlyItems
            : 0

        return {
          bannerId: bannerData.bannerId,
          bannerType: bannerData.bannerType,
          outfits: bannerData.outfit5StarId
            .concat(bannerData.outfit4StarId)
            .map((outfitId) => ({
              id: outfitId,
              quality: bannerData.outfit5StarId.includes(outfitId) ? 5 : 4,
              completion: 1,
            })),
          pulls: allItems,
          stats: {
            totalPulls,
            total5StarItems,
            total4StarItems,
            total4StarOnlyItems,
            avg5StarPulls,
            avg4StarPulls,
            avg4StarOnlyPulls,
            pity5Star: 0,
            pity4Star: 0,
            completion: 1,
          },
        }
      })
      .filter((banner) => banner !== null)
  })

  useSeoMeta({
    title: () =>
      `${t('navigation.tracker')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.tracker'),
    ogTitle: () =>
      `${t('navigation.tracker')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.tracker'),
    twitterTitle: () =>
      `${t('navigation.tracker')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.tracker'),
  })

  // Function to load and process data based on current data source
  const loadAndProcessData = async () => {
    loading.value = true
    try {
      await initFromIndexedDB()
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(t('tracker.no_data.error'))
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    if (Object.keys(processedPulls.value).length > 0 && !pullStore.dataSource) {
      loading.value = false
      return
    }
    await loadAndProcessData()
  })

  const toggleStatsPopover = (bannerId: number) => {
    openStatsBannerId.value =
      openStatsBannerId.value === bannerId ? null : bannerId
  }

  // Watch for data source changes and reload data
  watch(effectiveDataSource, (nextSource, previousSource) => {
    if (nextSource === previousSource || loading.value) return
    void loadAndProcessData()
  })

  // Display settings using composable
  const { settings } = useTrackerSettings()

  // Filter pulls based on UI toggles
  const filterPulls = (pulls: PullItem[], banner: ProcessedBanner) => {
    let filteredPulls = pulls.filter((pull) => {
      // When show4StarItems is false, hide 4★ items only in type 2 banners
      if (
        pull.quality === 4 &&
        !settings.value.show4StarItems &&
        (banner.bannerType === 1 || banner.bannerType === 2)
      ) {
        return false
      }

      // Hide duplicate items when showDuplicates is false
      if (!settings.value.showDuplicates && pull.count > 1) {
        return false
      }

      // Show all items (both obtained and missing) when showMissingPieces is true
      // Only show obtained items when showMissingPieces is false
      return settings.value.showMissingPieces || pull.count > 0
    })

    // Sort items: missing items (count: 0) always last, then by pullIndex with stable sort
    filteredPulls = [...filteredPulls].sort((a, b) => {
      // Missing items always go to the end
      if (a.count === 0 && b.count > 0) return 1
      if (a.count > 0 && b.count === 0) return -1

      // Both are missing items, sort by itemId for stable order
      if (a.count === 0 && b.count === 0) {
        return a.itemId.localeCompare(b.itemId)
      }

      // Both are obtained items, sort by pullIndex according to user preference
      const indexDiff = settings.value.sortItems
        ? a.pullIndex - b.pullIndex // Oldest first
        : b.pullIndex - a.pullIndex // Latest first

      // If pullIndex is the same, use itemId for stable sort
      if (indexDiff === 0) {
        return a.itemId.localeCompare(b.itemId)
      }

      return indexDiff
    })

    return filteredPulls
  }

  type BannerOutfitPullGroup = {
    outfitId: string
    pulls: PullItem[]
  }

  type TrackerBannerViewModel = ProcessedBanner & {
    combinedPulls: PullItem[]
    separatedOutfitPulls: BannerOutfitPullGroup[]
  }

  // Sort banners and precompute filtered pull lists used by the template.
  const sortedBanners = computed<TrackerBannerViewModel[]>(() => {
    const baseBanners = Object.values(processedPulls.value)
    const visibleBanners = settings.value.showEmptyBanners
      ? baseBanners
      : baseBanners.filter((banner) =>
          banner.pulls.some((pull) => pull.count > 0)
        )

    const orderedBanners = [...visibleBanners].sort((a, b) =>
      settings.value.sortBanner
        ? a.bannerId - b.bannerId
        : b.bannerId - a.bannerId
    )

    return orderedBanners.map((banner) => {
      const pullsByOutfit = banner.pulls.reduce<Record<string, PullItem[]>>(
        (groups, pull) => {
          if (!groups[pull.outfitId]) {
            groups[pull.outfitId] = []
          }
          groups[pull.outfitId]!.push(pull)
          return groups
        },
        {}
      )

      const separatedOutfitPulls = banner.outfits
        .map((outfit) => ({
          outfitId: outfit.id,
          pulls: filterPulls(pullsByOutfit[outfit.id] ?? [], banner),
        }))
        .filter((entry) => entry.pulls.length > 0)

      return {
        ...banner,
        combinedPulls: filterPulls(banner.pulls, banner),
        separatedOutfitPulls,
      }
    })
  })

  // Import percentile functions from utils (pure functions)
  const {
    getAvg5StarPercentile,
    getAvg4StarType2Percentile,
    getAvg4StarType3Percentile,
    getBannerAvg5StarPercentile,
    getBannerAvg4StarType3Percentile,
    getTotalPullsPercentile,
  } = await import('~/utils/percentile')

  const exportPNG = async () => {
    if (exporting.value) return
    message.info(t('tracker.export.in_progress'))
    exporting.value = true
    showPopover.value = false

    try {
      await nextTick()
      const trackerElement = document.querySelector(
        '.png-export-container'
      ) as HTMLElement
      if (!trackerElement) {
        throw new Error('Tracker element not found')
      }

      const fileName = `gongeous-${new Date().toISOString().split('T')[0]}.png`
      await exportToPng(trackerElement, fileName)

      message.success(t('tracker.export.success'))
    } catch (error) {
      console.error('Export failed:', error)
      message.error(t('tracker.export.error'))
    } finally {
      exporting.value = false
    }
  }

  const exportJSON = async () => {
    if (exporting.value) return
    message.info(t('tracker.export.in_progress'))
    exporting.value = true
    showPopover.value = false

    try {
      const {
        pulls: rawPullData,
        edits: rawEditData,
        evo: evoData,
        pearpal: rawPearpalData,
      } = await loadData()

      // Filter out banners with 0 pulls
      const filteredPullData = Object.fromEntries(
        Object.entries(rawPullData).filter(([_, pulls]) => pulls.length > 0)
      )

      const filteredEditData = Object.fromEntries(
        Object.entries(rawEditData).filter(([_, edits]) => edits.length > 0)
      )

      const filteredEvoData = Object.fromEntries(
        Object.entries(evoData).filter(([_, evo]) => evo.length > 0)
      )

      const filteredPearpalData = Object.fromEntries(
        Object.entries(rawPearpalData).filter(([_, items]) => items.length > 0)
      )

      // Determine what to export based on which data is available
      let exportData
      if (
        Object.keys(filteredPullData).length === 0 &&
        Object.keys(filteredEditData).length === 0 &&
        Object.keys(filteredEvoData).length === 0 &&
        Object.keys(filteredPearpalData).length === 0
      ) {
        return
      } else {
        const slotIndex = activeSlot.value - 1
        const slotData = slots.value[slotIndex]
        const trimmedLabel = slotData?.label?.trim()
        const profile =
          slotData?.exists && trimmedLabel ? { label: trimmedLabel } : undefined

        exportData = {
          pulls: filteredPullData,
          edits: filteredEditData,
          evo: filteredEvoData,
          pearpal: filteredPearpalData,
          ...(profile ? { profile } : {}),
        }
      }

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })

      // Create a link element and trigger download
      const link = document.createElement('a')
      link.download = `nikki-resonance-data-${
        new Date().toISOString().split('T')[0]
      }-${activeSlot.value}.json`
      link.href = URL.createObjectURL(blob)
      link.click()

      // Clean up the URL object
      URL.revokeObjectURL(link.href)

      message.success(t('tracker.export.success'))
    } catch (error) {
      console.error('Export failed:', error)
      message.error(t('tracker.export.error'))
    } finally {
      exporting.value = false
    }
  }
</script>
