<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4 sm:p-5"
    >
      <div
        class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-stretch"
      >
        <div class="flex min-w-0 flex-col justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <n-h1 class="m-0 text-2xl leading-tight font-bold sm:text-3xl">
                {{ t('navigation.wardrobe') }}
              </n-h1>
              <n-tag
                v-if="showProfileTag"
                size="small"
                :bordered="false"
                type="info"
              >
                {{ activeProfileLabel }}
              </n-tag>
            </div>
            <n-button-group
              size="small"
              class="sm:ml-auto"
            >
              <n-button
                size="small"
                :type="wardrobeSummaryScope === 'base' ? 'primary' : 'default'"
                :secondary="wardrobeSummaryScope !== 'base'"
                :aria-pressed="wardrobeSummaryScope === 'base'"
                @click="wardrobeSummaryScope = 'base'"
              >
                {{ t('wardrobe.stats_scope.base') }}
              </n-button>
              <n-button
                size="small"
                :type="wardrobeSummaryScope === 'all' ? 'primary' : 'default'"
                :secondary="wardrobeSummaryScope !== 'all'"
                :aria-pressed="wardrobeSummaryScope === 'all'"
                @click="wardrobeSummaryScope = 'all'"
              >
                {{ t('wardrobe.stats_scope.all') }}
              </n-button>
            </n-button-group>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NuxtLinkLocale
              v-for="card in collectionCards"
              :key="card.key"
              :to="card.to"
              class="group block rounded-lg border border-gray-100 bg-white/70 p-3 transition hover:border-sky-200 hover:bg-sky-50/70 lg:min-h-30 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-sky-900 dark:hover:bg-sky-950/30"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 space-y-2">
                  <div class="flex items-center gap-2">
                    <n-icon
                      size="16"
                      class="text-sky-500"
                    >
                      <component :is="card.icon" />
                    </n-icon>
                    <n-text class="text-sm font-semibold">
                      {{ card.label }}
                    </n-text>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <n-skeleton
                      v-if="isSummaryLoading"
                      text
                      width="64px"
                    />
                    <template v-else>
                      <n-text class="text-2xl font-bold tabular-nums">
                        {{ card.percent }}%
                      </n-text>
                      <n-text
                        depth="3"
                        class="text-xs"
                      >
                        {{ card.detail }}
                      </n-text>
                    </template>
                  </div>
                  <div
                    class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                  >
                    <div
                      class="h-full rounded-full bg-sky-500 transition-[width] duration-500 ease-out"
                      :style="{ width: `${card.percent}%` }"
                    ></div>
                  </div>
                </div>
                <n-icon
                  class="mt-0.5 text-gray-400 transition group-hover:text-sky-500"
                >
                  <ExternalLinkAlt />
                </n-icon>
              </div>
            </NuxtLinkLocale>
          </div>
        </div>

        <div
          class="flex flex-col justify-between gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/60"
        >
          <div class="flex items-center justify-between gap-3">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.manage_title') }}
            </n-text>
            <n-button
              circle
              size="small"
              secondary
              :aria-label="t('wardrobe.settings.title')"
              @click="wardrobeSettingsOpen = true"
            >
              <template #icon>
                <n-icon size="16"><Cog /></n-icon>
              </template>
            </n-button>
          </div>

          <n-button
            block
            type="primary"
            secondary
            class="h-10 justify-center"
            :disabled="!canMarkF2PBasics"
            :aria-busy="markingF2PBasics"
            @click="handleMarkF2PBasics"
          >
            <template #icon>
              <n-icon size="16"><CheckCircle /></n-icon>
            </template>
            <span class="flex min-w-0 items-center gap-2">
              <span class="truncate">{{ t('wardrobe.f2p_basics') }}</span>
              <n-tag
                size="small"
                :bordered="false"
                round
              >
                {{ f2pBasicsCountLabel }}
              </n-tag>
            </span>
          </n-button>

          <n-button
            block
            type="primary"
            secondary
            class="h-10 justify-center"
            :disabled="!canImportResonanceCollection"
            :aria-busy="importing || loadingTrackerImportPreview"
            @click="handleTrackerImport"
          >
            <template #icon>
              <n-icon size="16"><CheckCircle /></n-icon>
            </template>
            <span class="flex min-w-0 items-center gap-2">
              <span class="truncate">
                {{ t('wardrobe.resonance_collection') }}
              </span>
              <n-tag
                size="small"
                :bordered="false"
                round
              >
                {{ resonanceCollectionCountLabel }}
              </n-tag>
            </span>
          </n-button>

          <input
            ref="profileFileInputRef"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="handleProfileFileSelected"
          />

          <div class="grid grid-cols-2 gap-2">
            <n-button
              size="small"
              secondary
              class="h-9 min-w-0 justify-center"
              :disabled="!initialized"
              :aria-busy="exportingProfileJson"
              @click="exportProfileJSON"
            >
              <template #icon>
                <n-icon size="16"><FileExport /></n-icon>
              </template>
              {{ t('wardrobe.export_file') }}
            </n-button>
            <n-button
              size="small"
              secondary
              class="h-9 min-w-0 justify-center"
              :disabled="!canMutate || importingProfileFile"
              :aria-busy="importingProfileFile"
              @click="openProfileFilePicker"
            >
              <template #icon>
                <n-icon size="16"><FileImport /></n-icon>
              </template>
              {{ t('navigation.import') }}
            </n-button>
          </div>
        </div>
      </div>
    </n-card>

    <n-modal
      :show="showWardrobeOnboarding"
      preset="card"
      :title="t('wardrobe.settings.onboarding_title')"
      class="pointer-events-auto mx-auto w-[calc(100vw-2rem)] max-w-md"
      content-class="space-y-5"
      :closable="false"
      :mask-closable="false"
      :close-on-esc="false"
      :auto-focus="false"
    >
      <div class="space-y-5">
        <div class="flex items-center gap-2">
          <div
            v-for="step in onboardingSteps"
            :key="step.step"
            class="flex items-center rounded-full border text-xs font-medium transition"
            :aria-label="step.label"
            :class="[
              onboardingStep === step.step
                ? 'min-w-0 flex-1 gap-2 border-sky-300 bg-sky-50 px-2.5 py-1.5 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200'
                : onboardingStep > step.step
                  ? 'size-8 justify-center border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'size-8 justify-center border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400',
            ]"
          >
            <span
              class="flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              :class="
                onboardingStep === step.step ? 'size-5 bg-current/15' : ''
              "
            >
              {{ step.step }}
            </span>
            <span
              v-if="onboardingStep === step.step"
              class="min-w-0 truncate"
            >
              {{ step.label }}
            </span>
          </div>
        </div>

        <div
          v-if="onboardingStep === 1"
          class="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-900/60"
        >
          <div class="space-y-1">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.onboarding.region_title') }}
            </n-text>
          </div>
          <n-button-group
            size="medium"
            class="mt-3 w-full"
          >
            <n-button
              v-for="option in wardrobeRegionOptions"
              :key="option.value"
              class="flex-1 justify-center"
              :type="
                onboardingRegionScope === option.value ? 'primary' : 'default'
              "
              :secondary="onboardingRegionScope !== option.value"
              :aria-pressed="onboardingRegionScope === option.value"
              @click="onboardingRegionScope = option.value"
            >
              {{ option.label }}
            </n-button>
          </n-button-group>
        </div>

        <div
          v-else-if="onboardingStep === 2"
          class="space-y-2"
        >
          <div class="space-y-1">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.f2p_basics') }}
            </n-text>
            <n-text
              depth="3"
              class="block text-sm"
            >
              {{ t('wardrobe.onboarding.base_tip_description') }}
            </n-text>
          </div>

          <n-button
            block
            type="primary"
            secondary
            class="h-10 justify-center"
            :disabled="!canMarkF2PBasics"
            :aria-busy="markingF2PBasics"
            @click="handleMarkF2PBasics"
          >
            <template #icon>
              <n-icon size="16"><CheckCircle /></n-icon>
            </template>
            <span class="flex min-w-0 items-center gap-2">
              <span class="truncate">{{ t('wardrobe.f2p_basics') }}</span>
              <n-tag
                size="small"
                :bordered="false"
                round
              >
                {{ f2pBasicsCountLabel }}
              </n-tag>
            </span>
          </n-button>
        </div>

        <div
          v-else-if="onboardingStep === 3"
          class="space-y-2"
        >
          <div class="space-y-1">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.resonance_collection') }}
            </n-text>
            <n-text
              depth="3"
              class="block text-sm"
            >
              {{ t('wardrobe.onboarding.resonance_tip_description') }}
            </n-text>
          </div>

          <n-button
            block
            type="primary"
            secondary
            class="h-10 justify-center"
            :disabled="!canImportResonanceCollection"
            :aria-busy="importing || loadingTrackerImportPreview"
            @click="handleTrackerImport"
          >
            <template #icon>
              <n-icon size="16"><CheckCircle /></n-icon>
            </template>
            <span class="flex min-w-0 items-center gap-2">
              <span class="truncate">
                {{ t('wardrobe.resonance_collection') }}
              </span>
              <n-tag
                size="small"
                :bordered="false"
                round
              >
                {{ resonanceCollectionCountLabel }}
              </n-tag>
            </span>
          </n-button>
        </div>

        <div
          v-else
          class="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-900/60"
        >
          <div class="space-y-1">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.onboarding.tracking_title') }}
            </n-text>
            <n-text
              depth="3"
              class="block text-sm"
            >
              {{ t('wardrobe.onboarding.tracking_description') }}
            </n-text>
          </div>

          <div class="flex flex-wrap gap-2">
            <n-tag
              type="info"
              :bordered="false"
              round
            >
              {{ t('wardrobe.region.label') }}: {{ onboardingRegionLabel }}
            </n-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <n-button
            v-if="onboardingStep < onboardingLastStep"
            tertiary
            @click="handleCompleteOnboarding"
          >
            {{ t('common.skip') }}
          </n-button>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <n-button
              v-if="onboardingStep > 1"
              secondary
              @click="handleOnboardingBack"
            >
              {{ t('common.previous') }}
            </n-button>
            <n-button
              v-if="onboardingStep < onboardingLastStep"
              type="primary"
              @click="handleOnboardingNext"
            >
              {{ t('common.next') }}
            </n-button>
            <n-button
              v-else
              type="primary"
              @click="handleCompleteOnboarding"
            >
              {{ t('wardrobe.onboarding.finish_setup') }}
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="wardrobeSettingsOpen"
      preset="card"
      :title="t('wardrobe.settings.title')"
      class="pointer-events-auto mx-auto w-[calc(100vw-2rem)] max-w-md"
      :auto-focus="false"
    >
      <div class="space-y-3">
        <div class="space-y-1">
          <n-text class="block text-sm font-semibold">
            {{ t('wardrobe.region.label') }}
          </n-text>
        </div>
        <n-select
          :value="activeRegionScope"
          :options="wardrobeRegionOptions"
          @update:value="handleRegionScopeChange"
        />

        <n-divider class="my-2" />

        <div class="space-y-2">
          <div class="space-y-1">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.settings.onboarding_title') }}
            </n-text>
            <n-text
              depth="3"
              class="block text-sm"
            >
              {{ t('wardrobe.settings.onboarding_description') }}
            </n-text>
          </div>
          <n-button
            block
            secondary
            @click="resetWardrobeOnboarding"
          >
            {{ t('wardrobe.settings.reset_onboarding') }}
          </n-button>
        </div>
      </div>
    </n-modal>

    <n-alert
      v-if="wardrobeError"
      type="error"
      :title="t('wardrobe.storage_unavailable')"
    >
      <div class="space-y-3">
        <p>{{ wardrobeError.message }}</p>
        <n-button
          size="small"
          @click="retry"
        >
          {{ t('wardrobe.storage_recovery') }}
        </n-button>
      </div>
    </n-alert>

    <n-alert
      v-else-if="summaryError"
      type="error"
      :title="t('wardrobe.summary_unavailable')"
    >
      <div class="space-y-3">
        <p>{{ summaryError.message }}</p>
        <n-button
          size="small"
          @click="loadSummary"
        >
          {{ t('common.retry') }}
        </n-button>
      </div>
    </n-alert>

    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4"
    >
      <template #header>
        <n-text class="block text-sm font-semibold">
          {{ t('wardrobe.progress_title') }}
        </n-text>
      </template>

      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div class="space-y-3">
          <div class="flex min-h-7 items-center justify-between gap-3">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.by_quality') }}
            </n-text>
          </div>
          <template v-if="summary">
            <NuxtLinkLocale
              v-for="row in qualityRows"
              :key="row.quality"
              :to="{
                path: '/items',
                query: getWardrobeOwnedQuery({ quality: row.quality }),
              }"
              class="block min-h-10 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <WardrobeProgressRow
                :label="`${row.quality}★`"
                :owned="row.owned"
                :total="row.total"
                :percent="row.completionPercent"
              />
            </NuxtLinkLocale>
          </template>
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="row in 4"
              :key="`quality-skeleton-${row}`"
              class="block min-h-10 rounded-lg px-2 py-1.5"
            >
              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between gap-3">
                  <div
                    class="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                  <div
                    class="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                </div>
                <div
                  class="h-2 rounded-full bg-gray-100 dark:bg-gray-800"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex min-h-7 items-center justify-between gap-3">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.by_slot') }}
            </n-text>
            <n-button
              v-if="hiddenSlotRows.length > 0"
              size="tiny"
              text
              @click="showAllSlots = !showAllSlots"
            >
              <template #icon>
                <n-icon
                  size="12"
                  class="transition"
                  :class="{ 'rotate-180': showAllSlots }"
                >
                  <ChevronDown />
                </n-icon>
              </template>
              {{
                showAllSlots ? t('wardrobe.show_less') : t('wardrobe.show_more')
              }}
            </n-button>
          </div>

          <template v-if="summary">
            <NuxtLinkLocale
              v-for="row in visibleSlotRows"
              :key="row.type"
              :to="{
                path: '/items',
                query: getWardrobeOwnedQuery({ type: row.type }),
              }"
              class="block min-h-10 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <WardrobeProgressRow
                :label="t(`type.${row.type}`)"
                :owned="row.owned"
                :total="row.total"
                :percent="row.completionPercent"
              />
            </NuxtLinkLocale>

            <n-collapse-transition :show="showAllSlots">
              <div class="space-y-3">
                <NuxtLinkLocale
                  v-for="row in hiddenSlotRows"
                  :key="row.type"
                  :to="{
                    path: '/items',
                    query: getWardrobeOwnedQuery({ type: row.type }),
                  }"
                  class="block min-h-10 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <WardrobeProgressRow
                    :label="t(`type.${row.type}`)"
                    :owned="row.owned"
                    :total="row.total"
                    :percent="row.completionPercent"
                  />
                </NuxtLinkLocale>
              </div>
            </n-collapse-transition>
          </template>
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="row in 4"
              :key="`slot-skeleton-${row}`"
              class="block min-h-10 rounded-lg px-2 py-1.5"
            >
              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between gap-3">
                  <div
                    class="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                  <div
                    class="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                </div>
                <div
                  class="h-2 rounded-full bg-gray-100 dark:bg-gray-800"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex min-h-7 items-center justify-between gap-3">
            <n-text class="block text-sm font-semibold">
              {{ t('wardrobe.by_version') }}
            </n-text>
            <n-button
              v-if="olderVersionRows.length > 0"
              size="tiny"
              text
              @click="showAllVersions = !showAllVersions"
            >
              <template #icon>
                <n-icon
                  size="12"
                  class="transition"
                  :class="{ 'rotate-180': showAllVersions }"
                >
                  <ChevronDown />
                </n-icon>
              </template>
              {{
                showAllVersions
                  ? t('wardrobe.show_less')
                  : t('wardrobe.show_more')
              }}
            </n-button>
          </div>

          <template v-if="summary">
            <NuxtLinkLocale
              v-for="row in recentVersionRows"
              :key="row.version"
              :to="getVersionLink(row.version)"
              class="block min-h-10 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <WardrobeProgressRow
                :label="t('wardrobe.version_label', { version: row.version })"
                :owned="row.owned"
                :total="row.total"
                :percent="row.completionPercent"
              />
            </NuxtLinkLocale>

            <n-collapse-transition :show="showAllVersions">
              <div class="space-y-3">
                <NuxtLinkLocale
                  v-for="row in olderVersionRows"
                  :key="row.version"
                  :to="getVersionLink(row.version)"
                  class="block min-h-10 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <WardrobeProgressRow
                    :label="
                      t('wardrobe.version_label', { version: row.version })
                    "
                    :owned="row.owned"
                    :total="row.total"
                    :percent="row.completionPercent"
                  />
                </NuxtLinkLocale>
              </div>
            </n-collapse-transition>
          </template>
          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="row in 4"
              :key="`version-skeleton-${row}`"
              class="block min-h-10 rounded-lg px-2 py-1.5"
            >
              <div class="space-y-1.5">
                <div class="flex h-5 items-center justify-between gap-3">
                  <div
                    class="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                  <div
                    class="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800"
                  ></div>
                </div>
                <div
                  class="h-2 rounded-full bg-gray-100 dark:bg-gray-800"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4"
    >
      <template #header>
        <n-text class="block text-sm font-semibold">
          {{ t('wardrobe.continue_title') }}
        </n-text>
      </template>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLinkLocale
          v-for="action in quickActions"
          :key="action.label"
          :to="action.to"
          class="group block rounded-lg border border-gray-100 p-3 transition hover:border-sky-200 hover:bg-sky-50/70 dark:border-gray-800 dark:hover:border-sky-900 dark:hover:bg-sky-950/30"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <n-text class="block text-sm font-semibold">
                {{ action.label }}
              </n-text>
              <n-text
                depth="3"
                class="block text-xs"
              >
                {{ action.detail }}
              </n-text>
            </div>
            <n-icon class="text-gray-400 transition group-hover:text-sky-500">
              <ExternalLinkAlt />
            </n-icon>
          </div>
        </NuxtLinkLocale>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-4"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <n-h2 class="m-0 text-base font-semibold">
            {{ t('common.share_card') }}
          </n-h2>
          <div class="flex items-center gap-2">
            <n-button
              size="small"
              secondary
              @click="sharePickerOpen = true"
            >
              {{ t('wardrobe.share.customize') }}
            </n-button>
            <n-tooltip
              v-if="isHydrated && !isMobile"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :aria-label="
                    isShareLandscape
                      ? t('common.orientation.landscape')
                      : t('common.orientation.portrait')
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
                  ? t('common.orientation.landscape')
                  : t('common.orientation.portrait')
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
              {{ t('common.export_as_image') }}
            </n-tooltip>
          </div>
        </div>
      </template>

      <div class="flex justify-center">
        <ClientOnly>
          <div
            ref="shareCardRef"
            class="w-full max-w-4xl overflow-hidden rounded-2xl"
            :class="isShareLandscape ? 'aspect-video' : 'aspect-9/16 max-w-sm'"
          >
            <div
              v-if="isShareLandscape"
              class="flex h-full w-full overflow-hidden bg-linear-to-br from-sky-100 via-rose-50 to-amber-100 text-slate-900 dark:from-slate-950 dark:via-sky-950 dark:to-rose-950 dark:text-white"
            >
              <div class="flex w-[38%] flex-col gap-2 p-4 pr-2">
                <div class="shrink-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-[1.35rem] leading-none font-black">
                        {{ t('navigation.wardrobe') }}
                      </div>
                      <div
                        v-if="showProfileTag"
                        class="mt-1 text-sm opacity-70"
                      >
                        {{ activeProfileLabel }}
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <NuxtImg
                        src="/images/logo.webp"
                        :alt="t('navigation.title')"
                        class="h-7 w-7 rounded-md object-cover"
                        preset="iconSm"
                        fit="cover"
                        loading="lazy"
                        sizes="32px"
                      />
                      <div
                        class="text-xs font-semibold tracking-wider text-sky-600 dark:text-sky-300"
                      >
                        gongeo.us
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="activeShareOptions.showStats"
                  class="grid shrink-0 grid-cols-4 gap-1.5"
                >
                  <div
                    v-for="card in collectionCards"
                    :key="`share-left-stat-${card.key}`"
                    class="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-white/55 px-1 py-1 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10"
                  >
                    <n-icon
                      size="13"
                      class="shrink-0 opacity-60"
                    >
                      <component :is="card.icon" />
                    </n-icon>
                    <div class="text-xs leading-none font-black tabular-nums">
                      {{ card.percent }}%
                    </div>
                  </div>
                </div>

                <div
                  class="grid min-h-0 flex-1 grid-rows-2 items-stretch"
                  :class="activeShareOptions.showStats ? 'gap-3' : 'gap-4'"
                >
                  <div
                    v-for="entry in shareBannerEntries"
                    :key="`share-banner-${entry.slot.key}`"
                    class="min-h-0 w-full overflow-hidden rounded-2xl bg-white/45 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/15"
                  >
                    <template v-if="entry.item">
                      <div class="relative h-full">
                        <div
                          class="absolute inset-0 flex items-center justify-center overflow-hidden"
                        >
                          <NuxtImg
                            :src="entry.item.imageSrc"
                            :alt="entry.item.name"
                            class="h-full w-full object-cover"
                            preset="bannerHero"
                            fit="cover"
                            loading="lazy"
                            sizes="300px"
                          />
                        </div>
                        <div
                          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-3 text-white"
                        >
                          <div
                            class="text-[10px] font-semibold tracking-wider text-sky-200 uppercase"
                          >
                            {{ entry.slot.label }}
                          </div>
                          <div class="line-clamp-2 text-sm font-black">
                            {{ entry.item.name }}
                          </div>
                        </div>
                      </div>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-sm opacity-70 transition hover:opacity-100"
                      @click="openSharePicker(entry.slot.key)"
                    >
                      <span
                        class="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-current"
                      >
                        <n-icon size="18"><Plus /></n-icon>
                      </span>
                      <span>{{ t('wardrobe.share.empty_slot') }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 bg-white/20 p-4 pl-2 backdrop-blur-xs dark:bg-white/5"
              >
                <div class="min-h-0">
                  <div
                    class="mb-2 text-xs font-semibold tracking-wider uppercase opacity-60"
                  >
                    {{ t('wardrobe.share.lookbook') }}
                  </div>
                  <div class="grid h-[calc(100%-1.25rem)] grid-cols-3 gap-2">
                    <div
                      v-for="(entry, index) in shareOutfitEntries"
                      :key="`share-lookbook-${index}`"
                      class="flex min-h-0 flex-col"
                      :class="
                        entry
                          ? 'items-center justify-center'
                          : 'overflow-hidden rounded-xl bg-white/45 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10'
                      "
                    >
                      <template v-if="entry">
                        <OutfitCard
                          :outfit-id="entry.id"
                          :name="entry.name"
                          :quality="entry.quality"
                          show-info
                          size="lg"
                          class="h-full max-w-full rounded-xl [&_p]:text-xs [&_p]:leading-[1.05]"
                        />
                      </template>
                      <button
                        v-else
                        type="button"
                        class="flex h-36 w-full flex-col items-center justify-center gap-1.5 px-3 text-center text-xs opacity-60 transition hover:opacity-100"
                        @click="
                          openSharePicker(
                            index === 0
                              ? 'outfitFiveStar'
                              : index === 1
                                ? 'outfitFourStar'
                                : 'outfitThreeStar'
                          )
                        "
                      >
                        <span
                          class="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current"
                        >
                          <n-icon size="14"><Plus /></n-icon>
                        </span>
                        <span>{{ t('wardrobe.share.empty_slot') }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="shrink-0">
                  <div class="grid grid-cols-4 gap-2">
                    <div
                      v-for="entry in shareSignatureEntries"
                      :key="entry.slot.key"
                      class="flex h-40 flex-col gap-1 rounded-xl p-2 ring-1"
                      :class="getShareSignatureAccentClass(entry.slot.key)"
                    >
                      <div
                        class="truncate text-[10px] leading-tight font-semibold tracking-wide uppercase opacity-50"
                      >
                        {{ entry.slot.label }}
                      </div>
                      <div
                        class="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-white/40 p-1 dark:bg-white/10"
                      >
                        <NuxtImg
                          v-if="entry.item"
                          :src="entry.item.imageSrc"
                          :alt="entry.item.name"
                          class="max-h-full max-w-full object-contain"
                          :preset="entry.item.imagePreset"
                          fit="contain"
                          loading="lazy"
                          sizes="72px"
                        />
                        <button
                          v-else
                          type="button"
                          class="flex h-full w-full items-center justify-center opacity-70 transition hover:opacity-100"
                          @click="openSharePicker(entry.slot.key)"
                        >
                          <n-icon size="16"><Plus /></n-icon>
                        </button>
                      </div>
                      <div class="min-h-0 flex-1">
                        <div
                          class="line-clamp-2 text-xs leading-tight font-bold text-slate-900 dark:text-white"
                        >
                          {{
                            entry.item?.name ?? t('wardrobe.share.empty_slot')
                          }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="grid h-full w-full grid-rows-[auto_auto_1fr_auto] overflow-hidden bg-linear-to-b from-sky-100 via-rose-50 to-amber-100 p-4 text-slate-900 dark:from-slate-950 dark:via-sky-950 dark:to-rose-950 dark:text-white"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="mt-0.5 text-2xl leading-none font-black">
                    {{ t('navigation.wardrobe') }}
                  </div>
                  <div
                    v-if="showProfileTag"
                    class="mt-0.5 text-xs opacity-70"
                  >
                    {{ activeProfileLabel }}
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <NuxtImg
                    src="/images/logo.webp"
                    :alt="t('navigation.title')"
                    class="h-8 w-8 rounded-md object-cover"
                    preset="iconSm"
                    fit="cover"
                    loading="lazy"
                    sizes="32px"
                  />
                  <div
                    class="text-xs font-semibold tracking-wider text-sky-600 dark:text-sky-300"
                  >
                    gongeo.us
                  </div>
                </div>
              </div>

              <div
                class="mt-2 grid h-[clamp(12rem,49vw,13rem)] gap-2"
                :class="
                  activeShareOptions.showStats
                    ? 'grid-cols-[1fr_1.45fr]'
                    : 'grid-cols-[1.25fr_1.15fr]'
                "
              >
                <div
                  v-if="activeShareOptions.showStats"
                  class="grid h-full grid-cols-2 gap-1.5"
                >
                  <div
                    v-for="card in collectionCards"
                    :key="`share-portrait-stat-${card.key}`"
                    class="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl bg-white/55 p-1.5 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10"
                  >
                    <n-icon
                      size="14"
                      class="shrink-0 opacity-60"
                    >
                      <component :is="card.icon" />
                    </n-icon>
                    <div class="text-base leading-none font-black tabular-nums">
                      {{ card.percent }}%
                    </div>
                  </div>
                </div>

                <div class="grid h-full grid-rows-2 content-center gap-2">
                  <div
                    v-for="entry in shareBannerEntries"
                    :key="`share-portrait-banner-${entry.slot.key}`"
                    class="w-full overflow-hidden rounded-2xl bg-white/45 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/15"
                    :class="
                      activeShareOptions.showStats
                        ? 'aspect-2/1 self-center'
                        : 'min-h-0'
                    "
                  >
                    <template v-if="entry.item">
                      <div class="relative h-full">
                        <div
                          class="absolute inset-0 flex items-center justify-center overflow-hidden"
                        >
                          <NuxtImg
                            :src="entry.item.imageSrc"
                            :alt="entry.item.name"
                            class="h-full w-full object-cover"
                            preset="bannerHero"
                            fit="cover"
                            loading="lazy"
                            sizes="240px"
                          />
                        </div>
                        <div
                          v-if="activeShareOptions.showStats"
                          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-2.5 text-white"
                        >
                          <div
                            class="text-[9px] font-semibold tracking-wider text-sky-200 uppercase"
                          >
                            {{ entry.slot.label }}
                          </div>
                          <div class="line-clamp-2 text-xs font-black">
                            {{ entry.item.name }}
                          </div>
                        </div>
                      </div>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-xs opacity-70 transition hover:opacity-100"
                      @click="openSharePicker(entry.slot.key)"
                    >
                      <span
                        class="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-current"
                      >
                        <n-icon size="16"><Plus /></n-icon>
                      </span>
                      <span>{{ t('wardrobe.share.empty_slot') }}</span>
                    </button>
                  </div>
                </div>

                <div
                  v-if="!activeShareOptions.showStats"
                  class="grid h-full grid-rows-2 gap-2"
                >
                  <button
                    v-for="entry in shareBannerEntries"
                    :key="`share-portrait-banner-copy-${entry.slot.key}`"
                    type="button"
                    class="flex min-h-0 flex-col justify-center rounded-2xl bg-linear-to-br from-sky-100/80 via-white/50 to-amber-100/70 p-3 text-left ring-1 ring-sky-100/80 transition hover:from-sky-100 hover:to-amber-100 dark:from-sky-950/50 dark:via-white/10 dark:to-amber-950/40 dark:ring-white/10 dark:hover:bg-white/15"
                    @click="openSharePicker(entry.slot.key)"
                  >
                    <div
                      class="text-[10px] leading-tight font-semibold tracking-wider text-sky-600 uppercase dark:text-sky-300"
                    >
                      {{ entry.slot.label }}
                    </div>
                    <div
                      class="mt-1 line-clamp-2 text-sm leading-tight font-black"
                    >
                      {{ entry.item?.name ?? t('wardrobe.share.empty_slot') }}
                    </div>
                  </button>
                </div>
              </div>

              <div class="mt-3 min-h-0">
                <div
                  class="mb-1 text-xs font-semibold tracking-wider uppercase opacity-60"
                >
                  {{ t('wardrobe.share.lookbook') }}
                </div>
                <div class="grid h-[calc(100%-1.25rem)] grid-cols-3 gap-2">
                  <div
                    v-for="(entry, index) in shareOutfitEntries"
                    :key="`share-portrait-lookbook-${index}`"
                    class="flex min-h-0 flex-col"
                    :class="
                      entry
                        ? 'items-center justify-center'
                        : 'overflow-hidden rounded-xl bg-white/45 ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10'
                    "
                  >
                    <template v-if="entry">
                      <OutfitCard
                        :outfit-id="entry.id"
                        :name="entry.name"
                        :quality="entry.quality"
                        show-info
                        size="lg"
                        class="h-full max-w-full rounded-xl [&_p]:text-xs [&_p]:leading-[1.05]"
                      />
                    </template>
                    <button
                      v-else
                      type="button"
                      class="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-[10px] opacity-60 transition hover:opacity-100"
                      @click="
                        openSharePicker(
                          index === 0
                            ? 'outfitFiveStar'
                            : index === 1
                              ? 'outfitFourStar'
                              : 'outfitThreeStar'
                        )
                      "
                    >
                      <span
                        class="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-current"
                      >
                        <n-icon size="12"><Plus /></n-icon>
                      </span>
                      <span>{{ t('wardrobe.share.empty_slot') }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-2 grid h-44 grid-cols-2 gap-2">
                <div
                  v-for="entry in shareSignatureEntries"
                  :key="`share-portrait-${entry.slot.key}`"
                  class="grid min-h-0 grid-rows-[0.75rem_minmax(0,1fr)] rounded-xl p-1.5 ring-1"
                  :class="getShareSignatureAccentClass(entry.slot.key)"
                >
                  <div
                    class="line-clamp-1 h-3 text-[9px] leading-tight font-semibold tracking-wide uppercase opacity-50"
                  >
                    {{ entry.slot.label }}
                  </div>
                  <div class="mt-1 flex min-h-0 items-center gap-2.5">
                    <div
                      class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/40 p-1 dark:bg-white/10"
                    >
                      <NuxtImg
                        v-if="entry.item"
                        :src="entry.item.imageSrc"
                        :alt="entry.item.name"
                        class="max-h-full max-w-full object-contain"
                        :preset="entry.item.imagePreset"
                        fit="contain"
                        loading="lazy"
                        sizes="64px"
                      />
                      <button
                        v-else
                        type="button"
                        class="flex h-full w-full items-center justify-center opacity-70 transition hover:opacity-100"
                        @click="openSharePicker(entry.slot.key)"
                      >
                        <n-icon size="14"><Plus /></n-icon>
                      </button>
                    </div>
                    <div class="min-w-0">
                      <div
                        class="line-clamp-2 text-[11px] leading-[1.05] font-bold"
                      >
                        {{ entry.item?.name ?? t('wardrobe.share.empty_slot') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <template #fallback>
            <div
              class="aspect-9/16 w-full max-w-sm overflow-hidden rounded-2xl bg-linear-to-b from-sky-100 via-rose-50 to-amber-100 sm:aspect-video sm:max-w-4xl dark:from-slate-950 dark:via-sky-950 dark:to-rose-950"
            ></div>
          </template>
        </ClientOnly>
      </div>
    </n-card>

    <n-modal
      v-model:show="sharePickerOpen"
      preset="card"
      :title="t('wardrobe.share.customize_title')"
      class="max-h-[calc(100dvh-2rem)] max-w-5xl"
      content-class="flex min-h-0 flex-col overflow-hidden"
      :bordered="false"
    >
      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div class="min-h-0 space-y-2 lg:overflow-y-auto lg:pr-1">
          <div
            class="rounded-xl border border-gray-100 bg-white/60 p-3 dark:border-gray-800 dark:bg-gray-950/40"
          >
            <n-checkbox
              :checked="activeShareOptions.showStats"
              @update:checked="setShareOption('showStats', $event)"
            >
              {{ t('wardrobe.share.options.show_stats') }}
            </n-checkbox>
          </div>

          <n-select
            v-model:value="activeSharePickSlotKey"
            class="lg:hidden"
            :options="sharePickSlotOptions"
            :show-checkmark="false"
          />
          <button
            v-for="slot in sharePickSlots"
            :key="slot.key"
            type="button"
            class="hidden w-full rounded-xl border p-3 text-left transition lg:block"
            :class="
              activeSharePickSlotKey === slot.key
                ? 'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40'
                : 'border-gray-100 bg-white/60 hover:border-sky-200 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-sky-900'
            "
            @click="activeSharePickSlotKey = slot.key"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-semibold">
                  {{ slot.label }}
                </div>
                <div class="line-clamp-1 text-xs opacity-60">
                  {{
                    getShareSlotEntry(slot.key)?.name ??
                    t('wardrobe.share.empty_slot')
                  }}
                </div>
              </div>
              <n-button
                v-if="getSavedSharePickId(slot.key) !== null"
                size="tiny"
                text
                @click.stop="clearSharePick(slot.key)"
              >
                {{ t('common.clear') }}
              </n-button>
            </div>
          </button>
        </div>

        <div class="flex min-h-0 min-w-0 flex-col gap-3">
          <div class="shrink-0">
            <div class="text-base font-semibold">
              {{ activeSharePickSlot?.label }}
            </div>
            <div class="text-sm opacity-60">
              {{ activeSharePickSlot?.description }}
            </div>
          </div>

          <n-input
            v-model:value="sharePickerSearch"
            class="shrink-0"
            clearable
            :placeholder="t('wardrobe.share.search_placeholder')"
          />

          <n-scrollbar class="min-h-0 flex-1 pr-2">
            <div
              v-if="activeSharePickCandidates.length > 0"
              class="grid gap-2 p-1 sm:content-start sm:gap-3"
              :class="
                activeSharePickSlot?.entity === 'banner'
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-3 sm:grid-cols-6'
              "
            >
              <button
                v-for="(candidate, index) in paginatedSharePickCandidates"
                :key="candidate.key"
                type="button"
                class="group relative block cursor-pointer text-left"
                :class="getListingCardAnimationClass(index)"
                :style="getListingCardAnimationStyle(index)"
                @click="setSharePick(activeSharePickSlotKey, candidate.id)"
              >
                <div
                  class="relative overflow-hidden rounded-lg bg-cover bg-center shadow-md transition-shadow duration-300 group-hover:shadow-xl"
                  :class="[
                    candidate.entity === 'banner' ? 'aspect-2/1' : 'aspect-2/3',
                    candidate.entity === 'momo'
                      ? `bg-[url('/images/momo_bg.webp')]`
                      : `bg-[url('/images/bg.webp')]`,
                  ]"
                  :style="
                    getSavedSharePickId(activeSharePickSlotKey) === candidate.id
                      ? getQualityRingStyle(candidate.quality)
                      : undefined
                  "
                >
                  <div
                    class="absolute inset-0"
                    :class="getListingQualityOverlayClass(candidate.quality)"
                  ></div>
                  <NuxtImg
                    :src="candidate.listingImageSrc"
                    :alt="candidate.name"
                    class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    :class="{ 'object-top': candidate.entity === 'outfit' }"
                    :preset="candidate.listingImagePreset"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div class="absolute top-2 right-2 z-20">
                    <n-tag
                      round
                      size="small"
                      :bordered="false"
                      :color="getQualityTagTheme(candidate.quality)"
                      class="backdrop-blur-xs"
                    >
                      <span class="flex items-center gap-1">
                        {{ candidate.quality }}
                        <n-icon>
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </div>
                  <div
                    class="absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/90 to-transparent p-3"
                  >
                    <p
                      class="line-clamp-2 text-xs font-semibold text-white sm:text-sm"
                    >
                      {{ candidate.name }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
            <n-empty
              v-else
              :description="t('wardrobe.share.no_candidates')"
            />
          </n-scrollbar>

          <div
            v-if="activeSharePickCandidates.length > 0"
            class="shrink-0 overflow-hidden pt-1"
          >
            <n-pagination
              v-model:page="sharePickerPage"
              class="justify-center"
              :page-size="sharePickerPageSize"
              :item-count="activeSharePickCandidates.length"
              :show-size-picker="false"
              :page-slot="5"
            >
              <template #prefix="{ itemCount }">
                <div
                  class="inline-flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ activeSharePickCandidates.length }}
                  </span>
                  <span>
                    {{
                      itemCount === 1
                        ? t('wardrobe.share.match')
                        : t('wardrobe.share.matches')
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-modal>

    <n-card
      v-if="initialized && totalOwnedEntries === 0"
      size="small"
      class="rounded-xl"
      content-class="p-4"
    >
      <n-result
        size="small"
        status="info"
        :title="t('wardrobe.empty_title')"
        :description="t('wardrobe.empty_description')"
      >
        <template #footer>
          <div class="flex justify-center gap-2">
            <NuxtLinkLocale to="/items">
              <n-button type="primary">
                {{ t('wardrobe.open_items') }}
              </n-button>
            </NuxtLinkLocale>
            <NuxtLinkLocale to="/tracker">
              <n-button>
                {{ t('navigation.tracker') }}
              </n-button>
            </NuxtLinkLocale>
          </div>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import {
    ChevronDown,
    CheckCircle,
    Cog,
    ExternalLinkAlt,
    FileExport,
    FileImageRegular,
    FileImport,
    ListAlt,
    PaintBrush,
    Paw,
    Plus,
    Star,
    Sync,
    Tshirt,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import momoSourceGroups from '~~/data/momoSource.json'
  import sourceGroups from '~~/data/source.json'

  const { t, locale } = useI18n()
  const message = useMessage()
  const dialog = useDialog()
  const { activeSlot, slots, getSlotLabel } = useProfileSlots()
  const wardrobeSummaryScope = ref<WardrobeSummaryScope>('base')
  const {
    ownedItemIds,
    ownedMakeupIds,
    ownedMomoIds,
    initialized,
    loading: wardrobeLoading,
    error: wardrobeError,
    canMutate,
    mutationVersion,
    retry,
    getTrackerWardrobeImportPreview,
    markWardrobeIdsOwned,
  } = useWardrobe()
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    load: loadSummary,
  } = useWardrobeSummary({ scope: wardrobeSummaryScope })
  const {
    activeRegionScope,
    onboardingCompleted,
    activeShareSettings,
    setActiveRegionScope,
    setActiveShareSettings,
    updateActiveProfileSettings,
    completeOnboarding,
  } = useWardrobeSettings()

  const catalogIndex = useCatalogIndex()
  const { loadData, loadWardrobe } = useIndexedDB()
  const { processJsonImport } = useBannerPullData()
  const { getImageSrc } = imageProvider()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = computed(() => !breakpoints.greater('sm').value)
  const importing = ref(false)
  const importingProfileFile = ref(false)
  const exportingProfileJson = ref(false)
  const markingF2PBasics = ref(false)
  const loadingTrackerImportPreview = ref(false)
  const trackerImportPreview = ref<Awaited<
    ReturnType<typeof getTrackerWardrobeImportPreview>
  > | null>(null)
  const trackerImportPreviewRequestId = ref(0)
  const profileFileInputRef = ref<HTMLInputElement | null>(null)
  const shareCardRef = ref<HTMLElement | null>(null)
  const isHydrated = ref(false)
  const isShareLandscape = ref(false)
  const sharePickerOpen = ref(false)
  const wardrobeSettingsOpen = ref(false)
  const sharePickerSearch = ref('')
  const showAllSlots = ref(false)
  const showAllVersions = ref(false)
  const onboardingLastStep = 4
  const onboardingStep = ref(1)
  const onboardingRegionScope = ref<CatalogRegionScope>(
    activeRegionScope.value === 'global' && locale.value === 'zh'
      ? 'cn'
      : activeRegionScope.value
  )
  const onboardingSteps = computed(() => [
    { step: 1, label: t('wardrobe.onboarding.region_step') },
    { step: 2, label: t('wardrobe.f2p_basics') },
    { step: 3, label: t('wardrobe.resonance_collection') },
    { step: 4, label: t('wardrobe.onboarding.tracking_step') },
  ])

  const activeProfileLabel = computed(() => getSlotLabel(activeSlot.value))
  const showProfileTag = computed(
    () => slots.value.filter((slot) => slot.exists).length > 1
  )
  const totalOwnedEntries = computed(
    () =>
      ownedItemIds.value.length +
      ownedMakeupIds.value.length +
      ownedMomoIds.value.length
  )
  const isSummaryLoading = computed(
    () => !summary.value && (summaryLoading.value || wardrobeLoading.value)
  )
  const formatCount = (value: number | undefined) =>
    new Intl.NumberFormat().format(value ?? 0)

  const formatPercent = (value: number | undefined) => value ?? 0
  const wardrobeRegionOptions = computed(() => {
    const globalOption = {
      label: t('wardrobe.region.global'),
      value: 'global' as const,
    }
    const cnOption = {
      label: t('import.regions.china'),
      value: 'cn' as const,
    }
    return locale.value === 'zh'
      ? [cnOption, globalOption]
      : [globalOption, cnOption]
  })
  const showWardrobeOnboarding = computed(
    () => initialized.value && !onboardingCompleted.value
  )
  const onboardingRegionLabel = computed(
    () =>
      wardrobeRegionOptions.value.find(
        (option) => option.value === onboardingRegionScope.value
      )?.label ?? t('wardrobe.region.global')
  )
  const handleRegionScopeChange = (value: string) => {
    setActiveRegionScope(normalizeCatalogRegionScope(value))
  }

  const getWardrobeStatsQuery = (
    query: Record<string, string | number>,
    includeVariations = true
  ): Record<string, string | number> => ({
    ...query,
    wardrobe: 'missing',
    ...(includeVariations && wardrobeSummaryScope.value === 'all'
      ? { variations: 'all' }
      : {}),
  })

  const getWardrobeOwnedQuery = (
    query: Record<string, string | number>,
    includeVariations = true
  ): Record<string, string | number> => ({
    ...query,
    wardrobe: 'owned',
    ...(includeVariations && wardrobeSummaryScope.value === 'all'
      ? { variations: 'all' }
      : {}),
  })

  type SharePickSlotKey =
    | 'bannerFiveStar'
    | 'bannerFourStar'
    | 'outfitFiveStar'
    | 'outfitFourStar'
    | 'outfitThreeStar'
    | 'dress'
    | 'hair'
    | 'item'
    | 'momo'

  type SharePickEntity = 'banner' | 'outfit' | 'item' | 'momo'

  type WardrobeSharePicks = Record<SharePickSlotKey, number | null>

  type SharePickSlot = {
    key: SharePickSlotKey
    label: string
    description: string
    entity: SharePickEntity
  }

  type WardrobeShareOptions = {
    showStats: boolean
  }

  type WardrobeShareProfileState = {
    picks?: Partial<WardrobeSharePicks>
    options?: Partial<WardrobeShareOptions>
  }

  type SharePickCandidate = {
    key: string
    id: number
    entity: SharePickEntity
    name: string
    eyebrow: string
    quality: number
    imageSrc: string
    imagePreset: 'bannerHero' | 'tallLg' | 'tallSm' | 'iconLg' | 'iconSm'
    listingImageSrc: string
    listingImagePreset: 'bannerThumb' | 'tallLg' | 'tallSm'
  }

  const SHARE_PICK_SLOT_KEYS: SharePickSlotKey[] = [
    'bannerFiveStar',
    'bannerFourStar',
    'outfitFiveStar',
    'outfitFourStar',
    'outfitThreeStar',
    'dress',
    'hair',
    'item',
    'momo',
  ]

  const createEmptySharePicks = (): WardrobeSharePicks => ({
    bannerFiveStar: null,
    bannerFourStar: null,
    outfitFiveStar: null,
    outfitFourStar: null,
    outfitThreeStar: null,
    dress: null,
    hair: null,
    item: null,
    momo: null,
  })

  const normalizeSharePicks = (
    value: Partial<WardrobeSharePicks> | null | undefined
  ): WardrobeSharePicks => {
    const normalized = createEmptySharePicks()

    SHARE_PICK_SLOT_KEYS.forEach((key) => {
      const candidate = value?.[key]
      normalized[key] =
        typeof candidate === 'number' && Number.isSafeInteger(candidate)
          ? candidate
          : null
    })

    return normalized
  }

  const createDefaultShareOptions = (): WardrobeShareOptions => ({
    showStats: true,
  })

  const normalizeShareOptions = (
    value: Partial<WardrobeShareOptions> | null | undefined
  ): WardrobeShareOptions => ({
    ...createDefaultShareOptions(),
    ...(typeof value?.showStats === 'boolean'
      ? { showStats: value.showStats }
      : {}),
  })

  const activeSharePickSlotKey = ref<SharePickSlotKey>('bannerFiveStar')
  const sharePickerPage = ref(1)
  const sharePickerPageSize = 18
  const activeShareState = computed(
    () => activeShareSettings.value as WardrobeShareProfileState
  )
  const activeSharePicks = computed(() =>
    normalizeSharePicks(activeShareState.value.picks)
  )
  const activeShareOptions = computed(() =>
    normalizeShareOptions(activeShareState.value.options)
  )

  const ownedItemIdSet = computed(() => new Set(ownedItemIds.value))
  const ownedMomoIdSet = computed(() => new Set(ownedMomoIds.value))

  const updateSharePicks = (
    updater: (current: WardrobeSharePicks) => WardrobeSharePicks
  ) => {
    setActiveShareSettings({
      ...activeShareSettings.value,
      picks: updater(activeSharePicks.value),
    })
  }

  const getSavedSharePickId = (slotKey: SharePickSlotKey) =>
    activeSharePicks.value[slotKey]

  const setSharePick = (slotKey: SharePickSlotKey, id: number) => {
    updateSharePicks((current) => ({
      ...current,
      [slotKey]: id,
    }))
  }

  const openSharePicker = (slotKey: SharePickSlotKey) => {
    activeSharePickSlotKey.value = slotKey
    sharePickerOpen.value = true
  }

  const clearSharePick = (slotKey: SharePickSlotKey) => {
    updateSharePicks((current) => ({
      ...current,
      [slotKey]: null,
    }))
  }

  const setShareOption = <Key extends keyof WardrobeShareOptions>(
    key: Key,
    value: WardrobeShareOptions[Key]
  ) => {
    setActiveShareSettings({
      ...activeShareSettings.value,
      options: {
        ...activeShareOptions.value,
        [key]: value,
      },
    })
  }

  const sharePickSlots = computed<SharePickSlot[]>(() => [
    {
      key: 'bannerFiveStar',
      label: t('wardrobe.share.slots.banner_five_star'),
      description: t('wardrobe.share.slot_descriptions.banner_five_star'),
      entity: 'banner',
    },
    {
      key: 'bannerFourStar',
      label: t('wardrobe.share.slots.banner_four_star'),
      description: t('wardrobe.share.slot_descriptions.banner_four_star'),
      entity: 'banner',
    },
    {
      key: 'outfitFiveStar',
      label: t('wardrobe.share.slots.outfit_five_star'),
      description: t('wardrobe.share.slot_descriptions.outfit_five_star'),
      entity: 'outfit',
    },
    {
      key: 'outfitFourStar',
      label: t('wardrobe.share.slots.outfit_four_star'),
      description: t('wardrobe.share.slot_descriptions.outfit_four_star'),
      entity: 'outfit',
    },
    {
      key: 'outfitThreeStar',
      label: t('wardrobe.share.slots.outfit_three_star'),
      description: t('wardrobe.share.slot_descriptions.outfit_three_star'),
      entity: 'outfit',
    },
    {
      key: 'dress',
      label: t('wardrobe.share.slots.dress'),
      description: t('wardrobe.share.slot_descriptions.dress'),
      entity: 'item',
    },
    {
      key: 'hair',
      label: t('wardrobe.share.slots.hair'),
      description: t('wardrobe.share.slot_descriptions.hair'),
      entity: 'item',
    },
    {
      key: 'item',
      label: t('wardrobe.share.slots.item'),
      description: t('wardrobe.share.slot_descriptions.item'),
      entity: 'item',
    },
    {
      key: 'momo',
      label: t('wardrobe.share.slots.momo'),
      description: t('wardrobe.share.slot_descriptions.momo'),
      entity: 'momo',
    },
  ])

  const activeSharePickSlot = computed(
    () =>
      sharePickSlots.value.find(
        (slot) => slot.key === activeSharePickSlotKey.value
      ) ?? sharePickSlots.value[0]
  )

  const sharePickSlotOptions = computed(() =>
    sharePickSlots.value.map((slot) => ({
      label: slot.label,
      value: slot.key,
    }))
  )

  const createOutfitShareCandidate = (
    outfit: NonNullable<typeof catalogIndex.index.value>['outfits'][number]
  ): SharePickCandidate => ({
    key: `outfit-${outfit.id}`,
    id: outfit.id,
    entity: 'outfit',
    name: t(`outfit.${outfit.id}.name`),
    eyebrow: t('wardrobe.share.entity.outfit', { quality: outfit.quality }),
    quality: outfit.quality,
    imageSrc: getImageSrc('outfit', outfit.id),
    imagePreset: 'tallSm',
    listingImageSrc: getImageSrc('outfit', outfit.id),
    listingImagePreset: 'tallLg',
  })

  const createBannerShareCandidate = (banner: Banner): SharePickCandidate => ({
    key: `banner-${banner.bannerId}`,
    id: banner.bannerId,
    entity: 'banner',
    name: t(`banner.${banner.bannerId}.name`),
    eyebrow: t('wardrobe.share.entity.banner', {
      quality: banner.bannerType === 3 ? 4 : 5,
    }),
    quality: banner.bannerType === 3 ? 4 : 5,
    imageSrc: getImageSrc('banner', banner.bannerId),
    imagePreset: 'bannerHero',
    listingImageSrc: getImageSrc('bannerThumb', banner.bannerId),
    listingImagePreset: 'bannerThumb',
  })

  const createItemShareCandidate = (
    item: NonNullable<typeof catalogIndex.index.value>['items'][number]
  ): SharePickCandidate => ({
    key: `item-${item.id}`,
    id: item.id,
    entity: 'item',
    name: t(`item.${item.id}.name`),
    eyebrow: t(`type.${item.type}`),
    quality: item.quality,
    imageSrc: getImageSrc('itemIcon', item.id),
    imagePreset: 'iconLg',
    listingImageSrc: getImageSrc('item', item.id),
    listingImagePreset: 'tallLg',
  })

  const createMomoShareCandidate = (
    momo: NonNullable<typeof catalogIndex.index.value>['momo'][number]
  ): SharePickCandidate => ({
    key: `momo-${momo.id}`,
    id: momo.id,
    entity: 'momo',
    name: t(`momo.${momo.id}.name`),
    eyebrow: t('common.momo_entry'),
    quality: momo.quality,
    imageSrc: getImageSrc('momoIcon', momo.id),
    imagePreset: 'iconLg',
    listingImageSrc: getImageSrc('momo', momo.id),
    listingImagePreset: 'tallLg',
  })

  const ownedOutfitCandidates = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return []

    return index.outfits
      .filter((outfit) => {
        const itemIds = filterCatalogIdsByRegionScope(
          'item',
          index.outfitItemsById.get(outfit.id) ?? [],
          activeRegionScope.value
        )
        return (
          getOutfitVariantType(String(outfit.id)) === 'base' &&
          itemIds.length > 0 &&
          itemIds.every((itemId) => ownedItemIdSet.value.has(itemId))
        )
      })
      .sort((left, right) => right.quality - left.quality || left.id - right.id)
      .map(createOutfitShareCandidate)
  })

  const fiveStarBannerCandidates = computed(() =>
    Object.values(BANNER_DATA)
      .filter((banner) => banner.bannerType === 2)
      .sort((left, right) => right.bannerId - left.bannerId)
      .map(createBannerShareCandidate)
  )

  const fourStarBannerCandidates = computed(() =>
    Object.values(BANNER_DATA)
      .filter((banner) => banner.bannerType === 3)
      .sort((left, right) => right.bannerId - left.bannerId)
      .map(createBannerShareCandidate)
  )

  const ownedDressCandidates = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return []

    return index.items
      .filter(
        (item) =>
          item.type === 'dresses' &&
          getItemVariantType(item.id) === 'base' &&
          ownedItemIdSet.value.has(item.id) &&
          isCatalogEntryAvailableInScope(
            'item',
            item.id,
            activeRegionScope.value
          )
      )
      .sort((left, right) => right.quality - left.quality || left.id - right.id)
      .map(createItemShareCandidate)
  })

  const ownedHairCandidates = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return []

    return index.items
      .filter(
        (item) =>
          item.type === 'hair' &&
          getItemVariantType(item.id) === 'base' &&
          ownedItemIdSet.value.has(item.id) &&
          isCatalogEntryAvailableInScope(
            'item',
            item.id,
            activeRegionScope.value
          )
      )
      .sort((left, right) => right.quality - left.quality || left.id - right.id)
      .map(createItemShareCandidate)
  })

  const ownedStatementCandidates = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return []

    return index.items
      .filter((item) => ownedItemIdSet.value.has(item.id))
      .filter((item) => getItemVariantType(item.id) === 'base')
      .filter((item) =>
        isCatalogEntryAvailableInScope('item', item.id, activeRegionScope.value)
      )
      .sort((left, right) => right.quality - left.quality || left.id - right.id)
      .map(createItemShareCandidate)
  })

  const ownedMomoCandidates = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return []

    return index.momo
      .filter((momo) => ownedMomoIdSet.value.has(momo.id))
      .filter((momo) =>
        isCatalogEntryAvailableInScope('momo', momo.id, activeRegionScope.value)
      )
      .sort((left, right) => right.quality - left.quality || left.id - right.id)
      .map(createMomoShareCandidate)
  })

  const getCandidatesForShareSlot = (slotKey: SharePickSlotKey) => {
    switch (slotKey) {
      case 'bannerFiveStar':
        return fiveStarBannerCandidates.value
      case 'bannerFourStar':
        return fourStarBannerCandidates.value
      case 'outfitFiveStar':
        return ownedOutfitCandidates.value.filter(
          (candidate) => candidate.quality === 5
        )
      case 'outfitFourStar':
        return ownedOutfitCandidates.value.filter(
          (candidate) => candidate.quality === 4
        )
      case 'outfitThreeStar':
        return ownedOutfitCandidates.value.filter(
          (candidate) => candidate.quality === 3
        )
      case 'dress':
        return ownedDressCandidates.value
      case 'hair':
        return ownedHairCandidates.value
      case 'item':
        return ownedStatementCandidates.value
      case 'momo':
        return ownedMomoCandidates.value
      default: {
        const exhaustive: never = slotKey
        return exhaustive
      }
    }
  }

  const getShareSlotEntry = (slotKey: SharePickSlotKey) => {
    const candidates = getCandidatesForShareSlot(slotKey)
    const savedId = getSavedSharePickId(slotKey)
    if (savedId === null) return null
    return candidates.find((candidate) => candidate.id === savedId) ?? null
  }

  const shareBannerEntries = computed(() =>
    (['bannerFiveStar', 'bannerFourStar'] as const).map((slotKey) => ({
      slot: sharePickSlots.value.find((slot) => slot.key === slotKey)!,
      item: getShareSlotEntry(slotKey),
    }))
  )
  const shareOutfitEntries = computed(() => [
    getShareSlotEntry('outfitFiveStar'),
    getShareSlotEntry('outfitFourStar'),
    getShareSlotEntry('outfitThreeStar'),
  ])
  const shareSignatureEntries = computed(() =>
    (['dress', 'hair', 'item', 'momo'] as const).map((slotKey) => ({
      slot: sharePickSlots.value.find((slot) => slot.key === slotKey)!,
      item: getShareSlotEntry(slotKey),
    }))
  )

  const getShareSignatureAccentClass = (slotKey: SharePickSlotKey) => {
    switch (slotKey) {
      case 'dress':
        return 'bg-linear-to-br from-rose-50/90 via-white/55 to-amber-50/80 ring-rose-100/80 dark:from-rose-950/35 dark:via-white/10 dark:to-amber-950/30 dark:ring-rose-900/30'
      case 'hair':
        return 'bg-linear-to-br from-emerald-50/90 via-white/55 to-sky-50/80 ring-emerald-100/80 dark:from-emerald-950/35 dark:via-white/10 dark:to-sky-950/30 dark:ring-emerald-900/30'
      case 'item':
        return 'bg-linear-to-br from-violet-50/90 via-white/55 to-sky-50/80 ring-violet-100/80 dark:from-violet-950/35 dark:via-white/10 dark:to-sky-950/30 dark:ring-violet-900/30'
      case 'momo':
        return 'bg-linear-to-br from-slate-50/95 via-white/55 to-cyan-50/80 ring-cyan-100/80 dark:from-slate-900/70 dark:via-white/10 dark:to-cyan-950/30 dark:ring-cyan-900/30'
      default:
        return 'bg-white/45 ring-white/60 dark:bg-white/10 dark:ring-white/10'
    }
  }

  const activeSharePickCandidates = computed(() => {
    const slotKey = activeSharePickSlotKey.value
    const query = sharePickerSearch.value.trim().toLowerCase()
    const candidates = getCandidatesForShareSlot(slotKey)

    if (!query) return candidates

    return candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(query) ||
        candidate.eyebrow.toLowerCase().includes(query) ||
        String(candidate.id).includes(query)
    )
  })

  const paginatedSharePickCandidates = computed(() => {
    const start = (sharePickerPage.value - 1) * sharePickerPageSize
    return activeSharePickCandidates.value.slice(
      start,
      start + sharePickerPageSize
    )
  })

  type SourceGroupDefinition = {
    key: string
    ids: number[]
  }

  const F2P_BASIC_SOURCE_KEYS = new Set([
    'cadenceborn',
    'chest',
    'heart',
    'home',
    'merchant',
    'miracle',
    'miracrown',
    'quest',
    'surprise',
    'world',
  ])
  const f2pBasicSourceIds = new Set(
    (sourceGroups as SourceGroupDefinition[])
      .filter((group) => F2P_BASIC_SOURCE_KEYS.has(group.key))
      .flatMap((group) => group.ids)
  )
  const F2P_BASIC_MOMO_SOURCE_KEYS = new Set([
    'cadenceborn',
    'course',
    'merchant',
    'permanent',
    'quest',
  ])
  const f2pBasicMomoSourceIds = new Set(
    (momoSourceGroups as SourceGroupDefinition[])
      .filter((group) => F2P_BASIC_MOMO_SOURCE_KEYS.has(group.key))
      .flatMap((group) => group.ids)
  )

  const f2pBasicMissingWardrobeIds = computed(() => {
    const index = catalogIndex.index.value
    if (!index) return { itemIds: [], makeupIds: [], momoIds: [] }

    const itemIds = new Set<number>()
    const makeupIds = new Set<number>()
    const momoIds = new Set<number>()

    index.outfits.forEach((outfit) => {
      if (
        typeof outfit.obtain_type !== 'number' ||
        !f2pBasicSourceIds.has(outfit.obtain_type)
      ) {
        return
      }

      index.outfitItemsById
        .get(outfit.id)
        ?.filter((itemId) =>
          isCatalogEntryAvailableInScope(
            'item',
            itemId,
            activeRegionScope.value
          )
        )
        .forEach((itemId) => itemIds.add(itemId))
    })

    index.items.forEach((item) => {
      if (
        typeof item.obtain_type === 'number' &&
        f2pBasicSourceIds.has(item.obtain_type) &&
        isCatalogEntryAvailableInScope('item', item.id, activeRegionScope.value)
      ) {
        itemIds.add(item.id)
      }
    })

    index.makeups.forEach((makeup) => {
      if (
        typeof makeup.obtain_type !== 'number' ||
        !f2pBasicSourceIds.has(makeup.obtain_type)
      ) {
        return
      }

      if (makeup.type === 'fullMakeup') {
        index.makeupItemsById
          .get(makeup.id)
          ?.filter((makeupId) =>
            isCatalogEntryAvailableInScope(
              'makeup',
              makeupId,
              activeRegionScope.value
            )
          )
          .forEach((makeupId) => makeupIds.add(makeupId))
        return
      }

      if (
        isCatalogEntryAvailableInScope(
          'makeup',
          makeup.id,
          activeRegionScope.value
        )
      ) {
        makeupIds.add(makeup.id)
      }
    })

    index.momo.forEach((momo) => {
      if (
        typeof momo.obtain_type === 'number' &&
        f2pBasicMomoSourceIds.has(momo.obtain_type) &&
        isCatalogEntryAvailableInScope('momo', momo.id, activeRegionScope.value)
      ) {
        momoIds.add(momo.id)
      }
    })

    return {
      itemIds: Array.from(itemIds)
        .filter((itemId) => !ownedItemIds.value.includes(itemId))
        .sort((left, right) => left - right),
      makeupIds: Array.from(makeupIds)
        .filter((makeupId) => !ownedMakeupIds.value.includes(makeupId))
        .sort((left, right) => left - right),
      momoIds: Array.from(momoIds)
        .filter((momoId) => !ownedMomoIds.value.includes(momoId))
        .sort((left, right) => left - right),
    }
  })
  const f2pBasicMissingCount = computed(
    () =>
      f2pBasicMissingWardrobeIds.value.itemIds.length +
      f2pBasicMissingWardrobeIds.value.makeupIds.length +
      f2pBasicMissingWardrobeIds.value.momoIds.length
  )
  const f2pBasicsCountLabel = computed(() =>
    f2pBasicMissingCount.value > 0
      ? formatCount(f2pBasicMissingCount.value)
      : t('wardrobe.complete')
  )
  const resonanceCollectionMissingCount = computed(
    () => trackerImportPreview.value?.imported ?? 0
  )
  const resonanceCollectionCountLabel = computed(() => {
    if (loadingTrackerImportPreview.value) return t('common.loading')
    return resonanceCollectionMissingCount.value > 0
      ? formatCount(resonanceCollectionMissingCount.value)
      : t('wardrobe.complete')
  })
  const canMarkF2PBasics = computed(
    () =>
      canMutate.value &&
      !markingF2PBasics.value &&
      f2pBasicMissingCount.value > 0
  )
  const canImportResonanceCollection = computed(
    () =>
      canMutate.value &&
      !importing.value &&
      !loadingTrackerImportPreview.value &&
      resonanceCollectionMissingCount.value > 0
  )
  const collectionCards = computed(() => [
    {
      key: 'outfits',
      label: t('common.outfits'),
      icon: Tshirt,
      percent: formatPercent(summary.value?.outfits.completionPercent),
      detail: t('wardrobe.collection_detail', {
        owned: formatCount(summary.value?.outfits.owned),
        total: formatCount(summary.value?.outfits.total),
      }),
      to: { path: '/outfits', query: getWardrobeOwnedQuery({}) },
    },
    {
      key: 'items',
      label: t('common.items'),
      icon: ListAlt,
      percent: formatPercent(summary.value?.items.completionPercent),
      detail: t('wardrobe.collection_detail', {
        owned: formatCount(summary.value?.items.owned),
        total: formatCount(summary.value?.items.total),
      }),
      to: { path: '/items', query: getWardrobeOwnedQuery({}) },
    },
    {
      key: 'makeups',
      label: t('common.makeups'),
      icon: PaintBrush,
      percent: formatPercent(summary.value?.makeups.completionPercent),
      detail: t('wardrobe.collection_detail', {
        owned: formatCount(summary.value?.makeups.owned),
        total: formatCount(summary.value?.makeups.total),
      }),
      to: { path: '/makeups', query: getWardrobeOwnedQuery({}) },
    },
    {
      key: 'momo',
      label: t('common.momo'),
      icon: Paw,
      percent: formatPercent(summary.value?.momo.completionPercent),
      detail: t('wardrobe.collection_detail', {
        owned: formatCount(summary.value?.momo.owned),
        total: formatCount(summary.value?.momo.total),
      }),
      to: { path: '/momo', query: getWardrobeOwnedQuery({}, false) },
    },
  ])

  const qualityRows = computed(() => summary.value?.qualityRows ?? [])

  const typeRowsByType = computed(() => {
    const rows = new Map<
      string,
      NonNullable<typeof summary.value>['typeRows'][number]
    >()
    summary.value?.typeRows.forEach((row) => {
      rows.set(row.type, row)
    })
    return rows
  })

  const getOrderedTypeRows = (types: readonly string[]) =>
    types
      .map((type) => typeRowsByType.value.get(type))
      .filter((row): row is NonNullable<typeof row> => !!row)

  const slotRows = computed(() =>
    getOrderedTypeRows([
      ...itemTypeCategories.clothes,
      ...itemTypeCategories.accessories,
    ])
  )
  const visibleSlotRows = computed(() => slotRows.value.slice(0, 4))
  const hiddenSlotRows = computed(() => slotRows.value.slice(4))

  const getVersionPrefix = (version: string) => {
    const parts = version.split('.')
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`
    }
    return version
  }

  const getVersionLink = (version: string) => {
    const slug = resolveSeoVersionSlug(version)
    if (slug) {
      return {
        path: `/items/version/${slug}`,
        query: getWardrobeOwnedQuery({}),
      }
    }
    return { path: '/items', query: getWardrobeOwnedQuery({ version }) }
  }

  const versionRows = computed(() => {
    const index = catalogIndex.index.value
    if (!index || !ownedItemIds.value) return []

    const ownedSet = new Set(ownedItemIds.value)
    const itemsByVersion = new Map<string, { owned: number; total: number }>()

    const scopedItems =
      wardrobeSummaryScope.value === 'all'
        ? index.items
        : index.items.filter((item) => getItemVariantType(item.id) === 'base')

    scopedItems.forEach((item) => {
      if (
        !isCatalogEntryAvailableInScope(
          'item',
          item.id,
          activeRegionScope.value
        )
      ) {
        return
      }

      const itemVersion = getVersionFromId(item.obtain_type)
      if (!itemVersion) return

      const version = getVersionPrefix(itemVersion)
      const row = itemsByVersion.get(version) ?? { owned: 0, total: 0 }
      row.total++
      if (ownedSet.has(item.id)) {
        row.owned++
      }
      itemsByVersion.set(version, row)
    })

    const rows = Array.from(itemsByVersion.entries()).map(([version, row]) => ({
      version,
      owned: row.owned,
      total: row.total,
      completionPercent:
        row.total > 0 ? Math.round((row.owned / row.total) * 100) : 0,
    }))

    return rows.sort((a, b) => {
      const aParts = a.version.split('.').map(Number)
      const bParts = b.version.split('.').map(Number)

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] ?? 0
        const bVal = bParts[i] ?? 0
        if (aVal !== bVal) {
          return bVal - aVal
        }
      }
      return 0
    })
  })

  const recentVersionRows = computed(() => versionRows.value.slice(0, 4))
  const olderVersionRows = computed(() => versionRows.value.slice(4))

  const quickActions = computed(() => [
    {
      label: t('wardrobe.open_missing_outfits'),
      detail: formatCount(summary.value?.outfits.missing),
      to: { path: '/outfits', query: getWardrobeStatsQuery({}) },
    },
    {
      label: t('wardrobe.open_missing_items'),
      detail: formatCount(summary.value?.items.missing),
      to: { path: '/items', query: getWardrobeStatsQuery({}) },
    },
    {
      label: t('wardrobe.open_missing_makeups'),
      detail: formatCount(summary.value?.makeups.missing),
      to: { path: '/makeups', query: getWardrobeStatsQuery({}) },
    },
    {
      label: t('wardrobe.open_missing_momo'),
      detail: formatCount(summary.value?.momo.missing),
      to: { path: '/momo', query: getWardrobeStatsQuery({}, false) },
    },
  ])

  const toggleShareOrientation = () => {
    if (isMobile.value) return
    isShareLandscape.value = !isShareLandscape.value
  }

  watch(isMobile, (mobile) => {
    if (mobile) {
      isShareLandscape.value = false
    } else if (isHydrated.value) {
      isShareLandscape.value = true
    }
  })

  watch(activeSharePickSlotKey, () => {
    sharePickerSearch.value = ''
    sharePickerPage.value = 1
  })

  watch(sharePickerSearch, () => {
    sharePickerPage.value = 1
  })

  const exportShareCard = async () => {
    if (!shareCardRef.value) return
    message.info(t('wardrobe.share.in_progress'))
    try {
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
      const fileName = `gongeous-wardrobe-${
        new Date().toISOString().split('T')[0]
      }.png`
      await exportToPng(shareCardRef.value, fileName)
      message.success(t('wardrobe.share.success'))
    } catch {
      message.error(t('wardrobe.share.error'))
    }
  }

  const confirmMarkF2PBasics = (count: number) =>
    new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('wardrobe.f2p_basics'),
        content: t('wardrobe.confirm.f2p_basics', { count }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })

  const confirmTrackerImport = (result: {
    found: number
    imported: number
    foundItems: number
    foundMakeups: number
    foundMomo: number
    importedItems: number
    importedMakeups: number
    importedMomo: number
    skippedPartialFiveStarMakeupOutfits: number
  }) =>
    new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('wardrobe.resonance_collection'),
        content: t('wardrobe.confirm.tracker_import', {
          found: result.found,
          imported: result.imported,
          foundItems: result.foundItems,
          foundMakeups: result.foundMakeups,
          foundMomo: result.foundMomo,
          importedItems: result.importedItems,
          importedMakeups: result.importedMakeups,
          importedMomo: result.importedMomo,
          skipped: result.skippedPartialFiveStarMakeupOutfits,
        }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })

  const refreshTrackerImportPreview = async () => {
    const requestId = trackerImportPreviewRequestId.value + 1
    trackerImportPreviewRequestId.value = requestId

    if (!canMutate.value) {
      trackerImportPreview.value = null
      return
    }

    loadingTrackerImportPreview.value = true
    try {
      const result = await getTrackerWardrobeImportPreview()
      if (trackerImportPreviewRequestId.value === requestId) {
        trackerImportPreview.value = result
      }
    } catch (error) {
      if (trackerImportPreviewRequestId.value === requestId) {
        trackerImportPreview.value = null
      }
      console.error('Wardrobe tracker import preview failed:', error)
    } finally {
      if (trackerImportPreviewRequestId.value === requestId) {
        loadingTrackerImportPreview.value = false
      }
    }
  }

  const importTrackerWardrobeEntries = async ({
    confirm = true,
    showEmptyDialog = true,
  }: {
    confirm?: boolean
    showEmptyDialog?: boolean
  } = {}) => {
    if (!canMutate.value) return false

    importing.value = true
    try {
      const result = await getTrackerWardrobeImportPreview()
      trackerImportPreview.value = result
      if (result.found === 0) {
        if (showEmptyDialog) {
          dialog.info({
            title: t('wardrobe.resonance_collection'),
            content: t('wardrobe.import_empty'),
            positiveText: t('common.ok'),
          })
        }
        return true
      }

      if (result.imported === 0) {
        if (showEmptyDialog) {
          dialog.info({
            title: t('wardrobe.resonance_collection'),
            content: t('wardrobe.import_no_new', { found: result.found }),
            positiveText: t('common.ok'),
          })
        }
        return true
      }

      if (confirm && !(await confirmTrackerImport(result))) return false

      const imported = await markWardrobeIdsOwned({
        itemIds: result.itemIds,
        makeupIds: result.makeupIds,
        momoIds: result.momoIds,
      })
      message.success(
        t('wardrobe.import_success', {
          found: result.found,
          imported: imported.total,
        })
      )
      await refreshTrackerImportPreview()
      return true
    } catch {
      message.error(t('wardrobe.import_error'))
      return false
    } finally {
      importing.value = false
    }
  }

  const handleTrackerImport = async () => {
    if (!canImportResonanceCollection.value) return
    await importTrackerWardrobeEntries()
  }

  const applyOnboardingRegion = () => {
    setActiveRegionScope(onboardingRegionScope.value)
  }

  const handleOnboardingNext = () => {
    if (onboardingStep.value === 1) {
      applyOnboardingRegion()
    }

    onboardingStep.value = Math.min(
      onboardingStep.value + 1,
      onboardingLastStep
    )
  }

  const handleOnboardingBack = () => {
    onboardingStep.value = Math.max(onboardingStep.value - 1, 1)
  }

  const markF2PBasicWardrobeEntries = async ({
    confirm = true,
  }: {
    confirm?: boolean
  } = {}) => {
    if (!canMutate.value) return false

    const wardrobeIds = f2pBasicMissingWardrobeIds.value
    const count = f2pBasicMissingCount.value
    if (count === 0) return true
    if (confirm && !(await confirmMarkF2PBasics(count))) return false

    markingF2PBasics.value = true
    try {
      await markWardrobeIdsOwned(wardrobeIds)
      message.success(
        t('wardrobe.f2p_basics_success', {
          count,
        })
      )
      return true
    } catch {
      message.error(t('wardrobe.error.save'))
      return false
    } finally {
      markingF2PBasics.value = false
    }
  }

  const handleCompleteOnboarding = () => {
    applyOnboardingRegion()
    completeOnboarding()
  }

  const resetWardrobeOnboarding = () => {
    onboardingStep.value = 1
    onboardingRegionScope.value =
      activeRegionScope.value === 'global' && locale.value === 'zh'
        ? 'cn'
        : activeRegionScope.value
    updateActiveProfileSettings((profile) => ({
      ...profile,
      onboardingCompleted: false,
    }))
    wardrobeSettingsOpen.value = false
  }

  const handleMarkF2PBasics = async () => {
    if (!canMarkF2PBasics.value) return
    await markF2PBasicWardrobeEntries()
  }

  const openProfileFilePicker = () => {
    if (!canMutate.value || importingProfileFile.value) return
    profileFileInputRef.value?.click()
  }

  const handleProfileFileSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    importingProfileFile.value = true
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid data file')
      }

      await processJsonImport(parsed as Parameters<typeof processJsonImport>[0])
      await refreshTrackerImportPreview()
      message.success(t('wardrobe.file_import_success'))
    } catch (error) {
      console.error('Profile data file import failed:', error)
      message.error(t('wardrobe.file_import_error'))
    } finally {
      importingProfileFile.value = false
    }
  }

  const exportProfileJSON = async () => {
    if (exportingProfileJson.value) return
    exportingProfileJson.value = true
    message.info(t('wardrobe.export.in_progress'))

    try {
      const {
        pulls: rawPullData,
        edits: rawEditData,
        evo: evoData,
        pearpal: rawPearpalData,
      } = await loadData(activeSlot.value)
      const wardrobe = await loadWardrobe(activeSlot.value)
      const slotIndex = activeSlot.value - 1
      const slotData = slots.value[slotIndex]
      const trimmedLabel = slotData?.label?.trim()
      const profile =
        slotData?.exists && trimmedLabel ? { label: trimmedLabel } : undefined
      const exportData = createProfileDataExportPayload({
        pulls: rawPullData,
        edits: rawEditData,
        evo: evoData,
        pearpal: rawPearpalData,
        wardrobe,
        profile,
      })

      if (!exportData) {
        message.info(t('wardrobe.export.empty'))
        return
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const link = document.createElement('a')
      link.download = getProfileDataExportFileName(activeSlot.value)
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)

      message.success(t('wardrobe.export.success'))
    } catch (error) {
      console.error('Profile data export failed:', error)
      message.error(t('wardrobe.export.error'))
    } finally {
      exportingProfileJson.value = false
    }
  }

  onMounted(() => {
    isHydrated.value = true
    isShareLandscape.value = !isMobile.value

    void loadSummary()
    void catalogIndex.load([
      'items',
      'outfits',
      'outfitItems',
      'makeups',
      'makeupItems',
      'momo',
    ])
    void refreshTrackerImportPreview()
  })

  watch([activeSlot, mutationVersion, canMutate], () => {
    void refreshTrackerImportPreview()
  })

  watch(activeRegionScope, (regionScope) => {
    onboardingRegionScope.value =
      regionScope === 'global' && locale.value === 'zh' ? 'cn' : regionScope
    void refreshTrackerImportPreview()
  })

  useSeoMeta({
    title: () =>
      `${t('navigation.wardrobe')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.wardrobe'),
  })
</script>
