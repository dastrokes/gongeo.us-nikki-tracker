<script setup lang="ts">
  import { ref } from 'vue'
  import type { CookieData } from '~/types/api'
  import {
    useBannerPullApi,
    type Region,
    REGION_LABELS,
  } from '~/composables/useBannerPullApi'
  import { useRouter } from 'vue-router'
  import { useMessage } from 'naive-ui'
  import type { UploadFileInfo } from 'naive-ui'
  import { useBannerPullData } from '~/composables/useBannerPullData'
  import { usePullStore } from '~/stores/pull'
  import { Paste } from '@vicons/fa'

  const formData = ref({
    roleid: '',
    token: '',
    id: '',
  })
  const currentStep = ref(0)
  const router = useRouter()
  const message = useMessage()
  const { verifyAuth, loading, error, selectedRegion, setRegion } =
    useBannerPullApi()
  const {
    fetchAllData,
    isLoading: isFetching,
    error: fetchError,
  } = useBannerPullData()
  const pullStore = usePullStore()

  const regionOptions = Object.entries(REGION_LABELS).map(([value, label]) => ({
    label,
    value: value as Region,
  }))

  const steps = [
    {
      title: 'Select Region',
      content: 'Select your game server region.',
      component: 'region-select',
    },
    {
      title: 'Choose Import Method',
      content: 'Choose how you want to import your pull history.',
      component: 'import-method',
    },
    {
      title: 'Game Import',
      content: 'Import directly from the game using your browser.',
      component: 'game-import',
      showForMethod: 'game',
    },
    {
      title: 'JSON Import',
      content: 'Import from a previously exported JSON file.',
      component: 'json-import',
      showForMethod: 'json',
    },
  ]

  const importMethod = ref<'game' | 'json'>('game')
  const jsonFile = ref<File | null>(null)

  const handleFileChange = (data: {
    file: UploadFileInfo
    fileList: UploadFileInfo[]
  }) => {
    if (data.file.file) {
      jsonFile.value = data.file.file
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const parsedData = JSON.parse(clipboardText) as CookieData

      if (!parsedData.roleid || !parsedData.token || !parsedData.id) {
        throw new Error('Invalid JSON format')
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
        "Failed to parse clipboard data. Please ensure it's valid JSON."
      )
    }
  }

  const handleSubmit = async () => {
    if (!selectedRegion.value) {
      message.error('Please select a region first')
      return
    }

    if (importMethod.value === 'json' && jsonFile.value) {
      try {
        const fileContent = await jsonFile.value.text()
        const jsonData = JSON.parse(fileContent) as Array<{
          banner_id: string | number
          data: {
            datas: Array<[string, string]>
          }
        }>

        // Reset current store state
        pullStore.reset()

        // Process the imported data
        await pullStore.processPullsData(
          jsonData.reduce(
            (
              acc: Record<
                string,
                Array<{ bannerId: string; itemId: string; time: string }>
              >,
              data
            ) => {
              const bannerId = data.banner_id.toString()
              if (!acc[bannerId]) {
                acc[bannerId] = []
              }
              data.data.datas.forEach(([time, itemId]) => {
                acc[bannerId].push({
                  bannerId,
                  itemId,
                  time,
                })
              })
              return acc
            },
            {}
          )
        )

        message.success('Data imported successfully!')
        router.push('/tracker')
      } catch (e) {
        message.error(
          'Failed to import JSON file: ' +
            (e instanceof Error ? e.message : 'Unknown error')
        )
      }
      return
    }

    try {
      const cookieData: CookieData = formData.value
      const success = await verifyAuth(cookieData)

      if (success) {
        message.success('Authentication successful!')
        try {
          await fetchAllData()
          router.push('/tracker')
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
</script>

<template>
  <div class="max-w-3xl mx-auto p-4">
    <n-card title="Authentication Setup">
      <n-steps
        vertical
        :current="currentStep"
        @update:current="currentStep = $event"
      >
        <n-step
          v-for="(step, index) in steps"
          v-show="!step.showForMethod || step.showForMethod === importMethod"
          :key="index"
          :title="step.title"
        >
          <div v-if="step.component === 'region-select'">
            <div class="mb-2">{{ step.content }}</div>
            <n-select
              :value="selectedRegion"
              :options="regionOptions"
              placeholder="Select your region"
              @update:value="setRegion"
            />
          </div>
          <div v-else-if="step.component === 'import-method'">
            <div class="mb-2">{{ step.content }}</div>
            <n-radio-group
              v-model:value="importMethod"
              name="importMethod"
            >
              <n-space>
                <n-radio value="game">Import from Game</n-radio>
                <n-radio value="json">Import from JSON</n-radio>
              </n-space>
            </n-radio-group>
          </div>
          <div v-else-if="step.component === 'json-import'">
            <div class="mb-2">{{ step.content }}</div>
            <n-upload
              accept=".json"
              :max="1"
              :show-file-list="false"
              @change="handleFileChange"
            >
              <n-button>Select JSON File</n-button>
            </n-upload>
            <div
              v-if="jsonFile"
              class="mt-2 text-sm text-gray-600"
            >
              Selected file: {{ jsonFile.name }}
            </div>
          </div>
          <div v-else>
            {{ step.content }}
          </div>
        </n-step>
      </n-steps>

      <div class="mt-8">
        <template v-if="importMethod === 'game'">
          <n-form>
            <n-space vertical>
              <n-form-item label="Role ID">
                <n-input
                  v-model:value="formData.roleid"
                  placeholder="Enter role ID"
                />
              </n-form-item>
              <n-form-item label="Token">
                <n-input
                  v-model:value="formData.token"
                  placeholder="Enter token"
                />
              </n-form-item>
              <n-form-item label="ID">
                <n-input
                  v-model:value="formData.id"
                  placeholder="Enter ID"
                />
              </n-form-item>
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
          </n-form>
        </template>

        <n-button
          class="mt-4"
          type="primary"
          block
          :loading="loading || isFetching"
          @click="handleSubmit"
        >
          {{ isFetching ? 'Fetching pull history...' : 'Submit' }}
        </n-button>
      </div>
    </n-card>
  </div>
</template>
