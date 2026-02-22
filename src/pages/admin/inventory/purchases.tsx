import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { StockLedger } from '@/components/admin/StockLedger'

export default function AdminPurchaseLedgerPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/purchases" />
      <main className="lg:pl-72 transition-all duration-300">
        <StockLedger />
      </main>
    </div>
  )
}
