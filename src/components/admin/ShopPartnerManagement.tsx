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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Partners</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your partner shop network</p>
        </div>
        <Button
          className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
          onClick={() => { resetForm(); setShowCreateDialog(true) }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Shop Partner
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Shops', value: stats.totalShops, icon: Store, color: 'text-blue-600 bg-blue-50' },
            { label: 'Active', value: stats.activeShops, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            { label: 'Verified', value: stats.verifiedShops, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
            { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-orange-600 bg-orange-50' },
            { label: 'Commission Earned', value: formatCurrency(stats.totalCommissionEarned), icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]"
          placeholder="Search shops by name or city..."
        />
      </div>

      {/* Shops List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
          <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No shop partners found</p>
          <p className="text-sm mt-1">Click &quot;Add Shop Partner&quot; to onboard a new partner</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shops.map(shop => (
            <div key={shop._id} className={cn(
              'bg-white rounded-xl border p-5 space-y-3 transition-all hover:shadow-md',
              !shop.isActive && 'opacity-60'
            )}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{shop.shopName}</h3>
                  <p className="text-sm text-gray-500">{shop.user?.fullName}</p>
                </div>
                <div className="flex items-center gap-1">
                  {shop.isVerified ? (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="text-sm space-y-1">
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
              <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{shop.totalJobsCompleted}</p>
                  <p className="text-xs text-gray-500">Jobs</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{shop.commissionRate}%</p>
                  <p className="text-xs text-gray-500">Commission</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{shop.rating || '0'}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              {/* Pending Settlement */}
              {shop.pendingSettlement > 0 && (
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-amber-600">Pending Settlement</p>
                  <p className="text-sm font-bold text-amber-700">{formatCurrency(shop.pendingSettlement)}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex-1"
                  onClick={() => openMechanicDialog(shop)}>
                  <UserPlus className="h-3 w-3 mr-1" /> Mechanics
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1 border-purple-300 text-purple-700"
                  onClick={() => openKycDialog(shop)} disabled={actionLoading}>
                  <Shield className="h-3 w-3 mr-1" />
                  {shop.isVerified ? 'View KYC' : 'Review KYC'}
                </Button>
                <Button size="sm" variant="outline" className="text-xs flex-1"
                  onClick={() => handleToggleStatus(shop._id)} disabled={actionLoading}>
                  {shop.isActive ? <ToggleRight className="h-3 w-3 mr-1" /> : <ToggleLeft className="h-3 w-3 mr-1" />}
                  {shop.isActive ? 'Disable' : 'Enable'}
                </Button>
                {shop.pendingSettlement > 0 && (
                  <Button size="sm" variant="outline" className="text-xs text-green-600 flex-1"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900">Add Shop Partner</h3>

            <div className="border-b pb-3">
              <p className="text-sm font-medium text-gray-700 mb-3">Owner Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Full Name *</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Owner name" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Phone *</label>
                  <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Phone number" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Email (optional)</label>
                  <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Email address" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Password</label>
                  <input type="text" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Leave empty = phone number" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Shop Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Shop Name *</label>
                  <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="Shop name" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">City</label>
                  <input type="text" value={shopCity} onChange={e => setShopCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="City" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Commission Rate (%)</label>
                  <input type="number" value={commissionRate} onChange={e => setCommissionRate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="25" min={0} max={50} />
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              If password is empty, phone number will be used as default password.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
                onClick={handleCreate} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Create Shop Partner
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mechanic Assignment Dialog */}
      {showMechanicDialog && mechanicShop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Mechanics</h3>
                <p className="text-sm text-gray-500">{mechanicShop.shopName}</p>
              </div>
              <button onClick={() => setShowMechanicDialog(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
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
                      <div key={mech._id} className="flex items-center justify-between bg-indigo-50 rounded-lg px-4 py-3">
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
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            mech.availability === 'available' ? 'bg-green-100 text-green-700' :
                            mech.availability === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          )}>
                            {mech.availability}
                          </span>
                          <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 h-7 px-2"
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
              <div className="border-t" />

              {/* Search & Add Available Mechanics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-green-600" />
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
                  <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg">
                    {mechanicSearch ? 'No mechanics found' : 'No unassigned mechanics available'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableMechanics.map((mech: any) => (
                      <div key={mech._id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:border-indigo-300 transition-colors">
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
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-3 text-xs"
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
            <div className="p-4 border-t">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Shop Partner Created!</h3>
              <p className="text-sm text-gray-500 mt-1">Share these login credentials with the shop owner</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Login ID:</span>
                <span className="font-mono font-bold text-gray-900">{credentials.loginId}</span>
              </div>
              <div className="border-t border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Password:</span>
                <span className="font-mono font-bold text-gray-900">{credentials.password}</span>
              </div>
              <div className="border-t border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Portal URL:</span>
                <span className="font-mono text-sm text-[#FF6B35]">{credentials.loginUrl}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" /> KYC Review — {kycShop.shopName}
                </h3>
                <p className="text-xs text-gray-500">
                  Submitted {kycShop.kyc?.submittedAt ? new Date(kycShop.kyc.submittedAt).toLocaleString() : '—'}
                </p>
              </div>
              <button onClick={() => { setShowKycDialog(false); setKycShop(null); setKycRejectReason('') }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status banner */}
              <div className={cn(
                'rounded-xl p-3 text-sm flex items-center gap-2',
                kycShop.isVerified ? 'bg-green-50 text-green-700' : kycShop.rejectionReason ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
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
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                  {kycShop.kyc?.ownerPhoto ? (
                    <img src={kycShop.kyc.ownerPhoto} alt="Owner" className="w-20 h-20 rounded-xl object-cover border" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white border flex items-center justify-center text-gray-300">
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
                    <div key={doc.label} className="bg-white border rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                        {doc.required && !doc.num && <span className="text-[10px] text-red-500">Missing</span>}
                      </div>
                      <p className="font-mono text-sm text-gray-900 truncate">{doc.num || '—'}</p>
                      {doc.img ? (
                        <a href={doc.img} target="_blank" rel="noreferrer" className="block">
                          <img src={doc.img} alt={doc.label} className="w-full h-32 object-cover rounded border" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-gray-50 rounded border border-dashed flex items-center justify-center text-xs text-gray-400">
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
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
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
                        <img src={img.url || img} alt={`Shop ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
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
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-300"
                    rows={2}
                    placeholder="If rejecting, explain what needs to be fixed"
                    value={kycRejectReason}
                    onChange={e => setKycRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex flex-wrap gap-2 justify-end">
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
                    className="bg-green-600 hover:bg-green-700 text-white"
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
