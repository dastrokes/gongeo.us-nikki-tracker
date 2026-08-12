<template>
  <div class="landing-page mx-auto max-w-7xl space-y-4 sm:space-y-8">
    <!-- ═══ Hero Section ═══ -->
    <section
      class="hero-section relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(252,231,243,0.74)_0%,rgba(237,233,254,0.46)_48%,transparent_74%)] px-4 py-8 text-center sm:py-12 dark:bg-[radial-gradient(ellipse_at_center,rgba(88,28,100,0.34)_0%,rgba(30,27,75,0.34)_50%,transparent_74%)]"
    >
      <div class="mb-5 flex flex-row items-center justify-center gap-3">
        <button
          type="button"
          :aria-label="$t('navigation.title')"
          class="group flex h-12 w-12 shrink-0 cursor-help items-center justify-center rounded-2xl bg-white/75 p-2 shadow-[0_10px_26px_rgba(109,40,217,0.14)] ring-1 ring-purple-200/50 backdrop-blur-xs transition-all duration-300 hover:-translate-y-0.5 active:scale-95 sm:h-16 sm:w-16 dark:bg-slate-900/60 dark:shadow-[0_8px_22px_rgba(0,0,0,0.3)] dark:ring-purple-800/20"
          @click="handleHeroLogoClick"
        >
          <NuxtImg
            src="images/logo.webp"
            preset="iconSm"
            fit="cover"
            loading="eager"
            class="h-full w-full transition-transform duration-300 group-hover:scale-105"
            :style="heroLogoStyle"
          />
        </button>
        <div class="text-left">
          <p
            class="text-xs font-semibold tracking-widest text-rose-500/80 uppercase dark:text-rose-300/80"
          >
            {{ $t('meta.game_title') }}
          </p>
          <p class="text-2xl leading-tight font-bold sm:text-3xl">
            {{ $t('navigation.title') }}
          </p>
        </div>
      </div>
      <h1
        class="bg-linear-to-r from-[#d946ef] via-[#f472b6] to-[#fb7185] bg-clip-text pb-4 text-3xl leading-tight font-bold whitespace-pre-line text-transparent sm:text-4xl dark:from-[#f0abfc] dark:via-[#f9a8d4] dark:to-[#fb7185]"
      >
        {{ $t('navigation.subtitle') }}
      </h1>
      <p
        class="mx-auto mb-7 max-w-2xl text-base font-medium text-slate-600 sm:text-lg dark:text-slate-200"
      >
        {{ $t('default.description') }}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <n-button
          type="primary"
          size="large"
          round
          strong
          class="after:animate-button-shimmer relative min-w-36 overflow-hidden shadow-[0_8px_20px_rgba(244,63,94,0.20)] transition-all duration-200 after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/18 after:to-transparent after:content-[''] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(244,63,94,0.25)] focus-visible:ring-2 focus-visible:ring-rose-500/80 motion-reduce:transform-none motion-reduce:after:animate-none"
          @click="navigateTo(localePath('/tracker'))"
        >
          <template #icon>
            <n-icon><Book /></n-icon>
          </template>
          {{ $t('default.your_data') }}
        </n-button>
        <n-button
          type="primary"
          size="large"
          round
          secondary
          class="relative min-w-36 border border-rose-300/50 shadow-[0_6px_16px_rgba(244,63,94,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(244,63,94,0.18)] focus-visible:ring-2 focus-visible:ring-rose-500/80 motion-reduce:transform-none dark:border-rose-300/15"
          @click="navigateTo(localePath('/global'))"
        >
          <template #icon>
            <n-icon><Globe /></n-icon>
          </template>
          {{ $t('navigation.global') }}
        </n-button>
      </div>
      <div
        class="mx-auto mt-6 grid max-w-md grid-cols-2 gap-2 sm:flex sm:max-w-full sm:flex-wrap sm:justify-center"
      >
        <button
          type="button"
          class="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-colors duration-200 hover:border-rose-200 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden sm:px-4 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-rose-300/25 dark:hover:bg-slate-900/60"
          @click="navigateTo(localePath('/wardrobe'))"
        >
          <n-icon><SvgIcon name="wardrobe" /></n-icon>
          {{ $t('navigation.wardrobe') }}
        </button>
        <button
          type="button"
          class="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-colors duration-200 hover:border-rose-200 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden sm:px-4 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-rose-300/25 dark:hover:bg-slate-900/60"
          @click="navigateTo(localePath('/banners'))"
        >
          <n-icon><CalendarAlt /></n-icon>
          {{ $t('navigation.banner') }}
        </button>
        <button
          type="button"
          class="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-colors duration-200 hover:border-rose-200 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden sm:px-4 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-rose-300/25 dark:hover:bg-slate-900/60"
          @click="navigateTo(localePath('/items'))"
        >
          <n-icon><ListAlt /></n-icon>
          {{ $t('navigation.compendium') }}
        </button>
        <button
          type="button"
          class="inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-colors duration-200 hover:border-rose-200 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden sm:px-4 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-rose-300/25 dark:hover:bg-slate-900/60"
          @click="navigateTo(localePath('/search'))"
        >
          <n-icon><Search /></n-icon>
          {{ $t('search_page.title') }}
        </button>
      </div>

      <n-modal
        :show="showGongeousEasterEgg"
        class="pointer-events-auto mx-auto w-full max-w-sm"
        :mask-closable="true"
        :auto-focus="false"
        @update:show="handleGongeousModalShow"
      >
        <GongeousCard />
      </n-modal>
    </section>

    <!-- ═══ Current Banners ═══ -->
    <section
      ref="bannersSectionRef"
      class="scroll-mt-16"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 shadow-none sm:p-2"
      >
        <div class="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2
              class="text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ $t('default.current_banners') }}
            </h2>
            <span class="mt-2 block h-0.5 w-5 rounded-full bg-rose-500" />
          </div>
          <NuxtLinkLocale
            no-prefetch
            to="/banners"
            class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden dark:text-rose-300 dark:hover:text-rose-200"
          >
            {{ $t('navigation.banner') }}
            <n-icon size="12"><ChevronRight /></n-icon>
          </NuxtLinkLocale>
        </div>
        <div
          v-if="bannerGroups.length > 0"
          class="flex flex-col gap-4 sm:flex-row"
        >
          <div
            v-for="group in bannerGroups"
            :key="group.key"
            class="aspect-2/1 w-full sm:w-1/2"
            :class="bannerGroups.length === 1 ? 'sm:mx-auto' : ''"
          >
            <BannerCarousel
              :banners="group.banners"
              :target-time="group.targetTime"
              :priority="group.key === primaryBannerGroupKey"
            />
          </div>
        </div>
      </n-card>
    </section>

    <!-- ═══ Compendium and Explore More ═══ -->
    <section
      ref="compendiumSectionRef"
      class="grid scroll-mt-16 gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch"
    >
      <n-card
        size="small"
        class="h-full rounded-xl p-0 shadow-none sm:p-2"
        content-class="lg:flex lg:h-full lg:flex-col"
      >
        <div class="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              class="text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ $t('navigation.compendium') }}
            </h2>
            <span class="mt-2 block h-0.5 w-5 rounded-full bg-rose-500" />
          </div>
          <NuxtLinkLocale
            no-prefetch
            to="/items"
            class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden dark:text-rose-300 dark:hover:text-rose-200"
          >
            {{ $t('common.view_compendium') }}
            <n-icon size="12"><ChevronRight /></n-icon>
          </NuxtLinkLocale>
        </div>

        <!-- Compendium Grid -->
        <div
          class="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-2 lg:flex-1 lg:grid-cols-4"
        >
          <div
            v-for="column in compendiumColumns"
            :key="column.key"
            class="min-w-0 md:grid md:grid-cols-[minmax(0,1fr)_8rem] md:gap-2 lg:flex lg:flex-col lg:gap-0"
          >
            <NuxtLinkLocale
              no-prefetch
              :to="column.path"
              class="group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-white/70 px-1 py-2 text-center ring-1 ring-white/60 transition-[border-color,background-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none sm:gap-2 sm:px-2 sm:py-3 md:min-h-0 lg:min-h-20 lg:flex-1 dark:border-white/8 dark:bg-slate-950/25 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            >
              <n-icon
                :size="24"
                class="text-rose-500 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none dark:text-rose-300"
              >
                <component :is="column.icon" />
              </n-icon>
              <span
                class="max-w-full truncate text-xs leading-tight font-semibold whitespace-nowrap text-slate-700 sm:text-sm dark:text-slate-200"
              >
                {{ $t(column.label) }}
              </span>
            </NuxtLinkLocale>

            <NuxtLinkLocale
              no-prefetch
              :to="column.preview.path"
              class="group relative mt-2 block aspect-2/3 w-full overflow-hidden rounded-lg bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-rose-500/80 focus-visible:outline-hidden focus-visible:ring-inset md:mt-0 lg:mt-2 dark:bg-slate-800"
              :aria-label="column.preview.linkLabel"
            >
              <LazyNuxtImg
                v-if="column.preview.imageId"
                :src="
                  getImageSrc(column.preview.imageType, column.preview.imageId)
                "
                :alt="column.preview.imageAlt"
                :preset="column.preview.transparent ? 'tallLg' : undefined"
                :fit="column.preview.transparent ? 'cover' : undefined"
                :width="column.preview.transparent ? undefined : 200"
                loading="lazy"
                class="h-full w-full transition-[filter] duration-200 group-hover:brightness-105"
                :class="
                  column.preview.transparent
                    ? 'object-cover object-top'
                    : 'object-cover object-center'
                "
                sizes="25vw lg:140px"
              />
              <n-skeleton
                v-else
                class="h-full w-full rounded-none"
              />
              <span
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-slate-300/80 transition-colors duration-200 ring-inset group-hover:ring-rose-200 dark:ring-white/15 dark:group-hover:ring-rose-300/25"
              />
            </NuxtLinkLocale>
          </div>
        </div>
      </n-card>

      <n-card
        size="small"
        class="h-full rounded-xl p-0 shadow-none sm:p-2"
        content-class="lg:flex lg:h-full lg:flex-col"
      >
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {{ $t('navigation.explore') }}
          </h2>
          <span class="mt-2 block h-0.5 w-5 rounded-full bg-rose-500" />
        </div>

        <!-- Feature Row -->
        <div
          ref="featureRowRef"
          class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:flex-1 lg:grid-rows-2"
        >
          <!-- Eureka Tracker -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-4 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/eurekas'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              aria-hidden="true"
              class="absolute inset-x-2 top-2 bottom-11 flex items-center justify-center gap-1.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div
                v-for="(variant, index) in eurekaPreviewVariants"
                :key="`eureka-preview-${index}`"
                class="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-xs dark:border-gray-700 dark:bg-gray-900"
              >
                <n-icon
                  size="32"
                  :class="variant.iconClass"
                >
                  <SvgIcon
                    name="sparkles"
                    :gradient="variant.gradient"
                  />
                </n-icon>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-x-2 top-2 bottom-11 flex items-center justify-center gap-1.5"
            >
              <n-skeleton
                v-for="index in 3"
                :key="`eureka-preview-skeleton-${index}`"
                class="size-14 rounded-lg"
              />
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><SvgIcon name="sparkles" /></n-icon>
                <span>{{ $t('navigation.eurekas') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Lookbook Preview -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-5 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/lookbook'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              aria-hidden="true"
              class="absolute inset-x-2 top-2 bottom-11 flex flex-col items-center justify-center gap-2 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div
                class="flex h-6 w-[82%] items-center rounded-lg bg-white/90 px-2.5 shadow-xs ring-1 ring-black/5 dark:bg-slate-900/90 dark:ring-white/10"
              >
                <span class="size-1.5 shrink-0 rounded-full bg-sky-400" />
                <span
                  class="ml-2 truncate font-mono text-[9px] font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-300"
                >
                  gongeous#
                </span>
              </div>
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="(row, rowIndex) in lookbookPreviewRows"
                  :key="`lookbook-preview-row-${rowIndex}`"
                  class="flex gap-1.5"
                >
                  <div
                    v-for="(squareClass, squareIndex) in row"
                    :key="`lookbook-preview-square-${rowIndex}-${squareIndex}`"
                    class="size-4 rounded-[3px] shadow-xs"
                    :class="squareClass"
                  />
                </div>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-x-2 top-2 bottom-11 flex flex-col items-center justify-center gap-2"
            >
              <n-skeleton class="h-6 w-[82%] rounded-lg" />
              <div class="grid grid-cols-5 gap-1.5">
                <n-skeleton
                  v-for="index in 10"
                  :key="`lookbook-preview-skeleton-${index}`"
                  class="size-4 rounded-[3px]"
                />
              </div>
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><Th /></n-icon>
                <span>{{ $t('navigation.lookbook') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Whim Search -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-1 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/search'"
          >
            <!-- Decorative Search Interface Background -->
            <div
              v-if="shouldRenderFeatureAssets"
              class="absolute inset-0 flex flex-col items-center justify-start gap-1.5 pt-3 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <!-- Mini Searchbar -->
              <div
                class="relative flex h-7 w-[80%] shrink-0 items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10"
              >
                <n-icon
                  class="ml-2.5 shrink-0 text-rose-400"
                  size="11"
                  ><Search
                /></n-icon>
                <div
                  class="ml-2 h-1.5 w-1/4 rounded-full bg-slate-200 dark:bg-slate-700"
                ></div>
                <div class="ml-auto flex shrink-0 items-center gap-1 pr-1">
                  <!-- Filter button -->
                  <div
                    class="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 dark:text-slate-500"
                  >
                    <n-icon size="8"><Filter /></n-icon>
                  </div>
                  <!-- Search button -->
                  <div
                    class="flex h-5 w-9 items-center justify-center rounded-full bg-rose-500 shadow-sm dark:bg-rose-600"
                  >
                    <div class="h-1 w-3.5 rounded-full bg-white/70"></div>
                  </div>
                </div>
              </div>
              <!-- Mini Results Grid (Item Cards) -->
              <div
                class="grid h-[60%] shrink-0 grid-cols-6 gap-1.5 opacity-70 dark:opacity-80"
              >
                <div
                  v-for="index in 18"
                  :key="`mini-result-${index}`"
                  class="h-6 w-4 rounded-[3px] shadow-xs"
                  :class="
                    ['bg-amber-500/80', 'bg-sky-500/80', 'bg-slate-500/80'][
                      (index - 1) % 3
                    ]
                  "
                ></div>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-start gap-1.5 pt-3"
            >
              <n-skeleton class="h-7 w-[80%] shrink-0 rounded-full" />
              <div class="grid grid-cols-6 gap-1.5 opacity-70">
                <n-skeleton
                  v-for="index in 18"
                  :key="`search-preview-skeleton-${index}`"
                  class="h-6 w-4 rounded-[3px]"
                />
              </div>
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><Search /></n-icon>
                <span>{{ $t('search_page.title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Whim-O-Matic -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-2 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/random'"
          >
            <!-- GachaponMachineSvg bg -->
            <div
              v-if="shouldRenderFeatureAssets"
              class="absolute h-30 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <LazyGachaponMachineSvg class="h-full w-full drop-shadow-sm" />
            </div>
            <div
              v-else
              class="absolute inset-x-3 top-2 bottom-11 flex items-center justify-center"
            >
              <n-skeleton class="h-24 w-16 rounded-2xl" />
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><Magic /></n-icon>
                <span>{{ $t('search_page.lucky_machine_title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Tier List Preview -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-3 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/tierlist'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              class="flex h-full flex-col gap-1.5 rounded-md p-2 backdrop-blur-[1px] transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div
                v-for="(row, rowIndex) in tierPreviewRows"
                :key="`tier-preview-row-${rowIndex}`"
                class="flex items-center"
              >
                <div class="flex flex-1 gap-1.5">
                  <div
                    v-for="(chipClass, chipIndex) in row"
                    :key="`tier-preview-chip-${rowIndex}-${chipIndex}`"
                    class="h-4 w-4 shrink-0 rounded-[3px]"
                    :class="chipClass"
                  />
                </div>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-x-3 top-3 bottom-11 flex items-center justify-center"
            >
              <div class="grid grid-cols-5 gap-1.5">
                <n-skeleton
                  v-for="index in 20"
                  :key="`tier-preview-skeleton-${index}`"
                  class="size-4 rounded-[3px]"
                />
              </div>
            </div>
            <div class="absolute right-2 bottom-2 left-2">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><SortAmountDown /></n-icon>
                <span>{{ $t('navigation.tierlist') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Outfit Silhouette Quiz -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative order-6 flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-slate-50/70 ring-1 ring-white/60 transition-[background-color,border-color,transform] duration-200 ring-inset hover:-translate-y-0.5 hover:border-rose-200/70 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:outline-hidden motion-reduce:transform-none lg:h-auto lg:min-h-28 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4 dark:hover:border-rose-300/20 dark:hover:bg-slate-900/45"
            :to="'/quiz'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              class="mb-4 aspect-2/3 h-full shrink-0 p-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <LazyNuxtImg
                :src="getImageSrc('outfit', featuredOutfitId)"
                preset="tallSm"
                quality="1"
                fit="cover"
                loading="lazy"
                class="h-full w-full max-w-full object-cover"
                :style="silhouetteStyle"
              />
            </div>
            <div
              v-else
              class="absolute inset-x-3 top-2 bottom-11 flex items-center justify-center"
            >
              <n-skeleton class="h-24 w-16 rounded-lg" />
            </div>
            <div class="absolute right-2 bottom-2 left-2">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-white/90 px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-none backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/80 dark:text-rose-300"
              >
                <n-icon><PuzzlePiece /></n-icon>
                <span>{{ $t('quiz.title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>
        </div>
      </n-card>
    </section>

    <!-- ═══ Community Stats ═══ -->
    <section
      ref="statsSectionRef"
      class="scroll-mt-16"
    >
      <LandingCommunityStats
        v-if="shouldRenderStatsSection"
        :featured-current-banners="featuredCurrentBanners"
      />
      <n-card
        v-else
        size="small"
        class="rounded-xl p-0 shadow-none sm:p-2"
      >
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {{ $t('default.community_stats') }}
          </h2>
          <span class="mt-2 block h-0.5 w-5 rounded-full bg-rose-500" />
        </div>
        <div
          class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-stretch"
        >
          <div class="flex flex-col gap-3">
            <div
              class="grid grid-cols-2 gap-3 text-center lg:flex lg:flex-1 lg:flex-col"
            >
              <div
                class="flex min-h-24 flex-col justify-center rounded-xl border border-black/5 bg-slate-50/70 p-4 ring-1 ring-white/60 ring-inset lg:flex-1 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4"
              >
                <div class="mb-1 flex h-5 items-center justify-center">
                  <n-skeleton
                    text
                    round
                    class="w-20"
                  />
                </div>
                <div
                  class="flex min-h-7 items-center justify-center text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
                >
                  <n-skeleton
                    text
                    round
                    class="w-24 sm:w-32"
                  />
                </div>
              </div>
              <div
                class="flex min-h-24 flex-col justify-center rounded-xl border border-black/5 bg-slate-50/70 p-4 ring-1 ring-white/60 ring-inset lg:flex-1 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4"
              >
                <div class="mb-1 flex h-5 items-center justify-center">
                  <n-skeleton
                    text
                    round
                    class="w-20"
                  />
                </div>
                <div
                  class="flex min-h-7 items-center justify-center text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
                >
                  <n-skeleton
                    text
                    round
                    class="w-16 sm:w-20"
                  />
                </div>
              </div>
            </div>
            <div class="flex justify-center">
              <n-skeleton class="h-8 w-40 rounded-full lg:w-full" />
            </div>
          </div>
          <div
            class="flex h-[280px] items-end gap-4 rounded-xl border border-black/5 bg-slate-50/70 p-2 ring-1 ring-white/60 ring-inset lg:h-60 lg:gap-8 lg:p-3 dark:border-white/8 dark:bg-slate-950/30 dark:ring-white/4"
          >
            <n-skeleton
              v-for="(height, index) in communityStatsSkeletonHeights"
              :key="`community-stats-placeholder-${index}`"
              class="flex-1 rounded-md"
              :style="{ height: `${height}%` }"
            />
          </div>
        </div>
      </n-card>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { BANNER_DATA } from '~~/data/banners'
  import { CURRENT_BANNER_GROUPS } from '~~/data/config'
  import type { OutfitKey } from '~~/data/outfits'
  import {
    Book,
    Globe,
    CalendarAlt,
    Tshirt,
    ListAlt,
    PuzzlePiece,
    SortAmountDown,
    Search,
    Magic,
    Filter,
    ChevronRight,
    PaintBrush,
    Paw,
    Th,
  } from '@vicons/fa'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isDark } = useTheme()
  const localePath = useLocalePath()
  const bannersSectionRef = ref<HTMLElement | null>(null)
  const compendiumSectionRef = ref<HTMLElement | null>(null)
  const featureRowRef = ref<HTMLElement | null>(null)
  const statsSectionRef = ref<HTMLElement | null>(null)
  const { shouldRender: shouldRenderFeatureAssets } = useDeferredSectionRender(
    featureRowRef,
    {
      rootMargin: '300px',
    }
  )
  const { shouldRender: shouldLoadCompendiumPreviews } =
    useDeferredSectionRender(compendiumSectionRef, {
      rootMargin: '300px',
    })
  const { shouldRender: shouldRenderStatsSection } = useDeferredSectionRender(
    statsSectionRef,
    {
      rootMargin: '500px',
    }
  )
  const heroLogoColorStep = ref(0)
  const heroLogoClickStreak = ref(0)
  const showGongeousEasterEgg = ref(false)

  const heroLogoHueSteps = [0, 90, 180, 270] as const

  const heroLogoStyle = computed(() => {
    const hue = heroLogoHueSteps[heroLogoColorStep.value]

    return {
      filter: `hue-rotate(${hue}deg) saturate(${hue === 0 ? 1 : 1.45})`,
    }
  })

  const showGongeous = () => {
    showGongeousEasterEgg.value = true
  }

  const handleGongeousModalShow = (value: boolean) => {
    showGongeousEasterEgg.value = value
  }

  const handleHeroLogoClick = () => {
    const nextClickStreak = (heroLogoClickStreak.value + 1) % 5
    const nextColorStep =
      nextClickStreak === 0
        ? 0
        : (heroLogoColorStep.value + 1) % heroLogoHueSteps.length

    heroLogoColorStep.value = nextColorStep
    heroLogoClickStreak.value = nextClickStreak

    if (nextClickStreak === 0) {
      showGongeous()
    }
  }

  // ── Compendium items ───────────────────────────
  const compendiumItems = [
    { key: 'outfits', path: '/outfits', icon: Tshirt, label: 'common.outfits' },
    { key: 'items', path: '/items', icon: ListAlt, label: 'common.items' },
    {
      key: 'makeups',
      path: '/makeups',
      icon: PaintBrush,
      label: 'common.makeups',
    },
    { key: 'momo', path: '/momo', icon: Paw, label: 'default.momo' },
  ] as const

  type CompendiumPreviewImageType = 'outfit' | 'item' | 'fullMakeup' | 'momo'

  interface CompendiumPreview {
    imageType: CompendiumPreviewImageType
    imageId: string | number | null
    imageAlt: string
    linkLabel: string
    path: string
    transparent: boolean
  }

  // ── Current banners ────────────────────────────
  interface BannerGroup {
    key: string
    banners: Banner[]
    targetTime: Date
  }

  const createBannerGroup = (
    key: string,
    bannerIds: number[],
    targetTime: string
  ): BannerGroup => ({
    key,
    banners: bannerIds
      .map((bannerId) => BANNER_DATA[bannerId])
      .filter((banner): banner is Banner => Boolean(banner)),
    targetTime: new Date(targetTime),
  })

  const bannerGroups: BannerGroup[] = CURRENT_BANNER_GROUPS.map((group) =>
    createBannerGroup(group.key, group.bannerIds, group.targetTime)
  ).filter((group) => group.banners.length > 0)
  const primaryBannerGroupKey = bannerGroups[0]?.key ?? null

  const currentBanners = bannerGroups.flatMap((group) => group.banners)
  const newCurrentBanners = currentBanners.filter(
    (banner) => banner.runs.length === 1
  )
  const featuredCurrentBanners =
    newCurrentBanners.length > 0 ? newCurrentBanners : currentBanners

  // ── Compendium previews and outfit silhouette ──
  const outfitKeys = featuredCurrentBanners.flatMap((banner) => [
    ...banner.outfit5StarId,
    ...banner.outfit4StarId,
  ]) as OutfitKey[]
  const catalogIndex = useCatalogIndex()
  const { activeRegionScope } = useWardrobeSettings()
  const compendiumPreviewIds = ref({
    outfits: null as number | null,
    items: null as number | null,
    makeups: null as number | null,
    momo: null as number | null,
  })
  let compendiumPreviewRequest = 0

  const loadCompendiumPreviewIds = async () => {
    const request = ++compendiumPreviewRequest

    try {
      await catalogIndex.load([
        'items',
        'outfits',
        'outfitItems',
        'makeups',
        'momo',
      ])
    } catch {
      return
    }

    if (request !== compendiumPreviewRequest) return

    const index = catalogIndex.index.value
    if (!index) return

    const getFirstId = (
      entity: 'item' | 'outfit' | 'makeup' | 'momo',
      filters: Record<string, unknown>
    ) =>
      getLocalStaticCatalogListingMatchingIds({
        query: {
          entity,
          filters,
          page: 1,
          pageSize: 1,
          ownershipMode: 'all',
          regionScope: activeRegionScope.value,
        },
        index,
      }).ids[0] ?? null

    compendiumPreviewIds.value = {
      outfits: getFirstId('outfit', { variations: 'base' }),
      items: getFirstId('item', { piece: 'all', variations: 'base' }),
      makeups: getFirstId('makeup', {
        kind: 'all',
        variations: 'base',
      }),
      momo: getFirstId('momo', {}),
    }
  }

  watch(
    [shouldLoadCompendiumPreviews, activeRegionScope],
    ([shouldLoad]) => {
      if (import.meta.client && shouldLoad) {
        void loadCompendiumPreviewIds()
      }
    },
    { immediate: true }
  )

  const compendiumPreviewByKey = computed<
    Record<(typeof compendiumItems)[number]['key'], CompendiumPreview>
  >(() => {
    const { outfits, items, makeups, momo } = compendiumPreviewIds.value
    const makeup = makeups
      ? catalogIndex.index.value?.makeupById.get(makeups)
      : null

    return {
      outfits: {
        imageType: 'outfit',
        imageId: outfits,
        imageAlt: outfits ? t(`outfit.${outfits}.name`) : t('common.outfits'),
        linkLabel: outfits ? t(`outfit.${outfits}.name`) : t('common.outfits'),
        path: outfits ? getOutfitDetailPath(outfits) : '/outfits',
        transparent: true,
      },
      items: {
        imageType: 'item',
        imageId: items,
        imageAlt: items ? t(`item.${items}.name`) : t('common.items'),
        linkLabel: items ? t(`item.${items}.name`) : t('common.items'),
        path: items ? getItemEntityDetailPath(items) : '/items',
        transparent: false,
      },
      makeups: {
        imageType: makeup?.type === 'fullMakeup' ? 'fullMakeup' : 'item',
        imageId: makeups,
        imageAlt: makeups ? t(`makeup.${makeups}.name`) : t('common.makeups'),
        linkLabel: makeups ? t(`makeup.${makeups}.name`) : t('common.makeups'),
        path: makeups ? getMakeupDetailPath(makeups) : '/makeups',
        transparent: false,
      },
      momo: {
        imageType: 'momo',
        imageId: momo,
        imageAlt: momo ? t(`momo.${momo}.name`) : t('common.momo'),
        linkLabel: momo ? t(`momo.${momo}.name`) : t('common.momo'),
        path: momo ? getMomoDetailPath(momo) : '/momo',
        transparent: true,
      },
    }
  })

  const compendiumColumns = computed(() =>
    compendiumItems.map((item) => ({
      ...item,
      preview: compendiumPreviewByKey.value[item.key],
    }))
  )

  const featuredOutfitId = useState<OutfitKey>(
    'landing-featured-outfit-id',
    () => {
      const index = Math.floor(Math.random() * outfitKeys.length)
      return outfitKeys[index] as OutfitKey
    }
  )

  const silhouetteStyle = computed(() => {
    const glow = isDark.value
      ? 'drop-shadow(0 0 10px rgba(255,255,255,0.28)) drop-shadow(0 0 16px rgba(255,255,255,0.16))'
      : 'drop-shadow(0 0 8px rgba(0,0,0,0.32)) drop-shadow(0 0 14px rgba(0,0,0,0.18))'
    return {
      filter: `brightness(0) saturate(100%) ${glow}`,
    }
  })

  // ── Tier preview ───────────────────────────────
  const tierPreviewRows = [
    [
      'bg-red-500/90',
      'bg-red-500/80',
      'bg-red-500/70',
      'bg-red-500/60',
      'bg-red-500/50',
    ],
    [
      'bg-orange-500/90',
      'bg-orange-500/80',
      'bg-orange-500/70',
      'bg-orange-500/60',
      'bg-orange-500/50',
      'bg-orange-500/40',
    ],
    [
      'bg-yellow-500/90',
      'bg-yellow-500/80',
      'bg-yellow-500/70',
      'bg-yellow-500/60',
      'bg-yellow-500/50',
      'bg-yellow-500/40',
      'bg-yellow-500/30',
    ],
    [
      'bg-emerald-500/90',
      'bg-emerald-500/80',
      'bg-emerald-500/70',
      'bg-emerald-500/60',
      'bg-emerald-500/50',
      'bg-emerald-500/40',
    ],
    [
      'bg-cyan-500/90',
      'bg-cyan-500/80',
      'bg-cyan-500/70',
      'bg-cyan-500/60',
      'bg-cyan-500/50',
    ],
    [
      'bg-gray-500/90',
      'bg-gray-500/80',
      'bg-gray-500/70',
      'bg-gray-500/60',
      'bg-gray-500/50',
      'bg-gray-500/40',
    ],
  ] as const

  const eurekaPreviewVariants: ReadonlyArray<{
    iconClass: string
    gradient?: 'iridescent'
  }> = [
    {
      iconClass: 'text-yellow-400 dark:text-yellow-300',
    },
    {
      iconClass: 'text-blue-400 dark:text-blue-300',
    },
    {
      iconClass:
        'drop-shadow-[0_0_4px_rgba(217,70,239,0.55)] dark:drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]',
      gradient: 'iridescent',
    },
  ]

  const lookbookPreviewRows = [
    [
      'bg-amber-500/80',
      'bg-amber-500/80',
      'bg-amber-500/80',
      'bg-amber-500/80',
      'bg-amber-500/80',
    ],
    [
      'bg-sky-500/80',
      'bg-sky-500/80',
      'bg-sky-500/80',
      'bg-sky-500/80',
      'bg-sky-500/80',
    ],
    [
      'bg-teal-500/80',
      'bg-teal-500/80',
      'bg-teal-500/80',
      'bg-teal-500/80',
      'bg-teal-500/80',
    ],
  ] as const

  // ── Community stats (from /api/global) ─────────
  const communityStatsSkeletonHeights = [
    80, 80, 80, 80, 60, 60, 60, 60, 40, 40,
  ] as const

  // ── SEO ────────────────────────────────────────
  useSeoMeta({
    title: () => t('meta.title'),
    description: () => t('meta.description.default'),
    ogTitle: () => t('meta.title'),
    ogDescription: () => t('meta.description.default'),
    twitterTitle: () => t('meta.title'),
    twitterDescription: () => t('meta.description.default'),
  })
</script>
