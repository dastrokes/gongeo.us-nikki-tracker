import path from 'node:path'
import { refreshItemSearchLocalCopy } from './item-search-index-lib.mjs'

const parseArgs = (argv) => {
  const args = {
    outputRoot: undefined,
    pageSize: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--output-root') {
      args.outputRoot = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--page-size') {
      const parsed = Number(argv[index + 1])
      if (Number.isFinite(parsed) && parsed > 0) {
        args.pageSize = Math.floor(parsed)
      }
      index += 1
    }
  }

  return args
}

const result = await refreshItemSearchLocalCopy(
  parseArgs(process.argv.slice(2))
)
console.log(JSON.stringify(result, null, 2))
