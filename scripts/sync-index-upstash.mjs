import { syncItemIndexToUpstash } from './item-search-index-lib.mjs'

// Sync search rows into Upstash.
// Existing ids are skipped by default; pass --overwrite to rewrite them.
// Use --namespace en or --namespace zh to limit the sync to one namespace.
const result = await syncItemIndexToUpstash(process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
