import type { GetStaticProps } from 'next'
import { ShopListing } from '@/components/shop/ShopListing'
import { ShopDirectory } from '@/components/shop/ShopLinks'
import { SEOHead } from '@/components/SEOHead'
import { serverGet } from '@/lib/serverApi'
import { brandSlug, categorySlug } from '@/lib/shopUrls'

// /shop. The page is built (and refreshed hourly) with a link to every category and every
// brand in it: the filters load in the browser, and without these plain links a search
// engine had no way from the shop to its category and brand pages.

type Named = { name: string; slug: string }
type Props = { categories: Named[]; brands: Named[] }

export default function Shop({ categories, brands }: Props) {
  return (
    <>
      <SEOHead
        title="Buy Genuine Auto Parts Online"
        description="Buy genuine car & bike parts online: engine oil, brake pads, filters, batteries & more from top brands. Delivered to Gorakhpur, Deoria, Kushinagar & all India."
        keywords="auto parts near me, spare parts shop near me, bike spare parts online, buy auto parts online, car parts shop, bike parts, engine oil, brake pads, air filter, oil filter, spark plug, car battery, tyre, Bosch, Denso, NGK, Castrol, Mobil, Shell"
      />
      <ShopListing extra={<ShopDirectory categories={categories} brands={brands} />} />
    </>
  )
}

const byName = (a: Named, b: Named) => a.name.localeCompare(b.name)

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [cats, brs] = await Promise.all([
    serverGet<any[]>('/common/categories?limit=500', 8000),
    serverGet<any[]>('/common/brands?limit=1000', 8000),
  ])
  const pick = (list: any[] | null | undefined, slugOf: (x: any) => string): Named[] =>
    (Array.isArray(list) ? list : []).filter((x) => x?.isActive !== false && x?.name && slugOf(x)).map((x) => ({ name: String(x.name).trim(), slug: slugOf(x) })).sort(byName)
  const categories = pick(cats?.data, categorySlug), brands = pick(brs?.data, brandSlug)
  // API unreachable: the shop still works (it loads in the browser) — try again in a minute
  return { props: { categories, brands }, revalidate: categories.length || brands.length ? 3600 : 60 }
}
