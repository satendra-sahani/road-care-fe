'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Star, ShoppingCart, Minus, Plus,
  Package, Truck, Shield, RotateCcw, Check, Loader2,
} from 'lucide-react'

export function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Reviews
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchProduct()
    fetchReviews()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await catalogAPI.getProduct(id as string)
      if (res.data.success) setProduct(res.data.data)
    } catch (err) {
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await catalogAPI.getReviews(id as string, { limit: 10 })
      if (res.data.success) setReviews(res.data.data || [])
    } catch (err) {
      // Reviews might not exist yet
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    setAddingToCart(true)
    try {
      const res = await userCartAPI.add(product._id, quantity)
      if (res.data.success) toast.success(`Added ${quantity} item(s) to cart!`)
      else toast.error(res.data.message || 'Failed')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    setAddingToCart(true)
    try {
      await userCartAPI.add(product._id, quantity)
      router.push('/checkout')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath))
      return
    }
    setSubmittingReview(true)
    try {
      const res = await catalogAPI.addReview(id as string, {
        rating: reviewRating,
        comment: reviewComment,
      })
      if (res.data.success) {
        toast.success('Review submitted!')
        setShowReviewForm(false)
        setReviewComment('')
        setReviewRating(5)
        fetchReviews()
        fetchProduct()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderStars = (rating: number, size = 'h-4 w-4') => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  )

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded w-1/3" />
              <div className="h-40 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (!product) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product not found</h2>
          <Link href="/shop"><Button variant="outline">Back to Shop</Button></Link>
        </div>
      </UserLayout>
    )
  }

  const price = product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0)
  const mrp = product.mrp || product.price?.mrp || product.originalPrice || price
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const images = product.images?.map((img: any) => (typeof img === 'string' ? img : img.url) || '') || []
  if (product.thumbnail?.url && !images.includes(product.thumbnail.url)) images.unshift(product.thumbnail.url)
  const stockQty = product.inventory?.quantity ?? product.quantity ?? 0
  const inStock = stockQty > 0

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative h-80 sm:h-96 bg-gray-100 rounded-xl overflow-hidden mb-4">
              {images.length > 0 ? (
                <img src={images[selectedImage] || images[0]} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-300" />
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-[#FF6B35] text-white text-sm px-3 py-1">-{discount}% OFF</Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${selectedImage === idx ? 'border-[#FF6B35]' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.brand?.name && (
              <Link href={`/shop?brand=${product.brand._id}`}>
                <Badge variant="outline" className="text-[#FF6B35] border-[#FF6B35] mb-2">{product.brand.name}</Badge>
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{product.name}</h1>

            {product.avgRating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                {renderStars(product.avgRating)}
                <span className="text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-foreground">₹{price.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">₹{mrp.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Save ₹{(mrp - price).toLocaleString()}</Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              {inStock ? (
                <Badge className="bg-green-100 text-green-700"><Check className="h-3 w-3 mr-1" /> In Stock ({stockQty} available)</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
              )}
            </div>

            <Separator className="my-4" />

            {/* Quantity + Actions */}
            {inStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 font-medium border-x">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(stockQty, q + 1))} className="px-3 py-2 hover:bg-gray-100">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 bg-[#1B3B6F] hover:bg-[#152d55] text-white h-12">
                    {addingToCart ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                    Add to Cart
                  </Button>
                  <Button onClick={handleBuyNow} disabled={addingToCart} className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2a] text-white h-12">
                    Buy Now
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', desc: 'On orders above ₹500' },
                { icon: Shield, label: 'Genuine Parts', desc: '100% authentic' },
                { icon: RotateCcw, label: 'Easy Returns', desc: '7 day return policy' },
                { icon: Check, label: 'Warranty', desc: 'Manufacturer warranty' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <feat.icon className="h-4 w-4 text-[#FF6B35] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{feat.label}</p>
                    <p className="text-xs text-muted-foreground">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Specifications</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              {Object.entries(product.specifications).map(([key, value]: [string, any]) => {
                // Skip custom array - render its items separately below
                if (key === 'custom' && Array.isArray(value)) return null
                // Handle object values like weight: { value, unit }
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  const display = value.value != null && value.unit ? `${value.value} ${value.unit}` : JSON.stringify(value)
                  return (
                    <div key={key} className="flex py-2 border-b last:border-0">
                      <span className="w-1/3 text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm text-muted-foreground">{display}</span>
                    </div>
                  )
                }
                // Skip empty/null values
                if (value == null || value === '') return null
                return (
                  <div key={key} className="flex py-2 border-b last:border-0">
                    <span className="w-1/3 text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                  </div>
                )
              })}
              {/* Render custom specifications as key-value pairs */}
              {Array.isArray(product.specifications.custom) && product.specifications.custom.map((item: any, idx: number) => (
                item.key && item.value ? (
                  <div key={`custom-${idx}`} className="flex py-2 border-b last:border-0">
                    <span className="w-1/3 text-sm font-medium capitalize">{item.key}</span>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Reviews ({reviews.length})</h2>
            {isAuthenticated && (
              <Button variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}>
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Write your review..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-[#1B3B6F]">
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Review
                </Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={review._id || idx} className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-xs font-bold">
                        {(review.user?.fullName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.user?.fullName || 'Anonymous'}</p>
                        {renderStars(review.rating, 'h-3 w-3')}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
