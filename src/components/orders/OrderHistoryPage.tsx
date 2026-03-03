'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { userOrderAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Package, Clock, Truck, CheckCircle, XCircle, ChevronRight, ShoppingCart,
} from 'lucide-react'

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed: { icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-100' },
  processing: { icon: Package, color: 'text-blue-700', bg: 'bg-blue-100' },
  shipped: { icon: Truck, color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered: { icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
}

export function OrderHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await userOrderAPI.getAll({ limit: 50 })
      if (res.data.success) {
        setOrders(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : filter === 'active'
    ? orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status))
    : orders.filter(o => o.status === filter)

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">My Orders</h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">My Orders</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{f.label}</button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No orders found</h2>
            <p className="text-muted-foreground mb-6">
              {filter === 'all' ? 'You haven\'t placed any orders yet' : `No ${filter} orders`}
            </p>
            <Link href="/shop">
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white">
                <ShoppingCart className="mr-2 h-4 w-4" /> Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              const firstItem = order.items?.[0]
              const itemCount = order.items?.length || 0

              return (
                <Link key={order._id} href={`/orders/${order._id}`}
                  className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.orderNumber || order._id?.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : ''}
                      </p>
                    </div>
                    <Badge className={`${status.bg} ${status.color} border-none flex items-center gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    {(firstItem?.product?.thumbnail?.url || (typeof firstItem?.product?.thumbnail === 'string' && firstItem?.product?.thumbnail) || firstItem?.product?.images?.[0]?.url) && (
                      <div className="h-14 w-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        <img src={firstItem.product.thumbnail?.url || (typeof firstItem.product.thumbnail === 'string' ? firstItem.product.thumbnail : '') || firstItem.product.images?.[0]?.url || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{firstItem?.product?.name || 'Product'}</p>
                      {itemCount > 1 && <p className="text-xs text-muted-foreground">+{itemCount - 1} more item(s)</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">₹{(order.totalAmount || 0).toLocaleString()}</p>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </UserLayout>
  )
}
