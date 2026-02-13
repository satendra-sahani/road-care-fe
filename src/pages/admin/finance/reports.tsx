import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { FinancialManagement } from '@/components/admin/FinancialManagement'

export default function AdminFinanceReportsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/finance/reports" />
      <main className="lg:pl-72 transition-all duration-300">
        <FinancialManagement />
      </main>
    </div>
  )
}