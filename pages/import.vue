<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl bg-purple-50"
      no-title
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
                Choose how you want to import your pull history.
              </div>
              <n-radio-group
                v-model:value="importMethod"
                name="importMethod"
              >
                <n-space>
                  <n-radio value="game">Import from Game</n-radio>
                  <n-radio value="json">Import from File</n-radio>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- File Import Step -->
          <n-step
            v-show="importMethod === 'json'"
            title="File Import"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">
                Import from a previously exported nikki-resonance-data file.
              </div>
              <n-upload
                accept=".json"
                :max="1"
                :show-file-list="true"
                class="w-96"
                @change="handleFileChange"
              >
                <n-button>Select File</n-button>
              </n-upload>
            </div>
          </n-step>

          <!-- Game Import Step -->
          <n-step
            v-show="importMethod === 'game'"
            title="Game Import"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>Import directly from the game using your browser.</div>
          </n-step>

          <!-- Region Select Step -->
          <n-step
            v-show="importMethod === 'game'"
            title="Select Region"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">Select your game server region.</div>
              <n-select
                :value="userStore.getRegion"
                :options="regionOptions"
                placeholder="Select your region"
                @update:value="userStore.setRegion"
              />
            </div>
          </n-step>

          <!-- Pearpal Login Step -->
          <n-step
            v-show="importMethod === 'game'"
            title="Login to Pearpal Website"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div v-if="userStore.getRegion === Region.CHINA">
                Open
                <a
                  class="text-blue-600 hover:text-blue-800 underline"
                  href="https://myl.nuanpaper.com/home"
                  target="_blank"
                  >Pearpal Website</a
                >
                in a <b>new tab</b> and login with your Infold account if you
                aren't already logged in.
              </div>
              <div v-else>
                Open
                <a
                  class="text-blue-600 hover:text-blue-800 underline"
                  href="https://pearpal.infoldgames.com/en/home"
                  target="_blank"
                  >Pearpal Website</a
                >
                in a <b>new tab</b> and login with your Infold account if you
                aren't already logged in.
              </div>
            </div>
          </n-step>

          <!-- Get Cookie Data Step -->
          <n-step
            v-show="importMethod === 'game'"
            title="Get Cookie Data From Pearpal Website"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-4">
              <div>Choose how you want to get your cookie data:</div>
              <n-radio-group
                v-model:value="cookieMethod"
                name="cookieMethod"
              >
                <n-space vertical>
                  <n-radio value="console"
                    >Using Console Method (Recommended)</n-radio
                  >
                  <n-radio value="manual">Manual Input</n-radio>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- Console Method Step -->
          <n-step
            v-show="importMethod === 'game' && cookieMethod === 'console'"
            title="Console Method"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>Follow these steps to get your cookie data:</div>
              <ol class="list-decimal list-inside space-y-2">
                <li>Make sure you are logged in and is on Pearpal Website</li>
                <li>
                  Open your browser's Developer Tools (Press F12 or right-click
                  and select "Inspect")
                </li>
                <li>Go to the "Console" tab</li>
                <li>
                  Copy and paste the following code into the console:
                  <n-popconfirm
                    :show-arrow="false"
                    :show-icon="false"
                    positive-text="Copy"
                    negative-text="Cancel"
                    @positive-click="copyToClipboard"
                  >
                    <template #trigger>
                      <n-button size="small">Copy Code</n-button>
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
                <li>
                  If you get a warning saying "Warning: Don't paste code into
                  the devtools console", type "Allow pasting" and hit enter or
                  switch to manual input method if you prefer
                </li>
                <li>
                  Copy the output text (it should look like the example in the
                  input area below)
                </li>
                <li>
                  Come back to gongeo.us, paste the output text in the input
                  area below
                </li>
                <div class="text-sm text-amber-600">
                  Note: Never share these cookie values with anyone else!
                </div>
              </ol>
              <div class="mt-4">
                <n-input
                  v-model:value="manualPasteInput"
                  type="textarea"
                  :rows="3"
                  placeholder='{"roleid":"123456","token":"eyJhabc123xyz456.eyJhdef789ghi000.abc123def789","id":"654321"}'
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
                      Parse Input
                    </n-button>
                    <n-button
                      secondary
                      @click="handlePasteFromClipboard"
                    >
                      <template #icon>
                        <n-icon><Paste /></n-icon>
                      </template>
                      Paste from Clipboard
                    </n-button>
                  </n-space>
                </n-space>
              </div>
            </div>
          </n-step>

          <!-- Manual Method Step -->
          <n-step
            v-show="importMethod === 'game' && cookieMethod === 'manual'"
            title="Manual Input"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>Follow these steps to manually input your cookie data:</div>
              <div>
                (Using Google Chrome as an example, exact names might vary for
                other browsers but steps will be similar)
              </div>
              <ol class="list-decimal list-inside space-y-2">
                <li>
                  Open your browser's Developer Tools (Press F12 or right-click
                  and select "Inspect")
                </li>
                <li>Go to the "Application" tab</li>
                <li>
                  In the left sidebar, expand "Cookies" and select the Pearpal
                  website
                </li>
                <li>
                  Alternatively, you can use a browser extension for cookies
                  like
                  <a
                    class="text-blue-600 hover:text-blue-800 underline"
                    href="https://cookie-editor.com/"
                    target="_blank"
                    >Cookie Editor</a
                  >
                </li>
                <li>
                  Find and copy the values for:
                  <ul class="list-disc list-inside ml-4">
                    <li>momoNid (for Momo ID field)</li>
                    <li>momoToken (for Momo Token field)</li>
                  </ul>
                </li>
                <li>
                  For UID, go to your Pearpal profile and copy your UID number
                </li>
              </ol>
              <div class="text-sm text-amber-600">
                Note: Never share these cookie values with anyone else!
              </div>
            </div>
          </n-step>
        </n-steps>

        <div class="mt-4">
          <template v-if="importMethod === 'game'">
            <n-form>
              <n-space vertical>
                <n-form-item label="UID">
                  <n-input
                    v-model:value="formData.roleid"
                    placeholder="In-game UID"
                  />
                </n-form-item>
                <n-form-item label="Momo ID">
                  <n-input
                    v-model:value="formData.id"
                    placeholder="momoNid from cookie"
                  />
                </n-form-item>
                <n-form-item label="Momo Token">
                  <n-input
                    v-model:value="formData.token"
                    placeholder="momoToken from cookie"
                  />
                </n-form-item>
              </n-space>
            </n-form>
            <n-space
              align="center"
              class="w-full flex mb-4"
              >Submit data for global stats
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
                    ? `Fetching resonance data, please wait...`
                    : 'Submit and Import Pull History'
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
                    ? `Fetching resonance data, please wait...`
                    : 'Submit and Import Pull History'
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
          Processing banner {{ (progress?.banner ?? 0) - 1 || 0 }} of
          {{ Object.values(bannerData).filter((b) => b.bannerId !== 1).length }}
        </div>
        <div class="text-center mt-4 text-xl text-gray-500">
          Fetching resonance data:
          <span class="font-bold">{{
            bannerData[progress?.banner || 0]?.bannerName || ''
          }}</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
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
