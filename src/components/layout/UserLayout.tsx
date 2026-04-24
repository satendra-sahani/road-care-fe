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
} from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import Cookies from 'js-cookie'

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <div className="min-h-screen bg-background font-sans">
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
          <div className="max-w-7xl mx-auto py-2 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="https://ik.imagekit.io/aiwats/roadcare/brand-logo.png"
              alt="Bharat Mechanics – Auto Parts & Vehicle Services"
              width={180}
              height={48}
              className="h-10 lg:h-11 w-auto object-contain hidden sm:block"
              priority
            />
            <Image
              src="https://ik.imagekit.io/aiwats/roadcare/fav.png"
              alt="Bharat Mechanics"
              width={40}
              height={40}
              className="h-10 w-10 object-contain sm:hidden"
              priority
            />
          </Link>

          {/* Search with Autocomplete */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts, accessories..."
                className="pl-10 pr-10 bg-surface border-border"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => { if (searchQuery.trim().length >= 2 || defaultProducts.length > 0) setShowSuggestions(true) }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); setSearchResults({ products: [], brands: [], categories: [] }) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {/* Autocomplete Dropdown — full-width on mobile, contained on desktop */}
            {showSuggestions && (
              <div className="fixed left-0 right-0 top-[60px] mx-2 sm:mx-0 sm:absolute sm:top-full sm:left-0 sm:right-0 sm:mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-[60] max-h-[70vh] sm:max-h-[420px] overflow-y-auto scrollbar-ultra-narrow">
                {searchLoading ? (
                  <div className="flex items-center gap-2 px-4 py-6 justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : searchQuery.trim().length < 2 && defaultProducts.length > 0 ? (
                  /* ── Default / Popular products when search is empty ── */
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-foreground">
            <Link href="/" className={router.pathname === '/' ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Home</Link>
            <Link href="/shop" className={router.pathname.startsWith('/shop') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Shop</Link>
            <Link href="/service" className={router.pathname.startsWith('/service') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Services</Link>
            <Link href="/orders" className={router.pathname.startsWith('/orders') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Orders</Link>
            <Link href="/wallet" className={router.pathname.startsWith('/wallet') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Wallet</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
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
              <Link
                href={`/login?redirect=${encodeURIComponent(router.asPath)}`}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3B6F] text-white text-sm font-medium hover:bg-[#152d55] transition-colors"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
            )}

            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(true)}
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
            <SheetTitle className="flex items-center gap-2.5 text-white">
              <Image
                src="https://ik.imagekit.io/aiwats/roadcare/fav.png"
                alt="Bharat Mechanics"
                width={36}
                height={36}
                className="h-9 w-9 object-contain rounded-lg"
              />
              <span className="font-bold text-lg">Bharat Mechanics</span>
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
                { icon: Wrench, label: 'Services', href: '/service' },
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
              <Link
                href={`/login?redirect=${encodeURIComponent(router.asPath)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B3B6F] text-white text-sm font-medium hover:bg-[#152d55] transition-colors"
              >
                <User className="h-4 w-4" />
                Login / Register
              </Link>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="https://ik.imagekit.io/aiwats/roadcare/fav.png"
                  alt="Bharat Mechanics"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain rounded-lg bg-white/5 p-1 ring-1 ring-white/10"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-extrabold tracking-tight text-white">Bharat Mechanics</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#FF6B35]">Auto Parts &amp; Service</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">India&apos;s trusted auto parts and vehicle service platform. Genuine parts, certified mechanics, doorstep delivery.</p>
            </div>
            {[
              { title: 'Quick Links', links: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Services', href: '/service' }, { label: 'Orders', href: '/orders' }] },
              { title: 'Customer Service', links: [{ label: 'Track Order', href: '/orders' }, { label: 'My Profile', href: '/profile' }, { label: 'Contact Us', href: '#' }] },
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
