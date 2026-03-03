'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadUserRequest, customerLogout } from '@/store/slices/customerAuthSlice'
import { userCartAPI, userNotificationAPI } from '@/services/api'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, ShoppingCart, User, Menu, X, Car, Home, Grid3X3, Receipt, Bell,
  Phone, MapPin, Truck, LogOut, ChevronDown, Wallet, MapPinned, Star,
} from 'lucide-react'
import Cookies from 'js-cookie'

export function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.customerAuth)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Load user on mount if token exists
  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated) {
      dispatch(loadUserRequest())
    }
  }, [])

  // Fetch cart count and notification count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      userCartAPI.get().then(res => {
        if (res.data.success) {
          setCartCount(res.data.data?.totalItems || res.data.data?.items?.length || 0)
        }
      }).catch(() => {})
      userNotificationAPI.getUnreadCount().then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.data?.count || 0)
        }
      }).catch(() => {})
    }
  }, [isAuthenticated])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    dispatch(customerLogout())
    setUserMenuOpen(false)
    router.push('/')
  }

  const mobileNav = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Grid3X3, label: 'Shop', href: '/shop' },
    { icon: Receipt, label: 'Orders', href: '/orders' },
    { icon: User, label: 'Profile', href: '/profile' },
  ]

  const activeNav = mobileNav.find(n => {
    if (n.href === '/') return router.pathname === '/'
    return router.pathname.startsWith(n.href)
  })?.href || '/'

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Bar (Desktop) */}
      <div className="hidden md:block gradient-primary">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-primary-foreground text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +91 1800-123-4567</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Deliver to: India</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex items-center gap-1 hover:underline"><Truck className="h-3 w-3" /> Track Order</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">
              Road<span className="text-[#FF6B35]">Care</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts, accessories..."
              className="pl-10 pr-4 bg-surface border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-foreground">
            <Link href="/" className={router.pathname === '/' ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Home</Link>
            <Link href="/shop" className={router.pathname.startsWith('/shop') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Shop</Link>
            <Link href="/service" className={router.pathname.startsWith('/service') ? 'text-[#FF6B35] font-semibold' : 'hover:text-[#FF6B35] transition-colors'}>Services</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF6B35] text-white text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-[#1B3B6F] text-white flex items-center justify-center text-xs font-bold">
                    {(user?.fullName || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden xl:block max-w-[100px] truncate">{user?.fullName || 'User'}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border z-50 py-1">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <User className="h-4 w-4 text-gray-500" /> My Profile
                      </Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Receipt className="h-4 w-4 text-gray-500" /> My Orders
                      </Link>
                      <Link href="/service" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Truck className="h-4 w-4 text-gray-500" /> My Services
                      </Link>
                      <Link href="/addresses" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <MapPinned className="h-4 w-4 text-gray-500" /> Addresses
                      </Link>
                      <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Wallet className="h-4 w-4 text-gray-500" /> Wallet
                      </Link>
                      <Link href="/reviews" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50">
                        <Star className="h-4 w-4 text-gray-500" /> My Reviews
                      </Link>
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(router.asPath)}`}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3B6F] text-white text-sm font-medium hover:bg-[#152d55] transition-colors"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
            )}

            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Home</Link>
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Shop</Link>
            <Link href="/service" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Services</Link>
            {!isAuthenticated && (
              <Link href="/login" className="block">
                <Button className="w-full bg-[#1B3B6F] text-white">
                  <User className="h-4 w-4 mr-2" /> Login / Register
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#0f2340] text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg bg-[#FF6B35] flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl">Road<span className="text-[#FF6B35]">Care</span></span>
              </div>
              <p className="text-gray-400 text-sm">Your one-stop solution for vehicle parts, accessories, and professional services.</p>
            </div>
            {[
              { title: 'Quick Links', links: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Services', href: '/service' }, { label: 'Orders', href: '/orders' }] },
              { title: 'Customer Service', links: [{ label: 'Track Order', href: '/orders' }, { label: 'My Profile', href: '/profile' }, { label: 'Contact Us', href: '#' }] },
              { title: 'Legal', links: [{ label: 'Terms & Conditions', href: '#' }, { label: 'Privacy Policy', href: '#' }, { label: 'Refund Policy', href: '#' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-gray-400 text-sm hover:text-[#FF6B35] transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center">
            <p className="text-gray-500 text-sm">&copy; 2026 Road Care. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {mobileNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                activeNav === item.href ? 'text-[#FF6B35]' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
