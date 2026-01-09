export const getImageProvider = () => {
  return (
    process.env.NUXT_IMAGE_PROVIDER ||
    (process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx')
  )
}
