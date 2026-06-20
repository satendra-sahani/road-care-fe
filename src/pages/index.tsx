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
import Head from 'next/head'
import {
  Wrench, ShoppingBag, Bike, Headphones, Mic,
  ChevronRight, ChevronLeft, ShieldCheck, Award, Clock,
  List, Calendar, Home as HomeIcon, Package, Star, X, Check,
  ShoppingCart, Zap, Users, Heart, ArrowRight,
  Smartphone, BadgeCheck, MapPin,
  Quote, Building2, Truck, Plus, Minus,
  CreditCard, Sparkles, Tag, Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

/* ─── Filter brands list (same as Android) ─── */
const filterBrands = ['Bosch', 'Denso', 'NGK', 'Mann', 'Mobil', 'Shell', 'Castrol', 'Monroe']

/* ─── Default hero banners (shown only when admin has set none) ─── */
const DEFAULT_BANNERS = [
  { imageUrl: '/banners/banner-hero.svg?v=2', title: 'Genuine auto parts & doorstep mechanics', link: '/shop' },
  { imageUrl: '/banners/banner-1.svg', title: 'Genuine auto parts, delivered fast', link: '/shop' },
  { imageUrl: '/banners/banner-2.svg', title: 'Doorstep mechanic service at your home', link: '/service' },
  { imageUrl: '/banners/banner-3.svg', title: 'Verified mechanics, transparent pricing', link: '/service' },
]

/* ─── Homepage FAQ content (also emitted as FAQPage schema for Google) ─── */
const HOME_FAQS = [
  {
    q: 'Are the auto parts genuine?',
    a: 'Yes — every part on Bharat Mechanics is sourced directly from authorised brand distributors (Bosch, Denso, NGK, Mann, Mobil, Shell, Castrol, Monroe and 500+ others). Each order ships with a verifiable invoice.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery is 1–3 days across most Indian cities, and 4–7 days for non-metro areas. Same-day delivery is available in select cities for in-stock items ordered before 12 PM.',
  },
  {
    q: 'Are your mechanics verified?',
    a: 'Every mechanic on the platform is background-verified with Aadhaar / DL checks, has hands-on training, and shows a live photo + ID before starting any service. You can rate and review after every visit.',
  },
  {
    q: 'Do you offer doorstep service?',
    a: 'Yes — most routine services (oil change, brake pad replacement, AC service, battery, electrical, etc.) can be done at your home, office, or wherever your vehicle is parked, at no extra charge.',
  },
  {
    q: 'What if I\'m not satisfied with the service?',
    a: 'You only pay after the job is complete. If anything is wrong within 7 days, raise a ticket from the app and we\'ll send a mechanic back free of charge — or refund the service fee.',
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds for cancelled or returned parts are credited to your wallet instantly, and to the original payment method within 5–7 business days. See our refund policy for full details.',
  },
]

/* ─── Popular service prices for the transparency table ─── */
const POPULAR_SERVICES = [
  { service: 'Periodic Service', price: 2499, savings: 35, icon: Wrench },
  { service: 'AC Service & Gas Refill', price: 1799, savings: 30, icon: Settings },
  { service: 'Brake Service', price: 999, savings: 25, icon: ShieldCheck },
  { service: 'Battery Replacement', price: 4499, savings: 20, icon: Zap },
  { service: 'Oil Change', price: 599, savings: 40, icon: Heart },
  { service: 'Denting & Painting', price: 1499, savings: 30, icon: Award },
  { service: 'Roadside Assistance', price: 499, savings: 50, icon: Truck },
  { service: 'Bike Service @ Home', price: 799, savings: 40, icon: Bike },
]

/* ─── Premium testimonials with profession + verified tick ─── */
const TESTIMONIALS = [
  {
    name: 'Rahul Sharma', profession: 'Software Engineer', city: 'Bengaluru',
    rating: 5, initials: 'RS', bg: '#1B3B6F', verified: true,
    quote: 'Booked a service for my Honda City via the app. The mechanic arrived on time, fixed the AC issue at my doorstep, and pricing was exactly as quoted. Highly recommended.',
  },
  {
    name: 'Priya Patel', profession: 'Architect', city: 'Ahmedabad',
    rating: 5, initials: 'PP', bg: '#FF6B35', verified: true,
    quote: 'Ordered brake pads for my Activa. Genuine Bosch parts arrived next day, packed properly. The voice booking feature in Hindi is a game changer for my dad.',
  },
  {
    name: 'Karthik Reddy', profession: 'Account Manager', city: 'Hyderabad',
    rating: 5, initials: 'KR', bg: '#059669', verified: true,
    quote: 'My car broke down on the highway at 11pm. Used the emergency feature, a verified mechanic reached me in 30 minutes. Saved my night, literally.',
  },
  {
    name: 'Anjali Mehra', profession: 'Lawyer', city: 'Mumbai',
    rating: 5, initials: 'AM', bg: '#6366F1', verified: true,
    quote: 'The transparent pricing is what kept me. I compared the same brake-pad replacement at three garages and Bharat Mechanics was 18% cheaper with genuine parts.',
  },
  {
    name: 'Suresh Iyer', profession: 'Teacher', city: 'Chennai',
    rating: 5, initials: 'SI', bg: '#BE185D', verified: true,
    quote: 'I refer everyone in my colony now. The Refer & Earn rewards have paid for two of my services already. Plus the live tracking is just like Uber.',
  },
]

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

  /* ─── FAQ accordion state ─── */
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  /* ─── Premium-pass state: promo strip, testimonial carousel ─── */
  const [showPromo, setShowPromo] = useState(true)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  /* ─── Restore promo dismissal across visits ─── */
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('bm_promo_dismissed') === '1') {
      setShowPromo(false)
    }
  }, [])

  const dismissPromo = () => {
    setShowPromo(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('bm_promo_dismissed', '1')
    }
  }

  /* ─── Auto-rotate testimonials (5s per card, pauses if user interacts) ─── */
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(t)
  }, [])

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
        setBannerSlides(
          Array.isArray(apiBanners) && apiBanners.length > 0 ? apiBanners : DEFAULT_BANNERS
        )
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
        canonicalUrl="https://bharatmechanics.com/"
      />

      {/* Structured data for Google — FAQ rich results + site search box */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: HOME_FAQS.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Bharat Mechanics',
              url: 'https://bharatmechanics.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://bharatmechanics.com/shop?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </Head>

      <div className="bg-mesh-soft min-h-screen pb-20 md:pb-0">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 0 — Promo strip (dismissable, persists in localStorage)
           ══════════════════════════════════════════════════════════════ */}
        {showPromo && (
          <div className="relative bg-gradient-to-r from-[#FF6B35] via-[#F25C2A] to-[#E94E20] text-white">
            <div className="px-3 md:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 py-2 md:py-2.5">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Tag className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 hidden sm:block" />
                  <p className="text-[11px] md:text-xs lg:text-sm font-medium truncate">
                    <span className="font-bold">BHARAT50</span>
                    <span className="opacity-90"> · Up to ₹500 off your first service · Free doorstep pickup across India</span>
                  </p>
                </div>
                <Link
                  href="/service"
                  className="hidden md:inline-flex items-center gap-1 bg-white/20 backdrop-blur hover:bg-white/30 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold transition-colors shrink-0"
                >
                  Claim now <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={dismissPromo}
                  aria-label="Dismiss promo"
                  className="h-6 w-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Hero Banner (admin banners)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 pt-3 md:pt-5">
          <div className="max-w-7xl mx-auto">
            {loading && bannerSlides.length === 0 ? (
              <BannerSkeleton />
            ) : bannerSlides.length > 0 ? (
              <div className="relative group/banner anim-fade-up">
                <div
                  ref={bannerRef}
                  className="overflow-hidden rounded-2xl md:rounded-3xl shadow-elevated ring-1 ring-black/[0.06] bg-mesh-navy bg-noise"
                >
                  <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
                    style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                  >
                    {bannerSlides.map((slide, idx) => {
                      const content = (
                        // Fixed aspect-ratio slot + object-cover => the banner fills the full
                        // width at EVERY screen size (no letterbox gaps top/bottom or left/right).
                        // 64/15 == 1280x300, the size web banners are cropped to in admin, so it's
                        // a pixel match. Mobile keeps natural height (h-auto) for the full-width strip.
                        <img
                          src={slide.imageUrl}
                          alt={slide.title || `Promo banner ${idx + 1}`}
                          className="block w-full h-auto select-none md:aspect-[64/15] md:object-cover"
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

                {/* Nav arrows (desktop) — glassmorphic, hover-revealed */}
                {bannerSlides.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentBanner(prev => prev === 0 ? bannerSlides.length - 1 : prev - 1)}
                      aria-label="Previous slide"
                      className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-11 lg:w-11 rounded-full bg-white/15 ring-glass backdrop-blur-md items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-white/25 hover:scale-105 transition-all duration-300 z-10"
                    >
                      <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </button>
                    <button
                      onClick={() => setCurrentBanner(prev => (prev + 1) % bannerSlides.length)}
                      aria-label="Next slide"
                      className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-11 lg:w-11 rounded-full bg-white/15 ring-glass backdrop-blur-md items-center justify-center opacity-0 group-hover/banner:opacity-100 hover:bg-white/25 hover:scale-105 transition-all duration-300 z-10"
                    >
                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </button>
                  </>
                )}

                {/* Pagination dots — track-style with active rail */}
                {bannerSlides.length > 1 && (
                  <div className="absolute bottom-3 md:bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                    {bannerSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-[width,background-color] duration-500 ease-out ${
                          idx === currentBanner
                            ? 'w-8 md:w-10 bg-[#FF6B35] shadow-[0_0_12px_-2px_rgba(255,107,53,0.8)]'
                            : 'w-1.5 bg-white/45 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Fallback hero when no admin banners set
              <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-elevated ring-1 ring-black/[0.06] anim-fade-up">
                <div className="bg-mesh-navy bg-noise px-6 py-9 md:px-12 md:py-14 lg:px-16 lg:py-16 relative">
                  {/* Soft horizon line for editorial depth */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  {/* Hairline accent strip on the left edge */}
                  <div className="pointer-events-none absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#FF6B35]/60 to-transparent" />

                  <div className="relative z-10 max-w-2xl font-display">
                    <span className="anim-fade-up inline-flex items-center gap-1.5 bg-white/[0.08] ring-glass backdrop-blur-sm rounded-full px-3 py-1 text-[10px] md:text-[11px] font-semibold tracking-[0.14em] uppercase text-white/90 mb-4">
                      <Zap className="h-3 w-3 text-[#FF6B35]" />
                      India's Smartest AutoCare Platform
                    </span>
                    <h1 className="anim-fade-up anim-delay-1 text-display-xl text-white">
                      Car care,
                      <span className="block bg-gradient-to-r from-white via-[#FFE6D6] to-[#FF8A5C] bg-clip-text text-transparent">
                        now at your doorstep.
                      </span>
                    </h1>
                    <p className="anim-fade-up anim-delay-2 mt-4 md:mt-5 text-sm md:text-base lg:text-lg text-white/75 max-w-lg leading-relaxed font-sans text-balance">
                      Trusted mechanics, genuine OEM parts, on-time service and prices you can verify upfront — across 30+ Indian cities.
                    </p>
                    <div className="anim-fade-up anim-delay-3 mt-6 md:mt-8 flex flex-wrap gap-3">
                      <Link
                        href="/service"
                        className="shimmer-sweep group/cta inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF7C49] text-white font-semibold px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-[15px] rounded-full shadow-glow-accent hover:scale-[1.02] transition-all duration-300 font-sans"
                      >
                        Book a Service
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/15 ring-glass backdrop-blur text-white font-semibold px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-[15px] rounded-full transition-all duration-300 font-sans"
                      >
                        Shop Parts
                        <ArrowRight className="h-4 w-4 opacity-60" />
                      </Link>
                    </div>

                    {/* Quiet trust row — reinforces credibility under the CTAs */}
                    <div className="anim-fade-up anim-delay-4 mt-7 md:mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] md:text-xs text-white/65 font-sans">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A5C]" />
                        100% Genuine Parts
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/25" />
                      <span className="flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 text-[#FF8A5C]" />
                        Verified Mechanics
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/25" />
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#FF8A5C]" />
                        On-time, every time
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1B — AI Voice Booking (highlighted feature, top-of-page)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/ai-booking"
              className="group/ai relative block overflow-hidden rounded-2xl md:rounded-[22px] ring-1 ring-white/10 shadow-[0_12px_44px_-14px_rgba(15,37,71,0.55)] transition-all duration-300 hover:ring-white/[0.18] hover:shadow-[0_18px_54px_-14px_rgba(15,37,71,0.65)] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(115deg,#0E2042 0%,#1B3B6F 54%,#173461 100%)' }}
            >
              {/* Material: top inner highlight, brand glow, right sheen, fine grain */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF6B35]/[0.18] rounded-full blur-3xl" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-[#FF6B35]/[0.07] to-transparent" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 0.8px,transparent 0.8px)', backgroundSize: '14px 14px' }} />

              <div className="relative flex items-center gap-3 md:gap-4 px-3.5 py-2 md:px-6 md:py-3.5 lg:px-7">
                {/* Mic orb with listening sonar */}
                <div className="relative shrink-0 grid place-items-center">
                  <span className="absolute h-9 w-9 md:h-10 md:w-10 rounded-full ring-1 ring-[#FF6B35]/50 animate-ping" aria-hidden />
                  <span className="absolute inset-0 m-auto h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#FF6B35]/25 blur-md" aria-hidden />
                  <div className="relative h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-[#FF8A5C] to-[#FF5A1F] flex items-center justify-center ring-2 ring-white/25 shadow-[0_4px_14px_-2px_rgba(255,107,53,0.65)]">
                    <Mic className="h-4 w-4 md:h-[18px] md:w-[18px] text-white" strokeWidth={2.4} />
                  </div>
                  {/* Live dot */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-[#0E2042]" />
                  </span>
                </div>

                {/* Copy */}
                <div className="flex-1 min-w-0 font-display">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#FFC2A6] bg-white/[0.08] ring-1 ring-white/10 rounded-full px-2 py-[3px] font-sans backdrop-blur-sm mb-1">
                    <Sparkles className="h-2.5 w-2.5 text-[#FF8A5C]" /> AI Powered · हिंदी में
                  </span>
                  <p className="text-[14px] md:text-[18px] font-extrabold tracking-[-0.02em] text-white leading-[1.15] truncate">
                    {/* Short on mobile to stay one tight line, full headline on sm+ */}
                    <span className="sm:hidden">AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A5C] to-[#FFC2A6]">Voice</span> Booking</span>
                    <span className="hidden sm:inline">Book a service just by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A5C] to-[#FFC2A6]">speaking</span></span>
                  </p>
                  <p className="hidden sm:block text-[11px] md:text-[12.5px] text-white/55 font-medium mt-0.5 truncate font-sans">
                    Baat karein, booking ho jayegi — in Hindi or English, hands-free.
                  </p>
                </div>

                {/* Live equalizer (md+) */}
                <div className="hidden md:flex items-center gap-[3px] h-7 mr-0.5" aria-hidden>
                  {[0.4, 0.78, 1, 0.55, 0.9, 0.5, 0.82, 0.62, 0.95, 0.45].map((h, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-[#FF6B35] to-[#FFD0B8]"
                      style={{
                        height: `${h * 100}%`,
                        animation: 'fadeUp 1.1s ease-in-out infinite alternate',
                        animationDelay: `${i * 0.09}s`,
                      }}
                    />
                  ))}
                </div>

                {/* CTA */}
                <span className="relative inline-flex items-center gap-1.5 bg-white text-[#0F2547] group-hover/ai:bg-[#FF6B35] group-hover/ai:text-white font-bold px-4 py-2 md:px-5 rounded-full text-[12px] md:text-[13px] shrink-0 shadow-[0_4px_14px_-3px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.04] transition-colors duration-300">
                  Try Now
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/ai:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1C — Trust ribbon (lightweight)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm px-3 py-3 md:px-5 md:py-3.5">
              <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-gray-100">
                <Pillar icon={BadgeCheck} title="Genuine Parts" subtitle="100% OEM Original" color="#1B3B6F" bg="#DBEAFE" />
                <Pillar icon={ShieldCheck} title="30-Day Warranty" subtitle="On every service" color="#059669" bg="#D1FAE5" />
                <Pillar icon={HomeIcon} title="Doorstep Service" subtitle="At home or office" color="#FF6B35" bg="#FFE4D6" />
                <Pillar icon={CreditCard} title="Transparent Pricing" subtitle="No hidden fees" color="#6366F1" bg="#E0E7FF" />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — Premium Quick Actions (the page's primary CTA hub)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-5 md:mt-7">
          <div className="max-w-7xl mx-auto">
            {/* Editorial section header */}
            <div className="flex items-end justify-between mb-3 md:mb-4 px-1">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-[#FF6B35] mb-1">
                  What do you need today?
                </p>
                <h2 className="font-display text-xl md:text-2xl lg:text-[26px] font-bold tracking-[-0.025em] text-[#0F2545]">
                  Pick an action, we&apos;ll take it from there
                </h2>
              </div>
              <Link
                href="/service"
                className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-[#1B3B6F] hover:text-[#FF6B35] transition-colors"
              >
                See all services
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <QuickAction
                icon={Wrench}
                accent="#1B3B6F"
                accentSoft="#DBEAFE"
                title="Book Service"
                sub="At your doorstep"
                meta="Free pickup"
                cta="Book Now"
                href="/service"
                index={0}
              />
              <QuickAction
                icon={ShoppingBag}
                accent="#059669"
                accentSoft="#D1FAE5"
                title="Buy Parts"
                sub="100% genuine OEM"
                meta="1000+ brands"
                cta="Shop Now"
                href="/shop"
                index={1}
              />
              <QuickAction
                icon={Bike}
                accent="#B45309"
                accentSoft="#FED7AA"
                title="Bikes Service"
                sub="Two-wheeler care"
                meta="Bike & scooter"
                cta="View Bikes"
                onClick={goToBikesService}
                index={2}
              />
              <QuickAction
                icon={Headphones}
                accent="#BE185D"
                accentSoft="#FCE7F3"
                title="Emergency"
                sub="24/7 roadside help"
                meta="< 30 min ETA"
                cta="Get Help"
                href="/emergency"
                index={3}
                urgent
              />
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
            <div className="px-3 md:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex items-end justify-between mb-3 md:mb-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-[#FF6B35] mb-1">
                    Shop by part type
                  </p>
                  <h2 className="font-display text-xl md:text-2xl lg:text-[26px] font-bold tracking-[-0.025em] text-[#0F2545]">
                    Popular Categories
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-[#1B3B6F] hover:text-[#FF6B35] transition-colors group/va"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/va:translate-x-0.5" />
                </Link>
              </div>
            </div>

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
            SECTION 5B — Pricing Transparency Table
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-5 md:mt-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 md:mb-6">
              <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-wider">No Hidden Fees</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight mt-1">
                Popular services, transparent prices
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1.5 max-w-xl mx-auto">
                Up to 50% cheaper than authorised garages. Pay only after the job is done.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              {/* Desktop: 4-column grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4">
                {POPULAR_SERVICES.map((s, i) => (
                  <PricingCell key={i} service={s.service} price={s.price} savings={s.savings} icon={s.icon} idx={i} />
                ))}
              </div>
              {/* Mobile: compact list */}
              <div className="md:hidden divide-y divide-gray-100">
                {POPULAR_SERVICES.slice(0, 6).map((s, i) => (
                  <Link
                    key={i}
                    href="/service"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] flex items-center justify-center shrink-0">
                      <s.icon className="h-4 w-4 text-[#1B3B6F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1A1D29] truncate">{s.service}</p>
                      <p className="text-[10.5px] text-gray-500">Starts from <span className="font-bold text-[#1B3B6F]">₹{s.price.toLocaleString('en-IN')}</span></p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">Save {s.savings}%</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
              {/* CTA bar */}
              <div className="border-t border-gray-100 bg-gradient-to-r from-[#FFF7F2] to-[#FFE4D6] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
                <p className="text-[12px] md:text-sm font-semibold text-[#1A1D29]">
                  <Sparkles className="inline h-3.5 w-3.5 md:h-4 md:w-4 text-[#FF6B35] mr-1" />
                  All services include free pickup &amp; drop-off
                </p>
                <Link
                  href="/service"
                  className="inline-flex items-center gap-1 bg-[#FF6B35] hover:bg-[#e55a2a] text-white text-[11px] md:text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg shrink-0 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
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
            SECTION 8 — Stats row (responsive — visible on mobile too)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-3 md:mt-5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 lg:gap-4">
              <StatCard icon={Users} value="10,000+" label="Happy Customers" color="#1B3B6F" bg="#DBEAFE" />
              <StatCard icon={Package} value="50,000+" label="Parts Available" color="#FF6B35" bg="#FFE4D6" />
              <StatCard icon={Award} value="500+" label="Trusted Brands" color="#6366F1" bg="#E0E7FF" />
              <StatCard icon={Star} value="4.8/5" label="Customer Rating" color="#F59E0B" bg="#FEF3C7" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9 — Why Choose Bharat Mechanics (6 differentiators)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-8 md:mt-14">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-7 md:mb-10 max-w-2xl mx-auto">
              <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-[0.22em]">
                Why Bharat Mechanics
              </p>
              <h2 className="font-display text-2xl md:text-3xl lg:text-[40px] font-bold text-[#0F2545] tracking-[-0.035em] mt-3 leading-[1.08] text-balance">
                Built for India&apos;s drivers.
              </h2>
              <p className="text-[13px] md:text-[15px] text-gray-500 mt-3 md:mt-4 leading-relaxed text-pretty">
                Every order, every service, every interaction — designed to be transparent, safe, and on time.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <FeatureCard icon={BadgeCheck} title="100% Genuine Parts" desc="OEM-grade components sourced directly from authorised brand distributors." color="#1B3B6F" bg="#DBEAFE" />
              <FeatureCard icon={Wrench} title="Certified Mechanics" desc="Background-verified, ID-checked technicians with hands-on training." color="#059669" bg="#D1FAE5" />
              <FeatureCard icon={HomeIcon} title="Doorstep Service" desc="We come to your home, office or wherever your vehicle is parked." color="#FF6B35" bg="#FFE4D6" />
              <FeatureCard icon={CreditCard} title="Transparent Pricing" desc="Upfront quotes, no hidden charges. Pay only after the job is done." color="#6366F1" bg="#E0E7FF" />
              <FeatureCard icon={MapPin} title="Live Tracking" desc="Track your mechanic in real-time, with GPS-enabled service ETA." color="#BE185D" bg="#FCE7F3" />
              <FeatureCard icon={Headphones} title="24×7 Support" desc="Roadside emergencies handled around the clock, every day of the year." color="#F59E0B" bg="#FEF3C7" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 10 — Get the App (download promotion, premium build)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-8 md:mt-14">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-mesh-navy bg-noise shadow-elevated ring-1 ring-white/[0.06]">
              {/* Decorative grid pattern (CSS, no asset request) — adds tech texture */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '44px 44px',
                  maskImage: 'radial-gradient(ellipse at 70% 50%, black 30%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 70% 50%, black 30%, transparent 80%)',
                }}
              />
              {/* Top hairline + accent left rail */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="pointer-events-none absolute left-0 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-[#FF6B35]/60 to-transparent" />

              <div className="relative grid md:grid-cols-[1.1fr,0.9fr] gap-8 md:gap-10 px-6 py-9 md:px-12 md:py-14 lg:px-16 lg:py-16">
                {/* ─── Left column — copy + CTAs ─────────────────────── */}
                <div className="flex flex-col justify-center font-display">
                  <span className="anim-fade-up inline-flex w-fit items-center gap-1.5 bg-white/[0.08] ring-glass backdrop-blur-sm rounded-full px-3 py-1 text-[10px] md:text-[11px] font-semibold tracking-[0.14em] uppercase text-white/90 mb-4">
                    <Sparkles className="h-3 w-3 text-[#FF6B35]" />
                    Now on Google Play
                  </span>
                  <h2 className="anim-fade-up anim-delay-1 text-display-lg text-white">
                    Your garage in your{' '}
                    <span className="bg-gradient-to-r from-white via-[#FFE6D6] to-[#FF8A5C] bg-clip-text text-transparent">
                      pocket.
                    </span>
                  </h2>
                  <p className="anim-fade-up anim-delay-2 mt-4 text-sm md:text-base lg:text-[17px] text-white/75 leading-relaxed max-w-md font-sans text-balance">
                    Book in 60 seconds, track your mechanic live, and unlock app-only deals you won&apos;t see on the web.
                  </p>

                  {/* Feature chips — refined accent dots, glassy hover */}
                  <ul className="anim-fade-up anim-delay-2 mt-5 md:mt-6 grid grid-cols-2 gap-x-3 gap-y-2 max-w-md font-sans">
                    <AppFeatureItem text="AI Voice Booking" />
                    <AppFeatureItem text="Live Mechanic Tracking" />
                    <AppFeatureItem text="Wallet Cashback" />
                    <AppFeatureItem text="App-only Coupons" />
                  </ul>

                  {/* CTAs — store-style buttons with refined hierarchy */}
                  <div className="anim-fade-up anim-delay-3 mt-6 md:mt-8 flex flex-wrap gap-3 font-sans">
                    <a
                      href="https://play.google.com/store/apps/details?id=com.bharatmechanics.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shimmer-sweep group/dl relative inline-flex items-center gap-3 bg-white text-[#0F2545] hover:bg-[#FF6B35] hover:text-white px-5 py-3 md:px-6 md:py-3.5 rounded-2xl shadow-glow-accent transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Authentic Google Play triangle glyph */}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7 md:h-8 md:w-8 shrink-0 transition-transform duration-300 group-hover/dl:rotate-[8deg]"
                        aria-hidden
                      >
                        <defs>
                          <linearGradient id="gpA" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#00C7FB" />
                            <stop offset="1" stopColor="#1A73E8" />
                          </linearGradient>
                          <linearGradient id="gpB" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#FFCE00" />
                            <stop offset="1" stopColor="#FFA000" />
                          </linearGradient>
                          <linearGradient id="gpC" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#22C55E" />
                            <stop offset="1" stopColor="#0EA152" />
                          </linearGradient>
                          <linearGradient id="gpD" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#FF4757" />
                            <stop offset="1" stopColor="#E03131" />
                          </linearGradient>
                        </defs>
                        <path d="M3.5 2.3v19.4c0 .6.6 1 1.1.7l11-9.7c.4-.4.4-1 0-1.4l-11-9.7c-.5-.3-1.1.1-1.1.7Z" fill="url(#gpA)" />
                        <path d="M14.6 12 5.7 3.4l11.5 6.5c.6.4.6 1.2 0 1.6l-2.6 1.5Z" fill="url(#gpB)" />
                        <path d="M14.6 12l-2.6 1.5L17.2 16l2.6-1.5c.6-.4.6-1.2 0-1.6L17.2 11l-2.6 1Z" fill="url(#gpC)" opacity="0.95" />
                        <path d="M5.7 20.6 14.6 12l2.6 1.5-11.5 6.5c-.6.4-1.2-.1-1.2-.7v-.7l1.2-2Z" fill="url(#gpD)" />
                      </svg>
                      <div className="text-left">
                        <p className="text-[9px] md:text-[10px] font-bold opacity-70 leading-none tracking-[0.16em]">GET IT ON</p>
                        <p className="text-base md:text-[17px] font-bold leading-tight font-display tracking-tight mt-0.5">Google Play</p>
                      </div>
                    </a>
                    <button
                      type="button"
                      disabled
                      aria-label="App Store coming soon"
                      className="group/dl2 inline-flex items-center gap-3 bg-white/[0.06] ring-glass backdrop-blur text-white/70 px-5 py-3 md:px-6 md:py-3.5 rounded-2xl cursor-not-allowed transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8 fill-current shrink-0" aria-hidden>
                        <path d="M16.5 12.3c0-2.7 2.2-4 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.2 1-4 1-.9 0-2.2-1-3.6-1-1.8 0-3.5 1.1-4.4 2.7C.9 12.4 2.2 17.5 4 20.3c.9 1.4 2 2.9 3.4 2.9 1.4 0 1.9-.9 3.6-.9 1.7 0 2.1.9 3.6.9 1.5 0 2.4-1.4 3.3-2.8 1-1.6 1.4-3.1 1.5-3.2-.1-.1-2.9-1.1-2.9-4.4ZM13.7 4.5c.7-.9 1.2-2.1 1.1-3.4-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.5 3-1.4Z" />
                      </svg>
                      <div className="text-left">
                        <p className="text-[9px] md:text-[10px] font-bold opacity-70 leading-none tracking-[0.16em]">COMING SOON</p>
                        <p className="text-base md:text-[17px] font-bold leading-tight font-display tracking-tight mt-0.5">App Store</p>
                      </div>
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-bold tracking-wider text-white/80">
                        SOON
                      </span>
                    </button>
                  </div>

                  {/* Trust micro-strip — credibility for the ask */}
                  <div className="anim-fade-up anim-delay-4 mt-7 md:mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] md:text-xs text-white/65 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                      <span><b className="text-white">4.7</b> on Play Store</span>
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-[#FF8A5C]" />
                      <b className="text-white">50K+</b> downloads
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A5C]" />
                      Free, no ads
                    </span>
                  </div>
                </div>

                {/* ─── Right column — phone mockup with ambient detail ── */}
                <div className="relative hidden md:flex items-center justify-center min-h-[440px] lg:min-h-[520px]">
                  {/* Concentric orbital ring — adds depth around the phone */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-[360px] h-[360px] lg:w-[420px] lg:h-[420px] rounded-full border border-white/[0.08]" />
                    <div className="absolute w-[280px] h-[280px] lg:w-[330px] lg:h-[330px] rounded-full border border-white/[0.06]" />
                  </div>

                  {/* Soft accent halo behind phone */}
                  <div className="pointer-events-none absolute h-[300px] w-[260px] bg-[#FF6B35]/20 blur-[80px] rounded-full" />

                  {/* Floating badge — top-left of phone (rating credibility) */}
                  <div className="anim-fade-up anim-delay-2 absolute top-4 left-2 lg:left-4 z-30 flex items-center gap-2 bg-white/[0.08] ring-glass backdrop-blur-md rounded-2xl px-3 py-2 shadow-glow-navy">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FFB199] flex items-center justify-center shrink-0">
                      <Star className="h-4 w-4 fill-white text-white" />
                    </div>
                    <div className="leading-tight font-sans">
                      <p className="text-[10px] text-white/60 font-medium">Rated</p>
                      <p className="text-[13px] font-bold text-white tabular-nums">4.7 / 5</p>
                    </div>
                  </div>

                  {/* Floating badge — bottom-right (live order pulse) */}
                  <div className="anim-fade-up anim-delay-3 absolute bottom-6 right-0 lg:right-2 z-30 flex items-center gap-2 bg-white/[0.08] ring-glass backdrop-blur-md rounded-2xl px-3 py-2 shadow-glow-navy">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                    <div className="leading-tight font-sans">
                      <p className="text-[10px] text-white/60 font-medium">Mechanic on the way</p>
                      <p className="text-[12px] font-bold text-white">ETA 8 min</p>
                    </div>
                  </div>

                  {/* The phone */}
                  <div className="anim-fade-up anim-delay-1 relative z-10">
                    <div className="relative w-[240px] lg:w-[270px] aspect-[9/19] rounded-[40px] bg-gradient-to-b from-[#1A2C4D] to-[#0A1A33] border-[10px] border-[#0A1A33] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/15">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#0A1A33] rounded-b-2xl z-20" />
                      {/* Side speaker hint */}
                      <div className="absolute top-16 -left-[12px] w-1 h-10 bg-[#0A1A33] rounded-r-md" />
                      <div className="absolute top-32 -left-[12px] w-1 h-14 bg-[#0A1A33] rounded-r-md" />

                      {/* Screen */}
                      <div className="h-full w-full rounded-[28px] bg-gradient-to-b from-white via-[#F7F8FA] to-[#EFF4FB] overflow-hidden flex flex-col">
                        {/* Status bar */}
                        <div className="px-4 pt-2 flex items-center justify-between text-[8px] font-bold text-[#1A1D29]">
                          <span className="tabular-nums">9:41</span>
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1A1D29]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1A1D29]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1A1D29]/40" />
                          </div>
                        </div>

                        {/* App header */}
                        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
                          <div>
                            <p className="text-[8px] font-medium text-gray-500">Deliver to</p>
                            <p className="text-[11px] font-bold text-[#1A1D29] flex items-center gap-1">
                              Mumbai <span className="text-gray-400">· 400001</span>
                              <ChevronRight className="h-2.5 w-2.5 rotate-90 text-gray-400" />
                            </p>
                          </div>
                          <div className="relative">
                            <ShoppingCart className="h-4 w-4 text-[#1A1D29]" />
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FF6B35] text-white text-[7px] font-bold flex items-center justify-center">3</span>
                          </div>
                        </div>

                        {/* Search */}
                        <div className="px-3">
                          <div className="h-7 rounded-lg bg-white border border-gray-200 flex items-center gap-1.5 px-2 text-[8px] text-gray-400 shadow-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                            <span>Search parts, brands…</span>
                          </div>
                        </div>

                        {/* SPIN & EARN — animated, with coin glints */}
                        <div className="mx-3 mt-2 relative h-[58px] rounded-xl overflow-hidden bg-gradient-to-br from-[#1B3B6F] via-[#2A5298] to-[#FF6B35] shadow-md">
                          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0, transparent 30%)' }} />
                          <div className="relative h-full flex items-center justify-between px-3">
                            <div className="text-white">
                              <p className="text-[8px] font-bold tracking-wider opacity-80">DAILY REWARD</p>
                              <p className="text-[12px] font-extrabold tracking-tight font-display">Spin & Earn ₹100</p>
                            </div>
                            {/* Mini spin wheel */}
                            <div className="relative h-9 w-9 rounded-full bg-white/20 ring-1 ring-white/40 flex items-center justify-center backdrop-blur">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#FFCE00] via-[#FFA000] to-[#FF6B35] flex items-center justify-center text-[10px] font-extrabold text-white shadow-inner">
                                ₹
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick actions WITH labels */}
                        <div className="grid grid-cols-4 gap-1 mx-3 mt-2 bg-white rounded-xl px-1.5 py-2 border border-gray-100 shadow-sm">
                          {[
                            { bg: '#DBEAFE', color: '#1B3B6F', Icon: Wrench, label: 'Service' },
                            { bg: '#D1FAE5', color: '#059669', Icon: ShoppingBag, label: 'Shop' },
                            { bg: '#FED7AA', color: '#B45309', Icon: Bike, label: 'Bikes' },
                            { bg: '#FCE7F3', color: '#BE185D', Icon: Headphones, label: 'SOS' },
                          ].map((qa, i) => (
                            <div key={i} className="flex flex-col items-center gap-0.5">
                              <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: qa.bg }}>
                                <qa.Icon className="h-3.5 w-3.5" style={{ color: qa.color }} strokeWidth={2.4} />
                              </div>
                              <span className="text-[7px] font-semibold text-[#1A1D29]">{qa.label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Trending products — actual content, not blank cards */}
                        <p className="px-3 mt-2 text-[8px] font-bold text-[#1A1D29] flex items-center justify-between">
                          <span>Trending</span>
                          <span className="text-[7px] text-[#FF6B35] font-semibold">View all →</span>
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 mx-3 mt-1">
                          {[
                            { bg: 'from-[#DBEAFE] to-[#BFDBFE]', Icon: Settings, name: 'Brake Pad', price: '₹1,299' },
                            { bg: 'from-[#FFE4D6] to-[#FED7AA]', Icon: Zap, name: 'Battery', price: '₹4,499' },
                          ].map((p, i) => (
                            <div key={i} className="rounded-lg bg-white border border-gray-100 p-1.5 shadow-sm">
                              <div className={`h-9 rounded-md bg-gradient-to-br ${p.bg} flex items-center justify-center`}>
                                <p.Icon className="h-4 w-4 text-[#1B3B6F]" strokeWidth={2.2} />
                              </div>
                              <p className="text-[7px] font-bold text-[#1A1D29] mt-1 truncate">{p.name}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[7px] font-extrabold text-[#1B3B6F] tabular-nums">{p.price}</span>
                                <span className="flex items-center gap-0.5 text-[6px] text-gray-500 tabular-nums">
                                  <Star className="h-1.5 w-1.5 fill-[#FFA000] text-[#FFA000]" />
                                  4.8
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex-1" />

                        {/* Bottom nav with active pill */}
                        <div className="grid grid-cols-5 gap-1 mx-2 mb-2 px-2 py-1.5 rounded-xl bg-white border border-gray-100 shadow-sm">
                          {[HomeIcon, ShoppingBag, Package, Wrench, Users].map((NavIcon, i) => (
                            <div key={i} className="flex justify-center">
                              {i === 0 ? (
                                <div className="px-1.5 py-0.5 rounded-md bg-[#FF6B35]/10 flex items-center gap-0.5">
                                  <NavIcon className="h-3 w-3 text-[#FF6B35]" strokeWidth={2.4} />
                                  <span className="text-[6px] font-bold text-[#FF6B35]">Home</span>
                                </div>
                              ) : (
                                <NavIcon className="h-3 w-3 text-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>
                        {/* iPhone home indicator */}
                        <div className="flex justify-center pb-1">
                          <span className="h-0.5 w-10 rounded-full bg-[#1A1D29]/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 12 — Customer Testimonials (rotating carousel)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-6 md:mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-5 md:mb-8">
              <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-wider">Real Reviews</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight mt-1">
                What our customers say
              </h2>
              <div className="inline-flex items-center gap-1.5 mt-2.5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-[#F59E0B] text-[#F59E0B]" />)}
                </div>
                <span className="text-sm md:text-base font-bold text-[#1A1D29]">4.8</span>
                <span className="text-xs md:text-sm text-gray-500">· based on 10,000+ verified reviews</span>
              </div>
            </div>

            {/* Mobile: single rotating card */}
            <div className="md:hidden">
              <PremiumTestimonialCard t={TESTIMONIALS[activeTestimonial]} />
            </div>

            {/* Desktop: 3-card window with active emphasized */}
            <div className="hidden md:grid md:grid-cols-3 gap-4 lg:gap-5">
              {[0, 1, 2].map((offset) => {
                const idx = (activeTestimonial + offset) % TESTIMONIALS.length
                return <PremiumTestimonialCard key={idx} t={TESTIMONIALS[idx]} emphasised={offset === 1} />
              })}
            </div>

            {/* Carousel controls */}
            <div className="flex items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6">
              <button
                type="button"
                onClick={() => setActiveTestimonial(prev => prev === 0 ? TESTIMONIALS.length - 1 : prev - 1)}
                aria-label="Previous testimonial"
                className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-white border border-gray-200 hover:border-[#1B3B6F] hover:bg-[#1B3B6F] hover:text-white text-[#1B3B6F] flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTestimonial(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeTestimonial ? 'w-7 bg-[#FF6B35]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)}
                aria-label="Next testimonial"
                className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-white border border-gray-200 hover:border-[#1B3B6F] hover:bg-[#1B3B6F] hover:text-white text-[#1B3B6F] flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 13 — Become a Partner (B2B CTAs)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-6 md:mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-5 md:mb-8">
              <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-wider">Grow With Us</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight mt-1">
                Become a partner
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1.5 md:mt-2 max-w-xl mx-auto">
                Join thousands of mechanics, shops and delivery partners earning with Bharat Mechanics.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
              <PartnerCard
                icon={Wrench}
                title="Become a Mechanic"
                desc="Get verified service requests, fixed payouts, and grow your customer base."
                cta="Apply now"
                href="/become-mechanic"
                gradient="from-[#1B3B6F] via-[#1B3B6F] to-[#0F2545]"
                accent="#FF6B35"
              />
              <PartnerCard
                icon={Building2}
                title="List Your Shop"
                desc="Sell genuine parts to thousands of customers across India with zero setup fees."
                cta="Partner with us"
                href="/list-your-shop"
                gradient="from-[#FF6B35] via-[#F25C2A] to-[#E94E20]"
                accent="#FFFFFF"
              />
              <PartnerCard
                icon={Truck}
                title="Drive &amp; Deliver"
                desc="Earn flexible income delivering parts and helping customers in your city."
                cta="Start delivering"
                href="/login?role=delivery"
                gradient="from-[#059669] via-[#047857] to-[#065F46]"
                accent="#FFFFFF"
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 14 — FAQ (accordion)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-6 md:mt-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-5 md:mb-8">
              <p className="text-[10px] md:text-[11px] font-bold text-[#FF6B35] uppercase tracking-wider">Got Questions?</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#1A1D29] tracking-tight mt-1">
                Frequently asked questions
              </h2>
            </div>
            <div className="space-y-2.5 md:space-y-3">
              {HOME_FAQS.map((item, i) => (
                <FaqItem
                  key={i}
                  question={item.q}
                  answer={item.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 15 — SEO content (crawlable prose + internal links)
           ══════════════════════════════════════════════════════════════ */}
        <section className="px-3 md:px-6 lg:px-8 mt-6 md:mt-10">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl md:rounded-3xl ring-1 ring-black/[0.06] shadow-sm p-5 md:p-8 lg:p-10">
              <p className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-[#FF6B35] mb-2">
                About Bharat Mechanics
              </p>
              <h2 className="text-xl md:text-2xl lg:text-[28px] font-extrabold text-[#13203A] tracking-[-0.02em] leading-tight max-w-3xl">
                India&rsquo;s trusted platform for genuine auto parts &amp; doorstep vehicle service
              </h2>

              <div className="mt-3 md:mt-4 space-y-3 text-[14px] md:text-[15px] leading-relaxed text-[#475569] max-w-4xl">
                <p>
                  <strong className="text-[#13203A] font-semibold">Bharat Mechanics</strong> brings your car and bike service
                  home. Book a{' '}
                  <Link href="/service" className="text-[#1B3B6F] font-semibold hover:text-[#FF6B35] transition-colors">certified doorstep mechanic</Link>{' '}
                  for periodic servicing, breakdown and roadside assistance, AC repair, battery replacement, denting &amp;
                  painting and more &mdash; with transparent, issue-based pricing and a 30-day service warranty. You pay only
                  after the job is done, and you can track your mechanic live on the way to your location.
                </p>
                <p>
                  Need parts? Our{' '}
                  <Link href="/shop" className="text-[#1B3B6F] font-semibold hover:text-[#FF6B35] transition-colors">online auto parts store</Link>{' '}
                  stocks 100% genuine OEM spares &mdash; engine oil, brake pads, air &amp; oil filters, spark plugs, batteries,
                  tyres, wipers and accessories for every major car and two-wheeler brand, delivered fast across India with a
                  6-month warranty on eligible products.
                </p>
              </div>

              {/* Quick links — crawlable internal links to key sections */}
              <div className="mt-5 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { t: 'Buy genuine spare parts', d: 'Car & bike parts, delivered', href: '/shop' },
                  { t: 'Book a doorstep mechanic', d: 'Service at home or office', href: '/service' },
                  { t: 'Find certified mechanics', d: 'Verified, rated professionals', href: '/mechanics' },
                  { t: 'Mechanic training', d: 'Get certified & earn more', href: '/training' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group block rounded-xl ring-1 ring-black/[0.06] p-3.5 hover:ring-[#1B3B6F]/30 hover:shadow-sm transition-all"
                  >
                    <p className="text-[13.5px] font-bold text-[#13203A] group-hover:text-[#1B3B6F] transition-colors">{l.t}</p>
                    <p className="text-[12px] text-[#7B8AA3] mt-0.5 leading-snug">{l.d}</p>
                  </Link>
                ))}
              </div>

              <p className="mt-5 text-[12.5px] text-[#7B8AA3] leading-relaxed max-w-4xl">
                Serving Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Ahmedabad, Kolkata, Jaipur, Indore and 100+
                cities across India &mdash; doorstep car service, two-wheeler repair, genuine spare parts and verified
                mechanics, all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom spacer */}
        <div className="h-6 md:h-10 lg:h-12" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STICKY MOBILE BOOKING CTA (above the mobile bottom nav at h-16)
         ══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-2 pointer-events-none">
        <Link
          href="/service"
          className="pointer-events-auto flex items-center justify-between gap-2 bg-gradient-to-r from-[#FF6B35] via-[#F25C2A] to-[#E94E20] text-white px-4 py-3 rounded-2xl shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 backdrop-blur active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium opacity-85 leading-none">Book in 60 sec</p>
              <p className="text-[13px] font-extrabold tracking-tight leading-tight truncate">Service from ₹499</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white text-[#FF6B35] px-2.5 py-1 rounded-full font-bold text-[11px] shrink-0">
            Book now <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
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
  accent,
  accentSoft,
  title,
  sub,
  meta,
  cta,
  href,
  onClick,
  index = 0,
  urgent = false,
}: {
  icon: any
  accent: string         // Strong brand-accent color (icon, ring, CTA)
  accentSoft: string     // Soft tint for icon halo / corner glow / chips
  title: string
  sub: string
  meta?: string          // Tiny credibility tag near the CTA
  cta: string            // Verb-led label that makes the card unambiguously a button
  href?: string
  onClick?: () => void
  index?: number         // Stagger entrance animation
  urgent?: boolean       // Pulse dot for emergency-style cards
}) {
  // CSS vars feed inline style so Tailwind doesn't need to know each accent.
  const accentVars = {
    '--qa-accent': accent,
    '--qa-accent-soft': accentSoft,
    animationDelay: `${0.06 * index}s`,
  } as React.CSSProperties

  const content = (
    <div
      className="anim-fade-up group/qa relative h-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.07] shadow-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated-hover hover:ring-[var(--qa-accent)]/50 px-4 pt-4 pb-3 md:px-5 md:pt-5 md:pb-4 lg:px-6 lg:pt-6 lg:pb-5 text-left"
      style={accentVars}
    >
      {/* Atmospheric corner glow in the action's accent — adds depth */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover/qa:opacity-100"
        style={{ background: `radial-gradient(circle, var(--qa-accent-soft) 0%, transparent 65%)` }}
      />
      {/* Persistent left rail in accent color — quietly signals "tap me" at rest */}
      <div
        className="pointer-events-none absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full transition-all duration-300 group-hover/qa:top-3 group-hover/qa:bottom-3"
        style={{ backgroundColor: 'var(--qa-accent)' }}
      />
      {/* Top hairline accent appears on hover for an extra cue */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover/qa:scale-x-100"
        style={{ backgroundColor: 'var(--qa-accent)' }}
      />

      <div className="relative flex flex-col h-full">
        {/* Icon pill — elevated, ring + soft halo */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div
            className="relative h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-2xl flex items-center justify-center ring-1 transition-transform duration-300 group-hover/qa:scale-[1.06] group-hover/qa:rotate-[-3deg]"
            style={{
              background: `linear-gradient(140deg, var(--qa-accent-soft) 0%, #ffffff 100%)`,
              boxShadow: `0 6px 18px -8px ${accent}55, inset 0 1px 0 0 rgba(255,255,255,0.7)`,
              borderColor: `${accent}22`,
            }}
          >
            <Icon
              className="h-[22px] w-[22px] md:h-6 md:w-6 lg:h-7 lg:w-7"
              style={{ color: 'var(--qa-accent)' }}
              strokeWidth={2.2}
            />
          </div>

          {urgent && (
            <span className="relative flex h-2.5 w-2.5 mt-1" aria-label="Live 24/7">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: 'var(--qa-accent)' }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: 'var(--qa-accent)' }}
              />
            </span>
          )}
        </div>

        {/* Title — display font, tight tracking */}
        <p className="font-display text-[15px] md:text-base lg:text-lg font-bold tracking-[-0.02em] text-[#0F2545] leading-tight line-clamp-2">
          {title}
        </p>
        {/* Sub — body font, muted */}
        <p className="text-[11px] md:text-xs text-gray-500 mt-1 leading-snug line-clamp-1">
          {sub}
        </p>

        {/* Meta chip — credibility tag, sits just above the CTA */}
        {meta && (
          <span
            className="self-start mt-2.5 md:mt-3 inline-flex items-center gap-1 text-[10px] md:text-[11px] font-semibold tracking-tight px-2 py-0.5 rounded-full"
            style={{
              color: 'var(--qa-accent)',
              backgroundColor: 'var(--qa-accent-soft)',
            }}
          >
            {meta}
          </span>
        )}

        {/* Spacer to push the CTA to the bottom across all card heights */}
        <div className="flex-1 min-h-[10px] md:min-h-[14px]" />

        {/* CTA pill — verb-led, full width, unmistakably a button.
            The hover fill is a sibling overlay INSIDE the pill (absolute
            inset-0) so it stays clipped to the button shape. */}
        <span
          className="relative isolate overflow-hidden mt-3 md:mt-4 inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 md:py-2.5 rounded-xl text-[12px] md:text-[13px] font-bold tracking-tight transition-all duration-300 ring-1 ring-[var(--qa-accent)]/15 group-hover/qa:ring-[var(--qa-accent)]/40 group-hover/qa:shadow-md"
          style={{
            color: 'var(--qa-accent)',
            backgroundColor: 'var(--qa-accent-soft)',
          }}
        >
          {/* Solid accent fill — sweeps in on hover, stays clipped to pill */}
          <span
            aria-hidden
            className="absolute inset-0 -z-[1] opacity-0 group-hover/qa:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: 'var(--qa-accent)' }}
          />
          <span className="relative transition-colors duration-300 group-hover/qa:text-white">
            {cta}
          </span>
          <ArrowRight
            className="relative h-3.5 w-3.5 transition-all duration-300 group-hover/qa:translate-x-1 group-hover/qa:text-white"
          />
        </span>
      </div>
    </div>
  )

  // Shared wrapper class — focus-visible ring for keyboard a11y, cursor cue.
  const wrapperCls =
    'block w-full h-full rounded-2xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--qa-accent)] transition-shadow'

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={wrapperCls + ' text-left'}
        style={accentVars}
        aria-label={`${cta} — ${title}`}
      >
        {content}
      </button>
    )
  }
  return (
    <Link
      href={href || '#'}
      className={wrapperCls}
      style={accentVars}
      aria-label={`${cta} — ${title}`}
    >
      {content}
    </Link>
  )
}

function CategoryCard({ cat, variant }: { cat: any; idx?: number; variant: 'mobile' | 'desktop' }) {
  const img = cat.icon?.startsWith?.('http') ? cat.icon : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))

  if (variant === 'mobile') {
    return (
      <Link
        href={`/shop?category=${cat._id || cat.id}`}
        className="shrink-0 w-[100px] bg-white rounded-xl p-2 pt-2.5 flex flex-col items-center ring-1 ring-black/[0.05] hover:ring-[#1B3B6F]/30 hover:shadow-sm transition-all duration-200 group/cc"
      >
        <div className="h-[72px] w-[72px] flex items-center justify-center mb-1.5 transition-transform duration-300 group-hover/cc:scale-[1.05]">
          {img ? (
            <img src={img} alt={cat.name} className="h-full w-full object-contain" />
          ) : (
            <Package className="h-9 w-9 text-[#1B3B6F]" />
          )}
        </div>
        <p className="font-display text-[11.5px] font-bold tracking-[-0.012em] text-[#0F2545] text-center line-clamp-2 leading-[13px]">{cat.name}</p>
      </Link>
    )
  }

  return (
    <Link
      href={`/shop?category=${cat._id || cat.id}`}
      className="relative bg-white rounded-2xl p-3 lg:p-4 flex flex-col items-center ring-1 ring-black/[0.05] hover:ring-[#1B3B6F]/35 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300 group/cc"
    >
      <span className="absolute top-2 right-2 inline-flex items-center justify-center h-5 w-5 rounded-full text-[#1B3B6F] opacity-0 -translate-x-1 group-hover/cc:opacity-100 group-hover/cc:translate-x-0 group-hover/cc:bg-[#1B3B6F] group-hover/cc:text-white transition-all duration-300">
        <ArrowRight className="h-3 w-3" />
      </span>

      <div className="h-[88px] w-[88px] lg:h-[100px] lg:w-[100px] flex items-center justify-center mb-2 transition-transform duration-300 group-hover/cc:scale-[1.06]">
        {img ? (
          <img src={img} alt={cat.name} className="h-full w-full object-contain" />
        ) : (
          <Package className="h-10 w-10 lg:h-12 lg:w-12 text-[#1B3B6F]" />
        )}
      </div>
      <p className="font-display text-[12.5px] lg:text-[13.5px] font-bold tracking-[-0.012em] text-[#0F2545] text-center line-clamp-2 leading-tight">
        {cat.name}
      </p>
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

/* ═════════════════════════════════════════════════════════════════════
   New section sub-components (FeatureCard, AppFeatureItem, TestimonialCard,
   PartnerCard, FaqItem) — added in the home-page enhancement pass.
   ═════════════════════════════════════════════════════════════════════ */

function FeatureCard({ icon: Icon, title, desc, color, bg }: { icon: any; title: string; desc: string; color: string; bg: string }) {
  return (
    <div
      className="group/fc relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:ring-[var(--fc-color)]/30 hover:shadow-elevated"
      style={{ ['--fc-color' as any]: color }}
    >
      {/* Refined icon stamp — accent gradient, inset highlight, accent ring */}
      <div
        className="relative h-12 w-12 md:h-[52px] md:w-[52px] rounded-2xl flex items-center justify-center mb-4 md:mb-5 transition-transform duration-300 group-hover/fc:scale-[1.06] group-hover/fc:rotate-[-3deg]"
        style={{
          background: `linear-gradient(140deg, ${bg} 0%, #ffffff 100%)`,
          boxShadow: `0 6px 18px -8px ${color}55, inset 0 1px 0 0 rgba(255,255,255,0.7)`,
        }}
      >
        <span
          className="absolute inset-0 rounded-2xl ring-1"
          style={{ borderColor: `${color}25` }}
          aria-hidden
        />
        <Icon
          className="relative h-[22px] w-[22px] md:h-6 md:w-6"
          style={{ color }}
          strokeWidth={2.2}
        />
      </div>

      {/* Title — display font, tighter tracking */}
      <h3 className="font-display text-[16px] md:text-[18px] font-bold text-[#0F2545] tracking-[-0.022em] leading-tight">
        {title}
      </h3>
      {/* Animated accent underline reveals on hover */}
      <span
        className="block h-[2px] mt-1.5 origin-left scale-x-0 group-hover/fc:scale-x-100 transition-transform duration-500 ease-out"
        style={{ backgroundColor: color, width: '28px' }}
      />

      {/* Description — better leading + balance */}
      <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed mt-3 text-pretty">
        {desc}
      </p>
    </div>
  )
}

function AppFeatureItem({ text }: { text: string }) {
  return (
    <li className="group/feat flex items-center gap-2 text-white/85 text-xs md:text-[13px] font-medium transition-colors hover:text-white">
      <span className="inline-flex h-4 w-4 md:h-[18px] md:w-[18px] shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/15 ring-1 ring-[#FF6B35]/40 transition-all duration-300 group-hover/feat:bg-[#FF6B35] group-hover/feat:scale-110">
        <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-[#FF6B35] transition-colors duration-300 group-hover/feat:text-white" strokeWidth={3} />
      </span>
      {text}
    </li>
  )
}

function TestimonialCard({ name, location, rating, quote, initials, bgColor }: { name: string; location: string; rating: number; quote: string; initials: string; bgColor: string }) {
  return (
    <div className="relative bg-white rounded-2xl p-4 md:p-5 border border-[#EEF0F3] hover:shadow-md transition-all duration-200">
      <Quote className="absolute top-3 right-3 h-6 w-6 text-[#FF6B35]/15" />
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1A1D29] truncate">{name}</p>
          <p className="text-[11px] text-gray-500 truncate">{location}</p>
        </div>
      </div>
      <div className="flex mb-2">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
        ))}
      </div>
      <p className="text-[12.5px] md:text-[13.5px] text-gray-600 leading-relaxed">&ldquo;{quote}&rdquo;</p>
    </div>
  )
}

function PartnerCard({ icon: Icon, title, desc, cta, href, gradient, accent }: { icon: any; title: string; desc: string; cta: string; href: string; gradient: string; accent: string }) {
  return (
    <Link
      href={href}
      className={`group/pn relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 md:p-6 lg:p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover/pn:bg-white/20 transition-colors" />
      <div className="relative">
        <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center mb-3.5 md:mb-4">
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
        <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight">{title}</h3>
        <p className="text-[12.5px] md:text-[13.5px] text-white/80 leading-snug mt-1.5 max-w-xs">{desc}</p>
        <div
          className="inline-flex items-center gap-1 mt-4 md:mt-5 text-xs md:text-sm font-bold group-hover/pn:gap-2 transition-all"
          style={{ color: accent }}
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </div>
    </Link>
  )
}

function Pillar({
  icon: Icon,
  title,
  subtitle,
  color,
  bg,
}: {
  icon: any
  title: string
  subtitle: string
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-2.5 md:gap-3 px-1 md:px-4 py-1 md:py-1.5">
      <div
        className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" style={{ color }} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-[13px] md:text-[14px] font-bold tracking-[-0.018em] text-[#0F2545] leading-tight truncate">
          {title}
        </p>
        <p className="text-[10.5px] md:text-[11.5px] text-gray-500 truncate mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function PricingCell({ service, price, savings, icon: Icon, idx }: { service: string; price: number; savings: number; icon: any; idx: number }) {
  // Soft pastel gradients cycle so cells feel distinct without being noisy
  const gradients = [
    'from-[#DBEAFE] to-[#BFDBFE]',
    'from-[#FFE4D6] to-[#FED7AA]',
    'from-[#D1FAE5] to-[#A7F3D0]',
    'from-[#FCE7F3] to-[#FBCFE8]',
    'from-[#E0E7FF] to-[#C7D2FE]',
    'from-[#FEF3C7] to-[#FDE68A]',
  ]
  const gradient = gradients[idx % gradients.length]
  return (
    <Link
      href="/service"
      className="group/pc flex flex-col gap-3 px-5 py-5 lg:px-6 lg:py-6 hover:bg-gray-50 transition-colors border-r border-b border-gray-100 last:border-r-0"
    >
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 group-hover/pc:scale-105 transition-transform`}>
          <Icon className="h-5 w-5 lg:h-[22px] lg:w-[22px] text-[#1B3B6F]" />
        </div>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
          Save {savings}%
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-[#1A1D29] tracking-tight">{service}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Starts from <span className="text-base font-extrabold text-[#1B3B6F]">₹{price.toLocaleString('en-IN')}</span>
        </p>
      </div>
    </Link>
  )
}

function PremiumTestimonialCard({ t, emphasised = false }: { t: typeof TESTIMONIALS[number]; emphasised?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 md:p-6 transition-all duration-300 ${
      emphasised
        ? 'bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] shadow-lg shadow-[#0F2545]/20 ring-1 ring-white/10'
        : 'bg-white border border-[#EEF0F3] hover:shadow-md'
    }`}>
      {emphasised && (
        <>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-2xl pointer-events-none" />
        </>
      )}
      <Quote className={`absolute top-3 right-3 h-7 w-7 ${emphasised ? 'text-[#FF6B35]/30' : 'text-[#FF6B35]/15'}`} />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3.5">
          <div
            className="h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 ring-2 ring-white/20"
            style={{ backgroundColor: t.bg }}
          >
            {t.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className={`text-sm font-bold truncate ${emphasised ? 'text-white' : 'text-[#1A1D29]'}`}>{t.name}</p>
              {t.verified && (
                <BadgeCheck className={`h-3.5 w-3.5 ${emphasised ? 'text-[#FF6B35]' : 'text-[#1B3B6F]'} fill-current`} />
              )}
            </div>
            <p className={`text-[11px] truncate ${emphasised ? 'text-white/70' : 'text-gray-500'}`}>
              {t.profession} · {t.city}
            </p>
          </div>
        </div>

        <div className="flex mb-2">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
          ))}
        </div>

        <p className={`text-[13px] md:text-[13.5px] leading-relaxed ${emphasised ? 'text-white/90' : 'text-gray-600'}`}>
          &ldquo;{t.quote}&rdquo;
        </p>

        {emphasised && (
          <div className="mt-4 inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-2.5 py-1 rounded-full ring-1 ring-white/20">
            <BadgeCheck className="h-3 w-3 text-[#FF6B35]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verified Customer</span>
          </div>
        )}
      </div>
    </div>
  )
}

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`bg-white rounded-xl border transition-colors ${isOpen ? 'border-[#1B3B6F]/30 shadow-sm' : 'border-[#EEF0F3]'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 md:px-5 md:py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm md:text-base font-bold text-[#1A1D29] tracking-tight">{question}</span>
        <span
          className={`h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isOpen ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isOpen ? <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />}
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 md:px-5 md:pb-5 -mt-1">
          <p className="text-[12.5px] md:text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
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
