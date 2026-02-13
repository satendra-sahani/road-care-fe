import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ServiceManagement } from '@/components/admin/ServiceManagement'

export default function AdminServicesRequestsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/requests" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <ServiceManagement />
      </main>
    </div>
  )
}