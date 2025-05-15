import { createClient } from '@supabase/supabase-js'

let clientInstance: ReturnType<typeof createClient> | null = null
let serverInstance: ReturnType<typeof createClient> | null = null

export const useSupabaseClient = (mode: 'client' | 'server' = 'client') => {
  const config = useRuntimeConfig()

  if (mode === 'server') {
    if (!serverInstance) {
      serverInstance = createClient(
        config.public.supabaseUrl,
        config.supabaseServiceKey
      )
    }
    return serverInstance
  }

  if (!clientInstance) {
    clientInstance = createClient(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey
    )
  }
  return clientInstance
}
