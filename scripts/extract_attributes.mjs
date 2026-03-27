import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const attributePath = path.join(repoRoot, 'data', 'attribute.json')

const raw = fs.readFileSync(attributePath, 'utf8')
const data = JSON.parse(raw)

const filters = {}

for (const item of data) {
  const field = item.field
  const value = item.value

  if (!filters[field]) {
    filters[field] = {}
  }

  filters[field][value] = ''
}

const sortedFilters = Object.fromEntries(
  Object.keys(filters)
    .sort()
    .map((field) => [
      field,
      Object.fromEntries(
        Object.keys(filters[field])
          .sort()
          .map((value) => [value, ''])
      ),
    ])
)

process.stdout.write(`${JSON.stringify({ filter: sortedFilters }, null, 2)}\n`)
