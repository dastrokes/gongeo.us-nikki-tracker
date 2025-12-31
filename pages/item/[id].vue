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
        :title="t('item.error_title')"
        :description="t('item.error_description')"
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('item.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ t('item.back_to_list') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </n-card>

    <!-- Item Detail Content -->
    <template v-else-if="item">
      <!-- Item Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Item Image -->
          <div class="flex justify-center items-start">
            <div
              class="relative aspect-[2/3] w-full max-w-md rounded-lg overflow-hidden"
              :class="getQualityGradient(item.quality)"
            >
              <NuxtImg
                :src="`/items/${item.id}.png`"
                :alt="item.name"
                class="absolute inset-0 w-full h-full object-contain z-10"
                width="400"
                height="600"
                fit="cover"
                loading="eager"
                sizes="xs:100vw sm:50vw md:50vw lg:400px"
                
                
                @error="handleImageError"
              />
              <div class="absolute top-2 right-2 z-20">
                <n-tag
                  round
                  size="medium"
                  :bordered="false"
                  :type="getQualityType(item.quality)"
                >
                  {{ item.quality }}<n-icon class="ml-1"><Star /></n-icon>
                </n-tag>
              </div>
            </div>
          </div>

          <!-- Item Info -->
          <div class="space-y-6">
            <div class="space-y-3">
              <h1 class="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                {{ item.name }}
              </h1>
              <div class="flex flex-wrap gap-2">
                <n-tag
                  :type="getQualityType(item.quality)"
                  :bordered="false"
                  round
                  size="large"
                >
                  {{ getQualityLabel(item.quality) }}
                </n-tag>
                <n-tag
                  type="default"
                  :bordered="false"
                  round
                  size="large"
                >
                  {{ t(`items.types.${itemType}`) }}
                </n-tag>
              </div>
            </div>

            <!-- Description -->
            <div
              v-if="item.description"
              class="text-base sm:text-lg opacity-90 leading-relaxed"
            >
              <h3 class="text-lg sm:text-xl font-semibold mb-3">
                {{ t('item.detail_description') }}
              </h3>
              <p class="whitespace-pre-wrap">{{ item.description }}</p>
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
                {{ t('item.back_to_list') }}
              </n-button>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Related Outfits Section -->
      <n-card
        v-if="relatedOutfits.length > 0"
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 class="text-2xl font-bold mb-6">
            {{ t('item.detail_related_outfits') }}
          </h2>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <div
              v-for="outfit in relatedOutfits"
              :key="outfit.id"
              class="cursor-pointer"
              @click="navigateToOutfit(outfit.id)"
            >
              <div
                class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:scale-105"
                :class="getQualityGradient(outfit.quality)"
              >
                <NuxtImg
                  :src="`/outfits/${outfit.id}.png`"
                  :alt="outfit.name"
                  class="absolute inset-0 w-full h-full object-contain z-10"
                  width="300"
                  height="450"
                  fit="cover"
                  loading="lazy"
                  sizes="xs:100vw sm:50vw md:50vw lg:33vw xl:25vw"
                  
                  
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
              <div class="mt-2 text-center">
                <p class="font-semibold text-sm sm:text-base">
                  {{ outfit.name }}
                </p>
              </div>
            </div>
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
        :title="t('item.not_found_title')"
        :description="t('item.not_found_description')"
      >
        <template #footer>
          <n-button
            type="primary"
            @click="navigateToList"
          >
            {{ t('item.back_to_list') }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Star, ArrowLeft } from '@vicons/fa'
  import type { ItemWithOutfits } from '~/types/supabase'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const route = useRoute()

  // Get item ID from route
  const itemId = computed(() => Number(route.params.id))

  // State
  const item = ref<ItemWithOutfits | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  // Composable
  const { fetchItemById } = useSupabaseItems()

  // Computed related outfits
  const relatedOutfits = computed(() => {
    if (!item.value?.outfit_items) return []
    return item.value.outfit_items.map((sc) => sc.outfits)
  })

  // Get item type
  const itemType = computed(() => {
    if (!item.value) return 'unknown'
    return getItemType(item.value.id)
  })

  // Fetch item data
  const loadItem = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await fetchItemById(itemId.value)
      item.value = data
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load item:', e)
    } finally {
      loading.value = false
    }
  }

  // Retry fetch
  const retryFetch = () => {
    loadItem()
  }

  // Navigate to list
  const navigateToList = () => {
    router.push(localePath('/item'))
  }

  // Navigate to outfit detail
  const navigateToOutfit = (outfitId: number) => {
    router.push(localePath(`/outfit/${outfitId}`))
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
    return t(`item.quality_${quality}_star`)
  }

  // Handle image error
  const handleImageError = (e: Event | string) => {
    if (typeof e === 'string') return
    const img = e.target as HTMLImageElement
    img.src = '/images/loading.png'
  }

  // Load item on mount
  onMounted(() => {
    loadItem()
  })

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl

  useSeoMeta({
    title: () =>
      item.value
        ? `${item.value.name} - ${t('navigation.items')} - ${t('navigation.subtitle')}`
        : `${t('navigation.items')} - ${t('navigation.subtitle')}`,
    description: () =>
      item.value?.description ||
      t('meta.description.item_detail', { name: item.value?.name || '' }),
    ogTitle: () =>
      item.value
        ? `${item.value.name} - ${t('navigation.items')}`
        : t('navigation.items'),
    ogDescription: () =>
      item.value?.description ||
      t('meta.description.item_detail', { name: item.value?.name || '' }),
    ogImage: () =>
      item.value
        ? `https://ik.imagekit.io/gongeous/items/${item.value.id}.png`
        : undefined,
    ogType: 'website',
    twitterTitle: () =>
      item.value
        ? `${item.value.name} - ${t('navigation.items')}`
        : t('navigation.items'),
    twitterDescription: () =>
      item.value?.description ||
      t('meta.description.item_detail', { name: item.value?.name || '' }),
    twitterImage: () =>
      item.value
        ? `https://ik.imagekit.io/gongeous/items/${item.value.id}.png`
        : undefined,
  })

  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${localePath(`/item/${itemId.value}`)}`,
      },
    ],
    script: item.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: item.value.name,
              description:
                item.value.description ||
                `${item.value.name} - Infinity Nikki Item`,
              image: `https://ik.imagekit.io/gongeous/items/${item.value.id}.png`,
              brand: {
                '@type': 'Brand',
                name: 'Infinity Nikki',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: item.value.quality,
                bestRating: 5,
                worstRating: 1,
              },
            }),
          },
        ]
      : [],
  }))
</script>
