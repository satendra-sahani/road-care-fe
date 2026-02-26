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
