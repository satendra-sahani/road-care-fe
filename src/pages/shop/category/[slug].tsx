import type { GetStaticPaths, GetStaticProps } from 'next'
import { ShopListing } from '@/components/shop/ShopListing'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId, titleFromSlug } from '@/lib/shopUrls'

// /shop/category/<slug> — the shop listing filtered to one category (a parent
// category also shows its sub-categories). An old id URL redirects to the slug.

export default function CategoryShopPage({ slug, name }: { slug: string; name: string }) {
  return (
    <>
      <SEOHead
        title={`${name} – Buy Genuine Parts Online`}
        description={`Shop genuine ${name} for cars and bikes from top brands at Bharat Mechanics. Best prices, verified invoices and fast doorstep delivery.`}
        canonicalUrl={`https://bharatmechanics.com/shop/category/${slug}`}
      />
      <ShopListing categorySlug={slug} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const key = String(params?.slug || '')
  const res = await serverGet<any[]>('/common/categories?limit=500')
  const list = Array.isArray(res?.data) ? res!.data : null
  if (list) {
    const cat = list.find((c) => c.slug === key.toLowerCase() || c._id === key)
    if (!cat) return { notFound: true, revalidate: 300 }
    if (isObjectId(key) && cat.slug && cat.slug !== key) {
      return { redirect: { destination: `/shop/category/${cat.slug}`, permanent: true } }
    }
    return { props: { slug: cat.slug || key, name: cat.name || titleFromSlug(key) }, revalidate: 3600 }
  }
  // API unreachable: render from the slug, retry soon
  return { props: { slug: key, name: titleFromSlug(key) }, revalidate: 60 }
}
