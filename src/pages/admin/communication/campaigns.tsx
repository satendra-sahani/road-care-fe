import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { CommunicationCenter } from '@/components/admin/CommunicationCenter'

export default function AdminCommunicationCampaignsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/campaigns" />
      <main className="lg:pl-72 transition-all duration-300">
        <CommunicationCenter />
      </main>
    </div>
  )
}