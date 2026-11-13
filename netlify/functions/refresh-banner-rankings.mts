import { purgeCache, type Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const config: Config = { schedule: '@hourly' }

export default async () => {
  console.info('Banner ranking refresh started')
  const url = process.env.SUPABASE_DATABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    const missing = [
      !url && 'SUPABASE_DATABASE_URL',
      !key && 'SUPABASE_SECRET_KEY',
    ].filter(Boolean)
    throw new Error(
      `Missing Netlify Functions environment: ${missing.join(', ')}`
    )
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await supabase.rpc('refresh_banner_ranking_snapshot')
  if (error) {
    throw new Error(`Banner ranking snapshot refresh failed: ${error.message}`)
  }

  console.info('Banner ranking snapshot refreshed')
  await purgeCache({ tags: ['banner-ranking-2x'], domain: 'gongeo.us' })
  console.info('Netlify accepted banner-ranking-2x cache purge')
}
