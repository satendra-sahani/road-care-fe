'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  ShoppingCart,
  Users,
  Wrench,
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
  MapPin,
  Phone,
  Store,
  UserCheck,
  Sparkles,
  Gift,
  Coins,
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
  separator?: boolean
}

const baseSidebarItems: SidebarItem[] = [
  { id: 'dashboard', title: 'Dashboard', icon: Home, href: '/admin' },
  { id: 'analytics', title: 'Analytics', icon: BarChart3, href: '/admin/analytics/overview' },

  // Orders
  { id: 'orders', title: 'Orders', icon: ShoppingCart, href: '/admin/orders', separator: true },

  // Users & Customers
  { id: 'users', title: 'Mechanics', icon: Wrench, href: '/admin/users/mechanics', separator: true },
  { id: 'customers', title: 'Customers', icon: UserCheck, href: '/admin/users/customers' },

  // Services
  { id: 'service-requests', title: 'Service Requests', icon: ClipboardList, href: '/admin/services/requests', separator: true },
  { id: 'payments',         title: 'Payment Management', icon: CreditCard,   href: '/admin/services/payments' },
  { id: 'issue-pricing',    title: 'Issue Pricing',      icon: DollarSign,   href: '/admin/services/issue-pricing' },

  // Inventory & Stock
  { id: 'inventory', title: 'Products', icon: Package, href: '/admin/inventory/products', separator: true },
  { id: 'categories', title: 'Categories', icon: Tag, href: '/admin/inventory/categories' },
  { id: 'brands', title: 'Brands', icon: Shield, href: '/admin/inventory/brands' },
  { id: 'purchase-ledger', title: 'Purchase Ledger', icon: ClipboardList, href: '/admin/inventory/purchases' },
  // Shop Partners
  { id: 'shop-partners', title: 'Shop Partners', icon: Store, href: '/admin/shops', separator: true },

  // Financial
  { id: 'revenue', title: 'Revenue', icon: DollarSign, href: '/admin/financial/revenue', separator: true },

  // Growth & Rewards
  { id: 'spin-wheel',      title: 'Spin & Win',      icon: Sparkles, href: '/admin/growth/spin-wheel', separator: true },
  { id: 'referrals',       title: 'Referrals',       icon: Gift,     href: '/admin/growth/referrals' },
  { id: 'rewards-wallet',  title: 'Rewards Wallet',  icon: Coins,    href: '/admin/growth/rewards-wallet' },

  // Content & Communication
  { id: 'banners', title: 'Banners', icon: ImageIcon, href: '/admin/banners', separator: true },
  { id: 'locations', title: 'Locations', icon: MapPin, href: '/admin/locations' },
  { id: 'notifications', title: 'Notifications', icon: Bell, href: '/admin/communication/notifications' },
  { id: 'call-logs', title: 'Call Logs', icon: Phone, href: '/admin/communication/call-logs' },

  // Settings
  { id: 'settings', title: 'Settings', icon: Settings, href: '/admin/settings/general', separator: true },
]

interface AdminSidebarProps {
  collapsed?: boolean
  currentPath?: string
}

// Module-level cache — survives component re-mounts on page navigation
let cachedBadgeCounts = { orders: '', serviceRequests: '' }
let badgeFetchInterval: ReturnType<typeof setInterval> | null = null

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

  // Build sidebar items with dynamic badges
  const sidebarItems = baseSidebarItems.map((item) => {
    if (item.id === 'orders' && badgeCounts.orders) {
      return { ...item, badge: badgeCounts.orders }
    }
    if (item.id === 'service-requests' && badgeCounts.serviceRequests) {
      return { ...item, badge: badgeCounts.serviceRequests }
    }
    return item
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
          "admin-sidebar fixed left-0 top-0 flex flex-col h-screen bg-gradient-to-b from-[#0F2545] to-[#1B3B6F] border-r border-[#2E5090] transition-all duration-300 z-50",
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
        <div className="flex items-center justify-between p-4 border-b border-[#2E5090]">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="inline-flex bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                <NextImage
                  src="/brand-logo.png?v=2"
                  alt="Bharat Mechanics"
                  width={170}
                  height={40}
                  className="h-9 w-auto object-contain"
                />
              </span>
              <p className="text-[10px] text-gray-400 mt-1">Admin Panel</p>
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
              className="lg:hidden text-white hover:bg-[#2E5090]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-ultra-narrow">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <div key={item.id}>
                {item.separator && (
                  <div className="my-2 mx-3 border-t border-[#2E5090]" />
                )}
                <Link href={item.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-10 px-3 py-2 text-left text-sm font-medium transition-all duration-200 rounded-lg",
                      collapsed && !isMobile && "justify-center px-2",
                      active && "bg-[#FF6B35] text-white hover:bg-[#E55A2B]",
                      !active && "text-gray-300 hover:bg-[#2E5090] hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", (!collapsed || isMobile) && "mr-3")} />
                    {(!collapsed || isMobile) && (
                    <>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          active ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#2E5090] space-y-2">
          {(!collapsed || isMobile) ? (
            <>
              {user && (
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start h-9 px-3 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </>
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
