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
        // Admin banners only (same as mobile)
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
    }, 4000)
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

  /* ─── Quick action navigation (mirrors mobile goToBikesService) ─── */
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

  const subCategories = categories.filter((c: any) => c.parentCategory)

  return (
    <UserLayout>
      <SEOHead
        title="Home"
        description="Bharat Mechanics – Buy genuine auto parts online, book certified mechanics for doorstep vehicle repair and servicing. Car parts, bike parts, engine oil, brake pads, filters & more. Fast delivery across India."
        keywords="auto parts online, car parts, bike parts, mechanic near me, vehicle repair, Bharat Mechanics, genuine auto parts, doorstep mechanic, car service, bike service, engine oil, brake pads, air filter, spark plug, car battery, tyre"
      />
      <div className="bg-[#F5F7FA] min-h-screen">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Professional Hero Banner (Compact)
           ══════════════════════════════════════════════════════════════ */}
        {bannerSlides.length > 0 && (
          <section className="px-3 md:px-6 lg:px-8 pt-2.5 md:pt-3 lg:pt-4">
            <div className="max-w-6xl mx-auto relative">
              <div
                ref={bannerRef}
                className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                >
                  {bannerSlides.map((slide, idx) => {
                    const content = (
                      <div className="w-full shrink-0 relative">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || `Promo banner ${idx + 1}`}
                          className="w-full h-[140px] sm:h-[180px] md:h-[240px] lg:h-[300px] object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" fill="%23e5e7eb"/>'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </div>
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

              {/* Navigation arrows */}
              {bannerSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBanner(prev => prev === 0 ? bannerSlides.length - 1 : prev - 1)}
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-md items-center justify-center hover:bg-white transition-all z-10"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#1B3B6F]" />
                  </button>
                  <button
                    onClick={() => setCurrentBanner(prev => (prev + 1) % bannerSlides.length)}
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-md items-center justify-center hover:bg-white transition-all z-10"
                  >
                    <ChevronRight className="h-5 w-5 text-[#1B3B6F]" />
                  </button>
                </>
              )}

              {/* Pagination dots */}
              {bannerSlides.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 md:mt-2.5">
                  {bannerSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full ${
                        idx === currentBanner 
                          ? 'w-6 h-2 bg-[#1B3B6F]' 
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — Professional Quick Actions (Compact)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <QuickAction
                icon={Wrench}
                iconColor="#1B3B6F"
                bg="#EFF6FF"
                title="Book Service"
                sub="Doorstep service"
                href="/service"
              />
              <QuickAction
                icon={ShoppingBag}
                iconColor="#059669"
                bg="#F0FDF4"
                title="Buy Parts"
                sub="Genuine parts"
                href="/shop"
              />
              <QuickAction
                icon={Bike}
                iconColor="#B45309"
                bg="#FFFBEB"
                title="Two Wheelers"
                sub="Bike services"
                onClick={goToBikesService}
              />
              <QuickAction
                icon={Headphones}
                iconColor="#BE185D"
                bg="#FDF2F8"
                title="Emergency"
                sub="24/7 support"
                href="/emergency"
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Professional Categories
           ══════════════════════════════════════════════════════════════ */}
        {!loading && (subCategories.length > 0 || categories.length > 0) && (
          <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4 lg:mt-5">
            <div className="max-w-6xl mx-auto mb-2.5 md:mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base lg:text-lg font-bold text-[#1A1D29]">Popular Categories</h3>
                <Link href="/shop" className="flex items-center gap-0.5 text-[#1B3B6F] font-medium text-xs md:text-sm hover:underline">
                  View all
                  <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: 3 columns */}
            <div className="md:hidden">
              <div className="grid grid-cols-3 gap-2">
                {(subCategories.length > 0 ? subCategories : categories).slice(0, 6).map((cat: any) => {
                  const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))
                  return (
                    <Link
                      key={cat._id || cat.id}
                      href={`/shop?category=${cat._id || cat.id}`}
                      className="bg-white rounded-lg p-2 flex flex-col items-center border border-gray-200 shadow-xs hover:shadow-sm transition-shadow"
                    >
                      <div className="h-[50px] w-full flex items-center justify-center mb-1.5">
                        {img ? (
                          <img src={img} alt={cat.name} className="h-12 w-12 object-contain" />
                        ) : (
                          <Package className="h-6 w-6 text-[#1B3B6F]" />
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-[#1A1D29] text-center line-clamp-2">{cat.name}</p>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Tablet & Desktop */}
            <div className="hidden md:block">
              <div className="overflow-x-auto scrollbar-hide">
                <div
                  className="flex gap-2.5 pb-1 min-w-max"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {(subCategories.length > 0 ? subCategories : categories).slice(0, 15).map((cat: any) => {
                    const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))
                    return (
                      <Link
                        key={cat._id || cat.id}
                        href={`/shop?category=${cat._id || cat.id}`}
                        className="shrink-0 w-[110px] lg:w-[130px] bg-white rounded-lg p-2.5 lg:p-3 flex flex-col items-center border border-gray-200 shadow-xs hover:shadow-sm hover:border-[#1B3B6F] transition-all"
                      >
                        <div className="h-[60px] lg:h-[70px] w-full flex items-center justify-center mb-2">
                          {img ? (
                            <img src={img} alt={cat.name} className="h-14 lg:h-16 w-14 lg:w-16 object-contain" />
                          ) : (
                            <Package className="h-7 w-7 lg:h-8 lg:w-8 text-[#1B3B6F]" />
                          )}
                        </div>
                        <p className="text-[10px] lg:text-xs font-medium text-[#1A1D29] text-center line-clamp-2">{cat.name}</p>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — Professional AI Voice Booking
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/ai-booking"
              className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-lg py-3 px-3 md:py-4 md:px-4 hover:bg-blue-100 hover:border-blue-300 transition-all group"
            >
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Mic className="h-5 w-5 md:h-6 md:w-6 text-[#1B3B6F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-[#1A1D29]">Try AI Voice Booking</p>
                <p className="text-[10px] md:text-xs text-gray-600">Baat karein, booking ho jayegi!</p>
              </div>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-[#1B3B6F] shrink-0" />
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — Professional How It Works
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm md:text-base lg:text-lg font-bold text-[#1A1D29] mb-3">How it works</h3>
            
            {/* Mobile: Vertical Timeline */}
            <div className="md:hidden space-y-2.5">
              <HowStepMobileCompact num="1" icon={List} title="Choose Service or Parts" />
              <div className="flex justify-center py-1">
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
              <HowStepMobileCompact num="2" icon={Calendar} title="Select Date & Time" />
              <div className="flex justify-center py-1">
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
              <HowStepMobileCompact num="3" icon={ShieldCheck} title="Confirm & Pay" />
              <div className="flex justify-center py-1">
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
              <HowStepMobileCompact num="4" icon={HomeIcon} title="We Come to You" />
            </div>

            {/* Desktop: Horizontal Flow */}
            <div className="hidden md:flex items-center justify-between gap-1.5 lg:gap-2">
              <HowStepCompact num="1" icon={List} title="Choose Service" />
              <div className="flex-1 flex items-center h-px bg-gray-300" />
              <HowStepCompact num="2" icon={Calendar} title="Select Time" />
              <div className="flex-1 flex items-center h-px bg-gray-300" />
              <HowStepCompact num="3" icon={ShieldCheck} title="Confirm & Pay" />
              <div className="flex-1 flex items-center h-px bg-gray-300" />
              <HowStepCompact num="4" icon={HomeIcon} title="We Come to You" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — Professional Trust Badges
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
              <TrustItemCardCompact icon={ShieldCheck} title="Genuine Parts" subtitle="100% Original" />
              <TrustItemCardCompact icon={Award} title="Best Price" subtitle="Price Guaranteed" />
              <TrustItemCardCompact icon={Clock} title="On-time Service" subtitle="Fast Delivery" />
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-8 md:h-10 lg:h-12" />
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

/* ════════════════════════════════════���════════════════════════════════
   Sub-components (match mobile)
   ═════════════════════════════════════════════════════════════════════ */

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
    <div className="flex flex-col items-center text-center px-1 w-full h-full justify-center">
      <div
        className="h-10 w-10 md:h-11 md:w-11 rounded-lg flex items-center justify-center mb-1.5 md:mb-2"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: iconColor }} />
      </div>
      <p className="text-[11px] md:text-xs lg:text-sm font-semibold text-[#1A1D29] leading-tight line-clamp-2">{title}</p>
      <p className="text-[9px] md:text-[10px] text-gray-600 mt-0.5 line-clamp-1">{sub}</p>
    </div>
  )

  if (onClick) {
    return (
      <button 
        type="button" 
        onClick={onClick} 
        className="bg-white rounded-lg shadow-xs hover:shadow-sm transition-shadow p-2.5 md:p-3"
      >
        {content}
      </button>
    )
  }
  return (
    <Link 
      href={href || '#'} 
      className="bg-white rounded-lg shadow-xs hover:shadow-sm transition-shadow p-2.5 md:p-3 flex"
    >
      {content}
    </Link>
  )
}

function HowStepCompact({ num, icon: Icon, title }: { num: string; icon: any; title: string }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-50 flex items-center justify-center border border-gray-200 shadow-xs">
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-[#1B3B6F]" />
        </div>
        <div className="absolute -top-1.5 -left-1.5 bg-[#1B3B6F] text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold shadow-sm">
          {num}
        </div>
      </div>
      <p className="text-[10px] md:text-xs text-center text-gray-700 font-medium mt-2 max-w-[70px] md:max-w-[80px]">
        {title}
      </p>
    </div>
  )
}

function HowStepMobileCompact({ num, icon: Icon, title }: { num: string; icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-gray-200 shadow-xs">
          <Icon className="h-5 w-5 text-[#1B3B6F]" />
        </div>
        <div className="absolute -top-1.5 -left-1.5 bg-[#1B3B6F] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm">
          {num}
        </div>
      </div>
      <p className="text-xs font-medium text-[#1A1D29]">{title}</p>
    </div>
  )
}

function TrustItemCardCompact({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 md:p-3 border border-gray-200 shadow-xs hover:shadow-sm hover:border-gray-300 transition-all flex flex-col items-center text-center">
      <div className="h-8 w-8 md:h-9 md:w-9 bg-blue-50 rounded-lg flex items-center justify-center mb-1.5 shadow-xs">
        <Icon className="h-4.5 w-4.5 md:h-5 md:w-5 text-[#1B3B6F]" />
      </div>
      <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-[#1A1D29]">{title}</p>
      <p className="text-[8px] md:text-[9px] text-gray-600 mt-0.5">{subtitle}</p>
    </div>
  )
}
