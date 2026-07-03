'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Users,
  Wrench,
  Truck,
  Building2,
  Filter,
  Loader2,
  Search,
  Phone,
  Mail,
  Clock,
  X,
  ChevronDown,
  RefreshCw,
  Maximize2,
  List,
  Map as MapIconLucide,
  User,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminHeader } from './AdminHeader'
import { cn } from '@/lib/utils'
import { userAPI } from '@/services/api'

// Dynamic import for Leaflet (no SSR)
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F] mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
})

interface LocationUser {
  _id: string
  fullName: string
  username: string
  email: string
  phone: string
  role: string
  avatar?: string
  isActive: boolean
  lastActive?: string
  location?: {
    address?: string
    landmark?: string
    city?: string
    state?: string
    pincode?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  savedAddresses?: Array<{
    label: string
    address: string
    city: string
    state: string
    coordinates?: { latitude: number; longitude: number }
  }>
}

const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
  customer: { bg: 'bg-blue-50', text: 'text-blue-700', dot: '#3B82F6' },
  mechanic: { bg: 'bg-orange-50', text: 'text-orange-700', dot: '#F97316' },
  delivery: { bg: 'bg-green-50', text: 'text-green-700', dot: '#22C55E' },
  admin: { bg: 'bg-purple-50', text: 'text-purple-700', dot: '#A855F7' },
  manager: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: '#6366F1' },
  staff: { bg: 'bg-pink-50', text: 'text-pink-700', dot: '#EC4899' },
}

const roleIcons: Record<string, React.ElementType> = {
  customer: Users,
  mechanic: Wrench,
  delivery: Truck,
  admin: Building2,
  manager: Building2,
  staff: User,
}

// Left-edge row stripe by active/inactive status — makes the list scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  active: '#22c55e',
  inactive: '#94a3b8',
}

export function LocationManagement() {
  const [users, setUsers] = useState<LocationUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<LocationUser | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [mapExpanded, setMapExpanded] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { limit: 500 }
      if (roleFilter !== 'all') params.role = roleFilter

      const res = await userAPI.getAll(params)
      const data = res.data?.data?.users || res.data?.data || res.data?.users || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Users with coordinates
  const usersWithLocation = useMemo(() => {
    return users.filter(u => {
      const coords = u.location?.coordinates
      return coords && coords.latitude && coords.longitude
    })
  }, [users])

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = usersWithLocation
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.location?.city?.toLowerCase().includes(q) ||
        u.location?.address?.toLowerCase().includes(q)
      )
    }
    return list
  }, [usersWithLocation, search])

  // Map markers
  const markers = useMemo(() => {
    return filteredUsers.map(u => ({
      id: u._id,
      lat: u.location!.coordinates!.latitude,
      lng: u.location!.coordinates!.longitude,
      name: u.fullName || u.username || 'Unknown',
      role: u.role,
      color: roleColors[u.role]?.dot || '#6B7280',
      address: u.location?.address || u.location?.city || '',
      phone: u.phone,
      isActive: u.isActive,
    }))
  }, [filteredUsers])

  // Role counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    usersWithLocation.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1
    })
    return counts
  }, [usersWithLocation])

  const formatDate = (d?: string) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1B3B6F]/10">
              <MapPin className="h-5 w-5 text-[#1B3B6F]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D29] tracking-tight">Location Tracking</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                View and track user, mechanic, and delivery partner locations on the map
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-gray-200"
              onClick={() => fetchUsers()}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-9 rounded-none', viewMode === 'map' && 'bg-[#1B3B6F] hover:bg-[#0F2545]')}
                onClick={() => setViewMode('map')}
              >
                <MapIconLucide className="h-4 w-4 mr-1.5" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={cn('h-9 rounded-none', viewMode === 'list' && 'bg-[#1B3B6F] hover:bg-[#0F2545]')}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1.5" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setError('')}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total on Map</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50">
                  <MapPin className="h-[18px] w-[18px] text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{usersWithLocation.length}</p>
              <p className="text-xs text-gray-400">users with coordinates</p>
            </CardContent>
          </Card>
          {['customer', 'mechanic', 'delivery', 'admin'].map(role => {
            const Icon = roleIcons[role] || Users
            const colors = roleColors[role]
            const active = roleFilter === role
            return (
              <Card
                key={role}
                className={cn(
                  'rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
                  active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'
                )}
                onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 capitalize">{role}s</p>
                    <div className={cn('grid h-9 w-9 place-items-center rounded-xl', colors?.bg)}>
                      <Icon className={cn('h-[18px] w-[18px]', colors?.text)} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{roleCounts[role] || 0}</p>
                  {active ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>
                  ) : (
                    <p className="text-xs text-gray-400">on map</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filter Bar */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, city..."
                className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="mechanic">Mechanics</SelectItem>
                <SelectItem value="delivery">Delivery Partners</SelectItem>
                <SelectItem value="admin">Admin / Staff</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-[#6B7280] ml-auto">
              <span className="font-semibold text-[#1A1D29] tabular-nums">{filteredUsers.length}</span> of{' '}
              <span className="tabular-nums">{users.length}</span> users on map
              {users.length - usersWithLocation.length > 0 && (
                <span className="text-amber-600 ml-1">
                  ({users.length - usersWithLocation.length} without location)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
          </div>
        ) : viewMode === 'map' ? (
          /* ─── Map View ─── */
          <div className={cn(
            'grid gap-4 transition-all',
            mapExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_340px]'
          )}>
            {/* Map Container */}
            <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className={cn(
                    'w-full transition-all',
                    mapExpanded ? 'h-[calc(100vh-280px)]' : 'h-[500px] lg:h-[600px]'
                  )}>
                    <LocationMap
                      markers={markers}
                      selectedId={selectedUser?._id || null}
                      onMarkerClick={(id) => {
                        const user = filteredUsers.find(u => u._id === id)
                        setSelectedUser(user || null)
                      }}
                    />
                  </div>
                  {/* Map Controls */}
                  <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white shadow-md rounded-xl"
                      onClick={() => setMapExpanded(!mapExpanded)}
                      title={mapExpanded ? 'Collapse' : 'Expand'}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-md p-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {Object.entries(roleColors).slice(0, 4).map(([role, colors]) => (
                        <div key={role} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                          <span className="text-[10px] text-gray-600 capitalize">{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar - User List / Details */}
            {!mapExpanded && (
              <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 border-b border-gray-200 bg-[#F6F8FB]">
                    <h3 className="text-sm font-semibold text-[#1A1D29]">
                      {selectedUser ? 'User Details' : `Users on Map (${filteredUsers.length})`}
                    </h3>
                  </div>
                  <div className="h-[540px] lg:h-[555px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {selectedUser ? (
                      /* Selected User Detail */
                      <div className="p-4 space-y-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs -ml-2"
                          onClick={() => setSelectedUser(null)}
                        >
                          <X className="h-3 w-3 mr-1" /> Back to list
                        </Button>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 border-2 border-gray-200">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback className="bg-[#1B3B6F] text-white font-bold">
                              {(selectedUser.fullName || selectedUser.username || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-[#1A1D29]">{selectedUser.fullName || selectedUser.username}</p>
                            <Badge className={cn('text-[10px]', roleColors[selectedUser.role]?.bg, roleColors[selectedUser.role]?.text)}>
                              {selectedUser.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {selectedUser.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[#6B7280]">{selectedUser.phone}</span>
                            </div>
                          )}
                          {selectedUser.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[#6B7280] truncate">{selectedUser.email}</span>
                            </div>
                          )}
                          {selectedUser.lastActive && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[#6B7280]">Last active: {formatDate(selectedUser.lastActive)}</span>
                            </div>
                          )}
                        </div>

                        {/* Location Details */}
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                          {selectedUser.location?.address && (
                            <p className="text-sm text-[#1A1D29]">{selectedUser.location.address}</p>
                          )}
                          {selectedUser.location?.landmark && (
                            <p className="text-xs text-[#6B7280]">Near: {selectedUser.location.landmark}</p>
                          )}
                          <p className="text-xs text-[#6B7280]">
                            {[selectedUser.location?.city, selectedUser.location?.state, selectedUser.location?.pincode].filter(Boolean).join(', ')}
                          </p>
                          {selectedUser.location?.coordinates && (
                            <p className="text-[10px] font-mono text-gray-400">
                              {selectedUser.location.coordinates.latitude.toFixed(6)}, {selectedUser.location.coordinates.longitude.toFixed(6)}
                            </p>
                          )}
                        </div>

                        {/* Saved Addresses */}
                        {selectedUser.savedAddresses && selectedUser.savedAddresses.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved Addresses</p>
                            {selectedUser.savedAddresses.map((addr, i) => (
                              <div key={i} className="bg-gray-50 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Badge variant="outline" className="text-[10px] h-4">{addr.label}</Badge>
                                </div>
                                <p className="text-xs text-[#6B7280]">{addr.address}</p>
                                <p className="text-[10px] text-gray-400">{[addr.city, addr.state].filter(Boolean).join(', ')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* User List */
                      <div>
                        {filteredUsers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <MapPin className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-sm font-medium text-gray-500">No users with location data</p>
                            <p className="text-xs text-gray-400 mt-1">Users need to set their location to appear here</p>
                          </div>
                        ) : (
                          filteredUsers.map(user => {
                            const colors = roleColors[user.role] || roleColors.customer
                            return (
                              <div
                                key={user._id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#1B3B6F]/[0.03] cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                onClick={() => setSelectedUser(user)}
                              >
                                <div className="relative">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-[#1B3B6F] text-white text-xs font-bold">
                                      {(user.fullName || user.username || '?').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div
                                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                                    style={{ backgroundColor: colors.dot }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#1A1D29] truncate">
                                    {user.fullName || user.username}
                                  </p>
                                  <p className="text-[10px] text-[#6B7280] truncate">
                                    {user.location?.city || user.location?.address || 'No address'}
                                  </p>
                                </div>
                                <Eye className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* ─── List View ─── */
          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F6F8FB] border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Coordinates</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No users with location data found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const colors = roleColors[user.role] || roleColors.customer
                        return (
                          <tr
                            key={user._id}
                            className="border-b border-gray-100 last:border-0 hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                            style={{ borderLeftColor: STATUS_STRIPE[user.isActive ? 'active' : 'inactive'] }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="bg-[#1B3B6F] text-white text-xs font-bold">
                                    {(user.fullName || user.username || '?').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-[#1A1D29]">{user.fullName || user.username}</p>
                                  <p className="text-[10px] text-[#6B7280]">{user.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn('text-[10px] capitalize font-semibold', colors.bg, colors.text)}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-[#6B7280] max-w-[200px] truncate">
                                {user.location?.address || '-'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-[#6B7280]">{user.location?.city || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[10px] font-mono text-gray-400">
                                {user.location?.coordinates?.latitude.toFixed(4)}, {user.location?.coordinates?.longitude.toFixed(4)}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={cn('text-[10px] font-semibold', user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs rounded-lg hover:bg-[#1B3B6F]/10 hover:text-[#1B3B6F]"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setViewMode('map')
                                }}
                              >
                                <MapPin className="h-3 w-3 mr-1" /> View on Map
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
