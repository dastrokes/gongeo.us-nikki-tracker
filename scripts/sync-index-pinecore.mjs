import { syncItemIndexToPinecone } from './item-search-index-lib.mjs'

// Sync derived search documents into Pinecone from canonical item-attributes rows.
// Existing ids are skipped by default; pass --overwrite to rewrite them.
// Use --namespace en or --namespace zh to limit the sync to one namespace.
// Pinecone embedding batches are capped at 96 records, so larger
// --batch-size values are clamped automatically for this script.
// Required env vars: PINECONE_API_KEY and PINECONE_SEARCH_HOST.
const result = await syncItemIndexToPinecone(process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
