import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { IssuePricingManagement } from '@/components/admin/IssuePricingManagement'

export default function AdminIssuePricingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/issue-pricing" />
      <main className="lg:pl-72 transition-all duration-300">
        <IssuePricingManagement />
      </main>
    </div>
  )
}
