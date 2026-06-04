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
          v-else-if="submitState === 'error'"
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
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const formRef = ref<HTMLFormElement | null>(null)
  const submitting = ref(false)
  const submitState = ref<'idle' | 'success' | 'error'>('idle')

  const encodeFormData = (formData: FormData) => {
    const body = new URLSearchParams()

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        body.append(key, value)
      }
    }

    return body.toString()
  }

  const submitForm = async () => {
    const form = formRef.value
    if (!form || submitting.value) return

    submitting.value = true
    submitState.value = 'idle'

    try {
      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData(new FormData(form)),
      })

      if (!response.ok) {
        throw new Error(`Feedback form submission failed: ${response.status}`)
      }

      form.reset()
      submitState.value = 'success'
    } catch (error) {
      submitState.value = 'error'
      console.error('Failed to submit contact form:', error)
    } finally {
      submitting.value = false
    }
  }

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
