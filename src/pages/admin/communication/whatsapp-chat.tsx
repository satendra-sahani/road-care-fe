import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { WhatsAppChat } from '@/components/admin/WhatsAppChat'

export default function AdminWhatsAppChatPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/whatsapp-chat" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <WhatsAppChat />
      </main>
    </div>
  )
}
