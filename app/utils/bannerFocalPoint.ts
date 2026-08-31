// Visually reviewed banner focal points
const BANNER_FOCAL_POINTS: Record<number, readonly [number, number]> = {
  1: [0.52, 0.5],
  2: [0.73, 0.5],
  3: [0.69, 0.5],
  4: [0.65, 0.5],
  5: [0.6, 0.5],
  6: [0.61, 0.5],
  7: [0.78, 0.5],
  8: [0.76, 0.5],
  9: [0.58, 0.5],
  10: [0.41, 0.5],
  11: [0.59, 0.5],
  12: [0.55, 0.5],
  13: [0.61, 0.5],
  14: [0.69, 0.5],
  15: [0.56, 0.5],
  16: [0.62, 0.5],
  17: [0.4, 0.5],
  18: [0.37, 0.5],
  19: [0.62, 0.5],
  20: [0.6, 0.5],
  21: [0.42, 0.5],
  22: [0.35, 0.5],
  23: [0.48, 0.5],
  24: [0.64, 0.5],
  25: [0.4, 0.5],
  26: [0.48, 0.5],
  27: [0.43, 0.5],
  28: [0.43, 0.5],
  29: [0.45, 0.5],
  30: [0.42, 0.5],
  31: [0.36, 0.5],
  32: [0.45, 0.5],
  33: [0.38, 0.5],
  34: [0.4, 0.5],
  35: [0.4, 0.5],
  36: [0.55, 0.5],
  37: [0.43, 0.5],
  38: [0.58, 0.5],
  39: [0.31, 0.5],
  40: [0.36, 0.5],
  41: [0.66, 0.5],
  42: [0.38, 0.5],
  43: [0.64, 0.5],
  44: [0.36, 0.5],
  45: [0.38, 0.5],
  46: [0.51, 0.5],
  47: [0.4, 0.5],
  48: [0.6, 0.5],
  49: [0.52, 0.5],
  50: [0.46, 0.5],
  51: [0.68, 0.5],
  52: [0.37, 0.5],
  53: [0.48, 0.5],
  54: [0.58, 0.5],
  55: [0.48, 0.5],
  56: [0.46, 0.5],
  57: [0.59, 0.5],
  58: [0.42, 0.5],
  59: [0.6, 0.5],
  60: [0.48, 0.5],
  61: [0.48, 0.5],
  62: [0.46, 0.5],
  63: [0.5, 0.5],
  64: [0.5, 0.5],
  65: [0.47, 0.5],
  66: [0.56, 0.5],
  67: [0.52, 0.5],
  68: [0.46, 0.5],
  69: [0.52, 0.5],
  70: [0.5, 0.5],
  71: [0.46, 0.5],
  72: [0.5, 0.5],
  73: [0.57, 0.5],
}

export const getBannerFocalPointStyle = (bannerId: number) => {
  const [x, y] = BANNER_FOCAL_POINTS[bannerId] ?? [0.5, 0.5]
  return { objectPosition: `${x * 100}% ${y * 100}%` }
}

export const applyBannerFocalPoint = (event: Event, bannerId: number) => {
  const image = event.currentTarget
  if (!(image instanceof HTMLImageElement)) return

  const width = image.clientWidth
  const height = image.clientHeight
  if (!width || !height || !image.naturalWidth || !image.naturalHeight) return

  const [focusX, focusY] = BANNER_FOCAL_POINTS[bannerId] ?? [0.5, 0.5]
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight
  )
  const renderedWidth = image.naturalWidth * scale
  const renderedHeight = image.naturalHeight * scale
  const overflowX = Math.max(0, renderedWidth - width)
  const overflowY = Math.max(0, renderedHeight - height)
  const cropX = Math.min(
    overflowX,
    Math.max(0, focusX * renderedWidth - width / 2)
  )
  const cropY = Math.min(
    overflowY,
    Math.max(0, focusY * renderedHeight - height / 2)
  )
  const positionX = overflowX ? (cropX / overflowX) * 100 : 50
  const positionY = overflowY ? (cropY / overflowY) * 100 : 50
  image.style.objectPosition = `${positionX}% ${positionY}%`
}
