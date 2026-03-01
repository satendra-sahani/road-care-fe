'use client'

import { useState, useEffect, useCallback } from 'react'
import { issuePricingAPI } from '@/services/api'
import {
  Edit3, Save, X, RefreshCw, Plus, Trash2,
  DollarSign, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Loader2, Settings2, TrendingUp, Zap
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface IssueItem {
  id: string
  label: string
  icon: string
  estimatedPrice: number
  isActive: boolean
}

interface EmergencyServiceItem {
  id: string
  label: string
  icon: string
  description: string
  estimatedTime: string
  urgencyLevel: 'high' | 'medium'
  price: number
  isActive: boolean
}

interface VehicleConfig {
  _id: string
  vehicleType: 'bike' | 'car' | 'scooter' | 'auto'
  issues: IssueItem[]
  emergencyServices: EmergencyServiceItem[]
  baseFare: number
  pricePerKm: number
  minimumFare: number
  emergencySurcharge: number
  surgeMultiplier: number
  otherIssueBasePrice: number
  updatedAt: string
}

type VehicleTypeKey = 'bike' | 'car' | 'scooter' | 'auto'

interface NewIssueForm {
  label: string
  id: string
  estimatedPrice: string
  icon: string
}

interface NewEmergencyServiceForm {
  label: string
  id: string
  price: string
  description: string
  estimatedTime: string
  urgencyLevel: 'high' | 'medium'
  icon: string
}

const EMPTY_NEW_ISSUE: NewIssueForm = { label: '', id: '', estimatedPrice: '', icon: 'build-outline' }
const EMPTY_NEW_EMERGENCY: NewEmergencyServiceForm = {
  label: '', id: '', price: '', description: '', estimatedTime: '15-30 mins', urgencyLevel: 'medium', icon: 'warning-outline',
}

// ─── Vehicle tab config ────────────────────────────────────────────────────────
const VEHICLE_TABS = [
  { type: 'bike'    as const, label: 'Bike',    emoji: '🏍️', color: '#1B3B6F', bg: '#EEF2FF' },
  { type: 'scooter' as const, label: 'Scooter', emoji: '🛵', color: '#7C3AED', bg: '#F5F3FF' },
  { type: 'car'     as const, label: 'Car',     emoji: '🚗', color: '#0F766E', bg: '#F0FDFA' },
  { type: 'auto'    as const, label: 'Auto',    emoji: '🛺', color: '#B45309', bg: '#FFFBEB' },
]

// ─── Helper: auto-generate slug from label ────────────────────────────────────
const slugify = (str: string) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1 shadow-sm">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
)

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all
    ${type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
    {type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
    {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
  </div>
)

// ─── Main component ────────────────────────────────────────────────────────────
export function IssuePricingManagement() {
  const [configs,        setConfigs]        = useState<VehicleConfig[]>([])
  const [activeTab,      setActiveTab]      = useState<VehicleTypeKey>('bike')
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState<string | null>(null)
  const [editingIssue,   setEditingIssue]   = useState<string | null>(null)
  const [editPrice,      setEditPrice]      = useState('')
  const [editLabel,      setEditLabel]      = useState('')
  const [showBaseFare,   setShowBaseFare]   = useState(false)
  const [baseFareEdit,   setBaseFareEdit]   = useState<Partial<VehicleConfig>>({})
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Add Issue state ─────────────────────────────────────────────────────────
  const [showAddIssue,   setShowAddIssue]   = useState(false)
  const [newIssue,       setNewIssue]       = useState<NewIssueForm>(EMPTY_NEW_ISSUE)
  const [addingIssue,    setAddingIssue]    = useState(false)

  // ── Delete confirm (issues) ─────────────────────────────────────────────────
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null)

  // ── Emergency Services state ─────────────────────────────────────────────────
  const [editingEmergency,    setEditingEmergency]    = useState<string | null>(null)
  const [emergencyEditForm,   setEmergencyEditForm]   = useState<Partial<EmergencyServiceItem>>({})
  const [showAddEmergency,    setShowAddEmergency]    = useState(false)
  const [newEmergency,        setNewEmergency]        = useState<NewEmergencyServiceForm>(EMPTY_NEW_EMERGENCY)
  const [addingEmergency,     setAddingEmergency]     = useState(false)
  const [deletingEmergencyId, setDeletingEmergencyId] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch all configs ────────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await issuePricingAPI.getAll()
      if (data.success) setConfigs(data.data || [])
    } catch { showToast('Failed to load pricing config', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  // Reset all forms when tab changes
  useEffect(() => {
    setShowAddIssue(false)
    setNewIssue(EMPTY_NEW_ISSUE)
    setEditingIssue(null)
    setShowBaseFare(false)
    setEditingEmergency(null)
    setEmergencyEditForm({})
    setShowAddEmergency(false)
    setNewEmergency(EMPTY_NEW_EMERGENCY)
  }, [activeTab])

  const currentConfig = configs.find(c => c.vehicleType === activeTab)

  // ── Update single issue price ────────────────────────────────────────────
  const handleSaveIssue = async (issueId: string) => {
    if (!currentConfig) return
    setSaving(issueId)
    try {
      const payload: any = { estimatedPrice: parseFloat(editPrice) || 0 }
      if (editLabel.trim()) payload.label = editLabel.trim()
      const { data } = await issuePricingAPI.updateIssue(activeTab, issueId, payload)
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Issue updated ✓')
        setEditingIssue(null)
      } else { showToast(data.message || 'Update failed', 'error') }
    } catch { showToast('Failed to save', 'error') }
    finally { setSaving(null) }
  }

  // ── Toggle issue active/inactive ─────────────────────────────────────────
  const handleToggleIssue = async (issueId: string, current: boolean) => {
    if (!currentConfig) return
    setSaving(issueId + '_toggle')
    try {
      const { data } = await issuePricingAPI.updateIssue(activeTab, issueId, { isActive: !current })
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast(!current ? 'Issue enabled' : 'Issue disabled')
      }
    } catch { showToast('Failed to toggle', 'error') }
    finally { setSaving(null) }
  }

  // ── Delete issue ─────────────────────────────────────────────────────────
  const handleDeleteIssue = async (issueId: string) => {
    setSaving(issueId + '_del')
    try {
      const { data } = await issuePricingAPI.deleteIssue(activeTab, issueId)
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Issue removed ✓')
      } else { showToast(data.message || 'Delete failed', 'error') }
    } catch { showToast('Failed to delete', 'error') }
    finally { setSaving(null); setDeletingIssueId(null) }
  }

  // ── Add new issue ────────────────────────────────────────────────────────
  const handleAddIssue = async () => {
    const label = newIssue.label.trim()
    const id    = newIssue.id.trim() || slugify(label)
    const price = parseFloat(newIssue.estimatedPrice)
    if (!label) { showToast('Label is required', 'error'); return }
    if (!id)    { showToast('ID is required',    'error'); return }
    if (isNaN(price) || price < 0) { showToast('Enter a valid price', 'error'); return }

    setAddingIssue(true)
    try {
      const { data } = await issuePricingAPI.addIssue(activeTab, {
        id,
        label,
        estimatedPrice: price,
        icon: newIssue.icon.trim() || 'build-outline',
      })
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Issue added ✓')
        setNewIssue(EMPTY_NEW_ISSUE)
        setShowAddIssue(false)
      } else { showToast(data.message || 'Failed to add issue', 'error') }
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to add issue', 'error')
    }
    finally { setAddingIssue(false) }
  }

  // ── Save base-fare config ────────────────────────────────────────────────
  const handleSaveBaseFare = async () => {
    if (!currentConfig) return
    setSaving('base')
    try {
      const { data } = await issuePricingAPI.updateVehicle(activeTab, baseFareEdit)
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Base config updated ✓')
        setShowBaseFare(false)
      } else { showToast(data.message || 'Update failed', 'error') }
    } catch { showToast('Failed to save', 'error') }
    finally { setSaving(null) }
  }

  // ── Emergency service handlers ───────────────────────────────────────────
  const startEditEmergency = (svc: EmergencyServiceItem) => {
    setEditingEmergency(svc.id)
    setEmergencyEditForm({ label: svc.label, description: svc.description, estimatedTime: svc.estimatedTime, urgencyLevel: svc.urgencyLevel, price: svc.price })
    setShowAddEmergency(false)
  }

  const cancelEditEmergency = () => { setEditingEmergency(null); setEmergencyEditForm({}) }

  const handleSaveEmergency = async (serviceId: string) => {
    setSaving('es_' + serviceId)
    try {
      const payload: any = {}
      if (emergencyEditForm.label         !== undefined) payload.label         = emergencyEditForm.label
      if (emergencyEditForm.description   !== undefined) payload.description   = emergencyEditForm.description
      if (emergencyEditForm.estimatedTime !== undefined) payload.estimatedTime = emergencyEditForm.estimatedTime
      if (emergencyEditForm.urgencyLevel  !== undefined) payload.urgencyLevel  = emergencyEditForm.urgencyLevel
      if (emergencyEditForm.price         !== undefined) payload.price         = Number(emergencyEditForm.price)
      const { data } = await issuePricingAPI.updateEmergencyService(activeTab, serviceId, payload)
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Emergency service updated ✓')
        setEditingEmergency(null)
      } else { showToast(data.message || 'Update failed', 'error') }
    } catch { showToast('Failed to save', 'error') }
    finally { setSaving(null) }
  }

  const handleToggleEmergency = async (serviceId: string, current: boolean) => {
    setSaving('es_toggle_' + serviceId)
    try {
      const { data } = await issuePricingAPI.updateEmergencyService(activeTab, serviceId, { isActive: !current })
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast(!current ? 'Service enabled' : 'Service disabled')
      }
    } catch { showToast('Failed to toggle', 'error') }
    finally { setSaving(null) }
  }

  const handleDeleteEmergency = async (serviceId: string) => {
    setSaving('es_del_' + serviceId)
    try {
      const { data } = await issuePricingAPI.deleteEmergencyService(activeTab, serviceId)
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Emergency service removed ✓')
      } else { showToast(data.message || 'Delete failed', 'error') }
    } catch { showToast('Failed to delete', 'error') }
    finally { setSaving(null); setDeletingEmergencyId(null) }
  }

  const handleAddEmergency = async () => {
    const label = newEmergency.label.trim()
    const id    = newEmergency.id.trim() || slugify(label)
    const price = parseFloat(newEmergency.price)
    if (!label) { showToast('Label is required', 'error'); return }
    if (!id)    { showToast('ID is required', 'error'); return }
    if (isNaN(price) || price < 0) { showToast('Enter a valid price', 'error'); return }

    setAddingEmergency(true)
    try {
      const { data } = await issuePricingAPI.addEmergencyService(activeTab, {
        id,
        label,
        price,
        description:   newEmergency.description.trim() || '',
        estimatedTime: newEmergency.estimatedTime.trim() || '15-30 mins',
        urgencyLevel:  newEmergency.urgencyLevel,
        icon:          newEmergency.icon.trim() || 'warning-outline',
      })
      if (data.success) {
        setConfigs(prev => prev.map(c => c.vehicleType === activeTab ? data.data : c))
        showToast('Emergency service added ✓')
        setNewEmergency(EMPTY_NEW_EMERGENCY)
        setShowAddEmergency(false)
      } else { showToast(data.message || 'Failed to add', 'error') }
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to add', 'error')
    }
    finally { setAddingEmergency(false) }
  }

  const startEdit = (issue: IssueItem) => {
    setEditingIssue(issue.id)
    setEditPrice(String(issue.estimatedPrice))
    setEditLabel(issue.label)
    setShowAddIssue(false)
  }

  const cancelEdit = () => { setEditingIssue(null); setEditPrice(''); setEditLabel('') }

  const openBaseFareEdit = () => {
    if (currentConfig) {
      setBaseFareEdit({
        baseFare: currentConfig.baseFare,
        pricePerKm: currentConfig.pricePerKm,
        minimumFare: currentConfig.minimumFare,
        emergencySurcharge: currentConfig.emergencySurcharge,
        surgeMultiplier: currentConfig.surgeMultiplier,
        otherIssueBasePrice: currentConfig.otherIssueBasePrice,
      })
    }
    setShowBaseFare(v => !v)
  }

  // ── Stats for current vehicle ────────────────────────────────────────────
  const activeCount = currentConfig?.issues.filter(i => i.isActive).length ?? 0
  const avgPrice    = currentConfig?.issues.length
    ? Math.round(currentConfig.issues.reduce((s, i) => s + i.estimatedPrice, 0) / currentConfig.issues.length)
    : 0
  const maxIssue = currentConfig?.issues.reduce((a, b) => a.estimatedPrice > b.estimatedPrice ? a : b, { label: '—', estimatedPrice: 0 } as any)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#1B3B6F]" />
        <p className="text-gray-500 font-medium">Loading pricing config...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#FF6B35]" />
            Issue Pricing Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set per-issue service estimates shown to users during booking
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Vehicle tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {VEHICLE_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === tab.type
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-base">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {currentConfig ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Active Issues"    value={activeCount}                     sub={`of ${currentConfig.issues.length} total`} color="#10B981" />
            <StatCard label="Average Price"    value={`₹${avgPrice}`}                 sub="across all issues"                         color="#1B3B6F" />
            <StatCard label="Highest Issue"    value={`₹${maxIssue?.estimatedPrice}`} sub={maxIssue?.label ?? '—'}                    color="#FF6B35" />
            <StatCard label="Other Issue Base" value={`₹${currentConfig.otherIssueBasePrice}`} sub="user-described problems"         color="#7C3AED" />
          </div>

          {/* Base fare section (collapsible) */}
          <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-5 py-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              onClick={openBaseFareEdit}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#1B3B6F]" />
                Base Fare Configuration
              </div>
              {showBaseFare ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {showBaseFare && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {[
                    { key: 'baseFare',            label: 'Base Fare (₹)',           min: 0 },
                    { key: 'pricePerKm',          label: 'Price per KM (₹)',        min: 0 },
                    { key: 'minimumFare',         label: 'Minimum Fare (₹)',        min: 0 },
                    { key: 'emergencySurcharge',  label: 'Emergency Surcharge (₹)', min: 0 },
                    { key: 'surgeMultiplier',     label: 'Surge Multiplier (×)',    min: 1 },
                    { key: 'otherIssueBasePrice', label: '"Other" Issue Price (₹)', min: 0 },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</label>
                      <input
                        type="number"
                        min={field.min}
                        step={field.key === 'surgeMultiplier' ? 0.1 : 1}
                        value={(baseFareEdit as any)[field.key] ?? ''}
                        onChange={e => setBaseFareEdit(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleSaveBaseFare}
                    disabled={saving === 'base'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3B6F] text-white rounded-lg font-semibold text-sm hover:bg-[#0F2545] disabled:opacity-50 transition-colors"
                  >
                    {saving === 'base' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Config
                  </button>
                  <button onClick={() => setShowBaseFare(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Issues table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

            {/* Table header row */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FF6B35]" />
              <h2 className="font-semibold text-gray-800">
                Issue Pricing — {VEHICLE_TABS.find(t => t.type === activeTab)?.emoji} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <span className="text-xs text-gray-400 font-medium ml-2">({currentConfig.issues.length} issues)</span>
              <button
                onClick={() => { setShowAddIssue(v => !v); setEditingIssue(null) }}
                className="ml-auto flex items-center gap-1.5 px-3.5 py-2 bg-[#FF6B35] text-white rounded-lg text-xs font-semibold hover:bg-[#e55a27] transition-colors"
              >
                {showAddIssue ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showAddIssue ? 'Cancel' : 'Add Issue'}
              </button>
            </div>

            {/* ── Add Issue inline form ────────────────────────────────────── */}
            {showAddIssue && (
              <div className="px-5 py-4 bg-orange-50/60 border-b border-orange-100">
                <p className="text-xs font-bold text-[#FF6B35] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Issue for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Label */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Issue Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. Suspension problem"
                      value={newIssue.label}
                      onChange={e => {
                        const label = e.target.value
                        setNewIssue(prev => ({
                          ...prev,
                          label,
                          // Auto-fill ID only if user hasn't manually changed it
                          id: prev.id === slugify(prev.label) || prev.id === '' ? slugify(label) : prev.id,
                        }))
                      }}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 bg-white"
                    />
                  </div>

                  {/* ID */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Issue ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. suspension"
                      value={newIssue.id}
                      onChange={e => setNewIssue(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">lowercase + underscores only</p>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 350"
                      value={newIssue.estimatedPrice}
                      onChange={e => setNewIssue(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 bg-white"
                    />
                  </div>

                  {/* Icon */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Icon name (Ionicon)</label>
                    <input
                      type="text"
                      placeholder="e.g. car-sport-outline"
                      value={newIssue.icon}
                      onChange={e => setNewIssue(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Leave blank for default (build-outline)</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddIssue}
                    disabled={addingIssue}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-lg font-semibold text-sm hover:bg-[#e55a27] disabled:opacity-50 transition-colors"
                  >
                    {addingIssue ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Issue
                  </button>
                  <button
                    onClick={() => { setShowAddIssue(false); setNewIssue(EMPTY_NEW_ISSUE) }}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Issues list ─────────────────────────────────────────────── */}
            <div className="divide-y divide-gray-50">
              {currentConfig.issues.length === 0 && (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">No issues configured yet</p>
                  <button
                    onClick={() => setShowAddIssue(true)}
                    className="text-xs text-[#FF6B35] font-semibold hover:underline"
                  >Add the first issue</button>
                </div>
              )}
              {currentConfig.issues.map(issue => {
                const isEditing   = editingIssue === issue.id
                const isSavingMe  = saving === issue.id
                const isToggling  = saving === issue.id + '_toggle'
                const isDeleting  = saving === issue.id + '_del'
                const confirmDel  = deletingIssueId === issue.id
                const isOther     = issue.id === 'other'

                return (
                  <div
                    key={issue.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors
                      ${isEditing ? 'bg-blue-50/60' : confirmDel ? 'bg-red-50/50' : 'hover:bg-gray-50/60'}
                      ${!issue.isActive ? 'opacity-50' : ''}`}
                  >
                    {/* Icon chip */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0 text-base">
                      {isOther ? '➕' : '🔧'}
                    </div>

                    {/* Label / edit input */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          className="w-full max-w-xs px-2.5 py-1.5 border border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          placeholder="Issue label"
                        />
                      ) : (
                        <p className="font-semibold text-gray-800 text-sm truncate">{issue.label}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">ID: <span className="font-mono">{issue.id}</span></p>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            min={0}
                            className="w-24 px-2.5 py-1.5 border border-blue-300 rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="text-base font-extrabold text-[#1B3B6F] min-w-[64px] text-right">
                          ₹{issue.estimatedPrice}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveIssue(issue.id)}
                            disabled={!!isSavingMe}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3B6F] text-white rounded-lg text-xs font-semibold hover:bg-[#0F2545] disabled:opacity-50 transition-colors"
                          >
                            {isSavingMe ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : confirmDel ? (
                        /* Delete confirmation inline */
                        <>
                          <span className="text-xs text-red-600 font-semibold">Remove?</span>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            disabled={!!isDeleting}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingIssueId(null)}
                            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(issue)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleIssue(issue.id, issue.isActive)}
                            disabled={!!isToggling}
                            title={issue.isActive ? 'Disable' : 'Enable'}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {isToggling
                              ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              : issue.isActive
                                ? <ToggleRight className="h-5 w-5 text-green-500" />
                                : <ToggleLeft className="h-5 w-5 text-gray-300" />
                            }
                          </button>
                          {/* Only allow deleting non-seeded custom issues (or allow all via trash icon) */}
                          <button
                            onClick={() => setDeletingIssueId(issue.id)}
                            title="Delete issue"
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 font-medium flex items-center justify-between">
              <span>💡 Disabled issues won't appear in the mobile booking flow.</span>
              <button
                onClick={() => { setShowAddIssue(true); setEditingIssue(null) }}
                className="flex items-center gap-1 text-[#FF6B35] font-semibold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Issue
              </button>
            </div>
          </div>

          {/* ── Emergency Services Section ─────────────────────────────── */}
          <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm mt-4">

            {/* Section header */}
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2 bg-red-50/40">
              <Zap className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold text-gray-800">
                Emergency Services — {VEHICLE_TABS.find(t => t.type === activeTab)?.emoji} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <span className="text-xs text-gray-400 font-medium ml-1">({(currentConfig.emergencyServices ?? []).length} services)</span>
              <button
                onClick={() => { setShowAddEmergency(v => !v); setEditingEmergency(null) }}
                className="ml-auto flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                {showAddEmergency ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showAddEmergency ? 'Cancel' : 'Add Service'}
              </button>
            </div>

            {/* ── Add Emergency Service inline form ────────────────────── */}
            {showAddEmergency && (
              <div className="px-5 py-4 bg-red-50/60 border-b border-red-100">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> New Emergency Service for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. Vehicle Breakdown"
                      value={newEmergency.label}
                      onChange={e => {
                        const label = e.target.value
                        setNewEmergency(prev => ({
                          ...prev, label,
                          id: prev.id === slugify(prev.label) || prev.id === '' ? slugify(label) : prev.id,
                        }))
                      }}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. breakdown"
                      value={newEmergency.id}
                      onChange={e => setNewEmergency(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">lowercase + underscores only</p>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Engine stopped or won't start"
                      value={newEmergency.description}
                      onChange={e => setNewEmergency(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 500"
                      value={newEmergency.price}
                      onChange={e => setNewEmergency(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estimated Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 15-30 mins"
                      value={newEmergency.estimatedTime}
                      onChange={e => setNewEmergency(prev => ({ ...prev, estimatedTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Urgency Level</label>
                    <select
                      value={newEmergency.urgencyLevel}
                      onChange={e => setNewEmergency(prev => ({ ...prev, urgencyLevel: e.target.value as 'high' | 'medium' }))}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/30 bg-white"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddEmergency}
                    disabled={addingEmergency}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {addingEmergency ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Service
                  </button>
                  <button
                    onClick={() => { setShowAddEmergency(false); setNewEmergency(EMPTY_NEW_EMERGENCY) }}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Emergency Services list ─────────────────────────────── */}
            <div className="divide-y divide-red-50">
              {(currentConfig.emergencyServices ?? []).length === 0 && (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">No emergency services configured</p>
                  <button onClick={() => setShowAddEmergency(true)} className="text-xs text-red-500 font-semibold hover:underline">Add the first one</button>
                </div>
              )}
              {(currentConfig.emergencyServices ?? []).map(svc => {
                const isEditingEs  = editingEmergency === svc.id
                const isSavingEs   = saving === 'es_' + svc.id
                const isTogglingEs = saving === 'es_toggle_' + svc.id
                const isDeletingEs = saving === 'es_del_' + svc.id
                const confirmDelEs = deletingEmergencyId === svc.id

                return (
                  <div
                    key={svc.id}
                    className={`px-5 py-4 transition-colors ${
                      isEditingEs ? 'bg-red-50/60' : confirmDelEs ? 'bg-red-100/50' : 'hover:bg-red-50/30'
                    } ${!svc.isActive ? 'opacity-50' : ''}`}
                  >
                    {isEditingEs ? (
                      /* ── Inline edit form ── */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={emergencyEditForm.label ?? ''}
                            onChange={e => setEmergencyEditForm(p => ({ ...p, label: e.target.value }))}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={emergencyEditForm.price ?? ''}
                            onChange={e => setEmergencyEditForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
                          />
                        </div>
                        <div className="lg:col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={emergencyEditForm.description ?? ''}
                            onChange={e => setEmergencyEditForm(p => ({ ...p, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Estimated Time</label>
                          <input
                            type="text"
                            value={emergencyEditForm.estimatedTime ?? ''}
                            onChange={e => setEmergencyEditForm(p => ({ ...p, estimatedTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Urgency Level</label>
                          <select
                            value={emergencyEditForm.urgencyLevel ?? 'medium'}
                            onChange={e => setEmergencyEditForm(p => ({ ...p, urgencyLevel: e.target.value as 'high' | 'medium' }))}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400/40 bg-white"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                          </select>
                        </div>
                        <div className="lg:col-span-3 flex gap-3 mt-1">
                          <button
                            onClick={() => handleSaveEmergency(svc.id)}
                            disabled={!!isSavingEs}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {isSavingEs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </button>
                          <button onClick={cancelEditEmergency} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Read-only row ── */
                      <div className="flex items-start gap-4">
                        {/* Urgency badge + icon */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${svc.urgencyLevel === 'high' ? 'bg-red-100' : 'bg-orange-100'}`}>
                          <Zap className={`h-4 w-4 ${svc.urgencyLevel === 'high' ? 'text-red-500' : 'text-orange-400'}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm">{svc.label}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                              svc.urgencyLevel === 'high'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}>
                              {svc.urgencyLevel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{svc.description}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">⏱ {svc.estimatedTime} &nbsp;·&nbsp; ID: <span className="font-mono">{svc.id}</span></p>
                        </div>

                        {/* Price */}
                        <span className="text-base font-extrabold text-red-600 min-w-[64px] text-right flex-shrink-0">
                          ₹{svc.price}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {confirmDelEs ? (
                            <>
                              <span className="text-xs text-red-600 font-semibold">Remove?</span>
                              <button
                                onClick={() => handleDeleteEmergency(svc.id)}
                                disabled={!!isDeletingEs}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {isDeletingEs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Yes
                              </button>
                              <button
                                onClick={() => setDeletingEmergencyId(null)}
                                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditEmergency(svc)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                              >
                                <Edit3 className="h-3 w-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleToggleEmergency(svc.id, svc.isActive)}
                                disabled={!!isTogglingEs}
                                title={svc.isActive ? 'Disable' : 'Enable'}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                {isTogglingEs
                                  ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  : svc.isActive
                                    ? <ToggleRight className="h-5 w-5 text-green-500" />
                                    : <ToggleLeft className="h-5 w-5 text-gray-300" />
                                }
                              </button>
                              <button
                                onClick={() => setDeletingEmergencyId(svc.id)}
                                title="Delete service"
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Emergency section footer */}
            <div className="px-5 py-3 bg-red-50/40 border-t border-red-100 text-xs text-gray-400 font-medium flex items-center justify-between">
              <span>🚨 These services appear in the Emergency screen of the mobile app.</span>
              <button
                onClick={() => { setShowAddEmergency(true); setEditingEmergency(null) }}
                className="flex items-center gap-1 text-red-500 font-semibold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Service
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertCircle className="h-10 w-10 mb-3" />
          <p className="font-medium">No config found for {activeTab}</p>
          <p className="text-xs mt-1 text-gray-300">Restart the backend to auto-seed defaults</p>
          <button onClick={fetchConfigs} className="mt-3 text-sm text-[#1B3B6F] font-semibold hover:underline">Retry</button>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
