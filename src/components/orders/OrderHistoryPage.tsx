'use client'

// My Orders — mirrors the mobile app's Orders screen: three tabs (Services /
// Parts / GPS) so every kind of order lives in one place.
//   • Parts    — product orders (userOrderAPI.getAll) — behaviour preserved
//   • Services — mechanic service requests (userServiceAPI.getMyRequests)
//   • GPS      — GPS tracker orders with their provisioning chain
import { useState, useEffect } from 'react'
import { userOrderAPI, userServiceAPI, userTrackerAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Package, Clock, Truck, CheckCircle, XCircle, ChevronRight, ShoppingCart,
  Wrench, MapPin, Check, CircleDot, IndianRupee, User as UserIcon,
} from 'lucide-react'

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100' },
  confirmed: { icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-100' },
  processing: { icon: Package, color: 'text-blue-700', bg: 'bg-blue-100' },
  shipped: { icon: Truck, color: 'text-purple-700', bg: 'bg-purple-100' },
  out_for_delivery: { icon: Truck, color: 'text-cyan-700', bg: 'bg-cyan-100' },
  delivered: { icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
  completed: { icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
  accepted: { icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-100' },
  assigned: { icon: UserIcon, color: 'text-indigo-700', bg: 'bg-indigo-100' },
  in_progress: { icon: Wrench, color: 'text-orange-700', bg: 'bg-orange-100' },
}

const nice = (s: string) => String(s || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

type TabId = 'services' | 'parts' | 'gps'

export function OrderHistoryPage() {
  const [tab, setTab] = useState<TabId>('parts')

  // Parts (existing behaviour)
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  // Services + GPS (new — same sources as the app)
  const [requests, setRequests] = useState<any[]>([])
  const [gpsOrders, setGpsOrders] = useState<any[]>([])
  const [gpsOpenId, setGpsOpenId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  // Load all three in parallel so each tab count shows immediately (app parity).
  const fetchAll = async () => {
    setLoading(true)
    const [o, r, g] = await Promise.allSettled([
      userOrderAPI.getAll({ limit: 50 }),
      userServiceAPI.getMyRequests({ limit: 50 }),
      userTrackerAPI.getGpsOrders(),
    ])
    if (o.status === 'fulfilled' && o.value.data?.success) setOrders(o.value.data.data || [])
    if (r.status === 'fulfilled' && r.value.data?.success) {
      const raw = r.value.data.data
      setRequests(Array.isArray(raw) ? raw : raw?.requests || [])
    }
    if (g.status === 'fulfilled' && g.value.data?.success) setGpsOrders(g.value.data.data || [])
    setLoading(false)
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

  const tabs: { id: TabId; label: string; icon: any; count: number }[] = [
    { id: 'services', label: 'Requests', icon: Wrench, count: requests.length },
    { id: 'parts', label: 'Parts', icon: Package, count: orders.length },
    { id: 'gps', label: 'GPS', icon: MapPin, count: gpsOrders.length },
  ]

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-5">My Orders</h1>

        {/* Top tabs — Services / Parts / GPS (same as the app) */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                tab === id ? 'bg-[#1B3B6F] text-white shadow-sm' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}>
              <Icon className="h-4 w-4" /> {label}
              <span className={`ml-0.5 rounded-full px-1.5 py-px text-[10.5px] font-extrabold ${tab === id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* ─── SERVICES (mechanic requests) ─────────────────────────────── */}
        {tab === 'services' && (
          requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No service requests yet</h2>
              <p className="text-muted-foreground mb-6">Book a mechanic and your requests will show here</p>
              <Link href="/services"><Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white"><Wrench className="mr-2 h-4 w-4" /> Book a Service</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: any) => {
                const st = statusConfig[req.status] || statusConfig.pending
                const StIcon = st.icon
                const mechanic = req.mechanic?.user?.fullName || req.mechanic?.fullName || req.assignedMechanic?.fullName
                const cost = req.totalCost || req.pricing?.totalCost || req.estimatedCost || req.pricing?.estimatedCost || 0
                return (
                  <Link key={req._id} href={`/service/${req._id}/track`}
                    className="block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Request #{req.requestId || req._id?.slice(-8)?.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(req.createdAt)}</p>
                      </div>
                      <Badge className={`${st.bg} ${st.color} border-none flex items-center gap-1`}>
                        <StIcon className="h-3 w-3" /> {nice(req.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#FF6B35]"><Wrench className="h-6 w-6" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm capitalize truncate">
                          {nice(req.serviceCategory || 'General')} · {req.vehicle?.type || req.vehicleType || 'vehicle'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {mechanic ? `Mechanic: ${mechanic}` : 'Mechanic not assigned yet'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {cost > 0 && <p className="font-bold">₹{Number(cost).toLocaleString()}</p>}
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* ─── PARTS (product orders — existing behaviour preserved) ────── */}
        {tab === 'parts' && (
          <>
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
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(order.createdAt)}</p>
                        </div>
                        <Badge className={`${status.bg} ${status.color} border-none flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {nice(order.status)}
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
          </>
        )}

        {/* ─── GPS (tracker orders with provisioning chain) ─────────────── */}
        {tab === 'gps' && (
          gpsOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">No GPS orders yet</h2>
              <p className="text-muted-foreground mb-6">Order a GPS tracker for your vehicle and track it here</p>
              <Link href="/tracker"><Button className="bg-[#FF6B35] hover:bg-[#e55a2a] text-white"><MapPin className="mr-2 h-4 w-4" /> Explore GPS Tracker</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {gpsOrders.map((g: any) => {
                const steps: any[] = g.steps || []
                const open = gpsOpenId === String(g.vehicleId)
                const activeIdx = Math.max(0, steps.findIndex((s) => s.active))
                const isActive = g.status === 'active'
                return (
                  <div key={g.vehicleId} className="bg-white rounded-xl border p-4">
                    <button className="w-full text-left" onClick={() => setGpsOpenId(open ? null : String(g.vehicleId))}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-2xl">{g.vehicle?.em || '📍'}</div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{g.vehicle?.name || 'Vehicle'}</p>
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{g.vehicle?.regNo || ''}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Ordered {fmtDate(g.orderedAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={`${isActive ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} border-none`}>
                            {g.currentTitle || nice(g.status)}
                          </Badge>
                          {g.payment?.amountPaid ? (
                            <p className="mt-1.5 flex items-center justify-end gap-0.5 text-sm font-bold">
                              <IndianRupee className="h-3.5 w-3.5" />{Number(g.payment.amountPaid).toLocaleString()}
                              {g.payment.paid && <span className="ml-1 rounded bg-green-50 px-1.5 py-px text-[10px] font-extrabold text-green-600">PAID</span>}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* progress bar (chain summary) */}
                      {steps.length > 0 && (
                        <div>
                          <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="rounded-full bg-[#1B3B6F] transition-all" style={{ width: `${((activeIdx + 1) / steps.length) * 100}%` }} />
                          </div>
                          <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold text-muted-foreground">
                            <span>{steps[0]?.title}</span>
                            <span>{steps[steps.length - 1]?.title}</span>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* expanded: full step chain + delivery info */}
                    {open && (
                      <div className="mt-4 border-t pt-4">
                        <div className="space-y-3">
                          {steps.map((s: any, i: number) => (
                            <div key={s.id || i} className="flex items-start gap-3">
                              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? 'bg-green-100 text-green-600' : s.active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`}>
                                {s.done ? <Check className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${s.active ? 'font-bold text-[#1B3B6F]' : s.done ? 'font-medium' : 'text-gray-400'}`}>{s.title}</p>
                                {s.at && <p className="text-[11px] text-muted-foreground">{fmtDate(s.at)}</p>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {(g.delivery?.partner || g.delivery?.tracking) && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                            {g.delivery.partner && <p><span className="text-muted-foreground">Courier:</span> <b>{g.delivery.partner}</b></p>}
                            {g.delivery.tracking && <p className="mt-0.5"><span className="text-muted-foreground">Tracking no:</span> <b>{g.delivery.tracking}</b></p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </UserLayout>
  )
}
