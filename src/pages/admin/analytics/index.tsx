'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview'

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/analytics" />
      <main className="lg:pl-72 transition-all duration-300">
        <AnalyticsOverview type="general" />
      </main>
    </div>
  )
}