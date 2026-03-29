import { buildFilterTemplate } from './generate_filters.mjs'

process.stdout.write(`${JSON.stringify(buildFilterTemplate(), null, 2)}\n`)
