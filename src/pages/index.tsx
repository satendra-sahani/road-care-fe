'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { SEOHead } from '@/components/SEOHead'
import { loadUserRequest } from '@/store/slices/customerAuthSlice'
import { catalogAPI, userCartAPI, bannerAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import Link from 'next/link'
import {
  Wrench, ShoppingBag, Bike, Headphones, Mic,
  ChevronRight, ChevronLeft, ShieldCheck, Award, Clock,
  List, Calendar, Home as HomeIcon, Package, Star, X, Check,
  ShoppingCart, Zap, Users, TrendingUp, Heart, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

/* ─── Filter brands list (same as Android) ─── */
const filterBrands = ['Bosch', 'Denso', 'NGK', 'Mann', 'Mobil', 'Shell', 'Castrol', 'Monroe']

export default function HomePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)

  /* ─── Data state ─── */
  const [mainCategories, setMainCategories] = useState<any[]>([
    { _id: 'auto-accessories', name: 'Auto Accessories', icon: 'construct-outline', description: 'Car parts & accessories' },
    { _id: 'two-wheelers', name: 'Two Wheelers', icon: 'bicycle-outline', description: 'Two-wheeler parts & services' },
  ])
  const [categories, setCategories] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  /* ─── Banner state (admin banners only, matches mobile) ─── */
  const [currentBanner, setCurrentBanner] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [bannerSlides, setBannerSlides] = useState<any[]>([])

  /* ─── Search & filter state (PRESERVED — same as Android) ─── */
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterSelectedBrands, setFilterSelectedBrands] = useState<string[]>([])
  const [filterRating, setFilterRating] = useState(0)

  // ─── Load user if token exists ───
  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated) {
      dispatch(loadUserRequest())
    }
  }, [])

  // ─── Fetch home data (same parallel calls as mobile) ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, parentRes, prodRes, bannerRes] = await Promise.all([
          catalogAPI.getCategories().catch(() => null),
          catalogAPI.getParentCategories().catch(() => null),
          catalogAPI.getProducts({ featured: true, limit: 10 }).catch(() => null),
          bannerAPI.getActive('web').catch(() => null),
        ])

        if (parentRes?.data?.success && parentRes.data.data?.length) {
          setMainCategories(parentRes.data.data)
        }
        if (catRes?.data?.success) {
          setCategories(catRes.data.data || [])
        }
        if (prodRes?.data?.success) {
          const prods = prodRes.data.data?.products || prodRes.data.data || []
          setFeaturedProducts(prods)
        }
        const apiBanners = bannerRes?.data?.data || bannerRes?.data?.banners || []
        if (Array.isArray(apiBanners) && apiBanners.length > 0) {
          setBannerSlides(apiBanners)
        }
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ─── Auto-rotate banners ───
  useEffect(() => {
    if (bannerSlides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % bannerSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [bannerSlides.length])

  /* ─── Helpers (PRESERVED) ─── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/')
      return
    }
    try {
      const res = await userCartAPI.add(productId)
      if (res.data.success) {
        toast.success('Added to cart!')
      } else {
        toast.error(res.data.message || 'Failed to add')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  const resetFilters = () => {
    setFilterCategory('all')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setFilterSelectedBrands([])
    setFilterRating(0)
  }

  const applyFilters = () => {
    setFilterOpen(false)
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterPriceMin) params.set('minPrice', filterPriceMin)
    if (filterPriceMax) params.set('maxPrice', filterPriceMax)
    if (filterSelectedBrands.length) params.set('brands', filterSelectedBrands.join(','))
    if (filterRating) params.set('rating', String(filterRating))
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    router.push(`/shop?${params.toString()}`)
  }

  const toggleFilterBrand = (brand: string) => {
    setFilterSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const goToBikesService = () => {
    const bike = mainCategories.find((c: any) =>
      /two.?wheel|bike|motor/i.test(c.name || '') || /two.?wheel|bike/i.test(c._id || c.id || '')
    )
    if (bike) {
      router.push(`/shop?parentCategory=${bike._id || bike.id}`)
    } else {
      router.push('/shop')
    }
  }

  /* ─── Product helpers ─── */
  const getPrice = (p: any) => p.sellingPrice || p.price?.selling || (typeof p.price === 'number' ? p.price : 0)
  const getMrp = (p: any) => {
    const price = getPrice(p)
    return p.mrp || p.price?.mrp || p.originalPrice || price
  }
  const getDiscount = (p: any) => {
    const price = getPrice(p)
    const mrp = getMrp(p)
    if (!mrp || mrp <= price) return 0
    return Math.round(((mrp - price) / mrp) * 100)
  }
  const getImage = (p: any) =>
    p.thumbnail?.url ||
    (typeof p.thumbnail === 'string' ? p.thumbnail : '') ||
    p.images?.[0]?.url ||
    (typeof p.images?.[0] === 'string' ? p.images[0] : '') ||
    ''
  const getRating = (p: any) => p.reviewsSummary?.averageRating || p.avgRating || p.rating || 0

  const subCategories = categories.filter((c: any) => c.parentCategory)

  return (
    <UserLayout>
      <SEOHead
        title="Home"
        description="Bharat Mechanics – Buy genuine auto parts online, book certified mechanics for doorstep vehicle repair and servicing. Car parts, bike parts, engine oil, brake pads, filters & more. Fast delivery across India."
        keywords="auto parts online, car parts, bike parts, mechanic near me, vehicle repair, Bharat Mechanics, genuine auto parts, doorstep mechanic, car service, bike service, engine oil, brake pads, air filter, spark plug, car battery, tyre"
      />

      <div className="bg-[#F7F8FA] min-h-screen">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Hero Banner (admin banners)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 pt-3 md:pt-5">
          <div className="max-w-7xl mx-auto">
            {loading && bannerSlides.length === 0 ? (
              <BannerSkeleton />
            ) : bannerSlides.length > 0 ? (
              <div className="relative group/banner">
                <div
                  ref={bannerRef}
                  className="overflow-hidden rounded-xl md:rounded-2xl shadow-sm ring-1 ring-black/5"
                >
                  <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
                    style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                  >
                    {bannerSlides.map((slide, idx) => {
                      const content = (
                        // On mobile: h-auto so the image renders at its natural aspect ratio (no letterbox,
                        // no crop, container height equals image display height exactly).
                        // On md+: fixed height + object-cover, which is the sizing the user confirmed looks good.
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || `Promo banner ${idx + 1}`}
                          className="w-full h-auto md:h-[210px] lg:h-[260px] xl:h-[300px] md:object-cover select-none block"
                          draggable={false}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23e5e7eb"/>'
                          }}
                        />
                      )
                      return slide.link ? (
                        <Link key={idx} href={slide.link} className="w-full shrink-0 block">
                          {content}
                        </Link>
                      ) : (
                        <div key={idx} className="w-full shrink-0">{content}</div>
                      )
                    })}
                  </div>
                </div>

                {/* Nav arrows (desktop) */}
                {bannerSlides.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentBanner(prev => prev === 0 ? bannerSlides.length - 1 : prev - 1)}
                      aria-label="Previous slide"
                      className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-white hover:scale-105 transition-all duration-200 z-10"
                    >
                      <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A1D29]" />
                    </button>
                    <button
                      onClick={() => setCurrentBanner(prev => (prev + 1) % bannerSlides.length)}
                      aria-label="Next slide"
                      className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-white hover:scale-105 transition-all duration-200 z-10"
                    >
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-[#1A1D29]" />
                    </button>
                  </>
                )}

                {/* Pagination dots */}
                {bannerSlides.length > 1 && (
                  <div className="absolute bottom-2.5 md:bottom-3.5 left-0 right-0 flex items-center justify-center gap-1 z-10">
                    {bannerSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentBanner
                            ? 'w-6 md:w-7 bg-white shadow-sm'
                            : 'w-1.5 bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Fallback hero when no admin banners set
              <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-sm">
                <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] px-5 py-6 md:px-9 md:py-10 lg:px-12 lg:py-12 relative">
                  <div className="absolute -top-8 -right-8 w-48 h-48 bg-[#FF6B35]/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-8 w-56 h-56 bg-[#FF6B35]/10 rounded-full blur-3xl" />
                  <div className="relative z-10 max-w-xl">
                    <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 text-[11px] md:text-xs font-semibold text-white mb-2.5">
                      <Zap className="h-3 w-3 text-[#FF6B35]" />
                      India's Smartest AutoCare Platform
                    </span>
                    <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                      Car care,<br className="md:hidden" /> now at your doorstep
                    </h1>
                    <p className="mt-2 md:mt-3 text-xs md:text-sm lg:text-base text-white/80 max-w-lg">
                      Trusted mechanics · Genuine parts · On-time service · Best prices.
                    </p>
                    <div className="mt-3.5 md:mt-5 flex flex-wrap gap-2.5">
                      <Link
                        href="/service"
                        className="inline-flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#e55a2a] text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        Book a Service
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm rounded-lg transition-all"
                      >
                        Shop Parts
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — 4 Quick Action Circles
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm ring-1 ring-black/5 py-3.5 px-2 md:py-4 md:px-4 lg:py-5 lg:px-6">
              <div className="grid grid-cols-4 gap-1 md:gap-3">
                <QuickAction
                  icon={Wrench}
                  iconColor="#1B3B6F"
                  bg="#DBEAFE"
                  title="Book Service"
                  sub="At your doorstep"
                  href="/service"
                />
                <QuickAction
                  icon={ShoppingBag}
                  iconColor="#059669"
                  bg="#D1FAE5"
                  title="Buy Parts"
                  sub="Genuine Parts"
                  href="/shop"
                />
                <QuickAction
                  icon={Bike}
                  iconColor="#B45309"
                  bg="#FED7AA"
                  title="Bikes Service"
                  sub="Two Wheeler"
                  onClick={goToBikesService}
                />
                <QuickAction
                  icon={Headphones}
                  iconColor="#BE185D"
                  bg="#FCE7F3"
                  title="Emergency"
                  sub="24/7 Support"
                  href="/emergency"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Popular Categories
           ══════════════════════════════════════════════════════════════ */}
        {loading && subCategories.length === 0 && categories.length === 0 ? (
          <section className="mt-5 md:mt-8">
            <div className="px-3 md:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="h-4 md:h-5 w-36 md:w-44 rounded-md bg-gray-200 animate-pulse" />
                  <div className="h-3 w-28 md:w-36 rounded-md bg-gray-100 animate-pulse mt-1.5" />
                </div>
                <div className="h-3.5 w-14 rounded-md bg-gray-200 animate-pulse" />
              </div>
            </div>

            {/* Mobile horizontal scroll skeletons */}
            <div className="md:hidden mt-2.5">
              <div className="flex gap-2.5 overflow-hidden px-3 pb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CategorySkeleton key={i} variant="mobile" />
                ))}
              </div>
            </div>

            {/* Desktop grid skeletons */}
            <div className="hidden md:block px-6 lg:px-8 mt-3">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-2.5 lg:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CategorySkeleton key={i} variant="desktop" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && (subCategories.length > 0 || categories.length > 0) && (
          <section className="mt-5 md:mt-8">
            <SectionHeader title="Popular Categories" subtitle="Shop by part type" viewAllHref="/shop" />

            {/* Mobile horizontal scroll */}
            <div className="md:hidden mt-2.5">
              <div
                className="flex gap-2.5 overflow-x-auto scrollbar-hide px-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(subCategories.length > 0 ? subCategories : categories).slice(0, 12).map((cat: any, idx: number) => (
                  <CategoryCard key={cat._id || cat.id} cat={cat} idx={idx} variant="mobile" />
                ))}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="hidden md:block px-6 lg:px-8 mt-3">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-2.5 lg:gap-3">
                  {(subCategories.length > 0 ? subCategories : categories).slice(0, 12).map((cat: any, idx: number) => (
                    <CategoryCard key={cat._id || cat.id} cat={cat} idx={idx} variant="desktop" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — Best Sellers (Featured Products)
           ══════════════════════════════════════════════════════════════ */}
        {loading && featuredProducts.length === 0 ? (
          <section className="mt-5 md:mt-8">
            <div className="px-3 md:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="h-4 md:h-5 w-28 md:w-36 rounded-md bg-gray-200 animate-pulse" />
                  <div className="h-3 w-40 md:w-48 rounded-md bg-gray-100 animate-pulse mt-1.5" />
                </div>
                <div className="h-3.5 w-14 rounded-md bg-gray-200 animate-pulse" />
              </div>
            </div>

            {/* Mobile horizontal skeletons */}
            <div className="md:hidden mt-2.5">
              <div className="flex gap-2.5 overflow-hidden px-3 pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={i} variant="mobile" />
                ))}
              </div>
            </div>

            {/* Desktop grid skeletons */}
            <div className="hidden md:block px-6 lg:px-8 mt-3.5">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ProductSkeleton key={i} variant="desktop" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {featuredProducts.length > 0 && (
          <section className="mt-5 md:mt-8">
            <SectionHeader
              title="Best Sellers"
              subtitle="Most loved by our customers"
              viewAllHref="/shop"
            />

            {/* Mobile horizontal scroll */}
            <div className="md:hidden mt-2.5">
              <div
                className="flex gap-2.5 overflow-x-auto scrollbar-hide px-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {featuredProducts.slice(0, 10).map((product: any) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    getPrice={getPrice}
                    getMrp={getMrp}
                    getDiscount={getDiscount}
                    getImage={getImage}
                    getRating={getRating}
                    onAdd={handleAddToCart}
                    variant="mobile"
                  />
                ))}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="hidden md:block px-6 lg:px-8 mt-3.5">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                  {featuredProducts.slice(0, 10).map((product: any) => (
                    <ProductCard
                      key={product._id || product.id}
                      product={product}
                      getPrice={getPrice}
                      getMrp={getMrp}
                      getDiscount={getDiscount}
                      getImage={getImage}
                      getRating={getRating}
                      onAdd={handleAddToCart}
                      variant="desktop"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — AI Voice Booking (accent card)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-5 md:mt-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/ai-booking"
              className="group/ai relative block overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-[#EFF6FF] via-[#E0E9FB] to-[#DBEAFE] border border-[#CFE0FA] hover:shadow-md transition-all duration-300"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 md:w-40 md:h-40 bg-[#1B3B6F]/8 rounded-full blur-3xl" />
              <div className="absolute -left-4 -bottom-4 w-20 h-20 md:w-28 md:h-28 bg-[#FF6B35]/10 rounded-full blur-2xl" />

              <div className="relative flex items-center gap-2.5 md:gap-4 py-3 px-3 md:py-4 md:px-5 lg:py-5 lg:px-6">
                <div className="h-10 w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 ring-1 ring-[#1B3B6F]/10">
                  <Mic className="h-5 w-5 md:h-[22px] md:w-[22px] text-[#1B3B6F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-[#1B3B6F] uppercase tracking-wider mb-0.5">
                    <Zap className="h-2.5 w-2.5 md:h-3 md:w-3 text-[#FF6B35]" />
                    New · AI Powered
                  </p>
                  <p className="text-sm md:text-base lg:text-lg font-bold text-[#1A1D29] tracking-tight leading-tight">
                    Try AI Voice Booking
                  </p>
                  <p className="text-[11px] md:text-xs lg:text-sm text-[#1B3B6F]/80 font-medium mt-0.5">
                    Baat karein, booking ho jayegi!
                  </p>
                </div>
                <div className="inline-flex items-center gap-0.5 bg-[#1B3B6F] hover:bg-[#0F2545] text-white px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-lg md:rounded-xl shrink-0 shadow-sm group-hover/ai:shadow transition-all">
                  <span className="text-[11px] md:text-xs lg:text-sm font-bold">Try Now</span>
                  <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 group-hover/ai:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — How it works (4 steps)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-4 md:mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm ring-1 ring-black/5 py-4 px-3 md:py-6 md:px-6 lg:py-7 lg:px-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#1B3B6F]/5 rounded-full blur-3xl hidden md:block" />

              <div className="relative">
                <div className="mb-3 md:mb-5 text-center md:text-left">
                  <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-wider">Simple Process</p>
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-[#1A1D29] tracking-tight mt-0.5">How it works</h3>
                </div>

                {/* Mobile: compact row with chevrons */}
                <div className="flex md:hidden items-start justify-between">
                  <HowStep num="1" icon={List} title={"Choose\nService/Parts"} variant="mobile" />
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-3 shrink-0" />
                  <HowStep num="2" icon={Calendar} title={"Select Date\n& Time"} variant="mobile" />
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-3 shrink-0" />
                  <HowStep num="3" icon={ShieldCheck} title={"Confirm\n& Relax"} variant="mobile" />
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-3 shrink-0" />
                  <HowStep num="4" icon={HomeIcon} title={"We come to\nyou"} variant="mobile" />
                </div>

                {/* Desktop grid with dashed connector */}
                <div className="hidden md:grid md:grid-cols-4 gap-3 lg:gap-4 relative">
                  <div className="absolute top-5 lg:top-6 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-gray-200 -z-0" />
                  <HowStep num="1" icon={List} title="Choose Service/Parts" desc="Browse and pick what you need" variant="desktop" />
                  <HowStep num="2" icon={Calendar} title="Select Date & Time" desc="Schedule at your convenience" variant="desktop" />
                  <HowStep num="3" icon={ShieldCheck} title="Confirm & Relax" desc="We'll take it from here" variant="desktop" />
                  <HowStep num="4" icon={HomeIcon} title="We come to you" desc="Doorstep service, on-time" variant="desktop" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — Trust Badges
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#1B3B6F] via-[#0F2545] to-[#1B3B6F] rounded-xl md:rounded-2xl shadow-sm py-3 px-3 md:py-4 md:px-6 lg:py-5 lg:px-8 overflow-hidden relative">
              <div className="absolute -top-6 right-8 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-3xl" />
              <div className="relative grid grid-cols-3 gap-2 md:gap-5">
                <TrustItem icon={ShieldCheck} title="Genuine Parts" subtitle="100% Original" />
                <TrustItem icon={Award} title="Best Price" subtitle="Guaranteed" />
                <TrustItem icon={Clock} title="On-time Service" subtitle="At your doorstep" />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — Stats row (desktop only)
           ══════════════════════════════════════════════════════════════ */}
        <section className="hidden md:block px-6 lg:px-8 mt-4 lg:mt-5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-3 lg:gap-4">
              <StatCard icon={Users} value="10,000+" label="Happy Customers" color="#1B3B6F" bg="#DBEAFE" />
              <StatCard icon={Package} value="50,000+" label="Parts Available" color="#FF6B35" bg="#FFE4D6" />
              <StatCard icon={Award} value="500+" label="Trusted Brands" color="#6366F1" bg="#E0E7FF" />
              <StatCard icon={Star} value="4.8/5" label="Customer Rating" color="#F59E0B" bg="#FEF3C7" />
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-6 md:h-10 lg:h-12" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FILTER MODAL (PRESERVED — bottom sheet, same as Android)
         ══════════════════════════════════════════════════════════════ */}
      {filterOpen && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1A1D29]">Filter Parts</h3>
              <button onClick={() => setFilterOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3">Category</h4>
                <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                      filterCategory === 'all'
                        ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]'
                        : 'bg-[#F5F7FA] text-[#1A1D29] border-gray-200'
                    }`}
                  >All</button>
                  {categories.slice(0, 10).map((cat: any) => (
                    <button
                      key={cat._id || cat.id}
                      onClick={() => setFilterCategory(cat._id || cat.id)}
                      className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                        filterCategory === (cat._id || cat.id)
                          ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]'
                          : 'bg-[#F5F7FA] text-[#1A1D29] border-gray-200'
                      }`}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3">Price Range</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-500 mb-2">Min</p>
                    <input
                      type="number"
                      placeholder={'\u20B90'}
                      value={filterPriceMin}
                      onChange={e => setFilterPriceMin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-[15px] font-semibold text-[#1A1D29] outline-none focus:border-[#1B3B6F] transition-colors"
                    />
                  </div>
                  <span className="text-base font-bold text-gray-400 mt-7">-</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-500 mb-2">Max</p>
                    <input
                      type="number"
                      placeholder={'\u20B910000'}
                      value={filterPriceMax}
                      onChange={e => setFilterPriceMax(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-[15px] font-semibold text-[#1A1D29] outline-none focus:border-[#1B3B6F] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3">Brands</h4>
                <div className="flex flex-wrap gap-2.5">
                  {filterBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => toggleFilterBrand(brand)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                        filterSelectedBrands.includes(brand)
                          ? 'bg-[#1B3B6F]/10 border-[#1B3B6F] text-[#1B3B6F]'
                          : 'bg-[#F5F7FA] border-gray-200 text-[#1A1D29]'
                      }`}
                    >
                      {filterSelectedBrands.includes(brand) && <Check className="h-4 w-4 text-[#1B3B6F]" />}
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3">Minimum Rating</h4>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRating(r)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${
                        filterRating === r
                          ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]'
                          : 'bg-[#F5F7FA] text-[#1A1D29] border-gray-200'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${filterRating === r ? 'fill-white text-white' : 'fill-[#F59E0B] text-[#F59E0B]'}`} />
                      {r}+
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="flex-1 py-3.5 rounded-xl border-2 border-[#1B3B6F] text-[#1B3B6F] font-bold text-base hover:bg-[#1B3B6F]/5 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#1B3B6F] to-[#0F2545] text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle, viewAllHref }: { title: string; subtitle?: string; viewAllHref?: string }) {
  return (
    <div className="px-3 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-end justify-between">
        <div>
          <h2 className="text-base md:text-lg lg:text-xl font-bold text-[#1A1D29] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[11px] md:text-xs lg:text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group/va flex items-center gap-0.5 text-[#1B3B6F] font-semibold text-xs md:text-sm hover:gap-1 transition-all shrink-0"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 group-hover/va:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  iconColor,
  bg,
  title,
  sub,
  href,
  onClick,
}: {
  icon: any
  iconColor: string
  bg: string
  title: string
  sub: string
  href?: string
  onClick?: () => void
}) {
  const content = (
    <div className="flex flex-col items-center text-center px-0.5 md:px-1 w-full group/qa">
      <div
        className="h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full flex items-center justify-center mb-1.5 md:mb-2 transition-transform duration-300 group-hover/qa:scale-105"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-[22px] w-[22px] md:h-6 md:w-6 lg:h-7 lg:w-7" style={{ color: iconColor }} />
      </div>
      <p className="text-[12px] md:text-[13px] lg:text-sm font-semibold text-[#1A1D29] leading-tight line-clamp-2">{title}</p>
      <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5 truncate w-full">{sub}</p>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center">
        {content}
      </button>
    )
  }
  return (
    <Link href={href || '#'} className="flex flex-col items-center">
      {content}
    </Link>
  )
}

function CategoryCard({ cat, idx, variant }: { cat: any; idx: number; variant: 'mobile' | 'desktop' }) {
  const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))
  // Colorful gradient backgrounds for each card (soft)
  const gradients = [
    'from-[#DBEAFE] to-[#BFDBFE]', // blue
    'from-[#FFE4D6] to-[#FED7AA]', // orange
    'from-[#D1FAE5] to-[#A7F3D0]', // green
    'from-[#FCE7F3] to-[#FBCFE8]', // pink
    'from-[#E0E7FF] to-[#C7D2FE]', // indigo
    'from-[#FEF3C7] to-[#FDE68A]', // amber
  ]
  const gradient = gradients[idx % gradients.length]

  if (variant === 'mobile') {
    return (
      <Link
        href={`/shop?category=${cat._id || cat.id}`}
        className="shrink-0 w-[88px] bg-white rounded-xl p-2 flex flex-col items-center border border-[#EEF0F3]"
      >
        <div className={`h-[56px] w-[56px] rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-1.5 p-1.5`}>
          {img ? (
            <img src={img} alt={cat.name} className="h-full w-full object-contain" />
          ) : (
            <Package className="h-7 w-7 text-[#1B3B6F]" />
          )}
        </div>
        <p className="text-[11px] font-semibold text-[#1A1D29] text-center line-clamp-2 leading-[13px]">{cat.name}</p>
      </Link>
    )
  }

  return (
    <Link
      href={`/shop?category=${cat._id || cat.id}`}
      className="bg-white rounded-xl p-3 lg:p-3.5 flex flex-col items-center border border-[#EEF0F3] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group/cc"
    >
      <div className={`h-[62px] w-[62px] lg:h-[68px] lg:w-[68px] rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2 p-2 group-hover/cc:scale-105 transition-transform`}>
        {img ? (
          <img src={img} alt={cat.name} className="h-full w-full object-contain" />
        ) : (
          <Package className="h-7 w-7 lg:h-8 lg:w-8 text-[#1B3B6F]" />
        )}
      </div>
      <p className="text-xs lg:text-[13px] font-semibold text-[#1A1D29] text-center line-clamp-2 leading-tight">{cat.name}</p>
    </Link>
  )
}

function ProductCard({
  product,
  getPrice,
  getMrp,
  getDiscount,
  getImage,
  getRating,
  onAdd,
  variant,
}: {
  product: any
  getPrice: (p: any) => number
  getMrp: (p: any) => number
  getDiscount: (p: any) => number
  getImage: (p: any) => string
  getRating: (p: any) => number
  onAdd: (id: string) => void
  variant: 'mobile' | 'desktop'
}) {
  const price = getPrice(product)
  const mrp = getMrp(product)
  const discount = getDiscount(product)
  const image = getImage(product)
  const brandName = product.brand?.name || product.brand || ''
  const rating = getRating(product)
  const id = product._id || product.id

  if (variant === 'mobile') {
    return (
      <div className="shrink-0 w-[148px] bg-white rounded-xl overflow-hidden border border-[#EEF0F3]">
        <Link href={`/shop/${id}`} className="block relative">
          <div className="h-[112px] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F7]">
            {image ? (
              <img src={image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>
          {discount > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-[#EF4444] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
        </Link>
        <div className="p-2.5">
          {brandName && (
            <p className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-wider mb-0.5">{brandName}</p>
          )}
          <Link href={`/shop/${id}`}>
            <h3 className="text-[12px] font-semibold text-[#1A1D29] line-clamp-2 leading-[15px] mb-1.5 hover:text-[#1B3B6F]">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline gap-1 mb-1.5">
            <span className="text-[13px] font-bold text-[#1B3B6F]">{'\u20B9'}{price.toLocaleString()}</span>
            {mrp > price && (
              <span className="text-[10px] text-gray-400 line-through">{'\u20B9'}{mrp.toLocaleString()}</span>
            )}
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-0.5 mb-1.5">
              <Star className="h-2.5 w-2.5 fill-[#F59E0B] text-[#F59E0B]" />
              <span className="text-[10px] font-bold text-gray-600">{rating.toFixed(1)}</span>
            </div>
          )}
          <button
            onClick={() => onAdd(id)}
            className="w-full py-1.5 rounded-md bg-[#1B3B6F] hover:bg-[#0F2545] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingCart className="h-3 w-3" />
            Add to Cart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#EEF0F3] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group/pc flex flex-col">
      <Link href={`/shop/${id}`} className="block relative overflow-hidden">
        <div className="h-[150px] lg:h-[170px] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F7]">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-cover group-hover/pc:scale-[1.03] transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {discount}% OFF
          </span>
        )}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          aria-label="Wishlist"
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover/pc:opacity-100 hover:bg-white hover:scale-110 shadow-sm transition-all"
        >
          <Heart className="h-3.5 w-3.5 text-gray-400 hover:text-[#EF4444]" />
        </button>
      </Link>
      <div className="p-3 lg:p-3.5 flex flex-col flex-1">
        {brandName && (
          <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider mb-1">{brandName}</p>
        )}
        <Link href={`/shop/${id}`}>
          <h3 className="text-[13px] lg:text-sm font-semibold text-[#1A1D29] line-clamp-2 leading-snug mb-2 hover:text-[#1B3B6F] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] lg:text-base font-bold text-[#1B3B6F]">{'\u20B9'}{price.toLocaleString()}</span>
              {mrp > price && (
                <span className="text-[11px] text-gray-400 line-through">{'\u20B9'}{mrp.toLocaleString()}</span>
              )}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-700">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onAdd(id)}
            className="w-full bg-[#1B3B6F] hover:bg-[#0F2545] text-white text-xs h-8 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

function HowStep({
  num,
  icon: Icon,
  title,
  desc,
  variant,
}: {
  num: string
  icon: any
  title: string
  desc?: string
  variant: 'mobile' | 'desktop'
}) {
  if (variant === 'mobile') {
    return (
      <div className="flex-1 flex flex-col items-center px-0.5">
        <div className="h-9 w-9 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-1.5 ring-1 ring-[#DBEAFE]">
          <Icon className="h-[18px] w-[18px] text-[#1B3B6F]" />
        </div>
        <p className="text-[10px] text-center text-gray-600 font-medium leading-[12px] whitespace-pre-line">
          <span className="font-bold text-[#1A1D29]">{num}. </span>
          {title}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center relative z-10">
      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-white border-2 border-[#DBEAFE] flex items-center justify-center mb-2 lg:mb-2.5 shadow-sm">
        <Icon className="h-5 w-5 lg:h-[22px] lg:w-[22px] text-[#1B3B6F]" />
      </div>
      <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider">Step {num}</p>
      <h4 className="text-[13px] lg:text-sm font-bold text-[#1A1D29] mt-0.5 mb-0.5">{title}</h4>
      {desc && <p className="text-[11px] lg:text-xs text-gray-500 max-w-[160px] leading-snug">{desc}</p>}
    </div>
  )
}

function TrustItem({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/15">
        <Icon className="h-4 w-4 md:h-5 md:w-5 text-[#FF6B35]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] md:text-[13px] lg:text-sm font-bold text-white truncate">{title}</p>
        <p className="text-[9px] md:text-[11px] text-white/70 truncate">{subtitle}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color, bg }: { icon: any; value: string; label: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl py-4 lg:py-5 px-3 flex flex-col items-center text-center border border-[#EEF0F3] hover:shadow-sm transition-shadow">
      <div
        className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color }} />
      </div>
      <div className="text-lg lg:text-xl xl:text-2xl font-extrabold text-[#1A1D29] tracking-tight">{value}</div>
      <div className="text-[11px] lg:text-xs text-gray-500 font-medium mt-0.5">{label}</div>
    </div>
  )
}

/* ─── Skeleton sub-components (shown while home data is loading) ─── */

function BannerSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-sm ring-1 ring-black/5">
      <div className="w-full aspect-[16/7] md:aspect-auto md:h-[210px] lg:h-[260px] xl:h-[300px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      <div className="absolute bottom-2.5 md:bottom-3.5 left-0 right-0 flex items-center justify-center gap-1">
        <div className="h-1.5 w-6 md:w-7 rounded-full bg-white/70" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
    </div>
  )
}

function CategorySkeleton({ variant }: { variant: 'mobile' | 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <div className="w-[88px] shrink-0 flex flex-col items-center gap-2">
        <div className="h-[72px] w-[72px] rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-2.5 w-16 rounded bg-gray-200 animate-pulse" />
        <div className="h-2 w-10 rounded bg-gray-100 animate-pulse" />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-[#EEF0F3] p-3 lg:p-4 flex flex-col items-center gap-2">
      <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-xl bg-gray-200 animate-pulse" />
      <div className="h-3 w-20 rounded bg-gray-200 animate-pulse mt-1" />
      <div className="h-2.5 w-14 rounded bg-gray-100 animate-pulse" />
    </div>
  )
}

function ProductSkeleton({ variant }: { variant: 'mobile' | 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <div className="w-[148px] shrink-0 bg-white rounded-xl border border-[#EEF0F3] overflow-hidden">
        <div className="w-full h-[120px] bg-gray-200 animate-pulse" />
        <div className="p-2.5 space-y-1.5">
          <div className="h-2.5 w-14 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-gray-200 animate-pulse" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-3.5 w-14 rounded bg-gray-200 animate-pulse" />
            <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl border border-[#EEF0F3] overflow-hidden">
      <div className="w-full h-[150px] lg:h-[170px] bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-16 rounded bg-gray-100 animate-pulse" />
        <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-3.5 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
          <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
