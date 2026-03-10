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
  ImageIcon,
  Loader2,
  Store,
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
import { userAPI, serviceRequestAPI, adminShopAPI } from '@/services/api'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/utils'

// Service category options
const serviceCategories = [
  'Engine Service', 'Brake Service', 'AC Service', 'Battery Replacement',
  'Tyre Replacement', 'Oil Change', 'Clutch Repair', 'Suspension Repair',
  'Electrical Work', 'Body Work', 'Painting', 'General Service',
  'Roadside Assistance', 'Towing', 'Other'
]

// Empty new service request template
const emptyServiceRequest = {
  customerId: '',
  serviceType: 'home' as 'home' | 'roadside' | 'walkin',
  serviceCategory: '',
  priority: 'medium' as string,
  isEmergency: false,
  description: '',
  vehicleType: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: '',
  registrationNumber: '',
  address: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  latitude: 0,
  longitude: 0,
  preferredDate: new Date().toISOString().split('T')[0],
  preferredTimeSlot: '',
  estimatedCost: 0,
  paymentMethod: 'cod' as string,
  notes: '',
}

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
  pending:         { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock,       label: 'Pending' },
  assigned:        { color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: User,        label: 'Assigned' },
  accepted:        { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CheckCircle, label: 'Accepted' },
  mechanic_assigned: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Wrench,    label: 'Mechanic Assigned' },
  on_way:          { color: 'bg-cyan-100 text-cyan-800 border-cyan-200',       icon: Car,         label: 'On Way' },
  diagnosis:       { color: 'bg-amber-100 text-amber-800 border-amber-200',   icon: Search,      label: 'Diagnosis' },
  approved:        { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Approved' },
  in_progress:     { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench,      label: 'In Progress' },
  'in-progress':   { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench,      label: 'In Progress' },
  completed:       { color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle, label: 'Completed' },
  payment_pending: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock,       label: 'Payment Pending' },
  paid:            { color: 'bg-green-200 text-green-900 border-green-300',    icon: CheckCircle, label: 'Paid' },
  rejected_quote:  { color: 'bg-rose-100 text-rose-800 border-rose-200',       icon: XCircle,     label: 'Quote Rejected' },
  payment_refused: { color: 'bg-red-200 text-red-900 border-red-300',          icon: AlertCircle, label: 'Payment Refused' },
  cancelled:       { color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle,     label: 'Cancelled' },
};

// Full status progression order (matches pricing flow)
const STATUS_FLOW: ServiceRequest['status'][] = [
  'pending', 'assigned', 'accepted', 'on_way', 'diagnosis', 'approved', 'in_progress', 'completed', 'payment_pending', 'paid'
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
  const [assignMode, setAssignMode] = useState<'mechanic' | 'shop'>('mechanic')
  const [shopsList, setShopsList] = useState<any[]>([])
  const [selectedShopId, setSelectedShopId] = useState('')
  const [shopsLoading, setShopsLoading] = useState(false)

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

  // Add Service Request dialog state
  const [addRequestOpen, setAddRequestOpen] = useState(false)
  const [newRequest, setNewRequest] = useState(emptyServiceRequest)
  const [customerList, setCustomerList] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [savingRequest, setSavingRequest] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)

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

  // Fetch customers when add request dialog opens
  useEffect(() => {
    if (addRequestOpen && customerList.length === 0) {
      setCustomerLoading(true)
      userAPI.getAll({ role: 'user', limit: 200 }).then(res => {
        const data = res.data?.data?.users || res.data?.data || res.data?.users || res.data || []
        setCustomerList(Array.isArray(data) ? data : [])
      }).catch(err => console.error('Failed to fetch customers:', err))
        .finally(() => setCustomerLoading(false))
    }
  }, [addRequestOpen])

  // Debug: Log service requests when they change (separate useEffect)
  useEffect(() => {
    console.log('Service Requests in store:', serviceRequests)
  }, [serviceRequests])

  // Helper function to get request ID
  const getRequestId = (request: any) => request._id || request.id
  
  // Generate display-friendly request ID — use real requestId (SRV-2024-0001) if available
  const generateDisplayRequestId = (request: ServiceRequest) => {
    return request.requestId || `SRV-${request._id.slice(-6).toUpperCase()}`
  }
  
  // Copy to clipboard function
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

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
    const diagnosisRequests = list.filter(r => r.status === 'diagnosis').length
    const inProgressRequests = list.filter(r => r.status === 'in_progress' || r.status === 'in-progress' || r.status === 'approved').length
    const completedRequests = list.filter(r => r.status === 'completed' || r.status === 'payment_pending').length
    const paidRequests = list.filter(r => r.status === 'paid').length
    const ratedList = list.filter(r => r.feedback?.rating)
    const avgRating = ratedList.length
      ? ratedList.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / ratedList.length
      : 0

    return { totalRequests, pendingRequests, diagnosisRequests, inProgressRequests, completedRequests, paidRequests, avgRating }
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

  const handleOpenAssignDialog = async (request: ServiceRequest) => {
    setAssigningRequest(request)
    setAssignMechanicId(request.mechanic?._id || '')
    setAssignMode('mechanic')
    setSelectedShopId('')
    setAssignDialogOpen(true)
    // Fetch shops in background
    setShopsLoading(true)
    try {
      const res = await adminShopAPI.getAll({ limit: 100 })
      if (res.data?.success) {
        setShopsList((res.data.data || []).filter((s: any) => s.isActive))
      }
    } catch {}
    setShopsLoading(false)
  }

  const handleConfirmAssign = async () => {
    if (!assigningRequest) return

    if (assignMode === 'mechanic') {
      // Existing mechanic assignment
      if (!assignMechanicId) return
      dispatch(assignMechanicRequest({ requestId: assigningRequest._id, mechanicId: assignMechanicId }))
    } else {
      // Assign to shop partner
      if (!selectedShopId) return
      try {
        const res = await adminShopAPI.assignOrder(assigningRequest._id, selectedShopId)
        if (res.data?.success) {
          // Refresh service requests to show updated status
          dispatch(fetchServiceRequestsRequest())
        } else {
          alert(res.data?.message || 'Failed to assign to shop')
          return
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to assign to shop')
        return
      }
    }

    setAssignDialogOpen(false)
    setAssigningRequest(null)
    setAssignMechanicId('')
    setSelectedShopId('')
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

  // Filtered customers for dropdown search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customerList
    const q = customerSearch.toLowerCase()
    return customerList.filter((c: any) =>
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [customerList, customerSearch])

  // Handle saving new service request
  const handleSaveNewRequest = async () => {
    if (!newRequest.customerId || !newRequest.serviceCategory || !newRequest.description || !newRequest.address) return
    setSavingRequest(true)
    try {
      const res = await serviceRequestAPI.create(newRequest)
      const result = res.data

      if (result?.success) {
        // Refresh the service requests list from server
        dispatch(fetchServiceRequestsRequest())
        setAddRequestOpen(false)
        setNewRequest(emptyServiceRequest)
        setCustomerSearch('')
      } else {
        console.error('Failed to create service request:', result?.message)
      }
    } catch (err) {
      console.error('Error creating service request:', err)
    } finally {
      setSavingRequest(false)
    }
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Service Management</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Manage service requests, mechanic assignments, and job tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545] h-9 text-xs" onClick={() => setAddRequestOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Service Request
          </Button>
        </div>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Requests', value: stats.totalRequests, icon: Wrench, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending', value: stats.pendingRequests, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'Diagnosis', value: stats.diagnosisRequests, icon: Search, color: 'bg-orange-50 text-orange-600' },
          { label: 'In Progress', value: stats.inProgressRequests, icon: Wrench, color: 'bg-purple-50 text-purple-600' },
          { label: 'Completed', value: stats.completedRequests, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Paid', value: stats.paidRequests, icon: CreditCard, color: 'bg-green-50 text-green-600' },
          { label: 'Avg Rating', value: stats.avgRating?.toFixed(1) || '0', icon: Star, color: 'bg-amber-50 text-amber-600' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-lg ${card.color} flex items-center justify-center`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#1A1D29]">{card.value}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Service Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1 h-auto">
          {[
            { value: 'requests', label: 'Service Requests', icon: Wrench },
            { value: 'mechanics', label: 'Mechanics', icon: User },
            { value: 'assignment', label: 'Assignment', icon: UserPlus },
          ].map((tab) => {
            const TabIcon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-xs gap-1.5 px-4 py-1.5"
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Service Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by request ID, customer, vehicle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="on_way">On Way</SelectItem>
                      <SelectItem value="diagnosis">Diagnosis</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="payment_pending">Payment Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected_quote">Quote Rejected</SelectItem>
                      <SelectItem value="payment_refused">Payment Refused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[120px] h-9 text-xs">
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
                    <SelectTrigger className="w-[150px] h-9 text-xs">
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
                <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedRequests.length} request(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('assign')}>Assign</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('update-status')}>Update Status</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkAction('send-notification')}>Send Update</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Requests Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Mechanic</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Est. Cost</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Invoice</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.includes(request._id)}
                          onCheckedChange={() => handleSelectRequest(request._id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-[#1B3B6F]">
                        {generateDisplayRequestId(request)}
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
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-sm text-[#6B7280]">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{request.location?.city || request.location?.address || '—'}</span>
                          </div>
                          {/* Coordinates display */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Coords:</span>
                            {request.location.coordinates?.latitude && request.location.coordinates?.longitude ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono text-[#6B7280]">
                                  {request.location.coordinates.latitude.toFixed(4)}, {request.location.coordinates.longitude.toFixed(4)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost" 
                                  className="h-auto p-0.5 hover:bg-gray-100"
                                  onClick={() => copyToClipboard(
                                    `${request.location.coordinates?.latitude}, ${request.location.coordinates?.longitude}`,
                                    `table-coords-${request._id}`
                                  )}
                                >
                                  {copiedKey === `table-coords-${request._id}` ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-[#6B7280] hover:text-[#374151]" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-red-400 italic">No coordinates</span>
                            )}
                          </div>
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
                        ) : request.shopPartner ? (
                          <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Store className="h-3 w-3 text-indigo-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-indigo-700">{request.shopPartner.shopName}</span>
                              {request.shopPartner.city && (
                                <span className="text-xs text-gray-400 ml-1">({request.shopPartner.city})</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#6B7280]">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(request.estimatedCost || 0)}
                      </TableCell>
                      <TableCell className="text-xs text-[#6B7280]">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      {/* PDF Download Column */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 text-red-500 hover:text-red-700"
                          onClick={async () => {
                            try {
                              const res = await serviceRequestAPI.downloadInvoice(request._id)
                              if (res.data) {
                                const blob = new Blob([res.data], { type: 'application/pdf' })
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `service-${generateDisplayRequestId(request)}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              }
                            } catch (err) {
                              console.error('Failed to download invoice:', err)
                            }
                          }}
                          title="Download Invoice PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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

              </div>
              {filteredRequests.length === 0 && (
                <div className="flex flex-col items-center p-12">
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Wrench className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-[#1A1D29] mb-1">No service requests found</h3>
                  <p className="text-sm text-[#6B7280]">Try adjusting your search or filter criteria</p>
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
                {requestsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : serviceRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-[#1A1D29] mb-1">No Service Requests Found</h3>
                    <p className="text-[#6B7280] text-sm">No service requests have been loaded from the API yet.</p>
                  </div>
                ) : (serviceRequests ?? []).filter(r => r.status === 'pending' && !r.mechanic && !r.shopPartner).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-[#1A1D29] mb-1">All Requests Assigned</h3>
                    <p className="text-[#6B7280] text-sm">No pending requests waiting for mechanic assignment.</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {(serviceRequests ?? []).filter(r => r.status === 'pending' && !r.mechanic && !r.shopPartner).map((request) => (
                    <div key={request._id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-[#1A1D29]">{generateDisplayRequestId(request)}</h4>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {request.serviceType}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-[#6B7280] flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{request.customer.name}</span>
                              <span>•</span>
                              <span>{request.customer.phone}</span>
                            </p>
                            
                            <div className="text-sm text-[#6B7280]">
                              <div className="flex items-start gap-2 mb-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="flex-1">{request.location.address}, {request.location.city}</span>
                              </div>
                              
                              {/* Coordinates Section - Always show, with fallback */}
                              <div className="flex items-center gap-3 mt-2 p-2 bg-white rounded border">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-xs font-medium text-[#374151]">Coordinates:</span>
                                  {request.location.coordinates?.latitude && request.location.coordinates?.longitude ? (
                                    <span className="text-xs font-mono text-[#6B7280]">
                                      {request.location.coordinates.latitude}, {request.location.coordinates.longitude}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-red-500 italic">
                                      No coordinates available
                                    </span>
                                  )}
                                </div>
                                {request.location.coordinates?.latitude && request.location.coordinates?.longitude ? (
                                  <Button
                                    size="sm"
                                    variant="ghost" 
                                    className="h-auto p-1 hover:bg-gray-100"
                                    onClick={() => copyToClipboard(
                                      `${request.location.coordinates?.latitude}, ${request.location.coordinates?.longitude}`,
                                      `coords-${request._id}`
                                    )}
                                  >
                                    {copiedKey === `coords-${request._id}` ? (
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-[#6B7280] hover:text-[#374151]" />
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-auto p-1"
                                    onClick={() => {
                                      console.log('Service Request Data:', request);
                                      alert('Debug: Check console for service request data');
                                    }}
                                  >
                                    <Eye className="h-3 w-3 text-[#6B7280]" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2">
                          {getPriorityBadge(request.priority)}
                          <p className="text-xs text-[#6B7280]">
                            {formatDate(request.createdAt)}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={() => {
                              setAssigningRequest(request)
                              setAssignDialogOpen(true)
                            }}
                          >
                            Assign Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
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
                            {generateDisplayRequestId(request)} - {request.serviceType}
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

      {/* ==================== ASSIGN MECHANIC / SHOP DIALOG ==================== */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => {
        setAssignDialogOpen(open)
        if (!open) { setAssigningRequest(null); setAssignMechanicId(''); setSelectedShopId('') }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                {assignMode === 'mechanic' ? <User className="h-4 w-4 text-indigo-600" /> : <Store className="h-4 w-4 text-indigo-600" />}
              </div>
              {assignMode === 'mechanic'
                ? (assigningRequest?.mechanic ? 'Reassign Mechanic' : 'Assign Mechanic')
                : 'Assign to Shop Partner'}
            </DialogTitle>
            <DialogDescription>
              Request: {assigningRequest?._id?.slice(-8).toUpperCase()} — {assigningRequest?.serviceType}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Toggle: Mechanic vs Shop */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  assignMode === 'mechanic' ? 'bg-white shadow text-[#1B3B6F]' : 'text-gray-500 hover:text-gray-700'
                )}
                onClick={() => { setAssignMode('mechanic'); setSelectedShopId('') }}
              >
                <User className="h-4 w-4" /> Mechanic
              </button>
              <button
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  assignMode === 'shop' ? 'bg-white shadow text-[#FF6B35]' : 'text-gray-500 hover:text-gray-700'
                )}
                onClick={() => { setAssignMode('shop'); setAssignMechanicId('') }}
              >
                <Store className="h-4 w-4" /> Shop Partner
              </button>
            </div>

            {/* Mechanic Mode */}
            {assignMode === 'mechanic' && (
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
            )}

            {/* Shop Mode */}
            {assignMode === 'shop' && (
              <div>
                <Label className="text-sm font-medium">Select Shop Partner</Label>
                {shopsLoading ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading shops...
                  </div>
                ) : (
                  <>
                    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a shop partner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {shopsList.map((shop: any) => (
                          <SelectItem key={shop._id} value={shop._id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{shop.shopName}</span>
                              <span className="text-xs text-gray-500">· {shop.address?.city || 'N/A'}</span>
                              {shop.isVerified && (
                                <span className="text-xs text-green-600">✓</span>
                              )}
                              <span className="text-xs text-gray-400">{shop.commissionRate}%</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {shopsList.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">No active shop partners found.</p>
                    )}
                    {selectedShopId && (() => {
                      const s = shopsList.find((sh: any) => sh._id === selectedShopId)
                      if (!s) return null
                      return (
                        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm space-y-1">
                          <p className="font-medium text-gray-900">{s.shopName}</p>
                          <p className="text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address?.city || 'N/A'}</p>
                          <p className="text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3" /> {s.user?.phone || s.shopPhone}</p>
                          <p className="text-gray-500 text-xs">Commission: {s.commissionRate}% · Mechanics: {(s.mechanics?.length || 0) + (s.assignedMechanics?.length || 0)} · Jobs: {s.totalJobsCompleted}</p>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              className={assignMode === 'mechanic' ? 'bg-[#1B3B6F] hover:bg-[#0F2545]' : 'bg-[#FF6B35] hover:bg-[#e55a28]'}
              onClick={handleConfirmAssign}
              disabled={assignMode === 'mechanic' ? !assignMechanicId : !selectedShopId}
            >
              {assignMode === 'mechanic' ? 'Assign Mechanic' : 'Assign to Shop'}
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
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              {editingMechanic ? 'Edit Mechanic' : 'Add New Mechanic'}
            </DialogTitle>
            <DialogDescription>
              {editingMechanic ? 'Update mechanic details' : 'Fill all details to register a new mechanic'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1" style={{ scrollbarWidth: 'thin' }}>
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

          <DialogFooter className="border-t pt-4 flex-shrink-0 gap-2">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
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
                {selectedRequest ? generateDisplayRequestId(selectedRequest) : ''}
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
            <div className="flex-1 overflow-y-auto scrollbar-ultra-narrow">
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

                      {/* Customer service location coordinates */}
                      {selectedRequest.location?.coordinates?.latitude != null && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Navigation className="h-3 w-3" /> Service Location
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <code className="text-[11px] font-mono text-[#1A1D29] bg-white px-2 py-0.5 rounded border border-gray-200">
                              {selectedRequest.location.coordinates.latitude.toFixed(6)}, {selectedRequest.location.coordinates.longitude.toFixed(6)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(
                                `${selectedRequest.location.coordinates!.latitude.toFixed(6)}, ${selectedRequest.location.coordinates!.longitude.toFixed(6)}`,
                                'cust-loc-coords'
                              )}
                              className="text-[#6B7280] hover:text-[#1B3B6F] transition-colors p-0.5"
                              title="Copy coordinates"
                            >
                              {copiedKey === 'cust-loc-coords'
                                ? <Check className="h-3.5 w-3.5 text-green-600" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${selectedRequest.location.coordinates.latitude},${selectedRequest.location.coordinates.longitude}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                              title="Open in Google Maps"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
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

                {/* Diagnosis Details */}
                {selectedRequest.diagnosis?.diagnosedAt && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Search className="h-3 w-3" /> Diagnosis
                    </h4>
                    {selectedRequest.diagnosis.notes && (
                      <p className="text-sm text-[#1A1D29] mb-3">{selectedRequest.diagnosis.notes}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Labor Cost</span>
                        <span className="font-medium">₹{selectedRequest.diagnosis.costBreakdown?.laborCost || 0}</span>
                      </div>
                      {selectedRequest.diagnosis.costBreakdown?.parts?.map((part: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">{part.name} x{part.quantity || 1}</span>
                          <span className="font-medium">₹{part.cost * (part.quantity || 1)}</span>
                        </div>
                      ))}
                      {(selectedRequest.diagnosis.costBreakdown?.additionalCharges || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Additional Charges</span>
                          <span className="font-medium">₹{selectedRequest.diagnosis.costBreakdown?.additionalCharges}</span>
                        </div>
                      )}
                      {(selectedRequest.diagnosis.costBreakdown?.discount || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Discount</span>
                          <span className="font-medium text-green-600">-₹{selectedRequest.diagnosis.costBreakdown?.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-amber-200 pt-2">
                        <span>Total Estimate</span>
                        <span className="text-[#1B3B6F]">₹{selectedRequest.diagnosis.costBreakdown?.totalEstimate || 0}</span>
                      </div>
                    </div>
                    {selectedRequest.customerApproval && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B7280]">Customer Approval</span>
                          <span className={`font-medium px-2 py-0.5 rounded ${
                            selectedRequest.customerApproval.status === 'approved' ? 'bg-green-100 text-green-700' :
                            selectedRequest.customerApproval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            selectedRequest.customerApproval.status === 'negotiating' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedRequest.customerApproval.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                        {selectedRequest.customerApproval.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {selectedRequest.customerApproval.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Info + Admin Actions */}
                {/* Payment Refusal Details */}
                {selectedRequest.paymentRefusal?.refused && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" /> Payment Refused
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Reason</span>
                        <span className="font-medium text-red-700">{selectedRequest.paymentRefusal?.reason}</span>
                      </div>
                      {selectedRequest.paymentRefusal?.refusedAt && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Reported At</span>
                          <span className="font-medium">{new Date(selectedRequest.paymentRefusal?.refusedAt).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(selectedRequest.paymentRefusal?.photoProof?.length ?? 0) > 0 && (
                        <div className="text-xs text-[#6B7280]">
                          {selectedRequest.paymentRefusal?.photoProof?.length} photo proof(s) attached
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Advance Fee Details */}
                {selectedRequest.advanceFee?.required && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" /> Advance Fee
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Amount</span>
                        <span className="font-medium">₹{selectedRequest.advanceFee.amount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Status</span>
                        <span className={`font-medium px-2 py-0.5 rounded ${
                          selectedRequest.advanceFee.status === 'paid' ? 'bg-green-100 text-green-700' :
                          selectedRequest.advanceFee.status === 'forfeited' ? 'bg-red-100 text-red-700' :
                          selectedRequest.advanceFee.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedRequest.advanceFee.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {(['completed', 'payment_pending', 'paid', 'payment_refused'] as string[]).includes(selectedRequest.status) && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Payment
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Final Cost</span>
                        <span className="font-bold text-[#1B3B6F]">₹{selectedRequest.finalCost || selectedRequest.totalCost || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Method</span>
                        <span className="font-medium uppercase">{selectedRequest.paymentDetails?.method || 'COD'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Status</span>
                        <span className={`font-medium px-2 py-0.5 rounded ${
                          selectedRequest.status === 'paid' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedRequest.status === 'paid' ? 'PAID' : 'PENDING'}
                        </span>
                      </div>
                      {selectedRequest.cashCollected && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Cash Collected</span>
                          <span className="font-medium text-green-600">Yes</span>
                        </div>
                      )}
                    </div>
                    {selectedRequest.status !== 'paid' && (
                      <Button
                        size="sm"
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={async () => {
                          if (confirm('Mark this service request as paid?')) {
                            try {
                              const { diagnosisAPI } = await import('@/services/api')
                              await diagnosisAPI.markAsPaid(selectedRequest._id)
                              setSelectedRequest(null)
                              dispatch(fetchServiceRequestsRequest())
                            } catch (err) {
                              alert('Failed to mark as paid')
                            }
                          }
                        }}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                )}

                {/* Uploaded Images */}
                {(selectedRequest.images?.before?.length || selectedRequest.images?.after?.length) ? (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> Uploaded Images
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                      {/* Before images */}
                      {(selectedRequest.images?.before?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Before Service</p>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedRequest.images!.before.map((img, idx) => (
                              <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="group relative block rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100 hover:border-[#1B3B6F] transition-colors">
                                <img
                                  src={img.url}
                                  alt={img.description || `Before image ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                />
                                {img.description && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
                                    <p className="text-[10px] text-white truncate">{img.description}</p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* After images */}
                      {(selectedRequest.images?.after?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">After Service</p>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedRequest.images!.after.map((img, idx) => (
                              <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="group relative block rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100 hover:border-[#1B3B6F] transition-colors">
                                <img
                                  src={img.url}
                                  alt={img.description || `After image ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                />
                                {img.description && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
                                    <p className="text-[10px] text-white truncate">{img.description}</p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

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

                {/* Assigned Shop Partner */}
                {selectedRequest.shopPartner && !selectedRequest.mechanic && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Store className="h-3 w-3" /> Assigned Shop
                    </h4>
                    <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                          {selectedRequest.shopPartner.shopName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedRequest.shopPartner.shopName}</p>
                          {selectedRequest.shopPartner.city && (
                            <p className="text-xs text-gray-500">{selectedRequest.shopPartner.city}</p>
                          )}
                        </div>
                      </div>
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
                    {selectedRequest.mechanic || selectedRequest.shopPartner ? 'Reassign' : 'Assign'}
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

      {/* ── Add Service Request Dialog ── */}
      <Dialog open={addRequestOpen} onOpenChange={setAddRequestOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Fixed Header */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#1B3B6F] to-[#2A5298] flex-shrink-0 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold">Add Service Request</span>
                <DialogDescription className="text-blue-100 text-xs mt-0.5">
                  Create a new service request on behalf of a customer
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6" style={{ scrollbarWidth: 'thin' }}>
            {/* Section: Customer Selection */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-[#1B3B6F]" />
                </div>
                Select Customer <span className="text-red-400 text-xs">*</span>
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 text-sm bg-white border-gray-200 focus:border-[#1B3B6F] focus:ring-[#1B3B6F]/20"
                />
              </div>
              <Select value={newRequest.customerId} onValueChange={(val) => {
                const selected = customerList.find((c: any) => c._id === val)
                setNewRequest(prev => ({
                  ...prev,
                  customerId: val,
                  ...(selected?.address ? { address: selected.address } : {}),
                  ...(selected?.city ? { city: selected.city } : {}),
                  ...(selected?.state ? { state: selected.state } : {}),
                  ...(selected?.pincode ? { pincode: selected.pincode } : {}),
                }))
              }}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder={customerLoading ? "Loading customers..." : "Choose a registered customer..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {customerLoading ? (
                    <div className="px-3 py-4 text-center">
                      <Loader2 className="h-6 w-6 text-[#1B3B6F] mx-auto mb-2 animate-spin" />
                      <p className="text-xs text-gray-400 font-medium">Loading customers...</p>
                    </div>
                  ) : filteredCustomers.length > 0 ? filteredCustomers.map((c: any) => (
                    <SelectItem key={c._id} value={c._id} className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#1B3B6F]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-[#1B3B6F]">
                            {(c.fullName || c.username || '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-sm">{c.fullName || c.username || 'Unknown'}</span>
                        <span className="text-gray-400 text-xs">—</span>
                        <span className="text-xs text-gray-500">{c.phone || c.email || 'No contact'}</span>
                      </div>
                    </SelectItem>
                  )) : (
                    <div className="px-3 py-4 text-center">
                      <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">No customers found</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">Try a different search term</p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              {newRequest.customerId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Customer selected: {customerList.find((c: any) => c._id === newRequest.customerId)?.fullName || 'Selected'}
                  </p>
                </div>
              )}
            </div>

            {/* Section: Service Details */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Wrench className="h-3.5 w-3.5 text-purple-600" />
                </div>
                Service Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Service Type</Label>
                  <Select value={newRequest.serviceType} onValueChange={(val) => setNewRequest(prev => ({ ...prev, serviceType: val as 'home' | 'roadside' | 'walkin' }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home"><div className="flex items-center gap-2"><Home className="h-3.5 w-3.5 text-blue-500" /> Home Service</div></SelectItem>
                      <SelectItem value="roadside"><div className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-orange-500" /> Roadside Assistance</div></SelectItem>
                      <SelectItem value="walkin"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-green-500" /> Walk-in Service</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Service Category <span className="text-red-400">*</span></Label>
                  <Select value={newRequest.serviceCategory} onValueChange={(val) => setNewRequest(prev => ({ ...prev, serviceCategory: val }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Priority</Label>
                  <Select value={newRequest.priority} onValueChange={(val) => setNewRequest(prev => ({ ...prev, priority: val, isEmergency: val === 'urgent' }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low"><Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">Low</Badge></SelectItem>
                      <SelectItem value="medium"><Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Medium</Badge></SelectItem>
                      <SelectItem value="high"><Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs">High</Badge></SelectItem>
                      <SelectItem value="urgent"><Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">Urgent</Badge></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Payment Method</Label>
                  <Select value={newRequest.paymentMethod} onValueChange={(val) => setNewRequest(prev => ({ ...prev, paymentMethod: val }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod"><div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-green-500" /> Cash on Delivery</div></SelectItem>
                      <SelectItem value="online"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-blue-500" /> Online Payment</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Description <span className="text-red-400">*</span></Label>
                <Textarea
                  placeholder="Describe the issue or service needed..."
                  className="mt-1.5 bg-white"
                  rows={3}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Section: Vehicle Info */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Car className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Vehicle Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Vehicle Type</Label>
                  <Select value={newRequest.vehicleType} onValueChange={(val) => setNewRequest(prev => ({ ...prev, vehicleType: val }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                      <SelectItem value="Auto">Auto Rickshaw</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Brand</Label>
                  <Input className="mt-1.5 bg-white" placeholder="e.g. Maruti" value={newRequest.vehicleBrand} onChange={(e) => setNewRequest(prev => ({ ...prev, vehicleBrand: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Model</Label>
                  <Input className="mt-1.5 bg-white" placeholder="e.g. Swift" value={newRequest.vehicleModel} onChange={(e) => setNewRequest(prev => ({ ...prev, vehicleModel: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Year</Label>
                  <Input className="mt-1.5 bg-white" placeholder="e.g. 2022" value={newRequest.vehicleYear} onChange={(e) => setNewRequest(prev => ({ ...prev, vehicleYear: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-gray-600">Registration Number</Label>
                  <Input className="mt-1.5 bg-white" placeholder="e.g. UP16AB1234" value={newRequest.registrationNumber} onChange={(e) => setNewRequest(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))} />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Location <span className="text-red-400 text-xs">*</span>
              </h3>
              <div>
                <Label className="text-xs font-medium text-gray-600">Address <span className="text-red-400">*</span></Label>
                <Input className="mt-1.5 bg-white" placeholder="Full service address" value={newRequest.address} onChange={(e) => setNewRequest(prev => ({ ...prev, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">City</Label>
                  <Input className="mt-1.5 bg-white" placeholder="City" value={newRequest.city} onChange={(e) => setNewRequest(prev => ({ ...prev, city: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">State</Label>
                  <Input className="mt-1.5 bg-white" placeholder="State" value={newRequest.state} onChange={(e) => setNewRequest(prev => ({ ...prev, state: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Pincode</Label>
                  <Input className="mt-1.5 bg-white" placeholder="Pincode" value={newRequest.pincode} onChange={(e) => setNewRequest(prev => ({ ...prev, pincode: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Landmark</Label>
                  <Input className="mt-1.5 bg-white" placeholder="Nearby landmark" value={newRequest.landmark} onChange={(e) => setNewRequest(prev => ({ ...prev, landmark: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Section: Schedule & Cost */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Schedule & Cost
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Preferred Date</Label>
                  <Input className="mt-1.5 bg-white" type="date" value={newRequest.preferredDate} onChange={(e) => setNewRequest(prev => ({ ...prev, preferredDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Time Slot</Label>
                  <Select value={newRequest.preferredTimeSlot} onValueChange={(val) => setNewRequest(prev => ({ ...prev, preferredTimeSlot: val }))}>
                    <SelectTrigger className="mt-1.5 bg-white"><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00-10:00">08:00 - 10:00 AM</SelectItem>
                      <SelectItem value="10:00-12:00">10:00 - 12:00 PM</SelectItem>
                      <SelectItem value="12:00-14:00">12:00 - 02:00 PM</SelectItem>
                      <SelectItem value="14:00-16:00">02:00 - 04:00 PM</SelectItem>
                      <SelectItem value="16:00-18:00">04:00 - 06:00 PM</SelectItem>
                      <SelectItem value="18:00-20:00">06:00 - 08:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Estimated Cost (₹)</Label>
                  <Input className="mt-1.5 bg-white" type="number" min={0} placeholder="0" value={newRequest.estimatedCost || ''} onChange={(e) => setNewRequest(prev => ({ ...prev, estimatedCost: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Notes (optional)</Label>
                <Textarea
                  className="mt-1.5 bg-white"
                  rows={2}
                  placeholder="Any additional notes or special instructions..."
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Info Banner */}
            {newRequest.estimatedCost > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  A <strong>{newRequest.paymentMethod === 'cod' ? 'COD' : 'Online'}</strong> payment entry of <strong>₹{newRequest.estimatedCost.toLocaleString('en-IN')}</strong> will be auto-created in Payment Management when this request is saved.
                </p>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50/80 flex-shrink-0 gap-2 rounded-b-lg">
            <Button variant="outline" className="border-gray-200" onClick={() => { setAddRequestOpen(false); setNewRequest(emptyServiceRequest); setCustomerSearch('') }}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#0F2545] shadow-sm"
              disabled={savingRequest || !newRequest.customerId || !newRequest.serviceCategory || !newRequest.description || !newRequest.address}
              onClick={handleSaveNewRequest}
            >
              {savingRequest ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Create Service Request</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}