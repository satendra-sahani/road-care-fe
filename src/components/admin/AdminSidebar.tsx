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
  MessageSquare,
  Settings,
  Home,
  TrendingUp,
  ClipboardList,
  CreditCard,
  MapPin,
  Bell,
  Shield,
  Menu,
  X,
  LogOut,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutRequest } from '@/store/slices/authSlice'

interface SidebarItem {
  id: string
  title: string
  icon: React.ElementType
  href: string
  badge?: string
  separator?: boolean
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', title: 'Dashboard', icon: Home, href: '/admin' },
  { id: 'analytics', title: 'Analytics', icon: BarChart3, href: '/admin/analytics/overview' },

  // Orders
  { id: 'orders', title: 'Orders', icon: ShoppingCart, href: '/admin/orders', badge: '142', separator: true },

  // Users
  { id: 'users', title: 'Users', icon: Users, href: '/admin/users/mechanics' },

  // Services
  { id: 'service-requests', title: 'Service Requests', icon: ClipboardList, href: '/admin/services/requests', badge: '34', separator: true },

  // Inventory & Stock
  { id: 'inventory', title: 'Products', icon: Package, href: '/admin/inventory/products', separator: true },
  { id: 'categories', title: 'Categories', icon: Tag, href: '/admin/inventory/categories' },
  { id: 'brands', title: 'Brands', icon: Shield, href: '/admin/inventory/brands' },
  { id: 'purchase-ledger', title: 'Purchase Ledger', icon: ClipboardList, href: '/admin/inventory/purchases' },
  { id: 'sales-ledger', title: 'Sales Ledger', icon: CreditCard, href: '/admin/inventory/sales', badge: 'New' },

  // Financial
  { id: 'profit-analytics', title: 'Profit & Loss', icon: TrendingUp, href: '/admin/financial/profit', badge: 'New', separator: true },
  { id: 'revenue', title: 'Revenue', icon: DollarSign, href: '/admin/financial/revenue' },
  { id: 'transactions', title: 'Transactions', icon: CreditCard, href: '/admin/financial/transactions' },

  // Delivery
  { id: 'delivery-tracking', title: 'Delivery Tracking', icon: MapPin, href: '/admin/delivery/tracking', separator: true },

  // Communication
  { id: 'notifications', title: 'Notifications', icon: Bell, href: '/admin/communication/notifications' },
  { id: 'messages', title: 'Messages', icon: MessageSquare, href: '/admin/communication/messages', badge: '15' },

  // Settings
  { id: 'settings', title: 'Settings', icon: Settings, href: '/admin/settings/general', separator: true },
]

interface AdminSidebarProps {
  collapsed?: boolean
  currentPath?: string
}

export function AdminSidebar({ collapsed = false, currentPath }: AdminSidebarProps) {
  const pathname = usePathname() || currentPath || ''
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const handleLogout = () => {
    dispatch(logoutRequest())
    router.push('/admin/login')
  }

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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Road Care</h1>
                <p className="text-[10px] text-gray-400">Admin Panel</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center mx-auto">
              <Wrench className="h-5 w-5 text-white" />
            </div>
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
