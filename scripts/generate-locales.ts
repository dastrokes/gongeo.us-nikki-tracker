import fs from 'fs'
import path from 'path'
import type { Outfit } from '~/types/outfit'

const OUTFITS_DIR = path.join(process.cwd(), 'data/outfits')
const LOCALES_DIR = path.join(process.cwd(), 'locales')

// Ensure locales directory exists
if (!fs.existsSync(LOCALES_DIR)) {
  fs.mkdirSync(LOCALES_DIR, { recursive: true })
}

const locales: Record<string, string> = {}

// Read all outfit files
const outfitFiles = fs
  .readdirSync(OUTFITS_DIR)
  .filter((file) => file.endsWith('.ts'))

outfitFiles.forEach((file) => {
  const filePath = path.join(OUTFITS_DIR, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  // Extract outfit data using regex - now capturing the entire object including closing braces
  const outfitMatch = content.match(
    /const outfit: Outfit = ({[\s\S]*?export default outfit)/
  )
  if (!outfitMatch) {
    console.error(`Could not find outfit data in ${file}`)
    return
  }

  // Convert the TypeScript object string to a valid JSON string
  const jsonStr = outfitMatch[1]
    .replace(/export default outfit$/, '') // Remove the export statement
    .replace(/(\w+):/g, '"$1":') // Add quotes to property names
    .replace(/(['"])(.*?)\1/g, (match, quote, content) => {
      // Handle both single and double quotes, preserving apostrophes
      return `"${content.replace(/"/g, '\\"')}"`
    })
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/\n\s*/g, ' ') // Remove newlines and extra spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Ensure all property names are quoted

  try {
    const outfitData = JSON.parse(jsonStr) as Outfit

    // Add outfit name
    locales[`outfit.${outfitData.id}.name`] = outfitData.name

    // Add item names
    outfitData.items.forEach((item) => {
      locales[`item.${item.id}.name`] = item.name
    })

    console.log(`Processed outfit ${outfitData.id}`)
  } catch (error) {
    console.error(`Error parsing outfit file ${file}:`, error)
    console.error('Problematic JSON string:', jsonStr)
  }
})

// Write to en.json
const localeContent = JSON.stringify(locales, null, 2)
fs.writeFileSync(path.join(LOCALES_DIR, 'en.json'), localeContent)

console.log('Generated English locale file successfully!')
console.log(`Total entries: ${Object.keys(locales).length}`)
