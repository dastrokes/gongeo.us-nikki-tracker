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
        :title="t('outfit.error_title')"
        :description="t('outfit.error_description')"
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('outfit.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ t('outfit.back_to_list') }}
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Outfit Image -->
          <div class="flex justify-center items-start">
            <div
              class="relative aspect-[2/3] w-full max-w-md rounded-lg overflow-hidden"
              :class="getQualityGradient(outfit.quality)"
            >
              <NuxtImg
                :src="`/outfits/${outfit.id}.png`"
                :alt="outfit.name"
                class="absolute inset-0 w-full h-full object-contain z-10"
                width="400"
                height="600"
                fit="cover"
                loading="eager"
                sizes="xs:100vw sm:50vw md:50vw lg:400px"
                format="webp"
                quality="80"
                @error="handleImageError"
              />
              <div class="absolute top-2 right-2 z-20">
                <n-tag
                  round
                  size="medium"
                  :bordered="false"
                  :type="getQualityType(outfit.quality)"
                >
                  {{ outfit.quality }}<n-icon class="ml-1"><Star /></n-icon>
                </n-tag>
              </div>
            </div>
          </div>

          <!-- Outfit Info -->
          <div class="space-y-6">
            <div class="space-y-3">
              <h1 class="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                {{ outfit.name }}
              </h1>
              <n-tag
                :type="getQualityType(outfit.quality)"
                :bordered="false"
                round
                size="large"
              >
                {{ getQualityLabel(outfit.quality) }}
              </n-tag>
            </div>

            <!-- Description -->
            <div
              v-if="outfit.description"
              class="text-base sm:text-lg opacity-90 leading-relaxed"
            >
              <h3 class="text-lg sm:text-xl font-semibold mb-3">
                {{ t('outfit.detail_description') }}
              </h3>
              <p class="whitespace-pre-wrap">{{ outfit.description }}</p>
            </div>

            <!-- Back Button -->
            <div class="pt-6">
              <n-button
                type="primary"
                size="large"
                @click="navigateToList"
              >
                <template #icon>
                  <n-icon><ArrowLeft /></n-icon>
                </template>
                {{ t('outfit.back_to_list') }}
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
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 class="text-2xl font-bold mb-6">
            {{ t('outfit.detail_component_items') }}
          </h2>
          <div
            class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            <ItemPreviewCard
              v-for="item in componentItems"
              :key="item.id"
              :item-id="item.id"
              :quality="item.quality"
              :type="item.type"
              :clickable="true"
              size="medium"
            />
          </div>
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
        :title="t('outfit.not_found_title')"
        :description="t('outfit.not_found_description')"
      >
        <template #footer>
          <n-button
            type="primary"
            @click="navigateToList"
          >
            {{ t('outfit.back_to_list') }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
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

  // Fetch outfit data
  const loadOutfit = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await fetchOutfitById(outfitId.value)
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
    return t(`outfit.quality_${quality}_star`)
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
        ? `${outfit.value.name} - ${t('navigation.outfits')} - ${t('navigation.subtitle')}`
        : `${t('navigation.outfits')} - ${t('navigation.subtitle')}`,
    description: () =>
      outfit.value?.description ||
      t('meta.description.outfit_detail', { name: outfit.value?.name || '' }),
    ogTitle: () =>
      outfit.value
        ? `${outfit.value.name} - ${t('navigation.outfits')}`
        : t('navigation.outfits'),
    ogDescription: () =>
      outfit.value?.description ||
      t('meta.description.outfit_detail', { name: outfit.value?.name || '' }),
    ogImage: () =>
      outfit.value
        ? `https://ik.imagekit.io/gongeous/outfits/${outfit.value.id}.png`
        : undefined,
    ogType: 'website',
    twitterTitle: () =>
      outfit.value
        ? `${outfit.value.name} - ${t('navigation.outfits')}`
        : t('navigation.outfits'),
    twitterDescription: () =>
      outfit.value?.description ||
      t('meta.description.outfit_detail', { name: outfit.value?.name || '' }),
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
              name: outfit.value.name,
              description:
                outfit.value.description ||
                `${outfit.value.name} - Infinity Nikki Outfit`,
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
