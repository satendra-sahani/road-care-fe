'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Save, Plus, Trash2, Loader2, CheckCircle, Gift, TrendingUp, Sparkles, AlertCircle,
  UserPlus, Search, Zap, ShieldAlert, Lock, Unlock, IndianRupee, Settings2, ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { AdminHeader } from './AdminHeader'
import { spinConfigAPI } from '@/services/api'

interface SpinRestriction {
  enabled: boolean
  isInfluencer: boolean
  reason?: string
  setAt?: string
  setBy?: { _id: string; fullName?: string } | string | null
}

interface GrantUser {
  _id: string
  fullName: string
  phone: string
  role?: string
  bonusSpins?: number
  referralCode?: string
  spinRestriction?: SpinRestriction
}

interface RestrictedUser {
  _id: string
  fullName: string
  phone: string
  role?: string
  bonusSpins?: number
  referralCode?: string
  spinRestriction: SpinRestriction
}

interface Grant {
  _id: string
  user?: { _id: string; fullName: string; phone: string; bonusSpins: number }
  grantedBy?: { fullName: string }
  spins: number
  reason: string
  createdAt: string
}

type RewardType = 'wallet_credit' | 'coupon' | 'free_service_check' | 'better_luck' | 'jackpot_wallet'

interface Segment {
  _id?: string
  label: string
  rewardType: RewardType
  value: number
  weight: number
  color: string
  couponTemplate?: {
    discountType?: 'flat' | 'percent'
    discountValue?: number
    maxDiscount?: number
    minOrderValue?: number
    validForDays?: number
  }
}

interface SpinConfig {
  _id: string
  name: string
  isActive: boolean
  dailyFreeSpins: number
  dailyJackpotCap: number
  segments: Segment[]
  updatedAt: string
}

interface Analytics {
  totalSpins: number
  byType: { _id: string; count: number; totalValue: number }[]
  jackpotsToday: number
  windowDays: number
}

const emptySegment: Segment = {
  label: '', rewardType: 'wallet_credit', value: 10, weight: 10, color: '#4CAF50',
}

export function SpinWheelManagement() {
  const [configs, setConfigs] = useState<SpinConfig[]>([])
  const [editing, setEditing] = useState<SpinConfig | null>(null)
  const [form, setForm] = useState<Partial<SpinConfig>>({
    name: '', dailyFreeSpins: 1, dailyJackpotCap: 5, segments: [{ ...emptySegment }],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Grant bonus spins
  const [grants, setGrants] = useState<Grant[]>([])
  const [grantDialog, setGrantDialog] = useState(false)
  const [grantSearch, setGrantSearch] = useState('')
  const [grantSearchResults, setGrantSearchResults] = useState<GrantUser[]>([])
  const [grantSelectedUser, setGrantSelectedUser] = useState<GrantUser | null>(null)
  const [grantSpinsCount, setGrantSpinsCount] = useState(1)
  const [grantReason, setGrantReason] = useState('')
  const [grantSubmitting, setGrantSubmitting] = useState(false)
  const [grantSearching, setGrantSearching] = useState(false)

  // Spin restriction (influencer/demo rigging)
  const [restrictions, setRestrictions] = useState<RestrictedUser[]>([])
  const [restrictDialog, setRestrictDialog] = useState(false)
  const [restrictSearch, setRestrictSearch] = useState('')
  const [restrictSearchResults, setRestrictSearchResults] = useState<GrantUser[]>([])
  const [restrictSelectedUser, setRestrictSelectedUser] = useState<GrantUser | null>(null)
  const [restrictEnabled, setRestrictEnabled] = useState(true)
  const [restrictIsInfluencer, setRestrictIsInfluencer] = useState(false)
  const [restrictReason, setRestrictReason] = useState('')
  const [restrictSubmitting, setRestrictSubmitting] = useState(false)
  const [restrictSearching, setRestrictSearching] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [configsRes, analyticsRes, grantsRes, restrictionsRes] = await Promise.all([
        spinConfigAPI.list(),
        spinConfigAPI.analytics(30),
        spinConfigAPI.listGrants({ limit: 10 }),
        spinConfigAPI.listRestrictions({ limit: 20 }),
      ])
      setConfigs(configsRes.data?.data || [])
      setAnalytics(analyticsRes.data?.data || null)
      setGrants(grantsRes.data?.data || [])
      setRestrictions(restrictionsRes.data?.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load configs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setEditing(null)
    setForm({ name: '', dailyFreeSpins: 1, dailyJackpotCap: 5, segments: [{ ...emptySegment }] })
  }

  const startEdit = (c: SpinConfig) => {
    setEditing(c)
    setForm({
      name: c.name, dailyFreeSpins: c.dailyFreeSpins, dailyJackpotCap: c.dailyJackpotCap,
      segments: c.segments.map(s => ({ ...s })), isActive: c.isActive,
    })
  }

  const updateSegment = (i: number, patch: Partial<Segment>) => {
    const next = [...(form.segments || [])]
    next[i] = { ...next[i], ...patch }
    setForm({ ...form, segments: next })
  }

  const addSegment = () => setForm({ ...form, segments: [...(form.segments || []), { ...emptySegment }] })
  const removeSegment = (i: number) => {
    const next = [...(form.segments || [])]
    next.splice(i, 1)
    setForm({ ...form, segments: next })
  }

  const save = async () => {
    setError(''); setMessage(''); setSaving(true)
    try {
      if (!form.segments || form.segments.length < 2) throw new Error('At least 2 segments required')
      const totalWeight = form.segments.reduce((s, seg) => s + Number(seg.weight || 0), 0)
      if (totalWeight <= 0) throw new Error('Total weight must be > 0')

      if (editing) {
        await spinConfigAPI.update(editing._id, form)
        setMessage('Config updated')
      } else {
        await spinConfigAPI.create(form)
        setMessage('Config created')
      }
      resetForm()
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const activate = async (id: string) => {
    try {
      await spinConfigAPI.activate(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to activate')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this config?')) return
    try {
      await spinConfigAPI.delete(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete')
    }
  }

  // ─── Grant bonus spins handlers ────────────────────────────────
  const resetGrantForm = () => {
    setGrantSearch('')
    setGrantSearchResults([])
    setGrantSelectedUser(null)
    setGrantSpinsCount(1)
    setGrantReason('')
  }

  useEffect(() => {
    // Debounced user search (skip when a user is already selected)
    if (grantSelectedUser) return
    if (!grantSearch.trim() || grantSearch.trim().length < 2) {
      setGrantSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setGrantSearching(true)
        const res = await spinConfigAPI.searchUsers(grantSearch.trim())
        setGrantSearchResults(res.data?.data || [])
      } catch { /* ignore */ } finally {
        setGrantSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [grantSearch, grantSelectedUser])

  // ─── Spin restriction handlers ─────────────────────────────────
  const resetRestrictForm = () => {
    setRestrictSearch('')
    setRestrictSearchResults([])
    setRestrictSelectedUser(null)
    setRestrictEnabled(true)
    setRestrictIsInfluencer(false)
    setRestrictReason('')
  }

  const openRestrictDialogFor = (u: RestrictedUser | GrantUser, prefill?: SpinRestriction) => {
    resetRestrictForm()
    setRestrictSelectedUser({
      _id: u._id,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      bonusSpins: u.bonusSpins,
      spinRestriction: (u as RestrictedUser).spinRestriction,
    })
    const r = prefill || (u as RestrictedUser).spinRestriction
    if (r) {
      setRestrictEnabled(!!r.enabled)
      setRestrictIsInfluencer(!!r.isInfluencer)
      setRestrictReason(r.reason || '')
    }
    setRestrictDialog(true)
  }

  useEffect(() => {
    if (restrictSelectedUser) return
    if (!restrictSearch.trim() || restrictSearch.trim().length < 2) {
      setRestrictSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setRestrictSearching(true)
        const res = await spinConfigAPI.searchUsers(restrictSearch.trim())
        setRestrictSearchResults(res.data?.data || [])
      } catch { /* ignore */ } finally {
        setRestrictSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [restrictSearch, restrictSelectedUser])

  const submitRestriction = async () => {
    if (!restrictSelectedUser) { setError('Select a user first'); return }
    setRestrictSubmitting(true); setError(''); setMessage('')
    try {
      const res = await spinConfigAPI.setRestriction({
        userId: restrictSelectedUser._id,
        enabled: restrictEnabled,
        isInfluencer: restrictIsInfluencer,
        reason: restrictReason || undefined,
      })
      if (res.data?.success) {
        setMessage(
          restrictEnabled
            ? `Rig enabled for ${restrictSelectedUser.fullName} (${restrictIsInfluencer ? 'Influencer — always big win' : 'Demo — rare ₹5, mostly lose'})`
            : `Rig cleared for ${restrictSelectedUser.fullName}`
        )
        setRestrictDialog(false)
        resetRestrictForm()
        await load()
      } else {
        setError(res.data?.message || 'Failed to save restriction')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save restriction')
    } finally {
      setRestrictSubmitting(false)
    }
  }

  const clearRestriction = async (userId: string, name: string) => {
    if (!confirm(`Remove spin rig for ${name}?`)) return
    try {
      const res = await spinConfigAPI.setRestriction({
        userId, enabled: false,
      })
      if (res.data?.success) {
        setMessage(`Rig cleared for ${name}`)
        await load()
      } else {
        setError(res.data?.message || 'Failed to clear restriction')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to clear restriction')
    }
  }

  const submitGrant = async () => {
    if (!grantSelectedUser) { setError('Select a user first'); return }
    if (!grantSpinsCount || grantSpinsCount <= 0) { setError('Spins must be a positive number'); return }
    setGrantSubmitting(true); setError(''); setMessage('')
    try {
      const res = await spinConfigAPI.grantSpins(
        grantSelectedUser._id, grantSpinsCount, grantReason || undefined
      )
      if (res.data?.success) {
        setMessage(`Granted ${grantSpinsCount} spin${grantSpinsCount > 1 ? 's' : ''} to ${grantSelectedUser.fullName}`)
        setGrantDialog(false)
        resetGrantForm()
        await load()
      } else {
        setError(res.data?.message || 'Grant failed')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Grant failed')
    } finally {
      setGrantSubmitting(false)
    }
  }

  const totalWeight = (form.segments || []).reduce((s, seg) => s + Number(seg.weight || 0), 0)

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">
              Spin & Win — Wheel Configuration
            </h1>
            <p className="text-[#6B7280] mt-1 text-sm">
              Manage reward segments and probability weights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { resetRestrictForm(); setRestrictDialog(true) }}
              variant="outline"
              size="sm"
              className="h-9 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-1.5" /> Rig User Spin
            </Button>
            <Button
              onClick={() => { resetGrantForm(); setGrantDialog(true) }}
              size="sm"
              className="h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Grant Bonus Spins
            </Button>
          </div>
        </div>

      {/* Analytics: wallet-credit hero + supporting stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Wallet credit paid — headline money metric */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
          <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Wallet credit paid (30d)</p>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
              <IndianRupee className="h-[18px] w-[18px] text-white" />
            </div>
          </div>
          <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white">
            ₹{(analytics?.byType?.filter(b => b._id === 'wallet_credit' || b._id === 'jackpot_wallet').reduce((s, b) => s + (b.totalValue || 0), 0) ?? 0).toLocaleString('en-IN')}
          </p>
          <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
            <span>Over last <b className="text-white">{analytics?.windowDays ?? 30}</b> days</span>
          </div>
        </div>

        {/* Supporting stat cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total spins (30d)</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50">
                <Sparkles className="h-[18px] w-[18px] text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{analytics?.totalSpins ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Jackpots today</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50">
                <Gift className="h-[18px] w-[18px] text-rose-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{analytics?.jackpotsToday ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Active configs</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50">
                <CheckCircle className="h-[18px] w-[18px] text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{configs.filter(c => c.isActive).length}</p>
            <p className="text-xs text-gray-400">of {configs.length} total</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
      {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 shrink-0"/>{message}</div>}

      {/* Form */}
      <Card className="border-gray-100 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#1A1D29]">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B3B6F]/10">
              <Settings2 className="h-4 w-4 text-[#1B3B6F]" />
            </div>
            {editing ? `Edit: ${editing.name}` : 'Create new wheel config'}
          </CardTitle>
          {editing && <Button variant="outline" size="sm" onClick={resetForm}>Cancel edit</Button>}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Diwali wheel" />
            </div>
            <div>
              <Label>Daily free spins per user</Label>
              <Input type="number" min={1} value={form.dailyFreeSpins || 1} onChange={e => setForm({ ...form, dailyFreeSpins: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Daily jackpot cap (all users)</Label>
              <Input type="number" min={0} value={form.dailyJackpotCap || 0} onChange={e => setForm({ ...form, dailyJackpotCap: Number(e.target.value) })} />
            </div>
          </div>

          {/* Segments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Segments (total weight: {totalWeight})</Label>
              <Button variant="outline" size="sm" onClick={addSegment}><Plus className="h-4 w-4 mr-1"/>Add segment</Button>
            </div>
            <div className="space-y-3">
              {(form.segments || []).map((seg, i) => {
                const prob = totalWeight ? ((seg.weight / totalWeight) * 100).toFixed(1) : '0'
                return (
                  <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-shadow hover:shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="md:col-span-2">
                        <Label>Label</Label>
                        <Input value={seg.label} onChange={e => updateSegment(i, { label: e.target.value })} />
                      </div>
                      <div>
                        <Label>Reward type</Label>
                        <Select value={seg.rewardType} onValueChange={(v: RewardType) => updateSegment(i, { rewardType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wallet_credit">Wallet credit</SelectItem>
                            <SelectItem value="jackpot_wallet">Jackpot wallet</SelectItem>
                            <SelectItem value="coupon">Coupon</SelectItem>
                            <SelectItem value="free_service_check">Free service check</SelectItem>
                            <SelectItem value="better_luck">Better luck</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Value (₹)</Label>
                        <Input type="number" min={0} value={seg.value} onChange={e => updateSegment(i, { value: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <Input type="number" min={0} value={seg.weight} onChange={e => updateSegment(i, { weight: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input type="color" value={seg.color} onChange={e => updateSegment(i, { color: e.target.value })} />
                      </div>
                    </div>
                    {seg.rewardType === 'coupon' && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">Discount type</Label>
                          <Select
                            value={seg.couponTemplate?.discountType || 'percent'}
                            onValueChange={(v: 'flat' | 'percent') => updateSegment(i, { couponTemplate: { ...seg.couponTemplate, discountType: v } })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">Percent (%)</SelectItem>
                              <SelectItem value="flat">Flat (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Discount value</Label>
                          <Input type="number" min={0} value={seg.couponTemplate?.discountValue || 0}
                            onChange={e => updateSegment(i, { couponTemplate: { ...seg.couponTemplate, discountValue: Number(e.target.value) } })} />
                        </div>
                        <div>
                          <Label className="text-xs">Max discount (₹)</Label>
                          <Input type="number" min={0} value={seg.couponTemplate?.maxDiscount || 0}
                            onChange={e => updateSegment(i, { couponTemplate: { ...seg.couponTemplate, maxDiscount: Number(e.target.value) } })} />
                        </div>
                        <div>
                          <Label className="text-xs">Min order (₹)</Label>
                          <Input type="number" min={0} value={seg.couponTemplate?.minOrderValue || 0}
                            onChange={e => updateSegment(i, { couponTemplate: { ...seg.couponTemplate, minOrderValue: Number(e.target.value) } })} />
                        </div>
                        <div>
                          <Label className="text-xs">Valid (days)</Label>
                          <Input type="number" min={1} value={seg.couponTemplate?.validForDays || 30}
                            onChange={e => updateSegment(i, { couponTemplate: { ...seg.couponTemplate, validForDays: Number(e.target.value) } })} />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <Badge variant="outline" style={{ borderColor: seg.color, color: seg.color }}>
                        Probability: {prob}%
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeSegment(i)} disabled={(form.segments || []).length <= 2}>
                        <Trash2 className="h-4 w-4 mr-1"/>Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 items-center pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              Set active after save
            </label>
            <div className="flex-1"/>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
              {editing ? 'Update config' : 'Create config'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-gray-100 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#1A1D29]">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B3B6F]/10">
              <ListChecks className="h-4 w-4 text-[#1B3B6F]" />
            </div>
            All configs ({configs.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1"/>Refresh</Button>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-[#1B3B6F]"/></div>
          ) : (
            <div className="space-y-3">
              {configs.map(c => (
                <div
                  key={c._id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-l-[3px]"
                  style={{ borderLeftColor: c.isActive ? '#22c55e' : '#e5e7eb' }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1A1D29]">{c.name}</span>
                        {c.isActive && <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>}
                        <span className="text-xs text-gray-400">{c.segments.length} segments · {c.dailyFreeSpins}/day</span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {c.segments.map(s => (
                          <span key={s._id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.color + '22', color: s.color }}>
                            {s.label} ({s.weight})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!c.isActive && <Button size="sm" variant="outline" onClick={() => activate(c._id)}>Activate</Button>}
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(c._id)} disabled={c.isActive}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </div>
              ))}
              {configs.length === 0 && <div className="text-center py-8 text-gray-500">No configs yet. Create one above.</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent bonus grants */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#1A1D29]">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            Recent bonus-spin grants
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { resetGrantForm(); setGrantDialog(true) }}>
            <UserPlus className="h-4 w-4 mr-1" /> New grant
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {grants.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No grants issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 bg-[#F6F8FB] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-2 text-xs font-semibold uppercase tracking-wide">When</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">User</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide">Spins</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">Reason</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">Granted by</th>
                    <th className="text-right px-2 text-xs font-semibold uppercase tracking-wide">Current bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map(g => (
                    <tr key={g._id} className="border-b border-gray-100 hover:bg-[#1B3B6F]/[0.03] transition-colors">
                      <td className="py-2.5 px-2 text-xs text-gray-500">{new Date(g.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="font-medium text-[#1A1D29]">{g.user?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{g.user?.phone}</div>
                      </td>
                      <td className="text-right">
                        <Badge className="bg-amber-100 text-amber-700">+{g.spins}</Badge>
                      </td>
                      <td className="text-gray-600 max-w-xs truncate">{g.reason}</td>
                      <td className="text-xs text-gray-600">{g.grantedBy?.fullName || '—'}</td>
                      <td className="text-right px-2 font-semibold tabular-nums text-[#1A1D29]">{g.user?.bonusSpins ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restricted users (rigged spins) */}
      <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#1A1D29]">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            Rigged spin accounts
            <span className="text-xs font-normal text-gray-400">
              (influencer/demo — outcomes confined to low-value rewards)
            </span>
          </CardTitle>
          <Button variant="outline" size="sm"
            onClick={() => { resetRestrictForm(); setRestrictDialog(true) }}>
            <Lock className="h-4 w-4 mr-1" /> Rig user
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {restrictions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No users are currently restricted. Use this for influencer demo accounts
              to guarantee they only win low-value rewards on camera.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 bg-[#F6F8FB] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-2 text-xs font-semibold uppercase tracking-wide">User</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">Mode</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">Reason</th>
                    <th className="text-xs font-semibold uppercase tracking-wide">Since</th>
                    <th className="text-right px-2 text-xs font-semibold uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restrictions.map(u => (
                    <tr
                      key={u._id}
                      className="border-b border-gray-100 hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                      style={{ borderLeftColor: u.spinRestriction.isInfluencer ? '#f59e0b' : '#94a3b8' }}
                    >
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-[#1A1D29]">{u.fullName}</div>
                        <div className="text-xs text-gray-500">{u.phone}</div>
                      </td>
                      <td>
                        {u.spinRestriction.isInfluencer ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            Influencer — always big win
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700">
                            Demo — rare ₹5, mostly lose
                          </Badge>
                        )}
                      </td>
                      <td className="text-gray-600 max-w-xs truncate">
                        {u.spinRestriction.reason || '—'}
                      </td>
                      <td className="text-xs text-gray-500">
                        {u.spinRestriction.setAt
                          ? new Date(u.spinRestriction.setAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-right px-2">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost"
                            onClick={() => openRestrictDialogFor(u)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost"
                            className="text-emerald-700"
                            onClick={() => clearRestriction(u._id, u.fullName)}>
                            <Unlock className="h-4 w-4 mr-1"/> Clear
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spin restriction dialog */}
      <Dialog open={restrictDialog}
        onOpenChange={(open) => { setRestrictDialog(open); if (!open) resetRestrictForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              </div>
              Rig spin outcomes for user
            </DialogTitle>
            <DialogDescription>
              The wheel UI always shows every prize — but the backend picks the winning
              segment for this user based on the mode below.
              <br /><br />
              <strong>Influencer mode:</strong> user <em>always</em> lands on the highest-value
              cash prize on the wheel (₹1000, ₹5000, jackpot, etc.). Use this for on-camera
              "big win" content.
              <br />
              <strong>Demo mode (default):</strong> user mostly gets "try again" or 10% off,
              with a rare ₹5 win every few spins. Use this for cheap demo / test accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User picker */}
            {restrictSelectedUser ? (
              <div className="border rounded-lg p-3 bg-rose-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{restrictSelectedUser.fullName}</div>
                  <div className="text-xs text-gray-600">
                    {restrictSelectedUser.phone}
                    {restrictSelectedUser.spinRestriction?.enabled && (
                      <> · <span className="text-rose-700">
                        Currently rigged ({restrictSelectedUser.spinRestriction.isInfluencer ? 'Influencer' : 'Demo'})
                      </span></>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost"
                  onClick={() => { setRestrictSelectedUser(null); setRestrictSearch('') }}>
                  Change
                </Button>
              </div>
            ) : (
              <div>
                <Label>Search user by name or phone</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input className="pl-9"
                    value={restrictSearch}
                    onChange={e => setRestrictSearch(e.target.value)}
                    placeholder="Type at least 2 characters" />
                </div>
                {restrictSearching && <div className="text-xs text-gray-500 mt-1">Searching…</div>}
                {restrictSearchResults.length > 0 && (
                  <div className="border rounded-lg mt-2 max-h-48 overflow-y-auto divide-y">
                    {restrictSearchResults.map(u => (
                      <button key={u._id} type="button"
                        className="w-full text-left p-2 hover:bg-gray-50 focus:bg-gray-100"
                        onClick={() => {
                          const existing = u.spinRestriction
                          setRestrictSelectedUser(u)
                          setRestrictSearchResults([])
                          if (existing?.enabled) {
                            setRestrictEnabled(true)
                            setRestrictIsInfluencer(!!existing.isInfluencer)
                            setRestrictReason(existing.reason || '')
                          }
                        }}>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {u.fullName}
                          {u.spinRestriction?.enabled && (
                            <Badge className="bg-rose-100 text-rose-700 text-xs">Rigged</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.phone} · {u.role || 'user'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox"
                  checked={restrictEnabled}
                  onChange={e => setRestrictEnabled(e.target.checked)} />
                Enable rigged outcomes for this user
              </label>

              {restrictEnabled && (
                <div className="pl-1 space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input type="checkbox"
                      className="mt-1"
                      checked={restrictIsInfluencer}
                      onChange={e => setRestrictIsInfluencer(e.target.checked)} />
                    <div>
                      <div className="font-medium text-amber-800">
                        Is this user an influencer?
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {restrictIsInfluencer
                          ? '✔ ON → User will ALWAYS win the highest cash prize on the wheel (₹1000, ₹5000, etc.). Good for on-camera big-win footage.'
                          : '✘ OFF → Demo mode. User mostly gets "try again" / 10% off, with a rare ₹5 win every few spins.'}
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <Label>Reason / note</Label>
                <Input value={restrictReason}
                  onChange={e => setRestrictReason(e.target.value)}
                  placeholder="e.g. YouTube influencer demo account" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline"
              onClick={() => { setRestrictDialog(false); resetRestrictForm() }}>
              Cancel
            </Button>
            <Button
              onClick={submitRestriction}
              disabled={restrictSubmitting || !restrictSelectedUser}
              className={restrictEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
              {restrictSubmitting
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : restrictEnabled
                  ? <Lock className="h-4 w-4 mr-2" />
                  : <Unlock className="h-4 w-4 mr-2" />}
              {restrictEnabled ? 'Save rig' : 'Disable rig'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant bonus spins dialog */}
      <Dialog open={grantDialog} onOpenChange={(open) => { setGrantDialog(open); if (!open) resetGrantForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
                <Gift className="h-4 w-4 text-amber-600" />
              </div>
              Grant bonus spins
            </DialogTitle>
            <DialogDescription>
              Give a specific user extra spins. Bonus spins are consumed after their daily free allotment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User picker */}
            {grantSelectedUser ? (
              <div className="border rounded-lg p-3 bg-amber-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{grantSelectedUser.fullName}</div>
                  <div className="text-xs text-gray-600">
                    {grantSelectedUser.phone}
                    {typeof grantSelectedUser.bonusSpins === 'number' && (
                      <> · Current bonus: <strong>{grantSelectedUser.bonusSpins}</strong></>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setGrantSelectedUser(null); setGrantSearch('') }}>
                  Change
                </Button>
              </div>
            ) : (
              <div>
                <Label>Search user by name or phone</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    value={grantSearch}
                    onChange={e => setGrantSearch(e.target.value)}
                    placeholder="Type at least 2 characters"
                  />
                </div>
                {grantSearching && <div className="text-xs text-gray-500 mt-1">Searching…</div>}
                {grantSearchResults.length > 0 && (
                  <div className="border rounded-lg mt-2 max-h-48 overflow-y-auto divide-y">
                    {grantSearchResults.map(u => (
                      <button
                        key={u._id}
                        type="button"
                        className="w-full text-left p-2 hover:bg-gray-50 focus:bg-gray-100"
                        onClick={() => { setGrantSelectedUser(u); setGrantSearchResults([]) }}
                      >
                        <div className="font-medium text-sm">{u.fullName}</div>
                        <div className="text-xs text-gray-500">{u.phone} · {u.role || 'user'} · bonus {u.bonusSpins ?? 0}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Spins to grant</Label>
                <Input
                  type="number" min={1} max={100}
                  value={grantSpinsCount}
                  onChange={e => setGrantSpinsCount(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end gap-1">
                {[1, 3, 5, 10].map(n => (
                  <Button key={n} size="sm" variant="outline"
                    onClick={() => setGrantSpinsCount(n)}
                    className={grantSpinsCount === n ? 'bg-amber-100 border-amber-400' : ''}
                  >
                    +{n}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={grantReason}
                onChange={e => setGrantReason(e.target.value)}
                placeholder="e.g. Customer support gesture, loyalty reward"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGrantDialog(false); resetGrantForm() }}>Cancel</Button>
            <Button
              onClick={submitGrant}
              disabled={grantSubmitting || !grantSelectedUser || grantSpinsCount <= 0}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {grantSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              Grant {grantSpinsCount > 0 ? grantSpinsCount : ''} spin{grantSpinsCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
