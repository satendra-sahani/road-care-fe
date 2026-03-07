import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { CallLogsManagement } from '@/components/admin/CallLogsManagement'

export default function AdminCallLogsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/call-logs" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <CallLogsManagement />
      </main>
    </div>
  )
}
