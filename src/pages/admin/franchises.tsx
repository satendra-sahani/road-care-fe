'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { FranchiseManagement } from '@/components/admin/FranchiseManagement'

export default function AdminFranchisesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/franchises" />
      <main className="lg:pl-72 transition-all duration-300">
        <FranchiseManagement />
      </main>
    </div>
  )
}
