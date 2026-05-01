<script setup lang="ts">
  import {
    Search,
    Filter,
    ChevronDown,
    User,
    Star,
    Tshirt,
    Book,
    CalendarAlt,
    Users,
  } from '@vicons/fa'

  definePageMeta({
    layout: false,
  })

  if (!import.meta.dev) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page Not Found',
    })
  }

  const ogProps = computed(() => createOgImageProps())
  const siteName = computed(() => ogProps.value.siteName ?? 'gongeo.us')
  const eyebrow = computed(() => ogProps.value.eyebrow ?? '')
  const headlineOne = computed(() => ogProps.value.headlineOne ?? '')
  const headlineTwo = computed(() => ogProps.value.headlineTwo ?? '')
  const headlineThree = computed(() => ogProps.value.headlineThree ?? '')
  const summary = computed(() => ogProps.value.summary ?? '')
  const logoImage = computed(() => ogProps.value.logoImage ?? '')
  const mascotImage = computed(() => ogProps.value.mascotImage ?? '')
  const bannerImages = computed(() => ogProps.value.bannerImages ?? [])
  const outfitImages = computed(() => ogProps.value.outfitImages ?? [])
  const itemCards = computed(() => ogProps.value.itemCards ?? [])
  const navLabels = computed(() => ogProps.value.navLabels ?? [])
  const statCards = computed(() => ogProps.value.statCards ?? [])
  const trackerTitle = computed(() => ogProps.value.trackerTitle ?? '')
  const whimSearchTitle = computed(() => ogProps.value.whimSearchTitle ?? '')
  const compendiumTitle = computed(() => ogProps.value.compendiumTitle ?? '')
  const filterLabels = computed(() => ogProps.value.filterLabels ?? [])
  const navIcons = [Book, CalendarAlt, Tshirt, Users]

  const primaryBanner = computed(() => bannerImages.value[0] || '')
  const secondaryBanner = computed(
    () => bannerImages.value[1] || bannerImages.value[0] || ''
  )
  const trackerItems = computed(() => itemCards.value.slice(0, 5))
  const featuredOutfits = computed(() => outfitImages.value.slice(0, 4))
  const headlineTwoPrefix = computed(() => {
    const [prefix, suffix] = headlineTwo.value.split(' & ')
    return suffix ? `${prefix} &` : headlineTwo.value
  })
  const headlineTwoAccent = computed(() => {
    const [, suffix] = headlineTwo.value.split(' & ')
    return suffix || ''
  })

  useHead({
    title: 'OG Preview',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  })
</script>

<template>
  <div
    data-og-root="true"
    class="relative h-157.5 w-300 overflow-hidden text-slate-950"
    style="
      font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
      background:
        radial-gradient(
          circle at 45% 8%,
          rgba(167, 139, 250, 0.34),
          transparent 34%
        ),
        radial-gradient(
          circle at 14% 80%,
          rgba(251, 191, 36, 0.2),
          transparent 24%
        ),
        linear-gradient(135deg, #f2efff 0%, #fff3fa 46%, #feeef5 100%);
    "
  >
    <div
      class="absolute inset-0"
      style="
        background:
          radial-gradient(
            circle at 10% 88%,
            rgba(255, 255, 255, 0.72),
            transparent 20%
          ),
          linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.42),
            rgba(255, 255, 255, 0.12)
          );
      "
    />

    <div class="absolute top-10.5 left-10.5 h-137 w-74">
      <div class="flex items-center gap-3">
        <img
          v-if="logoImage"
          :src="logoImage"
          :alt="siteName"
          class="h-13 w-13 object-contain"
          width="52"
          height="52"
        />
        <div class="text-[44px] font-bold tracking-[-1px]">
          {{ siteName }}
        </div>
      </div>

      <div class="mt-8 text-[54px] leading-[0.97] font-bold tracking-[-1.05px]">
        <div class="text-slate-950">{{ headlineOne }}</div>
        <div>
          <span class="text-indigo-500">{{ headlineTwoPrefix }}&nbsp;</span>
          <span
            v-if="headlineTwoAccent"
            class="text-rose-500"
          >
            {{ headlineTwoAccent }}
          </span>
        </div>
        <div class="text-slate-950">{{ headlineThree }}</div>
      </div>

      <div class="mt-6 flex items-center gap-2">
        <div class="h-px w-30 bg-slate-400/30" />
        <n-icon
          size="10"
          class="text-amber-400/85"
        >
          <Star />
        </n-icon>
        <div class="h-px w-30 bg-slate-400/30" />
      </div>

      <div class="mt-4 w-68 text-[17px] leading-6.5 text-slate-700">
        {{ summary }}
      </div>

      <img
        v-if="mascotImage"
        :src="mascotImage"
        :alt="eyebrow"
        class="absolute -bottom-8 -left-2 h-34 w-34 object-contain opacity-95"
        width="160"
        height="160"
      />
    </div>

    <div
      class="absolute top-4.5 left-90 h-149 w-200 overflow-hidden bg-white/72 shadow-[0_30px_70px_rgba(99,102,241,0.2)] ring-1 ring-white/90"
      style="border-radius: 30px; transform: rotate(-0.5deg)"
    >
      <div class="absolute top-4 left-6 h-2.5 w-2.5 rounded-full bg-rose-300" />
      <div
        class="absolute top-4 left-11 h-2.5 w-2.5 rounded-full bg-amber-300"
      />
      <div
        class="absolute top-4 left-16 h-2.5 w-2.5 rounded-full bg-emerald-300"
      />

      <div class="absolute top-10 left-0 h-13 w-full bg-white/62">
        <img
          v-if="logoImage"
          :src="logoImage"
          :alt="siteName"
          class="absolute top-3 left-6 h-7 w-7 object-contain"
          width="28"
          height="28"
        />
        <div
          class="absolute top-3.5 left-14.5 text-[14px] font-bold tracking-[-0.2px]"
        >
          {{ siteName }}
        </div>
        <div class="absolute top-2.75 left-52 flex items-center gap-2">
          <div
            v-for="(label, index) in navLabels.slice(0, 4)"
            :key="label"
            class="inline-flex h-7.5 items-center gap-1.25 rounded-full bg-white px-2.5 text-[9px] font-semibold text-slate-600 ring-1 ring-slate-100"
            :class="
              index === 0 ? 'text-indigo-600 ring-violet-100' : 'text-slate-600'
            "
          >
            <n-icon size="12">
              <component :is="navIcons[index] || Star" />
            </n-icon>
            <span>{{ label }}</span>
          </div>
        </div>
        <div
          class="absolute top-2.75 right-6.5 h-7.5 w-7.5 rounded-full bg-white text-slate-500 ring-1 ring-slate-100"
        >
          <n-icon
            size="11"
            class="absolute top-[9px] left-[9px]"
          >
            <User />
          </n-icon>
        </div>
      </div>

      <div
        class="absolute top-26.5 left-6 h-57 w-md overflow-hidden bg-slate-100 ring-1 ring-slate-100"
        style="border-radius: 14px"
      >
        <img
          v-if="primaryBanner"
          :src="primaryBanner"
          :alt="eyebrow"
          class="h-full w-full object-cover object-center"
          width="448"
          height="230"
        />
      </div>

      <div
        class="absolute top-87 left-6 h-57 w-md overflow-hidden bg-slate-100 ring-1 ring-slate-100"
        style="border-radius: 14px"
      >
        <img
          v-if="secondaryBanner"
          :src="secondaryBanner"
          :alt="eyebrow"
          class="h-full w-full object-cover object-center"
          width="448"
          height="230"
        />
      </div>

      <div
        class="absolute top-26.5 left-124 h-41 w-69 bg-white/88 ring-1 ring-violet-50"
        style="border-radius: 16px"
      >
        <div
          class="absolute top-4 left-4.5 text-[13px] font-bold text-indigo-600"
        >
          <span class="inline-flex items-center gap-1.5">
            {{ trackerTitle }}
          </span>
        </div>
        <div class="absolute top-12.5 right-4 left-4.5 grid grid-cols-3 gap-2">
          <div
            v-for="card in statCards"
            :key="card.label"
          >
            <div class="text-[8px] font-medium text-slate-500">
              {{ card.label }}
            </div>
            <div class="mt-0.5 text-[16px] font-bold text-slate-950">
              {{ card.value }}
            </div>
          </div>
        </div>
        <div class="absolute top-27 left-3 flex gap-2.5">
          <div
            v-for="item in trackerItems"
            :key="item.image"
            class="relative h-10.5 w-10.5 rounded-lg bg-amber-100 ring-1 ring-amber-200/70"
          >
            <img
              :src="item.image"
              :alt="trackerTitle"
              class="h-10.5 w-10.5 object-contain"
              width="32"
              height="32"
            />
            <div
              class="absolute -right-1 -bottom-1 rounded-full bg-rose-500 px-1.25 text-[8px] leading-3 font-semibold text-white shadow"
            >
              {{ item.pullsToObtain }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="absolute top-70 left-124 h-31 w-69 bg-white/88 ring-1 ring-violet-50"
        style="border-radius: 16px"
      >
        <div
          class="absolute top-3.75 left-4.5 text-[13px] font-bold text-indigo-600"
        >
          <span class="inline-flex items-center gap-1.5">
            {{ whimSearchTitle }}
          </span>
        </div>
        <div
          class="absolute top-11.5 right-4.5 left-4.5 flex h-8 items-center gap-1.75 rounded-full bg-white pr-1 pl-2.5 text-[9px] text-slate-400 ring-1 ring-slate-100"
        >
          <n-icon
            size="10"
            class="shrink-0"
          >
            <Search />
          </n-icon>

          <div class="mr-2 ml-auto flex shrink-0 items-center gap-1.75">
            <n-icon
              size="10"
              class="shrink-0"
            >
              <Filter />
            </n-icon>

            <div
              class="shrink-0 rounded-xl bg-rose-500 px-2.5 py-1 text-[9px] leading-tight font-bold text-white"
            >
              Search
            </div>
          </div>
        </div>
        <div class="absolute top-23 right-4.5 left-4.5 flex gap-1.25">
          <div
            v-for="label in filterLabels"
            :key="label"
            class="flex min-w-0 flex-1 items-center justify-between gap-0.75 rounded-full bg-white px-2 py-1 text-[8px] font-medium text-slate-600 ring-1 ring-slate-100"
          >
            <span class="min-w-0 truncate">{{ label }}</span>
            <n-icon
              size="8"
              class="shrink-0 text-slate-400"
            >
              <ChevronDown />
            </n-icon>
          </div>
        </div>
      </div>

      <div
        class="absolute top-104 left-124 h-40 w-69 bg-white/88 ring-1 ring-violet-50"
        style="border-radius: 16px"
      >
        <div
          class="absolute top-3.5 left-4.5 text-[13px] font-bold text-indigo-600"
        >
          <span class="inline-flex items-center gap-1.5">
            {{ compendiumTitle }}
          </span>
        </div>
        <div class="absolute top-12 left-3 grid grid-cols-4 gap-2.5">
          <div
            v-for="image in featuredOutfits"
            :key="image"
            class="h-25 w-14 overflow-hidden ring-1 ring-violet-100"
            style="
              background: linear-gradient(180deg, #f5f3ff 0%, #fff1f2 100%);
              border-radius: 8px;
            "
          >
            <img
              :src="image"
              :alt="compendiumTitle"
              class="h-27 w-18 object-cover"
              width="80"
              height="120"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
