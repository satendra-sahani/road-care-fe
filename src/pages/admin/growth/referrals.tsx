'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ReferralManagement } from '@/components/admin/ReferralManagement'

export default function AdminReferralsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/growth/referrals" />
      <main className="lg:pl-72 transition-all duration-300">
        <ReferralManagement />
      </main>
    </div>
  )
}
