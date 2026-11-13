import { purgeCache, type Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const config: Config = { schedule: '@hourly' }

export default async () => {
  const url = process.env.SUPABASE_DATABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Missing Supabase server configuration')

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await supabase.rpc('refresh_banner_ranking_snapshot')
  if (error) {
    throw new Error(`Banner ranking snapshot refresh failed: ${error.message}`)
  }

  await purgeCache({ tags: ['banner-ranking-2x'], domain: 'gongeo.us' })
}
