import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { InventoryManagement } from '@/components/admin/InventoryManagement'

export default function AdminInventoryStockPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/stock" />
      <main className="lg:pl-72 transition-all duration-300">
        <InventoryManagement />
      </main>
    </div>
  )
}