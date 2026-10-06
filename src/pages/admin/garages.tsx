'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { GarageManagement } from '@/components/admin/GarageManagement'

export default function AdminGaragesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/garages" />
      <main className="lg:pl-72 transition-all duration-300">
        <GarageManagement />
      </main>
    </div>
  )
}
