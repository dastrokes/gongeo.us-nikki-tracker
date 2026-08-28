<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr] lg:gap-6">
        <div class="flex justify-center lg:justify-start">
          <div
            class="relative aspect-square w-full max-w-50 overflow-hidden rounded-lg"
          >
            <n-skeleton
              :sharp="false"
              class="h-full w-full"
            />
          </div>
        </div>
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
        </div>
      </div>
    </n-card>

    <n-card
      v-else-if="error || !prop"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
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
            @click="loadProp"
          >
            {{ t('common.retry') }}
          </n-button>
        </template>
      </n-result>
    </n-card>

    <template v-else>
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
          <div class="flex items-start justify-center lg:justify-start">
            <div class="w-50 max-w-full shrink-0">
              <div
                class="group relative aspect-square w-full overflow-hidden rounded-lg shadow-lg"
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                />
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(prop.quality)"
                />
                <NuxtImg
                  v-if="!imageFailed"
                  :src="getImageSrc('prop', prop.id)"
                  :alt="propName"
                  class="absolute inset-0 z-10 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                  preset="squareLg"
                  fit="contain"
                  loading="eager"
                  sizes="200px"
                  @error="imageFailed = true"
                />
                <div
                  v-else
                  class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center text-white/75"
                >
                  <n-icon size="40"><Box /></n-icon>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl leading-tight font-bold sm:text-2xl">
                  {{ propName }}
                </h1>
                <NuxtLinkLocale
                  :to="{ path: '/props', query: { quality: prop.quality } }"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    :color="getQualityTextTheme(prop.quality)"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    <span class="flex items-center gap-1">
                      {{ prop.quality }}
                      <n-icon class="text-xs"><Star /></n-icon>
                    </span>
                  </n-tag>
                </NuxtLinkLocale>
                <WardrobeStatusBadge
                  v-if="wardrobeInitialized && isPropOwned(prop.id)"
                  status="owned"
                  :quality="prop.quality"
                />
                <WardrobeOwnedButton
                  v-if="wardrobeInitialized"
                  :owned="isPropOwned(prop.id)"
                  :disabled="!isWardrobeReady"
                  :loading="wardrobeSaving"
                  :quality="prop.quality"
                  variant="overlay"
                  @toggle="toggleOwned"
                />
              </div>

              <div
                v-if="propVersionDisplay || propSourceTags.length > 0"
                class="flex flex-wrap gap-2"
              >
                <NuxtLinkLocale
                  v-if="propVersionDisplay && propVersionListLocation"
                  :to="propVersionListLocation"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    type="default"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ propVersionDisplay }}
                  </n-tag>
                </NuxtLinkLocale>
                <NuxtLinkLocale
                  v-for="source in propSourceTags"
                  :key="source.value"
                  :to="source.location"
                  class="transition-opacity hover:opacity-80"
                >
                  <n-tag
                    type="default"
                    :bordered="false"
                    round
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ source.label }}
                  </n-tag>
                </NuxtLinkLocale>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <div
        class="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-2 lg:items-stretch"
      >
        <n-card
          v-if="propVariations.length > 1"
          size="small"
          class="h-full rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{ t('common.variations') }}
          </h2>
          <div
            class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4"
          >
            <NuxtLinkLocale
              v-for="variation in propVariations"
              :key="variation.id"
              :to="getPropDetailPath(variation.id)"
              class="group block rounded-lg focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:ring-offset-2 focus-visible:outline-hidden dark:focus-visible:ring-offset-slate-950"
              :class="
                variation.id === propId
                  ? 'pointer-events-none cursor-default'
                  : 'cursor-pointer'
              "
              :aria-current="variation.id === propId ? 'page' : undefined"
            >
              <div
                class="relative aspect-square overflow-hidden rounded-lg shadow-md transition-all duration-200 ease-in-out"
                :class="variation.id === propId ? '' : 'group-hover:scale-105'"
                :style="
                  variation.id === propId
                    ? getQualityRingStyle(variation.quality)
                    : undefined
                "
              >
                <div
                  class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
                />
                <div
                  class="absolute inset-0"
                  :style="getQualityOverlayStyle(variation.quality)"
                />
                <NuxtImg
                  :src="getImageSrc('prop', variation.id)"
                  :alt="variation.name"
                  class="absolute inset-0 z-10 h-full w-full object-contain p-2"
                  preset="squareSm"
                  fit="contain"
                  loading="lazy"
                  sizes="200px"
                />
              </div>
              <p
                class="mt-1 line-clamp-2 text-center text-xs leading-snug font-medium opacity-80"
              >
                {{ variation.name }}
              </p>
            </NuxtLinkLocale>
          </div>
        </n-card>

        <n-card
          v-if="relatedBannerIds.length > 0"
          size="small"
          class="flex h-full flex-col rounded-xl p-0 sm:p-2"
          content-class="p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="mb-3 text-lg font-bold">
            {{
              t(
                relatedBannerIds.length === 1
                  ? 'common.banner'
                  : 'common.banners'
              )
            }}
          </h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <NuxtLinkLocale
              v-for="bannerId in relatedBannerIds"
              :key="bannerId"
              :to="getBannerDetailPath(bannerId)"
              class="group block"
            >
              <div
                class="relative aspect-2/1 max-h-40 overflow-hidden rounded-lg shadow-md transition-all duration-200 ease-in-out group-hover:scale-[1.02]"
              >
                <NuxtImg
                  :src="getImageSrc('banner', bannerId)"
                  :alt="t(`banner.${bannerId}.name`)"
                  class="h-full w-full object-cover"
                  preset="bannerThumb"
                  fit="cover"
                  loading="lazy"
                  sizes="200px"
                />
              </div>
              <p class="mt-2 line-clamp-2 text-sm font-medium">
                {{ t(`banner.${bannerId}.name`) }}
              </p>
            </NuxtLinkLocale>
          </div>
        </n-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { Box, Star } from '@vicons/fa'

  definePageMeta({ key: 'prop-detail' })

  const { t, te } = useI18n()
  const message = useMessage()
  const requestEvent = useRequestEvent()
  const { getImageSrc } = imageProvider()
  const catalog = useCatalogIndex()
  const {
    entityId: propId,
    canonicalUrl: canonicalPropUrl,
    redirectToCanonicalSlug,
  } = useEntityDetailRoute(propSlugHelpers)

  await redirectToCanonicalSlug()

  const knownPropIds = new Set(getPropSlugIds().map(Number))
  const isKnownPropId = computed(
    () => Number.isInteger(propId.value) && knownPropIds.has(propId.value)
  )

  if (import.meta.server && requestEvent && !isKnownPropId.value) {
    setResponseStatus(requestEvent, 404)
    applyPageCacheHeaders(requestEvent, 'noStore')
  }

  const loading = ref(true)
  const error = ref<Error | null>(null)
  const imageFailed = ref(false)
  const wardrobeSaving = ref(false)
  const {
    initialized: wardrobeInitialized,
    canMutate: isWardrobeReady,
    init: initWardrobe,
    isPropOwned,
    togglePropOwned,
  } = useWardrobe()

  const prop = computed(
    () => catalog.props.value.find((entry) => entry.id === propId.value) ?? null
  )
  const propName = computed(() => {
    if (!isKnownPropId.value) return ''
    const key = `prop.${propId.value}.name`
    return te(key) ? t(key) : ''
  })
  const propBaseId = computed(
    () => prop.value?.variantRootId ?? prop.value?.id ?? null
  )
  const propVariations = computed(() => {
    const baseId = propBaseId.value
    if (baseId === null) return []

    return catalog.props.value
      .filter((entry) => entry.id === baseId || entry.variantRootId === baseId)
      .map((entry) => ({
        ...entry,
        name: t(`prop.${entry.id}.name`),
      }))
      .sort((left, right) => {
        if (left.id === baseId) return -1
        if (right.id === baseId) return 1
        return left.id - right.id
      })
  })
  const relatedBannerIds = computed(() =>
    Array.from(
      new Set(propVariations.value.flatMap((entry) => entry.bannerIds ?? []))
    ).sort((left, right) => left - right)
  )
  const propVersion = computed(() => prop.value?.version ?? null)
  const propVersionDisplay = computed(() => {
    if (!propVersion.value) return null

    const key = `version.${propVersion.value}`
    const translated = t(key)
    return translated !== key
      ? `${propVersion.value} - ${translated}`
      : propVersion.value
  })
  const propVersionListLocation = computed(() =>
    propVersion.value
      ? {
          path: '/props',
          query: { version: propVersion.value },
        }
      : null
  )
  const getPropSourceLabel = (source: PropSource) => {
    const labelKey = resolvePropSourceLabelKey(source)
    if (!labelKey) return source
    const translated = t(labelKey)
    return translated !== labelKey ? translated : source
  }
  const propSourceTags = computed(() =>
    (prop.value?.sources ?? []).map((source) => ({
      value: source,
      label: getPropSourceLabel(source),
      location: {
        path: '/props',
        query: { source: resolveObtainGroupKeyFromPropSource(source) },
      },
    }))
  )
  const loadProp = async () => {
    loading.value = true
    error.value = null
    imageFailed.value = false
    try {
      if (!isKnownPropId.value) throw new Error('Invalid prop ID')
      await catalog.load(['props'])
      if (!prop.value) throw new Error(`Prop ${propId.value} not found`)
    } catch (cause) {
      error.value = toError(cause, 'Failed to load prop')
    } finally {
      loading.value = false
    }
  }
  const toggleOwned = async () => {
    if (!prop.value || wardrobeSaving.value) return
    wardrobeSaving.value = true
    try {
      await togglePropOwned(prop.value.id)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      wardrobeSaving.value = false
    }
  }

  watch(propId, () => {
    imageFailed.value = false
  })

  onMounted(() => {
    void loadProp()
    void initWardrobe()
  })

  useSeoMeta({
    title: () =>
      propName.value
        ? `${propName.value} - ${t('navigation.title')}`
        : `${t('common.props')} - ${t('navigation.title')}`,
    description: () => t('meta.description.props'),
    ogTitle: () => propName.value || t('common.props'),
    ogDescription: () => t('meta.description.props'),
  })

  useHead({
    link: () =>
      isKnownPropId.value && canonicalPropUrl.value
        ? [{ rel: 'canonical', href: canonicalPropUrl.value }]
        : [],
  })
</script>
