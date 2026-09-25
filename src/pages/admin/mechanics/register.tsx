'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import MechanicRegistrationForm from '@/components/admin/MechanicRegistrationForm'

export default function AdminMechanicRegisterPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/services/mechanics" />
      <main className="lg:pl-72 transition-all duration-300">
        <MechanicRegistrationForm />
      </main>
    </div>
  )
}
