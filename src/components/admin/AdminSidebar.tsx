'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import {
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Settings,
  Home,
  ClipboardList,
  CreditCard,
  Bell,
  Shield,
  Menu,
  X,
  LogOut,
  Tag,
  Image as ImageIcon,
  Megaphone,
  MapPin,
  Phone,
  Store,
  UserCheck,
  Sparkles,
  Gift,
  Coins,
  Ticket,
  Crown,
  MessageSquare,
  Satellite,
  ChevronDown,
} from 'lucide-react'
import NextImage from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutRequest } from '@/store/slices/authSlice'
import { orderAPI, serviceRequestAPI } from '@/services/api'

interface SidebarItem {
  id: string
  title: string
  icon: React.ElementType
  href: string
  badge?: string
}

interface SidebarGroup {
  id: string
  title: string          // group label ('' = ungrouped top-level items)
  items: SidebarItem[]
}

// Grouped navigation — each group renders as a collapsible dropdown; the group
// holding the active route auto-expands. Order = daily-usage frequency.
const NAV_GROUPS: SidebarGroup[] = [
  {
    id: 'home', title: '', items: [
      { id: 'dashboard', title: 'Dashboard', icon: Home, href: '/admin' },
      { id: 'analytics', title: 'Analytics', icon: BarChart3, href: '/admin/analytics/overview' },
    ],
  },
  {
    id: 'operations', title: 'Orders & Services', items: [
      { id: 'orders', title: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
      { id: 'service-requests', title: 'Service Requests', icon: ClipboardList, href: '/admin/services/requests' },
      { id: 'payments', title: 'Payments', icon: CreditCard, href: '/admin/services/payments' },
    ],
  },
  {
    id: 'people', title: 'People & Partners', items: [
      { id: 'customers', title: 'Users', icon: UserCheck, href: '/admin/users/customers' },
      { id: 'shop-partners', title: 'Shop Partners', icon: Store, href: '/admin/shops' },
    ],
  },
  {
    id: 'subscriptions', title: 'Subscriptions & Plans', items: [
      { id: 'memberships', title: 'BM Care Members', icon: Crown, href: '/admin/subscriptions/memberships' },
      { id: 'trackers', title: 'GPS Trackers', icon: Satellite, href: '/admin/subscriptions/trackers' },
      { id: 'gps-provisioning', title: 'GPS Provisioning', icon: Satellite, href: '/admin/subscriptions/provisioning' },
      { id: 'plan-pricing', title: 'Plan Pricing', icon: DollarSign, href: '/admin/services/plan-pricing' },
    ],
  },
  {
    id: 'catalog', title: 'Catalog & Stock', items: [
      { id: 'inventory', title: 'Products', icon: Package, href: '/admin/inventory/products' },
      { id: 'categories', title: 'Categories', icon: Tag, href: '/admin/inventory/categories' },
      { id: 'brands', title: 'Brands', icon: Shield, href: '/admin/inventory/brands' },
      { id: 'purchase-ledger', title: 'Purchase Ledger', icon: ClipboardList, href: '/admin/inventory/purchases' },
    ],
  },
  {
    id: 'finance', title: 'Finance & Pricing', items: [
      { id: 'revenue', title: 'Revenue', icon: DollarSign, href: '/admin/financial/revenue' },
      { id: 'issue-pricing', title: 'Issue Pricing', icon: DollarSign, href: '/admin/services/issue-pricing' },
    ],
  },
  {
    id: 'growth', title: 'Growth & Rewards', items: [
      { id: 'spin-wheel', title: 'Spin & Win', icon: Sparkles, href: '/admin/growth/spin-wheel' },
      { id: 'referrals', title: 'Referrals', icon: Gift, href: '/admin/growth/referrals' },
      { id: 'rewards-wallet', title: 'Rewards Wallet', icon: Coins, href: '/admin/growth/rewards-wallet' },
      { id: 'coupons', title: 'Coupons', icon: Ticket, href: '/admin/growth/coupons' },
    ],
  },
  {
    id: 'communication', title: 'Communication', items: [
      { id: 'notifications', title: 'Notifications', icon: Bell, href: '/admin/communication/notifications' },
      { id: 'support', title: 'Help & Support', icon: MessageSquare, href: '/admin/communication/support' },
      { id: 'call-logs', title: 'Call Logs', icon: Phone, href: '/admin/communication/call-logs' },
      { id: 'banners', title: 'Banners', icon: ImageIcon, href: '/admin/banners' },
      { id: 'home-popup', title: 'Home Popup', icon: Megaphone, href: '/admin/home-popup' },
      { id: 'locations', title: 'Locations', icon: MapPin, href: '/admin/locations' },
    ],
  },
  {
    id: 'system', title: '', items: [
      { id: 'settings', title: 'Settings', icon: Settings, href: '/admin/settings/general' },
    ],
  },
]

interface AdminSidebarProps {
  collapsed?: boolean
  currentPath?: string
}

// Module-level cache — survives component re-mounts on page navigation
let cachedBadgeCounts = { orders: '', serviceRequests: '' }
let badgeFetchInterval: ReturnType<typeof setInterval> | null = null
// Persist the sidebar's own scroll position too — the sidebar re-mounts on every
// admin page, so without this it snaps back to the top after each navigation
// (clicking a bottom item like Settings would jump you away from where you were).
let cachedNavScroll = 0

const fetchBadgeCounts = async (
  setter: (val: { orders: string; serviceRequests: string }) => void
) => {
  try {
    const [orderRes, srRes] = await Promise.allSettled([
      orderAPI.getStats(),
      serviceRequestAPI.getStats(),
    ])

    let orderCount = 0
    if (orderRes.status === 'fulfilled') {
      const orderData = orderRes.value.data?.data || orderRes.value.data
      if (orderData?.byStatus) {
        const activeStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery']
        orderCount = activeStatuses.reduce(
          (sum, status) => sum + (orderData.byStatus[status] || 0),
          0
        )
      } else if (orderData?.total != null) {
        orderCount = orderData.total
      }
    }

    let srCount = 0
    if (srRes.status === 'fulfilled') {
      const srData = srRes.value.data?.data || srRes.value.data
      if (srData) {
        srCount = (srData.pending || 0) + (srData.assigned || 0) + (srData.inProgress || 0)
      }
    }

    const newCounts = {
      orders: orderCount > 0 ? String(orderCount) : '',
      serviceRequests: srCount > 0 ? String(srCount) : '',
    }

    // Update module-level cache so next mount gets instant values
    cachedBadgeCounts = newCounts
    setter(newCounts)
  } catch (err) {
    console.error('Failed to fetch sidebar badge counts:', err)
  }
}

export function AdminSidebar({ collapsed = false, currentPath }: AdminSidebarProps) {
  const pathname = usePathname() || currentPath || ''
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Restore the sidebar scroll position on mount (before paint, so there's no
  // visible jump) so navigating between admin pages keeps your place in the nav.
  const navRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (navRef.current) navRef.current.scrollTop = cachedNavScroll
  }, [])

  // Initialize from cache so badges never flicker on re-mount
  const [badgeCounts, setBadgeCounts] = useState(cachedBadgeCounts)

  const handleLogout = () => {
    dispatch(logoutRequest())
    router.push('/admin/login')
  }

  // Fetch live badge counts — only one interval across all mounts
  useEffect(() => {
    // Always sync latest cache into state on mount (covers fast re-mounts)
    setBadgeCounts(cachedBadgeCounts)

    // Fetch fresh counts
    fetchBadgeCounts(setBadgeCounts)

    // Start a single shared interval (clear previous if exists)
    if (badgeFetchInterval) clearInterval(badgeFetchInterval)
    badgeFetchInterval = setInterval(() => fetchBadgeCounts(setBadgeCounts), 60000)

    return () => {
      if (badgeFetchInterval) {
        clearInterval(badgeFetchInterval)
        badgeFetchInterval = null
      }
    }
  }, [])

  // Inject dynamic badges into the grouped nav
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.map((item) => {
      if (item.id === 'orders' && badgeCounts.orders) return { ...item, badge: badgeCounts.orders }
      if (item.id === 'service-requests' && badgeCounts.serviceRequests) return { ...item, badge: badgeCounts.serviceRequests }
      return item
    }),
  }))

  // Collapsible groups — ALL OPEN by default (a nav full of collapsed headers
  // reads as broken). Collapsing is opt-in and remembered per admin.
  const activeGroupId = NAV_GROUPS.find((g) => g.items.some((i) => i.href === pathname))?.id
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    NAV_GROUPS.forEach((g) => { init[g.id] = true })
    return init
  })
  // Restore the admin's saved collapse choices after mount (SSR-safe)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_nav_groups') || 'null')
      if (saved && typeof saved === 'object') setOpenGroups((s) => ({ ...s, ...saved }))
    } catch { /* ignore corrupt state */ }
  }, [])
  // The group holding the active route always stays expanded
  useEffect(() => {
    if (activeGroupId) setOpenGroups((s) => (s[activeGroupId] ? s : { ...s, [activeGroupId]: true }))
  }, [activeGroupId])
  const toggleGroup = (id: string) => setOpenGroups((s) => {
    const next = { ...s, [id]: !s[id] }
    try { localStorage.setItem('admin_nav_groups', JSON.stringify(next)) } catch { /* private mode */ }
    return next
  })

  // Check if mobile/tablet
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href

  // Mobile menu toggle button
  const MobileMenuButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="fixed top-4 left-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      {isMobileMenuOpen ? (
        <X className="h-5 w-5 text-gray-700" />
      ) : (
        <Menu className="h-5 w-5 text-gray-700" />
      )}
    </Button>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />
      
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "admin-sidebar fixed left-0 top-0 flex flex-col h-screen bg-[#0E1F3D] border-r border-white/[0.06] transition-all duration-300 z-50",
          // Desktop behavior
          "lg:z-30",
          collapsed ? "lg:w-16" : "lg:w-64",
          // Mobile/Tablet behavior  
          isMobile ? (
            isMobileMenuOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
          ) : (
            collapsed ? "w-16" : "w-64"
          )
        )}
      >
      {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/[0.07]">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <NextImage
                src="/white-logo-bm.png"
                alt="Bharat Mechanics"
                width={190}
                height={44}
                className="h-9 w-auto object-contain"
              />
              <span className="rounded-md bg-[#FF6B35]/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#FF9A6B]">Admin</span>
            </div>
          ) : (
            <NextImage
              src="https://ik.imagekit.io/aiwats/roadcare/fav.png?v=2"
              alt="Bharat Mechanics"
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-lg mx-auto"
            />
          )}

          {/* Mobile close button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation — collapsible groups */}
        <nav
          ref={navRef}
          onScroll={(e) => { cachedNavScroll = (e.target as HTMLElement).scrollTop }}
          className="flex-1 overflow-y-auto px-3 py-4 scrollbar-ultra-narrow"
        >
          {groups.map((group) => {
            const showLabels = !collapsed || isMobile
            const groupBadge = group.items.reduce((n, i) => n + (i.badge ? parseInt(i.badge) || 0 : 0), 0)
            const isOpen = !group.title || !showLabels || openGroups[group.id]

            const renderItem = (item: SidebarItem) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.id} href={item.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                  <span
                    className={cn(
                      "group relative flex h-9 items-center rounded-lg px-3 text-[13px] font-medium transition-colors duration-150",
                      collapsed && !isMobile && "justify-center px-2",
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-[#A8BEDC] hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    {/* active accent bar */}
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#FF6B35]" />}
                    <Icon className={cn(
                      "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                      active ? "text-[#FF8A5C]" : "text-[#7E9CC9] group-hover:text-white",
                      showLabels && "mr-3"
                    )} />
                    {showLabels && (
                      <>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#FF6B35] px-1.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </Link>
              )
            }

            return (
              <div key={group.id} className={cn(group.title && showLabels && "mt-4 first:mt-0")}>
                {group.title && showLabels ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="group/hdr mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-left"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5F7DA8] transition-colors group-hover/hdr:text-[#8FAAD0]">{group.title}</span>
                    <span className="flex items-center gap-1.5">
                      {!isOpen && groupBadge > 0 && (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#FF6B35] px-1 text-[9px] font-bold text-white">{groupBadge}</span>
                      )}
                      <ChevronDown className={cn("h-3 w-3 text-[#5F7DA8] transition-transform duration-200 group-hover/hdr:text-[#8FAAD0]", !isOpen && "-rotate-90")} />
                    </span>
                  </button>
                ) : group.title && !showLabels ? (
                  <div className="my-2 mx-3 border-t border-white/[0.07]" />
                ) : null}
                {isOpen && <div className="space-y-px">{group.items.map(renderItem)}</div>}
              </div>
            )
          })}
        </nav>

      {/* Footer — user chip + logout */}
      <div className="border-t border-white/[0.07] p-3">
          {(!collapsed || isMobile) ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] px-3 py-2.5">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] text-[12px] font-extrabold text-white">
                {(user?.fullName || 'A').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-white">{user?.fullName || 'Administrator'}</p>
                <p className="truncate text-[10px] text-[#7E9CC9]">{user?.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-[#A8BEDC] transition-colors hover:bg-red-500/20 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-center h-9 px-2 text-red-300 hover:bg-red-500/20 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>
    </>
  )
}
