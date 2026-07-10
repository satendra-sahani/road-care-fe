'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { OtpHelpdesk } from '@/components/admin/OtpHelpdesk'

export default function AdminOtpHelpdeskPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/communication/otp-helpdesk" />
      <main className="lg:pl-72 transition-all duration-300">
        <OtpHelpdesk />
      </main>
    </div>
  )
}
