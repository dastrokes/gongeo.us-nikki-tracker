<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <div class="flex justify-center">
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        :style="cardStyle"
      >
        <div class="flex flex-col items-center text-center max-w-sm mx-auto">
          <n-h1 class="mb-6">{{ t('login.welcome_title') }}</n-h1>
          <n-text class="mb-8 text-gray-600 dark:text-gray-400">
            {{ t('login.welcome_description') }}
          </n-text>

          <div v-if="!user">
            <n-button
              type="primary"
              size="large"
              class="w-full mb-4"
              :loading="loading"
              @click="handleDiscordSignIn"
            >
              <template #icon>
                <n-icon>
                  <Discord />
                </n-icon>
              </template>
              {{ t('common.user_profile.sign_in_discord') }}
            </n-button>

            <n-text class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('login.discord_permission_note') }}
            </n-text>
          </div>

          <div
            v-else
            class="text-center"
          >
            <n-result
              status="success"
              :title="t('login.signed_in_title')"
            >
              <template #footer>
                <n-space vertical>
                  <n-text>
                    {{
                      t('login.welcome_back', {
                        name:
                          user.user_metadata?.custom_claims?.global_name ||
                          user.email ||
                          'User',
                      })
                    }}
                  </n-text>
                  <n-button
                    type="primary"
                    @click="$router.push('/')"
                  >
                    {{ t('login.go_to_tracker') }}
                  </n-button>
                </n-space>
              </template>
            </n-result>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Discord } from '@vicons/fa'
  import { useMessage } from 'naive-ui'
  import { useAuth } from '~/composables/useAuth'
  import { useCardStyle } from '~/composables/useCardStyle'

  const { t } = useI18n()
  const message = useMessage()
  const { user, loading, signIn } = useAuth()
  const { cardStyle } = useCardStyle()
  const router = useRouter()

  const siteUrl = useRuntimeConfig().public.siteUrl
  const localePath = useLocalePath()

  useHead({
    title: t('login.title') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.login'),
      },
      {
        property: 'og:title',
        content: t('login.title') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.login'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/auth')}` }],
  })

  const handleDiscordSignIn = async () => {
    try {
      await signIn()
    } catch (error) {
      message.error(t('login.signin_error'))
      console.error('Discord sign in error:', error)
    }
  }

  // Redirect to home if already signed in and not showing success message
  watchEffect(() => {
    if (user.value && !loading.value) {
      // Small delay to show success message
      setTimeout(() => {
        router.back()
      }, 3000)
    }
  })
</script>
