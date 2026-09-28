import type { GetStaticPaths, GetStaticProps } from 'next'
import { ShopListing } from '@/components/shop/ShopListing'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId, slugify, titleFromSlug } from '@/lib/shopUrls'

// /shop/brand/<slug> — the shop listing filtered to one brand. Brands have no
// stored slug; it is derived from the name (same rule as the backend).
// An old id URL redirects to the slug.

export default function BrandShopPage({ slug, name }: { slug: string; name: string }) {
  return (
    <>
      <SEOHead
        title={`${name} Parts – Buy Genuine ${name} Online`}
        description={`Buy genuine ${name} auto parts and accessories online at Bharat Mechanics. Best prices, verified invoices and fast doorstep delivery.`}
        canonicalUrl={`https://bharatmechanics.com/shop/brand/${slug}`}
      />
      <ShopListing brandSlug={slug} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps = async ({ params }) => {
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
    return { props: { slug: slug || key, name: br.name || titleFromSlug(key) }, revalidate: 3600 }
  }
  return { props: { slug: key, name: titleFromSlug(key) }, revalidate: 60 }
}
