'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import {
  sendOtpRequest,
  verifyOtpRequest,
  registerRequest,
  resetOtpFlow,
  clearError,
} from '@/store/slices/customerAuthSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Phone, ArrowLeft, Loader2, MapPin, Locate } from 'lucide-react'
import Image from 'next/image'
import { SEOHead } from '@/components/SEOHead'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { toast } from 'sonner'
import Link from 'next/link'
import Cookies from 'js-cookie'

type Step = 'phone' | 'otp' | 'register'

export default function CustomerLoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const {
    isAuthenticated, user,
    otpSending, otpSent,
    otpPurpose,
    otpVerifying, otpVerified,
    isNewUser, verificationToken,
    registering,
    error, phone: savedPhone,
  } = useSelector((state: RootState) => state.customerAuth)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('')
  const [addrState, setAddrState] = useState('')
  const [pincode, setPincode] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [detectedAddress, setDetectedAddress] = useState('')

  const redirectTo = (router.query.redirect as string) || '/'

  // If already logged in (on page load), redirect
  // Skip during OTP flow — role-based redirect is handled separately
  useEffect(() => {
    if ((isAuthenticated || Cookies.get('customer_token')) && !otpVerified) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated])

  // Handle OTP sent
  useEffect(() => {
    if (otpSent && step === 'phone') {
      setStep('otp')
      toast.success('OTP sent to +91 ' + phone)
    }
  }, [otpSent])

  // Handle OTP verified — redirect based on user role
  useEffect(() => {
    if (otpVerified) {
      if (isNewUser) {
        setStep('register')
      } else {
        const userRole = user?.role
        toast.success('Login successful!')

        if (userRole === 'shop') {
          // Set token cookie for shop auth guard compatibility
          const customerToken = Cookies.get('customer_token')
          if (customerToken) Cookies.set('token', customerToken, { expires: 7 })
          router.replace('/shop-partner')
        } else if (userRole === 'admin') {
          const customerToken = Cookies.get('customer_token')
          if (customerToken) Cookies.set('token', customerToken, { expires: 7 })
          router.replace('/admin')
        } else if (userRole === 'delivery') {
          toast.info('Delivery dashboard is available on mobile app. You can browse as customer.')
          router.replace('/')
        } else if (userRole === 'mechanic') {
          toast.info('Mechanic dashboard is available on mobile app. You can browse as customer.')
          router.replace('/')
        } else {
          // Default: customer/user role
          router.replace(redirectTo)
        }
      }
    }
  }, [otpVerified, isNewUser])

  // Handle registration success
  useEffect(() => {
    if (isAuthenticated && step === 'register') {
      toast.success('Account created successfully!')
      router.replace(redirectTo)
    }
  }, [isAuthenticated, step])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error])

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    dispatch(sendOtpRequest(phone))
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit OTP')
      return
    }
    dispatch(verifyOtpRequest({ phone, otp, purpose: otpPurpose }))
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!verificationToken) {
      toast.error('Session expired. Please try again.')
      setStep('phone')
      dispatch(resetOtpFlow())
      return
    }
    dispatch(registerRequest({
      verificationToken,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      landmark: landmark.trim() || undefined,
      state: addrState.trim() || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      pincode: pincode.trim() || undefined,
    }))
  }

  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    setDetectedAddress('Detecting location...')

    if (!navigator.geolocation) {
      setDetectingLocation(false)
      setDetectedAddress('')
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        setLatitude(lat)
        setLongitude(lng)

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
          )
          const data = await resp.json()
          if (data?.address) {
            const a = data.address
            const addrLine = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ')
            if (addrLine && !address) setAddress(addrLine)
            if ((a.suburb || a.neighbourhood) && !landmark) setLandmark(a.suburb || a.neighbourhood || '')
            if ((a.city || a.town || a.village || a.state_district) && !city) setCity(a.city || a.town || a.village || a.state_district || '')
            if (a.state && !addrState) setAddrState(a.state || '')
            if (a.postcode && !pincode) setPincode(a.postcode || '')
            setDetectedAddress(data.display_name || addrLine || `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          } else {
            setDetectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          }
        } catch {
          setDetectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
        setDetectingLocation(false)
      },
      () => {
        setDetectingLocation(false)
        setDetectedAddress('')
        toast.error('Could not detect location. Please enter your address manually.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone')
      setOtp('')
    } else if (step === 'register') {
      setStep('phone')
      dispatch(resetOtpFlow())
      setOtp('')
    }
  }

  return (
    <>
    <SEOHead
      title="Login"
      description="Sign in to Bharat Mechanics. Access your orders, service bookings, and manage your vehicle maintenance with India's trusted auto parts and mechanic platform."
      keywords="Bharat Mechanics login, auto parts account, mechanic booking login"
    />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="https://ik.imagekit.io/aiwats/roadcare/brand-logo.png"
              alt="Bharat Mechanics"
              width={200}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            {step !== 'phone' && (
              <button onClick={handleBack} className="absolute left-4 top-4 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <CardTitle className="text-xl font-bold">
              {step === 'phone' && 'Welcome to RoadCare'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'register' && 'Complete Profile'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && 'Enter your phone number to continue'}
              {step === 'otp' && `Enter the 6-digit code sent to +91 ${phone}`}
              {step === 'register' && 'Just a few more details to get started'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Step 1: Phone Number */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-100 rounded-md border text-sm font-medium text-gray-600">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55] text-white h-11"
                  disabled={otpSending || phone.length < 10}
                >
                  {otpSending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                  ) : (
                    <><Phone className="mr-2 h-4 w-4" /> Send OTP</>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1B3B6F] hover:bg-[#152d55] text-white h-11"
                  disabled={otpVerifying || otp.length < 6}
                >
                  {otpVerifying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => dispatch(sendOtpRequest(phone))}
                  className="w-full text-sm text-[#1B3B6F] hover:underline"
                  disabled={otpSending}
                >
                  {otpSending ? 'Resending...' : 'Resend OTP'}
                </button>
              </form>
            )}

            {/* Step 3: Registration */}
            {step === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* GPS Detect Button */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-blue-300 rounded-lg text-sm font-medium text-[#1B3B6F] hover:bg-blue-50 transition disabled:opacity-60"
                >
                  {detectingLocation ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Detecting location...</>
                  ) : (
                    <><Locate className="h-4 w-4" /> Detect My Location via GPS</>
                  )}
                </button>
                {detectedAddress && !detectingLocation && (
                  <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 line-clamp-2">{detectedAddress}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="House no, Street, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    placeholder="Near temple, school, etc."
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addrState">State</Label>
                    <Input
                      id="addrState"
                      placeholder="State"
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="6-digit pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FF6B35] hover:bg-[#e55a2a] text-white h-11"
                  disabled={registering || !fullName.trim()}
                >
                  {registering ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Admin login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Admin? <Link href="/admin/login" className="text-[#1B3B6F] hover:underline font-medium">Login here</Link>
        </p>
      </div>
    </div>
    </>
  )
}
