<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="space-y-4">
        <n-skeleton
          height="400px"
          :sharp="false"
        />
        <n-skeleton
          text
          :repeat="3"
        />
      </div>
    </n-card>

    <!-- Error State -->
    <n-card
      v-else-if="error"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-result
        status="error"
        :title="t('compendium.error_title', { type: t('common.outfit') })"
        :description="
          t('compendium.error_description', {
            type: t('common.outfit').toLowerCase(),
          })
        "
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('common.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ t('compendium.back_to_list', { type: t('common.outfit') }) }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </n-card>

    <!-- Outfit Detail Content -->
    <template v-else-if="outfit">
      <!-- Outfit Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          <!-- Outfit Image -->
          <div class="flex justify-center lg:justify-start items-start">
            <div
              class="relative aspect-[2/3] w-full max-w-[280px] rounded-lg overflow-hidden shadow-lg"
              :class="getQualityGradient(outfit.quality)"
            >
              <NuxtImg
                :src="`/images/outfits/${outfit.id}.png`"
                :alt="outfitName"
                class="absolute inset-0 w-full h-full object-contain z-10"
                width="280"
                height="420"
                fit="cover"
                loading="eager"
                sizes="280px"
                format="webp"
                @error="handleImageError"
              />
              <div class="absolute top-2 right-2 z-20">
                <n-tag
                  round
                  size="small"
                  :bordered="false"
                  :type="getQualityType(outfit.quality)"
                >
                  {{ outfit.quality }}<n-icon class="ml-1"><Star /></n-icon>
                </n-tag>
              </div>
            </div>
          </div>

          <!-- Outfit Info -->
          <div class="space-y-4">
            <div class="space-y-2">
              <h1 class="text-2xl sm:text-3xl font-bold leading-tight">
                {{ outfitName }}
              </h1>
              <n-tag
                :type="getQualityType(outfit.quality)"
                :bordered="false"
                round
                size="medium"
              >
                {{ getQualityLabel(outfit.quality) }}
              </n-tag>
            </div>

            <!-- Description -->
            <div
              v-if="outfitDescription"
              class="text-sm sm:text-base opacity-90 leading-relaxed"
            >
              <h3 class="text-base sm:text-lg font-semibold mb-2">
                {{ t('common.description') }}
              </h3>
              <p class="whitespace-pre-wrap">{{ outfitDescription }}</p>
            </div>

            <!-- Back Button -->
            <div class="pt-4">
              <n-button
                type="primary"
                @click="navigateToList"
              >
                <template #icon>
                  <n-icon><ArrowLeft /></n-icon>
                </template>
                {{ t('compendium.back_to_list', { type: t('common.outfit') }) }}
              </n-button>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Component Items Section -->
      <n-card
        v-if="componentItems.length > 0"
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <h2 class="text-xl font-bold mb-4">
          {{ t('compendium.detail_component_items') }}
        </h2>
        <div
          class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
        >
          <ItemPreviewCard
            v-for="item in componentItems"
            :key="item.id"
            :item-id="item.id"
            :quality="item.quality"
            :type="item.type"
            :name="t(`item.${item.id}.name`)"
            :clickable="true"
            size="small"
          />
        </div>
      </n-card>
    </template>

    <!-- Not Found State -->
    <n-card
      v-else
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-result
        status="404"
        :title="t('compendium.not_found_title', { type: t('common.outfit') })"
        :description="
          t('compendium.not_found_description', {
            type: t('common.outfit').toLowerCase(),
          })
        "
      >
        <template #footer>
          <n-button
            type="primary"
            @click="navigateToList"
          >
            {{ t('compendium.back_to_list', { type: t('common.outfit') }) }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { NIcon } from 'naive-ui'
  import { Star, ArrowLeft } from '@vicons/fa'
  import type { OutfitWithItems } from '~/types/supabase'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const route = useRoute()

  // Get outfit ID from route
  const outfitId = computed(() => Number(route.params.id))

  // State
  const outfit = ref<OutfitWithItems | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  // Composable
  const { fetchOutfitById } = useSupabaseOutfits()

  // Computed component items
  const componentItems = computed(() => {
    if (!outfit.value?.outfit_items) return []
    return outfit.value.outfit_items.map((oi) => oi.items)
  })

  // Get outfit name from i18n (names are stored in i18n files, not database)
  const outfitName = computed(() => {
    if (!outfit.value) return ''
    return t(`outfit.${outfit.value.id}.name`)
  })

  // Get outfit description from database (if available in outfit_translations)
  const outfitDescription = computed(() => {
    if (!outfit.value) return ''
    // Description comes from database outfit_translations table
    // The fetchOutfitById composable should fetch this
    return (
      (outfit.value as OutfitWithItems & { description?: string })
        .description || ''
    )
  })

  // Fetch outfit data
  const loadOutfit = async () => {
    loading.value = true
    error.value = null

    try {
      const { locale } = useI18n()
      const data = await fetchOutfitById(outfitId.value, locale.value)
      outfit.value = data
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load outfit:', e)
    } finally {
      loading.value = false
    }
  }

  // Retry fetch
  const retryFetch = () => {
    loadOutfit()
  }

  // Navigate to list
  const navigateToList = () => {
    router.push(localePath('/outfit'))
  }

  // Get quality gradient class
  const getQualityGradient = (quality: number) => {
    switch (quality) {
      case 5:
        return 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] dark:from-[#713f12] dark:to-[#451a03]'
      case 4:
        return 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] dark:from-[#334155] dark:to-[#1e293b]'
      case 3:
        return 'bg-gradient-to-br from-[#e0f2f1] to-[#80cbc4] dark:from-[#134e4a] dark:to-[#0f766e]'
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
    }
  }

  // Get quality type for tag
  const getQualityType = (quality: number) => {
    switch (quality) {
      case 5:
        return 'warning'
      case 4:
        return 'info'
      case 3:
        return 'success'
      default:
        return 'default'
    }
  }

  // Get quality label
  const getQualityLabel = (quality: number) => {
    return h('span', { class: 'inline-flex items-center' }, [
      quality,
      h(NIcon, { class: 'ml-1' }, () => h(Star)),
    ])
  }

  // Handle image error
  const handleImageError = (e: Event | string) => {
    if (typeof e === 'string') return
    const img = e.target as HTMLImageElement
    img.src = '/images/loading.webp'
  }

  // Load outfit on mount
  onMounted(() => {
    loadOutfit()
  })

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl

  useSeoMeta({
    title: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')} - ${t('navigation.subtitle')}`
        : `${t('common.outfits')} - ${t('navigation.subtitle')}`,
    description: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    ogTitle: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')}`
        : t('common.outfits'),
    ogDescription: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    ogImage: () =>
      outfit.value
        ? `https://ik.imagekit.io/gongeous/outfits/${outfit.value.id}.png`
        : undefined,
    ogType: 'website',
    twitterTitle: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')}`
        : t('common.outfits'),
    twitterDescription: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    twitterImage: () =>
      outfit.value
        ? `https://ik.imagekit.io/gongeous/outfits/${outfit.value.id}.png`
        : undefined,
  })

  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${localePath(`/outfit/${outfitId.value}`)}`,
      },
    ],
    script: outfit.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: outfitName.value,
              description:
                outfitDescription.value ||
                `${outfitName.value} - Infinity Nikki Outfit`,
              image: `https://ik.imagekit.io/gongeous/outfits/${outfit.value.id}.png`,
              brand: {
                '@type': 'Brand',
                name: 'Infinity Nikki',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: outfit.value.quality,
                bestRating: 5,
                worstRating: 1,
              },
            }),
          },
        ]
      : [],
  }))
</script>
