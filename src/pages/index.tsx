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
            SECTION 1 — Hero Banner Carousel (admin banners only)
           ══════════════════════════════════════════════════════════════ */}
        {bannerSlides.length > 0 && (
          <section className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
            <div className="max-w-7xl mx-auto relative">
              <div
                ref={bannerRef}
                className="overflow-hidden rounded-2xl shadow-sm md:shadow-md"
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
                          className="w-full h-[180px] sm:h-[220px] md:h-[320px] lg:h-[400px] xl:h-[460px] object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23e5e7eb"/>'
                          }}
                        />
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

              {/* Navigation arrows (desktop) */}
              {bannerSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBanner(prev => prev === 0 ? bannerSlides.length - 1 : prev - 1)}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-white/90 shadow-lg items-center justify-center hover:bg-white hover:scale-105 transition-all z-10"
                  >
                    <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6 text-[#1A1D29]" />
                  </button>
                  <button
                    onClick={() => setCurrentBanner(prev => (prev + 1) % bannerSlides.length)}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-white/90 shadow-lg items-center justify-center hover:bg-white hover:scale-105 transition-all z-10"
                  >
                    <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6 text-[#1A1D29]" />
                  </button>
                </>
              )}

              {/* Pagination dots */}
              {bannerSlides.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3 md:mt-4">
                  {bannerSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentBanner ? 'w-8 bg-[#1B3B6F]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — 4 Quick Action Circles
            (Book Service / Buy Parts / Bikes Service / Emergency)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mt-3 md:mt-5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm py-4 px-2 md:py-6 md:px-4 lg:py-7 lg:px-6 grid grid-cols-4 gap-1 md:gap-3">
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
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Popular Categories (horizontal scroll)
           ══════════════════════════════════════════════════════════════ */}
        {!loading && (subCategories.length > 0 || categories.length > 0) && (
          <section className="mt-5 md:mt-8">
            <div className="px-4 md:px-6 lg:px-8 mb-3 md:mb-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-[#1A1D29] tracking-tight">Popular Categories</h2>
                <Link href="/shop" className="flex items-center gap-0.5 text-[#1B3B6F] font-semibold text-sm md:text-base hover:underline">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="md:hidden">
              <div
                className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(subCategories.length > 0 ? subCategories : categories).slice(0, 10).map((cat: any) => {
                  const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))
                  return (
                    <Link
                      key={cat._id || cat.id}
                      href={`/shop?category=${cat._id || cat.id}`}
                      className="shrink-0 w-[110px] bg-white rounded-xl p-3 flex flex-col items-center border border-[#EEF0F3]"
                    >
                      <div className="h-[76px] w-full flex items-center justify-center mb-2.5">
                        {img ? (
                          <img src={img} alt={cat.name} className="h-[76px] w-20 object-contain" />
                        ) : (
                          <Package className="h-10 w-10 text-[#1B3B6F]" />
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-[#1A1D29] text-center truncate w-full">{cat.name}</p>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Desktop: horizontal scroll with grid feel */}
            <div className="hidden md:block px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div
                  className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {(subCategories.length > 0 ? subCategories : categories).slice(0, 12).map((cat: any) => {
                    const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))
                    return (
                      <Link
                        key={cat._id || cat.id}
                        href={`/shop?category=${cat._id || cat.id}`}
                        className="shrink-0 w-[160px] lg:w-[180px] bg-white rounded-2xl p-4 lg:p-5 flex flex-col items-center border border-[#EEF0F3] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <div className="h-24 w-full flex items-center justify-center mb-3">
                          {img ? (
                            <img src={img} alt={cat.name} className="h-24 w-24 object-contain" />
                          ) : (
                            <Package className="h-14 w-14 text-[#1B3B6F]" />
                          )}
                        </div>
                        <p className="text-sm lg:text-base font-semibold text-[#1A1D29] text-center truncate w-full">{cat.name}</p>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — AI Voice Booking card
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mt-5 md:mt-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/ai-booking"
              className="flex items-center gap-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl py-3.5 px-4 md:py-5 md:px-6 lg:py-6 lg:px-8 hover:shadow-md transition-all"
            >
              <div className="h-[42px] w-[42px] md:h-14 md:w-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Mic className="h-[22px] w-[22px] md:h-7 md:w-7 text-[#1B3B6F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] md:text-lg lg:text-xl font-bold text-[#1A1D29] mb-0.5">Try AI Voice Booking</p>
                <p className="text-xs md:text-sm text-[#1B3B6F] font-medium">Baat karein, booking ho jayegi!</p>
              </div>
              <div className="flex items-center gap-0.5 bg-white px-3 py-2 md:px-4 md:py-2.5 rounded-2xl shrink-0">
                <span className="text-[13px] md:text-sm font-bold text-[#1B3B6F]">Try Now</span>
                <ChevronRight className="h-4 w-4 text-[#1B3B6F]" />
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — How it works (4 steps)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mt-4 md:mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm py-4 px-3 md:py-7 md:px-6 lg:py-8 lg:px-10">
              <h3 className="text-[15px] md:text-xl lg:text-2xl font-bold text-[#1A1D29] ml-1 mb-3.5 md:mb-6">How it works</h3>
              <div className="flex items-start justify-between">
                <HowStep num="1" icon={List} title={"Choose\nService/Parts"} />
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-3 md:mt-5 shrink-0" />
                <HowStep num="2" icon={Calendar} title={"Select Date\n& Time"} />
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-3 md:mt-5 shrink-0" />
                <HowStep num="3" icon={ShieldCheck} title={"Confirm\n& Relax"} />
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-3 md:mt-5 shrink-0" />
                <HowStep num="4" icon={HomeIcon} title={"We come to\nyou"} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — Trust Badges (3 items)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mt-3 md:mt-5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm py-3.5 px-3 md:py-6 md:px-6 lg:py-8 lg:px-10 flex items-center">
              <TrustItem icon={ShieldCheck} title="Genuine Parts" subtitle="100% Original" />
              <div className="w-px bg-gray-200 self-stretch my-1" />
              <TrustItem icon={Award} title="Best Price" subtitle="Guaranteed" />
              <div className="w-px bg-gray-200 self-stretch my-1" />
              <TrustItem icon={Clock} title="On-time Service" subtitle="At your doorstep" />
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-8 md:h-12" />
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
    <div className="flex flex-col items-center text-center px-1">
      <div
        className="h-14 w-14 md:h-16 md:w-16 lg:h-[72px] lg:w-[72px] rounded-full flex items-center justify-center mb-2 md:mb-2.5"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9" style={{ color: iconColor }} />
      </div>
      <p className="text-[13px] md:text-sm lg:text-base font-bold text-[#1A1D29] leading-tight line-clamp-2">{title}</p>
      <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 truncate w-full">{sub}</p>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex flex-col items-center hover:opacity-80 transition-opacity">
        {content}
      </button>
    )
  }
  return (
    <Link href={href || '#'} className="flex flex-col items-center hover:opacity-80 transition-opacity">
      {content}
    </Link>
  )
}

function HowStep({ num, icon: Icon, title }: { num: string; icon: any; title: string }) {
  return (
    <div className="flex-1 flex flex-col items-center px-0.5">
      <div className="h-[42px] w-[42px] md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-2">
        <Icon className="h-[22px] w-[22px] md:h-6 md:w-6 lg:h-7 lg:w-7 text-[#1B3B6F]" />
      </div>
      <p className="text-[11px] md:text-[13px] lg:text-sm text-center text-gray-600 font-medium leading-[14px] md:leading-4 whitespace-pre-line">
        <span className="font-bold text-[#1A1D29]">{num}. </span>
        {title}
      </p>
    </div>
  )
}

function TrustItem({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex-1 flex items-center px-1 md:px-3">
      <Icon className="h-6 w-6 md:h-8 md:w-8 lg:h-9 lg:w-9 text-[#1B3B6F] shrink-0" />
      <div className="ml-2 md:ml-3 min-w-0">
        <p className="text-xs md:text-sm lg:text-base font-bold text-[#1A1D29] truncate">{title}</p>
        <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 truncate">{subtitle}</p>
      </div>
    </div>
  )
}
