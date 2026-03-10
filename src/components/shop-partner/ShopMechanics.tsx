'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import {
  Users, Plus, Edit, Trash2, Phone, Wrench, Loader2, UserCheck, UserX,
  Star, CheckCircle, Shield, Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ShopMechanics() {
  const [mechanics, setMechanics] = useState<any[]>([])
  const [assignedMechanics, setAssignedMechanics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'assigned' | 'manual'>('assigned')

  const fetchMechanics = async () => {
    try {
      const [profileRes, assignedRes] = await Promise.all([
        shopAPI.getProfile(),
        shopAPI.getAssignedMechanics()
      ])
      if (profileRes.data?.success) {
        setMechanics(profileRes.data.data.mechanics || [])
      }
      if (assignedRes.data?.success) {
        setAssignedMechanics(assignedRes.data.data || [])
      }
    } catch (err) {
      console.error('Fetch mechanics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMechanics()
  }, [])

  const handleAdd = async () => {
    if (!name || !phone) return alert('Name and phone are required')
    setActionLoading(true)
    try {
      await shopAPI.addMechanic({ name, phone, specialization })
      setShowDialog(false)
      resetForm()
      fetchMechanics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !name || !phone) return
    setActionLoading(true)
    try {
      await shopAPI.updateMechanic(editingId, { name, phone, specialization })
      setShowDialog(false)
      resetForm()
      fetchMechanics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this mechanic?')) return
    try {
      await shopAPI.removeMechanic(id)
      fetchMechanics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove')
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await shopAPI.updateMechanic(id, { isActive: !currentActive })
      fetchMechanics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const resetForm = () => {
    setName('')
    setPhone('')
    setSpecialization('')
    setEditingId(null)
  }

  const openEdit = (mechanic: any) => {
    setName(mechanic.name)
    setPhone(mechanic.phone)
    setSpecialization(mechanic.specialization || '')
    setEditingId(mechanic._id)
    setShowDialog(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  const totalCount = assignedMechanics.length + mechanics.length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Mechanics</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalCount} total ({assignedMechanics.length} platform + {mechanics.length} manual)
          </p>
        </div>
        <Button
          className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
          onClick={() => { resetForm(); setActiveTab('manual'); setShowDialog(true) }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Manual
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('assigned')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'assigned'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Shield className="h-4 w-4" />
          Platform Mechanics ({assignedMechanics.length})
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            activeTab === 'manual'
              ? 'bg-[#0F2545] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Users className="h-4 w-4" />
          Manual Mechanics ({mechanics.length})
        </button>
      </div>

      {/* Platform Mechanics Tab */}
      {activeTab === 'assigned' && (
        <>
          {assignedMechanics.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No platform mechanics assigned</p>
              <p className="text-sm mt-1 text-gray-400">
                Admin will assign verified mechanics to your shop
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedMechanics.map((mechanic: any) => (
                <div key={mechanic._id} className="bg-white rounded-xl border border-indigo-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {mechanic.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{mechanic.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {mechanic.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        mechanic.availability === 'available' ? 'bg-green-100 text-green-700' :
                        mechanic.availability === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {mechanic.availability || 'N/A'}
                      </span>
                      {mechanic.isVerified && (
                        <span className="text-xs text-indigo-600 flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specializations */}
                  {mechanic.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mechanic.specializations.slice(0, 3).map((s: string) => (
                        <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                      {mechanic.specializations.length > 3 && (
                        <span className="text-xs text-gray-400">+{mechanic.specializations.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                    {mechanic.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="h-3.5 w-3.5" /> {mechanic.rating?.toFixed(1)}
                      </span>
                    )}
                    {mechanic.completedJobs > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {mechanic.completedJobs} jobs
                      </span>
                    )}
                    {mechanic.experience && (
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5" /> {mechanic.experience}
                      </span>
                    )}
                  </div>

                  <div className="bg-indigo-50 rounded-lg px-3 py-1.5 text-xs text-indigo-600 text-center">
                    Assigned by Admin
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Manual Mechanics Tab */}
      {activeTab === 'manual' && (
        <>
          {mechanics.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No manual mechanics added</p>
              <p className="text-sm mt-1">Add your shop employees to assign them to orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mechanics.map((mechanic: any) => (
                <div key={mechanic._id} className={cn(
                  'bg-white rounded-xl border p-5 space-y-3 transition-all',
                  mechanic.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                        mechanic.isActive ? 'bg-green-500' : 'bg-gray-400'
                      )}>
                        {mechanic.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{mechanic.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {mechanic.phone}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      mechanic.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {mechanic.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {mechanic.specialization && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Wrench className="h-3.5 w-3.5 text-gray-400" />
                      {mechanic.specialization}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(mechanic)}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className={mechanic.isActive ? 'text-amber-600' : 'text-green-600'}
                      onClick={() => handleToggleActive(mechanic._id, mechanic.isActive)}
                    >
                      {mechanic.isActive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                      {mechanic.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRemove(mechanic._id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog (Manual Mechanics only) */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit Mechanic' : 'Add Manual Mechanic'}
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Mechanic name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Specialization</label>
              <select
                value={specialization} onChange={e => setSpecialization(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="">Select (optional)</option>
                <option value="General Service">General Service</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Electrical">Electrical</option>
                <option value="AC Service">AC Service</option>
                <option value="Brake System">Brake System</option>
                <option value="Tyre Service">Tyre Service</option>
                <option value="Body Work">Body Work</option>
                <option value="Oil Change">Oil Change</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editingId ? 'Update' : 'Add Mechanic'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
