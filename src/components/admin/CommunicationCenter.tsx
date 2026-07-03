'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Send,
  Bell,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  Headphones,
  Target,
  TrendingUp,
  RefreshCw,
  Calendar,
  Image,
  X,
  Upload,
  Link,
  FolderOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenuLabel,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { notificationAPI, userAPI, uploadAPI } from '@/services/api'

// ─── Types ─────────────────────────────────────────────────────────────────

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: string
  priority: string
  status: string
  targetAudience: string
  targetUsers: any[]
  scheduledAt: string | null
  sentAt: string | null
  sentCount: number
  readCount: number
  actionUrl: string | null
  imageUrl: string | null
  logoUrl: string | null
  createdBy: { fullName?: string; username?: string } | null
  createdAt: string
}

interface NotificationStats {
  total: number
  sent: number
  scheduled: number
  draft: number
  failed: number
  totalDevices: number
  recentSent: any[]
}

// ─── Notification Form State ────────────────────────────────────────────────

interface NotificationForm {
  title: string
  message: string
  type: string
  priority: string
  targetAudience: string
  targetUsers: string[]
  scheduledAt: string
  actionUrl: string
  imageUrl: string
  logoUrl: string
}

const defaultForm: NotificationForm = {
  title: '',
  message: '',
  type: 'general',
  priority: 'medium',
  targetAudience: 'all',
  targetUsers: [],
  scheduledAt: '',
  actionUrl: 'none',
  imageUrl: '',
  logoUrl: '',
}

// Action URL dropdown options (deep-link screens in the mobile app)
const actionUrlOptions = [
  { value: '', label: 'None' },
  { value: 'Notifications', label: 'Notifications Screen' },
  { value: 'Orders', label: 'Orders Screen' },
  { value: 'ServiceRequests', label: 'Service Requests Screen' },
  { value: 'Cart', label: 'Cart Screen' },
  { value: 'Profile', label: 'Profile Screen' },
  { value: 'Home', label: 'Home Screen' },
  { value: 'Promotions', label: 'Promotions Screen' },
]

// ─── Config ─────────────────────────────────────────────────────────────────

const notificationTypes: Record<string, { color: string; label: string }> = {
  system: { color: 'bg-blue-100 text-blue-800', label: 'System' },
  promotion: { color: 'bg-green-100 text-green-800', label: 'Promotion' },
  order: { color: 'bg-indigo-100 text-indigo-800', label: 'Order' },
  service: { color: 'bg-purple-100 text-purple-800', label: 'Service' },
  delivery: { color: 'bg-orange-100 text-orange-800', label: 'Delivery' },
  alert: { color: 'bg-red-100 text-red-800', label: 'Alert' },
  general: { color: 'bg-gray-100 text-gray-800', label: 'General' }
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  sent: { color: 'bg-green-100 text-green-800', label: 'Sent' },
  scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
}

// Left-edge stripe color per notification status — makes the table scannable at a glance.
const NOTIF_STATUS_STRIPE: Record<string, string> = {
  draft: '#94a3b8', scheduled: '#3b82f6', sent: '#22c55e', failed: '#ef4444',
}

const audienceLabels: Record<string, string> = {
  all: 'All Users',
  users: 'Customers',
  delivery: 'Delivery Boys',
  mechanics: 'Mechanics',
  specific: 'Specific Users'
}

// ─── Mock data for non-notification tabs (unchanged) ────────────────────────

const mockSupportTickets = [
  {
    id: 'SUP-001', ticketNumber: 'TK-2026-0245',
    customer: { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 9876543210', avatar: '' },
    subject: 'Defective brake pads received', category: 'product_quality', priority: 'high',
    status: 'open', assignedTo: 'Priya Singh', createdDate: '2026-02-12T09:15:00Z',
    lastUpdated: '2026-02-12T11:30:00Z', responseTime: 135, messages: 4,
    tags: ['defective', 'brake_pads', 'refund_requested']
  },
  {
    id: 'SUP-002', ticketNumber: 'TK-2026-0246',
    customer: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+91 8765432109', avatar: '' },
    subject: 'Order delivery delayed', category: 'delivery', priority: 'medium',
    status: 'in_progress', assignedTo: 'Amit Kumar', createdDate: '2026-02-11T16:45:00Z',
    lastUpdated: '2026-02-12T10:20:00Z', responseTime: 67, messages: 6,
    tags: ['delivery_delay', 'compensation']
  },
]

const supportStatusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'bg-red-100 text-red-800', label: 'Open' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
}

// Left-edge stripe color per support ticket status.
const SUPPORT_STATUS_STRIPE: Record<string, string> = {
  open: '#ef4444', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#94a3b8',
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState('notifications')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTicketDetails, setShowTicketDetails] = useState<any>(null)

  // ─── Notification State ─────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notifStats, setNotifStats] = useState<NotificationStats>({ total: 0, sent: 0, scheduled: 0, draft: 0, failed: 0, totalDevices: 0, recentSent: [] })
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifPage, setNotifPage] = useState(1)
  const [notifTotal, setNotifTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingNotif, setEditingNotif] = useState<NotificationItem | null>(null)
  const [form, setForm] = useState<NotificationForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // User search for specific targeting
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; name: string }[]>([])

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  // Media library state
  const [showMediaPicker, setShowMediaPicker] = useState<'logo' | 'banner' | null>(null)
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)

  // ─── Fetch Functions ────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true)
      const params: Record<string, any> = { page: notifPage, limit: 15 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (searchQuery) params.search = searchQuery

      const res = await notificationAPI.getAll(params)
      if (res.data?.success) {
        setNotifications(res.data.data || [])
        setNotifTotal(res.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Fetch notifications error:', error)
    } finally {
      setNotifLoading(false)
    }
  }, [notifPage, statusFilter, searchQuery])

  const fetchStats = useCallback(async () => {
    try {
      const res = await notificationAPI.getStats()
      if (res.data?.success) {
        setNotifStats(res.data.data)
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }, [])

  const fetchMediaLibrary = useCallback(async (type: 'logo' | 'banner') => {
    setMediaLoading(true)
    try {
      const res = await notificationAPI.getMedia(type)
      if (res.data?.success) {
        setMediaLibrary(res.data.data || [])
      }
    } catch (error) {
      console.error('Fetch media library error:', error)
    } finally {
      setMediaLoading(false)
    }
  }, [])

  // Save uploaded media to library (fire-and-forget)
  const saveToMediaLibrary = useCallback(async (url: string, type: 'logo' | 'banner', name?: string) => {
    try {
      await notificationAPI.saveMedia({ url, type, name })
    } catch (error) {
      console.error('Save to media library error:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // ─── User Search ────────────────────────────────────────────────────────

  useEffect(() => {
    if (userSearchQuery.length < 2) {
      setUserSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await notificationAPI.searchUsers(userSearchQuery)
        if (res.data?.success) {
          setUserSearchResults(res.data.data || [])
        }
      } catch (e) {
        console.error('User search error:', e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearchQuery])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(defaultForm)
    setSelectedUsers([])
    setEditingNotif(null)
    setImageUploading(false)
    setLogoUploading(false)
    setShowMediaPicker(null)
    setShowCreateDialog(true)
  }

  const openEdit = (notif: NotificationItem) => {
    setForm({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      targetAudience: notif.targetAudience,
      targetUsers: notif.targetUsers?.map((u: any) => u._id || u) || [],
      scheduledAt: notif.scheduledAt ? new Date(notif.scheduledAt).toISOString().slice(0, 16) : '',
      actionUrl: notif.actionUrl || 'none',
      imageUrl: notif.imageUrl || '',
      logoUrl: notif.logoUrl || '',
    })
    setSelectedUsers(
      notif.targetUsers?.map((u: any) => ({
        id: u._id || u,
        name: u.fullName || u.phone || u._id || u,
      })) || []
    )
    setEditingNotif(notif)
    setShowMediaPicker(null)
    setShowCreateDialog(true)
  }

  const handleSave = async (sendNow: boolean) => {
    if (!form.title.trim() || !form.message.trim()) return
    setSaving(true)
    try {
      const payload: any = {
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        targetAudience: form.targetAudience,
        actionUrl: (form.actionUrl && form.actionUrl !== 'none') ? form.actionUrl : undefined,
        imageUrl: form.imageUrl || undefined,
        logoUrl: form.logoUrl || undefined,
      }

      if (form.targetAudience === 'specific') {
        payload.targetUsers = selectedUsers.map(u => u.id)
      }

      if (form.scheduledAt && !sendNow) {
        payload.scheduledAt = new Date(form.scheduledAt).toISOString()
      }

      let created
      if (editingNotif) {
        const res = await notificationAPI.update(editingNotif._id, payload)
        created = res.data?.data
      } else {
        const res = await notificationAPI.create(payload)
        created = res.data?.data
      }

      if (sendNow && created?._id) {
        await notificationAPI.send(created._id)
      }

      setShowCreateDialog(false)
      fetchNotifications()
      fetchStats()
    } catch (error: any) {
      console.error('Save notification error:', error)
      alert(error.response?.data?.message || 'Failed to save notification')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      await notificationAPI.send(id)
      fetchNotifications()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send notification')
    } finally {
      setSendingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return
    try {
      await notificationAPI.delete(id)
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // ─── Image Upload Handler ───────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setImageUploading(true)
    try {
      const res = await uploadAPI.uploadImage(file, 'notifications')
      if (res.data?.success) {
        const url = res.data.data?.url || res.data.url
        setForm(f => ({ ...f, imageUrl: url }))
        // Auto-save to media library
        saveToMediaLibrary(url, 'banner', file.name)
      } else {
        alert('Failed to upload image')
      }
    } catch (error: any) {
      console.error('Image upload error:', error)
      alert(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setImageUploading(false)
      // Reset file input
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Logo max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be less than 2MB')
      return
    }

    setLogoUploading(true)
    try {
      const res = await uploadAPI.uploadImage(file, 'notification-logos')
      if (res.data?.success) {
        const url = res.data.data?.url || res.data.url
        setForm(f => ({ ...f, logoUrl: url }))
        // Auto-save to media library
        saveToMediaLibrary(url, 'logo', file.name)
      } else {
        alert('Failed to upload logo')
      }
    } catch (error: any) {
      console.error('Logo upload error:', error)
      alert(error.response?.data?.message || 'Failed to upload logo')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getTypeBadge = (type: string) => {
    const config = notificationTypes[type] || notificationTypes.general
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority] || priorityConfig.medium
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  const getSupportStatusBadge = (status: string) => {
    const config = supportStatusConfig[status] || supportStatusConfig.open
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1B3B6F]/10 shrink-0">
            <MessageSquare className="h-5 w-5 text-[#1B3B6F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Communication Center</h1>
            <p className="text-[#6B7280] mt-1 text-sm">Manage notifications, customer support, and communications</p>
          </div>
        </div>
      </div>

      {/* Stats Cards — clickable quick filters wired to the existing status filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'all', label: 'Total Notifications', value: notifStats.total, icon: Bell, tint: 'bg-slate-100 text-slate-600' },
          { key: 'sent', label: 'Sent', value: notifStats.sent, icon: Send, tint: 'bg-emerald-50 text-emerald-600' },
          { key: 'scheduled', label: 'Scheduled', value: notifStats.scheduled, icon: Clock, tint: 'bg-blue-50 text-blue-600' },
          { key: 'draft', label: 'Drafts', value: notifStats.draft, icon: Edit, tint: 'bg-gray-100 text-gray-600' },
          { key: 'failed', label: 'Failed', value: notifStats.failed, icon: XCircle, tint: 'bg-red-50 text-red-600' },
        ].map((s) => {
          const Icon = s.icon
          const active = statusFilter === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { setStatusFilter(s.key); setNotifPage(1) }}
              className={`text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between">
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {active && <span className="text-[9px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>}
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{s.value}</p>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
            </button>
          )
        })}

        {/* Registered devices — informational only, no matching status filter */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{notifStats.totalDevices}</p>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">Registered Devices</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="support">Customer Support</TabsTrigger>
        </TabsList>

        {/* ═══ NOTIFICATIONS TAB (REAL API) ═══ */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Search / Filter / Create */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setNotifPage(1) }}
                      className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setNotifPage(1) }}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { fetchNotifications(); fetchStats() }}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={openCreate} size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545] h-9 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {notifLoading ? (
                <div className="p-16 text-center">
                  <RefreshCw className="h-8 w-8 text-[#1B3B6F] animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-[#1A1D29]">No notifications found</p>
                  <p className="text-sm text-[#6B7280] mt-1">Create your first notification to get started</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notification</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Audience</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Scheduled / Sent</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Reach</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.map((notif) => (
                          <TableRow
                            key={notif._id}
                            className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                            style={{ borderLeftColor: NOTIF_STATUS_STRIPE[notif.status] || 'transparent' }}
                          >
                            <TableCell>
                              <div>
                                <div className="font-semibold text-sm text-[#1A1D29]">{notif.title}</div>
                                <div className="text-sm text-[#6B7280] max-w-md truncate">{notif.message}</div>
                                <div className="text-xs text-[#9CA3AF] mt-1">
                                  By {notif.createdBy?.fullName || notif.createdBy?.username || 'System'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(notif.type)}</TableCell>
                            <TableCell>{getPriorityBadge(notif.priority)}</TableCell>
                            <TableCell>{getStatusBadge(notif.status)}</TableCell>
                            <TableCell className="text-sm text-[#1A1D29]">{audienceLabels[notif.targetAudience] || notif.targetAudience}</TableCell>
                            <TableCell className="text-sm text-[#6B7280]">
                              {notif.sentAt ? formatDate(notif.sentAt) : notif.scheduledAt ? formatDate(notif.scheduledAt) : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm tabular-nums">
                                <div className="font-medium text-[#1A1D29]">{notif.sentCount.toLocaleString()} sent</div>
                                <div className="text-[#6B7280]">{notif.readCount.toLocaleString()} read</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {notif.status !== 'sent' && (
                                    <DropdownMenuItem onClick={() => openEdit(notif)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {(notif.status === 'draft' || notif.status === 'scheduled') && (
                                    <DropdownMenuItem onClick={() => handleSend(notif._id)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      {sendingId === notif._id ? 'Sending...' : 'Send Now'}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(notif._id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {notifTotal > 15 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-100">
                      <p className="text-sm text-[#6B7280]">
                        Page {notifPage} of {Math.ceil(notifTotal / 15)} ({notifTotal} total)
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled={notifPage <= 1} onClick={() => setNotifPage(p => p - 1)}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={notifPage >= Math.ceil(notifTotal / 15)} onClick={() => setNotifPage(p => p + 1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CUSTOMER SUPPORT TAB (mock data) ═══ */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-center">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600 mx-auto mb-2">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-extrabold text-[#1A1D29] tabular-nums">{mockSupportTickets.filter(t => t.status === 'open').length}</p>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">Open Tickets</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-center">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600 mx-auto mb-2">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-2xl font-extrabold text-[#1A1D29] tabular-nums">{mockSupportTickets.filter(t => t.status === 'in_progress').length}</p>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">In Progress</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-center">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mx-auto mb-2">
                <CheckCircle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-extrabold text-[#1A1D29] tabular-nums">{mockSupportTickets.filter(t => t.status === 'resolved').length}</p>
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">Resolved</p>
            </div>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Customer support ticket management (coming soon)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Ticket</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSupportTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                        style={{ borderLeftColor: SUPPORT_STATUS_STRIPE[ticket.status] || 'transparent' }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-semibold text-sm text-[#1A1D29]">{ticket.ticketNumber}</div>
                            <div className="text-sm text-[#6B7280] max-w-sm truncate">{ticket.subject}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm text-[#1A1D29]">{ticket.customer.name}</div>
                            <div className="text-xs text-[#6B7280]">{ticket.customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getSupportStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="font-medium text-sm text-[#1A1D29]">{ticket.assignedTo}</TableCell>
                        <TableCell>
                          <span className={`font-medium text-sm tabular-nums ${ticket.responseTime > 120 ? 'text-red-600' : ticket.responseTime > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {ticket.responseTime}m
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ CREATE / EDIT NOTIFICATION DIALOG ═══ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-[#1B3B6F]" />
              </div>
              {editingNotif ? 'Edit Notification' : 'Create New Notification'}
            </DialogTitle>
            <DialogDescription>
              {editingNotif ? 'Update the notification details' : 'Send push notifications to your users'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="notif-title">Title *</Label>
              <Input
                id="notif-title"
                placeholder="Enter notification title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="notif-message">Message *</Label>
              <Textarea
                id="notif-message"
                placeholder="Enter notification message"
                rows={3}
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>

            {/* Type + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <Label>Target Audience</Label>
              <Select value={form.targetAudience} onValueChange={(v) => setForm(f => ({ ...f, targetAudience: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users (Everyone)</SelectItem>
                  <SelectItem value="users">Customers Only</SelectItem>
                  <SelectItem value="mechanics">Mechanics Only</SelectItem>
                  <SelectItem value="delivery">Delivery Boys Only</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific User Search */}
            {form.targetAudience === 'specific' && (
              <div>
                <Label>Search & Select Users</Label>
                <Input
                  placeholder="Search by name or phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
                {userSearchResults.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                    {userSearchResults.map((u: any) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (!selectedUsers.find(s => s.id === u._id)) {
                            setSelectedUsers(prev => [...prev, { id: u._id, name: u.fullName || u.phone || u._id }])
                          }
                          setUserSearchQuery('')
                          setUserSearchResults([])
                        }}
                      >
                        <div>
                          <span className="font-medium text-sm">{u.fullName || u.username || 'Unknown'}</span>
                          <span className="text-xs text-gray-500 ml-2">{u.phone}</span>
                          <Badge className="ml-2 text-xs" variant="secondary">{u.role}</Badge>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map(u => (
                      <Badge key={u.id} variant="secondary" className="text-sm">
                        {u.name}
                        <button
                          className="ml-1 text-red-500 hover:text-red-700"
                          onClick={() => setSelectedUsers(prev => prev.filter(s => s.id !== u.id))}
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            <div>
              <Label>Schedule (optional - leave empty to save as draft)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
              {form.scheduledAt && (
                <p className="text-xs text-blue-600 mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Will be sent automatically at the scheduled time
                </p>
              )}
            </div>

            {/* Logo + Banner Image Upload (side by side) */}
            <div className="grid grid-cols-[120px_1fr] gap-4">
              {/* Notification Logo */}
              <div>
                <Label className="text-xs">Logo (optional)</Label>
                <div className="mt-1">
                  {form.logoUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={form.logoUrl}
                        alt="Notification logo"
                        className="w-[100px] h-[100px] object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div
                        onClick={() => !logoUploading && logoInputRef.current?.click()}
                        className={`w-[100px] h-[72px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          logoUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-[#1B3B6F] hover:bg-gray-50'
                        }`}
                      >
                        {logoUploading ? (
                          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-400 mb-0.5" />
                            <p className="text-[10px] text-gray-400 text-center leading-tight">Upload</p>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowMediaPicker('logo'); fetchMediaLibrary('logo') }}
                        className="w-[100px] flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-[#1B3B6F] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <FolderOpen className="h-3 w-3" />
                        Library
                      </button>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <Label className="text-xs">Banner Image (optional)</Label>
                <div className="mt-1">
                  {form.imageUrl ? (
                    <div className="relative inline-block w-full">
                      <img
                        src={form.imageUrl}
                        alt="Notification banner"
                        className="w-full h-[72px] object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowMediaPicker('banner'); fetchMediaLibrary('banner') }}
                        className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-white bg-black/50 hover:bg-black/70 rounded transition-colors"
                      >
                        <FolderOpen className="h-3 w-3" />
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div
                        onClick={() => !imageUploading && imageInputRef.current?.click()}
                        className={`h-[72px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          imageUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-[#1B3B6F] hover:bg-gray-50'
                        }`}
                      >
                        {imageUploading ? (
                          <div className="flex flex-col items-center">
                            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mb-0.5" />
                            <p className="text-[10px] text-blue-600 font-medium">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Image className="h-5 w-5 text-gray-400 mb-0.5" />
                            <p className="text-[10px] text-gray-600 font-medium">Click to upload banner image</p>
                            <p className="text-[9px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowMediaPicker('banner'); fetchMediaLibrary('banner') }}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-[#1B3B6F] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <FolderOpen className="h-3 w-3" />
                        Choose from Library
                      </button>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            {/* Media Library Picker (inline expandable) */}
            {showMediaPicker && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-[#1B3B6F]" />
                    <span className="text-sm font-medium text-[#1A1D29]">
                      {showMediaPicker === 'logo' ? 'Logo' : 'Banner'} Library
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{mediaLibrary.length} items</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Upload new via file picker
                        if (showMediaPicker === 'logo') {
                          logoInputRef.current?.click()
                        } else {
                          imageInputRef.current?.click()
                        }
                        setShowMediaPicker(null)
                      }}
                      className="text-xs text-[#1B3B6F] hover:underline flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      Upload New
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {mediaLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading library...</span>
                  </div>
                ) : mediaLibrary.length === 0 ? (
                  <div className="text-center py-6">
                    <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No {showMediaPicker === 'logo' ? 'logos' : 'banners'} uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload one above to start building your library</p>
                  </div>
                ) : (
                  <div className={`grid gap-2 max-h-48 overflow-y-auto ${
                    showMediaPicker === 'logo' ? 'grid-cols-5' : 'grid-cols-3'
                  }`}>
                    {mediaLibrary.map((media: any) => (
                      <div
                        key={media._id}
                        onClick={() => {
                          if (showMediaPicker === 'logo') {
                            setForm(f => ({ ...f, logoUrl: media.url }))
                          } else {
                            setForm(f => ({ ...f, imageUrl: media.url }))
                          }
                          // Increment usage count
                          saveToMediaLibrary(media.url, showMediaPicker, media.name)
                          setShowMediaPicker(null)
                        }}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-[#1B3B6F] transition-all"
                      >
                        <img
                          src={media.url}
                          alt={media.name || 'Media'}
                          className={`w-full object-cover ${
                            showMediaPicker === 'logo' ? 'h-16' : 'h-20'
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                        {media.usageCount > 1 && (
                          <span className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
                            {media.usageCount}x
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action URL (Dropdown) */}
            <div>
              <Label className="flex items-center gap-1">
                <Link className="h-3.5 w-3.5" />
                Action Screen (optional)
              </Label>
              <Select value={form.actionUrl} onValueChange={(v) => setForm(f => ({ ...f, actionUrl: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a screen to open on tap" />
                </SelectTrigger>
                <SelectContent>
                  {actionUrlOptions.map(opt => (
                    <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.actionUrl && form.actionUrl !== 'none' && (
                <p className="text-xs text-blue-600 mt-1">
                  Tapping the notification will open: <strong>{form.actionUrl}</strong>
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !form.title || !form.message}>
                {saving ? 'Saving...' : form.scheduledAt ? 'Schedule' : 'Save Draft'}
              </Button>
              <Button
                className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                onClick={() => handleSave(true)}
                disabled={saving || !form.title || !form.message}
              >
                <Send className="h-4 w-4 mr-2" />
                {saving ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
