'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import {
  Store, MapPin, Clock, Phone, Mail, Star, Shield, Loader2, Save, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SPECIALIZATIONS = [
  'Engine Repair', 'Brake System', 'Electrical', 'AC Service',
  'Battery', 'Tyre Service', 'Suspension', 'Clutch',
  'Oil Change', 'Body Work', 'Painting', 'General Service',
  'Denting', 'Washing', 'Towing'
]

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Auto', 'Truck', 'Bus', 'Tractor', 'Electric Vehicle']

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function ShopProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable fields
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [street, setStreet] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [coverageRadius, setCoverageRadius] = useState(10)
  const [specializations, setSpecializations] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('20:00')
  const [workingDays, setWorkingDays] = useState<string[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await shopAPI.getProfile()
        if (res.data?.success) {
          const p = res.data.data
          setProfile(p)
          setShopName(p.shopName || '')
          setShopPhone(p.shopPhone || '')
          setStreet(p.address?.street || '')
          setLandmark(p.address?.landmark || '')
          setCity(p.address?.city || '')
          setState(p.address?.state || '')
          setPincode(p.address?.pincode || '')
          setCoverageRadius(p.coverageRadius || 10)
          setSpecializations(p.specializations || [])
          setVehicleTypes(p.vehicleTypes || [])
          setOpenTime(p.operatingHours?.open || '09:00')
          setCloseTime(p.operatingHours?.close || '20:00')
          setWorkingDays(p.operatingHours?.workingDays || [])
        }
      } catch (err) {
        console.error('Profile error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await shopAPI.updateProfile({
        shopName,
        shopPhone,
        address: { street, landmark, city, state, pincode, coordinates: profile?.address?.coordinates },
        coverageRadius,
        specializations,
        vehicleTypes,
        operatingHours: { open: openTime, close: closeTime, workingDays }
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleSpecialization = (s: string) => {
    setSpecializations(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const toggleVehicleType = (v: string) => {
    setVehicleTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const toggleDay = (d: string) => {
    setWorkingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
        <div className="flex items-center gap-2">
          {profile?.isVerified ? (
            <span className="flex items-center gap-1 text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full">
              <Shield className="h-4 w-4" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" /> Pending Verification
            </span>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Store className="h-5 w-5 text-[#FF6B35]" /> Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Shop Name</label>
            <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Shop Phone</label>
            <input type="tel" value={shopPhone} onChange={e => setShopPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Coverage Radius (km)</label>
            <input type="number" value={coverageRadius} onChange={e => setCoverageRadius(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]"
              min={1} max={50} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#FF6B35]" /> Address
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Street Address</label>
            <input type="text" value={street} onChange={e => setStreet(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Landmark</label>
            <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">State</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Pincode</label>
            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]" />
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Specializations</h2>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleSpecialization(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                specializations.includes(s)
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Types */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Vehicle Types Serviced</h2>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map(v => (
            <button
              key={v}
              onClick={() => toggleVehicleType(v)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                vehicleTypes.includes(v)
                  ? 'bg-[#0F2545] text-white border-[#0F2545]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#FF6B35]" /> Operating Hours
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Open</label>
            <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Close</label>
            <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  workingDays.includes(d)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                )}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          className="bg-[#FF6B35] hover:bg-[#e55a28] text-white px-8"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
          ) : saved ? (
            <><CheckCircle className="h-4 w-4 mr-2" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  )
}
