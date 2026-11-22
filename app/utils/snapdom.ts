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
  const controller = new AbortController()
  const listenerOptions = { once: true, signal: controller.signal }
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
            image.addEventListener('load', () => void decode(), listenerOptions)
            image.addEventListener('error', () => resolve(), listenerOptions)
          }
        })
    )
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, 10000)
  })
  try {
    await Promise.race([imageReady, timeout])
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
  return images.every((image) => image.complete && image.naturalWidth > 0)
}

const preparePngCapture = async (element: HTMLElement) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('SnapDOM export requires a browser environment')
  }

  if ('fonts' in document) {
    await document.fonts.ready
  }
  return waitForImages(element)
}

export const exportToPng = async (element: HTMLElement, fileName: string) => {
  await preparePngCapture(element)
  const snapdom = await getSnapdom()
  const image = await snapdom.toPng(element, {
    embedFonts: true,
    reconcile: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  downloadDataUrl(image.src, fileName)
}

export const capturePngBlob = async (element: HTMLElement) => {
  if (!(await preparePngCapture(element))) {
    throw new Error('Poster images did not load')
  }

  const snapdom = await getSnapdom()
  return snapdom.toBlob(element, {
    format: 'png',
    embedFonts: true,
    reconcile: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
    scale: 1,
    dpr: 1,
  })
}

export const downloadImageExportBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, fileName)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
