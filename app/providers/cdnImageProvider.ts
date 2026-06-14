import { joinURL } from 'ufo'
import type { ImageProvider, ProviderGetImage } from '@nuxt/image'

interface CdnImageProviderOptions {
  baseURL?: string
}

const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:\/\//i

const getImage: ProviderGetImage<CdnImageProviderOptions> = (src, options) => ({
  url:
    options.baseURL && !absoluteUrlPattern.test(src)
      ? joinURL(options.baseURL, src)
      : src,
})

export default (() => ({
  getImage,
})) satisfies () => ImageProvider<CdnImageProviderOptions>
