const ensureSnapdomRuntimeCompatibility = () => {
  const globals = window as unknown as Record<string, unknown>
  if (typeof globals.HTMLEmbedElement === 'function') return

  const embedConstructor = document.createElement('embed').constructor
  if (typeof embedConstructor !== 'function') return

  Object.defineProperty(window, 'HTMLEmbedElement', {
    value: embedConstructor,
    configurable: true,
    writable: true,
  })
}

const getSnapdom = async () => {
  ensureSnapdomRuntimeCompatibility()
  const { snapdom } = await import('@zumer/snapdom')
  return snapdom
}

const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img'))
  const imageReady = Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          const decode = async () => {
            if (image.naturalWidth > 0)
              await image.decode().catch(() => undefined)
            resolve()
          }

          if (image.complete) void decode()
          else {
            image.addEventListener('load', () => void decode(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
          }
        })
    )
  )
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 10000))
  await Promise.race([imageReady, timeout])
}

export const exportToPng = async (element: HTMLElement, fileName: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('SnapDOM export requires a browser environment')
  }

  if ('fonts' in document) {
    await document.fonts.ready
  }
  await waitForImages(element)

  const snapdom = await getSnapdom()
  const image = await snapdom.toPng(element, {
    embedFonts: true,
    reconcile: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  downloadDataUrl(image.src, fileName)
}
