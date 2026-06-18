import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from './item-search-index-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const DEFAULT_BATCH_SIZE = 500

const parseArgs = (argv) => {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--batch-size') {
      args.batchSize = Number.parseInt(argv[index + 1] ?? '', 10)
      index += 1
    }
  }

  if (!Number.isFinite(args.batchSize) || args.batchSize <= 0) {
    throw new Error('--batch-size must be a positive integer')
  }

  return args
}

const chunkArray = (items, size) => {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const createMainSupabaseClient = () => {
  if (!process.env.SUPABASE_DATABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      'SUPABASE_DATABASE_URL and SUPABASE_SECRET_KEY must be set in the environment or .env'
    )
  }

  return createClient(
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}

const readText = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

const extractObjectBlock = (source, startIndex) => {
  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false
  let start = -1

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        inString = false
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(start, index + 1)
      }
    }
  }

  throw new Error('Unable to extract object block')
}

const parseStringArrayProperty = (block, propertyName) => {
  const match = block.match(new RegExp(`${propertyName}:\\s*\\[([^\\]]*)\\]`))
  if (!match) return []

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1])
}

const parseBanners = () => {
  const source = readText('data/banners.ts')
  const banners = []
  const entryPattern = /^\s*(\d+):\s*\{/gm
  let match

  while ((match = entryPattern.exec(source))) {
    const bannerId = Number.parseInt(match[1], 10)
    const block = extractObjectBlock(
      source,
      match.index + match[0].lastIndexOf('{')
    )
    const bannerTypeMatch = block.match(/bannerType:\s*(\d+)/)
    const bannerType = Number.parseInt(bannerTypeMatch?.[1] ?? '', 10)

    if (![1, 2, 3].includes(bannerType)) {
      throw new Error(`Invalid bannerType for banner ${bannerId}`)
    }

    banners.push({
      bannerId,
      bannerType,
      outfit4StarId: parseStringArrayProperty(block, 'outfit4StarId'),
      outfit5StarId: parseStringArrayProperty(block, 'outfit5StarId'),
    })
  }

  return banners
}

const parseOutfitItemCounts = () => {
  const outfitDir = path.join(repoRoot, 'data', 'outfits')
  const counts = new Map()

  fs.readdirSync(outfitDir)
    .filter((file) => /^\d+\.ts$/.test(file))
    .forEach((file) => {
      const outfitId = path.basename(file, '.ts')
      const source = fs.readFileSync(path.join(outfitDir, file), 'utf8')
      const items = parseStringArrayProperty(source, 'items')
      counts.set(outfitId, items.length)
    })

  return counts
}

export const buildGlobalBannerScopeRows = () => {
  const outfitItemCounts = parseOutfitItemCounts()

  return parseBanners()
    .filter((banner) => banner.bannerType !== 1)
    .flatMap((banner) => {
      const rows = []
      const addRows = (quality, outfitIds) => {
        outfitIds.forEach((outfitId) => {
          const itemCount = outfitItemCounts.get(outfitId)
          if (!itemCount) {
            throw new Error(
              `Missing outfit item count for banner ${banner.bannerId}, outfit ${outfitId}`
            )
          }

          rows.push({
            banner_id: banner.bannerId,
            banner_type: banner.bannerType,
            quality,
            outfit_id: outfitId,
            item_count: itemCount,
          })
        })
      }

      addRows(5, banner.outfit5StarId)
      addRows(4, banner.outfit4StarId)
      return rows
    })
}

export const syncGlobalBannerScopes = async (argv = process.argv.slice(2)) => {
  loadEnvFile()
  const args = parseArgs(argv)
  const rows = buildGlobalBannerScopeRows()

  if (args.dryRun) {
    return {
      dry_run: true,
      generated_count: rows.length,
      rows,
    }
  }

  const client = createMainSupabaseClient()
  const existingRows = []
  let from = 0

  while (true) {
    const { data, error } = await client
      .from('global_banner_config')
      .select('banner_id,quality,outfit_id')
      .range(from, from + args.batchSize - 1)

    if (error) throw error

    const batch = Array.isArray(data) ? data : []
    existingRows.push(...batch)
    if (batch.length < args.batchSize) break
    from += args.batchSize
  }

  const generatedKeys = new Set(
    rows.map((row) => `${row.banner_id}:${row.quality}:${row.outfit_id}`)
  )
  const staleRows = existingRows.filter(
    (row) =>
      !generatedKeys.has(`${row.banner_id}:${row.quality}:${row.outfit_id}`)
  )

  for (const batch of chunkArray(rows, args.batchSize)) {
    const { error } = await client.from('global_banner_config').upsert(batch, {
      onConflict: 'banner_id,quality,outfit_id',
    })

    if (error) throw error
  }

  for (const row of staleRows) {
    const { error } = await client
      .from('global_banner_config')
      .delete()
      .eq('banner_id', row.banner_id)
      .eq('quality', row.quality)
      .eq('outfit_id', row.outfit_id)

    if (error) throw error
  }

  return {
    generated_count: rows.length,
    deleted_stale_count: staleRows.length,
  }
}

const result = await syncGlobalBannerScopes()
console.log(JSON.stringify(result, null, 2))
