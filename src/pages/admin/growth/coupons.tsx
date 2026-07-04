import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { CouponManagement } from '@/components/admin/CouponManagement'

export default function AdminCouponsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/growth/coupons" />
      <main className="lg:pl-72 transition-all duration-300">
        <CouponManagement />
      </main>
    </div>
  )
}
