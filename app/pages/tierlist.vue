<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2 sm:items-center">
          <div
            class="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <n-button-group class="self-start">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    class="w-12 !px-0"
                    :aria-label="t('common.banners')"
                    :type="mode === 'banners' ? 'primary' : 'default'"
                    @click="setMode('banners')"
                  >
                    <template #icon>
                      <n-icon><CalendarAlt /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('common.banners') }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    class="w-12 !px-0"
                    :aria-label="t('common.outfits')"
                    :type="mode === 'outfits' ? 'primary' : 'default'"
                    @click="setMode('outfits')"
                  >
                    <template #icon>
                      <n-icon><Tshirt /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('common.outfits') }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    class="w-12 !px-0"
                    :aria-label="t('common.items')"
                    :type="mode === 'items' ? 'primary' : 'default'"
                    @click="setMode('items')"
                  >
                    <template #icon>
                      <n-icon><ListAlt /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('common.items') }}
              </n-tooltip>
            </n-button-group>

            <div class="hidden min-w-0 overflow-x-auto sm:block">
              <n-button-group
                v-if="mode !== 'banners'"
                class="min-w-max"
              >
                <n-button
                  size="small"
                  :type="qualityFilter === null ? 'primary' : 'default'"
                  class="min-w-[40px]"
                  @click="qualityFilter = null"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-for="q in [5, 4, 3, 2]"
                  :key="q"
                  size="small"
                  v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                  class="min-w-[40px]"
                  :disabled="q === 2"
                  @click="qualityFilter = q"
                >
                  <span class="flex items-center gap-1">
                    {{ q }}
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
              </n-button-group>

              <n-button-group
                v-else
                class="min-w-max"
              >
                <n-button
                  size="small"
                  :type="bannerQualityFilter === null ? 'primary' : 'default'"
                  class="min-w-[40px]"
                  @click="bannerQualityFilter = null"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-for="q in [5, 4]"
                  :key="q"
                  size="small"
                  v-bind="getQualityButtonTheme(q, bannerQualityFilter === q)"
                  class="min-w-[40px]"
                  @click="bannerQualityFilter = q"
                >
                  <span class="flex items-center gap-1">
                    {{ q }}
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
              </n-button-group>
            </div>

            <n-button
              v-if="hasFilters"
              size="small"
              class="hidden sm:inline-flex"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>

          <div
            class="flex shrink-0 items-center gap-2 self-start sm:self-center"
          >
            <n-tooltip
              v-if="showCommunityInsightsAction"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  text
                  circle
                  class="text-gray-500"
                  :aria-label="t('tierlist.community_insights.toggle')"
                  @click="showCommunityInsights = !showCommunityInsights"
                >
                  <template #icon>
                    <n-icon
                      size="20"
                      :depth="showCommunityInsightPanel ? 1 : 3"
                    >
                      <Users />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('tierlist.community_insights.toggle') }}
            </n-tooltip>

            <n-popover
              trigger="click"
              placement="bottom-end"
            >
              <template #trigger>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button
                      v-show="!exporting"
                      size="small"
                      text
                      circle
                      class="text-gray-500"
                      :aria-label="t('common.export')"
                    >
                      <template #icon>
                        <n-icon depth="3">
                          <Download />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  {{ t('common.export') }}
                </n-tooltip>
              </template>
              <div class="w-32 space-y-2 text-center">
                <n-button
                  v-if="!showCommunityInsightPanel"
                  block
                  text
                  class="text-gray-400 hover:text-gray-600"
                  @click="exportPNG"
                >
                  <template #icon>
                    <n-icon><Download /></n-icon>
                  </template>
                  {{ t('tracker.export.png') }}
                </n-button>
                <n-button
                  block
                  text
                  class="text-gray-400 hover:text-gray-600"
                  @click="copyShareLink"
                >
                  <template #icon>
                    <n-icon><ExternalLinkAlt /></n-icon>
                  </template>
                  {{ t('tierlist.share.copy_link') }}
                </n-button>
                <n-button
                  block
                  text
                  class="text-gray-400 hover:text-gray-600"
                  @click="resetTierBoard"
                >
                  <template #icon>
                    <n-icon><Sync /></n-icon>
                  </template>
                  {{ t('tierlist.actions.reset_board') }}
                </n-button>
              </div>
            </n-popover>

            <div
              v-if="showCommunitySubmitAction"
              class="flex items-center"
            >
              <n-tooltip
                :width="220"
                trigger="hover"
              >
                <template #trigger>
                  <n-button
                    type="primary"
                    size="small"
                    class="relative overflow-hidden"
                    :class="
                      shouldHighlightCommunitySubmitButton
                        ? `after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none`
                        : ''
                    "
                    :loading="submittingCommunity"
                    :disabled="!canSubmitCommunity"
                    @click="submitCommunityTierlist"
                  >
                    <template #icon>
                      <n-icon><Users /></n-icon>
                    </template>
                    {{ t('common.submit') }}
                  </n-button>
                </template>
                {{ communitySubmitTooltipText }}
              </n-tooltip>
            </div>
          </div>
        </div>

        <div class="flex items-start gap-2 sm:hidden">
          <div class="min-w-0 flex-1 overflow-x-auto pb-1">
            <n-button-group
              v-if="mode !== 'banners'"
              class="min-w-max"
            >
              <n-button
                size="small"
                :type="qualityFilter === null ? 'primary' : 'default'"
                class="min-w-[40px]"
                @click="qualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="q in [5, 4, 3, 2]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                class="min-w-[40px]"
                :disabled="q === 2"
                @click="qualityFilter = q"
              >
                <span class="flex items-center gap-1">
                  {{ q }}
                  <n-icon>
                    <Star />
                  </n-icon>
                </span>
              </n-button>
            </n-button-group>

            <n-button-group
              v-else
              class="min-w-max"
            >
              <n-button
                size="small"
                :type="bannerQualityFilter === null ? 'primary' : 'default'"
                class="min-w-[40px]"
                @click="bannerQualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="q in [5, 4]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, bannerQualityFilter === q)"
                class="min-w-[40px]"
                @click="bannerQualityFilter = q"
              >
                <span class="flex items-center gap-1">
                  {{ q }}
                  <n-icon>
                    <Star />
                  </n-icon>
                </span>
              </n-button>
            </n-button-group>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            v-model:value="versionFilter"
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />

          <n-select
            v-if="mode !== 'banners'"
            v-model:value="styleFilter"
            :options="styleOptions"
            size="small"
            class="min-w-0"
            clearable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_style')"
          />

          <n-select
            v-if="mode !== 'banners'"
            v-model:value="labelFilter"
            :options="labelOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_label')"
          />

          <n-select
            v-if="mode !== 'banners'"
            v-model:value="obtainFilter"
            :options="obtainOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_obtain')"
          />
        </div>

        <div
          v-if="mode === 'items'"
          class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4"
        >
          <n-select
            v-model:value="itemTypeFilter"
            :options="itemTypeOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_slot')"
          />

          <n-select
            v-model:value="itemCategoryFilter"
            :options="itemCategoryOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isItemCategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_category')"
          />

          <n-select
            v-model:value="itemSubcategoryFilter"
            :options="itemSubcategoryOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isItemSubcategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_subcategory')"
          />

          <n-button
            size="small"
            class="justify-between"
            :disabled="!showAdvancedFiltersButton"
            @click="isAdvancedFiltersDrawerOpen = true"
          >
            <span>{{ t('compendium.advanced_filters') }}</span>
            <span v-if="activeAdvancedFilterCount > 0">
              ({{ activeAdvancedFilterCount }})
            </span>
          </n-button>
        </div>
      </div>
    </n-card>

    <div
      v-if="loading"
      :class="{ 'png-export-container': !showCommunityInsightPanel }"
    >
      <n-card
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
      >
        <div class="space-y-1">
          <div
            v-for="(tier, tierIndex) in tierKeys"
            :key="`skeleton-${tier}`"
            class="rounded-lg border border-gray-200/70 dark:border-gray-700/70"
          >
            <div :class="[tierRowClass, 'flex items-stretch gap-2']">
              <div
                class="shrink-0 w-12 sm:w-16 md:w-20 xl:w-24 rounded-md border border-gray-200/70 dark:border-gray-700/70 border-l-4 p-1 flex items-center justify-center"
                :style="{
                  borderLeftColor: tierColorByKey[tier],
                  backgroundColor: tierLabelBackgroundByKey[tier],
                }"
              ></div>

              <div class="flex-1 min-w-0">
                <div :class="[cardGridClass, tierListClass]">
                  <div
                    v-for="i in (tierIndex + 1) % 2 === 1 ? 2 : 3"
                    :key="`${tier}-card-${i}`"
                    :class="[cardAspectClass, 'rounded-md overflow-hidden']"
                  >
                    <n-skeleton class="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <n-card
      v-else-if="showCommunityInsightPanel"
      size="small"
      class="rounded-xl"
      content-class="!p-2 sm:!p-4"
    >
      <div class="space-y-2">
        <div
          v-if="communityAggregateStatus === 'error'"
          class="text-xs text-red-500"
        >
          {{
            communityAggregateError || t('tierlist.community_insights.error')
          }}
        </div>
        <div
          v-else-if="!hasCommunityPreviewEntries"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{ t('tierlist.community_insights.empty') }}
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <div class="space-y-1">
            <div
              v-for="tier in tierKeys"
              :key="`community-tier-${tier}`"
              class="rounded-lg border border-gray-200/70 dark:border-gray-700/70"
            >
              <div :class="[tierRowClass, 'flex items-stretch gap-2']">
                <div
                  class="shrink-0 w-12 sm:w-16 md:w-20 xl:w-24 rounded-md border border-gray-200/70 dark:border-gray-700/70 border-l-4 p-1 flex items-center justify-center"
                  :style="{
                    borderLeftColor: tierColorByKey[tier],
                    backgroundColor: tierLabelBackgroundByKey[tier],
                  }"
                >
                  <span
                    class="font-bold leading-none text-center"
                    :style="getTierLabelInputStyle(tier)"
                  >
                    {{ tier }}
                  </span>
                </div>

                <div class="flex-1 min-w-0">
                  <div :class="[cardGridClass, tierListClass]">
                    <div
                      v-if="communityAggregateTieredEntries[tier].length === 0"
                      class="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400"
                    ></div>

                    <div
                      v-for="entry in communityAggregateTieredEntries[tier]"
                      :key="entry.id"
                      class="group text-left touch-none cursor-pointer"
                    >
                      <n-popover
                        trigger="click"
                        placement="top"
                      >
                        <template #trigger>
                          <div
                            class="relative rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70"
                            :class="cardAspectClass"
                            style="
                              background-image: url('/images/bg.webp');
                              background-size: cover;
                              background-position: center;
                            "
                          >
                            <div
                              class="absolute inset-0"
                              :class="getQualityOverlayClass(entry.quality)"
                            ></div>
                            <NuxtImg
                              :src="entry.image"
                              :alt="entry.name"
                              class="absolute inset-0 w-full h-full object-cover z-10"
                              :preset="
                                mode === 'banners' ? 'bannerThumb' : 'tallLg'
                              "
                              fit="cover"
                              loading="lazy"
                              :sizes="mode === 'banners' ? '200px' : '160px'"
                            />
                          </div>
                        </template>

                        <div class="w-48 space-y-0.5 text-xs leading-4">
                          <div class="text-sm font-semibold truncate">
                            {{ entry.name }}
                          </div>
                          <div class="text-gray-600 dark:text-gray-300">
                            {{
                              t('tierlist.community_insights.rank_position', {
                                rank: entry.communityRank,
                              })
                            }}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            {{
                              t('tierlist.community_insights.avg_tier', {
                                tier: entry.communityTier,
                              })
                            }}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            {{
                              t('tierlist.community_insights.total_votes', {
                                count: formatCommunityVoteCount(
                                  entry.communityVotes
                                ),
                              })
                            }}
                          </div>
                          <div
                            v-if="entry.communityHigherThanLabel"
                            class="text-gray-500 dark:text-gray-400"
                          >
                            {{ entry.communityHigherThanLabel }}
                          </div>

                          <div
                            class="rounded-lg !my-1 border border-gray-200/80 bg-gray-50/80 p-2 dark:border-gray-700/80 dark:bg-gray-800/40"
                          >
                            <div class="space-y-1">
                              <div
                                v-for="tierKey in tierKeys"
                                :key="`distribution-row-${entry.id}-${tierKey}`"
                                class="flex items-center gap-1.5"
                              >
                                <span
                                  class="inline-flex h-3 w-4 shrink-0 items-center justify-center font-mono text-[10px] font-semibold leading-none"
                                  :style="{ color: tierColorByKey[tierKey] }"
                                >
                                  {{ tierKey }}
                                </span>
                                <div
                                  class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700/80"
                                >
                                  <div
                                    class="h-full rounded-full transition-[width] duration-200"
                                    :style="
                                      getCommunityTierSegmentStyle(
                                        entry.communityTierCounts,
                                        tierKey
                                      )
                                    "
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </n-popover>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="communityAggregateUnrankedEntries.length > 0"
            class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
          >
            <div :class="tierRowClass">
              <div :class="[cardGridClass, tierListClass]">
                <div
                  v-for="entry in communityPaginatedUnrankedEntries"
                  :key="`community-unranked-${entry.id}`"
                  class="group text-left touch-none cursor-pointer"
                >
                  <n-popover
                    trigger="click"
                    placement="top"
                  >
                    <template #trigger>
                      <div
                        class="relative rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70"
                        :class="cardAspectClass"
                        style="
                          background-image: url('/images/bg.webp');
                          background-size: cover;
                          background-position: center;
                        "
                      >
                        <div
                          class="absolute inset-0"
                          :class="getQualityOverlayClass(entry.quality)"
                        ></div>
                        <NuxtImg
                          :src="entry.image"
                          :alt="entry.name"
                          class="absolute inset-0 w-full h-full object-cover z-10"
                          :preset="
                            mode === 'banners' ? 'bannerThumb' : 'tallLg'
                          "
                          fit="cover"
                          loading="lazy"
                          :sizes="mode === 'banners' ? '200px' : '160px'"
                        />
                      </div>
                    </template>

                    <div class="w-56 space-y-1.5 text-xs leading-4">
                      <div class="text-sm font-semibold truncate">
                        {{ entry.name }}
                      </div>
                      <div class="text-gray-600 dark:text-gray-300">
                        {{
                          t('tierlist.community_insights.not_enough_votes', {
                            min: COMMUNITY_MIN_VOTES_FOR_RANKING,
                          })
                        }}
                      </div>
                      <div class="text-gray-500 dark:text-gray-400">
                        {{
                          t('tierlist.community_insights.total_votes', {
                            count: formatCommunityVoteCount(
                              entry.communityVotes
                            ),
                          })
                        }}
                      </div>

                      <div
                        class="rounded-md border border-gray-200/80 bg-gray-50/80 p-2 dark:border-gray-700/80 dark:bg-gray-900/40"
                      >
                        <div class="space-y-1">
                          <div
                            v-for="tierKey in tierKeys"
                            :key="`distribution-row-${entry.id}-${tierKey}`"
                            class="flex items-center gap-1.5"
                          >
                            <span
                              class="inline-flex h-3 w-4 shrink-0 items-center justify-center font-mono text-[10px] font-semibold leading-none"
                              :style="{ color: tierColorByKey[tierKey] }"
                            >
                              {{ tierKey }}
                            </span>
                            <div
                              class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700/80"
                            >
                              <div
                                class="h-full rounded-full transition-[width] duration-200"
                                :style="
                                  getCommunityTierSegmentStyle(
                                    entry.communityTierCounts,
                                    tierKey
                                  )
                                "
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </n-popover>
                </div>
              </div>
            </div>

            <div
              v-if="showCommunityPoolPagination"
              class="flex justify-center items-center px-2 pb-2"
            >
              <n-pagination
                v-model:page="communityPoolPage"
                :page-size="POOL_PAGE_SIZE"
                :item-count="communityAggregateUnrankedEntries.length"
                :show-size-picker="false"
                :page-slot="5"
              />
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <div
      v-else
      class="png-export-container"
    >
      <n-card
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
      >
        <div
          v-if="error"
          class="text-center py-12"
        >
          <n-result
            size="small"
            status="error"
            :title="t('compendium.error_title')"
            :description="t('compendium.error_description')"
          >
            <template #footer>
              <n-button
                type="primary"
                @click="handleReloadEntries"
              >
                {{ t('common.retry') }}
              </n-button>
            </template>
          </n-result>
        </div>

        <div
          v-else-if="isOverLimit"
          class="text-center py-12"
        >
          <n-result
            size="small"
            status="warning"
            :title="t('tierlist.over_limit.title')"
            :description="
              t('tierlist.over_limit.description', { max: TIER_ENTRY_LIMIT })
            "
          >
            <template #icon>
              <NuxtImg
                :src="getImageSrc('emote', 'think')"
                :alt="t('tierlist.over_limit.title')"
                class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
                preset="iconLg"
                fit="cover"
                sizes="160px sm:200px"
              />
            </template>
          </n-result>
        </div>

        <div
          v-else
          class="space-y-1"
        >
          <div
            v-for="tier in tierKeys"
            :key="tier"
            class="rounded-lg border border-gray-200/70 dark:border-gray-700/70"
          >
            <div :class="[tierRowClass, 'flex items-stretch gap-2']">
              <div
                class="shrink-0 w-12 sm:w-16 md:w-20 xl:w-24 rounded-md border border-gray-200/70 dark:border-gray-700/70 border-l-4 p-1 flex items-center justify-center"
                :style="{
                  borderLeftColor: tierColorByKey[tier],
                  backgroundColor: tierLabelBackgroundByKey[tier],
                }"
              >
                <n-input
                  :value="tierLabels[tier]"
                  type="textarea"
                  :autosize="{ minRows: 1 }"
                  :placeholder="tier"
                  :maxlength="TIER_LABEL_MAX_LENGTH"
                  :show-count="false"
                  :bordered="false"
                  :style="getTierLabelInputStyle(tier)"
                  class="w-full min-w-0 bg-transparent font-bold text-center [&_.n-input-wrapper]:!px-1"
                  @update:value="(value) => updateTierLabel(tier, value)"
                  @blur="normalizeTierLabel(tier)"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div
                  :ref="(el) => setTierListRef(tier, el as HTMLElement | null)"
                  :class="[cardGridClass, tierListClass]"
                  :data-list-key="tier"
                >
                  <div
                    v-if="tieredEntries[tier].length === 0"
                    class="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400"
                  ></div>

                  <button
                    v-for="entry in tieredEntries[tier]"
                    :key="entry.id"
                    type="button"
                    class="group text-left cursor-grab active:cursor-grabbing touch-none"
                    :data-entry-id="entry.id"
                    @click="openRankContextMenu(entry.id, $event)"
                    @contextmenu="openRankContextMenu(entry.id, $event)"
                  >
                    <div
                      class="relative rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70"
                      :class="cardAspectClass"
                      style="
                        background-image: url('/images/bg.webp');
                        background-size: cover;
                        background-position: center;
                      "
                    >
                      <div
                        class="absolute inset-0"
                        :class="getQualityOverlayClass(entry.quality)"
                      ></div>
                      <NuxtImg
                        :src="entry.image"
                        :alt="entry.name"
                        class="absolute inset-0 w-full h-full object-cover z-10"
                        :preset="mode === 'banners' ? 'bannerThumb' : 'tallLg'"
                        fit="cover"
                        loading="lazy"
                        :sizes="mode === 'banners' ? '200px' : '160px'"
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <n-card
      v-if="
        !showCommunityInsightPanel && !error && !boardLoading && !isOverLimit
      "
      size="small"
      class="rounded-xl"
      content-class="!p-2 sm:!p-4"
    >
      <div
        class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
      >
        <div :class="tierRowClass">
          <div
            ref="unrankedListRef"
            :class="[cardGridClass, tierListClass]"
            :data-list-key="UNRANKED_TARGET"
          >
            <div
              v-if="resolvedUnrankedEntries.length === 0"
              class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400"
            >
              {{ t('tierlist.unranked_empty') }}
            </div>

            <button
              v-for="entry in paginatedUnrankedEntries"
              :key="entry.id"
              type="button"
              class="group text-left cursor-grab active:cursor-grabbing touch-none"
              :data-entry-id="entry.id"
              @click="openRankContextMenu(entry.id, $event)"
              @contextmenu="openRankContextMenu(entry.id, $event)"
            >
              <div
                class="relative rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70"
                :class="cardAspectClass"
                style="
                  background-image: url('/images/bg.webp');
                  background-size: cover;
                  background-position: center;
                "
              >
                <div
                  class="absolute inset-0"
                  :class="getQualityOverlayClass(entry.quality)"
                ></div>
                <NuxtImg
                  :src="entry.image"
                  :alt="entry.name"
                  class="absolute inset-0 w-full h-full object-cover z-10"
                  :preset="mode === 'banners' ? 'bannerThumb' : 'tallLg'"
                  fit="cover"
                  loading="lazy"
                  :sizes="mode === 'banners' ? '200px' : '160px'"
                />
              </div>
            </button>
          </div>
        </div>

        <div class="flex justify-center items-center px-2 pb-2">
          <n-pagination
            v-if="showPoolPagination"
            v-model:page="poolPage"
            :page-size="POOL_PAGE_SIZE"
            :item-count="resolvedUnrankedEntries.length"
            :show-size-picker="false"
            :page-slot="5"
          >
            <template #prefix>
              <div class="text-sm space-x-1 text-gray-600 dark:text-gray-400">
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  entries.length
                }}</span>
                <span>
                  {{
                    entries.length === 1
                      ? poolCountLabels.singular
                      : poolCountLabels.plural
                  }}
                </span>
              </div>
            </template>
          </n-pagination>

          <div
            v-else
            class="text-sm space-x-1 text-gray-600 dark:text-gray-400"
          >
            <span class="font-semibold text-gray-900 dark:text-white">{{
              entries.length
            }}</span>
            <span>
              {{
                entries.length === 1
                  ? poolCountLabels.singular
                  : poolCountLabels.plural
              }}
            </span>
          </div>
        </div>
      </div>
    </n-card>

    <n-dropdown
      trigger="manual"
      :show="rankMenu.show"
      :x="rankMenu.x"
      :y="rankMenu.y"
      :options="rankMenuOptions"
      placement="bottom-start"
      @select="handleRankMenuSelect"
      @clickoutside="closeRankContextMenu"
    />

    <AdvancedFiltersDrawer
      :show="isAdvancedFiltersDrawerOpen"
      :fields="advancedFilterFields"
      :filters="advancedFilters"
      :options="advancedFacetOptions"
      @update:show="isAdvancedFiltersDrawerOpen = $event"
      @update:filters="updateAdvancedFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    CalendarAlt,
    Download,
    ExternalLinkAlt,
    ListAlt,
    Star,
    Sync,
    Tshirt,
    Users,
  } from '@vicons/fa'
  import {
    useSortable,
    type UseSortableOptions,
  } from '@vueuse/integrations/useSortable'
  import type { SortableEvent } from 'sortablejs'
  import type {
    ItemSearchAdvancedFacetMap,
    ItemSearchAdvancedField,
    ItemSearchAdvancedFilters,
  } from '#shared/types/itemSearch'
  import { BANNER_DATA } from '~~/data/banners'
  import {
    ITEM_SEARCH_UNCATEGORIZED_VALUE,
    sortItemSearchFacetValues,
  } from '#shared/utils/itemSearch'

  type TierMode = 'banners' | 'outfits' | 'items'
  type TierKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  type TierTarget = TierKey | typeof UNRANKED_TARGET
  type TierEntry = {
    id: string
    numericId: number
    name: string
    image: string
    quality: number | null
  }
  type CommunityTierCounts = Record<TierKey, number>
  type CommunityTierPreviewEntry = TierEntry & {
    communityRank: number
    communityTier: TierKey
    communityVotes: number
    communityTierCounts: CommunityTierCounts
    communityHigherThanLabel: string | null
  }
  type CommunityUnrankedPreviewEntry = TierEntry & {
    communityVotes: number
    communityTierCounts: CommunityTierCounts
  }

  type TierDataPayload = {
    entries: TierEntry[]
    overLimit: boolean
  }

  type SavedTierlist = {
    tiers?: Partial<Record<TierKey, string[]>>
    labels?: Partial<Record<TierKey, string>>
    lastSubmittedAt?: number | null
    lastModifiedAt?: number | null
  }

  const UNRANKED_TARGET = 'unranked' as const
  const TIERLIST_STORAGE_PREFIX = 'tierlist'
  const TIER_ENTRY_LIMIT = 200
  const TIER_LABEL_MAX_LENGTH = 30
  const POOL_PAGE_SIZE = 24

  const tierKeys = ['S', 'A', 'B', 'C', 'D', 'F'] as const

  const tierColorByKey: Record<TierKey, string> = {
    S: '#ef4444',
    A: '#f97316',
    B: '#eab308',
    C: '#22c55e',
    D: '#06b6d4',
    F: '#6b7280',
  }
  const tierLabelBackgroundByKey: Record<TierKey, string> = {
    S: 'rgba(239, 68, 68, 0.28)',
    A: 'rgba(249, 115, 22, 0.28)',
    B: 'rgba(234, 179, 8, 0.28)',
    C: 'rgba(34, 197, 94, 0.28)',
    D: 'rgba(6, 182, 212, 0.28)',
    F: 'rgba(107, 114, 128, 0.28)',
  }

  const getTierLabelInputStyle = (tier: TierKey) => {
    const label = tierLabels.value[tier].trim() || tier
    const characterCount = Array.from(label).length
    const responsiveSize = 1.6 - Math.max(0, characterCount - 2) * 0.06
    const fontSizeRem = Math.min(1.6, Math.max(0.8, responsiveSize))

    return {
      fontSize: `${fontSizeRem}rem`,
    }
  }

  const { t, locale, getLocaleMessage } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const { loadTierlist, saveTierlist, deleteTierlist } = useTierIndexedDB()
  const {
    voterFingerprint,
    isFingerprintInitialized,
    isFingerprintFallback,
    initVoterFingerprint,
  } = useVoterFingerprint()

  const pageTitle = computed(
    () =>
      `${t('navigation.tierlist')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const pageDescription = computed(() => t('meta.description.tierlist'))

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => pageDescription.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => pageDescription.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => pageDescription.value,
  })

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )
  const exactVersionPattern = /^\d+\.\d+$/
  const majorVersionFilterPattern = /^(\d+)\.x$/i

  const availableVersions = computed(() =>
    Object.keys(messages.value)
      .filter((key) => key.startsWith('version.'))
      .map((key) => key.replace('version.', ''))
      .filter((value) => exactVersionPattern.test(value))
  )
  const majorVersionFilters = computed(() =>
    Array.from(
      new Set(
        availableVersions.value
          .map((version) => version.split('.')[0] || '')
          .filter((major) => /^\d+$/.test(major))
      )
    )
      .sort((a, b) => Number(b) - Number(a))
      .map((major) => `${major}.x`)
  )
  const availableVersionFilters = computed(() => [
    ...availableVersions.value,
    ...majorVersionFilters.value,
  ])

  const compareVersion = (a: string, b: string) => {
    const [aMajor = 0, aMinor = 0] = a.split('.').map((part) => Number(part))
    const [bMajor = 0, bMinor = 0] = b.split('.').map((part) => Number(part))
    if (aMajor !== bMajor) return bMajor - aMajor
    return bMinor - aMinor
  }

  const availableObtains = computed(() =>
    Object.keys(messages.value)
      .filter((key) => key.startsWith('obtain.') && key.endsWith('.name'))
      .map((key) => Number(key.split('.')[1]))
      .filter((value) => !Number.isNaN(value))
  )
  const obtainOptions = computed(() => {
    const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

    availableObtains.value.forEach((id) => {
      const groupKey = resolveObtainGroupKey(id)
      if (!groupKey) {
        return
      }

      const existing = groupMap.get(groupKey)
      if (existing) {
        existing.ids.push(id)
        return
      }

      const labelKey = resolveObtainGroupLabelKey(groupKey)
      if (!labelKey) {
        return
      }

      groupMap.set(groupKey, {
        labelKey,
        ids: [id],
      })
    })

    return Array.from(groupMap.entries())
      .map(([groupKey, group]) => {
        const translated = t(group.labelKey)
        const fallback = group.labelKey.startsWith('obtain.')
          ? t('tierlist.obtain_fallback', { id: group.ids[0] })
          : group.labelKey
        const label = translated !== group.labelKey ? translated : fallback
        const latestVersion = group.ids
          .map((id) => getVersionFromId(id))
          .filter((value): value is string => Boolean(value))
          .sort(compareVersion)
          .pop()

        return {
          label,
          value: groupKey,
          sortKey: latestVersion ?? '',
        }
      })
      .sort((a, b) => {
        if (a.sortKey && b.sortKey && a.sortKey !== b.sortKey) {
          return compareVersion(b.sortKey, a.sortKey)
        }

        if (a.sortKey && !b.sortKey) return -1
        if (!a.sortKey && b.sortKey) return 1
        return a.label.localeCompare(b.label)
      })
      .map(({ label, value }) => ({ label, value }))
  })

  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const availableStyles = STYLE_DEFINITIONS.map((style) => style.key)
  const availableLabels = TAG_DEFINITIONS.map((tag) => tag.key)
  const availableItemTypes = getAllItemTypes()

  const resolveMode = (value?: string | null): TierMode => {
    if (value === 'banners' || value === 'outfits' || value === 'items') {
      return value
    }
    return 'banners'
  }

  const resolveQuality = (value?: string | null) => {
    if (!value) return null
    const parsed = Number(value)
    return [5, 4, 3, 2].includes(parsed) ? parsed : null
  }

  const resolveVersion = (value?: string | null) => {
    if (!value || value === 'all') return null
    if (availableVersionFilters.value.includes(value)) return value

    const majorMatch = value.match(majorVersionFilterPattern)
    if (majorMatch) {
      const normalized = `${Number(majorMatch[1])}.x`
      if (availableVersionFilters.value.includes(normalized)) {
        return normalized
      }
    }

    return null
  }

  const resolveStyle = (value?: string | null) => {
    if (!value || value === 'all') return null
    const normalized = normalizeTraitKey(value)
    if (availableStyles.includes(normalized)) return normalized
    return null
  }

  const resolveLabel = (value?: string | null) => {
    if (!value || value === 'all') return null
    const normalized = normalizeTraitKey(value)
    if (availableLabels.includes(normalized)) return normalized
    return null
  }

  const resolveObtain = (value?: string | null) => {
    if (!value || value === 'all') return null
    if (availableObtainValues.value.includes(value)) return value
    const ids = resolveObtainIdsFromValue(value)
    if (!ids) return null
    const groupKey = resolveObtainGroupKeyFromIds(ids)
    if (!groupKey) return null
    return availableObtainValues.value.includes(groupKey) ? groupKey : null
  }

  const resolveItemType = (value?: string | null): ItemType | null => {
    if (!value || value === 'all') return null
    if ((availableItemTypes as string[]).includes(value)) {
      return value as ItemType
    }
    return null
  }

  const resolveBannerQuality = (value?: string | null): number | null => {
    if (!value || value === 'all') return null
    const parsed = Number(value)
    return [5, 4].includes(parsed) ? parsed : null
  }

  const resolveLegacyBannerType = (value?: string | null): number | null => {
    if (!value || value === 'all') return null
    const parsed = Number(value)
    if (parsed === 2) return 5
    if (parsed === 3) return 4
    return null
  }

  const mode = ref<TierMode>(resolveMode(route.query.mode?.toString() ?? null))
  const poolPage = ref(1)
  const communityPoolPage = ref(1)
  const qualityFilter = ref<number | null>(
    resolveQuality(route.query.quality?.toString() ?? null)
  )
  const initialItemTypeFilter = resolveItemType(
    route.query.type?.toString() ?? null
  )
  const itemTypeFilter = ref<ItemType | null>(initialItemTypeFilter)
  const itemCategoryFilter = ref<string | null>(
    initialItemTypeFilter
      ? normalizeItemSearchTokenKey(route.query.category?.toString() ?? null) ||
          null
      : null
  )
  const itemSubcategoryFilter = ref<string | null>(
    initialItemTypeFilter
      ? normalizeItemSearchTokenKey(
          route.query.subcategory?.toString() ?? null
        ) || null
      : null
  )
  const bannerQualityFilter = ref<number | null>(
    resolveBannerQuality(route.query.quality?.toString() ?? null) ??
      resolveLegacyBannerType(route.query.type?.toString() ?? null)
  )
  const versionFilter = ref<string | null>(
    resolveVersion(route.query.version?.toString() ?? null)
  )
  const styleFilter = ref<string | null>(
    resolveStyle(route.query.style?.toString() ?? null)
  )
  const labelFilter = ref<string | null>(
    resolveLabel(route.query.label?.toString() ?? null)
  )
  const obtainFilter = ref<string | null>(
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )
  )
  const advancedFilters = ref<ItemSearchAdvancedFilters>(
    normalizeItemSearchCompendiumAdvancedFilters(
      resolveItemSearchAdvancedFilters(
        route.query as Record<string, unknown>,
        itemTypeFilter.value
      ),
      itemTypeFilter.value
    )
  )
  const isAdvancedFiltersDrawerOpen = ref(false)
  const advancedFilterFields = computed(() =>
    mode.value === 'items'
      ? getItemSearchCompendiumAdvancedFields(itemTypeFilter.value)
      : []
  )
  const activeAdvancedFilters = computed(() =>
    getActiveItemSearchAdvancedFilters(
      advancedFilters.value,
      mode.value === 'items' ? itemTypeFilter.value : null
    )
  )
  const activeAdvancedFiltersKey = computed(() =>
    serializeItemSearchAdvancedFilters(
      advancedFilters.value,
      mode.value === 'items' ? itemTypeFilter.value : null
    )
  )
  const activeAdvancedFilterCount = computed(
    () =>
      advancedFilterFields.value.filter((field) =>
        hasActiveItemSearchAdvancedFilterValue(
          activeAdvancedFilters.value[field] ?? null
        )
      ).length
  )
  const supportsItemSearchCategories = computed(
    () => mode.value === 'items' && !!itemTypeFilter.value
  )
  const showAdvancedFiltersButton = computed(
    () => mode.value === 'items' && advancedFilterFields.value.length > 0
  )

  const setMode = (nextMode: TierMode) => {
    if (nextMode === mode.value) return

    if (nextMode === 'banners' && mode.value !== 'banners') {
      if (qualityFilter.value === 4 || qualityFilter.value === 5) {
        bannerQualityFilter.value = qualityFilter.value
      } else {
        bannerQualityFilter.value = null
        if (qualityFilter.value !== null) {
          qualityFilter.value = null
        }
      }
    } else if (mode.value === 'banners' && nextMode !== 'banners') {
      if (bannerQualityFilter.value === 4 || bannerQualityFilter.value === 5) {
        qualityFilter.value = bannerQualityFilter.value
      } else {
        qualityFilter.value = null
      }
    }

    if (nextMode !== 'items') {
      advancedFilters.value = createEmptyItemSearchAdvancedFilters()
      isAdvancedFiltersDrawerOpen.value = false
    }

    mode.value = nextMode
  }

  const hasFilters = computed(() => {
    if (mode.value === 'banners') {
      return bannerQualityFilter.value !== null || versionFilter.value !== null
    }

    return (
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null ||
      obtainFilter.value !== null ||
      (mode.value === 'items' &&
        (itemTypeFilter.value !== null ||
          itemCategoryFilter.value !== null ||
          itemSubcategoryFilter.value !== null ||
          activeAdvancedFilterCount.value > 0))
    )
  })

  const itemTypeOptions = computed(() =>
    availableItemTypes
      .slice()
      .sort((a, b) => {
        const orderA = itemCategoryOrder[a] ?? 999
        const orderB = itemCategoryOrder[b] ?? 999
        return orderA - orderB
      })
      .map((type) => ({
        label: t(`type.${type}`),
        value: type,
      }))
  )

  const { fetchOutfitsPaginated } = useSupabaseOutfits()
  const { fetchItemsPaginated, fetchItemSearchFacets } = useSupabaseItems()

  const itemFacetCacheKey = computed(
    () =>
      `tier-item-facets-${mode.value}-${qualityFilter.value ?? 'all'}-${
        itemTypeFilter.value ?? 'all'
      }-${itemCategoryFilter.value ?? 'all'}-${itemSubcategoryFilter.value ?? 'all'}-${
        activeAdvancedFiltersKey.value || 'none'
      }-${styleFilter.value ?? 'all'}-${labelFilter.value ?? 'all'}-${
        versionFilter.value ?? 'all'
      }-${obtainFilter.value ?? 'all'}`
  )

  const { data: itemSearchFacets } = await useAsyncData(
    () => itemFacetCacheKey.value,
    async () => {
      if (mode.value !== 'items' || !itemTypeFilter.value) {
        return {
          categories: [],
          subcategories: [],
          advanced: {},
        }
      }

      return fetchItemSearchFacets({
        quality: qualityFilter.value,
        type: itemTypeFilter.value,
        category: supportsItemSearchCategories.value
          ? itemCategoryFilter.value
          : null,
        subcategory: supportsItemSearchCategories.value
          ? itemSubcategoryFilter.value
          : null,
        version: versionFilter.value,
        style: styleFilter.value,
        label: labelFilter.value,
        source: obtainFilter.value,
        ...activeAdvancedFilters.value,
      })
    },
    {
      default: () => ({
        categories: [],
        subcategories: [],
        advanced: {},
      }),
      lazy: true,
    }
  )

  const availableItemCategories = computed(
    () => itemSearchFacets.value?.categories ?? []
  )

  const availableItemSubcategories = computed(
    () => itemSearchFacets.value?.subcategories ?? []
  )
  const advancedFacetOptions = computed<ItemSearchAdvancedFacetMap>(
    () => itemSearchFacets.value?.advanced ?? {}
  )

  const isItemCategoryFilterEnabled = computed(
    () =>
      supportsItemSearchCategories.value &&
      availableItemCategories.value.length > 0
  )

  const isItemSubcategoryFilterEnabled = computed(
    () =>
      isItemCategoryFilterEnabled.value &&
      !!itemCategoryFilter.value &&
      availableItemSubcategories.value.length > 0
  )

  watch(
    availableItemCategories,
    (nextCategories) => {
      if (!itemCategoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        itemCategoryFilter.value,
        nextCategories
      )
      if (!resolved) {
        itemCategoryFilter.value = null
        itemSubcategoryFilter.value = null
        return
      }

      if (resolved !== itemCategoryFilter.value) {
        itemCategoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  watch(
    availableItemSubcategories,
    (nextSubcategories) => {
      if (!itemSubcategoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        itemSubcategoryFilter.value,
        nextSubcategories
      )
      if (!resolved) {
        itemSubcategoryFilter.value = null
        return
      }

      if (resolved !== itemSubcategoryFilter.value) {
        itemSubcategoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  const validateAdvancedFilters = () => {
    const allowedFields = new Set(advancedFilterFields.value)
    const nextFilters = {
      ...createEmptyItemSearchAdvancedFilters(),
      ...advancedFilters.value,
    }
    let hasChanges = false

    ;(Object.keys(nextFilters) as ItemSearchAdvancedField[]).forEach(
      (field) => {
        const value = nextFilters[field]
        if (!hasActiveItemSearchAdvancedFilterValue(value ?? null)) return

        if (!allowedFields.has(field)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        const resolved = getItemSearchAdvancedFacetValue(
          field,
          value,
          advancedFacetOptions.value
        )
        if (!hasActiveItemSearchAdvancedFilterValue(resolved)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        if (JSON.stringify(resolved) !== JSON.stringify(value)) {
          nextFilters[field] = resolved
          hasChanges = true
        }
      }
    )

    if (hasChanges) {
      advancedFilters.value = nextFilters
    }
  }

  watch(
    [advancedFilterFields, () => JSON.stringify(advancedFacetOptions.value)],
    validateAdvancedFilters,
    { immediate: true }
  )

  const updateAdvancedFilters = (nextFilters: ItemSearchAdvancedFilters) => {
    advancedFilters.value = normalizeItemSearchCompendiumAdvancedFilters(
      {
        ...createEmptyItemSearchAdvancedFilters(),
        ...advancedFilters.value,
        ...nextFilters,
      },
      itemTypeFilter.value
    )
  }

  const itemCategoryOptions = computed(() =>
    sortItemSearchFacetValues(availableItemCategories.value).map((value) => ({
      label:
        value === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('category', value, itemTypeFilter.value),
      value,
    }))
  )

  const itemSubcategoryOptions = computed(() =>
    sortItemSearchFacetValues(availableItemSubcategories.value).map(
      (value) => ({
        label:
          value === ITEM_SEARCH_UNCATEGORIZED_VALUE
            ? t('compendium.uncategorized')
            : translateFilterToken('subcategory', value, itemTypeFilter.value),
        value,
      })
    )
  )

  const styleOptions = computed(() =>
    STYLE_DEFINITIONS.map((style) => ({
      label: t(style.i18nKey),
      value: style.key,
    }))
  )

  const labelOptions = computed(() =>
    TAG_DEFINITIONS.map((tag) => ({
      label: t(tag.i18nKey),
      value: tag.key,
    }))
  )

  const versionOptions = computed(() => {
    const versionGroups = new Map<string, string[]>()

    availableVersions.value.forEach((version) => {
      const major = version.split('.')[0]
      if (!major) return

      const existing = versionGroups.get(major)
      if (existing) {
        existing.push(version)
      } else {
        versionGroups.set(major, [version])
      }
    })

    return Array.from(versionGroups.entries())
      .sort(([majorA], [majorB]) => Number(majorB) - Number(majorA))
      .flatMap(([major, versions]) => {
        const majorKey = `version.${major}.x`
        const majorCaption = t(majorKey)
        const majorLabel =
          majorCaption !== majorKey
            ? `${major}.x - ${majorCaption}`
            : `${major}.x`

        return [
          {
            label: majorLabel,
            value: `${major}.x`,
            isMajor: true,
          },
          ...versions
            .slice()
            .sort(compareVersion)
            .map((version) => ({
              label: `${version} - ${t(`version.${version}`)}`,
              value: version,
            })),
        ]
      })
  })
  const renderVersionOptionLabel = (option: {
    label?: string | number
    value?: string | number
    isMajor?: boolean
  }) => {
    const label = String(option.label ?? option.value ?? '')
    if (!option.isMajor) return label

    return h(
      'span',
      {
        style: {
          fontWeight: '700',
        },
      },
      label
    )
  }
  const buildTierQuery = () => {
    const query: Record<string, string | number> = {
      mode: mode.value,
    }

    if (mode.value === 'banners') {
      if (bannerQualityFilter.value !== null) {
        query.quality = bannerQualityFilter.value
      }

      if (versionFilter.value) {
        query.version = versionFilter.value
      }

      return query
    }

    if (qualityFilter.value !== null) {
      query.quality = qualityFilter.value
    }

    if (mode.value === 'items' && itemTypeFilter.value) {
      query.type = itemTypeFilter.value
    }

    if (supportsItemSearchCategories.value && itemCategoryFilter.value) {
      query.category = itemCategoryFilter.value
    }

    if (
      supportsItemSearchCategories.value &&
      itemCategoryFilter.value &&
      itemSubcategoryFilter.value
    ) {
      query.subcategory = itemSubcategoryFilter.value
    }

    if (mode.value === 'items') {
      Object.assign(
        query,
        buildItemSearchAdvancedFilterQuery(
          advancedFilters.value,
          itemTypeFilter.value,
          advancedFilterFields.value
        )
      )
    }

    if (versionFilter.value) {
      query.version = versionFilter.value
    }

    if (styleFilter.value) {
      query.style = styleFilter.value
    }

    if (labelFilter.value) {
      query.label = labelFilter.value
    }

    if (obtainFilter.value) {
      query.source = obtainFilter.value
    }

    return query
  }

  watch(
    [
      mode,
      qualityFilter,
      itemTypeFilter,
      itemCategoryFilter,
      itemSubcategoryFilter,
      activeAdvancedFiltersKey,
      bannerQualityFilter,
      versionFilter,
      styleFilter,
      labelFilter,
      obtainFilter,
    ],
    () => {
      poolPage.value = 1
      communityPoolPage.value = 1
      router.replace({ query: buildTierQuery() })
    }
  )

  watch(itemTypeFilter, () => {
    itemCategoryFilter.value = null
    itemSubcategoryFilter.value = null
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
  })

  watch(supportsItemSearchCategories, (isSupported) => {
    if (isSupported) return

    itemCategoryFilter.value = null
    itemSubcategoryFilter.value = null
  })

  watch(itemCategoryFilter, () => {
    itemSubcategoryFilter.value = null
  })

  const toBannerVersion = (value: string) => {
    const parts = value.split('.')
    if (parts.length < 2) return value
    return `${parts[0]}.${parts[1]}`
  }
  const matchesVersionFilter = (version: string, filter: string) => {
    const normalizedVersion = toBannerVersion(version)
    const majorMatch = filter.match(majorVersionFilterPattern)

    if (majorMatch) {
      return normalizedVersion.startsWith(`${Number(majorMatch[1])}.`)
    }

    return normalizedVersion === filter
  }

  const loadBannerEntries = async (): Promise<TierDataPayload> => {
    let banners = Object.values(BANNER_DATA).filter(
      (banner) => banner.bannerType !== 1
    )

    if (bannerQualityFilter.value !== null) {
      banners = banners.filter((banner) =>
        bannerQualityFilter.value === 5
          ? banner.bannerType === 2
          : banner.bannerType === 3
      )
    }

    if (versionFilter.value) {
      const selectedVersion = versionFilter.value
      banners = banners.filter((banner) => {
        const firstRunVersion = banner.runs[0]?.version
        return firstRunVersion
          ? matchesVersionFilter(firstRunVersion, selectedVersion)
          : false
      })
    }

    banners = banners.sort((a, b) => b.bannerId - a.bannerId)

    const entries = banners.map((banner) => {
      const firstRun = banner.runs[0]
      const bannerVersion = firstRun ? toBannerVersion(firstRun.version) : null
      const bannerTypeLabel =
        banner.bannerType === 1
          ? '5★ Permanent'
          : banner.bannerType === 2
            ? '5★ Limited'
            : '4★ Limited'

      return {
        id: String(banner.bannerId),
        numericId: banner.bannerId,
        name: t(`banner.${banner.bannerId}.name`),
        image: getImageSrc('bannerThumb', banner.bannerId),
        quality: banner.bannerType === 3 ? 4 : 5,
        subtitle: bannerVersion
          ? `v${bannerVersion} • ${bannerTypeLabel}`
          : bannerTypeLabel,
      }
    })

    return {
      entries,
      overLimit: false,
    }
  }

  const loadOutfitEntries = async (): Promise<TierDataPayload> => {
    const { data: outfits, total } = await fetchOutfitsPaginated({
      quality: qualityFilter.value,
      version: versionFilter.value,
      style: styleFilter.value,
      label: labelFilter.value,
      source: obtainFilter.value,
      page: 1,
      pageSize: TIER_ENTRY_LIMIT,
    })
    const overLimit = total > TIER_ENTRY_LIMIT

    const entries = outfits.map((outfit) => ({
      id: String(outfit.id),
      numericId: outfit.id,
      name: t(`outfit.${outfit.id}.name`),
      image: getImageSrc('outfit', outfit.id),
      quality: outfit.quality,
    }))

    return {
      entries,
      overLimit,
    }
  }

  const loadItemEntries = async (): Promise<TierDataPayload> => {
    const { data: items, total } = await fetchItemsPaginated({
      quality: qualityFilter.value,
      type: itemTypeFilter.value,
      category: supportsItemSearchCategories.value
        ? itemCategoryFilter.value
        : null,
      subcategory: supportsItemSearchCategories.value
        ? itemSubcategoryFilter.value
        : null,
      version: versionFilter.value,
      style: styleFilter.value,
      label: labelFilter.value,
      source: obtainFilter.value,
      ...activeAdvancedFilters.value,
      page: 1,
      pageSize: TIER_ENTRY_LIMIT,
    })
    const overLimit = total > TIER_ENTRY_LIMIT

    const entries = items.map((item) => ({
      id: String(item.id),
      numericId: item.id,
      name: t(`item.${item.id}.name`),
      image: getImageSrc('item', item.id),
      quality: item.quality,
    }))

    return {
      entries,
      overLimit,
    }
  }

  const dataCacheKey = computed(() => {
    const query = buildTierQuery()
    const serialized = Object.entries(query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    return `tier-data:${locale.value}:${serialized}:limit${TIER_ENTRY_LIMIT}`
  })

  const {
    data: entriesData,
    status: requestStatus,
    error,
    refresh: reloadEntries,
  } = await useAsyncData(
    () => dataCacheKey.value,
    async () => {
      if (mode.value === 'banners') {
        return loadBannerEntries()
      }

      if (mode.value === 'items') {
        return loadItemEntries()
      }

      return loadOutfitEntries()
    },
    {
      default: () => ({
        entries: [],
        overLimit: false,
      }),
      lazy: true,
    }
  )
  const handleReloadEntries = (): void => {
    void reloadEntries()
  }

  const entries = computed(() => entriesData.value?.entries || [])
  const isOverLimit = computed(() => Boolean(entriesData.value?.overLimit))
  const poolCountLabels = computed(() => {
    switch (mode.value) {
      case 'banners':
        return {
          singular: t('common.banner'),
          plural: t('common.banners'),
        }
      case 'outfits':
        return {
          singular: t('common.outfit'),
          plural: t('common.outfits'),
        }
      default:
        return {
          singular: t('common.item'),
          plural: t('common.items'),
        }
    }
  })
  const cardAspectClass = computed(() =>
    mode.value === 'banners' ? 'aspect-[2/1]' : 'aspect-[2/3]'
  )
  const cardGridClass = computed(() =>
    mode.value === 'banners'
      ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1'
      : 'grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 xl:grid-cols-12 gap-1'
  )
  const tierRowClass = computed(() =>
    mode.value === 'banners'
      ? 'p-1.5 min-h-14 sm:min-h-16 lg:min-h-20'
      : 'p-1.5 min-h-20 sm:min-h-24 lg:min-h-28'
  )
  const tierListClass = computed(() =>
    mode.value === 'banners'
      ? 'relative min-h-10 sm:min-h-12 lg:min-h-16'
      : 'relative min-h-16 sm:min-h-20 lg:min-h-24'
  )
  const rankMenuOptions = computed(() => {
    const entryId = rankMenu.entryId
    const selectedEntry = entryId ? entryMap.value.get(entryId) : null
    const selectedPosition = entryId ? findEntryPosition(entryId) : null
    const options: Array<Record<string, unknown>> = []

    if (selectedEntry) {
      options.push({
        key: 'open-page',
        label: () =>
          h(
            'div',
            {
              class: 'inline-flex items-center gap-2 max-w-[300px] text-left',
              title: selectedEntry.name,
            },
            [
              h('span', { class: 'truncate' }, selectedEntry.name),
              h(ExternalLinkAlt, { class: 'w-3 h-3 shrink-0' }),
            ]
          ),
      })

      if (showCommunityInsightPanel.value) {
        const communityRankLabel = getCommunityRankLabel(selectedEntry.id)
        const communityAverageTierLabel = getCommunityAverageTierLabel(
          selectedEntry.id
        )
        const communityHigherThanLabel = getCommunityHigherThanLabel(
          selectedEntry.id
        )
        const communityInsightLabels = [
          communityRankLabel,
          communityAverageTierLabel,
          communityHigherThanLabel,
        ].filter((label): label is string => Boolean(label))

        if (communityInsightLabels.length > 0) {
          options.push({
            key: 'community-insights-divider',
            type: 'divider',
          })

          communityInsightLabels.forEach((label, index) => {
            options.push({
              key: `community-insight-${index}`,
              label,
              disabled: true,
            })
          })
        }
      }
    }

    options.push({
      key: 'tier-actions-divider',
      type: 'divider',
    })

    tierKeys.forEach((tier) => {
      options.push({
        label: t('tierlist.rank_menu.tier_label', { tier }),
        key: tier,
        disabled: selectedPosition?.target === tier,
      })
    })

    if (selectedPosition && selectedPosition.target !== UNRANKED_TARGET) {
      options.push({
        key: 'send-back-divider',
        type: 'divider',
      })
      options.push({
        key: 'send-back',
        label: t('tierlist.rank_menu.send_back'),
      })
    }

    return options
  })

  const createEmptyTierBoard = (): Record<TierKey, string[]> => ({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  })
  const createEmptyCommunityTierPreviewBoard = (): Record<
    TierKey,
    CommunityTierPreviewEntry[]
  > => ({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  })

  const createDefaultTierLabels = (): Record<TierKey, string> => ({
    S: 'S',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    F: 'F',
  })

  const buildTierLabelsPayload = (): Record<TierKey, string> => {
    const payload = createDefaultTierLabels()
    tierKeys.forEach((tierKey) => {
      const value = tierLabels.value[tierKey].trim()
      payload[tierKey] = value || tierKey
    })
    return payload
  }

  const normalizeStoredTimestamp = (value: unknown): number | null => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      return null
    return Math.trunc(value)
  }

  const tiers = ref<Record<TierKey, string[]>>(createEmptyTierBoard())
  const tierLabels = ref<Record<TierKey, string>>(createDefaultTierLabels())
  const unranked = ref<string[]>([])
  const exporting = ref(false)
  const submittingCommunity = ref(false)
  const lastSubmittedAt = ref<number | null>(null)
  const lastModifiedAt = ref<number | null>(null)
  const highlightCommunitySubmitButton = ref(false)
  const suppressBoardAutoSave = ref(false)
  const hydratingBoard = ref(false)
  const hasHydratedBoard = ref(false)
  const boardLoading = computed(
    () =>
      !error.value &&
      !isOverLimit.value &&
      (requestStatus.value === 'idle' ||
        requestStatus.value === 'pending' ||
        !hasHydratedBoard.value ||
        hydratingBoard.value)
  )
  const tierListRefs = ref<Partial<Record<TierKey, HTMLElement>>>({})
  const unrankedListRef = ref<HTMLElement | null>(null)
  let stopSortables: (() => void)[] = []
  const rankMenu = reactive({
    show: false,
    x: 0,
    y: 0,
    entryId: null as string | null,
  })

  const updateTierLabel = (tier: TierKey, value: string) => {
    tierLabels.value[tier] = value
      .replace(/\s+/g, ' ')
      .slice(0, TIER_LABEL_MAX_LENGTH)
  }

  const normalizeTierLabel = (tier: TierKey) => {
    const value = tierLabels.value[tier].trim()
    tierLabels.value[tier] = value || tier
  }

  const entryMap = computed(() => {
    const map = new Map<string, TierEntry>()
    entries.value.forEach((entry) => {
      map.set(entry.id, entry)
    })
    return map
  })
  const entryOrderById = computed(() => {
    const map = new Map<string, number>()
    entries.value.forEach((entry, index) => {
      map.set(entry.id, index)
    })
    return map
  })

  const tieredEntries = computed(() => {
    const map = entryMap.value
    return {
      S: tiers.value.S.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
      A: tiers.value.A.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
      B: tiers.value.B.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
      C: tiers.value.C.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
      D: tiers.value.D.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
      F: tiers.value.F.map((id) => map.get(id)).filter(
        (entry): entry is TierEntry => Boolean(entry)
      ),
    }
  })

  const resolvedUnrankedEntries = computed(() => {
    const map = entryMap.value
    return unranked.value
      .map((id) => map.get(id))
      .filter((entry): entry is TierEntry => Boolean(entry))
  })
  const poolTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(resolvedUnrankedEntries.value.length / POOL_PAGE_SIZE)
    )
  )
  const normalizedPoolPage = computed(() =>
    Math.min(Math.max(poolPage.value, 1), poolTotalPages.value)
  )
  const poolPageStartIndex = computed(
    () => (normalizedPoolPage.value - 1) * POOL_PAGE_SIZE
  )
  const paginatedUnrankedEntries = computed(() => {
    const start = poolPageStartIndex.value
    return resolvedUnrankedEntries.value.slice(start, start + POOL_PAGE_SIZE)
  })
  const showPoolPagination = computed(
    () => resolvedUnrankedEntries.value.length > POOL_PAGE_SIZE
  )

  watch(poolTotalPages, (nextTotalPages) => {
    if (poolPage.value > nextTotalPages) {
      poolPage.value = nextTotalPages
    }
  })

  const rankedBoardIds = computed(() =>
    tierKeys.flatMap((tierKey) => tiers.value[tierKey])
  )

  const rankedTierByEntryId = computed(() => {
    const map = new Map<string, TierKey>()
    tierKeys.forEach((tierKey) => {
      tiers.value[tierKey].forEach((entryId) => {
        map.set(entryId, tierKey)
      })
    })
    return map
  })

  const {
    aggregateStatus: communityAggregateStatus,
    aggregateError: communityAggregateError,
    fetchAggregateJson,
    getModeSnapshot,
    getEntrySnapshot: getCommunityEntrySnapshot,
    getHigherThanPercent,
  } = useCommunityTierlist()

  const showCommunityInsights = ref(false)
  const isCommunityModeEnabled = computed(
    () =>
      mode.value === 'banners' ||
      mode.value === 'outfits' ||
      mode.value === 'items'
  )
  const showCommunityInsightsAction = computed(
    () =>
      mode.value === 'banners' ||
      (mode.value === 'outfits' && !isOverLimit.value)
  )
  const showCommunityInsightPanel = computed(
    () => showCommunityInsightsAction.value && showCommunityInsights.value
  )
  const communityBoardLoading = computed(
    () =>
      communityAggregateStatus.value === 'idle' ||
      communityAggregateStatus.value === 'pending'
  )
  const loading = computed(() =>
    showCommunityInsightPanel.value
      ? communityBoardLoading.value
      : boardLoading.value
  )

  watch(showCommunityInsightPanel, (shouldShow) => {
    if (!shouldShow) return
    communityPoolPage.value = 1
    void fetchAggregateJson()
  })

  const communityAggregateModeSnapshot = computed(() =>
    getModeSnapshot(mode.value)
  )

  const createEmptyCommunityTierCounts = (): CommunityTierCounts => ({
    S: 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  })

  const getCommunityTierCounts = (entryId: string): CommunityTierCounts => {
    const entry = getCommunityEntrySnapshot(
      communityAggregateModeSnapshot.value,
      entryId
    )
    if (!entry) return createEmptyCommunityTierCounts()

    return {
      S: Math.max(0, Math.floor(entry.tier_counts.S ?? 0)),
      A: Math.max(0, Math.floor(entry.tier_counts.A ?? 0)),
      B: Math.max(0, Math.floor(entry.tier_counts.B ?? 0)),
      C: Math.max(0, Math.floor(entry.tier_counts.C ?? 0)),
      D: Math.max(0, Math.floor(entry.tier_counts.D ?? 0)),
      F: Math.max(0, Math.floor(entry.tier_counts.F ?? 0)),
    }
  }

  const communityModePreview = computed(() =>
    buildCommunityModePreview(
      communityAggregateModeSnapshot.value,
      entries.value.map((entry) => entry.id)
    )
  )
  const communityAggregateRankedEntries = computed(
    () => communityModePreview.value.rankedEntries
  )
  const communityAggregateTierByEntryId = computed(
    () => communityModePreview.value.tierByEntryId
  )
  const communityAggregateRankByEntryId = computed(
    () => communityModePreview.value.rankByEntryId
  )

  const communityAggregateTieredEntries = computed(() => {
    const grouped = createEmptyCommunityTierPreviewBoard()

    communityAggregateRankedEntries.value.forEach((entry) => {
      const resolvedEntry = entryMap.value.get(entry.entryId)
      if (!resolvedEntry) return

      grouped[entry.tier].push({
        ...resolvedEntry,
        communityRank: entry.rank,
        communityTier: entry.tier,
        communityVotes: entry.votes,
        communityTierCounts: getCommunityTierCounts(entry.entryId),
        communityHigherThanLabel: getCommunityHigherThanLabel(entry.entryId),
      })
    })

    return grouped
  })

  const communityAggregateUnrankedEntries = computed<
    CommunityUnrankedPreviewEntry[]
  >(() => {
    const voteByEntryId = communityModePreview.value.voteByEntryId
    const map = entryMap.value

    return communityModePreview.value.unrankedEntryIds
      .map((id) => map.get(id))
      .filter((entry): entry is TierEntry => Boolean(entry))
      .map((entry) => ({
        ...entry,
        communityVotes: voteByEntryId.get(entry.id) ?? 0,
        communityTierCounts: getCommunityTierCounts(entry.id),
      }))
  })

  const hasCommunityPreviewEntries = computed(
    () => communityModePreview.value.hasEntries
  )

  const communityPoolTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(communityAggregateUnrankedEntries.value.length / POOL_PAGE_SIZE)
    )
  )
  const normalizedCommunityPoolPage = computed(() =>
    Math.min(
      Math.max(communityPoolPage.value, 1),
      communityPoolTotalPages.value
    )
  )
  const communityPoolPageStartIndex = computed(
    () => (normalizedCommunityPoolPage.value - 1) * POOL_PAGE_SIZE
  )
  const communityPaginatedUnrankedEntries = computed(() => {
    const start = communityPoolPageStartIndex.value
    return communityAggregateUnrankedEntries.value.slice(
      start,
      start + POOL_PAGE_SIZE
    )
  })
  const showCommunityPoolPagination = computed(
    () => communityAggregateUnrankedEntries.value.length > POOL_PAGE_SIZE
  )

  watch(communityPoolTotalPages, (nextTotalPages) => {
    if (communityPoolPage.value > nextTotalPages) {
      communityPoolPage.value = nextTotalPages
    }
  })

  const communityVoteFormatter = computed(
    () => new Intl.NumberFormat(locale.value)
  )

  const formatCommunityVoteCount = (count: number): string =>
    communityVoteFormatter.value.format(Math.max(0, Math.floor(count)))

  const COMMUNITY_BAR_PERCENT_WEIGHT = 0.75

  const getCommunityTierCount = (
    tierCounts: CommunityTierCounts,
    tierKey: TierKey
  ): number => Math.max(0, Math.floor(tierCounts[tierKey]))

  const getCommunityTierShare = (
    tierCounts: CommunityTierCounts,
    tierKey: TierKey
  ): number => {
    const count = getCommunityTierCount(tierCounts, tierKey)
    let total = 0
    let peak = 0

    tierKeys.forEach((key) => {
      const value = getCommunityTierCount(tierCounts, key)
      total += value
      peak = Math.max(peak, value)
    })

    if (count <= 0 || total <= 0 || peak <= 0) return 0

    const blendedRatio =
      (count / total) * COMMUNITY_BAR_PERCENT_WEIGHT +
      (count / peak) * (1 - COMMUNITY_BAR_PERCENT_WEIGHT)

    return blendedRatio * 100
  }

  const getCommunityTierSegmentStyle = (
    tierCounts: CommunityTierCounts,
    tierKey: TierKey
  ) => ({
    width: `${getCommunityTierShare(tierCounts, tierKey)}%`,
    backgroundColor: tierColorByKey[tierKey],
    opacity: getCommunityTierCount(tierCounts, tierKey) > 0 ? 1 : 0.25,
  })

  const getCommunityRankLabel = (entryId: string): string | null => {
    const rank = communityAggregateRankByEntryId.value.get(entryId)
    if (!rank) return null
    return t('tierlist.community_insights.rank_position', { rank })
  }

  const getCommunityAverageTierLabel = (entryId: string): string | null => {
    const tier = communityAggregateTierByEntryId.value.get(entryId)
    if (!tier) return null

    return t('tierlist.community_insights.avg_tier', {
      tier,
    })
  }

  const getCommunityHigherThanLabel = (entryId: string): string | null => {
    const entry = getCommunityEntrySnapshot(
      communityAggregateModeSnapshot.value,
      entryId
    )
    if (!entry) return null
    if (!hasEnoughCommunityVotes(entry.votes)) return null

    const userTier = rankedTierByEntryId.value.get(entryId) ?? null
    const higherThanPercent = getHigherThanPercent(entry, userTier)
    if (higherThanPercent === null) return null

    return t('tierlist.community_insights.rank_higher_than', {
      percent: higherThanPercent,
    })
  }

  const communityScope = computed(() =>
    resolveCommunityScopeFromTierlistFilters({
      mode: mode.value,
      bannerQualityFilter: bannerQualityFilter.value,
      qualityFilter: qualityFilter.value,
      itemTypeFilter: itemTypeFilter.value,
      versionFilter: versionFilter.value,
      styleFilter: styleFilter.value,
      labelFilter: labelFilter.value,
      obtainFilter: obtainFilter.value,
    })
  )

  const isCommunityScopeEligible = computed(() => communityScope.value !== null)

  const hasCompleteCommunityRanking = computed(() => {
    if (!isCommunityScopeEligible.value) return false
    if (entries.value.length === 0) return false
    if (resolvedUnrankedEntries.value.length > 0) return false

    const rankedIds = rankedBoardIds.value
    if (rankedIds.length !== entries.value.length) return false

    const rankedSet = new Set(rankedIds)
    if (rankedSet.size !== rankedIds.length) return false

    const entrySet = new Set(entries.value.map((entry) => entry.id))
    return rankedIds.every((id) => entrySet.has(id))
  })

  const showCommunitySubmitAction = computed(() => isCommunityModeEnabled.value)
  const hasFragmentedCommunityScope = computed(
    () =>
      mode.value === 'items' &&
      (itemCategoryFilter.value !== null ||
        itemSubcategoryFilter.value !== null ||
        activeAdvancedFilterCount.value > 0)
  )

  type CommunitySubmitBlockState =
    | 'disabled'
    | 'loading'
    | 'error'
    | 'over_limit'
    | 'scope_unavailable'
    | 'filtered_items_only'
    | 'incomplete'
    | 'no_changes'
    | 'ready'

  const hasChangesSinceLastSubmit = computed(() => {
    if (lastSubmittedAt.value === null) return true
    if (lastModifiedAt.value === null) return false
    return lastModifiedAt.value > lastSubmittedAt.value
  })

  const communitySubmitBlockState = computed<CommunitySubmitBlockState>(() => {
    if (!showCommunitySubmitAction.value) return 'disabled'
    if (boardLoading.value) return 'loading'
    if (error.value) return 'error'
    if (isOverLimit.value) return 'over_limit'
    if (!isCommunityScopeEligible.value) return 'scope_unavailable'
    if (hasFragmentedCommunityScope.value) return 'filtered_items_only'
    if (!hasCompleteCommunityRanking.value) return 'incomplete'
    if (!hasChangesSinceLastSubmit.value) return 'no_changes'
    return 'ready'
  })

  const communitySubmitBlockedReason = computed(() => {
    switch (communitySubmitBlockState.value) {
      case 'disabled':
        return t('tierlist.community_submit.blocked.scope_unavailable')
      case 'loading':
        return t('common.loading')
      case 'error':
        return t('tierlist.community_submit.blocked.error')
      case 'over_limit':
        return t('tierlist.community_submit.blocked.over_limit')
      case 'scope_unavailable':
        return t('tierlist.community_submit.blocked.scope_unavailable')
      case 'filtered_items_only':
        return t('tierlist.community_submit.blocked.filtered_items_only')
      case 'incomplete':
        return t('tierlist.community_submit.blocked.incomplete')
      case 'no_changes':
        return t('tierlist.community_submit.blocked.no_changes')
      case 'ready':
      default:
        return null
    }
  })

  const communitySubmitTooltipText = computed(() => {
    if (communitySubmitBlockState.value === 'no_changes') {
      return t('tierlist.community_submit.blocked.no_changes')
    }

    return (
      communitySubmitBlockedReason.value ??
      t('tierlist.community_submit.tooltip_ready')
    )
  })

  const canSubmitCommunity = computed(
    () =>
      !submittingCommunity.value &&
      showCommunitySubmitAction.value &&
      communitySubmitBlockState.value === 'ready'
  )
  const shouldHighlightCommunitySubmitButton = computed(
    () => canSubmitCommunity.value && highlightCommunitySubmitButton.value
  )
  let communitySubmitHighlightTimer: number | null = null

  const startCommunitySubmitHighlight = () => {
    if (!import.meta.client) return

    highlightCommunitySubmitButton.value = true

    if (communitySubmitHighlightTimer !== null) {
      window.clearTimeout(communitySubmitHighlightTimer)
    }

    communitySubmitHighlightTimer = window.setTimeout(() => {
      highlightCommunitySubmitButton.value = false
      communitySubmitHighlightTimer = null
    }, 10_000)
  }

  const tierlistStorageKey = computed(() => {
    const query = buildTierQuery()
    const serialized = Object.entries(query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    return `${TIERLIST_STORAGE_PREFIX}:${serialized}`
  })

  const saveBoard = async (options: { markModified?: boolean } = {}) => {
    if (!import.meta.client || hydratingBoard.value) return
    const { markModified = false } = options

    const tiersPayload: Record<TierKey, string[]> = {
      S: [...tiers.value.S],
      A: [...tiers.value.A],
      B: [...tiers.value.B],
      C: [...tiers.value.C],
      D: [...tiers.value.D],
      F: [...tiers.value.F],
    }
    const labelsPayload = buildTierLabelsPayload()
    const resolvedLastModifiedAt = markModified
      ? Date.now()
      : lastModifiedAt.value

    try {
      if (markModified) {
        lastModifiedAt.value = resolvedLastModifiedAt
      }
      await saveTierlist(tierlistStorageKey.value, {
        tiers: tiersPayload,
        labels: labelsPayload,
        lastSubmittedAt: lastSubmittedAt.value,
        lastModifiedAt: resolvedLastModifiedAt,
      })
    } catch (error) {
      console.error('Failed to save tierlist:', error)
    }
  }

  let hydrateToken = 0

  const hydrateBoard = async () => {
    const currentHydrateToken = ++hydrateToken
    hydratingBoard.value = true
    hasHydratedBoard.value = false
    const ids = entries.value.map((entry) => entry.id)
    const validIds = new Set(ids)
    const contextKey = tierlistStorageKey.value
    let didHydrate = false

    let saved: SavedTierlist | null = null
    try {
      const loaded = await loadTierlist(contextKey)
      saved = loaded
        ? {
            tiers: loaded.tiers,
            labels: loaded.labels,
            lastSubmittedAt: normalizeStoredTimestamp(loaded.lastSubmittedAt),
            lastModifiedAt: normalizeStoredTimestamp(loaded.lastModifiedAt),
          }
        : null
    } catch (error) {
      console.error('Failed to load tierlist:', error)
    }

    try {
      if (currentHydrateToken !== hydrateToken) return
      if (contextKey !== tierlistStorageKey.value) return

      const nextTiers = createEmptyTierBoard()
      const nextTierLabels = createDefaultTierLabels()
      const used = new Set<string>()

      if (saved?.tiers) {
        tierKeys.forEach((tierKey) => {
          const sourceIds = saved.tiers?.[tierKey] || []
          nextTiers[tierKey] = sourceIds.filter((id) => {
            if (!validIds.has(id) || used.has(id)) return false
            used.add(id)
            return true
          })
        })
      }
      if (saved?.labels) {
        tierKeys.forEach((tierKey) => {
          const label = saved.labels?.[tierKey]?.trim()
          if (!label) return
          nextTierLabels[tierKey] = label
        })
      }

      const nextUnranked = ids.filter((id) => !used.has(id))

      tiers.value = nextTiers
      tierLabels.value = nextTierLabels
      unranked.value = nextUnranked
      lastSubmittedAt.value = saved?.lastSubmittedAt ?? null
      lastModifiedAt.value = saved?.lastModifiedAt ?? null
      await nextTick()
      didHydrate = true
    } finally {
      if (currentHydrateToken === hydrateToken) {
        hydratingBoard.value = false
        if (didHydrate) {
          hasHydratedBoard.value = true
        }
      }
    }
  }

  const setTierListRef = (tier: TierKey, element: HTMLElement | null) => {
    if (!element) {
      tierListRefs.value[tier] = undefined
      return
    }
    tierListRefs.value[tier] = element
  }

  const findEntryPosition = (
    id: string
  ): { target: TierTarget; index: number } | null => {
    for (const tierKey of tierKeys) {
      const index = tiers.value[tierKey].indexOf(id)
      if (index >= 0) {
        return { target: tierKey, index }
      }
    }

    const unrankedIndex = unranked.value.indexOf(id)
    if (unrankedIndex >= 0) {
      return { target: UNRANKED_TARGET, index: unrankedIndex }
    }

    return null
  }

  const getDefaultUnrankedInsertIndex = (id: string): number => {
    const orderMap = entryOrderById.value
    const idOrder = orderMap.get(id) ?? Number.MAX_SAFE_INTEGER
    const index = unranked.value.findIndex((candidateId) => {
      const candidateOrder =
        orderMap.get(candidateId) ?? Number.MAX_SAFE_INTEGER
      return candidateOrder > idOrder
    })

    return index >= 0 ? index : unranked.value.length
  }

  const removeEntryFromBoard = (id: string) => {
    tierKeys.forEach((tierKey) => {
      const index = tiers.value[tierKey].indexOf(id)
      if (index >= 0) {
        tiers.value[tierKey].splice(index, 1)
      }
    })

    const unrankedIndex = unranked.value.indexOf(id)
    if (unrankedIndex >= 0) {
      unranked.value.splice(unrankedIndex, 1)
    }
  }

  const moveEntry = (
    id: string,
    target: TierTarget,
    insertIndex?: number | null
  ) => {
    if (!entryMap.value.has(id)) return

    const source = findEntryPosition(id)
    let nextIndex = typeof insertIndex === 'number' ? insertIndex : null
    if (
      nextIndex !== null &&
      source?.target === target &&
      source.index < nextIndex
    ) {
      nextIndex -= 1
    }

    if (
      target === UNRANKED_TARGET &&
      source?.target === UNRANKED_TARGET &&
      nextIndex === null
    ) {
      return
    }

    removeEntryFromBoard(id)

    if (target === UNRANKED_TARGET) {
      if (nextIndex === null) {
        const defaultIndex = getDefaultUnrankedInsertIndex(id)
        unranked.value.splice(defaultIndex, 0, id)
        return
      }

      const clampedIndex = Math.max(
        0,
        Math.min(nextIndex, unranked.value.length)
      )
      unranked.value.splice(clampedIndex, 0, id)
      return
    }

    if (nextIndex === null) {
      tiers.value[target].push(id)
      return
    }

    const clampedIndex = Math.max(
      0,
      Math.min(nextIndex, tiers.value[target].length)
    )
    tiers.value[target].splice(clampedIndex, 0, id)
  }

  const openRankContextMenu = (id: string, event: MouseEvent) => {
    if (event.type === 'contextmenu') {
      event.preventDefault()
    }
    event.stopPropagation()
    if (!entryMap.value.has(id)) return

    rankMenu.entryId = id
    rankMenu.x = event.clientX
    rankMenu.y = event.clientY
    rankMenu.show = true
  }

  const openEntryPage = (id: string) => {
    if (!import.meta.client) return

    const entry = entryMap.value.get(id)
    if (!entry) return

    let path = `/items/${entry.numericId}`
    if (mode.value === 'banners') {
      path = `/banners/${entry.numericId}`
    } else if (mode.value === 'outfits') {
      path = `/outfits/${entry.numericId}`
    }

    window.open(localePath(path), '_blank', 'noopener,noreferrer')
  }

  const closeRankContextMenu = () => {
    rankMenu.show = false
    rankMenu.entryId = null
  }

  const handleRankMenuSelect = (key: string | number) => {
    if (!rankMenu.entryId || typeof key !== 'string') {
      closeRankContextMenu()
      return
    }

    const selectedEntryId = rankMenu.entryId

    if (key === 'open-page') {
      void openEntryPage(selectedEntryId)
      closeRankContextMenu()
      return
    }

    if (key === 'send-back') {
      moveEntry(selectedEntryId, UNRANKED_TARGET)
      closeRankContextMenu()
      return
    }

    if ((tierKeys as readonly string[]).includes(key)) {
      moveEntry(selectedEntryId, key as TierTarget)
    }
    closeRankContextMenu()
  }

  const getQualityOverlayClass = (quality: number | null) => {
    switch (quality) {
      case 5:
        return 'bg-yellow-500/5'
      case 4:
        return 'bg-blue-500/5'
      case 3:
        return 'bg-green-500/5'
      case 2:
        return 'bg-gray-500/10'
      default:
        return 'bg-black/5'
    }
  }

  type SortableListKey = TierKey | typeof UNRANKED_TARGET

  const tierIdSet = new Set<string>(tierKeys)
  const isTierKey = (value: string): value is TierKey => tierIdSet.has(value)

  const resolveSortableListKey = (
    element: HTMLElement | null | undefined
  ): SortableListKey | null => {
    const listElement = element?.closest(
      '[data-list-key]'
    ) as HTMLElement | null
    const value = listElement?.dataset.listKey
    if (!value) return null
    if (value === UNRANKED_TARGET) return UNRANKED_TARGET
    return isTierKey(value) ? value : null
  }

  const getListByKey = (key: SortableListKey) =>
    key === UNRANKED_TARGET ? unranked.value : tiers.value[key]

  const getUnrankedInsertIndexFromPageIndex = (pageIndex: number): number => {
    const absoluteIndex = poolPageStartIndex.value + pageIndex
    return Math.max(0, Math.min(absoluteIndex, unranked.value.length))
  }

  const applySortableMove = (
    id: string,
    source: SortableListKey,
    target: SortableListKey,
    rawInsertIndex: number
  ) => {
    if (!entryMap.value.has(id)) return

    if (source === target) {
      const sourceList = getListByKey(source)
      const currentIndex = sourceList.indexOf(id)
      if (currentIndex < 0) return

      const nextIndex = Math.max(
        0,
        Math.min(rawInsertIndex, sourceList.length - 1)
      )
      if (currentIndex === nextIndex) return

      const [movedId] = sourceList.splice(currentIndex, 1)
      if (!movedId) return
      sourceList.splice(nextIndex, 0, movedId)
      return
    }

    if (target === UNRANKED_TARGET) {
      moveEntry(id, UNRANKED_TARGET, rawInsertIndex)
      return
    }

    moveEntry(id, target, rawInsertIndex)
  }

  const onSortableAdd = (target: SortableListKey, event: SortableEvent) => {
    const element = event.item as HTMLElement | null
    const id = element?.dataset.entryId
    if (!id) return

    const source = resolveSortableListKey(event.from as HTMLElement | null)
    if (!source) return

    const pageOrListIndex =
      typeof event.newIndex === 'number'
        ? event.newIndex
        : target === UNRANKED_TARGET
          ? paginatedUnrankedEntries.value.length
          : getListByKey(target).length

    const insertIndex =
      target === UNRANKED_TARGET
        ? getUnrankedInsertIndexFromPageIndex(pageOrListIndex)
        : pageOrListIndex

    applySortableMove(id, source, target, insertIndex)
  }

  const onSortableUpdate = (target: SortableListKey, event: SortableEvent) => {
    const element = event.item as HTMLElement | null
    const id = element?.dataset.entryId
    if (!id) return

    const toIndex = event.newIndex
    if (typeof toIndex !== 'number') return

    const resolvedToIndex =
      target === UNRANKED_TARGET
        ? getUnrankedInsertIndexFromPageIndex(toIndex)
        : toIndex

    applySortableMove(id, target, target, resolvedToIndex)
  }

  const buildSortableOptions = (
    target: SortableListKey,
    allowSortWithinList: boolean
  ): UseSortableOptions => ({
    group: 'tier-board',
    animation: 150,
    sort: allowSortWithinList,
    forceFallback: true,
    scroll: false,
    emptyInsertThreshold: 24,
    draggable: '[data-entry-id]',
    delay: 80,
    delayOnTouchOnly: true,
    fallbackOnBody: true,
    ghostClass: 'opacity-40',
    dragClass: 'opacity-90',
    onStart: closeRankContextMenu,
    onAdd: (event) => onSortableAdd(target, event),
    onUpdate: (event) => onSortableUpdate(target, event),
  })

  const stopSortableInstances = () => {
    stopSortables.forEach((stop) => stop())
    stopSortables = []
  }

  const initSortableInstances = () => {
    if (!import.meta.client) return

    stopSortableInstances()

    tierKeys.forEach((tier) => {
      const element = tierListRefs.value[tier]
      if (!element) return
      const controls = useSortable(
        element,
        computed({
          get: () => tiers.value[tier],
          set: (value) => {
            tiers.value[tier] = value
          },
        }),
        buildSortableOptions(tier, true)
      )
      stopSortables.push(controls.stop)
    })

    if (unrankedListRef.value) {
      const controls = useSortable(
        unrankedListRef,
        unranked,
        buildSortableOptions(UNRANKED_TARGET, true)
      )
      stopSortables.push(controls.stop)
    }
  }

  const resetTierBoard = async () => {
    if (!import.meta.client) return

    const contextKey = tierlistStorageKey.value
    suppressBoardAutoSave.value = true
    tiers.value = createEmptyTierBoard()
    unranked.value = entries.value.map((entry) => entry.id)
    lastSubmittedAt.value = null
    lastModifiedAt.value = null

    try {
      await deleteTierlist(contextKey)
    } catch (error) {
      console.error('Failed to delete tierlist from IndexedDB:', error)
    } finally {
      suppressBoardAutoSave.value = false
    }
  }

  const clearFilters = () => {
    qualityFilter.value = null
    itemTypeFilter.value = null
    itemCategoryFilter.value = null
    itemSubcategoryFilter.value = null
    bannerQualityFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    obtainFilter.value = null
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
  }

  watch(
    [boardLoading, isOverLimit, error, entries, showCommunityInsightPanel],
    async () => {
      if (!import.meta.client) return
      if (
        boardLoading.value ||
        isOverLimit.value ||
        error.value ||
        showCommunityInsightPanel.value
      ) {
        stopSortableInstances()
        return
      }

      await nextTick()
      initSortableInstances()
    }
  )

  onMounted(() => {
    if (!import.meta.client) return

    watch(
      requestStatus,
      (status) => {
        if (status === 'idle' || status === 'pending') {
          hasHydratedBoard.value = false
        }
      },
      { immediate: true }
    )

    watch(
      [entries, requestStatus, isOverLimit, error, tierlistStorageKey],
      () => {
        if (
          requestStatus.value === 'idle' ||
          requestStatus.value === 'pending' ||
          isOverLimit.value ||
          error.value
        )
          return
        void hydrateBoard()
      },
      { immediate: true }
    )

    watch(
      tiers,
      () => {
        if (boardLoading.value || suppressBoardAutoSave.value) return
        void saveBoard({ markModified: true })
      },
      { deep: true }
    )

    watch(
      tierLabels,
      () => {
        if (boardLoading.value || suppressBoardAutoSave.value) return
        void saveBoard({ markModified: true })
      },
      { deep: true }
    )

    watch(communitySubmitBlockState, (nextState, previousState) => {
      if (nextState !== 'ready') {
        highlightCommunitySubmitButton.value = false
        if (communitySubmitHighlightTimer !== null) {
          window.clearTimeout(communitySubmitHighlightTimer)
          communitySubmitHighlightTimer = null
        }
        return
      }

      if (previousState !== 'incomplete') return
      if (lastSubmittedAt.value !== null) return
      startCommunitySubmitHighlight()
    })

    if (
      !boardLoading.value &&
      !isOverLimit.value &&
      !error.value &&
      !showCommunityInsightPanel.value
    ) {
      void nextTick().then(() => {
        initSortableInstances()
      })
    }
  })

  onBeforeUnmount(() => {
    if (communitySubmitHighlightTimer !== null) {
      window.clearTimeout(communitySubmitHighlightTimer)
      communitySubmitHighlightTimer = null
    }
    stopSortableInstances()
  })

  const buildCommunityTierPayload = (): Record<TierKey, string[]> => ({
    S: [...tiers.value.S],
    A: [...tiers.value.A],
    B: [...tiers.value.B],
    C: [...tiers.value.C],
    D: [...tiers.value.D],
    F: [...tiers.value.F],
  })

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (!error || typeof error !== 'object') return fallback

    const normalized = error as {
      data?: { message?: string }
      statusMessage?: string
      message?: string
    }

    if (normalized.data?.message) return normalized.data.message
    if (normalized.statusMessage) return normalized.statusMessage
    if (normalized.message) return normalized.message

    return fallback
  }

  const submitCommunityTierlist = async () => {
    if (!import.meta.client || submittingCommunity.value) return

    const blockedReason = communitySubmitBlockedReason.value
    if (blockedReason) {
      message.warning(blockedReason)
      return
    }

    submittingCommunity.value = true
    closeRankContextMenu()

    try {
      const scope = communityScope.value
      if (!scope) {
        message.warning(t('tierlist.community_submit.scope_unavailable_toast'))
        return
      }

      if (!isFingerprintInitialized.value) {
        await initVoterFingerprint()
      }

      const fingerprint = voterFingerprint.value
      if (!fingerprint || isFingerprintFallback.value) {
        return
      }

      const tiersPayload = buildCommunityTierPayload()

      await $fetch('/api/tierlist', {
        method: 'POST',
        body: {
          scope_type: scope.scopeType,
          scope_filters: scope.scopeFilters,
          voter_fingerprint: fingerprint,
          tiers_json: tiersPayload,
        },
      })

      const submittedAt = Date.now()
      lastSubmittedAt.value = submittedAt
      if (lastModifiedAt.value === null) {
        lastModifiedAt.value = submittedAt
      }
      await saveBoard()
      message.success(t('tierlist.community_submit.success'))
    } catch (error) {
      console.error('Failed to submit community tier list:', error)
      message.error(
        extractErrorMessage(error, t('tierlist.community_submit.failed'))
      )
    } finally {
      submittingCommunity.value = false
    }
  }

  const exportPNG = async () => {
    if (
      !import.meta.client ||
      exporting.value ||
      showCommunityInsightPanel.value
    )
      return
    message.info(t('tracker.export.in_progress'))
    exporting.value = true
    closeRankContextMenu()

    try {
      await nextTick()

      const tierlistElement = document.querySelector(
        '.png-export-container'
      ) as HTMLElement | null
      if (!tierlistElement) {
        throw new Error('Tierlist element not found')
      }

      const fileName = `gongeous-tierlist-${
        new Date().toISOString().split('T')[0]
      }.png`
      await exportToPng(tierlistElement, fileName)

      message.success(t('tracker.export.success'))
    } catch (error) {
      console.error('Tierlist export failed:', error)
      message.error(t('tracker.export.error'))
    } finally {
      exporting.value = false
    }
  }

  const copyShareLink = async () => {
    if (!import.meta.client) return

    const url = new URL(window.location.href)
    url.hash = ''

    try {
      await navigator.clipboard.writeText(url.toString())
      message.success(t('tierlist.share.copied'))
    } catch {
      message.error(t('tierlist.share.copy_failed'))
    }
  }
</script>
