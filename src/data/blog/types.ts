// Blog content model. Everything here is plain data so pages can be fully
// static (getStaticProps) and ship almost no JavaScript.

export type DistrictKey = 'gorakhpur' | 'deoria' | 'kushinagar' | 'maharajganj'

/** A block of body content. Inline text supports **bold** and [label](/link). */
export type Block =
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][]; caption?: string } }
  | { tip: string; title?: string }
  | { hi: string; title?: string } // Hindi callout (lang="hi")
  | { cta: 'book' | 'call' | 'roadside'; city?: string }

export interface Section {
  id: string
  h2: string
  blocks: Block[]
}

export interface Faq {
  q: string
  a: string
}

export interface Post {
  slug: string
  kind: 'city' | 'guide'
  category: string
  title: string // on-page H1
  metaTitle: string // <title> (site name is appended by SEOHead)
  description: string // meta description, ~150 chars
  excerpt: string
  keywords: string
  datePublished: string // ISO date
  dateModified: string
  readMins: number
  heroImg: string
  heroAlt: string
  intro: string
  sections: Section[]
  faqs: Faq[]
  related: string[] // slugs
  // city posts only
  city?: { name: string; hi: string; district: string; districtKey: DistrictKey; nearby: { slug: string; name: string }[] }
}

/** Lightweight card used by the index and "related" lists. */
export interface PostCard {
  slug: string
  kind: Post['kind']
  category: string
  title: string
  excerpt: string
  readMins: number
  heroImg: string
  district?: string
  districtKey?: DistrictKey
  cityName?: string
}

export const toCard = (p: Post): PostCard => ({
  slug: p.slug,
  kind: p.kind,
  category: p.category,
  title: p.title,
  excerpt: p.excerpt,
  readMins: p.readMins,
  heroImg: p.heroImg,
  ...(p.city ? { district: p.city.district, districtKey: p.city.districtKey, cityName: p.city.name } : {}),
})
