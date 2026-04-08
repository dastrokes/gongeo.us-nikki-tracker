import { syncItemIndexToSupabase } from './item-search-index-lib.mjs'

// Sync canonical item-attributes rows into Supabase.
// Existing rows are skipped by default; pass --overwrite to update them.
const result = await syncItemIndexToSupabase(process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
