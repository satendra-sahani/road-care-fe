import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { DeliveryLogistics } from '@/components/admin/DeliveryLogistics'

export default function AdminDeliveryPartnersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/delivery/partners" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <DeliveryLogistics />
      </main>
    </div>
  )
}