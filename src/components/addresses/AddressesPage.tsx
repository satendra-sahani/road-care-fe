'use client'

import { useState, useEffect } from 'react'
import { userAddressAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  MapPin, Plus, Edit, Trash2, Star, Loader2, Home, Briefcase, MapPinned,
} from 'lucide-react'

interface Address {
  _id: string
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  type: 'Home' | 'Work' | 'Other'
  isDefault: boolean
}

const emptyForm = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  type: 'Home' as 'Home' | 'Work' | 'Other',
  isDefault: false,
}

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await userAddressAPI.getAll()
      if (res.data.success) {
        setAddresses(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (addr: Address) => {
    setEditingId(addr._id)
    setForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      type: addr.type || 'Home',
      isDefault: addr.isDefault || false,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    if (!form.address.trim()) {
      toast.error('Address is required')
      return
    }
    if (!form.city.trim()) {
      toast.error('City is required')
      return
    }
    if (!form.state.trim()) {
      toast.error('State is required')
      return
    }
    if (!form.pincode.trim()) {
      toast.error('Pincode is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        type: form.type,
        isDefault: form.isDefault,
      }

      let res
      if (editingId) {
        res = await userAddressAPI.update(editingId, payload)
      } else {
        res = await userAddressAPI.add(payload)
      }

      if (res.data.success) {
        toast.success(editingId ? 'Address updated' : 'Address added')
        setDialogOpen(false)
        fetchAddresses()
      } else {
        toast.error(res.data.message || 'Failed to save address')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await userAddressAPI.delete(id)
      if (res.data.success) {
        toast.success('Address deleted')
        fetchAddresses()
      } else {
        toast.error(res.data.message || 'Failed to delete address')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete address')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    try {
      const res = await userAddressAPI.setDefault(id)
      if (res.data.success) {
        toast.success('Default address updated')
        fetchAddresses()
      } else {
        toast.error(res.data.message || 'Failed to set default')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set default address')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Home':
        return <Home className="h-4 w-4" />
      case 'Work':
        return <Briefcase className="h-4 w-4" />
      default:
        return <MapPinned className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl md:max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Addresses</h1>
          <Button onClick={openAddDialog} className="bg-[#1B3B6F] hover:bg-[#152d55] text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Address
          </Button>
        </div>

        {/* Address List */}
        {addresses.length === 0 ? (
          /* Empty State */
          <div className="bg-white border rounded-xl p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No addresses yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Add your first address to make checkout faster and easier.
            </p>
            <Button onClick={openAddDialog} className="bg-[#1B3B6F] hover:bg-[#152d55] text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map(addr => (
              <div
                key={addr._id}
                className={`bg-white border rounded-xl p-5 relative transition-shadow hover:shadow-md ${
                  addr.isDefault ? 'border-[#1B3B6F] ring-1 ring-[#1B3B6F]/20' : ''
                }`}
              >
                {/* Type Badge and Default Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {getTypeIcon(addr.type)}
                    {addr.type}
                  </Badge>
                  {addr.isDefault && (
                    <Badge className="bg-[#1B3B6F] text-white text-xs">
                      Default
                    </Badge>
                  )}
                </div>

                {/* Name and Phone */}
                <h3 className="font-semibold text-foreground">{addr.fullName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>

                {/* Full Address */}
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {[addr.address, addr.city, addr.state, addr.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(addr)}
                    className="text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    {deletingId === addr._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </>
                    )}
                  </Button>

                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(addr._id)}
                      disabled={settingDefaultId === addr._id}
                      className="text-xs text-[#1B3B6F] hover:text-[#152d55] ml-auto"
                    >
                      {settingDefaultId === addr._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Star className="h-3.5 w-3.5 mr-1" />
                      )}
                      Set as Default
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the details of your saved address.'
                : 'Fill in the details to add a new delivery address.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="House/Flat No., Street, Area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Pincode *</Label>
                <Input
                  value={form.pincode}
                  onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
                  placeholder="560001"
                  maxLength={6}
                />
              </div>
              <div>
                <Label>Address Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val: 'Home' | 'Work' | 'Other') =>
                    setForm(p => ({ ...p, type: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={form.isDefault}
                onCheckedChange={(checked: boolean) =>
                  setForm(p => ({ ...p, isDefault: !!checked }))
                }
              />
              <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1B3B6F] hover:bg-[#152d55] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                  </>
                ) : editingId ? (
                  'Update Address'
                ) : (
                  'Add Address'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UserLayout>
  )
}
