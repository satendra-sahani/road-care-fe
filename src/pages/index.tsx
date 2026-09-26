'use client'
// Home page — restyled to the Claude Design handoff ("Bharat Mechanics Home").
// Visual layer only: every data source, handler and SEO block from the
// previous version is preserved (admin banners, catalog categories/products,
// cart add w/ login redirect, search + filter sheet, BM Care cards, promo
// strip, testimonials, FAQ schema, sticky mobile CTA, admin home popup).
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { SEOHead } from '@/components/SEOHead'
import { loadUserRequest } from '@/store/slices/customerAuthSlice'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import dynamic from 'next/dynamic'

// Admin promo popup — its own chunk, loaded client-side after first paint.
const HomeOfferPopup = dynamic(() => import('@/components/home/HomeOfferPopup').then((m) => m.HomeOfferPopup), { ssr: false })
import { useBmCareSub, planById } from '@/lib/bmCare'
import { ScaledStage } from '@/components/home/ScaledStage'
import { DImg, ikUrl } from '@/components/ui/DImg'
import Link from 'next/link'
import Head from 'next/head'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import {
  IcBuild, IcShoppingBag, IcTwoWheeler, IcLocalShipping, IcCheckCircle, IcVerifiedUser,
  IcHome, IcCreditCard, IcCalendarToday, IcMenuBook, IcGroups, IcStar, IcStars,
  IcMilitaryTech, IcLocationOn, IcSpeed, IcChat, IcEmail, IcCall, IcStore,
  IcDeliveryDining, IcArrowForward, IcChevronLeft, IcChevronRight, IcKeyboardArrowDown,
  IcClose, IcShoppingCart, IcFavoriteBorder, IcSearch, IcQrCodeScanner, IcVerified,
  IcLock, IcTrackChanges, IcLocalOffer, IcGpsFixed, IcBatteryChargingFull, IcSettings,
  IcHandyman, IcLocalGasStation, IcHeadsetMic, IcSchool, IcPersonPin, IcSchedule,
  IcCardMembership, IcFilterAlt, IcDirectionsCar, IcShield,
} from '@/components/icons/BmIcons'

/* ─── Design tokens (from the handoff) ─── */
const NAVY = '#0E2B4C'
const BLUE = '#1A6FD4'
const ORANGE = '#F4601F'
const GREEN = '#17A05A'
const RED = '#E0384E'
const PURPLE = '#6D4AE0'

/* ─── Filter brands list (same as Android) ─── */
const filterBrands = ['Bosch', 'Denso', 'NGK', 'Mann', 'Mobil', 'Shell', 'Castrol', 'Monroe']

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

/* ─── Popular services (design cards: icon tone + product render) ─── */
const POPULAR_SERVICES = [
  { service: 'Periodic Service', price: 2499, savings: 35, Icon: IcBuild, tone: 'blue', img: '/design/hc-car.webp', alt: 'Periodic car service' },
  { service: 'AC Service & Gas Refill', price: 1799, savings: 30, Icon: IcSettings, tone: 'orange', img: '/design/pt-ac.webp', alt: 'Car AC service' },
  { service: 'Brake Service', price: 999, savings: 25, Icon: IcTrackChanges, tone: 'blue', img: '/design/pt-brakedisc2.webp', alt: 'Brake service' },
  { service: 'Battery Replacement', price: 4499, savings: 20, Icon: IcBatteryChargingFull, tone: 'purple', img: '/design/pt-battery2.webp', alt: 'Battery replacement' },
  { service: 'Oil Change', price: 599, savings: 40, Icon: IcLocalGasStation, tone: 'blue', img: '/design/pt-engineoil.webp', alt: 'Engine oil change' },
  { service: 'Denting & Painting', price: 1499, savings: 30, Icon: IcHandyman, tone: 'orange', img: '/design/pt-bumper.webp', alt: 'Denting and painting' },
  { service: 'Roadside Assistance', price: 499, savings: 50, Icon: IcLocalShipping, tone: 'blue', img: '/design/hc-tow.webp', alt: 'Roadside assistance' },
  { service: 'Bike Service @ Home', price: 799, savings: 40, Icon: IcTwoWheeler, tone: 'orange', img: '/design/hc-bike.webp', alt: 'Bike service at home' },
] as const

/* ─── Category artwork (design) — static fallback tiles + name-matched art for catalog categories without images ─── */
const CATEGORY_ART: [RegExp, string][] = [
  [/batter/i, '/design/pt-battery.webp'],
  [/body|mirror/i, '/design/pt-mirror.webp'],
  [/brake ?pad/i, '/design/pt-brakepad.webp'],
  [/brake/i, '/design/pt-brakedisc.webp'],
  [/car ?care|wash|polish/i, '/design/pt-carcare.webp'],
  [/electronic|audio|stereo/i, '/design/pt-headunit.webp'],
  [/perfume|fragr/i, '/design/cat-7.png'],
  [/engine/i, '/design/pt-engine.webp'],
  [/exterior|roof/i, '/design/pt-roofbox.webp'],
  [/floor|mat/i, '/design/pt-floormat.webp'],
  [/interior|seat/i, '/design/pt-seat.webp'],
  [/\bac\b|air ?con/i, '/design/pt-ac.webp'],
  [/air ?filter|filter/i, '/design/pt-airfilters.webp'],
  [/bearing/i, '/design/pt-bearing.webp'],
  [/belt/i, '/design/pt-belt.webp'],
  [/bulb|light|lamp/i, '/design/pt-headlight2.webp'],
  [/oil|lubric/i, '/design/pt-engineoil.webp'],
  [/spark|plug/i, '/design/pt-sparkplug.webp'],
  [/wiper/i, '/design/pt-wiper.webp'],
  [/chain|sprocket/i, '/design/pt-bikechain.webp'],
  [/dash ?cam|camera/i, '/design/pt-dashcam.webp'],
  [/steering|auto ?acc/i, '/design/pt-steering.webp'],
  [/accessor/i, '/design/pt-dashcam.webp'],
]
const categoryArt = (name = '') => CATEGORY_ART.find(([re]) => re.test(name))?.[1] || ''
const DESIGN_CATEGORIES = [
  'Batteries', 'Body Parts', 'Brake Pads', 'Brake System', 'Car Care', 'Car Electronics',
  'Car Perfumes', 'Engine Parts', 'Exterior Accessories', 'Floor Mats', 'Interior Accessories',
].map((name, i) => ({ _id: `design-${i + 1}`, name, icon: categoryArt(name), static: true }))

/* ─── Premium testimonials with profession + verified tick ─── */
const TESTIMONIALS = [
  { name: 'Rahul Sharma', profession: 'Software Engineer', city: 'Bengaluru', rating: 5, initials: 'RS', bg: BLUE, verified: true,
    quote: 'Booked a service for my Honda City via the app. The mechanic arrived on time, fixed the AC issue at my doorstep, and pricing was exactly as quoted. Highly recommended!' },
  { name: 'Priya Patel', profession: 'Architect', city: 'Ahmedabad', rating: 5, initials: 'PP', bg: '#C9283F', verified: true,
    quote: 'Ordered brake pads for my Activa. Genuine Bosch parts arrived next day, packed properly. Great service and support!' },
  { name: 'Karthik Reddy', profession: 'Account Manager', city: 'Hyderabad', rating: 5, initials: 'KR', bg: '#13864D', verified: true,
    quote: 'My car broke down on the highway at 11pm. Used the emergency feature, a verified mechanic reached me in 30 minutes. Saved my night, literally.' },
  { name: 'Anjali Mehra', profession: 'Lawyer', city: 'Mumbai', rating: 5, initials: 'AM', bg: PURPLE, verified: true,
    quote: 'The transparent pricing is what kept me. I compared the same brake-pad replacement at three garages and Bharat Mechanics was 18% cheaper with genuine parts.' },
  { name: 'Suresh Iyer', profession: 'Teacher', city: 'Chennai', rating: 5, initials: 'SI', bg: '#C0392B', verified: true,
    quote: 'I refer everyone in my colony now. The Refer & Earn rewards have paid for two of my services already. Plus the live tracking is just like Uber.' },
]

/* ─── Tone palette for icon pills / chips ─── */
const TONES: Record<string, { fg: string; ink: string; bg: string; soft: string; border: string }> = {
  blue:   { fg: BLUE, ink: '#1864C8',   bg: '#E4EEFB', soft: 'linear-gradient(180deg,#F2F7FF,#EAF2FD)', border: '#E3EDF9' },
  green:  { fg: GREEN, ink: '#13864D',  bg: '#D6F0E1', soft: 'linear-gradient(180deg,#F1FBF5,#E8F7EE)', border: '#DDF0E5' },
  orange: { fg: ORANGE, ink: '#C94309', bg: '#FDE3CE', soft: 'linear-gradient(180deg,#FFF7F0,#FFF0E3)', border: '#FBE4D2' },
  red:    { fg: RED, ink: '#C9283F',    bg: '#FBD8DD', soft: 'linear-gradient(180deg,#FFF2F4,#FDE9EC)', border: '#F9DDE2' },
  purple: { fg: PURPLE, ink: '#6D4AE0', bg: '#EDE9FE', soft: 'linear-gradient(180deg,#F6F4FF,#EFEBFF)', border: '#E4DEFB' },
  amber:  { fg: '#F0A726', ink: '#9A4C08', bg: '#FBEBC8', soft: 'linear-gradient(180deg,#FFFBF0,#FFF5DE)', border: '#F7E7C3' },
}

const inr = (n: number) => n.toLocaleString('en-IN')

export default function HomePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)

  /* BM Care subscription — drives the first "More from Bharat Mechanics" card */
  const bmSub = useBmCareSub()
  const bmActive = !!bmSub?.active
  const bmPlan = bmActive ? planById(bmSub!.plan) : null

  /* "More from Bharat Mechanics" — compact feature cards (3-up on desktop) */
  const FEATURE_CARDS = [
    {
      key: 'care', href: '/subscription',
      title: bmActive ? bmPlan!.name : 'BM Care',
      sub: bmActive ? 'All benefits active' : 'Free services, priority & roadside',
      cta: bmActive ? 'Manage' : 'From ₹99',
      Icon: IcCardMembership, tone: 'blue',
      chips: [
        { Icon: IcSpeed, label: 'Priority Service' },
        { Icon: IcLocalShipping, label: 'Roadside Help' },
        { Icon: IcLocalOffer, label: 'Best Value' },
      ],
    },
    {
      key: 'lens', href: '/shop',
      title: 'BM Lens', sub: "Snap a part — we'll find it", cta: 'Try Lens',
      Icon: IcQrCodeScanner, tone: 'purple',
      chips: [
        { Icon: IcQrCodeScanner, label: 'Snap Photo' },
        { Icon: IcSearch, label: 'Find Match' },
        { Icon: IcVerified, label: 'Right Part' },
      ],
    },
    {
      key: 'tracker', href: '/tracker',
      title: 'Live Tracker', sub: 'Live GPS + remote engine cut-off', cta: 'Explore',
      Icon: IcGpsFixed, tone: 'green',
      chips: [
        { Icon: IcLocationOn, label: 'Live Location' },
        { Icon: IcLock, label: 'Anti-Theft' },
        { Icon: IcTrackChanges, label: 'Instant Alerts' },
      ],
    },
  ]

  /* ─── Data state ─── */
  const [mainCategories, setMainCategories] = useState<any[]>([
    { _id: 'auto-accessories', name: 'Auto Accessories', icon: 'construct-outline', description: 'Car parts & accessories' },
    { _id: 'two-wheelers', name: 'Two Wheelers', icon: 'bicycle-outline', description: 'Two-wheeler parts & services' },
  ])
  const [categories, setCategories] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  /* ─── Promo strip, testimonial carousel ─── */
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

  /* ─── Auto-rotate testimonials (5s per card) ─── */
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
        const [catRes, parentRes, prodRes] = await Promise.all([
          catalogAPI.getCategories().catch(() => null),
          catalogAPI.getParentCategories().catch(() => null),
          catalogAPI.getProducts({ featured: true, limit: 10 }).catch(() => null),
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
      } catch (err) {
        console.error('Failed to load home data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
  const getReviewCount = (p: any) => p.reviewsSummary?.totalReviews || p.reviewCount || p.numReviews || 0

  const subCategories = categories.filter((c: any) => c.parentCategory)
  const catalogCategories = (subCategories.length > 0 ? subCategories : categories).slice(0, 12)
  const categoryTiles = catalogCategories.length > 0 ? catalogCategories : (!loading ? DESIGN_CATEGORIES : [])

  return (
    <UserLayout mobileTopBar={false}>
      {/* Admin-managed offer popup (same appConfig.homePopup the app shows) */}
      <HomeOfferPopup />
      <SEOHead
        title="Auto Parts & Doorstep Mechanic Service"
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

      <div className="min-h-screen bg-[#F5F8FC] pb-24 text-[14px] leading-[1.5] text-[#0E2B4C] [overflow-x:clip] md:pb-0">

        {/* Primary page heading — always rendered for SEO + accessibility. */}
        <h1 className="sr-only">
          Bharat Mechanics &mdash; genuine auto parts &amp; doorstep car and bike mechanic service across India
        </h1>

        {/* ═══ Mobile offer bar (design: sits under the mobile header) ═══ */}
        {showPromo && (
          <div className="flex items-center gap-2 bg-[linear-gradient(90deg,#0B2446_0%,#12345F_100%)] px-3 py-2 text-white md:hidden">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[rgba(244,96,31,0.16)] text-[#FF7A2F]"><IcLocalOffer size={17} /></span>
            <div className="min-w-0 flex-1 leading-[1.3]">
              <div className="truncate text-[11.5px] font-semibold">Up to ₹500 off your first service</div>
              <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[10.5px] text-[#C9D7E8]">
                <span className="shrink-0 rounded border border-dashed border-[#FF7A2F] px-[5px] font-bold tracking-[0.3px] text-[#FF7A2F]">BHARAT50</span>
                <span className="truncate">Free doorstep pickup</span>
              </div>
            </div>
            <Link href="/service" className="flex min-h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[18px] bg-[#C94309] px-2.5 text-[12px] font-bold text-white shadow-[0_4px_10px_rgba(244,96,31,0.3)]">
              Claim Now <IcArrowForward size={12} />
            </Link>
            <button type="button" onClick={dismissPromo} aria-label="Dismiss offer" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/15"><IcClose size={13} /></button>
          </div>
        )}

        {/* ═══ Hero — design's composed artwork (mobile + desktop) + stats strip ═══ */}
        <div className="border-b border-[#E6ECF3] bg-[linear-gradient(120deg,#FCFDFE_0%,#F4F7FC_40%,#EDF2F9_100%)]">
          <div className="mx-auto max-w-[1180px] px-0 pb-[clamp(18px,2.4vw,26px)] pt-0 md:px-[clamp(14px,4vw,28px)] md:pt-[clamp(14px,2vw,22px)]">

            {/* Mobile hero */}
            <div className="relative overflow-hidden rounded-b-[22px] bg-[radial-gradient(120%_60%_at_0%_100%,rgba(244,96,31,0.16)_0%,rgba(244,96,31,0)_55%),linear-gradient(160deg,#FFFFFF_0%,#EEF4FC_60%,#E4EDF9_100%)] px-3.5 pb-[26px] pt-3.5 md:hidden">
              <DImg src="/design/m-hero-woman-v2.webp" alt="Bharat Mechanics technician" loading="eager" fetchPriority="high" sizes="(min-width: 768px) 32px, 57vw" className="absolute right-0 top-0 h-[calc(100%-44px)] w-[57%] object-cover object-left-top" />
              <div className="relative z-[2] w-[58%] min-w-0">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[14px] bg-[#FFE9DC] px-2.5 py-[5px] text-[9.5px] font-bold tracking-[0.4px] text-[#BE3F09]"><IcDirectionsCar size={14} className="text-[#F4601F]" />CAR &amp; BIKE CARE, NOW EASIER</span>
                <div className="mt-3 text-[clamp(26px,8vw,32px)] font-extrabold leading-[1.05] tracking-[-0.8px]">Your Vehicle,<br />Our<br /><span className="relative text-[#F4601F]">Responsibility<svg viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-[9px] w-full"><path d="M2 9 C60 1 140 1 198 7" fill="none" stroke="#F4601F" strokeWidth="3" strokeLinecap="round" /></svg></span></div>
                <p className="mt-4 text-[12.5px] leading-[1.4] text-[#1E3553]">Expert service. Genuine parts.<br />Verified mechanics.<br />At your doorstep.</p>
                <div className="mt-3 grid grid-cols-[repeat(4,auto)] justify-start gap-2">
                  {[[IcShield, 'Safe &', 'Reliable'], [IcBuild, 'Expert', 'Service'], [IcSettings, 'Genuine', 'Parts'], [IcHome, 'Doorstep', 'Convenience']].map(([I, a, b]: any) => (
                    <div key={a} className="grid justify-items-center gap-[3px] text-center"><span className="flex h-6 items-center text-[#0E2B4C]"><I size={20} /></span><span className="text-[9.5px] leading-[1.2] text-[#41586F]">{a}<br />{b}</span></div>
                  ))}
                </div>
              </div>
              <div className="relative z-[2] mt-4 grid grid-cols-2 gap-2.5">
                <Link href="/service" className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#C94309] text-[13.5px] font-semibold text-white shadow-[0_8px_18px_rgba(244,96,31,0.28)]"><IcBuild size={16} /> Book a Service <IcArrowForward size={13} /></Link>
                <Link href="/shop" className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-white text-[13.5px] font-semibold text-[#0E2B4C] shadow-[0_6px_16px_rgba(12,42,77,0.10)]"><IcShoppingCart size={17} /> Shop Parts <IcArrowForward size={13} /></Link>
              </div>
              <div className="absolute bottom-[9px] left-1/2 z-[2] flex -translate-x-1/2 gap-1">
                <span className="h-1 w-3.5 rounded-sm bg-[#F4601F]" /><span className="h-1 w-1 rounded-sm bg-[#F8B08E]" /><span className="h-1 w-1 rounded-sm bg-[#F8B08E]" /><span className="h-1 w-1 rounded-sm bg-[#F8B08E]" />
              </div>
            </div>

            {/* Desktop hero — 1600×640 canvas (1000-wide under 1100px), scaled to the container */}
            <div className="hidden md:block">
              <ScaledStage className="aspect-[1600/640] max-[1100px]:aspect-[1000/640]" stageClassName="h-[640px] w-[1600px] max-[1100px]:w-[1000px]" stageStyle={{ borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(60% 70% at 58% 40%,#FFFFFF 0%,rgba(255,255,255,0) 70%),linear-gradient(115deg,#F7FAFE 0%,#EEF3FA 55%,#E7EEF8 100%)', boxShadow: '0 14px 34px rgba(12,42,77,0.09)' }}>
                <DImg src="/design/hh-city.webp" alt="" sizes="(max-width: 1100px) 96px, 600px" className="absolute bottom-0 left-[30%] z-[1] h-auto w-[52%] opacity-90 max-[1100px]:hidden" />
                <DImg src="/design/hh-woman2.webp" alt="Bharat Mechanics technician holding a wrench" loading="eager" fetchPriority="high" sizes="(max-width: 767px) 32px, 400px" className="absolute bottom-0 left-[47%] z-[2] h-[94%] w-auto max-w-[29%] object-contain object-bottom max-[1100px]:left-auto max-[1100px]:right-0 max-[1100px]:max-w-[40%]" />
                <DImg src="/design/hh-script2.webp" alt="Keep Your Car In Top Shape" sizes="(max-width: 767px) 96px, 170px" className="absolute left-[41.5%] top-[6%] z-[3] h-auto w-[14.5%] max-[1100px]:left-auto max-[1100px]:right-[30%] max-[1100px]:top-[4%] max-[1100px]:w-[17%]" />
                <DImg src="/design/hh-panel2.webp" alt="Serve Drive Repeat — Trusted Mechanics, Genuine Parts, Doorstep Service, Fair Pricing" sizes="(max-width: 1100px) 96px, 290px" className="absolute right-[1.6%] top-1/2 z-[3] h-[92%] w-auto max-w-[25%] -translate-y-1/2 object-contain drop-shadow-[0_16px_30px_rgba(12,42,77,0.22)] max-[1100px]:hidden" />
                <div className="relative z-[4] box-border w-[43%] pb-8 pl-[42px] pt-[38px] max-[1100px]:w-[60%]">
                  <div className="relative inline-flex">
                    <span className="inline-flex items-center gap-3 whitespace-nowrap rounded-[26px] bg-[#FFE8DA] py-[9px] pl-4 pr-[22px] text-[15px] font-bold tracking-[1.2px] text-[#BE3F09]"><IcDirectionsCar size={26} />CAR &amp; BIKE CARE, NOW EASIER</span>
                    <DImg src="/design/hh-bang.webp" alt="" sizes="28px" className="absolute -right-[34px] -top-3.5 h-auto w-7" />
                  </div>
                  <div className="mt-[18px] text-[56px] font-extrabold leading-[1.08] tracking-[-1.8px] text-[#0B1E3F]">Your Vehicle<br />Our <span className="relative inline-block text-[#F4601F]">Responsibility<svg viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-2 left-[14%] h-[10px] w-[86%]"><path d="M2 10 C90 4 200 3 298 8" fill="none" stroke="#F4601F" strokeWidth="4.5" strokeLinecap="round" /></svg></span></div>
                  <div className="mt-6 rounded-[14px] border border-[#DCE6F3] bg-[#F1F6FD] px-[18px] py-3 text-[18.5px] font-medium leading-[1.4]">Expert service. Genuine parts. Verified mechanics.<br />At your doorstep.</div>
                  <div className="mt-5 flex gap-[30px]">
                    {[[IcShield, 'Safe &', 'Reliable'], [IcSettings, 'Expert', 'Service'], [IcBuild, 'Genuine', 'Parts'], [IcHome, 'Doorstep', 'Convenience']].map(([I, a, b]: any) => (
                      <div key={a} className="grid justify-items-center gap-1.5 text-center"><span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white text-[#0E2B4C] shadow-[0_4px_14px_rgba(12,42,77,0.10)]"><I size={30} /></span><span className="text-[13px] font-semibold leading-[1.2]">{a}<br />{b}</span></div>
                    ))}
                  </div>
                  <div className="mt-[22px] flex flex-wrap gap-3.5">
                    <Link href="/service" className="inline-flex min-h-[54px] items-center gap-3 whitespace-nowrap rounded-xl bg-[linear-gradient(180deg,#FF6A26_0%,#F0520F_100%)] px-[26px] text-[16.5px] font-bold text-white shadow-[0_10px_22px_rgba(240,82,15,0.30)] transition-transform hover:-translate-y-px hover:text-white"><IcBuild size={20} /> Book a Service <IcArrowForward size={18} /></Link>
                    <Link href="/shop" className="inline-flex min-h-[54px] items-center gap-3 whitespace-nowrap rounded-xl border border-[#DCE6F3] bg-white px-6 text-[16.5px] font-bold text-[#0E2B4C] transition-colors hover:text-[#F4601F]"><IcShoppingCart size={22} /> Shop Parts <IcArrowForward size={18} /></Link>
                  </div>
                </div>
              </ScaledStage>
            </div>

            {/* Stats strip — mobile: 4-up white card; desktop: chips + trusted-by card */}
            <div className="mx-2 mt-2.5 grid grid-cols-4 rounded-[14px] bg-white px-0.5 py-[11px] shadow-[0_4px_14px_rgba(12,42,77,0.06)] md:hidden">
              {[[IcGroups, '10K+', 'Happy', 'Customers'], [IcBuild, '500+', 'Verified', 'Mechanics'], [IcLocationOn, '1000+', 'Brands', 'Available'], [IcStar, '4.8/5', 'Customer', 'Rating']].map(([I, v, a, b]: any, i) => (
                <div key={v} className={`flex min-w-0 items-center gap-1 px-[3px] ${i < 3 ? 'border-r border-[#EEF2F7]' : ''}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#EEF4FC] text-[#1864C8]"><I size={14} /></span>
                  <div className="min-w-0 leading-[1.2]"><div className="text-[12.5px] font-bold">{v}</div><div className="text-[9px] tracking-[-0.1px] text-[#52667C]">{a}<br />{b}</div></div>
                </div>
              ))}
            </div>
            <div className="mt-[clamp(12px,1.8vw,18px)] hidden flex-wrap gap-2.5 md:flex">
              <div className="flex min-w-0 flex-[1_1_430px] gap-2.5">
                <StatChip Icon={IcGroups} value="10K+" label="Happy Customers" />
                <StatChip Icon={IcBuild} value="500+" label="Verified Mechanics" />
                <StatChip Icon={IcLocationOn} value="1000+" label="Brands Available" />
                <StatChip Icon={IcVerifiedUser} value="4.8/5" label="Customer Rating" />
              </div>
              <Link href="/mechanics" className="flex min-w-0 flex-[1_1_250px] items-center gap-[11px] rounded-[13px] border border-[#E9EEF5] bg-white px-3.5 py-[9px] shadow-[0_2px_8px_rgba(12,42,77,0.04)]">
                <div className="flex shrink-0 items-center" role="img" aria-label="Bharat Mechanics customers">
                  {['/design/mechavatar-1.png', '/design/cust-av-w.png', '/design/mechavatar-3.png'].map((src, i) => (
                    <DImg key={src} src={src} alt="" sizes="38px" className="relative h-[38px] w-[38px] rounded-full border-2 border-white bg-[#E9F0F8] object-cover shadow-[0_2px_6px_rgba(12,42,77,0.15)]" style={{ zIndex: 3 - i, marginLeft: i ? -12 : 0 }} />
                  ))}
                  <span className="-ml-3 flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-white bg-[#C94309] text-[10.5px] font-bold text-white shadow-[0_2px_6px_rgba(12,42,77,0.15)]">10K+</span>
                </div>
                <div className="min-w-0 leading-[1.3]">
                  <div className="text-[11px] text-[#52667C]">Trusted by</div>
                  <div className="truncate text-[13.5px] font-bold">10,000+ Car &amp; Bike Owners</div>
                  <div className="text-[11px] text-[#52667C]">Across India</div>
                </div>
                <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DCE6F2] text-[#1864C8]"><IcArrowForward size={15} /></span>
              </Link>
            </div>

          </div>
        </div>

        {/* ═══ How can we help you today? ═══ */}
        <Section>
          <SectionHead
            title="How can we help you today?"
            sub="Choose a service and we'll take care of the rest."
            action={{ label: 'See all services', href: '/service' }}
          />
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 md:mt-4 md:gap-3.5 lg:grid-cols-4">
            <HelpCard Icon={IcBuild} tone="blue" title="Book a Service" sub="At your doorstep" img="/design/hc-car.webp" imgAlt="Car service" tag="Free pickup" href="/service" />
            <HelpCard Icon={IcShoppingBag} tone="green" title="Buy Parts" sub="100% genuine OEM" img="/design/hc-parts.webp" imgAlt="Genuine spare parts" tag="1000+ brands" href="/shop" />
            <HelpCard Icon={IcTwoWheeler} tone="orange" title="Bikes Service" sub="Two-wheeler care" img="/design/hc-bike.webp" imgAlt="Bike service" tag="Bike & scooter" onClick={goToBikesService} />
            <HelpCard Icon={IcLocalShipping} tone="red" title="Emergency" sub="24/7 roadside help" img="/design/hc-tow.webp" imgAlt="Roadside assistance" tag="< 30 min ETA" href="/emergency" />
          </div>
        </Section>

        {/* ═══ More from Bharat Mechanics (BM Care / Lens / Tracker) ═══ */}
        <Section>
          <SectionHead title="More from Bharat Mechanics" sub="Smart solutions for every vehicle need" />
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((c) => {
              const t = TONES[c.tone]
              return (
                <Link
                  key={c.key}
                  href={c.href}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(12,42,77,0.10)]"
                  style={{ background: t.soft, borderColor: t.border }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}>
                      <c.Icon size={22} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[16px] font-bold">{c.title}</div>
                      <div className="truncate text-[12px] text-[#52667C]">{c.sub}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.chips.map((ch) => (
                      <span key={ch.label} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-[3px] text-[11px] font-semibold text-[#41586F] ring-1 ring-black/[0.05]">
                        <ch.Icon size={12} style={{ color: t.fg }} />
                        {ch.label}
                      </span>
                    ))}
                  </div>
                  <span className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white transition-transform group-hover:scale-[1.03]" style={{ background: t.ink }}>
                    {c.cta} <IcArrowForward size={14} />
                  </span>
                </Link>
              )
            })}
          </div>
        </Section>

        {/* ═══ Shop by category (catalog-driven, design tiles as fallback) ═══ */}
        {loading && categoryTiles.length === 0 ? (
          <Section>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 w-44 animate-pulse rounded-md bg-gray-200" />
                <div className="mt-1.5 h-3 w-36 animate-pulse rounded-md bg-gray-100" />
              </div>
              <div className="h-3.5 w-14 animate-pulse rounded-md bg-gray-200" />
            </div>
            <div className={CATEGORY_ROW}>
              {Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)}
            </div>
          </Section>
        ) : categoryTiles.length > 0 ? (
          <Section>
            <SectionHead title="Shop by category" action={{ label: 'View all categories', href: '/shop' }} />
            <div className={CATEGORY_ROW}>
              {categoryTiles.map((cat: any) => <CategoryTile key={cat._id || cat.id} cat={cat} />)}
            </div>
          </Section>
        ) : null}

        {/* ═══ Best Sellers (featured products) ═══ */}
        {loading && featuredProducts.length === 0 ? (
          <Section>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 w-36 animate-pulse rounded-md bg-gray-200" />
                <div className="mt-1.5 h-3 w-48 animate-pulse rounded-md bg-gray-100" />
              </div>
              <div className="h-3.5 w-14 animate-pulse rounded-md bg-gray-200" />
            </div>
            <div className="mt-4 flex gap-3.5 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          </Section>
        ) : featuredProducts.length > 0 ? (
          <Section>
            <SectionHead title="Best Sellers" sub="Most loved by our customers" action={{ label: 'View all', href: '/shop' }} />
            <div
              className="scrollbar-hide -mx-0.5 mt-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto overscroll-x-contain px-0.5 pb-3.5 pt-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {featuredProducts.slice(0, 10).map((product: any) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  price={getPrice(product)}
                  mrp={getMrp(product)}
                  discount={getDiscount(product)}
                  image={getImage(product)}
                  rating={getRating(product)}
                  reviews={getReviewCount(product)}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {/* ═══ App banner (light) — design's composed 1600×640 banner; stacks under 1100px ═══ */}
        <Section>
          <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(110deg,#F4F9FE_0%,#F1F7FE_45%,#EEF4FD_100%)] px-4 pt-5 shadow-[0_12px_30px_rgba(12,42,77,0.07)] min-[1101px]:hidden">
            <AppBannerCopy compact />
            <DImg src="/design/ap-art-full.webp" alt="Bharat Mechanics app on two phones with car, bike and genuine parts" sizes="(min-width: 1101px) 96px, 100vw" className="mt-3 block aspect-[1115/793] h-auto w-full object-cover" />
          </div>
          <ScaledStage className="hidden aspect-[1600/640] min-[1101px]:block" stageClassName="h-[640px] w-[1600px]" stageStyle={{ borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(110deg,#F4F9FE 0%,#F1F7FE 45%,#EEF4FD 100%)', boxShadow: '0 12px 30px rgba(12,42,77,0.07)' }}>
            <DImg src="/design/ap-art-full.webp" alt="" sizes="(max-width: 1100px) 96px, 640px" className="absolute left-[700px] top-0 h-[640px] w-[900px] object-cover" />
            <div className="absolute left-[65px] top-10 w-[680px]"><AppBannerCopy /></div>
          </ScaledStage>
        </Section>

        {/* ═══ Trust strip ═══ */}
        <div className="mx-auto max-w-[1180px] px-[clamp(14px,4vw,28px)] pt-[clamp(18px,2.5vw,24px)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] rounded-2xl border border-[#E6ECF3] bg-white">
            <TrustItem Icon={IcVerifiedUser} tone="blue" title="Genuine Parts" sub="100% OEM Original" />
            <TrustItem Icon={IcVerifiedUser} tone="green" title="30-Day Warranty" sub="On every service" />
            <TrustItem Icon={IcHome} tone="orange" title="Doorstep Service" sub="At home or office" />
            <TrustItem Icon={IcCreditCard} tone="purple" title="Transparent Pricing" sub="No hidden fees" />
          </div>
        </div>

        {/* ═══ Popular services ═══ */}
        <Section pad="lg">
          <SectionHead
            eyebrow="POPULAR SERVICES"
            title="Everything your vehicle needs, in one place"
            sub="Expert care at transparent prices. Quality service, right at your doorstep."
            action={{ label: 'View all services', href: '/service', boxed: true }}
          />
          <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(235px,1fr))] gap-3.5">
            {POPULAR_SERVICES.map((s) => {
              const t = TONES[s.tone]
              return (
                <Link key={s.service} href="/service" className="relative min-h-[124px] overflow-hidden rounded-2xl border border-[#E6ECF3] bg-white px-3.5 pb-4 pt-3.5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(12,42,77,0.10)]">
                  <div className="flex items-start justify-between gap-2.5">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px]" style={{ background: t.bg, color: t.fg }}><s.Icon size={20} /></span>
                    <span className="rounded-xl bg-[#E4F5EA] px-2.5 py-1 text-[10.5px] font-bold text-[#0F7040]">Save {s.savings}%</span>
                  </div>
                  {/* Text is capped so long titles wrap, and layered above the render so it never clips */}
                  <div className="relative z-[1] max-w-[58%]">
                    <div className="mt-3 text-[14.5px] font-bold leading-tight">{s.service}</div>
                    <div className="mt-0.5 text-[12px] text-[#52667C]">Starts from <span className="font-bold text-[#0E2B4C]">₹{inr(s.price)}</span></div>
                  </div>
                  <DImg src={s.img} alt="" sizes="120px" className="pointer-events-none absolute bottom-2 right-[50px] h-16 w-[44%] object-contain object-right-bottom" />
                  <span className="absolute bottom-2.5 right-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#1864C8] shadow-[0_2px_8px_rgba(12,42,77,0.14)]"><IcArrowForward size={14} /></span>
                </Link>
              )
            })}
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-4 rounded-[14px] border border-[#FBE0CC] bg-[linear-gradient(90deg,#FFF3EA,#FFEDE1)] px-4 py-3.5">
            <IcLocalShipping size={34} className="shrink-0 text-[#F4601F]" />
            <div className="min-w-0 flex-[1_1_260px]">
              <div className="text-[13.5px] font-bold">All services include free pickup &amp; drop-off</div>
              <div className="text-[12px] text-[#52667C]">We pick up your vehicle, service it, and drop it back at your convenience.</div>
            </div>
            <Link href="/service" className="flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#C94309] px-5 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#A93807]">
              View all services <IcArrowForward size={15} />
            </Link>
          </div>
        </Section>

        {/* ═══ How it works ═══ */}
        <Section pad="lg">
          <SectionHead eyebrow="HOW IT WORKS" title="Get service in 4 simple steps" sub="From booking to doorstep delivery — we make it hassle-free." />
          <div className="mt-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard n="1" Icon={IcMenuBook} tone="blue" title="Choose Service" sub="Browse and pick what you need" />
            <StepCard n="2" Icon={IcCalendarToday} tone="orange" title="Select Date & Time" sub="Schedule at your convenience" />
            <StepCard n="3" Icon={IcVerifiedUser} tone="green" title="Confirm & Relax" sub="We'll take it from here" />
            <StepCard n="4" Icon={IcHome} tone="orange" title="We Come to You" sub="Doorstep service, on-time" />
          </div>
        </Section>

        {/* ═══ Stats ═══ */}
        <Section pad="lg">
          <SectionHead eyebrow="TRUSTED BY THOUSANDS" title="Our numbers speak for themselves" sub="A growing community of happy customers across India." />
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard Icon={IcGroups} tone="blue" value="10,000+" label="Happy Customers" />
            <StatCard Icon={IcShoppingBag} tone="orange" value="50,000+" label="Parts Available" />
            <StatCard Icon={IcBuild} tone="green" value="500+" label="Verified Mechanics" />
            <StatCard Icon={IcStar} tone="amber" value="4.8/5" label="Customer Rating" />
          </div>
        </Section>

        {/* ═══ App banner (dark) ═══ */}
        <Section>
          <div className="relative flex flex-wrap items-center gap-[clamp(18px,3vw,36px)] overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#0A2442_0%,#10386A_55%,#0C2A4D_100%)] p-[clamp(16px,2.4vw,24px)] text-white">
            <div className="pointer-events-none absolute bottom-[-40%] left-[-10%] aspect-square w-[60%] rounded-full bg-[radial-gradient(circle,rgba(244,96,31,0.20)_0%,rgba(244,96,31,0)_65%)]" />
            <div className="relative flex min-w-0 flex-[1_1_320px] items-center justify-center">
              <DImg sizes="(max-width: 767px) 92vw, 500px" src="/design/app-banner-v10.webp" alt="Bharat Mechanics app — booking and live mechanic tracking" className="block h-auto w-full max-w-[500px] py-[clamp(8px,1.4vw,16px)]" />
            </div>
            <div className="relative min-w-0 flex-[1.1_1_340px] px-[clamp(0px,1vw,10px)] py-[clamp(4px,1vw,10px)]">
              <div className="flex items-center gap-2.5">
                <span className="h-[3px] w-[26px] rounded-sm bg-[#F4601F]" />
                <span className="text-[11px] font-bold tracking-[1.6px] text-[#FFB68C]">BHARAT MECHANICS APP</span>
              </div>
              <h2 className="mt-2.5 text-[clamp(24px,3.2vw,36px)] font-bold leading-[1.12] tracking-[-0.8px] text-white">Your garage in your <span className="text-[#F4601F]">pocket.</span></h2>
              <p className="mt-2.5 max-w-[420px] text-[13.5px] text-[#C3D4E6]">Book in 60 seconds, track your mechanic live, and unlock app-only deals you won&apos;t see on the web.</p>
              <div className="mt-[18px] grid max-w-[520px] grid-cols-2 gap-2.5">
                {[
                  { Icon: IcLocationOn, label: 'Real-time Tracking' },
                  { Icon: IcCreditCard, label: 'Wallet Cashback' },
                  { Icon: IcLocalOffer, label: 'App-only Coupons' },
                  { Icon: IcHeadsetMic, label: '24x7 Support' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-[14px] border border-white/[0.14] bg-white/[0.07] px-3.5 py-[13px]">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[rgba(244,96,31,0.18)] text-[#FFB68C]"><Icon size={18} /></span>
                    <span className="min-w-0 flex-1 text-[13px] font-semibold leading-[1.3]">{label}</span>
                  </div>
                ))}
              </div>
              <StoreBadges dark />
            </div>
          </div>
        </Section>

        {/* ═══ Testimonials ═══ */}
        <Section pad="lg">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>REAL REVIEWS</Eyebrow>
              <h2 className="mt-2 text-[clamp(21px,2.7vw,30px)] font-bold tracking-[-0.6px]">What our customers say</h2>
              <p className="mt-1 text-[13.5px] text-[#52667C]">Real people. Real experiences. Real trust.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[15px] tracking-[1px] text-[#F0A726]">★★★★★</span>
              <span className="text-[15px] font-bold">4.8</span>
              <span className="text-[12px] text-[#52667C]">based on 10,000+ verified reviews</span>
              <button type="button" aria-label="Previous testimonial" onClick={() => setActiveTestimonial(prev => prev === 0 ? TESTIMONIALS.length - 1 : prev - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E1E8F0] bg-white text-[#0E2B4C] hover:border-[#0E2B4C]"><IcChevronLeft size={18} /></button>
              <button type="button" aria-label="Next testimonial" onClick={() => setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E1E8F0] bg-white text-[#0E2B4C] hover:border-[#0E2B4C]"><IcChevronRight size={18} /></button>
            </div>
          </div>
          <div className="mt-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {[0, 1, 2].map((offset) => {
              const idx = (activeTestimonial + offset) % TESTIMONIALS.length
              return <TestimonialCard key={idx} t={TESTIMONIALS[idx]} dark={offset === 1} className={offset > 0 ? 'hidden md:block' : ''} />
            })}
          </div>
        </Section>

        {/* ═══ Become a partner ═══ */}
        <Section pad="lg">
          <SectionHead eyebrow="GROW WITH US" title="Become a partner" sub="Join thousands of mechanics, shops and delivery partners earning with Bharat Mechanics." />
          <div className="mt-[18px] grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <PartnerCard Icon={IcBuild} title="Become a Mechanic" sub="Get verified service requests, fixed payouts, and grow your business." cta="Join as Mechanic" href="/become-mechanic" bg="linear-gradient(115deg,#0D2E56 0%,#124887 100%)" subColor="#C3D4E6" ctaColor="#0E2B4C" hover="#FFEDE1" img="/design/partner-mechanic.webp" />
            <PartnerCard Icon={IcStore} title="List Your Shop" sub="Sell genuine parts to thousands of customers across India." cta="List Your Shop" href="/list-your-shop" bg="linear-gradient(115deg,#EC5615 0%,#FB7A34 100%)" subColor="#FFE6D6" ctaColor="#C94309" hover="#FFF1E8" img="/design/partner-shop.webp" wide />
            <PartnerCard Icon={IcDeliveryDining} title="Drive & Deliver" sub="Earn flexible income delivering parts and picking vehicles." cta="Join as Delivery Partner" href="/login?role=delivery" bg="linear-gradient(115deg,#0C7E48 0%,#17A862 100%)" subColor="#D8F3E4" ctaColor="#0F7040" hover="#EAF9F0" img="/design/partner-delivery.webp" />
          </div>
        </Section>

        {/* ═══ FAQ ═══ */}
        <Section pad="lg">
          <SectionHead eyebrow="GOT QUESTIONS?" title="Frequently asked questions" sub="Quick answers to help you get started." action={{ label: 'View all FAQs', href: '/support', boxed: true }} />
          <div className="mt-[18px] grid grid-cols-1 gap-3 md:grid-cols-2">
            {HOME_FAQS.map((item, i) => (
              <FaqCard key={i} question={item.q} answer={item.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </Section>

        {/* ═══ About (SEO prose + internal links) ═══ */}
        <Section pad="lg">
          <div className="rounded-[20px] border border-[#E6ECF3] bg-white p-[clamp(18px,3vw,28px)]">
            <div className="grid grid-cols-1 items-start gap-[clamp(18px,3vw,28px)] md:grid-cols-2">
              <div>
                <Eyebrow>ABOUT BHARAT MECHANICS</Eyebrow>
                <h2 className="mt-2.5 text-[clamp(21px,2.7vw,30px)] font-bold leading-[1.2] tracking-[-0.6px]">India&apos;s trusted platform for genuine auto parts &amp; doorstep vehicle service</h2>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#41586F]">
                  <strong className="font-semibold text-[#0E2B4C]">Bharat Mechanics</strong> brings your car and bike service home. Book a{' '}
                  <Link href="/service" className="font-semibold text-[#1864C8] hover:text-[#F4601F]">certified doorstep mechanic</Link>{' '}
                  for periodic servicing, breakdown assistance, AC repair, battery replacement, denting &amp; painting and more &mdash; with transparent, issue-based pricing and a 30-day service warranty. You pay only after the job is done, and you can track your mechanic live on the way to your location.
                </p>
                <p className="mt-3 text-[13px] leading-[1.65] text-[#41586F]">
                  Need parts? Our{' '}
                  <Link href="/shop" className="font-semibold text-[#1864C8] hover:text-[#F4601F]">online auto parts store</Link>{' '}
                  stocks 100% genuine OEM spares &mdash; engine oil, brake pads, air &amp; oil filters, spark plugs, batteries, tyres, wipers and accessories for every major car and two-wheeler brand, delivered fast across India with a 6-month warranty on eligible products.
                </p>
              </div>
              <div className="flex min-w-0 items-center justify-center">
                <DImg sizes="(max-width: 767px) 92vw, 520px" src="/design/home-hero-v2.webp" alt="Har Gaadi Ka Saathi — Bharat Mechanics certified mechanic with 10,000+ happy customers, 500+ certified mechanics, 4.8/5 rating" className="block h-auto w-full max-w-[520px]" />
              </div>
            </div>
            <div className="mt-[18px] grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: IcShoppingCart, tone: 'orange', t: 'Buy genuine spare parts', d: 'Car & bike parts, delivered', href: '/shop', bg: '#FFF6EF' },
                { Icon: IcBuild, tone: 'blue', t: 'Book a doorstep mechanic', d: 'Service at home or office', href: '/service', bg: '#F3F8FF' },
                { Icon: IcVerifiedUser, tone: 'green', t: 'Find certified mechanics', d: 'Verified, rated professionals', href: '/mechanics', bg: '#F2FAF5' },
                { Icon: IcSchool, tone: 'purple', t: 'Mechanic training', d: 'Get certified & earn more', href: '/training', bg: '#F6F4FF' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="group rounded-[14px] px-4 py-3.5 transition-shadow hover:shadow-[0_8px_20px_rgba(12,42,77,0.08)]" style={{ background: l.bg }}>
                  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: TONES[l.tone].bg, color: TONES[l.tone].fg }}><l.Icon size={18} /></span>
                  <div className="mt-3 text-[13.5px] font-bold group-hover:text-[#1A6FD4]">{l.t}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#52667C]">{l.d}</div>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ Our presence ═══ */}
        <Section pad="lg">
          <div className="grid grid-cols-1 items-center gap-[clamp(16px,2.5vw,26px)] md:grid-cols-3">
            <div>
              <div className="text-[11px] font-bold tracking-[1.8px] text-[#BE3F09]">OUR PRESENCE</div>
              <h2 className="mt-2.5 text-[clamp(21px,2.7vw,30px)] font-bold leading-[1.2] tracking-[-0.6px]">Serving 100+ cities across India</h2>
              <p className="mt-3 text-[13px] leading-[1.6] text-[#41586F]">From Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Pune, Ahmedabad, Kolkata, Jaipur, Indore and many more — Bharat Mechanics is just a tap away.</p>
              <Link href="/service" className="mt-[18px] inline-flex items-center gap-[9px] rounded-3xl border border-[#BBD5F2] bg-white px-5 py-3 text-[13px] font-semibold text-[#1864C8] transition-colors hover:border-[#1A6FD4]">
                Check service availability <IcArrowForward size={15} />
              </Link>
            </div>
            <div className="flex justify-center">
              <DImg sizes="(max-width: 767px) 92vw, 440px" src="/design/india-map-sm.webp" alt="Bharat Mechanics service cities across India" className="block h-auto w-full max-w-[440px]" />
            </div>
            <div className="grid gap-4">
              {[
                { Icon: IcLocalShipping, tone: 'blue', t: 'Pan India Service', d: '100+ cities and growing' },
                { Icon: IcSpeed, tone: 'orange', t: 'Fast Response', d: 'Mechanics at your doorstep' },
                { Icon: IcHeadsetMic, tone: 'purple', t: '24×7 Support', d: "We're always here for you" },
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: TONES[r.tone].bg, color: TONES[r.tone].fg }}><r.Icon size={20} /></span>
                  <div><div className="text-[14px] font-bold">{r.t}</div><div className="text-[12px] text-[#52667C]">{r.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ Contact strip ═══ */}
        <Section pad="lg" bottom>
          <div className="grid grid-cols-1 items-center gap-[clamp(16px,2.5vw,24px)] rounded-[20px] border border-[#E6ECF3] bg-white p-[clamp(18px,3vw,26px)] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-[11px] font-bold tracking-[1.8px] text-[#BE3F09]">STILL HAVE QUESTIONS?</div>
              <h2 className="mt-2 text-[clamp(20px,2.5vw,28px)] font-bold tracking-[-0.5px]">We&apos;re here to help</h2>
              <p className="mt-1.5 text-[13px] text-[#52667C]">Get in touch with our support team or explore our help center.</p>
            </div>
            <ContactItem Icon={IcCall} tone="orange" a="Call Us" b="+91 93106 94349" c="Mon - Sun, 8AM - 10PM" href="tel:+919310694349" />
            <ContactItem Icon={IcChat} tone="blue" a="Live Chat" b="Chat with our team" c="Get instant support" href="/support" />
            <ContactItem Icon={IcEmail} tone="purple" a="Email Us" b="support@bharatmechanics.com" c="We reply within 24 hours" href="mailto:support@bharatmechanics.com" />
          </div>
        </Section>
      </div>

      {/* ═══ Sticky mobile booking CTA (above the mobile bottom nav) ═══ */}
      <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-40 px-3 pb-2 md:hidden">
        <Link href="/service" className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#FF6A26] to-[#EE4F10] px-4 py-3 text-white shadow-lg shadow-[#F4601F]/30 ring-1 ring-white/20 transition-transform active:scale-[0.98]">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"><IcBuild size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium leading-none opacity-85">Book in 60 sec</p>
              <p className="truncate text-[13px] font-extrabold leading-tight tracking-tight">Service from ₹499</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#BE3F09]">Book now <IcArrowForward size={12} /></div>
        </Link>
      </div>

      {/* ═══ FILTER MODAL (PRESERVED — bottom sheet, same as Android) ═══ */}
      {filterOpen && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] px-5 py-4">
              <h3 className="text-xl font-bold">Filter Parts</h3>
              <button type="button" onClick={() => setFilterOpen(false)} className="rounded-full p-1 hover:bg-gray-100"><IcClose size={24} className="text-gray-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="mt-6">
                <h4 className="mb-3 text-base font-bold">Category</h4>
                <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  <button type="button" onClick={() => setFilterCategory('all')} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold ${filterCategory === 'all' ? 'border-[#0E2B4C] bg-[#0E2B4C] text-white' : 'border-[#E1E8F0] bg-[#F5F8FC] text-[#0E2B4C]'}`}>All</button>
                  {categories.slice(0, 10).map((cat: any) => (
                    <button key={cat._id || cat.id} type="button" onClick={() => setFilterCategory(cat._id || cat.id)} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold ${filterCategory === (cat._id || cat.id) ? 'border-[#0E2B4C] bg-[#0E2B4C] text-white' : 'border-[#E1E8F0] bg-[#F5F8FC] text-[#0E2B4C]'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-base font-bold">Price Range</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="mb-2 text-[13px] font-semibold text-gray-500">Min</p>
                    <input type="number" placeholder={'₹0'} value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} className="w-full rounded-xl border border-[#E1E8F0] bg-[#F5F8FC] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#0E2B4C]" />
                  </div>
                  <span className="mt-7 text-base font-bold text-gray-400">-</span>
                  <div className="flex-1">
                    <p className="mb-2 text-[13px] font-semibold text-gray-500">Max</p>
                    <input type="number" placeholder={'₹10000'} value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} className="w-full rounded-xl border border-[#E1E8F0] bg-[#F5F8FC] px-4 py-3 text-[15px] font-semibold outline-none focus:border-[#0E2B4C]" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-base font-bold">Brands</h4>
                <div className="flex flex-wrap gap-2.5">
                  {filterBrands.map(brand => (
                    <button key={brand} type="button" onClick={() => toggleFilterBrand(brand)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold ${filterSelectedBrands.includes(brand) ? 'border-[#0E2B4C] bg-[#0E2B4C]/10 text-[#0E2B4C]' : 'border-[#E1E8F0] bg-[#F5F8FC] text-[#0E2B4C]'}`}>
                      {filterSelectedBrands.includes(brand) && <IcCheckCircle size={16} className="text-[#0E2B4C]" />}
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-base font-bold">Minimum Rating</h4>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button" onClick={() => setFilterRating(r)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-bold ${filterRating === r ? 'border-[#0E2B4C] bg-[#0E2B4C] text-white' : 'border-[#E1E8F0] bg-[#F5F8FC] text-[#0E2B4C]'}`}>
                      <IcStar size={16} className={filterRating === r ? 'text-white' : 'text-[#F5A524]'} />
                      {r}+
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-[#EEF2F7] px-5 py-4">
              <button type="button" onClick={resetFilters} className="flex-1 rounded-xl border-2 border-[#0E2B4C] py-3.5 text-base font-bold text-[#0E2B4C] hover:bg-[#0E2B4C]/5">Reset</button>
              <button type="button" onClick={applyFilters} className="flex-[2] rounded-xl bg-[#0E2B4C] py-3.5 text-base font-bold text-white shadow-md hover:bg-[#0A2442]">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
      {/* The search/filter helpers (handleSearch, IcFilterAlt) stay wired for the shop filter sheet. */}
      <form onSubmit={handleSearch} className="hidden" aria-hidden="true">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button type="button" onClick={() => setFilterOpen(true)}><IcFilterAlt size={14} /></button>
      </form>
    </UserLayout>
  )
}

/* ═════════════════════════════════════════════════════════════════════
   Sub-components (design language)
   ═════════════════════════════════════════════════════════════════════ */

function Section({ children, pad = 'md', bottom = false }: { children: React.ReactNode; pad?: 'md' | 'lg'; bottom?: boolean }) {
  const top = pad === 'lg' ? 'pt-[clamp(28px,3.5vw,40px)]' : 'pt-[clamp(24px,3vw,34px)]'
  return (
    <section className={`mx-auto max-w-[1180px] px-[clamp(14px,4vw,28px)] ${top} ${bottom ? 'pb-[clamp(28px,3.5vw,40px)]' : ''}`}>
      {children}
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-[3px] w-[26px] rounded-sm bg-[#F4601F]" />
      <span className="text-[11px] font-bold tracking-[1.6px] text-[#BE3F09]">{children}</span>
    </div>
  )
}

function SectionHead({ eyebrow, title, sub, action }: {
  eyebrow?: string
  title: string
  sub?: string
  action?: { label: string; href: string; boxed?: boolean }
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="mt-2 text-[clamp(21px,2.7vw,30px)] font-bold tracking-[-0.6px]">{title}</h2>
            {sub && <p className="mt-1 text-[13.5px] text-[#52667C]">{sub}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="h-[3px] w-[26px] rounded-sm bg-[#F4601F]" />
              <h2 className="text-[clamp(19px,2.3vw,26px)] font-bold tracking-[-0.5px]">{title}</h2>
            </div>
            {sub && <p className="ml-9 mt-1 text-[13px] text-[#52667C]">{sub}</p>}
          </>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={`flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold text-[#1864C8] hover:text-[#F4601F] ${action.boxed ? 'rounded-[10px] border border-[#E1E8F0] bg-white px-4 py-[11px] text-[#0E2B4C] hover:border-[#F4601F]' : ''}`}
        >
          {action.label} <IcArrowForward size={14} />
        </Link>
      )}
    </div>
  )
}

function StatChip({ Icon, value, label }: { Icon: any; value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[13px] border border-[#E9EEF5] bg-white px-3.5 py-[11px] shadow-[0_2px_8px_rgba(12,42,77,0.04)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#E8F0FD] text-[#1864C8]"><Icon size={19} /></span>
      <div className="min-w-0">
        <div className="text-[15px] font-bold leading-[1.2]">{value}</div>
        <div className="text-[11.5px] leading-[1.3] text-[#52667C]">{label}</div>
      </div>
    </div>
  )
}

function HelpCard({ Icon, tone, title, sub, img, imgAlt, tag, href, onClick }: {
  Icon: any; tone: string; title: string; sub: string; img: string; imgAlt: string; tag: string; href?: string; onClick?: () => void
}) {
  const t = TONES[tone]
  const inner = (
    <>
      {/* icon + heading: stacked on mobile (design mobile block), side by side on md+ */}
      <div className="flex items-center gap-3">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] md:h-[42px] md:w-[42px] md:rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon size={20} /></span>
        <div className="hidden md:block"><div className="text-[16px] font-bold">{title}</div><div className="text-[12px] text-[#52667C]">{sub}</div></div>
      </div>
      <DImg src={img} alt="" sizes="(max-width: 767px) 30vw, 250px" className={`absolute right-1.5 top-1.5 h-[54px] w-[66%] object-contain object-right md:static md:mb-1.5 md:mt-2.5 md:block md:h-[92px] md:w-full md:object-center ${tone === 'red' ? 'md:[mask-image:linear-gradient(to_bottom,transparent_0,#000_30%)]' : ''}`} />
      <div className="mt-5 text-[14px] font-bold leading-[1.2] md:hidden">{title}</div>
      <div className="mt-0.5 pr-9 text-[11px] text-[#52667C] md:hidden">{sub}</div>
      <span className="absolute bottom-3 left-3.5 hidden rounded-[14px] border bg-white px-3 py-[5px] text-[11px] font-semibold md:inline-block" style={{ borderColor: t.border, color: t.ink }}>{tag}</span>
      <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1864C8] shadow-[0_3px_10px_rgba(12,42,77,0.12)] md:bottom-3 md:right-3"><IcArrowForward size={15} /></span>
    </>
  )
  const cls = 'relative block min-h-[104px] w-full overflow-hidden rounded-[14px] border py-2.5 pl-3 pr-2.5 text-left shadow-[0_2px_8px_rgba(12,42,77,0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(12,42,77,0.10)] md:rounded-2xl md:px-4 md:pb-11 md:pt-4 md:shadow-none'
  const style = { background: t.soft, borderColor: t.border }
  if (onClick) return <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>
  return <Link href={href || '#'} className={cls} style={style}>{inner}</Link>
}

/* Copy block shared by both app-banner layouts (design: 680px column on the 1600 canvas) */
function AppBannerCopy({ compact = false }: { compact?: boolean }) {
  const feats = [
    { Icon: IcCalendarToday, label: 'Easy Booking' },
    { Icon: IcLocalOffer, label: 'Exclusive App Offers' },
    { Icon: IcSchedule, label: 'Real-time Tracking' },
    { Icon: IcTrackChanges, label: 'Service Reminders' },
    { Icon: IcSettings, label: 'All in One App' },
  ]
  return (
    <div>
      <span className={`inline-flex items-center gap-3 rounded-[22px] bg-[#E4EEFB] font-semibold text-[#1864C8] ${compact ? 'h-9 px-4 text-[14px]' : 'h-11 pl-[18px] pr-[22px] text-[21px]'}`}><span className="h-[9px] w-[9px] rounded-full bg-[#F4601F]" />Bharat Mechanics App</span>
      <h2 className={`font-extrabold leading-[1.08] text-[#0E2B4C] ${compact ? 'mt-3 text-[clamp(30px,4.6vw,44px)] tracking-[-1px]' : 'mt-[18px] whitespace-nowrap text-[60px] tracking-[-2.2px]'}`}>
        Service. Parts. Support.<br /><span className="text-[#F4601F]">Now in your <span className="relative inline-block">pocket.<svg viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-3 left-[12%] h-[11px] w-full"><path d="M2 11 C60 3 140 2 198 6" fill="none" stroke="#F4601F" strokeWidth="4" strokeLinecap="round" /></svg></span></span>
      </h2>
      <p className={`leading-[1.4] text-[#41586F] ${compact ? 'mt-5 text-[15px]' : 'mt-[30px] w-[600px] text-[24px]'}`}>Download the app for a faster, smarter and more convenient experience.</p>
      <div className={`flex flex-wrap ${compact ? 'mt-5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5' : 'mt-[26px] w-[680px] gap-3.5'}`}>
        {feats.map(({ Icon, label }) => (
          <div key={label} className={`box-border flex items-center gap-3.5 rounded-[13px] border border-[#E6EEF7] bg-white shadow-[0_4px_14px_rgba(12,42,77,0.05)] ${compact ? 'min-h-[58px] px-2.5 py-2' : 'h-20 w-[216px] px-3.5'}`}>
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] bg-[#EEF4FD] text-[#1864C8]"><Icon size={24} /></span>
            <span className={`font-semibold leading-[1.3] text-[#0E2B4C] ${compact ? 'text-[13px]' : 'text-[19px]'}`}>{label}</span>
          </div>
        ))}
      </div>
      <div className={`flex flex-wrap items-center gap-[13px] ${compact ? 'mt-5' : 'mt-[26px]'}`}>
        <a href="https://play.google.com/store/apps/details?id=com.bharatmechanics.app" target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className="block leading-none"><DImg sizes="190px" src="/design/ap-gp.webp" alt="Get it on Google Play" className={`w-auto ${compact ? 'h-11' : 'h-[62px]'}`} /></a>
        <span aria-label="App Store — coming soon" className="block cursor-not-allowed leading-none opacity-80"><DImg sizes="180px" src="/design/ap-as.webp" alt="Download on the App Store" className={`w-auto ${compact ? 'h-11' : 'h-[62px]'}`} /></span>
        <DImg sizes="80px" src="/design/ap-qr.webp" alt="QR code to download the app" className={`ml-2 object-contain ${compact ? 'h-14 w-14' : 'h-20 w-20'}`} />
        <span className={`leading-[1.35] text-[#41586F] ${compact ? 'text-[13px]' : 'text-[20px]'}`}>Scan QR code<br />to download</span>
      </div>
    </div>
  )
}

// "Shop by category" stays on ONE line: a swipeable strip on phones, and on wider screens
// only as many tiles as fit in a single row (the rest are behind "View all categories").
const CATEGORY_ROW = [
  'mt-3.5 gap-2.5',
  'max-md:flex max-md:snap-x max-md:overflow-x-auto scrollbar-hide max-md:[&>*]:w-[100px] max-md:[&>*]:shrink-0 max-md:[&>*]:snap-start',
  'md:grid md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
  'md:max-lg:[&>*:nth-child(n+7)]:hidden lg:max-xl:[&>*:nth-child(n+9)]:hidden xl:[&>*:nth-child(n+11)]:hidden',
].join(' ')

function CategoryTile({ cat }: { cat: any }) {
  const img = (cat.icon?.startsWith?.('http') || cat.icon?.startsWith?.('/')
    ? cat.icon
    : (cat.image?.url || (typeof cat.image === 'string' ? cat.image : null))) || categoryArt(cat.name)
  const href = cat.static ? '/shop' : `/shop?category=${cat._id || cat.id}`
  return (
    <Link href={href} className="rounded-xl border border-[#E6ECF3] bg-white px-2 py-3 text-center transition-colors hover:border-[#F4601F]">
      <div className="flex h-14 w-full items-center justify-center">
        {img ? (
          img.startsWith('/design/') ? <DImg src={img} alt="" sizes="96px" className="block h-full w-full object-contain" /> : <img loading="lazy" decoding="async" src={ikUrl(img, 192)} alt="" width={96} height={56} className="block h-full w-full object-contain" />
        ) : (
          <IcShoppingBag size={34} className="text-[#1A6FD4]" />
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-[11.5px] font-semibold leading-tight">{cat.name}</div>
    </Link>
  )
}

function ProductCard({ product, price, mrp, discount, image, rating, reviews, onAdd }: {
  product: any; price: number; mrp: number; discount: number; image: string; rating: number; reviews: number; onAdd: (id: string) => void
}) {
  const brandName = product.brand?.name || product.brand || ''
  const id = product._id || product.id
  return (
    <div className="relative flex shrink-0 basis-[max(158px,calc((100%_-_56px)/5))] snap-start flex-col rounded-2xl border border-[#E6ECF3] bg-white p-2.5 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-[3px] hover:border-[#D6E2F0] hover:shadow-[0_14px_30px_rgba(12,42,77,0.10)]">
      <Link href={`/shop/${id}`} className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[10px] border border-[#F0F4F8] bg-white p-2">
        {image ? (
          <img loading="lazy" decoding="async" src={ikUrl(image, 360)} alt={product.name} width={180} height={112} className="block h-full w-full object-contain" />
        ) : (
          <IcShoppingBag size={40} className="text-gray-300" />
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-[20px] bg-[#C94309] px-2 py-1 text-[10px] font-bold tracking-[0.3px] text-white">{discount}% OFF</span>
        )}
        <span aria-label="Add to wishlist" onClick={(e) => e.preventDefault()} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0E2B4C] shadow-[0_2px_6px_rgba(12,42,77,0.10)]">
          <IcFavoriteBorder size={14} />
        </span>
      </Link>
      <div className="mt-2 flex items-center justify-between gap-1.5 px-0.5">
        <span className="truncate text-[10.5px] font-bold uppercase tracking-[0.6px] text-[#BE3F09]">{brandName}</span>
        {rating > 0 && (
          <span className="flex shrink-0 items-center gap-[3px] text-[11px] text-[#52667C]">
            <IcStar size={13} className="text-[#F5A524]" /><span className="font-semibold text-[#0E2B4C]">{rating.toFixed(1)}</span>{reviews > 0 && ` (${reviews})`}
          </span>
        )}
      </div>
      <Link href={`/shop/${id}`} className="mt-[3px] line-clamp-2 min-h-[2.7em] px-0.5 text-[12.5px] font-semibold leading-[1.35] hover:text-[#1A6FD4]">
        {product.name}
      </Link>
      <div className="mt-1.5 flex items-baseline gap-[7px] px-0.5">
        <span className="text-[15px] font-bold">₹{inr(price)}</span>
        {mrp > price && <span className="text-[11.5px] text-[#52667C] line-through">₹{inr(mrp)}</span>}
      </div>
      <button
        type="button"
        onClick={() => onAdd(id)}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#0E2B4C] p-2 pt-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#F4601F]"
        style={{ marginTop: 'auto' }}
      >
        <IcShoppingCart size={14} /> Add to Cart
      </button>
    </div>
  )
}

function StoreBadges({ dark }: { dark: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <a href="https://play.google.com/store/apps/details?id=com.bharatmechanics.app" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-[9px] rounded-[10px] px-4 py-2 ${dark ? 'bg-white text-[#0E2B4C]' : 'bg-black text-white'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2.5 13.5 12 3 21.5Z" fill="#34A853"/><path d="M3 2.5 17 10.5l-3.5 1.5Z" fill="#EA4335"/><path d="M3 21.5 13.5 12l3.5 1.5Z" fill="#FBBC04"/><path d="M17 10.5 21 12l-4 1.5Z" fill="#4285F4"/></svg>
        <span className="leading-[1.15]"><span className="block text-[7.5px] tracking-[0.9px]">GET IT ON</span><span className="block text-[14px] font-semibold">Google Play</span></span>
      </a>
      <span aria-label="App Store — coming soon" className={`flex cursor-not-allowed items-center gap-[9px] rounded-[10px] px-4 py-2 opacity-80 ${dark ? 'border border-white/25 bg-black text-white' : 'bg-black text-white'}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.7.7 2.9.7 2-1.1 2.8-2.2c.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8ZM14.3 5.3c.6-.8 1-1.8.9-2.9-.9.1-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.7-1.3Z"/></svg>
        <span className="leading-[1.15]"><span className="block text-[7.5px]">COMING SOON</span><span className="block text-[14px] font-semibold">App Store</span></span>
      </span>
      <div className="flex items-center gap-2.5">
        <DImg sizes="52px" src="/design/qr.png" alt="QR code to download the app" className={`h-[52px] w-[52px] rounded-md object-contain ${dark ? 'bg-white p-[3px]' : ''}`} />
        <div className={`whitespace-nowrap text-[11.5px] leading-[1.35] ${dark ? 'text-[#C3D4E6]' : 'text-[#41586F]'}`}>Scan QR code<br />to download</div>
      </div>
    </div>
  )
}

function TrustItem({ Icon, tone, title, sub }: { Icon: any; tone: string; title: string; sub: string }) {
  const t = TONES[tone]
  return (
    <div className="flex items-center gap-3 px-[18px] py-4">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]" style={{ background: t.bg, color: t.fg }}><Icon size={18} /></span>
      <div><div className="text-[13.5px] font-bold">{title}</div><div className="text-[11.5px] text-[#52667C]">{sub}</div></div>
    </div>
  )
}

function StepCard({ n, Icon, tone, title, sub }: { n: string; Icon: any; tone: string; title: string; sub: string }) {
  const t = TONES[tone]
  return (
    <div className="relative rounded-2xl border border-[#E6ECF3] bg-white px-4 pb-4 pt-[18px]">
      <span className="absolute -top-[11px] left-[52px] rounded-xl border border-[#E6ECF3] bg-white px-2.5 py-0.5 text-[12px] font-bold">{n}</span>
      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon size={20} /></span>
      <div className="mt-3 text-[14.5px] font-bold">{title}</div>
      <div className="mt-[3px] text-[12px] text-[#52667C]">{sub}</div>
    </div>
  )
}

function StatCard({ Icon, tone, value, label }: { Icon: any; tone: string; value: string; label: string }) {
  const t = TONES[tone]
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border p-[18px]" style={{ background: t.soft, borderColor: t.border }}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon size={21} /></span>
      <div><div className="text-[19px] font-bold">{value}</div><div className="text-[12px] text-[#52667C]">{label}</div></div>
    </div>
  )
}

function TestimonialCard({ t, dark, className = '' }: { t: typeof TESTIMONIALS[number]; dark?: boolean; className?: string }) {
  return (
    <div className={`rounded-2xl p-[18px] ${dark ? 'bg-[linear-gradient(160deg,#0D2E56,#0A2240)] text-white' : 'border border-[#E6ECF3] bg-white'} ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: t.bg }}>{t.initials}</span>
        <div>
          <div className="flex items-center gap-1.5 text-[14px] font-bold">
            {t.name}
            {t.verified && <IcVerified size={15} className={dark ? 'text-[#4DA3FF]' : 'text-[#1A6FD4]'} />}
          </div>
          <div className={`text-[12px] ${dark ? 'text-[#B9CCE0]' : 'text-[#52667C]'}`}>{t.profession} - {t.city}</div>
        </div>
      </div>
      <div className="mt-3 text-[14px] tracking-[1px] text-[#F0A726]">{'★'.repeat(t.rating)}</div>
      <p className={`mt-2 text-[13px] leading-[1.55] ${dark ? 'text-[#DCE8F4]' : 'text-[#41586F]'}`}>&ldquo;{t.quote}&rdquo;</p>
    </div>
  )
}

function PartnerCard({ Icon, title, sub, cta, href, bg, subColor, ctaColor, hover, img, wide }: {
  Icon: any; title: string; sub: string; cta: string; href: string; bg: string; subColor: string; ctaColor: string; hover: string; img: string; wide?: boolean
}) {
  return (
    <Link href={href} className="group relative block min-h-[196px] overflow-hidden rounded-2xl px-4 py-[18px] text-white" style={{ background: bg }}>
      <div className="relative z-[1] max-w-[56%]">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/[0.16]"><Icon size={18} /></span>
        <div className="mt-3 text-[16px] font-bold">{title}</div>
        <div className="mt-1 text-[12px]" style={{ color: subColor }}>{sub}</div>
        <span className="mt-3.5 inline-flex items-center gap-2 rounded-[9px] bg-white px-3 py-[9px] text-left text-[11.5px] font-semibold leading-[1.25] transition-colors" style={{ color: ctaColor }}>
          {cta} <IcArrowForward size={14} />
        </span>
      </div>
      <DImg
        src={img} alt="" sizes="(max-width: 767px) 40vw, 180px"
        className={`absolute bottom-0 right-0 object-contain object-right-bottom ${wide ? 'bottom-3 h-auto w-[46%]' : 'right-1.5 h-[94%] w-auto max-w-[40%]'}`}
      />
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `${hover}22` }} />
    </Link>
  )
}

function FaqCard({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border bg-white px-4 py-3.5 transition-colors ${isOpen ? 'border-[#F4601F]/40' : 'border-[#E6ECF3]'}`}>
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 text-left text-[13.5px] font-medium">
        {question}
        <IcKeyboardArrowDown size={22} className={`shrink-0 text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180 text-[#F4601F]' : ''}`} />
      </button>
      {isOpen && <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[#52667C]">{answer}</p>}
    </div>
  )
}

function ContactItem({ Icon, tone, a, b, c, href }: { Icon: any; tone: string; a: string; b: string; c: string; href: string }) {
  const t = TONES[tone]
  return (
    <a href={href} className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }}><Icon size={20} /></span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-[#52667C]">{a}</div>
        <div className="truncate text-[13.5px] font-bold">{b}</div>
        <div className="text-[11px] text-[#52667C]">{c}</div>
      </div>
    </a>
  )
}

/* ─── Skeletons ─── */
function CategorySkeleton() {
  return (
    <div className="rounded-xl border border-[#E6ECF3] bg-white px-2 py-3">
      <div className="mx-auto h-14 w-14 animate-pulse rounded-lg bg-gray-200" />
      <div className="mx-auto mt-2 h-2.5 w-16 animate-pulse rounded bg-gray-200" />
    </div>
  )
}
function ProductSkeleton() {
  return (
    <div className="shrink-0 basis-[max(158px,calc((100%_-_56px)/5))] rounded-2xl border border-[#E6ECF3] bg-white p-2.5">
      <div className="aspect-[16/10] w-full animate-pulse rounded-[10px] bg-gray-200" />
      <div className="mt-2.5 h-2.5 w-16 animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-gray-200" />
      <div className="mt-1.5 h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-8 w-full animate-pulse rounded-[9px] bg-gray-200" />
    </div>
  )
}
