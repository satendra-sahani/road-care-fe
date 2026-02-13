import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ServiceManagement } from '@/components/admin/ServiceManagement'

export default function AdminServicesCategoriesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/categories" />
      <main className="lg:pl-72 transition-all duration-300">
        <ServiceManagement />
      </main>
    </div>
  )
}