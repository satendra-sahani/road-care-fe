import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { FinancialManagement } from '@/components/admin/FinancialManagement'

export default function AdminFinancialRevenuePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/financial/revenue" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <FinancialManagement />
      </main>
    </div>
  )
}