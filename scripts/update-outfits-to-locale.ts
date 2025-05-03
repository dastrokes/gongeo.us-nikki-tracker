import fs from 'fs'
import path from 'path'

const OUTFITS_DIR = path.join(process.cwd(), 'data/outfits')

// Read all outfit files
const outfitFiles = fs
  .readdirSync(OUTFITS_DIR)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts')

outfitFiles.forEach((file) => {
  const filePath = path.join(OUTFITS_DIR, file)
  let content = fs.readFileSync(filePath, 'utf-8')

  try {
    // Extract the outfit object directly from the file content
    const outfitData = {
      id: content.match(/id: ['"]([^'"]+)['"]/)?.[1],
      items: Array.from(
        content.matchAll(/id: ['"](\d+)['"][^}]+name: ['"]([^'"]+)['"]/g)
      ).map((match) => ({ id: match[1], name: match[2] })),
    }

    if (!outfitData.id) {
      console.log(`Could not find outfit ID in ${file}`)
      return
    }

    // Replace outfit name with localization key
    content = content.replace(
      /(name: ['"])[^'"]+(['"])/,
      `$1outfit.${outfitData.id}.name$2`
    )

    // Replace item names with localization keys
    outfitData.items.forEach((item) => {
      // Find the exact line containing this item's name and replace it
      const itemPattern = new RegExp(
        `(id: ['"]${item.id}['"][^}]*name: ['"])(?:item\\.\\d+\\.name|[^'"]+)(['"])`,
        's'
      )
      content = content.replace(itemPattern, `$1item.${item.id}.name$2`)
    })

    // Write back to file
    fs.writeFileSync(filePath, content)
    console.log(`Updated ${file} successfully`)
  } catch (error) {
    console.error(`Error processing outfit file ${file}:`, error)
  }
})

// Second pass: Clean up any remaining cases where there's text after .name
outfitFiles.forEach((file) => {
  const filePath = path.join(OUTFITS_DIR, file)
  let content = fs.readFileSync(filePath, 'utf-8')

  try {
    // Find and replace any cases where there's text after .name
    content = content.replace(
      /(name: ['"](?:item|outfit)\.[^'"]+\.name)(?:'s [^'"]*)?(['"])/g,
      '$1$2'
    )

    // Write back to file
    fs.writeFileSync(filePath, content)
    console.log(`Cleaned up ${file} successfully`)
  } catch (error) {
    console.error(`Error cleaning up outfit file ${file}:`, error)
  }
})

console.log('Updated and cleaned up outfit files successfully!')
