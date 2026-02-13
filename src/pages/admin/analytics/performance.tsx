import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview'

export default function AdminAnalyticsPerformancePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/analytics/performance" />
      <main className="lg:pl-72 transition-all duration-300">
        <AnalyticsOverview type="performance" />
      </main>
    </div>
  )
}