'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { UserManagement } from '@/components/admin/UserManagement'

export default function AdminMechanicsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/mechanics" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <UserManagement />
      </main>
    </div>
  )
}
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DUMMY_MECHANICS } from '@/lib/constants'
import { Plus, Search, Edit, Trash2, Eye, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminMechanicsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [mechanics, setMechanics] = useState(DUMMY_MECHANICS)

  const filteredMechanics = mechanics.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm('Delete this mechanic?')) {
      setMechanics(mechanics.filter((m) => m.id !== id))
    }
  }

  const toggleActive = (id: string) => {
    setMechanics(
      mechanics.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      )
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar currentPath="/admin/mechanics" />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mechanics Management</h1>
              <p className="text-muted-foreground">Manage certified mechanics and service providers</p>
            </div>
            <Link href="/admin/mechanics/new">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90">
                <Plus size={20} /> Add Mechanic
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
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

          {/* Mechanics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMechanics.map((mechanic) => (
              <Card key={mechanic.id} className="p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{mechanic.name}</h3>
                    <p className="text-sm text-muted-foreground">{mechanic.email}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      mechanic.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {mechanic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{mechanic.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Jobs</span>
                    <span className="font-bold">{mechanic.totalJobs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-xs">{mechanic.joinDate}</span>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-muted-foreground mb-2">SPECIALIZATIONS</p>
                  <div className="flex flex-wrap gap-1">
                    {mechanic.specializations.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => toggleActive(mechanic.id)}
                  >
                    {mechanic.isActive ? '⊘ Deactivate' : '✓ Activate'}
                  </Button>
                  <button className="p-2 hover:bg-muted rounded-lg transition">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 hover:bg-muted rounded-lg transition text-primary">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(mechanic.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {filteredMechanics.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No mechanics found</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
