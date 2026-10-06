'use client'

import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { IcHome, IcViewList, IcAdd, IcPerson, IcArrowBack, IcHeadsetMic } from '@/components/icons/BmIcons'
import { garageFieldAPI } from '@/services/api'
import { getStaff, getStaffKey, saveStaff, StaffMe } from './staff'

export const NAVY = '#1B3B6F'
export const ORANGE = '#FF5A1F'
export const SUPPORT_PHONE = '9310694349'

export type MyGarage = {
  id: string; code: string; garageName: string; ownerName: string; whatsapp: string; callNumber?: string
  address: string; area?: string; city?: string; location?: { lat: number; lng: number }; photo?: string | null
  vehicleTypes: string[]; services: string[]; mechanics: number; status: 'pending' | 'active' | 'inactive'
  visitDate: string; createdAt: string
}
export type MyStats = { total: number; today: number; pending: number; active: number; inactive: number }

/** This phone's garages + numbers. */
export function useMyGarages() {
  const [garages, setGarages] = useState<MyGarage[]>([])
  const [stats, setStats] = useState<MyStats>({ total: 0, today: 0, pending: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const r = await garageFieldAPI.mine(getStaffKey())
      setGarages(r.data?.data?.garages || [])
      setStats(r.data?.data?.stats || { total: 0, today: 0, pending: 0, active: 0, inactive: 0 })
    } catch { setError('List load nahi hui. Internet check karke dobara try karein.') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  return { garages, stats, loading, error, reload: load }
}

/** The executive's name + mobile (asked once, kept on the phone — not a login). */
export function useStaff() {
  const [me, setMe] = useState<StaffMe | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { setMe(getStaff()); setReady(true) }, [])
  const save = (m: StaffMe) => { saveStaff(m); setMe(m) }
  return { me, ready, save }
}

const TABS = [
  { href: '/manager/garage', label: 'Home', Icon: IcHome },
  { href: '/manager/garage/visits', label: 'Visits', Icon: IcViewList },
  { href: '/manager/garage/new', label: 'Add Garage', Icon: IcAdd },
  { href: '/manager/garage/profile', label: 'Profile', Icon: IcPerson },
]

/**
 * Phone-sized app frame for /manager/garage/*: on a phone it fills the screen,
 * on a desktop it sits as a centred column. `title` gives a back-arrow header;
 * without it the brand header shows. `nav={false}` hides the bottom tabs (form).
 */
export function StaffShell({ title, back, right, nav = true, children }: {
  title?: string; back?: string | (() => void); right?: React.ReactNode; nav?: boolean; children: React.ReactNode
}) {
  const router = useRouter()
  const goBack = () => (typeof back === 'function' ? back() : router.push(back || '/manager/garage'))
  return (
    <div className="min-h-[100dvh] bg-[#E9EEF5]">
      <Head>
        <title>{title ? `${title} · Bharat Mechanics Field` : 'Bharat Mechanics Field'}</title>
        <meta key="robots" name="robots" content="noindex, nofollow" />
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FFFFFF" />
      </Head>
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-[#F6F8FC] shadow-[0_0_40px_rgba(15,37,71,.08)]">
        <header className="sticky top-0 z-30 flex h-[58px] shrink-0 items-center gap-2 border-b border-[#E6EBF2] bg-white px-3">
          {title ? (
            <>
              <button type="button" onClick={goBack} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B3B6F] active:bg-[#EEF2F8]"><IcArrowBack size={22} /></button>
              <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-[#13203A]">{title}</h1>
              <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
            </>
          ) : (
            <>
              <Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={150} height={40} priority className="h-[34px] w-auto object-contain" />
              <div className="ml-auto flex items-center gap-1">
                {right}
                <a href={`tel:+91${SUPPORT_PHONE}`} aria-label="Support ko call karein" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B3B6F] active:bg-[#EEF2F8]"><IcHeadsetMic size={22} /></a>
              </div>
            </>
          )}
        </header>

        <main className={`flex-1 ${nav ? 'pb-[84px]' : ''}`}>{children}</main>

        {nav && (
          <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 border-t border-[#E6EBF2] bg-white pb-[env(safe-area-inset-bottom)]">
            {TABS.map((t) => {
              const on = router.pathname === t.href
              return (
                <Link key={t.href} href={t.href} className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold" style={{ color: on ? NAVY : '#8A97AB' }}>
                  <t.Icon size={23} />
                  {t.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}

/** First run: who is using this phone. Stored locally and sent with each garage. */
export function StaffIntro({ initial, onSave, cta = 'Shuru karein' }: { initial?: StaffMe | null; onSave: (m: StaffMe) => void; cta?: string }) {
  const [name, setName] = useState(initial?.name || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [target, setTarget] = useState(String(initial?.target || 5))
  const [err, setErr] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Apna poora naam likhein')
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr('Sahi 10-digit mobile number daalein')
    setErr('')
    onSave({ name: name.trim(), phone, target: Math.min(50, Math.max(1, Number(target) || 5)) })
  }
  const inp = 'h-12 w-full rounded-xl border border-[#D9E1EC] bg-white px-3.5 text-[15px] text-[#13203A] outline-none focus:border-[#1B3B6F]'
  return (
    <form onSubmit={submit} className="space-y-3.5">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-[#13203A]">Aapka naam <b className="text-[#E11D48]">*</b></span>
        <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rakesh Yadav" autoComplete="name" maxLength={80} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-[#13203A]">Aapka mobile number <b className="text-[#E11D48]">*</b></span>
        <div className="flex h-12 overflow-hidden rounded-xl border border-[#D9E1EC] bg-white focus-within:border-[#1B3B6F]">
          <span className="flex items-center border-r border-[#E6EBF2] px-3 text-[15px] font-semibold text-[#13203A]">+91</span>
          <input className="min-w-0 flex-1 px-3 text-[15px] text-[#13203A] outline-none" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-[#13203A]">Roz ka target (kitne garage)</span>
        <input className={inp} value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="5" />
      </label>
      {err && <p className="text-[13px] font-semibold text-[#DC2626]">{err}</p>}
      <button type="submit" className="h-[52px] w-full rounded-2xl text-[16px] font-bold text-white active:opacity-90" style={{ background: ORANGE }}>{cta}</button>
    </form>
  )
}
