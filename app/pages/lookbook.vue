<template>
  <div class="mx-auto max-w-5xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-2 sm:p-4"
    >
      <div class="flex flex-col gap-5">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="flex min-w-0 flex-col gap-2">
            <h1
              class="text-2xl leading-tight font-bold text-slate-900 dark:text-white"
            >
              {{ t('navigation.lookbook') }}
            </h1>
            <p
              class="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300"
            >
              {{ t('lookbook.description') }}
            </p>
          </div>
          <p
            class="flex shrink-0 flex-wrap items-center gap-1.5 text-xs leading-5 text-slate-500 lg:justify-end lg:pt-1 dark:text-slate-400"
          >
            <span>{{ t('lookbook.api_credit') }}</span>
            <a
              href="https://nikki.ranaxro.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-medium text-cyan-600 no-underline hover:text-cyan-700 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              <span>{{ nikkiAlbumLabel }}</span>
              <n-icon size="11"><ExternalLinkAlt /></n-icon>
            </a>
          </p>
        </div>

        <div
          class="flex flex-col gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 p-2 lg:flex-row lg:items-center lg:justify-between dark:border-slate-700/70 dark:bg-slate-950/25"
        >
          <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
              <n-input
                v-model:value="lookbookInput"
                :placeholder="t('lookbook.input_placeholder')"
                :disabled="loading"
                :status="hasInvalidLookbookInput ? 'error' : undefined"
                clearable
                size="medium"
                class="min-w-0 sm:w-58"
                @keyup.enter="decodeCurrentInput"
              />
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    circle
                    secondary
                    size="medium"
                    :aria-label="t('lookbook.paste')"
                    :disabled="loading"
                    @click="pasteFromClipboard"
                  >
                    <template #icon>
                      <n-icon><ClipboardRegular /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('lookbook.paste') }}
              </n-tooltip>
            </div>

            <n-button
              type="primary"
              size="medium"
              class="w-full sm:w-auto"
              :loading="loading"
              :disabled="
                !normalizedInputCode || normalizedInputCode === decodedCode
              "
              @click="decodeCurrentInput"
            >
              <template #icon>
                <n-icon><Th /></n-icon>
              </template>
              {{ t('lookbook.preview') }}
            </n-button>
          </div>

          <div class="flex flex-wrap items-center gap-2 lg:justify-end">
            <div class="flex items-center gap-2">
              <n-popover
                trigger="click"
                placement="bottom-end"
                :show-arrow="false"
              >
                <template #trigger>
                  <n-button
                    circle
                    secondary
                    size="medium"
                    :aria-label="t('lookbook.display_options')"
                  >
                    <template #icon>
                      <n-icon><Cog /></n-icon>
                    </template>
                  </n-button>
                </template>
                <div class="flex min-w-42 flex-col gap-3 p-1">
                  <label
                    class="flex items-center justify-between gap-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-300"
                  >
                    {{ t('lookbook.hide_item_info') }}
                    <n-switch
                      v-model:value="hideItemInfo"
                      size="small"
                    />
                  </label>
                  <label
                    class="flex items-center justify-between gap-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-300"
                  >
                    {{ t('lookbook.preview_image') }}
                    <n-switch
                      v-model:value="showPreviewImages"
                      size="small"
                    />
                  </label>
                  <label
                    class="flex items-center justify-between gap-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-300"
                  >
                    {{ t('lookbook.show_ownership') }}
                    <n-switch
                      v-model:value="showOwnership"
                      size="small"
                    />
                  </label>
                </div>
              </n-popover>

              <n-popselect
                :options="copyOptions"
                :show-checkmark="false"
                trigger="click"
                placement="bottom-end"
                size="small"
                @update:value="handleCopyAction"
              >
                <n-button
                  circle
                  secondary
                  size="medium"
                  :aria-label="t('common.copy')"
                  :disabled="!decodedCode"
                >
                  <template #icon>
                    <n-icon><CopyRegular /></n-icon>
                  </template>
                </n-button>
              </n-popselect>

              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    circle
                    secondary
                    size="medium"
                    :aria-label="t('common.export_as_image')"
                    :disabled="!hasDecodedLookbook || exporting"
                    :loading="exporting"
                    @click="exportShareCard"
                  >
                    <template #icon>
                      <n-icon><FileImageRegular /></n-icon>
                    </template>
                  </n-button>
                </template>
                {{ t('common.export_as_image') }}
              </n-tooltip>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      v-if="error"
      size="small"
      class="mx-auto w-full max-w-lg rounded-xl"
      content-class="p-4 sm:p-6"
    >
      <n-result
        size="small"
        status="info"
        :title="
          errorType === 'code_not_found'
            ? t('lookbook.not_found')
            : t('common.error')
        "
        :description="
          errorType === 'code_not_found'
            ? t('error.404')
            : t('lookbook.invalid_code')
        "
      >
        <template #icon>
          <div class="flex justify-center">
            <NuxtImg
              :src="getImageSrc('emote', 'think')"
              class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
              preset="iconLg"
              fit="cover"
              sizes="160px sm:200px"
            />
          </div>
        </template>
      </n-result>
    </n-card>

    <div>
      <n-card
        v-if="isLookbookLoading"
        size="small"
        class="mx-auto w-full max-w-lg overflow-visible! rounded-2xl"
        content-class="!overflow-visible p-0"
        aria-busy="true"
      >
        <div
          class="w-full overflow-visible rounded-2xl p-3 text-slate-900 dark:text-white"
          :style="shareCardStyle"
        >
          <div class="mb-3">
            <div class="flex min-w-0 items-start justify-between gap-4">
              <div class="min-w-0">
                <div
                  class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5"
                >
                  <span class="truncate text-sm leading-tight font-black">
                    {{ t('lookbook.card_title') }}
                  </span>
                  <span
                    v-if="pendingOfficialCode"
                    class="truncate text-lg leading-tight font-bold text-slate-600/90 dark:text-slate-300/90"
                  >
                    {{ pendingOfficialCode }}
                  </span>
                  <n-skeleton
                    v-else
                    height="1rem"
                    width="7rem"
                    :sharp="false"
                  />
                </div>
              </div>
              <div
                class="flex shrink-0 items-center gap-1.5 pt-0.5 text-[0.625rem] font-semibold tracking-wider whitespace-nowrap text-cyan-700/80 dark:text-cyan-200/80"
              >
                <img
                  src="/images/logo.webp"
                  alt=""
                  class="h-5 w-5 rounded-sm object-cover"
                />
                <span>gongeo.us</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <section
              v-for="(count, sectionIndex) in skeletonSectionCounts"
              :key="`lookbook-skeleton-${sectionIndex}`"
              class="flex w-full flex-col"
            >
              <div class="grid grid-cols-5 gap-1.5 sm:gap-2">
                <div
                  v-for="index in count"
                  :key="`lookbook-skeleton-${sectionIndex}-${index}`"
                  class="min-w-0"
                >
                  <div class="aspect-square w-full overflow-hidden rounded-md">
                    <n-skeleton
                      height="100%"
                      width="100%"
                      :sharp="false"
                    />
                  </div>
                  <div class="mt-1 min-h-8 px-0.5">
                    <n-skeleton
                      class="mx-auto h-3 w-[88%] rounded"
                      :sharp="false"
                    />
                    <n-skeleton
                      class="mx-auto mt-1 h-2 w-[58%] rounded"
                      :sharp="false"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </n-card>

      <ClientOnly v-else>
        <n-card
          v-if="hasDecodedLookbook"
          size="small"
          class="mx-auto w-full max-w-lg overflow-visible! rounded-2xl"
          content-class="!overflow-visible p-0"
        >
          <div
            ref="shareCardRef"
            class="w-full overflow-visible rounded-2xl p-3 text-slate-900 dark:text-white"
            :style="shareCardStyle"
          >
            <div class="mb-3">
              <div class="flex min-w-0 items-start justify-between gap-4">
                <div class="min-w-0">
                  <div
                    class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5"
                  >
                    <span class="truncate text-sm leading-tight font-black">
                      {{ t('lookbook.card_title') }}
                    </span>
                    <span
                      class="truncate text-lg leading-tight font-bold text-slate-600/90 dark:text-slate-300/90"
                    >
                      {{ officialDecodedCode }}
                    </span>
                  </div>
                </div>
                <div
                  class="flex shrink-0 items-center gap-1.5 pt-0.5 text-[0.625rem] font-semibold tracking-wider whitespace-nowrap text-cyan-700/80 dark:text-cyan-200/80"
                >
                  <img
                    src="/images/logo.webp"
                    alt=""
                    class="h-5 w-5 rounded-sm object-cover"
                  />
                  <span>gongeo.us</span>
                </div>
              </div>
            </div>

            <div
              v-if="displayItems.length > 0"
              class="flex flex-col gap-3"
            >
              <section
                v-for="section in displaySections"
                :key="section.key"
                class="flex w-full flex-col"
              >
                <div class="grid grid-cols-5 gap-1.5 sm:gap-2">
                  <template
                    v-for="entry in section.items"
                    :key="entry.id"
                  >
                    <div class="min-w-0">
                      <div
                        v-if="entry.resolved"
                        class="relative"
                      >
                        <ItemCard
                          :item-id="entry.id"
                          :quality="entry.quality"
                          :type="entry.type"
                          :name="entry.name"
                          :to="getItemEntityDetailPath(entry.id)"
                          :image-mode="showPreviewImages ? 'preview' : 'icon'"
                          :tooltip-meta="
                            wardrobeInitialized
                              ? getLookbookOwnershipMarker(
                                  getLookbookWardrobeStatus(entry)
                                ).label
                              : undefined
                          "
                          size="sm"
                          class="w-full"
                        />
                        <div
                          v-if="wardrobeInitialized && showOwnership"
                          class="pointer-events-none absolute right-1 bottom-1 z-10"
                          @click.stop
                        >
                          <span
                            class="flex items-center justify-center"
                            :style="{
                              color: getQualityColor(entry.quality),
                            }"
                            :aria-label="
                              getLookbookOwnershipMarker(
                                getLookbookWardrobeStatus(entry)
                              ).label
                            "
                          >
                            <n-icon :size="12">
                              <component
                                :is="
                                  getLookbookOwnershipMarker(
                                    getLookbookWardrobeStatus(entry)
                                  ).icon
                                "
                              />
                            </n-icon>
                          </span>
                        </div>
                      </div>
                      <NuxtLinkLocale
                        v-else
                        to="/items"
                        class="block w-full text-inherit no-underline"
                      >
                        <div
                          class="flex items-center justify-center overflow-hidden rounded-md bg-slate-100 text-[0.625rem] font-semibold text-slate-500 ring-1 ring-white/60 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10"
                          :class="
                            showPreviewImages ? 'aspect-2/3' : 'aspect-square'
                          "
                        >
                          ?
                        </div>
                      </NuxtLinkLocale>
                      <div
                        v-if="!hideItemInfo"
                        class="mt-1 min-h-8 px-0.5 text-center"
                      >
                        <div
                          class="line-clamp-2 text-[0.625rem] leading-[0.8rem] font-semibold text-slate-800 sm:text-[0.6875rem] sm:leading-3.5 dark:text-slate-100"
                        >
                          {{ entry.resolved ? entry.name : entry.id }}
                        </div>
                        <div
                          class="mt-0.5 truncate text-[0.5rem] leading-none font-medium text-slate-500 sm:text-[0.5625rem] dark:text-slate-300"
                        >
                          {{
                            entry.resolved
                              ? t(`type.${entry.type}`)
                              : t('common.error')
                          }}
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </section>
            </div>

            <n-empty
              v-else
              :description="t('common.no_results_found')"
              class="py-12"
            />
          </div>
        </n-card>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    CheckCircle,
    ClipboardRegular,
    Cog,
    CopyRegular,
    ExclamationCircle,
    ExternalLinkAlt,
    FileImageRegular,
    Th,
    TimesCircle,
  } from '@vicons/fa'

  type LookbookDisplayItem =
    | {
        id: number
        entity: 'item' | 'makeup'
        name: string
        quality: number
        type: string
        resolved: true
      }
    | {
        id: number
        quality: 0
        type: ''
        resolved: false
      }

  type LookbookDisplaySection = {
    key: string
    items: LookbookDisplayItem[]
  }

  type LookbookWardrobeStatus = 'item-owned' | 'variant-owned' | 'missing'

  definePageMeta({
    key: 'lookbook',
  })

  const LOOKBOOK_CODE_PATTERN = /^[A-Za-z0-9]{11}#$/
  const skeletonSectionCounts = [4, 8, 5] as const

  const { locale, t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const message = useMessage()
  const catalogIndex = useCatalogIndex()
  const { isDark } = useTheme()
  const { getImageSrc } = imageProvider()
  const {
    initialized: wardrobeInitialized,
    init: initWardrobe,
    isItemOwned,
    isMakeupOwned,
  } = useWardrobe()

  const lookbookInput = ref('')
  const decodedCode = ref('')
  const wearingClothes = ref<number[]>([])
  const loading = ref(false)
  const exporting = ref(false)
  const hideItemInfo = ref(false)
  const showPreviewImages = ref(false)
  const showOwnership = ref(false)
  const error = ref('')
  const errorType = ref<'code_not_found' | 'generic'>('generic')
  const shareCardRef = ref<HTMLElement | null>(null)

  const catalogLoading = computed(() => catalogIndex.status.value === 'loading')
  const hasDecodedLookbook = computed(() => Boolean(decodedCode.value))

  const normalizeLookbookInput = (value: unknown) => {
    const raw = Array.isArray(value) ? value[0] : value
    let input = typeof raw === 'string' ? raw.trim() : ''
    if (!input) return ''

    try {
      const url = new URL(input, 'https://gongeo.us')
      const code = url.searchParams.get('code')?.trim() ?? ''
      if (code) {
        input = code
      }
    } catch {
      // Fall through to raw-code handling.
    }

    if (/^[A-Za-z0-9]{11}$/.test(input)) {
      input = `${input}#`
    }

    return input
  }

  const initialRouteCode = normalizeLookbookInput(route.query.code)
  if (LOOKBOOK_CODE_PATTERN.test(initialRouteCode)) {
    lookbookInput.value = initialRouteCode
  }

  const normalizedInputCode = computed(() => {
    const code = normalizeLookbookInput(lookbookInput.value)
    return LOOKBOOK_CODE_PATTERN.test(code) ? code : ''
  })
  const routeInputCode = computed(() =>
    normalizeLookbookInput(route.query.code)
  )
  const routeCode = computed(() =>
    LOOKBOOK_CODE_PATTERN.test(routeInputCode.value) ? routeInputCode.value : ''
  )
  const hasPendingRouteDecode = computed(
    () =>
      Boolean(routeCode.value) &&
      routeCode.value !== decodedCode.value &&
      !error.value
  )
  const isLookbookLoading = computed(
    () =>
      loading.value ||
      hasPendingRouteDecode.value ||
      (catalogLoading.value && hasDecodedLookbook.value)
  )
  const hasInvalidLookbookInput = computed(() => {
    const code = normalizeLookbookInput(lookbookInput.value)
    return Boolean(code) && !LOOKBOOK_CODE_PATTERN.test(code)
  })
  const officialDecodedCode = computed(() => decodedCode.value)
  const pendingOfficialCode = computed(() => {
    return decodedCode.value || normalizedInputCode.value || routeCode.value
  })
  const shareCardStyle = computed(() => ({
    background: isDark.value
      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.055), rgba(148, 163, 184, 0.035), rgba(14, 165, 233, 0.025)), var(--n-color)'
      : 'linear-gradient(135deg, rgba(14, 165, 233, 0.045), rgba(148, 163, 184, 0.035), rgba(14, 165, 233, 0.02)), var(--n-color)',
  }))
  const nikkiAlbumLabel = computed(() =>
    locale.value === 'zh'
      ? '暖暖相册'
      : locale.value === 'tw'
        ? '暖暖相冊'
        : 'Nikki Albums'
  )
  const copyOptions = computed(() => [
    {
      label: t('import.actions.copy_code'),
      value: 'code',
    },
    {
      label: t('tierlist.share.copy_link'),
      value: 'link',
    },
    {
      label: t('lookbook.copy_item_list'),
      value: 'items',
    },
  ])

  const displayItems = computed<LookbookDisplayItem[]>(() =>
    wearingClothes.value.map((id) => {
      const item = catalogIndex.index.value?.itemById.get(id)
      const makeup = catalogIndex.index.value?.makeupById.get(id)
      const entry = item ?? makeup

      if (!entry) {
        return {
          id,
          quality: 0,
          type: '',
          resolved: false,
        }
      }

      return {
        id,
        entity: item ? 'item' : 'makeup',
        name: t(`item.${id}.name`),
        quality: entry.quality,
        type: entry.type || getItemType(id),
        resolved: true,
      }
    })
  )

  const getLookbookWardrobeStatus = (
    entry: Extract<LookbookDisplayItem, { resolved: true }>
  ): LookbookWardrobeStatus => {
    const isOwned =
      entry.entity === 'item' ? isItemOwned(entry.id) : isMakeupOwned(entry.id)
    if (isOwned) return 'item-owned'

    if (
      entry.entity === 'item' &&
      getCatalogGroupIds(catalogIndex.index.value, 'item', entry.id).some(
        (relatedId) => relatedId !== entry.id && isItemOwned(relatedId)
      )
    ) {
      return 'variant-owned'
    }

    return 'missing'
  }

  const getLookbookOwnershipMarker = (status: LookbookWardrobeStatus) => {
    if (status === 'item-owned') {
      return {
        icon: CheckCircle,
        label: t('wardrobe.status.owned'),
      }
    }

    if (status === 'variant-owned') {
      return {
        icon: ExclamationCircle,
        label: t('wardrobe.actions.base_only'),
      }
    }

    return {
      icon: TimesCircle,
      label: t('wardrobe.status.missing'),
    }
  }

  const sortedDisplayItems = computed(() =>
    sortItemsByCategory([...displayItems.value])
  )

  const displaySections = computed<LookbookDisplaySection[]>(() => {
    const clothesItems = sortedDisplayItems.value.filter(
      (entry) =>
        entry.resolved &&
        getItemTypeCategory(getItemType(entry.type)) === 'clothes'
    )
    const accessoryItems = sortedDisplayItems.value.filter(
      (entry) =>
        !entry.resolved ||
        getItemTypeCategory(getItemType(entry.type)) === 'accessories'
    )
    const makeupItems = sortedDisplayItems.value.filter(
      (entry) =>
        entry.resolved &&
        getItemTypeCategory(getItemType(entry.type)) === 'makeups'
    )

    return [
      {
        key: 'clothes',
        items: clothesItems,
      },
      {
        key: 'accessories',
        items: accessoryItems,
      },
      {
        key: 'makeups',
        items: makeupItems,
      },
    ].filter((section) => section.items.length > 0)
  })

  const shareUrl = computed(() => {
    if (!decodedCode.value || !import.meta.client) return ''

    const codeWithoutHash = decodedCode.value.endsWith('#')
      ? decodedCode.value.slice(0, -1)
      : decodedCode.value
    const url = new URL(window.location.href)
    url.pathname = localePath('/lookbook')
    url.search = ''
    url.hash = ''
    url.searchParams.set('code', codeWithoutHash)
    return `${url.toString()}#`
  })

  const syncRouteCode = async (code: string) => {
    if (route.query.code?.toString() === code) return

    await router.replace({
      path: localePath('/lookbook'),
      query: { code },
    })
  }

  const waitForCardImages = async () => {
    const images = shareCardRef.value?.querySelectorAll('img') ?? []
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
        })
      })
    )
  }

  const decodeLookbook = async (
    code: string,
    options: { syncRoute?: boolean } = {}
  ) => {
    if (!code || loading.value) return

    loading.value = true
    error.value = ''
    errorType.value = 'generic'

    try {
      await catalogIndex.load(['items', 'makeups'])
      const response = await $fetch<LookbookDecodeResponse>('/api/lookbook', {
        query: { code },
      })

      decodedCode.value = response.code
      wearingClothes.value = response.wearingClothes
      lookbookInput.value = decodedCode.value

      if (options.syncRoute ?? true) {
        await syncRouteCode(decodedCode.value)
      }
    } catch (decodeError: unknown) {
      console.error('Failed to decode lookbook:', decodeError)

      const data =
        decodeError && typeof decodeError === 'object' && 'data' in decodeError
          ? (decodeError as { data?: { data?: { code?: string } } }).data
          : null
      const errorCode = data?.data?.code ?? null

      if (errorCode === 'INVALID_LOOKBOOK_CODE') {
        errorType.value = 'code_not_found'
      } else {
        errorType.value = 'generic'
      }

      error.value = t('common.error')
      decodedCode.value = ''
      wearingClothes.value = []
    } finally {
      loading.value = false
    }
  }

  const decodeCurrentInput = async () => {
    const code = normalizedInputCode.value
    if (!code) {
      error.value = t('lookbook.invalid_code')
      return
    }

    await decodeLookbook(code)
  }

  const copyShareLink = async () => {
    if (!shareUrl.value) return

    try {
      await navigator.clipboard.writeText(shareUrl.value)
      message.success(t('tierlist.share.copied'))
    } catch {
      message.error(t('tierlist.share.copy_failed'))
    }
  }

  const copyLookbookCode = async () => {
    if (!officialDecodedCode.value) return

    try {
      await navigator.clipboard.writeText(officialDecodedCode.value)
      message.success(t('import.messages.code_copied'))
    } catch {
      message.error(t('import.messages.code_copy_failed'))
    }
  }

  const copyLookbookItemList = async () => {
    if (!import.meta.client) return

    const itemRows = sortedDisplayItems.value.map((entry) => {
      if (!entry.resolved) {
        return `${t('common.error')}: ${entry.id}`
      }

      const itemType = t(`type.${entry.type}`)
      return `${itemType}: ${entry.name}`
    })
    const itemList = [...itemRows, shareUrl.value].filter(Boolean).join('\n')
    if (!itemList) return

    try {
      await navigator.clipboard.writeText(itemList)
      message.success(t('import.messages.code_copied'))
    } catch {
      message.error(t('import.messages.code_copy_failed'))
    }
  }

  const handleCopyAction = (value: unknown) => {
    if (value === 'code') {
      void copyLookbookCode()
    } else if (value === 'link') {
      void copyShareLink()
    } else if (value === 'items') {
      void copyLookbookItemList()
    }
  }

  const pasteFromClipboard = async () => {
    if (!import.meta.client) return

    try {
      const clipboardText = await navigator.clipboard.readText()
      const code = normalizeLookbookInput(clipboardText)
      if (!code || !LOOKBOOK_CODE_PATTERN.test(code)) {
        throw new Error('Clipboard did not include a valid lookbook code.')
      }

      lookbookInput.value = code
      error.value = ''
    } catch {
      message.error(t('lookbook.paste_failed'))
    }
  }

  const exportShareCard = async () => {
    if (!shareCardRef.value || exporting.value) return

    exporting.value = true
    message.info(t('stats.share.in_progress'))
    try {
      await nextTick()
      await waitForCardImages()
      const fileName = `gongeous-lookbook-${officialDecodedCode.value}.png`
      await exportToPng(shareCardRef.value, fileName)
      message.success(t('stats.share.success'))
    } catch (exportError) {
      console.error('Lookbook export failed:', exportError)
      message.error(t('stats.share.error'))
    } finally {
      exporting.value = false
    }
  }

  useSeoMeta({
    title: () =>
      `${t('navigation.lookbook')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.lookbook'),
    ogTitle: () =>
      `${t('navigation.lookbook')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.lookbook'),
  })

  onMounted(() => {
    void initWardrobe()

    const code = normalizeLookbookInput(route.query.code)
    if (!code) return

    if (LOOKBOOK_CODE_PATTERN.test(code)) {
      lookbookInput.value = code
      void decodeLookbook(code, {
        syncRoute: route.query.code?.toString() !== code,
      })
    } else {
      lookbookInput.value = code
      error.value = t('lookbook.invalid_code')
    }
  })

  watch(
    () => route.query.code,
    (value) => {
      const code = normalizeLookbookInput(value)
      if (!code) {
        lookbookInput.value = ''
        decodedCode.value = ''
        wearingClothes.value = []
        error.value = ''
        errorType.value = 'generic'
        return
      }

      if (LOOKBOOK_CODE_PATTERN.test(code)) {
        if (code === decodedCode.value) {
          if (value?.toString() !== code) void syncRouteCode(code)
          return
        }

        lookbookInput.value = code
        void decodeLookbook(code, { syncRoute: value?.toString() !== code })
      } else {
        if (code === lookbookInput.value) return

        lookbookInput.value = code
        error.value = t('lookbook.invalid_code')
      }
    }
  )
</script>
