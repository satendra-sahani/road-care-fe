'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { UserManagement } from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/users" />
      <main className="lg:pl-72 transition-all duration-300">
        <UserManagement />
      </main>
    </div>
  )
}
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DUMMY_USERS, DUMMY_MECHANICS, DUMMY_DELIVERY_PERSONS } from '@/lib/constants'
import { Plus, Search, Edit, Trash2, Eye, Shield, Ban } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [userType, setUserType] = useState<'users' | 'mechanics' | 'delivery'>('users')
  const [users, setUsers] = useState(DUMMY_USERS)
  const [mechanics, setMechanics] = useState(DUMMY_MECHANICS)
  const [deliveryPersons, setDeliveryPersons] = useState(DUMMY_DELIVERY_PERSONS)

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMechanics = mechanics.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDelivery = deliveryPersons.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteUser = (id: string) => {
    if (confirm('Delete this user?')) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const handleDeleteMechanic = (id: string) => {
    if (confirm('Delete this mechanic?')) {
      setMechanics(mechanics.filter((m) => m.id !== id))
    }
  }

  const handleDeleteDelivery = (id: string) => {
    if (confirm('Delete this delivery person?')) {
      setDeliveryPersons(deliveryPersons.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar currentPath="/admin/users" />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage customers, mechanics, and delivery persons</p>
            </div>
            <Link href="/admin/users/new">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90">
                <Plus size={20} /> Add User
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            {[
              { id: 'users', label: 'Customers' },
              { id: 'mechanics', label: 'Mechanics' },
              { id: 'delivery', label: 'Delivery Boys' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserType(tab.id as typeof userType)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  userType === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted" size={20} />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </Card>

          {/* Users Table */}
          {userType === 'users' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-6 py-4 font-semibold">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.phone}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-muted rounded-lg transition">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-lg transition text-primary">
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Mechanics Table */}
          {userType === 'mechanics' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Jobs</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMechanics.map((mechanic) => (
                      <tr key={mechanic.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-6 py-4 font-semibold">{mechanic.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{mechanic.email}</td>
                        <td className="px-6 py-4 font-bold">⭐ {mechanic.rating}</td>
                        <td className="px-6 py-4 text-sm">{mechanic.totalJobs}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              mechanic.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {mechanic.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-muted rounded-lg transition">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-lg transition text-primary">
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMechanic(mechanic.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Delivery Table */}
          {userType === 'delivery' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-bold">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Vehicle</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Deliveries</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDelivery.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-6 py-4 font-semibold">{delivery.name}</td>
                        <td className="px-6 py-4 text-sm">{delivery.vehicle}</td>
                        <td className="px-6 py-4 font-bold">⭐ {delivery.rating}</td>
                        <td className="px-6 py-4 text-sm">{delivery.totalDeliveries}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              delivery.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {delivery.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-muted rounded-lg transition">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-lg transition text-primary">
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDelivery(delivery.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
