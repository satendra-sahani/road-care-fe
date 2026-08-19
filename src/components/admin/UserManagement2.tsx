// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
  fetchUsersRequest,
  fetchUserByIdRequest,
  createUserRequest,
  updateUserRequest,
  deleteUserRequest,
  toggleUserStatusRequest,
  fetchUserStatsRequest,
  clearUserError,
  User,
} from '@/store/slices/userSlice'
import {
  fetchMechanicsRequest,
  Mechanic,
} from '@/store/slices/mechanicSlice'
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Users,
  User as UserIcon,
  Wrench,
  Truck,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/utils'

const roleConfig = {
  customer: { color: 'bg-blue-100 text-blue-800', iconBg: 'bg-blue-50 text-blue-600', icon: Users, label: 'Customer' },
  user: { color: 'bg-blue-100 text-blue-800', iconBg: 'bg-blue-50 text-blue-600', icon: Users, label: 'Customer' },
  mechanic: { color: 'bg-green-100 text-green-800', iconBg: 'bg-green-50 text-green-600', icon: Wrench, label: 'Mechanic' },
  delivery: { color: 'bg-purple-100 text-purple-800', iconBg: 'bg-purple-50 text-purple-600', icon: Truck, label: 'Delivery' },
  admin: { color: 'bg-red-100 text-red-800', iconBg: 'bg-red-50 text-red-600', icon: Shield, label: 'Admin' },
  manager: { color: 'bg-orange-100 text-orange-800', iconBg: 'bg-orange-50 text-orange-600', icon: Shield, label: 'Manager' },
  staff: { color: 'bg-gray-100 text-gray-800', iconBg: 'bg-gray-50 text-gray-600', icon: UserCheck, label: 'Staff' }
}

export function UserManagement() {
  const dispatch = useDispatch()

  // Redux state
  const { users, loading, error, pagination, stats } = useSelector((state: RootState) => state.users)
  const { mechanics } = useSelector((state: RootState) => state.mechanic)

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [blockForm, setBlockForm] = useState({ reason: '', blockType: 'temporary', days: 30 })
  const [advanceForm, setAdvanceForm] = useState({ amount: 199, reason: '' })
  const [warnMessage, setWarnMessage] = useState('')
  const [noteText, setNoteText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'customer' as User['role'],
    phone: '',
    aadhaarNo: '',
    emergencyContact: '',
    address: { street: '', city: '', state: '', pincode: '' },
    specializations: [] as string[],
    experience: '',
    joiningDate: new Date().toISOString().split('T')[0],
    licenseNumber: '',
    vehicleType: '',
    zones: [] as string[]
  })

  const allSpecializations = [
    'Engine Repair', 'Brake System', 'Electrical', 'AC Service',
    'Battery', 'Tyre Service', 'Suspension', 'Clutch',
    'Oil Change', 'Body Work', 'Painting', 'General Service'
  ]

  const vehicleTypes = ['Motorcycle', 'Scooter', 'Bicycle', 'Car', 'Van', 'Truck']
  const availableZones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']

  useEffect(() => {
    const params: any = {
      page: pagination.currentPage,
      limit: pagination.limit,
      search: searchQuery || undefined,
    }
    // The active tab is the primary role selector; the Role dropdown refines
    // results on the "All Users" tab. Previously only the dropdown drove the
    // server query, so switching tabs merely filtered the current page.
    const effectiveRole = activeTab !== 'all' ? activeTab : (roleFilter !== 'all' ? roleFilter : undefined)
    if (effectiveRole) params.role = effectiveRole
    if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
    dispatch(fetchUsersRequest(params))
  }, [dispatch, pagination.currentPage, pagination.limit, roleFilter, statusFilter, searchQuery, activeTab])

  useEffect(() => {
    dispatch(fetchUserStatsRequest())
    dispatch(fetchMechanicsRequest())
  }, [dispatch])

  useEffect(() => {
    return () => { dispatch(clearUserError()) }
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearUserError())
    }
  }, [error, dispatch])

  const filteredUsersByTab = useMemo(() => {
    if (activeTab === 'all') return users
    // The server already filters by role, and the fetch saga maps the backend
    // 'user' role to the display role 'customer'. So the tab value (customer /
    // mechanic / delivery / admin / staff) matches user.role directly — the old
    // customer→'user' remap here double-mapped and matched nothing.
    return users.filter(user => user.role === activeTab)
  }, [users, activeTab])

  const toggleSpecialization = (spec: string) => {
    setNewUser(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  const toggleZone = (zone: string) => {
    setNewUser(prev => ({
      ...prev,
      zones: prev.zones.includes(zone) ? prev.zones.filter(z => z !== zone) : [...prev.zones, zone]
    }))
  }

  const resetNewUserForm = () => {
    setNewUser({
      username: '', email: '', password: '', fullName: '',
      role: 'customer', phone: '', aadhaarNo: '', emergencyContact: '',
      address: { street: '', city: '', state: '', pincode: '' },
      specializations: [], experience: '',
      joiningDate: new Date().toISOString().split('T')[0],
      licenseNumber: '', vehicleType: '', zones: []
    })
  }

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName) {
      toast.error('Please fill in all required fields')
      return
    }
    if (newUser.role === 'mechanic' && (!newUser.phone || !newUser.aadhaarNo)) {
      toast.error('Phone and Aadhaar number are required for mechanics')
      return
    }
    if (newUser.role === 'delivery' && (!newUser.phone || !newUser.licenseNumber)) {
      toast.error('Phone and license number are required for delivery partners')
      return
    }
    dispatch(createUserRequest(newUser))
    setIsCreateModalOpen(false)
    resetNewUserForm()
    toast.success('User created successfully')
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return
    dispatch(updateUserRequest({ id: selectedUser._id, data: selectedUser }))
    setIsEditModalOpen(false)
    setSelectedUser(null)
    toast.success('User updated successfully')
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return
    dispatch(deleteUserRequest(selectedUser._id))
    setIsDeleteModalOpen(false)
    setSelectedUser(null)
    toast.success('User deleted successfully')
  }

  const handleToggleStatus = (user: User) => {
    dispatch(toggleUserStatusRequest(user._id))
    toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`)
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsersByTab.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsersByTab.map(user => user._id))
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    return (
      <Badge className={`text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || role}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => (
    <Badge className={`text-xs ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Export the currently tab-filtered users to CSV.
  const exportUsersCsv = () => {
    const rows: string[][] = [['Name', 'Username', 'Role', 'Status', 'Trust Score', 'Email', 'Phone', 'Joined', 'Last Active']]
    filteredUsersByTab.forEach((u) => {
      rows.push([
        u.fullName || u.username || 'Unknown',
        u.username || '',
        roleConfig[u.role as keyof typeof roleConfig]?.label || u.role,
        u.isActive ? 'Active' : 'Inactive',
        String(u.trustScore ?? ''),
        u.email || '',
        u.phone || '',
        u.createdAt ? formatDate(u.createdAt) : '',
        u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never',
      ])
    })
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Left-edge stripe color per account state — makes the table scannable at a glance.
  const STATUS_STRIPE: Record<string, string> = { active: '#22c55e', inactive: '#94a3b8', blocked: '#ef4444' }
  const getRowStripe = (user: User) => (user.isBlocked ? STATUS_STRIPE.blocked : user.isActive ? STATUS_STRIPE.active : STATUS_STRIPE.inactive)

  // KPI cards (metric cards shown alongside the Total Users hero)
  const kpiCards = [
    { label: 'Total Users', value: stats.total || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Users', value: stats.active || 0, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Mechanics', value: stats.roles?.mechanic || 0, icon: Wrench, color: 'bg-orange-50 text-orange-600' },
    { label: 'New This Month', value: stats.recentUsers || 0, icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
  ]
  const metricCards = kpiCards.slice(1)

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">User Management</h1>
            <p className="text-[#6B7280] mt-1 text-sm">Manage customers, mechanics, delivery partners, and admin users</p>
          </div>
          <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545] h-9 text-xs" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add User
          </Button>
        </div>

        {/* KPI row: total-users hero + metric cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Total Users hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Total Users</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <Users className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">{stats.total || 0}</p>
            <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
              <span><b className="text-white">{stats.active || 0}</b> active</span>
              <span className="text-white/30">·</span>
              <span><b className="text-white">{stats.recentUsers || 0}</b> new this month</span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricCards.map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{card.label}</p>
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${card.color}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{card.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={exportUsersCsv} disabled={filteredUsersByTab.length === 0}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                <span className="text-sm font-medium text-blue-800">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs">Bulk Update</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600">Bulk Delete</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm p-1 h-auto flex-wrap">
            {[
              { value: 'all', label: 'All Users', icon: Users },
              { value: 'customer', label: 'Customers', icon: Users },
              { value: 'mechanic', label: 'Mechanics', icon: Wrench },
              { value: 'delivery', label: 'Delivery', icon: Truck },
              { value: 'admin', label: 'Admin', icon: Shield },
              { value: 'staff', label: 'Staff', icon: UserCheck },
            ].map((tab) => {
              const TabIcon = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-xs gap-1.5 px-3 py-1.5"
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F] mb-3" />
                    <span className="text-sm text-gray-400">Loading users...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedUsers.length === filteredUsersByTab.length && filteredUsersByTab.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">User</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Trust</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Active</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsersByTab.map((user) => (
                          <TableRow
                            key={user._id}
                            className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                            style={{ borderLeftColor: getRowStripe(user) }}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user._id)}
                                onCheckedChange={() => handleSelectUser(user._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 border border-gray-100">
                                  <AvatarImage src={user.profileImage} />
                                  <AvatarFallback className="bg-[#1B3B6F] text-white text-xs">
                                    {(user.fullName || user.username || 'U').split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm text-[#1A1D29]">{user.fullName || user.username || 'Unknown'}</div>
                                  <div className="text-xs text-[#6B7280]">@{user.username || '-'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                            <TableCell>
                              {(user.role === 'customer' || user.role === 'user') ? (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                                    (user.trustScore ?? 100) > 70 ? 'bg-emerald-100 text-emerald-700' :
                                    (user.trustScore ?? 100) > 40 ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {user.trustScore ?? 100}
                                  </span>
                                  {user.isBlocked && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Blocked</span>
                                  )}
                                  {user.forceAdvanceFee && (
                                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">₹</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="flex items-center text-xs text-[#6B7280]">
                                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate max-w-[160px]">{user.email}</span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center text-xs text-[#6B7280]">
                                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-[#6B7280]">
                              {formatDate(user.createdAt)}
                            </TableCell>
                            <TableCell className="text-xs text-[#6B7280]">
                              {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-sm" onClick={() => { setSelectedUser(user); setIsEditModalOpen(true) }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-sm" onClick={() => handleToggleStatus(user)}>
                                    {user.isActive ? (
                                      <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                                    ) : (
                                      <><UserCheck className="h-4 w-4 mr-2" />Activate</>
                                    )}
                                  </DropdownMenuItem>
                                  {(user.role === 'customer' || user.role === 'user') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-sm" onClick={() => {
                                        setSelectedUser(user)
                                        if (user.isBlocked) {
                                          // Unblock immediately with confirmation
                                          if (confirm('Unblock this customer? Advance fee will be enforced.')) {
                                            (async () => {
                                              const { customerManagementAPI } = await import('@/services/api')
                                              await customerManagementAPI.unblock(user._id)
                                              toast.success('Customer unblocked')
                                              dispatch(fetchUsersRequest({ page: pagination.currentPage, limit: pagination.limit }))
                                            })()
                                          }
                                        } else {
                                          setBlockForm({ reason: '', blockType: 'temporary', days: 30 })
                                          setIsBlockModalOpen(true)
                                        }
                                      }}>
                                        <Shield className="h-4 w-4 mr-2" />
                                        {user.isBlocked ? 'Unblock' : 'Block'} Customer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-sm" onClick={() => {
                                        setSelectedUser(user)
                                        if (user.forceAdvanceFee) {
                                          (async () => {
                                            const { customerManagementAPI } = await import('@/services/api')
                                            await customerManagementAPI.forceAdvance(user._id)
                                            toast.success('Advance fee removed')
                                            dispatch(fetchUsersRequest({ page: pagination.currentPage, limit: pagination.limit }))
                                          })()
                                        } else {
                                          setAdvanceForm({ amount: 199, reason: '' })
                                          setIsAdvanceModalOpen(true)
                                        }
                                      }}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {user.forceAdvanceFee ? 'Remove' : 'Force'} Advance Fee
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-sm" onClick={() => {
                                        setSelectedUser(user)
                                        setWarnMessage('')
                                        setIsWarnModalOpen(true)
                                      }}>
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Warn Customer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-sm" onClick={() => {
                                        setSelectedUser(user)
                                        setNoteText('')
                                        setIsNoteModalOpen(true)
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Add Note
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-sm text-red-600" onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true) }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {!loading && filteredUsersByTab.length === 0 && (
                  <div className="flex flex-col items-center p-12">
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-[#1A1D29] mb-1">No users found</h3>
                    <p className="text-sm text-[#6B7280]">Try adjusting your search or filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user to the system. Additional fields appear based on the selected role.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 mb-3">
                <UserIcon className="h-4 w-4 text-[#1B3B6F]" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name *</Label>
                  <Input value={newUser.fullName} onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Enter full name" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Username *</Label>
                  <Input value={newUser.username} onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))} placeholder="Enter username" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter email" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Password *</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter password" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone {(newUser.role === 'mechanic' || newUser.role === 'delivery') && '*'}</Label>
                  <Input value={newUser.phone} onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => { resetNewUserForm(); setNewUser(prev => ({ ...prev, role: value as User['role'] })) }}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="mechanic">Mechanic</SelectItem>
                      <SelectItem value="delivery">Delivery Partner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Mechanic Specific Fields */}
            {newUser.role === 'mechanic' && (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 mb-3">
                    <Wrench className="h-4 w-4 text-green-600" />
                    Mechanic Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Aadhaar Number *</Label>
                      <Input value={newUser.aadhaarNo} onChange={(e) => setNewUser(prev => ({ ...prev, aadhaarNo: e.target.value }))} placeholder="1234 5678 9012" maxLength={14} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Emergency Contact</Label>
                      <Input value={newUser.emergencyContact} onChange={(e) => setNewUser(prev => ({ ...prev, emergencyContact: e.target.value }))} placeholder="Emergency contact" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Experience</Label>
                      <Input value={newUser.experience} onChange={(e) => setNewUser(prev => ({ ...prev, experience: e.target.value }))} placeholder="e.g. 5 years" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Joining Date</Label>
                      <Input type="date" value={newUser.joiningDate} onChange={(e) => setNewUser(prev => ({ ...prev, joiningDate: e.target.value }))} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 mb-3">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Address
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Street Address</Label>
                      <Input value={newUser.address.street} onChange={(e) => setNewUser(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} placeholder="House/Shop no, Street, Area" className="h-9 text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">City</Label>
                        <Input value={newUser.address.city} onChange={(e) => setNewUser(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} placeholder="City" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">State</Label>
                        <Input value={newUser.address.state} onChange={(e) => setNewUser(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} placeholder="State" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Pincode</Label>
                        <Input value={newUser.address.pincode} onChange={(e) => setNewUser(prev => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))} placeholder="123456" maxLength={6} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 mb-3">
                    <Star className="h-4 w-4 text-amber-500" />
                    Specializations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allSpecializations.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          newUser.specializations.includes(spec)
                            ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-[#1B3B6F] hover:text-[#1B3B6F]'
                        )}
                      >
                        {newUser.specializations.includes(spec) && '✓ '}{spec}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Delivery Specific Fields */}
            {newUser.role === 'delivery' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2 mb-3">
                  <Truck className="h-4 w-4 text-purple-600" />
                  Delivery Partner Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">License Number *</Label>
                    <Input value={newUser.licenseNumber} onChange={(e) => setNewUser(prev => ({ ...prev, licenseNumber: e.target.value }))} placeholder="DL123456789" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Vehicle Type</Label>
                    <Select value={newUser.vehicleType} onValueChange={(value) => setNewUser(prev => ({ ...prev, vehicleType: value }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-xs font-medium mb-2 block">Delivery Zones</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableZones.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => toggleZone(zone)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          newUser.zones.includes(zone)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-purple-600 hover:text-purple-600'
                        )}
                      >
                        {newUser.zones.includes(zone) && '✓ '}{zone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 flex-shrink-0 gap-2">
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetNewUserForm() }}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={loading} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Edit className="h-4 w-4 text-amber-600" />
              </div>
              Edit User
            </DialogTitle>
            <DialogDescription>Update user information and settings.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <Input value={selectedUser.fullName} onChange={(e) => setSelectedUser(prev => prev ? { ...prev, fullName: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Username</Label>
                <Input value={selectedUser.username} onChange={(e) => setSelectedUser(prev => prev ? { ...prev, username: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" value={selectedUser.email} onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input value={selectedUser.phone || ''} onChange={(e) => setSelectedUser(prev => prev ? { ...prev, phone: e.target.value } : null)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value as User['role'] } : null)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KYC Documents — uploaded by mechanics/partners to ImageKit */}
              {(() => {
                const su = selectedUser as any
                const docs: { label: string; url?: string }[] = [
                  { label: 'Photo', url: su.profileImage },
                  { label: 'Aadhaar', url: su.aadharImage },
                  { label: 'PAN', url: su.panImage },
                ]
                const hasAny = docs.some(d => d.url)
                return (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-medium">KYC Documents</Label>
                    {hasAny ? (
                      <div className="grid grid-cols-3 gap-2">
                        {docs.map(d => (
                          <div key={d.label} className="space-y-1">
                            {d.url ? (
                              <a href={d.url} target="_blank" rel="noreferrer" className="block">
                                <img src={d.url} alt={d.label} className="h-20 w-full rounded-lg border border-gray-200 object-cover hover:opacity-90" />
                              </a>
                            ) : (
                              <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 text-[10px] text-gray-400">
                                Not uploaded
                              </div>
                            )}
                            <p className="text-center text-[11px] text-gray-500">{d.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-3 py-2 text-[12px] text-gray-400">No documents uploaded yet.</p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={loading} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.profileImage} />
                  <AvatarFallback className="bg-red-100 text-red-700 text-xs">
                    {(selectedUser.fullName || selectedUser.username || 'U').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm text-[#1A1D29]">{selectedUser.fullName || selectedUser.username || 'Unknown'}</div>
                  <div className="text-xs text-[#6B7280]">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Customer Modal */}
      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              Block Customer
            </DialogTitle>
            <DialogDescription>
              Customer will not be able to create new bookings after blocking.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#1B3B6F] text-white text-xs">
                    {(selectedUser.fullName || 'U').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{selectedUser.fullName || 'Customer'}</div>
                  <div className="text-xs text-[#6B7280]">{selectedUser.phone || selectedUser.email}</div>
                  <div className="text-xs text-[#6B7280]">Trust Score: {selectedUser.trustScore ?? 100}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Block Reason *</Label>
                <Select value={blockForm.reason || ''} onValueChange={(val) => setBlockForm(prev => ({ ...prev, reason: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Refused payment">Refused payment</SelectItem>
                    <SelectItem value="Abusive behavior">Abusive behavior</SelectItem>
                    <SelectItem value="Fake bookings">Fake bookings</SelectItem>
                    <SelectItem value="No-show multiple times">No-show multiple times</SelectItem>
                    <SelectItem value="custom">Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
                {blockForm.reason === 'custom' && (
                  <Input
                    placeholder="Enter custom reason..."
                    className="h-9 text-sm mt-2"
                    onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Block Type</Label>
                <Select value={blockForm.blockType} onValueChange={(val) => setBlockForm(prev => ({ ...prev, blockType: val }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temporary">Temporary (auto-unblock after set days)</SelectItem>
                    <SelectItem value="permanent">Permanent (manual unblock only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {blockForm.blockType === 'temporary' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Block Duration (days)</Label>
                  <Input
                    type="number"
                    value={blockForm.days}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, days: parseInt(e.target.value) || 30 }))}
                    className="h-9 text-sm max-w-[120px]"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!blockForm.reason || actionLoading}
              onClick={async () => {
                if (!selectedUser || !blockForm.reason) return
                setActionLoading(true)
                try {
                  const { customerManagementAPI } = await import('@/services/api')
                  await customerManagementAPI.block(selectedUser._id, blockForm.reason, blockForm.blockType, blockForm.days)
                  toast.success('Customer blocked successfully')
                  setIsBlockModalOpen(false)
                  dispatch(fetchUsersRequest({ page: pagination.currentPage, limit: pagination.limit }))
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to block customer')
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Block Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Advance Fee Modal */}
      <Dialog open={isAdvanceModalOpen} onOpenChange={setIsAdvanceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
              Force Advance Payment
            </DialogTitle>
            <DialogDescription>
              This customer will be required to pay advance fee before every booking.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{selectedUser.fullName || 'Customer'}</div>
                  <div className="text-xs text-[#6B7280]">Trust Score: {selectedUser.trustScore ?? 100}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Advance Amount (₹)</Label>
                <Input
                  type="number"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 199 }))}
                  className="h-9 text-sm max-w-[150px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reason</Label>
                <Input
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Payment refused 2 times"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsAdvanceModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              disabled={actionLoading}
              onClick={async () => {
                if (!selectedUser) return
                setActionLoading(true)
                try {
                  const { customerManagementAPI } = await import('@/services/api')
                  await customerManagementAPI.forceAdvance(selectedUser._id, advanceForm.amount, advanceForm.reason)
                  toast.success('Advance fee enforced')
                  setIsAdvanceModalOpen(false)
                  dispatch(fetchUsersRequest({ page: pagination.currentPage, limit: pagination.limit }))
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to set advance fee')
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Force Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn Customer Modal */}
      <Dialog open={isWarnModalOpen} onOpenChange={setIsWarnModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              Send Warning
            </DialogTitle>
            <DialogDescription>
              Send a warning notification to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Warning Message *</Label>
              <Textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="e.g. Your account has been flagged for repeated payment issues. Please ensure timely payments."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsWarnModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={!warnMessage || actionLoading}
              onClick={async () => {
                if (!selectedUser || !warnMessage) return
                setActionLoading(true)
                try {
                  const { customerManagementAPI } = await import('@/services/api')
                  await customerManagementAPI.warn(selectedUser._id, warnMessage)
                  toast.success('Warning sent to customer')
                  setIsWarnModalOpen(false)
                  dispatch(fetchUsersRequest({ page: pagination.currentPage, limit: pagination.limit }))
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to send warning')
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
              Add Admin Note
            </DialogTitle>
            <DialogDescription>
              Add a note to this customer&#39;s profile for internal tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Note *</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Called customer, promised to pay next time"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
              disabled={!noteText || actionLoading}
              onClick={async () => {
                if (!selectedUser || !noteText) return
                setActionLoading(true)
                try {
                  const { customerManagementAPI } = await import('@/services/api')
                  await customerManagementAPI.addNote(selectedUser._id, noteText)
                  toast.success('Note added')
                  setIsNoteModalOpen(false)
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to add note')
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
