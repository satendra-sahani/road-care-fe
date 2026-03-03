'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { BannerManagement } from '@/components/admin/BannerManagement'

export default function AdminBannersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/banners" />
      <main className="lg:pl-72 transition-all duration-300">
        <BannerManagement />
      </main>
    </div>
  )
}
