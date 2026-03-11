'use client'

import { useEffect, useState, useCallback } from 'react'
import { shopAPI } from '@/services/api'
import {
  ClipboardList, Check, X, UserPlus, ArrowRight, Clock, Phone,
  MapPin, Car, AlertTriangle, Loader2, ChevronDown, IndianRupee,
  Play, CheckCircle, Navigation, Star, Shield, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'mechanic_assigned' | 'on_way' | 'in_progress' | 'completed' | 'cancelled'

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'mechanic_assigned', label: 'Assigned' },
  { key: 'on_way', label: 'On Way' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
]

export function ShopOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Assign mechanic dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [allMechanics, setAllMechanics] = useState<any[]>([])
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('')
  const [mechanicType, setMechanicType] = useState<'platform' | 'manual' | 'custom'>('platform')
  const [customName, setCustomName] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [mechanicsLoading, setMechanicsLoading] = useState(false)

  // Cost update
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [laborCost, setLaborCost] = useState('')
  const [partsCost, setPartsCost] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      const params: any = { limit: 50 }
      if (activeTab !== 'all') params.status = activeTab
      const res = await shopAPI.getOrders(params)
      if (res.data?.success) setOrders(res.data.data || [])
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])

  // Fetch all mechanics when opening assign dialog
  const openAssignDialog = async (order: any) => {
    setSelectedOrder(order)
    setShowAssignDialog(true)
    setSelectedMechanicId('')
    setMechanicType('platform')
    setCustomName('')
    setCustomPhone('')
    setMechanicsLoading(true)

    try {
      const [assignedRes, profileRes] = await Promise.all([
        shopAPI.getAssignedMechanics(),
        shopAPI.getProfile()
      ])

      const combined: any[] = []

      // Platform mechanics (assigned by admin)
      if (assignedRes.data?.success) {
        (assignedRes.data.data || []).forEach((m: any) => {
          combined.push({ ...m, source: 'platform' })
        })
      }

      // Manual mechanics (shop employees)
      if (profileRes.data?.success) {
        (profileRes.data.data.mechanics || [])
          .filter((m: any) => m.isActive)
          .forEach((m: any) => {
            combined.push({
              _id: m._id,
              name: m.name,
              phone: m.phone,
              specializations: m.specialization ? [m.specialization] : [],
              source: 'manual'
            })
          })
      }

      setAllMechanics(combined)

      // Auto-select first platform mechanic if available
      const firstPlatform = combined.find(m => m.source === 'platform')
      if (firstPlatform) {
        setSelectedMechanicId(firstPlatform._id)
        setMechanicType('platform')
      } else if (combined.length > 0) {
        setSelectedMechanicId(combined[0]._id)
        setMechanicType('manual')
      } else {
        setMechanicType('custom')
      }
    } catch (err) {
      console.error('Fetch mechanics error:', err)
    } finally {
      setMechanicsLoading(false)
    }
  }

  const handleAccept = async (orderId: string) => {
    setActionLoading(true)
    try {
      await shopAPI.acceptOrder(orderId)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (orderId: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    setActionLoading(true)
    try {
      await shopAPI.rejectOrder(orderId, reason)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignMechanic = async (orderId: string) => {
    if (mechanicType === 'custom') {
      if (!customName || !customPhone) return alert('Name and phone required')
      setActionLoading(true)
      try {
        await shopAPI.assignMechanic(orderId, { name: customName, phone: customPhone })
        closeAssignDialog()
        fetchOrders()
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed')
      } finally {
        setActionLoading(false)
      }
    } else {
      if (!selectedMechanicId) return alert('Select a mechanic')
      const mech = allMechanics.find(m => m._id === selectedMechanicId)
      if (!mech) return

      setActionLoading(true)
      try {
        const data: any = { name: mech.name, phone: mech.phone }
        if (mech.source === 'platform') {
          data.mechanicProfileId = mech._id
        }
        await shopAPI.assignMechanic(orderId, data)
        closeAssignDialog()
        fetchOrders()
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed')
      } finally {
        setActionLoading(false)
      }
    }
  }

  const closeAssignDialog = () => {
    setShowAssignDialog(false)
    setSelectedMechanicId('')
    setCustomName('')
    setCustomPhone('')
    setAllMechanics([])
  }

  const handleStatusUpdate = async (orderId: string, status: string) => {
    setActionLoading(true)
    try {
      await shopAPI.updateOrderStatus(orderId, status)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCostUpdate = async (orderId: string) => {
    if (!laborCost && !partsCost) return alert('Enter at least one cost')
    setActionLoading(true)
    try {
      await shopAPI.updateOrderCost(orderId, {
        laborCost: Number(laborCost) || 0,
        partsCost: Number(partsCost) || 0
      })
      setShowCostDialog(false)
      setLaborCost('')
      setPartsCost('')
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      accepted: 'bg-blue-100 text-blue-700 border-blue-200',
      mechanic_assigned: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      on_way: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getNextAction = (order: any) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(order._id)} disabled={actionLoading}>
              <Check className="h-4 w-4 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleReject(order._id)} disabled={actionLoading}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        )
      case 'accepted':
        return (
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openAssignDialog(order)} disabled={actionLoading}>
            <UserPlus className="h-4 w-4 mr-1" /> Assign Mechanic
          </Button>
        )
      case 'mechanic_assigned':
        return (
          <div className="flex gap-2">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => handleStatusUpdate(order._id, 'on_way')} disabled={actionLoading}>
              <Navigation className="h-4 w-4 mr-1" /> On Way
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowCostDialog(true) }}>
              <IndianRupee className="h-4 w-4 mr-1" /> Set Cost
            </Button>
          </div>
        )
      case 'on_way':
        return (
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleStatusUpdate(order._id, 'in_progress')} disabled={actionLoading}>
            <Play className="h-4 w-4 mr-1" /> Start Work
          </Button>
        )
      case 'in_progress':
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowCostDialog(true) }}>
              <IndianRupee className="h-4 w-4 mr-1" /> Update Cost
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(order._id, 'completed')} disabled={actionLoading}>
              <CheckCircle className="h-4 w-4 mr-1" /> Complete
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  const platformMechanics = allMechanics.filter(m => m.source === 'platform')
  const manualMechanics = allMechanics.filter(m => m.source === 'manual')

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.key
                ? 'bg-[#0F2545] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No orders found</p>
          <p className="text-sm mt-1">Orders will appear here when assigned by admin</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-xl border p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{order.orderId}</span>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', getStatusColor(order.status))}>
                    {order.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {order.serviceRequest?.isEmergency && (
                    <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" /> Emergency
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{order.customer?.fullName || 'Customer'}</p>
                    <p className="text-gray-500">{order.customer?.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Car className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{order.serviceCategory || 'Service'}</p>
                    <p className="text-gray-500">{order.vehicleInfo?.brand} {order.vehicleInfo?.model}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-600 line-clamp-2">{order.serviceLocation?.address || 'N/A'}</p>
                    {order.distanceKm > 0 && <p className="text-gray-400">{order.distanceKm} km away</p>}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {(order.finalCost || order.estimatedCost || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Mechanic */}
              {order.assignedMechanic?.name && (
                <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                  <UserPlus className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-indigo-700">Mechanic: {order.assignedMechanic.name}</span>
                  <span className="text-indigo-500">({order.assignedMechanic.phone})</span>
                  {order.mechanicProfile && (
                    <span className="bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded text-xs ml-1">Platform</span>
                  )}
                </div>
              )}

              {/* Diagnosis Details — shown when mechanic submits diagnosis */}
              {order.serviceRequest?.diagnosis?.costBreakdown?.totalEstimate > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <ClipboardList className="h-4 w-4" />
                    <span>Diagnosis Report</span>
                    {order.serviceRequest?.customerApproval?.status && (
                      <span className={cn(
                        'ml-auto px-2 py-0.5 rounded-full text-xs font-semibold',
                        order.serviceRequest.customerApproval.status === 'approved' ? 'bg-green-100 text-green-700' :
                        order.serviceRequest.customerApproval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {order.serviceRequest.customerApproval.status === 'approved' ? 'Customer Approved' :
                         order.serviceRequest.customerApproval.status === 'rejected' ? 'Customer Rejected' :
                         'Awaiting Approval'}
                      </span>
                    )}
                  </div>

                  {order.serviceRequest.diagnosis.notes && (
                    <p className="text-sm text-gray-700">{order.serviceRequest.diagnosis.notes}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    {order.serviceRequest.diagnosis.costBreakdown.laborCost > 0 && (
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500">Labor</p>
                        <p className="font-bold text-gray-900">₹{order.serviceRequest.diagnosis.costBreakdown.laborCost}</p>
                      </div>
                    )}
                    {order.serviceRequest.diagnosis.costBreakdown.parts?.length > 0 && (
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500">Parts ({order.serviceRequest.diagnosis.costBreakdown.parts.length})</p>
                        <p className="font-bold text-gray-900">₹{order.serviceRequest.diagnosis.costBreakdown.parts.reduce((s: number, p: any) => s + (p.cost * (p.quantity || 1)), 0)}</p>
                      </div>
                    )}
                    {order.serviceRequest.diagnosis.costBreakdown.additionalCharges > 0 && (
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-500">Additional</p>
                        <p className="font-bold text-gray-900">₹{order.serviceRequest.diagnosis.costBreakdown.additionalCharges}</p>
                      </div>
                    )}
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-500">Total Estimate</p>
                      <p className="font-bold text-amber-700">₹{order.serviceRequest.diagnosis.costBreakdown.totalEstimate}</p>
                    </div>
                  </div>

                  {order.serviceRequest.diagnosis.costBreakdown.bookingFeeAdjusted > 0 && (
                    <div className="flex items-center justify-between text-sm bg-white rounded p-2">
                      <span className="text-gray-500">✓ Booking Fee (Paid Online)</span>
                      <span className="text-green-600 font-semibold">₹{order.serviceRequest.diagnosis.costBreakdown.bookingFeeAdjusted}</span>
                    </div>
                  )}

                  {order.serviceRequest.diagnosis.costBreakdown.onlinePaidAmount > 0 && (
                    <div className="flex items-center justify-between text-sm bg-blue-50 rounded p-2 border border-blue-200">
                      <span className="text-blue-700">✓ Online Payment (Paid)</span>
                      <span className="text-blue-700 font-semibold">₹{order.serviceRequest.diagnosis.costBreakdown.onlinePaidAmount}</span>
                    </div>
                  )}

                  {order.serviceRequest.diagnosis.costBreakdown.amountDue >= 0 && (
                    <div className="flex items-center justify-between text-sm bg-green-50 rounded p-2 border border-green-200">
                      <span className="font-semibold text-green-800">Balance Due (COD)</span>
                      <span className="text-green-700 font-bold text-base">₹{order.serviceRequest.diagnosis.costBreakdown.amountDue}</span>
                    </div>
                  )}

                  {order.serviceRequest.diagnosis.estimatedTime && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Est. time: {order.serviceRequest.diagnosis.estimatedTime}
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {order.description && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{order.description}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-2 border-t">
                {getNextAction(order)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Mechanic Dialog — Enhanced with picker */}
      {showAssignDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">Assign Mechanic</h3>
              <p className="text-sm text-gray-500">Order: {selectedOrder.orderId}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {mechanicsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <>
                  {/* Platform Mechanics */}
                  {platformMechanics.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Platform Mechanics
                      </p>
                      <div className="space-y-2">
                        {platformMechanics.map(mech => (
                          <label
                            key={mech._id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              selectedMechanicId === mech._id
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                : 'border-gray-200 hover:border-indigo-300'
                            )}
                            onClick={() => { setSelectedMechanicId(mech._id); setMechanicType('platform') }}
                          >
                            <input
                              type="radio" name="mechanic"
                              checked={selectedMechanicId === mech._id}
                              onChange={() => { setSelectedMechanicId(mech._id); setMechanicType('platform') }}
                              className="accent-indigo-600"
                            />
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {mech.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">{mech.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {mech.phone}
                                {mech.specializations?.length > 0 && ` · ${mech.specializations[0]}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {mech.rating > 0 && (
                                <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                  <Star className="h-3 w-3" /> {mech.rating?.toFixed(1)}
                                </span>
                              )}
                              <span className={cn(
                                'px-1.5 py-0.5 rounded text-xs font-medium',
                                mech.availability === 'available' ? 'bg-green-100 text-green-700' :
                                mech.availability === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                              )}>
                                {mech.availability}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Mechanics */}
                  {manualMechanics.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Shop Mechanics
                      </p>
                      <div className="space-y-2">
                        {manualMechanics.map(mech => (
                          <label
                            key={mech._id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              selectedMechanicId === mech._id
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                            onClick={() => { setSelectedMechanicId(mech._id); setMechanicType('manual') }}
                          >
                            <input
                              type="radio" name="mechanic"
                              checked={selectedMechanicId === mech._id}
                              onChange={() => { setSelectedMechanicId(mech._id); setMechanicType('manual') }}
                              className="accent-indigo-600"
                            />
                            <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {mech.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">{mech.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {mech.phone}
                                {mech.specializations?.[0] && ` · ${mech.specializations[0]}`}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom entry option */}
                  <div>
                    <label
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        mechanicType === 'custom'
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => { setMechanicType('custom'); setSelectedMechanicId('') }}
                    >
                      <input
                        type="radio" name="mechanic"
                        checked={mechanicType === 'custom'}
                        onChange={() => { setMechanicType('custom'); setSelectedMechanicId('') }}
                        className="accent-indigo-600"
                      />
                      <UserPlus className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Enter manually (not in list)</span>
                    </label>

                    {mechanicType === 'custom' && (
                      <div className="mt-3 ml-10 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700">Name *</label>
                          <input
                            type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Mechanic name"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">Phone *</label>
                          <input
                            type="tel" value={customPhone} onChange={e => setCustomPhone(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={closeAssignDialog}>
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handleAssignMechanic(selectedOrder._id)}
                disabled={actionLoading || mechanicsLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Assign Mechanic
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Update Dialog */}
      {showCostDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Update Cost</h3>
            <p className="text-sm text-gray-500">Order: {selectedOrder.orderId}</p>
            <div>
              <label className="text-sm font-medium text-gray-700">Labour Cost (INR)</label>
              <input
                type="number" value={laborCost} onChange={e => setLaborCost(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Parts Cost (INR)</label>
              <input
                type="number" value={partsCost} onChange={e => setPartsCost(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Total: <strong>{((Number(laborCost) || 0) + (Number(partsCost) || 0)).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowCostDialog(false); setLaborCost(''); setPartsCost('') }}>
                Cancel
              </Button>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a28] text-white" onClick={() => handleCostUpdate(selectedOrder._id)} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
