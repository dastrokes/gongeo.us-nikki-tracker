<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Hero / Search Header -->
    <div
      :class="[
        'z-10 flex w-full flex-col',
        hasSearched
          ? 'items-start pt-6 pb-6 sm:pt-8 sm:pb-8 md:pt-10'
          : 'flex-1 items-center justify-center pt-20 pb-28 sm:pt-28 sm:pb-32 md:pt-32',
      ]"
    >
      <div
        :class="[
          'w-full',
          hasSearched
            ? 'flex max-w-full flex-col items-center justify-between gap-4 text-left xl:flex-row'
            : 'max-w-2xl text-center',
        ]"
      >
        <div :class="[hasSearched ? 'shrink-0' : 'mb-9 sm:mb-10']">
          <h1
            :class="[
              'bg-linear-to-br from-[#c084fc] via-[#f472b6] to-[#fb923c] bg-clip-text font-black text-transparent drop-shadow-xs',
              hasSearched
                ? 'cursor-pointer text-2xl opacity-95 sm:text-3xl'
                : 'text-5xl sm:text-7xl',
            ]"
            :role="hasSearched ? 'button' : undefined"
            :tabindex="hasSearched ? 0 : undefined"
            @click="hasSearched && clearSearch()"
            @keydown.enter="hasSearched && clearSearch()"
          >
            {{ pageHeading }}
          </h1>
        </div>

        <div :class="['w-full max-w-2xl xl:shrink-0']">
          <form
            class="group relative flex flex-col gap-6"
            @submit.prevent="handlePrimarySubmit"
          >
            <div class="relative min-w-0 flex-1">
              <div
                class="absolute -inset-0.5 rounded-full bg-linear-to-r from-rose-400 via-fuchsia-500 to-amber-500 opacity-20 blur-sm group-focus-within:opacity-45 group-hover:opacity-35"
              ></div>
              <div
                class="relative flex h-14 items-center overflow-hidden rounded-full bg-white text-base shadow-md ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-rose-400/60 sm:h-16 sm:text-lg dark:bg-slate-900 dark:ring-white/10"
              >
                <n-icon
                  class="mr-3 ml-5 text-rose-400 sm:ml-6"
                  size="20"
                  ><Search
                /></n-icon>
                <n-tag
                  v-if="activeSimilarItemId !== null"
                  size="small"
                  round
                  :bordered="false"
                  type="info"
                  class="mr-2 shrink-0 font-bold"
                >
                  {{ t('search_page.similar_prefix') }}
                </n-tag>
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="currentPlaceholder"
                  :aria-label="t('search_page.title')"
                  enterkeyhint="search"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  class="w-full min-w-0 border-none bg-transparent py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden sm:py-4 dark:text-slate-200 dark:placeholder-slate-500"
                  @input="handleSearchInput"
                  @keydown.esc.prevent="clearSearchQuery"
                />
                <div class="mr-2 flex items-center gap-1 sm:mr-3">
                  <n-badge
                    :value="activeFilterCount"
                    :show="hasActiveFilter"
                    type="error"
                    :offset="[-6, 6]"
                  >
                    <n-button
                      attr-type="button"
                      quaternary
                      circle
                      strong
                      size="medium"
                      class="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-300"
                      :aria-label="t('search_page.filters_action')"
                      @click="openFilterModal"
                    >
                      <template #icon>
                        <n-icon><Filter /></n-icon>
                      </template>
                    </n-button>
                  </n-badge>
                  <n-button
                    v-if="searchQuery"
                    attr-type="button"
                    quaternary
                    circle
                    strong
                    size="medium"
                    class="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                    :aria-label="t('search_page.clear_query')"
                    @click="clearSearchQuery"
                  >
                    <template #icon>
                      <n-icon><Times /></n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
            </div>
            <div
              class="flex flex-wrap justify-center gap-3"
              :class="hasSearched ? 'xl:justify-start' : 'sm:justify-center'"
            >
              <n-button
                type="primary"
                attr-type="submit"
                size="medium"
                class="min-w-34 overflow-hidden rounded-xl px-5 font-bold hover:shadow-md"
                :loading="isRandomMode ? luckyLoading : loading"
              >
                {{
                  isRandomMode
                    ? t('search_page.lucky_action')
                    : t('search_page.title')
                }}
              </n-button>
              <n-button
                secondary
                attr-type="button"
                size="medium"
                class="min-w-34 rounded-xl px-5 font-bold"
                :disabled="loading || luckyLoading"
                :aria-label="
                  isRandomMode
                    ? t('search_page.title')
                    : t('search_page.lucky_action')
                "
                @click="handleSecondaryAction"
              >
                {{
                  isRandomMode
                    ? t('search_page.title')
                    : t('search_page.lucky_action')
                }}
              </n-button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <n-modal
      v-model:show="isFilterModalOpen"
      preset="card"
      :title="t('search_page.filters_title')"
      class="w-[calc(100vw-2rem)] max-w-xl"
    >
      <div class="grid gap-2">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <n-select
            v-model:value="itemTypeFilter"
            :options="itemTypeOptions"
            size="small"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_slot')"
          />
          <div class="max-w-[48vw] min-w-0 overflow-x-auto pb-1 sm:max-w-none">
            <n-button-group class="min-w-max">
              <n-button
                size="small"
                :type="draftQualityFilter === null ? 'primary' : 'default'"
                class="min-w-10"
                @click="setDraftQualityFilter(null)"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="q in [5, 4, 3, 2]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, draftQualityFilter === q)"
                class="min-w-10"
                @click="setDraftQualityFilter(q)"
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
        </div>
        <div class="grid grid-cols-2 gap-3">
          <n-select
            v-model:value="draftVersionFilter"
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            size="small"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />
          <n-select
            v-model:value="draftStyleFilter"
            :options="styleOptions"
            size="small"
            clearable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_style')"
          />
          <n-select
            v-model:value="draftLabelFilter"
            :options="labelOptions"
            size="small"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_label')"
          />
          <n-select
            v-model:value="draftSourceFilter"
            :options="sourceOptions"
            size="small"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_obtain')"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between gap-2">
          <n-button
            attr-type="button"
            size="small"
            :disabled="!hasDraftActiveFilter"
            @click="clearFilters"
          >
            {{ t('common.clear') }}
          </n-button>
          <n-button
            type="primary"
            attr-type="button"
            size="small"
            @click.stop.prevent="applyFilters"
          >
            {{ t('common.apply') }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Error State -->
    <div
      v-if="error"
      class="animate-fade-in w-full"
    >
      <n-alert
        type="error"
        :title="t('common.error')"
        :show-icon="true"
        class="rounded-xl shadow-xs"
      >
        {{ error }}
      </n-alert>
    </div>

    <!-- Main Content Area -->
    <div
      v-if="
        mode === 'search' &&
        hasSearched &&
        !error &&
        !(showLuckyModal && isDesktopDetails)
      "
      class="animate-fade-in grid flex-1 gap-4 transition-all duration-500 xl:grid-cols-[minmax(0,1fr)_340px]"
    >
      <!-- Results Grid -->
      <div class="gap-4">
        <div
          v-if="loading"
          class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6"
        >
          <div
            v-for="i in 12"
            :key="`search-skeleton-${i}`"
            class="aspect-2/3 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/50 dark:border-slate-800 dark:bg-slate-800/50"
          />
        </div>

        <div
          v-else-if="hasResults"
          class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6"
        >
          <button
            v-for="(item, index) in displayResults"
            :key="item.id"
            type="button"
            class="group animate-fade-in-up relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left transition-all duration-300 focus:ring-2 focus:ring-rose-400 focus:outline-hidden dark:border-slate-800/80 dark:bg-slate-900"
            :style="{ animationDelay: `${Math.min(index, 15) * 0.05}s` }"
            :aria-label="item.itemName"
            :aria-pressed="item.id === selectedId"
            :class="[
              item.id === selectedId
                ? 'shadow-lg ring-2 shadow-rose-500/20 ring-rose-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950'
                : '',
            ]"
            @click="setSelected(item.id)"
          >
            <!-- Image Area -->
            <div
              class="relative aspect-2/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-950"
            >
              <NuxtImg
                v-if="item.imageSrc"
                :src="item.imageSrc"
                :alt="item.itemName"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                preset="tallSm"
                fit="cover"
                loading="lazy"
                sizes="100px"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center opacity-30"
              >
                <n-icon size="40"><Box /></n-icon>
              </div>

              <!-- Gradient & Text Bottom Overlay -->
              <div
                class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 pb-3"
              >
                <div
                  class="line-clamp-2 text-sm leading-tight font-bold text-white shadow-black drop-shadow-md"
                >
                  {{ item.itemName }}
                </div>
                <div
                  v-if="item.itemTypeLabel"
                  class="mt-1 text-[9px] font-semibold tracking-widest text-rose-300 uppercase drop-shadow-md"
                >
                  {{ item.itemTypeLabel }}
                </div>
              </div>
            </div>
          </button>
        </div>

        <div
          v-else
          class="flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/60 bg-white/30 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/40"
        >
          <n-icon
            size="48"
            class="mb-4 text-slate-300 dark:text-slate-600"
            ><Ghost
          /></n-icon>
          <div class="text-sm text-slate-500">
            {{ t('search_page.no_matches') }}
          </div>
        </div>
      </div>

      <!-- Side Details Panel -->
      <div
        v-if="hasResults"
        class="hidden xl:block"
      >
        <div class="sticky top-6">
          <n-collapse-transition
            mode="out-in"
            appear
          >
            <div
              v-if="activeResult"
              :key="activeResult.id"
              class="relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-2xl shadow-rose-500/5 backdrop-blur-2xl dark:border-slate-700/50 dark:bg-slate-900/80"
            >
              <!-- Fancy blurred bg graphic -->
              <div
                class="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl"
              ></div>
              <div
                class="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl"
              ></div>

              <div class="relative z-10 w-full">
                <!-- Header Image -->
                <div
                  class="relative flex min-h-120 items-center justify-center overflow-visible border-b border-slate-200/50 bg-slate-100 p-8 dark:border-slate-800/50 dark:bg-slate-950/50"
                >
                  <div
                    class="relative aspect-2/3 w-full max-w-74 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 shadow-rose-950/10 ring-black/5 dark:bg-slate-950 dark:ring-white/10"
                  >
                    <NuxtImg
                      v-if="activeResult.imageSrc"
                      :src="activeResult.imageSrc"
                      class="absolute inset-0 h-full w-full object-cover"
                      preset="tallLg"
                      sizes="200px"
                      fit="cover"
                    />
                    <div
                      v-else
                      class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600"
                    >
                      <n-icon size="56"><Box /></n-icon>
                    </div>
                  </div>
                  <!-- Confidence metric -->
                  <div
                    v-if="isDev"
                    class="absolute right-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/80 px-3 py-1.5 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-950/80"
                  >
                    <div
                      class="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"
                    ></div>
                    <span
                      class="text-xs font-black text-slate-800 dark:text-slate-200"
                    >
                      {{ activeResult.matchScoreLabel }}
                    </span>
                  </div>
                </div>

                <!-- Info Content -->
                <div class="flex w-full flex-col gap-5 p-5">
                  <SearchResultInfo
                    :item-name="activeResult.itemName"
                    :quality="activeResult.quality ?? null"
                    :item-type-label="activeResult.itemTypeLabel"
                    :item-type="activeResult.resolvedItemType"
                    :category-label="activeResult.categoryLabel"
                    :subcategory-label="activeResult.subcategoryLabel"
                    :metadata="activeResult.metadata"
                    :style-key="activeResult.styleKey"
                    :style-label="activeResult.styleLabel"
                    :label-tags="activeResult.labelTags"
                    :version-display="activeResult.versionDisplay"
                    :obtain-label="activeResult.obtainLabel"
                  />

                  <div
                    v-if="activeResult.itemId !== null"
                    class="flex flex-wrap gap-2"
                  >
                    <n-button
                      secondary
                      attr-type="button"
                      size="small"
                      class="rounded-xl font-semibold"
                      @click="findSimilar(activeResult)"
                    >
                      <template #icon>
                        <n-icon><SearchPlus /></n-icon>
                      </template>
                      {{ t('search_page.find_similar') }}
                    </n-button>
                  </div>

                  <div class="flex flex-col gap-3">
                    <div
                      v-if="
                        activeResult.itemId !== null &&
                        activeResult.supportsFeedback
                      "
                      class="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div
                        class="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
                      >
                        {{ t('feedback.current_tags') }}
                      </div>
                      <n-button
                        tertiary
                        size="tiny"
                        @click="openFeedbackModal(activeResult)"
                      >
                        {{ t('feedback.suggest_action') }}
                      </n-button>
                    </div>

                    <AttributeCard
                      :metadata="activeResult.metadata"
                      :item-type="activeResult.resolvedItemType"
                      layout="compact"
                    />
                  </div>
                </div>
              </div>
            </div>
          </n-collapse-transition>
        </div>
      </div>
    </div>

    <!-- Mobile Details Modal -->
    <n-modal
      v-model:show="isMobileModalOpen"
      class="w-[calc(100vw-2rem)] max-w-96 bg-transparent shadow-none"
    >
      <div
        v-if="activeResult"
        class="relative grid h-[calc(100dvh-2rem)] max-h-192 w-full grid-rows-[minmax(0,1fr)] overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/95"
      >
        <div class="absolute top-3 right-3 z-20">
          <n-button
            quaternary
            circle
            strong
            attr-type="button"
            size="small"
            class="bg-white/80 text-slate-600 shadow-md backdrop-blur-sm hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-white"
            :aria-label="t('search_page.close_details')"
            @click="closeMobileModal"
          >
            <template #icon>
              <n-icon><Times /></n-icon>
            </template>
          </n-button>
        </div>

        <!-- Scrollable Content Wrapper -->
        <div class="relative z-10 min-h-0 overflow-hidden">
          <n-scrollbar
            class="h-full"
            content-style="display: flex; flex-direction: column;"
          >
            <!-- Header Image -->
            <div
              class="relative flex min-h-80 shrink-0 items-center justify-center overflow-visible bg-slate-100 p-6 dark:bg-slate-950/50"
            >
              <div
                class="relative aspect-2/3 w-full max-w-[min(62vw,14.5rem)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 shadow-rose-950/10 ring-black/5 dark:bg-slate-950 dark:ring-white/10"
              >
                <NuxtImg
                  v-if="activeResult.imageSrc"
                  :src="activeResult.imageSrc"
                  class="absolute inset-0 h-full w-full object-cover"
                  preset="tallLg"
                  sizes="200px"
                  fit="cover"
                />
                <div
                  v-else
                  class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600"
                >
                  <n-icon size="56"><Box /></n-icon>
                </div>
              </div>
              <div
                v-if="isDev"
                class="absolute right-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/80 px-3 py-1.5 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-950/80"
              >
                <div
                  class="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"
                ></div>
                <span
                  class="text-xs font-black text-slate-800 dark:text-slate-200"
                >
                  {{ activeResult.matchScoreLabel }}
                </span>
              </div>
            </div>

            <!-- Info Content -->
            <div class="flex w-full flex-col gap-5 p-5">
              <SearchResultInfo
                :item-name="activeResult.itemName"
                :quality="activeResult.quality ?? null"
                :item-type-label="activeResult.itemTypeLabel"
                :item-type="activeResult.resolvedItemType"
                :category-label="activeResult.categoryLabel"
                :subcategory-label="activeResult.subcategoryLabel"
                :metadata="activeResult.metadata"
                :style-key="activeResult.styleKey"
                :style-label="activeResult.styleLabel"
                :label-tags="activeResult.labelTags"
                :version-display="activeResult.versionDisplay"
                :obtain-label="activeResult.obtainLabel"
              />

              <div
                v-if="activeResult.itemId !== null"
                class="flex flex-wrap gap-2"
              >
                <n-button
                  secondary
                  attr-type="button"
                  size="small"
                  class="rounded-xl font-semibold"
                  @click="findSimilar(activeResult)"
                >
                  <template #icon>
                    <n-icon><SearchPlus /></n-icon>
                  </template>
                  {{ t('search_page.find_similar') }}
                </n-button>
              </div>

              <div class="flex flex-col gap-3">
                <div
                  v-if="
                    activeResult.itemId !== null &&
                    activeResult.supportsFeedback
                  "
                  class="flex flex-wrap items-center justify-between gap-2"
                >
                  <div
                    class="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
                  >
                    {{ t('feedback.current_tags') }}
                  </div>
                  <n-button
                    tertiary
                    size="tiny"
                    @click="openFeedbackModal(activeResult)"
                  >
                    {{ t('feedback.suggest_action') }}
                  </n-button>
                </div>

                <AttributeCard
                  :metadata="activeResult.metadata"
                  :item-type="activeResult.resolvedItemType"
                  layout="compact"
                />
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>
    </n-modal>

    <FeedbackSubmitModal
      v-if="feedbackModalTarget"
      v-model:show="showFeedbackModal"
      :item-id="feedbackModalTarget.itemId"
      :item-name="feedbackModalTarget.itemName"
      :item-type="feedbackModalTarget.itemType"
      :metadata="feedbackModalTarget.metadata"
    />

    <div
      v-if="showLuckyModal && isDesktopDetails"
      class="animate-fade-in w-full"
    >
      <div
        class="relative mx-auto w-full max-w-3xl"
        role="status"
        aria-live="polite"
      >
        <div class="absolute top-4 right-4 z-20">
          <n-button
            quaternary
            circle
            strong
            attr-type="button"
            size="small"
            class="bg-white/80 text-slate-600 shadow-md backdrop-blur-sm hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-white"
            :disabled="isLuckyAnimating"
            :aria-label="t('search_page.close_details')"
            @click="closeLuckyModal"
          >
            <template #icon>
              <n-icon><Times /></n-icon>
            </template>
          </n-button>
        </div>

        <div
          class="grid overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-2xl lg:h-120 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] dark:bg-slate-900/95"
        >
          <div
            class="relative flex min-h-120 items-center justify-center overflow-visible bg-slate-100 p-8 dark:bg-slate-950/50"
          >
            <div
              class="lucky-reveal-card relative aspect-2/3 w-full max-w-74 origin-[50%_44%] overflow-visible rounded-3xl shadow-2xl ring-1 shadow-rose-950/10 ring-black/5 will-change-[transform,opacity,box-shadow] dark:ring-white/10"
              :class="{
                'lucky-reveal-card--revealed': luckyRevealPhase === 'revealed',
              }"
            >
              <div
                class="lucky-reveal-surface absolute inset-0 overflow-hidden rounded-3xl bg-white dark:bg-slate-950"
                :style="luckyRevealSurfaceStyle"
              >
                <img
                  v-if="
                    luckyRevealPhase === 'revealed' &&
                    luckyDisplayResult?.imageSrc
                  "
                  :src="luckyDisplayResult.imageSrc"
                  :alt="luckyDisplayResult.itemName"
                  class="lucky-reveal-image h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div
                  v-else
                  class="lucky-pull-loader absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 text-center text-rose-600 dark:bg-slate-950/75 dark:text-rose-200"
                  :style="luckyPullLoaderStyle"
                >
                  <GachaponMachineSvg
                    class="lucky-gachapon-machine lucky-gachapon-machine--loading relative z-10"
                    :rolling="isLuckyAnimating"
                    :revealed="false"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            class="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden text-left"
          >
            <div class="min-h-0 overflow-hidden">
              <n-scrollbar
                class="h-full"
                content-style="display: flex; flex-direction: column; gap: 1.25rem; padding: 1.25rem;"
              >
                <div
                  v-if="luckyRevealPhase === 'rolling'"
                  class="flex flex-col gap-5"
                  aria-hidden="true"
                >
                  <div class="space-y-3">
                    <n-skeleton
                      text
                      width="78%"
                      height="28px"
                    />
                    <div class="flex flex-wrap gap-2">
                      <n-skeleton
                        round
                        width="44px"
                        height="24px"
                      />
                      <n-skeleton
                        round
                        width="88px"
                        height="24px"
                      />
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <n-skeleton
                        round
                        width="76px"
                        height="22px"
                      />
                      <n-skeleton
                        round
                        width="68px"
                        height="22px"
                      />
                      <n-skeleton
                        round
                        width="82px"
                        height="22px"
                      />
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <n-skeleton
                        round
                        width="92px"
                        height="22px"
                      />
                      <n-skeleton
                        round
                        width="108px"
                        height="22px"
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-2">
                      <n-skeleton
                        text
                        width="132px"
                        height="12px"
                      />
                      <n-skeleton
                        round
                        width="96px"
                        height="24px"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-x-2 gap-y-2">
                      <div
                        v-for="index in 2"
                        :key="`lucky-detail-skeleton-${index}`"
                        class="min-w-0 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/35"
                      >
                        <n-skeleton
                          text
                          width="54%"
                          height="12px"
                          class="mb-3"
                        />
                        <div class="flex flex-wrap gap-1.5">
                          <n-skeleton
                            round
                            width="64px"
                            height="22px"
                          />
                          <n-skeleton
                            round
                            width="82px"
                            height="22px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <SearchResultInfo
                  v-if="
                    luckyRevealPhase === 'revealed' &&
                    Boolean(luckyDisplayResult)
                  "
                  :item-name="luckyDisplayResult?.itemName ?? ''"
                  :quality="luckyDisplayResult?.quality ?? null"
                  :item-type-label="luckyDisplayResult?.itemTypeLabel ?? ''"
                  :item-type="luckyDisplayResult?.resolvedItemType ?? null"
                  :category-label="luckyDisplayResult?.categoryLabel ?? ''"
                  :subcategory-label="
                    luckyDisplayResult?.subcategoryLabel ?? ''
                  "
                  :metadata="luckyDisplayResult?.metadata ?? null"
                  :style-key="luckyDisplayResult?.styleKey ?? null"
                  :style-label="luckyDisplayResult?.styleLabel ?? null"
                  :label-tags="luckyDisplayResult?.labelTags ?? []"
                  :version-display="luckyDisplayResult?.versionDisplay ?? null"
                  :obtain-label="luckyDisplayResult?.obtainLabel ?? null"
                />

                <div
                  v-if="
                    luckyRevealPhase === 'revealed' &&
                    Boolean(luckyDisplayResult)
                  "
                  class="flex flex-col gap-3"
                >
                  <div
                    v-if="
                      luckyDisplayResult?.itemId !== null &&
                      luckyDisplayResult?.supportsFeedback
                    "
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div
                      class="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
                    >
                      {{ t('feedback.current_tags') }}
                    </div>
                    <n-button
                      tertiary
                      size="tiny"
                      :disabled="isLuckyAnimating"
                      @click="openFeedbackModal(luckyDisplayResult)"
                    >
                      {{ t('feedback.suggest_action') }}
                    </n-button>
                  </div>

                  <AttributeCard
                    :metadata="luckyDisplayResult?.metadata ?? null"
                    :item-type="luckyDisplayResult?.resolvedItemType ?? null"
                    layout="compact"
                  />
                </div>
              </n-scrollbar>
            </div>
          </div>
        </div>
      </div>
    </div>

    <n-modal
      v-if="showLuckyModal && !isDesktopDetails"
      :show="showLuckyModal"
      :mask-closable="!isLuckyAnimating"
      class="w-[calc(100vw-2rem)] max-w-96 bg-transparent shadow-none"
      @update:show="handleLuckyModalShowUpdate"
    >
      <div
        class="relative grid h-[calc(100dvh-2rem)] max-h-192 w-full grid-rows-[minmax(0,1fr)] overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/95"
      >
        <div class="absolute top-3 right-3 z-20">
          <n-button
            quaternary
            circle
            strong
            attr-type="button"
            size="small"
            class="bg-white/80 text-slate-600 shadow-md backdrop-blur-sm hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-white"
            :disabled="isLuckyAnimating"
            :aria-label="t('search_page.close_details')"
            @click="closeLuckyModal"
          >
            <template #icon>
              <n-icon><Times /></n-icon>
            </template>
          </n-button>
        </div>

        <div class="relative z-10 min-h-0 overflow-hidden">
          <n-scrollbar
            class="h-full"
            content-style="display: flex; flex-direction: column;"
          >
            <div
              class="relative flex min-h-80 shrink-0 items-center justify-center overflow-visible bg-slate-100 p-6 dark:bg-slate-950/50"
            >
              <div
                class="lucky-reveal-card relative aspect-2/3 w-full max-w-[min(62vw,14.5rem)] origin-[50%_44%] overflow-visible rounded-3xl shadow-2xl ring-1 shadow-rose-950/10 ring-black/5 will-change-[transform,opacity,box-shadow] dark:ring-white/10"
                :class="{
                  'lucky-reveal-card--revealed':
                    luckyRevealPhase === 'revealed',
                }"
              >
                <div
                  class="lucky-reveal-surface absolute inset-0 overflow-hidden rounded-3xl bg-white dark:bg-slate-950"
                  :style="luckyRevealSurfaceStyle"
                >
                  <img
                    v-if="
                      luckyRevealPhase === 'revealed' &&
                      luckyDisplayResult?.imageSrc
                    "
                    :src="luckyDisplayResult.imageSrc"
                    :alt="luckyDisplayResult.itemName"
                    class="lucky-reveal-image h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="lucky-pull-loader absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 text-center text-rose-600 dark:bg-slate-950/75 dark:text-rose-200"
                    :style="luckyPullLoaderStyle"
                  >
                    <GachaponMachineSvg
                      class="lucky-gachapon-machine lucky-gachapon-machine--loading relative z-10"
                      :rolling="isLuckyAnimating"
                      :revealed="false"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex w-full flex-col gap-5 p-5 text-left">
              <div
                v-if="luckyRevealPhase === 'rolling'"
                class="flex flex-col gap-5"
                aria-hidden="true"
              >
                <div class="space-y-3">
                  <n-skeleton
                    text
                    width="80%"
                    height="28px"
                  />
                  <div class="flex flex-wrap gap-2">
                    <n-skeleton
                      round
                      width="44px"
                      height="24px"
                    />
                    <n-skeleton
                      round
                      width="86px"
                      height="24px"
                    />
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <n-skeleton
                      round
                      width="74px"
                      height="22px"
                    />
                    <n-skeleton
                      round
                      width="68px"
                      height="22px"
                    />
                    <n-skeleton
                      round
                      width="80px"
                      height="22px"
                    />
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <n-skeleton
                      round
                      width="90px"
                      height="22px"
                    />
                    <n-skeleton
                      round
                      width="104px"
                      height="22px"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between gap-2">
                    <n-skeleton
                      text
                      width="126px"
                      height="12px"
                    />
                    <n-skeleton
                      round
                      width="92px"
                      height="24px"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-x-2 gap-y-2">
                    <div
                      v-for="index in 2"
                      :key="`lucky-mobile-detail-skeleton-${index}`"
                      class="min-w-0 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/35"
                    >
                      <n-skeleton
                        text
                        width="58%"
                        height="12px"
                        class="mb-3"
                      />
                      <div class="flex flex-wrap gap-1.5">
                        <n-skeleton
                          round
                          width="58px"
                          height="22px"
                        />
                        <n-skeleton
                          round
                          width="74px"
                          height="22px"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <SearchResultInfo
                v-if="
                  luckyRevealPhase === 'revealed' && Boolean(luckyDisplayResult)
                "
                :item-name="luckyDisplayResult?.itemName ?? ''"
                :quality="luckyDisplayResult?.quality ?? null"
                :item-type-label="luckyDisplayResult?.itemTypeLabel ?? ''"
                :item-type="luckyDisplayResult?.resolvedItemType ?? null"
                :category-label="luckyDisplayResult?.categoryLabel ?? ''"
                :subcategory-label="luckyDisplayResult?.subcategoryLabel ?? ''"
                :metadata="luckyDisplayResult?.metadata ?? null"
                :style-key="luckyDisplayResult?.styleKey ?? null"
                :style-label="luckyDisplayResult?.styleLabel ?? null"
                :label-tags="luckyDisplayResult?.labelTags ?? []"
                :version-display="luckyDisplayResult?.versionDisplay ?? null"
                :obtain-label="luckyDisplayResult?.obtainLabel ?? null"
              />

              <div
                v-if="
                  luckyRevealPhase === 'revealed' && Boolean(luckyDisplayResult)
                "
                class="flex flex-col gap-3"
              >
                <div
                  v-if="
                    luckyDisplayResult?.itemId !== null &&
                    luckyDisplayResult?.supportsFeedback
                  "
                  class="flex flex-wrap items-center justify-between gap-2"
                >
                  <div
                    class="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400"
                  >
                    {{ t('feedback.current_tags') }}
                  </div>
                  <n-button
                    tertiary
                    size="tiny"
                    :disabled="isLuckyAnimating"
                    @click="openFeedbackModal(luckyDisplayResult)"
                  >
                    {{ t('feedback.suggest_action') }}
                  </n-button>
                </div>

                <AttributeCard
                  :metadata="luckyDisplayResult?.metadata ?? null"
                  :item-type="luckyDisplayResult?.resolvedItemType ?? null"
                  layout="compact"
                />
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import {
    Search,
    Box,
    Ghost,
    Times,
    Filter,
    Star,
    SearchPlus,
  } from '@vicons/fa'

  type SearchRouteMode = 'search' | 'random'

  type SearchHit = {
    id: string
    itemId: number | null
    itemType: string | null
    category: string | null
    subcategory: string | null
    score: number
    quality?: number | null
    image?: string | null
    metadata: ItemSearchMetadata | null
  }

  type SearchApiResponse = {
    query: string
    total: number
    data: SearchHit[]
  }

  type RandomItemApiResponse = {
    item: {
      id: number
      quality: number
      type: string
      obtain_type: number | null
      category: string | null
      subcategory: string | null
      metadata: ItemSearchMetadata | null
    } | null
    total: number
  }

  type SearchDisplayHit = SearchHit & {
    resolvedItemType: string | null
    itemName: string
    itemTypeLabel: string
    categoryLabel: string
    subcategoryLabel: string
    imageSrc: string | null
    qualityLabel: string
    styleKey: string | null
    styleLabel: string | null
    labelTags: Array<{
      key: string
      text: string
      themeValue: string | number
      filterKey: string | null
    }>
    versionDisplay: string | null
    obtainType: number | null
    obtainLabel: string | null
    matchScoreLabel: string
    compendiumPath: string | null
    supportsFeedback: boolean
  }

  type FeedbackModalTarget = {
    itemId: number
    itemName: string
    itemType: string | null
    metadata: ItemSearchMetadata | null
  }

  type LuckyRevealPhase = 'idle' | 'rolling' | 'revealed'

  type ActiveSearch = {
    key: string
    controller: AbortController
  }

  const props = withDefaults(
    defineProps<{
      routeMode?: SearchRouteMode
    }>(),
    {
      routeMode: 'search',
    }
  )

  const { t, locale, getLocaleMessage } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const { isDark } = useTheme()
  const { fetchItemById } = useSupabaseItems()
  const { getImageSrc } = imageProvider()
  const isDev = import.meta.dev
  const gameVersionHeaders = getGameVersionRequestHeaders()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isDesktopDetails = breakpoints.greaterOrEqual('xl')
  const mode = computed<SearchRouteMode>(() => props.routeMode)
  const luckyRevealSurfaceStyle = computed(() => ({
    background: isDark.value ? 'rgb(15 23 42)' : 'rgb(255 255 255)',
  }))
  const luckyPullLoaderStyle = computed(() => ({
    background: isDark.value
      ? 'radial-gradient(circle at 50% 28%, rgb(251 191 36 / 0.12), transparent 34%), radial-gradient(circle at 50% 72%, rgb(244 114 182 / 0.1), transparent 42%), linear-gradient(135deg, rgb(15 23 42), rgb(30 41 59))'
      : 'radial-gradient(circle at 50% 28%, rgb(251 191 36 / 0.24), transparent 32%), linear-gradient(135deg, rgb(255 255 255 / 0.86), rgb(255 241 242 / 0.8))',
  }))
  const pendingLuckyAutoroll = useState(
    'whim-search-pending-lucky-autoroll',
    () => false
  )
  const pendingSearchDisplayQuery = useState<string | null>(
    'whim-search-pending-display-query',
    () => null
  )
  const pendingRandomDisplayQuery = useState<string | null>(
    'whim-random-pending-display-query',
    () => null
  )
  const isRandomRoute = computed(
    () => route.path.split('/').filter(Boolean).at(-1) === 'random'
  )
  const isRandomMode = computed(
    () => mode.value === 'random' || isRandomRoute.value
  )
  const normalizeSimilarItemId = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    if (rawValue === null || rawValue === undefined) return null

    const parsed = Number(rawValue)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }
  const activeSimilarItemId = computed(() =>
    normalizeSimilarItemId(route.query.similar)
  )
  const pageHeading = computed(() =>
    isRandomMode.value
      ? t('search_page.lucky_machine_title')
      : t('search_page.title')
  )

  // Rotating placeholder examples built from existing filter locale keys
  const PLACEHOLDER_EXAMPLES: string[][] = [
    ['sleeve_style.puff_sleeve', 'category.tops.blouse'],
    ['structure.pleated', 'bottom_length.mini', 'category.bottoms.skirt'],
    ['category.handhelds.handheld', 'category.handhelds.weapon'],
    ['ornament.bow', 'ornament.tie', 'category.headwear.hair_ornament'],
    [
      'dress_silhouette.mermaid',
      'bottom_length.floor_length',
      'subcategory.dresses.gown',
    ],
    ['ornament.flower', 'subcategory.hairAccessories.hairpin'],
    ['ornament.embroidery', 'category.shoes.flats'],
    ['bangs.wispy_bangs', 'category.hair.twin_tails'],
  ]

  const LUCKY_DISCOVERY_TYPES = [
    'dresses',
    'hair',
    'outerwear',
    'tops',
    'bottoms',
    'shoes',
    'handhelds',
  ]
  const LUCKY_VISUAL_TYPES = new Set(LUCKY_DISCOVERY_TYPES)
  const LUCKY_ROLL_DURATION_MS = 2500
  const LUCKY_PRIZE_HOLD_MS = 520

  const exampleIndex = ref(0)

  const currentExample = computed(() => {
    const isCJK = ['zh', 'tw', 'ja', 'ko'].includes(locale.value)
    return (PLACEHOLDER_EXAMPLES[exampleIndex.value] ?? [])
      .map((path) => t(`filter.${path}`))
      .join(isCJK ? '' : ' ')
  })

  const targetPlaceholder = computed(() =>
    t('search_page.placeholder', { example: currentExample.value })
  )

  const typedCharCount = ref(0)
  const isTypingFinished = ref(false)

  const currentPlaceholder = computed(() => {
    if (isTypingFinished.value) return targetPlaceholder.value
    return targetPlaceholder.value.substring(0, typedCharCount.value)
  })

  let typeInterval: ReturnType<typeof setInterval> | null = null
  let activeSearch: ActiveSearch | null = null
  let lastCompletedSearchKey: string | null = null
  let luckyRollStartedAt = 0
  let luckyRollId = 0
  let similarSearchRunId = 0
  let shouldPreserveResultsOnEmptyRoute = false

  const stopPlaceholderTyping = () => {
    if (!typeInterval) return
    clearInterval(typeInterval)
    typeInterval = null
  }

  const restartPlaceholderTyping = () => {
    stopPlaceholderTyping()
    typedCharCount.value = 0
    isTypingFinished.value = false

    typeInterval = setInterval(() => {
      if (typedCharCount.value < targetPlaceholder.value.length) {
        typedCharCount.value++
        return
      }

      isTypingFinished.value = true
      stopPlaceholderTyping()
    }, 50)
  }

  const cancelActiveSearch = () => {
    if (!activeSearch) return
    activeSearch.controller.abort()
    activeSearch = null
  }

  const wait = (durationMs: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs)
    })

  const preloadImage = (imageSrc: string | null) => {
    if (!import.meta.client || !imageSrc) return Promise.resolve()

    return new Promise<void>((resolve) => {
      const image = new Image()
      let isSettled = false
      const finish = () => {
        if (isSettled) return
        isSettled = true
        resolve()
      }

      image.onload = finish
      image.onerror = finish
      image.src = imageSrc

      if (image.complete) {
        finish()
      }
    })
  }

  const blurActiveElement = () => {
    if (!import.meta.client) return
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }
  }

  const resetLuckyState = () => {
    blurActiveElement()
    luckyRollId += 1
    showLuckyModal.value = false
    isLuckyAnimating.value = false
    luckyRevealPhase.value = 'idle'
    luckyResult.value = null
  }

  onMounted(() => {
    exampleIndex.value = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)
    restartPlaceholderTyping()
  })

  onUnmounted(() => {
    stopPlaceholderTyping()
    cancelActiveSearch()
  })

  const initialCatalogFilters = normalizeCatalogSearchFilters(route.query)
  const consumeInitialDisplayQuery = () => {
    const pendingState = isRandomMode.value
      ? pendingRandomDisplayQuery
      : pendingSearchDisplayQuery
    const pendingQuery = pendingState.value
    pendingState.value = null

    if (
      pendingQuery &&
      normalizeSearchQuery(pendingQuery) === initialCatalogFilters.query
    ) {
      return pendingQuery
    }

    return initialCatalogFilters.query
  }
  const searchQuery = ref(consumeInitialDisplayQuery())
  const selectedItemTypes = ref<string[]>(
    initialCatalogFilters.itemTypes.slice(0, 1)
  )
  const versionFilter = ref<string | null>(initialCatalogFilters.version)
  const qualityFilter = ref<number | null>(initialCatalogFilters.quality)
  const styleFilter = ref<string | null>(initialCatalogFilters.style)
  const labelFilter = ref<string | null>(initialCatalogFilters.label)
  const sourceFilter = ref<string | null>(initialCatalogFilters.source)
  const draftSelectedItemTypes = ref<string[]>([])
  const draftVersionFilter = ref<string | null>(null)
  const draftQualityFilter = ref<number | null>(null)
  const draftStyleFilter = ref<string | null>(null)
  const draftLabelFilter = ref<string | null>(null)
  const draftSourceFilter = ref<string | null>(null)
  const hasSearched = ref(mode.value === 'search' && !!route.query.q)
  const results = ref<SearchHit[]>([])
  const selectedId = ref<string | null>(null)
  const isMobileModalOpen = ref(false)
  const isFilterModalOpen = ref(false)
  const loading = ref(false)
  const luckyLoading = ref(false)
  const showLuckyModal = ref(false)
  const isLuckyAnimating = ref(false)
  const luckyRevealPhase = ref<LuckyRevealPhase>('idle')
  const luckyResult = ref<SearchHit | null>(null)
  const error = ref('')
  const showFeedbackModal = ref(false)
  const feedbackModalTarget = ref<FeedbackModalTarget | null>(null)

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )
  const availableVersions = computed(() =>
    getExactVersionsFromLocaleMessages(messages.value)
  )
  const itemTypeFilter = computed({
    get: () => draftSelectedItemTypes.value[0] ?? null,
    set: (value: string | null) => {
      draftSelectedItemTypes.value = value ? [value] : []
    },
  })
  const itemTypeOptions = computed(() => {
    const grouped: Record<'clothes' | 'accessories' | 'other', string[]> = {
      clothes: [],
      accessories: [],
      other: [],
    }

    getAllItemTypes()
      .filter(isCatalogSearchableItemType)
      .sort((left, right) => {
        const orderLeft = itemCategoryOrder[left] ?? 999
        const orderRight = itemCategoryOrder[right] ?? 999
        return orderLeft - orderRight
      })
      .forEach((type) => {
        const category = getItemTypeCategory(type)
        if (category === 'makeups') return
        grouped[category].push(type)
      })

    const options = []

    if (grouped.clothes.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.clothes'),
        key: 'clothes',
        children: grouped.clothes.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.accessories.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.accessories'),
        key: 'accessories',
        children: grouped.accessories.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.other.length > 0) {
      options.push({
        type: 'group',
        label: t('common.other'),
        key: 'other',
        children: grouped.other.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    return options
  })
  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }
  const versionOptions = computed(() =>
    createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  )
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
  const sourceOptions = computed(() => {
    const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

    Object.keys(messages.value)
      .filter((key) => key.startsWith('obtain.') && key.endsWith('.name'))
      .map((key) => Number(key.split('.')[1]))
      .filter((id) => Number.isFinite(id))
      .forEach((id) => {
        const groupKey = resolveObtainGroupKey(id)
        const labelKey = groupKey ? resolveObtainGroupLabelKey(groupKey) : null
        if (!groupKey || !labelKey) return

        const group = groupMap.get(groupKey)
        if (group) {
          group.ids.push(id)
          return
        }

        groupMap.set(groupKey, { labelKey, ids: [id] })
      })

    return Array.from(groupMap.entries())
      .map(([value, group]) => ({
        label: t(group.labelKey),
        value,
        sortKey:
          getOldestVersion(
            group.ids
              .map((id) => getVersionFromId(id))
              .filter((version): version is string => Boolean(version))
          ) ?? '',
      }))
      .sort((left, right) => {
        const versionComparison = compareOptionalVersionsAsc(
          left.sortKey,
          right.sortKey
        )
        return versionComparison || left.label.localeCompare(right.label)
      })
      .map(({ label, value }) => ({ label, value }))
  })

  const hasActiveFilter = computed(() => activeFilterCount.value > 0)
  const activeFilterCount = computed(
    () =>
      selectedItemTypes.value.length +
      [
        versionFilter.value,
        qualityFilter.value,
        styleFilter.value,
        labelFilter.value,
        sourceFilter.value,
      ].filter((value) => value !== null && value !== '').length
  )
  const hasDraftActiveFilter = computed(() => draftActiveFilterCount.value > 0)
  const draftActiveFilterCount = computed(
    () =>
      draftSelectedItemTypes.value.length +
      [
        draftVersionFilter.value,
        draftQualityFilter.value,
        draftStyleFilter.value,
        draftLabelFilter.value,
        draftSourceFilter.value,
      ].filter((value) => value !== null && value !== '').length
  )
  useSeoMeta({
    title: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.search'),
    ogTitle: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.search'),
    twitterTitle: () =>
      `${t('search_page.title')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.search'),
  })

  const getResolvedItemType = (
    item: Pick<SearchHit, 'itemType' | 'metadata'>
  ) => item.itemType ?? item.metadata?.item_type ?? null

  const getItemName = (item: Pick<SearchHit, 'id' | 'itemId'>) => {
    if (item.itemId !== null) {
      return t(`item.${item.itemId}.name`)
    }

    return item.id
  }

  const getItemTypeLabel = (value?: string | null) => {
    if (!value) return ''
    const normalized = normalizeItemSearchItemType(value)
    const key = `type.${normalized}`
    const translated = t(key)
    return translated !== key ? translated : humanizeItemSearchToken(normalized)
  }

  const formatMatchScore = (score: number) =>
    t('search_page.match_score', {
      score: (Math.max(score, 0) * 100).toFixed(1),
    })

  const buildCompendiumPath = (itemId: number | null) =>
    itemId !== null ? localePath(`/items/${itemId}`) : null

  const buildSearchDisplayMetadata = (
    item: SearchHit,
    resolvedItemType: string | null
  ): ItemSearchMetadata | null => {
    const metadata = {
      ...(item.metadata ?? {}),
    } as ItemSearchMetadata

    if (item.itemId !== null && metadata.item_id == null) {
      metadata.item_id = item.itemId
    }

    if (resolvedItemType && !metadata.item_type) {
      metadata.item_type = resolvedItemType
    }

    if (item.category && !metadata.category) {
      metadata.category = item.category
    }

    if (item.subcategory && !metadata.subcategory) {
      metadata.subcategory = item.subcategory
    }

    return Object.keys(metadata).length > 0 ? metadata : null
  }

  const normalizeMetadataString = (
    metadata: ItemSearchMetadata | null,
    key: string
  ) => {
    const value = metadata?.[key]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  const normalizeMetadataNumber = (
    metadata: ItemSearchMetadata | null,
    key: string
  ) => {
    const value = metadata?.[key]
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN

    return Number.isFinite(parsed) ? Math.floor(parsed) : null
  }

  const normalizeMetadataStringArray = (
    metadata: ItemSearchMetadata | null,
    key: string
  ) => {
    const value = metadata?.[key]
    if (!Array.isArray(value)) return []

    return value
      .map((entry) =>
        typeof entry === 'string' || typeof entry === 'number'
          ? String(entry).trim()
          : ''
      )
      .filter(Boolean)
  }

  const getSearchStyleKey = (metadata: ItemSearchMetadata | null) => {
    const styleKey = normalizeMetadataString(metadata, 'style_key')
    return styleKey && STYLE_BY_KEY.has(styleKey) ? styleKey : null
  }

  const getSearchStyleLabel = (styleKey: string | null) => {
    const style = styleKey ? STYLE_BY_KEY.get(styleKey) : null
    return style ? t(style.i18nKey) : null
  }

  const getSearchLabelTags = (metadata: ItemSearchMetadata | null) => {
    const seen = new Set<string>()
    const tags: Array<{
      key: string
      text: string
      themeValue: string | number
      filterKey: string | null
    }> = []

    normalizeMetadataStringArray(metadata, 'label_ids').forEach((rawId) => {
      const id = Number(rawId)
      if (!Number.isFinite(id)) return

      const definition = TAG_DEFINITIONS.find((entry) => entry.id === id)
      const i18nKey = definition?.i18nKey ?? TAG_I18N_BY_ID.get(id)
      if (!i18nKey || seen.has(i18nKey)) return

      seen.add(i18nKey)
      tags.push({
        key: i18nKey,
        text: t(i18nKey),
        themeValue: id,
        filterKey: definition?.key ?? null,
      })
    })

    normalizeMetadataStringArray(metadata, 'label_keys').forEach((rawKey) => {
      const definition =
        rawKey.startsWith('label.') && rawKey.endsWith('.name')
          ? TAG_DEFINITIONS.find((entry) => entry.i18nKey === rawKey)
          : TAG_BY_KEY.get(rawKey)
      const i18nKey =
        rawKey.startsWith('label.') && rawKey.endsWith('.name')
          ? rawKey
          : definition?.i18nKey
      if (!i18nKey || seen.has(i18nKey)) return

      const idMatch = i18nKey.match(/label\.(\d+)\.name/i)
      const themeValue = idMatch?.[1] ? Number(idMatch[1]) : rawKey

      seen.add(i18nKey)
      tags.push({
        key: i18nKey,
        text: t(i18nKey),
        themeValue,
        filterKey: definition?.key ?? null,
      })
    })

    return tags
  }

  const getSearchVersionDisplay = (obtainType: number | null) => {
    if (obtainType === null) return null

    const version = getVersionFromId(obtainType)
    if (!version) return null

    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }

  const getSearchObtainLabel = (obtainType: number | null) => {
    if (obtainType === null) return null

    const key = `obtain.${obtainType}.name`
    const translated = t(key)
    return translated !== key ? translated : `${obtainType}`
  }

  const toSearchDisplayHit = (item: SearchHit): SearchDisplayHit => {
    const resolvedItemType = getResolvedItemType(item)
    const metadata = buildSearchDisplayMetadata(item, resolvedItemType)
    const styleKey = getSearchStyleKey(metadata)
    const obtainType = normalizeMetadataNumber(metadata, 'obtain_type')

    return {
      ...item,
      metadata,
      resolvedItemType,
      itemName: getItemName(item),
      itemTypeLabel: getItemTypeLabel(resolvedItemType),
      categoryLabel: item.category
        ? translateFilterToken('category', item.category, resolvedItemType)
        : '',
      subcategoryLabel: item.subcategory
        ? translateFilterToken(
            'subcategory',
            item.subcategory,
            resolvedItemType
          )
        : '',
      imageSrc:
        item.image ??
        (item.itemId !== null ? getImageSrc('item', item.itemId) : null),
      qualityLabel: item.quality ? `${item.quality}★` : '',
      styleKey,
      styleLabel: getSearchStyleLabel(styleKey),
      labelTags: getSearchLabelTags(metadata),
      versionDisplay: getSearchVersionDisplay(obtainType),
      obtainType,
      obtainLabel: getSearchObtainLabel(obtainType),
      matchScoreLabel: formatMatchScore(item.score),
      compendiumPath: buildCompendiumPath(item.itemId),
      supportsFeedback:
        item.itemId !== null && isSupportedItemSearchItemType(resolvedItemType),
    }
  }

  const displayResults = computed<SearchDisplayHit[]>(() =>
    results.value.map(toSearchDisplayHit)
  )

  const luckyDisplayResult = computed<SearchDisplayHit | null>(() =>
    luckyResult.value ? toSearchDisplayHit(luckyResult.value) : null
  )

  const hasResults = computed(() => displayResults.value.length > 0)

  const activeResult = computed<SearchDisplayHit | null>(
    () =>
      displayResults.value.find((item) => item.id === selectedId.value) ??
      displayResults.value[0] ??
      null
  )

  const activeFeedbackResult = computed(() => {
    const currentResult = activeResult.value
    if (!currentResult || currentResult.itemId === null) {
      return null
    }

    return currentResult
  })

  const setSelected = (id: string) => {
    selectedId.value = id
    if (!isDesktopDetails.value) {
      isMobileModalOpen.value = true
    }
  }

  const getSimilarSearchHit = (
    item: NonNullable<Awaited<ReturnType<typeof fetchItemById>>>
  ): SearchHit => {
    const itemType = normalizeItemSearchItemType(
      item.type ?? getItemType(item.id)
    )
    const attributeMetadata = getItemSearchMetadataFromAttributes(
      item.item_attributes ?? null
    )
    const labelIds = Array.isArray(item.tags)
      ? item.tags
          .map((entry) =>
            typeof entry === 'number' || typeof entry === 'string'
              ? String(entry).trim()
              : ''
          )
          .filter(Boolean)
      : []

    return {
      id: String(item.id),
      itemId: item.id,
      itemType,
      category:
        item.item_attributes?.category ?? attributeMetadata?.category ?? null,
      subcategory:
        item.item_attributes?.subcategory ??
        attributeMetadata?.subcategory ??
        null,
      score: 1,
      quality: item.quality,
      image: getImageSrc('item', item.id),
      metadata: {
        ...(attributeMetadata ?? {}),
        item_id: item.id,
        item_type: itemType,
        slot: itemType,
        style_key: item.style_key ?? attributeMetadata?.style_key ?? null,
        label_ids:
          labelIds.length > 0
            ? labelIds
            : normalizeMetadataStringArray(attributeMetadata, 'label_ids'),
        obtain_type: item.obtain_type ?? attributeMetadata?.obtain_type ?? null,
      } as ItemSearchMetadata,
    }
  }

  const findSimilar = async (item: SearchDisplayHit) => {
    if (item.itemId === null) return

    isMobileModalOpen.value = false
    resetLuckyState()
    lastCompletedSearchKey = null

    await navigateTo({
      path: localePath('/search'),
      query: { similar: item.itemId },
    })

    if (activeSimilarItemId.value === item.itemId) {
      void runSimilarSearch(item.itemId)
    }
  }

  const resetSearchState = () => {
    cancelActiveSearch()
    similarSearchRunId += 1
    resetLuckyState()
    lastCompletedSearchKey = null
    results.value = []
    selectedId.value = null
    loading.value = false
    error.value = ''
    hasSearched.value = false
    isMobileModalOpen.value = false
    showFeedbackModal.value = false
    feedbackModalTarget.value = null
  }

  const getCurrentCatalogFilters = (query?: string | null) => ({
    query: query ?? normalizeSearchQuery(searchQuery.value),
    itemTypes: selectedItemTypes.value.filter(isCatalogSearchableItemType),
    version: versionFilter.value,
    quality: qualityFilter.value,
    style: styleFilter.value,
    label: labelFilter.value,
    source: sourceFilter.value,
  })

  const getCurrentRouteQuery = (query?: string | null) =>
    buildCatalogSearchFilterQuery(getCurrentCatalogFilters(query))

  const updateSearchRoute = async (query: string | null) => {
    const nextQuery = getCurrentRouteQuery(query)

    await router.replace({ query: nextQuery })
  }

  const openFilterModal = () => {
    isFilterModalOpen.value = true
    if (activeSimilarItemId.value !== null) {
      void updateSearchRoute(normalizeSearchQuery(searchQuery.value) || null)
    }
  }

  const syncFilterDrafts = () => {
    draftSelectedItemTypes.value = [...selectedItemTypes.value]
    draftVersionFilter.value = versionFilter.value
    draftQualityFilter.value = qualityFilter.value
    draftStyleFilter.value = styleFilter.value
    draftLabelFilter.value = labelFilter.value
    draftSourceFilter.value = sourceFilter.value
  }

  const commitFilterDrafts = () => {
    selectedItemTypes.value = [...draftSelectedItemTypes.value]
    versionFilter.value = draftVersionFilter.value
    qualityFilter.value = draftQualityFilter.value
    styleFilter.value = draftStyleFilter.value
    labelFilter.value = draftLabelFilter.value
    sourceFilter.value = draftSourceFilter.value
  }

  const switchMode = async (
    nextMode: SearchRouteMode,
    options: { autoroll?: boolean } = {}
  ) => {
    const targetPath = localePath(nextMode === 'random' ? '/random' : '/search')
    if (nextMode === mode.value && route.path === targetPath) return

    pendingLuckyAutoroll.value = nextMode === 'random' && !!options.autoroll
    resetLuckyState()
    isMobileModalOpen.value = false
    await navigateTo({
      path: targetPath,
      query: getCurrentRouteQuery(),
    })
  }

  const applyFilters = () => {
    commitFilterDrafts()
    isFilterModalOpen.value = false
    lastCompletedSearchKey = null
    if (isRandomMode.value) {
      return
    }

    if (normalizeSearchQuery(searchQuery.value)) {
      void runSearch(true)
      return
    }

    void updateSearchRoute(normalizeSearchQuery(searchQuery.value) || null)
  }

  const setDraftQualityFilter = (quality: number | null) => {
    draftQualityFilter.value = quality
  }

  const handlePrimarySubmit = () => {
    if (isRandomMode.value) {
      void runLuckySearch()
      return
    }

    void runSearch(true)
  }

  const handleSearchInput = () => {
    if (activeSimilarItemId.value !== null) {
      void updateSearchRoute(normalizeSearchQuery(searchQuery.value) || null)
    }
  }

  const handleSecondaryAction = () => {
    if (isRandomMode.value) {
      const normalizedQuery = resolveNormalizedSearchQuery(true)
      if (!normalizedQuery) return
      pendingSearchDisplayQuery.value = searchQuery.value
      void switchMode('search')
      return
    }

    if (normalizeSearchQuery(searchQuery.value)) {
      pendingRandomDisplayQuery.value = searchQuery.value
    }
    void switchMode('random', { autoroll: true })
  }

  const clearSearch = async () => {
    searchQuery.value = ''
    selectedItemTypes.value = []
    versionFilter.value = null
    qualityFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    sourceFilter.value = null
    resetSearchState()
    if (import.meta.client) {
      restartPlaceholderTyping()
    }
    await updateSearchRoute(null)
  }

  const clearFilters = () => {
    draftSelectedItemTypes.value = []
    draftVersionFilter.value = null
    draftQualityFilter.value = null
    draftStyleFilter.value = null
    draftLabelFilter.value = null
    draftSourceFilter.value = null
  }

  const clearSearchQuery = async () => {
    if (!searchQuery.value) return

    searchQuery.value = ''
    if (activeSimilarItemId.value !== null) {
      shouldPreserveResultsOnEmptyRoute = true
      await updateSearchRoute(null)
    }
    if (import.meta.client) {
      restartPlaceholderTyping()
    }
  }

  const closeMobileModal = () => {
    isMobileModalOpen.value = false
  }

  const openFeedbackModal = async (
    result: SearchDisplayHit | null = activeFeedbackResult.value
  ) => {
    const currentResult = result
    if (
      !currentResult ||
      !currentResult.supportsFeedback ||
      currentResult.itemId === null
    )
      return

    const nextTarget: FeedbackModalTarget = {
      itemId: currentResult.itemId,
      itemName: currentResult.itemName,
      itemType: currentResult.resolvedItemType,
      metadata: currentResult.metadata,
    }

    try {
      const item = await fetchItemById(currentResult.itemId)
      if (item) {
        nextTarget.itemType = item.type ?? nextTarget.itemType
        nextTarget.metadata =
          getItemSearchMetadataFromAttributes(item.item_attributes ?? null) ??
          nextTarget.metadata
      }
    } catch (caughtError) {
      const message = toErrorMessage(
        caughtError,
        `Failed to hydrate feedback metadata for item ${currentResult.itemId}`
      )
      console.error(
        `Failed to hydrate feedback metadata for item ${currentResult.itemId}: ${message}`
      )
    }

    feedbackModalTarget.value = nextTarget
    isMobileModalOpen.value = false
    showFeedbackModal.value = true
  }

  const getSearchRequestKey = (query: string) =>
    `${locale.value}:${getCatalogSearchFilterKey(getCurrentCatalogFilters(query))}`

  const shouldSkipSearch = (searchKey: string) =>
    searchKey === activeSearch?.key || searchKey === lastCompletedSearchKey

  const applySearchResults = (nextResults: SearchHit[]) => {
    results.value = nextResults
    selectedId.value =
      nextResults.find((item) => item.id === selectedId.value)?.id ??
      nextResults[0]?.id ??
      null
    isMobileModalOpen.value = false
    showFeedbackModal.value = false
    feedbackModalTarget.value = null
  }

  const getLuckyCandidateType = (item: SearchHit) =>
    normalizeItemSearchItemType(
      getResolvedItemType(item) ??
        (item.itemId !== null ? getItemType(item.itemId) : null)
    )

  const isPreferredLuckyType = (item: SearchHit) =>
    LUCKY_VISUAL_TYPES.has(getLuckyCandidateType(item))

  const getLuckyTypeScore = (item: SearchHit) =>
    isPreferredLuckyType(item) ? 1 : 0.35

  const getLuckyQualityScore = (quality?: number | null) => {
    if (!quality) return 0.5
    if (quality >= 5) return 1
    if (quality === 4) return 0.78
    return 0.35
  }

  const pickWeightedLuckyHit = (hits: SearchHit[]) => {
    if (hits.length === 0) return null

    const maxScore = Math.max(...hits.map((hit) => Math.max(hit.score, 0)), 1)
    const weighted = hits.map((hit, index) => {
      const relevanceScore = Math.max(hit.score, 0) / maxScore
      const rankScore =
        hits.length > 1 ? 1 - index / Math.max(hits.length - 1, 1) : 1
      const qualityScore = getLuckyQualityScore(hit.quality)
      const typeScore = getLuckyTypeScore(hit)
      const surpriseScore = Math.random() * 0.3
      const weight = Math.max(
        Math.max(relevanceScore, rankScore * 0.75) * 0.5 +
          qualityScore * 0.2 +
          typeScore * 0.1 +
          surpriseScore,
        0.01
      )

      return { hit, weight }
    })
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0)
    let roll = Math.random() * totalWeight

    for (const entry of weighted) {
      roll -= entry.weight
      if (roll <= 0) return entry.hit
    }

    return weighted.at(-1)?.hit ?? null
  }

  const toRandomSearchHit = (
    item: NonNullable<RandomItemApiResponse['item']>
  ): SearchHit => {
    const itemType = normalizeItemSearchItemType(
      item.type ?? getItemType(item.id)
    )

    return {
      id: String(item.id),
      itemId: item.id,
      itemType,
      category: item.category,
      subcategory: item.subcategory,
      score: item.quality >= 5 ? 0.95 : 0.82,
      quality: item.quality,
      image: getImageSrc('item', item.id),
      metadata: {
        ...(item.metadata ?? {}),
        item_id: item.id,
        item_type: itemType,
        slot: itemType,
        obtain_type: item.obtain_type,
      },
    }
  }

  const fetchLuckySearchHits = async (normalizedQuery: string) => {
    const queryParams: Record<string, string | number> = {
      q: normalizedQuery,
      lang: locale.value,
      ...getCurrentRouteQuery(normalizedQuery),
    }

    const response = await $fetch<SearchApiResponse>('/api/search/items', {
      query: queryParams,
      headers: gameVersionHeaders,
    })

    return (response.data ?? []).filter(
      (item) => item.itemId !== null && item.score > 0
    )
  }

  const runSimilarSearch = async (itemId: number) => {
    const searchKey = `${locale.value}:similar:${itemId}`
    if (shouldSkipSearch(searchKey)) {
      return
    }

    const runId = ++similarSearchRunId
    cancelActiveSearch()
    resetLuckyState()
    hasSearched.value = true
    loading.value = true
    error.value = ''
    selectedId.value = null

    let search: ActiveSearch | null = null

    try {
      const item = await fetchItemById(itemId)
      if (
        runId !== similarSearchRunId ||
        activeSimilarItemId.value !== itemId ||
        mode.value !== 'search'
      ) {
        return
      }

      if (!item) {
        applySearchResults([])
        error.value = t('search_page.no_matches')
        return
      }

      const similarDisplayHit = toSearchDisplayHit(getSimilarSearchHit(item))
      searchQuery.value = similarDisplayHit.itemName
      selectedItemTypes.value = []
      versionFilter.value = null
      qualityFilter.value = null
      styleFilter.value = null
      labelFilter.value = null
      sourceFilter.value = null
      if (!isFilterModalOpen.value) {
        syncFilterDrafts()
      }

      search = {
        key: searchKey,
        controller: new AbortController(),
      }
      activeSearch = search

      const response = await $fetch<SearchApiResponse>('/api/search/items', {
        query: {
          id: String(itemId),
          lang: locale.value,
        },
        headers: gameVersionHeaders,
        signal: search.controller.signal,
      })

      if (
        activeSearch !== search ||
        runId !== similarSearchRunId ||
        activeSimilarItemId.value !== itemId
      ) {
        return
      }

      lastCompletedSearchKey = search.key
      applySearchResults((response.data ?? []).filter((hit) => hit.score > 0))
    } catch (caughtError) {
      if (
        search?.controller.signal.aborted ||
        (search && activeSearch !== search)
      ) {
        return
      }

      if (
        runId !== similarSearchRunId ||
        activeSimilarItemId.value !== itemId
      ) {
        return
      }

      applySearchResults([])
      error.value = toErrorMessage(
        caughtError,
        t('search_page.error_description')
      )
    } finally {
      if (runId === similarSearchRunId) {
        if (activeSearch === search) {
          activeSearch = null
        }
        loading.value = false
      }
    }
  }

  const fetchLuckyRandomHit = async () => {
    const queryParams = getCurrentRouteQuery(null)

    const response = await $fetch<RandomItemApiResponse>('/api/items/random', {
      query: queryParams,
      headers: gameVersionHeaders,
    })

    return response.item ? toRandomSearchHit(response.item) : null
  }

  const pickLuckySearchHit = (hits: SearchHit[]) => {
    const preferredHits = hits.filter(isPreferredLuckyType)
    return pickWeightedLuckyHit(preferredHits.length > 0 ? preferredHits : hits)
  }

  const beginLuckyRoll = () => {
    luckyRollId += 1
    luckyRollStartedAt = Date.now()
    luckyResult.value = null
    luckyRevealPhase.value = 'rolling'
    isLuckyAnimating.value = true
    showLuckyModal.value = true
    isMobileModalOpen.value = false
    showFeedbackModal.value = false
    feedbackModalTarget.value = null
    if (mode.value !== 'search') {
      results.value = []
      selectedId.value = null
    }
    hasSearched.value = true
    error.value = ''
    return luckyRollId
  }

  const revealLuckyHit = async (hit: SearchHit, rollId: number) => {
    luckyResult.value = hit
    const remainingRollMs = Math.max(
      0,
      LUCKY_ROLL_DURATION_MS - (Date.now() - luckyRollStartedAt)
    )

    await Promise.all([
      wait(remainingRollMs + LUCKY_PRIZE_HOLD_MS),
      preloadImage(luckyDisplayResult.value?.imageSrc ?? null),
    ])

    if (rollId !== luckyRollId) return

    luckyRevealPhase.value = 'revealed'
    isLuckyAnimating.value = false
  }

  const closeLuckyModal = () => {
    if (isLuckyAnimating.value) return
    resetLuckyState()
    hasSearched.value = results.value.length > 0
  }

  const handleLuckyModalShowUpdate = (nextShow: boolean) => {
    if (nextShow) {
      showLuckyModal.value = true
      return
    }

    closeLuckyModal()
  }

  const resolveNormalizedSearchQuery = (pushToUrl: boolean) => {
    const normalizedQuery = normalizeSearchQuery(searchQuery.value)
    if (normalizedQuery) {
      return normalizedQuery
    }

    if (!pushToUrl) {
      return null
    }

    // Use current placeholder example as the query and cycle to the next.
    searchQuery.value = currentExample.value
    exampleIndex.value = (exampleIndex.value + 1) % PLACEHOLDER_EXAMPLES.length
    isTypingFinished.value = true

    return normalizeSearchQuery(searchQuery.value)
  }

  const runSearch = async (pushToUrl = false) => {
    const normalizedQuery = resolveNormalizedSearchQuery(pushToUrl)
    if (!normalizedQuery) {
      return
    }

    resetLuckyState()

    const searchKey = getSearchRequestKey(normalizedQuery)
    hasSearched.value = true
    error.value = ''

    if (shouldSkipSearch(searchKey)) {
      return
    }

    let search: ActiveSearch | null = null

    try {
      if (
        pushToUrl &&
        (route.query.q?.toString() !== normalizedQuery ||
          getCatalogSearchFilterKey(
            normalizeCatalogSearchFilters(route.query)
          ) !==
            getCatalogSearchFilterKey(
              getCurrentCatalogFilters(normalizedQuery)
            ))
      ) {
        await updateSearchRoute(normalizedQuery)
      }

      if (shouldSkipSearch(searchKey)) {
        return
      }

      cancelActiveSearch()
      search = {
        key: searchKey,
        controller: new AbortController(),
      }
      activeSearch = search
      loading.value = true

      const queryParams: Record<string, string | number> = {
        q: normalizedQuery,
        lang: locale.value,
        ...getCurrentRouteQuery(normalizedQuery),
      }

      const response = await $fetch<SearchApiResponse>('/api/search/items', {
        query: queryParams,
        headers: gameVersionHeaders,
        signal: search.controller.signal,
      })

      if (activeSearch !== search) return

      lastCompletedSearchKey = search.key
      applySearchResults((response.data ?? []).filter((item) => item.score > 0))
    } catch (caughtError) {
      if (
        !search ||
        search.controller.signal.aborted ||
        activeSearch !== search
      ) {
        return
      }

      applySearchResults([])
      error.value = toErrorMessage(
        caughtError,
        t('search_page.error_description')
      )
    } finally {
      if (activeSearch === search) {
        loading.value = false
        activeSearch = null
      }
    }
  }

  const runLuckySearch = async () => {
    if (luckyLoading.value || loading.value) return

    luckyLoading.value = true
    const rollId = beginLuckyRoll()

    try {
      const normalizedQuery = normalizeSearchQuery(searchQuery.value)

      cancelActiveSearch()
      loading.value = false

      const queryHits = normalizedQuery
        ? await fetchLuckySearchHits(normalizedQuery)
        : []
      const luckyHit = normalizedQuery
        ? (pickLuckySearchHit(queryHits) ?? (await fetchLuckyRandomHit()))
        : await fetchLuckyRandomHit()

      if (!luckyHit) {
        showLuckyModal.value = false
        isLuckyAnimating.value = false
        luckyRevealPhase.value = 'idle'
        selectedId.value = null
        isMobileModalOpen.value = false
        error.value = t('search_page.no_matches')
        return
      }

      await revealLuckyHit(luckyHit, rollId)
    } catch (caughtError) {
      showLuckyModal.value = false
      isLuckyAnimating.value = false
      luckyRevealPhase.value = 'idle'
      error.value = toErrorMessage(
        caughtError,
        t('search_page.error_description')
      )
    } finally {
      luckyLoading.value = false
    }
  }

  watch(targetPlaceholder, (nextPlaceholder, previousPlaceholder) => {
    if (
      import.meta.client &&
      nextPlaceholder !== previousPlaceholder &&
      !normalizeSearchQuery(searchQuery.value)
    ) {
      restartPlaceholderTyping()
    }
  })

  watch(isDesktopDetails, (isDesktop) => {
    if (isDesktop) {
      blurActiveElement()
      isMobileModalOpen.value = false
    }
  })

  watch(activeResult, (nextResult) => {
    if (!nextResult) {
      isMobileModalOpen.value = false
    }
  })

  watch(isFilterModalOpen, (nextOpen) => {
    if (nextOpen) {
      syncFilterDrafts()
    }
  })

  watch(locale, () => {
    const similarItemId = activeSimilarItemId.value
    if (mode.value === 'search' && similarItemId !== null) {
      void runSimilarSearch(similarItemId)
      return
    }

    if (normalizeSearchQuery(searchQuery.value)) {
      void runSearch(false)
    }
  })

  watch(
    () => [
      mode.value,
      getCatalogSearchFilterKey(normalizeCatalogSearchFilters(route.query)),
      activeSimilarItemId.value,
    ],
    () => {
      const similarItemId = activeSimilarItemId.value
      if (mode.value === 'search' && similarItemId !== null) {
        void runSimilarSearch(similarItemId)
        return
      }

      similarSearchRunId += 1
      const filters = normalizeCatalogSearchFilters(route.query)
      if (normalizeSearchQuery(searchQuery.value) !== filters.query) {
        searchQuery.value = filters.query
      }
      selectedItemTypes.value = filters.itemTypes.slice(0, 1)
      versionFilter.value = filters.version
      qualityFilter.value = filters.quality
      styleFilter.value = filters.style
      labelFilter.value = filters.label
      sourceFilter.value = filters.source
      if (!isFilterModalOpen.value) {
        syncFilterDrafts()
      }

      if (mode.value !== 'search') {
        return
      }

      if (!filters.query) {
        if (shouldPreserveResultsOnEmptyRoute) {
          shouldPreserveResultsOnEmptyRoute = false
          hasSearched.value = results.value.length > 0
          if (import.meta.client) {
            restartPlaceholderTyping()
          }
          return
        }

        resetSearchState()
        if (import.meta.client) {
          restartPlaceholderTyping()
        }
        return
      }

      void runSearch(false)
    },
    { immediate: true }
  )

  watch(
    isRandomMode,
    (nextIsRandomMode) => {
      if (!nextIsRandomMode || !pendingLuckyAutoroll.value) return

      pendingLuckyAutoroll.value = false
      void nextTick(() => runLuckySearch())
    },
    { immediate: true }
  )
</script>

<style scoped>
  .lucky-pull-loader {
    background:
      radial-gradient(
        circle at 50% 28%,
        rgb(251 191 36 / 0.24),
        transparent 32%
      ),
      linear-gradient(135deg, rgb(255 255 255 / 0.86), rgb(255 241 242 / 0.8));
  }

  :global(.dark) .lucky-pull-loader {
    background:
      radial-gradient(
        circle at 50% 28%,
        rgb(251 191 36 / 0.2),
        transparent 32%
      ),
      linear-gradient(135deg, rgb(15 23 42 / 0.86), rgb(67 20 34 / 0.7));
  }

  .lucky-reveal-image {
    animation: lucky-item-reveal 420ms ease-out both;
  }

  .lucky-reveal-card--revealed {
    animation: lucky-card-reveal 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes lucky-item-reveal {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes lucky-card-reveal {
    0% {
      opacity: 0;
      transform: translateY(-1.5rem) scale(0.24);
      box-shadow:
        0 0.25rem 0.5rem rgb(72 32 34 / 0.08),
        0 0 0 rgb(251 113 133 / 0);
    }

    72% {
      opacity: 1;
      transform: translateY(0) scale(1.04);
      box-shadow:
        0 1.8rem 2.5rem rgb(72 32 34 / 0.18),
        0 0 1.6rem rgb(251 113 133 / 0.16);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      box-shadow:
        0 1.5rem 2rem rgb(72 32 34 / 0.1),
        0 0 1rem rgb(251 113 133 / 0.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lucky-reveal-card--revealed,
    .lucky-reveal-image {
      animation: none;
    }
  }
</style>
