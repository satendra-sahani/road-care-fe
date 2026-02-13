'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin" />
      <main className="lg:pl-72 transition-all duration-300">
        <AdminDashboard />
      </main>
    </div>
  )
}
