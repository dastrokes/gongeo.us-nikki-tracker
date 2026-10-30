import {
  buildFilterTemplate,
  generateFilters,
  writeGeneratedAssets,
} from './item-search-registry-lib.mjs'

export { buildFilterTemplate, generateFilters, writeGeneratedAssets }

await writeGeneratedAssets()
console.log('Done')
