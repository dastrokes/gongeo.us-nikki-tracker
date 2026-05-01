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
const outputPath = path.join(publicDir, 'og.jpg')

const host = process.env.OG_HOST || '127.0.0.1'
const port = Number(process.env.OG_PORT || 4173)
const previewPath = process.env.OG_PREVIEW_PATH || '/og-preview?lang=en'

const serverUrl = `http://${host}:${port}`
const previewUrl = `${serverUrl}${previewPath}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const canReachServer = async (url) => {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(1000),
    })

    return res.ok || res.status < 500
  } catch {
    return false
  }
}

const waitForServer = async (url, timeoutMs = 60_000) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (await canReachServer(url)) return

    await sleep(1000)
  }

  throw new Error(`Timed out waiting for Nuxt dev server at ${url}`)
}

const launchBrowser = async () => {
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  })
}

const env = {
  ...process.env,
  HOST: host,
  PORT: String(port),
  NUXT_HOST: host,
  NUXT_PORT: String(port),
}

const startServer = () => {
  if (process.platform === 'win32') {
    return spawn(
      'cmd.exe',
      [
        '/d',
        '/c',
        'npm',
        'exec',
        '--',
        'nuxi',
        'dev',
        '--host',
        host,
        '--port',
        String(port),
        '--strict-port',
      ],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env,
      }
    )
  }

  return spawn(
    'npm',
    [
      'exec',
      '--',
      'nuxi',
      'dev',
      '--host',
      host,
      '--port',
      String(port),
      '--strict-port',
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env,
      detached: true,
    }
  )
}

const stopServer = async (devProcess) => {
  if (!devProcess || devProcess.killed) return

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(devProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
    })
  } else {
    try {
      process.kill(-devProcess.pid, 'SIGINT')
    } catch {
      devProcess.kill('SIGINT')
    }
  }

  await sleep(800)

  if (!devProcess.killed && process.platform !== 'win32') {
    try {
      process.kill(-devProcess.pid, 'SIGTERM')
    } catch {
      devProcess.kill('SIGTERM')
    }
  }
}

let browser = null
let devProcess = null
let startedServer = false

try {
  const serverAlreadyRunning = await canReachServer(serverUrl)

  if (serverAlreadyRunning) {
    console.log(`Using existing server at ${serverUrl}`)
  } else {
    console.log(`Starting Nuxt dev server at ${serverUrl}`)

    devProcess = startServer()
    startedServer = true

    devProcess.on('error', (error) => {
      throw error
    })

    await waitForServer(serverUrl)
  }

  browser = await launchBrowser()

  const page = await browser.newPage({
    viewport: {
      width: 1200,
      height: 630,
    },
  })

  await page.route('**/*', (route) => {
    const url = route.request().url()

    if (
      url.includes('umami') ||
      url.includes('googletagmanager') ||
      url.includes('google-analytics') ||
      url.includes('doubleclick') ||
      url.includes('adsbygoogle')
    ) {
      return route.abort()
    }

    return route.continue()
  })

  await page.goto(previewUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })

  const root = page.locator('[data-og-root="true"]')

  await root.waitFor({
    state: 'visible',
    timeout: 15_000,
  })

  await page.evaluate(async () => {
    await document.fonts?.ready
  })

  await root.evaluate(async (el) => {
    const images = Array.from(el.querySelectorAll('img'))

    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve()

        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', resolve, { once: true })
        })
      })
    )
  })

  await mkdir(publicDir, {
    recursive: true,
  })

  await root.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 100,
    animations: 'disabled',
  })

  console.log(`Generated ${outputPath}`)
} finally {
  if (browser) {
    await browser.close()
  }

  if (startedServer) {
    await stopServer(devProcess)
  }
}
