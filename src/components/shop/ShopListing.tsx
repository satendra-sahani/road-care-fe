'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { DImg, ikUrl } from '@/components/ui/DImg'
import {
  IcGridView, IcViewList, IcTune, IcClose, IcFavorite, IcFavoriteBorder, IcLocalShipping,
  IcVerifiedUser, IcAssignmentReturn, IcHeadsetMic, IcCheck, IcExpandMore, IcExpandLess,
  IcSearch, IcShoppingCart, IcArrowForward, IcStar, IcSort, IcNewReleases, IcLocalOffer,
  IcChatBubbleOutline, IcInventory, IcCancel, IcDirectionsCar, IcTwoWheeler, IcSettings, IcGroups, IcAssignmentReturn as IcReturns, IcHeadsetMic as IcSupport, IcBuild,
} from '@/components/icons/BmIcons'

/* ─── design tokens (Claude Design → Bharat Mechanics Shop) ─── */
const POPULAR_SEARCHES = ['Brake Pad', 'Engine Oil', 'Spark Plug', 'Air Filter', 'Battery', 'Headlight']

const SORTS: [string, string, string, string][] = [
  ['popular', 'Popularity', 'popularity', 'desc'],
  ['rating', 'Customer rating', 'rating', 'desc'],
  ['low', 'Price: Low – High', 'price', 'asc'],
  ['high', 'Price: High – Low', 'price', 'desc'],
  ['new', 'New arrivals', 'createdAt', 'desc'],
  ['discount', 'Biggest discount', 'createdAt', 'desc'],
]
const CHIPS: { key: string; label: string; Icon?: React.ComponentType<any>; color?: string }[] = [
  { key: 'popular', label: 'All' },
  { key: 'rating', label: 'Top rated', Icon: IcStar, color: '#F4601F' },
  { key: 'low', label: 'Price: Low – High', Icon: IcSort, color: '#1A6FD4' },
  { key: 'new', label: 'New arrivals', Icon: IcNewReleases, color: '#E0384E' },
  { key: 'discount', label: 'Biggest discount', Icon: IcLocalOffer, color: '#E0384E' },
]
const RATINGS = [5, 4, 3]
const TRUST = [
  { Icon: IcVerifiedUser, bg: '#E4F5EA', color: '#17A05A', title: 'Authentic Products', desc: '100% genuine products, always' },
  { Icon: IcAssignmentReturn, bg: '#FFEDE1', color: '#F4601F', title: 'Hassle-Free Returns', desc: 'Easy 7-day return policy' },
  { Icon: IcHeadsetMic, bg: '#E4EEFB', color: '#1A6FD4', title: 'Need Help?', desc: 'Our support team is here for you' },
]
/* Design category art, matched to backend category names by keyword (fallback when the category has no image). */
const CAT_ART: [RegExp, string][] = [
  [/\bac\b|air ?con/i, '/design/pt-ac.webp'],
  [/auto ?acc|steering/i, '/design/pt-steering.webp'],
  [/dash ?cam|accessor/i, '/design/pt-dashcam.webp'],
  [/air ?filter/i, '/design/pt-airfilters.webp'],
  [/batter/i, '/design/pt-battery2.webp'],
  [/bearing/i, '/design/pt-bearing.webp'],
  [/belt/i, '/design/pt-belt.webp'],
  [/body|bumper/i, '/design/pt-bumper.webp'],
  [/brake ?pad/i, '/design/pt-brakepad2.webp'],
  [/brake/i, '/design/pt-brakedisc2.webp'],
  [/bulb|light|lamp/i, '/design/pt-headlight2.webp'],
  [/oil|lubric/i, '/design/pt-engineoil.webp'],
  [/spark|plug/i, '/design/pt-sparkplug.webp'],
  [/wiper/i, '/design/pt-wiper.webp'],
  [/chain|sprocket/i, '/design/pt-bikechain.webp'],
  [/engine/i, '/design/pt-engine.webp'],
  [/mirror/i, '/design/pt-mirror.webp'],
  [/car ?care|wash/i, '/design/pt-carcare.webp'],
  [/floor|mat/i, '/design/pt-floormat.webp'],
  [/seat|interior/i, '/design/pt-seat.webp'],
  [/roof|exterior/i, '/design/pt-roofbox.webp'],
  [/electronic|audio/i, '/design/pt-headunit.webp'],
]
const artFor = (name = '') => CAT_ART.find(([re]) => re.test(name))?.[1] || ''

const priceOf = (p: any) => p.sellingPrice || p.price?.selling || (typeof p.price === 'number' ? p.price : 0)
const mrpOf = (p: any) => p.mrp || p.price?.mrp || p.originalPrice || priceOf(p)
const discOf = (p: any) => { const m = mrpOf(p), s = priceOf(p); return m > s ? Math.round(((m - s) / m) * 100) : 0 }
const imgOf = (p: any) => p.thumbnail?.url || (typeof p.thumbnail === 'string' ? p.thumbnail : '') || p.images?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : '') || ''
const qtyOf = (p: any) => p.inventory?.quantity ?? p.quantity ?? 0
const isNew = (p: any) => p.createdAt ? Date.now() - new Date(p.createdAt).getTime() < 30 * 86400e3 : false
const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const SECTION_LABEL = 'text-[11.5px] font-bold tracking-[1.2px] text-[#52667C]'
const CHECK = 'w-4 h-4 accent-[#1A6FD4] shrink-0'

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
  const [freeDelivery, setFreeDelivery] = useState(true)

  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [brandQ, setBrandQ] = useState('')
  const [heroQ, setHeroQ] = useState('')
  const [moreCats, setMoreCats] = useState(false)
  const [moreBrands, setMoreBrands] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({ cat: true, brand: true, price: true, rating: true, stock: true })

  const searchQ = (router.query.search as string) || ''
  const goSearch = (q: string) => { const t = q.trim(); router.push(t ? `/shop?search=${encodeURIComponent(t)}` : '/shop') }

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
    setSelectedCategory(''); setSelectedBrand(''); setMinPrice(''); setMaxPrice(''); setMinRating(0); setInStockOnly(false); setSortKey('popular'); setBrandQ('')
    router.push('/shop', undefined, { shallow: true })
  }

  const hasFilters = selectedCategory || selectedBrand || minPrice || maxPrice || minRating > 0 || inStockOnly || searchQ
  const catName = selectedCategory ? (categories.find((c) => c._id === selectedCategory)?.name || 'Spare Parts') : ''
  const sortLabel = SORTS.find((s) => s[0] === sortKey)![1]

  let displayed = inStockOnly ? products.filter((p) => qtyOf(p) > 0) : products
  if (minRating) displayed = displayed.filter((p) => (p.avgRating || 0) >= minRating)
  if (sortKey === 'discount') displayed = [...displayed].sort((a, b) => discOf(b) - discOf(a))

  const visibleBrands = useMemo(() => {
    const q = brandQ.trim().toLowerCase()
    return q ? brands.filter((b) => (b.name || '').toLowerCase().includes(q)) : brands
  }, [brands, brandQ])
  const catList = moreCats ? categories : categories.slice(0, 5)
  const brandList = moreBrands ? visibleBrands : visibleBrands.slice(0, 5)

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const renderHead = (k: string, label: string) => (
    <button type="button" onClick={() => toggle(k)} className="w-full flex items-center justify-between">
      <span className={SECTION_LABEL}>{label}</span>
      {open[k] ? <IcExpandLess size={16} className="text-[#94A3B8]" /> : <IcExpandMore size={16} className="text-[#94A3B8]" />}
    </button>
  )

  const Filters = (
    <>
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-[#EDF1F6]">
        <div className="flex items-center gap-2 text-[15px] font-bold text-[#0E2B4C]"><IcTune size={17} /> Filters</div>
        <div className="flex items-center gap-3">
          {hasFilters && <button onClick={clearFilters} className="text-[12px] font-semibold text-[#1864C8] hover:text-[#F4601F]">Clear all</button>}
          <button onClick={() => setShowFilters(false)} className="lg:hidden h-8 w-8 rounded-lg bg-[#F6F9FD] flex items-center justify-center" aria-label="Close filters"><IcClose size={16} className="text-[#5B7186]" /></button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 lg:flex-none text-[12.5px] text-[#0E2B4C]">
        {/* Categories */}
        <div className="py-3.5 border-b border-[#EDF1F6]">
          {renderHead("cat", "CATEGORIES")}
          {open.cat && (
            <>
              <div className="grid gap-[11px] mt-3">
                {catList.map((c) => (
                  <label key={c._id} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedCategory === c._id} onChange={() => setSelectedCategory(selectedCategory === c._id ? '' : c._id)} className={CHECK} />
                    <span className="truncate">{c.name}</span>
                    {typeof c.productCount === 'number' && <span className="text-[#52667C]">({c.productCount})</span>}
                  </label>
                ))}
                {categories.length === 0 && <span className="text-[#52667C]">Loading…</span>}
              </div>
              {categories.length > 5 && <button onClick={() => setMoreCats(!moreCats)} className="mt-3 text-[12.5px] font-semibold text-[#1864C8] hover:text-[#F4601F]">{moreCats ? '– Show less' : '+ Show more'}</button>}
            </>
          )}
        </div>
        {/* Brands */}
        <div className="py-3.5 border-b border-[#EDF1F6]">
          {renderHead("brand", "BRANDS")}
          {open.brand && (
            <>
              <div className="flex items-center gap-2 mt-3 bg-[#F6F9FD] border border-[#E6ECF3] rounded-[9px] px-3 py-2">
                <IcSearch size={14} className="text-[#94A3B8] shrink-0" />
                <input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder="Search brand..." className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#94A3B8]" />
              </div>
              <div className="grid gap-[11px] mt-3">
                {brandList.map((b) => (
                  <label key={b._id} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedBrand === b._id} onChange={() => setSelectedBrand(selectedBrand === b._id ? '' : b._id)} className={CHECK} />
                    <span className="truncate">{b.name}</span>
                    {typeof b.productCount === 'number' && <span className="text-[#52667C]">({b.productCount})</span>}
                  </label>
                ))}
                {visibleBrands.length === 0 && <span className="text-[#52667C]">No brands found</span>}
              </div>
              {visibleBrands.length > 5 && <button onClick={() => setMoreBrands(!moreBrands)} className="mt-3 text-[12.5px] font-semibold text-[#1864C8] hover:text-[#F4601F]">{moreBrands ? '– Show less' : '+ Show more'}</button>}
            </>
          )}
        </div>
        {/* Price */}
        <div className="py-3.5 border-b border-[#EDF1F6]">
          {renderHead("price", "PRICE RANGE")}
          {open.price && (
            <>
              <div className="flex items-center gap-2 mt-3">
                <input type="number" min={0} placeholder="₹ Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="flex-1 min-w-0 border border-[#E1E8F0] rounded-[9px] px-[11px] py-[9px] text-[12px] bg-white outline-none focus:border-[#1A6FD4] placeholder:text-[#94A3B8]" />
                <span className="text-[#52667C]">–</span>
                <input type="number" min={0} placeholder="₹ Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="flex-1 min-w-0 border border-[#E1E8F0] rounded-[9px] px-[11px] py-[9px] text-[12px] bg-white outline-none focus:border-[#1A6FD4] placeholder:text-[#94A3B8]" />
              </div>
              <button onClick={() => fetchProducts(1)} className="w-full mt-3 bg-[#0E2B4C] hover:bg-[#16406F] text-white rounded-[9px] py-[11px] text-[13px] font-semibold transition-colors">Apply</button>
            </>
          )}
        </div>
        {/* Rating */}
        <div className="py-3.5 border-b border-[#EDF1F6]">
          {renderHead("rating", "RATING")}
          {open.rating && (
            <div className="grid gap-[11px] mt-3">
              {RATINGS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} className={CHECK} />
                  <span className="tracking-[1px]"><span className="text-[#F0A726]">{'★'.repeat(r)}</span><span className="text-[#D6DEE7]">{'★'.repeat(5 - r)}</span></span>
                  <span className="text-[#52667C]">&amp; up</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Availability */}
        <div className="pt-3.5">
          {renderHead("stock", "AVAILABILITY")}
          {open.stock && (
            <div className="grid gap-[11px] mt-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} className={CHECK} /> In stock only
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={freeDelivery} onChange={() => setFreeDelivery(!freeDelivery)} className={CHECK} /> Free delivery
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="lg:hidden flex gap-2.5 pt-4 mt-4 border-t border-[#E6ECF3]">
        <button onClick={() => { clearFilters(); setShowFilters(false) }} className="flex-1 h-11 rounded-[10px] border border-[#E1E8F0] text-[#0E2B4C] font-semibold text-[13.5px]">Clear</button>
        <button onClick={() => setShowFilters(false)} className="flex-[2] h-11 rounded-[10px] bg-[#0E2B4C] text-white font-semibold text-[13.5px]">Show results</button>
      </div>
    </>
  )

  const renderCard = (p: any) => {
    const price = priceOf(p), mrp = mrpOf(p), disc = discOf(p), image = imgOf(p), qty = qtyOf(p)
    const comingSoon = !!p.comingSoon
    const inStock = qty > 0, low = inStock && qty <= 5, wished = wishlist.has(p._id)
    const badge = comingSoon ? { t: 'Coming Soon', bg: '#64748B' }
      : disc > 0 ? { t: `${disc}% OFF`, bg: '#D61F1F' }
      : p.isFeatured || p.featured || p.bestSeller ? { t: 'Best Seller', bg: '#C94309' }
      : isNew(p) ? { t: 'New', bg: '#13864D' }
      : null
    const list = view === 'list'
    return (
      <div key={p._id} className={`relative bg-white border border-[#E6ECF3] rounded-[14px] p-3 flex transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(12,42,77,0.28)] hover:border-[#D5DFEB] ${list ? 'flex-row gap-4 items-center' : 'flex-col'}`}>
        {badge && <span className="absolute left-0 top-2.5 z-[2] text-white text-[10.5px] font-bold px-[9px] py-1 rounded-r-[6px]" style={{ background: badge.bg }}>{badge.t}</span>}
        <button onClick={() => toggleWishlist(p._id)} aria-label="Wishlist" className={`absolute right-2.5 top-2.5 z-[2] h-[26px] w-[26px] rounded-full bg-white border flex items-center justify-center transition-colors ${wished ? 'border-[#F4601F] text-[#BE3F09]' : 'border-[#EDF1F6] text-[#52667C] hover:text-[#F4601F]'}`}>
          {wished ? <IcFavorite size={14} /> : <IcFavoriteBorder size={14} />}
        </button>
        <Link href={`/shop/${p._id}`} className={`flex items-center justify-center shrink-0 ${list ? 'w-[120px] h-[110px]' : 'w-full h-[112px] mt-6'}`}>
          {image ? <img loading="lazy" decoding="async" src={ikUrl(image, 420)} alt={p.name} width={210} height={112} className="max-h-full max-w-full object-contain" /> : <IcInventory size={56} className="text-[#0E2B4C]/25" />}
        </Link>
        <div className={`flex flex-col ${list ? 'flex-1 min-w-0' : ''}`}>
          <div className="text-[10.5px] font-bold text-[#1864C8] tracking-[0.5px] mt-2.5 uppercase min-h-[15px]">{p.brand?.name || ''}</div>
          <Link href={`/shop/${p._id}`} className="text-[13px] font-semibold text-[#0E2B4C] leading-[1.35] mt-[3px] line-clamp-2 hover:text-[#F4601F]">{p.name}</Link>
          {p.avgRating > 0 && <div className="flex items-center gap-1 mt-1 text-[11.5px] font-semibold text-[#52667C]"><span className="text-[#F0A726]">★ {Number(p.avgRating).toFixed(1)}</span><span className="text-[#52667C] font-medium">({p.reviewCount || 0})</span></div>}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[16px] font-bold text-[#0E2B4C]">{inr(price)}</span>
            {disc > 0 && <span className="text-[12px] text-[#52667C] line-through">{inr(mrp)}</span>}
          </div>
          {!comingSoon && (
            <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[#52667C] flex-wrap">
              {inStock
                ? <span className="flex items-center gap-1.5"><span className={`w-[7px] h-[7px] rounded-full ${low ? 'bg-[#D97706]' : 'bg-[#17A05A]'}`} />{low ? 'Few left' : 'In stock'}</span>
                : <span className="flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-full bg-[#E0384E]" />Out of stock</span>}
              <span className="flex items-center gap-1.5"><IcLocalShipping size={14} /> Free delivery</span>
            </div>
          )}
          {comingSoon ? (
            <button disabled className="w-full mt-2.5 bg-[#F1F5F9] text-[#52667C] rounded-[9px] py-[11px] text-[12.5px] font-semibold cursor-not-allowed">Coming Soon</button>
          ) : (
            <button onClick={() => handleAddToCart(p._id, inStock)} disabled={!inStock} className={`flex items-center justify-center gap-2 w-full mt-2.5 rounded-[9px] py-[11px] text-[12.5px] font-semibold transition-colors ${inStock ? 'bg-[#0E2B4C] hover:bg-[#F4601F] text-white' : 'bg-[#F1F5F9] text-[#52667C] cursor-not-allowed'}`}>
              {inStock ? <><IcShoppingCart size={14} /> Add to Cart</> : 'Out of Stock'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <UserLayout>
      <div className="bg-[#F4F7FB] text-[#0E2B4C] text-[14px] leading-[1.5] pb-2">
        {/* HERO — design's composed shop hero (art hidden under 1180px, single column under 760px) */}
        <div className="max-w-[1220px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(12px,1.8vw,20px)]">
          <div className="relative min-h-0 overflow-hidden rounded-[clamp(16px,1.8vw,24px)] bg-[linear-gradient(115deg,#F7FAFE_0%,#F0F5FB_45%,#EBF1F9_100%)] shadow-[0_14px_34px_rgba(12,42,77,0.08)] min-[1181px]:min-h-[clamp(420px,37vw,470px)]">
            <div className="absolute bottom-[-18%] left-[36%] hidden h-[58%] w-[46%] -rotate-6 bg-[linear-gradient(90deg,rgba(253,226,205,0)_0%,#FDE3CF_30%,#FCD9BF_100%)] min-[1181px]:block" style={{ borderRadius: '48% 52% 40% 60% / 60% 55% 45% 40%' }} />
            <div className="absolute right-[-6%] top-[34%] hidden h-[92%] w-[34%] rounded-full bg-[linear-gradient(160deg,#FF7A36_0%,#F2551C_60%,#E8480F_100%)] min-[1181px]:block" />
            <div className="absolute right-[7%] top-[36%] hidden h-[30%] w-[20%] rounded-full bg-[#FCD9BF] opacity-55 blur-[2px] min-[1181px]:block" />
            <div className="absolute bottom-[5%] right-[1.5%] hidden h-[42px] w-[72px] opacity-90 min-[1181px]:block" style={{ backgroundImage: 'radial-gradient(#F8B89A 1.6px,transparent 1.8px)', backgroundSize: '12px 12px' }} />
            <DImg src="/design/sh-woman.webp" alt="Bharat Mechanics parts expert" loading="eager" fetchPriority="high" sizes="(max-width: 1180px) 32px, 340px" className="absolute bottom-0 right-[6.5%] z-[2] hidden h-full w-auto max-w-[31%] object-contain object-right-bottom min-[1181px]:block" />
            <DImg src="/design/sh-script2.webp" alt="Drive Repair Repeat" sizes="(max-width: 1180px) 96px, 95px" className="absolute right-[2.2%] top-[9%] z-[3] hidden h-auto w-[7.6%] min-[1181px]:block" />
            <div className="absolute right-[1.5%] top-[47%] z-[3] hidden gap-3.5 min-[1181px]:grid">
              {[[IcDirectionsCar, 'Car parts', '/shop?search=car'], [IcTwoWheeler, 'Bike parts', '/shop?search=bike'], [IcSettings, 'Engine parts', '/shop?search=engine']].map(([I, label, href]: any) => (
                <Link key={label} href={href} aria-label={label} className="flex h-[60px] w-[60px] items-center justify-center rounded-[14px] bg-white text-[#BE3F09] shadow-[0_6px_16px_rgba(12,42,77,0.12)] transition-transform hover:-translate-y-0.5"><I size={24} /></Link>
              ))}
            </div>

            <div className="relative z-[4] grid grid-cols-1 gap-[18px] px-4 pb-[22px] pt-5 md:grid-cols-2 md:gap-[clamp(16px,2.2vw,32px)] md:px-[clamp(20px,3vw,40px)] md:pb-[clamp(22px,2.4vw,30px)] md:pt-[clamp(24px,3vw,40px)] min-[1181px]:grid-cols-[minmax(0,33.5%)_minmax(0,34.5%)]">
              <div className="flex min-w-0 flex-col">
                <div className="text-[12.5px] font-bold tracking-[3px] text-[#BE3F09]">GENUINE AUTO PARTS</div>
                <h1 className="mt-2.5 text-[clamp(34px,3.7vw,50px)] font-extrabold leading-[1.12] tracking-[-1.4px] text-[#0E2B4C]">Original Parts.<br />A Smoother<br /><span className="relative inline-block text-[#F4601F]">Tomorrow.<svg viewBox="0 0 240 14" preserveAspectRatio="none" className="absolute -bottom-2.5 left-0 h-[10px] w-[108%]"><path d="M2 11 C70 3 170 2 238 6" fill="none" stroke="#F4601F" strokeWidth="4" strokeLinecap="round" /></svg></span></h1>
                <p className="mt-[26px] max-w-[430px] text-[clamp(13.5px,1.2vw,15.5px)] leading-[1.5] text-[#41586F]">OEM-grade parts from India&rsquo;s most trusted brands — delivered to your doorstep with verified invoices.</p>
                <div className="mt-[22px] grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:gap-[clamp(8px,1vw,14px)] min-[1181px]:flex-nowrap">
                  {[[IcVerifiedUser, '50,000+', 'Parts in stock', '#F4601F', '#fff'], [IcGroups, '500+', 'Trusted brands', '#DCE8FA', '#1A6FD4'], [IcStar, '4.8/5', 'Customer rating', '#FFF1D6', '#F0A726']].map(([I, v, l, bg, c]: any) => (
                    <div key={v} className="flex min-w-0 flex-col items-start gap-1.5 md:flex-row md:items-center md:gap-2"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]" style={{ background: bg, color: c }}><I size={22} /></span><div className="leading-[1.25]"><div className="text-[14.5px] font-bold">{v}</div><div className="whitespace-nowrap text-[11px] text-[#41586F]">{l}</div></div></div>
                  ))}
                </div>
                <div className="mt-[22px] grid grid-cols-4 md:flex md:items-start md:[margin-left:calc(-1*clamp(8px,1.2vw,18px))]">
                  {[[IcLocalShipping, 'Fast Delivery'], [IcVerifiedUser, '100% Genuine'], [IcReturns, 'Easy Returns'], [IcSupport, 'Expert Support']].map(([I, l]: any, i) => (
                    <div key={l} className={`grid justify-items-center gap-1.5 px-1 text-center md:px-[clamp(8px,1.2vw,18px)] ${i < 3 ? 'border-r border-[#DCE4EE]' : ''}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0E2B4C] shadow-[0_3px_10px_rgba(12,42,77,0.08)]"><I size={24} /></span><span className="text-[11px] font-medium text-[#1E3553] md:whitespace-nowrap md:text-[12.5px]">{l}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col">
                <DImg src="/design/sh-script1.webp" alt="Har Gaadi Ka Saathi" loading="eager" sizes="230px" className="-mt-2.5 block h-auto w-[clamp(170px,17vw,230px)] md:ml-[clamp(0px,2vw,24px)]" />
                <form onSubmit={(e) => { e.preventDefault(); goSearch(heroQ) }} className="mt-3.5 flex items-center gap-2.5 rounded-[14px] bg-white py-1.5 pl-[18px] pr-1.5 shadow-[0_10px_26px_rgba(12,42,77,0.10)]">
                  <IcSearch size={20} className="shrink-0 text-[#7B8DA3]" />
                  <input type="search" aria-label="Search parts" value={heroQ} onChange={(e) => setHeroQ(e.target.value)} placeholder="Search for parts, brands, or your vehicle (e.g. Brake Pad)" className="h-11 min-w-0 flex-1 bg-transparent text-[13.5px] text-[#0E2B4C] outline-none placeholder:text-ellipsis" />
                  <button type="submit" aria-label="Search" className="flex h-12 w-14 shrink-0 items-center justify-center rounded-[11px] bg-[#C94309] text-white transition-colors hover:bg-[#A93807]"><IcSearch size={22} /></button>
                </form>
                <div className="mt-[18px] flex items-center gap-x-3 gap-y-2.5 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap">
                  <span className="whitespace-nowrap text-[13.5px] font-medium text-[#1E3553]">Popular searches:</span>
                  {POPULAR_SEARCHES.map((q) => (
                    <button key={q} type="button" onClick={() => goSearch(q)} className="inline-flex h-[34px] shrink-0 items-center whitespace-nowrap rounded-[17px] bg-white px-3.5 text-[13px] font-medium text-[#1E3553] shadow-[0_2px_8px_rgba(12,42,77,0.06)] hover:text-[#F4601F]">{q}</button>
                  ))}
                </div>
                <div className="mt-auto grid grid-cols-3 pt-1.5 md:flex md:items-start md:justify-center md:pt-[26px]">
                  {[[IcSettings, 'Better', 'Performance'], [IcVerifiedUser, 'Safe', 'Journeys'], [IcBuild, 'Trusted', 'Quality']].map(([I, a, b]: any, i) => (
                    <div key={a} className={`grid justify-items-center gap-1 px-1 text-center text-[#0E2B4C] md:px-[clamp(10px,1.4vw,22px)] ${i < 2 ? 'border-r border-[#E8D3C6]' : ''}`}><I size={24} /><span className="mt-1 text-[13px] font-medium leading-[1.3]">{a}<br />{b}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY TILES */}
        <div className="max-w-[1220px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(14px,2vw,20px)] pb-1.5 flex items-stretch gap-[9px] overflow-x-auto scrollbar-hide">
          <button onClick={() => setSelectedCategory('')} className={`shrink-0 w-[78px] rounded-[13px] px-[5px] text-center transition-colors ${!selectedCategory ? 'bg-[#0E2B4C] text-white py-[11px] shadow-[0_6px_16px_rgba(14,43,76,0.22)]' : 'bg-white border border-[#E6ECF3] py-[9px] text-[#0E2B4C] hover:border-[#F4601F]'}`}>
            <span className={`w-[34px] h-[34px] mx-auto rounded-[9px] flex items-center justify-center ${!selectedCategory ? 'bg-white/15' : 'bg-[#F6F9FD]'}`}><IcGridView size={18} /></span>
            <div className="text-[11px] font-bold mt-[9px] leading-[1.25]">All Parts</div>
          </button>
          {categories.map((cat) => {
            const on = selectedCategory === cat._id
            const img = cat.image || cat.icon || artFor(cat.name)
            return (
              <button key={cat._id} onClick={() => setSelectedCategory(on ? '' : cat._id)} className={`shrink-0 w-[78px] rounded-[13px] px-[5px] py-[9px] text-center transition-colors ${on ? 'bg-[#0E2B4C] text-white shadow-[0_6px_16px_rgba(14,43,76,0.22)]' : 'bg-white border border-[#E6ECF3] text-[#0E2B4C] hover:border-[#F4601F]'}`}>
                {img
                  ? (img.startsWith('/design/') ? <DImg src={img} alt="" sizes="78px" className={`block w-full h-[38px] object-contain ${on ? 'brightness-0 invert' : ''}`} /> : <img loading="lazy" decoding="async" src={ikUrl(img, 156)} alt="" width={68} height={38} className={`block w-full h-[38px] object-contain ${on ? 'brightness-0 invert' : ''}`} />)
                  : <span className="w-full h-[38px] flex items-center justify-center"><IcInventory size={22} /></span>}
                <div className="text-[10.5px] font-semibold mt-[7px] leading-[1.25] line-clamp-2">{cat.name}</div>
              </button>
            )
          })}
          {categories.length > 0 && (
            <button onClick={() => { setShowFilters(true); setOpen((o) => ({ ...o, cat: true })); setMoreCats(true) }} className="shrink-0 self-center w-[38px] h-[38px] rounded-full bg-white border border-[#E6ECF3] flex items-center justify-center ml-1 hover:border-[#F4601F]" aria-label="All categories">
              <IcArrowForward size={16} />
            </button>
          )}
        </div>

        {/* FILTERS + RESULTS */}
        <div className="max-w-[1220px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(14px,2vw,20px)] pb-[clamp(24px,3vw,36px)] grid lg:grid-cols-[270px_minmax(0,1fr)] gap-[clamp(14px,2vw,22px)] items-start">
          <aside className="hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain bg-white border border-[#E6ECF3] rounded-2xl p-4 [scrollbar-width:thin]">{Filters}</aside>

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3.5 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="text-[clamp(24px,2.8vw,32px)] font-bold tracking-[-0.8px] leading-none">{loading && !products.length ? '—' : total.toLocaleString('en-IN')}</span>
                <span className="text-[14px] text-[#52667C]">products {catName ? `in ${catName}` : 'available'}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setShowFilters(true)} className="lg:hidden inline-flex items-center gap-1.5 bg-white border border-[#E6ECF3] rounded-[10px] px-3.5 py-2.5 text-[12.5px] font-semibold"><IcTune size={16} /> Filters</button>
                <div className="hidden sm:flex items-center bg-white border border-[#E6ECF3] rounded-[10px] p-[3px]">
                  <button onClick={() => setView('grid')} aria-label="Grid view" className={`w-[34px] h-[30px] rounded-[7px] flex items-center justify-center ${view === 'grid' ? 'bg-[#EAF1FB] text-[#1864C8]' : 'text-[#52667C]'}`}><IcGridView size={16} /></button>
                  <button onClick={() => setView('list')} aria-label="List view" className={`w-[34px] h-[30px] rounded-[7px] flex items-center justify-center ${view === 'list' ? 'bg-[#EAF1FB] text-[#1864C8]' : 'text-[#52667C]'}`}><IcViewList size={16} /></button>
                </div>
                <div className="relative">
                  <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 bg-white border border-[#E6ECF3] rounded-[10px] px-3.5 py-2.5 text-[12.5px]">
                    <span className="text-[#52667C]">Sort by:</span><span className="font-semibold">{sortLabel}</span><IcExpandMore size={16} className="text-[#5B7186]" />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                      <div className="absolute top-[46px] right-0 bg-white border border-[#E6ECF3] rounded-[12px] shadow-[0_18px_30px_rgba(12,42,77,0.12)] p-1.5 min-w-[210px] z-30">
                        {SORTS.map((s) => (
                          <button key={s[0]} onClick={() => { setSortKey(s[0]); setSortOpen(false) }} className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-[12.5px] font-semibold ${sortKey === s[0] ? 'text-[#1864C8] bg-[#EAF1FB]' : 'text-[#0E2B4C] hover:bg-[#F6F9FD]'}`}>{s[1]}{sortKey === s[0] && <IcCheck size={15} />}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
              {CHIPS.map(({ key, label, Icon, color }) => {
                const on = sortKey === key
                return (
                  <button key={key} onClick={() => setSortKey(key)} className={`flex items-center gap-2 rounded-[20px] text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-[#0E2B4C] text-white font-semibold px-[26px] py-[9px]' : 'bg-white border border-[#E6ECF3] font-medium px-4 py-[9px] hover:border-[#F4601F]'}`}>
                    {Icon && <Icon size={14} style={{ color: on ? '#fff' : color }} />}{label}
                  </button>
                )
              })}
            </div>

            {/* Grid / states */}
            {loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5 mt-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-[#E6ECF3] rounded-[14px] p-3"><div className="h-[112px] mt-6 bg-[#F1F5F9] rounded-lg animate-pulse" /><div className="mt-3 space-y-2"><div className="h-2.5 bg-[#F1F5F9] rounded animate-pulse w-2/5" /><div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-4/5" /><div className="h-4 bg-[#F1F5F9] rounded animate-pulse w-1/3" /><div className="h-9 bg-[#F1F5F9] rounded-[9px] animate-pulse" /></div></div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-dashed border-[#E6ECF3] rounded-2xl py-14 text-center mt-4">
                <div className="h-[72px] w-[72px] rounded-[20px] bg-[#FFEDE1] text-[#BE3F09] flex items-center justify-center mx-auto mb-4"><IcCancel size={32} /></div>
                <h3 className="text-[20px] font-bold mb-2">Couldn&rsquo;t load products</h3>
                <p className="text-[#52667C] max-w-sm mx-auto mb-5">Something went wrong on our end. Please check your connection and try again.</p>
                <button onClick={() => fetchProducts(1)} className="h-11 px-6 rounded-[10px] bg-[#0E2B4C] hover:bg-[#16406F] text-white font-semibold">Retry</button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E6ECF3] rounded-2xl py-14 text-center mt-4">
                <div className="h-[72px] w-[72px] rounded-[20px] bg-[#EAF1FB] text-[#1864C8] flex items-center justify-center mx-auto mb-4"><IcSearch size={32} /></div>
                <h3 className="text-[20px] font-bold mb-2">No parts match your filters</h3>
                <p className="text-[#52667C] max-w-sm mx-auto mb-5">Try removing a filter or searching a different category. We&rsquo;re adding new parts every day.</p>
                <button onClick={clearFilters} className="h-11 px-6 rounded-[10px] bg-[#0E2B4C] hover:bg-[#16406F] text-white font-semibold">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className={`mt-4 ${view === 'list' ? 'flex flex-col gap-3.5' : 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5'}`}>
                  {displayed.map((p) => renderCard(p))}
                </div>
                {page < totalPages && (
                  <div className="flex justify-center mt-5">
                    <button onClick={() => fetchProducts(page + 1, true)} disabled={loadingMore} className="flex items-center gap-2 bg-white border border-[#E6ECF3] hover:border-[#F4601F] rounded-[24px] px-6 py-3 text-[13px] font-semibold text-[#0E2B4C] transition-colors disabled:opacity-60">
                      <IcExpandMore size={16} className="text-[#1A6FD4]" />{loadingMore ? 'Loading…' : 'Load more parts'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Trust */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 mt-5">
              {TRUST.map((t) => (
                <div key={t.title} className="flex items-center gap-3 bg-white border border-[#E6ECF3] rounded-[14px] px-4 py-3.5">
                  <span className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.color }}><t.Icon size={20} /></span>
                  <div><div className="text-[13.5px] font-bold">{t.title}</div><div className="text-[11.5px] text-[#52667C]">{t.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat bubble (design) */}
      <Link href="/support" className="hidden md:flex fixed right-5 bottom-5 z-20 items-center gap-[11px] bg-white rounded-[30px] pl-[9px] pr-[18px] py-[9px] shadow-[0_10px_28px_rgba(12,42,77,0.18)] text-[#0E2B4C] hover:text-[#0E2B4C]">
        <span className="w-[42px] h-[42px] rounded-full bg-[#1A6FD4] text-white flex items-center justify-center shrink-0"><IcChatBubbleOutline size={20} /></span>
        <span className="leading-[1.3]"><span className="block text-[12.5px] font-bold">Need help?</span><span className="block text-[11.5px] text-[#52667C]">Chat with us</span></span>
      </Link>

      {/* Mobile filter sheet */}
      {showFilters && <div className="lg:hidden fixed inset-0 bg-[#0E2B4C]/45 z-[100]" onClick={() => setShowFilters(false)} />}
      <aside className={`lg:hidden fixed left-0 right-0 bottom-0 z-[101] max-h-[86vh] bg-white rounded-t-[22px] shadow-[0_-12px_40px_rgba(12,42,77,0.2)] flex flex-col p-4 transition-transform duration-300 ${showFilters ? 'translate-y-0' : 'translate-y-full'}`}>{Filters}</aside>
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
