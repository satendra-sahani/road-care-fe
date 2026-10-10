import type { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { ProductDetail } from '@/components/shop/ProductDetail'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { isObjectId } from '@/lib/shopUrls'
import { breadcrumbLd, neighbours, pageProduct, productCard, productDescription, productLd, productTitle, type PageProduct, type ProductCard } from '@/lib/shopSeo'

// /shop/<product-slug>. The route param is still named `id` so old links keep
// resolving: an id URL permanently redirects to the product's slug URL.
// Each product page is built on its first visit and refreshed hourly (ISR) WITH the
// product in it — heading, price, description, specifications and links to other parts
// of its category are in the page a search engine reads. The browser then refreshes the
// product quietly (stock and price are always current).

type Props = { product: PageProduct | null; related: ProductCard[] }

const ld = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') })

export default function ProductDetailPage({ product, related }: Props) {
  const crumbs = product ? [
    { name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' },
    ...(product.category?.slug ? [{ name: product.category.name, path: `/shop/category/${product.category.slug}` }] : []),
    { name: product.name, path: `/shop/${product.slug}` },
  ] : []
  const offer = product ? productLd(product) : null
  return (
    <>
      {product && (
        <>
          <SEOHead
            fullTitle={productTitle(product)}
            description={productDescription(product)}
            ogImage={product.images[0]?.url || undefined}
            ogType="product"
            canonicalUrl={`https://bharatmechanics.com/shop/${product.slug}`}
          />
          <Head>
            <script key="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={ld(breadcrumbLd(crumbs))} />
            {offer && <script key="ld-product" type="application/ld+json" dangerouslySetInnerHTML={ld(offer)} />}
          </Head>
        </>
      )}
      <ProductDetail initial={product} related={related} />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' })

// The parts of a category, A–Z, kept for ten minutes: every product page of the category
// needs the same list to pick its neighbours from.
const categoryParts = new Map<string, { at: number; list: ProductCard[] }>()
async function partsOf(categoryId: string): Promise<ProductCard[]> {
  const hit = categoryParts.get(categoryId)
  if (hit && Date.now() - hit.at < 600_000) return hit.list
  const res = await serverGet<any[]>(`/common/products?category=${encodeURIComponent(categoryId)}&limit=500&sortBy=name&sortOrder=asc`, 8000)
  if (!Array.isArray(res?.data)) return hit?.list || []
  const list = res!.data.filter((p) => p?.slug).map(productCard)
  categoryParts.set(categoryId, { at: Date.now(), list })
  return list
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const key = String(params?.id || '')
  const res = await serverGet<any>(`/common/products/${encodeURIComponent(key)}`)
  if (res && res.status === 404) return { notFound: true, revalidate: 60 }
  const p = res?.data
  if (p?.slug && isObjectId(key) && key !== p.slug) {
    return { redirect: { destination: `/shop/${p.slug}`, permanent: true } }
  }
  const product = p?.name ? pageProduct({ ...p, slug: p.slug || key }) : null
  const related = product?.category?._id ? neighbours(await partsOf(product.category._id), product.slug, 8) : []
  // API unreachable → still render (the browser loads the product), and retry soon
  return { props: { product, related }, revalidate: product ? 3600 : 60 }
}
