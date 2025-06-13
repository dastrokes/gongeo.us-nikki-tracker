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
          <n-step :title="$t('import.choose_method')">
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
                class="w-full max-w-xs"
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
                :show-checkmark="false"
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
                  class="text-blue-500 hover:text-blue-800 underline"
                  href="https://myl.nuanpaper.com/home"
                  target="_blank"
                  >{{ $t('import.pearpal_website') }}</a
                >
              </div>
              <div v-else>
                {{ $t('import.login_pearpal_desc') }}
                <a
                  class="text-blue-500 hover:text-blue-800 underline"
                  href="https://pearpal.infoldgames.com/en/home"
                  target="_blank"
                  >{{ $t('import.pearpal_website') }}</a
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
                  <template v-if="isMobileOrTablet">
                    <n-radio value="bookmark">{{
                      $t('import.bookmark_method_mobile')
                    }}</n-radio>
                  </template>
                  <template v-else>
                    <n-radio value="bookmark">{{
                      $t('import.bookmark_method')
                    }}</n-radio>
                    <n-radio value="console">{{
                      $t('import.console_method')
                    }}</n-radio>
                    <n-radio value="manual">{{
                      $t('import.manual_input')
                    }}</n-radio>
                  </template>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- Bookmark Method Step -->
          <n-step
            v-show="importMethod === 'game' && cookieMethod === 'bookmark'"
            :title="
              isMobileOrTablet
                ? $t('import.bookmark_method_mobile')
                : $t('import.bookmark_method')
            "
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>{{ $t('import.title') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <template v-if="isMobileOrTablet">
                  <n-button
                    size="small"
                    class="ml-2"
                    secondary
                    @click="showCompatibilityDialog"
                  >
                    <template #icon>
                      <n-icon size="16"><ExclamationCircle /></n-icon>
                    </template>
                    {{ $t('import.check_compatibility') }}
                  </n-button>
                  <li>
                    {{ $t('import.bookmark_steps_mobile.step1') }}
                    <n-button
                      size="small"
                      @click="showCodeDialog(bookmarkScript)"
                    >
                      <template #icon>
                        <n-icon size="16"><Copy /></n-icon>
                      </template>
                      {{ $t('import.actions.copy_code') }}
                    </n-button>
                  </li>
                  <li>{{ $t('import.bookmark_steps_mobile.step2') }}</li>
                  <li>
                    {{ $t('import.bookmark_steps_mobile.step3') }}
                  </li>
                  <li>{{ $t('import.bookmark_steps_mobile.step4') }}</li>
                  <li v-if="isAndroid && isChrome">
                    {{
                      $t('import.bookmark_steps_mobile.step5_android_chrome')
                    }}
                  </li>
                  <li v-if="isAndroid && isChrome">
                    {{
                      $t('import.bookmark_steps_mobile.step5_android_chrome_2')
                    }}
                  </li>
                  <li v-else>{{ $t('import.bookmark_steps_mobile.step5') }}</li>
                  <li>{{ $t('import.bookmark_steps_mobile.step6') }}</li>
                  <li>{{ $t('import.bookmark_steps_mobile.step7') }}</li>
                  <div>{{ $t('import.bookmark_steps.tip') }}</div>
                </template>
                <template v-else>
                  <li>
                    {{ $t('import.bookmark_steps.step1') }}
                    <n-button
                      tag="a"
                      :href="bookmarkScript"
                      class="ml-2"
                      size="small"
                      @click.prevent
                    >
                      <template #icon>
                        <n-icon size="16"><Bookmark /></n-icon>
                      </template>
                      {{ $t('import.gongeous_cookie') }}
                    </n-button>
                  </li>
                  <li>{{ $t('import.bookmark_steps.step2') }}</li>
                  <li>{{ $t('import.bookmark_steps.step3') }}</li>
                  <li>{{ $t('import.bookmark_steps.step4') }}</li>
                  <li>{{ $t('import.bookmark_steps.step5') }}</li>
                  <div>{{ $t('import.bookmark_steps.tip') }}</div>
                </template>
                <div class="text-sm text-amber-500 break-words">
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
              <div>{{ $t('import.title') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <li>{{ $t('import.console_steps.step1') }}</li>
                <li>{{ $t('import.console_steps.step2') }}</li>
                <li>{{ $t('import.console_steps.step3') }}</li>
                <li>
                  {{ $t('import.console_steps.step4') }}
                  <n-button
                    size="small"
                    @click="showCodeDialog(consoleScript)"
                  >
                    {{ $t('import.actions.copy_code') }}
                  </n-button>
                </li>
                <li>{{ $t('import.console_steps.step5') }}</li>
                <li>{{ $t('import.console_steps.step6') }}</li>
                <li>{{ $t('import.console_steps.step7') }}</li>
                <div class="text-sm text-amber-500 break-words">
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
              <div>{{ $t('import.title') }}</div>
              <div>{{ $t('import.manual_steps.note') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <li>{{ $t('import.manual_steps.step1') }}</li>
                <li>{{ $t('import.manual_steps.step2') }}</li>
                <li>{{ $t('import.manual_steps.step3') }}</li>
                <li>{{ $t('import.manual_steps.step4') }}</li>
                <li>{{ $t('import.manual_steps.step5') }}</li>
                <li>
                  {{ $t('import.manual_steps.step6') }}
                  <ul class="list-disc list-inside ml-4">
                    <li>{{ $t('import.manual_steps.step6_items.momo_id') }}</li>
                    <li>
                      {{ $t('import.manual_steps.step6_items.momo_token') }}
                    </li>
                  </ul>
                </li>
                <li>{{ $t('import.manual_steps.step7') }}</li>
              </ol>
              <div class="text-sm text-amber-500 break-words">
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
              <div>{{ $t('import.form.submit_global_stats') }}</div>
              <n-switch
                v-model:value="submitGlobalStats"
                class="flex-shrink-0"
              />
            </n-space>
            <n-space class="w-full flex my-4">
              <div class="text-sm text-amber-500 break-words">
                {{
                  $t('import.data_note', {
                    date: daysAgoFormatted(180),
                  })
                }}
              </div></n-space
            >
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
  import { useDebounce } from '@vueuse/core'
  import type { CookieData } from '~/types/api'
  import type { PullRecord } from '~/types/pull'
  import { useBannerPullApi } from '~/composables/useBannerPullApi'
  import { useMessage, NTag, NIcon, NCode, useDialog } from 'naive-ui'
  import type {
    UploadFileInfo,
    SelectOption,
    SelectGroupOption,
  } from 'naive-ui'
  import { useBannerPullData } from '~/composables/useBannerPullData'
  import { useUserStore, Region } from '~/stores/user'
  import {
    Copy,
    Paste,
    Check,
    CheckCircle,
    Discord,
    Bookmark,
    ExclamationCircle,
  } from '@vicons/fa'
  import KoFi from '~/components/icons/KoFi.vue'
  import { BANNER_DATA } from '~/data/banners'
  import { useCardStyle } from '~/composables/useCardStyle'
  import type { VNodeChild } from 'vue'
  import { useUserBannerStats } from '~/composables/useUserBannerStats'
  import { useRouter } from 'vue-router'

  const { t } = useI18n()
  const dialog = useDialog()
  const isMaintenanceMode = false
  const router = useRouter()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl
  const { isMobileOrTablet, isAndroid, isChrome } = useDevice()

  useHead({
    title: t('navigation.import') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.import'),
      },
      {
        property: 'og:title',
        content: t('navigation.import') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.import'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.import') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.import'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/import')}` }],
  })

  const REGION_LABELS = {
    [Region.AMERICA]: t('common.regions.america'),
    [Region.EUROPE]: t('common.regions.europe'),
    [Region.CHINA]: t('common.regions.china'),
    [Region.ASIA]: t('common.regions.asia'),
    [Region.TW]: t('common.regions.tw'),
  } as const

  const consoleScript = `console.log(JSON.stringify({roleid:[...document.querySelectorAll('div')].find(el=>el.textContent.startsWith('UID:'))?.textContent.replace('UID:','').trim(),token:document.cookie.match(/momoToken=([^;]+)/)?.[1],id:document.cookie.match(/momoNid=([^;]+)/)?.[1]}));`

  const bookmarkScript = `javascript:(function(){if(location.hostname!=="pearpal.infoldgames.com" && location.hostname!=="myl.nuanpaper.com"){alert(${JSON.stringify(t('import.bookmark_script.invalid_site'))});return}prompt('Cookie:',JSON.stringify({roleid:[...document.querySelectorAll('div')].find(el=>el.textContent.startsWith('UID:'))?.textContent.replace('UID:','').trim(),token:document.cookie.match(/momoToken=([^;]+)/)?.[1],id:document.cookie.match(/momoNid=([^;]+)/)?.[1]}));})();`

  const copyToClipboard = async (code: string) => {
    try {
      await window?.navigator?.clipboard?.writeText(code)
      message.success(t('import.messages.code_copied'))
    } catch {
      message.error(t('import.messages.code_copy_failed'))
    }
  }

  const formData = ref({
    roleid: '',
    token: '',
    id: '',
  })
  const manualPasteInput = ref('')
  const debouncedManualPasteInput = useDebounce(manualPasteInput, 500)
  const currentStep = ref(0)
  const message = useMessage()
  const { verifyAuth, loading } = useBannerPullApi()
  const userStore = useUserStore()
  const {
    fetchBannerPullData,
    processBannerPullData,
    isFetching,
    processJsonImport,
    progress,
  } = useBannerPullData()
  const { cardStyle } = useCardStyle()

  // Function to determine region based on timezone
  const determineRegionFromTimezone = () => {
    const timezone = Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.toLowerCase()

    if (
      timezone.includes('china') ||
      timezone.includes('shanghai') ||
      timezone.includes('beijing')
    ) {
      return Region.CHINA
    } else if (timezone.includes('taipei') || timezone.includes('hong_kong')) {
      return Region.TW
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
    } else if (
      timezone.includes('asia') ||
      timezone.includes('tokyo') ||
      timezone.includes('seoul') ||
      timezone.includes('singapore')
    ) {
      return Region.ASIA
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
  const cookieMethod = ref<'bookmark' | 'console' | 'manual'>('bookmark')
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
    } catch {
      message.error(t('import.messages.data_paste_failed'))
    }
  }

  const showCompatibilityDialog = () => {
    dialog.create({
      title: t('import.supported_browsers'),
      icon: () =>
        h(NIcon, { size: 20 }, { default: () => h(ExclamationCircle) }),
      contentClass: 'max-h-[50vh]',
      content: () =>
        h('div', { class: 'max-w-xs p-1' }, [
          h(
            'div',
            { class: 'text-amber-500 mb-4' },
            t('import.pc_recommended')
          ),
          h('div', { class: 'grid grid-cols-2 gap-2' }, [
            h('div', [
              h('span', { class: 'font-medium' }, 'Android:'),
              h('ul', { class: 'list-disc list-inside' }, [
                h('li', t('import.supported_browsers_list.chrome')),
                h('li', t('import.supported_browsers_list.firefox')),
              ]),
            ]),
            h('div', [
              h('span', { class: 'font-medium' }, 'iOS:'),
              h('ul', { class: 'list-disc list-inside' }, [
                h('li', t('import.supported_browsers_list.chrome')),
                h('li', t('import.supported_browsers_list.firefox')),
                h('li', t('import.supported_browsers_list.safari')),
              ]),
            ]),
          ]),
        ]),
      positiveText: t('common.captions.ok'),
    })
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
      !formData.value.roleid?.trim() ||
      !formData.value.token?.trim() ||
      !formData.value.id?.trim()
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
        message.success(t('import.messages.auth_success'))
        userStore.setUid(formData.value.roleid)

        const { sendUserBannerStats } = useUserBannerStats()

        try {
          const pullsByBanner = await fetchBannerPullData(selectedBanners.value)
          router.push(localePath('/tracker'))

          if (pullsByBanner) {
            const { processedPulls } = processBannerPullData(pullsByBanner)

            // Send analytics only if enabled and there are actual pulls
            if (
              submitGlobalStats.value &&
              Object.values(processedPulls).some(
                (banner) => banner.stats.totalPulls > 0
              )
            ) {
              try {
                await sendUserBannerStats(processedPulls)
              } catch {
                message.error(t('import.messages.stats_submit_failed'))
              }
            }
          }
        } catch {
          message.error(t('import.messages.fetch_history_failed'))
        }
      } else {
        message.error(t('import.messages.auth_failed'))
      }
    } catch (error) {
      console.error(error)
      message.error(t('import.messages.invalid_form'))
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

      await processJsonImport(jsonData)
      router.push(localePath('/tracker'))
      message.success(t('import.messages.import_success'))
    } catch (e) {
      console.error(e)
      message.error(t('import.messages.import_failed'))
    }
  }

  watch(debouncedManualPasteInput, (newValue) => {
    if (newValue) {
      try {
        if (!newValue.replace(/\s+/g, '')) {
          throw new Error('No data in clipboard')
        }

        const parsedData = JSON.parse(newValue) as CookieData

        if (!parsedData.token || !parsedData.id) {
          throw new Error('Invalid file format')
        }

        formData.value = {
          roleid: parsedData.roleid,
          token: parsedData.token,
          id: parsedData.id,
        }
        if (!parsedData.roleid) {
          message.success(t('import.messages.data_paste_success'))
          message.info(t('import.messages.data_paste_success_no_uid'))
        } else {
          message.success(t('import.messages.data_paste_success'))
        }
      } catch (error) {
        // Don't show error message on every keystroke
        if (newValue.length > 10) {
          // Only show error if input is reasonably long
          console.warn(`Invalid data input`, error)
          message.error(t('import.messages.data_paste_failed'))
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

  const showCodeDialog = (code: string) => {
    dialog.create({
      title: t('import.actions.copy_code'),
      icon: () => h(NIcon, { size: 20 }, { default: () => h(Copy) }),
      contentClass: 'max-h-[50vh]',
      content: () =>
        h('div', [
          h(NCode, {
            code,
            language: 'javascript',
            wordWrap: true,
            class: 'w-full font-mono text-xs whitespace-pre-wrap rounded',
            id: 'code-to-copy',
          }),
        ]),
      positiveText: t('import.actions.copy'),
      negativeText: t('import.actions.select_all'),
      onPositiveClick: () => copyToClipboard(code),
      onNegativeClick: () => {
        selectAllText()
        return false
      },
    })
  }

  const selectAllText = () => {
    const codeEl = document.getElementById('code-to-copy')
    if (codeEl) {
      const range = document.createRange()
      range.selectNodeContents(codeEl)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  const daysAgoFormatted = (days: number) => {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
</script>
