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
  Search, Filter, Star, ShoppingCart, Package,
  ChevronLeft, ChevronRight, X, SlidersHorizontal,
} from 'lucide-react'

export function ShopListing() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

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

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  )

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {selectedCategory ? categories.find(c => c._id === selectedCategory)?.name || 'Shop' : 'All Products'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{pagination.total} products found</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex-1 sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Button variant="outline" className="sm:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
              const [sb, so] = v.split('-')
              setSortBy(sb)
              setSortOrder(so)
            }}>
              <SelectTrigger className="w-[160px] hidden sm:flex">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
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
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto' : 'hidden'} sm:block sm:relative sm:w-60 shrink-0`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
              </div>
            )}

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Categories</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`block w-full text-left px-2 py-1.5 rounded text-sm ${!selectedCategory ? 'bg-[#1B3B6F] text-white' : 'hover:bg-gray-100'}`}
                  >All Categories</button>
                  {categories.map(cat => (
                    <button key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`block w-full text-left px-2 py-1.5 rounded text-sm truncate ${selectedCategory === cat._id ? 'bg-[#1B3B6F] text-white' : 'hover:bg-gray-100'}`}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Brands</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedBrand('')}
                    className={`block w-full text-left px-2 py-1.5 rounded text-sm ${!selectedBrand ? 'bg-[#1B3B6F] text-white' : 'hover:bg-gray-100'}`}
                  >All Brands</button>
                  {brands.map(brand => (
                    <button key={brand._id}
                      onClick={() => setSelectedBrand(brand._id)}
                      className={`block w-full text-left px-2 py-1.5 rounded text-sm truncate ${selectedBrand === brand._id ? 'bg-[#1B3B6F] text-white' : 'hover:bg-gray-100'}`}
                    >{brand.name}</button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Price Range</h4>
                <Slider
                  min={0} max={50000} step={500}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
                <Button size="sm" className="w-full mt-2 bg-[#1B3B6F]" onClick={() => fetchProducts(1)}>Apply</Button>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> Clear All Filters
                </Button>
              )}
            </div>

            {showFilters && (
              <Button className="w-full mt-6 sm:hidden bg-[#FF6B35]" onClick={() => { setShowFilters(false); fetchProducts(1) }}>
                Apply Filters
              </Button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => { setSearchQuery(''); fetchProducts(1) }}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find(c => c._id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('')}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {selectedBrand && (
                  <Badge variant="secondary" className="gap-1">
                    {brands.find(b => b._id === selectedBrand)?.name}
                    <button onClick={() => setSelectedBrand('')}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
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
                    const inStock = (product.inventory?.quantity ?? product.quantity ?? 0) > 0

                    return (
                      <div key={product._id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 flex flex-col">
                        <Link href={`/shop/${product._id}`} className="relative h-48 bg-gray-100 block">
                          {image ? (
                            <img src={image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-300" />
                            </div>
                          )}
                          {discount > 0 && (
                            <Badge className="absolute top-3 left-3 bg-[#FF6B35] text-white border-none text-xs">-{discount}%</Badge>
                          )}
                          {!inStock && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">Out of Stock</span>
                            </div>
                          )}
                        </Link>
                        <div className="p-4 flex flex-col flex-1">
                          {product.brand?.name && <p className="text-xs font-semibold text-[#FF6B35] uppercase">{product.brand.name}</p>}
                          <Link href={`/shop/${product._id}`}>
                            <h3 className="font-semibold text-sm mt-1 line-clamp-2 hover:text-[#1B3B6F]">{product.name}</h3>
                          </Link>
                          {product.avgRating > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {renderStars(product.avgRating)}
                              <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
                            {discount > 0 && <span className="text-sm text-muted-foreground line-through">₹{mrp.toLocaleString()}</span>}
                          </div>
                          <div className="mt-auto pt-3">
                            <Button
                              onClick={() => handleAddToCart(product._id)}
                              className={`w-full text-sm h-10 ${inStock ? 'bg-[#FF6B35] hover:bg-[#e55a2a] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              disabled={!inStock}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              {inStock ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                      onClick={() => fetchProducts(pagination.page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchProducts(pagination.page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
