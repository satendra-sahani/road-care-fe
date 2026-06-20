'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { userServiceAPI, servicePricingAPI, userPaymentAPI, userAddressAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CallScreen from '@/components/service/CallScreen'
import RatingFlow from '@/components/service/RatingFlow'
import { toast } from 'sonner'
import {
  Wrench, Calendar, Clock, MapPin, Car, Bike, Truck as TruckIcon,
  CheckCircle, AlertCircle, Loader2, ChevronRight, Phone, Star, Building2,
  Navigation, Plus, ArrowLeft, CreditCard, Banknote, Shield, ChevronDown,
  MapPinned, User, Eye, XCircle, RefreshCw,
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
  '09:00 AM - 11:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM', '06:00 PM - 08:00 PM',
]

export function ServicePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.customerAuth)

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
    if (!isAuthenticated) { router.push('/login?redirect=/service'); return }
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
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#13203A] mb-1">Book a service</h1>
        <p className="text-[#7B8AA3] mb-6">Certified mechanics at your doorstep &mdash; transparent pricing, pay after service.</p>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          {[
            { key: 'book' as const, label: 'Book Service', icon: Plus },
            { key: 'requests' as const, label: 'My Requests', icon: Wrench, count: requests.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white shadow text-foreground' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-[#1B3B6F] text-white' : 'bg-gray-200 text-gray-600'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Book Service Tab ─── */}
        {activeTab === 'book' && (
          <div>
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

            {/* Step 1: Vehicle type, service type, issues */}
            {step === 1 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
                <div><h3 className="text-lg font-extrabold text-[#13203A]">What do you need help with?</h3><p className="text-[13px] text-[#7B8AA3] mt-0.5">Pick your vehicle, service type and issues &mdash; we&rsquo;ll estimate the cost instantly.</p></div>
                {/* Vehicle Type */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Vehicle Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {vehicleTypes.map(v => (
                      <button
                        key={v.value}
                        onClick={() => { setVehicleType(v.value); setSelectedIssues([]) }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          vehicleType === v.value
                            ? 'border-[#1B3B6F] bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{v.emoji}</span>
                        <span className={`text-sm font-medium ${vehicleType === v.value ? 'text-[#1B3B6F]' : 'text-gray-600'}`}>
                          {v.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Service Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {serviceTypes.map(st => (
                      <button
                        key={st.value}
                        onClick={() => setServiceType(st.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          serviceType === st.value
                            ? 'border-[#1B3B6F] bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          serviceType === st.value ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <st.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{st.label}</p>
                          <p className="text-xs text-muted-foreground">{st.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {vehicleType && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Issues</Label>
                    {loadingPricing ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1B3B6F]" />
                      </div>
                    ) : pricingData?.issues?.filter((i: any) => i.isActive !== false).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pricingData.issues.filter((i: any) => i.isActive !== false).map((issue: any) => {
                          const id = issue.id || issue._id
                          const selected = selectedIssues.includes(id)
                          return (
                            <button
                              key={id}
                              onClick={() => toggleIssue(id)}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                                selected ? 'border-[#1B3B6F] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
                                  selected ? 'bg-[#1B3B6F]' : 'border border-gray-300'
                                }`}>
                                  {selected && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{issue.label || issue.name}</p>
                                  {issue.description && <p className="text-xs text-muted-foreground">{issue.description}</p>}
                                </div>
                              </div>
                              {(issue.estimatedPrice || issue.estimatedCost || issue.price) > 0 && (
                                <span className="text-sm font-semibold text-[#1B3B6F] whitespace-nowrap ml-2">
                                  ₹{issue.estimatedPrice || issue.estimatedCost || issue.price}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">No service pricing available for this vehicle type.</p>
                    )}

                    {/* "Other" issue tile — mirrors Android's free-form issue option.
                        Toggling it adds the special id 'other' to selectedIssues; if active
                        the textarea below appears so the user can describe the problem. */}
                    {pricingData?.issues?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleIssue('other')}
                        className={`mt-3 w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                          selectedIssues.includes('other')
                            ? 'border-[#FF6B35] bg-orange-50'
                            : 'border-dashed border-gray-300 hover:border-[#FF6B35]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
                            selectedIssues.includes('other') ? 'bg-[#FF6B35]' : 'border border-gray-300'
                          }`}>
                            {selectedIssues.includes('other') && <CheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">Other issue (not listed)</p>
                            <p className="text-xs text-muted-foreground">Describe a custom problem we'll quote on inspection</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#FF6B35] whitespace-nowrap ml-2">
                          Custom
                        </span>
                      </button>
                    )}

                    {selectedIssues.includes('other') && (
                      <div className="mt-3">
                        <Label htmlFor="other-issue" className="text-sm">Describe your specific issue</Label>
                        <Textarea
                          id="other-issue"
                          value={otherIssue}
                          onChange={e => setOtherIssue(e.target.value)}
                          placeholder="E.g., car makes a clicking sound when turning left, headlight wiring issue, etc."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {estimatedTotal > 0 && (
                      <div className="mt-4 flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#1B3B6F] to-[#2A5298] text-white">
                        <div><b className="block text-sm">Estimated service cost</b><span className="text-[11.5px] text-white/75">Booking fee ₹{bookingFee} paid now &middot; rest after service</span></div>
                        <div className="text-2xl font-extrabold">₹{estimatedTotal.toLocaleString('en-IN')}</div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => setStep(2)}
                  disabled={!vehicleType || selectedIssues.length === 0 || (selectedIssues.includes('other') && !otherIssue.trim())}
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55] h-12"
                >
                  Continue to Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Description, date, address */}
            {step === 2 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div><h3 className="text-lg font-extrabold text-[#13203A]">Details &amp; schedule</h3><p className="text-[13px] text-[#7B8AA3] mt-0.5">Tell us a little more and pick a convenient time.</p></div>

                <div>
                  <Label htmlFor="desc">Describe the Problem *</Label>
                  <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Explain the issue in detail..." rows={3} className="mt-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Preferred Date *</Label>
                    <Input id="date" type="date" value={preferredDate}
                      onChange={e => setPreferredDate(e.target.value)} min={todayStr} className="mt-1" />
                  </div>
                  <div>
                    <Label>Preferred Time</Label>
                    <Select value={preferredTime} onValueChange={setPreferredTime}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select time slot" /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="address">Service Address *</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handleGPS} disabled={gpsLoading}
                      className="text-xs text-[#1B3B6F]">
                      {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
                      {gpsLoading ? 'Detecting…' : (latitude ? 'Re-detect' : 'Use GPS')}
                    </Button>
                  </div>
                  <Textarea id="address" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Full address where service is needed..." rows={2} className="mt-1" />

                  {/* Detected GPS detail chips — mirrors Android's "City · State · Pincode · India" row */}
                  {(latitude !== null || city || addrState || pincode) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {city && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-medium text-[#1B3B6F]">
                          <Building2 className="h-3 w-3" />{city}
                        </span>
                      )}
                      {addrState && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-medium text-[#1B3B6F]">
                          <MapPin className="h-3 w-3" />{addrState}
                        </span>
                      )}
                      {pincode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-medium text-[#1B3B6F]">
                          <MapPinned className="h-3 w-3" />{pincode}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-[11px] font-medium text-gray-600">
                        🇮🇳 India
                      </span>
                      {latitude !== null && longitude !== null && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input id="landmark" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Nearby landmark" className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={addrState} onChange={e => setAddrState(e.target.value)} placeholder="State" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={pincode}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Contact number — required, mirrors Android Step 3.
                    Pre-filled from profile if logged in, but the user can override
                    (e.g., dial a different number if they want the mechanic to call
                    a family member or driver). */}
                <div>
                  <Label htmlFor="contact">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center px-3 bg-gray-100 rounded-md border text-sm font-medium text-gray-600">
                      🇮🇳 +91
                    </div>
                    <Input
                      id="contact"
                      type="tel"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">The mechanic will call you on this number</p>
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={!preferredDate || !address.trim() || contactNumber.length !== 10}
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55] h-12"
                >
                  Continue to Payment
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 3: Payment & Confirm */}
            {step === 3 && (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div><h3 className="text-lg font-extrabold text-[#13203A]">Payment &amp; confirm</h3><p className="text-[13px] text-[#7B8AA3] mt-0.5">Pay just the &#8377;{bookingFee} booking fee now. The rest is payable after the job is done.</p></div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Choose Payment Method</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('online')}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'online'
                          ? 'border-[#1B3B6F] bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === 'online' ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Pay Online</p>
                        <p className="text-xs text-muted-foreground">UPI, Card, Net Banking via Razorpay</p>
                      </div>
                      {paymentMethod === 'online' && (
                        <CheckCircle className="h-5 w-5 text-[#1B3B6F] ml-auto shrink-0" />
                      )}
                    </button>

                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'cod'
                          ? 'border-[#1B3B6F] bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === 'cod' ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay after service is completed</p>
                      </div>
                      {paymentMethod === 'cod' && (
                        <CheckCircle className="h-5 w-5 text-[#1B3B6F] ml-auto shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Request Summary */}
                <div className="bg-white border rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1B3B6F] to-[#152d55] px-4 py-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Booking Summary
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-medium">{vehicleTypes.find(v => v.value === vehicleType)?.emoji} {vehicleTypes.find(v => v.value === vehicleType)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Type</span>
                      <span className="font-medium">{serviceTypes.find(s => s.value === serviceType)?.label}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Issues: </span>
                      <span className="font-medium">{selectedIssues.map(id => {
                        const issue = pricingData?.issues?.find((i: any) => (i.id || i._id) === id)
                        return issue?.label || issue?.name || id
                      }).join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{preferredDate} {preferredTime && `• ${preferredTime}`}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Address: </span>
                      <span className="font-medium">{address}{city ? `, ${city}` : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="font-medium flex items-center gap-1">
                        {paymentMethod === 'online' ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                        {paymentMethod === 'online' ? 'Online' : 'Cash on Delivery'}
                      </span>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Booking Fee ({serviceType === 'roadside' ? 'Emergency' : 'Visiting Charge'})</span>
                        <span className="font-semibold">₹{bookingFee}</span>
                      </div>
                      {estimatedTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Service Cost</span>
                          <span className="font-medium">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-dashed">
                        <span className="font-semibold text-sm">Pay Now</span>
                        <span className="text-lg font-bold text-green-700">₹{bookingFee}</span>
                      </div>
                      {estimatedTotal > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Remaining ₹{(estimatedTotal - bookingFee > 0 ? estimatedTotal - bookingFee : 0).toLocaleString('en-IN')} to be paid after service completion
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info banners */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 space-y-1">
                    <p className="font-medium">Before you book:</p>
                    <p>A mechanic will be assigned and will contact you.</p>
                    {paymentMethod === 'cod' && <p>Booking fee of ₹{bookingFee} will be collected by mechanic. Remaining payment after service.</p>}
                    {paymentMethod === 'online' && <p>Booking fee of ₹{bookingFee} will be charged via Razorpay. Remaining payment after service.</p>}
                    <p>Free cancellation up to 2 hours before appointment.</p>
                  </div>
                </div>

                {submitProgress && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                    <span className="text-sm text-blue-800 font-medium">{submitProgress}</span>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55] h-12 text-base"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : paymentMethod === 'online' ? (
                    <CreditCard className="h-4 w-4 mr-2" />
                  ) : (
                    <Wrench className="h-4 w-4 mr-2" />
                  )}
                  {paymentMethod === 'online' ? `Pay ₹${bookingFee} & Book Service` : 'Confirm Booking (COD)'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── My Requests Tab ─── */}
        {activeTab === 'requests' && (
          <div>
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Login to view requests</h3>
                <p className="text-muted-foreground mb-4">You need to be logged in to see your service requests.</p>
                <Button onClick={() => router.push('/login?redirect=/service')} className="bg-[#1B3B6F]">Login</Button>
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
                  <div className="space-y-4">
                    {filteredRequests.map((req: any) => {
                      const StatusIcon = getStatusIcon(req.status)
                      const svcType = serviceTypes.find(s => s.value === req.serviceType)
                      return (
                        <div
                          key={req._id || req.id}
                          className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/service/${req._id || req.id}`)}
                        >
                          {/* Colored top strip */}
                          <div className={`h-1 ${
                            req.status === 'completed' ? 'bg-green-500' :
                            req.status === 'in_progress' ? 'bg-purple-500' :
                            req.status === 'on_way' ? 'bg-orange-500' :
                            req.status === 'cancelled' ? 'bg-red-500' :
                            ['assigned', 'accepted'].includes(req.status) ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`} />

                          <div className="p-4 sm:p-5">
                            {/* Header: icon + ID + status */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  req.serviceType === 'roadside' ? 'bg-red-100 text-red-600' :
                                  req.serviceType === 'walkin' ? 'bg-green-100 text-green-600' :
                                  'bg-blue-100 text-[#1B3B6F]'
                                }`}>
                                  {svcType ? <svcType.icon className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">#{req.requestId || (req._id || '').slice(-8).toUpperCase()}</p>
                                  <p className="text-xs text-muted-foreground">{formatDate(req.createdAt || req.preferredDate)}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(req.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {req.status?.replace(/_/g, ' ')}
                              </Badge>
                            </div>

                            {/* Service info */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">
                                {req.serviceType === 'walkin' ? '🏢 Walk-in' : req.serviceType === 'roadside' ? '🚨 Roadside' : '🏠 Home Service'}
                              </span>
                              {(req.priority === 'high' || req.priority === 'urgent') && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">
                                  {req.priority.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {req.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{req.description}</p>
                            )}

                            {/* Details row */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Car className="h-3.5 w-3.5" /> {req.vehicleType || 'N/A'}
                              </span>
                              {req.preferredDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" /> {formatDate(req.preferredDate)}
                                </span>
                              )}
                              {req.preferredTimeSlot && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" /> {req.preferredTimeSlot}
                                </span>
                              )}
                              {(req.address || req.location?.address) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[200px]">
                                    {typeof req.address === 'string' ? req.address : req.address?.address || req.location?.address || ''}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Mechanic row */}
                            {(req.mechanic || req.assignedMechanic) && (
                              <div className="flex items-center gap-2 text-sm mb-3 bg-blue-50 rounded-lg px-3 py-2">
                                <User className="h-4 w-4 text-[#1B3B6F]" />
                                <span className="font-medium">
                                  {req.mechanic?.user?.fullName || req.mechanic?.fullName || req.assignedMechanic?.fullName || 'Mechanic'}
                                </span>
                                {(req.mechanic?.user?.phone || req.mechanic?.phone || req.assignedMechanic?.phone) && (
                                  <button
                                    className="ml-auto h-8 w-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100"
                                    onClick={e => {
                                      e.stopPropagation()
                                      setCallTarget({
                                        name: req.mechanic?.user?.fullName || req.mechanic?.fullName || req.assignedMechanic?.fullName || 'Mechanic',
                                        phone: req.mechanic?.user?.phone || req.mechanic?.phone || req.assignedMechanic?.phone,
                                      })
                                    }}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Completion OTP Banner */}
                            {req.completionOtp && req.status === 'in_progress' && (
                              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-5 w-5 text-amber-600" />
                                  <div>
                                    <p className="text-xs font-bold text-amber-900">Completion OTP</p>
                                    <p className="text-xs text-amber-700">Share with mechanic</p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {String(req.completionOtp).split('').map((d: string, i: number) => (
                                    <div key={i} className="w-7 h-8 rounded border-2 border-amber-400 bg-white flex items-center justify-center">
                                      <span className="text-sm font-bold text-amber-900">{d}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Footer: cost + payment + actions */}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#1B3B6F]">
                                  {req.totalCost ? `₹${req.totalCost}` :
                                   req.estimatedCost ? `Est: ₹${req.estimatedCost}` : ''}
                                </span>
                                {req.paymentMethod && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                    req.paymentMethod === 'online'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {req.paymentMethod === 'online' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                                    {req.paymentMethod === 'online'
                                      ? (req.paymentStatus === 'paid' || req.paymentStatus === 'verified') ? 'Paid' : 'Online'
                                      : req.paymentStatus === 'cod_collected' ? 'Cash Paid' : 'COD'}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Feedback prompt for completed */}
                                {req.status === 'completed' && !req.feedback && (
                                  <button
                                    className="text-xs bg-[#1B3B6F] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#152d55]"
                                    onClick={e => { e.stopPropagation(); setRatingReq(req) }}
                                  >
                                    <Star className="h-3 w-3 inline mr-1" /> Rate
                                  </button>
                                )}
                                {req.status === 'completed' && req.feedback && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-green-600" /> Rated
                                  </span>
                                )}

                                {/* Cancel button */}
                                {['pending', 'confirmed', 'assigned'].includes(req.status?.toLowerCase()) && (
                                  <Button
                                    variant="outline" size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                    onClick={e => { e.stopPropagation(); handleCancel(req._id || req.id) }}
                                    disabled={cancellingId === (req._id || req.id)}
                                  >
                                    {cancellingId === (req._id || req.id) ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                    Cancel
                                  </Button>
                                )}

                                {/* View details */}
                                <span className="text-xs text-[#1B3B6F] font-medium flex items-center gap-0.5">
                                  View <ChevronRight className="h-3 w-3" />
                                </span>
                              </div>
                            </div>
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
