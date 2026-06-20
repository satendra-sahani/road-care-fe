'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Search, Star, ShoppingCart, Package, ChevronLeft, ChevronRight, X,
  SlidersHorizontal, Heart, Truck, ShieldCheck, RotateCcw, CreditCard, Plus,
} from 'lucide-react'

export function ShopListing() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  // Filters
  const [searchQuery, setSearchQuery] = useState((router.query.search as string) || '')
  const [selectedCategory, setSelectedCategory] = useState((router.query.category as string) || '')
  const [selectedBrand, setSelectedBrand] = useState((router.query.brand as string) || '')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch categories and brands
  useEffect(() => {
    Promise.all([
      catalogAPI.getCategories(),
      catalogAPI.getBrands(),
    ]).then(([catRes, brandRes]) => {
      if (catRes.data.success) setCategories(catRes.data.data || [])
      if (brandRes.data.success) setBrands(brandRes.data.data || [])
    }).catch(() => {})
  }, [])

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bm_wishlist') || '[]')
      if (Array.isArray(saved)) setWishlist(new Set(saved))
    } catch {}
  }, [])

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(1)
  }, [selectedCategory, selectedBrand, sortBy, sortOrder])

  // Update from URL params
  useEffect(() => {
    if (router.query.search) setSearchQuery(router.query.search as string)
    if (router.query.category) setSelectedCategory(router.query.category as string)
    if (router.query.brand) setSelectedBrand(router.query.brand as string)
  }, [router.query])

  const fetchProducts = async (page: number) => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page,
        limit: 12,
        sortBy,
        sortOrder,
      }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (selectedCategory) params.category = selectedCategory
      if (selectedBrand) params.brand = selectedBrand
      if (priceRange[0] > 0) params.minPrice = priceRange[0]
      if (priceRange[1] < 50000) params.maxPrice = priceRange[1]

      const res = await catalogAPI.getProducts(params)
      if (res.data.success) {
        setProducts(res.data.data || [])
        // Backend returns pagination as { current, pages, total, limit }.
        // Older callers referenced { page, totalPages } — accept both shapes.
        const p = res.data.pagination || {}
        setPagination({
          page: p.current || p.page || 1,
          totalPages: p.pages || p.totalPages || 1,
          total: p.total || 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(1)
  }

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    try {
      const res = await userCartAPI.add(productId)
      if (res.data.success) toast.success('Added to cart!')
      else toast.error(res.data.message || 'Failed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem('bm_wishlist', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedBrand('')
    setPriceRange([0, 50000])
    setSortBy('createdAt')
    setSortOrder('desc')
    router.push('/shop', undefined, { shallow: true })
  }

  const hasActiveFilters = selectedCategory || selectedBrand || searchQuery || priceRange[0] > 0 || priceRange[1] < 50000
  const title = selectedCategory ? (categories.find((c) => c._id === selectedCategory)?.name || 'Spare Parts') : 'Genuine Spare Parts'

  const TRUST = [
    { icon: ShieldCheck, color: 'bg-[#E7F6F0] text-[#15936B]', title: '100% Genuine', desc: 'OEM with invoice' },
    { icon: Truck, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'Free Delivery', desc: 'On orders ₹499+' },
    { icon: RotateCcw, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: '7-Day Returns', desc: 'Easy & free' },
    { icon: CreditCard, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Secure Payment', desc: 'UPI · Cards · COD' },
  ]

  return (
    <UserLayout>
      {/* SHOP HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#2A5298] text-white">
        <div className="absolute -top-16 right-6 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.18),transparent_65%)]" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-9 md:py-11">
          <div className="flex items-center gap-1.5 text-[12.5px] text-white/70 mb-2.5">
            <Link href="/" className="hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-white">{title}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-white/75 text-sm md:text-base max-w-xl">OEM-grade parts from India&rsquo;s most trusted brands — delivered to your doorstep with verifiable GST invoices.</p>
          <div className="mt-5 flex items-center gap-5 md:gap-7">
            {[['50,000+', 'Parts in stock'], ['500+', 'Trusted brands'], ['4.8★', 'Avg. rating']].map(([v, l], i) => (
              <div key={l} className="flex items-center gap-5 md:gap-7">
                {i > 0 && <span className="h-8 w-px bg-white/15" />}
                <div><b className="block text-lg md:text-xl font-extrabold">{v}</b><span className="text-[11.5px] text-white/65">{l}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY SCROLLER */}
      <div className="bg-white border-b border-[#E7ECF3] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setSelectedCategory('')} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${!selectedCategory ? 'bg-[#1B3B6F] text-white' : 'bg-[#F2F6FC] text-[#475569] hover:bg-[#E8EEF7]'}`}>All</button>
          {categories.map((cat) => (
            <button key={cat._id} onClick={() => setSelectedCategory(cat._id)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat._id ? 'bg-[#1B3B6F] text-white' : 'bg-[#F2F6FC] text-[#475569] hover:bg-[#E8EEF7]'}`}>{cat.name}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* TRUST STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 bg-white border border-[#E7ECF3] rounded-2xl px-4 py-3.5 shadow-sm">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}><t.icon className="h-5 w-5" /></div>
              <div><b className="block text-[13.5px] text-[#13203A] leading-tight">{t.title}</b><span className="text-[11.5px] text-[#7B8AA3]">{t.desc}</span></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm text-[#475569]"><b className="text-[#13203A]">{pagination.total}</b> products found</p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex-1 sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </form>
            <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => { const [sb, so] = v.split('-'); setSortBy(sb); setSortOrder(so) }}>
              <SelectTrigger className="w-[160px] hidden sm:flex"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating-desc">Top Rated</SelectItem>
                <SelectItem value="popularity-desc">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto' : 'hidden'} lg:block lg:relative lg:w-60 shrink-0`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-3 text-[#13203A]">Categories</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  <button onClick={() => setSelectedCategory('')} className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-sm ${!selectedCategory ? 'bg-[#1B3B6F] text-white' : 'hover:bg-[#F2F6FC]'}`}>All Categories</button>
                  {categories.map((cat) => (
                    <button key={cat._id} onClick={() => setSelectedCategory(cat._id)} className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-sm truncate ${selectedCategory === cat._id ? 'bg-[#1B3B6F] text-white' : 'hover:bg-[#F2F6FC]'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3 text-[#13203A]">Brands</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  <button onClick={() => setSelectedBrand('')} className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-sm ${!selectedBrand ? 'bg-[#1B3B6F] text-white' : 'hover:bg-[#F2F6FC]'}`}>All Brands</button>
                  {brands.map((brand) => (
                    <button key={brand._id} onClick={() => setSelectedBrand(brand._id)} className={`block w-full text-left px-2.5 py-1.5 rounded-lg text-sm truncate ${selectedBrand === brand._id ? 'bg-[#1B3B6F] text-white' : 'hover:bg-[#F2F6FC]'}`}>{brand.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-3 text-[#13203A]">Price Range</h4>
                <Slider min={0} max={50000} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>₹{priceRange[0].toLocaleString()}</span><span>₹{priceRange[1].toLocaleString()}</span></div>
                <Button size="sm" className="w-full mt-2 bg-[#1B3B6F] hover:bg-[#15315C]" onClick={() => fetchProducts(1)}>Apply</Button>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}><X className="h-3 w-3 mr-1" /> Clear All Filters</Button>
              )}
            </div>
            {showFilters && (
              <Button className="w-full mt-6 lg:hidden bg-[#FF6B35] hover:bg-[#F2541B]" onClick={() => { setShowFilters(false); fetchProducts(1) }}>Apply Filters</Button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && <Badge variant="secondary" className="gap-1">Search: {searchQuery}<button onClick={() => { setSearchQuery(''); fetchProducts(1) }}><X className="h-3 w-3" /></button></Badge>}
                {selectedCategory && <Badge variant="secondary" className="gap-1">{categories.find((c) => c._id === selectedCategory)?.name}<button onClick={() => setSelectedCategory('')}><X className="h-3 w-3" /></button></Badge>}
                {selectedBrand && <Badge variant="secondary" className="gap-1">{brands.find((b) => b._id === selectedBrand)?.name}<button onClick={() => setSelectedBrand('')}><X className="h-3 w-3" /></button></Badge>}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E7ECF3] p-4 animate-pulse">
                    <div className="h-44 bg-gray-200 rounded-xl mb-4" /><div className="h-3 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-4 bg-gray-200 rounded w-full mb-2" /><div className="h-4 bg-gray-200 rounded w-2/3 mb-4" /><div className="h-10 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#13203A] mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => {
                    const price = product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0)
                    const mrp = product.mrp || product.price?.mrp || product.originalPrice || price
                    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
                    const image = product.thumbnail?.url || (typeof product.thumbnail === 'string' ? product.thumbnail : '') || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || ''
                    const qty = product.inventory?.quantity ?? product.quantity ?? 0
                    const inStock = qty > 0
                    const low = inStock && qty <= 5
                    const wished = wishlist.has(product._id)

                    return (
                      <div key={product._id} className="relative bg-white rounded-2xl border border-[#E7ECF3] overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
                        <button onClick={() => toggleWishlist(product._id)} aria-label="Wishlist" className={`absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full flex items-center justify-center ring-1 transition-colors ${wished ? 'bg-[#FFF1EB] ring-[#FF6B35]' : 'bg-white/90 ring-black/10 hover:ring-[#FF6B35]'}`}>
                          <Heart className={`h-4 w-4 ${wished ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-[#7B8AA3]'}`} />
                        </button>
                        <Link href={`/shop/${product._id}`} className="relative h-44 bg-[#F6F8FB] block">
                          {image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-14 w-14 text-gray-300" /></div>}
                          {discount > 0 && <span className="absolute top-2.5 left-2.5 bg-[#FF6B35] text-white text-[11px] font-extrabold px-2 py-1 rounded-md">{discount}% OFF</span>}
                          {inStock ? (
                            <span className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-1 rounded-full ${low ? 'bg-[#FEF3E2] text-[#D97706]' : 'bg-[#E7F6F0] text-[#15936B]'}`}><span className={`h-1.5 w-1.5 rounded-full ${low ? 'bg-[#D97706]' : 'bg-[#15936B]'}`} />{low ? 'Few left' : 'In stock'}</span>
                          ) : (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">Out of Stock</span></div>
                          )}
                        </Link>
                        <div className="p-4 flex flex-col flex-1">
                          {product.brand?.name && <div className="inline-flex self-start text-[11px] font-bold text-[#1B3B6F] bg-[#F2F6FC] px-2 py-0.5 rounded-md uppercase">{product.brand.name}</div>}
                          <Link href={`/shop/${product._id}`}><h3 className="font-semibold text-sm mt-1.5 line-clamp-2 text-[#13203A] hover:text-[#1B3B6F]">{product.name}</h3></Link>
                          {product.avgRating > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-[#475569]"><Star className="h-3.5 w-3.5 fill-[#F5A623] text-[#F5A623]" /> {product.avgRating.toFixed(1)} <span className="text-[#7B8AA3] font-medium">({product.reviewCount || 0})</span></div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11.5px] text-[#15936B] font-semibold mt-1.5"><Truck className="h-3.5 w-3.5" /> Free delivery</div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-extrabold text-lg text-[#13203A]">₹{price.toLocaleString()}</span>
                            {discount > 0 && <span className="text-sm text-[#7B8AA3] line-through">₹{mrp.toLocaleString()}</span>}
                          </div>
                          <div className="mt-auto pt-3">
                            <Button onClick={() => handleAddToCart(product._id)} disabled={!inStock} className={`w-full text-sm h-10 gap-1.5 rounded-lg ${inStock ? 'bg-[#FF6B35] hover:bg-[#F2541B] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                              {inStock ? <><Plus className="h-4 w-4" /> Add to Cart</> : 'Out of Stock'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchProducts(pagination.page + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
