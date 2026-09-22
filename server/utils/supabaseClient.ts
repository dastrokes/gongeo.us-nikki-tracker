import { createClient } from '@supabase/supabase-js'

let serverClientInstance: ReturnType<typeof createClient> | null = null

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
