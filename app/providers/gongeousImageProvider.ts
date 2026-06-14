import imagekitProvider from '@nuxt/image/runtime/providers/imagekit'
import netlifyImageCdnProvider from '@nuxt/image/runtime/providers/netlifyImageCdn'
import { joinURL } from 'ufo'
import cdnImageProvider from './cdnImageProvider'
import type {
  ImageProvider,
  ProviderGetImage,
  ResolvedImageModifiers,
} from '@nuxt/image'

type BannerImageProvider = 'imagekit' | 'netlify' | 'cdn'

interface GongeousImageProviderOptions {
  baseURL?: string
  bannerImageProvider?: BannerImageProvider
  cdnBaseURL?: string
}

const bannerPathPrefix = '/images/banners/'
const imagekit = imagekitProvider()
const netlifyImageCdn = netlifyImageCdnProvider()
const cdn = cdnImageProvider()
const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:\/\//i

const isBannerImage = (src: string) => src.startsWith(bannerPathPrefix)

const getCdnSource = (src: string, baseURL?: string) =>
  baseURL && !absoluteUrlPattern.test(src) ? joinURL(baseURL, src) : src

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
      getCdnSource(src, options.cdnBaseURL),
      {
        ...options,
        baseURL: '/.netlify/images',
        modifiers: getNetlifyModifiers(options.modifiers),
      },
      ctx
    )
  }

  if (options.bannerImageProvider === 'cdn' && isBannerImage(src)) {
    return cdn.getImage(
      src,
      {
        ...options,
        baseURL: options.cdnBaseURL,
      },
      ctx
    )
  }

  return imagekit.getImage(src, options, ctx)
}

export default (() => ({
  getImage,
})) satisfies () => ImageProvider<GongeousImageProviderOptions>
