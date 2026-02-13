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
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Package,
  User,
  Star,
  Phone,
  MessageSquare
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

// Mock delivery data
const mockDeliveryPartners = [
  {
    id: 'DEL-001',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 9876543210',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'MH01AB1234',
    status: 'active',
    availability: 'available',
    location: { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
    zone: 'Mumbai Central',
    rating: 4.8,
    completedDeliveries: 234,
    totalEarnings: 45000,
    avgDeliveryTime: 25,
    joinDate: '2025-11-15T00:00:00Z',
    lastActive: '2026-02-12T10:30:00Z',
    avatar: '/avatars/priya.png'
  },
  {
    id: 'DEL-002',
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    phone: '+91 9876543211',
    vehicleType: 'Scooter',
    vehicleNumber: 'DL07CD5678',
    status: 'active',
    availability: 'busy',
    location: { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
    zone: 'Central Delhi',
    rating: 4.6,
    completedDeliveries: 189,
    totalEarnings: 38000,
    avgDeliveryTime: 32,
    joinDate: '2025-12-01T00:00:00Z',
    lastActive: '2026-02-12T11:15:00Z',
    avatar: '/avatars/ravi.png'
  },
  {
    id: 'DEL-003',
    name: 'Suresh Patel',
    email: 'suresh@example.com',
    phone: '+91 9876543212',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'KA03EF9012',
    status: 'inactive',
    availability: 'offline',
    location: { lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
    zone: 'Koramangala',
    rating: 4.9,
    completedDeliveries: 345,
    totalEarnings: 67000,
    avgDeliveryTime: 28,
    joinDate: '2025-10-10T00:00:00Z',
    lastActive: '2026-02-10T16:45:00Z',
    avatar: '/avatars/suresh.png'
  }
]

const mockDeliveryZones = [
  {
    id: 'ZONE-001',
    name: 'Mumbai Central',
    city: 'Mumbai',
    area: 'Bandra, Kurla, Andheri',
    activePartners: 12,
    avgDeliveryTime: 28,
    totalDeliveries: 1234,
    status: 'active'
  },
  {
    id: 'ZONE-002',
    name: 'Central Delhi',
    city: 'Delhi',
    area: 'CP, Lajpat Nagar, Khan Market',
    activePartners: 8,
    avgDeliveryTime: 35,
    totalDeliveries: 987,
    status: 'active'
  },
  {
    id: 'ZONE-003',
    name: 'Koramangala',
    city: 'Bangalore',
    area: 'Koramangala, BTM Layout, HSR Layout',
    activePartners: 15,
    avgDeliveryTime: 25,
    totalDeliveries: 1567,
    status: 'active'
  },
  {
    id: 'ZONE-004',
    name: 'South Chennai',
    city: 'Chennai',
    area: 'T Nagar, Adyar, Velachery',
    activePartners: 6,
    avgDeliveryTime: 40,
    totalDeliveries: 456,
    status: 'inactive'
  }
]

const mockActiveDeliveries = [
  {
    id: 'DEL-TRK-001',
    orderId: 'ORD-2026-001',
    partnerId: 'DEL-001',
    partnerName: 'Priya Sharma',
    customer: 'John Smith',
    pickup: 'Road Care Warehouse, Andheri',
    delivery: 'Bandra West, Mumbai',
    status: 'in-transit',
    estimatedTime: 15,
    actualDistance: 8.5,
    startTime: '2026-02-12T10:00:00Z'
  },
  {
    id: 'DEL-TRK-002',
    orderId: 'ORD-2026-002',
    partnerId: 'DEL-002',
    partnerName: 'Ravi Kumar',
    customer: 'Sarah Johnson',
    pickup: 'Road Care Warehouse, Delhi',
    delivery: 'Lajpat Nagar, Delhi',
    status: 'picked-up',
    estimatedTime: 25,
    actualDistance: 12.3,
    startTime: '2026-02-12T09:30:00Z'
  }
]

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
  suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
}

const availabilityConfig = {
  available: { color: 'bg-green-100 text-green-800', label: 'Available' },
  busy: { color: 'bg-yellow-100 text-yellow-800', label: 'Busy' },
  offline: { color: 'bg-gray-100 text-gray-800', label: 'Offline' }
}

const deliveryStatusConfig = {
  'in-transit': { color: 'bg-blue-100 text-blue-800', label: 'In Transit' },
  'picked-up': { color: 'bg-purple-100 text-purple-800', label: 'Picked Up' },
  delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
}

export function DeliveryLogistics() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('partners')

  const filteredPartners = useMemo(() => {
    return mockDeliveryPartners.filter(partner => {
      const matchesSearch = 
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.phone.includes(searchQuery) ||
        partner.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || partner.status === statusFilter
      const matchesAvailability = availabilityFilter === 'all' || partner.availability === availabilityFilter
      
      return matchesSearch && matchesStatus && matchesAvailability
    })
  }, [searchQuery, statusFilter, availabilityFilter])

  const getDeliveryStats = () => {
    const totalPartners = mockDeliveryPartners.length
    const activePartners = mockDeliveryPartners.filter(p => p.status === 'active').length
    const availablePartners = mockDeliveryPartners.filter(p => p.availability === 'available').length
    const totalDeliveries = mockDeliveryPartners.reduce((sum, p) => sum + p.completedDeliveries, 0)
    const avgRating = mockDeliveryPartners.reduce((sum, p) => sum + p.rating, 0) / mockDeliveryPartners.length
    
    return { totalPartners, activePartners, availablePartners, totalDeliveries, avgRating }
  }

  const stats = getDeliveryStats()

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

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getAvailabilityBadge = (availability: string) => {
    const config = availabilityConfig[availability as keyof typeof availabilityConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getDeliveryStatusBadge = (status: string) => {
    const config = deliveryStatusConfig[status as keyof typeof deliveryStatusConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartners(prev => 
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPartners.length === filteredPartners.length) {
      setSelectedPartners([])
    } else {
      setSelectedPartners(filteredPartners.map(partner => partner.id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Delivery & Logistics</h1>
          <p className="text-[#6B7280] mt-1">Manage delivery partners, routes, and track shipments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Delivery Report
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            <Plus className="h-4 w-4 mr-2" />
            Add Delivery Partner
          </Button>
        </div>
      </div>

      {/* Delivery Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalPartners}</p>
                <p className="text-xs text-[#6B7280]">Total Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.activePartners}</p>
                <p className="text-xs text-[#6B7280]">Active Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.availablePartners}</p>
                <p className="text-xs text-[#6B7280]">Available Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalDeliveries}</p>
                <p className="text-xs text-[#6B7280]">Total Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs text-[#6B7280]">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
          <TabsTrigger value="routes">Route Management</TabsTrigger>
        </TabsList>

        {/* Delivery Partners Tab */}
        <TabsContent value="partners" className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search delivery partners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedPartners.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedPartners.length} partner(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        Assign Deliveries
                      </Button>
                      <Button size="sm" variant="outline">
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partners Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPartners.length === filteredPartners.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedPartners.includes(partner.id)}
                          onCheckedChange={() => handleSelectPartner(partner.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={partner.avatar} />
                            <AvatarFallback>
                              {partner.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{partner.name}</div>
                            <div className="text-sm text-[#6B7280]">{partner.email}</div>
                            <div className="text-xs text-[#9CA3AF]">{partner.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-[#6B7280]" />
                          <div>
                            <div className="font-medium">{partner.vehicleType}</div>
                            <div className="text-sm text-[#6B7280]">{partner.vehicleNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-[#6B7280]" />
                          {partner.zone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(partner.status)}
                      </TableCell>
                      <TableCell>
                        {getAvailabilityBadge(partner.availability)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{partner.completedDeliveries} deliveries</div>
                          <div className="text-xs text-[#6B7280]">Avg: {partner.avgDeliveryTime} mins</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(partner.totalEarnings)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium">{partner.rating}</span>
                        </div>
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
                            <DropdownMenuItem onClick={() => setSelectedPartner(partner)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Partner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Package className="h-4 w-4 mr-2" />
                              Assign Delivery
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Partner
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Suspend Partner
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Live Delivery Tracking</CardTitle>
              <CardDescription>Real-time tracking of active deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActiveDeliveries.map((delivery) => (
                  <div key={delivery.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-[#1A1D29]">{delivery.orderId}</h3>
                        <p className="text-sm text-[#6B7280]">Partner: {delivery.partnerName}</p>
                      </div>
                      {getDeliveryStatusBadge(delivery.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-[#6B7280]">Pickup Location</p>
                        <p className="text-sm font-medium">{delivery.pickup}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Delivery Location</p>
                        <p className="text-sm font-medium">{delivery.delivery}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Customer</p>
                        <p className="text-sm font-medium">{delivery.customer}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">
                        Distance: {delivery.actualDistance} km
                      </span>
                      <span className="text-[#6B7280]">
                        ETA: {delivery.estimatedTime} minutes
                      </span>
                      <Button size="sm" variant="outline">
                        <Navigation className="h-4 w-4 mr-1" />
                        Track
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Delivery Zones</span>
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </CardTitle>
              <CardDescription>Manage delivery zones and coverage areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockDeliveryZones.map((zone) => (
                  <div key={zone.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[#1A1D29]">{zone.name}</h3>
                      {getStatusBadge(zone.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><span className="text-[#6B7280]">City:</span> {zone.city}</p>
                      <p><span className="text-[#6B7280]">Coverage Area:</span> {zone.area}</p>
                      <p><span className="text-[#6B7280]">Active Partners:</span> {zone.activePartners}</p>
                      <p><span className="text-[#6B7280]">Avg Delivery Time:</span> {zone.avgDeliveryTime} mins</p>
                      <p><span className="text-[#6B7280]">Total Deliveries:</span> {zone.totalDeliveries.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        <MapPin className="h-4 w-4 mr-1" />
                        View Map
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Zone
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route Management Tab */}
        <TabsContent value="routes" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Route Optimization</CardTitle>
              <CardDescription>Optimize delivery routes for efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-[#1A1D29] mb-2">Route Optimizer Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Optimization Engine</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-[#6B7280]">Last Optimization</span>
                    <span className="text-sm">2 hours ago</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1D29]">28</p>
                      <p className="text-sm text-[#6B7280]">Avg Delivery Time</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <Navigation className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1D29]">89%</p>
                      <p className="text-sm text-[#6B7280]">Route Efficiency</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#1A1D29]">45</p>
                      <p className="text-sm text-[#6B7280]">Active Routes</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex space-x-3">
                  <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                    <Navigation className="h-4 w-4 mr-2" />
                    Optimize Routes
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Route Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Partner Profile Modal */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delivery Partner Profile - {selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              Complete partner information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-6">
              {/* Partner Basic Info */}
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedPartner.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedPartner.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-[#1A1D29]">{selectedPartner.name}</h3>
                    {getStatusBadge(selectedPartner.status)}
                    {getAvailabilityBadge(selectedPartner.availability)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6B7280]">Email:</p>
                      <p className="font-medium">{selectedPartner.email}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Phone:</p>
                      <p className="font-medium">{selectedPartner.phone}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Zone:</p>
                      <p className="font-medium">{selectedPartner.zone}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Join Date:</p>
                      <p className="font-medium">{formatDate(selectedPartner.joinDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-3">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#6B7280]">Vehicle Type:</p>
                    <p className="font-medium">{selectedPartner.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Vehicle Number:</p>
                    <p className="font-medium">{selectedPartner.vehicleNumber}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedPartner.completedDeliveries}</p>
                    <p className="text-sm text-[#6B7280]">Completed Deliveries</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPartner.totalEarnings)}</p>
                    <p className="text-sm text-[#6B7280]">Total Earnings</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedPartner.avgDeliveryTime}</p>
                    <p className="text-sm text-[#6B7280]">Avg Time (mins)</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                      <Star className="h-6 w-6 mr-1" />
                      {selectedPartner.rating}
                    </p>
                    <p className="text-sm text-[#6B7280]">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPartner(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Edit Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}