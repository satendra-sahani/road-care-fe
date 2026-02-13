import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { DeliveryLogistics } from '@/components/admin/DeliveryLogistics'

export default function AdminDeliveryTrackingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/delivery/tracking" />
      <main className="lg:pl-72 transition-all duration-300">
        <DeliveryLogistics />
      </main>
    </div>
  )
}