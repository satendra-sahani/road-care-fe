import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PlanPricingManagement } from '@/components/admin/PlanPricingManagement'

export default function AdminPlanPricingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/plan-pricing" />
      <main className="lg:pl-72 transition-all duration-300">
        <PlanPricingManagement />
      </main>
    </div>
  )
}
