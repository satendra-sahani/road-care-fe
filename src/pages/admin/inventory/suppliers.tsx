import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { InventoryManagement } from '@/components/admin/InventoryManagement'

export default function AdminInventorySuppliersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/suppliers" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <InventoryManagement />
      </main>
    </div>
  )
}