<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 flex-wrap justify-between">
          <div class="flex items-center gap-2">
            <n-switch
              v-model:value="listingsSwitchValue"
              size="large"
              :rail-style="railStyle"
              @update:value="handleListingToggle"
            >
              <template #checked>
                <span class="inline-flex items-center gap-1">
                  <n-icon>
                    <ListAlt />
                  </n-icon>
                  {{ $t('common.items') }}
                </span>
              </template>
              <template #unchecked>
                <span class="inline-flex items-center gap-1">
                  <n-icon>
                    <Tshirt />
                  </n-icon>
                  {{ $t('common.outfits') }}
                </span>
              </template>
            </n-switch>

            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
            <n-tooltip
              :disabled="totalItems <= TIER_ENTRY_LIMIT"
              trigger="hover"
            >
              <template #trigger>
                <div class="inline-block">
                  <n-button
                    size="small"
                    type="primary"
                    :disabled="isTierlistDisabled"
                    @click="goToTierlist"
                  >
                    <template #icon>
                      <n-icon><SortAmountDown /></n-icon>
                    </template>
                    {{ t('navigation.tierlist') }}
                  </n-button>
                </div>
              </template>
              {{
                t('tierlist.over_limit.description', { max: TIER_ENTRY_LIMIT })
              }}
            </n-tooltip>
          </div>

          <n-button-group>
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
              :class="['min-w-[40px]']"
              @click="qualityFilter = q"
            >
              <span class="align-top">{{ q }}</span>
              <span class="ml-1"
                ><n-icon> <Star /> </n-icon
              ></span>
            </n-button>
          </n-button-group>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <n-select
            v-model:value="versionFilter"
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            size="small"
            class="w-48"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />

          <n-select
            v-model:value="styleFilter"
            :options="styleOptions"
            size="small"
            class="w-48"
            clearable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_style')"
          />

          <n-select
            v-model:value="labelFilter"
            :options="labelOptions"
            size="small"
            class="w-48"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_label')"
          />

          <n-select
            v-model:value="obtainFilter"
            :options="obtainOptions"
            size="small"
            class="w-48"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_obtain')"
          />

          <!-- Type Filter Dropdown -->
          <n-select
            v-if="showTypeFilter"
            v-model:value="typeFilter"
            :options="typeOptions"
            size="small"
            class="w-48"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_type')"
          />
        </div>
      </div>
    </n-card>

    <!-- Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2 sm:flex-1 sm:flex sm:flex-col"
      content-class="!p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="sm:flex-1 sm:flex sm:flex-col min-h-0">
        <div class="space-y-3 sm:space-y-4">
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
                  @click="retryFetch"
                >
                  {{ $t('common.retry') }}
                </n-button>
              </template>
            </n-result>
          </div>

          <div
            v-else-if="!loading && entries.length === 0"
            class="text-center py-12"
          >
            <n-result
              size="small"
              status="info"
              :title="t('compendium.no_results_title')"
              :description="t('compendium.no_results_description')"
            >
              <template #icon>
                <NuxtImg
                  :src="getImageSrc('static', '/images/emotes/think.webp')"
                  class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
                  width="200"
                  height="200"
                  fit="cover"
                  sizes="160px sm:200px"
                />
              </template>
            </n-result>
          </div>

          <transition
            v-else
            mode="out-in"
            enter-active-class="transition-opacity duration-300 ease"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-300 ease"
            leave-to-class="opacity-0"
          >
            <div
              v-if="!loading && !error && entries.length > 0"
              key="grid"
              class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
            >
              <div
                v-for="(entry, index) in entries"
                :key="entry.id"
                class="cursor-pointer animate-fade-in-up motion-reduce:animate-none"
                :style="{
                  animationDelay: `${Math.min(index + 1, 12) * 0.05}s`,
                }"
                @click="navigateToDetail(entry.id)"
              >
                <div
                  class="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                  style="
                    background-image: url('/images/bg.webp');
                    background-size: cover;
                    background-position: center;
                  "
                >
                  <!-- Tint overlay -->
                  <div
                    class="absolute inset-0"
                    :class="getQualityOverlayClass(entry.quality)"
                  ></div>
                  <NuxtImg
                    :src="entry.image"
                    :alt="entry.name"
                    class="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-500 ease-out hover:scale-110"
                    preset="tallMd"
                    width="200"
                    height="300"
                    fit="cover"
                    loading="lazy"
                    sizes="200px sm:240px"
                  />

                  <div class="absolute top-2 left-2 z-20">
                    <n-tag
                      v-if="entry.type"
                      round
                      size="small"
                      :bordered="false"
                      type="warning"
                      class="backdrop-blur-sm !bg-black/50 text-gray-200"
                    >
                      {{ entry.type }}
                    </n-tag>
                  </div>
                  <div class="absolute top-2 right-2 z-20">
                    <n-tag
                      round
                      size="small"
                      :bordered="false"
                      :color="getQualityTagTheme(entry.quality)"
                      class="backdrop-blur-sm"
                    >
                      <span class="align-top">{{ entry.quality }}</span>
                      <span class="ml-0.5"
                        ><n-icon> <Star /> </n-icon
                      ></span>
                    </n-tag>
                  </div>
                  <div
                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-20"
                  >
                    <p
                      class="text-white font-semibold text-xs sm:text-sm line-clamp-2"
                    >
                      {{ entry.name }}
                    </p>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <n-tag
                        v-if="entry.styleLabel"
                        size="tiny"
                        :bordered="false"
                        type="default"
                        :color="getStyleTagTheme(entry.styleKey)"
                        class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                      >
                        {{ entry.styleLabel }}
                      </n-tag>
                    </div>
                    <div class="flex flex-wrap gap-0.5 mt-1">
                      <n-tag
                        v-for="label in entry.labelTags"
                        :key="label.text"
                        size="tiny"
                        type="default"
                        :color="label.theme"
                        round
                        class="text-xs font-semibold"
                      >
                        {{ label.text }}
                      </n-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="loading"
              key="loading"
              class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
            >
              <div
                v-for="(i, index) in pageSize"
                :key="`skeleton-${i}`"
                class="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"
                :style="{
                  animationDelay: `${Math.min(index + 1, 9) * 0.05}s`,
                }"
              ></div>
            </div>
          </transition>

          <div class="flex justify-center items-center sm:pr-2">
            <n-pagination
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="totalItems"
              :show-size-picker="false"
              :disabled="loading || !!error"
              :page-slot="5"
            >
              <template #prefix="{ itemCount }">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    totalItems
                  }}</span>
                  <span class="ml-1">
                    {{
                      itemCount === 1
                        ? countLabels.singular
                        : countLabels.plural
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Star, Tshirt, ListAlt, SortAmountDown } from '@vicons/fa'
  import type { SelectGroupOption, SelectOption } from 'naive-ui'
  import type { CSSProperties } from 'vue'
  import type { ItemListEntry } from '~/types/items'

  const { t, locale, getLocaleMessage } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const pageTitle = computed(
    () =>
      `${t('common.items')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const description = computed(() => t('meta.description.items'))

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  const pageSize = 18
  const availableItemTypes = getAllItemTypes()
  const exactVersionPattern = /^\d+\.\d+$/
  const majorVersionFilterPattern = /^(\d+)\.x$/i

  const resolveType = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if ((availableItemTypes as string[]).includes(value)) return value
    return null
  }

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )
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
  const availableObtains = computed(() =>
    Object.keys(messages.value)
      .filter((key) => key.startsWith('obtain.') && key.endsWith('.name'))
      .map((key) => {
        const parts = key.split('.')
        return Number(parts[1])
      })
      .filter((value) => !Number.isNaN(value))
  )

  const compareVersion = (a: string, b: string) => {
    const [aMajor = 0, aMinor = 0] = a.split('.').map((part) => Number(part))
    const [bMajor = 0, bMinor = 0] = b.split('.').map((part) => Number(part))
    if (aMajor !== bMajor) return bMajor - aMajor
    return bMinor - aMinor
  }

  const obtainOptions = computed(() => {
    const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

    availableObtains.value.forEach((id) => {
      const groupKey = resolveObtainGroupKey(id)
      if (!groupKey) {
        return
      }
      const group = groupMap.get(groupKey)
      if (group) {
        group.ids.push(id)
      } else {
        const labelKey = resolveObtainGroupLabelKey(groupKey)
        if (!labelKey) {
          return
        }
        groupMap.set(groupKey, {
          labelKey,
          ids: [id],
        })
      }
    })

    return Array.from(groupMap.entries())
      .map(([groupKey, group]) => {
        const translated = t(group.labelKey)
        const fallback = group.labelKey.startsWith('obtain.')
          ? `Obtain ${group.ids[0]}`
          : group.labelKey
        const label = translated !== group.labelKey ? translated : fallback
        const enriched = group.ids.map((id) => ({
          id,
          version: getVersionFromId(id),
        }))
        const latestVersion = enriched
          .map((entry) => entry.version)
          .filter((value): value is string => !!value)
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

  const resolveStyle = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableStyles.includes(normalized)) return normalized
    return null
  }

  const resolveLabel = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableLabels.includes(normalized)) return normalized
    return null
  }

  const resolveVersion = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
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

  const resolveObtain = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if (availableObtainValues.value.includes(value)) return value
    const ids = resolveObtainIdsFromValue(value)
    if (!ids) return null
    const groupKey = resolveObtainGroupKeyFromIds(ids)
    if (!groupKey) return null
    return availableObtainValues.value.includes(groupKey) ? groupKey : null
  }

  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const typeFilter = ref<string | null>(
    resolveType(route.query.type?.toString() ?? null)
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
  const currentPage = ref(Number(route.query.page) || 1)

  const showTypeFilter = computed(() => true)
  const listingsSwitchValue = ref(true)
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      (showTypeFilter.value && typeFilter.value !== null) ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null ||
      obtainFilter.value !== null
  )

  const { fetchItemsPaginated } = useSupabaseItems()

  const cacheKey = computed(
    () =>
      `items-${qualityFilter.value ?? 'all'}-${typeFilter.value ?? 'all'}-${
        styleFilter.value ?? 'all'
      }-${labelFilter.value ?? 'all'}-${versionFilter.value ?? 'all'}-${
        obtainFilter.value ?? 'all'
      }-${currentPage.value}-${pageSize}`
  )

  const {
    data: compendiumData,
    pending: loading,
    error,
    refresh: loadData,
  } = await useAsyncData(
    () => cacheKey.value,
    async () => {
      return fetchItemsPaginated({
        quality: qualityFilter.value,
        type: typeFilter.value,
        version: versionFilter.value,
        style: styleFilter.value,
        label: labelFilter.value,
        source: obtainFilter.value,
        page: currentPage.value,
      })
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
      lazy: true,
    }
  )

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as ItemListEntry[]

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`item.${entry.id}.name`),
      image: getImageSrc('item', entry.id),
      type: entry.type ? t(`type.${entry.type}`) : null,
      styleLabel: entry.style ? t(entry.style) : null,
      styleKey: entry.style ? resolveStyleKeyFromI18nKey(entry.style) : null,
      labelTags: (entry.labels || []).map((label: string) => ({
        text: t(label),
        theme: getLabelTagTheme(label),
      })),
    }))
  })

  const totalItems = computed(() => compendiumData.value?.total || 0)

  const countLabels = computed(() => ({
    singular: t('common.item'),
    plural: t('common.items'),
  }))
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () => loading.value || !!error.value || totalItems.value > TIER_ENTRY_LIMIT
  )

  const buildListingQuery = (includeType: boolean) => ({
    ...(qualityFilter.value && { quality: qualityFilter.value }),
    ...(includeType &&
      showTypeFilter.value &&
      typeFilter.value && {
        type: typeFilter.value,
      }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(labelFilter.value && { label: labelFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...(currentPage.value > 1 && { page: currentPage.value }),
  })

  const buildTierlistQuery = () => ({
    mode: 'items',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(showTypeFilter.value &&
      typeFilter.value && {
        type: typeFilter.value,
      }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(labelFilter.value && { label: labelFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
  })

  const goToTierlist = () => {
    if (isTierlistDisabled.value) return

    navigateTo(
      localePath({
        path: '/tierlist',
        query: buildTierlistQuery(),
      })
    )
  }

  watch(qualityFilter, () => {
    currentPage.value = 1
  })

  watch(typeFilter, () => {
    currentPage.value = 1
  })

  watch(versionFilter, () => {
    currentPage.value = 1
  })

  watch(styleFilter, () => {
    currentPage.value = 1
  })

  watch(labelFilter, () => {
    currentPage.value = 1
  })

  watch(obtainFilter, () => {
    currentPage.value = 1
  })

  watch(
    [
      qualityFilter,
      typeFilter,
      versionFilter,
      styleFilter,
      labelFilter,
      obtainFilter,
      currentPage,
    ],
    () => {
      router.replace({ query: buildListingQuery(true) })
    }
  )

  const retryFetch = () => {
    loadData()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    typeFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    obtainFilter.value = null
    currentPage.value = 1
  }

  const availableTypes = computed(() => {
    const types = getAllItemTypes()
    return types.sort((a, b) => {
      const orderA = itemCategoryOrder[a] ?? 999
      const orderB = itemCategoryOrder[b] ?? 999
      return orderA - orderB
    })
  })

  const typeOptions = computed(() => {
    if (!showTypeFilter.value) {
      return []
    }

    const types = availableTypes.value

    const grouped: Record<
      'clothes' | 'accessories' | 'makeups' | 'other',
      ItemType[]
    > = {
      clothes: [],
      accessories: [],
      makeups: [],
      other: [],
    }

    types.forEach((type) => {
      const category = getItemTypeCategory(type)
      if (grouped[category]) {
        grouped[category].push(type)
      }
    })

    const options: Array<SelectOption | SelectGroupOption> = []

    if (grouped.clothes && grouped.clothes.length > 0) {
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

    if (grouped.accessories && grouped.accessories.length > 0) {
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

    if (grouped.makeups && grouped.makeups.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.makeups'),
        key: 'makeups',
        children: grouped.makeups.map((type) => ({
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.other && grouped.other.length > 0) {
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

  const versionOptions = computed<SelectOption[]>(() => {
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
  const renderVersionOptionLabel = (option: SelectOption) => {
    const label = String(option.label ?? option.value ?? '')
    const isMajor = Boolean((option as { isMajor?: boolean }).isMajor)

    if (!isMajor) return label

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

  const handleListingToggle = (value: boolean) => {
    if (value) return
    navigateTo(
      localePath({
        path: '/outfits',
        query: buildListingQuery(false),
      })
    )
  }

  const railStyle = ({ checked }: { checked: boolean }) => {
    const style: CSSProperties = {}
    if (checked) {
      style.background = '#3b82a6'
    } else {
      style.background = '#a85573'
    }
    return style
  }

  const navigateToDetail = (id: number) => {
    navigateTo(localePath(`/items/${id}`))
  }

  const getQualityOverlayClass = (quality: number) => {
    switch (quality) {
      case 5:
        return 'bg-yellow-500/5'
      case 4:
        return 'bg-blue-500/5'
      case 3:
        return 'bg-green-500/5'
      default:
        return 'bg-gray-500/5'
    }
  }
</script>
