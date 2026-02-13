import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { CommunicationCenter } from '@/components/admin/CommunicationCenter'

export default function AdminCommunicationMessagesPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/messages" />
      <main className="lg:pl-72 transition-all duration-300">
        <CommunicationCenter />
      </main>
    </div>
  )
}