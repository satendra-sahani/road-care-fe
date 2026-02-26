'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
  fetchMechanicsRequest,
  addMechanicRequest,
  updateMechanicRequest,
  deleteMechanicRequest,
  Mechanic,
} from '@/store/slices/mechanicSlice'
import {
  fetchServiceRequestsRequest,
  createServiceRequestRequest,
  updateServiceRequestRequest,
  assignMechanicRequest,
  updateStatusRequest,
  deleteServiceRequestRequest,
  ServiceRequest,
} from '@/store/slices/serviceRequestSlice'
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
  DollarSign,
  CreditCard,
  Home,
  Save,
  X,
  UserPlus,
  Copy,
  Check,
  Navigation,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

// Mechanic type is imported from mechanicSlice


const emptyMechanic: Omit<Mechanic, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'completedServices'> = {
  name: '',
  phone: '',
  aadhaarNo: '',
  address: '',
  city: '',
  state: 'Uttar Pradesh',
  pincode: '',
  specializations: [],
  location: '',
  availability: 'available',
  experience: '',
  joiningDate: new Date().toISOString().split('T')[0],
  emergencyContact: '',
  notes: ''
}

const allSpecializations = [
  'Engine Repair', 'Brake System', 'Electrical', 'AC Service',
  'Battery', 'Tyre Service', 'Suspension', 'Clutch',
  'Oil Change', 'Body Work', 'Painting', 'General Service'
]

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending:     { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock,       label: 'Pending' },
  assigned:    { color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: User,        label: 'Assigned' },
  accepted:    { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CheckCircle, label: 'Accepted' },
  on_way:      { color: 'bg-cyan-100 text-cyan-800 border-cyan-200',       icon: Car,         label: 'On Way' },
  in_progress: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench,      label: 'In Progress' },
  'in-progress':{ color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench,     label: 'In Progress' },
  completed:   { color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle, label: 'Completed' },
  cancelled:   { color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle,     label: 'Cancelled' },
};

// Full status progression order (matches Android app flow)
const STATUS_FLOW: ServiceRequest['status'][] = [
  'pending', 'assigned', 'accepted', 'on_way', 'in_progress', 'completed'
];

// Empty mechanic template
// emptyMechanicState is the same as emptyMechanic — use emptyMechanic directly

const priorityConfig: Record<string, { color: string; label: string }> = {
  low:      { color: 'bg-gray-100 text-gray-800',   label: 'Low' },
  medium:   { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  normal:   { color: 'bg-yellow-100 text-yellow-800', label: 'Normal' },
  high:     { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent:   { color: 'bg-red-100 text-red-900',     label: 'Urgent' },
  critical: { color: 'bg-red-200 text-red-900',     label: 'Critical' },
}

export function ServiceManagement() {
  const dispatch = useDispatch()
  
  // Redux state
  const { 
    mechanics, 
    loading: mechanicsLoading, 
    error: mechanicsError 
  } = useSelector((state: RootState) => state.mechanic)
  
  const { 
    requests: serviceRequests, 
    loading: requestsLoading, 
    error: requestsError 
  } = useSelector((state: RootState) => state.serviceRequest)
  
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all')
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [activeTab, setActiveTab] = useState('requests')

  // Assign mechanic dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null)
  const [assignMechanicId, setAssignMechanicId] = useState('')

  // Cancel request dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelingRequest, setCancelingRequest] = useState<ServiceRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Mechanic UI state
  const [addMechanicOpen, setAddMechanicOpen] = useState(false)
  const [viewMechanicOpen, setViewMechanicOpen] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [mechanicSearch, setMechanicSearch] = useState('')
  const [newMechanic, setNewMechanic] = useState(emptyMechanic)
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [editingMechanic, setEditingMechanic] = useState(false)

  // Copy-to-clipboard helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchMechanicsRequest())
    dispatch(fetchServiceRequestsRequest())
  }, [dispatch])

  // Helper function to get request ID
  const getRequestId = (request: any) => request._id || request.id

  const filteredMechanics = useMemo(() => {
    const list = mechanics ?? []
    if (!mechanicSearch.trim()) return list
    const q = mechanicSearch.toLowerCase()
    return list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.location || '').toLowerCase().includes(q) ||
      m.aadhaarNo.includes(q)
    )
  }, [mechanics, mechanicSearch])

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }

  const handleSaveMechanic = () => {
    if (!newMechanic.name.trim() || !newMechanic.phone.trim() || !newMechanic.aadhaarNo.trim()) return

    const mechanicData = {
      ...newMechanic,
      specializations: selectedSpecs,
      location: newMechanic.city || newMechanic.address,
    }

    if (editingMechanic && selectedMechanic) {
      // Update existing
      dispatch(updateMechanicRequest({ 
        id: selectedMechanic._id, 
        data: mechanicData 
      }))
    } else {
      // Add new
      dispatch(addMechanicRequest(mechanicData))
    }
    
    setAddMechanicOpen(false)
    setEditingMechanic(false)
    setNewMechanic(emptyMechanic)
    setSelectedSpecs([])
  }

  const handleEditMechanic = (mechanic: Mechanic) => {
    setNewMechanic({
      name: mechanic.name,
      phone: mechanic.phone,
      aadhaarNo: mechanic.aadhaarNo,
      address: mechanic.address,
      city: mechanic.city,
      state: mechanic.state,
      pincode: mechanic.pincode,
      specializations: mechanic.specializations,
      location: mechanic.location,
      availability: mechanic.availability,
      experience: mechanic.experience,
      joiningDate: mechanic.joiningDate,
      emergencyContact: mechanic.emergencyContact || '',
      notes: mechanic.notes || '',
    })
    setSelectedSpecs(mechanic.specializations)
    setSelectedMechanic(mechanic)
    setEditingMechanic(true)
    setAddMechanicOpen(true)
  }

  const handleDeleteMechanic = (id: string) => {
    dispatch(deleteMechanicRequest(id))
  }

  const filteredRequests = useMemo(() => {
    return (serviceRequests ?? []).filter(request => {
      const matchesSearch = 
        request._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
      const matchesServiceType = serviceTypeFilter === 'all' || 
        request.serviceType.toLowerCase().replace(/\s+/g, '-') === serviceTypeFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesServiceType
    })
  }, [serviceRequests, searchQuery, statusFilter, priorityFilter, serviceTypeFilter])

  const getServiceStats = () => {
    const list = serviceRequests ?? []
    const totalRequests = list.length
    const pendingRequests = list.filter(r => r.status === 'pending').length
    const inProgressRequests = list.filter(r => r.status === 'in_progress' || r.status === 'in-progress').length
    const completedRequests = list.filter(r => r.status === 'completed').length
    const ratedList = list.filter(r => r.feedback?.rating)
    const avgRating = ratedList.length
      ? ratedList.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / ratedList.length
      : 0
    
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
      setSelectedRequests(filteredRequests.map(request => getRequestId(request)))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for service requests:`, selectedRequests)
    setSelectedRequests([])
  }

  const handleAssignMechanic = (requestId: string, mechanicId: string) => {
    dispatch(assignMechanicRequest({ requestId, mechanicId }))
  }

  const handleUpdateStatus = (requestId: string, status: ServiceRequest['status']) => {
    dispatch(updateStatusRequest({ id: requestId, status }))
  }

  const handleOpenAssignDialog = (request: ServiceRequest) => {
    setAssigningRequest(request)
    setAssignMechanicId(request.mechanic?._id || '')
    setAssignDialogOpen(true)
  }

  const handleConfirmAssign = () => {
    if (assigningRequest && assignMechanicId) {
      dispatch(assignMechanicRequest({ requestId: assigningRequest._id, mechanicId: assignMechanicId }))
      setAssignDialogOpen(false)
      setAssigningRequest(null)
      setAssignMechanicId('')
    }
  }

  const handleOpenCancelDialog = (request: ServiceRequest) => {
    setCancelingRequest(request)
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = () => {
    if (cancelingRequest) {
      dispatch(updateStatusRequest({ id: cancelingRequest._id, status: 'cancelled' }))
      setCancelDialogOpen(false)
      setCancelingRequest(null)
      setCancelReason('')
      if (selectedRequest?._id === cancelingRequest._id) setSelectedRequest(null)
    }
  }

  const getNextStatus = (status: ServiceRequest['status']): ServiceRequest['status'] | null => {
    // Normalize in-progress → in_progress for flow lookup
    const normalized = status === 'in-progress' ? 'in_progress' : status
    const idx = STATUS_FLOW.indexOf(normalized as ServiceRequest['status'])
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[idx + 1]
  }

  const getNextStatusLabel = (status: ServiceRequest['status']): string => {
    const next = getNextStatus(status)
    if (!next) return ''
    const labels: Record<string, string> = {
      assigned:    'Mark Assigned',
      accepted:    'Mark Accepted',
      on_way:      'Mark On Way',
      in_progress: 'Mark In Progress',
      completed:   'Mark Completed',
    }
    return labels[next] ?? `Mark ${next}`
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
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="on_way">On Way</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
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
                    <TableHead>Service Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.includes(request._id)}
                          onCheckedChange={() => handleSelectRequest(request._id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#6B7280]">
                        {request._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {request.customer.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{request.customer.name}</div>
                            <div className="text-sm text-[#6B7280]">{request.customer.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-[#1A1D29]">{request.serviceType}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-[#6B7280]">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span>{request.location?.city || request.location?.address || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.mechanic ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {request.mechanic.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{request.mechanic.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[#6B7280]">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(request.estimatedCost || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDate(request.createdAt)}
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
                            {getNextStatus(request.status) && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(request._id, getNextStatus(request.status)!)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {getNextStatusLabel(request.status)}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenAssignDialog(request)}>
                              <User className="h-4 w-4 mr-2" />
                              {request.mechanic ? 'Reassign Mechanic' : 'Assign Mechanic'}
                            </DropdownMenuItem>
                            {request.customer.phone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${request.customer.phone}`}>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call Customer
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {request.status !== 'cancelled' && request.status !== 'completed' && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleOpenCancelDialog(request)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Request
                              </DropdownMenuItem>
                            )}
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
          {/* Mechanic Header with search + add */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 max-w-sm relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, aadhaar, location..."
                    className="pl-10"
                    value={mechanicSearch}
                    onChange={(e) => setMechanicSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm py-1.5 px-3">
                    {filteredMechanics.length} mechanic{filteredMechanics.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    onClick={() => { setEditingMechanic(false); setNewMechanic(emptyMechanic); setSelectedSpecs([]); setAddMechanicOpen(true); }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Mechanic
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mechanics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMechanics.map((mechanic) => (
              <Card key={mechanic._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Top: Avatar + Name + Status */}
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-gray-100">
                      <AvatarFallback className="bg-[#1B3B6F] text-white font-bold">
                        {mechanic.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1D29] truncate">{mechanic.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                        {(mechanic.rating ?? 0) > 0 && (
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-0.5 text-yellow-500" />
                            {mechanic.rating}
                          </span>
                        )}
                        <span>•</span>
                        <span>{mechanic.experience}</span>
                      </div>
                    </div>
                    <Badge className={
                      mechanic.availability === 'available'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : mechanic.availability === 'busy'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {mechanic.availability}
                    </Badge>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#6B7280] flex-shrink-0" />
                      <span className="text-[#1A1D29] font-medium">{mechanic.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#6B7280] flex-shrink-0" />
                      <span className="text-[#6B7280] truncate">{mechanic.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-[#6B7280] flex-shrink-0" />
                      <span className="text-[#6B7280] font-mono text-xs">{mechanic.aadhaarNo}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-[#6B7280]">
                    <span><strong className="text-[#1A1D29]">{mechanic.completedServices ?? 0}</strong> jobs</span>
                    <span>Joined: <strong className="text-[#1A1D29]">{new Date(mechanic.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</strong></span>
                  </div>

                  {/* Specializations */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {mechanic.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] py-0 px-1.5">{spec}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMechanic(mechanic)
                        setViewMechanicOpen(true)
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditMechanic(mechanic)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      onClick={() => handleDeleteMechanic(mechanic._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMechanics.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-[#1A1D29] mb-1">No mechanics found</h3>
                <p className="text-[#6B7280] text-sm">Try a different search or add a new mechanic</p>
              </CardContent>
            </Card>
          )}
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
                  {(serviceRequests ?? []).filter(r => r.status === 'pending' && !r.mechanic).map((request) => (
                    <div key={request._id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#1A1D29]">{request._id}</h4>
                          <p className="text-sm text-[#6B7280]">
                            {request.serviceType} - {request.customer.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{request.location.address}</p>
                        </div>
                        <div className="text-right">
                          {getPriorityBadge(request.priority)}
                          <p className="text-xs text-[#6B7280] mt-1">
                            {formatDate(request.createdAt)}
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
                        {(serviceRequests ?? []).filter(r => !r.mechanic).map((request) => (
                          <SelectItem key={request._id} value={request._id}>
                            {request._id.slice(-8)} - {request.serviceType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Mechanic" />
                      </SelectTrigger>
                      <SelectContent>
                        {(mechanics ?? []).filter(m => m.availability === 'available').map((mechanic) => (
                          <SelectItem key={mechanic._id} value={mechanic._id}>
                            {mechanic.name} ({mechanic.rating || 'N/A'}★)
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

      {/* ==================== ASSIGN MECHANIC DIALOG ==================== */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => {
        setAssignDialogOpen(open)
        if (!open) { setAssigningRequest(null); setAssignMechanicId('') }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1B3B6F]">
              <User className="h-5 w-5" />
              {assigningRequest?.mechanic ? 'Reassign Mechanic' : 'Assign Mechanic'}
            </DialogTitle>
            <DialogDescription>
              Request: {assigningRequest?._id?.slice(-8).toUpperCase()} — {assigningRequest?.serviceType}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Select Mechanic</Label>
              <Select value={assignMechanicId} onValueChange={setAssignMechanicId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose an available mechanic..." />
                </SelectTrigger>
                <SelectContent>
                  {(mechanics ?? []).filter(m => m.availability === 'available').map(m => (
                    <SelectItem key={m._id} value={m._id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-gray-500">· {m.city}</span>
                        {(m.rating ?? 0) > 0 && (
                          <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                            <Star className="h-3 w-3" />{m.rating}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(mechanics ?? []).filter(m => m.availability === 'available').length === 0 && (
                <p className="text-sm text-amber-600 mt-2">No mechanics currently available.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
              onClick={handleConfirmAssign}
              disabled={!assignMechanicId}
            >
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== CANCEL REQUEST DIALOG ==================== */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open)
        if (!open) { setCancelingRequest(null); setCancelReason('') }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Service Request
            </DialogTitle>
            <DialogDescription>
              Request: {cancelingRequest?._id?.slice(-8).toUpperCase()} — {cancelingRequest?.serviceType}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-[#6B7280]">
              This will cancel the request and notify the customer. This action cannot be undone.
            </p>
            <div>
              <Label className="text-sm font-medium">Reason for cancellation</Label>
              <Textarea
                className="mt-2"
                placeholder="e.g. No mechanic available in the area..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Request</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== ADD / EDIT MECHANIC DIALOG ==================== */}
      <Dialog open={addMechanicOpen} onOpenChange={(open) => {
        setAddMechanicOpen(open)
        if (!open) { setEditingMechanic(false); setNewMechanic(emptyMechanic); setSelectedSpecs([]) }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1B3B6F]">
              <UserPlus className="h-5 w-5" />
              {editingMechanic ? 'Edit Mechanic' : 'Add New Mechanic'}
            </DialogTitle>
            <DialogDescription>
              {editingMechanic ? 'Update mechanic details' : 'Fill all details to register a new mechanic'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Personal Info */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1D29] mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-[#1B3B6F]" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Rajesh Kumar"
                    className="mt-1"
                    value={newMechanic.name}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="+91 98765 43210"
                    className="mt-1"
                    value={newMechanic.phone}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Aadhaar Card Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="1234 5678 9012"
                    className="mt-1"
                    maxLength={14}
                    value={newMechanic.aadhaarNo}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, aadhaarNo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Emergency Contact</Label>
                  <Input
                    placeholder="+91 87654 32109"
                    className="mt-1"
                    value={newMechanic.emergencyContact || ''}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1D29] mb-3 flex items-center gap-2">
                <Home className="h-4 w-4 text-[#1B3B6F]" />
                Address
              </h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Full Address <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="House/Shop no, Street, Area"
                    className="mt-1"
                    value={newMechanic.address}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">City <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. Hata, Kushinagar"
                      className="mt-1"
                      value={newMechanic.city}
                      onChange={(e) => setNewMechanic(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">State</Label>
                    <Input
                      className="mt-1"
                      value={newMechanic.state}
                      onChange={(e) => setNewMechanic(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Pincode</Label>
                    <Input
                      placeholder="274203"
                      className="mt-1"
                      maxLength={6}
                      value={newMechanic.pincode}
                      onChange={(e) => setNewMechanic(prev => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div>
              <h4 className="text-sm font-semibold text-[#1A1D29] mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#1B3B6F]" />
                Work Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Experience</Label>
                  <Input
                    placeholder="e.g. 5 years"
                    className="mt-1"
                    value={newMechanic.experience}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Joining Date</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={newMechanic.joiningDate}
                    onChange={(e) => setNewMechanic(prev => ({ ...prev, joiningDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div className="mt-4">
                <Label className="text-sm mb-2 block">Specializations (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {allSpecializations.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedSpecs.includes(spec)
                          ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]'
                          : 'bg-white text-[#6B7280] border-gray-300 hover:border-[#1B3B6F] hover:text-[#1B3B6F]'
                      }`}
                    >
                      {selectedSpecs.includes(spec) && <span className="mr-1">✓</span>}
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea
                placeholder="Any additional info about this mechanic..."
                className="mt-1"
                rows={2}
                value={newMechanic.notes || ''}
                onChange={(e) => setNewMechanic(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => {
              setAddMechanicOpen(false)
              setEditingMechanic(false)
              setNewMechanic(emptyMechanic)
              setSelectedSpecs([])
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545] min-w-[140px]"
              onClick={handleSaveMechanic}
              disabled={!newMechanic.name.trim() || !newMechanic.phone.trim() || !newMechanic.aadhaarNo.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingMechanic ? 'Update Mechanic' : 'Save Mechanic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW MECHANIC PROFILE DIALOG ==================== */}
      <Dialog open={viewMechanicOpen} onOpenChange={setViewMechanicOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedMechanic && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-[#1B3B6F]/20">
                    <AvatarFallback className="bg-[#1B3B6F] text-white font-bold text-lg">
                      {selectedMechanic.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-[#1B3B6F]">{selectedMechanic.name}</span>
                    <p className="text-sm font-normal text-[#6B7280]">{selectedMechanic._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-3">
                {/* Status + Rating */}
                <div className="flex items-center gap-3">
                  <Badge className={
                    selectedMechanic.availability === 'available'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : selectedMechanic.availability === 'busy'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }>
                    {selectedMechanic.availability}
                  </Badge>
                  {(selectedMechanic.rating ?? 0) > 0 && (
                    <span className="flex items-center text-sm text-[#6B7280]">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {selectedMechanic.rating} rating
                    </span>
                  )}
                  <span className="text-sm text-[#6B7280]">•</span>
                  <span className="text-sm text-[#6B7280]">{selectedMechanic.experience} exp</span>
                </div>

                {/* Personal Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Personal Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#6B7280] text-xs">Phone</p>
                      <p className="font-medium text-[#1A1D29]">{selectedMechanic.phone}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280] text-xs">Aadhaar Number</p>
                      <p className="font-mono font-medium text-[#1A1D29]">{selectedMechanic.aadhaarNo}</p>
                    </div>
                    {selectedMechanic.emergencyContact && (
                      <div>
                        <p className="text-[#6B7280] text-xs">Emergency Contact</p>
                        <p className="font-medium text-[#1A1D29]">{selectedMechanic.emergencyContact}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#6B7280] text-xs">Joining Date</p>
                      <p className="font-medium text-[#1A1D29]">
                        {new Date(selectedMechanic.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Address</h4>
                  <p className="text-sm text-[#1A1D29] font-medium">{selectedMechanic.address}</p>
                  <p className="text-sm text-[#6B7280]">
                    {selectedMechanic.city}, {selectedMechanic.state} - {selectedMechanic.pincode}
                  </p>
                </div>

                {/* GPS Coordinates */}
                {selectedMechanic.currentLocation && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Navigation className="h-3 w-3" /> Live GPS Location
                      {selectedMechanic.currentLocation.lastUpdated && (
                        <span className="ml-auto font-normal normal-case text-[#6B7280] text-[11px]">
                          Updated {new Date(selectedMechanic.currentLocation.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Latitude */}
                      <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                        <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-1">Latitude</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-mono text-[#1A1D29] font-semibold">
                            {selectedMechanic.currentLocation.latitude.toFixed(6)}°
                          </code>
                          <button
                            onClick={() => handleCopy(String(selectedMechanic.currentLocation!.latitude.toFixed(6)), 'mech-lat')}
                            className="text-[#6B7280] hover:text-[#1B3B6F] transition-colors p-0.5"
                            title="Copy latitude"
                          >
                            {copiedKey === 'mech-lat'
                              ? <Check className="h-3.5 w-3.5 text-green-600" />
                              : <Copy className="h-3.5 w-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                      {/* Longitude */}
                      <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                        <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider mb-1">Longitude</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-mono text-[#1A1D29] font-semibold">
                            {selectedMechanic.currentLocation.longitude.toFixed(6)}°
                          </code>
                          <button
                            onClick={() => handleCopy(String(selectedMechanic.currentLocation!.longitude.toFixed(6)), 'mech-lng')}
                            className="text-[#6B7280] hover:text-[#1B3B6F] transition-colors p-0.5"
                            title="Copy longitude"
                          >
                            {copiedKey === 'mech-lng'
                              ? <Check className="h-3.5 w-3.5 text-green-600" />
                              : <Copy className="h-3.5 w-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Combined copy + Maps link */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex-1"
                        onClick={() => handleCopy(
                          `${selectedMechanic.currentLocation!.latitude.toFixed(6)}, ${selectedMechanic.currentLocation!.longitude.toFixed(6)}`,
                          'mech-coords-both'
                        )}
                      >
                        {copiedKey === 'mech-coords-both'
                          ? <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /><span className="text-green-600">Copied!</span></>
                          : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy Coordinates</>
                        }
                      </Button>
                      <a
                        href={`https://www.google.com/maps?q=${selectedMechanic.currentLocation.latitude},${selectedMechanic.currentLocation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="h-7 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                          <MapPin className="h-3.5 w-3.5 mr-1.5" />
                          Open in Maps
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {/* Work Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-xl font-bold text-[#1B3B6F]">{selectedMechanic.completedServices ?? 0}</p>
                    <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">Jobs Done</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-xl font-bold text-green-700">
                      {(selectedMechanic.rating ?? 0) > 0 ? selectedMechanic.rating : '-'}
                    </p>
                    <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">Rating</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-xl font-bold text-orange-700">{selectedMechanic.experience || '—'}</p>
                    <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">Experience</p>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMechanic.specializations.map((spec, i) => (
                      <Badge key={i} className="bg-[#1B3B6F]/10 text-[#1B3B6F] border-[#1B3B6F]/20 text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {selectedMechanic.specializations.length === 0 && (
                      <span className="text-sm text-[#6B7280]">No specializations added</span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedMechanic.notes && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                    <p className="text-sm text-amber-900">{selectedMechanic.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={() => setViewMechanicOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMechanicOpen(false)
                    handleEditMechanic(selectedMechanic)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Request Details Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#1B3B6F] to-[#2D5FA8] px-6 pt-5 pb-5 flex-shrink-0 pr-14">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-white/60 text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded">
                #{selectedRequest?._id?.slice(-8).toUpperCase()}
              </span>
              {selectedRequest && getStatusBadge(selectedRequest.status)}
              {selectedRequest && getPriorityBadge(selectedRequest.priority)}
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {selectedRequest?.serviceType || 'Service Request'}
            </h2>
            <p className="text-white/65 text-sm mt-1">
              {selectedRequest?.customer.name}
              {selectedRequest?.location?.city ? ` · ${selectedRequest.location.city}` : ''}
              {selectedRequest?.scheduledDate
                ? ` · Scheduled ${new Date(selectedRequest.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : ''}
            </p>
          </div>

          {/* Scrollable Content */}
          {selectedRequest && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">

                {/* Customer + Cost row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Customer */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Customer
                    </h4>
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-[#1B3B6F] text-white text-xs font-bold">
                          {selectedRequest.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-[#1A1D29]">{selectedRequest.customer.name}</p>
                        <p className="text-xs text-[#6B7280] truncate max-w-[140px]">{selectedRequest.customer.email || '—'}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{selectedRequest.customer.phone || '—'}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-[#6B7280]">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>
                          {[selectedRequest.location?.address, selectedRequest.location?.city, selectedRequest.location?.state]
                            .filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cost & Schedule */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Cost &amp; Schedule
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280]">Estimated</span>
                        <span className="text-sm font-bold text-[#1B3B6F]">{formatCurrency(selectedRequest.estimatedCost || 0)}</span>
                      </div>
                      {(selectedRequest.actualCost ?? 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6B7280]">Actual</span>
                          <span className="text-sm font-bold text-green-700">{formatCurrency(selectedRequest.actualCost!)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B7280]">Created</span>
                          <span className="text-[#1A1D29]">{new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {selectedRequest.scheduledDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6B7280]">Scheduled</span>
                            <span className="text-[#1A1D29]">{new Date(selectedRequest.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> Description
                    </h4>
                    <p className="text-sm text-[#1A1D29] leading-relaxed">{selectedRequest.description}</p>
                    {selectedRequest.notes && (
                      <p className="text-xs text-[#6B7280] mt-2 italic border-t border-blue-200 pt-2">{selectedRequest.notes}</p>
                    )}
                  </div>
                )}

                {/* Assigned Mechanic */}
                {selectedRequest.mechanic && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" /> Assigned Mechanic
                    </h4>
                    <div className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                      {/* Name + Call */}
                      <div className="flex items-center gap-3 p-4">
                        <Avatar className="h-11 w-11 border-2 border-blue-200">
                          <AvatarFallback className="bg-[#1B3B6F] text-white font-bold text-sm">
                            {selectedRequest.mechanic.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1A1D29]">{selectedRequest.mechanic.name}</p>
                          <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {selectedRequest.mechanic.phone || '—'}
                          </p>
                        </div>
                        {selectedRequest.mechanic.phone && (
                          <a href={`tel:${selectedRequest.mechanic.phone}`}>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                              <Phone className="h-3.5 w-3.5 mr-1.5" />
                              Call
                            </Button>
                          </a>
                        )}
                      </div>
                      {/* GPS Coordinates */}
                      {selectedRequest.mechanic.currentLocation && (
                        <div className="border-t border-blue-100 px-4 py-3 bg-blue-100/40">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Navigation className="h-3 w-3" /> Live Location
                            {selectedRequest.mechanic.currentLocation.lastUpdated && (
                              <span className="ml-auto font-normal normal-case text-[#6B7280]">
                                Updated {new Date(selectedRequest.mechanic.currentLocation.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-sm font-mono text-[#1A1D29] bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                              {selectedRequest.mechanic.currentLocation.latitude.toFixed(6)}, {selectedRequest.mechanic.currentLocation.longitude.toFixed(6)}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                              onClick={() => handleCopy(
                                `${selectedRequest.mechanic!.currentLocation!.latitude.toFixed(6)}, ${selectedRequest.mechanic!.currentLocation!.longitude.toFixed(6)}`,
                                'req-mech-coords'
                              )}
                            >
                              {copiedKey === 'req-mech-coords'
                                ? <><Check className="h-3 w-3 mr-1 text-green-600" /><span className="text-green-600 text-xs">Copied!</span></>
                                : <><Copy className="h-3 w-3 mr-1" /><span className="text-xs">Copy</span></>
                              }
                            </Button>
                            <a
                              href={`https://www.google.com/maps?q=${selectedRequest.mechanic.currentLocation.latitude},${selectedRequest.mechanic.currentLocation.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-100">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="text-xs">Maps</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status History Timeline */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Status History
                  </h4>
                  {selectedRequest.timeline && selectedRequest.timeline.length > 0 ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {selectedRequest.timeline.map((entry, idx) => {
                        const cfg = statusConfig[entry.status] ?? { color: 'bg-gray-100 text-gray-800', icon: Clock, label: entry.status }
                        const Icon = cfg.icon
                        const isLast = idx === selectedRequest.timeline!.length - 1
                        return (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              {!isLast && <div className="w-0.5 flex-1 bg-gray-300 my-1" />}
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-[#1A1D29]">{cfg.label}</p>
                                {isLast && (
                                  <Badge className={`text-[10px] py-0 px-1.5 h-4 ${cfg.color}`}>Current</Badge>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280]">
                                {entry.timestamp ? formatDate(entry.timestamp) : '—'}
                              </p>
                              {entry.note && (
                                <p className="text-xs text-[#6B7280] mt-1 italic">{entry.note}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      {(() => {
                        const cfg = statusConfig[selectedRequest.status] ?? { color: 'bg-gray-100 text-gray-800', icon: Clock, label: selectedRequest.status }
                        const Icon = cfg.icon
                        return (
                          <>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-[#1A1D29]">{cfg.label}</p>
                                <Badge className={`text-[10px] py-0 px-1.5 h-4 ${cfg.color}`}>Current</Badge>
                              </div>
                              <p className="text-xs text-[#6B7280]">{formatDate(selectedRequest.createdAt)}</p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Customer Feedback — always visible */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Star className="h-3 w-3" /> Customer Feedback
                  </h4>
                  {selectedRequest.feedback?.rating ? (
                    <div className="bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
                      {/* Overall rating */}
                      <div className="p-4 border-b border-amber-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i < (selectedRequest.feedback?.rating || 0) ? 'text-amber-500' : 'text-gray-300'}`}
                                fill={i < (selectedRequest.feedback?.rating || 0) ? 'currentColor' : 'none'}
                              />
                            ))}
                            <span className="ml-2 text-base font-bold text-[#1A1D29]">
                              {selectedRequest.feedback.rating} / 5
                            </span>
                          </div>
                          {selectedRequest.feedback.wouldRecommend !== undefined && (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${selectedRequest.feedback.wouldRecommend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {selectedRequest.feedback.wouldRecommend ? '👍 Would recommend' : '👎 Would not recommend'}
                            </span>
                          )}
                        </div>
                        {/* Review text */}
                        {selectedRequest.feedback.comment ? (
                          <p className="text-sm text-[#1A1D29] italic mt-3 leading-relaxed">
                            "{selectedRequest.feedback.comment}"
                          </p>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] italic mt-2">No written review provided.</p>
                        )}
                      </div>

                      {/* Detailed ratings breakdown */}
                      {selectedRequest.feedback.ratings && (
                        <div className="p-4 border-b border-amber-100">
                          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">Detailed Ratings</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries({
                              workQuality:     'Work Quality',
                              punctuality:     'Punctuality',
                              communication:   'Communication',
                              professionalism: 'Professionalism',
                              valueForMoney:   'Value for Money',
                            }).map(([key, label]) => {
                              const val = (selectedRequest.feedback!.ratings as any)?.[key]
                              if (!val) return null
                              return (
                                <div key={key} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-[#6B7280] truncate">{label}</span>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < val ? 'text-amber-500' : 'text-gray-300'}`} fill={i < val ? 'currentColor' : 'none'} />
                                    ))}
                                    <span className="text-[10px] text-[#6B7280] ml-1">{val}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Liked / Needs improvement */}
                      {((selectedRequest.feedback.liked?.length ?? 0) > 0 || (selectedRequest.feedback.needsImprovement?.length ?? 0) > 0) && (
                        <div className="p-4 border-b border-amber-100 space-y-3">
                          {(selectedRequest.feedback.liked?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">Liked</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedRequest.feedback.liked!.map((item, i) => (
                                  <span key={i} className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(selectedRequest.feedback.needsImprovement?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">Needs Improvement</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedRequest.feedback.needsImprovement!.map((item, i) => (
                                  <span key={i} className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review date */}
                      {selectedRequest.feedback.createdAt && (
                        <div className="px-4 py-2.5">
                          <p className="text-[11px] text-[#9CA3AF]">
                            Reviewed on {new Date(selectedRequest.feedback.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-gray-300" fill="none" />
                        ))}
                      </div>
                      <p className="text-sm font-medium text-[#6B7280]">No feedback yet</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Customer hasn't rated this service request</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Sticky Footer */}
          <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
              {selectedRequest && selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'completed' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => { handleOpenCancelDialog(selectedRequest); setSelectedRequest(null) }}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#1B3B6F] text-[#1B3B6F] hover:bg-[#1B3B6F]/10"
                    onClick={() => { handleOpenAssignDialog(selectedRequest); setSelectedRequest(null) }}
                  >
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    {selectedRequest.mechanic ? 'Reassign' : 'Assign Mechanic'}
                  </Button>
                  {getNextStatus(selectedRequest.status) && (
                    <Button
                      size="sm"
                      className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                      onClick={() => {
                        handleUpdateStatus(selectedRequest._id, getNextStatus(selectedRequest.status)!)
                        setSelectedRequest(null)
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      {getNextStatusLabel(selectedRequest.status)}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}