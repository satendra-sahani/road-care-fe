// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Truck,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Package,
  AlertCircle,
  Loader2,
  Wallet,
  Banknote
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { userCartAPI, userOrderAPI, authAPI } from '@/services/api'

declare global {
  interface Window {
    Razorpay: any
  }
}

const paymentMethods = [
  {
    id: 'online',
    name: 'Online Payment',
    description: 'UPI, Credit/Debit Card, Net Banking, Wallets',
    icon: Wallet,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Banknote,
  },
]

export function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [orderNotes, setOrderNotes] = useState('')

  // Data states
  const [cartItems, setCartItems] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [orderResult, setOrderResult] = useState<any>(null)

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Fetch cart and user profile on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [cartRes, profileRes] = await Promise.all([
          userCartAPI.get(),
          authAPI.getProfile(),
        ])

        if (cartRes.data?.success && cartRes.data.data?.items?.length > 0) {
          setCartItems(cartRes.data.data.items)
        } else {
          setCartItems([])
        }

        if (profileRes.data?.success && profileRes.data.data) {
          const user = profileRes.data.data
          setUserProfile(user)
          // Prefill shipping address from profile
          setShippingAddress({
            fullName: user.fullName || '',
            phone: user.phone || '',
            address: user.location?.address || '',
            landmark: user.location?.landmark || '',
            city: user.location?.city || '',
            state: user.location?.state || '',
            pincode: user.location?.pincode || '',
          })
        }
      } catch (err: any) {
        console.error('Checkout fetch error:', err)
        setError('Failed to load checkout data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCharge = subtotal >= 500 ? 0 : 50
  const totalAmount = subtotal + shippingCharge

  const isAddressValid = shippingAddress.fullName && shippingAddress.phone &&
    shippingAddress.address && shippingAddress.city && shippingAddress.state && shippingAddress.pincode

  const steps = [
    { id: 1, name: 'Address', completed: currentStep > 1 },
    { id: 2, name: 'Payment', completed: currentStep > 2 },
    { id: 3, name: 'Review', completed: currentStep > 3 },
    { id: 4, name: 'Confirmation', completed: false },
  ]

  const openRazorpay = useCallback((razorpay: any, orderData: any) => {
    const options = {
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: 'Road Care Auto Parts',
      description: 'Product Order Payment',
      order_id: razorpay.orderId,
      handler: async (response: any) => {
        try {
          setPlacing(true)
          await userOrderAPI.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          setOrderResult({
            orderId: orderData.orderId || orderData._id,
            orderNumber: orderData.orderId,
            paymentMethod: 'online',
            paymentVerified: true,
          })
          setCurrentStep(4)
        } catch (err: any) {
          console.error('Payment verification failed:', err)
          setError('Payment verification failed. Your order is placed but payment is pending. Contact support if amount was deducted.')
          setOrderResult({
            orderId: orderData.orderId || orderData._id,
            orderNumber: orderData.orderId,
            paymentMethod: 'online',
            paymentVerified: false,
          })
          setCurrentStep(4)
        } finally {
          setPlacing(false)
        }
      },
      prefill: {
        name: shippingAddress.fullName,
        email: userProfile?.email || '',
        contact: shippingAddress.phone,
      },
      theme: { color: '#1B3B6F' },
      modal: {
        ondismiss: () => {
          setPlacing(false)
          setError('Payment was cancelled. Your order is created but payment is pending. You can retry from your orders page.')
          setOrderResult({
            orderId: orderData.orderId || orderData._id,
            orderNumber: orderData.orderId,
            paymentMethod: 'online',
            paymentVerified: false,
          })
          setCurrentStep(4)
        },
      },
    }

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error)
        setPlacing(false)
        setError(`Payment failed: ${response.error?.description || 'Unknown error'}. Your order is created but payment is pending.`)
        setOrderResult({
          orderId: orderData.orderId || orderData._id,
          orderNumber: orderData.orderId,
          paymentMethod: 'online',
          paymentVerified: false,
        })
        setCurrentStep(4)
      })
      rzp.open()
    } else {
      setError('Payment gateway not loaded. Please refresh the page and try again.')
      setPlacing(false)
    }
  }, [shippingAddress, userProfile])

  const placeOrder = async () => {
    if (!isAddressValid || !paymentMethod) return

    setPlacing(true)
    setError('')

    try {
      const res = await userOrderAPI.place({
        shippingAddress,
        paymentMethod,
        notes: orderNotes || undefined,
      })

      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to place order')
        setPlacing(false)
        return
      }

      const orderData = res.data.data

      if (paymentMethod === 'online' && orderData.razorpay) {
        // Open Razorpay popup — placing stays true until completion/dismissal
        openRazorpay(orderData.razorpay, orderData)
      } else {
        // COD — show confirmation directly
        setOrderResult({
          orderId: orderData.orderId || orderData._id,
          orderNumber: orderData.orderId,
          paymentMethod: 'cod',
          paymentVerified: true,
        })
        setCurrentStep(4)
        setPlacing(false)
      }
    } catch (err: any) {
      console.error('Place order error:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to place order'
      setError(msg)
      setPlacing(false)
    }
  }

  // ─── LOADING STATE ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F] mx-auto mb-4" />
        <p className="text-[#6B7280]">Loading checkout...</p>
      </div>
    )
  }

  // ─── EMPTY CART ───────────────────────────────────────────────────────
  if (cartItems.length === 0 && currentStep !== 4) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#1A1D29] mb-2">Your cart is empty</h2>
        <p className="text-[#6B7280] mb-6">Add some products to your cart before checking out.</p>
        <Link href="/shop">
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/cart">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29]">Checkout</h1>
            <p className="text-[#6B7280] mt-1">Complete your order</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed
                        ? 'bg-green-600 text-white'
                        : currentStep === step.id
                        ? 'bg-[#1B3B6F] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      step.completed || currentStep === step.id ? 'text-[#1A1D29]' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${step.completed ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError('')}>×</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* ═══════ Step 1: Shipping Address ═══════ */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="House/Flat no., Building, Street"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    value={shippingAddress.landmark}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    placeholder="Near temple, school, etc."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Enter pincode"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    disabled={!isAddressValid}
                  >
                    Continue to Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 2: Payment Method ═══════ */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="flex-1 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#1B3B6F]/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-[#1B3B6F]" />
                          </div>
                          <div>
                            <label htmlFor={method.id} className="cursor-pointer font-medium text-[#1A1D29]">
                              {method.name}
                            </label>
                            <p className="text-sm text-[#6B7280]">{method.description}</p>
                          </div>
                        </div>
                        {method.id === 'online' && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Recommended</Badge>
                        )}
                      </div>
                    )
                  })}
                </RadioGroup>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    disabled={!paymentMethod}
                  >
                    Review Order
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 3: Order Review ═══════ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Address Summary */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Delivery Address
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>Change</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-[#1A1D29]">{shippingAddress.fullName}</p>
                  <p className="text-sm text-[#6B7280]">{shippingAddress.address}</p>
                  {shippingAddress.landmark && (
                    <p className="text-sm text-[#6B7280]">Landmark: {shippingAddress.landmark}</p>
                  )}
                  <p className="text-sm text-[#6B7280]">
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                  </p>
                  <p className="text-sm text-[#6B7280]">Phone: {shippingAddress.phone}</p>
                </CardContent>
              </Card>

              {/* Payment Method Summary */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Method
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Change</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const method = paymentMethods.find(pm => pm.id === paymentMethod)
                    if (!method) return null
                    const Icon = method.icon
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#1B3B6F]/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#1B3B6F]" />
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-[#6B7280]">{method.description}</p>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Items ({cartItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.product?.thumbnail || item.product?.images?.[0]?.url || '/placeholder-product.png'}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.png' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#1A1D29] truncate">{item.product?.name || 'Product'}</h3>
                          {item.product?.sku && (
                            <p className="text-xs text-[#6B7280]">SKU: {item.product.sku}</p>
                          )}
                          <p className="text-sm text-[#6B7280]">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-[#1A1D29]">{formatCurrency(item.price * item.quantity)}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-[#6B7280]">{formatCurrency(item.price)} each</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special instructions for delivery..."
                    rows={2}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={placeOrder}
                  className="bg-[#1B3B6F] hover:bg-[#0F2545] text-lg px-8"
                  disabled={placing}
                >
                  {placing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {paymentMethod === 'online' ? 'Processing Payment...' : 'Placing Order...'}
                    </>
                  ) : (
                    paymentMethod === 'online' ? `Pay ${formatCurrency(totalAmount)}` : 'Place Order'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ Step 4: Confirmation ═══════ */}
          {currentStep === 4 && orderResult && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                {orderResult.paymentVerified ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#1A1D29] mb-2">Order Placed Successfully!</h2>
                    <p className="text-[#6B7280] mb-6">
                      {orderResult.paymentMethod === 'online'
                        ? 'Payment received! Your order has been confirmed.'
                        : 'Your order has been placed. Pay cash when it arrives.'}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#1A1D29] mb-2">Order Created — Payment Pending</h2>
                    <p className="text-[#6B7280] mb-6">
                      Your order was created but payment is incomplete. You can retry payment from your orders page.
                    </p>
                  </>
                )}

                <div className="bg-gray-50 rounded-lg p-4 mb-6 inline-block">
                  <p className="text-sm text-[#6B7280] mb-1">Order Number</p>
                  <p className="text-lg font-bold text-[#1A1D29]">#{orderResult.orderNumber}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/orders">
                    <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      Track Your Order
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="outline">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══════ Order Summary Sidebar ═══════ */}
        {currentStep !== 4 && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Item count */}
                <p className="text-sm text-[#6B7280]">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>

                {/* Item list (compact) */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-[#6B7280] truncate pr-2">
                        {item.product?.name || 'Product'} × {item.quantity}
                      </span>
                      <span className="font-medium flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Shipping</span>
                    <span>
                      {shippingCharge === 0 ? (
                        <span className="text-green-600 font-medium">FREE</span>
                      ) : (
                        formatCurrency(shippingCharge)
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#1B3B6F]">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Trust badges */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    <span>{shippingCharge === 0 ? 'Free delivery on this order' : 'Free delivery on orders above ₹500'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span>Secure payment & safe checkout</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Delivery in 2-3 business days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
