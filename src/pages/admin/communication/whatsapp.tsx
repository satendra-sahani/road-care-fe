import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { WhatsAppSender } from '@/components/admin/WhatsAppSender'

export default function AdminWhatsAppPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/whatsapp" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <WhatsAppSender />
      </main>
    </div>
  )
}
