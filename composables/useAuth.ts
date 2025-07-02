import type { User } from '@supabase/supabase-js'
import { useSupabaseClient } from './useSupabaseClient'
import { useUserStore } from '~/stores/user'
import { useRouter, useRoute } from 'vue-router'

// Global auth state - shared across all useAuth() calls
const globalAuthState = {
  user: ref<User | null>(null),
  loading: ref<boolean>(false),
  initialized: ref<boolean>(false),
}

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()

  // Use the global shared state
  const { user, loading, initialized } = globalAuthState

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
    // Prevent multiple initializations
    if (initialized.value) {
      return
    }

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
        userStore.setUid(session.user.id)
        userStore.setAuthToken(session.access_token)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          user.value = session.user
          userStore.setUid(session.user.id)
          userStore.setAuthToken(session.access_token)
        } else if (event === 'SIGNED_OUT') {
          user.value = null
          userStore.setUid(null)
          userStore.setAuthToken(null)
        }
      })

      initialized.value = true
    } catch (err) {
      console.error('Auth initialization error:', err)
    }
  }

  // Sign in with Discord
  const signIn = async (): Promise<void> => {
    loading.value = true

    try {
      // Get the site URL from runtime config
      const redirectTo = `${window.location.origin}${localePath('/tracker')}`

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo,
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
      userStore.reset()
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
    initAuth,
    signIn,
    signOut,
  }
}
