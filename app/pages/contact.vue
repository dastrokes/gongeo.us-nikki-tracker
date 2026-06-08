<template>
  <div class="mx-auto max-w-3xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-4 sm:p-6"
    >
      <div class="space-y-6">
        <div class="space-y-2 text-center">
          <h1 class="text-2xl leading-tight font-semibold sm:text-3xl">
            {{ t('navigation.contact') }}
          </h1>
        </div>

        <n-alert
          v-if="submitState === 'success'"
          type="success"
          :show-icon="false"
        >
          {{ t('contact.success') }}
        </n-alert>

        <n-alert
          v-if="submitState === 'error'"
          type="error"
          :show-icon="false"
        >
          {{ t('contact.error') }}
        </n-alert>

        <form
          ref="formRef"
          name="site-feedback"
          action="/__forms.html"
          method="POST"
          enctype="multipart/form-data"
          data-netlify="true"
          netlify-honeypot="bot-field"
          class="space-y-4"
          @submit.prevent="submitForm"
        >
          <input
            type="hidden"
            name="form-name"
            value="site-feedback"
          />
          <input
            type="hidden"
            name="subject"
            value="gongeo.us feedback"
          />

          <div
            class="hidden"
            aria-hidden="true"
          >
            <input
              name="bot-field"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5">
              <span
                class="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {{ t('contact.name_label') }}
                <span class="font-normal text-slate-500 dark:text-slate-400">
                  {{ t('contact.optional_label') }}
                </span>
              </span>
              <n-input
                :placeholder="t('contact.name_placeholder')"
                :disabled="submitting"
                :input-props="{ name: 'name', autocomplete: 'name' }"
              />
            </label>

            <label class="space-y-1.5">
              <span
                class="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {{ t('login.email') }}
                <span class="font-normal text-slate-500 dark:text-slate-400">
                  {{ t('contact.optional_label') }}
                </span>
              </span>
              <n-input
                type="email"
                :placeholder="t('login.email')"
                :disabled="submitting"
                :input-props="{ name: 'email', autocomplete: 'email' }"
              />
            </label>
          </div>

          <label class="block space-y-1.5">
            <span
              class="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {{ t('contact.message_label') }}
            </span>
            <n-input
              type="textarea"
              :placeholder="t('meta.description.contact')"
              :disabled="submitting"
              :input-props="{ name: 'message', required: true, rows: 6 }"
            />
          </label>

          <label class="block space-y-1.5">
            <span
              class="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {{ t('contact.screenshot_label') }}
              <span class="font-normal text-slate-500 dark:text-slate-400">
                {{ t('contact.optional_label') }}
              </span>
            </span>
            <input
              ref="screenshotInputRef"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              :disabled="submitting"
              class="sr-only"
              @change="handleScreenshotChange"
            />
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <n-button
                attr-type="button"
                :disabled="submitting"
                @click="screenshotInputRef?.click()"
              >
                {{ t('import.select_file') }}
              </n-button>
              <span
                class="min-w-0 truncate text-sm text-slate-500 dark:text-slate-400"
              >
                {{ screenshotName || t('import.messages.no_file_selected') }}
              </span>
            </div>
            <n-alert
              v-if="screenshotError"
              type="warning"
              :show-icon="false"
            >
              {{ t(`contact.${screenshotError}`) }}
            </n-alert>
            <div
              v-if="screenshotPreviewUrl"
              class="space-y-2 rounded-[8px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <img
                :src="screenshotPreviewUrl"
                :alt="t('contact.screenshot_label')"
                class="max-h-64 w-full rounded-[6px] object-contain"
              />
              <div class="flex items-center justify-between gap-3">
                <span
                  class="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400"
                >
                  {{ screenshotName }}
                </span>
                <n-button
                  size="tiny"
                  quaternary
                  :disabled="submitting"
                  @click="clearScreenshot"
                >
                  {{ t('common.clear') }}
                </n-button>
              </div>
            </div>
          </label>

          <div class="flex justify-end">
            <n-button
              attr-type="submit"
              type="primary"
              :loading="submitting"
              class="sm:self-end"
            >
              {{ t('common.submit') }}
            </n-button>
          </div>
        </form>

        <div class="space-y-4">
          <SocialLinks />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024

  const formRef = ref<HTMLFormElement | null>(null)
  const screenshotInputRef = ref<HTMLInputElement | null>(null)
  const submitting = ref(false)
  const submitState = ref<'idle' | 'success' | 'error'>('idle')
  const screenshotPreviewUrl = ref<string | null>(null)
  const screenshotName = ref('')
  const screenshotError = ref<'screenshot_too_large' | null>(null)
  const lastSubmittedSignature = ref<string | null>(null)

  const revokeScreenshotPreview = () => {
    if (!screenshotPreviewUrl.value) return

    URL.revokeObjectURL(screenshotPreviewUrl.value)
    screenshotPreviewUrl.value = null
  }

  const clearScreenshot = () => {
    revokeScreenshotPreview()
    screenshotName.value = ''
    screenshotError.value = null

    if (screenshotInputRef.value) {
      screenshotInputRef.value.value = ''
    }
  }

  const handleScreenshotChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0] ?? null

    revokeScreenshotPreview()
    screenshotName.value = ''
    screenshotError.value = null

    if (!file) return

    if (file.size > MAX_SCREENSHOT_BYTES) {
      screenshotError.value = 'screenshot_too_large'
      input.value = ''
      return
    }

    screenshotName.value = file.name
    screenshotPreviewUrl.value = URL.createObjectURL(file)
  }

  const getFormSignature = (formData: FormData) => {
    const screenshot = formData.get('screenshot')
    const screenshotSignature =
      screenshot instanceof File && screenshot.name
        ? `${screenshot.name}:${screenshot.size}:${screenshot.lastModified}`
        : ''

    return JSON.stringify({
      name: formData.get('name')?.toString().trim() ?? '',
      email: formData.get('email')?.toString().trim() ?? '',
      message: formData.get('message')?.toString().trim() ?? '',
      screenshot: screenshotSignature,
    })
  }

  const submitForm = async () => {
    const form = formRef.value
    if (!form || submitting.value) return

    if (screenshotError.value) return

    const formData = new FormData(form)
    const formSignature = getFormSignature(formData)
    if (formSignature === lastSubmittedSignature.value) {
      submitState.value = 'success'
      return
    }

    submitting.value = true
    submitState.value = 'idle'

    try {
      const screenshot = formData.get('screenshot')
      if (
        screenshot instanceof File &&
        screenshot.name === '' &&
        screenshot.size === 0
      ) {
        formData.delete('screenshot')
      }

      const response = await fetch('/__forms.html', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Feedback form submission failed: ${response.status}`)
      }

      form.reset()
      clearScreenshot()
      lastSubmittedSignature.value = formSignature
      submitState.value = 'success'
    } catch (error) {
      submitState.value = 'error'
      console.error('Failed to submit contact form:', error)
    } finally {
      submitting.value = false
    }
  }

  onUnmounted(() => {
    revokeScreenshotPreview()
  })

  useSeoMeta({
    title: () =>
      `${t('navigation.contact')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.contact'),
    ogTitle: () =>
      `${t('navigation.contact')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.contact'),
    twitterTitle: () =>
      `${t('navigation.contact')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.contact'),
  })
</script>
