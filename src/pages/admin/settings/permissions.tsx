import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PlatformSettings } from '@/components/admin/PlatformSettings'

export default function AdminSettingsPermissionsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/settings/permissions" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <PlatformSettings />
      </main>
    </div>
  )
}