'use client'

import { useState, useEffect, useCallback } from 'react'
import { userReviewAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Star, Edit, Trash2, Loader2, ShoppingBag, MessageSquare,
} from 'lucide-react'

interface Review {
  _id: string
  product: {
    name: string
    images: string[]
  }
  rating: number
  comment: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

function StarRating({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number
  interactive?: boolean
  onChange?: (rating: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userReviewAPI.getMyReviews()
      if (res.data.success) {
        setReviews(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditComment(review.comment)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingReview(null)
    setEditRating(0)
    setEditComment('')
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return
    if (editRating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!editComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSaving(true)
    try {
      const res = await userReviewAPI.update(editingReview._id, {
        rating: editRating,
        comment: editComment.trim(),
      })
      if (res.data.success) {
        toast.success('Review updated successfully')
        setReviews(prev =>
          prev.map(r =>
            r._id === editingReview._id
              ? { ...r, rating: editRating, comment: editComment.trim() }
              : r
          )
        )
        closeEditModal()
      } else {
        toast.error(res.data.message || 'Failed to update review')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    setDeletingId(id)
    try {
      const res = await userReviewAPI.delete(id)
      if (res.data.success) {
        toast.success('Review deleted')
        setReviews(prev => prev.filter(r => r._id !== id))
      } else {
        toast.error(res.data.message || 'Failed to delete review')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Reviews</h1>
          {reviews.length > 0 && (
            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-[#1B3B6F] text-white text-xs font-bold">
              {reviews.length}
            </span>
          )}
        </div>

        {/* Empty State */}
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You haven&apos;t reviewed any products. Start shopping and share your experience!
            </p>
            <Link href="/shop">
              <Button className="bg-[#1B3B6F] hover:bg-[#15305a]">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Shop
              </Button>
            </Link>
          </div>
        ) : (
          /* Review Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(review => {
              const isDeleting = deletingId === review._id
              const productImage =
                review.product?.images?.[0] || '/placeholder-product.png'

              return (
                <div
                  key={review._id}
                  className="bg-white border rounded-xl p-4 flex flex-col transition-shadow hover:shadow-md"
                >
                  {/* Product Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                      <img
                        src={productImage}
                        alt={review.product?.name || 'Product'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                        {review.product?.name || 'Unknown Product'}
                      </h3>
                      <div className="mt-1">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                  </div>

                  {/* Review Comment */}
                  <p className="text-sm text-muted-foreground flex-1 line-clamp-3 mb-3">
                    {review.comment}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(review.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(review)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(review._id)}
                        disabled={isDeleting}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit Review Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
            </DialogHeader>
            {editingReview && (
              <div className="space-y-4 py-2">
                {/* Product being reviewed */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                    <img
                      src={editingReview.product?.images?.[0] || '/placeholder-product.png'}
                      alt={editingReview.product?.name || 'Product'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {editingReview.product?.name || 'Unknown Product'}
                  </span>
                </div>

                {/* Rating */}
                <div>
                  <Label className="mb-2 block">Rating</Label>
                  <StarRating
                    rating={editRating}
                    interactive
                    onChange={setEditRating}
                  />
                </div>

                {/* Comment */}
                <div>
                  <Label className="mb-2 block">Comment</Label>
                  <Textarea
                    value={editComment}
                    onChange={e => setEditComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeEditModal} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-[#1B3B6F] hover:bg-[#15305a]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  )
}
