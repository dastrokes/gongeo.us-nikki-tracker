<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <!-- Stats Header Skeleton -->
      <n-card
        content-class="!p-2 sm:!p-4"
        size="small"
        class="rounded-xl"
        :style="cardStyle"
      >
        <div
          class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
        >
          <n-card
            v-for="i in 5"
            :key="i"
            size="small"
            class="text-center rounded-md"
            :style="cardStyle"
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
          <div class="flex justify-end space-x-2 items-center">
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
      <div class="space-y-4">
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
          class="rounded-xl mt-2 sm:mt-4"
          content-class="!p-2 sm:!p-4"
          :style="cardStyle"
        >
          <div class="space-y-2">
            <!-- Banner Header Skeleton -->
            <div class="flex items-center justify-between">
              <div
                class="flex flex-col sm:flex-row items-start sm:items-center gap-2"
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
              <div class="flex space-x-2 shrink-0">
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
            <div class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
              <n-skeleton
                :repeat="10"
                class="rounded-lg aspect-square w-full h-full"
              />
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <!-- Content (only show when not loading) -->
    <div
      v-else
      class="png-export-container"
    >
      <!-- Stats Header -->
      <n-card
        v-if="hasAnyData"
        content-class="!p-2 sm:!p-4"
        size="small"
        class="rounded-xl"
        :style="cardStyle"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
          >
            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.total_pulls') }}
              </div>
              <div
                class="text-lg font-medium mt-1 flex items-center justify-center gap-2"
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
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.total_5star_4star') }}
              </div>
              <div class="text-lg font-medium mt-1">
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
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_5star') }}
              </div>
              <div
                class="text-lg font-medium mt-1 flex items-center justify-center gap-2"
              >
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg5StarPulls"
                  :duration="2000"
                  :precision="2"
                />
                <DiceAnimation
                  v-if="globalStats.avg5StarPulls > 0"
                  :percentile="getAvg5StarPercentile(globalStats.avg5StarPulls)"
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_4star_mixed') }}
              </div>
              <div
                class="text-lg font-medium mt-1 flex items-center justify-center gap-2"
              >
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg4StarPulls"
                  :duration="2000"
                  :precision="2"
                />
                <DiceAnimation
                  v-if="globalStats.avg4StarPulls > 0"
                  :percentile="
                    getAvg4StarType2Percentile(globalStats.avg4StarPulls)
                  "
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_4star_only') }}
              </div>
              <div
                class="text-lg font-medium mt-1 flex items-center justify-center gap-2"
              >
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg4StarOnlyPulls"
                  :duration="2000"
                  :precision="2"
                />
                <DiceAnimation
                  v-if="globalStats.avg4StarOnlyPulls > 0"
                  :percentile="
                    getAvg4StarType3Percentile(globalStats.avg4StarOnlyPulls)
                  "
                />
              </div>
            </n-card>

            <n-card
              v-show="exporting"
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <p class="text-sm text-gray-400">
                {{ t('tracker.export.generated_from') }}
              </p>
              <p class="text-xl">{{ t('navigation.title') }}</p>
            </n-card>

            <div
              v-show="!exporting"
              class="flex justify-end space-x-2 items-center m-1 sm:-m-1"
            >
              <n-popover trigger="click">
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    circle
                    class="text-gray-500"
                  >
                    <template #icon>
                      <n-icon><Database /></n-icon>
                    </template>
                  </n-button>
                </template>
                <div class="min-w-[150px] p-0">
                  <div
                    class="text-sm text-gray-400 mb-2 text-center flex items-center justify-center"
                  >
                    {{ t('tracker.banner.settings.data_source') }}
                    <n-tooltip :width="200">
                      <template #trigger>
                        <n-button
                          size="tiny"
                          text
                          class="z-10 ml-2"
                        >
                          <template #icon>
                            <n-icon :depth="3">
                              <ExclamationCircle />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ t('tracker.banner.settings.data_source_tooltip') }}
                      <br />
                      {{ t('tracker.banner.settings.auto_option') }}
                    </n-tooltip>
                  </div>

                  <n-select
                    v-model:value="dataSource"
                    size="small"
                    :options="[
                      {
                        label: t('tracker.banner.settings.game'),
                        value: 'game',
                      },
                      {
                        label: t('tracker.banner.settings.pearpal'),
                        value: 'pearpal',
                      },
                      {
                        label: t('tracker.banner.settings.auto'),
                        value: 'auto',
                      },
                    ]"
                  />
                </div>
              </n-popover>

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
                <div class="space-y-2 w-28 text-center">
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
                <div class="min-w-[200px]">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.sortBanner">
                        <template #checked>{{
                          t('tracker.banner.settings.oldest_first')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.latest_first')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.banner_order') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.sortItems">
                        <template #checked>{{
                          t('tracker.banner.settings.oldest_first')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.latest_first')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.item_order') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.combineOutfits">
                        <template #checked>{{
                          t('tracker.banner.settings.combined')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.separated')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.outfit_display') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.show4StarItems">
                        <template #checked>{{
                          t('tracker.banner.settings.show')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.hide')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.show_4star') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.showDuplicates">
                        <template #checked>{{
                          t('tracker.banner.settings.show')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.hide')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.duplicate_items') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.showMissingPieces">
                        <template #checked>{{
                          t('tracker.banner.settings.show')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.hide')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.show_missing') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="settings.showEmptyBanners">
                        <template #checked>{{
                          t('tracker.banner.settings.show')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.hide')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.empty_banners') }}
                      </span>
                    </div>
                  </div>
                </div>
              </n-popover>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Banner List -->
      <div class="space-y-4">
        <div>
          <template
            v-for="banner in sortedBanners"
            :key="banner.bannerId"
          >
            <n-card
              content-class="!p-2 sm:!pt-2 sm:!p-4"
              size="small"
              class="rounded-xl min-h-[120px] sm:min-h-[160px] mt-2 sm:mt-4"
              :style="cardStyle"
            >
              <!-- Banner Header -->

              <div
                class="w-full flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <NuxtLink
                  :to="localePath(`/banner/${banner.bannerId}`)"
                  class="inline w-fit hover:opacity-95 transition-opacity"
                >
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-gradient-text
                        :size="18"
                        class="m-0 font-medium break-words"
                        :type="banner.bannerType === 2 ? 'warning' : 'info'"
                      >
                        {{ t(`banner.${banner.bannerId}.name`) }}
                      </n-gradient-text>
                    </template>
                    {{ t('navigation.banner_detail') }}
                  </n-tooltip>
                </NuxtLink>

                <div
                  class="flex flex-wrap gap-2 w-full sm:w-[calc(100%-500px)]"
                >
                  <template
                    v-for="outfit in banner.outfits"
                    :key="outfit.id"
                  >
                    <div class="flex items-center gap-2">
                      <n-tag
                        :type="outfit.rarity === 5 ? 'warning' : 'info'"
                        :bordered="false"
                        round
                        size="small"
                        class="px-2"
                      >
                        <span class="align-top"
                          >{{ t(`outfit.${outfit.id}.name`) }}
                          {{ outfit.rarity }}</span
                        >
                        <span class="ml-1"
                          ><n-icon><Star /></n-icon
                        ></span>
                        <span
                          v-if="outfit.completion >= 1"
                          class="ml-1"
                          ><n-icon><CheckCircle /></n-icon
                        ></span>
                      </n-tag>
                    </div>
                  </template>
                </div>
              </div>
              <div class="absolute right-2 top-2 flex flex-row space-x-2">
                <div
                  v-show="exporting"
                  class="flex justify-between gap-2 items-baseline text-md text-gray-400"
                >
                  <div>
                    <span>{{ t('tracker.banner.stats.total_pulls') }}:</span>
                    <span
                      class="ml-1 text-lg font-medium"
                      :class="isDark ? 'text-gray-200' : 'text-gray-600'"
                      >{{ banner.stats.totalPulls }}</span
                    >
                  </div>
                  <div
                    v-if="banner.bannerType === 1 || banner.bannerType === 2"
                  >
                    <span>{{ t('tracker.banner.stats.avg_5star') }}:</span>
                    <span class="text-amber-500 ml-1 text-lg font-medium">{{
                      banner.stats.avg5StarPulls.toFixed(2)
                    }}</span>
                  </div>
                  <div v-if="banner.bannerType === 3">
                    <span>{{ t('tracker.banner.stats.avg_4star') }}:</span>
                    <span class="text-blue-500 ml-1 text-lg font-medium">{{
                      banner.stats.avg4StarOnlyPulls.toFixed(2)
                    }}</span>
                  </div>
                </div>

                <div class="flex flex-row space-x-2 p-1">
                  <DiceAnimation
                    v-if="banner.stats.totalPulls > 0"
                    :percentile="
                      banner.bannerType === 3
                        ? getAvg4StarType3Percentile(
                            banner.stats.avg4StarOnlyPulls
                          )
                        : getAvg5StarPercentile(banner.stats.avg5StarPulls)
                    "
                  />

                  <!-- Stats Button -->
                  <n-popover
                    v-if="banner.stats.totalPulls > 0"
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
                        <template #icon>
                          <n-icon>
                            <ChartBarRegular />
                          </n-icon>
                        </template>
                      </n-button>
                    </template>
                    <div class="min-w-[150px]">
                      <div class="space-y-2 px-2 text-base">
                        <div class="flex justify-between">
                          <span class="text-sm">
                            {{ t('tracker.banner.stats.total_pulls') }}
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
                            banner.bannerType === 3 &&
                            banner.stats.completion < 2
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
                    v-show="!exporting"
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
              </div>

              <!-- Combined Outfits View -->
              <template v-if="settings.combineOutfits">
                <div
                  class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
                >
                  <ItemCard
                    v-for="pull in filterPulls(banner.pulls, banner)"
                    :key="`${pull.itemId}-${pull.count}`"
                    :item="pull"
                  />
                </div>
              </template>

              <!-- Separated Outfits View -->
              <template v-else>
                <div
                  v-for="outfit in banner.outfits"
                  v-show="
                    filterPulls(getOutfitItems(banner.pulls, outfit.id), banner)
                      .length > 0
                  "
                  :key="outfit.id"
                  class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
                >
                  <ItemCard
                    v-for="pull in filterPulls(
                      getOutfitItems(banner.pulls, outfit.id),
                      banner
                    )"
                    :key="`${pull.itemId}-${pull.count}`"
                    :item="pull"
                  />
                </div>
              </template>
            </n-card>
          </template>
        </div>
      </div>

      <!-- No Data State - Show Sample Banners -->
      <div
        v-if="!hasAnyData"
        class="space-y-4"
      >
        <!-- No Data Message -->
        <n-card
          class="text-center rounded-xl"
          :style="cardStyle"
        >
          <n-empty>
            <template #default>
              <div class="text-xl text-neutral-500">
                {{ t('tracker.no_data.title') }}
              </div>
              <div class="text-xl text-neutral-500">
                {{ t('tracker.no_data.subtitle') }}
              </div></template
            >
            <template #extra>
              <n-button
                type="primary"
                @click="router.push(localePath('/import'))"
              >
                {{ t('navigation.import') }}
              </n-button>
            </template>
          </n-empty>
        </n-card>

        <!-- Sample Banners -->
        <div class="space-y-4">
          <template
            v-for="banner in sampleBanners"
            :key="banner.bannerId"
          >
            <n-card
              content-class="!p-2 sm:!pt-2 sm:!p-4"
              size="small"
              class="rounded-xl min-h-[120px] sm:min-h-[160px] mt-2 sm:mt-4 opacity-40"
              :style="cardStyle"
            >
              <!-- Banner Header -->
              <div
                class="w-full flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <NuxtLink
                  :to="localePath(`/banner/${banner.bannerId}`)"
                  class="inline w-fit hover:opacity-95 transition-opacity"
                >
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-gradient-text
                        :size="18"
                        class="m-0 font-medium break-words"
                        :type="banner.bannerType === 2 ? 'warning' : 'info'"
                      >
                        {{ t(`banner.${banner.bannerId}.name`) }}
                      </n-gradient-text>
                    </template>
                    {{ t('navigation.banner_detail') }}
                  </n-tooltip>
                </NuxtLink>

                <div
                  class="flex flex-wrap gap-2 w-full sm:w-[calc(100%-500px)]"
                >
                  <template
                    v-for="outfit in banner.outfits"
                    :key="outfit.id"
                  >
                    <div class="flex items-center gap-2">
                      <n-tag
                        :type="outfit.rarity === 5 ? 'warning' : 'info'"
                        :bordered="false"
                        round
                        size="small"
                        class="px-2"
                      >
                        <span class="align-top"
                          >{{ t(`outfit.${outfit.id}.name`) }}
                          {{ outfit.rarity }}</span
                        >
                        <span class="ml-1"
                          ><n-icon><Star /></n-icon
                        ></span>
                        <span
                          v-if="outfit.completion >= 1"
                          class="ml-1"
                          ><n-icon><CheckCircle /></n-icon
                        ></span>
                      </n-tag>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Sample Items Grid -->
              <div
                class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
              >
                <ItemCard
                  v-for="item in banner.pulls"
                  :key="`${item.itemId}-${item.count}`"
                  :item="item"
                />
              </div>
            </n-card>
          </template>
        </div>
      </div>
    </div>

    <!-- Collection Editor Modal -->
    <n-modal
      v-model:show="showCollectionEditor"
      class="w-full max-w-5xl"
      size="small"
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
    Database,
    ExclamationCircle,
  } from '@vicons/fa'
  import { useMessage } from 'naive-ui'
  import type { PullItem, ProcessedBanner } from '~/types/pull'
  import { BANNER_DATA } from '~/data/banners'
  import OUTFIT_DATA from '~/data/outfits'

  const message = useMessage()
  const router = useRouter()
  const { t } = useI18n()
  const pullStore = usePullStore()
  const { processedPulls, globalStats } = storeToRefs(pullStore)
  const { loadData } = useIndexedDB()
  const localePath = useLocalePath()
  const { cardStyle } = useCardStyle()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const siteUrl = useRuntimeConfig().public.siteUrl
  const loading = ref(true)
  const showPopover = ref(false)
  const exporting = ref(false)
  const showCollectionEditor = ref(false)
  const selectedBannerId = ref<number | null>(null)
  const dataSource = useDataSource()

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
      return bannerData?.runs?.some((run) => run.version === latestVersion)
    })

    return latestVersionBanners
      .map((bannerId) => {
        const bannerData = BANNER_DATA[bannerId]
        if (!bannerData) return null

        // Get all items from all outfits in this banner
        const allItems = bannerData.outfit5StarId
          .concat(bannerData.outfit4StarId)
          .flatMap((outfitId) => {
            const outfitData = OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]
            if (!outfitData?.items) return []

            return outfitData.items.map((itemId) => ({
              itemId: itemId,
              outfitId: outfitId,
              rarity: bannerData.outfit5StarId.includes(outfitId) ? 5 : 4,
              count: 1,
              pullIndex: 0,
              pullsToObtain: 0,
              obtainedAt: '',
              bannerId: bannerData.bannerId,
            }))
          })

        return {
          bannerId: bannerData.bannerId,
          bannerType: bannerData.bannerType,
          outfits: bannerData.outfit5StarId
            .concat(bannerData.outfit4StarId)
            .map((outfitId) => ({
              id: outfitId,
              rarity: bannerData.outfit5StarId.includes(outfitId) ? 5 : 4,
              completion: 0,
            })),
          pulls: allItems, // Include all items as sample pulls
          stats: {
            totalPulls: 0,
            total5StarItems: 0,
            total4StarItems: 0,
            total4StarOnlyItems: 0,
            avg5StarPulls: 0,
            avg4StarPulls: 0,
            avg4StarOnlyPulls: 0,
            pity5Star: 0,
            pity4Star: 0,
            completion: 0,
          },
        }
      })
      .filter((banner) => banner !== null)
  })

  useHead({
    title: t('navigation.tracker') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.tracker'),
      },
      {
        property: 'og:title',
        content: t('navigation.tracker') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.tracker'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.tracker') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.tracker'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/tracker')}` }],
  })

  // Function to load and process data based on current data source
  const loadAndProcessData = async () => {
    try {
      loading.value = true
      const {
        pulls: pullData,
        edits: editData,
        evo: evoData,
        pearpal: pearpalData,
      } = await loadData()

      // Decide which data source to prioritize
      const hasPearpal = Object.keys(pearpalData).length > 0
      const hasGame =
        Object.keys(pullData).length > 0 || Object.keys(editData).length > 0

      if (hasPearpal && hasGame) {
        if (dataSource.value === 'pearpal') {
          await pullStore.processPearpalData(pearpalData)
        } else if (dataSource.value === 'game') {
          await pullStore.processPullData(pullData, editData)
        } else {
          await pullStore.processAutoData(pullData, editData, pearpalData)
        }
      } else if (hasPearpal) {
        await pullStore.processPearpalData(pearpalData)
      } else if (hasGame) {
        await pullStore.processPullData(pullData, editData)
      }

      // Process evolution data
      if (Object.keys(evoData).length > 0) {
        pullStore.evoData = evoData
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error(t('tracker.no_data.error'))
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadAndProcessData()
  })

  // Watch for data source changes and reload data
  watch(dataSource, async () => {
    await loadAndProcessData()
  })

  // Helper functions and constants
  const getOutfitItems = (items: PullItem[], outfitId: string) => {
    return items.filter((item) => item.outfitId === outfitId)
  }

  // Display settings using composable
  const { settings } = useTrackerSettings()

  // Function to sort banners
  const sortedBanners = computed(() => {
    const banners = Object.values(processedPulls.value)
    // Filter out empty banners if showEmptyBanners is false
    const filteredBanners = settings.value.showEmptyBanners
      ? banners
      : banners.filter(
          (banner) => banner.pulls.filter((pull) => pull.count > 0).length > 0
        )

    return filteredBanners.sort((a, b) => {
      return settings.value.sortBanner
        ? a.bannerId - b.bannerId
        : b.bannerId - a.bannerId
    })
  })

  // Filter pulls based on UI toggles
  const filterPulls = (pulls: PullItem[], banner: ProcessedBanner) => {
    let filteredPulls = pulls.filter((pull) => {
      // When show4StarItems is false, hide 4★ items only in type 2 banners
      if (
        pull.rarity === 4 &&
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

  const {
    getAvg5StarPercentile,
    getAvg4StarType2Percentile,
    getAvg4StarType3Percentile,
    getTotalPullsPercentile,
  } = usePercentile()

  const exportPNG = async () => {
    if (exporting.value) return
    message.info(t('tracker.export.in_progress'))
    exporting.value = true
    showPopover.value = false

    try {
      const { toPng } = await import('html-to-image')

      const trackerElement = document.querySelector(
        '.png-export-container'
      ) as HTMLElement
      if (!trackerElement) {
        throw new Error('Tracker element not found')
      }

      const contentWidth = trackerElement.scrollWidth
      const contentHeight = trackerElement.scrollHeight

      const dataUrl = await toPng(trackerElement, {
        quality: 1,
        backgroundColor: isDark.value ? '#101014' : '#f8fafc',
        width: contentWidth,
        height: contentHeight,
        includeQueryParams: true,
      })

      const link = document.createElement('a')
      link.download = `gongeous-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()

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
      const { loadData } = useIndexedDB()
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
        exportData = {
          pulls: filteredPullData,
          edits: filteredEditData,
          evo: filteredEvoData,
          pearpal: filteredPearpalData,
        }
      }

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })

      // Create a link element and trigger download
      const link = document.createElement('a')
      link.download = `nikki-resonance-data-${new Date().toISOString().split('T')[0]}.json`
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
