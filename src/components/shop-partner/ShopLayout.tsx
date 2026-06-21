'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { ShopSidebar } from './ShopSidebar'
import { Menu, Search, Bell } from 'lucide-react'

const DIST = '#D97706'

const TITLES: Record<string, { t: string; s: string }> = {
  '/shop-partner': { t: 'Dashboard', s: 'Welcome back 👋' },
  '/shop-partner/orders': { t: 'Jobs & Orders', s: 'Service requests from customers' },
  '/shop-partner/mechanics': { t: 'My Mechanics', s: 'Your shop staff & assigned mechanics' },
  '/shop-partner/wallet': { t: 'Wallet', s: 'Your balance, withdrawals & money in' },
  '/shop-partner/earnings': { t: 'Earnings', s: 'Revenue, commission & transactions' },
  '/shop-partner/settlements': { t: 'Settlements', s: 'Settlement cycle & history' },
  '/shop-partner/profile': { t: 'Shop Profile', s: 'Manage your shop details & service area' },
  '/shop-partner/kyc': { t: 'KYC & Verification', s: 'Documents & approval status' },
  '/shop-partner/settings': { t: 'Settings', s: 'Account preferences' },
  '/shop-partner/requirements': { t: 'Requirements', s: 'What you need to partner with us' },
}

export function ShopLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sbOpen, setSbOpen] = useState(false)
  const meta = TITLES[router.pathname] || { t: 'Shop Partner', s: '' }

  return (
    <div className="min-h-screen" style={{ background: '#F6F8FB' }}>
      <ShopSidebar open={sbOpen} onClose={() => setSbOpen(false)} />

      <div className="lg:ml-[262px] min-w-0 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-4 px-4 md:px-6 h-[70px] border-b border-[#E7ECF3] bg-white/[0.92] backdrop-blur-md">
          <button onClick={() => setSbOpen(true)} className="lg:hidden h-[42px] w-[42px] rounded-[11px] border border-[#E7ECF3] bg-white flex items-center justify-center text-[#1B3B6F] shrink-0">
            <Menu className="h-[22px] w-[22px]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[18px] md:text-[20px] font-extrabold text-[#13203A] leading-tight truncate">{meta.t}</h1>
            <p className="text-[12.5px] text-[#7B8AA3] truncate">{meta.s}</p>
          </div>

          <div className="ml-auto hidden md:flex items-center gap-2.5 h-[42px] px-3.5 bg-[#F6F8FB] border border-[#E7ECF3] rounded-[11px] text-[#7B8AA3] text-[13.5px] w-[240px]">
            <Search className="h-[17px] w-[17px] shrink-0" /> <span className="truncate">Search jobs, customers…</span>
          </div>

          <div className="hidden sm:flex border border-[#E7ECF3] rounded-[10px] overflow-hidden shrink-0">
            <button className="text-[12.5px] font-bold px-3 py-2.5 text-white" style={{ background: '#1B3B6F' }}>EN</button>
            <button className="text-[12.5px] font-bold px-3 py-2.5 bg-white text-[#7B8AA3]">हिं</button>
          </div>

          <button className="relative h-[42px] w-[42px] rounded-[11px] border border-[#E7ECF3] bg-white flex items-center justify-center text-[#475569] shrink-0">
            <Bell className="h-[19px] w-[19px]" />
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
