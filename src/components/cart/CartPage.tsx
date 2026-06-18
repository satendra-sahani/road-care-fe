'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { userCartAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, Truck, Loader2,
} from 'lucide-react'

export function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const res = await userCartAPI.get()
      if (res.data.success) {
        setCart(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    setUpdating(productId)
    try {
      const res = await userCartAPI.update(productId, quantity)
      if (res.data.success) {
        setCart(res.data.data)
      } else {
        toast.error(res.data.message || 'Failed to update')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: string) => {
    setUpdating(productId)
    try {
      const res = await userCartAPI.remove(productId)
      if (res.data.success) {
        setCart(res.data.data)
        toast.success('Item removed from cart')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((acc: number, item: any) => {
    const price = item.product?.sellingPrice || item.product?.price?.selling || (typeof item.product?.price === 'number' ? item.product.price : 0) || (typeof item.price === 'number' ? item.price : 0)
    return acc + price * item.quantity
  }, 0)
  const shipping = subtotal >= 500 ? 0 : 50
  const total = subtotal + shipping

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse flex gap-4">
                <div className="h-20 w-20 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
          <ShoppingCart className="inline h-7 w-7 mr-2" />
          Shopping Cart
          {items.length > 0 && <span className="text-muted-foreground text-lg ml-2">({items.length} items)</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to your cart and come back here</p>
            <Link href="/shop">
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white">
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item: any) => {
                const product = item.product || {}
                const price = product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0) || (typeof item.price === 'number' ? item.price : 0)
                const mrp = product.mrp || product.price?.mrp || product.originalPrice || price
                const image = product.thumbnail?.url || (typeof product.thumbnail === 'string' ? product.thumbnail : '') || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '') || ''

                return (
                  <div key={item._id || product._id} className="bg-white rounded-xl border p-4 flex gap-4">
                    <Link href={`/shop/${product._id}`} className="shrink-0">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-100 rounded-lg overflow-hidden">
                        {image ? (
                          <img src={image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${product._id}`}>
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-[#1B3B6F]">{product.name}</h3>
                      </Link>
                      {product.brand?.name && <p className="text-xs text-[#FF6B35] font-medium mt-1">{product.brand.name}</p>}

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
                        {mrp > price && <span className="text-sm text-muted-foreground line-through">₹{mrp.toLocaleString()}</span>}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => updateQuantity(product._id, item.quantity - 1)}
                            disabled={updating === product._id || item.quantity <= 1}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium border-x">
                            {updating === product._id ? <Loader2 className="h-4 w-4 animate-spin" /> : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product._id, item.quantity + 1)}
                            disabled={updating === product._id}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(product._id)}
                          disabled={updating === product._id}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="font-bold text-lg">₹{(price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Free delivery on orders above ₹500
                    </p>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full mt-6 bg-[#FF6B35] hover:bg-[#e55a2a] text-white h-12 font-semibold"
                >
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Link href="/shop" className="block text-center text-sm text-[#1B3B6F] hover:underline mt-4">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
