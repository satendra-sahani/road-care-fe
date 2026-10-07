'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  IcAdd, IcCall, IcChat, IcNavigation, IcLocationOn, IcSchedule, IcStorefront, IcViewList, IcMap, IcCheckCircle, IcMyLocation, IcClose, IcLogout,
} from '@/components/icons/BmIcons'
import { GarageMap, LatLng } from './GarageMap'
import { STATUS, mapsLink, waLink, vehicleLabel } from './garageOptions'
import { MapGarage, MyGarage, NAVY, ORANGE, StaffShell, useAllGarages, useMyGarages } from './StaffShell'
import { useStaff } from './StaffAuth'

const fmtDay = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const fmtWhen = (iso: string) => {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const t = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
  return d >= today ? t : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${t}`
}
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening' }
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
// map pins of garages that are not this executive's own
const OTHERS_PIN = '#2563EB'
const PARTNER_PIN = '#7C3AED'

export function StatusPill({ status }: { status: MyGarage['status'] }) {
  const s = STATUS[status] || STATUS.pending
  return <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={{ color: s.fg, background: s.bg }}>{s.label}</span>
}

/** Doorstep service = the garage sends a mechanic to the customer. */
export function DoorstepTag({ yes }: { yes: boolean }) {
  return <span className="inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={yes ? { color: '#15803D', background: '#DCFCE7' } : { color: '#475569', background: '#E2E8F0' }}>{yes ? 'Doorstep service' : 'Workshop only'}</span>
}

function Thumb({ src, size = 64 }: { src?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false)
  return src && !broken
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={`${src}?tr=w-${size * 2},h-${size * 2},fo-auto`} alt="" width={size} height={size} loading="lazy" onError={() => setBroken(true)} className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />
    : <div className="flex shrink-0 items-center justify-center rounded-xl bg-[#E8EEF7] text-[#8A97AB]" style={{ width: size, height: size }}><IcStorefront size={size * 0.45} /></div>
}

function GarageCard({ g, actions = false }: { g: MyGarage; actions?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E6EBF2] bg-white p-3">
      <div className="flex gap-3">
        <Thumb src={g.photo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <b className="block truncate text-[14.5px] text-[#13203A]">{g.garageName}</b>
            <span className="shrink-0 text-[11.5px] font-semibold text-[#8A97AB]">{fmtWhen(g.createdAt)}</span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[#64748B]">{[g.area, g.city].filter(Boolean).join(', ') || g.address}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusPill status={g.status} />
            {g.doorstep != null && <DoorstepTag yes={g.doorstep} />}
            <span className="text-[11.5px] font-semibold text-[#8A97AB]">{g.code} · {g.vehicleTypes.map(vehicleLabel).join(', ')}</span>
          </div>
        </div>
      </div>
      {actions && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={`tel:+91${g.callNumber || g.whatsapp}`} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D9E1EC] text-[13px] font-bold text-[#1B3B6F] active:bg-[#EEF2F8]"><IcCall size={17} /> Call</a>
          <a href={waLink(g.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#BFE8CD] text-[13px] font-bold text-[#15803D] active:bg-[#F0FDF4]"><IcChat size={17} /> WhatsApp</a>
          <a href={mapsLink(g.location, g.address)} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white active:opacity-90" style={{ background: NAVY }}><IcNavigation size={17} /> Navigate</a>
        </div>
      )}
    </div>
  )
}

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-9 text-center">
    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2F8] text-[#8A97AB]"><IcStorefront size={24} /></div>
    <p className="text-[13.5px] font-semibold text-[#64748B]">{text}</p>
  </div>
)

// ════════════════════════════ Home ════════════════════════════
export function StaffHome() {
  const { me, target } = useStaff()
  const { garages, stats, loading, error, reload } = useMyGarages()

  const pct = Math.min(1, stats.today / target)
  const R = 26, C = 2 * Math.PI * R
  const tiles = [
    { n: stats.total, l: 'Total', fg: '#1D4ED8', bg: '#EFF4FF' },
    { n: stats.active, l: 'Verified', fg: '#15803D', bg: '#ECFDF3' },
    { n: stats.pending, l: 'Pending', fg: '#B45309', bg: '#FFF7E6' },
    { n: stats.inactive, l: 'Inactive', fg: '#B91C1C', bg: '#FEF0F0' },
  ]
  return (
    <StaffShell>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#64748B]">{greeting()},</p>
            <h2 className="truncate text-[20px] font-extrabold text-[#13203A]">{me.name} 👋</h2>
            <p className="text-[12.5px] font-semibold text-[#8A97AB]">Field Executive</p>
          </div>
          <Link href="/manager/garage/profile" aria-label="Profile" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[16px] font-extrabold text-white" style={{ background: NAVY }}>{initials(me.name)}</Link>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[#E6EBF2] bg-white p-4">
          <div>
            <b className="block text-[15px] text-[#13203A]">Today's Progress</b>
            <span className="text-[12.5px] text-[#64748B]">{fmtDay(new Date())}</span>
          </div>
          <div className="relative h-[68px] w-[68px]">
            <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
              <circle cx="34" cy="34" r={R} fill="none" stroke="#E6EBF2" strokeWidth="7" />
              <circle cx="34" cy="34" r={R} fill="none" stroke="#16A34A" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <b className="text-[15px] text-[#13203A]">{stats.today}/{target}</b>
              <span className="mt-0.5 text-[9.5px] font-semibold text-[#8A97AB]">Garages</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {tiles.map((t) => (
            <div key={t.l} className="rounded-2xl px-1 py-3 text-center" style={{ background: t.bg }}>
              <b className="block text-[22px] leading-none" style={{ color: t.fg }}>{t.n}</b>
              <span className="mt-1.5 block text-[11px] font-semibold text-[#475569]">{t.l}</span>
            </div>
          ))}
        </div>

        <Link href="/manager/garage/new" className="flex h-[52px] items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white active:opacity-90" style={{ background: ORANGE }}>
          <IcAdd size={22} /> Register New Garage
        </Link>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <b className="text-[16px] text-[#13203A]">Recent Garages</b>
            <Link href="/manager/garage/visits" className="text-[13px] font-bold" style={{ color: NAVY }}>View All</Link>
          </div>
          {error ? (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-center text-[13.5px] font-semibold text-[#B91C1C]">{error}<button onClick={reload} className="mt-2 block w-full font-bold underline">Try again</button></div>
          ) : loading ? (
            <div className="space-y-2.5">{[0, 1].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-[#E9EEF5]" />)}</div>
          ) : garages.length === 0 ? (
            <Empty text="No garages registered yet. Use the button above to add your first one." />
          ) : (
            <div className="space-y-2.5">{garages.slice(0, 4).map((g) => <GarageCard key={g.id} g={g} />)}</div>
          )}
        </div>
      </div>
    </StaffShell>
  )
}

// ════════════════════════════ My Visits ════════════════════════════
export function StaffVisits() {
  const { garages, loading, error, reload } = useMyGarages()
  const [view, setView] = useState<'list' | 'map'>('list')
  const [tab, setTab] = useState<'all' | 'pending' | 'active' | 'inactive'>('all')
  const [scope, setScope] = useState<'all' | 'mine'>('all') // the map: every garage, or only this executive's
  const [sel, setSel] = useState<string | null>(null)
  const [meLoc, setMeLoc] = useState<LatLng | null>(null)
  const { all, error: allError } = useAllGarages(view === 'map')
  const everyone = view === 'map' && scope === 'all' && all !== null

  const shown = useMemo(() => garages.filter((g) => tab === 'all' || g.status === tab), [garages, tab])
  // The map shows what is already covered by ANYONE — this executive's garages, other
  // executives' and the shop partners — so nobody visits the same garage twice.
  const mineOnMap: MapGarage[] = useMemo(() => garages.map((g) => ({ ...g, kind: 'garage' as const, mine: true })), [garages])
  const source = everyone ? all! : mineOnMap
  const onMap = useMemo(() => source.filter((g) => tab === 'all' || g.status === tab), [source, tab])
  const pins = useMemo(() => onMap.filter((g) => g.location?.lat != null).map((g) => ({
    id: g.id, lat: g.location!.lat, lng: g.location!.lng, color: g.kind === 'partner' ? PARTNER_PIN : g.mine ? (STATUS[g.status]?.pin || '#F59E0B') : OTHERS_PIN,
  })), [onMap])
  const selG = onMap.find((g) => g.id === sel) || null
  useEffect(() => { if (sel && !onMap.some((g) => g.id === sel)) setSel(null) }, [onMap, sel])

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => setMeLoc({ lat: p.coords.latitude, lng: p.coords.longitude }), () => undefined, { enableHighAccuracy: true, timeout: 12000 },
  )
  const n = (s: string) => source.filter((g) => s === 'all' || g.status === s).length
  const tabs = [
    { k: 'all', l: `All (${n('all')})` }, { k: 'pending', l: `Pending (${n('pending')})` },
    { k: 'active', l: `Verified (${n('active')})` }, { k: 'inactive', l: `Inactive (${n('inactive')})` },
  ] as const

  return (
    <StaffShell title="My Visits" back="/manager/garage">
      <div className="flex h-[calc(100dvh-58px-84px)] flex-col">
        <div className="space-y-3 border-b border-[#E6EBF2] bg-white p-3">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#D9E1EC]">
            {(['list', 'map'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className="flex h-10 items-center justify-center gap-1.5 text-[13.5px] font-bold" style={view === v ? { background: NAVY, color: '#fff' } : { color: '#475569' }}>
                {v === 'list' ? <IcViewList size={18} /> : <IcMap size={18} />}{v === 'list' ? 'List View' : 'Map View'}
              </button>
            ))}
          </div>
          {view === 'map' && (
            <div data-map-scope className="grid grid-cols-2 gap-2">
              {(['all', 'mine'] as const).map((s) => (
                <button key={s} type="button" data-scope={s} onClick={() => setScope(s)} aria-pressed={scope === s} className="h-9 rounded-xl border text-[12.5px] font-bold" style={scope === s ? { borderColor: ORANGE, color: '#C2410C', background: '#FFF4EE' } : { borderColor: '#D9E1EC', color: '#64748B' }}>
                  {s === 'all' ? `All garages${all ? ` (${all.length})` : ''}` : `My garages (${garages.length})`}
                </button>
              ))}
            </div>
          )}
          {everyone && (
            <div data-map-legend className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-0.5 text-[11.5px] font-semibold text-[#475569]">
              <span className="flex items-center gap-1.5"><span className="flex gap-0.5">{(['active', 'pending', 'inactive'] as const).map((s) => <span key={s} className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[s].pin }} />)}</span>Mine (by status)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: OTHERS_PIN }} />Other staff</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PARTNER_PIN }} />Shop partner</span>
            </div>
          )}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button key={t.k} type="button" onClick={() => setTab(t.k)} className="shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold" style={tab === t.k ? { borderColor: NAVY, color: NAVY, background: '#EFF4FF' } : { borderColor: '#D9E1EC', color: '#64748B' }}>{t.l}</button>
            ))}
          </div>
        </div>

        {view === 'list' ? (
          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {error ? (
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-center text-[13.5px] font-semibold text-[#B91C1C]">{error}<button onClick={reload} className="mt-2 block w-full font-bold underline">Try again</button></div>
            ) : loading ? [0, 1, 2].map((i) => <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-[#E9EEF5]" />)
              : shown.length === 0 ? <Empty text={tab === 'all' ? 'No garages registered yet.' : 'No garages in this list.'} />
                : shown.map((g) => <GarageCard key={g.id} g={g} actions />)}
          </div>
        ) : (
          <div className="relative flex-1">
            <GarageMap pins={pins} selectedId={sel} onSelect={setSel} me={meLoc} className="h-full w-full" zoomControl={false} />
            <button type="button" onClick={locate} aria-label="My location" className="absolute bottom-4 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1B3B6F] shadow-lg active:bg-[#EEF2F8]"><IcMyLocation size={22} /></button>
            {scope === 'all' && allError && <div className="pointer-events-none absolute inset-x-6 bottom-20 z-10 rounded-xl bg-white/95 px-3 py-2 text-center text-[12.5px] font-semibold text-[#B45309] shadow">{allError}</div>}
            {!loading && pins.length === 0 && (
              <div className="pointer-events-none absolute inset-x-6 top-6 z-10 rounded-xl bg-white/95 px-3 py-2.5 text-center text-[13px] font-semibold text-[#64748B] shadow">No garages to show on the map.</div>
            )}
            {selG && (
              <div className="absolute inset-x-3 top-3 z-10 rounded-2xl bg-white p-3 shadow-xl">
                <button type="button" onClick={() => setSel(null)} aria-label="Close" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[#8A97AB] active:bg-[#EEF2F8]"><IcClose size={18} /></button>
                <div className="flex gap-3 pr-6">
                  <Thumb src={selG.photo} size={56} />
                  <div className="min-w-0">
                    <b className="block truncate text-[14.5px] text-[#13203A]">{selG.garageName}</b>
                    <p className="flex items-center gap-1 truncate text-[12.5px] text-[#64748B]"><IcLocationOn size={14} />{[selG.area, selG.city].filter(Boolean).join(', ') || selG.address}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8A97AB]"><IcSchedule size={13} />{fmtWhen(selG.createdAt)} · <StatusPill status={selG.status} /></p>
                    {!selG.mine && <p data-map-owner className="mt-0.5 text-[12px] font-bold" style={{ color: selG.kind === 'partner' ? PARTNER_PIN : OTHERS_PIN }}>{selG.kind === 'partner' ? 'Shop partner — already with Bharat Mechanics' : `Already registered${selG.addedBy ? ` by ${selG.addedBy}` : ''}`}</p>}
                  </div>
                </div>
                <div className={`mt-2.5 grid gap-2 ${selG.callNumber || selG.whatsapp ? 'grid-cols-[48px_1fr]' : ''}`}>
                  {(selG.callNumber || selG.whatsapp) && <a href={`tel:+91${selG.callNumber || selG.whatsapp}`} aria-label="Call" className="flex h-10 items-center justify-center rounded-xl border border-[#D9E1EC] text-[#1B3B6F]"><IcCall size={19} /></a>}
                  <a href={mapsLink(selG.location, selG.address)} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-bold text-white" style={{ background: NAVY }}><IcNavigation size={17} /> Navigate</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StaffShell>
  )
}

// ════════════════════════════ Profile ════════════════════════════
export function StaffProfile() {
  const { me, target, setTarget, logout } = useStaff()
  const { stats } = useMyGarages()
  const [val, setVal] = useState(String(target))
  const [saved, setSaved] = useState(false)
  const saveTarget = (e: React.FormEvent) => {
    e.preventDefault()
    setTarget(Number(val) || 5)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }
  return (
    <StaffShell title="Profile" back="/manager/garage">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E6EBF2] bg-white p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-extrabold text-white" style={{ background: NAVY }}>{initials(me.name)}</div>
          <div className="min-w-0">
            <b className="block truncate text-[16px] text-[#13203A]">{me.name}</b>
            <span className="text-[13px] text-[#64748B]">+91 {me.phone} · Field Executive</span>
            <p className="mt-0.5 text-[12.5px] font-semibold text-[#8A97AB]">{stats.total} garages registered · {stats.active} verified</p>
          </div>
        </div>

        <form onSubmit={saveTarget} className="rounded-2xl border border-[#E6EBF2] bg-white p-4">
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-semibold text-[#13203A]">Daily target (garages per day)</span>
            <div className="flex gap-2.5">
              <input className="h-12 min-w-0 flex-1 rounded-xl border border-[#D9E1EC] bg-white px-3.5 text-[15px] text-[#13203A] outline-none focus:border-[#1B3B6F]" value={val} onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="5" />
              <button type="submit" className="h-12 shrink-0 rounded-xl px-5 text-[14.5px] font-bold text-white" style={{ background: ORANGE }}>Save</button>
            </div>
          </label>
          {saved && <p className="mt-2.5 flex items-center gap-1.5 text-[13px] font-bold text-[#15803D]"><IcCheckCircle size={17} /> Saved</p>}
        </form>

        <p className="px-2 text-center text-[12px] leading-relaxed text-[#8A97AB]">To change your name or number, contact the admin — staff accounts are created and edited only by the admin.</p>

        <button type="button" onClick={logout} className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-[#FECACA] bg-white text-[15px] font-bold text-[#B91C1C] active:bg-[#FEF2F2]"><IcLogout size={20} /> Logout</button>
      </div>
    </StaffShell>
  )
}
