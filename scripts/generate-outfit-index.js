import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTFITS_DIR = path.join(__dirname, '../data/outfits')

// Ensure the outfits directory exists
if (!fs.existsSync(OUTFITS_DIR)) {
  fs.mkdirSync(OUTFITS_DIR, { recursive: true })
}

// Default outfit IDs from your existing index.ts
const DEFAULT_OUTFIT_IDS = [
  'S0126',
  'S0161',
  'S0163',
  'S0164',
  'S0145',
  'S0165',
  'S0093',
  'S0033',
]

// Create placeholder outfit files if they don't exist
DEFAULT_OUTFIT_IDS.forEach((outfitId) => {
  const filePath = path.join(OUTFITS_DIR, `${outfitId}.ts`)
  if (!fs.existsSync(filePath)) {
    const placeholderContent = `import type { Outfit } from '~/types/outfit'

const outfit: Outfit = {
  id: '${outfitId}',
  name: '${outfitId}',
  rarity: 4,
  items: [],
}

export default outfit;
`
    fs.writeFileSync(filePath, placeholderContent)
    console.log(`Created placeholder outfit file: ${outfitId}.ts`)
  }
})

// Get all .ts files in the outfits directory except index.ts
const outfitFiles = fs
  .readdirSync(OUTFITS_DIR)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
  .map((file) => path.parse(file).name)
  .sort()

// Generate the content for index.ts
const content = `${outfitFiles
  .map((file) => `import ${file} from './${file}';`)
  .join('\n')}

const OUTFIT_DATA = {
${outfitFiles.map((file) => `  ${file},`).join('\n')}
} as const;

export type OutfitKey = keyof typeof OUTFIT_DATA;
export default OUTFIT_DATA;
`

// Write the content to index.ts
fs.writeFileSync(path.join(OUTFITS_DIR, 'index.ts'), content)

console.log('Successfully updated data/outfits/index.ts')
