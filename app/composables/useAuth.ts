import type { User } from '@supabase/supabase-js'

const globalAuthState = () => ({
  user: useState<User | null>('auth-user', () => null),
  loading: useState<boolean>('auth-loading', () => false),
  initialized: useState<boolean>('auth-initialized', () => false),
  initializing: useState<boolean>('auth-initializing', () => false),
})

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()
  const { locale } = useI18n()
  const config = useRuntimeConfig()

  const { user, loading, initialized, initializing } = globalAuthState()

  // Check for auth errors in URL (from OAuth callback)
  const checkAuthError = () => {
    const urlError = route.query.error

    if (urlError) {
      // Clear error from URL
      router.replace({
        path: route.path,
        query: {},
      })

      return true
    }
    return false
  }

  // Initialize auth state
  const initAuth = async (): Promise<void> => {
    // Prevent duplicate init and listener registration.
    if (initialized.value || initializing.value) {
      return
    }

    // Lock in-flight init without marking auth as ready yet.
    initializing.value = true

    try {
      // Check for OAuth callback errors first
      if (checkAuthError()) {
        console.error('OAuth callback error detected')
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        user.value = session.user
      }

      // Listen for auth changes once per app lifecycle.
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          user.value = session.user
        } else if (event === 'SIGNED_OUT') {
          user.value = null
        }
      })

      initialized.value = true
    } catch (err) {
      initialized.value = false
      console.error('Auth initialization error:', err)
    } finally {
      initializing.value = false
    }
  }

  // Sign in with Discord
  const signInWithDiscord = async (): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${config.public.siteUrl}${localePath('/')}`,
          scopes: 'identify email',
        },
      })

      if (authError) {
        console.error('Discord sign in error:', authError)
        throw authError
      }
    } catch (err: unknown) {
      console.error('Sign in failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign in with Google
  const signInWithGoogle = async (): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${config.public.siteUrl}${localePath('/')}`,
          scopes: 'openid email profile',
        },
      })

      if (authError) {
        console.error('Google sign in error:', authError)
        throw authError
      }
    } catch (err: unknown) {
      console.error('Google sign in failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('Email sign in error:', authError)
        throw authError
      }
    } catch (err: unknown) {
      console.error('Email sign in failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${config.public.siteUrl}${localePath('/')}`,
          data: {
            lang: locale.value,
          },
        },
      })

      if (authError) {
        console.error('Email sign up error:', authError)
        throw authError
      }
    } catch (err: unknown) {
      console.error('Sign up failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${config.public.siteUrl}${localePath('/login')}?type=recovery`,
        }
      )

      if (authError) {
        console.error('Password reset error:', authError)
        throw authError
      }
    } catch (err: unknown) {
      console.error('Password reset failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async (): Promise<void> => {
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        console.error('Sign out error:', authError)
        throw authError
      }

      user.value = null
    } catch (err: unknown) {
      console.error('Sign out failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    initAuth,
    signInWithDiscord,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    resetPassword,
    signOut,
  }
}
