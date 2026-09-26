'use client'
// Mobile side drawer (design: navy header, quick tiles, MENU list, 24/7 support
// footer). Split out of UserLayout and loaded on the first hamburger tap, so
// the dialog library it uses isn't part of every page's initial JavaScript.
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { IcLogout as LogOut } from '@/components/icons/BmIcons'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  IcPerson, IcShoppingCart, IcHelpCenter, IcChevronRight, IcBuild, IcLocalShipping as IcTruck, IcStore,
  IcStar, IcSettings, IcSchool, IcReceipt, IcLocationPin, IcHome, IcCreditCard, IcClose, IcCall,
} from '@/components/icons/BmIcons'

export default function MobileDrawer({ mobileMenuOpen, setMobileMenuOpen, isAuthenticated, user, unreadCount, openLogin, handleLogout }: {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  isAuthenticated: boolean
  user: any
  unreadCount: number
  openLogin: () => void
  handleLogout: () => void
}) {
  const router = useRouter()
  return (
    <>
    {/* Mobile Side Drawer — design: navy header, quick tiles, MENU list, 24/7 support footer */}
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="flex w-[min(84vw,340px)] max-w-none flex-col gap-0 overflow-hidden rounded-r-[22px] border-0 bg-white p-0 shadow-[12px_0_40px_rgba(8,24,46,0.25)] [&>button.absolute]:hidden">
        <div className="shrink-0 bg-[linear-gradient(140deg,#0E2B4C_0%,#16406F_100%)] px-4 pb-[18px] pt-4 text-left text-white">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-10 items-center justify-between gap-2.5">
            <Image src="/design/logo-white.png" alt="Bharat Mechanics" width={1332} height={416} sizes="110px" className="block h-8 w-auto shrink-0 object-contain object-left" />
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-white"><IcClose size={18} /></button>
          </div>
          <div className="mt-[18px] flex items-center gap-3">
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white/[0.16] text-[15px] font-bold text-white">
              {isAuthenticated && user ? (user.fullName || 'U')[0].toUpperCase() : <IcPerson size={22} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{isAuthenticated && user ? user.fullName || 'User' : 'Namaste!'}</div>
              <div className="truncate text-[12px] text-[#B9CBE0]">{isAuthenticated && user ? (user.phone || user.email || '') : 'Login for orders, bookings & offers'}</div>
            </div>
          </div>
          {isAuthenticated ? (
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="mt-3.5 flex h-[42px] w-full items-center justify-center rounded-[11px] bg-[#C94309] text-[14px] font-semibold text-white hover:text-white">My Profile</Link>
          ) : (
            <button type="button" onClick={() => { setMobileMenuOpen(false); openLogin() }} className="mt-3.5 h-[42px] w-full rounded-[11px] bg-[#C94309] text-[14px] font-semibold text-white active:bg-[#DC4F13]">Login / Sign up</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 scrollbar-ultra-narrow">
          <div className="grid grid-cols-3 gap-2 px-1 pb-3">
            {[
              { Icon: IcTruck, label: 'Track Order', href: '/orders' },
              { Icon: IcBuild, label: 'Book Mechanic', href: '/mechanics' },
              { Icon: IcHelpCenter, label: 'Help Center', href: '/support' },
            ].map((q) => (
              <Link key={q.href} href={q.href} onClick={() => setMobileMenuOpen(false)} className="grid justify-items-center gap-1.5 rounded-xl bg-[#F5F8FC] px-1 py-3 text-center text-[11.5px] font-semibold text-[#0E2B4C] active:bg-[#EAF1FA]">
                <q.Icon size={20} className="text-[#1A6FD4]" />{q.label}
              </Link>
            ))}
          </div>
          <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-[1.4px] text-[#52667C]">MENU</div>
          <div className="grid gap-0.5">
            {[
              { Icon: IcHome, label: 'Home', href: '/' },
              { Icon: IcShoppingCart, label: 'Shop Parts', href: '/shop', tag: 'SALE' },
              { Icon: IcSettings, label: 'Services', href: '/services' },
              { Icon: IcPerson, label: 'Mechanics', href: '/mechanics' },
              { Icon: IcStore, label: 'For Shops', href: '/list-your-shop' },
              { Icon: IcSchool, label: 'Training', href: '/training' },
            ].map((item) => {
              const isActive = item.href === '/' ? router.pathname === '/' : router.pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-[50px] items-center gap-3.5 rounded-xl px-3.5 text-[15px] active:bg-[#F2F6FB] ${isActive ? 'bg-[#FFF1E8] font-bold text-[#BE3F09]' : 'font-medium text-[#0E2B4C]'}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${isActive ? 'bg-white text-[#BE3F09]' : 'bg-[#F2F6FB] text-[#0E2B4C]'}`}><item.Icon size={20} /></span>
                  <span className="flex-1">{item.label}</span>
                  {item.tag && <span className="rounded-[10px] bg-[#C94309] px-2 py-0.5 text-[10.5px] font-bold text-white">{item.tag}</span>}
                  <IcChevronRight size={16} className="text-[#9AA9BA]" />
                </Link>
              )
            })}
          </div>

          {/* Account & activity — same design language, always reachable */}
          <div className="mt-2 px-3.5 py-1.5 text-[11px] font-bold tracking-[1.4px] text-[#52667C]">ACCOUNT</div>
          <div className="grid gap-0.5">
            {[
              { Icon: IcPerson, label: 'My Profile', href: '/profile' },
              { Icon: IcReceipt, label: 'My Orders', href: '/orders' },
              { Icon: IcBuild, label: 'Service Requests', href: '/service/my-requests' },
              { Icon: IcHelpCenter, label: 'Notifications', href: '/notifications', badge: unreadCount },
              { Icon: IcShoppingCart, label: 'My Cart', href: '/cart' },
              { Icon: IcLocationPin, label: 'Addresses', href: '/addresses' },
              { Icon: IcCreditCard, label: 'Wallet', href: '/wallet' },
              { Icon: IcStar, label: 'My Reviews', href: '/reviews' },
            ].map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
              const needsAuth = item.href !== '/cart'
              const linkHref = !isAuthenticated && needsAuth ? `/login?redirect=${encodeURIComponent(item.href)}` : item.href
              return (
                <Link key={item.href} href={linkHref} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-[46px] items-center gap-3.5 rounded-xl px-3.5 text-[14px] active:bg-[#F2F6FB] ${isActive ? 'bg-[#FFF1E8] font-bold text-[#BE3F09]' : 'font-medium text-[#0E2B4C]'}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${isActive ? 'bg-white text-[#BE3F09]' : 'bg-[#F2F6FB] text-[#0E2B4C]'}`}><item.Icon size={18} /></span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9283F] px-1.5 text-[10px] font-bold text-white">{item.badge > 9 ? '9+' : item.badge}</span> : null}
                  <IcChevronRight size={16} className="text-[#9AA9BA]" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="border-t border-[#EEF2F7] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          <a href="tel:+919310694349" className="flex items-center gap-3 rounded-xl bg-[#F5F8FC] px-3 py-2.5 text-[#0E2B4C]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E6F6EE] text-[#0F7040]"><IcCall size={20} /></span>
            <span className="grid leading-[1.3]"><span className="text-[11.5px] text-[#52667C]">24/7 Support</span><span className="text-[14px] font-bold">+91 93106 94349</span></span>
          </a>
          {isAuthenticated && (
            <button type="button" onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-100">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
