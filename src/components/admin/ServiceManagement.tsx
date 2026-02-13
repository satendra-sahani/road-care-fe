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
  Wrench,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Calendar,
  Phone,
  MessageSquare,
  Car,
  DollarSign
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

// Mock service request data
const mockServiceRequests = [
  {
    id: 'SRV-2026-001',
    customer: {
      name: 'Raj Kumar',
      email: 'raj@example.com',
      phone: '+91 9876543210',
      avatar: '/avatars/raj.png'
    },
    vehicle: {
      brand: 'Maruti',
      model: 'Swift',
      year: '2020',
      registrationNumber: 'MH01AB1234'
    },
    serviceType: 'Engine Service',
    priority: 'high',
    status: 'assigned',
    assignedMechanic: {
      id: 'MEC-001',
      name: 'Rajesh Mechanic',
      rating: 4.8,
      avatar: '/avatars/rajesh.png'
    },
    location: 'Bandra, Mumbai',
    requestDate: '2026-02-12T09:30:00Z',
    scheduledDate: '2026-02-13T10:00:00Z',
    estimatedCost: 3500,
    description: 'Engine making unusual noise, needs inspection and service',
    issues: ['Engine noise', 'Rough idling', 'Reduced performance'],
    partsRequired: [
      { name: 'Engine Oil 5W-30', quantity: 1, cost: 800 },
      { name: 'Oil Filter', quantity: 1, cost: 400 }
    ],
    laborCost: 2300,
    totalCost: 3500
  },
  {
    id: 'SRV-2026-002',
    customer: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91 9876543211',
      avatar: '/avatars/priya.png'
    },
    vehicle: {
      brand: 'Honda',
      model: 'City',
      year: '2022',
      registrationNumber: 'KA03CD5678'
    },
    serviceType: 'Brake Service',
    priority: 'medium',
    status: 'pending',
    assignedMechanic: null,
    location: 'Koramangala, Bangalore',
    requestDate: '2026-02-12T11:15:00Z',
    scheduledDate: null,
    estimatedCost: 2500,
    description: 'Brake pedal feels spongy, brake pads might need replacement',
    issues: ['Spongy brake pedal', 'Squeaking noise when braking'],
    partsRequired: [
      { name: 'Brake Pads Set', quantity: 1, cost: 1200 }
    ],
    laborCost: 1300,
    totalCost: 2500
  },
  {
    id: 'SRV-2026-003',
    customer: {
      name: 'Amit Singh',
      email: 'amit@example.com',
      phone: '+91 9876543212',
      avatar: '/avatars/amit.png'
    },
    vehicle: {
      brand: 'Hyundai',
      model: 'i20',
      year: '2021',
      registrationNumber: 'DL07EF9012'
    },
    serviceType: 'AC Service',
    priority: 'low',
    status: 'in-progress',
    assignedMechanic: {
      id: 'MEC-002',
      name: 'Suresh Kumar',
      rating: 4.6,
      avatar: '/avatars/suresh.png'
    },
    location: 'Lajpat Nagar, Delhi',
    requestDate: '2026-02-11T16:45:00Z',
    scheduledDate: '2026-02-12T14:00:00Z',
    estimatedCost: 1800,
    description: 'AC not cooling properly, needs gas refill',
    issues: ['Poor cooling', 'AC compressor not engaging'],
    partsRequired: [
      { name: 'R134a Gas', quantity: 1, cost: 600 }
    ],
    laborCost: 1200,
    totalCost: 1800
  },
  {
    id: 'SRV-2026-004',
    customer: {
      name: 'Neha Patel',
      email: 'neha@example.com',
      phone: '+91 9876543213',
      avatar: '/avatars/neha.png'
    },
    vehicle: {
      brand: 'Tata',
      model: 'Nexon',
      year: '2023',
      registrationNumber: 'GJ01GH3456'
    },
    serviceType: 'Battery Replacement',
    priority: 'high',
    status: 'completed',
    assignedMechanic: {
      id: 'MEC-003',
      name: 'Vikash Mechanic',
      rating: 4.9,
      avatar: '/avatars/vikash.png'
    },
    location: 'Ahmedabad, Gujarat',
    requestDate: '2026-02-10T08:30:00Z',
    scheduledDate: '2026-02-10T15:00:00Z',
    estimatedCost: 4200,
    description: 'Car not starting, battery seems dead',
    issues: ['Car not starting', 'Battery voltage low'],
    partsRequired: [
      { name: 'Exide Battery 12V 65Ah', quantity: 1, cost: 4200 }
    ],
    laborCost: 0,
    totalCost: 4200,
    completedDate: '2026-02-10T17:30:00Z',
    customerRating: 5,
    customerReview: 'Excellent service, very professional mechanic'
  },
  {
    id: 'SRV-2026-005',
    customer: {
      name: 'Rohit Gupta',
      email: 'rohit@example.com',
      phone: '+91 9876543214',
      avatar: '/avatars/rohit.png'
    },
    vehicle: {
      brand: 'Mahindra',
      model: 'XUV300',
      year: '2022',
      registrationNumber: 'UP16IJ7890'
    },
    serviceType: 'Tyre Replacement',
    priority: 'medium',
    status: 'cancelled',
    assignedMechanic: null,
    location: 'Lucknow, Uttar Pradesh',
    requestDate: '2026-02-09T12:20:00Z',
    scheduledDate: null,
    estimatedCost: 18000,
    description: 'Need to replace all 4 tyres',
    issues: ['Worn out tyres', 'Uneven tread wear'],
    partsRequired: [
      { name: 'Michelin Tyre 205/60 R16', quantity: 4, cost: 4500 }
    ],
    laborCost: 0,
    totalCost: 18000,
    cancellationReason: 'Customer found cheaper option elsewhere'
  }
]

const mockMechanics = [
  {
    id: 'MEC-001',
    name: 'Rajesh Kumar',
    rating: 4.8,
    specializations: ['Engine Repair', 'Brake System', 'Electrical'],
    location: 'Mumbai, Maharashtra',
    availability: 'available',
    completedJobs: 234,
    avgJobTime: '2.5 hours'
  },
  {
    id: 'MEC-002',
    name: 'Suresh Kumar',
    rating: 4.6,
    specializations: ['AC Service', 'Engine Service', 'Battery'],
    location: 'Delhi, Delhi',
    availability: 'busy',
    completedJobs: 189,
    avgJobTime: '3.1 hours'
  },
  {
    id: 'MEC-003',
    name: 'Vikash Mechanic',
    rating: 4.9,
    specializations: ['Battery', 'Electrical', 'Tyre Service'],
    location: 'Bangalore, Karnataka',
    availability: 'available',
    completedJobs: 156,
    avgJobTime: '2.2 hours'
  }
]

const statusConfig = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Clock, 
    label: 'Pending' 
  },
  assigned: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: User, 
    label: 'Assigned' 
  },
  'in-progress': { 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: Wrench, 
    label: 'In Progress' 
  },
  completed: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle, 
    label: 'Completed' 
  },
  cancelled: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle, 
    label: 'Cancelled' 
  }
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-900', label: 'Urgent' }
}

export function ServiceManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('requests')

  const filteredRequests = useMemo(() => {
    return mockServiceRequests.filter(request => {
      const matchesSearch = 
        request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
      const matchesServiceType = serviceTypeFilter === 'all' || 
        request.serviceType.toLowerCase().replace(/\s+/g, '-') === serviceTypeFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesServiceType
    })
  }, [searchQuery, statusFilter, priorityFilter, serviceTypeFilter])

  const getServiceStats = () => {
    const totalRequests = mockServiceRequests.length
    const pendingRequests = mockServiceRequests.filter(r => r.status === 'pending').length
    const inProgressRequests = mockServiceRequests.filter(r => r.status === 'in-progress').length
    const completedRequests = mockServiceRequests.filter(r => r.status === 'completed').length
    const avgRating = mockServiceRequests
      .filter(r => r.customerRating)
      .reduce((sum, r) => sum + r.customerRating!, 0) / 
      mockServiceRequests.filter(r => r.customerRating).length
    
    return { totalRequests, pendingRequests, inProgressRequests, completedRequests, avgRating }
  }

  const stats = getServiceStats()

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} border flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const handleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(filteredRequests.map(request => request.id))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for service requests:`, selectedRequests)
    setSelectedRequests([])
  }

  const handleAssignMechanic = (requestId: string, mechanicId: string) => {
    console.log(`Assign mechanic ${mechanicId} to request ${requestId}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Service Management</h1>
          <p className="text-[#6B7280] mt-1">Manage service requests, mechanic assignments, and job tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            <Plus className="h-4 w-4 mr-2" />
            Add Service Request
          </Button>
        </div>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalRequests}</p>
                <p className="text-xs text-[#6B7280]">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.pendingRequests}</p>
                <p className="text-xs text-[#6B7280]">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.inProgressRequests}</p>
                <p className="text-xs text-[#6B7280]">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.completedRequests}</p>
                <p className="text-xs text-[#6B7280]">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.avgRating?.toFixed(1) || '0'}</p>
                <p className="text-xs text-[#6B7280]">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
        </TabsList>

        {/* Service Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by request ID, customer, vehicle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="engine-service">Engine Service</SelectItem>
                      <SelectItem value="brake-service">Brake Service</SelectItem>
                      <SelectItem value="ac-service">AC Service</SelectItem>
                      <SelectItem value="battery-replacement">Battery Replacement</SelectItem>
                      <SelectItem value="tyre-replacement">Tyre Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedRequests.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedRequests.length} request(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('assign')}
                      >
                        Assign Mechanic
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('update-status')}
                      >
                        Update Status
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('send-notification')}
                      >
                        Send Update
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Requests Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRequests.length === filteredRequests.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={() => handleSelectRequest(request.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-[#1B3B6F]">
                        {request.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.customer.avatar} />
                            <AvatarFallback>
                              {request.customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{request.customer.name}</div>
                            <div className="text-sm text-[#6B7280]">{request.customer.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4 text-[#6B7280]" />
                          <div>
                            <div className="font-medium text-[#1A1D29]">
                              {request.vehicle.brand} {request.vehicle.model}
                            </div>
                            <div className="text-sm text-[#6B7280]">{request.vehicle.registrationNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.serviceType}</Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(request.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {request.assignedMechanic ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={request.assignedMechanic.avatar} />
                              <AvatarFallback className="text-xs">
                                {request.assignedMechanic.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{request.assignedMechanic.name}</div>
                              <div className="flex items-center text-xs text-[#6B7280]">
                                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                {request.assignedMechanic.rating}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#6B7280]">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(request.estimatedCost)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDate(request.requestDate)}
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
                            <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Request
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <User className="h-4 w-4 mr-2" />
                              Assign Mechanic
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Update
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && (
                <div className="p-8 text-center">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No service requests found</h3>
                  <p className="text-[#6B7280]">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mechanics Tab */}
        <TabsContent value="mechanics" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Available Mechanics</span>
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mechanic
                </Button>
              </CardTitle>
              <CardDescription>Manage mechanic profiles and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockMechanics.map((mechanic) => (
                  <Card key={mechanic.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {mechanic.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#1A1D29]">{mechanic.name}</h3>
                          <div className="flex items-center text-sm text-[#6B7280]">
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            {mechanic.rating} rating
                          </div>
                        </div>
                        <Badge className={
                          mechanic.availability === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {mechanic.availability}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><span className="text-[#6B7280]">Location:</span> {mechanic.location}</p>
                        <p><span className="text-[#6B7280]">Completed Jobs:</span> {mechanic.completedJobs}</p>
                        <p><span className="text-[#6B7280]">Avg Job Time:</span> {mechanic.avgJobTime}</p>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-[#6B7280] mb-2">Specializations:</p>
                        <div className="flex flex-wrap gap-1">
                          {mechanic.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{spec}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          View Profile
                        </Button>
                        <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545] flex-1">
                          Assign Job
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unassigned Requests */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#1A1D29] flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Unassigned Requests
                </CardTitle>
                <CardDescription>Service requests waiting for mechanic assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockServiceRequests.filter(r => r.status === 'pending' && !r.assignedMechanic).map((request) => (
                    <div key={request.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#1A1D29]">{request.id}</h4>
                          <p className="text-sm text-[#6B7280]">
                            {request.serviceType} - {request.customer.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{request.location}</p>
                        </div>
                        <div className="text-right">
                          {getPriorityBadge(request.priority)}
                          <p className="text-xs text-[#6B7280] mt-1">
                            {formatDate(request.requestDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Assignment */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#1A1D29] flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Assignment
                </CardTitle>
                <CardDescription>Assign mechanics to service requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Request" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockServiceRequests.filter(r => !r.assignedMechanic).map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            {request.id} - {request.serviceType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mechanic" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMechanics.filter(m => m.availability === 'available').map((mechanic) => (
                          <SelectItem key={mechanic.id} value={mechanic.id}>
                            {mechanic.name} ({mechanic.rating}★)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]">
                    Assign Mechanic
                  </Button>
                </div>

                <div className="mt-6">
                  <h5 className="font-medium text-[#1A1D29] mb-3">Auto-Assignment Rules</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Assign by proximity</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Assign by specialization</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Assign by rating</span>
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Request Details Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Service Request Details - {selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Complete information about this service request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Name:</span> {selectedRequest.customer.name}</p>
                    <p><span className="text-[#6B7280]">Email:</span> {selectedRequest.customer.email}</p>
                    <p><span className="text-[#6B7280]">Phone:</span> {selectedRequest.customer.phone}</p>
                    <p><span className="text-[#6B7280]">Location:</span> {selectedRequest.location}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Vehicle Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Vehicle:</span> {selectedRequest.vehicle.brand} {selectedRequest.vehicle.model}</p>
                    <p><span className="text-[#6B7280]">Year:</span> {selectedRequest.vehicle.year}</p>
                    <p><span className="text-[#6B7280]">Registration:</span> {selectedRequest.vehicle.registrationNumber}</p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Service Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Service Type:</span> {selectedRequest.serviceType}</p>
                    <p><span className="text-[#6B7280]">Priority:</span> {getPriorityBadge(selectedRequest.priority)}</p>
                    <p><span className="text-[#6B7280]">Status:</span> {getStatusBadge(selectedRequest.status)}</p>
                    <p><span className="text-[#6B7280]">Request Date:</span> {formatDate(selectedRequest.requestDate)}</p>
                    {selectedRequest.scheduledDate && (
                      <p><span className="text-[#6B7280]">Scheduled:</span> {formatDate(selectedRequest.scheduledDate)}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Labor Cost:</span> {formatCurrency(selectedRequest.laborCost)}</p>
                    <p><span className="text-[#6B7280]">Parts Cost:</span> {formatCurrency(selectedRequest.partsRequired.reduce((sum, part) => sum + part.cost, 0))}</p>
                    <p className="font-medium"><span className="text-[#6B7280]">Total Cost:</span> {formatCurrency(selectedRequest.totalCost)}</p>
                  </div>
                </div>
              </div>

              {/* Description & Issues */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Description</h4>
                <p className="text-sm text-[#6B7280]">{selectedRequest.description}</p>
                
                <h4 className="font-medium text-[#1A1D29] mt-4 mb-2">Reported Issues</h4>
                <ul className="text-sm text-[#6B7280] space-y-1">
                  {selectedRequest.issues.map((issue: string, index: number) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>

              {/* Parts Required */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Parts Required</h4>
                <div className="space-y-2">
                  {selectedRequest.partsRequired.map((part: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{part.name}</span>
                        <span className="text-[#6B7280] ml-2">Qty: {part.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(part.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Mechanic */}
              {selectedRequest.assignedMechanic && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Assigned Mechanic</h4>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRequest.assignedMechanic.avatar} />
                      <AvatarFallback>
                        {selectedRequest.assignedMechanic.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedRequest.assignedMechanic.name}</p>
                      <div className="flex items-center text-sm text-[#6B7280]">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {selectedRequest.assignedMechanic.rating} rating
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Feedback (if completed) */}
              {selectedRequest.status === 'completed' && selectedRequest.customerRating && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Customer Feedback</h4>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{selectedRequest.customerRating}/5</span>
                    </div>
                    <p className="text-sm text-[#6B7280]">{selectedRequest.customerReview}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Update Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}