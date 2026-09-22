import { syncItemIndexToPinecone } from './item-search-index-lib.mjs'

// Publish Pinecone from D1-derived --item-attributes-path and --catalog-path JSONL.
// Choose exactly one of --dry-run, --preflight, or --apply. Only --apply writes.
// --reconcile-stale removes documents absent from the source during apply.
// Unchanged documents are skipped; --overwrite forces their re-embedding.
// Use --namespace en or zh to limit publication to one namespace.
// Required env vars: PINECONE_API_KEY and PINECONE_SEARCH_HOST.
const result = await syncItemIndexToPinecone(process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
