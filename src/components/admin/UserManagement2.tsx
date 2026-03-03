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
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    if (roleFilter !== 'all') params.role = roleFilter
    if (statusFilter !== 'all') params.isActive = statusFilter === 'active'
    dispatch(fetchUsersRequest(params))
  }, [dispatch, pagination.currentPage, pagination.limit, roleFilter, statusFilter, searchQuery])

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

  // KPI cards
  const kpiCards = [
    { label: 'Total Users', value: stats.total || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Users', value: stats.active || 0, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Mechanics', value: stats.roles?.mechanic || 0, icon: Wrench, color: 'bg-orange-50 text-orange-600' },
    { label: 'New This Month', value: stats.recentUsers || 0, icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
  ]

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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => {
            const Icon = card.icon
            return (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg ${card.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1D29]">{card.value}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            )
          })}
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

                <Button variant="outline" size="sm" className="h-9 text-xs">
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
                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedUsers.length === filteredUsersByTab.length && filteredUsersByTab.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">User</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</TableHead>
                          <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Active</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsersByTab.map((user) => (
                          <TableRow key={user._id} className="hover:bg-gray-50/50 transition-colors">
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
                    {selectedUser.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm text-[#1A1D29]">{selectedUser.fullName}</div>
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
    </div>
  )
}
