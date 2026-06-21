'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadUserRequest, customerLogout } from '@/store/slices/customerAuthSlice'
import { userCartAPI, userNotificationAPI, catalogAPI } from '@/services/api'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, ShoppingCart, User, Menu, X, Car, Home, Grid3X3, Receipt, Bell,
  Phone, MapPin, Truck, LogOut, ChevronDown, Wallet, MapPinned, Star, Wrench,
  Tag, Loader2, Package, ArrowRight, HelpCircle, Heart, Headphones,
  Store, GraduationCap, BadgeCheck,
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import Cookies from 'js-cookie'
import { useLoginModal } from '@/components/auth/LoginModalProvider'

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

export function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.customerAuth)
  const { openLogin } = useLoginModal()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const mobileNav = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Grid3X3, label: 'Shop', href: '/shop' },
    { icon: Receipt, label: 'Orders', href: '/orders' },
    { icon: User, label: 'Profile', href: '/profile' },
  ]

  const activeNav = mobileNav.find(n => {
    if (n.href === '/') return router.pathname === '/'
    return router.pathname.startsWith(n.href)
  })?.href || '/'

  return (
    <div className="min-h-screen bg-background font-sans [overflow-x:clip]">
      {/* Top Bar (Desktop) */}
      <div className="hidden md:block gradient-primary">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto py-2 flex items-center justify-between text-primary-foreground text-sm">
            <div className="flex items-center gap-4 lg:gap-6">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +91 1800-123-4567</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Deliver to: India</span>
            </div>
            <div className="flex items-center gap-4 lg:gap-6">
              <Link href="/orders" className="flex items-center gap-1 hover:underline"><Truck className="h-3 w-3" /> Track Order</Link>
              <Link href="/service" className="flex items-center gap-1 hover:underline"><Wrench className="h-3 w-3" /> Book Mechanic</Link>
              <Link href="#" className="flex items-center gap-1 hover:underline"><Headphones className="h-3 w-3" /> Help Center</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto h-16 lg:h-[72px] flex items-center gap-2 lg:gap-2.5 xl:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/brand-logo-v3.png"
              alt="Bharat Mechanics – Auto Parts & Vehicle Services"
              width={284}
              height={90}
              className="h-9 sm:h-12 lg:h-11 xl:h-14 w-auto object-contain"
              priority
            />
          </Link>

          <span className="hidden lg:block h-8 w-px bg-[#E7ECF3] shrink-0" />

          {/* Search modal (icon-triggered, matches index.html) */}
          {searchOpen && (
          <div className="fixed inset-0 z-[70] bg-[#0F2547]/50 backdrop-blur-sm flex items-start justify-center px-4 pt-16 md:pt-20" onClick={() => { setSearchOpen(false); setShowSuggestions(false) }}>
          <div ref={searchContainerRef} className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search parts, services, courses…"
                className="pl-11 pr-20 h-14 text-base rounded-none border-0 border-b border-border focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setShowSuggestions(false) } }}
                onFocus={() => { if (searchQuery.trim().length >= 2 || defaultProducts.length > 0) setShowSuggestions(true) }}
              />
              <button type="button" onClick={() => { setSearchOpen(false); setShowSuggestions(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7B8AA3] bg-[#F2F6FC] px-2 py-1 rounded">ESC</button>
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
                          <button key={label} type="button" onClick={() => router.push(href)} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#FFF1EB] text-[#FF6B35] hover:bg-[#FFE4D6] transition-colors">{label}</button>
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

          {/* Desktop Nav — handoff style (orange underline) */}
          <nav className="hidden lg:flex items-stretch gap-0.5 text-sm self-stretch lg:ml-auto">
            {[
              { label: 'Home', href: '/', active: router.pathname === '/' },
              { label: 'Shop', href: '/shop', active: router.pathname.startsWith('/shop') && !router.pathname.startsWith('/shop-partner') },
              { label: 'Services', href: '/services', active: router.pathname.startsWith('/service') },
              { label: 'Mechanics', href: '/mechanics', active: router.pathname.startsWith('/mechanics') },
              { label: 'For Shops', href: '/list-your-shop', active: router.pathname.startsWith('/list-your-shop') || router.pathname.startsWith('/shop-partner') },
              { label: 'Training', href: '/training', active: router.pathname.startsWith('/training') },
            ].map((n) => (
              <Link key={n.href} href={n.href} className={`group relative flex items-center px-2.5 xl:px-3.5 font-semibold whitespace-nowrap transition-colors ${n.active ? 'text-[#1B3B6F]' : 'text-[#475569] hover:text-[#1B3B6F]'}`}>
                {n.label}
                <span className={`absolute left-2.5 right-2.5 xl:left-3.5 xl:right-3.5 bottom-0 h-[3px] rounded-t-full bg-[#FF6B35] origin-left transition-transform ${n.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto lg:ml-0">
            <button
              onClick={() => { setSearchOpen(true); setShowSuggestions(true) }}
              aria-label="Search"
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#E7ECF3] bg-white text-[#475569] hover:border-[#2A5298] hover:text-[#1B3B6F] transition-colors shrink-0"
            >
              <Search className="h-[19px] w-[19px]" />
            </button>
            {isAuthenticated && (
              <Link href="/notifications" className="relative h-10 w-10 flex items-center justify-center rounded-lg border border-[#E7ECF3] bg-white text-[#475569] hover:border-[#2A5298] hover:text-[#1B3B6F] transition-colors shrink-0">
                <Bell className="h-[19px] w-[19px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link href="/cart" className="relative h-10 w-10 flex items-center justify-center rounded-lg border border-[#E7ECF3] bg-white text-[#475569] hover:border-[#2A5298] hover:text-[#1B3B6F] transition-colors shrink-0">
              <ShoppingCart className="h-[19px] w-[19px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link href="/service" className="hidden xl:inline-flex items-center gap-1.5 h-10 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-4 rounded-lg text-sm transition-colors shrink-0">
              <Wrench className="h-4 w-4" /> Book Service
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
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
                className="hidden md:flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1B3B6F] text-white text-sm font-medium hover:bg-[#152d55] transition-colors"
              >
                <User className="h-4 w-4" />
                Login
              </button>
            )}

            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg border border-[#E7ECF3] text-[#475569] hover:border-[#2A5298] hover:text-[#1B3B6F] transition-colors shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        </div>

      </header>

      {/* Mobile Side Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[270px] sm:w-[300px] p-0 flex flex-col">
          {/* Drawer Header */}
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border bg-gradient-to-r from-[#1B3B6F] to-[#2A5298]">
            <SheetTitle className="flex items-center text-white">
              <span className="inline-flex bg-white rounded-lg px-3 py-2 shadow-sm">
                <Image
                  src="/brand-logo-v3.png"
                  alt="Bharat Mechanics"
                  width={150}
                  height={48}
                  className="h-9 w-auto object-contain"
                />
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Authenticated User Info */}
          {isAuthenticated && user && (
            <div className="px-5 py-3.5 border-b border-border bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {(user.fullName || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || user.phone || ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto scrollbar-ultra-narrow py-2">
            {/* Main Navigation */}
            <div className="px-2.5 mb-1">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
              {[
                { icon: Home, label: 'Home', href: '/' },
                { icon: Grid3X3, label: 'Shop', href: '/shop' },
                { icon: Wrench, label: 'Services', href: '/services' },
                { icon: BadgeCheck, label: 'Mechanics', href: '/mechanics' },
                { icon: Store, label: 'For Shops', href: '/list-your-shop' },
                { icon: GraduationCap, label: 'Training', href: '/training' },
              ].map((item) => {
                const isActive = item.href === '/'
                  ? router.pathname === '/'
                  : router.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                        : 'text-foreground hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#FF6B35]' : 'text-gray-500'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Account & Activity Links — always visible */}
            <div className="px-2.5 mt-1 pt-1.5 border-t border-border">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
              {[
                { icon: User, label: 'My Profile', href: '/profile' },
                { icon: Receipt, label: 'My Orders', href: '/orders' },
                { icon: Truck, label: 'Service Requests', href: '/service/my-requests' },
                { icon: Bell, label: 'Notifications', href: '/notifications', badge: unreadCount },
                { icon: ShoppingCart, label: 'My Cart', href: '/cart' },
                { icon: MapPinned, label: 'Addresses', href: '/addresses' },
                { icon: Wallet, label: 'Wallet', href: '/wallet' },
                { icon: Star, label: 'My Reviews', href: '/reviews' },
              ].map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                const needsAuth = item.href !== '/cart'
                const linkHref = !isAuthenticated && needsAuth
                  ? `/login?redirect=${encodeURIComponent(item.href)}`
                  : item.href
                return (
                  <Link
                    key={item.href}
                    href={linkHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                        : 'text-foreground hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#FF6B35]' : 'text-gray-500'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-border px-4 py-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); openLogin() }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B3B6F] text-white text-sm font-medium hover:bg-[#152d55] transition-colors"
              >
                <User className="h-4 w-4" />
                Login / Register
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#0f2340] text-white">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <span className="inline-flex bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Image
                    src="/brand-logo-v3.png"
                    alt="Bharat Mechanics"
                    width={180}
                    height={48}
                    className="h-11 w-auto object-contain"
                  />
                </span>
                <span className="block mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#FF6B35]">
                  Auto Parts &amp; Service
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">India&apos;s trusted auto parts and vehicle service platform. Genuine parts, certified mechanics, doorstep delivery.</p>
            </div>
            {[
              { title: 'Quick Links', links: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Services', href: '/service' }, { label: 'Orders', href: '/orders' }] },
              { title: 'Customer Service', links: [{ label: 'Track Order', href: '/orders' }, { label: 'My Profile', href: '/profile' }, { label: 'Contact Us', href: '#' }] },
              { title: 'Partners & Training', links: [{ label: 'Become a Mechanic', href: '/become-mechanic' }, { label: 'List Your Shop', href: '/list-your-shop' }, { label: 'Certified Mechanics', href: '/mechanics' }, { label: 'Partner Login', href: '/shop-partner/login' }, { label: 'Training & Certification', href: '/training' }] },
              { title: 'Legal', links: [{ label: 'Terms & Conditions', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Refund Policy', href: '/refund-policy' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-gray-400 text-sm hover:text-[#FF6B35] transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center">
            <p className="text-gray-500 text-sm">&copy; 2026 Bharat Mechanics. All rights reserved.</p>
          </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                activeNav === item.href ? 'text-[#FF6B35]' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
