// Server-side only: imported from getStaticProps/getStaticPaths and the
// sitemap route, never from a page component, so none of this text ends up in
// the client JavaScript bundle.
import { ARTICLES } from './articles'
import { CITIES, CITY_BY_SLUG, DISTRICTS, cityPostSlug, type City } from './cities'
import { toCard, type Faq, type Post, type PostCard, type Section } from './types'

const PUB = '2026-09-26'

/* The site's real starting prices (same as /services). */
const SERVICES: [string, string, string][] = [
  ['Oil Change', '₹599', 'Premium engine oil + filter, at your doorstep'],
  ['Roadside Assistance', '₹499', 'Jump-start, flat tyre, fuel delivery or towing — 24/7'],
  ['Wheel Alignment & Balancing', '₹799', 'Computerised alignment, balancing & tyre rotation'],
  ['Car Spa & Detailing', '₹899', 'Foam wash, interior vacuum, polish'],
  ['Brake Service', '₹999', 'Pad check, fluid top-up, rotor inspection'],
  ['Denting & Painting', '₹1,499', 'Dent removal, primer & paint match'],
  ['AC Service & Gas Refill', '₹1,799', 'Gas top-up, coil cleaning, odour removal'],
  ['Periodic Service', '₹2,499', '30-point inspection, oil change, filter clean'],
  ['Battery Replacement', '₹4,499', 'Genuine battery, free fitting, old-battery buyback'],
]

const CITY_HERO = '/design/sv-girl.webp'

function cityPost(c: City): Post {
  const d = DISTRICTS[c.district]
  const slug = cityPostSlug(c.slug)
  const inDistrict = c.district === 'gorakhpur' && c.slug === 'gorakhpur' ? '' : ` (${d.name} district)`
  const nearby = c.nearby.filter((s) => CITY_BY_SLUG[s]).map((s) => ({ slug: cityPostSlug(s), name: CITY_BY_SLUG[s].name }))
  const bigPlace = c.tier === 1

  const sections: Section[] = [
    {
      id: 'services',
      h2: `Car and bike services available in ${c.name}`,
      blocks: [
        { p: `These are the most-booked services in ${c.name}${inDistrict}. Prices are starting prices; the exact price for your vehicle model is shown on screen before you confirm, and you pay only after the job is done.` },
        { table: { head: ['Service', 'Starting price', 'What you get'], rows: SERVICES.map(([n, p, w]) => [n, p, w]), caption: `Starting prices for doorstep service in ${c.name}. Every job carries a 30-day service warranty.` } },
        { p: `Two-wheeler owners in ${c.name} can book a full bike service — oil change, air-filter clean, spark plug, chain, brakes and electrical check — with the price for their model shown at booking. Need parts? Order genuine spares from the [Bharat Mechanics shop](/shop) and have them fitted at home.` },
        { cta: 'book', city: c.name },
      ],
    },
    {
      id: 'local-driving',
      h2: `Driving in ${c.name}: what your vehicle goes through`,
      blocks: [{ p: c.local[0] }, { p: c.local[1] }],
    },
    {
      id: 'seasonal-care',
      h2: `Seasonal vehicle care calendar for ${d.name} district`,
      blocks: [
        { p: `${d.context} Roads here include ${d.roads}, and ${d.rivers} shape the monsoon. Plan your vehicle care around the seasons:` },
        { table: { head: ['Season', 'What to do'], rows: d.seasons.map((s) => [s.when, s.what]) } },
      ],
    },
    {
      id: 'how-to-book',
      h2: `How to book a mechanic in ${c.name}`,
      blocks: [
        { ol: [
          `**Choose a service** on the [services page](/services) or tap “Book a Service”.`,
          `**Enter your address in ${c.name}** — home, office, shop or the roadside — and pick a time slot. Same-day slots are available where mechanics are free.`,
          `**Track the mechanic live** as they come to you. Every mechanic is ID-verified and trained.`,
          `**Pay after service.** Check the work, then pay by UPI, card or cash and rate your mechanic.`,
        ] },
        { p: `Prefer to talk to someone? Call **+91 93106 94349** and our team will book it for you.` },
      ],
    },
    {
      id: 'why-bharat-mechanics',
      h2: `Why vehicle owners in ${c.name} choose Bharat Mechanics`,
      blocks: [
        { ul: [
          '**Verified, trained mechanics** — ID-checked and rated by customers.',
          '**Genuine parts with invoice** — no duplicates, and old parts returned on request.',
          '**Upfront prices** — the price is on screen before you book; nothing extra without your approval.',
          '**30-day service warranty** on every job.',
          '**Pay after service** — UPI, card or cash.',
          bigPlace ? '**Doorstep across the city** — no need to take a day off for a workshop visit.' : '**Doorstep service** — no need to ride to a city workshop for routine jobs.',
        ] },
        ...(c.areas?.length ? [{ p: `**Areas we cover in ${c.name}:** ${c.areas.join(', ')} and surrounding localities.` }] : []),
      ],
    },
    {
      id: 'hindi',
      h2: `${c.hi} में मैकेनिक बुक करें`,
      blocks: [
        { hi: `${c.hi} (${d.hi} ज़िला) में कार और बाइक की सर्विस अब घर पर। ऑयल चेंज ₹599 से, कार सर्विस ₹2,499 से और रोडसाइड सहायता ₹499 से शुरू। वेरिफाइड मैकेनिक, असली पार्ट्स, 30 दिन की वारंटी और सर्विस के बाद भुगतान। बुकिंग के लिए +91 93106 94349 पर कॉल करें या वेबसाइट पर “Book a Service” दबाएं।`, title: 'हिंदी में जानकारी' },
      ],
    },
  ]

  const faqs: Faq[] = [
    c.faq,
    { q: `How much does a car service cost in ${c.name}?`, a: `A periodic car service starts at ₹2,499 and an oil change at ₹599. Roadside assistance starts at ₹499. The exact price for your vehicle is shown before you confirm, and you pay after the service.` },
    { q: `Do you service bikes and scooters in ${c.name}?`, a: `Yes. Book a two-wheeler service for your bike or scooter at home in ${c.name}. The price for your model is shown at booking.` },
    { q: `Is there a warranty on the service?`, a: `Yes. Every job carries a 30-day service warranty, and parts come with an invoice.` },
    { q: `What if my vehicle breaks down on the road near ${c.name}?`, a: `Book Roadside Assistance or call +91 93106 94349. Share your live location and we arrange a jump-start, puncture repair, fuel delivery or towing.` },
  ]

  const seasonal = c.district === 'kushinagar' || c.district === 'maharajganj' ? 'sugarcane-season-road-safety-kushinagar-deoria' : 'monsoon-flood-car-bike-care-purvanchal'
  return {
    slug,
    kind: 'city',
    category: `${d.name} district`,
    title: `Car & Bike Mechanic in ${c.name}: Doorstep Service, Repair & Roadside Help`,
    metaTitle: `Car & Bike Mechanic in ${c.name}`,
    description: `Book a verified car or bike mechanic in ${c.name}${inDistrict}. Doorstep service, oil change from ₹599, roadside help, genuine parts, 30-day warranty.`.slice(0, 160),
    excerpt: `Doorstep car and bike service, repairs and roadside help in ${c.name}${inDistrict} — prices, local driving tips and how to book.`,
    keywords: [
      `mechanic in ${c.name}`, `car mechanic ${c.name}`, `bike mechanic ${c.name}`, `car service ${c.name}`, `bike service ${c.name}`,
      `mechanic near me ${c.name}`, `doorstep car service ${c.name}`, `roadside assistance ${c.name}`, `${c.hi} मैकेनिक`, `${d.name} car service`,
    ].join(', '),
    datePublished: PUB,
    dateModified: PUB,
    readMins: 5,
    heroImg: CITY_HERO,
    heroAlt: `Bharat Mechanics mechanic for doorstep service in ${c.name}`,
    intro: c.intro,
    sections,
    faqs,
    related: [...nearby.slice(0, 2).map((n) => n.slug), 'car-bike-service-cost-gorakhpur-2026', seasonal],
    city: { name: c.name, hi: c.hi, district: d.name, districtKey: c.district, nearby },
  }
}

let cache: Post[] | null = null
export function getAllPosts(): Post[] {
  if (!cache) cache = [...ARTICLES, ...CITIES.map(cityPost)]
  return cache
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getCards(slugs: string[]): PostCard[] {
  const all = getAllPosts()
  return slugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is Post => !!p).map(toCard)
}

/** Everything the /blog index needs, grouped for rendering. */
export function getIndexData() {
  const cityCards = CITIES.map((c) => ({ ...toCard(cityPost(c)), tier: c.tier }))
  const districts = (['gorakhpur', 'deoria', 'kushinagar', 'maharajganj'] as const).map((k) => ({
    key: k,
    name: DISTRICTS[k].name,
    hi: DISTRICTS[k].hi,
    context: DISTRICTS[k].context,
    cities: cityCards.filter((c) => c.districtKey === k).sort((a, b) => a.tier - b.tier || a.title.localeCompare(b.title)).map(({ tier: _t, ...c }) => c),
  }))
  return { guides: ARTICLES.map(toCard), districts }
}

