// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  RefreshCw,
  Loader2,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { adminOtpAPI } from '@/services/api'
import { AdminHeader } from './AdminHeader'

// ─── Types ──────────────────────────────────────────────────────────────
interface OtpRow {
  id: string
  phone: string
  otp: string
  purpose: string
  isVerified: boolean
  attempts: number
  createdAt: string
  expiresAt: string
  expired: boolean
  secondsLeft: number
  userName: string | null
  userRole: string | null
}

// ─── Config ─────────────────────────────────────────────────────────────
const purposeConfig: Record<string, { label: string; className: string }> = {
  registration: { label: 'Sign up', className: 'bg-blue-50 text-blue-700' },
  login: { label: 'Login', className: 'bg-emerald-50 text-emerald-700' },
  reset_password: { label: 'Reset password', className: 'bg-amber-50 text-amber-700' },
  guest_call: { label: 'Guest call', className: 'bg-purple-50 text-purple-700' },
}

const roleConfig: Record<string, { label: string; className: string }> = {
  user: { label: 'User', className: 'bg-blue-50 text-blue-700' },
  mechanic: { label: 'Mechanic', className: 'bg-orange-50 text-orange-700' },
  delivery: { label: 'Delivery', className: 'bg-green-50 text-green-700' },
  shop: { label: 'Shop', className: 'bg-amber-50 text-amber-700' },
  admin: { label: 'Admin', className: 'bg-slate-100 text-slate-700' },
}

// ─── Helpers ────────────────────────────────────────────────────────────
const formatTime = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Component ──────────────────────────────────────────────────────────
export function OtpHelpdesk() {
  const [otps, setOtps] = useState<OtpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPurpose, setSelectedPurpose] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Keep the latest filter values available to the polling interval without
  // re-creating the interval on every keystroke.
  const filtersRef = useRef({ search: '', purpose: 'all' })
  filtersRef.current = { search: debouncedSearch, purpose: selectedPurpose }

  // Debounce the phone search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchOtps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const { search, purpose } = filtersRef.current
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (purpose !== 'all') params.purpose = purpose
      const res = await adminOtpAPI.getAll(params)
      setOtps(res.data?.data?.otps || [])
    } catch (err: any) {
      console.error('Failed to fetch OTPs:', err)
      setError(err.response?.data?.message || 'Failed to load OTPs')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Refetch when the debounced search / purpose changes
  useEffect(() => { fetchOtps() }, [debouncedSearch, selectedPurpose, fetchOtps])

  // Auto-refresh every 8s (silent — no loading spinner flicker)
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => fetchOtps(true), 8000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchOtps])

  const copyOtp = async (row: OtpRow) => {
    try {
      await navigator.clipboard.writeText(row.otp)
      setCopiedId(row.id)
      toast.success(`OTP copied — ${row.otp}`)
      setTimeout(() => setCopiedId((c) => (c === row.id ? null : c)), 1500)
    } catch {
      toast.error('Could not copy. Read it out manually.')
    }
  }

  const activeCount = otps.filter((o) => !o.expired && !o.isVerified).length

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">OTP Helpdesk</h1>
            <p className="text-[#6B7280] mt-1 text-sm">
              Look up a customer&apos;s live OTP when they say the SMS isn&apos;t arriving
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              className={cn('text-xs h-9', autoRefresh && 'bg-[#1B3B6F] hover:bg-[#16305c]')}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', autoRefresh && 'animate-spin')} />
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => fetchOtps()} disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Info / usage banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-[13px] text-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            These OTPs are <b>live</b> and auto-expire ~5 minutes after they&apos;re sent. Use this only to help a
            customer <b>who has just requested an OTP</b> on their own number. Ask them to tap
            &ldquo;Send OTP&rdquo; first, then search their phone number below.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError('')} className="h-7 w-7 p-0">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Search + filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                  <SelectTrigger className="w-[160px] h-9 text-xs">
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All purposes</SelectItem>
                    <SelectItem value="registration">Sign up</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="reset_password">Reset password</SelectItem>
                    <SelectItem value="guest_call">Guest call</SelectItem>
                  </SelectContent>
                </Select>
                {(selectedPurpose !== 'all' || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-gray-500"
                    onClick={() => { setSelectedPurpose('all'); setSearchTerm('') }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
                <Badge variant="outline" className="h-9 px-3 gap-1.5 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50">
                  <span className="relative flex h-2 w-2">
                    {activeCount > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {activeCount} live
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OTP Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone / Account</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">OTP Code</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Purpose</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Attempts</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1B3B6F]" />
                        <p className="text-gray-400 text-sm">Loading OTPs...</p>
                      </TableCell>
                    </TableRow>
                  ) : otps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <KeyRound className="h-7 w-7 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-[#1A1D29]">No live OTPs right now</p>
                          <p className="text-sm text-[#6B7280] mt-1">
                            {searchTerm
                              ? 'No active OTP for this number. Ask the customer to request a fresh OTP.'
                              : 'OTPs appear here the moment a customer requests one, and disappear after ~5 min.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    otps.map((row) => {
                      const pCfg = purposeConfig[row.purpose] || { label: row.purpose, className: 'bg-gray-100 text-gray-700' }
                      const stripe = row.expired ? '#9ca3af' : row.isVerified ? '#10b981' : '#FF6B35'
                      return (
                        <TableRow
                          key={row.id}
                          className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                          style={{ borderLeftColor: stripe }}
                        >
                          {/* Phone / Account */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#1B3B6F]/[0.08] text-[11px] font-bold text-[#1B3B6F]">
                                {row.userName ? getInitials(row.userName) : <KeyRound className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#1A1D29] text-sm leading-tight tabular-nums">{row.phone}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {row.userName ? (
                                    <>
                                      <span className="text-[11px] text-[#6B7280] truncate max-w-[120px]">{row.userName}</span>
                                      {row.userRole && (
                                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', roleConfig[row.userRole]?.className || 'bg-gray-50 text-gray-600')}>
                                          {roleConfig[row.userRole]?.label || row.userRole}
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[11px] text-[#9CA3AF]">New / no account yet</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* OTP Code — big + copyable */}
                          <TableCell>
                            <button
                              onClick={() => copyOtp(row)}
                              className={cn(
                                'group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors',
                                row.expired ? 'bg-gray-50 hover:bg-gray-100' : 'bg-[#FFF1E8] hover:bg-[#FFE4D3]'
                              )}
                              title="Click to copy"
                            >
                              <span className={cn(
                                'font-mono text-lg font-extrabold tracking-[0.22em] tabular-nums',
                                row.expired ? 'text-gray-400 line-through' : 'text-[#1A1D29]'
                              )}>
                                {row.otp}
                              </span>
                              {copiedId === row.id ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#FF6B35]" />
                              )}
                            </button>
                          </TableCell>

                          {/* Purpose */}
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 border-0', pCfg.className)}>
                              {pCfg.label}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {row.expired ? (
                              <Badge className="text-xs gap-1 border bg-gray-100 text-gray-600 border-gray-200">
                                <Clock className="h-3 w-3" /> Expired
                              </Badge>
                            ) : row.isVerified ? (
                              <Badge className="text-xs gap-1 border bg-emerald-100 text-emerald-800 border-emerald-200">
                                <ShieldCheck className="h-3 w-3" /> Used
                              </Badge>
                            ) : (
                              <Badge className="text-xs gap-1 border bg-orange-100 text-orange-800 border-orange-200">
                                <Clock className="h-3 w-3" /> Active · {row.secondsLeft}s
                              </Badge>
                            )}
                          </TableCell>

                          {/* Attempts */}
                          <TableCell>
                            <span className={cn(
                              'text-sm font-medium tabular-nums',
                              row.attempts >= 4 ? 'text-red-600' : row.attempts > 0 ? 'text-amber-600' : 'text-[#9CA3AF]'
                            )}>
                              {row.attempts}/5
                            </span>
                          </TableCell>

                          {/* Sent time */}
                          <TableCell>
                            <span className="text-sm text-[#6B7280] tabular-nums">{formatTime(row.createdAt)}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OtpHelpdesk
