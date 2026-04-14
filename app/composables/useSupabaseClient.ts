import { createClient } from '@supabase/supabase-js'

let clientInstance: ReturnType<typeof createClient> | null = null

export const useSupabaseClient = () => {
  const config = useRuntimeConfig()

  if (!clientInstance) {
    clientInstance = createClient(
      config.public.supabaseUrl,
      config.public.supabasePublishableKey
    )
  }
  return clientInstance
}
