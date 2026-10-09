import type { GetServerSideProps } from 'next'
import { CUSTOMER_WEB } from '@/lib/customerWeb'

// Generated sitemap: the main site pages + every blog guide and city page.
// (Replaces the old hand-written public/sitemap.xml so new posts are listed
// automatically.)

const SITE = 'https://bharatmechanics.com'

const STATIC: { path: string; changefreq: string; priority: string; lastmod: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0', lastmod: '2026-09-26' },
  { path: '/shop', changefreq: 'daily', priority: '0.9', lastmod: '2026-09-26' },
  { path: '/services', changefreq: 'weekly', priority: '0.9', lastmod: '2026-09-26' },
  // the booking page redirects to the app store while customer web is off — keep it out of the sitemap then
  ...(CUSTOMER_WEB ? [{ path: '/service', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' }] : []),
  { path: '/mechanics', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' },
  { path: '/training', changefreq: 'weekly', priority: '0.7', lastmod: '2026-09-26' },
  { path: '/list-your-shop', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-26' },
  { path: '/become-mechanic', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-26' },
  { path: '/register/mechanic', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-27' },
  { path: '/register/shop', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-27' },
]

// Shop URLs (SEO-friendly slugs, see lib/shopUrls): every active product,
// category and brand. Cached in memory for an hour; if the API is unreachable
// the sitemap is still served with the static pages and blog posts.
type Url = { loc: string; lastmod: string; changefreq: string; priority: string }
let shopCache: { at: number; urls: Url[] } | null = null
async function shopUrls(): Promise<Url[]> {
  if (shopCache && Date.now() - shopCache.at < 3600_000) return shopCache.urls
  const { serverGet } = await import('@/lib/serverApi')
  const { productSlug, categorySlug, brandSlug } = await import('@/lib/shopUrls')
  const [cats, brands, prods] = await Promise.all([
    serverGet<any[]>('/common/categories?limit=500', 8000),
    serverGet<any[]>('/common/brands?limit=1000', 8000),
    serverGet<any[]>('/common/products?limit=5000', 15000),
  ])
  const day = (d?: string) => (d ? String(d).slice(0, 10) : new Date().toISOString().slice(0, 10))
  const urls: Url[] = [
    ...(Array.isArray(cats?.data) ? cats!.data : []).filter((c) => c.isActive !== false && categorySlug(c))
      .map((c) => ({ loc: `${SITE}/shop/category/${categorySlug(c)}`, lastmod: day(c.updatedAt), changefreq: 'weekly', priority: '0.8' })),
    ...(Array.isArray(brands?.data) ? brands!.data : []).filter((b) => b.isActive !== false && brandSlug(b))
      .map((b) => ({ loc: `${SITE}/shop/brand/${brandSlug(b)}`, lastmod: day(b.updatedAt), changefreq: 'weekly', priority: '0.6' })),
    ...(Array.isArray(prods?.data) ? prods!.data : []).filter((p) => p.slug)
      .map((p) => ({ loc: `${SITE}/shop/${productSlug(p)}`, lastmod: day(p.updatedAt), changefreq: 'weekly', priority: '0.7' })),
  ]
  if (urls.length) shopCache = { at: Date.now(), urls }
  return urls
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const { getAllPosts } = await import('@/data/blog/posts')
  const { CITY_BY_SLUG } = await import('@/data/blog/cities')
  const urls = [
    ...STATIC.map((s) => ({ loc: `${SITE}${s.path}`, lastmod: s.lastmod, changefreq: s.changefreq, priority: s.priority })),
    ...getAllPosts().map((p) => {
      const tier = p.city ? CITY_BY_SLUG[p.slug.replace(/^mechanic-in-/, '')]?.tier ?? 3 : 1
      return { loc: `${SITE}/blog/${p.slug}`, lastmod: p.dateModified, changefreq: 'monthly', priority: tier === 1 ? '0.8' : tier === 2 ? '0.7' : '0.6' }
    }),
    ...(await shopUrls()),
  ]
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    '\n</urlset>\n'
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.write(xml)
  res.end()
  return { props: {} }
}

export default function Sitemap() {
  return null
}
