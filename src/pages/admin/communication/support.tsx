import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminSupport } from '@/components/admin/AdminSupport'

export default function AdminCommunicationSupportPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/support" />
      <main className="lg:pl-72 transition-all duration-300">
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-xl font-extrabold text-slate-800">Help &amp; Support</h1>
          <p className="text-[13px] text-slate-500">Chat with customers and partners · answer support calls</p>
        </div>
        <AdminSupport />
      </main>
    </div>
  )
}
