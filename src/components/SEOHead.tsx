import Head from 'next/head'
import { useRouter } from 'next/router'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
  noIndex?: boolean
}

const SITE_NAME = 'Bharat Mechanics'
const DEFAULT_DESCRIPTION =
  'Bharat Mechanics – India\'s trusted auto parts and vehicle service platform. Buy genuine car & bike parts, book certified mechanics, and get doorstep repair services. 100% genuine products, fast delivery, 6-month warranty.'
const DEFAULT_KEYWORDS =
  'auto parts, car parts, bike parts, vehicle service, mechanic booking, Bharat Mechanics, genuine auto parts India, car accessories, two wheeler parts, doorstep mechanic, car repair, bike repair, engine oil, brake pads, filters, spark plugs, battery, tyres'
const SITE_URL = 'https://bharatmechanics.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/brand-logo-v3.png`

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) {
  const router = useRouter()
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Auto Parts & Vehicle Services`
  // Every indexable page gets a self-referencing canonical (query strings and
  // hashes stripped) unless the page passes its own.
  const path = (router?.asPath || '/').split(/[?#]/)[0]
  const canonical = canonicalUrl || `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Viewport (keyed so the _app default is replaced, never duplicated) */}
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      {/* Robots – indexed by default; pages can opt out via noIndex */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:url" content={canonical} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical */}
      {!noIndex && <link rel="canonical" href={canonical} />}

      {/* Additional SEO */}
      <meta name="author" content="Bharat Mechanics" />
    </Head>
  )
}
