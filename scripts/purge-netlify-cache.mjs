#!/usr/bin/env node

import { purgeNetlifyCache } from './netlify-cache-lib.mjs'

const tags = []

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]

  if (arg === '--tag') {
    tags.push(process.argv[index + 1])
    index += 1
  } else if (arg?.startsWith('--tag=')) {
    tags.push(arg.slice('--tag='.length))
  } else {
    throw new Error(`Unknown argument: ${arg}`)
  }
}

const result = await purgeNetlifyCache({ tags })
console.log(JSON.stringify(result, null, 2))
