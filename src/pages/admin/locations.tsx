'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { LocationManagement } from '@/components/admin/LocationManagement'

export default function AdminLocationsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/locations" />
      <main className="lg:pl-72 transition-all duration-300">
        <LocationManagement />
      </main>
    </div>
  )
}
