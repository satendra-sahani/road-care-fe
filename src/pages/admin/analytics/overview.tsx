import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview'

export default function AdminAnalyticsOverviewPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/analytics/overview" />
      <main className="lg:pl-72 transition-all duration-300">
        <AnalyticsOverview type="overview" />
      </main>
    </div>
  )
}