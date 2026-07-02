import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MembershipManagement } from '@/components/admin/MembershipManagement'

export default function AdminMembershipsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/subscriptions/memberships" />
      <main className="lg:pl-72 transition-all duration-300">
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-xl font-extrabold text-slate-800">BM Care Memberships</h1>
          <p className="text-[13px] text-slate-500">Subscriber list · cancel, reactivate or extend plans (pricing lives in Plan Pricing)</p>
        </div>
        <MembershipManagement />
      </main>
    </div>
  )
}
