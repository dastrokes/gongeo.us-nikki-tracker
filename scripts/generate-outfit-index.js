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

// Get all .ts files in the outfits directory except index.ts
const outfitFiles = fs
  .readdirSync(OUTFITS_DIR)
  .filter(file => file.endsWith('.ts') && file !== 'index.ts')
  .map(file => path.parse(file).name)
  .sort()

// Generate the content for index.ts
const content = `${outfitFiles
  .map(file => `import ${file} from './${file}';`)
  .join('\n')}

const OUTFIT_DATA = {
${outfitFiles.map(file => `  ${file},`).join('\n')}
} as const;

export type OutfitKey = keyof typeof OUTFIT_DATA;
export default OUTFIT_DATA;
`

// Write the content to index.ts
fs.writeFileSync(path.join(OUTFITS_DIR, 'index.ts'), content)

console.log('Successfully updated data/outfits/index.ts') 