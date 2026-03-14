'use client'
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { SEOHead } from '@/components/SEOHead'
import { loadUserRequest } from '@/store/slices/customerAuthSlice'
import { catalogAPI, userCartAPI, bannerAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Search, Star, ChevronRight, ChevronLeft,
  Wrench, AlertTriangle, Shield, Zap, Award,
  ShoppingCart, Package, ArrowRight,
  Car, Bike, SlidersHorizontal, X, Check,
  Receipt, Truck, Wallet, MapPinned, Heart, HelpCircle,
  Users, Mic,
} from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

/* ─── Fallback banner images (used when API banners not available) ─── */
const fallbackBanners = [
  { imageUrl: 'https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png', title: 'Premium Auto Parts Delivered Fast', subtitle: 'Genuine parts, expert service, doorstep delivery. Everything your vehicle needs.', link: '/shop', linkText: 'Shop Now' },
  { imageUrl: 'https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png', title: 'Expert Mechanics at Your Doorstep', subtitle: 'Book certified mechanics for hassle-free repairs and maintenance at home.', link: '/service', linkText: 'Book Now' },
  { imageUrl: 'https://ik.imagekit.io/aiwats/road-care/dummy-images/mb-b-1.png', title: 'Trusted by 10,000+ Vehicle Owners', subtitle: 'India\'s fastest growing auto parts and service platform with guaranteed quality.', link: '/shop', linkText: 'Shop Now' },
]

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
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null)

  /* ─── Banner state ─── */
  const [currentBanner, setCurrentBanner] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [bannerSlides, setBannerSlides] = useState(fallbackBanners)

  /* ─── Search & filter state (same as Android) ─── */
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterSelectedBrands, setFilterSelectedBrands] = useState<string[]>([])
  const [filterRating, setFilterRating] = useState(0)

  /* ─── Horizontal scroll refs ─── */
  const catScrollRef = useRef<HTMLDivElement>(null)
  const prodScrollRef = useRef<HTMLDivElement>(null)

  // ─── Load user if token exists ───
  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated) {
      dispatch(loadUserRequest())
    }
  }, [])

  // ─── Fetch home data (same parallel calls as Android) ───
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
        // Load dynamic banners from API
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

  /* ─── Helpers ─── */
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

  const scrollHorizontal = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return
    const amount = dir === 'left' ? -260 : 260
    ref.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const getPrice = (product: any) => {
    return product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0)
  }
  const getMrp = (product: any) => {
    const price = getPrice(product)
    return product.mrp || product.price?.mrp || product.originalPrice || price
  }
  const getDiscount = (product: any) => {
    const price = getPrice(product)
    const mrp = getMrp(product)
    if (!mrp || mrp <= price) return 0
    return Math.round(((mrp - price) / mrp) * 100)
  }
  const getImage = (product: any) => {
    return product.thumbnail?.url || (typeof product.thumbnail === 'string' ? product.thumbnail : '') || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || ''
  }
  const getRating = (product: any) => {
    return product.reviewsSummary?.averageRating || product.avgRating || product.rating || 0
  }

  const subCategories = categories.filter((c: any) => c.parentCategory)

  return (
    <UserLayout>
      <SEOHead
        title="Home"
        description="Bharat Mechanics – Buy genuine auto parts online, book certified mechanics for doorstep vehicle repair and servicing. Car parts, bike parts, engine oil, brake pads, filters & more. Fast delivery across India."
        keywords="auto parts online, car parts, bike parts, mechanic near me, vehicle repair, Bharat Mechanics, genuine auto parts, doorstep mechanic, car service, bike service, engine oil, brake pads, air filter, spark plug, car battery, tyre"
      />
      <div className="bg-[#F8FAFC] min-h-screen">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Quick Actions (Book Mechanic + Emergency)
           ══════════════════════════════════════════════════════════════ */}
        {/* Mobile: Quick Actions + AI Booking (unchanged) */}
        <section className="md:hidden px-4 pt-4 mb-4">
          <div className="flex flex-row gap-3">
            <Link href="/service" className="flex-1 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group/action">
              <div className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] h-[70px] flex items-center gap-3 px-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Wrench className="h-5 w-5 text-white" /></div>
                <div className="relative z-10 min-w-0">
                  <h3 className="font-bold text-sm text-white">Book Mechanic</h3>
                  <p className="text-[11px] text-white/75 font-medium">At your doorstep</p>
                </div>
              </div>
            </Link>
            <Link href="/emergency" className="flex-1 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group/action">
              <div className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] h-[70px] flex items-center gap-3 px-4 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-white" /></div>
                <div className="relative z-10 min-w-0">
                  <h3 className="font-bold text-sm text-white">Emergency</h3>
                  <p className="text-[11px] text-white/75 font-medium">24/7 Support</p>
                </div>
              </div>
            </Link>
          </div>
          <Link href="/ai-booking" className="block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group/ai mt-3">
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] h-[70px] flex items-center gap-3 px-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute right-20 -top-4 w-20 h-20 bg-white/5 rounded-full" />
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Mic className="h-5 w-5 text-white" /></div>
              <div className="relative z-10 flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white">AI Voice Booking</h3>
                <p className="text-[11px] text-white/75 font-medium">Baat karein, booking ho jayegi!</p>
              </div>
              <ArrowRight className="h-5 w-5 text-white/60 shrink-0 group-hover/ai:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </section>

        {/* Desktop: 3-Column Hero Cards */}
        <section className="hidden md:block px-6 lg:px-8 pt-6 lg:pt-8 mb-6 lg:mb-8">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4 lg:gap-6">
            <Link href="/service" className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group/hero">
              <div className="bg-gradient-to-br from-[#FF6B35] to-[#E8521A] h-[120px] lg:h-[140px] flex items-center px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full" />
                <div className="absolute right-16 -top-8 w-24 h-24 bg-white/5 rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Wrench className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg lg:text-xl text-white">Book Mechanic</h3>
                    <p className="text-sm text-white/80 font-medium mt-0.5">Expert service at your doorstep</p>
                  </div>
                </div>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-hover/hero:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/ai-booking" className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group/hero">
              <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] h-[120px] lg:h-[140px] flex items-center px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/8 rounded-full" />
                <div className="absolute right-20 -top-6 w-24 h-24 bg-white/5 rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Mic className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg lg:text-xl text-white">AI Voice Booking</h3>
                    <p className="text-sm text-white/80 font-medium mt-0.5">Baat karein, booking ho jayegi!</p>
                  </div>
                </div>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-hover/hero:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/emergency" className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group/hero">
              <div className="bg-gradient-to-br from-[#DC2626] to-[#991B1B] h-[120px] lg:h-[140px] flex items-center px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full" />
                <div className="absolute right-16 -top-8 w-24 h-24 bg-white/5 rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg lg:text-xl text-white">Emergency</h3>
                    <p className="text-sm text-white/80 font-medium mt-0.5">24/7 roadside support</p>
                  </div>
                </div>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-hover/hero:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Vehicle Category Cards ("What are you looking for?")
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-4 md:mb-6 lg:mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3 md:mb-4">
              <h2 className="text-base md:text-lg lg:text-2xl font-bold text-[#1A1D29]">What are you looking for?</h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">Choose a category to get started</p>
            </div>
            <div className="flex flex-row gap-3 md:grid md:grid-cols-2 md:gap-5 lg:gap-6">
              {mainCategories.map((cat: any, index: number) => {
                const id = cat._id || cat.id
                const cardGradients = [
                  'from-[#0F172A] to-[#1E3A8A]',
                  'from-[#064E3B] to-[#059669]',
                  'from-[#7C2D12] to-[#EA580C]',
                  'from-[#581C87] to-[#9333EA]',
                ]
                const cardIcons = [Car, Bike, Package, Wrench]
                const cardDescriptions = [
                  'Car parts & accessories',
                  'Two-wheeler parts & services',
                  'Heavy vehicle parts',
                  'General auto parts',
                ]
                const gradient = cardGradients[index % cardGradients.length]
                const IconComp = cardIcons[index % cardIcons.length]
                const desc = cat.description || cardDescriptions[index % cardDescriptions.length]

                return (
                  <Link
                    key={id}
                    href={`/shop?parentCategory=${id}`}
                    onClick={() => setSelectedMainCategory(id)}
                    className={`flex-1 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group/cat ${
                      selectedMainCategory === id ? 'ring-2 ring-[#FF6B35]' : ''
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${gradient} px-4 py-3.5 md:px-6 md:py-5 lg:px-8 lg:py-6 flex items-center gap-3 md:gap-4 lg:gap-5`}>
                      <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-xl md:rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                        <IconComp className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm md:text-base lg:text-xl font-bold text-white">{cat.name}</h2>
                        <p className="text-xs md:text-sm text-white/70 font-medium mt-0.5 hidden sm:block">{desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/60 shrink-0 group-hover/cat:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — Promotional Banner Carousel
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-4 md:mb-6 lg:mb-8">
          <div className="max-w-7xl mx-auto relative">
            <div
              ref={bannerRef}
              className="overflow-hidden rounded-xl md:rounded-2xl shadow-sm md:shadow-md"
            >
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {bannerSlides.map((slide, idx) => (
                    <div key={idx} className="w-full shrink-0 relative">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title || `Promo banner ${idx + 1}`}
                        className="w-full h-[150px] sm:h-[180px] md:h-[300px] lg:h-[420px] xl:h-[480px] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23e5e7eb"/>'
                        }}
                      />
                      {/* Mobile: bottom gradient */}
                      <div className="md:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl" />
                      {/* Desktop: full overlay with text */}
                      <div className="hidden md:flex absolute inset-0 items-center rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0F2545]/90 via-[#0F2545]/50 to-transparent rounded-2xl" />
                        <div className="relative z-10 pl-10 lg:pl-16 xl:pl-20 max-w-lg lg:max-w-xl xl:max-w-2xl">
                          <h2 className="text-3xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-3 lg:mb-5">
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <p className="text-base lg:text-lg text-white/85 mb-5 lg:mb-7 leading-relaxed">
                              {slide.subtitle}
                            </p>
                          )}
                          <Link href={slide.link || '/shop'}>
                            <Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white font-bold px-6 py-3 lg:px-10 lg:py-5 text-sm lg:text-base xl:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                              {slide.linkText || 'Shop Now'} <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
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
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentBanner ? 'w-7 bg-[#FF6B35]' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — Browse by Part Type (Horizontal Scroll)
           ══════════════════════════════════════════════════════════════ */}
        {(subCategories.length > 0 || categories.length > 0) && (
          <section className="mb-4 md:mb-6">
            {/* Section Header */}
            <div className="px-4 md:px-6 lg:px-8 mb-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <h2 className="text-base md:text-lg lg:text-2xl font-bold text-[#1A1D29]">Browse by Part Type</h2>
                <Link href="/shop" className="flex items-center gap-1 text-[#FF6B35] font-semibold text-xs md:text-sm hover:underline">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden relative group">
              <div
                ref={catScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(subCategories.length > 0 ? subCategories : categories).slice(0, 8).map((cat: any) => (
                  <Link
                    key={cat._id || cat.id}
                    href={`/shop?category=${cat._id || cat.id}`}
                    className="shrink-0 w-[88px] bg-white rounded-2xl p-3 flex flex-col items-center border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#F0F4FF] to-[#E8EDFF] flex items-center justify-center mb-2">
                      {cat.image?.url ? (
                        <img src={cat.image.url} alt={cat.name} className="h-7 w-7 object-contain" />
                      ) : (
                        <Package className="h-7 w-7 text-[#1B3B6F]" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-[#1A1D29] text-center leading-[14px] line-clamp-2">{cat.name}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:block px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
                  {(subCategories.length > 0 ? subCategories : categories).slice(0, 16).map((cat: any) => (
                    <Link
                      key={cat._id || cat.id}
                      href={`/shop?category=${cat._id || cat.id}`}
                      className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 xl:p-5 flex flex-col items-center border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#FF6B35]/30 transition-all duration-300 hover:-translate-y-1 group/card"
                    >
                      <div className="h-12 w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#F0F4FF] to-[#E8EDFF] group-hover/card:from-[#FFF5F0] group-hover/card:to-[#FFE8DB] flex items-center justify-center mb-2 lg:mb-3 transition-colors">
                        {cat.image?.url ? (
                          <img src={cat.image.url} alt={cat.name} className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 object-contain" />
                        ) : (
                          <Package className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-[#1B3B6F] group-hover/card:text-[#FF6B35] transition-colors" />
                        )}
                      </div>
                      <p className="text-xs lg:text-sm font-semibold text-[#1A1D29] text-center leading-4 line-clamp-2">{cat.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — Best Sellers (Products)
           ══════════════════════════════════════════════════════════════ */}
        {featuredProducts.length > 0 && (
          <section className="mb-4 md:mb-8 lg:mb-10">
            {/* Section Header */}
            <div className="px-4 md:px-6 lg:px-8 mb-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <h2 className="text-base md:text-lg lg:text-2xl font-bold text-[#1A1D29]">Best Sellers</h2>
                <Link href="/shop" className="flex items-center gap-1 text-[#FF6B35] font-semibold text-xs md:text-sm hover:underline">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden relative group">
              <div
                ref={prodScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {featuredProducts.slice(0, 10).map((product: any) => {
                  const price = getPrice(product)
                  const mrp = getMrp(product)
                  const discount = getDiscount(product)
                  const image = getImage(product)
                  const brandName = product.brand?.name || product.brand || ''
                  const rating = getRating(product)

                  return (
                    <div
                      key={product._id || product.id}
                      className="shrink-0 w-[165px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <Link href={`/shop/${product._id || product.id}`} className="block relative">
                        <div className="h-[135px] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
                          {image ? (
                            <img src={image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-10 w-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {discount}% OFF
                          </span>
                        )}
                      </Link>
                      <div className="p-3">
                        {brandName && (
                          <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider mb-1">{brandName}</p>
                        )}
                        <Link href={`/shop/${product._id || product.id}`}>
                          <h3 className="text-[13px] font-semibold text-[#1A1D29] line-clamp-2 leading-[17px] mb-2 hover:text-[#1B3B6F]">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[15px] font-bold text-[#1B3B6F]">{'\u20B9'}{price.toLocaleString()}</span>
                          {mrp > price && (
                            <span className="text-[11px] text-gray-400 line-through">{'\u20B9'}{mrp.toLocaleString()}</span>
                          )}
                        </div>
                        {rating > 0 && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                            <span className="text-[11px] font-bold text-gray-600">{rating.toFixed(1)}</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleAddToCart(product._id || product.id)}
                          className="w-full py-2 rounded-lg bg-[#1B3B6F] hover:bg-[#0F2545] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Product Grid */}
            <div className="hidden md:block px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
                  {featuredProducts.slice(0, 10).map((product: any) => {
                    const price = getPrice(product)
                    const mrp = getMrp(product)
                    const discount = getDiscount(product)
                    const image = getImage(product)
                    const brandName = product.brand?.name || product.brand || ''
                    const rating = getRating(product)

                    return (
                      <div
                        key={product._id || product.id}
                        className="bg-white rounded-xl lg:rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group/product"
                      >
                        <Link href={`/shop/${product._id || product.id}`} className="block relative overflow-hidden">
                          <div className="h-[180px] lg:h-[220px] xl:h-[240px] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]">
                            {image ? (
                              <img src={image} alt={product.name} className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-14 w-14 text-gray-300" />
                              </div>
                            )}
                          </div>
                          {discount > 0 && (
                            <span className="absolute top-3 left-3 bg-[#EF4444] text-white text-xs lg:text-sm font-bold px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-lg shadow-sm">
                              {discount}% OFF
                            </span>
                          )}
                          <button className="absolute top-3 right-3 h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover/product:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 shadow-sm">
                            <Heart className="h-4 w-4 text-gray-400 hover:text-[#EF4444]" />
                          </button>
                        </Link>
                        <div className="p-4 lg:p-5 flex flex-col flex-1">
                          {brandName && (
                            <p className="text-xs font-bold text-[#FF6B35] uppercase tracking-wider mb-1.5">{brandName}</p>
                          )}
                          <Link href={`/shop/${product._id || product.id}`}>
                            <h3 className="text-sm lg:text-base xl:text-lg font-semibold text-[#1A1D29] line-clamp-2 leading-snug mb-3 hover:text-[#1B3B6F] transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl lg:text-2xl font-bold text-[#1B3B6F]">{'\u20B9'}{price.toLocaleString()}</span>
                                {mrp > price && (
                                  <span className="text-sm text-gray-400 line-through font-medium">{'\u20B9'}{mrp.toLocaleString()}</span>
                                )}
                              </div>
                              {rating > 0 && (
                                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                                  <span className="text-xs font-bold text-emerald-700">{rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleAddToCart(product._id || product.id)}
                              className="w-full bg-[#1B3B6F] hover:bg-[#0F2545] text-white text-sm lg:text-base h-10 lg:h-11 rounded-xl font-semibold transition-colors"
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — Why Choose Us (Trust Badges)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-4 md:mb-8 lg:mb-10">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Simple 3 cards */}
            <div className="grid grid-cols-3 gap-2.5 md:hidden">
              {[
                { icon: Shield, title: '100% Genuine', sub: 'Verified', color: 'text-[#1B3B6F]', bgColor: 'bg-[#1B3B6F]/8' },
                { icon: Zap, title: 'Fast Delivery', sub: 'Same day', color: 'text-[#FF6B35]', bgColor: 'bg-[#FF6B35]/8' },
                { icon: Award, title: '6 Mo Warranty', sub: 'Guaranteed', color: 'text-[#10B981]', bgColor: 'bg-[#10B981]/8' },
              ].map((badge, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 flex flex-col items-center text-center border border-gray-100 shadow-sm">
                  <div className={`h-9 w-9 rounded-lg ${badge.bgColor} flex items-center justify-center mb-1.5`}>
                    <badge.icon className={`h-4.5 w-4.5 ${badge.color}`} />
                  </div>
                  <p className="text-[12px] font-bold text-[#1A1D29]">{badge.title}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{badge.sub}</p>
                </div>
              ))}
            </div>
            {/* Desktop: Premium banner with dividers */}
            <div className="hidden md:grid grid-cols-3 bg-gradient-to-r from-[#F0F4FF] via-white to-[#FFF5F0] rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-x divide-gray-100">
              {[
                { icon: Shield, title: '100% Genuine', sub: 'Verified parts', desc: 'Every part verified for authenticity and quality assurance', color: 'text-[#1B3B6F]', bgColor: 'bg-[#1B3B6F]/8' },
                { icon: Zap, title: 'Fast Delivery', sub: 'Same day', desc: 'Same-day delivery available in select cities across India', color: 'text-[#FF6B35]', bgColor: 'bg-[#FF6B35]/8' },
                { icon: Award, title: '6 Mo Warranty', sub: 'Guaranteed', desc: 'Comprehensive warranty on all parts and services', color: 'text-[#10B981]', bgColor: 'bg-[#10B981]/8' },
              ].map((badge, idx) => (
                <div key={idx} className="p-6 lg:p-8 xl:p-10 flex flex-col items-center text-center">
                  <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl ${badge.bgColor} flex items-center justify-center mb-3`}>
                    <badge.icon className={`h-6 w-6 lg:h-7 lg:w-7 ${badge.color}`} />
                  </div>
                  <p className="text-base lg:text-lg font-bold text-[#1A1D29]">{badge.title}</p>
                  <p className="text-sm text-gray-400 font-medium">{badge.sub}</p>
                  <p className="text-xs lg:text-sm text-gray-400 mt-2 max-w-[220px] leading-relaxed">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — Manage Your Account
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-4 md:mb-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3 md:mb-4">
              <h2 className="text-base md:text-lg lg:text-2xl font-bold text-[#1A1D29]">Manage Your Account</h2>
            </div>

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  { icon: Receipt, label: 'My Orders', sub: 'Track & manage', href: '/orders', color: 'text-[#1B3B6F]', bg: 'bg-[#1B3B6F]/10' },
                  { icon: Truck, label: 'Services', sub: 'Repair requests', href: '/service', color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
                  { icon: Wallet, label: 'Wallet', sub: 'Balance & history', href: '/wallet', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
                  { icon: MapPinned, label: 'Addresses', sub: 'Delivery locations', href: '/addresses', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10' },
                  { icon: Heart, label: 'Wishlist', sub: 'Saved items', href: '/reviews', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
                  { icon: HelpCircle, label: 'Help', sub: 'Support & FAQ', href: '#', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={isAuthenticated ? item.href : `/login?redirect=${encodeURIComponent(item.href)}`}
                    className="shrink-0 w-[110px] bg-white rounded-2xl p-4 flex flex-col items-center text-center border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center mb-2.5`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className="text-xs font-semibold text-[#1A1D29] leading-4">{item.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-3">{item.sub}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
              {[
                { icon: Receipt, label: 'My Orders', sub: 'Track & manage', href: '/orders', color: 'text-[#1B3B6F]', bg: 'bg-[#1B3B6F]/8' },
                { icon: Truck, label: 'Services', sub: 'Repair status', href: '/service', color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/8' },
                { icon: Wallet, label: 'Wallet', sub: 'Balance', href: '/wallet', color: 'text-[#10B981]', bg: 'bg-[#10B981]/8' },
                { icon: MapPinned, label: 'Addresses', sub: 'Delivery', href: '/addresses', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/8' },
                { icon: Heart, label: 'Wishlist', sub: 'Saved items', href: '/reviews', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/8' },
                { icon: HelpCircle, label: 'Help', sub: 'Support', href: '#', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/8' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={isAuthenticated ? item.href : `/login?redirect=${encodeURIComponent(item.href)}`}
                  className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 xl:p-6 flex flex-col items-center text-center border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#FF6B35]/20 transition-all duration-300 hover:-translate-y-1 group/manage"
                >
                  <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl ${item.bg} group-hover/manage:scale-110 flex items-center justify-center mb-2 lg:mb-3 transition-transform`}>
                    <item.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${item.color}`} />
                  </div>
                  <p className="text-xs lg:text-sm font-bold text-[#1A1D29] leading-4">{item.label}</p>
                  <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  <ArrowRight className="hidden lg:block h-4 w-4 text-gray-300 group-hover/manage:text-[#FF6B35] mt-2 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9 — How It Works (Desktop only)
           ══════════════════════════════════════════════════════════════ */}
        <section className="hidden md:block px-6 lg:px-8 mb-6 lg:mb-10">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#0F2545] to-[#1B3B6F] rounded-2xl px-8 py-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF6B35]/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#FF6B35]/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center mb-6 lg:mb-10">
                  How Bharat Mechanics Works
                </h2>
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4 items-center">
                  {[
                    { step: '01', title: 'Search & Select', desc: 'Browse thousands of genuine auto parts from top brands.', icon: Search },
                    { step: '02', title: 'Order & Pay', desc: 'Pay securely with multiple payment options.', icon: ShoppingCart },
                    { step: '03', title: 'Fast Delivery', desc: 'Get same-day doorstep delivery across India.', icon: Package },
                  ].map((item, idx) => (
                    <Fragment key={idx}>
                      <div className="text-center">
                        <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                          <item.icon className="h-7 w-7 lg:h-8 lg:w-8 text-[#FF6B35]" />
                        </div>
                        <p className="text-xs lg:text-sm font-bold text-[#FF6B35] uppercase tracking-wider mb-1.5">Step {item.step}</p>
                        <h3 className="text-base lg:text-lg font-bold text-white mb-1.5">{item.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                      </div>
                      {idx < 2 && (
                        <div className="hidden lg:flex items-center justify-center">
                          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF6B35]/40 to-transparent" />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            Stats Bar (Desktop only)
           ══════════════════════════════════════════════════════════════ */}
        <section className="hidden md:block px-6 lg:px-8 mb-6 lg:mb-10">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#F0F4FF] to-[#FFF5F0] rounded-2xl p-6 lg:p-8">
              <div className="grid grid-cols-4 gap-4 lg:gap-5">
                {[
                  { value: '10,000+', label: 'Happy Customers', icon: Users, color: 'text-[#1B3B6F]', bgColor: 'bg-[#1B3B6F]/8' },
                  { value: '50,000+', label: 'Parts Available', icon: Package, color: 'text-[#FF6B35]', bgColor: 'bg-[#FF6B35]/8' },
                  { value: '500+', label: 'Brands', icon: Award, color: 'text-[#6366F1]', bgColor: 'bg-[#6366F1]/8' },
                  { value: '4.8/5', label: 'Rating', icon: Star, color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/8' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center py-5 lg:py-6 xl:py-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex justify-center mb-3">
                      <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-[#1A1D29]">{stat.value}</div>
                    <div className="text-xs lg:text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-5 md:h-10 lg:h-16" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FILTER MODAL (Bottom Sheet — same as Android)
         ══════════════════════════════════════════════════════════════ */}
      {filterOpen && (
        <div className="fixed inset-0 z-[999]">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[#1A1D29]">Filter Parts</h3>
              <button onClick={() => setFilterOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {/* Category */}
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

              {/* Price Range */}
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

              {/* Brands */}
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

              {/* Rating */}
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

            {/* Footer */}
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
