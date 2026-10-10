import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { ShopListing } from '@/components/shop/ShopListing'
import { ProductLinks } from '@/components/shop/ShopLinks'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId, titleFromSlug } from '@/lib/shopUrls'
import { breadcrumbLd, fitTitle, listOf, productCard, topNames, type ProductCard } from '@/lib/shopSeo'

// /shop/category/<slug> — the shop listing filtered to one category (a parent
// category also shows its sub-categories). An old id URL redirects to the slug.
// The page is built with the category's own heading and an A–Z list of links to every
// part in it (the product grid itself loads in the browser).

type Props = { slug: string; name: string; parts: ProductCard[]; brands: string[] }

export default function CategoryShopPage({ slug, name, parts, brands }: Props) {
  const n = parts.length
  return (
    <>
      <SEOHead
        fullTitle={fitTitle(`${name} – Buy Genuine Parts Online`, `${name} – Genuine Parts Online`, `${name} – Genuine Parts`)}
        description={`Shop genuine ${name} for cars and bikes from top brands at Bharat Mechanics. Best prices, verified invoices and fast doorstep delivery.`}
        canonicalUrl={`https://bharatmechanics.com/shop/category/${slug}`}
      />
      <Head>
        <script key="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name, path: `/shop/category/${slug}` }])).replace(/</g, '\\u003c') }} />
      </Head>
      <ShopListing
        categorySlug={slug}
        heading={name}
        intro={n ? `${n} genuine ${n === 1 ? 'part' : 'parts'} in ${name} for cars and bikes${brands.length ? `, from ${listOf(brands)}` : ''} — with verified invoices and doorstep delivery.` : `Genuine ${name} for cars and bikes, with verified invoices and doorstep delivery.`}
        extra={<ProductLinks title={`All ${name} (${n})`} products={parts} />}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const key = String(params?.slug || '')
  const res = await serverGet<any[]>('/common/categories?limit=500')
  const list = Array.isArray(res?.data) ? res!.data : null
  if (list) {
    const cat = list.find((c) => c.slug === key.toLowerCase() || c._id === key)
    if (!cat) return { notFound: true, revalidate: 300 }
    if (isObjectId(key) && cat.slug && cat.slug !== key) {
      return { redirect: { destination: `/shop/category/${cat.slug}`, permanent: true } }
    }
    const slug = cat.slug || key
    const prods = await serverGet<any[]>(`/common/products?category=${encodeURIComponent(cat._id)}&limit=500&sortBy=name&sortOrder=asc`, 8000)
    const all = Array.isArray(prods?.data) ? prods!.data.filter((p) => p?.slug) : []
    // the list is links only: name, where it lives, brand
    const parts = all.map((p) => ({ ...productCard(p), image: '' }))
    return { props: { slug, name: cat.name || titleFromSlug(key), parts, brands: topNames(all.map((p) => p?.brand?.name), 4) }, revalidate: prods ? 3600 : 60 }
  }
  // API unreachable: render from the slug, retry soon
  return { props: { slug: key, name: titleFromSlug(key), parts: [], brands: [] }, revalidate: 60 }
}
