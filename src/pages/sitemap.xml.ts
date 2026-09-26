import type { GetServerSideProps } from 'next'

// Generated sitemap: the main site pages + every blog guide and city page.
// (Replaces the old hand-written public/sitemap.xml so new posts are listed
// automatically.)

const SITE = 'https://bharatmechanics.com'

const STATIC: { path: string; changefreq: string; priority: string; lastmod: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0', lastmod: '2026-09-26' },
  { path: '/shop', changefreq: 'daily', priority: '0.9', lastmod: '2026-09-26' },
  { path: '/services', changefreq: 'weekly', priority: '0.9', lastmod: '2026-09-26' },
  { path: '/service', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' },
  { path: '/mechanics', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8', lastmod: '2026-09-26' },
  { path: '/training', changefreq: 'weekly', priority: '0.7', lastmod: '2026-09-26' },
  { path: '/list-your-shop', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-26' },
  { path: '/become-mechanic', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-26' },
]

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const { getAllPosts } = await import('@/data/blog/posts')
  const { CITY_BY_SLUG } = await import('@/data/blog/cities')
  const urls = [
    ...STATIC.map((s) => ({ loc: `${SITE}${s.path}`, lastmod: s.lastmod, changefreq: s.changefreq, priority: s.priority })),
    ...getAllPosts().map((p) => {
      const tier = p.city ? CITY_BY_SLUG[p.slug.replace(/^mechanic-in-/, '')]?.tier ?? 3 : 1
      return { loc: `${SITE}/blog/${p.slug}`, lastmod: p.dateModified, changefreq: 'monthly', priority: tier === 1 ? '0.8' : tier === 2 ? '0.7' : '0.6' }
    }),
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
