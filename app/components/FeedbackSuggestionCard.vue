<template>
  <n-card
    size="small"
    :bordered="false"
    class="group overflow-hidden rounded-3xl border border-black/5 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-shadow duration-300 hover:shadow-[0_22px_64px_rgba(244,114,182,0.10)] dark:border-white/10 dark:bg-slate-950/75"
  >
    <div
      class="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]"
    >
      <div
        class="aspect-[2/3] overflow-hidden rounded-[28px] bg-slate-100/80 dark:bg-slate-900/70"
      >
        <NuxtImg
          :src="getImageSrc('item', suggestion.entityId)"
          :alt="itemName"
          class="block h-full w-full object-cover"
          preset="tallLg"
          fit="cover"
          loading="lazy"
          sizes="200px"
        />
      </div>

      <div class="min-w-0 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLinkLocale
              :to="`/items/${suggestion.entityId}`"
              class="block text-xl font-black leading-tight transition-opacity hover:opacity-80"
            >
              {{ itemName }}
            </NuxtLinkLocale>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <n-tag
              size="small"
              :type="statusTagType"
              :bordered="false"
              round
            >
              {{ t(statusLabelKey) }}
            </n-tag>
            <n-tag
              size="small"
              type="success"
              :bordered="false"
              round
            >
              {{ t('feedback.agree_count', { count: suggestion.agreeCount }) }}
            </n-tag>
            <n-tag
              size="small"
              type="error"
              :bordered="false"
              round
            >
              {{
                t('feedback.disagree_count', {
                  count: suggestion.disagreeCount,
                })
              }}
            </n-tag>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <div
            v-for="entry in changedEntries"
            :key="entry.field"
            class="rounded-2xl border border-black/5 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-slate-900/70"
          >
            <div
              class="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
            >
              {{ t(getItemSearchFieldLabelKey(entry.field)) }}
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <div
                class="rounded-xl border border-black/5 bg-white/85 px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/70"
              >
                <div
                  class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                >
                  {{ t('feedback.before') }}
                </div>
                <div class="mt-1.5 text-sm font-semibold opacity-80">
                  {{ translateValue(entry.field, entry.from) }}
                </div>
              </div>

              <div
                class="rounded-xl border border-rose-200/70 bg-rose-50/80 px-3 py-2.5 dark:border-rose-400/20 dark:bg-rose-500/10"
              >
                <div
                  class="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300"
                >
                  {{ t('feedback.after') }}
                </div>
                <div class="mt-1.5 text-sm font-semibold">
                  {{ translateValue(entry.field, entry.to) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showActions"
          class="rounded-2xl border border-black/5 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-900/70"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <n-button
              size="large"
              strong
              secondary
              type="success"
              :disabled="voting"
              class="!h-11 !justify-between !rounded-2xl"
              :class="userVote === 1 ? 'ring-2 ring-emerald-400/40' : ''"
              @click="emitVote(userVote === 1 ? null : 1)"
            >
              <span>{{ t('feedback.agree_action') }}</span>
            </n-button>

            <n-button
              size="large"
              strong
              secondary
              type="error"
              :disabled="voting"
              class="!h-11 !justify-between !rounded-2xl"
              :class="userVote === -1 ? 'ring-2 ring-rose-400/40' : ''"
              @click="emitVote(userVote === -1 ? null : -1)"
            >
              <span>{{ t('feedback.disagree_action') }}</span>
            </n-button>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-2">
            <n-button
              v-if="showPreviousAction"
              size="medium"
              tertiary
              :disabled="previousDisabled"
              class="!rounded-xl"
              @click="$emit('previous')"
            >
              <span>{{ t('common.previous') }}</span>
            </n-button>

            <n-button
              v-if="showSkipAction"
              size="medium"
              tertiary
              :disabled="voting"
              class="!rounded-xl"
              @click="$emit('skip')"
            >
              <span>{{ t('common.next') }}</span>
            </n-button>

            <NuxtLinkLocale
              :to="`/items/${suggestion.entityId}`"
              class="inline-flex min-h-10 items-center justify-center rounded-xl border border-black/5 bg-white px-4 text-sm font-semibold text-rose-500 hover:border-rose-200 hover:text-rose-600 dark:border-white/10 dark:bg-slate-950 dark:text-rose-300 dark:hover:border-rose-300/20 dark:hover:text-rose-200 sm:ml-auto"
            >
              {{ t('common.view_compendium') }}
            </NuxtLinkLocale>
          </div>
        </div>

        <div
          v-if="hasMaintainerActions"
          class="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-400/20 dark:bg-amber-400/10"
        >
          <div
            class="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-600/90 dark:text-amber-300/80"
          >
            {{ t('feedback.maintainer_actions') }}
          </div>

          <div class="grid gap-2 sm:grid-cols-3">
            <n-button
              v-if="canApprove"
              size="medium"
              secondary
              type="success"
              :loading="maintainerBusyAction === 'approve'"
              :disabled="maintainerBusy || voting"
              class="!h-11 !justify-between !rounded-2xl"
              @click="emitMaintainerAction('approve')"
            >
              <span>{{ t('feedback.approve_action') }}</span>
            </n-button>

            <n-button
              v-if="canApply"
              size="medium"
              secondary
              type="warning"
              :loading="maintainerBusyAction === 'apply'"
              :disabled="maintainerBusy || voting"
              class="!h-11 !justify-between !rounded-2xl"
              @click="emitMaintainerAction('apply')"
            >
              <span>{{ t('feedback.apply_action') }}</span>
            </n-button>

            <n-button
              v-if="canReject"
              size="medium"
              secondary
              type="error"
              :loading="maintainerBusyAction === 'reject'"
              :disabled="maintainerBusy || voting"
              class="!h-11 !justify-between !rounded-2xl"
              @click="emitMaintainerAction('reject')"
            >
              <span>{{ t('feedback.reject_action') }}</span>
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
  import type {
    FeedbackMaintainerAction,
    FeedbackSuggestion,
    FeedbackVoteValue,
    ItemTagFeedbackField,
    ItemTagFeedbackValue,
  } from '#shared/types/feedback'
  import {
    getItemSearchFieldLabelKey,
    sortItemSearchFacetValues,
  } from '#shared/utils/itemSearch'

  const props = withDefaults(
    defineProps<{
      suggestion: FeedbackSuggestion
      userVote?: FeedbackVoteValue | null
      showActions?: boolean
      showMaintainerActions?: boolean
      showPreviousAction?: boolean
      showSkipAction?: boolean
      previousDisabled?: boolean
      voting?: boolean
      maintainerBusy?: boolean
      maintainerBusyAction?: FeedbackMaintainerAction | null
    }>(),
    {
      userVote: null,
      showActions: true,
      showMaintainerActions: false,
      showPreviousAction: false,
      showSkipAction: true,
      previousDisabled: false,
      voting: false,
      maintainerBusy: false,
      maintainerBusyAction: null,
    }
  )

  const emit = defineEmits<{
    'maintainer-action': [action: FeedbackMaintainerAction]
    previous: []
    vote: [value: FeedbackVoteValue | null]
    skip: []
  }>()

  const { t } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const { getImageSrc } = imageProvider()
  const itemName = computed(() => t(`item.${props.suggestion.entityId}.name`))
  const statusLabelKey = computed(
    () => `feedback.status_${props.suggestion.status}`
  )
  const statusTagType = computed(() => {
    switch (props.suggestion.status) {
      case 'accepted':
      case 'applied':
        return 'success' as const
      case 'rejected':
        return 'error' as const
      default:
        return 'warning' as const
    }
  })

  const changedEntries = computed(() =>
    props.suggestion.changedFields.map((field) => ({
      field,
      from: props.suggestion.baseSnapshot[field] ?? null,
      to: props.suggestion.proposedPatch[field] ?? null,
    }))
  )

  const translateValue = (
    field: ItemTagFeedbackField,
    value: ItemTagFeedbackValue
  ) => {
    if (Array.isArray(value)) {
      const translatedValues = sortItemSearchFacetValues(value).map((entry) =>
        translateFilterToken(field, entry, props.suggestion.itemType)
      )

      return translatedValues.length > 0
        ? translatedValues.join(', ')
        : t('feedback.empty_value')
    }

    return value
      ? translateFilterToken(field, value, props.suggestion.itemType)
      : t('feedback.empty_value')
  }

  const emitVote = (value: FeedbackVoteValue | null) => {
    emit('vote', value)
  }

  const canApprove = computed(
    () => props.showMaintainerActions && props.suggestion.status === 'open'
  )
  const canReject = computed(
    () =>
      props.showMaintainerActions &&
      (props.suggestion.status === 'open' ||
        props.suggestion.status === 'accepted')
  )
  const canApply = computed(
    () =>
      props.showMaintainerActions &&
      (props.suggestion.status === 'open' ||
        props.suggestion.status === 'accepted')
  )
  const hasMaintainerActions = computed(
    () => canApprove.value || canReject.value || canApply.value
  )

  const emitMaintainerAction = (action: FeedbackMaintainerAction) => {
    emit('maintainer-action', action)
  }
</script>
