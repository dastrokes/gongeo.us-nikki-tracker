import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env')
const percentilePath = path.join(repoRoot, 'data', 'percentile.json')
const REQUIRED_METRICS = [
  'avg_5star_pulls',
  'avg_5star_pulls_banner',
  'avg_4star_pulls_type2',
  'avg_4star_pulls_type2_banner',
  'avg_4star_pulls_type3',
  'avg_4star_pulls_type3_banner',
  'total_pulls_per_user',
]
const INDENT = '  '

const loadEnvFile = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8')

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const assertPercentileData = (value) => {
  if (!value || typeof value !== 'object') {
    throw new Error('generate_percentile_data returned an invalid payload')
  }

  if (typeof value.generated_at !== 'string') {
    throw new Error('generate_percentile_data payload is missing generated_at')
  }

  if (!value.metrics || typeof value.metrics !== 'object') {
    throw new Error('generate_percentile_data payload is missing metrics')
  }

  for (const key of REQUIRED_METRICS) {
    if (!Array.isArray(value.metrics[key])) {
      throw new Error(`generate_percentile_data payload is missing ${key}`)
    }
  }
}

const formatMetricPoints = (points) => {
  return [
    '[',
    ...points.map(
      ([percentile, threshold], index) =>
        `${INDENT.repeat(3)}[${percentile}, ${threshold}]${
          index < points.length - 1 ? ',' : ''
        }`
    ),
    `${INDENT.repeat(2)}]`,
  ].join('\n')
}

const formatPercentileData = (value) => {
  const metricEntries = REQUIRED_METRICS.map(
    (key) =>
      `${INDENT.repeat(2)}${JSON.stringify(key)}: ${formatMetricPoints(
        value.metrics[key]
      )}`
  )

  return [
    '{',
    `${INDENT}"metrics": {`,
    ...metricEntries.map((entry, index) =>
      index < metricEntries.length - 1 ? `${entry},` : entry
    ),
    `${INDENT}},`,
    `${INDENT}"generated_at": ${JSON.stringify(value.generated_at)}`,
    '}',
    '',
  ].join('\n')
}

loadEnvFile(envPath)

if (!process.env.SUPABASE_DATABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error(
    'SUPABASE_DATABASE_URL and SUPABASE_SECRET_KEY must be set in the environment or .env'
  )
}

const client = createClient(
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

const { data, error } = await client.rpc('generate_percentile_data')

if (error) {
  throw error
}

assertPercentileData(data)

fs.writeFileSync(percentilePath, formatPercentileData(data), 'utf8')

console.log(
  [
    'Updated data/percentile.json',
    'from public.generate_percentile_data().',
    `generated_at=${data.generated_at}`,
  ].join(' ')
)
