// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { userCartAPI, userOrderAPI, userAddressAPI, userProfileAPI, userMembershipAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  MapPin, CreditCard, Package, Check, Loader2, ArrowLeft,
  Truck, Shield, ChevronRight, Navigation,
} from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

type Step = 'address' | 'payment' | 'review' | 'confirmation'

export function CheckoutPage() {
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.customerAuth)

  const [step, setStep] = useState<Step>('address')
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  // Address
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [address, setAddress] = useState({
    fullName: '', phone: '', address: '', landmark: '',
    city: '', state: '', pincode: '',
  })
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const [notes, setNotes] = useState('')

  // BM Care membership — parts-discount % applied at checkout (matches backend).
  const [member, setMember] = useState<{ partsDisc: number; planName: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cartRes, addrRes, profileRes, memberRes] = await Promise.all([
        userCartAPI.get(),
        userAddressAPI.getAll().catch(() => ({ data: { success: false } })),
        userProfileAPI.get().catch(() => ({ data: { success: false } })),
        userMembershipAPI.getMine().catch(() => ({ data: { success: false } })),
      ])

      // Active membership → surface the parts-discount % (backend applies the same).
      const m = memberRes?.data?.data
      if (m && m.status === 'active' && Number(m.meta?.partsDisc) > 0) {
        setMember({ partsDisc: Number(m.meta.partsDisc), planName: m.planName || 'BM Care' })
      }

      if (cartRes.data.success) {
        setCart(cartRes.data.data)
        if (!cartRes.data.data?.items?.length) {
          toast.error('Your cart is empty')
          router.push('/cart')
          return
        }
      }

      if (addrRes.data.success && addrRes.data.data?.length) {
        setSavedAddresses(addrRes.data.data)
        const defaultAddr = addrRes.data.data.find((a: any) => a.isDefault) || addrRes.data.data[0]
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id)
          setAddress({
            fullName: defaultAddr.fullName || '',
            phone: defaultAddr.phone || '',
            address: defaultAddr.address || '',
            landmark: defaultAddr.landmark || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || '',
            pincode: defaultAddr.pincode || '',
          })
        }
      } else if (profileRes.data.success) {
        const p = profileRes.data.data
        setAddress(prev => ({
          ...prev,
          fullName: p.fullName || '',
          phone: p.phone || '',
        }))
        setUseNewAddress(true)
      }
    } catch (err) {
      console.error('Checkout data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getShippingAddress = () => {
    if (!useNewAddress && selectedAddressId) {
      const saved = savedAddresses.find(a => a._id === selectedAddressId)
      if (saved) return {
        fullName: saved.fullName, phone: saved.phone,
        address: saved.address, landmark: saved.landmark,
        city: saved.city, state: saved.state, pincode: saved.pincode,
      }
    }
    return address
  }

  const validateAddress = () => {
    const addr = getShippingAddress()
    if (!addr.fullName || !addr.phone || !addr.address || !addr.city || !addr.state || !addr.pincode) {
      toast.error('Please fill all required address fields')
      return false
    }
    return true
  }

  const handleUseGPS = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          if (data.address) {
            setAddress(prev => ({
              ...prev,
              address: [data.address.road, data.address.neighbourhood, data.address.suburb].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '',
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || '',
              pincode: data.address.postcode || '',
            }))
            setUseNewAddress(true)
            toast.success('Location detected!')
          }
        } catch (err) {
          toast.error('Failed to get address from GPS')
        } finally {
          setGpsLoading(false)
        }
      },
      () => {
        setGpsLoading(false)
        toast.error('Location access denied')
      },
      { timeout: 10000 }
    )
  }

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return
    setPlacing(true)

    try {
      const shippingAddress = getShippingAddress()
      const res = await userOrderAPI.place({
        shippingAddress,
        paymentMethod: paymentMethod === 'online' ? 'online' : 'cod',
        notes: notes.trim() || undefined,
      })

      if (!res.data.success) {
        toast.error(res.data.message || 'Failed to place order')
        setPlacing(false)
        return
      }

      const order = res.data.data

      if (paymentMethod === 'cod') {
        setOrderResult(order)
        setStep('confirmation')
        toast.success('Order placed successfully!')
      } else if (paymentMethod === 'online' && order.razorpay) {
        // Open Razorpay
        const options = {
          key: order.razorpay.keyId,
          amount: order.razorpay.amount,
          currency: order.razorpay.currency || 'INR',
          name: 'Bharat Mechanics Auto Parts',
          description: 'Product Order Payment',
          order_id: order.razorpay.orderId,
          handler: async (response: any) => {
            try {
              await userOrderAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              setOrderResult(order)
              setStep('confirmation')
              toast.success('Payment successful! Order confirmed.')
            } catch (err) {
              toast.error('Payment verification failed. Contact support.')
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
          },
          theme: { color: '#1B3B6F' },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled. Your order is saved — you can pay later from Order History.')
              setPlacing(false)
              // Move to confirmation anyway so user sees the order was created and can retry payment from there
              setOrderResult(order)
              setStep('confirmation')
            },
          },
        }

        if (typeof window.Razorpay !== 'undefined') {
          const rzp = new window.Razorpay(options)
          rzp.open()
        } else {
          toast.error('Payment gateway not loaded. Please refresh and try again.')
          setPlacing(false)
        }
      } else {
        // If online but no razorpay data
        setOrderResult(order)
        setStep('confirmation')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((acc: number, item: any) => {
    const price = item.product?.sellingPrice || item.product?.price?.selling || (typeof item.product?.price === 'number' ? item.product.price : 0) || (typeof item.price === 'number' ? item.price : 0)
    return acc + price * item.quantity
  }, 0)
  const shipping = subtotal >= 500 ? 0 : 50
  // Member parts-discount — mirrors the backend (round(subtotal * partsDisc / 100)).
  const memberDiscount = member ? Math.min(Math.round((subtotal * member.partsDisc) / 100), subtotal) : 0
  const total = subtotal + shipping - memberDiscount

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </UserLayout>
    )
  }

  // Confirmation step
  if (step === 'confirmation' && orderResult) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-12 text-center max-w-lg">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Order #{orderResult.orderNumber || orderResult._id?.slice(-8)}
          </p>
          <div className="bg-white border rounded-xl p-6 text-left mb-6">
            <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
            <p className="font-medium mb-3">{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="font-bold text-xl">₹{total.toLocaleString()}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href={`/orders/${orderResult._id}`}>
              <Button className="bg-[#1B3B6F]">View Order</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Checkout</h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {['address', 'payment', 'review'].map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              <button
                onClick={() => {
                  if (s === 'address') setStep('address')
                  else if (s === 'payment' && validateAddress()) setStep('payment')
                  else if (s === 'review' && validateAddress()) setStep('review')
                }}
                className={`px-3 py-1 rounded-full font-medium ${
                  step === s ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-muted-foreground'
                }`}
              >
                {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Address Step */}
            {step === 'address' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#FF6B35]" /> Shipping Address
                </h2>

                {/* Saved Addresses */}
                {savedAddresses.length > 0 && !useNewAddress && (
                  <div className="space-y-3 mb-4">
                    {savedAddresses.map(addr => (
                      <label key={addr._id}
                        className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddressId === addr._id ? 'border-[#1B3B6F] bg-blue-50' : 'hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input type="radio" name="address" checked={selectedAddressId === addr._id}
                            onChange={() => setSelectedAddressId(addr._id)} className="mt-1" />
                          <div>
                            <p className="font-medium">{addr.fullName} <span className="text-muted-foreground font-normal">| {addr.phone}</span></p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {[addr.address, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                            </p>
                            {addr.isDefault && <Badge className="mt-1 bg-blue-100 text-blue-700 text-xs">Default</Badge>}
                          </div>
                        </div>
                      </label>
                    ))}
                    <button onClick={() => setUseNewAddress(true)}
                      className="text-sm text-[#1B3B6F] font-medium hover:underline">
                      + Add New Address
                    </button>
                  </div>
                )}

                {/* New Address Form */}
                {(useNewAddress || savedAddresses.length === 0) && (
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <button onClick={() => setUseNewAddress(false)} className="text-sm text-[#1B3B6F] hover:underline">
                        Use saved address instead
                      </button>
                    )}

                    <Button variant="outline" size="sm" onClick={handleUseGPS} disabled={gpsLoading}>
                      {gpsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                      Use Current Location
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Address *</Label>
                        <Input value={address.address} onChange={e => setAddress(p => ({ ...p, address: e.target.value }))} placeholder="House/Flat No., Street, Area" />
                      </div>
                      <div>
                        <Label>Landmark</Label>
                        <Input value={address.landmark} onChange={e => setAddress(p => ({ ...p, landmark: e.target.value }))} placeholder="Near..." />
                      </div>
                      <div>
                        <Label>City *</Label>
                        <Input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
                      </div>
                      <div>
                        <Label>State *</Label>
                        <Input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Pincode *</Label>
                        <Input value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} maxLength={6} />
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={() => { if (validateAddress()) setStep('payment') }}
                  className="mt-6 bg-[#1B3B6F] hover:bg-[#152d55] text-white">
                  Continue to Payment <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Payment Step */}
            {step === 'payment' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#FF6B35]" /> Payment Method
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'cod')} className="space-y-3">
                  <label className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer ${paymentMethod === 'online' ? 'border-[#1B3B6F] bg-blue-50' : ''}`}>
                    <RadioGroupItem value="online" />
                    <div>
                      <p className="font-medium">Online Payment</p>
                      <p className="text-sm text-muted-foreground">UPI, Debit/Credit Card, Net Banking via Razorpay</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer ${paymentMethod === 'cod' ? 'border-[#1B3B6F] bg-blue-50' : ''}`}>
                    <RadioGroupItem value="cod" />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when your order is delivered</p>
                    </div>
                  </label>
                </RadioGroup>

                <div className="mt-4">
                  <Label>Order Notes (Optional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2} />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('address')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep('review')} className="bg-[#1B3B6F] hover:bg-[#152d55] text-white">
                    Review Order <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-4">
                {/* Address Summary */}
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Address</h3>
                    <button onClick={() => setStep('address')} className="text-xs text-[#1B3B6F] hover:underline">Change</button>
                  </div>
                  {(() => {
                    const addr = getShippingAddress()
                    return (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{addr.fullName} | {addr.phone}</p>
                        <p>{[addr.address, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                      </div>
                    )
                  })()}
                </div>

                {/* Payment Summary */}
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</h3>
                    <button onClick={() => setStep('payment')} className="text-xs text-[#1B3B6F] hover:underline">Change</button>
                  </div>
                  <p className="text-sm">{paymentMethod === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</p>
                </div>

                {/* Items */}
                <div className="bg-white border rounded-xl p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Items ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item: any) => {
                      const product = item.product || {}
                      const price = product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0)
                      const thumbUrl = product.thumbnail?.url || (typeof product.thumbnail === 'string' ? product.thumbnail : '') || product.images?.[0]?.url || ''
                      return (
                        <div key={item._id} className="flex items-center gap-3 text-sm">
                          <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold">₹{(price * item.quantity).toLocaleString()}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('payment')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handlePlaceOrder} disabled={placing}
                    className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2a] text-white h-12 font-semibold">
                    {placing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...</>
                    ) : (
                      <>Place Order — ₹{total.toLocaleString()}</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                {items.slice(0, 3).map((item: any) => {
                  const product = item.product || {}
                  const price = product.sellingPrice || product.price?.selling || (typeof product.price === 'number' ? product.price : 0)
                  return (
                    <div key={item._id} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">{product.name} x{item.quantity}</span>
                      <span className="font-medium shrink-0">₹{(price * item.quantity).toLocaleString()}</span>
                    </div>
                  )
                })}
                {items.length > 3 && <p className="text-xs text-muted-foreground">+{items.length - 3} more items</p>}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {member?.planName} saving ({member?.partsDisc}% off)</span>
                    <span className="font-medium">−₹{memberDiscount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-1"><Shield className="h-3 w-3 text-green-600" /> Secure payment</p>
                <p className="flex items-center gap-1"><Truck className="h-3 w-3 text-blue-600" /> {shipping === 0 ? 'Free delivery' : 'Free delivery above ₹500'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}
