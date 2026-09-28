// SEO-friendly shop URLs — no database ids in public links.
//   product:  /shop/<product-slug>
//   category: /shop/category/<category-slug>        (a parent category includes its sub-categories)
//   brand:    /shop/brand/<brand-slug>
//   both:     /shop/category/<category-slug>?brand=<brand-slug>
// The backend accepts a slug or an id for every one of these, so old id links keep working.

/** Must stay identical to road-care-be/utils/slug.js (brands have no stored slug). */
export const slugify = (s?: string | null) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const isObjectId = (s?: string | null) => /^[a-f0-9]{24}$/i.test(String(s || ''))

type Named = { _id?: string; id?: string; slug?: string; name?: string } | null | undefined

export const productSlug = (p: Named) => p?.slug || p?._id || p?.id || ''
export const categorySlug = (c: Named) => c?.slug || slugify(c?.name) || c?._id || c?.id || ''
export const brandSlug = (b: Named) => slugify(b?.name) || b?._id || b?.id || ''

export const productHref = (p: Named) => `/shop/${productSlug(p)}`
export const categoryHref = (c: Named) => (categorySlug(c) ? `/shop/category/${categorySlug(c)}` : '/shop')
export const brandHref = (b: Named) => (brandSlug(b) ? `/shop/brand/${brandSlug(b)}` : '/shop')

/** Listing URL for a category and/or brand filter (slugs), keeping an optional search term. */
export function shopFilterHref({ category, brand, search }: { category?: string; brand?: string; search?: string }) {
  const q = new URLSearchParams()
  let path = '/shop'
  if (category) {
    path = `/shop/category/${category}`
    if (brand) q.set('brand', brand)
  } else if (brand) {
    path = `/shop/brand/${brand}`
  }
  if (search) q.set('search', search)
  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}

/** "royal-enfield" → "Royal Enfield" (page titles before the data loads). */
export const titleFromSlug = (s: string) =>
  String(s || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
