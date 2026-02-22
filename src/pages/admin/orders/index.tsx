'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { OrderManagement } from '@/components/admin/OrderManagement'

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/orders" />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-4 sm:p-6 pt-16 lg:pt-6">
          <OrderManagement />
        </div>
      </main>
    </div>
  )
}
