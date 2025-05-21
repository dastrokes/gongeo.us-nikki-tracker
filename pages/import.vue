<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      v-if="!isMaintenanceMode"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <!-- Show steps only when not fetching -->
      <template v-if="!isFetching">
        <n-steps
          size="small"
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
                <n-space class="flex-wrap">
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
                class="w-full max-w-96"
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
                class="max-w-full"
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

          <!-- Get Cookie Step -->
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
                        class="w-full max-w-60 font-mono text-xs whitespace-pre-wrap rounded"
                      />
                    </template>
                  </n-popconfirm>
                </li>
                <li>{{ $t('import.console_steps.step5') }}</li>
                <li>{{ $t('import.console_steps.step6') }}</li>
                <li>{{ $t('import.console_steps.step7') }}</li>
                <div class="text-sm text-amber-600 break-words">
                  {{ $t('import.security_note') }}
                </div>
              </ol>
              <div class="mt-4">
                <n-input
                  v-model:value="manualPasteInput"
                  type="textarea"
                  :rows="3"
                  placeholder="{'roleid':'123456','token':'eyJhabc123xyz456.eyJhdef789ghi000.abc123def789','id':'654321'}"
                  class="w-full"
                />
                <n-space
                  class="flex mt-2 flex-wrap"
                  align="center"
                >
                  <n-space class="flex-wrap">
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
              <div class="text-sm text-amber-600 break-words">
                {{ $t('import.security_note') }}
              </div>
            </div>
          </n-step>
        </n-steps>

        <div class="mt-4">
          <template v-if="importMethod === 'game'">
            <n-form :show-feedback="false">
              <n-space vertical>
                <n-form-item
                  :label="$t('import.form.uid')"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.roleid"
                    :placeholder="$t('import.form.uid_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <n-form-item
                  :label="$t('import.form.momo_id')"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.id"
                    :placeholder="$t('import.form.momo_id_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <n-form-item
                  :label="$t('import.form.momo_token')"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.token"
                    :placeholder="$t('import.form.momo_token_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <n-form-item
                  :label="$t('import.select_banners')"
                  class="w-full"
                >
                  <n-select
                    v-model:value="selectedBanners"
                    :options="bannerOptions"
                    :placeholder="$t('import.select_banners_desc')"
                    :validate-status="
                      selectedBanners.length > 0 ? 'success' : 'error'
                    "
                    :show-checkmark="false"
                    multiple
                    clearable
                    :render-label="renderBannerLabel"
                    :render-tag="renderBannerTag"
                    @update:value="handleBannerSelectionChange"
                  />
                </n-form-item>
              </n-space>
            </n-form>
            <n-space
              align="center"
              class="w-full flex my-4 flex-wrap"
            >
              <span>{{ $t('import.form.submit_global_stats') }}</span>
              <n-switch
                v-model:value="submitGlobalStats"
                class="flex-shrink-0"
              />
            </n-space>
            <n-space class="w-full flex">
              <n-button
                v-if="importMethod === 'game'"
                type="primary"
                :loading="loading || isFetching"
                class="flex-grow"
                :disabled="isSubmitDisabled"
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
                v-if="importMethod === 'json'"
                type="primary"
                :loading="loading || isFetching"
                class="flex-grow"
                @click="handleJsonSubmit"
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
              current: currentBannerIndex + 1 || 0,
              total: selectedBanners.length,
            })
          }}
        </div>
        <div class="text-center mt-4 text-xl text-gray-500">
          {{
            $t('import.progress.fetching_data', {
              banner: progress?.banner
                ? t(`banner.${progress?.banner}.name`)
                : '',
            })
          }}
        </div>
      </div>
    </n-card>

    <n-card
      v-if="isMaintenanceMode"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center mb-12">
        <n-h1 class="font-bold mb-4">{{ $t('maintenance.title') }}</n-h1>
        <p class="text-lg">
          {{ $t('maintenance.message') }}
        </p>
        <p class="text-lg">
          {{ $t('maintenance.status') }}
        </p>
      </div>

      <n-space
        justify="center"
        class="mt-12"
      >
        <n-button
          tag="a"
          href="https://discord.gg/qymsW3j4Zw"
          target="_blank"
        >
          <template #icon>
            <n-icon><Discord /></n-icon>
          </template>
          Discord
        </n-button>
        <n-button
          tag="a"
          href="https://ko-fi.com/dastrokes"
          target="_blank"
        >
          <template #icon>
            <n-icon>
              <KoFi />
            </n-icon>
          </template>
          Ko-fi
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, h } from 'vue'
  import type { CookieData } from '~/types/api'
  import type { PullRecord } from '~/types/pull'
  import { useBannerPullApi } from '~/composables/useBannerPullApi'
  import { useMessage, NTag, NIcon } from 'naive-ui'
  import type {
    UploadFileInfo,
    SelectOption,
    SelectGroupOption,
  } from 'naive-ui'
  import { useBannerPullData } from '~/composables/useBannerPullData'
  import { usePullStore } from '~/stores/pull'
  import { useUserStore, Region } from '~/stores/user'
  import { Paste, Check, CheckCircle, Discord } from '@vicons/fa'
  import KoFi from '~/components/icons/KoFi.vue'
  import { BANNER_DATA } from '~/data/banners'
  import { useCardStyle } from '~/composables/useCardStyle'
  import type { VNodeChild } from 'vue'

  const { t } = useI18n()
  const isMaintenanceMode = true

  const REGION_LABELS = {
    [Region.AMERICA]: t('common.regions.america'),
    [Region.EUROPE]: t('common.regions.europe'),
    [Region.CHINA]: t('common.regions.china'),
    [Region.TW]: t('common.regions.tw'),
    [Region.ASIA]: t('common.regions.asia'),
  } as const

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
  const { verifyAuth, loading } = useBannerPullApi()
  const userStore = useUserStore()
  const { fetchAllData, isFetching, processJsonImport, progress } =
    useBannerPullData()
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

  // Calculate progress percentage for the progress bar
  const progressPercentage = computed(() => {
    if (!progress.value || !progress.value.banner) return 0

    // Get the index of current banner in selected banners
    const currentBannerIndex = selectedBanners.value.indexOf(
      progress.value.banner
    )

    // If banner not found in selection or no banners selected, return 0
    if (currentBannerIndex === -1 || selectedBanners.value.length === 0)
      return 0

    // Calculate percentage based on current banner index and total selected banners
    return Math.round(
      ((currentBannerIndex + 1) / selectedBanners.value.length) * 100
    )
  })

  // Computed property for current banner index
  const currentBannerIndex = computed(() => {
    if (!progress.value?.banner) return -1
    return selectedBanners.value.indexOf(progress.value.banner)
  })

  const regionOptions = Object.entries(REGION_LABELS).map(([value, label]) => ({
    label,
    value: value as Region,
  }))

  const importMethod = ref<'game' | 'json'>('game')
  const cookieMethod = ref<'console' | 'manual'>('console')
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
        'Failed to parse clipboard data. Please paste manually or fill in the form'
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
        'Failed to parse input data. Please ensure it is valid file format'
      )
    }
  }

  const selectedBanners = ref<number[]>([])

  // Create banner options for the select component
  const allBannerIds = computed(() => {
    return Object.values(BANNER_DATA)
      .map((banner) => banner.bannerId)
      .sort((a, b) => b - a) // Sort by bannerId in descending order
  })

  const newBannerIds = computed(() => {
    const now = new Date()
    return allBannerIds.value.filter((bannerId) => {
      const banner = BANNER_DATA[bannerId]
      if (!banner || !banner.runs || banner.runs.length === 0) return false

      const currentRun = banner.runs[banner.runs.length - 1] // Get the latest run
      const startDate = new Date(currentRun.start)
      const endDate = new Date(currentRun.end)

      return now >= startDate && now <= endDate
    })
  })

  const bannerOptions = computed(() => {
    const standardOptions = allBannerIds.value.map((bannerId) => ({
      label: t(`banner.${bannerId}.name`),
      value: bannerId,
    }))

    return [
      {
        type: 'group',
        label: t('import.banner_groups.quick_select'),
        key: 'quick_select',
        children: [
          {
            label: t('import.banner_groups.current_banners'),
            value: 'current',
            type: 'quick',
          },
          {
            label: t('import.banner_groups.limited_banners'),
            value: 'limited',
            type: 'quick',
          },
          {
            label: t('import.banner_groups.permanent_banners'),
            value: 'permanent',
            type: 'quick',
          },
        ],
      },
      {
        type: 'group',
        label: t('import.banner_groups.individual'),
        key: 'individual',
        children: standardOptions,
      },
    ]
  })

  // Handle banner selection changes
  const handleBannerSelectionChange = (values: (number | string)[]) => {
    const processedValues = values.reduce<number[]>((acc, value) => {
      if (value === 'all') {
        return allBannerIds.value
      } else if (value === 'current') {
        return [...newBannerIds.value]
      } else if (value === 'limited') {
        return allBannerIds.value.filter((id) => id !== 1)
      } else if (value === 'permanent') {
        return [1]
      } else if (typeof value === 'number') {
        return [...new Set([...acc, value])]
      }
      return acc
    }, [])

    selectedBanners.value = [...new Set(processedValues)].sort((a, b) => b - a)
  }

  const isSubmitDisabled = computed(() => {
    const hasEmptyFields =
      !formData.value.roleid.trim() ||
      !formData.value.token.trim() ||
      !formData.value.id.trim()
    return (
      selectedBanners.value.length === 0 ||
      loading.value ||
      isFetching.value ||
      hasEmptyFields
    )
  })

  const handleSubmit = async () => {
    try {
      const cookieData: CookieData = formData.value
      const success = await verifyAuth(cookieData)

      if (success) {
        message.success('Authentication successful!')
        userStore.setUid(formData.value.roleid)

        try {
          await fetchAllData(selectedBanners.value)

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
          message.error('Failed to fetch pull history')
        }
      } else {
        message.error('Authentication failed')
      }
    } catch (error) {
      console.error(error)
      message.error('Invalid form data')
    }
  }

  const handleJsonSubmit = async () => {
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
      console.error(e)
      message.error('Failed to import file')
    }
  }

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

  // Add renderBannerLabel function
  const renderBannerLabel = (
    option: SelectOption | SelectGroupOption,
    selected: boolean
  ): VNodeChild => {
    if ('type' in option && option.type === 'quick') {
      return h(
        NTag,
        {
          round: true,
          size: 'small',
          bordered: false,
          type: 'default',
        },
        {
          default: () => [
            h('span', { class: 'align-top' }, option.label as string),
            selected &&
              h('span', { class: 'ml-1' }, [
                h(NIcon, null, { default: () => h(CheckCircle) }),
              ]),
          ],
        }
      )
    }

    if (typeof option.value === 'number') {
      const banner = BANNER_DATA[option.value]
      if (!banner) return option.label as VNodeChild
      const bannerType = banner?.bannerType

      return [
        h(
          NTag,
          {
            round: true,
            size: 'small',
            bordered: false,
            type: selected ? 'success' : bannerType === 3 ? 'info' : 'warning',
          },
          {
            default: () => [
              h('span', option.label as string),
              selected &&
                h('span', { class: 'ml-1' }, [
                  h(NIcon, null, { default: () => h(CheckCircle) }),
                ]),
            ],
          }
        ),
      ]
    }

    return option.label as VNodeChild
  }

  // Add renderBannerTag function
  const renderBannerTag = ({
    option,
    handleClose,
  }: {
    option: SelectOption
    handleClose: () => void
  }): VNodeChild => {
    const banner = BANNER_DATA[(option?.value as number) || 0]
    if (!banner) return option.label as VNodeChild
    const bannerType = banner?.bannerType

    return h(
      NTag,
      {
        round: true,
        size: 'small',
        closable: true,
        bordered: false,
        type: bannerType === 3 ? 'info' : 'warning',
        onMousedown: (e: FocusEvent) => {
          e.preventDefault()
        },
        onClose: (e: MouseEvent) => {
          e.stopPropagation()
          handleClose()
        },
      },
      {
        default: () => option.label as VNodeChild,
      }
    )
  }
</script>
