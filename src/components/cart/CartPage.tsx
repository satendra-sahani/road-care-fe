'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Heart,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  Gift
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Mock cart data
const mockCartItems = [
  {
    id: 'CART-001',
    productId: 'PRD-001',
    name: 'Premium Brake Pads Set - Front',
    brand: 'Bosch',
    price: 3499,
    originalPrice: 4299,
    quantity: 2,
    image: '/products/brake-pads-1.jpg',
    inStock: true,
    maxQuantity: 10
  },
  {
    id: 'CART-002',
    productId: 'PRD-002',
    name: 'Engine Oil Filter - Premium Quality',
    brand: 'Mann-Filter',
    price: 849,
    originalPrice: 1099,
    quantity: 1,
    image: '/products/oil-filter-1.jpg',
    inStock: true,
    maxQuantity: 5
  },
  {
    id: 'CART-003',
    productId: 'PRD-003',
    name: 'LED Headlight Bulbs - H4 Type',
    brand: 'Philips',
    price: 2299,
    originalPrice: 2799,
    quantity: 1,
    image: '/products/led-headlight-1.jpg',
    inStock: false,
    maxQuantity: 0
  }
]

const mockRecommendations = [
  {
    id: 'REC-001',
    name: 'Brake Disc Set - Front',
    brand: 'Brembo',
    price: 5999,
    originalPrice: 7299,
    image: '/products/brake-disc-1.jpg',
    rating: 4.7
  },
  {
    id: 'REC-002',
    name: 'Brake Fluid DOT 4',
    brand: 'Castrol',
    price: 299,
    originalPrice: 399,
    image: '/products/brake-fluid-1.jpg',
    rating: 4.8
  }
]

export function CartPage() {
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

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

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.maxQuantity)) }
          : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId))
  }

  const moveToWishlist = (itemId: string) => {
    // Add to wishlist logic here
    removeItem(itemId)
  }

  const applyPromoCode = () => {
    // Simulate promo code validation
    if (promoCode.toLowerCase() === 'welcome10') {
      setAppliedPromo('WELCOME10')
      setPromoCode('')
    } else {
      // Handle invalid promo code
      alert('Invalid promo code')
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateSavings = () => {
    return cartItems.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0)
  }

  const calculateDiscount = () => {
    if (appliedPromo === 'WELCOME10') {
      return Math.round(calculateSubtotal() * 0.1)
    }
    return 0
  }

  const calculateTax = () => {
    const taxableAmount = calculateSubtotal() - calculateDiscount()
    return Math.round(taxableAmount * 0.18) // 18% GST
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    return subtotal >= 2000 ? 0 : 99 // Free shipping above ₹2000
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax() + calculateShipping()
  }

  const inStockItems = cartItems.filter(item => item.inStock)
  const outOfStockItems = cartItems.filter(item => !item.inStock)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Shopping Cart</h1>
          <p className="text-[#6B7280] mt-1">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <Link href="/shop">
          <Button variant="outline">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1D29] mb-2">Your cart is empty</h3>
            <p className="text-[#6B7280] mb-6">Add some products to your cart to get started</p>
            <Link href="/shop">
              <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* In Stock Items */}
            {inStockItems.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-green-600" />
                    Available Items ({inStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inStockItems.map((item) => (
                      <div key={item.id} className="flex space-x-4 p-4 border border-gray-200 rounded-lg">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 mr-4">
                              <Badge variant="secondary" className="text-xs mb-1">
                                {item.brand}
                              </Badge>
                              <h3 className="font-medium text-[#1A1D29] truncate">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-lg font-bold text-[#1A1D29]">
                                  {formatCurrency(item.price)}
                                </span>
                                <span className="text-sm text-[#6B7280] line-through">
                                  {formatCurrency(item.originalPrice)}
                                </span>
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {getDiscountPercentage(item.originalPrice, item.price)}% OFF
                                </Badge>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToWishlist(item.id)}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Quantity Control */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-[#6B7280]">Quantity:</span>
                              <div className="flex items-center border rounded-lg">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 font-medium">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxQuantity}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-bold text-[#1A1D29]">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-sm text-[#6B7280]">
                                  {formatCurrency(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Out of Stock Items */}
            {outOfStockItems.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-red-600" />
                    Out of Stock Items ({outOfStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {outOfStockItems.map((item) => (
                      <div key={item.id} className="flex space-x-4 p-4 border border-red-200 rounded-lg bg-red-50">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 opacity-60">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 mr-4">
                              <Badge variant="secondary" className="text-xs mb-1">
                                {item.brand}
                              </Badge>
                              <h3 className="font-medium text-[#1A1D29] truncate">
                                {item.name}
                              </h3>
                              <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                                Out of Stock
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToWishlist(item.id)}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Button variant="outline" size="sm">
                              Notify When Available
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {mockRecommendations.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>You might also like</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mockRecommendations.map((product) => (
                      <div key={product.id} className="flex space-x-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {product.brand}
                          </Badge>
                          <h4 className="text-sm font-medium text-[#1A1D29] truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm font-bold">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-xs text-[#6B7280] line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          </div>
                          <Button size="sm" className="mt-2 w-full bg-[#1B3B6F] hover:bg-[#0F2545]">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Promo Code */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Gift className="h-5 w-5 mr-2" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-800 font-medium">{appliedPromo} Applied</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAppliedPromo(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button
                      onClick={applyPromoCode}
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({inStockItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  
                  {calculateSavings() > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Savings</span>
                      <span>-{formatCurrency(calculateSavings())}</span>
                    </div>
                  )}
                  
                  {calculateDiscount() > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Promo Discount</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>
                      {calculateShipping() === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatCurrency(calculateShipping())
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Tax (GST 18%)</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>

                {calculateShipping() > 0 && (
                  <p className="text-sm text-[#6B7280]">
                    Add {formatCurrency(2000 - calculateSubtotal())} more for FREE shipping
                  </p>
                )}

                <div className="space-y-3 pt-4">
                  <Link href="/checkout" className="block">
                    <Button
                      className="w-full bg-[#1B3B6F] hover:bg-[#0F2545] text-lg py-6"
                      disabled={inStockItems.length === 0}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </Link>
                  
                  <div className="flex items-center justify-center space-x-2 text-sm text-[#6B7280]">
                    <Truck className="h-4 w-4" />
                    <span>Free delivery on orders above ₹2,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 text-sm text-[#6B7280]">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>SSL encrypted</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}