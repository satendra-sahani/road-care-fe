// Optimized image for the site's static design assets (public/design/*).
// Wraps next/image so every picture is served resized (srcset) in WebP, lazy by
// default, and with intrinsic width/height (no layout shift). Intrinsic sizes
// come from DESIGN_DIMS, so call sites only pass `src`, `alt` and `sizes` —
// the rendered size is still controlled entirely by `className`/`style`.
//
// Remote ImageKit URLs are passed through `ikUrl()` instead (see below).
import Image, { type ImageProps } from 'next/image'
import { DESIGN_DIMS } from '@/lib/designImageDims'

type DImgProps = Omit<ImageProps, 'src' | 'width' | 'height' | 'alt'> & {
  src: string
  alt?: string
  width?: number
  height?: number
}

export function DImg({ src, alt = '', width, height, sizes, ...rest }: DImgProps) {
  const dims = DESIGN_DIMS[src]
  const w = width ?? dims?.[0] ?? 200
  const h = height ?? dims?.[1] ?? 200
  return <Image src={src} alt={alt} width={w} height={h} sizes={sizes} {...rest} />
}

/** Resize + auto-format an ImageKit URL (product/category photos from the API). Other hosts pass through. */
export function ikUrl(url: string | undefined | null, width: number): string {
  if (!url) return ''
  if (!/^https:\/\/ik\.imagekit\.io\//.test(url) || /[?&]tr=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}tr=w-${Math.round(width)},q-80,f-auto`
}
