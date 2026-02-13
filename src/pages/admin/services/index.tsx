'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ServiceManagement } from '@/components/admin/ServiceManagement'

export default function AdminServicesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <ServiceManagement />
      </main>
    </div>
  )
}