import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ApiKeyManagement } from '@/components/admin/ApiKeyManagement'

export default function AdminApiKeysPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/settings/api-keys" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <ApiKeyManagement />
      </main>
    </div>
  )
}
