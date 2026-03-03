'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { userOrderAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle,
  MapPin, CreditCard, Loader2,
} from 'lucide-react'

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-100', label: 'Confirmed' },
  processing: { icon: Package, color: 'text-blue-700', bg: 'bg-blue-100', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-700', bg: 'bg-purple-100', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100', label: 'Cancelled' },
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await userOrderAPI.getById(id as string)
      if (res.data.success) setOrder(res.data.data)
    } catch (err) {
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      const res = await userOrderAPI.cancel(id as string, 'Customer requested cancellation')
      if (res.data.success) {
        toast.success('Order cancelled')
        fetchOrder()
      } else {
        toast.error(res.data.message || 'Failed to cancel')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded-xl mb-4" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </UserLayout>
    )
  }

  if (!order) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Order not found</h2>
          <Link href="/orders"><Button variant="outline">Back to Orders</Button></Link>
        </div>
      </UserLayout>
    )
  }

  const status = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = status.icon
  const currentStepIdx = statusSteps.indexOf(order.status)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const addr = order.shippingAddress || {}

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <button onClick={() => router.push('/orders')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>

        {/* Order Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Order #{order.orderNumber || order._id?.slice(-8)}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <Badge className={`${status.bg} ${status.color} border-none flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" /> {status.label}
          </Badge>
        </div>

        {/* Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white border rounded-xl p-6 mb-4">
            <h3 className="font-bold text-sm mb-4">Order Status</h3>
            <div className="flex items-center justify-between">
              {statusSteps.map((s, idx) => {
                const isActive = idx <= currentStepIdx
                const isCurrent = idx === currentStepIdx
                const cfg = statusConfig[s]
                const Icon = cfg.icon
                return (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-[#1B3B6F] text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-[#FF6B35] ring-offset-2' : ''}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={`text-xs mt-1 ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {cfg.label}
                    </p>
                    {idx < statusSteps.length - 1 && (
                      <div className={`absolute h-0.5 w-full ${isActive ? 'bg-[#1B3B6F]' : 'bg-gray-200'}`} style={{ display: 'none' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white border rounded-xl p-4 mb-4">
          <h3 className="font-bold text-sm mb-3">Items ({order.items?.length || 0})</h3>
          <div className="space-y-3">
            {(order.items || []).map((item: any, idx: number) => {
              const product = item.product || {}
              const price = item.price || product.sellingPrice || 0
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-14 w-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {(product.thumbnail?.url || (typeof product.thumbnail === 'string' && product.thumbnail) || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' && product.images?.[0])) ? (
                      <img src={product.thumbnail?.url || (typeof product.thumbnail === 'string' ? product.thumbnail : '') || product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : '')} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name || item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">₹{(price * item.quantity).toLocaleString()}</p>
                </div>
              )
            })}
          </div>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(order.subtotal || order.totalAmount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost || 0}`}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{(order.totalAmount || 0).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border rounded-xl p-4 mb-4">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Address</h3>
          <p className="font-medium text-sm">{addr.fullName} | {addr.phone}</p>
          <p className="text-sm text-muted-foreground">
            {[addr.address, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
          </p>
        </div>

        {/* Payment */}
        <div className="bg-white border rounded-xl p-4 mb-4">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</h3>
          <p className="text-sm">Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          <p className="text-sm">Status: <span className="font-medium capitalize">{order.paymentStatus || 'pending'}</span></p>
        </div>

        {/* Cancel */}
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={cancelling}
            className="border-red-300 text-red-600 hover:bg-red-50">
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
            Cancel Order
          </Button>
        )}
      </div>
    </UserLayout>
  )
}
