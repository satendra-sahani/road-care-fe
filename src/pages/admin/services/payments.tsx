import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PaymentManagement } from '@/components/admin/PaymentManagement'

export default function AdminPaymentManagementPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/payments" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <PaymentManagement />
      </main>
    </div>
  )
}
