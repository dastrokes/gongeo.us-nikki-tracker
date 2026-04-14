import { createClient } from '@supabase/supabase-js'

let serverClientInstance: ReturnType<typeof createClient> | null = null
let dataClientInstance: ReturnType<typeof createClient> | null = null

export const useSupabaseServerClient = () => {
  const config = useRuntimeConfig()

  if (!serverClientInstance) {
    serverClientInstance = createClient(
      config.public.supabaseUrl,
      config.supabaseSecretKey
    )
  }

  return serverClientInstance
}

/**
 * Supabase client for the data project (outfit/items database).
 * Uses secret key for server-side access with full permissions.
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
