import Head from 'next/head'

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
const DEFAULT_OG_IMAGE = 'https://bharatmechanics.com/brand-logo-v3.png'
const FAVICON_URL = '/favicon.png'

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Auto Parts & Vehicle Services`

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Favicon */}
      <link rel="icon" type="image/png" href={FAVICON_URL} />
      <link rel="apple-touch-icon" href={FAVICON_URL} />

      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

      {/* Charset */}
      <meta charSet="utf-8" />

      {/* Theme color */}
      <meta name="theme-color" content="#1B3B6F" />

      {/* Robots – indexed by default; pages can opt out via noIndex */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Additional SEO */}
      <meta name="author" content="Bharat Mechanics" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      <meta httpEquiv="content-language" content="en-IN" />
    </Head>
  )
}
