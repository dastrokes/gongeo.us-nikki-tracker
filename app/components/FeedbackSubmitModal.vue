<template>
  <n-modal
    :show="show"
    preset="card"
    class="max-w-2xl"
    :title="modalTitle"
    :mask-closable="!isBusy"
    :closable="!isBusy"
    @update:show="emit('update:show', $event)"
  >
    <div class="space-y-4">
      <div class="space-y-1">
        <div class="text-base font-semibold leading-tight">
          {{ itemName }}
        </div>
        <p class="text-sm opacity-75">
          {{ t('feedback.submit_description', { name: itemName }) }}
        </p>
        <NuxtLinkLocale
          :to="guidelinesPath"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex text-sm font-medium text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
        >
          {{ t('feedback.guidelines_action') }}
        </NuxtLinkLocale>
      </div>

      <div
        v-if="checkingPendingSuggestions"
        class="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-black/5 bg-slate-50/80 p-6 text-center dark:border-white/10 dark:bg-slate-900/60"
      >
        <n-spin size="large" />
        <p class="text-sm opacity-75">
          {{ t('feedback.loading_existing') }}
        </p>
      </div>

      <template v-else-if="hasPendingSuggestions">
        <n-alert
          type="warning"
          :show-icon="false"
        >
          <div class="space-y-1">
            <div class="font-semibold">
              {{ t('feedback.pending_exists_title') }}
            </div>
            <p class="text-sm opacity-80">
              {{ t('feedback.pending_exists_description') }}
            </p>
          </div>
        </n-alert>
        <div class="space-y-2">
          <FeedbackSuggestionCard
            v-for="suggestion in pendingSuggestions"
            :key="suggestion.id"
            :suggestion="suggestion"
            :user-vote="viewerVotes[suggestion.id] ?? null"
            :voting="votingSuggestionId === suggestion.id"
            :show-skip-action="false"
            @vote="handleVote(suggestion, $event)"
          />
        </div>
        <div class="flex items-center justify-end gap-3 pt-2">
          <NuxtLinkLocale
            to="/feedback"
            class="text-sm font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200"
          >
            {{ t('feedback.view_queue') }}
          </NuxtLinkLocale>
          <n-button
            :disabled="isBusy"
            @click="emit('update:show', false)"
          >
            {{ t('common.cancel') }}
          </n-button>
        </div>
      </template>

      <template v-else>
        <div
          class="rounded-xl border border-black/5 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/60"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <div
              class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
            >
              {{ t('feedback.current_tags') }}
            </div>
            <n-button
              text
              size="small"
              :disabled="changedEntries.length === 0"
              @click="resetDraft"
            >
              {{ t('feedback.reset') }}
            </n-button>
          </div>

          <AttributeCard
            v-if="currentVisibleTagCount > 0"
            :metadata="baseMetadata"
            :item-type="resolvedItemType"
            display-mode="editable"
            layout="compact"
          />

          <p
            v-else
            class="text-sm opacity-70"
          >
            {{ t('feedback.no_tags') }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <n-select
            :value="draft.category ?? undefined"
            :options="categoryOptions"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('feedback.select_category')"
            @update:value="updateDraftScalarValue('category', $event)"
          />

          <n-select
            :value="draft.subcategory ?? undefined"
            :options="subcategoryOptions"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('feedback.select_subcategory')"
            @update:value="updateDraftScalarValue('subcategory', $event)"
          />
        </div>

        <div
          v-if="advancedFields.length > 0"
          class="space-y-2"
        >
          <div class="text-sm font-semibold">
            {{ t('feedback.advanced_fields') }}
          </div>
          <div class="space-y-2">
            <div
              v-for="field in advancedFields"
              :key="field"
              class="space-y-1.5 rounded-xl border border-black/5 bg-slate-50/85 p-3 dark:border-white/10 dark:bg-slate-900/35"
            >
              <label
                class="block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {{ t(getItemSearchFieldLabelKey(field)) }}
              </label>

              <n-select
                v-if="isItemSearchArrayField(field)"
                :value="getDraftArrayValue(field)"
                :options="
                  buildTokenOptions(field, advancedOptions[field] ?? [])
                "
                multiple
                clearable
                filterable
                :show-checkmark="false"
                :placeholder="
                  t('compendium.advanced_filter_placeholder', {
                    field: t(getItemSearchFieldLabelKey(field)),
                  })
                "
                @update:value="updateDraftArrayValue(field, $event)"
              />

              <n-select
                v-else
                :value="getDraftScalarValue(field) ?? undefined"
                :options="
                  buildTokenOptions(field, advancedOptions[field] ?? [])
                "
                clearable
                filterable
                :show-checkmark="false"
                :placeholder="
                  t('compendium.advanced_filter_placeholder', {
                    field: t(getItemSearchFieldLabelKey(field)),
                  })
                "
                @update:value="updateDraftScalarValue(field, $event)"
              />
            </div>
          </div>
        </div>

        <n-alert
          v-if="changedEntries.length > 0"
          type="info"
          :show-icon="false"
        >
          <div class="flex flex-wrap gap-2">
            <n-tag
              v-for="entry in changedEntries"
              :key="entry.field"
              size="small"
              round
              :bordered="false"
            >
              {{ t(getItemSearchFieldLabelKey(entry.field)) }}:
              {{ translateFeedbackValue(entry.field, entry.to) }}
            </n-tag>
          </div>
        </n-alert>

        <p
          v-else
          class="text-sm opacity-70"
        >
          {{ t('feedback.no_changes') }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <n-button
            :disabled="isBusy"
            @click="emit('update:show', false)"
          >
            {{ t('common.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :loading="submitting"
            :disabled="user ? changedEntries.length === 0 : false"
            @click="submit"
          >
            {{ user ? t('feedback.submit_action') : t('login.sign_in') }}
          </n-button>
        </div>
      </template>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
  import type { SelectOption } from 'naive-ui'

  const props = defineProps<{
    show: boolean
    itemId: number
    itemName: string
    itemType?: string | null
    metadata?: ItemSearchMetadata | null
  }>()

  const emit = defineEmits<{
    'update:show': [value: boolean]
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const message = useMessage()
  const { user } = useAuth()
  const { translateFilterToken } = useFilterToken()
  const {
    submitSuggestion,
    fetchFeedbackQueue,
    fetchViewerState,
    voteSuggestion,
  } = useFeedback()

  const resolvedItemType = computed(
    () => props.itemType || props.metadata?.item_type || 'unknown'
  )
  const modalTitle = computed(() =>
    hasPendingSuggestions.value
      ? t('feedback.vote_title')
      : t('feedback.submit_title')
  )
  const guidelinesPath = computed(() => localePath('/guideline'))
  const baseMetadata = computed(() => props.metadata ?? null)
  const baseSnapshot = computed(() =>
    createRawItemTagFeedbackSnapshot(baseMetadata.value, resolvedItemType.value)
  )
  const currentVisibleTagCount = computed(() =>
    getItemSearchMetadataSections(baseMetadata.value, resolvedItemType.value, {
      editableOnly: true,
    }).reduce((count, section) => count + section.fields.length, 0)
  )
  const attributeFacets = computed(() =>
    getItemSearchAttributeFacets(resolvedItemType.value, {
      category: getDraftScalarValue('category'),
      subcategory: getDraftScalarValue('subcategory'),
    })
  )

  const draft = ref<ItemTagFeedbackSnapshot>({})
  const submitting = ref(false)
  const checkingPendingSuggestions = ref(false)
  const pendingSuggestions = ref<FeedbackSuggestion[]>([])
  const viewerVotes = ref<Record<string, FeedbackVoteValue | null>>({})
  const votingSuggestionId = ref<string | null>(null)
  const advancedOptions = computed<ItemSearchAdvancedFacetMap>(
    () => attributeFacets.value.advanced
  )
  const advancedFields = computed(() =>
    getItemSearchAdvancedFields(resolvedItemType.value).filter(
      (field) =>
        (advancedOptions.value[field]?.length ?? 0) > 0 ||
        getSelectedTokenValues(field).length > 0
    )
  )
  const hasPendingSuggestions = computed(
    () => pendingSuggestions.value.length > 0
  )
  const isBusy = computed(
    () =>
      submitting.value ||
      checkingPendingSuggestions.value ||
      votingSuggestionId.value !== null
  )

  const buildDraft = () => {
    draft.value = { ...baseSnapshot.value }
  }

  const resetDraft = () => {
    buildDraft()
  }

  const syncViewerVotes = async (suggestions: FeedbackSuggestion[]) => {
    if (!user.value || suggestions.length === 0) {
      viewerVotes.value = {}
      return
    }

    const viewerState = await fetchViewerState(
      suggestions.map((entry) => entry.id)
    )
    viewerVotes.value = suggestions.reduce<
      Record<string, FeedbackVoteValue | null>
    >((accumulator, suggestion) => {
      accumulator[suggestion.id] = viewerState.votes[suggestion.id] ?? null
      return accumulator
    }, {})
  }

  const loadPendingSuggestions = async ({
    silent = false,
  }: {
    silent?: boolean
  } = {}) => {
    checkingPendingSuggestions.value = true

    try {
      const response = await fetchFeedbackQueue({
        entityType: 'item',
        entityId: props.itemId,
        status: 'open',
        sort: 'new',
        page: 1,
      })

      pendingSuggestions.value = response.data
      await syncViewerVotes(response.data)
      return response.data
    } catch (error) {
      pendingSuggestions.value = []
      viewerVotes.value = {}

      if (!silent) {
        message.error(t('feedback.pending_check_failed'))
      }

      console.error('Failed to load existing feedback suggestions:', error)
      return []
    } finally {
      checkingPendingSuggestions.value = false
    }
  }

  const ensureLoggedIn = async () => {
    if (user.value) return true

    message.warning(t('feedback.login_required'))
    await navigateTo(localePath('/login'))
    return false
  }

  const patchPendingSuggestion = (updatedSuggestion: FeedbackSuggestion) => {
    pendingSuggestions.value = pendingSuggestions.value.map((entry) =>
      entry.id === updatedSuggestion.id ? updatedSuggestion : entry
    )
  }

  watch(
    () => props.show,
    (show) => {
      if (!show) {
        pendingSuggestions.value = []
        viewerVotes.value = {}
        return
      }

      buildDraft()
      void loadPendingSuggestions({ silent: true })
    },
    { immediate: true }
  )

  const createEmptyOption = (): SelectOption => ({
    label: t('feedback.empty_value'),
    value: undefined,
  })

  const getDraftScalarValue = (
    field: Exclude<ItemTagFeedbackField, ItemSearchArrayField>
  ) => {
    const value = draft.value[field]
    return typeof value === 'string' ? value : null
  }

  const getDraftArrayValue = (field: ItemSearchArrayField) => {
    const value = draft.value[field]
    return Array.isArray(value) ? value : []
  }

  const getSelectedTokenValues = (field: ItemTagFeedbackField) => {
    const value = draft.value[field]

    if (Array.isArray(value)) {
      return value
    }

    if (typeof value === 'string') {
      return [value]
    }

    return []
  }

  const buildTokenOptions = (
    field: ItemTagFeedbackField,
    values: string[]
  ): SelectOption[] => {
    const normalizedValues = sortItemSearchFacetValues(
      Array.from(new Set([...getSelectedTokenValues(field), ...values]))
    )

    const options = normalizedValues.map((value) => ({
      label: translateFilterToken(field, value, resolvedItemType.value),
      value,
    }))

    if (isItemTagFeedbackMultiField(field)) {
      return options
    }

    return [createEmptyOption(), ...options]
  }

  const categoryOptions = computed(() =>
    buildTokenOptions('category', attributeFacets.value.categories)
  )
  const subcategoryOptions = computed(() =>
    buildTokenOptions('subcategory', attributeFacets.value.subcategories)
  )

  const updateDraftScalarValue = (
    field: Exclude<ItemTagFeedbackField, ItemSearchArrayField>,
    value: string | null | undefined
  ) => {
    if (field === 'category' || field === 'subcategory') {
      const normalizedTaxonomy = normalizeItemSearchTaxonomySelection({
        itemType: resolvedItemType.value,
        category:
          field === 'category'
            ? (value as string | null | undefined)
            : getDraftScalarValue('category'),
        subcategory:
          field === 'subcategory'
            ? (value as string | null | undefined)
            : getDraftScalarValue('subcategory'),
      })

      draft.value = {
        ...draft.value,
        category: normalizedTaxonomy.category,
        subcategory: normalizedTaxonomy.subcategory,
      }
      return
    }

    draft.value = {
      ...draft.value,
      [field]: (value as string | null) ?? null,
    }
  }

  const updateDraftArrayValue = (
    field: ItemSearchArrayField,
    value: string[] | null | undefined
  ) => {
    const normalizedValue = Array.from(
      new Set(
        (value ?? [])
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right))

    draft.value = {
      ...draft.value,
      [field]: normalizedValue.length > 0 ? normalizedValue : null,
    }
  }

  const changedPatch = computed(() =>
    buildItemTagFeedbackPatch(
      baseSnapshot.value,
      draft.value,
      resolvedItemType.value
    )
  )

  const changedEntries = computed(() =>
    Object.entries(changedPatch.value).map(([field, nextValue]) => ({
      field: field as ItemTagFeedbackField,
      from: baseSnapshot.value[field as ItemTagFeedbackField] ?? null,
      to: nextValue ?? null,
    }))
  )

  const translateFeedbackValue = (
    field: ItemTagFeedbackField,
    value: ItemTagFeedbackValue
  ) => {
    if (Array.isArray(value)) {
      const translatedValues = sortItemSearchFacetValues(value).map((entry) =>
        translateFilterToken(field, entry, resolvedItemType.value)
      )

      return translatedValues.length > 0
        ? translatedValues.join(', ')
        : t('feedback.empty_value')
    }

    if (!value) {
      return t('feedback.empty_value')
    }

    return translateFilterToken(field, value, resolvedItemType.value)
  }

  const isPendingFeedbackConflict = (error: unknown) => {
    if (!error || typeof error !== 'object') return false

    const fetchError = error as {
      statusCode?: number
      response?: { status?: number }
    }

    return fetchError.statusCode === 409 || fetchError.response?.status === 409
  }

  const handleVote = async (
    suggestion: FeedbackSuggestion,
    vote: FeedbackVoteValue | null
  ) => {
    if (!(await ensureLoggedIn())) return

    votingSuggestionId.value = suggestion.id
    try {
      const response = await voteSuggestion({
        suggestionId: suggestion.id,
        vote,
      })

      viewerVotes.value = {
        ...viewerVotes.value,
        [suggestion.id]: response.vote,
      }
      patchPendingSuggestion(response.suggestion)
    } catch (error) {
      message.error(t('feedback.vote_failed'))
      console.error('Failed to update feedback vote:', error)
    } finally {
      votingSuggestionId.value = null
    }
  }

  const submit = async () => {
    if (!(await ensureLoggedIn())) return

    if (changedEntries.value.length === 0) {
      message.warning(t('feedback.no_changes'))
      return
    }

    submitting.value = true
    try {
      const existingSuggestions = await loadPendingSuggestions({ silent: true })
      if (existingSuggestions.length > 0) {
        message.warning(t('feedback.pending_exists_submit_blocked'))
        return
      }

      await submitSuggestion({
        entityType: 'item',
        entityId: props.itemId,
        proposedPatch: draft.value,
      })

      message.success(t('feedback.submit_success'))
      emit('update:show', false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('feedback.submit_failed')

      if (errorMessage.includes('Authentication required')) {
        await navigateTo(localePath('/login'))
        return
      }

      if (isPendingFeedbackConflict(error)) {
        await loadPendingSuggestions({ silent: true })
        message.warning(t('feedback.pending_exists_submit_blocked'))
        return
      }

      message.error(t('feedback.submit_failed'))
      console.error('Failed to submit feedback suggestion:', error)
    } finally {
      submitting.value = false
    }
  }
</script>
