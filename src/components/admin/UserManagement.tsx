'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
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
  Wrench,
  Truck,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'

// Mock user data
const mockUsers = [
  {
    id: 'USR-001',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+91 9876543210',
    role: 'customer',
    status: 'active',
    location: 'Mumbai, Maharashtra',
    registrationDate: '2026-01-15T10:30:00Z',
    lastActive: '2026-02-12T09:15:00Z',
    totalOrders: 15,
    totalSpent: 25600,
    rating: 4.8,
    avatar: '/avatars/john.png',
    vehicles: [
      { brand: 'Maruti', model: 'Swift', year: '2020' },
      { brand: 'Honda', model: 'City', year: '2022' }
    ]
  },
  {
    id: 'MEC-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+91 9876543211',
    role: 'mechanic',
    status: 'active',
    location: 'Delhi, Delhi',
    registrationDate: '2025-12-20T14:00:00Z',
    lastActive: '2026-02-12T11:30:00Z',
    totalJobs: 89,
    earnings: 125000,
    rating: 4.9,
    avatar: '/avatars/rajesh.png',
    specializations: ['Engine Repair', 'Brake System', 'AC Service'],
    experience: 8
  },
  {
    id: 'DEL-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 9876543212',
    role: 'delivery',
    status: 'active',
    location: 'Bangalore, Karnataka',
    registrationDate: '2026-01-05T12:00:00Z',
    lastActive: '2026-02-12T10:45:00Z',
    totalDeliveries: 234,
    earnings: 45000,
    rating: 4.7,
    avatar: '/avatars/priya.png',
    vehicleType: 'Motorcycle',
    deliveryZones: ['Central Bangalore', 'Koramangala', 'Indiranagar']
  },
  {
    id: 'USR-002',
    name: 'Michael Johnson',
    email: 'michael.j@example.com',
    phone: '+91 9876543213',
    role: 'customer',
    status: 'inactive',
    location: 'Chennai, Tamil Nadu',
    registrationDate: '2025-11-10T08:30:00Z',
    lastActive: '2026-01-15T16:20:00Z',
    totalOrders: 5,
    totalSpent: 8900,
    rating: 4.2,
    avatar: '/avatars/michael.png',
    vehicles: [
      { brand: 'Hyundai', model: 'i20', year: '2019' }
    ]
  },
  {
    id: 'ADM-001',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@roadcare.com',
    phone: '+91 9876543214',
    role: 'admin',
    status: 'active',
    location: 'Mumbai, Maharashtra',
    registrationDate: '2025-10-01T09:00:00Z',
    lastActive: '2026-02-12T12:00:00Z',
    permissions: ['Full Access', 'User Management', 'System Settings'],
    department: 'Operations'
  }
]

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
  }
}

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
  suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('customers')

  const filteredUsers = useMemo(() => {
    return mockUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'customers' && user.role === 'customer') ||
        (activeTab === 'mechanics' && user.role === 'mechanic') ||
        (activeTab === 'delivery' && user.role === 'delivery') ||
        (activeTab === 'admins' && user.role === 'admin')
      
      return matchesSearch && matchesRole && matchesStatus && matchesTab
    })
  }, [searchQuery, roleFilter, statusFilter, activeTab])

  const getUserStats = () => {
    const total = mockUsers.length
    const customers = mockUsers.filter(u => u.role === 'customer').length
    const mechanics = mockUsers.filter(u => u.role === 'mechanic').length
    const delivery = mockUsers.filter(u => u.role === 'delivery').length
    const admins = mockUsers.filter(u => u.role === 'admin').length
    
    return { total, customers, mechanics, delivery, admins }
  }

  const stats = getUserStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} border-0 flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for users:`, selectedUsers)
    setSelectedUsers([])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">User Management</h1>
          <p className="text-[#6B7280] mt-1">Manage customers, mechanics, delivery partners, and administrators</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.total}</p>
                <p className="text-xs text-[#6B7280]">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.customers}</p>
                <p className="text-xs text-[#6B7280]">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.mechanics}</p>
                <p className="text-xs text-[#6B7280]">Mechanics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.delivery}</p>
                <p className="text-xs text-[#6B7280]">Delivery Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.admins}</p>
                <p className="text-xs text-[#6B7280]">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Categories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users by name, email, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('activate')}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('suspend')}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('message')}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{user.name}</div>
                            <div className="text-sm text-[#6B7280]">{user.email}</div>
                            <div className="text-xs text-[#9CA3AF]">{user.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {user.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.role === 'customer' && (
                            <>
                              <div className="text-sm font-medium">{user.totalOrders} orders</div>
                              <div className="text-xs text-[#6B7280]">{formatCurrency(user.totalSpent!)}</div>
                            </>
                          )}
                          {user.role === 'mechanic' && (
                            <>
                              <div className="text-sm font-medium">{user.totalJobs} jobs</div>
                              <div className="text-xs text-[#6B7280]">{formatCurrency(user.earnings!)}</div>
                            </>
                          )}
                          {user.role === 'delivery' && (
                            <>
                              <div className="text-sm font-medium">{user.totalDeliveries} deliveries</div>
                              <div className="text-xs text-[#6B7280]">{formatCurrency(user.earnings!)}</div>
                            </>
                          )}
                          {user.rating && (
                            <div className="flex items-center text-xs">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              {user.rating}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDate(user.registrationDate)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDate(user.lastActive)}
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
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              {user.status === 'active' ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No users found</h3>
                  <p className="text-[#6B7280]">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Profile - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Complete user information and activity history
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Basic Info */}
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-[#1A1D29]">{selectedUser.name}</h3>
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6B7280]">Email:</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Phone:</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Location:</p>
                      <p className="font-medium">{selectedUser.location}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Member Since:</p>
                      <p className="font-medium">{formatDate(selectedUser.registrationDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              {selectedUser.role === 'customer' && selectedUser.vehicles && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Vehicles</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.vehicles.map((vehicle: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-sm text-[#6B7280]">Year: {vehicle.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.role === 'mechanic' && selectedUser.specializations && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.specializations.map((spec: string, index: number) => (
                      <Badge key={index} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">Experience: {selectedUser.experience} years</p>
                </div>
              )}

              {selectedUser.role === 'delivery' && selectedUser.deliveryZones && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Delivery Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6B7280]">Vehicle Type:</p>
                      <p className="font-medium">{selectedUser.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Delivery Zones:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.deliveryZones.map((zone: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">{zone}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedUser.role === 'customer' && (
                    <>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.totalOrders}</p>
                        <p className="text-sm text-[#6B7280]">Total Orders</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.totalSpent!)}</p>
                        <p className="text-sm text-[#6B7280]">Total Spent</p>
                      </div>
                    </>
                  )}
                  {(selectedUser.role === 'mechanic' || selectedUser.role === 'delivery') && (
                    <>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedUser.role === 'mechanic' ? selectedUser.totalJobs : selectedUser.totalDeliveries}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {selectedUser.role === 'mechanic' ? 'Completed Jobs' : 'Total Deliveries'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedUser.earnings!)}</p>
                        <p className="text-sm text-[#6B7280]">Total Earnings</p>
                      </div>
                    </>
                  )}
                  {selectedUser.rating && (
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                        <Star className="h-6 w-6 mr-1" />
                        {selectedUser.rating}
                      </p>
                      <p className="text-sm text-[#6B7280]">Rating</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}