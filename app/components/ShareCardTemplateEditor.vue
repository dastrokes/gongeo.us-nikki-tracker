<template>
  <n-modal
    :show="show"
    @update:show="emit('update:show', $event)"
  >
    <n-card
      role="dialog"
      :title="t('creation_hub.template.title')"
      class="flex h-dvh w-full max-w-none flex-col overflow-hidden rounded-2xl sm:h-auto sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-2xl lg:max-h-[calc(100dvh-64px)] lg:max-w-xl"
      content-class="min-h-0 min-w-0 flex-1 overflow-hidden p-0"
      closable
      @close="emit('update:show', false)"
    >
      <div class="flex h-full min-h-0 flex-col overflow-hidden">
        <div class="border-b border-slate-200 p-3 dark:border-slate-700">
          <n-tabs
            v-model:value="editorMode"
            type="segment"
            animated
          >
            <n-tab name="default">{{
              t('creation_hub.template.default')
            }}</n-tab>
            <n-tab name="custom">{{ t('creation_hub.template.custom') }}</n-tab>
          </n-tabs>
        </div>

        <div
          class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div class="p-4 pb-6 sm:p-5 sm:pb-7">
            <div
              v-if="editorMode === 'default'"
              class="space-y-4"
            >
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-50">
                  {{ t('creation_hub.template.default') }}
                </h3>
                <p
                  class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300"
                >
                  {{ t('creation_hub.template.default_description') }}
                </p>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(prompt, index) in defaultPrompts"
                  :key="index"
                  class="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span
                    class="text-[10px] font-semibold text-slate-400 tabular-nums"
                    >{{ String(index + 1).padStart(2, '0') }}</span
                  >
                  <p
                    class="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {{ prompt }}
                  </p>
                </div>
              </div>
              <n-button
                type="primary"
                block
                @click="useDefault"
              >
                {{
                  activeTemplateId === 'default'
                    ? t('creation_hub.template.using_default')
                    : t('creation_hub.template.use_default')
                }}
              </n-button>
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <n-form label-placement="top">
                <n-form-item :label="t('creation_hub.template.name')">
                  <n-input
                    v-model:value="draftName"
                    maxlength="40"
                    show-count
                    clearable
                    :placeholder="t('creation_hub.template.name_placeholder')"
                  />
                </n-form-item>
                <div class="grid gap-x-3 sm:grid-cols-3">
                  <n-form-item
                    v-for="(_, index) in draftPrompts"
                    :key="index"
                    :label="`${String(index + 1).padStart(2, '0')} · ${t('creation_hub.template.prompt')}`"
                  >
                    <n-input
                      v-model:value="draftPrompts[index]"
                      maxlength="32"
                      clearable
                      :placeholder="
                        t('creation_hub.template.prompt_placeholder', {
                          number: index + 1,
                        })
                      "
                    />
                  </n-form-item>
                </div>
              </n-form>

              <div class="grid grid-cols-2 gap-2">
                <n-button
                  type="primary"
                  size="large"
                  @click="saveCustom"
                >
                  {{ t('creation_hub.template.save') }}
                </n-button>
                <n-button
                  secondary
                  size="large"
                  @click="shareCustom"
                >
                  <template #icon
                    ><n-icon><ShareAlt /></n-icon
                  ></template>
                  {{ t('creation_hub.template.share') }}
                </n-button>
              </div>

              <div class="flex justify-center">
                <n-popconfirm @positive-click="resetCustom">
                  <template #trigger>
                    <n-button
                      text
                      type="error"
                      >{{ t('creation_hub.template.reset') }}</n-button
                    >
                  </template>
                  {{ t('creation_hub.template.reset_confirm') }}
                </n-popconfirm>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
  import { ShareAlt } from '@vicons/fa'

  const props = defineProps<{
    show: boolean
    activeTemplateId: ShareCardTemplateId
    defaultPrompts: string[]
    customTemplate: ShareCardTemplate
  }>()
  const emit = defineEmits<{
    'update:show': [value: boolean]
    'use-default': []
    'save-custom': [template: ShareCardTemplate]
    'share-custom': [template: ShareCardTemplate]
    reset: []
  }>()

  const { t } = useI18n()
  const message = useMessage()
  const editorMode = ref<ShareCardTemplateId>('default')
  const draftName = ref('')
  const draftPrompts = ref<string[]>([])

  const syncDraft = () => {
    editorMode.value = props.activeTemplateId
    draftName.value = props.customTemplate.name
    draftPrompts.value = [...props.customTemplate.prompts]
  }

  watch(
    () => props.show,
    (visible) => {
      if (visible) syncDraft()
    }
  )
  watch(() => props.customTemplate, syncDraft, { deep: true })

  const validDraft = () => {
    const name = cleanShareCardTemplateText(draftName.value, 40)
    const prompts = draftPrompts.value
      .slice(0, 9)
      .map((prompt) => cleanShareCardTemplateText(prompt, 32))
    if (!name || prompts.length !== 9 || prompts.some((prompt) => !prompt)) {
      message.error(t('creation_hub.template.incomplete'))
      return null
    }
    return { id: 'custom' as const, name, prompts }
  }
  const useDefault = () => {
    emit('use-default')
    emit('update:show', false)
  }
  const saveCustom = () => {
    const template = validDraft()
    if (!template) return
    emit('save-custom', template)
    emit('update:show', false)
  }
  const shareCustom = () => {
    const template = validDraft()
    if (template) emit('share-custom', template)
  }
  const resetCustom = () => emit('reset')
</script>
