'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { catalogAPI, userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import {
  Star, ShoppingCart, Minus, Plus, Package, Truck, ShieldCheck, RotateCcw,
  Check, Loader2, ChevronRight, Heart,
} from 'lucide-react'

export function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { isAuthenticated } = useSelector((state: RootState) => state.customerAuth)
  const { openLogin } = useLoginModal()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [wished, setWished] = useState(false)

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

  useEffect(() => {
    if (!product?._id) return
    try {
      const w = JSON.parse(localStorage.getItem('bm_wishlist') || '[]')
      setWished(Array.isArray(w) && w.includes(product._id))
    } catch {}
  }, [product?._id])

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
      openLogin()
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
      openLogin()
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
      openLogin()
      return
    }
    setSubmittingReview(true)
    try {
      const res = await catalogAPI.addReview(id as string, { rating: reviewRating, comment: reviewComment })
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

  const toggleWish = () => {
    if (!product?._id) return
    try {
      const w = JSON.parse(localStorage.getItem('bm_wishlist') || '[]')
      const set = new Set<string>(Array.isArray(w) ? w : [])
      if (set.has(product._id)) set.delete(product._id)
      else set.add(product._id)
      localStorage.setItem('bm_wishlist', JSON.stringify([...set]))
      const now = set.has(product._id)
      setWished(now)
      toast.success(now ? 'Added to wishlist' : 'Removed from wishlist')
    } catch {}
  }

  const renderStars = (rating: number, size = 'h-4 w-4') => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-gray-300'}`} />
      ))}
    </div>
  )

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" /><div className="h-8 bg-gray-200 rounded w-2/3" /><div className="h-6 bg-gray-200 rounded w-1/2" /><div className="h-12 bg-gray-200 rounded w-1/3" /><div className="h-40 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  if (!product) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
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
  const comingSoon = !!product.comingSoon
  const inStock = stockQty > 0
  const ratingVal = product.avgRating || 0
  const reviewCount = product.reviewCount || reviews.length
  const dist = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => Math.round(r.rating) === s).length)
  const distTotal = reviews.length || 1

  const TRUST = [
    { icon: ShieldCheck, label: 'Genuine & OEM', color: 'text-[#15936B] bg-[#E7F6F0]' },
    { icon: RotateCcw, label: '7-day returns', color: 'text-[#FF6B35] bg-[#FFF1EB]' },
    { icon: Truck, label: 'Free delivery ₹500+', color: 'text-[#1B3B6F] bg-[#F2F6FC]' },
    { icon: Check, label: 'Warranty included', color: 'text-[#7C3AED] bg-[#F1EBFE]' },
  ]

  return (
    <UserLayout>
      <div className="bg-[#F6F8FB] min-h-screen pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12.5px] text-[#7B8AA3] mb-4">
            <Link href="/" className="hover:text-[#1B3B6F]">Home</Link><ChevronRight className="h-3.5 w-3.5" />
            <Link href="/shop" className="hover:text-[#1B3B6F]">Shop</Link><ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#13203A] truncate max-w-[180px]">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            {/* Gallery */}
            <div className="lg:sticky lg:top-24">
              <div className="relative bg-white rounded-2xl border border-[#E7ECF3] overflow-hidden aspect-square">
                {images.length > 0 ? (
                  <img src={images[selectedImage] || images[0]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="h-24 w-24 text-gray-300" /></div>
                )}
                {discount > 0 && <span className="absolute top-4 left-4 bg-[#FF6B35] text-white text-sm font-extrabold px-2.5 py-1 rounded-md">{discount}% OFF</span>}
                <button onClick={toggleWish} aria-label="Wishlist" className={`absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center ring-1 transition-colors ${wished ? 'bg-[#FFF1EB] ring-[#FF6B35]' : 'bg-white/90 ring-black/10 hover:ring-[#FF6B35]'}`}>
                  <Heart className={`h-5 w-5 ${wished ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-[#7B8AA3]'}`} />
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto mt-3 scrollbar-hide">
                  {images.map((img: string, idx: number) => (
                    <button key={idx} onClick={() => setSelectedImage(idx)} className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-white ${selectedImage === idx ? 'border-[#FF6B35]' : 'border-[#E7ECF3]'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-sm p-5 md:p-6">
              {product.brand?.name && (
                <Link href={`/shop?brand=${product.brand._id}`} className="text-[12px] font-bold text-[#7B8AA3] uppercase tracking-[0.04em] hover:text-[#1B3B6F]">{product.brand.name}</Link>
              )}
              <h1 className="text-xl md:text-[26px] font-extrabold text-[#13203A] leading-tight mt-1.5 mb-3">{product.name}</h1>

              {ratingVal > 0 && (
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="inline-flex items-center gap-1 bg-[#E7F6F0] text-[#15936B] text-[13px] font-bold px-2 py-0.5 rounded-md">{ratingVal.toFixed(1)} ★</span>
                  <span className="text-[13px] text-[#7B8AA3]">{reviewCount} ratings</span>
                </div>
              )}

              <div className="flex items-baseline gap-2.5">
                <span className="text-[26px] md:text-[30px] font-extrabold text-[#13203A]">₹{price.toLocaleString('en-IN')}</span>
                {discount > 0 && <span className="text-base text-[#7B8AA3] line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                {discount > 0 && <span className="text-[#15936B] font-bold text-sm">{discount}% off</span>}
              </div>
              <p className="text-[12.5px] text-[#7B8AA3] mt-0.5">Inclusive of all taxes</p>

              <div className="mt-3.5">
                {comingSoon ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5B6B85] bg-[#EEF2F7] px-2.5 py-1 rounded-full">Coming soon</span>
                ) : inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#15936B] bg-[#E7F6F0] px-2.5 py-1 rounded-full"><Check className="h-3.5 w-3.5" /> In stock ({stockQty} available)</span>
                ) : (
                  <span className="inline-flex items-center text-[13px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Out of stock</span>
                )}
              </div>

              {!comingSoon && inStock && (
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-sm font-medium text-[#475569]">Quantity</span>
                  <div className="flex items-center border border-[#E7ECF3] rounded-lg">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-[#1B3B6F] hover:bg-[#F2F6FC] rounded-l-lg"><Minus className="h-4 w-4" /></button>
                    <span className="px-4 py-2 font-bold border-x border-[#E7ECF3] min-w-[48px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity((q) => Math.min(stockQty, q + 1))} className="px-3 py-2 text-[#1B3B6F] hover:bg-[#F2F6FC] rounded-r-lg"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              )}

              {/* Desktop actions */}
              {comingSoon ? (
                <div className="hidden lg:flex mt-5">
                  <div className="flex-1 h-12 rounded-md bg-[#EEF2F7] text-[#5B6B85] font-semibold flex items-center justify-center cursor-not-allowed">Coming Soon</div>
                </div>
              ) : inStock && (
                <div className="hidden lg:flex gap-3 mt-5">
                  <Button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 h-12 bg-white hover:bg-[#F2F6FC] text-[#1B3B6F] border border-[#1B3B6F] gap-2">
                    {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} Add to cart
                  </Button>
                  <Button onClick={handleBuyNow} disabled={addingToCart} className="flex-[1.3] h-12 bg-[#FF6B35] hover:bg-[#F2541B] text-white">Buy now</Button>
                </div>
              )}

              {/* Trust grid */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[#EFF2F7]">
                {TRUST.map((t) => (
                  <div key={t.label} className="flex items-center gap-2.5 text-sm font-medium text-[#475569]">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}><t.icon className="h-4 w-4" /></div>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-sm p-5 md:p-6 mt-6">
              <h2 className="text-lg font-extrabold text-[#13203A] mb-3">Description</h2>
              <p className="text-[#475569] whitespace-pre-line leading-relaxed text-sm">{product.description}</p>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-sm p-5 md:p-6 mt-6">
              <h2 className="text-lg font-extrabold text-[#13203A] mb-3">Specifications</h2>
              <div className="rounded-xl overflow-hidden border border-[#EFF2F7]">
                {Object.entries(product.specifications).map(([key, value]: [string, any]) => {
                  if (key === 'custom' && Array.isArray(value)) return null
                  if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const display = value.value != null && value.unit ? `${value.value} ${value.unit}` : JSON.stringify(value)
                    return (
                      <div key={key} className="flex py-2.5 px-4 odd:bg-[#F6F8FB]">
                        <span className="w-1/3 text-sm font-semibold text-[#13203A] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm text-[#475569]">{display}</span>
                      </div>
                    )
                  }
                  if (value == null || value === '') return null
                  return (
                    <div key={key} className="flex py-2.5 px-4 odd:bg-[#F6F8FB]">
                      <span className="w-1/3 text-sm font-semibold text-[#13203A] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm text-[#475569]">{String(value)}</span>
                    </div>
                  )
                })}
                {Array.isArray(product.specifications.custom) && product.specifications.custom.map((item: any, idx: number) => (
                  item.key && item.value ? (
                    <div key={`custom-${idx}`} className="flex py-2.5 px-4 odd:bg-[#F6F8FB]">
                      <span className="w-1/3 text-sm font-semibold text-[#13203A] capitalize">{item.key}</span>
                      <span className="text-sm text-[#475569]">{item.value}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Ratings & reviews */}
          <div className="bg-white rounded-2xl border border-[#E7ECF3] shadow-sm p-5 md:p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#13203A]">Ratings &amp; reviews</h2>
              {isAuthenticated && <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>Write a review</Button>}
            </div>

            {/* Breakdown */}
            <div className="flex items-center gap-5 pb-4 mb-4 border-b border-[#EFF2F7]">
              <div className="text-center shrink-0">
                <div className="text-4xl font-extrabold text-[#13203A]">{ratingVal.toFixed(1)}</div>
                {renderStars(ratingVal, 'h-4 w-4')}
                <div className="text-[11px] text-[#7B8AA3] mt-1">{reviewCount} ratings</div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] w-2 text-[#7B8AA3]">{s}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#EFF2F7] overflow-hidden"><div className="h-full bg-[#F5A623]" style={{ width: `${Math.round((dist[i] / distTotal) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {showReviewForm && (
              <div className="bg-[#F6F8FB] rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Your rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)}>
                        <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea placeholder="Write your review..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mb-3 bg-white" rows={3} />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-[#1B3B6F] hover:bg-[#15315C]">{submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Submit review</Button>
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-[#7B8AA3] text-center py-8">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="divide-y divide-[#EFF2F7]">
                {reviews.map((review, idx) => (
                  <div key={review._id || idx} className="py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-xs font-bold">{(review.user?.fullName || 'U')[0].toUpperCase()}</div>
                        <div><p className="text-sm font-semibold text-[#13203A]">{review.user?.fullName || 'Anonymous'}</p>{renderStars(review.rating, 'h-3 w-3')}</div>
                      </div>
                      <span className="text-xs text-[#7B8AA3]">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    {review.title && <p className="font-medium text-sm mt-2 text-[#13203A]">{review.title}</p>}
                    {review.comment && <p className="text-sm text-[#475569] mt-1">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky buy bar (mobile) */}
        {comingSoon ? (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7ECF3] px-4 py-3 z-30">
            <div className="w-full h-12 rounded-md bg-[#EEF2F7] text-[#5B6B85] font-semibold flex items-center justify-center cursor-not-allowed">Coming Soon</div>
          </div>
        ) : inStock && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7ECF3] px-4 py-3 flex gap-2.5 z-30">
            <Button onClick={handleAddToCart} disabled={addingToCart} className="flex-1 h-12 bg-white hover:bg-[#F2F6FC] text-[#1B3B6F] border border-[#1B3B6F] gap-2">
              {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} Add to cart
            </Button>
            <Button onClick={handleBuyNow} disabled={addingToCart} className="flex-[1.3] h-12 bg-[#FF6B35] hover:bg-[#F2541B] text-white">Buy now</Button>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
