import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ProfitAnalytics } from '@/components/admin/ProfitAnalytics'

export default function AdminProfitAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/financial/profit" />
      <main className="lg:pl-72 transition-all duration-300">
        <ProfitAnalytics />
      </main>
    </div>
  )
}
