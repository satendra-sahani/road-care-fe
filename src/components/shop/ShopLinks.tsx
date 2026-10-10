import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ProductCard } from '@/lib/shopSeo'

// Plain links between the shop pages, written into the page on the server.
// The product grid of a listing loads in the browser (filters, sorting, "load more"), so
// without these a search engine found no link from a category or a brand to its products,
// nor from the shop to its categories and brands. For a visitor they are an A–Z index.

const box = 'max-w-[1220px] mx-auto px-[clamp(14px,3vw,24px)] pb-[clamp(20px,3vw,32px)]'
const card = 'bg-white border border-[#E6ECF3] rounded-2xl p-[clamp(14px,2vw,20px)]'
const h2 = 'text-[clamp(17px,1.8vw,20px)] font-extrabold tracking-[-0.3px] text-[#0E2B4C]'

/** Every part of a category / brand, A–Z, each a link to its page. */
export function ProductLinks({ title, note, products }: { title: string; note?: string; products: ProductCard[] }) {
  if (!products.length) return null
  return (
    <section className={box} data-shop-links="products">
      <div className={card}>
        <h2 className={h2}>{title}</h2>
        {note && <p className="mt-1 text-[13px] leading-[1.5] text-[#52667C]">{note}</p>}
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.slug} className="min-w-0">
              <Link href={`/shop/${p.slug}`} className="group flex items-baseline gap-1.5 py-0.5 text-[13.5px] text-[#0E2B4C] hover:text-[#F4601F]">
                <span className="truncate font-semibold group-hover:underline">{p.name}</span>
                {p.brand && <span className="shrink-0 text-[12px] text-[#7B8AA3]">{p.brand}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

type Named = { name: string; slug: string }
/** The shop's categories and brands, each a link to its page. */
export function ShopDirectory({ categories, brands }: { categories: Named[]; brands: Named[] }) {
  if (!categories.length && !brands.length) return null
  const chip = 'inline-flex items-center rounded-full border border-[#E6ECF3] bg-[#F7FAFE] px-3 py-1.5 text-[12.5px] font-semibold text-[#0E2B4C] hover:border-[#F4601F] hover:text-[#F4601F]'
  return (
    <section className={box} data-shop-links="directory">
      <div className={`${card} space-y-5`}>
        {categories.length > 0 && (
          <div>
            <h2 className={h2}>Shop by category</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => <Link key={c.slug} href={`/shop/category/${c.slug}`} className={chip}>{c.name}</Link>)}
            </div>
          </div>
        )}
        {brands.length > 0 && (
          <div>
            <h2 className={h2}>Shop by brand</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.map((b) => <Link key={b.slug} href={`/shop/brand/${b.slug}`} className={chip}>{b.name}</Link>)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/** "More Cables" under a product: other parts of the same category. */
export function RelatedProducts({ title, products, allHref, allLabel }: { title: string; products: ProductCard[]; allHref?: string; allLabel?: string }) {
  if (!products.length) return null
  return (
    <section className="bg-white rounded-2xl border border-[#E7ECF3] shadow-sm p-5 md:p-6 mt-6" data-related>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-[#13203A]">{title}</h2>
        {allHref && <Link href={allHref} className="flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-[#1B3B6F] hover:text-[#FF6B35]">{allLabel || 'View all'}<ChevronRight className="h-4 w-4" /></Link>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.slug} href={`/shop/${p.slug}`} className="group flex min-w-0 flex-col rounded-xl border border-[#EFF2F7] p-3 hover:border-[#FFB89C]">
            <span className="flex h-[92px] items-center justify-center overflow-hidden rounded-lg bg-[#F6F8FB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={`${p.image}${p.image.includes('ik.imagekit.io') ? '?tr=w-220,h-180,fo-auto' : ''}`} alt={p.name} loading="lazy" className="h-full w-full object-contain" /> : null}
            </span>
            {p.brand && <span className="mt-2 truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3]">{p.brand}</span>}
            <span className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-[1.35] text-[#13203A] group-hover:text-[#FF6B35]">{p.name}</span>
            <span className="mt-1.5 text-[13px] font-extrabold text-[#13203A]">{p.soon || !(p.price > 0) ? <span className="font-semibold text-[#5B6B85]">Coming soon</span> : `₹${p.price.toLocaleString('en-IN')}`}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
