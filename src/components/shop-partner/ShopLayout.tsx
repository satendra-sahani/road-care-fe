'use client'

import { ShopSidebar } from './ShopSidebar'

interface ShopLayoutProps {
  children: React.ReactNode
}

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <ShopSidebar />
      <main className="lg:pl-72 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
