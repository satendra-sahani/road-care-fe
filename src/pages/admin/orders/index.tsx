'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { OrderManagement } from '@/components/admin/OrderManagement'

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/orders" />
      <main className="lg:pl-72 transition-all duration-300">
        <OrderManagement />
      </main>
    </div>
  )
}
