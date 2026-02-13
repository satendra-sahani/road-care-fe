import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { DeliveryLogistics } from '@/components/admin/DeliveryLogistics'

export default function AdminDeliveryRoutesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/delivery/routes" />
      <main className="lg:pl-72 transition-all duration-300">
        <DeliveryLogistics />
      </main>
    </div>
  )
}