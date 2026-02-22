import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SalesLedger } from '@/components/admin/SalesLedger'

export default function AdminSalesLedgerPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/sales" />
      <main className="lg:pl-72 transition-all duration-300">
        <SalesLedger />
      </main>
    </div>
  )
}
