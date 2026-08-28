#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { purgeNetlifyCache } from './netlify-cache-lib.mjs'
import { loadEnvFile } from './item-search-index-lib.mjs'

const tags = []
const BANNER_STATS_TAG_PATTERN = /^stats-banner-(\d+)$/

loadEnvFile()

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]

  if (arg === '--tag') {
    tags.push(process.argv[index + 1])
    index += 1
  } else if (arg?.startsWith('--tag=')) {
    tags.push(arg.slice('--tag='.length))
  } else if (arg && !arg.startsWith('-')) {
    tags.push(arg)
  } else {
    throw new Error(`Unknown argument: ${arg}`)
  }
}

if (tags.length === 0) {
  throw new Error(
    'No cache tags received. Pass tags positionally (npm run purge -- stats-banner-73) or use --tag=stats-banner-73.'
  )
}

const bannerIds = [
  ...new Set(
    tags.flatMap((tag) => {
      const match = String(tag).trim().match(BANNER_STATS_TAG_PATTERN)
      if (!match) return []

      const bannerId = Number.parseInt(match[1], 10)
      return bannerId > 0 ? [bannerId] : []
    })
  ),
]

if (bannerIds.length > 0) {
  const { SUPABASE_DATABASE_URL, SUPABASE_SECRET_KEY } = process.env
  if (!SUPABASE_DATABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error(
      'SUPABASE_DATABASE_URL and SUPABASE_SECRET_KEY are required to refresh banner stats'
    )
  }

  const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  for (const bannerId of bannerIds) {
    const { error } = await supabase.rpc('refresh_global_banner_stats', {
      p_banner_id: bannerId,
    })

    if (error) {
      throw new Error(
        `Failed to refresh global stats for banner ${bannerId}: ${error.message}`
      )
    }
  }
}

const result = await purgeNetlifyCache({ tags })
console.log(
  JSON.stringify(
    {
      refreshedBannerIds: bannerIds,
      ...result,
    },
    null,
    2
  )
)
