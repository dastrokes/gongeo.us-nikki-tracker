import { createClient } from '@supabase/supabase-js'

let voteClient: ReturnType<typeof createClient> | null = null

export const useVoteSupabaseClient = () => {
  const { voteSupabaseUrl, voteSupabasePublishableKey } =
    useRuntimeConfig().public

  if (!voteClient) {
    voteClient = createClient(voteSupabaseUrl, voteSupabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  return voteClient
}
