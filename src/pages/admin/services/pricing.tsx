import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ServiceManagement } from '@/components/admin/ServiceManagement'

export default function AdminServicesPricingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/pricing" />
      <main className="lg:pl-72 transition-all duration-300">
        <ServiceManagement />
      </main>
    </div>
  )
}