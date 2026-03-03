'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
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
      <div className="bg-[#F8FAFC]">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — "What are you looking for?" Hero Categories
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 pt-5 pb-6 md:pt-10 md:pb-10 lg:pt-14 lg:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-5 md:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1D29] tracking-tight">
                What are you looking for?
              </h1>
              <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Choose a category to get started</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 lg:gap-6">
              {mainCategories.map((cat: any, index: number) => {
                const id = cat._id || cat.id
                const cardGradients = [
                  'bg-gradient-to-br from-[#0F172A] to-[#1E3A8A]',
                  'bg-gradient-to-br from-[#064E3B] to-[#059669]',
                  'bg-gradient-to-br from-[#7C2D12] to-[#EA580C]',
                  'bg-gradient-to-br from-[#581C87] to-[#9333EA]',
                ]
                const cardIcons = [Car, Bike, Package, Wrench]
                const cardEmojis = ['🚗', '🏍️', '🚛', '⚙️']
                const cardDescriptions = [
                  'Car parts & accessories',
                  'Two-wheeler parts & services',
                  'Heavy vehicle parts',
                  'General auto parts',
                ]
                const gradient = cardGradients[index % cardGradients.length]
                const IconComp = cardIcons[index % cardIcons.length]
                const emoji = cardEmojis[index % cardEmojis.length]
                const desc = cat.description || cardDescriptions[index % cardDescriptions.length]

                return (
                  <Link
                    key={id}
                    href={`/shop?parentCategory=${id}`}
                    onClick={() => setSelectedMainCategory(id)}
                    className={`flex-1 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
                      selectedMainCategory === id ? 'ring-2 ring-white/50 shadow-lg' : ''
                    }`}
                  >
                    <div className={`p-5 md:p-6 lg:p-8 min-h-[140px] md:min-h-[160px] lg:min-h-[180px] flex items-center gap-4 md:gap-5 ${gradient}`}>
                      <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <IconComp className="h-8 w-8 md:h-10 md:w-10 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-white">{cat.name}</h2>
                        <p className="text-sm md:text-base text-white/85 font-medium mt-0.5">
                          {emoji} {desc}
                        </p>
                      </div>
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Promotional Banner Carousel
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-10 lg:mb-12">
          <div className="max-w-7xl mx-auto relative">
            <div
              ref={bannerRef}
              className="overflow-hidden rounded-2xl"
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {bannerSlides.map((slide, idx) => (
                    <div key={idx} className="w-full shrink-0 relative">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title || `Promo banner ${idx + 1}`}
                        className="w-full h-[180px] sm:h-[220px] md:h-[320px] lg:h-[400px] xl:h-[450px] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23e5e7eb"/>'
                        }}
                      />
                      {/* Mobile: bottom gradient */}
                      <div className="md:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl" />
                      {/* Desktop: full overlay with text */}
                      <div className="hidden md:flex absolute inset-0 items-center rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0F2545]/90 via-[#0F2545]/60 to-transparent rounded-2xl" />
                        <div className="relative z-10 pl-10 lg:pl-16 max-w-lg lg:max-w-xl">
                          <h2 className="text-2xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-3 lg:mb-4">
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <p className="text-sm lg:text-base text-white/90 mb-4 lg:mb-6 leading-relaxed">
                              {slide.subtitle}
                            </p>
                          )}
                          <Link href={slide.link || '/shop'}>
                            <Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white font-bold px-6 py-3 lg:px-8 lg:py-4 text-sm lg:text-base rounded-xl shadow-lg">
                              {slide.linkText || 'Shop Now'} <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3 md:mt-5">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-[7px] rounded-full transition-all duration-300 ${
                    idx === currentBanner ? 'w-6 bg-[#1B3B6F]' : 'w-[7px] bg-[#CBD5E1]'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — Quick Actions (Book Mechanic + Emergency)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-8 md:mb-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 md:gap-5 lg:gap-6">
            <Link
              href="/service"
              className="flex-1 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="bg-gradient-to-br from-[#FF6B35] to-[#F7931E] h-[100px] md:h-[130px] lg:h-[140px] flex items-center gap-4 md:gap-5 px-5 md:px-8">
                <Wrench className="h-7 w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 text-white shrink-0" />
                <div>
                  <h3 className="font-bold text-[15px] md:text-lg lg:text-xl text-white">Book Mechanic</h3>
                  <p className="text-xs md:text-sm text-white/90 font-medium mt-0.5">At your doorstep</p>
                </div>
                <ArrowRight className="hidden md:block h-6 w-6 text-white/70 shrink-0 ml-auto" />
              </div>
            </Link>
            <Link
              href="/service"
              className="flex-1 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="bg-gradient-to-br from-[#DC2626] to-[#991B1B] h-[100px] md:h-[130px] lg:h-[140px] flex items-center gap-4 md:gap-5 px-5 md:px-8">
                <AlertTriangle className="h-7 w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 text-white shrink-0" />
                <div>
                  <h3 className="font-bold text-[15px] md:text-lg lg:text-xl text-white">Emergency</h3>
                  <p className="text-xs md:text-sm text-white/90 font-medium mt-0.5">24/7 Support</p>
                </div>
                <ArrowRight className="hidden md:block h-6 w-6 text-white/70 shrink-0 ml-auto" />
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — Browse by Part Type (Horizontal Scroll)
           ══════════════════════════════════════════════════════════════ */}
        {(subCategories.length > 0 || categories.length > 0) && (
          <section className="mb-8 md:mb-12 lg:mb-14">
            {/* Section Header */}
            <div className="px-4 md:px-6 lg:px-8 mb-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight">Browse by Part Type</h2>
                  <p className="text-[13px] md:text-sm text-gray-500 mt-1 font-medium">Popular categories</p>
                </div>
                <Link href="/shop" className="flex items-center gap-1 text-[#1B3B6F] font-semibold text-sm hover:underline">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden relative group">
              <div
                ref={catScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(subCategories.length > 0 ? subCategories : categories).slice(0, 8).map((cat: any) => (
                  <Link
                    key={cat._id || cat.id}
                    href={`/shop?category=${cat._id || cat.id}`}
                    className="shrink-0 w-[90px] bg-white rounded-2xl p-3.5 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="h-14 w-14 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-2.5">
                      {cat.image?.url ? (
                        <img src={cat.image.url} alt={cat.name} className="h-7 w-7 object-contain" />
                      ) : (
                        <Package className="h-7 w-7 text-[#1B3B6F]" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#1A1D29] text-center leading-4 line-clamp-2">{cat.name}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:block px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
                  {(subCategories.length > 0 ? subCategories : categories).slice(0, 12).map((cat: any) => (
                    <Link
                      key={cat._id || cat.id}
                      href={`/shop?category=${cat._id || cat.id}`}
                      className="bg-white rounded-2xl p-5 flex flex-col items-center border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group/card"
                    >
                      <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-[#F5F7FA] group-hover/card:bg-[#1B3B6F]/10 flex items-center justify-center mb-3 transition-colors">
                        {cat.image?.url ? (
                          <img src={cat.image.url} alt={cat.name} className="h-8 w-8 lg:h-10 lg:w-10 object-contain" />
                        ) : (
                          <Package className="h-8 w-8 lg:h-10 lg:w-10 text-[#1B3B6F]" />
                        )}
                      </div>
                      <p className="text-sm lg:text-base font-semibold text-[#1A1D29] text-center leading-5 line-clamp-2">{cat.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — Best Sellers (Horizontal Scroll)
           ══════════════════════════════════════════════════════════════ */}
        {featuredProducts.length > 0 && (
          <section className="mb-8 md:mb-12 lg:mb-14">
            {/* Section Header */}
            <div className="px-4 md:px-6 lg:px-8 mb-5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight">Best Sellers</h2>
                  <p className="text-[13px] md:text-sm text-gray-500 mt-1 font-medium">Top rated and trending</p>
                </div>
                <Link href="/shop" className="flex items-center gap-1 text-[#1B3B6F] font-semibold text-sm hover:underline">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden relative group">
              <div
                ref={prodScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
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
                      className="shrink-0 w-[180px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <Link href={`/shop/${product._id || product.id}`} className="block relative">
                        <div className="h-[140px] bg-[#F5F7FA]">
                          {image ? (
                            <img src={image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <span className="absolute top-2 right-2 bg-[#EF4444] text-white text-[11px] font-bold px-2 py-1 rounded-lg">
                            {discount}% OFF
                          </span>
                        )}
                      </Link>
                      <div className="p-3.5">
                        {brandName && (
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{brandName}</p>
                        )}
                        <Link href={`/shop/${product._id || product.id}`}>
                          <h3 className="text-sm font-semibold text-[#1A1D29] line-clamp-2 leading-[18px] mb-2.5 hover:text-[#1B3B6F]">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[17px] font-bold text-[#1B3B6F]">₹{price.toLocaleString()}</span>
                            {mrp > price && (
                              <span className="text-[13px] text-gray-400 line-through font-medium">₹{mrp.toLocaleString()}</span>
                            )}
                          </div>
                          {rating > 0 && (
                            <div className="flex items-center gap-1 bg-[#F5F7FA] px-2 py-1 rounded-lg">
                              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                              <span className="text-xs font-bold text-[#1A1D29]">{rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop: Product Grid */}
            <div className="hidden md:block px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 lg:gap-6">
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
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                      >
                        <Link href={`/shop/${product._id || product.id}`} className="block relative">
                          <div className="h-[200px] lg:h-[220px] bg-[#F5F7FA]">
                            {image ? (
                              <img src={image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-14 w-14 text-gray-300" />
                              </div>
                            )}
                          </div>
                          {discount > 0 && (
                            <span className="absolute top-3 right-3 bg-[#EF4444] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                              {discount}% OFF
                            </span>
                          )}
                        </Link>
                        <div className="p-4 flex flex-col flex-1">
                          {brandName && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{brandName}</p>
                          )}
                          <Link href={`/shop/${product._id || product.id}`}>
                            <h3 className="text-sm lg:text-base font-semibold text-[#1A1D29] line-clamp-2 leading-snug mb-3 hover:text-[#1B3B6F] transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="mt-auto">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg lg:text-xl font-bold text-[#1B3B6F]">₹{price.toLocaleString()}</span>
                                {mrp > price && (
                                  <span className="text-sm text-gray-400 line-through font-medium">₹{mrp.toLocaleString()}</span>
                                )}
                              </div>
                              {rating > 0 && (
                                <div className="flex items-center gap-1 bg-[#F5F7FA] px-2 py-1 rounded-lg">
                                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                  <span className="text-xs font-bold text-[#1A1D29]">{rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleAddToCart(product._id || product.id)}
                              className="w-full mt-3 bg-[#FF6B35] hover:bg-[#e55a2a] text-white text-sm h-10 rounded-xl font-semibold"
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
            SECTION 7 — Trust Badges (3-column, same as Android)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-4 md:px-6 lg:px-8 mb-8 md:mb-12 lg:mb-16">
          <div className="max-w-7xl mx-auto">
            {/* Desktop heading */}
            <div className="hidden md:block text-center mb-8 lg:mb-10">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight">Why Choose RoadCare?</h2>
              <p className="text-gray-500 mt-2 text-base lg:text-lg">India&apos;s most trusted auto parts platform</p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-5 lg:gap-8">
              {[
                { icon: Shield, title: '100% Genuine', sub: 'Verified parts', desktopDesc: 'Every part is sourced directly from authorized distributors and verified for authenticity before shipping.', color: 'text-[#1B3B6F]', bgColor: 'bg-[#1B3B6F]/10' },
                { icon: Zap, title: 'Fast Delivery', sub: 'Same day', desktopDesc: 'Get your parts delivered the same day for local orders. Express shipping available across India.', color: 'text-[#FF6B35]', bgColor: 'bg-[#FF6B35]/10' },
                { icon: Award, title: '6 Mo Warranty', sub: 'Guaranteed', desktopDesc: 'All parts come with a minimum 6-month warranty. Hassle-free returns and replacements.', color: 'text-[#10B981]', bgColor: 'bg-[#10B981]/10' },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center border border-gray-200 shadow-sm md:hover:shadow-lg md:transition-all md:duration-300"
                >
                  {/* Mobile: plain icon */}
                  <badge.icon className={`h-8 w-8 ${badge.color} mb-2.5 md:hidden`} />
                  {/* Desktop: icon with colored background */}
                  <div className={`hidden md:flex h-14 w-14 lg:h-16 lg:w-16 rounded-2xl ${badge.bgColor} items-center justify-center mb-4`}>
                    <badge.icon className={`h-7 w-7 lg:h-8 lg:w-8 ${badge.color}`} />
                  </div>
                  <p className="text-[13px] md:text-base lg:text-lg font-bold text-[#1A1D29] tracking-wide">{badge.title}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1 md:hidden">{badge.sub}</p>
                  <p className="hidden md:block text-sm lg:text-base text-gray-500 mt-2 leading-relaxed">{badge.desktopDesc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop-only: How RoadCare Works */}
        <section className="hidden md:block px-6 lg:px-8 mb-12 lg:mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-[#1B3B6F] to-[#0F2545] rounded-3xl p-8 lg:p-12 xl:p-16">
              <div className="text-center mb-8 lg:mb-12">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-white tracking-tight">
                  How RoadCare Works
                </h2>
                <p className="text-white/70 mt-2 text-base lg:text-lg">
                  Get quality parts in 3 simple steps
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 lg:gap-10">
                {[
                  { step: '01', title: 'Search & Select', desc: 'Browse thousands of genuine auto parts. Filter by vehicle, brand, or category.', icon: Search },
                  { step: '02', title: 'Order & Pay', desc: 'Add to cart, choose delivery speed, and pay securely with multiple options.', icon: ShoppingCart },
                  { step: '03', title: 'Fast Delivery', desc: 'Get doorstep delivery with real-time tracking. Same-day available for local orders.', icon: Package },
                ].map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 lg:mb-6">
                      <item.icon className="h-8 w-8 lg:h-10 lg:w-10 text-[#FF6B35]" />
                    </div>
                    <div className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest mb-2">Step {item.step}</div>
                    <h3 className="text-lg lg:text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm lg:text-base text-white/70 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8 lg:mt-12">
                <Link href="/shop">
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white font-bold px-8 py-4 text-base rounded-xl shadow-lg">
                    Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop-only: Stats Bar */}
        <section className="hidden md:block px-6 lg:px-8 mb-12 lg:mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-4 lg:gap-6">
              {[
                { value: '10,000+', label: 'Happy Customers' },
                { value: '50,000+', label: 'Parts Available' },
                { value: '500+', label: 'Brands' },
                { value: '4.8/5', label: 'Customer Rating' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center py-6 lg:py-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <div className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-[#1B3B6F]">{stat.value}</div>
                  <div className="text-sm lg:text-base text-gray-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#1A1D29] tracking-wide">Filter Parts</h3>
              <button onClick={() => setFilterOpen(false)} className="p-1">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {/* Category */}
              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3 tracking-wide">Category</h4>
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
                <h4 className="text-base font-bold text-[#1A1D29] mb-3 tracking-wide">Price Range</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-500 mb-2">Min</p>
                    <input
                      type="number"
                      placeholder="₹0"
                      value={filterPriceMin}
                      onChange={e => setFilterPriceMin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-[15px] font-semibold text-[#1A1D29] outline-none focus:border-[#1B3B6F]"
                    />
                  </div>
                  <span className="text-base font-bold text-gray-400 mt-7">-</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-500 mb-2">Max</p>
                    <input
                      type="number"
                      placeholder="₹10000"
                      value={filterPriceMax}
                      onChange={e => setFilterPriceMax(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F7FA] text-[15px] font-semibold text-[#1A1D29] outline-none focus:border-[#1B3B6F]"
                    />
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="mt-6">
                <h4 className="text-base font-bold text-[#1A1D29] mb-3 tracking-wide">Brands</h4>
                <div className="flex flex-wrap gap-2.5">
                  {filterBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => toggleFilterBrand(brand)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                        filterSelectedBrands.includes(brand)
                          ? 'bg-[#F5F7FA] border-[#1B3B6F] text-[#1B3B6F]'
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
                <h4 className="text-base font-bold text-[#1A1D29] mb-3 tracking-wide">Minimum Rating</h4>
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
            <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
              <button
                onClick={resetFilters}
                className="flex-1 py-3.5 rounded-xl border-2 border-[#1B3B6F] text-[#1B3B6F] font-bold text-base tracking-wide"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-[#1B3B6F] to-[#0F2545] text-white font-bold text-base tracking-wide shadow-md"
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
