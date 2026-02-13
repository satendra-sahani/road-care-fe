import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { OrderManagement } from '@/components/admin/OrderManagement'

export default function AdminOrdersPendingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/orders/pending" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <OrderManagement />
      </main>
    </div>
  )
}