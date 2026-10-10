import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { ShopListing } from '@/components/shop/ShopListing'
import { ProductLinks } from '@/components/shop/ShopLinks'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId, slugify, titleFromSlug } from '@/lib/shopUrls'
import { breadcrumbLd, fitTitle, listOf, productCard, topNames, type ProductCard } from '@/lib/shopSeo'

// /shop/brand/<slug> — the shop listing filtered to one brand. Brands have no
// stored slug; it is derived from the name (same rule as the backend).
// An old id URL redirects to the slug.
// The page is built with the brand's own heading and an A–Z list of links to every
// part of that brand (the product grid itself loads in the browser).

type Props = { slug: string; name: string; parts: ProductCard[]; kinds: string[] }

export default function BrandShopPage({ slug, name, parts, kinds }: Props) {
  const n = parts.length
  return (
    <>
      <SEOHead
        fullTitle={fitTitle(`${name} Parts – Buy Genuine ${name} Online`, `${name} Parts – Genuine & Original`, `${name} Auto Parts Online`, `${name} Parts`)}
        description={`Buy genuine ${name} auto parts and accessories online at Bharat Mechanics. Best prices, verified invoices and fast doorstep delivery.`}
        canonicalUrl={`https://bharatmechanics.com/shop/brand/${slug}`}
      />
      <Head>
        <script key="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name: `${name} Parts`, path: `/shop/brand/${slug}` }])).replace(/</g, '\\u003c') }} />
      </Head>
      <ShopListing
        brandSlug={slug}
        heading={`${name} Parts`}
        intro={n ? `${n} genuine ${name} ${n === 1 ? 'part' : 'parts'}${kinds.length ? ` — ${listOf(kinds)}` : ''} — with verified invoices and doorstep delivery.` : `Genuine ${name} auto parts and accessories, with verified invoices and doorstep delivery.`}
        extra={<ProductLinks title={`All ${name} parts (${n})`} products={parts} />}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const key = String(params?.slug || '')
  const res = await serverGet<any[]>('/common/brands?limit=1000')
  const list = Array.isArray(res?.data) ? res!.data : null
  if (list) {
    const br = list.find((b) => slugify(b.name) === key.toLowerCase() || b._id === key)
    if (!br) return { notFound: true, revalidate: 300 }
    const slug = slugify(br.name)
    if (isObjectId(key) && slug && slug !== key) {
      return { redirect: { destination: `/shop/brand/${slug}`, permanent: true } }
    }
    const prods = await serverGet<any[]>(`/common/products?brand=${encodeURIComponent(br._id)}&limit=500&sortBy=name&sortOrder=asc`, 8000)
    const all = Array.isArray(prods?.data) ? prods!.data.filter((p) => p?.slug) : []
    // the list is links only: name and where it lives (the brand is the page itself)
    const parts = all.map((p) => ({ ...productCard(p), image: '', brand: '' }))
    return { props: { slug: slug || key, name: br.name || titleFromSlug(key), parts, kinds: topNames(all.map((p) => p?.category?.name), 4) }, revalidate: prods ? 3600 : 60 }
  }
  return { props: { slug: key, name: titleFromSlug(key), parts: [], kinds: [] }, revalidate: 60 }
}
