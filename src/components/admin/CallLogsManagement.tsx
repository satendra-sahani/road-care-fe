// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  MoreHorizontal,
  Eye,
  Phone,
  Video,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  PhoneOff,
  PhoneIncoming,
  PhoneMissed,
  Timer,
  Play,
  Pause,
  Volume2,
  Users,
  Wrench,
  ShoppingBag,
  Calendar,
  X,
  ArrowUpRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { adminCallLogsAPI } from '@/services/api'
import { AdminHeader } from './AdminHeader'

// ─── Types ──────────────────────────────────────────────────────────────
interface CallUser {
  _id: string
  fullName: string
  phone: string
  profileImage?: string
  role: string
}

interface CallLog {
  _id: string
  caller: CallUser | null
  callerRole: string
  receiver: CallUser | null
  receiverRole: string
  context: {
    type: string
    referenceId: string
  }
  agora?: {
    channelName: string
    callerUid: number
    receiverUid: number
  }
  status: string
  callType: string
  duration: number
  endedAt?: string
  callerPhone?: string
  receiverPhone?: string
  createdAt: string
  contextDetail?: any
  recording?: {
    resourceId?: string
    sid?: string
    status?: string
    url?: string
  }
}

interface CallStats {
  totalCalls: number
  completedCalls: number
  missedCalls: number
  rejectedCalls: number
  failedCalls: number
  todayCalls: number
  avgDuration: number
  totalDuration: number
  maxDuration: number
  answerRate: number
  byRole: Record<string, number>
  byContext: Record<string, number>
  dailyCalls: Array<{ _id: string; count: number; completed: number; missed: number }>
}

// ─── Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  initiated: { label: 'Initiated', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Phone },
  ringing: { label: 'Ringing', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: PhoneIncoming },
  answered: { label: 'Answered', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-800 border-red-200', icon: PhoneMissed },
  rejected: { label: 'Rejected', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: PhoneOff },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
}

// Left-edge stripe color per call status — makes the table scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  initiated: '#3b82f6',
  ringing: '#f59e0b',
  answered: '#22c55e',
  missed: '#ef4444',
  rejected: '#f97316',
  completed: '#10b981',
  failed: '#ef4444',
}

const roleConfig: Record<string, { label: string; className: string }> = {
  user: { label: 'User', className: 'bg-blue-50 text-blue-700' },
  mechanic: { label: 'Mechanic', className: 'bg-orange-50 text-orange-700' },
  delivery: { label: 'Delivery', className: 'bg-green-50 text-green-700' },
  guest: { label: 'Guest (QR)', className: 'bg-purple-50 text-purple-700' },
  shop: { label: 'Shop', className: 'bg-amber-50 text-amber-700' },
  admin: { label: 'Admin', className: 'bg-slate-100 text-slate-700' },
}

// ─── Helpers ────────────────────────────────────────────────────────────
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateShort = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Component ──────────────────────────────────────────────────────────
export function CallLogsManagement() {
  // Data
  const [calls, setCalls] = useState<CallLog[]>([])
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0, completedCalls: 0, missedCalls: 0, rejectedCalls: 0,
    failedCalls: 0, todayCalls: 0, avgDuration: 0, totalDuration: 0,
    maxDuration: 0, answerRate: 0, byRole: {}, byContext: {}, dailyCalls: [],
  })

  // UI State
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCallType, setSelectedCallType] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedContext, setSelectedContext] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCalls, setTotalCalls] = useState(0)

  // Detail dialog
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Audio player
  const [playingCallId, setPlayingCallId] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const togglePlayRecording = (callId: string, url: string) => {
    if (playingCallId === callId) {
      // Stop playing
      audioRef.current?.pause()
      setPlayingCallId(null)
    } else {
      // Play new recording
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(url)
      audio.onended = () => setPlayingCallId(null)
      audio.onerror = () => {
        setPlayingCallId(null)
        setError('Failed to play recording. The file may not be available.')
      }
      audio.play().catch(() => {
        setPlayingCallId(null)
        setError('Failed to play recording')
      })
      audioRef.current = audio
      setPlayingCallId(callId)
    }
  }

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // Search debounce
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1) }, [selectedStatus, selectedCallType, selectedRole, selectedContext])

  // ─── Fetch calls ──────────────────────────────────────────────────────
  const fetchCalls = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page: currentPage, limit: itemsPerPage }
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedCallType !== 'all') params.callType = selectedCallType
      if (selectedRole !== 'all') params.callerRole = selectedRole
      if (selectedContext !== 'all') params.contextType = selectedContext
      if (debouncedSearch) params.search = debouncedSearch

      const response = await adminCallLogsAPI.getAll(params)
      const data = response.data
      setCalls(data.data || [])
      if (data.pagination) {
        setTotalPages(data.pagination.pages || 1)
        setTotalCalls(data.pagination.total || 0)
      }
    } catch (err: any) {
      console.error('Failed to fetch call logs:', err)
      setError(err.response?.data?.message || 'Failed to load call logs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, selectedStatus, selectedCallType, selectedRole, selectedContext, debouncedSearch])

  // ─── Fetch stats ──────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await adminCallLogsAPI.getStats()
      if (response.data?.data) {
        setStats(response.data.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch call stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCalls() }, [fetchCalls])
  useEffect(() => { fetchStats() }, [fetchStats])

  // ─── View detail ──────────────────────────────────────────────────────
  const openDetail = async (call: CallLog) => {
    setSelectedCall(call)
    setIsDetailOpen(true)
    setDetailLoading(true)
    try {
      const response = await adminCallLogsAPI.getById(call._id)
      if (response.data?.data) {
        setSelectedCall(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch call detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  // ─── KPI Cards ────────────────────────────────────────────────────────
  // Status-backed cards double as quick filters — they reuse the existing
  // selectedStatus / setSelectedStatus filter state, no new logic added.
  const statusFilterCards = [
    { key: 'completed', label: 'Completed', value: stats.completedCalls, icon: CheckCircle, tint: 'text-emerald-600 bg-emerald-50' },
    { key: 'missed', label: 'Missed', value: stats.missedCalls, icon: PhoneMissed, tint: 'text-red-600 bg-red-50' },
    { key: 'rejected', label: 'Rejected', value: stats.rejectedCalls, icon: PhoneOff, tint: 'text-orange-600 bg-orange-50' },
  ]

  const metricCards = [
    { label: 'Today', value: stats.todayCalls, icon: Calendar, tint: 'text-cyan-600 bg-cyan-50' },
    { label: 'Avg Duration', value: formatDuration(stats.avgDuration), icon: Timer, tint: 'text-violet-600 bg-violet-50' },
    { label: 'Answer Rate', value: `${stats.answerRate}%`, icon: TrendingUp, tint: 'text-pink-600 bg-pink-50' },
  ]

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Call Logs</h1>
            <p className="text-[#6B7280] mt-1 text-sm">Monitor all in-app calls between users, mechanics, and delivery partners</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => { fetchCalls(); fetchStats() }}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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

        {/* KPI row: total-calls hero + clickable status quick-filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Total calls hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Total Calls</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <Phone className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
              {statsLoading ? '—' : stats.totalCalls}
            </p>
            <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
              <span><b className="text-white">{statsLoading ? '—' : stats.todayCalls}</b> today</span>
              <span className="text-white/30">·</span>
              <span><b className="text-white">{statsLoading ? '—' : `${stats.answerRate}%`}</b> answered</span>
            </div>
          </div>

          {/* Clickable status filter cards — reuse existing selectedStatus filter */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-3">
            {statusFilterCards.map((s) => {
              const Icon = s.icon
              const active = selectedStatus === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedStatus(s.key)}
                  className={`text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {active && <span className="text-[9px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>}
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{statsLoading ? '—' : s.value}</p>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Secondary metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metricCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{card.label}</p>
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${card.tint}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">
                  {statsLoading ? '—' : card.value}
                </p>
              </div>
            )
          })}
        </div>

        {/* Role & Context Breakdown (mini cards) */}
        {!statsLoading && (stats.byRole && Object.keys(stats.byRole).length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <div key={`role-${role}`} className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${roleConfig[role]?.className || 'bg-gray-50 text-gray-600'}`}>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1A1D29]">{count}</p>
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{roleConfig[role]?.label || role}</p>
                </div>
              </div>
            ))}
            {Object.entries(stats.byContext).map(([ctx, count]) => (
              <div key={`ctx-${ctx}`} className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {ctx === 'service_request' ? <Wrench className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1A1D29]">{count}</p>
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">
                    {ctx === 'service_request' ? 'Service' : ctx === 'order' ? 'Order' : ctx || 'Other'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="ringing">Ringing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCallType} onValueChange={setSelectedCallType}>
                  <SelectTrigger className="w-[110px] h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="Caller Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="guest">Guest (QR scan)</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedContext} onValueChange={setSelectedContext}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contexts</SelectItem>
                    <SelectItem value="service_request">Service Request</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="vehicle_qr">Vehicle QR (SecureContact)</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear filters */}
                {(selectedStatus !== 'all' || selectedCallType !== 'all' || selectedRole !== 'all' || selectedContext !== 'all' || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-gray-500"
                    onClick={() => {
                      setSelectedStatus('all')
                      setSelectedCallType('all')
                      setSelectedRole('all')
                      setSelectedContext('all')
                      setSearchTerm('')
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Caller</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Receiver</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Context</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Recording</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1B3B6F]" />
                        <p className="text-gray-400 text-sm">Loading call logs...</p>
                      </TableCell>
                    </TableRow>
                  ) : calls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Phone className="h-7 w-7 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-[#1A1D29]">No call logs found</p>
                          <p className="text-sm text-[#6B7280] mt-1">Try adjusting your filters or search term</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    calls.map((call) => {
                      const stCfg = statusConfig[call.status] || { label: call.status, className: 'bg-gray-100 text-gray-800', icon: Phone }
                      const StatusIcon = stCfg.icon
                      return (
                        <TableRow
                          key={call._id}
                          className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                          style={{ borderLeftColor: STATUS_STRIPE[call.status] || 'transparent' }}
                        >
                          {/* Caller — guests (QR scanners) have no account; show guestCaller */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border border-gray-100">
                                <AvatarImage src={call.caller?.profileImage} />
                                <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                                  {getInitials(call.caller?.fullName || (call as any).guestCaller?.name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-[#1B3B6F] text-sm leading-tight">
                                  {call.caller?.fullName || (call as any).guestCaller?.name || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${roleConfig[call.callerRole]?.className || 'bg-gray-50 text-gray-600'}`}>
                                    {roleConfig[call.callerRole]?.label || call.callerRole}
                                  </Badge>
                                  {(call.caller?.phone || (call as any).guestCaller?.phone) && (
                                    <span className="text-[10px] text-[#9CA3AF]">{call.caller?.phone || (call as any).guestCaller?.phone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Receiver */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border border-gray-100">
                                <AvatarImage src={call.receiver?.profileImage} />
                                <AvatarFallback className="text-xs bg-orange-50 text-orange-700">
                                  {getInitials(call.receiver?.fullName || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-[#1B3B6F] text-sm leading-tight">
                                  {call.receiver?.fullName || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 ${roleConfig[call.receiverRole]?.className || 'bg-gray-50 text-gray-600'}`}>
                                    {roleConfig[call.receiverRole]?.label || call.receiverRole}
                                  </Badge>
                                  {call.receiver?.phone && (
                                    <span className="text-[10px] text-[#9CA3AF]">{call.receiver.phone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Call Type */}
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1">
                              {call.callType === 'video' ? (
                                <Video className="h-3 w-3 text-purple-500" />
                              ) : (
                                <Phone className="h-3 w-3 text-blue-500" />
                              )}
                              {call.callType === 'video' ? 'Video' : 'Audio'}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge className={`text-xs gap-1 border ${stCfg.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {stCfg.label}
                            </Badge>
                          </TableCell>

                          {/* Duration */}
                          <TableCell>
                            <span className="text-sm text-[#1A1D29] font-medium tabular-nums">
                              {call.duration > 0 ? formatDuration(call.duration) : '-'}
                            </span>
                          </TableCell>

                          {/* Context */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {call.context?.type === 'service_request' ? (
                                <Wrench className="h-3.5 w-3.5 text-indigo-500" />
                              ) : call.context?.type === 'order' ? (
                                <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                              ) : call.context?.type === 'vehicle_qr' ? (
                                <Phone className="h-3.5 w-3.5 text-purple-500" />
                              ) : null}
                              <span className="text-xs text-[#6B7280]">
                                {call.context?.type === 'service_request' ? 'Service'
                                  : call.context?.type === 'order' ? 'Order'
                                  : call.context?.type === 'vehicle_qr' ? 'Vehicle QR'
                                  : call.context?.type === 'support' ? 'Support'
                                  : call.context?.type || '-'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Recording */}
                          <TableCell>
                            {call.recording?.url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'h-8 gap-1.5 text-xs',
                                  playingCallId === call._id
                                    ? 'text-red-600 hover:text-red-700'
                                    : 'text-emerald-600 hover:text-emerald-700'
                                )}
                                onClick={() => togglePlayRecording(call._id, call.recording!.url!)}
                              >
                                {playingCallId === call._id ? (
                                  <><Pause className="h-3.5 w-3.5" /> Playing</>
                                ) : (
                                  <><Play className="h-3.5 w-3.5" /> Play</>
                                )}
                              </Button>
                            ) : (call.recording?.status === 'recording' && ['initiated', 'ringing', 'answered'].includes(call.status)) ? (
                              // Only show the live "Recording" badge while the call is actually in
                              // progress — a completed/ended call with a stuck 'recording' status
                              // has no recording, so show a dash instead.
                              <Badge variant="outline" className="text-[10px] gap-1 text-red-500 border-red-200">
                                <Volume2 className="h-3 w-3 animate-pulse" /> Recording
                              </Badge>
                            ) : (
                              <span className="text-xs text-[#9CA3AF]">—</span>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-sm text-[#6B7280]">{formatDateShort(call.createdAt)}</span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDetail(call)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-[#6B7280]">
                Showing {calls.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCalls)} of {totalCalls} calls
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn('h-8 w-8 p-0 text-xs', currentPage === page ? 'bg-[#1B3B6F]' : '')}
                    >
                      {page}
                    </Button>
                  ))
                ) : (
                  <>
                    <Button
                      variant={currentPage === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className={cn('h-8 w-8 p-0 text-xs', currentPage === 1 ? 'bg-[#1B3B6F]' : '')}
                    >
                      1
                    </Button>
                    {currentPage > 3 && <span className="text-[#6B7280] text-xs px-1">...</span>}
                    {[currentPage - 1, currentPage, currentPage + 1]
                      .filter(p => p > 1 && p < totalPages)
                      .map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn('h-8 w-8 p-0 text-xs', currentPage === page ? 'bg-[#1B3B6F]' : '')}
                        >
                          {page}
                        </Button>
                      ))
                    }
                    {currentPage < totalPages - 2 && <span className="text-[#6B7280] text-xs px-1">...</span>}
                    <Button
                      variant={currentPage === totalPages ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className={cn('h-8 w-8 p-0 text-xs', currentPage === totalPages ? 'bg-[#1B3B6F]' : '')}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Trend (small bar chart section) */}
        {!statsLoading && stats.dailyCalls.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-[#1A1D29] mb-3">Last 7 Days Call Trend</h3>
              <div className="flex items-end gap-2 h-24">
                {stats.dailyCalls.map((day) => {
                  const maxCount = Math.max(...stats.dailyCalls.map(d => d.count), 1)
                  const height = Math.max((day.count / maxCount) * 100, 4)
                  const dateLabel = new Date(day._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
                  return (
                    <div key={day._id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[#6B7280] font-medium">{day.count}</span>
                      <div className="w-full flex flex-col gap-0.5" style={{ height: `${height}%` }}>
                        <div
                          className="bg-emerald-400 rounded-t"
                          style={{ height: `${day.count > 0 ? (day.completed / day.count) * 100 : 0}%`, minHeight: day.completed > 0 ? 2 : 0 }}
                        />
                        <div
                          className="bg-red-400 rounded-b flex-1"
                          style={{ minHeight: day.missed > 0 ? 2 : 0 }}
                        />
                      </div>
                      <span className="text-[9px] text-[#9CA3AF]">{dateLabel}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  <span className="text-[10px] text-[#6B7280]">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
                  <span className="text-[10px] text-[#6B7280]">Missed / Other</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Call Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#1B3B6F]" />
              Call Details
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
            </div>
          ) : selectedCall ? (
            <div className="space-y-5">
              {/* Status & Type */}
              <div className="flex items-center gap-3">
                {(() => {
                  const sc = statusConfig[selectedCall.status] || { label: selectedCall.status, className: 'bg-gray-100 text-gray-800', icon: Phone }
                  const SIcon = sc.icon
                  return (
                    <Badge className={`text-xs gap-1 border ${sc.className}`}>
                      <SIcon className="h-3 w-3" />
                      {sc.label}
                    </Badge>
                  )
                })()}
                <Badge variant="outline" className="text-xs gap-1">
                  {selectedCall.callType === 'video' ? <Video className="h-3 w-3 text-purple-500" /> : <Phone className="h-3 w-3 text-blue-500" />}
                  {selectedCall.callType === 'video' ? 'Video Call' : 'Audio Call'}
                </Badge>
              </div>

              {/* Caller & Receiver */}
              <div className="grid grid-cols-2 gap-4">
                {/* Caller */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Caller</p>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={selectedCall.caller?.profileImage} />
                      <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                        {getInitials(selectedCall.caller?.fullName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-[#1A1D29]">{selectedCall.caller?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-[#6B7280]">{selectedCall.caller?.phone || selectedCall.callerPhone || '-'}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 mt-0.5 ${roleConfig[selectedCall.callerRole]?.className || 'bg-gray-50 text-gray-600'}`}>
                        {roleConfig[selectedCall.callerRole]?.label || selectedCall.callerRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Receiver */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Receiver</p>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={selectedCall.receiver?.profileImage} />
                      <AvatarFallback className="text-xs bg-orange-50 text-orange-700">
                        {getInitials(selectedCall.receiver?.fullName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-[#1A1D29]">{selectedCall.receiver?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-[#6B7280]">{selectedCall.receiver?.phone || selectedCall.receiverPhone || '-'}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-0 mt-0.5 ${roleConfig[selectedCall.receiverRole]?.className || 'bg-gray-50 text-gray-600'}`}>
                        {roleConfig[selectedCall.receiverRole]?.label || selectedCall.receiverRole}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Info */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">Duration</span>
                  <span className="text-xs font-semibold text-[#1A1D29]">
                    {selectedCall.duration > 0 ? formatDuration(selectedCall.duration) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">Started At</span>
                  <span className="text-xs font-semibold text-[#1A1D29]">{formatDate(selectedCall.createdAt)}</span>
                </div>
                {selectedCall.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#6B7280]">Ended At</span>
                    <span className="text-xs font-semibold text-[#1A1D29]">{formatDate(selectedCall.endedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">Context</span>
                  <div className="flex items-center gap-1.5">
                    {selectedCall.context?.type === 'service_request' ? (
                      <Wrench className="h-3 w-3 text-indigo-500" />
                    ) : (
                      <ShoppingBag className="h-3 w-3 text-indigo-500" />
                    )}
                    <span className="text-xs font-semibold text-[#1A1D29]">
                      {selectedCall.context?.type === 'service_request' ? 'Service Request' : selectedCall.context?.type === 'order' ? 'Order' : selectedCall.context?.type || '-'}
                    </span>
                  </div>
                </div>
                {selectedCall.agora?.channelName && (
                  <div className="flex justify-between">
                    <span className="text-xs text-[#6B7280]">Channel</span>
                    <span className="text-xs font-mono text-[#1A1D29]">{selectedCall.agora.channelName}</span>
                  </div>
                )}
              </div>

              {/* Recording Player */}
              {selectedCall.recording?.url ? (
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-2">Call Recording</p>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        'h-9 w-9 p-0 rounded-full border-2',
                        playingCallId === selectedCall._id
                          ? 'border-red-400 text-red-600 hover:text-red-700'
                          : 'border-emerald-400 text-emerald-600 hover:text-emerald-700'
                      )}
                      onClick={() => togglePlayRecording(selectedCall._id, selectedCall.recording!.url!)}
                    >
                      {playingCallId === selectedCall._id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-800">
                        {playingCallId === selectedCall._id ? 'Playing...' : 'Ready to play'}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Duration: {selectedCall.duration > 0 ? formatDuration(selectedCall.duration) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedCall.recording?.status === 'failed' ? (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-600">Recording failed for this call</p>
                </div>
              ) : null}

              {/* Context Detail (if available) */}
              {selectedCall.contextDetail && (
                <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-semibold mb-1">
                    {selectedCall.context?.type === 'service_request' ? 'Service Request Details' : 'Order Details'}
                  </p>
                  {selectedCall.context?.type === 'service_request' ? (
                    <>
                      {selectedCall.contextDetail.requestId && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Request ID</span>
                          <span className="text-xs font-semibold text-indigo-800">{selectedCall.contextDetail.requestId}</span>
                        </div>
                      )}
                      {selectedCall.contextDetail.serviceCategory && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Category</span>
                          <span className="text-xs font-semibold text-indigo-800">{selectedCall.contextDetail.serviceCategory}</span>
                        </div>
                      )}
                      {selectedCall.contextDetail.status && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Status</span>
                          <span className="text-xs font-semibold text-indigo-800 capitalize">{selectedCall.contextDetail.status}</span>
                        </div>
                      )}
                      {selectedCall.contextDetail.description && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Description</span>
                          <span className="text-xs font-semibold text-indigo-800 text-right max-w-[200px]">{selectedCall.contextDetail.description}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {selectedCall.contextDetail.orderId && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Order ID</span>
                          <span className="text-xs font-semibold text-indigo-800">{selectedCall.contextDetail.orderId}</span>
                        </div>
                      )}
                      {selectedCall.contextDetail.status && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Status</span>
                          <span className="text-xs font-semibold text-indigo-800 capitalize">{selectedCall.contextDetail.status}</span>
                        </div>
                      )}
                      {selectedCall.contextDetail.totalAmount != null && (
                        <div className="flex justify-between">
                          <span className="text-xs text-indigo-400">Amount</span>
                          <span className="text-xs font-semibold text-indigo-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(selectedCall.contextDetail.totalAmount)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Call ID (small footer) */}
              <div className="pt-2 border-t">
                <p className="text-[10px] text-[#9CA3AF] font-mono">ID: {selectedCall._id}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
