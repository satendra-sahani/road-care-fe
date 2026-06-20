'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
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
  CalendarClock,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import DiagnosisCard from './DiagnosisCard'
import CallScreen from './CallScreen'

const InlineLiveMap = dynamic(() => import('./InlineLiveMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-2xl bg-gray-100 animate-pulse border border-[#E7ECF3]" />,
})

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

// Vertical-timeline labels (claude-design FLOWLBL). {m} → mechanic first name.
const TL_LABELS: Record<string, { t: string; s: string }> = {
  pending:     { t: 'Requested',           s: 'We received your service request' },
  assigned:    { t: 'Mechanic assigned',   s: '{m} will handle your job' },
  on_way:      { t: 'On the way',          s: '{m} is heading to your location' },
  in_progress: { t: 'Service in progress', s: 'Work is underway' },
  completed:   { t: 'Completed',           s: 'Service finished' },
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
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 1 && diffDays <= 6) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

// One line in a summary card — icon + label on the left, value on the right.
function RevLine({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3.5 py-3 text-[13.5px] ${last ? '' : 'border-b border-[#EEF1F6]'}`}>
      <span className="flex items-center gap-2 text-[#475569] shrink-0 [&>svg]:text-[#1B3B6F] [&>svg]:h-4 [&>svg]:w-4">{icon} {label}</span>
      <b className="font-bold text-[#13203A] text-right max-w-[62%]">{value || '—'}</b>
    </div>
  )
}

// ---- Component ----

export function ServiceDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showCall, setShowCall] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchRequest = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await userServiceAPI.getById(id as string)
      if (res.data.success) setRequest(res.data.data)
      else setError(true)
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-14 w-full rounded-xl mb-5" />
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-52 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </UserLayout>
    )
  }

  // ---- Error state ----
  if (error || !request) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Service request not found</h2>
          <p className="text-muted-foreground mb-4">The request may have been removed or the link is invalid.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/service')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Services
            </Button>
            <Button onClick={fetchRequest} className="bg-[#1B3B6F] hover:bg-[#152d55]">Retry</Button>
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
  const mechFirst = mechanicName ? mechanicName.split(' ')[0] : 'Your mechanic'

  const location = request.location || {}
  const vehicleType = request.vehicle?.type || request.vehicleType || 'bike'
  const VehicleIcon = getVehicleIcon(vehicleType)
  const serviceTypeInfo = getServiceTypeInfo(request.serviceType)

  const estimatedCost = request.estimatedCost || 0
  const totalCost = request.totalCost || 0
  const laborCost = request.laborCost || 0
  const partsCost = request.partsCost || 0
  const emergencyCharges = request.emergencyCharges || 0
  const grandTotal = totalCost || estimatedCost

  const paymentMethod = request.paymentMethod
  const paymentStatus = request.paymentStatus || request.payment?.status || 'pending'
  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending

  const hasLegacyReview = request.customerRating && request.customerRating > 0
  const hasFeedback = !!request.feedback || hasLegacyReview

  const currentStepIdx = STATUS_STEPS.indexOf(status as any)
  const todayStr = new Date().toISOString().split('T')[0]

  const addressText = location.address || request.address || 'Location not available'
  const issuesText = Array.isArray(request.issues) && request.issues.length ? request.issues.join(', ') : ''

  // time stamp for a given step from the request timeline
  const timeAt = (step: string): string => {
    const e = (request.timeline || []).find((x: any) => x.status === step || (step === 'pending' && x.status === 'requested'))
    if (!e) return ''
    try {
      return new Date(e.timestamp || e.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  // status bar config
  const sb = isCancelled
    ? { cls: 'bg-[#fde8e8] text-[#b91c1c]', Icon: XCircle, text: 'This booking was cancelled' }
    : isCompleted
      ? { cls: 'bg-[#E7F6EF] text-[#15936B]', Icon: CheckCircle, text: hasFeedback ? 'Service complete' : 'Service complete · rate your experience below' }
      : status === 'on_way'
        ? { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', Icon: Navigation, text: `${mechFirst} is on the way` }
        : status === 'in_progress'
          ? { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', Icon: Wrench, text: 'Service in progress · work underway' }
          : (status === 'assigned' || status === 'accepted')
            ? { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', Icon: CheckCircle, text: `${mechFirst} will handle your job` }
            : { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', Icon: Clock, text: 'Finding a mechanic for you…' }

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-28 md:pb-10">
        {/* backlink */}
        <button
          onClick={() => router.push('/service')}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#475569] hover:text-[#1B3B6F] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> My requests
        </button>

        {/* header: id + date + badge */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#13203A]">
              {request.requestId || `Service #${(request._id || '').slice(-8).toUpperCase()}`}
            </h1>
            <p className="text-xs text-[#7B8AA3] mt-0.5">{formatRelativeDate(request.createdAt)}</p>
          </div>
          <Badge className={`${statusCfg.bg} ${statusCfg.color} border-none text-xs`}>{statusCfg.label}</Badge>
        </div>

        {/* statbar */}
        <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-sm mb-5 ${sb.cls}`}>
          <sb.Icon className="h-5 w-5 shrink-0" /> <span>{sb.text}</span>
        </div>

        {/* track live location CTA */}
        {(status === 'on_way' || status === 'assigned' || status === 'accepted') && request._id && (
          <button
            onClick={() => router.push(`/service/${request._id}/track`)}
            className="w-full flex items-center gap-3 rounded-2xl p-4 mb-5 text-white transition hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(120deg,#1B3B6F,#2A5298)', boxShadow: '0 10px 26px rgba(27,59,111,.28)' }}
          >
            <span className="h-[42px] w-[42px] rounded-xl bg-white/[0.16] flex items-center justify-center shrink-0"><Navigation className="h-5 w-5" /></span>
            <span className="flex-1 text-left flex flex-col gap-0.5">
              <b className="text-[15px] font-bold">Track live location</b>
              <span className="text-[12.5px] text-white/70">{mechanicName ? `${mechFirst} is on the way` : 'See your mechanic on the map'}</span>
            </span>
            <ChevronRight className="h-5 w-5 opacity-80 shrink-0" />
          </button>
        )}

        {/* completion OTP banner */}
        {isInProgress && request.completionOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Shield className="h-5 w-5 text-amber-600" /></div>
              <div>
                <h4 className="text-sm font-bold text-amber-800">Completion OTP</h4>
                <p className="text-xs text-amber-600 mt-0.5">Share this code with the mechanic to confirm service completion</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {String(request.completionOtp).split('').map((digit: string, idx: number) => (
                <div key={idx} className="h-12 w-12 rounded-lg bg-white border-2 border-amber-300 flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-800">{digit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* cancelled banner */}
        {isCancelled && request.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Request cancelled</p>
              <p className="text-sm text-red-600 mt-1">Reason: {request.cancellationReason}</p>
            </div>
          </div>
        )}

        {/* ── det-grid ── */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          {/* LEFT */}
          <div className="space-y-4">
            {/* inline live map (active jobs) */}
            {(status === 'on_way' || status === 'in_progress') && request._id && (
              <InlineLiveMap requestId={request._id} mechFirst={mechFirst} />
            )}

            {/* mech-card */}
            {mechanicName && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="h-[54px] w-[54px] rounded-[14px] bg-[#1B3B6F] flex items-center justify-center text-white font-extrabold text-lg shrink-0">
                  {mechanicName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <b className="text-[15px] font-extrabold text-[#13203A] flex items-center gap-1.5">
                    <span className="truncate">{mechanicName}</span>
                    <Shield className="h-3.5 w-3.5 text-[#15936B] shrink-0" />
                  </b>
                  <span className="text-[12.5px] text-[#475569]">
                    {mechanic?.specialization || mechanic?.user?.specialization || 'Verified mechanic'}
                    {(mechanic?.rating || mechanic?.user?.rating) ? ` · ★ ${mechanic.rating || mechanic.user?.rating}` : ''}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toast('Chat opens in the app · your number stays private')} className="h-[42px] w-[42px] rounded-xl border-[1.5px] border-[#E7ECF3] bg-white text-[#1B3B6F] flex items-center justify-center hover:bg-gray-50 transition-colors"><MessageCircle className="h-[19px] w-[19px]" /></button>
                  <button onClick={() => setShowCall(true)} className="h-[42px] w-[42px] rounded-xl bg-[#15936B] hover:bg-[#127a59] text-white flex items-center justify-center transition-colors"><Phone className="h-[19px] w-[19px]" /></button>
                </div>
              </div>
            )}

            {/* Service timeline (vertical tl) */}
            {!isCancelled && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5">
                <div className="font-extrabold text-[15px] text-[#13203A] mb-4">Service timeline</div>
                <div className="pl-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = currentStepIdx > idx
                    const now = currentStepIdx === idx
                    const lbl = TL_LABELS[step]
                    const time = timeAt(step)
                    return (
                      <div key={step} className={`relative pl-9 ${idx < STATUS_STEPS.length - 1 ? 'pb-6' : ''}`}>
                        {idx < STATUS_STEPS.length - 1 && (
                          <span className={`absolute left-[9px] top-[22px] -bottom-1 w-0.5 ${done ? 'bg-[#15936B]' : 'bg-[#E7ECF3]'}`} />
                        )}
                        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${done ? 'bg-[#15936B] border-[#15936B]' : now ? 'bg-[#1B3B6F] border-[#1B3B6F] ring-4 ring-[#F2F6FC]' : 'bg-white border-[#E7ECF3]'}`}>
                          {done && <CheckCircle className="h-3 w-3 text-white" />}
                        </span>
                        <div className="flex items-center justify-between gap-2.5">
                          <b className={`text-[14.5px] font-bold ${done || now ? 'text-[#13203A]' : 'text-[#7B8AA3]'}`}>{lbl.t}</b>
                          {time && <time className={`text-[12px] font-bold tabular-nums ${done || now ? 'text-[#1B3B6F]' : 'text-[#7B8AA3]'}`}>{time}</time>}
                        </div>
                        <span className="text-[12.5px] text-[#7B8AA3]">{lbl.s.replace('{m}', mechFirst)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mechanic diagnosis (live) */}
            {(status === 'in_progress' || status === 'diagnosed' || status === 'quote_pending') && request._id && (
              <DiagnosisCard requestId={request._id} onStatusChange={fetchRequest} />
            )}
          </div>

          {/* RIGHT — aside */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* summary sumcard */}
            <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#EEF1F6] font-extrabold text-[15px] text-[#13203A]">
                {serviceTypeInfo.label} · <span className="capitalize">{vehicleType}</span>
              </div>
              <div className="px-4">
                <RevLine icon={<VehicleIcon />} label="Vehicle" value={[request.vehicle?.brand, request.vehicle?.model].filter(Boolean).join(' ') || vehicleType} />
                {issuesText && <RevLine icon={<Wrench />} label="Issues" value={issuesText} />}
                {request.description && <RevLine icon={<MessageCircle />} label="Notes" value={<span className="font-medium text-[#475569]">{request.description}</span>} />}
                {(request.preferredDate || request.preferredTimeSlot) && (
                  <RevLine icon={<Calendar />} label="Schedule" value={`${request.preferredDate ? formatRelativeDate(request.preferredDate) : ''}${request.preferredTimeSlot ? ` · ${request.preferredTimeSlot}` : ''}`} />
                )}
                <RevLine icon={<MapPin />} label="Address" value={addressText} last />
              </div>
            </div>

            {/* fare sumcard */}
            <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-[#EEF1F6] font-extrabold text-[15px] text-[#13203A]">Fare</div>
              <div className="px-4 py-4">
                {estimatedCost > 0 && (
                  <div className="flex items-center justify-between text-[13.5px] text-[#475569] mb-2.5"><span>Estimated cost</span><b className="font-bold text-[#13203A]">₹{estimatedCost.toLocaleString('en-IN')}</b></div>
                )}
                {laborCost > 0 && (
                  <div className="flex items-center justify-between text-[13.5px] text-[#475569] mb-2.5"><span>Labour</span><b className="font-bold text-[#13203A]">₹{laborCost.toLocaleString('en-IN')}</b></div>
                )}
                {partsCost > 0 && (
                  <div className="flex items-center justify-between text-[13.5px] text-[#475569] mb-2.5"><span>Parts</span><b className="font-bold text-[#13203A]">₹{partsCost.toLocaleString('en-IN')}</b></div>
                )}
                {emergencyCharges > 0 && (
                  <div className="flex items-center justify-between text-[13.5px] text-[#475569] mb-2.5"><span>Emergency surcharge</span><b className="font-bold text-[#13203A]">₹{emergencyCharges.toLocaleString('en-IN')}</b></div>
                )}
                {grandTotal > 0 ? (
                  <div className="flex items-center justify-between border-t border-dashed border-[#E7ECF3] mt-1.5 pt-3 text-[17px] font-extrabold text-[#13203A]">
                    <span>Total</span><b className="text-[22px] text-[#1B3B6F]">₹{grandTotal.toLocaleString('en-IN')}</b>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#7B8AA3]">Cost is confirmed by the mechanic after on-site inspection.</p>
                )}
                {paymentMethod && (
                  <div className="mt-3 pt-3 border-t border-[#EEF1F6] space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#7B8AA3]">Payment</span>
                      <span className="font-semibold text-[#13203A] inline-flex items-center gap-1">
                        {paymentMethod === 'online' ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                        {paymentMethod === 'online' ? 'Online' : 'Cash on Delivery'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#7B8AA3]">Status</span>
                      <Badge className={`${paymentStatusCfg.bg} ${paymentStatusCfg.color} border-none text-[11px]`}>{paymentStatusCfg.label}</Badge>
                    </div>
                  </div>
                )}
                {paymentMethod === 'cod' && !isCompleted && !isCancelled && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">Keep cash ready to pay the mechanic when service is done</p>
                  </div>
                )}
              </div>
            </div>

            {/* feedback (completed) OR actions */}
            {isCompleted ? (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-extrabold text-[#13203A] mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-[#F5A623]" /> Service feedback</h3>
                {hasFeedback ? (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-5 w-5 ${star <= (request.customerRating || request.feedback?.rating || 0) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    {(request.customerReview || request.feedback?.review) && (
                      <p className="text-sm text-[#475569] bg-[#F6F8FB] rounded-lg p-3 mt-2 italic">“{request.customerReview || request.feedback?.review}”</p>
                    )}
                    <div className="flex items-center gap-2 mt-2"><CheckCircle className="h-4 w-4 text-[#15936B]" /><p className="text-xs text-[#15936B] font-medium">Thanks for your feedback!</p></div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[#7B8AA3] mb-3">How was your experience?</p>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setFeedbackRating(star)} className="p-0.5 transition-transform hover:scale-110">
                          <Star className={`h-8 w-8 transition-colors ${star <= feedbackRating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300 hover:text-amber-300'}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea value={feedbackReview} onChange={(e) => setFeedbackReview(e.target.value)} placeholder="Share your experience (optional)…" rows={3} className="mb-3" />
                    <Button onClick={handleSubmitFeedback} disabled={feedbackRating === 0 || submittingFeedback} className="w-full bg-[#1B3B6F] hover:bg-[#152d55]">
                      {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />} Submit feedback
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              (canReschedule || canCancel || mechanicName) && (
                <div className="flex flex-col gap-2.5">
                  {mechanicName && (
                    <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 justify-center h-11" onClick={() => setShowCall(true)}>
                      <Phone className="h-4 w-4 mr-2" /> Call mechanic
                    </Button>
                  )}
                  {canReschedule && (
                    <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 justify-center h-11"><CalendarClock className="h-4 w-4 mr-2" /> Reschedule</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Reschedule service</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label htmlFor="reschedule-date">New date *</Label>
                            <Input id="reschedule-date" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} min={todayStr} className="mt-1" />
                          </div>
                          <div>
                            <Label>Preferred time</Label>
                            <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select time slot" /></SelectTrigger>
                              <SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setRescheduleOpen(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleReschedule} disabled={!rescheduleDate || rescheduling} className="flex-1 bg-[#1B3B6F] hover:bg-[#152d55]">
                              {rescheduling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />} Reschedule
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {canCancel && (
                    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 justify-center h-11"><XCircle className="h-4 w-4 mr-2" /> Cancel booking</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Cancel service request</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">Are you sure you want to cancel this service request? This action cannot be undone.</p>
                          </div>
                          <div>
                            <Label htmlFor="cancel-reason">Reason (optional)</Label>
                            <Textarea id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Tell us why you want to cancel…" rows={3} className="mt-1" />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setCancelOpen(false)} className="flex-1">Keep request</Button>
                            <Button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />} Yes, cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Full-screen call screen */}
      {showCall && mechanicName && (
        <CallScreen
          name={mechanicName}
          role={mechanic?.specialization || mechanic?.user?.specialization || 'Verified mechanic'}
          rating={mechanic?.rating || mechanic?.user?.rating}
          color="#1B3B6F"
          phone={mechanicPhone || undefined}
          address={location.address || request.address}
          onClose={() => setShowCall(false)}
        />
      )}
    </UserLayout>
  )
}
