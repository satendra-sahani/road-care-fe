'use client'

import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { IcHome, IcViewList, IcAdd, IcPerson, IcArrowBack, IcHeadsetMic } from '@/components/icons/BmIcons'
import { garageFieldAPI } from '@/services/api'

export const NAVY = '#1B3B6F'
export const ORANGE = '#FF5A1F'
export const SUPPORT_PHONE = '9310694349'

export type MyGarage = {
  id: string; code: string; garageName: string; ownerName: string; whatsapp: string; callNumber?: string
  address: string; area?: string; city?: string; location?: { lat: number; lng: number }; photo?: string | null
  vehicleTypes: string[]; services: string[]; mechanics: number; status: 'pending' | 'active' | 'inactive'
  visitDate: string; createdAt: string
  doorstep?: boolean; travelKm?: number | null // doorstep service = sends a mechanic to the customer
}
/** A garage on the "all garages" map: the executive's own in full, somebody else's without phone numbers, or a shop partner. */
export type MapGarage = {
  id: string; kind: 'garage' | 'partner'; mine: boolean; garageName: string; status: 'pending' | 'active' | 'inactive'; createdAt: string
  code?: string; address?: string; area?: string; city?: string; location?: { lat: number; lng: number }; photo?: string | null
  addedBy?: string; doorstep?: boolean; whatsapp?: string; callNumber?: string
  ownerName?: string; vehicleTypes?: string[]; services?: string[]; mechanics?: number; visitDate?: string; travelKm?: number | null
}
export type MyStats = { total: number; today: number; pending: number; active: number; inactive: number }

/** The logged-in executive's garages + numbers. */
export function useMyGarages() {
  const [garages, setGarages] = useState<MyGarage[]>([])
  const [stats, setStats] = useState<MyStats>({ total: 0, today: 0, pending: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const r = await garageFieldAPI.mine()
      setGarages(r.data?.data?.garages || [])
      setStats(r.data?.data?.stats || { total: 0, today: 0, pending: 0, active: 0, inactive: 0 })
    } catch { setError('Could not load the list. Check your internet and try again.') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  return { garages, stats, loading, error, reload: load }
}

/** Every garage — all executives' and the shop partners — for the map. Loaded once `on` is true. */
export function useAllGarages(on: boolean) {
  const [all, setAll] = useState<MapGarage[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try {
      const r = await garageFieldAPI.all()
      setAll([...(r.data?.data?.garages || []), ...(r.data?.data?.partners || [])])
    } catch { setError('Could not load all garages — showing only yours.') }
  }, [])
  useEffect(() => { if (on && all === null && !error) load() }, [on, all, error, load])
  return { all, error, reload: load }
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
                <a href={`tel:+91${SUPPORT_PHONE}`} aria-label="Call support" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B3B6F] active:bg-[#EEF2F8]"><IcHeadsetMic size={22} /></a>
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
