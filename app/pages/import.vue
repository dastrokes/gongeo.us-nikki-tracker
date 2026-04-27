<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      v-if="!isMaintenance"
      size="small"
      class="rounded-xl p-0 sm:p-2"
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
                  <n-radio value="pearpal">{{
                    $t('import.import_from_pearpal')
                  }}</n-radio>
                  <n-radio value="json">{{
                    $t('import.import_from_file')
                  }}</n-radio>
                  <n-radio value="manual">{{
                    t('tracker.manual_log.title')
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
                show-file-list
                class="w-full max-w-xs"
                @change="handleFileChange"
              >
                <n-button>{{ $t('import.select_file') }}</n-button>
              </n-upload>
            </div>
          </n-step>

          <!-- Video Tutorial Step -->
          <n-step
            v-show="importMethod === 'game' || importMethod === 'pearpal'"
            :title="$t('import.video_tutorial')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-4">
                {{ $t('import.video_tutorial_desc') }}
              </div>
              <n-space class="flex-wrap gap-4">
                <n-button
                  secondary
                  class="flex items-center gap-2"
                  @click="
                    () => {
                      showBilibiliModal = false
                      showYouTubeModal = true
                    }
                  "
                >
                  <template #icon>
                    <n-icon size="20">
                      <Youtube />
                    </n-icon>
                  </template>
                  {{ $t('import.watch_on_youtube') }}
                </n-button>

                <n-button
                  secondary
                  class="flex items-center gap-2"
                  @click="
                    () => {
                      showYouTubeModal = false
                      showBilibiliModal = true
                    }
                  "
                >
                  <template #icon>
                    <SvgIcon
                      name="bilibili"
                      class="w-5 h-5"
                    />
                  </template>
                  {{ $t('import.watch_on_bilibili') }}
                </n-button>
              </n-space>
            </div>
          </n-step>

          <!-- Region Select Step -->
          <n-step
            v-show="importMethod === 'pearpal' || importMethod === 'game'"
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
                @update:value="(value) => userStore.setRegion(value as Region)"
              />
            </div>
          </n-step>

          <!-- Login to Pearpal Step -->
          <n-step
            v-show="importMethod === 'pearpal' || importMethod === 'game'"
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
                  >{{ $t('common.sources.pearpal_website') }}</a
                >
                <br />
                {{ $t('import.login_pearpal_incognito_hint') }}
              </div>
              <div v-else>
                {{ $t('import.login_pearpal_desc') }}
                <a
                  class="text-blue-500 hover:text-blue-800 underline"
                  href="https://pearpal.infoldgames.com/en/home"
                  target="_blank"
                  >{{ $t('common.sources.pearpal_website') }}</a
                >
                <br />
                {{ $t('import.login_pearpal_incognito_hint') }}
              </div>
            </div>
          </n-step>

          <!-- Login to Whim-Log Step -->
          <n-step
            v-show="importMethod === 'pearpal'"
            :title="$t('import.login_whimlog')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div v-if="userStore.getRegion === Region.CHINA">
                {{ $t('import.login_whimlog') }}
                <a
                  class="text-blue-500 hover:text-blue-800 underline"
                  href="https://myl.nuanpaper.com/tools/journal"
                  target="_blank"
                  >{{ $t('common.sources.whimlog') }}</a
                >
              </div>
              <div v-else>
                {{ $t('import.login_whimlog_desc') }}
                <a
                  class="text-blue-500 hover:text-blue-800 underline"
                  href="https://pearpal.infoldgames.com/tools/journal"
                  target="_blank"
                  >{{ $t('common.sources.whimlog') }}</a
                >
              </div>
            </div>
          </n-step>

          <!-- Get Cookie Step -->
          <n-step
            v-show="importMethod === 'pearpal' || importMethod === 'game'"
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
                  <ClientOnly>
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
                    <template #fallback>
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
                  </ClientOnly>
                </n-space>
              </n-radio-group>
            </div>
          </n-step>

          <!-- Bookmark Method Step -->
          <n-step
            v-show="
              (importMethod === 'pearpal' || importMethod === 'game') &&
              cookieMethod === 'bookmark'
            "
          >
            <template #title>
              <ClientOnly>
                <template v-if="isMobileOrTablet">
                  {{ $t('import.bookmark_method_mobile') }}
                </template>
                <template v-else>
                  {{ $t('import.bookmark_method') }}
                </template>
                <template #fallback>
                  {{ $t('import.bookmark_method') }}
                </template>
              </ClientOnly>
            </template>
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div class="space-y-2">
              <div>{{ $t('import.title') }}</div>
              <ol class="list-decimal list-inside space-y-2">
                <ClientOnly>
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
                    <li>{{ $t('import.bookmark_steps.step2') }}</li>
                    <li v-if="isAndroid && isChrome">
                      {{
                        $t('import.bookmark_steps_mobile.step5_android_chrome')
                      }}
                    </li>
                    <li v-if="isAndroid && isChrome">
                      {{
                        $t(
                          'import.bookmark_steps_mobile.step5_android_chrome_2'
                        )
                      }}
                    </li>
                    <li v-else>
                      {{ $t('import.bookmark_steps.step3') }}
                    </li>
                    <li>{{ $t('import.bookmark_steps.step4') }}</li>
                    <li>{{ $t('import.bookmark_steps.step5') }}</li>
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
                  <template #fallback>
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
                </ClientOnly>
                <div class="text-sm text-amber-500 wrap-break-word">
                  {{ $t('import.security_note') }}
                </div>
              </ol>
              <div class="mt-4">
                <n-input
                  v-model:value="cookieInput"
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
                      @click="handleCookiePaste"
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
            v-show="
              (importMethod === 'pearpal' || importMethod === 'game') &&
              cookieMethod === 'console'
            "
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
                <li>{{ $t('import.bookmark_steps.step2') }}</li>
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
                <li>{{ $t('import.bookmark_steps.step5') }}</li>
                <div class="text-sm text-amber-500 wrap-break-word">
                  {{ $t('import.security_note') }}
                </div>
              </ol>
              <div class="mt-4">
                <n-input
                  v-model:value="cookieInput"
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
                      @click="handleCookiePaste"
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
            v-show="
              (importMethod === 'pearpal' || importMethod === 'game') &&
              cookieMethod === 'manual'
            "
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
                <li>{{ $t('import.bookmark_steps.step2') }}</li>
                <li>{{ $t('import.console_steps.step2') }}</li>
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
              <div class="text-sm text-amber-500 wrap-break-word">
                {{ $t('import.security_note') }}
              </div>
            </div>
          </n-step>

          <!-- Manual Collection Step -->
          <n-step
            v-show="importMethod === 'manual'"
            :title="t('tracker.manual_log.title')"
          >
            <template #icon>
              <n-icon>
                <Check />
              </n-icon>
            </template>
            <div>
              <div class="mb-2">
                {{ t('tracker.manual_log.description') }}
              </div>
              <div class="mb-2">
                {{ t('tracker.manual_log.note') }}
              </div>
              <n-space vertical>
                <n-select
                  v-model:value="selectedManualBanner"
                  :options="individualBannerOptions"
                  :show-checkmark="false"
                  :placeholder="t('tracker.manual_log.select_banner')"
                  filterable
                  class="w-full"
                />
                <n-button
                  :disabled="!selectedManualBanner"
                  @click="showCollectionEditor = true"
                >
                  {{ t('tracker.manual_log.open_editor') }}
                </n-button>
              </n-space>
            </div>
          </n-step>
        </n-steps>

        <div class="mt-4">
          <!-- Shared Authentication Form -->
          <template
            v-if="importMethod === 'game' || importMethod === 'pearpal'"
          >
            <n-form :show-feedback="false">
              <n-space vertical>
                <n-form-item
                  label="UID"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.roleid"
                    :placeholder="$t('import.form.uid_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <n-form-item
                  label="Momo ID"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.id"
                    :placeholder="$t('import.form.momo_id_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <n-form-item
                  label="Momo Token"
                  class="w-full"
                >
                  <n-input
                    v-model:value="formData.token"
                    :placeholder="$t('import.form.momo_token_placeholder')"
                    class="max-w-full"
                  />
                </n-form-item>
                <!-- Banner selection for both game and pearpal import -->
                <n-form-item
                  v-if="importMethod === 'game' || importMethod === 'pearpal'"
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
                    filterable
                    :render-label="renderBannerLabel"
                    :render-tag="renderBannerTag"
                    @update:value="handleBannerSelectionChange"
                  />
                </n-form-item>
              </n-space>
            </n-form>

            <!-- Data note only for game import -->
            <n-space
              v-if="importMethod === 'game'"
              class="w-full flex my-4"
            >
              <div class="text-sm text-amber-500 wrap-break-word">
                {{
                  $t('import.data_note', {
                    date: daysAgoFormatted(180),
                  })
                }}
              </div>
            </n-space>

            <!-- Global stats toggle -->
            <n-space
              align="center"
              class="w-full flex my-4 flex-wrap"
            >
              <div>{{ $t('import.form.submit_global_stats') }}</div>
              <n-switch
                v-model:value="submitGlobalStats"
                class="shrink-0"
              />
            </n-space>

            <!-- Submit button -->
            <n-space class="w-full flex">
              <n-button
                type="primary"
                :loading="
                  loading ||
                  isFetching ||
                  (importMethod === 'pearpal' && pearpalTrackerLoading)
                "
                class="relative grow overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
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

          <!-- JSON Import -->
          <template v-else-if="importMethod === 'json'">
            <n-space class="w-full flex">
              <n-button
                type="primary"
                :loading="loading || isFetching"
                class="relative grow overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
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

          <!-- Manual Import -->
          <template v-else-if="importMethod === 'manual'">
            <n-space class="w-full flex">
              <n-button
                type="primary"
                class="relative grow overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
                @click="navigateTo(localePath('/tracker'))"
              >
                {{ $t('navigation.tracker') }}
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
          show-indicator
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
      v-if="isMaintenance"
      size="small"
      class="rounded-xl p-0 sm:p-2"
    >
      <n-result
        size="small"
        status="warning"
        :title="$t('import.maintenance.title')"
        :description="
          $t('import.maintenance.message') +
          ' ' +
          $t('import.maintenance.status')
        "
      >
        <template #icon>
          <NuxtImg
            :src="getImageSrc('emote', 'note')"
            :alt="$t('import.maintenance.title')"
            class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
            preset="iconLg"
            fit="cover"
            sizes="160px sm:200px"
          />
        </template>
        <template #footer>
          <SocialLinks />
        </template>
      </n-result>
    </n-card>

    <!-- Collection Editor Modal -->
    <n-modal
      v-model:show="showCollectionEditor"
      class="w-full max-w-5xl"
      transform-origin="center"
    >
      <template #default>
        <CollectionEditor
          :banner-id="selectedManualBanner"
          @close="showCollectionEditor = false"
        />
      </template>
    </n-modal>

    <!-- YouTube Video Modal -->
    <n-modal
      v-model:show="showYouTubeModal"
      class="w-full max-w-4xl mx-auto pointer-events-auto"
      size="small"
      preset="card"
      :show-mask="false"
      :mask-closable="false"
      :unstable-show-mask="false"
      transform-origin="center"
      draggable
    >
      <iframe
        class="w-full aspect-video"
        src="https://www.youtube.com/embed/r4JL3nK9ds4"
        title="YouTube"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
          web-share;
        "
        allowfullscreen
      ></iframe>
    </n-modal>

    <!-- Bilibili Video Modal -->
    <n-modal
      v-model:show="showBilibiliModal"
      class="w-full max-w-4xl mx-auto pointer-events-auto"
      size="small"
      preset="card"
      :show-mask="false"
      :mask-closable="false"
      transform-origin="center"
      draggable
    >
      <iframe
        class="w-full aspect-video"
        src="https://player.bilibili.com/player.html?bvid=BV1gFYqz9Euh&page=1&autoplay=0"
        title="Bilibili"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { NTag, NIcon, NCode } from 'naive-ui'
  import type {
    UploadFileInfo,
    SelectOption,
    SelectGroupOption,
  } from 'naive-ui'
  import {
    Copy,
    Paste,
    Check,
    CheckCircle,
    Bookmark,
    ExclamationCircle,
    Youtube,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import { IMPORT_PAGE_MAINTENANCE } from '~~/data/config'
  import type { VNodeChild } from 'vue'

  const { t } = useI18n()
  const dialog = useDialog()
  const localePath = useLocalePath()
  const { isMobileOrTablet, isAndroid, isChrome } = useDevice()
  const { getImageSrc } = imageProvider()
  // Manual collection editor variables
  const selectedManualBanner = ref<number | null>(null)
  const showCollectionEditor = ref(false)

  // Video modal variables
  const showYouTubeModal = ref(false)
  const showBilibiliModal = ref(false)

  const isMaintenance = ref(IMPORT_PAGE_MAINTENANCE)

  useSeoMeta({
    title: () =>
      `${t('navigation.import')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.import'),
    ogTitle: () =>
      `${t('navigation.import')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.import'),
    twitterTitle: () =>
      `${t('navigation.import')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.import'),
  })

  const REGION_LABELS = computed<Record<Region, string>>(() => ({
    [Region.AMERICA]: t('import.regions.america'),
    [Region.EUROPE]: t('import.regions.europe'),
    [Region.CHINA]: t('import.regions.china'),
    [Region.ASIA]: t('import.regions.asia'),
    [Region.TW]: t('import.regions.tw'),
  }))

  const regionValues = [
    Region.AMERICA,
    Region.EUROPE,
    Region.CHINA,
    Region.ASIA,
    Region.TW,
  ] as const

  const consoleScript = `console.log(JSON.stringify({roleid:[...document.querySelectorAll('div')].find(el=>el.textContent.startsWith('UID:'))?.textContent.replace('UID:','').trim(),token:document.cookie.match(/momoToken=([^;]+)/)?.[1],id:document.cookie.match(/momoNid=([^;]+)/)?.[1]}));`

  const bookmarkScript = computed(
    () =>
      `javascript:(function(){if(location.hostname!=="pearpal.infoldgames.com" && location.hostname!=="myl.nuanpaper.com"){alert(${JSON.stringify(t('import.bookmark_script.invalid_site'))});return}prompt('Cookie:',JSON.stringify({roleid:[...document.querySelectorAll('div')].find(el=>el.textContent.startsWith('UID:'))?.textContent.replace('UID:','').trim(),token:document.cookie.match(/momoToken=([^;]+)/)?.[1],id:document.cookie.match(/momoNid=([^;]+)/)?.[1]}));})();`
  )

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
  // Unified cookie input for both methods
  const cookieInput = ref('')
  const currentStep = ref(0)
  const message = useMessage()
  const { verifyAuth, loading } = useBannerPullApi()
  const {
    fetchUserInfo,
    fetchNoteBookInfo,
    loading: pearpalTrackerLoading,
  } = usePearpalApi()
  const { importPearpalTrackerData } = useUserBannerStats()
  const { decodeSnappyJs, processPearpalData } = usePearpalData()
  const userStore = useUserStore()
  const {
    fetchBannerPullData,
    processBannerPullData,
    isFetching,
    processJsonImport,
    progress,
  } = useBannerPullData()

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

  // Keep option identities stable
  const regionOptions = shallowRef(
    regionValues.map((value) => ({
      value,
      label: REGION_LABELS.value[value],
    }))
  )

  watch(REGION_LABELS, (labels) => {
    regionOptions.value.forEach((option) => {
      option.label = labels[option.value]
    })
  })

  const importMethod = ref<'game' | 'json' | 'pearpal' | 'manual'>('game')
  const cookieMethod = ref<'bookmark' | 'console' | 'manual'>('bookmark')
  const jsonFile = ref<File | null>(null)
  const submitGlobalStats = ref(true)
  const pullStore = usePullStore()

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

  const handleCookiePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      cookieInput.value = clipboardText
    } catch {
      message.error(t('import.messages.data_paste_failed'))
    }
  }

  const showCompatibilityDialog = () => {
    dialog.create({
      title: t('import.supported_browsers'),
      icon: () =>
        h(NIcon, { size: 20 }, { default: () => h(ExclamationCircle) }),
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
      positiveText: t('common.ok'),
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

      const currentRun = banner.runs[0] // Get the first run only
      if (!currentRun) return false
      const startDate = new Date(currentRun.start)
      const endDate = new Date(currentRun.end)

      return now >= startDate && now <= endDate
    })
  })

  // Select current banners by default
  onMounted(() => {
    if (selectedBanners.value.length === 0) {
      selectedBanners.value = [...newBannerIds.value]
    }
    if (selectedManualBanner.value === null) {
      selectedManualBanner.value =
        newBannerIds.value[0] ?? allBannerIds.value[0] ?? null
    }
  })

  // Banner options for game import (with groups)
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
            label: t('default.current_banners'),
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

  // Simple banner options for manual selection (only individual banners)
  const individualBannerOptions = computed(() => {
    return allBannerIds.value.map((bannerId) => ({
      label: t(`banner.${bannerId}.name`),
      value: bannerId,
    }))
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

    if (importMethod.value === 'game') {
      return (
        selectedBanners.value.length === 0 ||
        loading.value ||
        isFetching.value ||
        hasEmptyFields
      )
    } else if (importMethod.value === 'pearpal') {
      return (
        selectedBanners.value.length === 0 ||
        pearpalTrackerLoading.value ||
        hasEmptyFields
      )
    }

    return false
  })

  const handleSubmit = async () => {
    if (importMethod.value === 'game') {
      await handleGameSubmit()
    } else if (importMethod.value === 'pearpal') {
      await handlePearpalSubmit()
    }
  }

  const handleGameSubmit = async () => {
    try {
      const cookieData: CookieData = formData.value
      const success = await verifyAuth(cookieData)

      if (success) {
        message.success(t('import.messages.auth_success'))
        pullStore.dataSource = 'game'

        const { sendUserBannerStats } = useUserBannerStats()

        try {
          const pullsByBanner = await fetchBannerPullData(selectedBanners.value)
          navigateTo(localePath('/tracker'))

          if (pullsByBanner) {
            const processedPulls = processBannerPullData(pullsByBanner)

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
        message.error(t('import.messages.auth_failed_hint'))
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
      const jsonData = JSON.parse(fileContent)

      // Validate the JSON structure
      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('Invalid JSON format')
      }

      // Check if it's the new format with pulls/edits or legacy format
      const hasPulls = 'pulls' in jsonData
      const hasEdits = 'edits' in jsonData

      if (hasPulls || hasEdits) {
        // New format: { pulls: {...}, edits: {...} }
        if (hasPulls && typeof jsonData.pulls !== 'object') {
          throw new Error('Invalid JSON format')
        }
        if (hasEdits && typeof jsonData.edits !== 'object') {
          throw new Error('Invalid JSON format')
        }
      } else {
        // Legacy format: Record<number, PullRecord[]>
        if (!Object.keys(jsonData).every((key) => !isNaN(Number(key)))) {
          throw new Error('Invalid JSON format')
        }
      }

      await processJsonImport(jsonData)
      navigateTo(localePath('/tracker'))
      message.success(t('import.messages.import_success'))
    } catch (e) {
      console.error(e)
      message.error(t('import.messages.import_failed'))
    }
  }

  const handlePearpalSubmit = async () => {
    try {
      // Get region from user store
      const region = userStore.getRegion

      // First, verify user credentials by fetching user info
      const userInfo = await fetchUserInfo(formData.value, region)

      if (userInfo && userInfo.code === 0 && userInfo.data?.role) {
        const serverUid = userInfo.data.role.uid?.toString()
        const serverZoneId = userInfo.data.role.zone_id

        // Verify UID matches
        if (serverUid && serverUid !== formData.value.roleid) {
          message.error(t('import.messages.invalid_form'))
          return
        }

        // Verify region matches using zone_id mapping
        const expectedZoneId = {
          [Region.AMERICA]: 6,
          [Region.EUROPE]: 2,
          [Region.ASIA]: 4,
          [Region.CHINA]: 1,
          [Region.TW]: 8,
        }[region]

        if (serverZoneId && serverZoneId !== expectedZoneId) {
          message.error(t('import.messages.invalid_form'))
          return
        }

        userStore.setUid(serverUid || formData.value.roleid)

        message.success(t('import.messages.auth_success'))
        pullStore.dataSource = 'pearpal'

        // Now fetch the actual gacha data
        const response = await fetchNoteBookInfo(formData.value, region)

        if (response) {
          // Decode the base64 response
          const decodedData = await decodeSnappyJs(response)

          // Check if decodedData is a JSON object with gacha_list
          if (
            decodedData &&
            typeof decodedData === 'object' &&
            'info_from_self' in decodedData
          ) {
            const gachaList = (decodedData as PearpalNoteBookResponse)
              .info_from_self?.gacha_list

            if (gachaList && Array.isArray(gachaList)) {
              // Filter gacha_list based on selected banners
              const filteredGachaList = gachaList.filter((item) => {
                const bannerId = parseInt(item.card_pool_id)
                return selectedBanners.value.includes(bannerId)
              })

              // Group raw data by banner for IndexedDB storage
              const pearpalDataByBanner: Record<number, PearpalTrackerItem[]> =
                {}
              filteredGachaList.forEach((item) => {
                const bannerId = parseInt(item.card_pool_id)
                if (!pearpalDataByBanner[bannerId]) {
                  pearpalDataByBanner[bannerId] = []
                }
                pearpalDataByBanner[bannerId].push(item)
              })

              // Save raw Pearpal data per banner to IndexedDB
              const indexedDB = useIndexedDB()
              if (Object.keys(pearpalDataByBanner).length > 0) {
                await indexedDB.savePearpalData(pearpalDataByBanner)
              }

              // Process data for local tracker system using pearpal tracker logic
              const processedBanners = processPearpalData(pearpalDataByBanner)

              message.success(t('import.messages.pearpal_tracker_success'))

              navigateTo(localePath('/tracker'))

              // Send analytics only if enabled and there are actual pulls
              if (
                submitGlobalStats.value &&
                Object.values(processedBanners).some(
                  (banner) => banner.stats.totalPulls > 0
                )
              ) {
                try {
                  // Convert processed banners to stats format
                  const { convertPearpalBannersToStats } = usePearpalData()
                  const bannerStats = await convertPearpalBannersToStats(
                    processedBanners,
                    serverUid || formData.value.roleid,
                    region
                  )
                  await importPearpalTrackerData(bannerStats)
                } catch {
                  message.error(t('import.messages.stats_submit_failed'))
                }
              }
            } else {
              throw new Error('No gacha_list found in response data')
            }
          } else {
            throw new Error('Invalid data format received from API')
          }
        } else {
          throw new Error('Failed to fetch data from Pearpal API')
        }
      } else {
        message.error(t('import.messages.auth_failed'))
        message.error(t('import.messages.auth_failed_hint'))
      }
    } catch (e) {
      console.error(e)
      message.error(t('import.messages.pearpal_tracker_failed'))
    }
  }

  // Unified watcher for cookie input
  watchDebounced(
    cookieInput,
    (newValue) => {
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
    },
    { debounce: 500 }
  )

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
      content: () =>
        h('div', [
          h(NCode, {
            code,
            language: 'javascript',
            wordWrap: true,
            class: 'w-full font-mono text-xs whitespace-pre-wrap rounded-sm',
            id: 'code-to-copy',
          }),
        ]),
      positiveText: t('common.copy'),
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
