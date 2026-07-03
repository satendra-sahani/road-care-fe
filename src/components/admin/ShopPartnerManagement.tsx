'use client'

import { useEffect, useState } from 'react'
import { adminShopAPI } from '@/services/api'
import {
  Store, Plus, Search, Shield, ShieldCheck, ToggleLeft, ToggleRight,
  DollarSign, Users, Star, MapPin, Phone, Mail, Loader2, Eye,
  CheckCircle, XCircle, Package, TrendingUp, IndianRupee, ArrowRight,
  UserPlus, Wrench, X, UserMinus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ShopPartnerManagement() {
  const [shops, setShops] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedShop, setSelectedShop] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Create form
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopCity, setShopCity] = useState('')
  const [commissionRate, setCommissionRate] = useState('25')

  // Credentials display after creation
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState<any>(null)

  // Mechanic assignment
  const [showMechanicDialog, setShowMechanicDialog] = useState(false)
  const [mechanicShop, setMechanicShop] = useState<any>(null)
  const [shopMechanics, setShopMechanics] = useState<any[]>([])
  const [availableMechanics, setAvailableMechanics] = useState<any[]>([])
  const [mechanicSearch, setMechanicSearch] = useState('')
  const [mechanicLoading, setMechanicLoading] = useState(false)

  // KYC review
  const [showKycDialog, setShowKycDialog] = useState(false)
  const [kycShop, setKycShop] = useState<any>(null)
  const [kycRejectReason, setKycRejectReason] = useState('')

  const fetchData = async () => {
    try {
      const [shopsRes, statsRes] = await Promise.all([
        adminShopAPI.getAll({ search, limit: 50 }),
        adminShopAPI.getStats()
      ])
      if (shopsRes.data?.success) setShops(shopsRes.data.data || [])
      if (statsRes.data?.success) setStats(statsRes.data.data)
    } catch (err) {
      console.error('Fetch shops error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search])

  const handleCreate = async () => {
    if (!ownerName || !ownerPhone || !shopName) return alert('Name, phone & shop name required')
    setActionLoading(true)
    try {
      const res = await adminShopAPI.create({
        ownerData: {
          fullName: ownerName,
          phone: ownerPhone,
          email: ownerEmail || undefined,
          password: ownerPassword || undefined
        },
        shopData: {
          shopName,
          shopPhone: ownerPhone,
          address: { city: shopCity },
          commissionRate: Number(commissionRate) || 25
        }
      })
      setShowCreateDialog(false)
      // Show credentials to admin
      if (res.data?.credentials) {
        setCredentials(res.data.credentials)
        setShowCredentials(true)
      }
      resetForm()
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async (id: string) => {
    setActionLoading(true)
    try {
      await adminShopAPI.verify(id)
      setShowKycDialog(false)
      setKycShop(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectKyc = async (id: string, reason: string) => {
    if (!reason.trim()) return alert('Please enter a rejection reason')
    setActionLoading(true)
    try {
      await adminShopAPI.rejectKyc(id, reason.trim())
      setShowKycDialog(false)
      setKycShop(null)
      setKycRejectReason('')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const openKycDialog = async (shop: any) => {
    setActionLoading(true)
    try {
      // Fetch fresh full shop data (includes kyc, documents etc.)
      const res = await adminShopAPI.getById(shop._id)
      const full = res.data?.data || shop
      setKycShop(full)
      setKycRejectReason(full.rejectionReason || '')
      setShowKycDialog(true)
    } catch {
      setKycShop(shop)
      setShowKycDialog(true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    setActionLoading(true)
    try {
      await adminShopAPI.toggleStatus(id)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSettle = async (id: string) => {
    if (!confirm('Settle all pending payments for this shop?')) return
    setActionLoading(true)
    try {
      const res = await adminShopAPI.settle(id)
      alert(res.data?.message || 'Settled successfully')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    } finally {
      setActionLoading(false)
    }
  }

  // ─── Mechanic Assignment Handlers ────────────────────────────
  const openMechanicDialog = async (shop: any) => {
    setMechanicShop(shop)
    setShowMechanicDialog(true)
    setMechanicLoading(true)
    setMechanicSearch('')
    try {
      const [assignedRes, availableRes] = await Promise.all([
        adminShopAPI.getShopMechanics(shop._id),
        adminShopAPI.getAvailableMechanics('')
      ])
      if (assignedRes.data?.success) setShopMechanics(assignedRes.data.data || [])
      if (availableRes.data?.success) setAvailableMechanics(availableRes.data.data || [])
    } catch (err) {
      console.error('Fetch mechanics error:', err)
    } finally {
      setMechanicLoading(false)
    }
  }

  const searchAvailableMechanics = async (query: string) => {
    setMechanicSearch(query)
    try {
      const res = await adminShopAPI.getAvailableMechanics(query)
      if (res.data?.success) setAvailableMechanics(res.data.data || [])
    } catch {}
  }

  const handleAssignMechanic = async (mechanicId: string) => {
    if (!mechanicShop) return
    setMechanicLoading(true)
    try {
      const res = await adminShopAPI.assignMechanicToShop(mechanicShop._id, mechanicId)
      if (res.data?.success) {
        // Refresh both lists
        const [assignedRes, availableRes] = await Promise.all([
          adminShopAPI.getShopMechanics(mechanicShop._id),
          adminShopAPI.getAvailableMechanics(mechanicSearch)
        ])
        if (assignedRes.data?.success) setShopMechanics(assignedRes.data.data || [])
        if (availableRes.data?.success) setAvailableMechanics(availableRes.data.data || [])
      } else {
        alert(res.data?.message || 'Failed to assign')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign')
    } finally {
      setMechanicLoading(false)
    }
  }

  const handleUnassignMechanic = async (mechanicId: string) => {
    if (!mechanicShop) return
    setMechanicLoading(true)
    try {
      const res = await adminShopAPI.unassignMechanicFromShop(mechanicShop._id, mechanicId)
      if (res.data?.success) {
        const [assignedRes, availableRes] = await Promise.all([
          adminShopAPI.getShopMechanics(mechanicShop._id),
          adminShopAPI.getAvailableMechanics(mechanicSearch)
        ])
        if (assignedRes.data?.success) setShopMechanics(assignedRes.data.data || [])
        if (availableRes.data?.success) setAvailableMechanics(availableRes.data.data || [])
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove')
    } finally {
      setMechanicLoading(false)
    }
  }

  const resetForm = () => {
    setOwnerName(''); setOwnerPhone(''); setOwnerEmail(''); setOwnerPassword('')
    setShopName(''); setShopCity(''); setCommissionRate('25')
  }

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  // Presentational only — left-edge accent per shop status, mirrors the STATUS_STRIPE
  // pattern used on other admin list pages (e.g. OrderManagement).
  const shopStripe = (shop: any) =>
    !shop.isActive ? '#ef4444' : shop.isVerified ? '#22c55e' : '#f59e0b'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Shop Partners</h1>
          <p className="text-[#6B7280] text-sm mt-1">Manage your partner shop network</p>
        </div>
        <Button
          className="bg-[#FF6B35] hover:bg-[#e55a28] text-white shadow-sm"
          onClick={() => { resetForm(); setShowCreateDialog(true) }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Shop Partner
        </Button>
      </div>

      {/* Stats: commission hero + metric cards */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Commission Earned</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <IndianRupee className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white">
              {formatCurrency(stats.totalCommissionEarned)}
            </p>
            <div className="relative mt-3 flex items-center gap-2 text-[12px] text-white/70">
              <Package className="h-3.5 w-3.5" />
              <span><b className="text-white">{stats.totalOrders}</b> orders across the network</span>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Shops', value: stats.totalShops, icon: Store, tint: 'text-blue-600 bg-blue-50' },
              { label: 'Active Shops', value: stats.activeShops, icon: CheckCircle, tint: 'text-emerald-600 bg-emerald-50' },
              { label: 'Verified', value: stats.verifiedShops, icon: ShieldCheck, tint: 'text-violet-600 bg-violet-50' },
              { label: 'Total Orders', value: stats.totalOrders, icon: Package, tint: 'text-orange-600 bg-orange-50' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className={cn('grid h-9 w-9 place-items-center rounded-xl', s.tint)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{s.value}</p>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm transition-colors focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
          placeholder="Search shops by name or city..."
        />
      </div>

      {/* Shops List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Store className="h-7 w-7 text-gray-400" />
          </div>
          <p className="font-medium text-[#1A1D29]">No shop partners found</p>
          <p className="text-sm mt-1 text-gray-400">Click &quot;Add Shop Partner&quot; to onboard a new partner</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shops.map(shop => (
            <div key={shop._id} className={cn(
              'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 border-l-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
              !shop.isActive && 'opacity-60'
            )} style={{ borderLeftColor: shopStripe(shop) }}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#1A1D29]">{shop.shopName}</h3>
                  <p className="text-sm text-gray-500">{shop.user?.fullName}</p>
                </div>
                <div className="flex items-center gap-1">
                  {shop.isVerified ? (
                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="text-sm space-y-1.5">
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" /> {shop.user?.phone || shop.shopPhone}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" /> {shop.address?.city || 'No city'}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Users className="h-3.5 w-3.5 text-gray-400" /> {shop.mechanics?.length || 0} mechanics
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center bg-[#F6F8FB] rounded-xl p-2.5">
                <div>
                  <p className="text-sm font-bold text-[#1A1D29] tabular-nums">{shop.totalJobsCompleted}</p>
                  <p className="text-[11px] text-gray-500">Jobs</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1D29] tabular-nums">{shop.commissionRate}%</p>
                  <p className="text-[11px] text-gray-500">Commission</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1D29] tabular-nums flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {shop.rating || '0'}
                  </p>
                  <p className="text-[11px] text-gray-500">Rating</p>
                </div>
              </div>

              {/* Pending Settlement */}
              {shop.pendingSettlement > 0 && (
                <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                  <p className="text-xs text-amber-600 font-medium">Pending Settlement</p>
                  <p className="text-sm font-bold text-amber-700 tabular-nums">{formatCurrency(shop.pendingSettlement)}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex-1 rounded-lg"
                  onClick={() => openMechanicDialog(shop)}>
                  <UserPlus className="h-3 w-3 mr-1" /> Mechanics
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1 rounded-lg border-violet-300 text-violet-700 hover:bg-violet-50"
                  onClick={() => openKycDialog(shop)} disabled={actionLoading}>
                  <Shield className="h-3 w-3 mr-1" />
                  {shop.isVerified ? 'View KYC' : 'Review KYC'}
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1 rounded-lg"
                  onClick={() => handleToggleStatus(shop._id)} disabled={actionLoading}>
                  {shop.isActive ? <ToggleRight className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                  {shop.isActive ? 'Disable' : 'Enable'}
                </Button>
                {shop.pendingSettlement > 0 && (
                  <Button size="sm" variant="outline" className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 flex-1 rounded-lg"
                    onClick={() => handleSettle(shop._id)} disabled={actionLoading}>
                    <IndianRupee className="h-3 w-3 mr-1" /> Settle
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-5">
              <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
              <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/[0.05]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Add Shop Partner</h3>
                    <p className="text-[12px] text-white/60">Create the owner login &amp; shop profile in one step</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateDialog(false)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Owner Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-indigo-50">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Owner Details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Full Name <span className="text-[#FF6B35]">*</span></label>
                    <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="Owner name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Phone <span className="text-[#FF6B35]">*</span></label>
                    <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Email <span className="text-gray-300">(optional)</span></label>
                    <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="Email address" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Password</label>
                    <input type="text" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="Leave empty = phone number" />
                  </div>
                </div>
              </div>

              {/* Shop Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FF6B35]/10">
                    <Store className="h-3.5 w-3.5 text-[#FF6B35]" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Shop Details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Shop Name <span className="text-[#FF6B35]">*</span></label>
                    <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="Shop name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">City</label>
                    <input type="text" value={shopCity} onChange={e => setShopCity(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="City" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Commission Rate (%)</label>
                    <input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]" placeholder="25" min={0} max={50} />
                  </div>
                </div>
              </div>

              <p className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50/60 border border-blue-100 rounded-lg p-2.5">
                <Shield className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                If password is empty, the phone number will be used as the default password.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end bg-white">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a28] text-white shadow-sm"
                onClick={handleCreate} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Shop Partner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mechanic Assignment Dialog */}
      {showMechanicDialog && mechanicShop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-5 py-5">
              <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Manage Mechanics</h3>
                    <p className="text-[12px] text-white/60 flex items-center gap-1.5">
                      <Store className="h-3 w-3" /> {mechanicShop.shopName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowMechanicDialog(false)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Currently Assigned */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Assigned Mechanics ({shopMechanics.length})
                </h4>
                {mechanicLoading && shopMechanics.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : shopMechanics.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">
                    No platform mechanics assigned yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shopMechanics.map((mech: any) => (
                      <div key={mech._id} className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {mech.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{mech.name}</p>
                            <p className="text-xs text-gray-500">
                              {mech.phone} {mech.specializations?.length > 0 && `· ${mech.specializations.slice(0, 2).join(', ')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {mech.rating > 0 && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                              <Star className="h-3 w-3" /> {mech.rating?.toFixed(1)}
                            </span>
                          )}
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-semibold',
                            mech.availability === 'available' ? 'bg-emerald-100 text-emerald-700' :
                            mech.availability === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          )}>
                            {mech.availability}
                          </span>
                          <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 h-7 px-2 rounded-lg"
                            onClick={() => handleUnassignMechanic(mech._id)} disabled={mechanicLoading}>
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Search & Add Available Mechanics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  Add Platform Mechanic
                </h4>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text" value={mechanicSearch}
                    onChange={e => searchAvailableMechanics(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search by name or phone..."
                  />
                </div>

                {availableMechanics.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    {mechanicSearch ? 'No mechanics found' : 'No unassigned mechanics available'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableMechanics.map((mech: any) => (
                      <div key={mech._id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {mech.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{mech.name}</p>
                            <p className="text-xs text-gray-500">
                              {mech.phone}
                              {mech.specializations?.length > 0 && ` · ${mech.specializations.slice(0, 2).join(', ')}`}
                              {mech.completedJobs > 0 && ` · ${mech.completedJobs} jobs`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {mech.rating > 0 && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                              <Star className="h-3 w-3" /> {mech.rating?.toFixed(1)}
                            </span>
                          )}
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-3 text-xs rounded-lg"
                            onClick={() => handleAssignMechanic(mech._id)} disabled={mechanicLoading}>
                            <Plus className="h-3 w-3 mr-1" /> Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <Button variant="outline" className="w-full" onClick={() => setShowMechanicDialog(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Dialog — shown after successful creation */}
      {showCredentials && credentials && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1D29]">Shop Partner Created!</h3>
              <p className="text-sm text-gray-500 mt-1">Share these login credentials with the shop owner</p>
            </div>

            <div className="rounded-xl p-4 space-y-3 bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Login ID:</span>
                <span className="font-mono font-bold text-white">{credentials.loginId}</span>
              </div>
              <div className="border-t border-white/15" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Password:</span>
                <span className="font-mono font-bold text-white">{credentials.password}</span>
              </div>
              <div className="border-t border-white/15" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Portal URL:</span>
                <span className="font-mono text-sm text-orange-300">{credentials.loginUrl}</span>
              </div>
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
              Save these credentials! Password won&apos;t be shown again.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const text = `BharatMechanics Shop Partner Login\nLogin ID: ${credentials.loginId}\nPassword: ${credentials.password}\nURL: ${window.location.origin}${credentials.loginUrl}`
                  navigator.clipboard.writeText(text)
                  alert('Credentials copied to clipboard!')
                }}
              >
                Copy to Clipboard
              </Button>
              <Button
                className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
                onClick={() => { setShowCredentials(false); setCredentials(null) }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KYC Review Dialog ─────────────────────────────────── */}
      {showKycDialog && kycShop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-4 rounded-t-2xl">
              <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">KYC Review — {kycShop.shopName}</h3>
                    <p className="text-[12px] text-white/60">
                      Submitted {kycShop.kyc?.submittedAt ? new Date(kycShop.kyc.submittedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowKycDialog(false); setKycShop(null); setKycRejectReason('') }} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={cn(
                'rounded-xl p-3 text-sm flex items-center gap-2 border',
                kycShop.isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : kycShop.rejectionReason ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              )}>
                {kycShop.isVerified ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                <span className="font-medium">
                  {kycShop.isVerified
                    ? `Verified ${kycShop.verifiedAt ? 'on ' + new Date(kycShop.verifiedAt).toLocaleDateString() : ''}`
                    : kycShop.rejectionReason
                      ? `Rejected: ${kycShop.rejectionReason}`
                      : 'Awaiting verification'}
                </span>
              </div>

              {/* Owner */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner</h4>
                <div className="flex items-center gap-4 bg-[#F6F8FB] rounded-xl p-3">
                  {kycShop.kyc?.ownerPhoto ? (
                    <img src={kycShop.kyc.ownerPhoto} alt="Owner" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-300">
                      <Users className="h-8 w-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{kycShop.kyc?.ownerName || kycShop.user?.fullName || '—'}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <Phone className="h-3.5 w-3.5" /> {kycShop.user?.phone || kycShop.shopPhone || '—'}
                    </p>
                    {kycShop.user?.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5" /> {kycShop.user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Aadhaar', num: kycShop.kyc?.aadhaarNumber, img: kycShop.kyc?.aadhaarImage, required: true },
                    { label: 'PAN', num: kycShop.kyc?.panNumber, img: kycShop.kyc?.panImage, required: true },
                    { label: 'GST', num: kycShop.kyc?.gstNumber, img: kycShop.kyc?.gstImage, required: false },
                  ].map(doc => (
                    <div key={doc.label} className="bg-white border border-gray-100 rounded-xl p-3 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                        {doc.required && !doc.num && <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">Missing</span>}
                      </div>
                      <p className="font-mono text-sm text-gray-900 truncate">{doc.num || '—'}</p>
                      {doc.img ? (
                        <a href={doc.img} target="_blank" rel="noreferrer" className="block">
                          <img src={doc.img} alt={doc.label} className="w-full h-32 object-cover rounded-lg border border-gray-100" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shop Location</h4>
                <div className="bg-[#F6F8FB] rounded-xl p-3 text-sm space-y-1">
                  <p className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {kycShop.address?.city || kycShop.address?.street
                      ? [kycShop.address?.street, kycShop.address?.landmark, kycShop.address?.city, kycShop.address?.state, kycShop.address?.pincode].filter(Boolean).join(', ')
                      : 'No address on file'}
                  </p>
                  {kycShop.address?.coordinates?.latitude && kycShop.address?.coordinates?.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${kycShop.address.coordinates.latitude},${kycShop.address.coordinates.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline ml-6"
                    >
                      {kycShop.address.coordinates.latitude.toFixed(5)}, {kycShop.address.coordinates.longitude.toFixed(5)} — open in Maps
                    </a>
                  ) : (
                    <p className="ml-6 text-xs text-amber-600">No GPS coordinates captured</p>
                  )}
                </div>
              </div>

              {/* Shop photos */}
              {kycShop.shopImages?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shop Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {kycShop.shopImages.map((img: any, idx: number) => (
                      <a key={idx} href={img.url || img} target="_blank" rel="noreferrer">
                        <img src={img.url || img} alt={`Shop ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-100" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject reason */}
              {!kycShop.isVerified && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rejection Reason (optional)</h4>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                    rows={2}
                    placeholder="If rejecting, explain what needs to be fixed"
                    value={kycRejectReason}
                    onChange={e => setKycRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-wrap gap-2 justify-end rounded-b-2xl">
              <Button variant="outline" onClick={() => { setShowKycDialog(false); setKycShop(null); setKycRejectReason('') }}>
                Close
              </Button>
              {!kycShop.isVerified && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleRejectKyc(kycShop._id, kycRejectReason)}
                    disabled={actionLoading || !kycRejectReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject KYC
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleVerify(kycShop._id)}
                    disabled={actionLoading}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" /> Approve & Verify
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
