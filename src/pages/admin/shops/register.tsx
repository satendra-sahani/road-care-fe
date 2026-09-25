'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import ShopRegistrationForm from '@/components/admin/ShopRegistrationForm'

export default function AdminShopRegisterPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/shops" />
      <main className="lg:pl-72 transition-all duration-300">
        <ShopRegistrationForm />
      </main>
    </div>
  )
}
