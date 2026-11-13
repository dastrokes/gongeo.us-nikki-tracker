import { purgeCache } from '@netlify/cache'
import { createClient } from '@supabase/supabase-js'

// Schedule is declared in netlify.toml.
export default async (request: Request) => {
  const payload = await request.json().catch(() => null)
  console.log('Banner ranking refresh started', {
    scheduled: Boolean(payload),
  })
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

  console.log('Banner ranking snapshot refreshed')
  await purgeCache({ tags: ['banner-ranking-2x'] })
  console.log('Netlify accepted banner-ranking-2x cache purge')

  return new Response(null, { status: 204 })
}
