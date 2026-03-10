'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ShopPartnerManagement } from '@/components/admin/ShopPartnerManagement'

export default function AdminShopsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/shops" />
      <main className="lg:pl-72 transition-all duration-300">
        <ShopPartnerManagement />
      </main>
    </div>
  )
}
