import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview'

export default function AdminAnalyticsRevenuePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/analytics/revenue" />
      <main className="lg:pl-72 transition-all duration-300">
        <AnalyticsOverview type="revenue" />
      </main>
    </div>
  )
}