'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPath: string
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <AdminSidebar currentPath={currentPath} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}