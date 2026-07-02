'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { shopAPI } from '@/services/api'
import {
  LayoutDashboard, Wrench, Users, Wallet, IndianRupee, Receipt,
  Store, ShieldCheck, Settings, LogOut, ArrowLeft, Check, Star, Headset, FileText,
} from 'lucide-react'

const DIST = '#D97706'

const NAV: { cap: string; items: { id: string; label: string; icon: any; href: string; badge?: number }[] }[] = [
  { cap: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/shop-partner' }] },
  { cap: 'Operations', items: [
    { id: 'jobs', label: 'Jobs & Orders', icon: Wrench, href: '/shop-partner/orders' },
    { id: 'mechanics', label: 'My Mechanics', icon: Users, href: '/shop-partner/mechanics' },
  ] },
  { cap: 'Finance', items: [
    { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/shop-partner/wallet' },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee, href: '/shop-partner/earnings' },
    { id: 'invoices', label: 'Invoices & GST', icon: FileText, href: '/shop-partner/invoices' },
    { id: 'settlements', label: 'Settlements', icon: Receipt, href: '/shop-partner/settlements' },
  ] },
  { cap: 'Reputation', items: [
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star, href: '/shop-partner/profile' },
  ] },
  { cap: 'Account', items: [
    { id: 'profile', label: 'Shop Profile', icon: Store, href: '/shop-partner/profile' },
    { id: 'kyc', label: 'KYC & Verification', icon: ShieldCheck, href: '/shop-partner/kyc' },
    { id: 'support', label: 'Help & Support', icon: Headset, href: '/shop-partner/support' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/shop-partner/settings' },
  ] },
]

export function ShopSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [shop, setShop] = useState<{ shopName?: string; city?: string; isVerified?: boolean } | null>(null)

  useEffect(() => {
    shopAPI.getProfile().then((r) => { if (r.data?.success) setShop(r.data.data) }).catch(() => {})
  }, [])

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    if (base === '/shop-partner') return router.pathname === '/shop-partner'
    return router.pathname === base
  }

  const initials = (shop?.shopName || 'Shop').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => { Cookies.remove('token'); router.push('/shop-partner/login') }

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 z-[55]" onClick={onClose} />}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[60] w-[262px] flex flex-col text-[#cfe] transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#0F2547' }}
      >
        {/* Brand chip */}
        <div className="flex items-center justify-center px-4 pt-[18px] pb-4 border-b border-white/[0.08]">
          <div className="bg-white rounded-2xl px-[18px] py-3.5 w-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,.28)]">
            <Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={200} height={48} className="h-[34px] w-auto object-contain" />
          </div>
        </div>

        {/* Role card */}
        <div className="mx-4 mt-3.5 mb-1.5 flex items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-3">
          <div className="h-[38px] w-[38px] rounded-[10px] flex items-center justify-center font-extrabold text-[15px] text-white shrink-0" style={{ background: `linear-gradient(135deg, ${DIST}, #F59E0B)` }}>{initials}</div>
          <div className="min-w-0">
            <b className="block text-[13.5px] text-white leading-tight truncate">{shop?.shopName || 'Shop Partner'}</b>
            <span className="text-[11px] text-[#8fb3cf]">Shop Partner{shop?.city ? ` · ${shop.city}` : ''}</span>
          </div>
          {shop?.isVerified && <Check className="ml-auto h-4 w-4 text-[#34D6B8] shrink-0" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-5 pt-1 scrollbar-ultra-narrow">
          {NAV.map((grp) => (
            <div key={grp.cap}>
              <div className="text-[10.5px] tracking-[0.12em] uppercase text-[#5d7a96] font-extrabold mx-3 mt-4 mb-2">{grp.cap}</div>
              {grp.items.map((it) => {
                const active = isActive(it.href)
                return (
                  <Link
                    key={it.id} href={it.href} onClick={onClose}
                    className={`flex items-center gap-3 px-3.5 py-[11px] rounded-[11px] text-[14px] font-semibold mb-0.5 transition-colors ${active ? 'text-white' : 'text-[#aec6dd] hover:bg-white/[0.06] hover:text-white'}`}
                    style={active ? { background: `linear-gradient(90deg, ${DIST}, rgba(15,118,110,.55))` } : {}}
                  >
                    <it.icon className="h-[19px] w-[19px] shrink-0" /> {it.label}
                    {it.badge ? <span className="ml-auto bg-[#FF6B35] text-white text-[10.5px] font-extrabold rounded-full px-1.5 min-w-[20px] text-center">{it.badge}</span> : null}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.08] space-y-0.5">
          <Link href="/" className="flex items-center gap-2.5 text-[#aec6dd] hover:text-white hover:bg-white/[0.06] text-[13.5px] font-semibold px-3 py-2.5 rounded-[10px]"><ArrowLeft className="h-[18px] w-[18px]" /> Back to website</Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 text-[#aec6dd] hover:text-white hover:bg-white/[0.06] text-[13.5px] font-semibold px-3 py-2.5 rounded-[10px]"><LogOut className="h-[18px] w-[18px]" /> Logout</button>
        </div>
      </aside>
    </>
  )
}
