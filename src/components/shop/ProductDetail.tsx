'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  ArrowLeft,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Award,
  CheckCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

// Mock product data
const mockProduct = {
  id: 'PRD-001',
  name: 'Premium Brake Pads Set - Front',
  brand: 'Bosch',
  category: 'Brakes',
  price: 3499,
  originalPrice: 4299,
  rating: 4.8,
  reviews: 156,
  images: [
    '/products/brake-pads-1.jpg',
    '/products/brake-pads-2.jpg',
    '/products/brake-pads-3.jpg',
    '/products/brake-pads-4.jpg'
  ],
  inStock: true,
  stockCount: 23,
  isPopular: true,
  tags: ['genuine', 'warranty', 'fast-delivery'],
  description: 'High-performance brake pads designed for superior stopping power and durability. These genuine OEM brake pads are manufactured to the highest standards and provide exceptional braking performance in all weather conditions.',
  features: [
    'Superior stopping power in all weather conditions',
    'Low dust formula keeps wheels cleaner',
    'Reduced brake noise and vibration',
    'Extended pad life for better value',
    'OEM quality materials and construction',
    'Rigorous testing for safety and performance'
  ],
  specifications: {
    'Part Number': 'BP-001-BOSCH',
    'Compatibility': 'Honda City, Civic, Accord (2018-2024)',
    'Material': 'Ceramic Composite',
    'Position': 'Front Axle',
    'Package': 'Set of 4 Pads',
    'Weight': '2.5 kg',
    'Warranty': '2 Years or 40,000 km',
    'Country of Origin': 'Germany'
  },
  compatibleVehicles: [
    { make: 'Honda', model: 'City', years: '2018-2024' },
    { make: 'Honda', model: 'Civic', years: '2019-2024' },
    { make: 'Honda', model: 'Accord', years: '2020-2024' }
  ],
  delivery: {
    standard: { days: '3-5', price: 99 },
    express: { days: '1-2', price: 199 },
    premium: { days: 'Same Day', price: 299 }
  },
  seller: {
    name: 'Road Care Auto Parts',
    rating: 4.9,
    reviews: 2847,
    since: '2019'
  }
}

const mockReviews = [
  {
    id: 'REV-001',
    user: {
      name: 'Rajesh Kumar',
      avatar: '/avatars/user1.png',
      verified: true
    },
    rating: 5,
    title: 'Excellent quality brake pads',
    comment: 'These brake pads are fantastic! Much better stopping power than the previous ones I had. Installation was smooth and they fit perfectly on my Honda City.',
    date: '2026-02-08',
    helpful: 12,
    verified: true
  },
  {
    id: 'REV-002',
    user: {
      name: 'Priya Sharma',
      avatar: '/avatars/user2.png',
      verified: true
    },
    rating: 4,
    title: 'Good value for money',
    comment: 'Quality is good and delivery was on time. The pads work well and there is noticeably less dust compared to my old ones. Would recommend.',
    date: '2026-02-05',
    helpful: 8,
    verified: true
  },
  {
    id: 'REV-003',
    user: {
      name: 'Amit Singh',
      avatar: '/avatars/user3.png',
      verified: false
    },
    rating: 5,
    title: 'Perfect fit and performance',
    comment: 'Installed these on my Civic and they work perfectly. Great braking performance and the quality seems very good. Fast shipping too!',
    date: '2026-02-01',
    helpful: 15,
    verified: true
  }
]

interface ProductDetailProps {
  productId: string
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedDelivery, setSelectedDelivery] = useState('standard')
  const [isWishlisted, setIsWishlisted] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDiscountPercentage = () => {
    return Math.round(((mockProduct.originalPrice - mockProduct.price) / mockProduct.originalPrice) * 100)
  }

  const getRatingBreakdown = () => {
    return [
      { stars: 5, count: 95, percentage: 61 },
      { stars: 4, count: 38, percentage: 24 },
      { stars: 3, count: 15, percentage: 10 },
      { stars: 2, count: 5, percentage: 3 },
      { stars: 1, count: 3, percentage: 2 }
    ]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-[#6B7280] mb-6">
        <Link href="/shop" className="hover:text-[#1B3B6F]">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${mockProduct.category}`} className="hover:text-[#1B3B6F]">
          {mockProduct.category}
        </Link>
        <span>/</span>
        <span className="text-[#1A1D29]">{mockProduct.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={mockProduct.images[selectedImage]}
              alt={mockProduct.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.png'
              }}
            />
          </div>

          {/* Thumbnail Images */}
          <div className="flex space-x-2">
            {mockProduct.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-[#1B3B6F]' : 'border-gray-200'
                }`}
              >
                <img
                  src={image}
                  alt={`${mockProduct.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.png'
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary">{mockProduct.brand}</Badge>
              {mockProduct.isPopular && (
                <Badge className="bg-[#FF6B35] text-white">Popular</Badge>
              )}
              {mockProduct.tags.includes('genuine') && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Genuine
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1D29] mb-2">
              {mockProduct.name}
            </h1>
            
            <p className="text-[#6B7280] mb-4">
              {mockProduct.description}
            </p>
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.floor(mockProduct.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-medium">{mockProduct.rating}</span>
            <span className="text-[#6B7280]">({mockProduct.reviews} reviews)</span>
            <Link href="#reviews" className="text-[#1B3B6F] hover:underline">
              See all reviews
            </Link>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-[#1A1D29]">
              {formatCurrency(mockProduct.price)}
            </span>
            <span className="text-xl text-[#6B7280] line-through">
              {formatCurrency(mockProduct.originalPrice)}
            </span>
            <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
              {getDiscountPercentage()}% OFF
            </Badge>
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {mockProduct.inStock ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">In Stock</span>
                <span className="text-[#6B7280]">({mockProduct.stockCount} available)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Quantity Selection */}
          <div className="flex items-center space-x-4">
            <span className="font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.min(mockProduct.stockCount, quantity + 1))}
                disabled={quantity >= mockProduct.stockCount}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-[#1B3B6F] hover:bg-[#0F2545] text-lg py-6"
                disabled={!mockProduct.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart - {formatCurrency(mockProduct.price * quantity)}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="px-6 py-6"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="lg" className="px-6 py-6">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            <Button variant="outline" className="w-full text-lg py-6">
              Buy Now
            </Button>
          </div>

          {/* Delivery Options */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Delivery Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(mockProduct.delivery).map(([key, option]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="delivery"
                      value={key}
                      checked={selectedDelivery === key}
                      onChange={(e) => setSelectedDelivery(e.target.value)}
                      className="text-[#1B3B6F]"
                    />
                    <div>
                      <p className="font-medium capitalize">{key} Delivery</p>
                      <p className="text-sm text-[#6B7280]">{option.days} business days</p>
                    </div>
                  </div>
                  <span className="font-medium">{formatCurrency(option.price)}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Sold by {mockProduct.seller.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{mockProduct.seller.rating}</span>
                  </div>
                  <span className="text-[#6B7280]">({mockProduct.seller.reviews} reviews)</span>
                  <span className="text-[#6B7280]">• Since {mockProduct.seller.since}</span>
                </div>
                <Button variant="outline" size="sm">
                  View Seller
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 text-[#1B3B6F] mx-auto mb-2" />
              <p className="text-sm font-medium">Genuine Products</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <RotateCcw className="h-8 w-8 text-[#1B3B6F] mx-auto mb-2" />
              <p className="text-sm font-medium">Easy Returns</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Award className="h-8 w-8 text-[#1B3B6F] mx-auto mb-2" />
              <p className="text-sm font-medium">2 Year Warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="details" className="mb-12">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Product Features</h3>
              <ul className="space-y-3">
                {mockProduct.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Technical Specifications</h3>
              <div className="space-y-3">
                {Object.entries(mockProduct.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium">{key}</span>
                    <span className="text-[#6B7280]">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compatibility" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Vehicle Compatibility</h3>
              <div className="space-y-4">
                {mockProduct.compatibleVehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm text-[#6B7280]">Model Years: {vehicle.years}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6" id="reviews">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rating Summary */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2">{mockProduct.rating}</div>
                  <div className="flex items-center justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.floor(mockProduct.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[#6B7280]">{mockProduct.reviews} reviews</p>
                </div>

                <div className="space-y-2">
                  {getRatingBreakdown().map((rating) => (
                    <div key={rating.stars} className="flex items-center space-x-2">
                      <span className="text-sm w-8">{rating.stars}★</span>
                      <Progress value={rating.percentage} className="flex-1 h-2" />
                      <span className="text-sm text-[#6B7280] w-8">{rating.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {mockReviews.map((review) => (
                <Card key={review.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.user.avatar} />
                          <AvatarFallback>
                            {review.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{review.user.name}</p>
                            {review.user.verified && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280]">{formatDate(review.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h4 className="font-medium mb-2">{review.title}</h4>
                    <p className="text-[#6B7280] mb-3">{review.comment}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {review.verified && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <span className="text-sm">Helpful ({review.helpful})</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}