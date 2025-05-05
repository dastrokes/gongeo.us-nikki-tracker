<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      class="rounded-xl"
      :style="cardStyle"
    >
      <!-- Show steps only when not fetching -->
      <template v-if="!isFetching">
        <n-steps
          vertical
          :current="currentStep"
          @update:current="currentStep = $event"
        >
          <!-- Import Method Step -->
          <n-step title="Choose Import Method">
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">
                {{ $t('import.choose_method_desc') }}
              </div>
              <n-radio-group
                v-model:value="importMethod"
                name="importMethod"
              >
                <n-space>
                  <n-radio value="game">{{
                    $t('import.import_from_game')
                  }}</n-radio>
                  <n-radio value="json">{{
                    $t('import.import_from_file')
                  }}</n-radio>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- File Import Step -->
          <n-step
            v-show="importMethod === 'json'"
            :title="$t('import.file_import')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">
                {{ $t('import.file_import_desc') }}
              </div>
              <n-upload
                accept=".json"
                :max="1"
                :show-file-list="true"
                class="w-96"
                @change="handleFileChange"
              >
                <n-button>{{ $t('import.select_file') }}</n-button>
              </n-upload>
            </div>
          </n-step>

          <!-- Game Import Step -->
          <n-step
            v-show="importMethod === 'game'"
            :title="$t('import.game_import')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>{{ $t('import.game_import_desc') }}</div>
          </n-step>

          <!-- Region Select Step -->
          <n-step
            v-show="importMethod === 'game'"
            :title="$t('import.select_region')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">{{ $t('import.select_region_desc') }}</div>
              <n-select
                :value="userStore.getRegion"
                :options="regionOptions"
                :placeholder="$t('import.select_region_desc')"
                @update:value="userStore.setRegion"
              />
            </div>
          </n-step>

          <!-- Pearpal Login Step -->
          <n-step
            v-show="importMethod === 'game'"
            :title="$t('import.login_pearpal')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div v-if="userStore.getRegion === Region.CHINA">
                {{ $t('import.login_pearpal_desc') }}
                <a
                  class="text-blue-600 hover:text-blue-800 underline"
                  href="https://myl.nuanpaper.com/home"
                  target="_blank"
                  >美鸭梨</a
                >
              </div>
              <div v-else>
                {{ $t('import.login_pearpal_desc') }}
                <a
                  class="text-blue-600 hover:text-blue-800 underline"
                  href="https://pearpal.infoldgames.com/en/home"
                  target="_blank"
                  >Pearpal Website</a
                >
              </div>
            </div>
          </n-step>

          <!-- Get Cookie Data Step -->
          <n-step
            v-show="importMethod === 'game'"
            :title="$t('import.get_cookie')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-4">
              <div>{{ $t('import.get_cookie_desc') }}</div>
              <n-radio-group
                v-model:value="cookieMethod"
                name="cookieMethod"
              >
                <n-space vertical>
                  <n-radio value="console">{{
                    $t('import.console_method')
                  }}</n-radio>
                  <n-radio value="manual">{{
                    $t('import.manual_input')
                  }}</n-radio>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- Console Method Step -->
          <n-step
            v-show="importMethod === 'game' && cookieMethod === 'console'"
            :title="$t('import.console_method')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>{{ $t('import.console_steps.title') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <li>{{ $t('import.console_steps.step1') }}</li>
                <li>{{ $t('import.console_steps.step2') }}</li>
                <li>{{ $t('import.console_steps.step3') }}</li>
                <li>
                  {{ $t('import.console_steps.step4') }}
                  <n-popconfirm
                    :show-arrow="false"
                    :show-icon="false"
                    positive-text="Copy"
                    negative-text="Cancel"
                    @positive-click="copyToClipboard"
                  >
                    <template #trigger>
                      <n-button size="small">{{
                        $t('import.actions.copy_code')
                      }}</n-button>
                    </template>
                    <template #default>
                      <n-code
                        :code="consoleScript"
                        word-wrap
                        language="javascript"
                        class="w-96 font-mono text-xs whitespace-pre rounded"
                      />
                    </template>
                  </n-popconfirm>
                </li>
                <li>{{ $t('import.console_steps.step5') }}</li>
                <li>{{ $t('import.console_steps.step6') }}</li>
                <li>{{ $t('import.console_steps.step7') }}</li>
                <div class="text-sm text-amber-600">
                  {{ $t('import.security_note') }}
                </div>
              </ol>
              <div class="mt-4">
                <n-input
                  v-model:value="manualPasteInput"
                  type="textarea"
                  :rows="3"
                  placeholder="{'roleid':'123456','token':'eyJhabc123xyz456.eyJhdef789ghi000.abc123def789','id':'654321'}"
                  class="w-80"
                />
                <n-space
                  class="flex mt-2"
                  align="center"
                >
                  <n-space class="flex">
                    <n-button
                      secondary
                      :disabled="!manualPasteInput"
                      @click="handleManualPaste"
                    >
                      {{ $t('import.actions.parse_input') }}
                    </n-button>
                    <n-button
                      secondary
                      @click="handlePasteFromClipboard"
                    >
                      <template #icon>
                        <n-icon><Paste /></n-icon>
                      </template>
                      {{ $t('import.actions.paste_from_clipboard') }}
                    </n-button>
                  </n-space>
                </n-space>
              </div>
            </div>
          </n-step>

          <!-- Manual Method Step -->
          <n-step
            v-show="importMethod === 'game' && cookieMethod === 'manual'"
            :title="$t('import.manual_input')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>{{ $t('import.manual_steps.title') }}</div>
              <div>{{ $t('import.manual_steps.note') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <li>{{ $t('import.manual_steps.step1') }}</li>
                <li>{{ $t('import.manual_steps.step2') }}</li>
                <li>{{ $t('import.manual_steps.step3') }}</li>
                <li>{{ $t('import.manual_steps.step4') }}</li>
                <li>
                  {{ $t('import.manual_steps.step5') }}
                  <ul class="list-disc list-inside ml-4">
                    <li>{{ $t('import.manual_steps.step5_items.momo_id') }}</li>
                    <li>
                      {{ $t('import.manual_steps.step5_items.momo_token') }}
                    </li>
                  </ul>
                </li>
                <li>{{ $t('import.manual_steps.step6') }}</li>
              </ol>
              <div class="text-sm text-amber-600">
                {{ $t('import.security_note') }}
              </div>
            </div>
          </n-step>
        </n-steps>

        <div class="mt-4">
          <template v-if="importMethod === 'game'">
            <n-form>
              <n-space vertical>
                <n-form-item :label="$t('import.form.uid')">
                  <n-input
                    v-model:value="formData.roleid"
                    :placeholder="$t('import.form.uid_placeholder')"
                  />
                </n-form-item>
                <n-form-item :label="$t('import.form.momo_id')">
                  <n-input
                    v-model:value="formData.id"
                    :placeholder="$t('import.form.momo_id_placeholder')"
                  />
                </n-form-item>
                <n-form-item :label="$t('import.form.momo_token')">
                  <n-input
                    v-model:value="formData.token"
                    :placeholder="$t('import.form.momo_token_placeholder')"
                  />
                </n-form-item>
              </n-space>
            </n-form>
            <n-space
              align="center"
              class="w-full flex mb-4"
              >{{ $t('import.form.submit_global_stats') }}
              <n-switch
                v-model:value="submitGlobalStats"
                class="flex-shrink-0"
              />
            </n-space>
            <n-space class="w-full flex">
              <n-button
                type="primary"
                :loading="loading || isFetching"
                class="flex-grow"
                @click="handleSubmit"
              >
                {{
                  isFetching
                    ? $t('import.form.fetching')
                    : $t('import.form.submit_button')
                }}
              </n-button>
            </n-space>
          </template>
          <template v-else>
            <n-space class="w-full flex">
              <n-button
                type="primary"
                :loading="loading || isFetching"
                class="flex-grow"
                @click="handleSubmit"
              >
                {{
                  isFetching
                    ? $t('import.form.fetching')
                    : $t('import.form.submit_button')
                }}
              </n-button>
            </n-space>
          </template>
        </div>
      </template>

      <!-- Show progress bar when fetching -->
      <div
        v-if="isFetching"
        class="py-4"
      >
        <n-progress
          type="line"
          :percentage="progressPercentage"
          :indicator-placement="'inside'"
          :color="'#FB7185'"
          :height="34"
          :border-radius="12"
          :show-indicator="true"
          processing
        />
        <div class="text-center mt-4 text-xl text-gray-500">
          {{
            $t('import.progress.processing_banner', {
              current: (progress?.banner ?? 0) - 1 || 0,
              total: Object.values(bannerData).filter((b) => b.bannerId !== 1)
                .length,
            })
          }}
        </div>
        <div class="text-center mt-4 text-xl text-gray-500">
          {{
            $t('import.progress.fetching_data', {
              banner: bannerData[progress?.banner || 0]?.bannerName || '',
            })
          }}
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import type { CookieData } from '~/types/api'
  import type { PullRecord } from '~/types/pull'
  import {
    useBannerPullApi,
    Region,
    REGION_LABELS,
  } from '~/composables/useBannerPullApi'
  import { useMessage } from 'naive-ui'
  import type { UploadFileInfo } from 'naive-ui'
  import { useBannerPullData } from '~/composables/useBannerPullData'
  import { usePullStore } from '~/stores/pull'
  import { useUserStore } from '~/stores/user'
  import { Paste, Check } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import { useCardStyle } from '~/composables/useCardStyle'

  const consoleScript = `console.log(JSON.stringify({
  roleid: [...document.querySelectorAll('div')].find(el => el.textContent.startsWith('UID:'))?.textContent.replace('UID:', '').trim(),
  token: document.cookie.match(/momoToken=([^;]+)/)?.[1],
  id: document.cookie.match(/momoNid=([^;]+)/)?.[1]
}));`

  const copyToClipboard = async () => {
    try {
      await window?.navigator?.clipboard?.writeText(consoleScript)
      message.success('Code copied to clipboard!')
    } catch {
      message.error('Failed to copy code to clipboard')
    }
  }

  const formData = ref({
    roleid: '',
    token: '',
    id: '',
  })
  const manualPasteInput = ref('')
  const currentStep = ref(0)
  const message = useMessage()
  const { verifyAuth, loading, error } = useBannerPullApi()
  const userStore = useUserStore()
  const {
    fetchAllData,
    isFetching,
    error: fetchError,
    processJsonImport,
    progress,
  } = useBannerPullData()
  const pullStore = usePullStore()
  const { cardStyle } = useCardStyle()

  // Function to determine region based on timezone
  const determineRegionFromTimezone = () => {
    const timezone = Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.toLowerCase()

    if (
      timezone.includes('asia') ||
      timezone.includes('tokyo') ||
      timezone.includes('seoul') ||
      timezone.includes('singapore')
    ) {
      return Region.ASIA
    } else if (
      timezone.includes('china') ||
      timezone.includes('shanghai') ||
      timezone.includes('beijing')
    ) {
      return Region.CHINA
    } else if (
      timezone.includes('europe') ||
      timezone.includes('london') ||
      timezone.includes('paris') ||
      timezone.includes('berlin')
    ) {
      return Region.EUROPE
    } else if (
      timezone.includes('america') ||
      timezone.includes('new_york') ||
      timezone.includes('los_angeles') ||
      timezone.includes('chicago')
    ) {
      return Region.AMERICA
    } else if (timezone.includes('taipei') || timezone.includes('hong_kong')) {
      return Region.TW
    }

    // Default to America if no match
    return Region.AMERICA
  }

  // Set initial region based on timezone when component is mounted
  onMounted(() => {
    const region = determineRegionFromTimezone()
    userStore.setRegion(region)
  })

  // Make BANNER_DATA available in template
  const bannerData = BANNER_DATA

  // Calculate progress percentage for the progress bar
  const progressPercentage = computed(() => {
    if (!progress.value || !progress.value.banner) return 0

    // Get all banner IDs except permanent banner (id 1)
    const bannerIds = Object.values(BANNER_DATA)
      .map((banner) => banner.bannerId)
      .filter((id) => id !== 1)

    // Find the index of the current banner
    const currentBannerIndex = bannerIds.indexOf(progress.value.banner)

    // Calculate percentage based on current banner index and total banners
    return Math.round(((currentBannerIndex + 1) / bannerIds.length) * 100)
  })

  const regionOptions = Object.entries(REGION_LABELS).map(([value, label]) => ({
    label,
    value: value as Region,
  }))

  const importMethod = ref<'game' | 'json'>('game')
  const jsonFile = ref<File | null>(null)
  const submitGlobalStats = ref(true)

  const handleFileChange = (data: {
    file: UploadFileInfo
    fileList: UploadFileInfo[]
  }) => {
    if (data.file.file) {
      jsonFile.value = data.file.file
    } else {
      jsonFile.value = null
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      manualPasteInput.value = clipboardText
      const parsedData = JSON.parse(clipboardText) as CookieData

      if (!parsedData.roleid || !parsedData.token || !parsedData.id) {
        throw new Error('Invalid file format')
      }

      formData.value = {
        roleid: parsedData.roleid,
        token: parsedData.token,
        id: parsedData.id,
      }
      message.success('Data pasted successfully!')
    } catch (error) {
      console.error(error)
      message.error(
        'Failed to parse clipboard data. Please paste manually or fill in the form.'
      )
    }
  }

  const handleManualPaste = () => {
    try {
      const parsedData = JSON.parse(manualPasteInput.value) as CookieData

      if (!parsedData.roleid || !parsedData.token || !parsedData.id) {
        throw new Error('Invalid file format')
      }

      formData.value = {
        roleid: parsedData.roleid,
        token: parsedData.token,
        id: parsedData.id,
      }
      message.success('Data pasted successfully!')
    } catch (error) {
      console.error(error)
      message.error(
        "Failed to parse input data. Please ensure it's valid file format."
      )
    }
  }

  const handleSubmit = async () => {
    if (importMethod.value === 'json') {
      if (!jsonFile.value) {
        message.warning('No file selected')
        return
      }
      try {
        const fileContent = await jsonFile.value.text()
        const jsonData = JSON.parse(fileContent) as Record<number, PullRecord[]>

        // Reset current store state
        pullStore.reset()

        await processJsonImport(jsonData)

        message.success('Data imported successfully!')
      } catch (e) {
        message.error(
          'Failed to import file: ' +
            (e instanceof Error ? e.message : 'Unknown error')
        )
      }
      return
    } else {
      try {
        const cookieData: CookieData = formData.value
        const success = await verifyAuth(cookieData)

        if (success) {
          message.success('Authentication successful!')
          userStore.setUid(formData.value.roleid)
          try {
            await fetchAllData()

            // Send analytics only if enabled and there are actual pulls
            if (
              submitGlobalStats.value &&
              Object.values(pullStore.processedPulls).some(
                (banner) => banner.stats.totalPulls > 0
              )
            ) {
              try {
                await pullStore.sendUserBannerStats()
              } catch {
                message.error('Failed to submit global stats')
              }
            }
          } catch {
            message.error(fetchError.value || 'Failed to fetch pull history')
          }
        } else {
          message.error(error.value || 'Authentication failed')
        }
      } catch (error) {
        console.error(error)
        message.error('Invalid form data')
      }
    }
  }

  const cookieMethod = ref<'console' | 'manual'>('console')

  // Add watch for manual paste input
  watch(manualPasteInput, (newValue) => {
    if (newValue) {
      try {
        const parsedData = JSON.parse(newValue) as CookieData

        if (!parsedData.roleid || !parsedData.token || !parsedData.id) {
          throw new Error('Invalid file format')
        }

        formData.value = {
          roleid: parsedData.roleid,
          token: parsedData.token,
          id: parsedData.id,
        }
        message.success('Data pasted successfully!')
      } catch (error) {
        // Don't show error message on every keystroke
        if (newValue.length > 10) {
          // Only show error if input is reasonably long
          console.warn(`Invalid data input`, error)
          message.error(
            "Failed to parse input data. Please ensure it's valid file format."
          )
        }
      }
    }
  })
</script>
