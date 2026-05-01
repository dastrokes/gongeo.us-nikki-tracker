import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const publicDir = path.join(repoRoot, 'public')
const outputPath = path.join(publicDir, 'og.png')
const host = process.env.OG_HOST || '127.0.0.1'
const port = Number(process.env.OG_PORT || 4173)
const previewPath = process.env.OG_PREVIEW_PATH || '/og-preview?lang=en'
const previewUrl = `http://${host}:${port}${previewPath}`
const serverUrl = `http://${host}:${port}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForServer = async (url, timeoutMs = 90_000) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return
    } catch {
      // Server is not ready yet.
    }

    await sleep(750)
  }

  throw new Error(`Timed out waiting for Nuxt dev server at ${url}`)
}

const launchBrowser = async () => {
  const explicitExecutable = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  const attempts = [
    explicitExecutable ? { executablePath: explicitExecutable } : null,
    { channel: 'msedge' },
    { channel: 'chrome' },
    {},
  ].filter(Boolean)

  let lastError = null
  for (const launchOptions of attempts) {
    try {
      return await chromium.launch({
        headless: true,
        ...launchOptions,
      })
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    `Failed to launch Chromium for OG generation. Last error: ${lastError}`
  )
}

const nuxiExecutable = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nuxi.cmd' : 'nuxi'
)

const devProcess = spawn(
  `"${nuxiExecutable}" dev --host ${host} --port ${port} --strict-port`,
  [],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  }
)

let browser = null

try {
  await waitForServer(serverUrl)

  browser = await launchBrowser()
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  })

  await page.goto(previewUrl, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-og-root="true"]', { timeout: 30_000 })

  const root = await page.$('[data-og-root="true"]')
  if (!root) throw new Error('Could not find OG root element.')

  await mkdir(publicDir, { recursive: true })
  await root.screenshot({ path: outputPath, type: 'png' })
  console.log(`Generated ${outputPath}`)
} finally {
  if (browser) {
    await browser.close()
  }

  devProcess.kill('SIGINT')
  await sleep(1000)
  if (!devProcess.killed) devProcess.kill('SIGTERM')
}
