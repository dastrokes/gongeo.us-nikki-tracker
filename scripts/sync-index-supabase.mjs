import { syncItemIndexToSupabase } from './item-search-index-lib.mjs'

// Sync normalized item search metadata into Supabase.
// Existing rows are skipped by default; pass --overwrite to update them.
const result = await syncItemIndexToSupabase(process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
