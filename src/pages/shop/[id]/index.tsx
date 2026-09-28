import type { GetStaticPaths, GetStaticProps } from 'next'
import { ProductDetail } from '@/components/shop/ProductDetail'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId } from '@/lib/shopUrls'

// /shop/<product-slug>. The route param is still named `id` so old links keep
// resolving: an id URL permanently redirects to the product's slug URL.
// Each product page is built on its first visit and refreshed hourly (ISR);
// the product data itself still loads client-side in ProductDetail.

type Seo = { name: string; slug: string; description?: string; image?: string } | null

export default function ProductDetailPage({ seo }: { seo: Seo }) {
  return (
    <>
      {seo && (
        <SEOHead
          title={seo.name}
          description={seo.description || `Buy genuine ${seo.name} online at Bharat Mechanics — fast delivery, verified invoices.`}
          ogImage={seo.image}
          ogType="product"
          canonicalUrl={`https://bharatmechanics.com/shop/${seo.slug}`}
        />
      )}
      <ProductDetail />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const key = String(params?.id || '')
  const res = await serverGet<any>(`/common/products/${encodeURIComponent(key)}`)
  if (res && res.status === 404) return { notFound: true, revalidate: 60 }
  const p = res?.data
  if (p?.slug && isObjectId(key) && key !== p.slug) {
    return { redirect: { destination: `/shop/${p.slug}`, permanent: true } }
  }
  const img = p?.images?.[0]
  const seo: Seo = p?.name
    ? {
        name: p.name,
        slug: p.slug || key,
        description: typeof p.description === 'string' ? p.description.replace(/\s+/g, ' ').trim().slice(0, 160) : undefined,
        image: (typeof img === 'string' ? img : img?.url) || undefined,
      }
    : null
  // API unreachable → still render (client fetch), and retry the metadata soon
  return { props: { seo }, revalidate: seo ? 3600 : 60 }
}
