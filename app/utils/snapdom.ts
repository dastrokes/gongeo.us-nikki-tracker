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
  link.click()
}

export const exportToPng = async (element: HTMLElement, fileName: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('SnapDOM export requires a browser environment')
  }

  if ('fonts' in document) {
    await document.fonts.ready
  }

  const snapdom = await getSnapdom()
  const image = await snapdom.toPng(element, {
    embedFonts: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  downloadDataUrl(image.src, fileName)
}
