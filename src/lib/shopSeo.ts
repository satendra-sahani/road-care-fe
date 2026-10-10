// What search engines read on the shop pages: titles, descriptions, structured data —
// and the product data a page is built with on the server.
//
// Why this exists: the shop pages used to be empty on the server and filled in by the
// browser. A crawler therefore saw product pages with no <h1> and a one-line description,
// 285 products sharing a title with another product (same part name, different brand),
// and category / brand pages with no link to any product ("orphan pages").
// Now every shop page is built with its data, and these helpers keep the wording unique.

export const SITE_URL = 'https://bharatmechanics.com'
const SITE_NAME = 'Bharat Mechanics'
const SUFFIX = ` | ${SITE_NAME}`
/** search results cut a title at about 60 characters and a description at about 160 */
const TITLE_MAX = 60
const DESC_MAX = 158

const one = (s?: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim()

/**
 * The full <title>: the first wording that fits with "| Bharat Mechanics" behind it;
 * if none does, the last (shortest) one on its own.
 */
export function fitTitle(...wordings: string[]) {
  const list = wordings.map(one).filter(Boolean)
  const fits = list.find((w) => (w + SUFFIX).length <= TITLE_MAX)
  if (fits) return fits + SUFFIX
  const last = list[list.length - 1] || SITE_NAME
  return last.length <= TITLE_MAX ? last : `${last.slice(0, TITLE_MAX - 1).replace(/\s+\S*$/, '')}…`
}

type AnyProduct = Record<string, any>
const brandOf = (p: AnyProduct) => one(p?.brand?.name)
const priceOf = (p: AnyProduct) => Number(p?.sellingPrice || p?.price?.selling || p?.price?.sellingPrice || (typeof p?.price === 'number' ? p.price : 0)) || 0
const mrpOf = (p: AnyProduct) => Number(p?.mrp || p?.price?.mrp || 0) || 0
const imageOf = (p: AnyProduct) => { const i = p?.thumbnail?.url || p?.images?.[0]; return one(typeof i === 'string' ? i : i?.url) }
/** "for Scooter" / "for Car" — the part of a sentence, empty when not known */
const forVehicle = (p: AnyProduct) => (one(p?.vehicleType) ? ` for ${one(p.vehicleType)}` : '')

/** Part name + brand: two products with the same part name never share a title. */
export function productTitle(p: AnyProduct) {
  const name = one(p?.name), brand = brandOf(p)
  return fitTitle(brand ? `${name} – ${brand}` : name)
}

/** One or two full sentences, 110–158 characters, different for every product. */
export function productDescription(p: AnyProduct) {
  const own = one(p?.description)
  if (own.length >= 110) return own.length <= DESC_MAX ? own : `${own.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '')}…`
  const name = one(p?.name), brand = brandOf(p), part = one(p?.partNumber || p?.sku)
  const price = priceOf(p), soon = !!p?.comingSoon || !(price > 0)
  const what = `${brand ? `${brand} ` : ''}${name}${forVehicle(p)}`
  const partNo = part ? ` – part no. ${part}` : ''
  const tails = soon
    ? [
        '. Genuine part with verified invoice and 7-day returns, coming soon at Bharat Mechanics. See details and fitment.',
        '. Genuine part with verified invoice, coming soon at Bharat Mechanics.',
        '. Coming soon at Bharat Mechanics.',
      ]
    : [
        `. ₹${price.toLocaleString('en-IN')}. Genuine part, verified invoice, 7-day returns & fast delivery at Bharat Mechanics.`,
        `. ₹${price.toLocaleString('en-IN')}. Genuine part with invoice & 7-day returns at Bharat Mechanics.`,
        `. ₹${price.toLocaleString('en-IN')} at Bharat Mechanics.`,
      ]
  const head = soon ? what : `Buy ${what} online`
  for (const withPart of [true, false]) {
    for (const tail of tails) {
      const s = `${head}${withPart ? partNo : ''}${tail}`
      if (s.length <= DESC_MAX) return s
    }
  }
  return `${head}${tails[2]}`.slice(0, DESC_MAX)
}

/**
 * The product as the page needs it — and nothing else. The API answer also carries what
 * the business paid for the part and who supplies it; none of that may be written into a
 * public page.
 */
export function pageProduct(p: AnyProduct) {
  const cat = p?.category && typeof p.category === 'object' ? { _id: String(p.category._id || ''), name: one(p.category.name), slug: one(p.category.slug) } : null
  const brand = p?.brand && typeof p.brand === 'object' ? { _id: String(p.brand._id || ''), name: one(p.brand.name) } : null
  const images = (Array.isArray(p?.images) ? p.images : []).map((i: any) => ({ url: one(typeof i === 'string' ? i : i?.url), alt: one(i?.alt) || one(p?.name) })).filter((i: any) => i.url).slice(0, 8)
  const out = {
    _id: String(p?._id || ''), name: one(p?.name), slug: one(p?.slug), sku: one(p?.sku), partNumber: one(p?.partNumber),
    description: String(p?.description || '').trim(),
    price: { selling: priceOf(p), mrp: mrpOf(p) },
    images, thumbnail: imageOf(p) ? { url: imageOf(p) } : null,
    inventory: { quantity: Number(p?.inventory?.quantity ?? p?.quantity ?? 0) || 0 },
    comingSoon: !!p?.comingSoon,
    avgRating: Number(p?.avgRating || p?.reviewsSummary?.averageRating || 0) || 0,
    reviewCount: Number(p?.reviewCount || p?.reviewsSummary?.totalReviews || 0) || 0,
    category: cat, brand,
    vehicleType: one(p?.vehicleType),
    compatibility: (Array.isArray(p?.compatibility) ? p.compatibility : []).map((c: any) => ({ vehicleBrand: one(c?.vehicleBrand), vehicleModel: one(c?.vehicleModel), yearFrom: c?.yearFrom ?? null, yearTo: c?.yearTo ?? null })).slice(0, 20),
    specifications: p?.specifications && typeof p.specifications === 'object' ? p.specifications : null,
  }
  return JSON.parse(JSON.stringify(out)) // page props must be plain JSON (no undefined)
}
export type PageProduct = ReturnType<typeof pageProduct>

/** A product as a link / small card: name, where it lives, brand, price, picture. */
export type ProductCard = { name: string; slug: string; brand: string; price: number; image: string; soon: boolean }
export const productCard = (p: AnyProduct): ProductCard => ({ name: one(p?.name), slug: one(p?.slug || p?._id), brand: brandOf(p), price: priceOf(p), image: imageOf(p), soon: !!p?.comingSoon })

/**
 * The other parts of the same category a product page links to: the next ones in A–Z
 * order, going round. Every product of a category is then linked from several others —
 * if each page linked to the same "top" few, the rest would have no link at all.
 */
export function neighbours<T extends { slug: string }>(sorted: T[], slug: string, count = 8): T[] {
  const at = sorted.findIndex((x) => x.slug === slug)
  const ring = at < 0 ? sorted : [...sorted.slice(at + 1), ...sorted.slice(0, at)]
  return ring.filter((x) => x.slug && x.slug !== slug).slice(0, count)
}

/** "Home › Shop › Cables › Accelerator Cable" for search results. */
export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${SITE_URL}${t.path}` })),
  }
}

/**
 * Product structured data — only for a part that can be bought (it has a price). Google
 * reports a Product without an offer as an error, so a "coming soon" part gets none.
 */
export function productLd(p: PageProduct) {
  if (p.comingSoon || !(p.price.selling > 0)) return null
  return {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, sku: p.sku || undefined, mpn: p.partNumber || undefined,
    description: productDescription(p),
    image: p.images.map((i: { url: string }) => i.url).slice(0, 4),
    brand: p.brand?.name ? { '@type': 'Brand', name: p.brand.name } : undefined,
    category: p.category?.name || undefined,
    ...(p.avgRating > 0 && p.reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.avgRating, reviewCount: p.reviewCount } } : {}),
    offers: {
      '@type': 'Offer', url: `${SITE_URL}/shop/${p.slug}`, priceCurrency: 'INR', price: p.price.selling,
      availability: p.inventory.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }
}

/** "A, B and C" */
export const listOf = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)
/** the names that occur most, most frequent first */
export function topNames(names: string[], n = 4) {
  const count = new Map<string, number>()
  for (const x of names.map(one).filter(Boolean)) count.set(x, (count.get(x) || 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([x]) => x)
}
