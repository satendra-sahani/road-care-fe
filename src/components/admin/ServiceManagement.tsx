'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import MechanicRegistrationForm from '@/components/admin/MechanicRegistrationForm'
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Stethoscope,
  Send,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Users,
  FileText,
  PieChart,
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
import { serviceRequestAPI, adminShopAPI, adminGarageAPI, mechanicAPI } from '@/services/api'
import { normalizeServiceRequest } from '@/store/sagas/serviceRequestSaga'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/utils'
import { ServiceRequestsMap } from '@/components/admin/ServiceRequestsMap'
import { AssignDialog } from '@/components/admin/AssignDialog'
import { DiagnosisDialog } from '@/components/admin/DiagnosisDialog'
import { CreateRequestDialog } from '@/components/admin/CreateRequestDialog'
import { RequestCallPanel } from '@/components/admin/RequestCallPanel'
import { PRIORITY_PILL, STATUS_PILL, vehicleIconFor, kmBetween, initialsOf, vehicleName } from '@/components/admin/serviceRequestUi'

// Service category options
const serviceCategories = [
  'Engine Service', 'Brake Service', 'AC Service', 'Battery Replacement',
  'Tyre Replacement', 'Oil Change', 'Clutch Repair', 'Suspension Repair',
  'Electrical Work', 'Body Work', 'Painting', 'General Service',
  'Roadside Assistance', 'Towing', 'Other'
]

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
  notes: '',
  commissionRate: 5,
  serviceRangeKm: 8,
  minWallet: 5000,
  feeCollection: 'online',
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

// Left-edge stripe color per request status — makes the table scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  pending: '#f59e0b', assigned: '#3b82f6', accepted: '#6366f1', mechanic_assigned: '#6366f1',
  on_way: '#06b6d4', diagnosis: '#f59e0b', approved: '#10b981', in_progress: '#a855f7',
  'in-progress': '#a855f7', completed: '#22c55e', payment_pending: '#f97316', paid: '#16a34a',
  rejected_quote: '#f43f5e', payment_refused: '#ef4444', cancelled: '#ef4444',
};

// Full status progression order (matches pricing flow)
const STATUS_FLOW: ServiceRequest['status'][] = [
  'pending', 'assigned', 'accepted', 'on_way', 'diagnosis', 'approved', 'in_progress', 'completed', 'payment_pending', 'paid'
];

// Quotation can be revised while awaiting approval AND after approval (items
// added/removed during work) — the latter sends it back to the customer.
const DIAG_REVISE_STATUSES: string[] = ['diagnosis', 'approved', 'in_progress']
const DIAG_AFTER_APPROVAL_STATUSES: string[] = ['approved', 'in_progress']

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

const selCls = 'h-11 rounded-xl border border-[#E3E8EF] bg-white px-3.5 text-[13.5px] font-medium text-[#1F2937]'

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
    pagination: reqPagination,
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

  // Submit-diagnosis-on-behalf dialog (used when the mechanic can't operate the app)
  const [diagDialogOpen, setDiagDialogOpen] = useState(false)
  const [diagRequest, setDiagRequest] = useState<ServiceRequest | null>(null)
  // Proxy actions on the customer's / mechanic's behalf (see handlers below)
  const [proxyBusy, setProxyBusy] = useState<string | null>(null)

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
  const [viewMechanicOpen, setViewMechanicOpen] = useState(false)
  // Add / Edit mechanic → full registration form (details, KYC docs, bank / UPI, plan)
  const [mechFormState, setMechFormState] = useState<{ open: boolean; mode: 'create' | 'edit'; id?: string }>({ open: false, mode: 'create' })
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [mechanicSearch, setMechanicSearch] = useState('')

  // Add Service Request dialog state
  const [addRequestOpen, setAddRequestOpen] = useState(false)

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
  }, [dispatch])

  // ── Server-side paging + filters for the requests list ──
  const [reqPage, setReqPage] = useState(1)
  const [reqPageSize, setReqPageSize] = useState(10)
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [moreFilters, setMoreFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [mapSel, setMapSel] = useState<string | null>(null)
  const [mapRequests, setMapRequests] = useState<ServiceRequest[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])
  const reqFiltersKey = `${debouncedSearch}|${statusFilter}|${priorityFilter}|${serviceTypeFilter}|${vehicleFilter}|${cityFilter}|${dateFrom}|${dateTo}|${emergencyOnly}|${reqPageSize}`
  const prevFiltersKey = useRef(reqFiltersKey)
  const reqQuery = useMemo(() => {
    // a filter change always starts from page 1
    const page = prevFiltersKey.current !== reqFiltersKey ? 1 : reqPage
    return {
      page,
      limit: reqPageSize,
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      serviceCategory: serviceTypeFilter !== 'all' ? serviceTypeFilter : undefined,
      vehicleType: vehicleFilter !== 'all' ? vehicleFilter : undefined,
      city: cityFilter !== 'all' ? cityFilter : undefined,
      startDate: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
      endDate: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
      isEmergency: emergencyOnly ? 'true' : undefined,
    }
  }, [reqPage, reqPageSize, debouncedSearch, statusFilter, priorityFilter, serviceTypeFilter, vehicleFilter, cityFilter, dateFrom, dateTo, emergencyOnly, reqFiltersKey])
  useEffect(() => {
    if (prevFiltersKey.current !== reqFiltersKey) { prevFiltersKey.current = reqFiltersKey; if (reqPage !== 1) setReqPage(1) }
    dispatch(fetchServiceRequestsRequest(reqQuery))
  }, [dispatch, reqQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Top cards come from the server (all requests), not just the current page
  const [srvStats, setSrvStats] = useState<any>(null)
  useEffect(() => {
    serviceRequestAPI.getStats().then((r) => { if (r.data?.success) setSrvStats(r.data.data) }).catch(() => {})
  }, [serviceRequests])

  // Map View shows every request matching the filters (up to 300), not just the list page
  useEffect(() => {
    if (activeTab !== 'map') return
    let off = false
    setMapLoading(true)
    serviceRequestAPI.getAll({ ...reqQuery, page: 1, limit: 300 })
      .then((r) => { if (!off) setMapRequests((r.data?.data || []).map(normalizeServiceRequest)) })
      .catch(() => { if (!off) toast.error('Could not load requests for the map') })
      .finally(() => { if (!off) setMapLoading(false) })
    return () => { off = true }
  }, [activeTab, reqQuery, serviceRequests]) // eslint-disable-line react-hooks/exhaustive-deps

  // Assignment tab works on ALL pending requests, independent of the list page
  const [assignPool, setAssignPool] = useState<ServiceRequest[]>([])
  useEffect(() => {
    if (activeTab !== 'assignment') return
    serviceRequestAPI.getAll({ status: 'pending', limit: 100 })
      .then((r) => setAssignPool((r.data?.data || []).map(normalizeServiceRequest)))
      .catch(() => {})
  }, [activeTab, serviceRequests])

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

  // Approve a mechanic's documents (self-registered mechanics start unverified).
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const handleVerifyMechanic = async (id: string) => {
    setVerifyingId(id)
    try {
      const res = await mechanicAPI.update(id, { isVerified: true })
      if (res.data?.success === false) throw new Error(res.data?.message)
      toast.success('Mechanic verified')
      dispatch(fetchMechanicsRequest())
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not verify mechanic')
    } finally {
      setVerifyingId(null)
    }
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

  const handleEditMechanic = (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic)
    setMechFormState({ open: true, mode: 'edit', id: mechanic._id })
  }

  const handleDeleteMechanic = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this mechanic? This action cannot be undone.')) {
      return
    }
    dispatch(deleteMechanicRequest(id))
  }

  const filteredRequests = useMemo(() => {
    // The server already applied search / status / priority / service filters and paging.
    return serviceRequests ?? []
  }, [serviceRequests])

  const getServiceStats = () => {
    if (srvStats?.byStatus) {
      const b = srvStats.byStatus as Record<string, number>
      const n = (...k: string[]) => k.reduce((a, x) => a + (b[x] || 0), 0)
      const ratedList = (serviceRequests ?? []).filter(r => r.feedback?.rating)
      const pageAvg = ratedList.length ? ratedList.reduce((sum, r) => sum + (r.feedback?.rating || 0), 0) / ratedList.length : 0
      return {
        totalRequests: srvStats.total ?? n(...Object.keys(b)),
        pendingRequests: n('pending'),
        diagnosisRequests: n('diagnosis'),
        inProgressRequests: n('in_progress', 'in-progress', 'approved'),
        completedRequests: n('completed', 'payment_pending'),
        paidRequests: n('paid'),
        avgRating: srvStats.avgRating || pageAvg,
      }
    }
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

  // Export the currently-filtered service requests to CSV (from existing state).
  const exportCsv = async () => {
    const rows: string[][] = [['Request ID', 'Customer', 'Service', 'Status', 'Priority', 'Est. Cost', 'Mechanic', 'City', 'Date']]
    let exportList: any[] = filteredRequests
    try {
      const res = await serviceRequestAPI.getAll({ ...reqQuery, page: 1, limit: 1000 })
      if (res.data?.success) exportList = (res.data.data || []).map(normalizeServiceRequest)
    } catch { /* fall back to the current page */ }
    exportList.forEach((r: any) => {
      rows.push([
        r.requestId || r.id || r._id || '',
        r.customer?.name || r.customer?.fullName || '',
        r.serviceType || '',
        r.status || '',
        r.priority || '',
        String(r.finalCost ?? r.totalCost ?? r.estimatedCost ?? 0),
        r.mechanic?.name || r.mechanic?.fullName || '',
        r.location?.city || '',
        r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
      ])
    })
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `service-requests-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
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

  // ── Submit diagnosis on the mechanic's behalf ────────────────────────────
  // Only offered while the request is accepted/on_way (same window the mechanic
  // app allows) or in diagnosis (revise the quotation).
  const handleOpenDiagnosis = (request: ServiceRequest) => {
    setDiagRequest(request)
    setDiagDialogOpen(true)
  }
  const closeDiagnosis = () => { setDiagDialogOpen(false); setDiagRequest(null) }

  // ── Acting on the SHOP's behalf (shop works by phone / WhatsApp) ──────────
  // Same ShopService calls the Shop Partner panel makes; admin just does them.
  const [shopDlg, setShopDlg] = useState<{ request: ServiceRequest; mode: 'assign' | 'complete' } | null>(null)
  const [shopDlgLoading, setShopDlgLoading] = useState(false)
  const [shopMechanics, setShopMechanics] = useState<any[]>([])
  const [shopMechId, setShopMechId] = useState('')
  const [shopManual, setShopManual] = useState({ name: '', phone: '' })
  const [shopCost, setShopCost] = useState({ labor: '', parts: '', notes: '' })
  const shopBusy = (id: string) => proxyBusy === id

  const runShopAction = async (request: ServiceRequest, fn: () => Promise<any>, okMsg?: string) => {
    setProxyBusy(request._id)
    try {
      const res = await fn()
      if (res.data?.success) {
        toast.success(okMsg || res.data.message || 'Done')
        dispatch(fetchServiceRequestsRequest())
        return true
      }
      toast.error(res.data?.message || 'Action failed')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed')
    } finally {
      setProxyBusy(null)
    }
    return false
  }

  const handleShopAccept = (request: ServiceRequest) => {
    const shop = request.shopPartner?.shopName || 'the shop'
    if (!window.confirm(`Accept this order on behalf of ${shop}?\n\nOnly after the shop confirmed on phone / WhatsApp. The customer is told the shop accepted.`)) return
    runShopAction(request, () => serviceRequestAPI.shopAccept(request._id))
  }

  const handleShopReject = (request: ServiceRequest) => {
    const shop = request.shopPartner?.shopName || 'the shop'
    const reason = window.prompt(`Reject this order on behalf of ${shop}?\n\nThe request goes back to "pending" so you can assign another shop or mechanic. Reason (optional):`)
    if (reason === null) return
    runShopAction(request, () => serviceRequestAPI.shopReject(request._id, reason.trim() || undefined))
  }

  const handleOpenShopDialog = async (request: ServiceRequest, mode: 'assign' | 'complete') => {
    setShopDlg({ request, mode })
    setShopMechId(''); setShopManual({ name: '', phone: '' })
    setShopCost({ labor: request.shopOrder?.laborCost ? String(request.shopOrder.laborCost) : '', parts: request.shopOrder?.partsCost ? String(request.shopOrder.partsCost) : '', notes: '' })
    setShopMechanics([])
    if (mode === 'assign') {
      setShopDlgLoading(true)
      try {
        const res = await serviceRequestAPI.getShopOrder(request._id)
        setShopMechanics(res.data?.data?.mechanics || [])
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Could not load the shop\'s mechanics')
      } finally { setShopDlgLoading(false) }
    }
  }

  const handleShopAssignConfirm = async () => {
    if (!shopDlg) return
    const payload: { mechanicProfileId?: string; name?: string; phone?: string } = shopMechId
      ? (() => { const m = shopMechanics.find((x) => x._id === shopMechId); return { mechanicProfileId: shopMechId, name: m?.name, phone: m?.phone } })()
      : { name: shopManual.name.trim(), phone: shopManual.phone.replace(/\D/g, '').slice(-10) }
    if (!payload.mechanicProfileId && (!payload.name || payload.phone?.length !== 10)) { toast.error('Pick a mechanic, or enter a name and 10-digit phone'); return }
    const ok = await runShopAction(shopDlg.request, () => serviceRequestAPI.shopAssignMechanic(shopDlg.request._id, payload))
    if (ok) setShopDlg(null)
  }

  const handleShopStatus = (request: ServiceRequest, status: 'on_way' | 'in_progress' | 'paid') => {
    const shop = request.shopPartner?.shopName || 'the shop'
    const label = { on_way: 'mechanic is on the way', in_progress: 'work has started', paid: `payment collected by ${shop}` }[status]
    const extra = status === 'paid' ? `\n\nThis credits the shop's share of ₹${request.shopOrder?.finalCost || 0} to the shop's wallet, exactly like the shop panel's "Collect payment".` : ''
    if (!window.confirm(`Mark "${label}" on behalf of ${shop}?${extra}`)) return
    runShopAction(request, () => serviceRequestAPI.shopStatus(request._id, status))
  }

  const handleShopCompleteConfirm = async () => {
    if (!shopDlg) return
    const labor = Number(shopCost.labor || 0), parts = Number(shopCost.parts || 0)
    if (isNaN(labor) || isNaN(parts) || labor < 0 || parts < 0 || labor + parts <= 0) { toast.error('Enter the labour and/or parts amount the shop charged'); return }
    const r = shopDlg.request
    setProxyBusy(r._id)
    try {
      const c = await serviceRequestAPI.shopCost(r._id, { laborCost: labor, partsCost: parts })
      if (!c.data?.success) { toast.error(c.data?.message || 'Could not save cost'); return }
      const s = await serviceRequestAPI.shopStatus(r._id, 'completed', shopCost.notes.trim() || undefined)
      if (!s.data?.success) { toast.error(s.data?.message || 'Could not mark completed'); return }
      toast.success(`Job marked completed for ${r.shopPartner?.shopName || 'the shop'} — ₹${labor + parts}`)
      dispatch(fetchServiceRequestsRequest())
      setShopDlg(null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Action failed')
    } finally { setProxyBusy(null) }
  }

  // ── Accept on the mechanic's behalf (mechanic has no smartphone) ─────────
  // Backend reuses ServiceRequestService.acceptRequest → same 'accepted'
  // transition and the same "Mechanic Accepted" push to the customer.
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const handleAcceptOnBehalf = async (request: ServiceRequest) => {
    if (!request.mechanic) { toast.error('Assign a mechanic first'); return }
    const label = `#${(request as any).requestId || request._id}`
    if (typeof window !== 'undefined' && !window.confirm(`Accept request ${label} on behalf of ${request.mechanic.name}? The customer will be notified that the mechanic accepted.`)) return
    setAcceptingId(request._id)
    try {
      const res = await serviceRequestAPI.acceptOnBehalf(request._id)
      if (res.data?.success) {
        toast.success('Accepted on mechanic\'s behalf — customer notified')
        dispatch(fetchServiceRequestsRequest())
        setSelectedRequest(null)
      } else {
        toast.error(res.data?.message || 'Could not accept request')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not accept request')
    } finally { setAcceptingId(null) }
  }

  // ── Customer decision recorded by admin (customer confirmed on phone / in person) ──
  const handleApproveQuoteOnBehalf = async (request: ServiceRequest) => {
    const total = request.diagnosis?.costBreakdown?.totalEstimate ?? 0
    const who = (request.customer as any)?.name || (request.customer as any)?.fullName || 'the customer'
    if (typeof window !== 'undefined' && !window.confirm(`Approve the ₹${total} quotation on behalf of ${who}?\n\nOnly do this after the customer confirmed (phone / in person). Work will be marked as started and the mechanic notified.`)) return
    setProxyBusy(request._id)
    try {
      const res = await serviceRequestAPI.approveQuoteOnBehalf(request._id)
      if (res.data?.success) {
        toast.success('Quotation approved for the customer — mechanic notified')
        dispatch(fetchServiceRequestsRequest())
        setSelectedRequest(null)
      } else toast.error(res.data?.message || 'Could not approve quotation')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not approve quotation')
    } finally { setProxyBusy(null) }
  }

  const handleRejectQuoteOnBehalf = async (request: ServiceRequest) => {
    if (typeof window === 'undefined') return
    const hasPendingRevision = (request.diagnosis?.revisions || []).some((r) => r.outcome === 'pending')
    const reason = window.prompt(
      hasPendingRevision
        ? 'Reason the customer declined the revised quote (work continues on the previously approved quote):'
        : 'Reason the customer rejected the quote (the request will be closed as "quote rejected"):',
      '',
    )
    if (reason === null) return
    setProxyBusy(request._id)
    try {
      const res = await serviceRequestAPI.rejectQuoteOnBehalf(request._id, reason.trim() || undefined)
      if (res.data?.success) {
        toast.success(res.data?.message || 'Quotation rejected for the customer')
        dispatch(fetchServiceRequestsRequest())
        setSelectedRequest(null)
      } else toast.error(res.data?.message || 'Could not reject quotation')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not reject quotation')
    } finally { setProxyBusy(null) }
  }

  // ── Complete the job on the mechanic's behalf (no customer OTP) ──
  const handleCompleteOnBehalf = async (request: ServiceRequest) => {
    if (typeof window === 'undefined') return
    const note = window.prompt(
      `Mark service #${(request as any).requestId || request._id} as COMPLETED on behalf of ${request.mechanic?.name || 'the mechanic'}?\n\nThe customer is notified to pay. Optional note:`,
      '',
    )
    if (note === null) return
    setProxyBusy(request._id)
    try {
      const res = await serviceRequestAPI.completeOnBehalf(request._id, note.trim() || undefined)
      if (res.data?.success) {
        toast.success('Marked completed — customer notified to pay. Use "Mark Paid" once payment is collected.')
        dispatch(fetchServiceRequestsRequest())
        setSelectedRequest(null)
      } else toast.error(res.data?.message || 'Could not complete request')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not complete request')
    } finally { setProxyBusy(null) }
  }

  const handleOpenAssignDialog = async (request: ServiceRequest) => {
    setAssigningRequest(request)
    setAssignMechanicId(request.mechanic?._id || '')
    setAssignMode('mechanic')
    setSelectedShopId('')
    setAssignDialogOpen(true)
    // Fetch shops in background
    setShopsLoading(true)
    // shop partners + the garages our field staff registered that are not partners yet
    const [shopsRes, fieldRes] = await Promise.allSettled([adminShopAPI.getAll({ limit: 300 }), adminGarageAPI.assignable()])
    const partners = shopsRes.status === 'fulfilled' && shopsRes.value.data?.success ? (shopsRes.value.data.data || []).filter((s: any) => s.isActive) : null
    const fieldGarages = fieldRes.status === 'fulfilled' && fieldRes.value.data?.success ? (fieldRes.value.data.data || []) : []
    if (partners || fieldGarages.length) setShopsList([...(partners || []), ...fieldGarages])
    setShopsLoading(false)
  }

  const closeAssignDialog = () => { setAssignDialogOpen(false); setAssigningRequest(null); setAssignMechanicId(''); setSelectedShopId('') }

  // Assign the open request to an individual mechanic (same action as before)
  const assignToMechanic = (mechanicId: string) => {
    if (!assigningRequest || !mechanicId) return false
    dispatch(assignMechanicRequest({ requestId: assigningRequest._id, mechanicId }))
    toast.success('Mechanic assigned')
    closeAssignDialog()
    return true
  }

  // Assign the open request to a garage / shop partner (same API as before)
  const assignToShop = async (shopId: string) => {
    if (!assigningRequest || !shopId) return false
    try {
      // a garage registered by field staff becomes a shop partner with its first job
      const fieldGarage = shopsList.some((s: any) => s._id === shopId && s.source === 'field')
      const res = fieldGarage ? await adminGarageAPI.assignOrder(shopId, assigningRequest._id) : await adminShopAPI.assignOrder(assigningRequest._id, shopId)
      if (!res.data?.success) { toast.error(res.data?.message || 'Failed to assign to the garage'); return false }
      dispatch(fetchServiceRequestsRequest())
      toast.success((fieldGarage && res.data.message) || 'Request assigned to the garage')
      closeAssignDialog()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign to the garage')
      return false
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

  const downloadInvoice = async (request: ServiceRequest) => {
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
      toast.error('Could not download the invoice')
    }
  }
  // The "more" menu of a request — every admin action on it. Used by the table rows and the map list.
  const rowMenu = (request: ServiceRequest) => {
    const coords = request.location?.coordinates?.latitude != null && request.location?.coordinates?.longitude != null ? request.location.coordinates : null
    return (
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadInvoice(request)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Download Invoice PDF
                            </DropdownMenuItem>
                            {coords && (
                              <DropdownMenuItem onClick={() => copyToClipboard(`${coords.latitude}, ${coords.longitude}`, `table-coords-${request._id}`)}>
                                {copiedKey === `table-coords-${request._id}` ? <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                                Copy coordinates
                              </DropdownMenuItem>
                            )}
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
                            {/* Proxy actions — for mechanics who don't use the app */}
                            {['assigned', 'mechanic_assigned'].includes(request.status) && request.mechanic && (
                              <DropdownMenuItem onClick={() => handleAcceptOnBehalf(request)} disabled={acceptingId === request._id}>
                                <CheckCircle className="h-4 w-4 mr-2 text-indigo-600" />
                                Accept on mechanic&apos;s behalf
                              </DropdownMenuItem>
                            )}
                            {['accepted', 'on_way', 'diagnosis'].includes(request.status) && (
                              <DropdownMenuItem onClick={() => handleOpenDiagnosis(request)}>
                                <Search className="h-4 w-4 mr-2 text-indigo-600" />
                                {request.status === 'diagnosis' ? 'Revise quotation (on behalf)' : 'Submit quotation (on behalf)'}
                              </DropdownMenuItem>
                            )}
                            {request.status === 'diagnosis' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveQuoteOnBehalf(request)} disabled={proxyBusy === request._id}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                                  Approve quote (for customer)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectQuoteOnBehalf(request)} disabled={proxyBusy === request._id}>
                                  <XCircle className="h-4 w-4 mr-2 text-rose-600" />
                                  Reject quote (for customer)
                                </DropdownMenuItem>
                              </>
                            )}
                            {DIAG_AFTER_APPROVAL_STATUSES.includes(request.status) && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenDiagnosis(request)}>
                                  <Edit className="h-4 w-4 mr-2 text-indigo-600" />
                                  Add/remove items (re-approval)
                                </DropdownMenuItem>
                                {request.status === 'in_progress' && (
                                  <DropdownMenuItem onClick={() => handleCompleteOnBehalf(request)} disabled={proxyBusy === request._id}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-indigo-600" />
                                    Complete work (on behalf)
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {/* Shop actions — admin acts for a shop that works by phone / WhatsApp */}
                            {request.shopPartner && request.shopOrder && (() => {
                              const so = request.shopOrder!
                              const manual = !so.mechanicProfile // shop's own (non-app) mechanic → admin drives the status
                              const items: React.ReactNode[] = []
                              if (so.status === 'pending') {
                                items.push(
                                  <DropdownMenuItem key="s-acc" onClick={() => handleShopAccept(request)} disabled={shopBusy(request._id)}><CheckCircle className="h-4 w-4 mr-2 text-orange-600" />Accept order (for shop)</DropdownMenuItem>,
                                  <DropdownMenuItem key="s-rej" onClick={() => handleShopReject(request)} disabled={shopBusy(request._id)}><XCircle className="h-4 w-4 mr-2 text-orange-600" />Reject order (for shop) → reassign</DropdownMenuItem>,
                                )
                              }
                              if (['pending', 'accepted'].includes(so.status)) {
                                items.push(<DropdownMenuItem key="s-mech" onClick={() => handleOpenShopDialog(request, 'assign')} disabled={shopBusy(request._id)}><Wrench className="h-4 w-4 mr-2 text-orange-600" />Assign shop&apos;s mechanic (for shop)</DropdownMenuItem>)
                              }
                              if (manual && so.status === 'mechanic_assigned') items.push(<DropdownMenuItem key="s-ow" onClick={() => handleShopStatus(request, 'on_way')} disabled={shopBusy(request._id)}><Navigation className="h-4 w-4 mr-2 text-orange-600" />Mark on the way (for shop)</DropdownMenuItem>)
                              if (manual && so.status === 'on_way') items.push(<DropdownMenuItem key="s-ip" onClick={() => handleShopStatus(request, 'in_progress')} disabled={shopBusy(request._id)}><Wrench className="h-4 w-4 mr-2 text-orange-600" />Mark work started (for shop)</DropdownMenuItem>)
                              if (manual && so.status === 'in_progress') items.push(<DropdownMenuItem key="s-done" onClick={() => handleOpenShopDialog(request, 'complete')} disabled={shopBusy(request._id)}><CheckCircle className="h-4 w-4 mr-2 text-orange-600" />Mark completed + cost (for shop)</DropdownMenuItem>)
                              if (so.status === 'completed' && so.paymentStatus !== 'paid') items.push(<DropdownMenuItem key="s-paid" onClick={() => handleShopStatus(request, 'paid')} disabled={shopBusy(request._id)}><DollarSign className="h-4 w-4 mr-2 text-orange-600" />Payment collected (for shop)</DropdownMenuItem>)
                              if (!items.length) return null
                              return (<><DropdownMenuSeparator /><DropdownMenuLabel className="text-[11px] text-orange-700">{request.shopPartner.shopName} — on the shop&apos;s behalf</DropdownMenuLabel>{items}</>)
                            })()}
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
    )
  }
  const extraFiltersOn = !!(dateFrom || dateTo || emergencyOnly)
  const anyFilterOn = extraFiltersOn || statusFilter !== 'all' || priorityFilter !== 'all' || serviceTypeFilter !== 'all' || vehicleFilter !== 'all' || cityFilter !== 'all' || !!searchQuery
  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); setServiceTypeFilter('all'); setVehicleFilter('all'); setCityFilter('all'); setDateFrom(''); setDateTo(''); setEmergencyOnly(false) }
  const reqTotal = reqPagination?.total ?? filteredRequests.length
  const reqCur = reqPagination?.page || reqPage
  const reqPages = Math.max(1, Math.ceil(reqTotal / reqPageSize))
  const pageNums = (() => {
    const out: (number | '…')[] = []
    for (let p = 1; p <= reqPages; p++) {
      if (p === 1 || p === reqPages || Math.abs(p - reqCur) <= 1 || (reqCur <= 3 && p <= 4) || (reqCur >= reqPages - 2 && p >= reqPages - 3)) out.push(p)
      else if (out[out.length - 1] !== '…') out.push('…')
    }
    return out
  })()
  const kpis = [
    { key: 'all', t: 'total', label: 'Total Requests', value: stats.totalRequests, Icon: Wrench, fg: '#2563EB', bg: '#EAF1FF' },
    { key: 'pending', t: 'pending', label: 'Pending', value: stats.pendingRequests, Icon: PieChart, fg: '#F97316', bg: '#FFF1E6' },
    { key: 'diagnosis', t: 'diagnosis', label: 'Diagnosis', value: stats.diagnosisRequests, Icon: Stethoscope, fg: '#7C3AED', bg: '#F3EEFF' },
    { key: 'in_progress', t: 'in_progress', label: 'In Progress', value: stats.inProgressRequests, Icon: Send, fg: '#0EA5E9', bg: '#E6F6FE' },
    { key: 'completed', t: 'completed', label: 'Completed', value: stats.completedRequests, Icon: CheckCircle, fg: '#16A34A', bg: '#E8F8EE' },
    { key: 'paid', t: 'paid', label: 'Paid', value: stats.paidRequests, Icon: CreditCard, fg: '#16A34A', bg: '#E8F8EE' },
  ]
  const TABS = [
    { value: 'requests', label: 'Service Requests', icon: Wrench },
    { value: 'map', label: 'Map View', icon: MapPin },
    { value: 'mechanics', label: 'Mechanics', icon: User },
    { value: 'assignment', label: 'Assignments', icon: Users },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search orders, garages, mechanics, customers, services...' }}
        left={
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="relative hidden h-10 w-[170px] rounded-xl border-[#E3E8EF] pl-9 text-[13.5px] font-semibold text-[#111827] md:flex">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#16305C]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All India</SelectItem>
              {((srvStats?.cities as string[]) || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="p-4 sm:p-6 space-y-5">
      {/* Header: breadcrumb + title, with the "Keep India Moving" banner on wide screens */}
      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0 pb-1">
          <nav className="mb-1.5 flex items-center gap-2 text-[13.5px]">
            <Link href="/admin" className="font-semibold text-[#1F2937] hover:text-[#1B3B6F]">Dashboard</Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span className="text-[#64748B]">Service Management</span>
          </nav>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[#111827]">Service Management</h1>
          <p className="mt-1 text-[14px] text-[#6B7280]">Manage service requests, mechanic assignments, and track job progress in real-time.</p>
        </div>
        <div className={`pointer-events-none hidden shrink-0 select-none items-end ${activeTab === 'map' ? '' : 'xl:flex'}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/admin/sr-keep-moving.webp" alt="" width={151} height={137} className="mb-3 h-[92px] w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/admin/sr-mechanic.webp" alt="" width={198} height={228} className="relative z-10 -mb-5 -ml-2 h-[136px] w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/admin/sr-map.webp" alt="" width={561} height={150} className="-ml-10 mb-1 h-[112px] w-auto opacity-90" />
        </div>
      </div>

      {/* KPI cards — click one to filter the list by that status */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k) => {
          const tr = srvStats?.trend?.[k.t]
          const pct = tr?.pct ?? 0
          const bars: number[] = tr?.bars?.length ? tr.bars : [0, 0, 0, 0, 0]
          const max = Math.max(1, ...bars)
          const active = (k.key === 'all' && statusFilter === 'all') ? false : statusFilter === k.key
          const Trend = pct > 0 ? ArrowUp : pct < 0 ? ArrowDown : ArrowRight
          const trendColor = pct > 0 ? '#16A34A' : pct < 0 ? '#F97316' : '#94A3B8'
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => setStatusFilter(k.key)}
              title={tr ? `${tr.thisMonth} created this month · ${tr.lastMonth} last month` : undefined}
              className={`relative rounded-2xl border bg-white px-3.5 py-3.5 text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-shadow hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-[#EAEEF3]'}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: k.bg, color: k.fg }}><k.Icon className="h-[22px] w-[22px]" /></span>
                <div className="min-w-0 pr-7">
                  <p className="text-[24px] font-extrabold leading-none text-[#111827] tabular-nums">{k.value}</p>
                  <p className="mt-1 whitespace-nowrap text-[13px] font-medium text-[#374151]">{k.label}</p>
                  <span className="mt-0.5 flex items-center gap-0.5 text-[12.5px] font-bold" style={{ color: trendColor }}><Trend className="h-3.5 w-3.5" />{Math.abs(pct)}%</span>
                  <span className="block whitespace-nowrap text-[10px] leading-tight text-[#94A3B8]">vs last month</span>
                </div>
              </div>
              <div className="absolute bottom-3.5 right-3.5 flex h-7 items-end gap-[3px]">
                {bars.map((b, i) => <span key={i} className="w-[5px] rounded-sm" style={{ height: `${Math.max(14, (b / max) * 100)}%`, background: k.fg, opacity: 0.35 + (i / (bars.length - 1 || 1)) * 0.65 }} />)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Service Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center rounded-xl border border-[#E3E8EF] bg-white p-1">
            {TABS.map((tab, i) => {
              const TabIcon = tab.icon
              const on = activeTab === tab.value
              return (
                <React.Fragment key={tab.value}>
                  {i > 0 && !on && activeTab !== TABS[i - 1].value && <span className="h-5 w-px bg-[#E3E8EF]" />}
                  <button type="button" onClick={() => setActiveTab(tab.value)} aria-pressed={on}
                    className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-semibold transition-colors ${on ? 'bg-[#16305C] text-white shadow-sm' : 'text-[#1F2937] hover:bg-[#F3F5F9]'}`}>
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </button>
                </React.Fragment>
              )
            })}
          </div>
          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" disabled={filteredRequests.length === 0} className="flex h-11 items-center gap-2 rounded-xl border border-[#E3E8EF] bg-white px-4 text-[13.5px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] disabled:opacity-50">
                  <Download className="h-4 w-4" /> Export <ChevronDown className="ml-1 h-4 w-4 text-[#64748B]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}><FileText className="mr-2 h-4 w-4" />Export CSV (current filters)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" onClick={() => setAddRequestOpen(true)} className="flex h-11 items-center gap-2 rounded-xl bg-[#FF5A1F] px-5 text-[13.5px] font-bold text-white shadow-sm hover:bg-[#F04E14]">
              <Plus className="h-4 w-4" /> Add Service Request
            </button>
          </div>
        </div>

        {(activeTab === 'requests' || activeTab === 'map') && (
          <div className="space-y-3">
          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1 lg:max-w-[430px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748B]" />
              <input
                placeholder="Search by request ID, customer, garage, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E3E8EF] bg-white pl-11 pr-3 text-[13.5px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#1B3B6F]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`${selCls} w-[140px]`}><SelectValue placeholder="All Status" /></SelectTrigger>
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
              <SelectTrigger className={`${selCls} w-[140px]`}><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className={`${selCls} w-[160px]`}><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className={`${selCls} w-[170px]`}><SelectValue placeholder="All Vehicle Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicle Types</SelectItem>
                {((srvStats?.vehicleTypes as string[]) || []).map((v) => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className={`${selCls} w-[140px]`}><SelectValue placeholder="All Cities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {((srvStats?.cities as string[]) || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <button type="button" onClick={() => setMoreFilters((v) => !v)} aria-expanded={moreFilters}
              className={`relative ml-auto flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-[13.5px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] ${moreFilters ? 'border-[#1B3B6F]' : 'border-[#E3E8EF]'}`}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {extraFiltersOn && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#FF5A1F] ring-2 ring-white" />}
            </button>
          </div>

          {moreFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E3E8EF] bg-white p-3.5">
              <label className="block text-[12px] font-semibold text-[#64748B]">From date
                <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 block h-10 rounded-lg border border-[#E3E8EF] px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#1B3B6F]" />
              </label>
              <label className="block text-[12px] font-semibold text-[#64748B]">To date
                <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="mt-1 block h-10 rounded-lg border border-[#E3E8EF] px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#1B3B6F]" />
              </label>
              <label className="flex h-10 cursor-pointer items-center gap-2 text-[13.5px] font-medium text-[#1F2937]">
                <Checkbox checked={emergencyOnly} onCheckedChange={(v) => setEmergencyOnly(v === true)} /> Emergency requests only
              </label>
              {anyFilterOn && <button type="button" onClick={clearFilters} className="ml-auto h-10 rounded-lg px-3 text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2]">Clear all filters</button>}
            </div>
          )}
          </div>
        )}

        {/* Service Requests Tab */}
        <TabsContent value="requests" className="mt-0 space-y-4">
          {/* Bulk Actions */}
          {selectedRequests.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-3">
              <span className="text-sm font-medium text-blue-800">{selectedRequests.length} request(s) selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('assign')}>Assign</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('update-status')}>Update Status</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleBulkAction('send-notification')}>Send Update</Button>
              </div>
            </div>
          )}

          {/* Service Requests Table */}
          <div className="overflow-hidden rounded-2xl border border-[#EAEEF3] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead>
                  <tr className="whitespace-nowrap border-b border-[#EAEEF3] text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#1F2937]">
                    <th className="w-12 py-3.5 pl-5 pr-2">
                      <Checkbox checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0} onCheckedChange={handleSelectAll} />
                    </th>
                    <th className="px-2.5 py-3.5">Request ID</th>
                    <th className="px-2.5 py-3.5">Customer</th>
                    <th className="px-2.5 py-3.5">Vehicle &amp; Service</th>
                    <th className="px-2.5 py-3.5">Location</th>
                    <th className="px-2.5 py-3.5">Priority</th>
                    <th className="px-2.5 py-3.5">Status</th>
                    <th className="px-2.5 py-3.5">Mechanic</th>
                    <th className="px-2.5 py-3.5">Est. Cost</th>
                    <th className="px-2.5 py-3.5">Date &amp; Time</th>
                    <th className="px-2.5 py-3.5 pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const coords = request.location?.coordinates?.latitude != null && request.location?.coordinates?.longitude != null ? request.location.coordinates : null
                    const VehIcon = vehicleIconFor(request.vehicle?.type)
                    const vehName = vehicleName(request.vehicle)
                    const pr = PRIORITY_PILL[request.priority] || PRIORITY_PILL.medium
                    const sp = STATUS_PILL[request.status] || STATUS_PILL.pending
                    const sc = statusConfig[request.status as keyof typeof statusConfig]
                    const StatusIcon = sc?.icon || Clock
                    const dist = kmBetween(request.mechanic?.currentLocation, coords || undefined)
                    const created = new Date(request.createdAt)
                    const displayId = generateDisplayRequestId(request)
                    const idCut = displayId.lastIndexOf('-')
                    return (
                    <tr key={request._id} className="border-b border-[#F0F3F7] transition-colors last:border-b-0 hover:bg-[#FAFBFD]" style={{ boxShadow: `inset 3px 0 0 ${STATUS_STRIPE[request.status] || 'transparent'}` }}>
                      <td className="py-2.5 pl-5 pr-2 align-middle">
                        <Checkbox checked={selectedRequests.includes(request._id)} onCheckedChange={() => handleSelectRequest(request._id)} />
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#2563EB]"><FileText className="h-4 w-4" /></span>
                          <button type="button" onClick={() => setSelectedRequest(request)} className="whitespace-nowrap text-left text-[12.5px] font-bold leading-tight text-[#16305C] hover:underline">
                            {idCut > 0 ? <>{displayId.slice(0, idCut + 1)}<br />{displayId.slice(idCut + 1)}</> : displayId}
                          </button>
                        </div>
                        {request.franchise?.name && (
                          <span className="mt-1 block w-fit rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700" title="Booked from this franchise's dashboard">Franchise · {request.franchise.name}</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF2F7] text-[12.5px] font-bold text-[#334155]">{initialsOf(request.customer.name)}</span>
                          <div className="min-w-0 max-w-[128px]">
                            <div className="truncate text-[13.5px] font-bold text-[#111827]" title={request.customer.name}>{request.customer.name || '—'}</div>
                            <div className="text-[12.5px] text-[#6B7280]">{request.customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 text-[#16305C]"><VehIcon size={26} /></span>
                          <div className="min-w-0 max-w-[150px]">
                            <div className="truncate text-[13.5px] font-bold text-[#111827]" title={vehName}>{vehName}</div>
                            <div className="truncate text-[12.5px] text-[#6B7280]">{request.serviceType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#16305C]" />
                          <div className="min-w-0">
                            <div className="max-w-[160px] truncate text-[13px] text-[#374151]" title={request.location?.address}>{[request.location?.address?.split(',')[0], request.location?.city].filter((x, i, a) => x && a.indexOf(x) === i).join(', ') || '—'}</div>
                            <div className="whitespace-nowrap text-[12px] text-[#6B7280]">
                              {dist != null && <span className="mr-2">{dist.toFixed(1)} km</span>}
                              {coords
                                ? <button type="button" onClick={() => { setMapSel(request._id); setActiveTab('map') }} className="font-semibold text-[#FF5A1F] hover:underline">View on Map</button>
                                : <span className="italic text-[#DC2626]/70">No coordinates</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <span className="inline-block rounded-full px-3 py-1 text-[12px] font-bold" style={{ color: pr.fg, background: pr.bg }}>{pr.label}</span>
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-bold" style={{ color: sp.fg, background: sp.bg }}><StatusIcon className="h-3.5 w-3.5" />{sc?.label || request.status}</span>
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        {request.mechanic ? (
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-[12px] font-bold text-[#2563EB]">{initialsOf(request.mechanic.name)}</span>
                            <div className="min-w-0 max-w-[118px]">
                              <div className="truncate text-[13.5px] font-bold text-[#111827]" title={request.mechanic.name}>{request.mechanic.name}</div>
                              <div className="text-[12.5px] text-[#6B7280]">{request.mechanic.phone || 'Mechanic'}</div>
                            </div>
                          </div>
                        ) : request.shopPartner ? (
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><Store className="h-4 w-4" /></span>
                            <div className="min-w-0 max-w-[150px]">
                              <div className="truncate text-[13.5px] font-bold text-indigo-700" title={request.shopPartner.shopName}>{request.shopPartner.shopName || 'Shop partner'}</div>
                              <div className="text-[12px] text-[#6B7280]">
                                {request.shopOrder
                                  ? (request.shopOrder.assignedMechanic?.name
                                    ? <>{request.shopOrder.assignedMechanic.name}{request.shopOrder.assignedMechanic.phone ? ` · ${request.shopOrder.assignedMechanic.phone}` : ''}</>
                                    : <>shop order: {request.shopOrder.status.replace(/_/g, ' ')}</>)
                                  : request.shopPartner.city || 'Shop'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[13.5px] text-[#6B7280]">Not assigned</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 align-middle">
                        {(() => {
                          const diagTotal = request.diagnosis?.costBreakdown?.totalEstimate;
                          const amtDue = request.diagnosis?.costBreakdown?.amountDue;
                          const bkFee = request.bookingFee || request.diagnosis?.costBreakdown?.bookingFeeAdjusted || 0;
                          const hasSplit = bkFee > 0 && diagTotal && amtDue && amtDue < diagTotal;
                          const isFullyPaid = ['paid', 'settled'].includes(request.status);
                          if (hasSplit) {
                            return (
                              <div>
                                <span className="text-[15px] font-extrabold text-[#111827]">{formatCurrency(diagTotal)}</span>
                                <div className="text-[10.5px] leading-tight text-gray-400">
                                  <span className="text-green-600">₹{bkFee} online</span>
                                  {isFullyPaid
                                    ? <span className="ml-1 text-green-600">· ₹{amtDue} COD ✓</span>
                                    : <span className="ml-1 text-amber-600">· ₹{amtDue} COD pending</span>}
                                </div>
                              </div>
                            );
                          }
                          return <span className="text-[15px] font-extrabold text-[#111827]">{formatCurrency(diagTotal || request.finalCost || request.totalCost || request.estimatedCost || 0)}</span>;
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[12.5px] leading-snug text-[#6B7280]">
                        {created.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br />
                        {created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                      </td>
                      <td className="px-2 py-2.5 pr-4 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => setSelectedRequest(request)} title="View details" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#16305C] hover:bg-[#F3F5F9]"><Eye className="h-4 w-4" /></button>
                          {request.customer.phone
                            ? <a href={`tel:${request.customer.phone}`} title="Call customer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#16A34A] hover:bg-[#F0FDF4]"><Phone className="h-4 w-4" /></a>
                            : <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#CBD5E1]"><Phone className="h-4 w-4" /></span>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" title="More actions" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#16305C] hover:bg-[#F3F5F9]"><MoreHorizontal className="h-4 w-4" /></button>
                            </DropdownMenuTrigger>
                          {rowMenu(request)}
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="flex flex-col items-center p-12">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  {requestsLoading ? <Loader2 className="h-7 w-7 animate-spin text-gray-400" /> : <Wrench className="h-7 w-7 text-gray-400" />}
                </div>
                <h3 className="mb-1 text-base font-medium text-[#1A1D29]">{requestsLoading ? 'Loading service requests…' : 'No service requests found'}</h3>
                {!requestsLoading && <p className="text-sm text-[#6B7280]">Try adjusting your search or filter criteria</p>}
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAEEF3] px-5 py-3.5">
              <p className="text-[13.5px] text-[#6B7280]">
                {reqTotal === 0 ? 'No requests' : <>Showing {(reqCur - 1) * reqPageSize + 1} to {Math.min(reqTotal, reqCur * reqPageSize)} of {reqTotal} requests</>}
              </p>
              <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Previous page" disabled={reqCur <= 1} onClick={() => setReqPage(reqCur - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#1F2937] hover:bg-[#F3F5F9] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {pageNums.map((p, i) => p === '…'
                  ? <span key={`e${i}`} className="px-1 text-[#94A3B8]">…</span>
                  : <button key={p} type="button" aria-current={p === reqCur ? 'page' : undefined} onClick={() => setReqPage(p)} className={`h-9 min-w-9 rounded-lg px-2 text-[13.5px] font-semibold ${p === reqCur ? 'bg-[#16305C] text-white' : 'border border-[#E3E8EF] text-[#1F2937] hover:bg-[#F3F5F9]'}`}>{p}</button>)}
                <button type="button" aria-label="Next page" disabled={reqCur >= reqPages} onClick={() => setReqPage(reqCur + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#1F2937] hover:bg-[#F3F5F9] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <label className="flex items-center gap-2 text-[13.5px] text-[#6B7280]">Show
                <select value={reqPageSize} onChange={(e) => setReqPageSize(Number(e.target.value))} className="h-9 rounded-lg border border-[#E3E8EF] bg-white px-2 text-[13.5px] font-semibold text-[#111827] outline-none">
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                per page
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Map View Tab — every request matching the search / filters, on a map with a live list */}
        <TabsContent value="map" className="mt-0">
          {activeTab === 'map' && (
            <ServiceRequestsMap
              requests={mapRequests}
              loading={mapLoading}
              selectedId={mapSel}
              onSelect={setMapSel}
              mechanicInfo={(id) => { const m = id ? mechanics.find((x) => x._id === id) : undefined; return m ? { rating: m.rating || undefined, jobs: m.completedServices || undefined } : undefined }}
              onView={(r) => setSelectedRequest(r)}
              onAssign={(r) => handleOpenAssignDialog(r)}
              renderMenu={rowMenu}
              displayId={generateDisplayRequestId}
              formatCurrency={formatCurrency}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
            />
          )}
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
                    onClick={() => setMechFormState({ open: true, mode: 'create' })}
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mechanic.isVerified ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">Verified</span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">Pending verification</span>
                        )}
                        {mechanic.registrationSource === 'self' && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10.5px] font-semibold text-sky-700" title="Registered by the mechanic from the website">Self-registered</span>
                        )}
                        {mechanic.franchise?.name && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10.5px] font-semibold text-teal-700" title="Added and managed by this franchise">Franchise · {mechanic.franchise.name}</span>
                        )}
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
                    {!mechanic.isVerified && (
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={verifyingId === mechanic._id}
                        onClick={() => handleVerifyMechanic(mechanic._id)}
                      >
                        {verifyingId === mechanic._id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                        Verify
                      </Button>
                    )}
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
                ) : assignPool.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-[#1A1D29] mb-1">No Service Requests Found</h3>
                    <p className="text-[#6B7280] text-sm">No service requests have been loaded from the API yet.</p>
                  </div>
                ) : assignPool.filter(r => r.status === 'pending' && !r.mechanic && !r.shopPartner).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-[#1A1D29] mb-1">All Requests Assigned</h3>
                    <p className="text-[#6B7280] text-sm">No pending requests waiting for mechanic assignment.</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {assignPool.filter(r => r.status === 'pending' && !r.mechanic && !r.shopPartner).map((request) => (
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
                        {assignPool.filter(r => !r.mechanic).map((request) => (
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
      {/* Shop-proxy dialog: assign the shop's mechanic / complete with cost */}
      <Dialog open={!!shopDlg} onOpenChange={(open) => { if (!open) setShopDlg(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center"><Store className="h-4 w-4 text-orange-600" /></div>
              {shopDlg?.mode === 'assign' ? 'Assign the shop\'s mechanic' : 'Complete job + record cost'}
            </DialogTitle>
            <DialogDescription>
              On behalf of <b>{shopDlg?.request.shopPartner?.shopName}</b> · request {(shopDlg?.request as any)?.requestId || shopDlg?.request._id.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {shopDlg?.mode === 'assign' ? (
            <div className="py-2 space-y-4">
              <div>
                <Label className="text-sm font-medium">Shop&apos;s mechanics</Label>
                {shopDlgLoading ? (
                  <p className="mt-2 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
                ) : shopMechanics.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">This shop has no mechanics listed yet — enter the mechanic&apos;s name and phone below.</p>
                ) : (
                  <div className="scrollbar-admin mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {shopMechanics.map((m) => (
                      <button key={m._id} type="button" onClick={() => setShopMechId(shopMechId === m._id ? '' : m._id)}
                        className={cn('w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors', shopMechId === m._id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#1A1D29]">{m.name}</span>
                          <span className="text-xs text-gray-500">{m.type === 'internal' || m.mechanicType === 'manual' ? 'shop team' : 'platform'}{m.isVerified ? ' · verified' : ''}</span>
                        </div>
                        <div className="text-xs text-gray-500">{m.phone}{m.specializations?.length ? ` · ${m.specializations.slice(0, 3).join(', ')}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={cn('rounded-lg border border-dashed p-3 space-y-2', shopMechId ? 'opacity-50' : '')}>
                <p className="text-xs font-semibold text-gray-600">Or a mechanic the shop named on the phone</p>
                <Input placeholder="Mechanic name" value={shopManual.name} onChange={(e) => { setShopManual({ ...shopManual, name: e.target.value }); setShopMechId('') }} />
                <Input placeholder="Mobile number (10 digits)" inputMode="numeric" value={shopManual.phone} onChange={(e) => { setShopManual({ ...shopManual, phone: e.target.value }); setShopMechId('') }} />
              </div>
              <p className="text-xs text-gray-500">The customer is notified that a mechanic is on the job. If the number belongs to a registered mechanic, the job also appears in their app.</p>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Labour (₹)</Label><Input inputMode="numeric" className="mt-1" value={shopCost.labor} onChange={(e) => setShopCost({ ...shopCost, labor: e.target.value })} placeholder="0" /></div>
                <div><Label className="text-sm">Parts (₹)</Label><Input inputMode="numeric" className="mt-1" value={shopCost.parts} onChange={(e) => setShopCost({ ...shopCost, parts: e.target.value })} placeholder="0" /></div>
              </div>
              <div><Label className="text-sm">Note (optional)</Label><Input className="mt-1" value={shopCost.notes} onChange={(e) => setShopCost({ ...shopCost, notes: e.target.value })} placeholder="e.g. told by owner on WhatsApp" /></div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                Total <b>₹{(Number(shopCost.labor || 0) + Number(shopCost.parts || 0)).toLocaleString('en-IN')}</b>
                {shopDlg?.request.shopPartner?.commissionRate != null && <span className="text-xs text-gray-500"> · platform commission {shopDlg.request.shopPartner.commissionRate}% is deducted, same as the shop panel</span>}
              </div>
              <p className="text-xs text-gray-500">The customer is notified the service is complete. Then use “Payment collected (for shop)” once the shop has been paid.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShopDlg(null)}>Cancel</Button>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a28] text-white" disabled={!!shopDlg && shopBusy(shopDlg.request._id)}
              onClick={shopDlg?.mode === 'assign' ? handleShopAssignConfirm : handleShopCompleteConfirm}>
              {shopDlg && shopBusy(shopDlg.request._id) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {shopDlg?.mode === 'assign' ? 'Assign mechanic' : 'Mark completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignDialog
        open={assignDialogOpen}
        request={assigningRequest}
        mechanics={mechanics ?? []}
        shops={shopsList}
        shopsLoading={shopsLoading}
        displayId={generateDisplayRequestId}
        onClose={closeAssignDialog}
        onAssignShop={assignToShop}
        onAssignMechanic={assignToMechanic}
      />

      {/* ============ SUBMIT DIAGNOSIS ON MECHANIC'S BEHALF ============ */}
      <DiagnosisDialog
        open={diagDialogOpen}
        request={diagRequest}
        onClose={closeDiagnosis}
        onDone={() => { closeDiagnosis(); dispatch(fetchServiceRequestsRequest()); setSelectedRequest(null) }}
      />

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

      {/* ==================== ADD / EDIT MECHANIC — full registration form ==================== */}
      <Dialog open={mechFormState.open} onOpenChange={(open) => { if (!open) setMechFormState({ open: false, mode: 'create' }) }}>
        <DialogContent className="scrollbar-admin max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mechFormState.mode === 'edit' ? 'Edit mechanic' : 'Add mechanic'}</DialogTitle>
            <DialogDescription>
              {mechFormState.mode === 'edit'
                ? 'Update details, documents, bank / UPI and plan. Documents are stored on ImageKit.'
                : 'Full registration — details, documents (ImageKit), bank / UPI and plan. The mechanic logs in with this mobile number (OTP).'}
            </DialogDescription>
          </DialogHeader>
          {mechFormState.open && (
            <MechanicRegistrationForm
              key={`${mechFormState.mode}-${mechFormState.id || 'new'}`}
              mode={mechFormState.mode}
              mechanicId={mechFormState.id}
              embedded
              onCancel={() => setMechFormState({ open: false, mode: 'create' })}
              onDone={() => {
                setMechFormState({ open: false, mode: 'create' })
                dispatch(fetchMechanicsRequest())
              }}
            />
          )}
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

                {/* KYC documents + verification */}
                <div className={cn('rounded-xl p-4 space-y-3 border', selectedMechanic.isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">KYC &amp; verification</h4>
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', selectedMechanic.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                        {selectedMechanic.isVerified ? 'Verified' : 'Pending verification'}
                      </span>
                      {selectedMechanic.registrationSource === 'self' && <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">Self-registered</span>}
                      {selectedMechanic.franchise?.name && <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">Added by franchise · {selectedMechanic.franchise.name}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#6B7280] text-xs">PAN number</p>
                      <p className="font-mono font-medium text-[#1A1D29]">{selectedMechanic.kyc?.panNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280] text-xs">Aadhaar number</p>
                      <p className="font-mono font-medium text-[#1A1D29]">{selectedMechanic.aadhaarNo || '—'}</p>
                    </div>
                    {selectedMechanic.vehicleTypes && selectedMechanic.vehicleTypes.length > 0 && (
                      <div>
                        <p className="text-[#6B7280] text-xs">Vehicle types</p>
                        <p className="font-medium text-[#1A1D29]">{selectedMechanic.vehicleTypes.join(', ')}</p>
                      </div>
                    )}
                    {selectedMechanic.serviceRangeKm != null && (
                      <div>
                        <p className="text-[#6B7280] text-xs">Service range</p>
                        <p className="font-medium text-[#1A1D29]">{selectedMechanic.serviceRangeKm} km</p>
                      </div>
                    )}
                    {selectedMechanic.payoutMethod && (
                      <div>
                        <p className="text-[#6B7280] text-xs">Payout</p>
                        <p className="font-medium text-[#1A1D29]">{selectedMechanic.payoutMethod === 'upi' ? 'UPI' : 'Bank account'}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-[#6B7280] text-xs">Plan &amp; platform fee</p>
                      <p className="font-medium text-[#1A1D29]">
                        {selectedMechanic.planKey ? (selectedMechanic.planKey === 'custom' ? 'Custom' : selectedMechanic.planKey.charAt(0).toUpperCase() + selectedMechanic.planKey.slice(1)) : 'Not set'}
                        {selectedMechanic.commissionRate != null && <> · {selectedMechanic.commissionRate}% fee</>}
                        {selectedMechanic.minWallet != null && <> · min wallet ₹{selectedMechanic.minWallet.toLocaleString('en-IN')}</>}
                        {selectedMechanic.feeCollection && <> · fee via {selectedMechanic.feeCollection === 'cash' ? 'cash' : 'online'}</>}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                      ['Photo', selectedMechanic.kyc?.photo],
                      ['PAN card', selectedMechanic.kyc?.panImage],
                      ['Aadhaar front', selectedMechanic.kyc?.aadhaarFrontImage],
                      ['Aadhaar back', selectedMechanic.kyc?.aadhaarBackImage],
                    ] as [string, string | undefined][]).map(([label, url]) => (
                      <div key={label} className="space-y-1">
                        <p className="text-[11px] text-[#6B7280]">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" title="Open full size" className="block overflow-hidden rounded-lg border border-gray-200 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={label} className="h-20 w-full object-cover" />
                          </a>
                        ) : (
                          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-[11px] text-gray-400">Not uploaded</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!selectedMechanic.isVerified && (
                    <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={verifyingId === selectedMechanic._id}
                      onClick={async () => { await handleVerifyMechanic(selectedMechanic._id); setSelectedMechanic({ ...selectedMechanic, isVerified: true }) }}>
                      {verifyingId === selectedMechanic._id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                      Verify this mechanic
                    </Button>
                  )}
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
                      {(() => {
                        const diagTotal = selectedRequest.diagnosis?.costBreakdown?.totalEstimate;
                        const amtDue = selectedRequest.diagnosis?.costBreakdown?.amountDue;
                        const bkFee = selectedRequest.bookingFee || selectedRequest.diagnosis?.costBreakdown?.bookingFeeAdjusted || 0;
                        const hasSplit = bkFee > 0 && diagTotal && amtDue && amtDue < diagTotal;

                        const isFullyPaid = ['paid', 'settled'].includes(selectedRequest.status);
                        return hasSplit ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B7280]">Total</span>
                              <span className="text-sm font-bold text-[#1B3B6F]">{formatCurrency(diagTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-green-600 font-medium">✓ Booking Fee (Paid Online)</span>
                              <span className="text-sm font-medium text-green-600">₹{bkFee}</span>
                            </div>
                            <div className={`flex items-center justify-between ${isFullyPaid ? 'bg-green-50' : 'bg-amber-50'} rounded-lg px-2 py-1.5 -mx-1`}>
                              <span className={`text-xs font-bold ${isFullyPaid ? 'text-green-700' : 'text-[#1B3B6F]'}`}>
                                {isFullyPaid ? '✓ COD Collected' : 'Balance Due (COD)'}
                              </span>
                              <span className={`text-sm font-bold ${isFullyPaid ? 'text-green-700' : 'text-[#1B3B6F]'}`}>{formatCurrency(amtDue)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#6B7280]">{diagTotal ? 'Diagnosis Total' : 'Estimated'}</span>
                            <span className="text-sm font-bold text-[#1B3B6F]">{formatCurrency(diagTotal || selectedRequest.finalCost || selectedRequest.totalCost || selectedRequest.estimatedCost || 0)}</span>
                          </div>
                        );
                      })()}
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

                {/* The company's virtual number: send it to both sides, connect them, calls so far */}
                <RequestCallPanel requestId={selectedRequest._id} status={selectedRequest.status} />

                {/* Accept on the mechanic's behalf — for mechanics without a smartphone. */}
                {['assigned', 'mechanic_assigned'].includes(selectedRequest.status) && selectedRequest.mechanic && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3" /> Accept (on mechanic&apos;s behalf)
                    </h4>
                    <p className="text-xs text-[#6B7280] mb-3">
                      <b>{selectedRequest.mechanic.name}</b> doesn&apos;t use the app? Accept here — the customer gets the same
                      &quot;Mechanic Accepted&quot; notification as normal. Then use <b>Mark On Way</b> from the actions menu and
                      submit the quotation from this panel when the mechanic tells you the estimate.
                    </p>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => handleAcceptOnBehalf(selectedRequest)}
                      disabled={acceptingId === selectedRequest._id}
                    >
                      {acceptingId === selectedRequest._id
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                      Accept on behalf
                    </Button>
                  </div>
                )}

                {/* Submit / revise the quotation on the mechanic's behalf. After
                    approval, adding/removing items sends it back to the customer. */}
                {['accepted', 'on_way', 'diagnosis', 'approved', 'in_progress'].includes(selectedRequest.status) && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Search className="h-3 w-3" /> Quotation (on mechanic&apos;s behalf)
                    </h4>
                    <p className="text-xs text-[#6B7280] mb-3">
                      {DIAG_AFTER_APPROVAL_STATUSES.includes(selectedRequest.status)
                        ? 'Customer already approved. Add or remove parts/labour here — the customer must approve the revised quote again before work continues (if they decline, the earlier approved quote stays).'
                        : selectedRequest.status === 'diagnosis'
                          ? 'Quotation already sent to the customer. You can revise it here if the mechanic asks.'
                          : "If the mechanic can't submit the quotation from the app, enter it here — the customer gets it for approval exactly as normal."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleOpenDiagnosis(selectedRequest)}
                      >
                        {DIAG_AFTER_APPROVAL_STATUSES.includes(selectedRequest.status)
                          ? <Edit className="h-3.5 w-3.5 mr-1.5" />
                          : <Search className="h-3.5 w-3.5 mr-1.5" />}
                        {DIAG_AFTER_APPROVAL_STATUSES.includes(selectedRequest.status)
                          ? 'Add / remove items'
                          : selectedRequest.status === 'diagnosis' ? 'Revise quotation' : 'Submit diagnosis'}
                      </Button>
                      {selectedRequest.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                          onClick={() => handleCompleteOnBehalf(selectedRequest)}
                          disabled={proxyBusy === selectedRequest._id}
                        >
                          {proxyBusy === selectedRequest._id
                            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                          Complete work (on behalf)
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer decision recorded by admin — when the customer confirms
                    on the phone / in person instead of tapping in the app. */}
                {selectedRequest.status === 'diagnosis' && selectedRequest.diagnosis?.diagnosedAt && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Customer decision (on customer&apos;s behalf)
                    </h4>
                    <p className="text-xs text-[#6B7280] mb-3">
                      Quote of <b>₹{selectedRequest.diagnosis.costBreakdown?.totalEstimate ?? 0}</b> is waiting for the customer.
                      If they confirmed with you directly, record it here — same flow and notifications as the app.
                      {(selectedRequest.diagnosis.revisions || []).some((r) => r.outcome === 'pending') && (
                        <> This is a <b>revised</b> quote — declining keeps the earlier approved quote and work continues.</>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApproveQuoteOnBehalf(selectedRequest)}
                        disabled={proxyBusy === selectedRequest._id}
                      >
                        {proxyBusy === selectedRequest._id
                          ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                        Approve for customer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleRejectQuoteOnBehalf(selectedRequest)}
                        disabled={proxyBusy === selectedRequest._id}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Reject for customer
                      </Button>
                    </div>
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
                        <span className="text-[#6B7280]">
                          Labor Cost
                          {selectedRequest.diagnosis.serviceWarranty && (
                            <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.5">
                              Guarantee: {selectedRequest.diagnosis.serviceWarranty}
                            </span>
                          )}
                        </span>
                        <span className="font-medium">₹{selectedRequest.diagnosis.costBreakdown?.laborCost || 0}</span>
                      </div>
                      {selectedRequest.diagnosis.costBreakdown?.parts?.map((part: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs gap-2">
                          <span className="text-[#6B7280] min-w-0">
                            {part.name} x{part.quantity || 1}
                            {part.warranty && (
                              <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.5">
                                Warranty: {part.warranty}
                              </span>
                            )}
                          </span>
                          <span className="font-medium shrink-0">₹{part.cost * (part.quantity || 1)}</span>
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
                      {(selectedRequest.diagnosis.costBreakdown?.bookingFeeAdjusted || 0) > 0 && (
                        <div className="flex justify-between text-xs bg-green-50 rounded-lg px-2 py-1.5 mt-1">
                          <span className="text-green-700 font-medium">✓ Booking Fee (Paid Online)</span>
                          <span className="font-semibold text-green-600">₹{selectedRequest.diagnosis.costBreakdown?.bookingFeeAdjusted}</span>
                        </div>
                      )}
                      {(selectedRequest.diagnosis.costBreakdown?.onlinePaidAmount || 0) > 0 && (
                        <div className="flex justify-between text-xs bg-blue-50 rounded-lg px-2 py-1.5 mt-1">
                          <span className="text-blue-700 font-medium">✓ Online Payment (Paid)</span>
                          <span className="font-semibold text-blue-600">₹{selectedRequest.diagnosis.costBreakdown?.onlinePaidAmount}</span>
                        </div>
                      )}
                      {((selectedRequest.diagnosis.costBreakdown?.bookingFeeAdjusted || 0) > 0 || (selectedRequest.diagnosis.costBreakdown?.onlinePaidAmount || 0) > 0) && (
                        <div className="flex justify-between text-sm font-bold bg-amber-100 rounded-lg px-2 py-2 mt-1">
                          <span className="text-amber-800">Balance Due (COD)</span>
                          <span className="text-amber-700 text-base">₹{selectedRequest.diagnosis.costBreakdown?.amountDue ?? selectedRequest.diagnosis.costBreakdown?.totalEstimate ?? 0}</span>
                        </div>
                      )}
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
                    {(selectedRequest.diagnosis.revisions || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200 space-y-1.5">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Changes after approval</p>
                        {selectedRequest.diagnosis.revisions!.map((r, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                            <span className="text-[#6B7280] min-w-0">
                              {new Date(r.revisedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · by {r.revisedBy}
                              {r.reason ? ` · ${r.reason}` : ''}
                              {r.outcome === 'declined' && r.declineReason ? ` · declined: ${r.declineReason}` : ''}
                            </span>
                            <span className={`shrink-0 font-semibold px-1.5 py-0.5 rounded ${
                              r.outcome === 'approved' ? 'bg-green-100 text-green-700'
                                : r.outcome === 'declined' ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              ₹{r.previousTotal} → ₹{r.newTotal} · {r.outcome}
                            </span>
                          </div>
                        ))}
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

                {/* Booking Fee Details */}
                {(selectedRequest.bookingFee ?? 0) > 0 && (
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <h4 className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" /> Booking Fee
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Amount</span>
                        <span className="font-medium">₹{selectedRequest.bookingFee}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Status</span>
                        <span className={`font-medium px-2 py-0.5 rounded ${
                          selectedRequest.bookingFeeStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          selectedRequest.bookingFeeStatus === 'refunded' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(selectedRequest.bookingFeeStatus || 'NOT SET').toUpperCase()}
                        </span>
                      </div>
                      {selectedRequest.bookingFeeStatus === 'paid' && (selectedRequest.diagnosis?.costBreakdown?.bookingFeeAdjusted ?? 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Adjusted in Diagnosis</span>
                          <span className="font-medium text-green-600">Yes (₹{selectedRequest.diagnosis?.costBreakdown?.bookingFeeAdjusted} adjusted)</span>
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

                {(() => {
                  // Compute payment values outside JSX for clarity
                  const diagCB = selectedRequest.diagnosis?.costBreakdown;
                  const serviceTotal = diagCB?.totalEstimate || selectedRequest.totalCost || 0;
                  const bookingFee = selectedRequest.bookingFee || diagCB?.bookingFeeAdjusted || 0;
                  const bookingFeePaid = bookingFee > 0 && (selectedRequest.bookingFeeStatus === 'paid' || (diagCB?.bookingFeeAdjusted || 0) > 0);
                  const onlinePaid = diagCB?.onlinePaidAmount || 0;
                  const amountDue = diagCB?.amountDue ?? selectedRequest.finalCost ?? serviceTotal;
                  const isSplit = bookingFeePaid && serviceTotal > 0 && amountDue < serviceTotal;
                  const showPayment = (['completed', 'payment_pending', 'paid', 'payment_refused'] as string[]).includes(selectedRequest.status);

                  return showPayment ? (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Payment
                    </h4>
                    <div className="space-y-2">
                      {isSplit ? (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#6B7280]">Service Total</span>
                            <span className="font-medium text-gray-700">₹{serviceTotal}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600 font-medium">✓ Booking Fee (Paid Online)</span>
                            <span className="font-medium text-green-600">₹{bookingFee}</span>
                          </div>
                          {onlinePaid > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-600 font-medium">✓ Online Payment (Paid)</span>
                              <span className="font-medium text-blue-600">₹{onlinePaid}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs border-t border-green-200 pt-1">
                            <span className={`font-bold ${['paid', 'settled'].includes(selectedRequest.status) ? 'text-green-700' : 'text-[#1B3B6F]'}`}>
                              {['paid', 'settled'].includes(selectedRequest.status) ? '✓ COD Collected' : 'Balance Due (COD)'}
                            </span>
                            <span className={`font-bold ${['paid', 'settled'].includes(selectedRequest.status) ? 'text-green-700' : 'text-[#1B3B6F]'}`}>₹{amountDue}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B7280]">Final Cost</span>
                          <span className="font-bold text-[#1B3B6F]">₹{amountDue}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Method</span>
                        <span className="font-medium uppercase">
                          {isSplit ? 'ONLINE + COD' : (selectedRequest.paymentDetails?.method || 'COD').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6B7280]">Status</span>
                        <span className={`font-medium px-2 py-0.5 rounded ${
                          selectedRequest.status === 'paid' ? 'bg-green-100 text-green-700' :
                          selectedRequest.cashCollected ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedRequest.status === 'paid' ? 'PAID' : selectedRequest.cashCollected ? 'CASH COLLECTED' : 'PENDING'}
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
                  ) : null;
                })()}

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

      {/* ── Add Service Request: book a job for a customer who phoned in ── */}
      <CreateRequestDialog
        open={addRequestOpen}
        onClose={() => setAddRequestOpen(false)}
        onCreated={() => { setAddRequestOpen(false); dispatch(fetchServiceRequestsRequest()) }}
      />
      </div>
    </div>
  )
}