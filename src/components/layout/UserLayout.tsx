'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadUserRequest, customerLogout } from '@/store/slices/customerAuthSlice'
import { userCartAPI, userNotificationAPI, catalogAPI } from '@/services/api'
import Link from 'next/link'
import Image from 'next/image'
// Brand icon pack under the names this file used before (was lucide-react)
import {
  IcSearch as Search, IcPerson as User, IcClose as X, IcGridView as Grid3X3, IcReceipt as Receipt,
  IcNotifications as Bell, IcLocalShipping as Truck, IcLogout as LogOut, IcExpandMore as ChevronDown,
  IcAccountBalanceWallet as Wallet, IcLocationPin as MapPinned, IcStar as Star, IcLocalOffer as Tag,
  IcAutorenew as Loader2, IcInventory as Package, IcArrowForward as ArrowRight,
} from '@/components/icons/BmIcons'
import dynamic from 'next/dynamic'

const MobileDrawer = dynamic(() => import('./MobileDrawer'), { ssr: false })
import Cookies from 'js-cookie'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
// Brand icon pack (Material glyphs from the Bharat Mechanics icon set)
import {
  IcLocationOn, IcCall, IcLocalShipping, IcHelpCenter, IcStore, IcPerson, IcSearch,
  IcShoppingCart, IcBuild, IcMenu, IcHome, IcShoppingBag, IcReceiptLong, IcFacebook, IcClose,
  IcSettings, IcSchool, IcChevronRight, IcReceipt, IcLocationPin, IcCreditCard, IcStar, IcLocalShipping as IcTruck,
} from '@/components/icons/BmIcons'

/* ─── Search suggestion types ─────────────────────────────────────── */
interface SearchProduct {
  _id: string
  name: string
  slug?: string
  thumbnail?: { url: string; alt?: string }
  images?: { url: string; alt?: string; isPrimary?: boolean }[]
  price?: { selling?: number; mrp?: number }
  brand?: { _id: string; name: string; logo?: string } | string
}
interface SearchBrand {
  _id: string
  name: string
  logo?: string
}
interface SearchCategory {
  _id: string
  name: string
  slug?: string
  icon?: string
  image?: string
}
interface SearchResults {
  products: SearchProduct[]
  brands: SearchBrand[]
  categories: SearchCategory[]
}

export function UserLayout({ children, mobileTopBar = true }: { children: React.ReactNode; mobileTopBar?: boolean }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.customerAuth)
  const { openLogin } = useLoginModal()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Mount the (lazy) drawer the first time it's opened, then keep it for the close animation.
  const [drawerMounted, setDrawerMounted] = useState(false)
  useEffect(() => { if (mobileMenuOpen) setDrawerMounted(true) }, [mobileMenuOpen])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Search autocomplete state
  const [searchResults, setSearchResults] = useState<SearchResults>({ products: [], brands: [], categories: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [defaultProducts, setDefaultProducts] = useState<SearchProduct[]>([])
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Load user on mount if token exists
  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated) {
      dispatch(loadUserRequest())
    }
  }, [])

  // Fetch cart count and notification count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      userCartAPI.get().then(res => {
        if (res.data.success) {
          setCartCount(res.data.data?.totalItems || res.data.data?.items?.length || 0)
        }
      }).catch(() => {})
      userNotificationAPI.getUnreadCount().then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.data?.count || 0)
        }
      }).catch(() => {})
    }
  }, [isAuthenticated])

  // Fetch default popular products once for empty-state suggestions
  useEffect(() => {
    catalogAPI.getProducts({ limit: 5, sortBy: 'popularity' }).then(res => {
      if (res.data?.success) {
        const items = res.data.data?.products || res.data.data || []
        setDefaultProducts(items.slice(0, 5))
      }
    }).catch(() => {})
  }, [])

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close the search modal whenever the route changes
  useEffect(() => { setSearchOpen(false) }, [router.asPath])

  // Debounced search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (text.trim().length < 2) {
      setSearchResults({ products: [], brands: [], categories: [] })
      setSearchLoading(false)
      // Keep dropdown open with default products when focused but query empty
      if (text.trim().length === 0 && defaultProducts.length > 0) {
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
      return
    }

    setSearchLoading(true)
    setShowSuggestions(true)

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await catalogAPI.search(text.trim(), { limit: 6 })
        if (res.data?.success) {
          setSearchResults(res.data.data || { products: [], brands: [], categories: [] })
        }
      } catch {
        setSearchResults({ products: [], brands: [], categories: [] })
      } finally {
        setSearchLoading(false)
      }
    }, 400)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (type: string, item: SearchProduct | SearchBrand | SearchCategory) => {
    setShowSuggestions(false)
    setSearchQuery('')
    if (type === 'product') {
      const p = item as SearchProduct
      router.push(`/shop/${p._id}`)
    } else if (type === 'brand') {
      router.push(`/shop?brand=${item._id}`)
    } else if (type === 'category') {
      const c = item as SearchCategory
      router.push(`/shop?category=${c._id}`)
    }
  }

  const getProductImage = (p: SearchProduct): string => {
    if (p.thumbnail?.url) return p.thumbnail.url
    const primary = p.images?.find(i => i.isPrimary)
    if (primary?.url) return primary.url
    if (p.images?.[0]?.url) return p.images[0].url
    return ''
  }

  const getBrandName = (brand: SearchProduct['brand']): string => {
    if (!brand) return ''
    if (typeof brand === 'string') return brand
    return brand.name || ''
  }

  const hasAnySuggestions = searchResults.products.length > 0 || searchResults.brands.length > 0 || searchResults.categories.length > 0

  const handleLogout = () => {
    dispatch(customerLogout())
    setUserMenuOpen(false)
    router.push('/')
  }

  /* One header on every page (the Home design): top strip with quick links, nav, inline search field
     on wide screens (icon below xl), Book Service + bordered Login. */

  const mobileNav = [
    { icon: IcHome, label: 'Home', href: '/' },
    { icon: IcShoppingBag, label: 'Shop', href: '/shop' },
    { icon: IcReceiptLong, label: 'Orders', href: '/orders' },
    { icon: IcPerson, label: 'Profile', href: '/profile' },
  ]

  const activeNav = mobileNav.find(n => {
    if (n.href === '/') return router.pathname === '/'
    return router.pathname.startsWith(n.href)
  })?.href || '/'

  return (
    <div className="min-h-screen bg-background font-sans [overflow-x:clip]">
      {/* Top Bar — design: navy strip, contact left, quick links right (links hidden on mobile) */}
      <div className={`bg-[#0A2442] text-white ${mobileTopBar ? "" : "hidden md:block"}`}>
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-3.5 px-[clamp(14px,4vw,28px)] py-[9px] text-[12px] font-medium md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-[7px]"><IcLocationOn size={13} /> Deliver to: India</span>
            <span className="h-[13px] w-px bg-white/25" />
            <a href="tel:+919310694349" className="flex items-center gap-[7px] text-white hover:text-[#FFB68C]"><IcCall size={13} /> +91 93106 94349</a>
          </div>
          <div className="hidden flex-wrap items-center gap-5 md:flex">
            <Link href="/orders" className="flex items-center gap-[7px] text-white hover:text-[#FFB68C]"><IcLocalShipping size={13} /> Track Order</Link>
            <Link href="/support" className="flex items-center gap-[7px] text-white hover:text-[#FFB68C]"><IcHelpCenter size={13} /> Help Center</Link>
            <Link href="/list-your-shop" className="flex items-center gap-[7px] text-white hover:text-[#FFB68C]"><IcStore size={13} /> For Shops</Link>
            <Link href="/become-mechanic" className="flex items-center gap-[7px] text-white hover:text-[#FFB68C]"><IcPerson size={13} /> Become a Mechanic</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E6ECF3] bg-white">
        <div className="px-[clamp(14px,4vw,28px)]">
          <div className="mx-auto flex max-w-[1180px] items-center gap-2 py-2 lg:flex-wrap lg:gap-3 lg:py-2.5 xl:gap-[clamp(14px,1.8vw,24px)]">
          {/* Mobile: hamburger on the left (design) */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#0E2B4C] lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <IcMenu size={22} />
          </button>
          {/* Logo — design asset */}
          <Link href="/" className="flex min-w-0 shrink items-center lg:shrink-0">
            <Image
              src="/design/logo2.png"
              alt="Bharat Mechanics – Auto Parts & Vehicle Services"
              width={600}
              height={216}
              sizes="140px"
              className="h-10 w-auto object-contain lg:h-12"
              priority
            />
          </Link>

          {/* Search modal (icon-triggered, matches index.html) */}
          {searchOpen && (
          <div className="fixed inset-0 z-[70] bg-[#0F2547]/50 backdrop-blur-sm flex items-start justify-center px-4 pt-16 md:pt-20" onClick={() => { setSearchOpen(false); setShowSuggestions(false) }}>
          <div ref={searchContainerRef} className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {/* plain input with the exact classes ui/Input + cn() produced — keeps tailwind-merge off every page */}
              <input
                autoFocus
                placeholder="Search parts, services, courses…"
                className="flex w-full bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-11 pr-20 h-14 text-base rounded-none border-0 border-b border-border focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setShowSuggestions(false) } }}
                onFocus={() => { if (searchQuery.trim().length >= 2 || defaultProducts.length > 0) setShowSuggestions(true) }}
              />
              <button type="button" onClick={() => { setSearchOpen(false); setShowSuggestions(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#52667C] bg-[#F2F6FC] px-2 py-1 rounded">ESC</button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults({ products: [], brands: [], categories: [] }) }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Results */}
            {showSuggestions && (
              <div className="max-h-[60vh] overflow-y-auto scrollbar-ultra-narrow">
                {searchLoading ? (
                  <div className="flex items-center gap-2 px-4 py-6 justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  /* ── Empty query: popular search chips, or popular products ── */
                  defaultProducts.length === 0 ? (
                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Popular searches</p>
                      <div className="flex flex-wrap gap-2">
                        {['Brake pads', 'Engine oil', 'AC service', 'Battery', 'Headlight', 'Periodic service'].map((term) => (
                          <button key={term} type="button" onClick={() => handleSearchChange(term)} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#F2F6FC] text-[#475569] hover:bg-[#E8EEF7] transition-colors">{term}</button>
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2.5">Browse</p>
                      <div className="flex flex-wrap gap-2">
                        {([['Spare Parts', '/shop'], ['Book a Service', '/service'], ['Training', '/training'], ['Mechanics', '/mechanics']] as [string, string][]).map(([label, href]) => (
                          <button key={label} type="button" onClick={() => router.push(href)} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#FFF1EB] text-[#BE3F09] hover:bg-[#FFE4D6] transition-colors">{label}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                  <div className="py-2">
                    <div className="px-4 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Popular Products</span>
                      <button
                        onClick={() => { setShowSuggestions(false); router.push('/shop') }}
                        className="text-[10px] font-medium text-[#1B3B6F] hover:underline flex items-center gap-0.5"
                      >
                        View All <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {defaultProducts.map((product) => {
                      const imgUrl = getProductImage(product)
                      const brandName = getBrandName(product.brand)
                      const selling = product.price?.selling
                      const mrp = product.price?.mrp
                      const discount = selling && mrp && mrp > selling
                        ? Math.round(((mrp - selling) / mrp) * 100)
                        : 0
                      return (
                        <button
                          key={product._id}
                          onClick={() => handleSuggestionClick('product', product)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {imgUrl ? (
                              <Image src={imgUrl} alt={product.name} width={40} height={40} className="object-contain w-full h-full" />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                            {brandName && <p className="text-xs text-muted-foreground truncate">{brandName}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            {selling != null && (
                              <p className="text-sm font-bold text-[#1B3B6F]">₹{selling.toLocaleString()}</p>
                            )}
                            {discount > 0 && mrp != null && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
                                <span className="text-[10px] font-semibold text-green-600">{discount}% off</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  )
                ) : !hasAnySuggestions ? (
                  <div className="px-4 py-6 text-center">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No results for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-gray-400 mt-1">Try different keywords or browse categories</p>
                  </div>
                ) : (
                  <>
                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Products</span>
                          <button
                            onClick={() => { setShowSuggestions(false); router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`) }}
                            className="text-[10px] font-medium text-[#1B3B6F] hover:underline flex items-center gap-0.5"
                          >
                            View All <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        {searchResults.products.slice(0, 5).map((product) => {
                          const imgUrl = getProductImage(product)
                          const brandName = getBrandName(product.brand)
                          const selling = product.price?.selling
                          const mrp = product.price?.mrp
                          const discount = selling && mrp && mrp > selling
                            ? Math.round(((mrp - selling) / mrp) * 100)
                            : 0
                          return (
                            <button
                              key={product._id}
                              onClick={() => handleSuggestionClick('product', product)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {imgUrl ? (
                                  <Image src={imgUrl} alt={product.name} width={40} height={40} className="object-contain w-full h-full" />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                {brandName && <p className="text-xs text-muted-foreground truncate">{brandName}</p>}
                              </div>
                              <div className="text-right shrink-0">
                                {selling != null && (
                                  <p className="text-sm font-bold text-[#1B3B6F]">₹{selling.toLocaleString()}</p>
                                )}
                                {discount > 0 && mrp != null && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
                                    <span className="text-[10px] font-semibold text-green-600">{discount}% off</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Brands */}
                    {searchResults.brands.length > 0 && (
                      <div className="py-2 border-t border-gray-100">
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brands</p>
                        {searchResults.brands.slice(0, 3).map((brand) => (
                          <button
                            key={brand._id}
                            onClick={() => handleSuggestionClick('brand', brand)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {brand.logo ? (
                                <Image src={brand.logo} alt={brand.name} width={40} height={40} className="object-contain w-full h-full p-1" />
                              ) : (
                                <Tag className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{brand.name}</p>
                              <p className="text-xs text-muted-foreground">Brand</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {searchResults.categories.length > 0 && (
                      <div className="py-2 border-t border-gray-100">
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
                        {searchResults.categories.slice(0, 3).map((cat) => (
                          <button
                            key={cat._id}
                            onClick={() => handleSuggestionClick('category', cat)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                              <Grid3X3 className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">Category</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Footer: Full search link */}
                    <div className="border-t border-gray-100 px-4 py-2.5">
                      <button
                        onClick={() => { setShowSuggestions(false); router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`) }}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#1B3B6F] hover:text-[#FF6B35] transition-colors"
                      >
                        <Search className="h-4 w-4" />
                        Search all results for &quot;{searchQuery}&quot;
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </div>
          )}

          {/* Desktop Nav — design: 13.5px/600, active = orange text + 2.5px orange underline */}
          <nav className="hidden shrink-0 items-center gap-[clamp(14px,1.5vw,22px)] text-[13.5px] font-semibold text-[#0E2B4C] lg:flex">
            {[
              { label: 'Home', href: '/', active: router.pathname === '/' },
              { label: 'Shop', href: '/shop', active: router.pathname.startsWith('/shop') && !router.pathname.startsWith('/shop-partner') },
              { label: 'Services', href: '/services', active: router.pathname.startsWith('/service') },
              { label: 'Mechanics', href: '/mechanics', active: router.pathname.startsWith('/mechanics') },
              { label: 'Training', href: '/training', active: router.pathname.startsWith('/training') },
              { label: 'Blog', href: '/blog', active: router.pathname.startsWith('/blog') },
            ].map((n) => (
              <Link key={n.href} href={n.href} className={`whitespace-nowrap border-b-[2.5px] py-[5px] transition-colors ${n.active ? 'border-[#F4601F] text-[#BE3F09]' : 'border-transparent text-[#0E2B4C] hover:text-[#F4601F]'}`}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Search field — design: inline bordered field (desktop); opens the existing search modal (autocomplete preserved) */}
          <button
            type="button"
            onClick={() => { setSearchOpen(true); setShowSuggestions(true) }}
            aria-label="Search parts, services, brands"
            className="hidden min-w-[120px] flex-[1_1_0%] items-center gap-2.5 rounded-[10px] border border-[#E1E8F0] bg-white px-[13px] py-[11px] text-left text-[12.5px] text-[#52667C] transition-colors hover:border-[#0E2B4C] xl:flex"
          >
            <IcSearch size={16} className="shrink-0 text-[#94A3B8]" />
            <span className="min-w-0 flex-1 truncate">Search parts, services, brands...</span>
          </button>

          {/* Actions — mobile: 42px search / cart / account squares; desktop: 44px squares + Book Service + Login */}
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-2.5 xl:ml-0">
            <button
              type="button"
              onClick={() => { setSearchOpen(true); setShowSuggestions(true) }}
              aria-label="Search"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#E6ECF3] bg-white text-[#0E2B4C] transition-colors hover:border-[#0E2B4C] lg:h-11 lg:w-11 lg:rounded-[10px] lg:border-[#E1E8F0] xl:hidden"
            >
              <IcSearch size={20} />
            </button>
            {isAuthenticated && (
              <Link href="/notifications" aria-label="Notifications" className="relative hidden h-11 w-11 items-center justify-center rounded-[10px] border border-[#E1E8F0] bg-white text-[#0E2B4C] transition-colors hover:border-[#0E2B4C] lg:flex">
                                <Bell className="h-[19px] w-[19px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-[7px] -top-[7px] flex h-[19px] min-w-[19px] items-center justify-center rounded-[10px] bg-[#C9283F] px-[5px] text-[11px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link href="/cart" aria-label="Cart" className={`relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#E6ECF3] bg-white text-[#0E2B4C] transition-colors hover:border-[#0E2B4C] lg:h-11 lg:w-11 lg:rounded-[10px] lg:border-[#E1E8F0]`}>
              <IcShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-[6px] -top-[6px] flex h-[19px] min-w-[19px] items-center justify-center rounded-[10px] bg-[#C94309] px-[5px] text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link href="/service" className={`hidden items-center gap-2 whitespace-nowrap bg-[#C94309] px-[18px] py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#A93807] lg:inline-flex rounded-[10px]`}>
              <IcBuild size={15} /> Book Service
            </Link>

            {isAuthenticated ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-11 items-center gap-2 rounded-[10px] border border-[#E1E8F0] bg-white px-3 text-[13.5px] font-semibold text-[#0E2B4C] transition-colors hover:border-[#0E2B4C]"
                >
                  <div className="h-7 w-7 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-xs font-bold">
                    {(user?.fullName || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden xl:block max-w-[100px] truncate">{user?.fullName || 'User'}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border z-50 py-1">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <User className="h-4 w-4 text-gray-500" /> My Profile
                      </Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Receipt className="h-4 w-4 text-gray-500" /> My Orders
                      </Link>
                      <Link href="/service" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Truck className="h-4 w-4 text-gray-500" /> My Services
                      </Link>
                      <Link href="/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <MapPinned className="h-4 w-4 text-gray-500" /> Addresses
                      </Link>
                      <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Wallet className="h-4 w-4 text-gray-500" /> Wallet
                      </Link>
                      <Link href="/reviews" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Star className="h-4 w-4 text-gray-500" /> My Reviews
                      </Link>
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => openLogin()}
                className="hidden items-center gap-2 whitespace-nowrap rounded-[10px] border border-[#E1E8F0] bg-white px-[18px] py-3 text-[13.5px] font-semibold text-[#0E2B4C] transition-colors hover:border-[#0E2B4C] lg:flex"
              >
                <IcPerson size={15} />
                Login
              </button>
            )}

            {/* Mobile account square (design) */}
            {isAuthenticated ? (
              <Link href="/profile" aria-label="Account" className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#E6ECF3] bg-white text-[#0E2B4C] lg:hidden"><IcPerson size={20} /></Link>
            ) : (
              <button type="button" onClick={() => openLogin()} aria-label="Login" className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#E6ECF3] bg-white text-[#0E2B4C] lg:hidden"><IcPerson size={20} /></button>
            )}
          </div>
        </div>
        </div>

      </header>

      {/* Mobile side drawer — its own chunk, fetched on the first hamburger tap */}
      {drawerMounted && (
        <MobileDrawer
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isAuthenticated={isAuthenticated}
          user={user}
          unreadCount={unreadCount}
          openLogin={() => openLogin()}
          handleLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer — design: #0A2240, logo + blurb + socials, four link columns */}
      <footer className="bg-[#0A2240] text-white">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[clamp(18px,3vw,28px)] px-[clamp(14px,4vw,28px)] py-[clamp(26px,3.5vw,40px)]">
          <div className="min-w-0">
            <Image src="/design/footer-logo.png" alt="Bharat Mechanics" width={270} height={76} sizes="130px" className="h-9 w-auto object-contain" />
            <p className="mt-3 max-w-[240px] text-[12.5px] leading-[1.6] text-[#A9BFD6]">India&apos;s trusted auto parts and vehicle service platform. Genuine parts, certified mechanics, doorstep delivery.</p>
            <div className="mt-4 flex items-center gap-2.5">
              <a href="#" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#F4601F]"><IcFacebook size={15} /></a>
              {/* Instagram / YouTube / LinkedIn marks aren't in the icon pack — design-provided glyphs */}
              <a href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#F4601F]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.3" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#F4601F]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 8.5s-.2-1.5-.8-2.1c-.7-.8-1.6-.8-2-.9C16.7 5.3 12 5.3 12 5.3s-4.7 0-6.2.2c-.4 0-1.3.1-2 .9C3.2 7 3 8.5 3 8.5S2.8 10.3 2.8 12v.9c0 1.7.2 3.5.2 3.5s.2 1.5.8 2.1c.7.8 1.7.8 2.1.9 1.6.2 5.1.2 5.1.2s4.7 0 6.2-.2c.4 0 1.3-.1 2-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.5V12c0-1.7-.2-3.5-.2-3.5ZM10.2 15.1V9.4l4.9 2.9-4.9 2.8Z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#F4601F]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 8.5h-3V20h3V8.5ZM5 4a1.8 1.8 0 1 0 0 3.6A1.8 1.8 0 0 0 5 4ZM20.5 13.6c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-2.9 1.6V8.5h-3V20h3v-6.1c0-1.3.6-2.1 1.7-2.1s1.6.8 1.6 2.1V20h3.4v-6.4Z"/></svg>
              </a>
            </div>
          </div>
          {[
            { title: 'Quick Links', links: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Services', href: '/services' }, { label: 'Mechanics', href: '/mechanics' }, { label: 'Training', href: '/training' }, { label: 'Blog & Guides', href: '/blog' }, { label: 'Contact Us', href: '/support' }] },
            { title: 'Customer Service', links: [{ label: 'Track Order', href: '/orders' }, { label: 'My Profile', href: '/profile' }, { label: 'Help Center', href: '/support' }, { label: 'Returns & Refunds', href: '/refund-policy' }, { label: 'Service Warranty', href: '/terms' }, { label: 'Contact Support', href: '/support' }] },
            { title: 'Partners & Training', links: [{ label: 'Become a Mechanic', href: '/become-mechanic' }, { label: 'List Your Shop', href: '/list-your-shop' }, { label: 'Certified Mechanics', href: '/mechanics' }, { label: 'Partner Login', href: '/shop-partner/login' }, { label: 'Training & Certification', href: '/training' }] },
            { title: 'Legal', links: [{ label: 'Terms & Conditions', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Refund Policy', href: '/refund-policy' }, { label: 'Shipping Policy', href: '/refund-policy' }, { label: 'Cancellation Policy', href: '/refund-policy' }] },
          ].map((col) => (
            <div key={col.title} className="min-w-0">
              <div className="text-[13.5px] font-bold">{col.title}</div>
              <div className="mt-3.5 grid gap-[9px] text-[12.5px]">
                {col.links.map((link) => (
                  <Link key={link.label} href={link.href} className="text-[#A9BFD6] transition-colors hover:text-[#FFB68C]">{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Service areas — internal links to the city guides */}
        <div className="border-t border-white/10">
          <nav aria-label="Service areas" className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-3 gap-y-1.5 px-[clamp(14px,4vw,28px)] py-4 text-[12.5px]">
            <span className="font-bold text-white">Mechanic near you:</span>
            {[['gorakhpur', 'Gorakhpur'], ['deoria', 'Deoria'], ['kushinagar', 'Kushinagar'], ['padrauna', 'Padrauna'], ['kasia', 'Kasia'], ['hata', 'Hata'], ['kaptanganj', 'Kaptanganj'], ['ramkola', 'Ramkola'], ['rudrapur', 'Rudrapur'], ['salempur', 'Salempur'], ['maharajganj', 'Maharajganj']].map(([slug, name]) => (
              <Link key={slug} href={`/blog/mechanic-in-${slug}`} className="text-[#A9BFD6] transition-colors hover:text-[#FFB68C]">{name}</Link>
            ))}
            <Link href="/blog#service-areas" className="font-semibold text-[#FFB68C] hover:text-white">All areas →</Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1180px] px-[clamp(14px,4vw,28px)] py-4 text-center text-[12px] text-[#7F97B2]">&copy; 2026 Bharat Mechanics. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E6ECF3] bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors ${
                activeNav === item.href ? 'text-[#BE3F09]' : 'text-[#52667C]'
              }`}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
