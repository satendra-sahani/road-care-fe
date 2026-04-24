'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RewardsWalletManagement } from '@/components/admin/RewardsWalletManagement'

export default function AdminRewardsWalletPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/growth/rewards-wallet" />
      <main className="lg:pl-72 transition-all duration-300">
        <RewardsWalletManagement />
      </main>
    </div>
  )
}
