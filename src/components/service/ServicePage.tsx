'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { userServiceAPI, servicePricingAPI, userPaymentAPI, userAddressAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import CallScreen from '@/components/service/CallScreen'
import RatingFlow from '@/components/service/RatingFlow'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import {
  Wrench, Calendar, Clock, MapPin, Car, Bike, Truck as TruckIcon,
  CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft, Phone, Star, Building2,
  Navigation, ArrowLeft, CreditCard, Banknote, Shield,
  User, XCircle, RefreshCw,
} from 'lucide-react'

declare global {
  interface Window { Razorpay: any }
}

const vehicleTypes = [
  { value: 'car', label: 'Car', icon: Car, emoji: '🚗' },
  { value: 'bike', label: 'Bike', icon: Bike, emoji: '🏍️' },
  { value: 'scooter', label: 'Scooter', icon: Bike, emoji: '🛵' },
  { value: 'auto', label: 'Auto', icon: TruckIcon, emoji: '🛺' },
]

const serviceTypes = [
  { value: 'home', label: 'Home Service', desc: 'Mechanic visits your location', icon: Wrench, color: 'bg-blue-500' },
  { value: 'roadside', label: 'Roadside Assistance', desc: 'Emergency help on the road', icon: AlertCircle, color: 'bg-red-500' },
  { value: 'walkin', label: 'Walk-in Service', desc: 'Visit our workshop', icon: Building2, color: 'bg-green-500' },
]

const timeSlots = [
  { label: '9 – 11 AM', sub: 'Morning' },
  { label: '11 – 1 PM', sub: 'Late morning' },
  { label: '1 – 3 PM', sub: 'Afternoon' },
  { label: '3 – 5 PM', sub: 'Late afternoon' },
  { label: '5 – 7 PM', sub: 'Evening' },
  { label: '7 – 9 PM', sub: 'Night' },
]

// Vehicle sub-labels — small text under each vehicle tile (claude-design)
const vehicleSubs: Record<string, string> = {
  car: 'Hatch / Sedan / SUV', bike: 'Motorcycle', scooter: 'Scooter / Moped', auto: '3-wheeler',
}

// Quick problem suggestions — tap to add to the description (saves typing)
const problemChips = [
  "Won't start", 'Battery dead', 'Flat / puncture tyre', 'Brake problem', 'Engine noise',
  'AC not cooling', 'Overheating', 'Oil / service due', 'Clutch / gear issue', 'Electrical / lights',
]

const pad2 = (n: number) => (n < 10 ? '0' : '') + n
const isoOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** Compact month calendar — faithful to claude-design `.cal` / renderCal(). */
function MonthCalendar({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const maxD = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60)
  const sel = value ? new Date(value + 'T00:00:00') : today
  const [view, setView] = useState(new Date(sel.getFullYear(), sel.getMonth(), 1))
  const mons = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dows = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const startDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay()
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const viewFirst = +new Date(view.getFullYear(), view.getMonth(), 1)
  const prevDis = viewFirst <= +new Date(today.getFullYear(), today.getMonth(), 1)
  const nextDis = viewFirst >= +new Date(maxD.getFullYear(), maxD.getMonth(), 1)
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let dn = 1; dn <= dim; dn++) cells.push(new Date(view.getFullYear(), view.getMonth(), dn))
  const selFull = sel.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="border-[1.5px] border-[#E7ECF3] rounded-2xl p-3.5 pb-1.5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <button type="button" disabled={prevDis} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#475569] disabled:opacity-30 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
        <div className="text-sm font-bold text-[#13203A]">{mons[view.getMonth()]} {view.getFullYear()}</div>
        <button type="button" disabled={nextDis} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#475569] disabled:opacity-30 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] font-bold text-[#7B8AA3]">{dows.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const iso = isoOf(d)
          const dis = +d < +today || +d > +maxD
          const on = iso === value
          const isToday = +d === +today
          return (
            <button key={i} type="button" disabled={dis} onClick={() => onChange(iso)}
              className={`h-9 rounded-lg text-[13px] font-semibold transition disabled:opacity-25 disabled:cursor-not-allowed ${on ? 'bg-[#1B3B6F] text-white' : isToday ? 'text-[#1B3B6F] bg-[#EEF3FB]' : 'text-[#475569] hover:bg-gray-50'}`}>
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 text-[12.5px] text-[#475569] py-2.5 mt-1 border-t border-[#EEF1F6]"><Calendar className="h-3.5 w-3.5 text-[#1B3B6F]" />{selFull}</div>
    </div>
  )
}

function RevLine({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3.5 py-3 text-[13.5px] ${last ? '' : 'border-b border-[#EEF1F6]'}`}>
      <span className="flex items-center gap-2 text-[#475569] shrink-0 [&>svg]:text-[#1B3B6F]">{icon} {label}</span>
      <b className="font-bold text-[#13203A] text-right max-w-[62%]">{value || '—'}</b>
    </div>
  )
}

export function ServicePage() {
  const router = useRouter()
  const { openLogin } = useLoginModal()
  const { isAuthenticated, user, loading: authLoading } = useSelector((state: RootState) => state.customerAuth)

  // Prompt login automatically when a logged-out user lands on the booking page —
  // the modal opens over the (blurred) booking page; closing it lets them browse.
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !Cookies.get('customer_token')) openLogin()
  }, [authLoading, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab] = useState<'book' | 'requests'>('book')

  // ─── Call screen + rating overlays (claude-design) ────────────
  const [callTarget, setCallTarget] = useState<{ name: string; phone?: string } | null>(null)
  const [ratingReq, setRatingReq] = useState<any>(null)

  // ─── Book Service state ───────────────────────────────────────
  const [step, setStep] = useState(1) // 1: Vehicle & Issues, 2: Details & Schedule, 3: Payment & Confirm
  const [vehicleType, setVehicleType] = useState('')
  const [serviceType, setServiceType] = useState('home')
  const [pricingData, setPricingData] = useState<any>(null)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [otherIssue, setOtherIssue] = useState('')
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [description, setDescription] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [landmark, setLandmark] = useState('')
  const [addrState, setAddrState] = useState('')
  const [pincode, setPincode] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod')

  // Success modal — shown after successful booking, mirrors Android behaviour
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successRequestId, setSuccessRequestId] = useState('')
  const [successType, setSuccessType] = useState<'cod' | 'payment'>('cod')

  // Pre-fill contact number from logged-in user profile (Android does the same)
  useEffect(() => {
    if (isAuthenticated && user && !contactNumber) {
      const phone = (user as any)?.phone || (user as any)?.mobile || ''
      if (phone) {
        // Strip any leading +91 / 91 / 0 so we always store the bare 10 digits
        const ten = String(phone).replace(/\D/g, '').slice(-10)
        if (ten.length === 10) setContactNumber(ten)
      }
    }
  }, [isAuthenticated, user])

  // ─── My Requests state ───────────────────────────────────────
  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [requestFilter, setRequestFilter] = useState('all')

  // Fetch pricing when vehicle type changes
  useEffect(() => {
    if (vehicleType) fetchPricing(vehicleType)
  }, [vehicleType])

  useEffect(() => {
    if (activeTab === 'requests' && isAuthenticated) fetchRequests()
  }, [activeTab, isAuthenticated])

  // Auto-fill address from saved addresses or user profile when entering step 2
  useEffect(() => {
    if (step === 2 && isAuthenticated && !address) {
      (async () => {
        try {
          const res = await userAddressAPI.getAll()
          const addresses = res.data?.data || res.data?.addresses || []
          const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0]
          if (defaultAddr) {
            setAddress(defaultAddr.address || defaultAddr.addressLine1 || '')
            if (!city && (defaultAddr.city || defaultAddr.town)) setCity(defaultAddr.city || defaultAddr.town || '')
            if (!landmark && defaultAddr.landmark) setLandmark(defaultAddr.landmark || '')
            return
          }
        } catch { /* no saved addresses */ }
        // Fallback: auto-fill from user profile location
        if (user?.location) {
          const loc = user.location
          if (loc.address && !address) setAddress(loc.address)
          if (loc.city && !city) setCity(loc.city)
          if (loc.landmark && !landmark) setLandmark(loc.landmark)
        }
        // Fallback: auto-detect GPS
        if (!address && navigator.geolocation) {
          handleGPS()
        }
      })()
    }
  }, [step, isAuthenticated])

  const fetchPricing = async (vType: string) => {
    setLoadingPricing(true)
    try {
      const res = await servicePricingAPI.getByVehicle(vType)
      if (res.data.success) setPricingData(res.data.data)
    } catch { setPricingData(null) }
    finally { setLoadingPricing(false) }
  }

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      const res = await userServiceAPI.getMyRequests({ limit: 50 })
      if (res.data.success) setRequests(res.data.data?.requests || res.data.data || [])
    } catch { /* silent */ }
    finally { setLoadingRequests(false) }
  }

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
    )
  }

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          // Store coords for the create payload (mechanic uses these for routing)
          setLatitude(lat)
          setLongitude(lng)
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`)
          const data = await resp.json()
          if (data.address) {
            const a = data.address
            // Same parsing as Android's reverseGeocode → fill every available
            // address part. Each setter only writes if its current value is
            // empty so we don't overwrite something the user already typed.
            const addrLine = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ')
            if (addrLine) setAddress(addrLine)
            if ((a.city || a.town || a.village || a.state_district) && !city) {
              setCity(a.city || a.town || a.village || a.state_district || '')
            }
            if (a.state && !addrState) setAddrState(a.state)
            if (a.postcode && !pincode) setPincode(a.postcode)
            if ((a.suburb || a.neighbourhood) && !landmark) {
              setLandmark(a.suburb || a.neighbourhood || '')
            }
          }
        } catch { toast.error('Could not detect address') }
        finally { setGpsLoading(false) }
      },
      () => { toast.error('Location access denied'); setGpsLoading(false) }
    )
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) { openLogin(); return }
    // Mirror Android validation: vehicle, service, issues, address, contact
    // number all required. Description is optional (Android auto-builds it
    // from selected issues) so we keep the existing soft requirement.
    if (!vehicleType || !serviceType || selectedIssues.length === 0 || !preferredDate || !address.trim()) {
      toast.error('Please fill all required fields'); return
    }
    if (contactNumber.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter a valid 10-digit contact number'); return
    }
    if (selectedIssues.includes('other') && !otherIssue.trim()) {
      toast.error('Please describe the "Other" issue you selected'); return
    }

    setSubmitting(true)
    setSubmitProgress('Creating service request...')

    try {
      const issueNames = selectedIssues.map(id => {
        if (id === 'other') return otherIssue.trim() ? `Other: ${otherIssue.trim()}` : 'Other'
        const issue = pricingData?.issues?.find((i: any) => (i.id || i._id) === id)
        return issue?.label || issue?.name || id
      })

      // Auto-build description if user didn't type one (Android does the same)
      const finalDescription = description.trim() || `Service requested for ${issueNames.join(', ')}`

      const res = await userServiceAPI.create({
        vehicleType, serviceType,
        serviceCategory: issueNames.join(', '),
        issues: issueNames,
        description: finalDescription,
        preferredDate,
        preferredTimeSlot: preferredTime || undefined,
        address: address.trim(),
        city: city.trim() || undefined,
        landmark: landmark.trim() || undefined,
        state: addrState.trim() || undefined,
        pincode: pincode.trim() || undefined,
        contactNumber: contactNumber.replace(/\D/g, ''),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        paymentMethod,
        estimatedCost: estimatedTotal,
        priority: serviceType === 'roadside' ? 'high' : 'normal',
        isEmergency: serviceType === 'roadside',
      })

      if (!res.data.success || !res.data.data) {
        toast.error(res.data.message || 'Failed to submit request')
        setSubmitting(false); setSubmitProgress(''); return
      }

      const serviceRequestId = res.data.data._id || res.data.data.serviceRequest?._id || res.data.data.id
      if (!serviceRequestId) { toast.error('Service request ID not returned'); setSubmitting(false); setSubmitProgress(''); return }

      if (paymentMethod === 'cod') {
        setSubmitProgress('Confirming COD booking...')
        try { await userPaymentAPI.createCOD(serviceRequestId, bookingFee) } catch { /* COD record optional */ }
        setSubmitting(false); setSubmitProgress('')
        // Show success modal (matches Android UX) — user clicks Track or Close
        setSuccessRequestId(serviceRequestId)
        setSuccessType('cod')
        setShowSuccessModal(true)
      } else {
        // Online payment via Razorpay
        setSubmitProgress('Setting up payment...')
        let orderResult: any
        try {
          const orderRes = await userPaymentAPI.createOrder(serviceRequestId, bookingFee)
          orderResult = orderRes.data?.data || orderRes.data
        } catch (e: any) {
          toast.error(e.response?.data?.message || 'Payment setup failed. Try COD instead.')
          setSubmitting(false); setSubmitProgress(''); return
        }

        if (!orderResult?.orderId || !orderResult?.keyId) {
          toast.error('Payment gateway not configured. Try COD instead.')
          setSubmitting(false); setSubmitProgress(''); return
        }

        setSubmitProgress('Opening payment gateway...')
        setSubmitting(false)

        if (typeof window.Razorpay === 'undefined') {
          toast.error('Payment gateway not loaded. Please refresh the page.')
          setSubmitProgress(''); return
        }

        const options = {
          key: orderResult.keyId,
          amount: orderResult.amount,
          currency: orderResult.currency || 'INR',
          name: 'Bharat Mechanics',
          description: `${serviceType === 'roadside' ? 'Emergency' : serviceType === 'walkin' ? 'Walk-in' : 'Home'} Service`,
          order_id: orderResult.orderId,
          handler: async (response: any) => {
            setSubmitting(true)
            setSubmitProgress('Verifying payment...')
            try {
              await userPaymentAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              // Show success modal (matches Android animated success card)
              setSuccessRequestId(serviceRequestId)
              setSuccessType('payment')
              setShowSuccessModal(true)
            } catch {
              toast.error('Payment verification failed. Contact support.')
            } finally { setSubmitting(false); setSubmitProgress('') }
          },
          theme: { color: '#1B3B6F' },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled. Your request is saved - you can pay later or switch to COD.')
              setSubmitProgress('')
            },
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit service request')
      setSubmitting(false); setSubmitProgress('')
    }
  }

  const resetForm = () => {
    setStep(1); setVehicleType(''); setServiceType('home')
    setSelectedIssues([]); setOtherIssue(''); setDescription('')
    setPreferredDate(''); setPreferredTime('')
    setAddress(''); setCity(''); setLandmark(''); setAddrState(''); setPincode('')
    setLatitude(null); setLongitude(null)
    setPaymentMethod('cod')
    // Note: contactNumber stays — auto-filled from user profile, no point re-clearing it
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await userServiceAPI.cancel(id)
      if (res.data.success) { toast.success('Request cancelled'); fetchRequests() }
      else toast.error(res.data.message || 'Failed to cancel')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to cancel') }
    finally { setCancellingId(null) }
  }

  const formatDate = (d: string) => {
    try {
      const date = new Date(d)
      const now = new Date()
      const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Yesterday'
      if (diff < 7) return `${diff} days ago`
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return d }
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'completed') return 'bg-green-100 text-green-800'
    if (s === 'confirmed' || s === 'assigned' || s === 'accepted') return 'bg-blue-100 text-blue-800'
    if (s === 'in_progress' || s === 'in-progress') return 'bg-purple-100 text-purple-800'
    if (s === 'on_way') return 'bg-orange-100 text-orange-800'
    if (s === 'cancelled') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'completed') return CheckCircle
    if (s === 'in_progress' || s === 'in-progress') return Wrench
    if (s === 'on_way') return Car
    if (s === 'cancelled') return XCircle
    return Clock
  }

  const estimatedTotal = selectedIssues.reduce((sum, id) => {
    const issue = pricingData?.issues?.find((i: any) => (i.id || i._id) === id)
    return sum + (issue?.estimatedPrice || issue?.estimatedCost || issue?.price || 0)
  }, 0)

  // Booking fee: ₹199 for emergency/roadside, ₹99 for normal
  const bookingFee = serviceType === 'roadside' ? 199 : 99

  const todayStr = new Date().toISOString().split('T')[0]

  // Auto-select today's date when reaching the schedule step (matches claude-design)
  useEffect(() => {
    if (step === 2 && !preferredDate) setPreferredDate(todayStr)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredRequests = requestFilter === 'all'
    ? requests
    : requests.filter(r => r.status?.toLowerCase() === requestFilter)

  const requestCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => ['assigned', 'accepted'].includes(r.status)).length,
    in_progress: requests.filter(r => ['on_way', 'in_progress'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }

  const stepLabels = ['Vehicle & Issues', 'Details & Schedule', 'Payment & Confirm']

  return (
    <UserLayout>
      {/* Navy gradient hero — matches book-service.html .bk-hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(120deg,#0F2547,#1B3B6F 60%,#2A5298)' }}>
        <div className="absolute inset-0 opacity-70 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1.2px,transparent 1.2px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-11">
          <div className="flex items-center gap-2 text-[13px] text-[#aebfd9] mb-3.5">
            <Link href="/" className="hover:text-white">Home</Link> › <span>Book a Mechanic</span>
          </div>
          <h1 className="text-white font-extrabold text-[26px] sm:text-[34px] lg:text-[40px] leading-tight">Book a trusted mechanic</h1>
          <p className="text-[#c8d4e8] text-base mt-3 max-w-xl">Doorstep car &amp; bike service with certified mechanics, genuine parts and transparent, issue-based pricing. Track your mechanic live.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-16">
        {/* Centered pill tab bar — matches .bk-tabs */}
        <div className="flex gap-2 bg-white border border-[#E7ECF3] rounded-2xl p-1.5 max-w-[520px] mx-auto mb-7 shadow-[0_2px_10px_rgba(19,32,58,0.05)]">
          {[
            { key: 'book' as const, label: 'Book Service', icon: Wrench },
            { key: 'requests' as const, label: 'My Requests', icon: Clock, count: requests.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.key ? 'bg-[#1B3B6F] text-white' : 'text-[#475569] hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-[#FF6B35] text-white'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Book Service Tab ─── */}
        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto">
            {/* Step indicator — book-service.html connected stepper */}
            <div className="flex items-start mb-6">
              {stepLabels.map((label, i) => {
                const s = i + 1
                const done = step > s, on = step === s
                return (
                  <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? 'bg-[#15936B] text-white' : on ? 'bg-[#1B3B6F] text-white ring-4 ring-[#1B3B6F]/15' : 'bg-gray-200 text-gray-500'}`}>
                        {done ? <CheckCircle className="h-4 w-4" /> : s}
                      </div>
                      <span className={`text-[11px] sm:text-xs text-center whitespace-nowrap font-semibold ${step >= s ? 'text-[#13203A]' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {s < 3 && <div className="flex-1 h-1 mx-1.5 -mt-5 rounded-full bg-gray-200 overflow-hidden"><div className={`h-full rounded-full bg-[#15936B] transition-all duration-300 ${done ? 'w-full' : 'w-0'}`} /></div>}
                  </div>
                )
              })}
            </div>

            {/* Step 1: Vehicle + service + issues (claude-design) */}
            {step === 1 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-[0_8px_30px_rgba(19,32,58,0.06)] p-5 md:p-7 space-y-6">
                <div><h3 className="text-xl font-extrabold text-[#13203A]">What do you need help with?</h3><p className="text-[13.5px] text-[#7B8AA3] mt-1">Pick your vehicle, service type and the issues you&rsquo;re facing &mdash; we&rsquo;ll estimate the cost instantly.</p></div>

                {/* Vehicle type — opt-grid */}
                <div>
                  <label className="block text-[13px] font-bold text-[#475569] mb-2.5">Select vehicle type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {vehicleTypes.map(v => {
                      const on = vehicleType === v.value
                      return (
                        <button key={v.value} onClick={() => { setVehicleType(v.value); setSelectedIssues([]) }}
                          className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-[13px] border-[1.5px] transition text-[13px] font-bold ${on ? 'border-[#1B3B6F] bg-[#EEF3FB] text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569] hover:border-[#c7d6ed]'}`}>
                          <span className="text-2xl leading-none">{v.emoji}</span>
                          {v.label}
                          <small className={`text-[10.5px] font-semibold ${on ? 'text-[#2A5298]' : 'text-[#7B8AA3]'}`}>{vehicleSubs[v.value] || ''}</small>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Service type — opt-grid (left aligned) */}
                <div>
                  <label className="block text-[13px] font-bold text-[#475569] mb-2.5">Service type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {serviceTypes.map(st => {
                      const on = serviceType === st.value
                      return (
                        <button key={st.value} onClick={() => setServiceType(st.value)}
                          className={`flex flex-col items-start gap-1.5 p-3.5 rounded-[13px] border-[1.5px] text-left transition ${on ? 'border-[#1B3B6F] bg-[#EEF3FB]' : 'border-[#E7ECF3] hover:border-[#c7d6ed]'}`}>
                          <div className="flex items-center gap-2.5 w-full">
                            <st.icon className={`h-5 w-5 shrink-0 ${on ? 'text-[#1B3B6F]' : 'text-[#475569]'}`} />
                            <b className={`text-[13.5px] ${on ? 'text-[#1B3B6F]' : 'text-[#13203A]'}`}>{st.label}</b>
                          </div>
                          <small className="text-[11.5px] text-[#7B8AA3] leading-snug">{st.desc}</small>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Issues — iss-rows */}
                {vehicleType && (
                  <div>
                    <label className="block text-[13px] font-bold text-[#475569] mb-2.5">Select issues <span className="text-[#7B8AA3] font-semibold">(choose all that apply)</span></label>
                    {loadingPricing ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#1B3B6F]" /></div>
                    ) : pricingData?.issues?.filter((i: any) => i.isActive !== false).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pricingData.issues.filter((i: any) => i.isActive !== false).map((issue: any) => {
                          const id = issue.id || issue._id
                          const on = selectedIssues.includes(id)
                          const price = issue.estimatedPrice || issue.estimatedCost || issue.price
                          return (
                            <button key={id} onClick={() => toggleIssue(id)}
                              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] text-left transition ${on ? 'border-[#1B3B6F] bg-[#EEF3FB]' : 'border-[#E7ECF3] bg-white hover:border-[#c7d6ed]'}`}>
                              <span className={`h-[38px] w-[38px] rounded-[10px] flex items-center justify-center shrink-0 transition ${on ? 'bg-[#1B3B6F] text-white' : 'bg-[#EEF3FB] text-[#1B3B6F]'}`}><Wrench className="h-5 w-5" /></span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-[13.5px] font-bold text-[#13203A] leading-tight">{issue.label || issue.name}</span>
                                {issue.description && <span className="block text-[11.5px] text-[#7B8AA3] mt-0.5 truncate">{issue.description}</span>}
                              </span>
                              {price > 0 && <span className="text-[13px] font-bold text-[#475569] shrink-0">~₹{price}</span>}
                              <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? 'bg-[#1B3B6F] border-[#1B3B6F] text-white' : 'border-[#E7ECF3] text-transparent'}`}>{on && <CheckCircle className="h-3 w-3" />}</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[#7B8AA3] py-4">No service pricing available for this vehicle type.</p>
                    )}

                    {/* Other issue — dashed iss-row */}
                    {pricingData?.issues?.length > 0 && (() => { const on = selectedIssues.includes('other'); return (
                      <button type="button" onClick={() => toggleIssue('other')}
                        className={`mt-2.5 w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] border-dashed text-left transition ${on ? 'border-[#FF6B35] bg-[#FFF1EB]' : 'border-[#E7ECF3] hover:border-[#FF6B35]/60'}`}>
                        <span className="h-[38px] w-[38px] rounded-[10px] flex items-center justify-center shrink-0 bg-[#FF6B35]/10 text-[#FF6B35]"><AlertCircle className="h-5 w-5" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-bold text-[#13203A]">Other issue (not listed)</span>
                          <span className="block text-[11.5px] text-[#7B8AA3] mt-0.5">Describe it &mdash; we&rsquo;ll quote on inspection</span>
                        </span>
                        <span className="text-[12.5px] font-bold text-[#FF6B35] shrink-0">Custom</span>
                        <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? 'bg-[#FF6B35] border-[#FF6B35] text-white' : 'border-[#E7ECF3] text-transparent'}`}>{on && <CheckCircle className="h-3 w-3" />}</span>
                      </button>
                    )})()}

                    {selectedIssues.includes('other') && (
                      <div className="mt-3">
                        <Textarea value={otherIssue} onChange={e => setOtherIssue(e.target.value)} placeholder="E.g., car makes a clicking sound when turning left, headlight wiring issue, etc." rows={3} />
                      </div>
                    )}

                    {/* est-band — green */}
                    {estimatedTotal > 0 && (
                      <div className="mt-5 flex items-center justify-between gap-3.5 px-[18px] py-4 rounded-2xl bg-[#E7F6EF] border border-[#bfe6d3]">
                        <div><b className="block text-sm text-[#13203A]">Estimated service cost</b><span className="text-[12px] text-[#475569]">Booking fee ₹{bookingFee} paid now &middot; rest after service</span></div>
                        <div className="text-[26px] font-extrabold text-[#15936B] leading-none">₹{estimatedTotal.toLocaleString('en-IN')}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* wnav */}
                <div className="flex justify-end pt-1">
                  <button onClick={() => setStep(2)} disabled={!vehicleType || selectedIssues.length === 0 || (selectedIssues.includes('other') && !otherIssue.trim())}
                    className="inline-flex items-center gap-2 bg-[#1B3B6F] hover:bg-[#152d55] disabled:opacity-40 text-white font-bold text-[15px] px-6 h-12 rounded-xl transition-colors">
                    Continue to details <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: details + schedule (claude-design) */}
            {step === 2 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-[0_8px_30px_rgba(19,32,58,0.06)] p-5 md:p-7">
                <div className="mb-1"><h3 className="text-xl font-extrabold text-[#13203A]">Details &amp; schedule</h3><p className="text-[13.5px] text-[#7B8AA3] mt-1">Tell us a little more and pick a convenient time.</p></div>

                {/* fsec 1 — the problem */}
                <div className="pt-2 pb-5">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <span className="h-[27px] w-[27px] rounded-lg bg-[#1B3B6F] text-white flex items-center justify-center font-extrabold text-[13.5px]">1</span>
                    <span className="font-extrabold text-base text-[#13203A]">The problem</span>
                  </div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2">Describe the problem <span className="text-[#FF6B35]">*</span></label>
                  {/* Quick-pick chips — tap a common problem to add it to your description */}
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {problemChips.map(c => {
                      const on = description.toLowerCase().includes(c.toLowerCase())
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDescription(prev => {
                            if (prev.toLowerCase().includes(c.toLowerCase())) {
                              const idx = prev.toLowerCase().indexOf(c.toLowerCase())
                              return (prev.slice(0, idx) + prev.slice(idx + c.length))
                                .replace(/\s*\.\s*\./g, '.').replace(/\s{2,}/g, ' ').replace(/^[.\s]+/, '').trim()
                            }
                            return (prev.trim() ? prev.trim().replace(/\.?$/, '. ') : '') + c
                          })}
                          className={`text-[12.5px] font-medium rounded-full px-3 py-1.5 border transition ${on ? 'border-[#1B3B6F] bg-[#EEF3FB] text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569] hover:border-[#c7d6ed]'}`}
                        >
                          {on ? '✓ ' : '+ '}{c}
                        </button>
                      )
                    })}
                  </div>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain the issue in detail… or tap the suggestions above" rows={3} />
                </div>

                {/* fsec 2 — schedule */}
                <div className="py-5 border-t border-[#E7ECF3]">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <span className="h-[27px] w-[27px] rounded-lg bg-[#1B3B6F] text-white flex items-center justify-center font-extrabold text-[13.5px]">2</span>
                    <span className="font-extrabold text-base text-[#13203A]">Schedule</span>
                  </div>
                  <label className="block text-[13px] font-semibold text-[#475569] mb-2">Preferred date <span className="text-[#FF6B35]">*</span></label>
                  <MonthCalendar value={preferredDate} onChange={setPreferredDate} />
                  <label className="block text-[13px] font-semibold text-[#475569] mt-4 mb-2">Preferred time</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {timeSlots.map(s => { const on = preferredTime === s.label; return (
                      <button key={s.label} type="button" onClick={() => setPreferredTime(s.label)}
                        className={`py-3 px-2 rounded-xl border-[1.5px] text-center text-[13px] font-bold transition ${on ? 'border-[#1B3B6F] bg-[#EEF3FB] text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569] bg-white hover:border-[#c7d6ed]'}`}>
                        {s.label}<small className="block text-[10.5px] font-semibold text-[#7B8AA3] mt-0.5">{s.sub}</small>
                      </button>
                    )})}
                  </div>
                </div>

                {/* fsec 3 — address & contact */}
                <div className="py-5 border-t border-[#E7ECF3]">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <span className="h-[27px] w-[27px] rounded-lg bg-[#1B3B6F] text-white flex items-center justify-center font-extrabold text-[13.5px]">3</span>
                    <span className="font-extrabold text-base text-[#13203A]">Address &amp; contact</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[#475569]">Service address <span className="text-[#FF6B35]">*</span></label>
                    <button type="button" onClick={handleGPS} disabled={gpsLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-[#cdd9ee] bg-[#EEF3FB] text-[#1B3B6F] text-[12.5px] font-extrabold hover:bg-[#1B3B6F] hover:text-white transition disabled:opacity-50">
                      {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                      {gpsLoading ? 'Detecting…' : (latitude ? 'Re-detect' : 'Use GPS')}
                    </button>
                  </div>
                  <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House / flat no., street, area" rows={2} className="mb-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-extrabold text-[#7B8AA3] uppercase tracking-wide">Country</span>
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-[#E7ECF3] bg-[#F6F8FB] text-sm font-medium text-[#475569]">🇮🇳 India</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-extrabold text-[#7B8AA3] uppercase tracking-wide">City</span>
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-extrabold text-[#7B8AA3] uppercase tracking-wide">Landmark</span>
                      <Input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Nearby landmark" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-extrabold text-[#7B8AA3] uppercase tracking-wide">State</span>
                      <Input value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="State" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11.5px] font-extrabold text-[#7B8AA3] uppercase tracking-wide">Pincode</span>
                      <Input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" inputMode="numeric" maxLength={6} />
                    </div>
                  </div>
                  {(latitude !== null && longitude !== null) && (
                    <div className="flex items-center gap-2 mt-3 px-3.5 py-2.5 rounded-[10px] bg-[#EEF3FB] text-[12.5px] text-[#475569]">
                      <Navigation className="h-3.5 w-3.5 text-[#1B3B6F]" /> Location detected · <b className="text-[#1B3B6F] font-bold">{latitude.toFixed(5)}, {longitude.toFixed(5)}</b>
                    </div>
                  )}
                  <div className="mt-3.5">
                    <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Contact number <span className="text-[#FF6B35]">*</span></label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-[#F6F8FB] rounded-md border border-[#E7ECF3] text-sm font-medium text-[#475569]">🇮🇳 +91</div>
                      <Input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="00000 00000" inputMode="numeric" maxLength={10} className="flex-1" />
                    </div>
                    <p className="text-[11.5px] text-[#7B8AA3] mt-1.5">The mechanic will call you on this number</p>
                  </div>
                </div>

                {/* wnav */}
                <div className="flex justify-between gap-3 pt-1">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#475569] font-bold text-[15px] px-5 h-12 rounded-xl transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
                  <button onClick={() => setStep(3)} disabled={!preferredDate || !description.trim() || !address.trim() || contactNumber.length !== 10}
                    className="inline-flex items-center gap-2 bg-[#1B3B6F] hover:bg-[#152d55] disabled:opacity-40 text-white font-bold text-[15px] px-6 h-12 rounded-xl transition-colors">Continue to payment <ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            {/* Step 3: payment + confirm (claude-design) */}
            {step === 3 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-[0_8px_30px_rgba(19,32,58,0.06)] p-5 md:p-7">
                <div className="mb-1"><h3 className="text-xl font-extrabold text-[#13203A]">Payment &amp; confirm</h3><p className="text-[13.5px] text-[#7B8AA3] mt-1">Pay just the ₹{bookingFee} booking fee now. The rest is payable after the job is done.</p></div>

                {/* fsec 1 — payment method (pay-list) */}
                <div className="pt-2 pb-5">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <span className="h-[27px] w-[27px] rounded-lg bg-[#1B3B6F] text-white flex items-center justify-center font-extrabold text-[13.5px]">1</span>
                    <span className="font-extrabold text-base text-[#13203A]">Choose payment method</span>
                  </div>
                  {([
                    { id: 'online' as const, icon: CreditCard, label: 'Pay Online', sub: 'UPI, Card, Net Banking via Razorpay' },
                    { id: 'cod' as const, icon: Banknote, label: 'Cash on Delivery', sub: 'Pay the booking fee after the mechanic arrives' },
                  ]).map(p => { const on = paymentMethod === p.id; return (
                    <button key={p.id} onClick={() => setPaymentMethod(p.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[13px] border-[1.5px] mb-2.5 text-left transition ${on ? 'border-[#1B3B6F] bg-[#EEF3FB]' : 'border-[#E7ECF3] hover:border-[#c7d6ed]'}`}>
                      <div className="h-10 w-10 rounded-[10px] bg-[#F6F8FB] flex items-center justify-center shrink-0"><p.icon className="h-5 w-5 text-[#1B3B6F]" /></div>
                      <div className="flex-1 min-w-0"><b className="block text-sm text-[#13203A]">{p.label}</b><span className="text-[12px] text-[#7B8AA3]">{p.sub}</span></div>
                      <div className={`h-5 w-5 rounded-full border-2 shrink-0 ${on ? 'border-[#1B3B6F] bg-[#1B3B6F] ring-2 ring-inset ring-white' : 'border-[#E7ECF3]'}`} />
                    </button>
                  )})}
                </div>

                {/* fsec 2 — booking summary (rev-box) */}
                <div className="py-5 border-t border-[#E7ECF3]">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <span className="h-[27px] w-[27px] rounded-lg bg-[#1B3B6F] text-white flex items-center justify-center font-extrabold text-[13.5px]">2</span>
                    <span className="font-extrabold text-base text-[#13203A]">Booking summary</span>
                  </div>
                  <div className="bg-[#F6F8FB] border border-[#EEF1F6] rounded-2xl px-4">
                    <RevLine icon={<Car className="h-4 w-4" />} label="Vehicle" value={vehicleTypes.find(v => v.value === vehicleType)?.label || ''} />
                    <RevLine icon={<Wrench className="h-4 w-4" />} label="Service type" value={`${serviceTypes.find(s => s.value === serviceType)?.label || ''}${selectedIssues.length ? ' · ' + selectedIssues.map(id => { const i = pricingData?.issues?.find((x: any) => (x.id || x._id) === id); return i?.label || i?.name || (id === 'other' ? 'Other issue' : id) }).join(', ') : ''}`} />
                    <RevLine icon={<Calendar className="h-4 w-4" />} label="Date" value={`${preferredDate}${preferredTime ? ' · ' + preferredTime : ''}`} />
                    <RevLine icon={<MapPin className="h-4 w-4" />} label="Address" value={[address, city, addrState, pincode].filter(Boolean).join(', ')} />
                    <RevLine icon={<Banknote className="h-4 w-4" />} label="Payment" value={paymentMethod === 'online' ? 'Pay Online' : 'Cash on Delivery'} last />
                  </div>
                </div>

                {/* pay-box */}
                <div className="border-[1.5px] border-[#E7ECF3] rounded-2xl px-[18px] py-4 bg-white">
                  <div className="flex items-center justify-between py-2.5 border-b border-dashed border-[#EEF1F6] text-sm text-[#475569]"><span>Booking Fee ({serviceType === 'roadside' ? 'Emergency' : 'Visiting Charge'})</span><b className="text-[15px] font-extrabold text-[#13203A]">₹{bookingFee}</b></div>
                  {estimatedTotal > 0 && <div className="flex items-center justify-between py-2.5 border-b border-dashed border-[#EEF1F6] text-sm text-[#475569]"><span>Estimated Service Cost</span><b className="text-[15px] font-extrabold text-[#13203A]">₹{estimatedTotal.toLocaleString('en-IN')}</b></div>}
                  <div className="flex items-center justify-between mt-2 px-4 py-3.5 rounded-xl bg-[#EEF3FB]"><span className="text-[15px] font-extrabold text-[#1B3B6F]">Pay Now</span><b className="text-xl font-extrabold text-[#1B3B6F]">₹{bookingFee}</b></div>
                  {estimatedTotal > 0 && <div className="text-center text-[12.5px] font-semibold text-[#7B8AA3] mt-2.5">Remaining ₹{Math.max(0, estimatedTotal - bookingFee).toLocaleString('en-IN')} to be paid after service completion</div>}
                </div>

                {/* prebook checklist */}
                <div className="mt-4 border border-[#EEF1F6] bg-[#F6F8FB] rounded-2xl px-[18px] py-4">
                  <div className="font-extrabold text-sm text-[#13203A] mb-3">Before you book</div>
                  <ul className="space-y-2.5">
                    {[
                      'A mechanic will be assigned and will contact you.',
                      `Booking fee of ₹${bookingFee} ${paymentMethod === 'online' ? 'will be charged via Razorpay' : 'will be collected by the mechanic'}. Remaining payment after service.`,
                      'Free cancellation up to 2 hours before appointment.',
                    ].map((t, i) => <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#475569] leading-relaxed"><CheckCircle className="h-4 w-4 text-[#15936B] shrink-0 mt-0.5" /><span>{t}</span></li>)}
                  </ul>
                </div>

                {submitProgress && (
                  <div className="mt-4 bg-[#EEF3FB] border border-[#cdd9ee] rounded-xl p-3 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1B3B6F] shrink-0" />
                    <span className="text-sm text-[#1B3B6F] font-medium">{submitProgress}</span>
                  </div>
                )}

                {/* wnav */}
                <div className="flex justify-between gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#475569] font-bold text-[15px] px-5 h-12 rounded-xl transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e85a28] disabled:opacity-50 text-white font-bold text-[15px] px-6 h-12 rounded-xl transition-colors">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : paymentMethod === 'online' ? <CreditCard className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                    {paymentMethod === 'online' ? `Pay ₹${bookingFee} & confirm` : 'Confirm booking (COD)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── My Requests Tab ─── */}
        {activeTab === 'requests' && (
          <div className="max-w-3xl mx-auto">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Login to view requests</h3>
                <p className="text-muted-foreground mb-4">You need to be logged in to see your service requests.</p>
                <Button onClick={() => openLogin()} className="bg-[#1B3B6F]">Login</Button>
              </div>
            ) : (
              <>
                {/* Status Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'assigned', label: 'Assigned' },
                    { key: 'in_progress', label: 'Active' },
                    { key: 'completed', label: 'Done' },
                    { key: 'cancelled', label: 'Cancelled' },
                  ].map(f => {
                    const count = requestCounts[f.key as keyof typeof requestCounts] || 0
                    const active = requestFilter === f.key
                    return (
                      <button
                        key={f.key}
                        onClick={() => setRequestFilter(f.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active ? 'bg-[#1B3B6F] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {f.label}
                        {count > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>{count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {loadingRequests ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border rounded-xl p-5 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                          <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-200 rounded w-1/5" /></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {requestFilter === 'all' ? 'No service requests' : `No ${requestFilter.replace(/_/g, ' ')} requests`}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {requestFilter === 'all' ? "You haven't booked any services yet." : 'Try switching to a different filter.'}
                    </p>
                    {requestFilter === 'all' && (
                      <Button onClick={() => setActiveTab('book')} className="bg-[#1B3B6F]">Book a Service</Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredRequests.map((req: any) => {
                      const id = req._id || req.id
                      const s = (req.status || 'pending').toLowerCase()
                      const pill =
                        s === 'completed' ? { cls: 'bg-[#E7F6EF] text-[#15936B]', label: 'Completed' }
                          : s === 'cancelled' ? { cls: 'bg-[#fde8e8] text-[#b91c1c]', label: 'Cancelled' }
                            : s === 'on_way' ? { cls: 'bg-[#FFF1EB] text-[#FF6B35]', label: 'On the way' }
                              : s === 'in_progress' ? { cls: 'bg-[#FFF1EB] text-[#FF6B35]', label: 'In progress' }
                                : (s === 'assigned' || s === 'accepted') ? { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', label: 'Mechanic assigned' }
                                  : { cls: 'bg-[#F2F6FC] text-[#1B3B6F]', label: 'Requested' }
                      const VIcon = req.vehicleType === 'car' ? Car : req.vehicleType === 'auto' ? TruckIcon : Bike
                      const addr = typeof req.address === 'string' ? req.address : req.address?.address || req.location?.address || ''
                      const cost = req.totalCost || req.estimatedCost || 0
                      const title = req.description?.trim()
                        ? req.description.trim().slice(0, 42)
                        : (serviceTypes.find(x => x.value === req.serviceType)?.label || 'Service')
                      return (
                        <div
                          key={id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/service/${id}`)}
                          onKeyDown={e => { if (e.key === 'Enter') router.push(`/service/${id}`) }}
                          className="w-full cursor-pointer flex items-center gap-4 bg-white border border-[#E7ECF3] rounded-2xl px-4 py-4 shadow-sm hover:shadow-md hover:border-[#c7d6ed] hover:-translate-y-px transition"
                        >
                          {/* reqc-ic */}
                          <div className="h-[50px] w-[50px] rounded-[14px] bg-[#F2F6FC] text-[#1B3B6F] flex items-center justify-center shrink-0">
                            <VIcon className="h-6 w-6" />
                          </div>

                          {/* reqc-mid */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <b className="text-[15px] font-extrabold text-[#13203A] truncate max-w-[58%]">{title}</b>
                              <span className={`text-[11px] font-extrabold px-2.5 py-[3px] rounded-full ${pill.cls}`}>{pill.label}</span>
                            </div>
                            <div className="text-[12.5px] text-[#475569] mt-1 truncate">
                              <span className="capitalize">{req.vehicleType || 'Vehicle'}</span> · #{req.requestId || String(id).slice(-6).toUpperCase()}
                              {req.preferredDate ? ` · ${formatDate(req.preferredDate)}` : ''}
                              {req.preferredTimeSlot ? ` · ${req.preferredTimeSlot}` : ''}
                            </div>
                            {addr && (
                              <div className="flex items-center gap-1.5 text-[12.5px] text-[#475569] mt-0.5">
                                <MapPin className="h-3 w-3 text-[#7B8AA3] shrink-0" /> <span className="truncate">{addr}</span>
                              </div>
                            )}
                          </div>

                          {/* reqc-rt */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {cost > 0 && <b className="text-[17px] font-extrabold text-[#1B3B6F]">₹{cost.toLocaleString('en-IN')}</b>}
                            {s === 'completed' && !req.feedback ? (
                              <button
                                onClick={e => { e.stopPropagation(); setRatingReq(req) }}
                                className="text-[11px] font-bold text-[#FF6B35] bg-[#FFF1EB] px-2.5 py-1 rounded-full inline-flex items-center gap-1 hover:bg-[#ffe4d6]"
                              >
                                <Star className="h-3 w-3" /> Rate
                              </button>
                            ) : s === 'completed' && req.feedback ? (
                              <span className="text-[11px] font-bold text-[#15936B] inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#15936B]" /> Rated</span>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[#7B8AA3]" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Refresh button */}
                {!loadingRequests && requests.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={fetchRequests} className="text-sm">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Success Modal ──────────────────────────────────────────────
          Shown after a booking succeeds (COD or after Razorpay verifies the
          payment). Mirrors the animated success card on Android — gives the
          user a clear "yes it worked" moment + a quick path to either track
          the new request or go back home. */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => {
            setShowSuccessModal(false); resetForm(); setActiveTab('requests')
          }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            {/* Gradient header — colour reflects payment vs COD */}
            <div className={`px-6 py-8 text-center ${
              successType === 'payment'
                ? 'bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545]'
                : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800'
            }`}>
              <div className="mx-auto h-16 w-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-9 w-9 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {successType === 'payment' ? 'Payment Successful!' : 'Request Submitted!'}
              </h3>
              <p className="text-sm text-white/85 mt-1">
                {successType === 'payment'
                  ? 'Your booking is confirmed. A mechanic will be assigned shortly.'
                  : "We've received your request. Pay in cash when the service is complete."}
              </p>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Request ID</span>
                <span className="font-mono font-semibold text-[#1B3B6F]">
                  #{(successRequestId || '').slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Type</span>
                <span className="font-medium">
                  {serviceTypes.find(s => s.value === serviceType)?.label || serviceType}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium flex items-center gap-1">
                  {successType === 'payment' ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                  {successType === 'payment' ? 'Online (Paid)' : 'Cash on Delivery'}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs text-amber-800 mt-2">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <span>A mechanic will be assigned within 15–30 minutes. You'll get an SMS + push notification with their contact details.</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setShowSuccessModal(false); resetForm(); router.push('/')
                  }}
                >
                  Back to Home
                </Button>
                <Button
                  className="h-11 bg-[#1B3B6F] hover:bg-[#152d55]"
                  onClick={() => {
                    setShowSuccessModal(false); resetForm()
                    if (successRequestId) router.push(`/service/${successRequestId}`)
                    else setActiveTab('requests')
                  }}
                >
                  Track Request <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Full-screen call screen (claude-design) ─── */}
      {callTarget && (
        <CallScreen
          name={callTarget.name}
          role="Verified mechanic"
          color="#1B3B6F"
          phone={callTarget.phone}
          onClose={() => setCallTarget(null)}
        />
      )}

      {/* ─── 3-step rate & review flow (claude-design) ─── */}
      {ratingReq && (
        <RatingFlow
          requestId={ratingReq._id || ratingReq.id}
          mechName={ratingReq.mechanic?.user?.fullName || ratingReq.mechanic?.fullName || ratingReq.assignedMechanic?.fullName || 'Your mechanic'}
          mechRating={ratingReq.mechanic?.rating || ratingReq.mechanic?.user?.rating}
          onClose={() => setRatingReq(null)}
          onSubmitted={() => { fetchRequests() }}
        />
      )}
    </UserLayout>
  )
}
