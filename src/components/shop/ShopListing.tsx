'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star,
  ShoppingCart,
  Heart,
  Eye,
  ChevronDown,
  Package,
  TrendingUp,
  Award
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

// Mock products data
const mockProducts = [
  {
    id: 'PRD-001',
    name: 'Premium Brake Pads Set - Front',
    brand: 'Bosch',
    category: 'Brakes',
    price: 3499,
    originalPrice: 4299,
    rating: 4.8,
    reviews: 156,
    image: '/products/brake-pads-1.jpg',
    inStock: true,
    stockCount: 23,
    isPopular: true,
    tags: ['genuine', 'warranty', 'fast-delivery'],
    description: 'High-performance brake pads designed for superior stopping power and durability.',
    specifications: {
      compatibility: 'Honda City, Civic, Accord',
      material: 'Ceramic',
      warranty: '2 Years'
    }
  },
  {
    id: 'PRD-002',
    name: 'Engine Oil Filter - Premium Quality',
    brand: 'Mann-Filter',
    category: 'Engine Parts',
    price: 849,
    originalPrice: 1099,
    rating: 4.7,
    reviews: 89,
    image: '/products/oil-filter-1.jpg',
    inStock: true,
    stockCount: 45,
    isPopular: false,
    tags: ['oem', 'premium'],
    description: 'OEM quality oil filter for optimal engine performance and protection.',
    specifications: {
      compatibility: 'Maruti Swift, Baleno, Vitara',
      type: 'Spin-on',
      warranty: '1 Year'
    }
  },
  {
    id: 'PRD-003',
    name: 'LED Headlight Bulbs - H4 Type',
    brand: 'Philips',
    category: 'Lighting',
    price: 2299,
    originalPrice: 2799,
    rating: 4.9,
    reviews: 234,
    image: '/products/led-headlight-1.jpg',
    inStock: false,
    stockCount: 0,
    isPopular: true,
    tags: ['led', 'bright', 'energy-efficient'],
    description: 'Ultra-bright LED headlight bulbs with 200% more light output.',
    specifications: {
      compatibility: 'Universal H4 socket',
      power: '36W',
      warranty: '3 Years'
    }
  },
  {
    id: 'PRD-004',
    name: 'Air Filter - High Flow Performance',
    brand: 'K&N',
    category: 'Air Filters',
    price: 1899,
    originalPrice: 2199,
    rating: 4.6,
    reviews: 67,
    image: '/products/air-filter-1.jpg',
    inStock: true,
    stockCount: 12,
    isPopular: false,
    tags: ['performance', 'washable'],
    description: 'High-flow air filter for improved engine performance and fuel efficiency.',
    specifications: {
      compatibility: 'Hyundai i20, Verna, Creta',
      type: 'Panel Filter',
      warranty: '10 Years'
    }
  }
]

const categories = [
  'All Categories',
  'Engine Parts',
  'Brakes',
  'Lighting',
  'Air Filters',
  'Suspension',
  'Electrical',
  'Body Parts',
  'Accessories'
]

const brands = [
  'All Brands',
  'Bosch',
  'Mann-Filter',
  'Philips',
  'K&N',
  'Monroe',
  'NGK',
  'Continental',
  'Mahle'
]

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' }
]

interface ShopListingProps {
  category?: string
  searchQuery?: string
}

export function ShopListing({ category, searchQuery }: ShopListingProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState(searchQuery || '')
  const [selectedCategory, setSelectedCategory] = useState(category || 'All Categories')
  const [selectedBrand, setSelectedBrand] = useState('All Brands')
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [sortBy, setSortBy] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [showOnlyPopular, setShowOnlyPopular] = useState(false)

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory
      const matchesBrand = selectedBrand === 'All Brands' || product.brand === selectedBrand
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      const matchesStock = !showOnlyInStock || product.inStock
      const matchesPopular = !showOnlyPopular || product.isPopular

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesStock && matchesPopular
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'popular':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
        default:
          return 0
      }
    })
  }, [searchTerm, selectedCategory, selectedBrand, priceRange, sortBy, showOnlyInStock, showOnlyPopular])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDiscountPercentage = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Auto Parts Shop</h1>
          <p className="text-[#6B7280] mt-1">
            {filteredProducts.length} products found
            {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="w-80 space-y-6">
          {/* Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedCategory === cat}
                    onCheckedChange={() => setSelectedCategory(cat)}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Brand Filter */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Brands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {brands.slice(0, 8).map((brand) => (
                <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedBrand === brand}
                    onCheckedChange={() => setSelectedBrand(brand)}
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Price Range */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Price Range</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000}
                min={0}
                step={100}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-[#6B7280]">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Filters */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={showOnlyInStock}
                  onCheckedChange={(checked) => setShowOnlyInStock(checked === true)}
                />
                <span className="text-sm">In Stock Only</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={showOnlyPopular}
                  onCheckedChange={(checked) => setShowOnlyPopular(checked === true)}
                />
                <span className="text-sm">Popular Items</span>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No products found</h3>
                <p className="text-[#6B7280]">Try adjusting your search criteria or filters</p>
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('All Categories')
                    setSelectedBrand('All Brands')
                    setPriceRange([0, 10000])
                    setShowOnlyInStock(false)
                    setShowOnlyPopular(false)
                  }}
                  className="mt-4 bg-[#1B3B6F] hover:bg-[#0F2545]"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredProducts.map((product) => (
                <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  {viewMode === 'grid' ? (
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.png'
                          }}
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 space-y-1">
                          {product.isPopular && (
                            <Badge className="bg-[#FF6B35] text-white">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          {!product.inStock && (
                            <Badge className="bg-red-100 text-red-800">
                              Out of Stock
                            </Badge>
                          )}
                          {product.originalPrice > product.price && (
                            <Badge className="bg-green-100 text-green-800">
                              {getDiscountPercentage(product.originalPrice, product.price)}% OFF
                            </Badge>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute top-2 right-2 space-y-1">
                          <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Link href={`/shop/${product.id}`}>
                            <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.brand}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium text-[#1A1D29] mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.floor(product.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-[#6B7280]">
                            {product.rating} ({product.reviews})
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-[#1A1D29]">
                              {formatCurrency(product.price)}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-sm text-[#6B7280] line-through">
                                {formatCurrency(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          {product.inStock && (
                            <span className="text-xs text-green-600">
                              {product.stockCount} in stock
                            </span>
                          )}
                        </div>

                        <Button
                          className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]"
                          disabled={!product.inStock}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                      </CardContent>
                    </div>
                  ) : (
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        {/* Product Image */}
                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="secondary" className="text-xs mb-1">
                                {product.brand}
                              </Badge>
                              <h3 className="font-medium text-[#1A1D29] mb-1">
                                {product.name}
                              </h3>
                              <p className="text-sm text-[#6B7280] line-clamp-2">
                                {product.description}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="ghost">
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Link href={`/shop/${product.id}`}>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= Math.floor(product.rating)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-[#6B7280]">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-[#1A1D29]">
                                {formatCurrency(product.price)}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-sm text-[#6B7280] line-through">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              )}
                              {product.originalPrice > product.price && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {getDiscountPercentage(product.originalPrice, product.price)}% OFF
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-3">
                              {product.inStock ? (
                                <span className="text-xs text-green-600">
                                  {product.stockCount} in stock
                                </span>
                              ) : (
                                <span className="text-xs text-red-600">
                                  Out of stock
                                </span>
                              )}
                              <Button
                                className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                                disabled={!product.inStock}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}