'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SpinWheelManagement } from '@/components/admin/SpinWheelManagement'

export default function AdminSpinWheelPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/growth/spin-wheel" />
      <main className="lg:pl-72 transition-all duration-300">
        <SpinWheelManagement />
      </main>
    </div>
  )
}
