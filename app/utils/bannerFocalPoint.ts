// Visually reviewed horizontal banner focal points; vertically centered.
const BANNER_FOCAL_POINTS: Record<number, number> = {
  1: 0.52,
  2: 0.73,
  3: 0.69,
  4: 0.65,
  5: 0.6,
  6: 0.61,
  7: 0.78,
  8: 0.76,
  9: 0.58,
  10: 0.41,
  11: 0.59,
  12: 0.55,
  13: 0.61,
  14: 0.69,
  15: 0.56,
  16: 0.29,
  17: 0.4,
  18: 0.37,
  19: 0.62,
  20: 0.6,
  21: 0.42,
  22: 0.35,
  23: 0.48,
  24: 0.64,
  25: 0.4,
  26: 0.48,
  27: 0.43,
  28: 0.43,
  29: 0.45,
  30: 0.42,
  31: 0.36,
  32: 0.45,
  33: 0.38,
  34: 0.4,
  35: 0.4,
  36: 0.55,
  37: 0.43,
  38: 0.58,
  39: 0.31,
  40: 0.36,
  41: 0.66,
  42: 0.38,
  43: 0.64,
  44: 0.36,
  45: 0.38,
  46: 0.51,
  47: 0.4,
  48: 0.6,
  49: 0.52,
  50: 0.46,
  51: 0.68,
  52: 0.37,
  53: 0.48,
  54: 0.58,
  55: 0.48,
  56: 0.46,
  57: 0.59,
  58: 0.42,
  59: 0.6,
  60: 0.48,
  61: 0.48,
  62: 0.46,
  63: 0.5,
  64: 0.5,
  65: 0.47,
  66: 0.56,
  67: 0.52,
  68: 0.46,
  69: 0.52,
  70: 0.5,
  71: 0.46,
  72: 0.5,
  73: 0.57,
  74: 0.5,
  75: 0.49,
  76: 0.64,
  77: 0.47,
}

export const getBannerFocalPointStyle = (bannerId: number) => {
  const x = BANNER_FOCAL_POINTS[bannerId] ?? 0.5
  return { objectPosition: `${x * 100}% 50%` }
}

export const applyBannerFocalPoint = (event: Event, bannerId: number) => {
  const image = event.currentTarget
  if (!(image instanceof HTMLImageElement)) return

  const width = image.clientWidth
  const height = image.clientHeight
  if (!width || !height || !image.naturalWidth || !image.naturalHeight) return

  const focusX = BANNER_FOCAL_POINTS[bannerId] ?? 0.5
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight
  )
  const renderedWidth = image.naturalWidth * scale
  const overflowX = Math.max(0, renderedWidth - width)
  const cropX = Math.min(
    overflowX,
    Math.max(0, focusX * renderedWidth - width / 2)
  )
  const positionX = overflowX ? (cropX / overflowX) * 100 : 50
  image.style.objectPosition = `${positionX}% 50%`
}
