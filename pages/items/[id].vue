<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
        <!-- Image Skeleton -->
        <div class="flex justify-center lg:justify-start">
          <div
            class="relative aspect-[2/3] w-full max-w-[180px] rounded-lg overflow-hidden"
          >
            <n-skeleton
              :sharp="false"
              class="h-full w-full"
            />
            <div class="absolute top-1.5 right-1.5">
              <n-skeleton
                width="64px"
                height="24px"
                :sharp="false"
                class="rounded-full"
              />
            </div>
          </div>
        </div>

        <!-- Info Skeleton -->
        <div class="space-y-3">
          <div class="space-y-2">
            <n-skeleton
              text
              width="60%"
              height="32px"
            />
            <div class="flex gap-2">
              <n-skeleton
                width="60px"
                height="24px"
                :sharp="false"
                class="rounded-full"
              />
              <n-skeleton
                width="80px"
                height="24px"
                :sharp="false"
                class="rounded-full"
              />
            </div>
          </div>
          <n-skeleton
            text
            :repeat="2"
          />
        </div>
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
        :title="t('compendium.error_title')"
        :description="t('compendium.error_description')"
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
              {{ t('compendium.back_to_list') }}
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
        <div class="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
          <!-- Item Image -->
          <div class="flex justify-center lg:justify-start items-start">
            <div
              class="relative aspect-[2/3] w-full max-w-[180px] rounded-lg overflow-hidden shadow-lg"
              :class="getQualityGradient(item.quality)"
            >
              <NuxtImg
                :src="getImageSrc('item', item.id)"
                :alt="itemName"
                class="absolute inset-0 w-full h-full object-cover z-10"
                preset="tallMd"
                width="200"
                height="300"
                fit="cover"
                loading="eager"
                sizes="200px sm:240px"
                format="webp"
              />
              <div class="absolute top-1.5 right-1.5 z-20">
                <n-tag
                  round
                  size="small"
                  :bordered="false"
                  :type="getQualityType(item.quality)"
                >
                  <span class="align-top">{{ item.quality }}</span>
                  <span class="ml-0.5"
                    ><n-icon><Star /></n-icon
                  ></span>
                </n-tag>
              </div>
            </div>
          </div>

          <!-- Item Info -->
          <div class="space-y-3">
            <div class="space-y-1.5">
              <h1 class="text-xl sm:text-2xl font-bold leading-tight">
                {{ itemName }}
              </h1>
              <div class="flex flex-wrap gap-2">
                <n-tag
                  :type="getQualityType(item.quality)"
                  :bordered="false"
                  round
                  size="small"
                >
                  <span class="align-top">{{ item.quality }}</span
                  ><span class="ml-0.5"
                    ><n-icon class="text-xs"><Star /></n-icon
                  ></span>
                </n-tag>
                <n-tag
                  type="default"
                  :bordered="false"
                  round
                  size="small"
                >
                  {{ t(`type.${itemType}`) }}
                </n-tag>
                <n-tag
                  v-if="itemStyleLabel"
                  :bordered="false"
                  round
                  strong
                  size="small"
                  class="!bg-rose-50 !text-rose-600 dark:!bg-rose-900/30 dark:!text-rose-300"
                >
                  <template #icon>
                    <n-icon><Magic /></n-icon>
                  </template>
                  {{ itemStyleLabel }}
                </n-tag>
                <n-tag
                  v-for="label in itemLabelTags"
                  :key="label"
                  :bordered="false"
                  round
                  strong
                  size="small"
                  class="!bg-teal-50 !text-teal-600 dark:!bg-teal-900/30 dark:!text-teal-300"
                >
                  <template #icon>
                    <n-icon><Tag /></n-icon>
                  </template>
                  {{ label }}
                </n-tag>
              </div>
            </div>

            <!-- Description -->
            <div
              v-if="itemDescription"
              class="text-xs sm:text-sm opacity-80 leading-relaxed"
            >
              <p class="whitespace-pre-wrap">{{ itemDescription }}</p>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Variations, Banner, and Outfits Grid (side by side on desktop) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        <!-- Item Variations Section -->
        <n-card
          v-if="itemVariations.length > 1"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="!p-2 sm:p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold">
              {{ t('common.variations') }}
            </h2>
          </div>
          <div
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          >
            <NuxtLink
              v-for="variation in itemVariations"
              :key="variation.id"
              :to="localePath(`/items/${variation.id}`)"
              class="block group"
            >
              <div
                class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md"
                :class="[
                  getQualityGradient(variation.quality),
                  variation.id === itemId
                    ? 'ring-2 ring-primary/60 dark:ring-primary/40'
                    : 'group-hover:scale-105',
                ]"
              >
                <NuxtImg
                  :src="getImageSrc('item', variation.id)"
                  :alt="t(`item.${variation.id}.name`)"
                  class="absolute inset-0 w-full h-full object-cover z-10"
                  preset="tallSm"
                  width="100"
                  height="150"
                  fit="cover"
                  loading="lazy"
                  sizes="100px"
                  format="webp"
                />
              </div>
              <div class="mt-1 text-center">
                <p class="text-xs font-medium opacity-80">
                  {{ variation.label }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </n-card>

        <!-- Related Outfits Section -->
        <n-card
          v-if="relatedOutfits.length > 0"
          size="small"
          class="rounded-xl p-0 sm:p-2"
          content-class="!p-2 sm:p-4"
        >
          <h2 class="text-lg font-bold mb-3">
            {{ t('common.outfit') }}
          </h2>
          <div
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          >
            <div
              v-for="outfit in relatedOutfits"
              :key="outfit.id"
              class="cursor-pointer group"
              @click="navigateToOutfit(outfit.id)"
            >
              <div
                class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ease-in-out group-hover:scale-105 shadow-md"
                :class="getQualityGradient(outfit.quality)"
              >
                <NuxtImg
                  :src="getImageSrc('outfit', outfit.id)"
                  :alt="outfit.name"
                  class="absolute inset-0 w-full h-full object-cover z-10"
                  preset="tallSm"
                  width="100"
                  height="150"
                  fit="cover"
                  loading="lazy"
                  sizes="100px"
                  format="webp"
                />
                <div class="absolute top-1 right-1 z-20">
                  <n-tag
                    round
                    size="tiny"
                    :bordered="false"
                    :type="getQualityType(outfit.quality)"
                  >
                    <span class="align-top">{{ outfit.quality }}</span>
                    <span class="ml-0.5"
                      ><n-icon><Star /></n-icon
                    ></span>
                  </n-tag>
                </div>
              </div>
              <div class="mt-1 text-center">
                <p class="font-medium text-xs line-clamp-2">
                  {{ outfit.name }}
                </p>
              </div>
            </div>
          </div>
        </n-card>

        <!-- Banner Section -->
        <n-card
          v-if="inBanner"
          size="small"
          class="rounded-xl p-0 sm:p-2 h-full flex flex-col"
          content-class="!p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="text-lg font-bold mb-3">
            {{ t('common.banner') }}
          </h2>
          <NuxtLink
            :to="localePath(`/banners/${inBanner.bannerId}`)"
            class="block group"
          >
            <div
              class="relative aspect-[2/1] max-h-[150px] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md group-hover:scale-[1.02]"
            >
              <NuxtImg
                :src="getImageSrc('banner', inBanner.bannerId)"
                :alt="t(`banner.${inBanner.bannerId}.name`)"
                class="w-full h-full object-cover"
                preset="bannerThumb"
                width="200"
                height="100"
                fit="cover"
                loading="lazy"
                sizes="200px"
                format="webp"
              />
            </div>
            <div class="mt-2">
              <p class="font-medium text-sm line-clamp-2">
                {{ t(`banner.${inBanner.bannerId}.name`) }}
              </p>
            </div>
          </NuxtLink>
        </n-card>
      </div>
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
        :title="t('compendium.not_found_title')"
        :description="t('compendium.not_found_description')"
      >
        <template #icon>
          <div class="flex justify-center">
            <NuxtImg
              :src="getImageSrc('static', '/images/404.webp')"
              alt="Not Found"
              class="w-48 h-48 object-cover"
              width="400"
              height="400"
              loading="lazy"
            />
          </div>
        </template>
        <template #footer>
          <n-button
            type="primary"
            @click="navigateToList"
          >
            {{ t('compendium.back_to_list') }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { NIcon } from 'naive-ui'
  import { Star, Magic, Tag } from '@vicons/fa'
  import type { ItemWithOutfits } from '~/types/supabase'
  import { getBannerForItem } from '~/utils/bannerUtils'
  import {
    resolveStyleKeyFromProps,
    resolveTagI18nKeys,
    STYLE_BY_KEY,
  } from '~/utils/itemInfo'

  const { t, locale } = useI18n()
  const { getImageSrc, getImageUrl } = imageProvider()
  const localePath = useLocalePath()
  const router = useRouter()
  const route = useRoute()

  // Get item ID from route
  const itemId = computed(() => Number(route.params.id))

  // Composable
  const { fetchItemById } = useSupabaseItems()

  const itemKey = computed(() => `item-${itemId.value}-${locale.value}`)

  const {
    data: item,
    pending: loading,
    error,
    refresh,
  } = await useAsyncData(
    () => itemKey.value,
    () => fetchItemById(itemId.value),
    {
      default: () => null,
      watch: [itemId, locale],
    }
  )

  // Computed related outfits with names from i18n
  const relatedOutfits = computed(() => {
    if (!item.value?.outfit_items) return []
    return item.value.outfit_items.map((sc) => ({
      ...sc.outfits,
      name: t(`outfit.${sc.outfits.id}.name`),
    }))
  })

  // Computed item variations with labels
  const itemVariations = computed(() => {
    if (!item.value?.variations) return []
    return item.value.variations.map((v) => {
      // Map type to existing translation key
      let levelKey = '1' // base
      if (v.type === 'glowup') {
        levelKey = 'glow'
      } else if (v.type === 'evo1') {
        levelKey = '2'
      } else if (v.type === 'evo2') {
        levelKey = '3'
      } else if (v.type === 'evo3') {
        levelKey = '4'
      }

      return {
        id: v.id,
        quality: v.quality,
        label: t(`banner.outfit.level.${levelKey}`),
      }
    })
  })

  // Find banner for this item (including variations)
  const inBanner = computed(() => {
    if (!item.value) return null

    let banner = getBannerForItem(item.value.id)
    if (banner) return banner

    if (item.value.variations) {
      for (const variation of item.value.variations) {
        banner = getBannerForItem(variation.id)
        if (banner) return banner
      }
    }

    return null
  })

  // Get item type
  const itemType = computed(() => {
    if (!item.value) return 'unknown'
    return getItemType(item.value.id)
  })

  // Get item name from i18n (names are stored in i18n files, not database)
  const itemName = computed(() => {
    if (!item.value) return ''
    return t(`item.${item.value.id}.name`)
  })

  // Get item description from database (if available in item_translations)
  const itemDescription = computed(() => {
    if (!item.value) return ''
    // Description comes from database item_translations table
    // The fetchItemById composable should fetch this
    return (
      (item.value as ItemWithOutfits & { description?: string }).description ||
      ''
    )
  })

  const itemStyleLabel = computed(() => {
    if (!item.value) return null
    const styleKey = resolveStyleKeyFromProps(item.value.props)
    const style = styleKey ? STYLE_BY_KEY.get(styleKey) : null
    return style ? t(style.i18nKey) : null
  })

  const itemLabelTags = computed(() => {
    if (!item.value) return []
    return resolveTagI18nKeys(item.value.tags).map((key) => t(key))
  })

  // Retry fetch
  const retryFetch = () => {
    refresh()
  }

  // Navigate to list
  const navigateToList = () => {
    router.push(localePath('/items'))
  }

  // Navigate to outfit detail
  const navigateToOutfit = (outfitId: number) => {
    router.push(localePath(`/outfits/${outfitId}`))
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
      case 2:
        return 'bg-gradient-to-br from-[#f5f5f5] to-[#d6d6d6] dark:from-[#3f3f46] dark:to-[#27272a]'
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
      case 2:
        return 'default'
      default:
        return 'default'
    }
  }

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl
  const ogItemImage = computed(() =>
    item.value
      ? getImageUrl(`/images/items/${item.value.id}.png`, {
          width: 300,
          height: 450,
          quality: 80,
          format: 'webp',
        })
      : undefined
  )

  useSeoMeta({
    title: () =>
      item.value
        ? `${itemName.value} - ${t('meta.game_title')} - ${t('navigation.title')}`
        : `${t('common.items')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () =>
      itemDescription.value ||
      t('meta.description.item_detail', { name: itemName.value || '' }),
    ogTitle: () =>
      item.value
        ? `${itemName.value} - ${t('meta.game_title')} - ${t('navigation.title')}`
        : `${t('common.items')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () =>
      itemDescription.value ||
      t('meta.description.item_detail', { name: itemName.value || '' }),
    ogImage: () => ogItemImage.value,
    ogType: 'website',
    twitterTitle: () =>
      item.value
        ? `${itemName.value} - ${t('meta.game_title')} - ${t('navigation.title')}`
        : `${t('common.items')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () =>
      itemDescription.value ||
      t('meta.description.item_detail', { name: itemName.value || '' }),
    twitterImage: () => ogItemImage.value,
  })

  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${localePath(`/items/${itemId.value}`)}`,
      },
    ],
    script: item.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: itemName.value,
              description:
                itemDescription.value ||
                `${itemName.value} - ${t('meta.game_title')} - ${t('navigation.title')}`,
              image: ogItemImage.value,
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
