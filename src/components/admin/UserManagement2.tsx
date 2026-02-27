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
  Loader2
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

const roleConfig = {
  customer: { 
    color: 'bg-blue-100 text-blue-800', 
    icon: Users, 
    label: 'Customer' 
  },
  mechanic: { 
    color: 'bg-green-100 text-green-800', 
    icon: Wrench, 
    label: 'Mechanic' 
  },
  delivery: { 
    color: 'bg-purple-100 text-purple-800', 
    icon: Truck, 
    label: 'Delivery' 
  },
  admin: { 
    color: 'bg-red-100 text-red-800', 
    icon: Shield, 
    label: 'Admin' 
  },
  manager: { 
    color: 'bg-orange-100 text-orange-800', 
    icon: Shield, 
    label: 'Manager' 
  },
  staff: { 
    color: 'bg-gray-100 text-gray-800', 
    icon: UserCheck, 
    label: 'Staff' 
  }
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
    // Mechanic specific fields
    aadhaarNo: '',
    emergencyContact: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    specializations: [] as string[],
    experience: '',
    joiningDate: new Date().toISOString().split('T')[0],
    // Delivery specific fields
    licenseNumber: '',
    vehicleType: '',
    zones: [] as string[]
  })

  // Specializations list for mechanics
  const allSpecializations = [
    'Engine Repair', 'Brake System', 'Electrical', 'AC Service',
    'Battery', 'Tyre Service', 'Suspension', 'Clutch',
    'Oil Change', 'Body Work', 'Painting', 'General Service'
  ]

  // Vehicle types for delivery
  const vehicleTypes = [
    'Motorcycle', 'Scooter', 'Bicycle', 'Car', 'Van', 'Truck'
  ]

  // Available zones for delivery
  const availableZones = [
    'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'
  ]

  // Fetch data on mount and when filters change
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

  // Fetch stats on mount
  useEffect(() => {
    dispatch(fetchUserStatsRequest())
    dispatch(fetchMechanicsRequest())
  }, [dispatch])

  // Clear errors
  useEffect(() => {
    return () => {
      dispatch(clearUserError())
    }
  }, [dispatch])

  // Show error toast
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Helper functions for managing specializations and zones
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
      zones: prev.zones.includes(zone)
        ? prev.zones.filter(z => z !== zone)
        : [...prev.zones, zone]
    }))
  }

  // Reset form
  const resetNewUserForm = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'customer',
      phone: '',
      aadhaarNo: '',
      emergencyContact: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      specializations: [],
      experience: '',
      joiningDate: new Date().toISOString().split('T')[0],
      licenseNumber: '',
      vehicleType: '',
      zones: []
    })
  }

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName) {
      toast.error('Please fill in all required fields')
      return
    }

    // Role-specific validation
    if (newUser.role === 'mechanic') {
      if (!newUser.phone || !newUser.aadhaarNo) {
        toast.error('Phone and Aadhaar number are required for mechanics')
        return
      }
    }

    if (newUser.role === 'delivery') {
      if (!newUser.phone || !newUser.licenseNumber) {
        toast.error('Phone and license number are required for delivery partners')
        return
      }
    }

    dispatch(createUserRequest(newUser))
    setIsCreateModalOpen(false)
    resetNewUserForm()
    toast.success('User created successfully')
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return
    
    dispatch(updateUserRequest({ 
      id: selectedUser._id, 
      data: selectedUser 
    }))
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
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getRoleIcon = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    const IconComponent = config?.icon || Users
    return <IconComponent className="h-4 w-4" />
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    return (
      <Badge className={`text-xs ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || role}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={`text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage customers, mechanics, delivery partners, and admin users</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mechanics</p>
                <p className="text-2xl font-bold text-gray-900">{stats.roles.mechanic}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    Bulk Update
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Bulk Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="customer">Customers</TabsTrigger>
          <TabsTrigger value="mechanic">Mechanics</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsersByTab.length && filteredUsersByTab.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsersByTab.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={() => handleSelectUser(user._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImage} />
                              <AvatarFallback>
                                {user.fullName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{user.fullName}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center text-gray-500">
                                <Phone className="h-3 w-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsDeleteModalOpen(true)
                                }}
                              >
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
              )}

              {!loading && filteredUsersByTab.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with their information. Additional fields will appear based on the selected role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-600" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone {(newUser.role === 'mechanic' || newUser.role === 'delivery') && '*'}</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => {
                      setNewUser(prev => ({ ...prev, role: value as User['role'] }))
                      // Reset role-specific fields when role changes
                      resetNewUserForm()
                      setNewUser(prev => ({ ...prev, role: value as User['role'] }))
                    }}
                  >
                    <SelectTrigger>
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
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-600" />
                    Mechanic Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaarNo">Aadhaar Number *</Label>
                      <Input
                        id="aadhaarNo"
                        value={newUser.aadhaarNo}
                        onChange={(e) => setNewUser(prev => ({ ...prev, aadhaarNo: e.target.value }))}
                        placeholder="1234 5678 9012"
                        maxLength={14}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={newUser.emergencyContact}
                        onChange={(e) => setNewUser(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Emergency contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Input
                        id="experience"
                        value={newUser.experience}
                        onChange={(e) => setNewUser(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g. 5 years"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        value={newUser.joiningDate}
                        onChange={(e) => setNewUser(prev => ({ ...prev, joiningDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Address
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={newUser.address.street}
                        onChange={(e) => setNewUser(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, street: e.target.value } 
                        }))}
                        placeholder="House/Shop no, Street, Area"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newUser.address.city}
                          onChange={(e) => setNewUser(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value } 
                          }))}
                          placeholder="City name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={newUser.address.state}
                          onChange={(e) => setNewUser(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, state: e.target.value } 
                          }))}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={newUser.address.pincode}
                          onChange={(e) => setNewUser(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, pincode: e.target.value } 
                          }))}
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    Specializations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {allSpecializations.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          newUser.specializations.includes(spec)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600'
                        }`}
                      >
                        {newUser.specializations.includes(spec) && <span className="mr-1">✓</span>}
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Delivery Specific Fields */}
            {newUser.role === 'delivery' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-purple-600" />
                  Delivery Partner Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={newUser.licenseNumber}
                      onChange={(e) => setNewUser(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="DL123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select 
                      value={newUser.vehicleType} 
                      onValueChange={(value) => setNewUser(prev => ({ ...prev, vehicleType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Delivery Zones */}
                <div className="mt-4">
                  <Label className="text-sm mb-2 block">Delivery Zones</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableZones.map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => toggleZone(zone)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          newUser.zones.includes(zone)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-purple-600 hover:text-purple-600'
                        }`}
                      >
                        {newUser.zones.includes(zone) && <span className="mr-1">✓</span>}
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false)
              resetNewUserForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={selectedUser.fullName}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUsername">Username</Label>
                <Input
                  id="editUsername"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value as User['role'] } : null)}
                >
                  <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.profileImage} />
                  <AvatarFallback>
                    {selectedUser.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-gray-900">{selectedUser.fullName}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
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