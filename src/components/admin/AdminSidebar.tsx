'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Wrench, 
  Package, 
  DollarSign, 
  Truck, 
  MessageSquare, 
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  TrendingUp,
  UserCheck,
  ClipboardList,
  Store,
  CreditCard,
  MapPin,
  Bell,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SidebarItem {
  id: string
  title: string
  icon: React.ElementType
  href?: string
  children?: SidebarItem[]
  badge?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/admin'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    children: [
      { id: 'overview', title: 'Overview', icon: TrendingUp, href: '/admin/analytics/overview' },
      { id: 'revenue', title: 'Revenue', icon: DollarSign, href: '/admin/analytics/revenue' },
      { id: 'performance', title: 'Performance', icon: BarChart3, href: '/admin/analytics/performance' }
    ]
  },
  {
    id: 'orders',
    title: 'Order Management',
    icon: ShoppingCart,
    children: [
      { id: 'all-orders', title: 'All Orders', icon: ClipboardList, href: '/admin/orders', badge: '142' },
      { id: 'pending', title: 'Pending Orders', icon: ShoppingCart, href: '/admin/orders/pending', badge: '23' },
      { id: 'processing', title: 'Processing', icon: Package, href: '/admin/orders/processing', badge: '45' },
      { id: 'shipped', title: 'Shipped', icon: Truck, href: '/admin/orders/shipped', badge: '67' },
      { id: 'completed', title: 'Completed', icon: UserCheck, href: '/admin/orders/completed' }
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    children: [
      { id: 'customers', title: 'Customers', icon: Users, href: '/admin/users/customers', badge: '1,234' },
      { id: 'mechanics', title: 'Mechanics', icon: Wrench, href: '/admin/users/mechanics', badge: '89' },
      { id: 'delivery', title: 'Delivery Partners', icon: Truck, href: '/admin/users/delivery', badge: '156' },
      { id: 'admins', title: 'Administrators', icon: Shield, href: '/admin/users/admins' }
    ]
  },
  {
    id: 'services',
    title: 'Service Management',
    icon: Wrench,
    children: [
      { id: 'service-requests', title: 'Service Requests', icon: ClipboardList, href: '/admin/services/requests', badge: '34' },
      { id: 'mechanic-assignment', title: 'Mechanic Assignment', icon: UserCheck, href: '/admin/services/assignment' },
      { id: 'service-categories', title: 'Service Categories', icon: Store, href: '/admin/services/categories' },
      { id: 'pricing', title: 'Service Pricing', icon: DollarSign, href: '/admin/services/pricing' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Products',
    icon: Package,
    children: [
      { id: 'products', title: 'Product Catalog', icon: Package, href: '/admin/inventory/products' },
      { id: 'categories', title: 'Categories', icon: Store, href: '/admin/inventory/categories' },
      { id: 'brands', title: 'Brands', icon: Store, href: '/admin/inventory/brands' },
      { id: 'stock', title: 'Stock Management', icon: Package, href: '/admin/inventory/stock', badge: '12' },
      { id: 'suppliers', title: 'Suppliers', icon: Truck, href: '/admin/inventory/suppliers' }
    ]
  },
  {
    id: 'financial',
    title: 'Financial Management',
    icon: DollarSign,
    children: [
      { id: 'revenue', title: 'Revenue Dashboard', icon: TrendingUp, href: '/admin/financial/revenue' },
      { id: 'transactions', title: 'Transactions', icon: CreditCard, href: '/admin/financial/transactions' },
      { id: 'refunds', title: 'Refunds', icon: DollarSign, href: '/admin/financial/refunds', badge: '8' },
      { id: 'commissions', title: 'Commissions', icon: DollarSign, href: '/admin/financial/commissions' },
      { id: 'reports', title: 'Financial Reports', icon: BarChart3, href: '/admin/financial/reports' }
    ]
  },
  {
    id: 'delivery',
    title: 'Delivery & Logistics',
    icon: Truck,
    children: [
      { id: 'delivery-partners', title: 'Delivery Partners', icon: Users, href: '/admin/delivery/partners' },
      { id: 'routes', title: 'Route Management', icon: MapPin, href: '/admin/delivery/routes' },
      { id: 'tracking', title: 'Order Tracking', icon: MapPin, href: '/admin/delivery/tracking' },
      { id: 'zones', title: 'Delivery Zones', icon: MapPin, href: '/admin/delivery/zones' }
    ]
  },
  {
    id: 'communication',
    title: 'Communication Center',
    icon: MessageSquare,
    children: [
      { id: 'notifications', title: 'Notifications', icon: Bell, href: '/admin/communication/notifications' },
      { id: 'messages', title: 'Messages', icon: MessageSquare, href: '/admin/communication/messages', badge: '15' },
      { id: 'support', title: 'Customer Support', icon: MessageSquare, href: '/admin/communication/support', badge: '7' },
      { id: 'campaigns', title: 'Marketing Campaigns', icon: Bell, href: '/admin/communication/campaigns' }
    ]
  },
  {
    id: 'settings',
    title: 'Platform Settings',
    icon: Settings,
    children: [
      { id: 'general', title: 'General Settings', icon: Settings, href: '/admin/settings/general' },
      { id: 'payments', title: 'Payment Gateways', icon: CreditCard, href: '/admin/settings/payments' },
      { id: 'security', title: 'Security & Permissions', icon: Shield, href: '/admin/settings/security' },
      { id: 'maintenance', title: 'Maintenance Mode', icon: Settings, href: '/admin/settings/maintenance' }
    ]
  }
]

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard'])

  // Auto-expand parent items when their children are active
  React.useEffect(() => {
    const activeParents: string[] = []
    
    const findActiveParents = (items: SidebarItem[], parents: string[] = []) => {
      items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.href === pathname)
          if (hasActiveChild) {
            activeParents.push(...parents, item.id)
          }
          findActiveParents(item.children, [...parents, item.id])
        }
      })
    }
    
    findActiveParents(sidebarItems)
    
    if (activeParents.length > 0) {
      setExpandedItems(prev => [...new Set([...prev, ...activeParents])])
    }
  }, [pathname])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (children: SidebarItem[] = []) => 
    children.some(child => child.href && isActive(child.href))

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const itemIsActive = item.href ? isActive(item.href) : isParentActive(item.children)

    if (hasChildren) {
      return (
        <div key={item.id}>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleExpanded(item.id)
            }}
            className={cn(
              "w-full justify-start h-10 px-3 py-2 text-left font-medium transition-all duration-200",
              level === 0 ? "text-sm" : "text-xs ml-4",
              collapsed && level === 0 && "justify-center px-2",
              itemIsActive && "bg-[#FF6B35] text-white hover:bg-[#E55A2B]",
              !itemIsActive && "text-gray-300 hover:bg-[#2E5090] hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                    itemIsActive ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-2 h-4 w-4" />
                )}
              </>
            )}
          </Button>
          {!collapsed && isExpanded && (
            <div className="space-y-1 ml-4">
              {item.children?.map(child => renderSidebarItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    const content = (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-10 px-3 py-2 text-left font-medium transition-all duration-200",
          level === 0 ? "text-sm" : "text-xs ml-4",
          collapsed && level === 0 && "justify-center px-2",
          itemIsActive && "bg-[#FF6B35] text-white hover:bg-[#E55A2B]",
          !itemIsActive && "text-gray-300 hover:bg-[#2E5090] hover:text-white"
        )}
      >
        <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                itemIsActive ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Button>
    )

    return item.href ? (
      <Link key={item.id} href={item.href}>
        {content}
      </Link>
    ) : (
      <div key={item.id}>{content}</div>
    )
  }

  return (
    <aside
      className={cn(
        "admin-sidebar fixed left-0 top-0 flex flex-col h-screen bg-gradient-to-b from-[#0F2545] to-[#1B3B6F] border-r border-[#2E5090] transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2E5090]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Road Care</h1>
              <p className="text-xs text-gray-300">Admin Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center mx-auto">
            <Wrench className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2E5090]">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs text-gray-400">Road Care Admin v2.0</p>
            <p className="text-xs text-gray-500">© 2026 All rights reserved</p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-[#2E5090] rounded-lg flex items-center justify-center mx-auto">
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </aside>
  )
}