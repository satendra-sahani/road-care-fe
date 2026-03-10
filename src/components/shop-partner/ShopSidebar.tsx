'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import {
  Home, ClipboardList, DollarSign, Users, Store,
  Menu, X, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Cookies from 'js-cookie'
import { shopAPI } from '@/services/api'

interface SidebarItem {
  id: string
  title: string
  icon: React.ElementType
  href: string
  badge?: string
  separator?: boolean
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', title: 'Dashboard', icon: Home, href: '/shop-partner' },
  { id: 'orders', title: 'Orders', icon: ClipboardList, href: '/shop-partner/orders', separator: true },
  { id: 'mechanics', title: 'My Mechanics', icon: Users, href: '/shop-partner/mechanics', separator: true },
  { id: 'earnings', title: 'Earnings', icon: DollarSign, href: '/shop-partner/earnings' },
  { id: 'profile', title: 'Shop Profile', icon: Store, href: '/shop-partner/profile', separator: true },
]

// Module-level cache — survives page navigations, prevents blinking
let cachedPendingCount = 0
let badgeInterval: ReturnType<typeof setInterval> | null = null

const fetchBadge = async (setter: (val: number) => void) => {
  try {
    const res = await shopAPI.getDashboard()
    if (res.data?.success) {
      cachedPendingCount = res.data.data.stats.pendingOrders || 0
      setter(cachedPendingCount)
    }
  } catch {}
}

export function ShopSidebar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  // Initialize from cache — no flash
  const [pendingCount, setPendingCount] = useState(cachedPendingCount)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Start polling only once (module-level singleton)
    if (!badgeInterval) {
      fetchBadge((val) => { if (mountedRef.current) setPendingCount(val) })
      badgeInterval = setInterval(() => {
        fetchBadge((val) => { if (mountedRef.current) setPendingCount(val) })
      }, 30000)
    }

    return () => { mountedRef.current = false }
  }, [])

  const handleLogout = () => {
    if (badgeInterval) { clearInterval(badgeInterval); badgeInterval = null }
    cachedPendingCount = 0
    Cookies.remove('token')
    Cookies.remove('customer_token')
    router.push('/shop-partner/login')
  }

  const isActive = (href: string) => {
    if (href === '/shop-partner') return router.pathname === '/shop-partner'
    return router.pathname.startsWith(href)
  }

  const items = sidebarItems.map(item => ({
    ...item,
    badge: item.id === 'orders' && pendingCount > 0 ? String(pendingCount) : undefined
  }))

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0F2545] flex items-center px-4 shadow-md">
        <button
          className="p-2 text-white rounded-lg hover:bg-white/10"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FF6B35] rounded-lg flex items-center justify-center">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">BharatMechanics</span>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-[55]" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 bg-[#0F2545] text-white z-[60] flex flex-col',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">BharatMechanics</h1>
              <p className="text-xs text-gray-400">Shop Partner Portal</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id}>
              {item.separator && <div className="my-2 mx-4 border-t border-white/10" />}
              <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm',
                  isActive(item.href)
                    ? 'bg-[#FF6B35] text-white font-medium'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
