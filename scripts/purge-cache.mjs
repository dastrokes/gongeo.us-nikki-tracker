#!/usr/bin/env node

import {
  getCloudflareCacheTags,
  purgeCloudflareCache,
} from './cloudflare-cache-lib.mjs'
import { loadEnvFile } from './item-search-index-lib.mjs'
import { normalizeCacheTags, purgeNetlifyCache } from './netlify-cache-lib.mjs'

const tags = []

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
    'No cache tags received. Pass tags positionally (npm run purge -- stats-73) or use --tag=stats-73.'
  )
}

const normalizedTags = normalizeCacheTags(tags)
const cloudflareTags = getCloudflareCacheTags(normalizedTags)
const netlifyTags = normalizedTags.filter(
  (tag) => !cloudflareTags.includes(tag)
)
const [netlifyResult, cloudflareResult] = await Promise.all([
  netlifyTags.length > 0
    ? purgeNetlifyCache({ tags: netlifyTags })
    : Promise.resolve({ cacheTags: [], batches: [] }),
  cloudflareTags.length > 0
    ? purgeCloudflareCache({ tags: cloudflareTags })
    : Promise.resolve({
        cacheTags: [],
        batches: [],
        skipped: 'no Worker-owned cache tags',
      }),
])

console.log(
  JSON.stringify(
    {
      ...netlifyResult,
      cloudflare: cloudflareResult,
    },
    null,
    2
  )
)
