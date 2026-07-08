'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import {
  Star, Package, Grid3X3, X, SlidersHorizontal, Heart, Truck, ShieldCheck,
  RotateCcw, CreditCard, Plus, Check, ChevronRight, ArrowUpDown, Search,
} from 'lucide-react'

const SORTS: [string, string, string, string][] = [
  ['popular', 'Popularity', 'popularity', 'desc'],
  ['rating', 'Customer rating', 'rating', 'desc'],
  ['low', 'Price: Low to High', 'price', 'asc'],
  ['high', 'Price: High to Low', 'price', 'desc'],
  ['new', 'New arrivals', 'createdAt', 'desc'],
  ['discount', 'Biggest discount', 'createdAt', 'desc'],
]
const CHIPS: [string, string][] = [['popular', 'All'], ['rating', '★ Top rated'], ['low', '₹ Price: Low–High'], ['new', 'New arrivals'], ['discount', 'Biggest discount']]
const RATINGS = [4, 3, 2]
const TRUST = [
  { icon: ShieldCheck, color: 'bg-[#E7F6F0] text-[#15936B]', title: '100% Genuine', desc: 'OEM with invoice' },
  { icon: Truck, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'Free Delivery', desc: 'On orders ₹499+' },
  { icon: RotateCcw, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: '7-Day Returns', desc: 'Easy & free' },
  { icon: CreditCard, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Secure Payment', desc: 'UPI · Cards · COD' },
]

const priceOf = (p: any) => p.sellingPrice || p.price?.selling || (typeof p.price === 'number' ? p.price : 0)
const mrpOf = (p: any) => p.mrp || p.price?.mrp || p.originalPrice || priceOf(p)
const discOf = (p: any) => { const m = mrpOf(p), s = priceOf(p); return m > s ? Math.round(((m - s) / m) * 100) : 0 }
const imgOf = (p: any) => p.thumbnail?.url || (typeof p.thumbnail === 'string' ? p.thumbnail : '') || p.images?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : '') || ''
const qtyOf = (p: any) => p.inventory?.quantity ?? p.quantity ?? 0

export function ShopListing() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)
  const { openLogin } = useLoginModal()

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedCategory, setSelectedCategory] = useState((router.query.category as string) || '')
  const [selectedBrand, setSelectedBrand] = useState((router.query.brand as string) || '')
  const [sortKey, setSortKey] = useState('popular')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)

  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const searchQ = (router.query.search as string) || ''

  useEffect(() => {
    Promise.all([catalogAPI.getCategories(), catalogAPI.getBrands()])
      .then(([c, b]) => { if (c.data.success) setCategories(c.data.data || []); if (b.data.success) setBrands(b.data.data || []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    try { const w = JSON.parse(localStorage.getItem('bm_wishlist') || '[]'); if (Array.isArray(w)) setWishlist(new Set(w)) } catch {}
  }, [])

  useEffect(() => {
    if (router.query.category) setSelectedCategory(router.query.category as string)
    if (router.query.brand) setSelectedBrand(router.query.brand as string)
  }, [router.query.category, router.query.brand])

  const fetchProducts = useCallback(async (pageNum: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(false)
    try {
      const sort = SORTS.find((s) => s[0] === sortKey)!
      const params: Record<string, any> = { page: pageNum, limit: 12, sortBy: sort[2], sortOrder: sort[3] }
      if (searchQ.trim()) params.search = searchQ.trim()
      if (selectedCategory) params.category = selectedCategory
      if (selectedBrand) params.brand = selectedBrand
      if (minPrice) params.minPrice = Number(minPrice)
      if (maxPrice) params.maxPrice = Number(maxPrice)
      const res = await catalogAPI.getProducts(params)
      if (res.data.success) {
        const list = res.data.data || []
        setProducts((prev) => (append ? [...prev, ...list] : list))
        const p = res.data.pagination || {}
        setPage(p.current || p.page || pageNum)
        setTotalPages(p.pages || p.totalPages || 1)
        setTotal(p.total || list.length)
      }
    } catch {
      setError(true)
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }, [sortKey, searchQ, selectedCategory, selectedBrand, minPrice, maxPrice])

  useEffect(() => { fetchProducts(1) }, [selectedCategory, selectedBrand, sortKey, searchQ])

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem('bm_wishlist', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const clearFilters = () => {
    setSelectedCategory(''); setSelectedBrand(''); setMinPrice(''); setMaxPrice(''); setMinRating(0); setInStockOnly(false); setSortKey('popular')
    router.push('/shop', undefined, { shallow: true })
  }

  const hasFilters = selectedCategory || selectedBrand || minPrice || maxPrice || minRating > 0 || inStockOnly || searchQ
  const catName = selectedCategory ? (categories.find((c) => c._id === selectedCategory)?.name || 'Spare Parts') : 'Genuine Spare Parts'
  const sortLabel = SORTS.find((s) => s[0] === sortKey)![1]

  let displayed = inStockOnly ? products.filter((p) => qtyOf(p) > 0) : products
  if (minRating) displayed = displayed.filter((p) => (p.avgRating || 0) >= minRating)
  if (sortKey === 'discount') displayed = [...displayed].sort((a, b) => discOf(b) - discOf(a))

  const Filters = (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#EFF2F7]">
        <b className="flex items-center gap-2 text-[15px] font-extrabold text-[#13203A]"><SlidersHorizontal className="h-4 w-4" /> Filters</b>
        {hasFilters && <button onClick={clearFilters} className="text-[12.5px] text-[#FF6B35] font-bold">Clear all</button>}
        <button onClick={() => setShowFilters(false)} className="lg:hidden h-8 w-8 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><X className="h-4 w-4 text-[#475569]" /></button>
      </div>
      <div className="overflow-y-auto flex-1 lg:flex-none">
        {/* Categories */}
        <div className="px-4 py-4 border-b border-[#EFF2F7]">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3] mb-3">Categories</h5>
          <div className="max-h-52 overflow-y-auto pr-1">
            {categories.map((c) => (
              <label key={c._id} className="flex items-center gap-2.5 py-2 text-[13.5px] text-[#475569] cursor-pointer hover:text-[#1B3B6F]">
                <input type="checkbox" checked={selectedCategory === c._id} onChange={() => setSelectedCategory(selectedCategory === c._id ? '' : c._id)} className="w-[18px] h-[18px] accent-[#1B3B6F]" />
                <span className="truncate">{c.name}</span>
                {typeof c.productCount === 'number' && <span className="ml-auto text-[12px] text-[#7B8AA3]">{c.productCount}</span>}
              </label>
            ))}
          </div>
        </div>
        {/* Brands */}
        <div className="px-4 py-4 border-b border-[#EFF2F7]">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3] mb-3">Brands</h5>
          <div className="max-h-52 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label key={b._id} className="flex items-center gap-2.5 py-2 text-[13.5px] text-[#475569] cursor-pointer hover:text-[#1B3B6F]">
                <input type="checkbox" checked={selectedBrand === b._id} onChange={() => setSelectedBrand(selectedBrand === b._id ? '' : b._id)} className="w-[18px] h-[18px] accent-[#1B3B6F]" />
                <span className="truncate">{b.name}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Price */}
        <div className="px-4 py-4 border-b border-[#EFF2F7]">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3] mb-3">Price Range</h5>
          <div className="flex items-center gap-2.5">
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full h-[42px] border border-[#E7ECF3] rounded-[10px] px-2.5 text-[13px] bg-[#F6F8FB]" />
            <span className="text-[#7B8AA3]">–</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full h-[42px] border border-[#E7ECF3] rounded-[10px] px-2.5 text-[13px] bg-[#F6F8FB]" />
          </div>
          <button onClick={() => fetchProducts(1)} className="w-full mt-2.5 h-9 rounded-lg bg-[#1B3B6F] hover:bg-[#15315C] text-white text-[13px] font-semibold">Apply</button>
        </div>
        {/* Rating */}
        <div className="px-4 py-4 border-b border-[#EFF2F7]">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3] mb-3">Rating</h5>
          {RATINGS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 py-2 text-[13.5px] text-[#475569] cursor-pointer hover:text-[#1B3B6F]">
              <input type="checkbox" checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} className="w-[18px] h-[18px] accent-[#1B3B6F]" />
              <span className="flex items-center gap-0.5 text-[#F5A623]">{Array.from({ length: r }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#F5A623]" />)}</span>
              <span className="text-[12.5px]">&amp; up</span>
            </label>
          ))}
        </div>
        {/* Availability */}
        <div className="px-4 py-4">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#7B8AA3] mb-3">Availability</h5>
          <label className="flex items-center gap-2.5 py-2 text-[13.5px] text-[#475569] cursor-pointer hover:text-[#1B3B6F]">
            <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} className="w-[18px] h-[18px] accent-[#1B3B6F]" /> In stock only
          </label>
          <label className="flex items-center gap-2.5 py-2 text-[13.5px] text-[#475569] cursor-pointer hover:text-[#1B3B6F]">
            <input type="checkbox" defaultChecked className="w-[18px] h-[18px] accent-[#1B3B6F]" /> Free delivery
          </label>
        </div>
      </div>
      <div className="lg:hidden flex gap-2.5 p-4 border-t border-[#E7ECF3]">
        <button onClick={() => { clearFilters(); setShowFilters(false) }} className="flex-1 h-11 rounded-lg border border-[#E7ECF3] text-[#475569] font-semibold">Clear</button>
        <button onClick={() => setShowFilters(false)} className="flex-[2] h-11 rounded-lg bg-[#1B3B6F] text-white font-semibold">Show results</button>
      </div>
    </>
  )

  return (
    <UserLayout>
      {/* SHOP HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#244a86] text-white">
        <div className="absolute right-[-70px] top-1/2 -translate-y-1/2 w-[340px] h-[340px] opacity-[0.13] pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="#fff" strokeWidth={1.4}><circle cx="50" cy="50" r="46" /><circle cx="50" cy="50" r="18" /><circle cx="50" cy="50" r="5" /><path d="M50 4v14M50 82v14M4 50h14M82 50h14M18 18l10 10M72 72l10 10M82 18L72 28M18 82l10-10" /></svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-9 md:py-11">
          <div className="flex items-center gap-1.5 text-[12.5px] text-white/60 mb-3.5">
            <Link href="/" className="text-white/70 hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5 text-white/45" /><span className="text-white font-semibold">{catName}</span>
          </div>
          <h1 className="text-[28px] md:text-[38px] font-extrabold tracking-tight leading-[1.05]">{catName}</h1>
          <p className="mt-2.5 text-white/[0.78] text-sm md:text-[15.5px] max-w-xl leading-relaxed">OEM-grade parts from India&rsquo;s most trusted brands — delivered to your doorstep with verifiable GST invoices.</p>
          <div className="mt-5 flex items-center gap-6 md:gap-7 flex-wrap">
            {[['50,000+', 'Parts in stock'], ['500+', 'Trusted brands'], ['4.8★', 'Avg. rating']].map(([v, l], i) => (
              <div key={l} className="flex items-center gap-6 md:gap-7">
                {i > 0 && <span className="h-7 w-px bg-white/15 self-stretch" />}
                <div><b className="block text-xl md:text-2xl font-extrabold leading-none">{v}</b><span className="text-[12px] text-white/[0.62] font-semibold">{l}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY SCROLLER — icon tiles */}
      <div className="bg-white border-b border-[#E7ECF3]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex gap-2.5 overflow-x-auto scrollbar-hide">
          <button onClick={() => setSelectedCategory('')} className="shrink-0 w-[84px] flex flex-col items-center gap-2 text-center group">
            <span className={`w-[62px] h-[62px] rounded-[18px] flex items-center justify-center border transition-all ${!selectedCategory ? 'bg-[#1B3B6F] border-[#1B3B6F]' : 'bg-[#F6F8FB] border-[#E7ECF3] group-hover:border-[#1B3B6F] group-hover:-translate-y-0.5'}`}><Grid3X3 className={`h-[26px] w-[26px] ${!selectedCategory ? 'text-white' : 'text-[#1B3B6F]'}`} /></span>
            <b className={`text-[11.5px] font-semibold leading-tight ${!selectedCategory ? 'text-[#1B3B6F]' : 'text-[#475569]'}`}>All</b>
          </button>
          {categories.map((cat) => {
            const on = selectedCategory === cat._id; const img = cat.image || cat.icon
            return (
              <button key={cat._id} onClick={() => setSelectedCategory(cat._id)} className="shrink-0 w-[84px] flex flex-col items-center gap-2 text-center group">
                <span className={`w-[62px] h-[62px] rounded-[18px] flex items-center justify-center border overflow-hidden transition-all ${on ? 'bg-[#1B3B6F] border-[#1B3B6F]' : 'bg-[#F6F8FB] border-[#E7ECF3] group-hover:border-[#1B3B6F] group-hover:-translate-y-0.5'}`}>
                  {img ? <img src={img} alt="" className={`h-8 w-8 object-contain ${on ? 'brightness-0 invert' : ''}`} /> : <Package className={`h-[26px] w-[26px] ${on ? 'text-white' : 'text-[#1B3B6F]'}`} />}
                </span>
                <b className={`text-[11.5px] font-semibold leading-tight line-clamp-2 ${on ? 'text-[#1B3B6F]' : 'text-[#475569]'}`}>{cat.name}</b>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* TRUST STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 bg-white border border-[#E7ECF3] rounded-[14px] px-4 py-3.5 shadow-sm">
              <div className={`h-10 w-10 rounded-[11px] flex items-center justify-center shrink-0 ${t.color}`}><t.icon className="h-5 w-5" /></div>
              <div><b className="block text-[13.5px] text-[#13203A] leading-tight">{t.title}</b><span className="text-[11.5px] text-[#7B8AA3]">{t.desc}</span></div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[264px_1fr] gap-7 items-start">
          {/* Filters — desktop sidebar */}
          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">{Filters}</aside>

          {/* Results */}
          <div className="min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div><b className="text-xl font-extrabold text-[#13203A]">{total}</b><span className="text-[#7B8AA3] text-[13.5px] ml-1.5">products {selectedCategory ? `in ${catName}` : 'available'}</span></div>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setShowFilters(true)} className="lg:hidden inline-flex items-center gap-1.5 h-11 px-4 border border-[#E7ECF3] rounded-xl bg-white font-bold text-sm"><SlidersHorizontal className="h-4 w-4 text-[#1B3B6F]" /> Filters</button>
                <div className="relative">
                  <button onClick={() => setSortOpen(!sortOpen)} className="inline-flex items-center gap-2 h-11 px-4 border border-[#E7ECF3] rounded-xl bg-white text-[13.5px] font-semibold text-[#13203A]"><ArrowUpDown className="h-[15px] w-[15px] text-[#7B8AA3]" /> Sort: <b className="font-bold">{sortLabel}</b></button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                      <div className="absolute top-[52px] right-0 bg-white border border-[#E7ECF3] rounded-[14px] shadow-xl p-1.5 min-w-[210px] z-30">
                        {SORTS.map((s) => (
                          <button key={s[0]} onClick={() => { setSortKey(s[0]); setSortOpen(false) }} className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] font-semibold ${sortKey === s[0] ? 'text-[#1B3B6F] bg-[#F2F6FC]' : 'text-[#475569] hover:bg-[#F6F8FB]'}`}>{s[1]}{sortKey === s[0] && <Check className="h-[15px] w-[15px]" />}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick-sort chips */}
            <div className="flex gap-2 flex-wrap mb-[18px]">
              {CHIPS.map(([k, label]) => (
                <button key={k} onClick={() => setSortKey(k)} className={`px-[15px] py-[9px] rounded-full text-[13px] font-bold whitespace-nowrap border transition-colors ${sortKey === k ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]' : 'bg-white text-[#475569] border-[#E7ECF3] hover:border-[#2A5298]'}`}>{label}</button>
              ))}
            </div>

            {/* Grid / states */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-[#E7ECF3] rounded-2xl overflow-hidden"><div className="h-[160px] bg-gray-100 animate-pulse" /><div className="p-3.5 space-y-2"><div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" /><div className="h-3 bg-gray-100 rounded animate-pulse w-2/5" /><div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" /></div></div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-dashed border-[#E7ECF3] rounded-2xl py-14 text-center">
                <div className="h-[72px] w-[72px] rounded-[20px] bg-[#FFF1EB] text-[#FF6B35] flex items-center justify-center mx-auto mb-4"><X className="h-8 w-8" /></div>
                <h3 className="text-xl font-extrabold text-[#13203A] mb-2">Couldn&rsquo;t load products</h3>
                <p className="text-[#475569] max-w-sm mx-auto mb-5">Something went wrong on our end. Please check your connection and try again.</p>
                <button onClick={() => fetchProducts(1)} className="h-11 px-6 rounded-lg bg-[#1B3B6F] text-white font-semibold">Retry</button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E7ECF3] rounded-2xl py-14 text-center">
                <div className="h-[72px] w-[72px] rounded-[20px] bg-[#F2F6FC] text-[#1B3B6F] flex items-center justify-center mx-auto mb-4"><Search className="h-8 w-8" /></div>
                <h3 className="text-xl font-extrabold text-[#13203A] mb-2">No parts match your filters</h3>
                <p className="text-[#475569] max-w-sm mx-auto mb-5">Try removing a filter or searching a different category. We&rsquo;re adding new parts every day.</p>
                <button onClick={clearFilters} className="h-11 px-6 rounded-lg bg-[#1B3B6F] text-white font-semibold">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayed.map((p) => {
                    const price = priceOf(p), mrp = mrpOf(p), disc = discOf(p), image = imgOf(p), qty = qtyOf(p)
                    const comingSoon = !!p.comingSoon
                    const inStock = qty > 0, low = inStock && qty <= 5, wished = wishlist.has(p._id)
                    return (
                      <div key={p._id} className="relative bg-white border border-[#E7ECF3] rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,37,71,0.32)] hover:border-[#dbe4f1]">
                        <button onClick={() => toggleWishlist(p._id)} aria-label="Wishlist" className={`absolute top-2.5 right-2.5 z-[3] h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${wished ? 'bg-[#FFF1EB] border-[#FF6B35]' : 'bg-white/90 border-[#E7ECF3] hover:border-[#FF6B35]'}`}><Heart className={`h-4 w-4 ${wished ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-[#7B8AA3]'}`} /></button>
                        <Link href={`/shop/${p._id}`} className="relative h-[172px] bg-[linear-gradient(150deg,#eef3f9_0%,#e1e9f4_100%)] flex items-center justify-center overflow-hidden">
                          {disc > 0 && <span className="absolute top-0 left-3 bg-[#FF6B35] text-white text-[10.5px] font-extrabold px-2 py-1 rounded-b-md z-[2]">{disc}% OFF</span>}
                          {image ? <img src={image} alt={p.name} className="relative z-[1] max-h-[78%] max-w-[78%] object-contain" /> : <Package className="h-16 w-16 text-[#1B3B6F]/40" />}
                          {comingSoon ? (
                            <span className="absolute bottom-2.5 left-3 text-[10.5px] font-bold px-2 py-1 rounded-full bg-[#EEF2F7] text-[#5B6B85]">Coming soon</span>
                          ) : inStock ? (
                            <span className={`absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-1 rounded-full ${low ? 'bg-[#FEF3E2] text-[#D97706]' : 'bg-[#E7F6F0] text-[#15936B]'}`}><span className={`h-1.5 w-1.5 rounded-full ${low ? 'bg-[#D97706]' : 'bg-[#15936B]'}`} />{low ? 'Few left' : 'In stock'}</span>
                          ) : <span className="absolute bottom-2.5 left-3 text-[10.5px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">Out of stock</span>}
                        </Link>
                        <div className="px-[15px] pt-[14px] pb-4 flex flex-col flex-1">
                          {p.brand?.name && <span className="inline-flex self-start items-center text-[9.5px] font-extrabold text-[#1B3B6F] uppercase tracking-[0.05em] bg-[#F2F6FC] px-2 py-[3px] rounded-md mb-[7px]">{p.brand.name}</span>}
                          <Link href={`/shop/${p._id}`} className="text-sm font-bold text-[#13203A] leading-snug line-clamp-2 hover:text-[#1B3B6F]">{p.name}</Link>
                          {(p.avgRating > 0) && <div className="flex items-center gap-1 mt-1.5 text-[12.5px] font-bold text-[#475569]"><span className="text-[#F5A623]">★ {p.avgRating.toFixed(1)}</span><span className="text-[#7B8AA3] font-medium">({p.reviewCount || 0})</span></div>}
                          <div className="flex items-center gap-1.5 text-[11px] text-[#15936B] font-bold mt-2"><Truck className="h-[13px] w-[13px]" /> Free delivery</div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-[22px] font-extrabold text-[#1B3B6F] leading-none">₹{price.toLocaleString('en-IN')}</span>
                            {disc > 0 && <span className="text-[12px] text-[#7B8AA3] line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                          </div>
                          {comingSoon ? (
                            <div className="mt-3 w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-[#EEF2F7] text-[#5B6B85] cursor-not-allowed">Coming Soon</div>
                          ) : (
                            <button onClick={() => handleAddToCart(p._id, inStock)} disabled={!inStock} className={`mt-3 w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${inStock ? 'bg-[#FF6B35] hover:bg-[#F2541B] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>{inStock ? <><Plus className="h-4 w-4" /> Add to Cart</> : 'Out of Stock'}</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {page < totalPages && (
                  <div className="text-center mt-8"><button onClick={() => fetchProducts(page + 1, true)} disabled={loadingMore} className="h-12 px-8 rounded-xl border border-[#E7ECF3] bg-white font-bold text-[#1B3B6F] hover:border-[#1B3B6F] transition-colors">{loadingMore ? 'Loading…' : 'Load more parts'}</button></div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {showFilters && <div className="lg:hidden fixed inset-0 bg-[#0F2547]/45 z-[100]" onClick={() => setShowFilters(false)} />}
      <aside className={`lg:hidden fixed left-0 right-0 bottom-0 z-[101] max-h-[86vh] bg-white rounded-t-[22px] shadow-[0_-12px_40px_rgba(15,37,71,0.2)] flex flex-col transition-transform duration-300 ${showFilters ? 'translate-y-0' : 'translate-y-full'}`}>{Filters}</aside>
    </UserLayout>
  )

  function handleAddToCart(productId: string, inStock: boolean) {
    if (!inStock) return
    const add = () => userCartAPI.add(productId).then((res) => {
      if (res.data.success) toast.success('Added to cart!')
      else toast.error(res.data.message || 'Failed')
    }).catch((err: any) => toast.error(err.response?.data?.message || 'Failed to add to cart'))
    if (!isAuthenticated) { openLogin(add); return }
    add()
  }
}
