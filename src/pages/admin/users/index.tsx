'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { UserManagement } from '@/components/admin/UserManagement2'

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
