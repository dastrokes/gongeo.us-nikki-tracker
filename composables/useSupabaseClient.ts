import { createClient } from '@supabase/supabase-js'

let clientInstance: ReturnType<typeof createClient> | null = null
let serverInstance: ReturnType<typeof createClient> | null = null
let dataClientInstance: ReturnType<typeof createClient> | null = null

export const useSupabaseClient = (mode: 'client' | 'server' = 'client') => {
  const config = useRuntimeConfig()

  if (mode === 'server') {
    if (!serverInstance) {
      serverInstance = createClient(
        config.public.supabaseUrl,
        config.supabaseSecretKey
      )
    }
    return serverInstance
  }

  if (!clientInstance) {
    clientInstance = createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey
    )
  }
  return clientInstance
}

/**
 * Supabase client for the data project (outfit/items database)
 * Uses secret key for server-side access with full permissions
 */
export const useSupabaseDataClient = () => {
  const config = useRuntimeConfig()

  if (!dataClientInstance) {
    dataClientInstance = createClient(
      config.public.supabaseDataUrl,
      config.supabaseDataSecretKey
    )
  }
  return dataClientInstance
}
