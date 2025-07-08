<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center space-y-4 max-w-sm mx-auto">
        <!-- Header -->
        <div class="space-y-2">
          <n-h2 class="text-2xl font-bold">{{ t('login.title') }}</n-h2>
          <n-text class="text-gray-600 dark:text-gray-400">
            {{ t('login.welcome_description') }}
          </n-text>
        </div>

        <!-- Already signed in -->
        <div v-if="user && !isRecoveryMode">
          <n-result
            status="success"
            :title="t('login.signed_in_title')"
            size="small"
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
                  size="large"
                  @click="navigateTo(`${localePath('/tracker')}`)"
                >
                  {{ t('login.go_to_tracker') }}
                </n-button>
              </n-space>
            </template>
          </n-result>
        </div>

        <!-- Password Recovery Form -->
        <div v-else-if="isRecoveryMode">
          <n-h3 class="mb-4">{{ t('login.set_new_password') }}</n-h3>
          <n-form
            ref="recoveryFormRef"
            :model="recoveryFormData"
            :rules="recoveryFormRules"
            class="space-y-4"
          >
            <n-form-item path="newPassword">
              <n-input
                v-model:value="recoveryFormData.newPassword"
                type="password"
                :placeholder="t('login.new_password')"
                size="large"
                show-password-on="click"
                clearable
              />
            </n-form-item>
            <n-form-item path="confirmNewPassword">
              <n-input
                v-model:value="recoveryFormData.confirmNewPassword"
                type="password"
                :placeholder="t('login.confirm_new_password')"
                size="large"
                show-password-on="click"
                clearable
              />
            </n-form-item>
            <n-button
              type="primary"
              size="large"
              class="w-full"
              :loading="recoveryLoading"
              @click="handlePasswordUpdate"
            >
              {{ t('login.update_password') }}
            </n-button>
          </n-form>
        </div>

        <!-- Main Login Form -->
        <div
          v-else
          class="space-y-6"
        >
          <!-- OAuth Providers -->
          <div class="space-y-3">
            <n-button
              size="large"
              class="w-full"
              :loading="loading"
              @click="handleDiscordSignIn"
            >
              <template #icon>
                <n-icon>
                  <Discord />
                </n-icon>
              </template>
              {{ t('login.sign_in_with_discord') }}
            </n-button>

            <n-button
              size="large"
              class="w-full"
              :loading="loading"
              @click="handleGoogleSignIn"
            >
              <template #icon>
                <n-icon>
                  <Google />
                </n-icon>
              </template>
              {{ t('login.sign_in_with_google') }}
            </n-button>
          </div>

          <!-- Divider -->
          <n-divider>
            <n-text class="text-sm text-gray-500">
              {{ t('login.or') }}
            </n-text>
          </n-divider>

          <!-- Email Authentication (Collapsible) -->
          <n-collapse>
            <n-collapse-item
              :title="t('login.sign_in_with_email')"
              name="email"
            >
              <div class="space-y-4 pt-2">
                <!-- Mode Toggle -->
                <n-radio-group
                  v-model:value="authMode"
                  size="small"
                >
                  <n-radio-button value="signin">
                    {{ t('login.sign_in') }}
                  </n-radio-button>
                  <n-radio-button value="signup">
                    {{ t('login.sign_up') }}
                  </n-radio-button>
                </n-radio-group>

                <!-- Email Form -->
                <n-form
                  ref="formRef"
                  :show-label="false"
                  :model="formData"
                  :rules="formRules"
                  class="space-y-2"
                >
                  <n-form-item path="email">
                    <n-input
                      v-model:value="formData.email"
                      type="text"
                      :placeholder="t('login.email')"
                      size="large"
                      clearable
                    />
                  </n-form-item>

                  <n-form-item path="password">
                    <n-input
                      v-model:value="formData.password"
                      type="password"
                      :placeholder="t('login.password')"
                      size="large"
                      show-password-on="click"
                      clearable
                    />
                  </n-form-item>

                  <n-form-item
                    v-if="authMode === 'signup'"
                    path="confirmPassword"
                  >
                    <n-input
                      v-model:value="formData.confirmPassword"
                      type="password"
                      :placeholder="t('login.confirm_password')"
                      size="large"
                      show-password-on="click"
                      clearable
                    />
                  </n-form-item>

                  <n-button
                    type="primary"
                    size="large"
                    class="w-full"
                    :loading="loading"
                    @click="handleEmailAuth"
                  >
                    {{
                      authMode === 'signin'
                        ? t('login.sign_in')
                        : t('login.sign_up')
                    }}
                  </n-button>

                  <!-- Forgot Password -->
                  <div
                    v-if="authMode === 'signin'"
                    class="text-center"
                  >
                    <n-button
                      text
                      size="small"
                      @click="showResetPassword = true"
                    >
                      {{ t('login.forgot_password') }}
                    </n-button>
                  </div>
                </n-form>
              </div>
            </n-collapse-item>
          </n-collapse>

          <SocialLinks />
        </div>
      </div>
    </n-card>

    <!-- Password Reset Modal -->
    <n-modal v-model:show="showResetPassword">
      <n-card
        class="max-w-sm w-full mx-auto"
        :title="t('login.reset_password')"
        :bordered="false"
        size="huge"
      >
        <n-form
          ref="resetFormRef"
          :model="resetFormData"
          :rules="resetFormRules"
          class="space-y-4"
        >
          <n-form-item path="email">
            <n-input
              v-model:value="resetFormData.email"
              type="text"
              :placeholder="t('login.email')"
              size="large"
              clearable
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showResetPassword = false">
              {{ t('login.back_to_login') }}
            </n-button>
            <n-button
              type="primary"
              :loading="resetLoading"
              @click="handlePasswordReset"
            >
              {{ t('login.send_reset_email') }}
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { Discord, Google } from '@vicons/fa'
  import { useMessage } from 'naive-ui'
  import { useAuth } from '~/composables/useAuth'
  import { useCardStyle } from '~/composables/useCardStyle'

  const { t } = useI18n()
  const message = useMessage()
  const {
    user,
    loading,
    signInWithDiscord,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    resetPassword,
  } = useAuth()
  const { cardStyle } = useCardStyle()
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()

  // Form refs
  const formRef = ref()
  const resetFormRef = ref()
  const recoveryFormRef = ref()

  // State
  const authMode = ref<'signin' | 'signup'>('signin')
  const showResetPassword = ref(false)
  const resetLoading = ref(false)
  const recoveryLoading = ref(false)
  const isRecoveryMode = ref(false)

  // Form data
  const formData = ref({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const resetFormData = ref({
    email: '',
  })

  const recoveryFormData = ref({
    newPassword: '',
    confirmNewPassword: '',
  })

  // Validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const formRules = computed(() => ({
    email: [
      { required: true, message: t('login.email_required') },
      {
        validator: (_: unknown, value: string) => validateEmail(value),
        message: t('login.invalid_email'),
      },
    ],
    password: [
      { required: true, message: t('login.password_required') },
      { min: 6, message: t('login.password_min_length') },
    ],
    confirmPassword:
      authMode.value === 'signup'
        ? [
            { required: true, message: t('login.password_required') },
            {
              validator: (_: unknown, value: string) =>
                value === formData.value.password,
              message: t('login.passwords_dont_match'),
            },
          ]
        : [],
  }))

  const resetFormRules = computed(() => ({
    email: [
      { required: true, message: t('login.email_required') },
      {
        validator: (_: unknown, value: string) => validateEmail(value),
        message: t('login.invalid_email'),
      },
    ],
  }))

  const recoveryFormRules = computed(() => ({
    newPassword: [
      { required: true, message: t('login.password_required') },
      { min: 6, message: t('login.password_min_length') },
    ],
    confirmNewPassword: [
      { required: true, message: t('login.password_required') },
      {
        validator: (_: unknown, value: string) =>
          value === recoveryFormData.value.newPassword,
        message: t('login.passwords_dont_match'),
      },
    ],
  }))

  // SEO
  useHead({
    title: t('login.title') + ' - ' + t('navigation.subtitle'),
    meta: [
      { name: 'description', content: t('meta.description.login') },
      {
        property: 'og:title',
        content: t('login.title') + ' - ' + t('navigation.subtitle'),
      },
      { property: 'og:description', content: t('meta.description.login') },
    ],
  })

  // Handlers
  const handleDiscordSignIn = async () => {
    try {
      await signInWithDiscord()
    } catch (error) {
      message.error(t('login.signin_error'))
      console.error('Discord sign in error:', error)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      message.error('Failed to sign in with Google. Please try again.')
      console.error('Google sign in error:', error)
    }
  }

  const handleEmailAuth = async () => {
    try {
      await formRef.value?.validate()

      if (authMode.value === 'signin') {
        await signInWithEmail(formData.value.email, formData.value.password)
        message.success(t('login.signin_success'))
      } else {
        await signUp(formData.value.email, formData.value.password)
        message.success(t('login.signup_success'))
      }

      formData.value = { email: '', password: '', confirmPassword: '' }
    } catch (error: unknown) {
      let errorMessage =
        authMode.value === 'signin'
          ? t('login.email_signin_error')
          : t('login.email_signup_error')

      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as { message: string }
        if (supabaseError.message.includes('Invalid login credentials')) {
          errorMessage = t('login.email_signin_error')
        } else if (supabaseError.message.includes('Email not confirmed')) {
          errorMessage =
            'Please check your email and click the confirmation link.'
        } else if (supabaseError.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists.'
        }
      }

      message.error(errorMessage)
      console.error('Email authentication error:', error)
    }
  }

  const handlePasswordReset = async () => {
    try {
      await resetFormRef.value?.validate()
      resetLoading.value = true

      await resetPassword(resetFormData.value.email)
      message.success(t('login.reset_success'))

      showResetPassword.value = false
      resetFormData.value.email = ''
    } catch (error: unknown) {
      let errorMessage = t('login.reset_error')

      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as { message: string }
        if (supabaseError.message.includes('User not found')) {
          errorMessage = 'No account found with this email address.'
        } else if (supabaseError.message.includes('rate limit')) {
          errorMessage = 'Too many attempts. Please wait before trying again.'
        }
      }

      message.error(errorMessage)
      console.error('Password reset error:', error)
    } finally {
      resetLoading.value = false
    }
  }

  const handlePasswordUpdate = async () => {
    try {
      await recoveryFormRef.value?.validate()
      recoveryLoading.value = true

      const supabase = useSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        password: recoveryFormData.value.newPassword,
      })

      if (error) throw error

      message.success('Password updated successfully!')
      isRecoveryMode.value = false
      recoveryFormData.value = { newPassword: '', confirmNewPassword: '' }
      router.replace({ path: localePath('/login'), query: {} })
    } catch (error: unknown) {
      let errorMessage = 'Failed to update password.'

      if (error && typeof error === 'object' && 'message' in error) {
        const supabaseError = error as { message: string }
        if (supabaseError.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (supabaseError.message.includes('session_not_found')) {
          errorMessage =
            'Reset session expired. Please request a new reset email.'
        }
      }

      message.error(errorMessage)
      console.error('Password update error:', error)
    } finally {
      recoveryLoading.value = false
    }
  }

  // Initialize
  onMounted(async () => {
    // Check for recovery mode
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    if (
      route.query.type === 'recovery' ||
      urlParams.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      window.location.hash.includes('recovery')
    ) {
      isRecoveryMode.value = true
    }
  })

  // Handle user state
  watchEffect(() => {
    if (user.value && !loading.value && !isRecoveryMode.value) {
      setTimeout(() => {
        navigateTo(`${localePath('/')}`)
      }, 3000)
    }
  })
</script>
