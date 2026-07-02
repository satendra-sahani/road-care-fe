import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { TrackerManagement } from '@/components/admin/TrackerManagement'

export default function AdminTrackersPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/subscriptions/trackers" />
      <main className="lg:pl-72 transition-all duration-300">
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-xl font-extrabold text-slate-800">GPS Tracker Subscriptions</h1>
          <p className="text-[13px] text-slate-500">Device inventory · telemetry health · activate, deactivate or extend</p>
        </div>
        <TrackerManagement />
      </main>
    </div>
  )
}
