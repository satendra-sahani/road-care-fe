'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { userServiceAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Wrench,
  Home,
  AlertTriangle,
  Building2,
  Car,
  Bike,
  Truck,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Phone,
  Star,
  CreditCard,
  Banknote,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  IndianRupee,
  FileText,
  CalendarClock,
} from 'lucide-react'

// ---- Constants ----

const STATUS_STEPS = ['pending', 'assigned', 'on_way', 'in_progress', 'completed'] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: 'Pending',          color: 'text-amber-700',  bg: 'bg-amber-100',  dot: 'bg-amber-500' },
  assigned:    { label: 'Assigned',         color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  accepted:    { label: 'Accepted',         color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  on_way:      { label: 'Mechanic On Way',  color: 'text-violet-700', bg: 'bg-violet-100', dot: 'bg-violet-500' },
  in_progress: { label: 'In Progress',      color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-[#FF6B35]' },
  completed:   { label: 'Completed',        color: 'text-green-700',  bg: 'bg-green-100',  dot: 'bg-green-500' },
  cancelled:   { label: 'Cancelled',        color: 'text-red-700',    bg: 'bg-red-100',    dot: 'bg-red-500' },
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid:          { label: 'Paid',           color: 'text-green-700',  bg: 'bg-green-100' },
  verified:      { label: 'Paid',           color: 'text-green-700',  bg: 'bg-green-100' },
  cod_collected: { label: 'Cash Collected', color: 'text-green-700',  bg: 'bg-green-100' },
  settled:       { label: 'Settled',        color: 'text-green-700',  bg: 'bg-green-100' },
  initiated:     { label: 'Initiated',      color: 'text-blue-700',   bg: 'bg-blue-100' },
  pending:       { label: 'Pending',        color: 'text-amber-700',  bg: 'bg-amber-100' },
  failed:        { label: 'Failed',         color: 'text-red-700',    bg: 'bg-red-100' },
  refunded:      { label: 'Refunded',       color: 'text-purple-700', bg: 'bg-purple-100' },
  cancelled:     { label: 'Cancelled',      color: 'text-red-700',    bg: 'bg-red-100' },
}

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
]

// ---- Helpers ----

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffMs = today.getTime() - target.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getServiceTypeInfo(serviceType: string) {
  switch (serviceType) {
    case 'home':     return { label: 'Home Service',          icon: Home,          desc: 'Mechanic visits your location' }
    case 'roadside': return { label: 'Roadside Assistance',   icon: AlertTriangle, desc: 'Emergency help on the road' }
    case 'walkin':   return { label: 'Walk-in Service',       icon: Building2,     desc: 'Visit our workshop' }
    default:         return { label: serviceType || 'Service', icon: Wrench,        desc: '' }
  }
}

function getVehicleIcon(vehicleType: string) {
  switch (vehicleType?.toLowerCase()) {
    case 'car':     return Car
    case 'bike':    return Bike
    case 'scooter': return Bike
    case 'auto':    return Truck
    default:        return Car
  }
}

function getPriorityBadge(priority: string) {
  const p = priority?.toLowerCase() || 'normal'
  if (p === 'high' || p === 'urgent' || p === 'critical') {
    return { color: 'text-red-700', bg: 'bg-red-100' }
  }
  if (p === 'medium') {
    return { color: 'text-amber-700', bg: 'bg-amber-100' }
  }
  return { color: 'text-blue-700', bg: 'bg-blue-100' }
}

// ---- Component ----

export function ServiceDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Reschedule dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)

  // Feedback
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackReview, setFeedbackReview] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchRequest()
  }, [id])

  const fetchRequest = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await userServiceAPI.getById(id as string)
      if (res.data.success) {
        setRequest(res.data.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
      toast.error('Failed to load service request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await userServiceAPI.cancel(id as string, cancelReason || 'Cancelled by customer')
      if (res.data.success) {
        toast.success('Service request cancelled')
        setCancelOpen(false)
        setCancelReason('')
        fetchRequest()
      } else {
        toast.error(res.data.message || 'Failed to cancel')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request')
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast.error('Please select a date')
      return
    }
    setRescheduling(true)
    try {
      const res = await userServiceAPI.reschedule(id as string, {
        preferredDate: rescheduleDate,
        preferredTimeSlot: rescheduleTime || undefined,
      })
      if (res.data.success) {
        toast.success('Service request rescheduled')
        setRescheduleOpen(false)
        setRescheduleDate('')
        setRescheduleTime('')
        fetchRequest()
      } else {
        toast.error(res.data.message || 'Failed to reschedule')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule')
    } finally {
      setRescheduling(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast.error('Please select a rating')
      return
    }
    setSubmittingFeedback(true)
    try {
      const res = await userServiceAPI.addReview(id as string, {
        rating: feedbackRating,
        review: feedbackReview.trim() || undefined,
      })
      if (res.data.success) {
        toast.success('Thank you for your feedback!')
        fetchRequest()
      } else {
        toast.error(res.data.message || 'Failed to submit feedback')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl mb-4" />
          <Skeleton className="h-40 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl mb-4" />
          <Skeleton className="h-28 w-full rounded-xl mb-4" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </UserLayout>
    )
  }

  // ---- Error state ----
  if (error || !request) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-16 text-center max-w-3xl">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Service request not found</h2>
          <p className="text-muted-foreground mb-4">The request may have been removed or the link is invalid.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/service')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services
            </Button>
            <Button onClick={fetchRequest} className="bg-[#1B3B6F] hover:bg-[#152d55]">
              Retry
            </Button>
          </div>
        </div>
      </UserLayout>
    )
  }

  // ---- Data extraction ----
  const status = request.status?.toLowerCase() || 'pending'
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const isCancelled = status === 'cancelled'
  const canCancel = status === 'pending' || status === 'assigned'
  const canReschedule = status === 'pending' || status === 'assigned'
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in_progress'

  const mechanic = request.assignedMechanic || request.mechanic
  const mechanicName = mechanic?.fullName || mechanic?.user?.fullName || mechanic?.name || null
  const mechanicPhone = mechanic?.phone || mechanic?.user?.phone || null

  const location = request.location || {}
  const vehicleType = request.vehicle?.type || request.vehicleType || 'bike'
  const VehicleIcon = getVehicleIcon(vehicleType)
  const serviceTypeInfo = getServiceTypeInfo(request.serviceType)
  const ServiceTypeIcon = serviceTypeInfo.icon
  const priorityCfg = getPriorityBadge(request.priority)

  const estimatedCost = request.estimatedCost || 0
  const totalCost = request.totalCost || 0
  const laborCost = request.laborCost || 0
  const partsCost = request.partsCost || 0
  const emergencyCharges = request.emergencyCharges || 0
  const hasPricing = estimatedCost > 0 || totalCost > 0

  const paymentMethod = request.paymentMethod
  const paymentStatus = request.paymentStatus || request.payment?.status || 'pending'
  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending

  const hasLegacyReview = request.customerRating && request.customerRating > 0
  const hasFeedback = !!request.feedback || hasLegacyReview

  const currentStepIdx = STATUS_STEPS.indexOf(status as any)

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl pb-32 md:pb-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/service')}
              className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {request.requestId || `#${(request._id || '').slice(-8).toUpperCase()}`}
              </h1>
              <p className="text-xs text-muted-foreground">{formatRelativeDate(request.createdAt)}</p>
            </div>
          </div>
          <Badge className={`${statusCfg.bg} ${statusCfg.color} border-none text-xs`}>
            {statusCfg.label}
          </Badge>
        </div>

        {/* ── Status Timeline ── */}
        {!isCancelled && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1B3B6F]" /> Status Timeline
            </h3>
            <div className="flex items-start justify-between relative">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = currentStepIdx >= idx
                const isCurrent = currentStepIdx === idx
                const stepCfg = STATUS_CONFIG[step] || STATUS_CONFIG.pending
                return (
                  <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent
                          ? `${stepCfg.dot} border-[#FF6B35] ring-2 ring-[#FF6B35]/30 text-white`
                          : isActive
                            ? `${stepCfg.dot} border-transparent text-white`
                            : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                    >
                      {isActive && idx <= currentStepIdx ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-1.5 text-center leading-tight ${
                      isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {stepCfg.label.split(' ').slice(0, 2).join(' ')}
                    </p>
                    {/* Connecting line */}
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 left-[calc(50%+16px)] h-0.5 transition-colors ${
                          currentStepIdx > idx ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                        style={{ width: 'calc(100% - 32px)' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Request Cancelled</p>
              {request.cancellationReason && (
                <p className="text-sm text-red-600 mt-1">Reason: {request.cancellationReason}</p>
              )}
              {request.cancelledBy && (
                <p className="text-xs text-red-500 mt-1">Cancelled by: {request.cancelledBy}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Completion OTP Banner ── */}
        {isInProgress && request.completionOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-800">Completion OTP</h4>
                <p className="text-xs text-amber-600 mt-0.5">
                  Share this code with the mechanic to confirm service completion
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              {request.completionOtp.split('').map((digit: string, idx: number) => (
                <div
                  key={idx}
                  className="h-12 w-12 rounded-lg bg-white border-2 border-amber-300 flex items-center justify-center"
                >
                  <span className="text-xl font-bold text-amber-800">{digit}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              <p className="text-xs text-amber-700">
                Only share this OTP when you are satisfied with the service
              </p>
            </div>
          </div>
        )}

        {/* ── Service Info Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#1B3B6F]" /> Service Information
          </h3>

          <div className="space-y-3">
            {/* Service type */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center">
                <ServiceTypeIcon className="h-5 w-5 text-[#1B3B6F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{serviceTypeInfo.label}</p>
                {serviceTypeInfo.desc && (
                  <p className="text-xs text-muted-foreground">{serviceTypeInfo.desc}</p>
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vehicle Type</span>
              <div className="flex items-center gap-2">
                <VehicleIcon className="h-4 w-4 text-[#1B3B6F]" />
                <span className="text-sm font-medium capitalize">{vehicleType}</span>
              </div>
            </div>

            {/* Vehicle brand / model */}
            {(request.vehicle?.brand || request.vehicle?.model) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vehicle</span>
                <span className="text-sm font-medium">
                  {[request.vehicle?.brand, request.vehicle?.model, request.vehicle?.year]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              </div>
            )}

            {/* Registration */}
            {request.vehicle?.registrationNumber && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reg. Number</span>
                <span className="text-sm font-medium">{request.vehicle.registrationNumber}</span>
              </div>
            )}

            {/* Category */}
            {request.serviceCategory && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium">{request.serviceCategory}</span>
              </div>
            )}

            {/* Description */}
            {request.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{request.description}</p>
              </div>
            )}

            {/* Issues */}
            {request.issues && request.issues.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-muted-foreground mb-2">Reported Issues</p>
                <div className="flex flex-wrap gap-1.5">
                  {request.issues.map((issue: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {request.preferredDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Preferred Date
                  </span>
                  <span className="text-sm font-medium">{formatRelativeDate(request.preferredDate)}</span>
                </div>
              )}
              {request.preferredTimeSlot && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Preferred Time
                  </span>
                  <span className="text-sm font-medium">{request.preferredTimeSlot}</span>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Badge className={`${priorityCfg.bg} ${priorityCfg.color} border-none text-xs`}>
                {(request.priority || 'normal').toUpperCase()}
              </Badge>
            </div>

            {/* Emergency */}
            {request.isEmergency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emergency</span>
                <Badge className="bg-red-100 text-red-700 border-none text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" /> YES
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* ── Location Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#1B3B6F]" /> Service Location
          </h3>
          <p className="text-sm text-foreground font-medium">
            {location.address || request.address || 'Location not available'}
          </p>
          {location.landmark && (
            <div className="flex items-center gap-1.5 mt-2">
              <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Landmark: {location.landmark}</p>
            </div>
          )}
          {(location.city || location.state || location.pincode) && (
            <p className="text-xs text-muted-foreground mt-1">
              {[location.city, location.state, location.pincode].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* ── Pricing Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-[#1B3B6F]" /> Pricing & Payment
          </h3>

          {hasPricing ? (
            <div className="space-y-2">
              {estimatedCost > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="font-medium">
                    {'\u20B9'}{estimatedCost.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {laborCost > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Labor Cost</span>
                  <span className="font-medium">
                    {'\u20B9'}{laborCost.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {partsCost > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Parts Cost</span>
                  <span className="font-medium">
                    {'\u20B9'}{partsCost.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {emergencyCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Emergency Charges</span>
                  <span className="font-medium text-red-600">
                    {'\u20B9'}{emergencyCharges.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {totalCost > 0 && (
                <>
                  <hr className="my-2 border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">Total Cost</span>
                    <span className="text-base font-bold text-[#1B3B6F]">
                      {'\u20B9'}{totalCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cost will be updated by the mechanic after inspection
            </p>
          )}

          {/* Payment method & status */}
          {paymentMethod && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <Badge className={`border-none text-xs ${
                  paymentMethod === 'online'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {paymentMethod === 'online' ? (
                    <><CreditCard className="h-3 w-3 mr-1" /> Online</>
                  ) : (
                    <><Banknote className="h-3 w-3 mr-1" /> Cash on Delivery</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Badge className={`${paymentStatusCfg.bg} ${paymentStatusCfg.color} border-none text-xs`}>
                  {paymentStatusCfg.label}
                </Badge>
              </div>
            </div>
          )}

          {/* COD reminder */}
          {paymentMethod === 'cod' && !isCompleted && !isCancelled && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                Keep cash ready to pay the mechanic when service is done
              </p>
            </div>
          )}
        </div>

        {/* ── Mechanic Card ── */}
        {mechanicName && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[#1B3B6F]" /> Assigned Mechanic
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#1B3B6F] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {mechanicName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{mechanicName}</p>
                {mechanicPhone && (
                  <p className="text-xs text-muted-foreground">{mechanicPhone}</p>
                )}
              </div>
              {mechanicPhone && (
                <button
                  onClick={() => window.open(`tel:${mechanicPhone}`, '_self')}
                  className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <Phone className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Status History / Timeline ── */}
        {request.timeline && request.timeline.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#1B3B6F]" /> Status History
            </h3>
            <div className="space-y-0">
              {request.timeline.map((entry: any, idx: number) => {
                const entryCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
                const isLast = idx === request.timeline.length - 1
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full ${entryCfg.dot} shrink-0 mt-1`} />
                      {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                      <p className="text-sm font-medium text-foreground">{entryCfg.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFullDate(entry.timestamp || entry.changedAt)}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Feedback Section (Completed only) ── */}
        {isCompleted && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Service Feedback
            </h3>

            {hasFeedback ? (
              <div>
                {/* Show existing rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (request.customerRating || request.feedback?.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                    {request.customerRating || request.feedback?.rating || 0}/5
                  </span>
                </div>
                {(request.customerReview || request.feedback?.review) && (
                  <p className="text-sm text-foreground bg-gray-50 rounded-lg p-3 mt-2">
                    {request.customerReview || request.feedback?.review}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-green-600 font-medium">Feedback submitted</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  How was your experience? Rate the service below.
                </p>

                {/* Star rating input */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= feedbackRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  {feedbackRating > 0 && (
                    <span className="text-sm font-medium text-amber-600 ml-2">
                      {feedbackRating}/5
                    </span>
                  )}
                </div>

                {/* Review text */}
                <Textarea
                  value={feedbackReview}
                  onChange={(e) => setFeedbackReview(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  rows={3}
                  className="mb-3"
                />

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackRating === 0 || submittingFeedback}
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55]"
                >
                  {submittingFeedback ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  Submit Feedback
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons ── */}
        {(canCancel || canReschedule || mechanicPhone) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Call Mechanic */}
            {mechanicPhone && (
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => window.open(`tel:${mechanicPhone}`, '_self')}
              >
                <Phone className="h-4 w-4 mr-2" /> Call Mechanic
              </Button>
            )}

            {/* Reschedule */}
            {canReschedule && (
              <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <CalendarClock className="h-4 w-4 mr-2" /> Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reschedule Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="reschedule-date">New Date *</Label>
                      <Input
                        id="reschedule-date"
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        min={todayStr}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Preferred Time</Label>
                      <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setRescheduleOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReschedule}
                        disabled={!rescheduleDate || rescheduling}
                        className="flex-1 bg-[#1B3B6F] hover:bg-[#152d55]"
                      >
                        {rescheduling ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CalendarClock className="h-4 w-4 mr-2" />
                        )}
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Cancel */}
            {canCancel && (
              <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cancel Service Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        Are you sure you want to cancel this service request? This action cannot be undone.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="cancel-reason">Reason (optional)</Label>
                      <Textarea
                        id="cancel-reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Tell us why you want to cancel..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setCancelOpen(false)}
                        className="flex-1"
                      >
                        Keep Request
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {cancelling ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Yes, Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  )
}
