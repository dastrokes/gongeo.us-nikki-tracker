import imagekitProvider from '@nuxt/image/runtime/providers/imagekit'
import netlifyImageCdnProvider from '@nuxt/image/runtime/providers/netlifyImageCdn'
import type {
  ImageProvider,
  ProviderGetImage,
  ResolvedImageModifiers,
} from '@nuxt/image'

type BannerImageProvider = 'imagekit' | 'netlify'

interface GongeousImageProviderOptions {
  baseURL?: string
  bannerImageProvider?: BannerImageProvider
}

const bannerPathPrefix = '/images/banners/'
const imagekit = imagekitProvider()
const netlifyImageCdn = netlifyImageCdnProvider()

const isBannerImage = (src: string) => src.startsWith(bannerPathPrefix)

const getNetlifyModifiers = (modifiers: Partial<ResolvedImageModifiers>) => {
  if (modifiers.format !== 'auto') return modifiers

  const { format: _format, ...netlifyModifiers } = modifiers
  return netlifyModifiers
}

const getImage: ProviderGetImage<GongeousImageProviderOptions> = (
  src,
  options,
  ctx
) => {
  if (options.bannerImageProvider === 'netlify' && isBannerImage(src)) {
    return netlifyImageCdn.getImage(
      src,
      {
        ...options,
        baseURL: '/.netlify/images',
        modifiers: getNetlifyModifiers(options.modifiers),
      },
      ctx
    )
  }

  return imagekit.getImage(src, options, ctx)
}

export default (() => ({
  getImage,
})) satisfies () => ImageProvider<GongeousImageProviderOptions>
