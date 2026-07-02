'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { customerLogout } from '@/store/slices/customerAuthSlice'
import { userProfileAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Mail, Phone, MapPin, Package, Wrench, Wallet, Bell, Star, MapPinned,
  LogOut, Edit, Save, X, Loader2, ChevronRight, Shield, QrCode, ScanLine,
  Sparkles, Gift,
} from 'lucide-react'
import { BMCareProfileCard } from '@/components/subscription/BMCareStrip'

export function ProfilePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { user: authUser } = useSelector((state: RootState) => state.customerAuth)

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({ fullName: '', email: '' })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await userProfileAPI.get()
      if (res.data.success) {
        setProfile(res.data.data)
        setEditData({
          fullName: res.data.data.fullName || '',
          email: res.data.data.email || '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editData.fullName.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await userProfileAPI.update({
        fullName: editData.fullName.trim(),
        email: editData.email.trim() || undefined,
      })
      if (res.data.success) {
        toast.success('Profile updated')
        setEditing(false)
        fetchProfile()
      } else {
        toast.error(res.data.message || 'Failed to update')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    dispatch(customerLogout())
    router.push('/')
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl md:max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-48 bg-gray-200 rounded-xl mb-4" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </UserLayout>
    )
  }

  const data = profile || authUser || {}

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">My Profile</h1>

        {/* Profile Card */}
        <div className="bg-white border rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-2xl font-bold">
                {(data.fullName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{data.fullName || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{data.role || 'Customer'}</p>
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={editData.fullName} onChange={e => setEditData(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-[#1B3B6F]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{data.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{data.email || 'Not set'}</span>
              </div>
              {data.location?.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {[data.location.address, data.location.city, data.location.state, data.location.pincode]
                      .filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BM Care membership card */}
        <div className="mb-4">
          <BMCareProfileCard />
        </div>

        {/* Quick Links */}
        <div className="bg-white border rounded-xl divide-y mb-4">
          {[
            { icon: Edit, label: 'Edit Profile', href: '/profile/edit', desc: 'Update your photo and details', color: 'bg-slate-100', iconColor: 'text-[#1B3B6F]' },
            { icon: Shield, label: 'BM Care Membership', href: '/subscription', desc: 'Free services & priority', color: 'bg-[#EAF0FA]', iconColor: 'text-[#1B3B6F]' },
            { icon: QrCode, label: 'My Vehicle QR', href: '/vehicle-qr', desc: 'SecureContact · private', color: 'bg-orange-50', iconColor: 'text-[#FF6B35]' },
            { icon: ScanLine, label: 'Scan vehicle QR', href: '/scan', desc: 'Reach a parked vehicle’s owner', color: 'bg-[#E6F6F8]', iconColor: 'text-[#12A4B4]' },
            { icon: Sparkles, label: 'Spin & Win', href: '/spin', desc: 'Free daily spin, win rewards', color: 'bg-orange-50', iconColor: 'text-[#FF6B35]' },
            { icon: Gift, label: 'Refer & Earn', href: '/refer', desc: 'Invite friends, both get rewarded', color: 'bg-green-50', iconColor: 'text-green-600' },
            { icon: Package, label: 'My Orders', href: '/orders', desc: 'View order history and track deliveries', color: 'bg-blue-50', iconColor: 'text-[#1B3B6F]' },
            { icon: Wrench, label: 'Service Requests', href: '/service', desc: 'View your service bookings', color: 'bg-orange-50', iconColor: 'text-[#FF6B35]' },
            { icon: MapPinned, label: 'My Addresses', href: '/addresses', desc: 'Manage delivery addresses', color: 'bg-green-50', iconColor: 'text-green-600' },
            { icon: Wallet, label: 'Wallet', href: '/wallet', desc: 'View balance and transactions', color: 'bg-purple-50', iconColor: 'text-purple-600' },
            { icon: Bell, label: 'Notifications', href: '/notifications', desc: 'View your notifications', color: 'bg-yellow-50', iconColor: 'text-yellow-600' },
            { icon: Star, label: 'My Reviews', href: '/reviews', desc: 'Manage your product reviews', color: 'bg-amber-50', iconColor: 'text-amber-600' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout}
          className="w-full border-red-300 text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </UserLayout>
  )
}
