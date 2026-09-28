'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import {
  LayoutDashboard, Store, Wrench, ClipboardList, IndianRupee, Wallet, Users, UserCircle, LogOut, ArrowLeft, Menu,
} from 'lucide-react'
import { useFranchise } from './FranchiseContext'

export const FR_ACCENT = '#0D9488'

const NAV: { cap: string; items: { label: string; icon: any; href: string; ownerOnly?: boolean }[] }[] = [
  { cap: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/franchise' }] },
  { cap: 'Network', items: [
    { label: 'Mechanics', icon: Wrench, href: '/franchise/mechanics' },
    { label: 'Shops', icon: Store, href: '/franchise/shops' },
    { label: 'Service Requests', icon: ClipboardList, href: '/franchise/requests' },
  ] },
  { cap: 'Money', items: [
    { label: 'Earnings', icon: IndianRupee, href: '/franchise/earnings' },
    { label: 'Wallet', icon: Wallet, href: '/franchise/wallet', ownerOnly: true },
  ] },
  { cap: 'Account', items: [
    { label: 'Team', icon: Users, href: '/franchise/team', ownerOnly: true },
    { label: 'Profile', icon: UserCircle, href: '/franchise/profile' },
  ] },
]

const TITLES: Record<string, { t: string; s: string }> = {
  '/franchise': { t: 'Dashboard', s: 'Your franchise at a glance' },
  '/franchise/mechanics': { t: 'Mechanics', s: 'Add and manage your mechanics' },
  '/franchise/shops': { t: 'Shops', s: 'Add and manage your partner shops' },
  '/franchise/requests': { t: 'Service Requests', s: 'Jobs booked by you or assigned to your network' },
  '/franchise/earnings': { t: 'Earnings', s: 'What you earn from every paid job' },
  '/franchise/wallet': { t: 'Wallet', s: 'Your balance — 100% withdrawable' },
  '/franchise/team': { t: 'Team', s: 'People who help run your franchise' },
  '/franchise/profile': { t: 'Profile', s: 'Franchise details and payout account' },
}

export function FranchiseLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { me } = useFranchise()
  const [open, setOpen] = useState(false)
  const meta = TITLES[router.pathname] || { t: 'Franchise', s: '' }
  const isActive = (href: string) => (href === '/franchise' ? router.pathname === '/franchise' : router.pathname.startsWith(href))
  const initials = (me?.franchise?.name || 'Franchise').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const logout = () => { Cookies.remove('franchise_token'); router.push('/franchise/login') }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {open && <div className="fixed inset-0 z-[55] bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed bottom-0 left-0 top-0 z-[60] flex w-[262px] flex-col bg-[#0F2547] transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-center border-b border-white/[0.08] px-5 pb-5 pt-6">
          <Image src="/white-logo-bm.png" alt="Bharat Mechanics" width={220} height={52} priority className="h-[44px] w-auto object-contain" />
        </div>
        <div className="mx-4 mb-1.5 mt-3.5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[15px] font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${FR_ACCENT}, #14B8A6)` }}>{initials}</div>
          <div className="min-w-0">
            <b className="block truncate text-[13.5px] leading-tight text-white">{me?.franchise?.name || 'Franchise'}</b>
            <span className="text-[11px] text-[#8fb3cf]">{me?.isOwner ? 'Owner' : 'Team member'}{me?.franchise?.city ? ` · ${me.franchise.city}` : ''}</span>
          </div>
        </div>
        <nav className="scrollbar-franchise flex-1 overflow-y-auto px-3 pb-5 pt-1">
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.ownerOnly || me?.isOwner)
            if (!items.length) return null
            return (
              <div key={g.cap}>
                <div className="mx-3 mb-2 mt-4 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#5d7a96]">{g.cap}</div>
                {items.map((it) => {
                  const active = isActive(it.href)
                  return (
                    <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
                      className={`mb-0.5 flex items-center gap-3 rounded-[11px] px-3.5 py-[11px] text-[14px] font-semibold transition-colors ${active ? 'text-white' : 'text-[#aec6dd] hover:bg-white/[0.06] hover:text-white'}`}
                      style={active ? { background: `linear-gradient(90deg, ${FR_ACCENT}, rgba(13,148,136,.45))` } : {}}>
                      <it.icon className="h-[19px] w-[19px] shrink-0" /> {it.label}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>
        <div className="space-y-0.5 border-t border-white/[0.08] p-3.5">
          <Link href="/" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-[#aec6dd] hover:bg-white/[0.06] hover:text-white"><ArrowLeft className="h-[18px] w-[18px]" /> Back to website</Link>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-[#aec6dd] hover:bg-white/[0.06] hover:text-white"><LogOut className="h-[18px] w-[18px]" /> Logout</button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[262px]">
        <header className="sticky top-0 z-40 flex h-[70px] items-center gap-4 border-b border-[#E7ECF3] bg-white/[0.92] px-4 backdrop-blur-md md:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] border border-[#E7ECF3] bg-white text-[#1B3B6F] lg:hidden"><Menu className="h-[22px] w-[22px]" /></button>
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-extrabold leading-tight text-[#13203A] md:text-[20px]">{meta.t}</h1>
            <p className="truncate text-[12.5px] text-[#7B8AA3]">{meta.s}</p>
          </div>
          <div className="ml-auto hidden text-right sm:block">
            <b className="block text-[13px] text-[#13203A]">{me?.user?.fullName}</b>
            <span className="text-[11.5px] text-[#7B8AA3]">{me?.franchise?.code}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
