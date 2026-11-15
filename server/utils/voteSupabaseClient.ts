import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

let voteServerClient: SupabaseClient | null = null

export const useVoteSupabaseServerClient = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  // Read the Netlify Functions secret at runtime so it stays out of build config.
  const secret =
    process.env.VOTE_SUPABASE_SECRET_KEY || config.voteSupabaseSecretKey

  if (!voteServerClient) {
    voteServerClient = createClient(config.public.voteSupabaseUrl, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  return voteServerClient
}
