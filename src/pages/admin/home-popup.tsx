'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { HomePopupManagement } from '@/components/admin/HomePopupManagement'

export default function AdminHomePopupPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/home-popup" />
      <main className="lg:pl-72 transition-all duration-300">
        <HomePopupManagement />
      </main>
    </div>
  )
}
