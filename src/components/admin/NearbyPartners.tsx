'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, MapPin, Phone, Store, User, Radar, Info } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import type { Mechanic } from '@/store/slices/mechanicSlice'
import { agoText, garageItem, geocodeAddress, hasPhone, kmText, mechanicItem, PARTNER_STATUS, telHref, waHref, type NearbyPin, type PartnerItem, type Pt } from './partnerItems'

// "Nearest Garages & Mechanics" of the Create Service Request dialog.
// It fills in by itself the moment the customer's location is known — shared from
// their phone, picked from the search, an earlier address, or a pin dropped by hand —
// and re-ranks whenever the pin moves. While there is only a typed address, the
// customer is placed from that text and the distances are marked approximate.
// Nothing is assigned here: it is for telling the customer how far help is and for
// ringing the garage; the job is assigned from the list after it is created.

type Tab = 'all' | 'garage' | 'mechanic'

const BLUE = '#1E40E0'
const NEAR_KM = 10
const FIRST = 5
const MORE = 20
const STALE_MIN = 30 // a mechanic's position older than this is shown with its age
const keyOf = (it: PartnerItem) => `${it.kind}:${it.id}`
const pinColor = (it: PartnerItem) => (it.status !== 'available' ? '#64748B' : it.kind === 'garage' ? '#4F46E5' : '#2563EB')

export function NearbyPartners({ pos, addressQueries, shops, mechanics, loading, onOpen, onPins, onShowOnMap, radiusKm = NEAR_KM }: {
  /** the pin on the map, when there is one */
  pos: Pt | null
  /** the typed address in a few forms (full first) — used only while there is no pin */
  addressQueries: string[]
  shops: any[]
  mechanics: Mechanic[]
  loading: boolean
  onOpen: (it: PartnerItem, from: { customer: Pt | null; approx: boolean }) => void
  /** the rows on screen, to draw them on the map (a tap on a pin opens that row) */
  onPins?: (pins: NearbyPin[]) => void
  /** zoom the map out so the customer and the rows are all in view */
  onShowOnMap?: () => void
  /** only garages / mechanics within this many km (0 = any distance) */
  radiusKm?: number
}) {
  const [tab, setTab] = useState<Tab>('all')
  const [limit, setLimit] = useState(FIRST)
  const [approx, setApprox] = useState<Pt | null>(null)
  const [looking, setLooking] = useState(false)

  // no pin yet: place the customer from the typed address, a moment after the typing stops
  const typed = addressQueries.join('|')
  useEffect(() => {
    if (pos) { setApprox(null); setLooking(false); return }
    if ((addressQueries[0] || '').length < 10) { setApprox(null); setLooking(false); return }
    let off = false
    setLooking(true)
    const t = setTimeout(() => {
      geocodeAddress(addressQueries).then((p) => { if (!off) { setApprox(p); setLooking(false) } }).catch(() => { if (!off) setLooking(false) })
    }, 1200)
    return () => { off = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos?.lat, pos?.lng, typed])

  const cust = pos || approx
  const isApprox = !pos && !!approx

  const { located, unplaced } = useMemo(() => {
    if (!cust) return { located: [] as PartnerItem[], unplaced: 0 }
    const all = [...(shops || []).map((s) => garageItem(s, cust)), ...(mechanics || []).map((m) => mechanicItem(m, cust))]
    return {
      located: all.filter((it) => it.km != null).sort((a, b) => (a.km as number) - (b.km as number)),
      unplaced: all.filter((it) => it.km == null).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, mechanics, cust?.lat, cust?.lng])

  const count = (k: Tab) => (k === 'all' ? located : located.filter((it) => it.kind === k)).length
  const kindList = tab === 'all' ? located : located.filter((it) => it.kind === tab)
  const list = radiusKm > 0 ? kindList.filter((it) => (it.km as number) <= radiusKm) : kindList
  const farther = kindList.length - list.length
  const rows = list.slice(0, limit)
  const near = list.filter((it) => (it.km as number) <= (radiusKm || NEAR_KM)).length

  // the rows on screen go on the map, numbered the same way
  const pinSig = rows.map((it) => `${keyOf(it)}@${it.pt?.lat},${it.pt?.lng}|${it.status}`).join(';')
  useEffect(() => {
    onPins?.(rows.filter((it) => it.pt).map((it, i) => ({ id: keyOf(it), n: i + 1, lat: it.pt!.lat, lng: it.pt!.lng, title: `${i + 1}. ${it.name} — ${kmText(it.km, isApprox)}`, color: pinColor(it), onClick: () => onOpen(it, { customer: cust, approx: isApprox }) })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSig, isApprox])
  useEffect(() => () => onPins?.([]), []) // eslint-disable-line react-hooks/exhaustive-deps

  const head = (
    <div className="flex min-h-[46px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-xl bg-[#EEF3FD] px-4 py-2">
      <h3 className="flex items-center gap-2.5 text-[15.5px] font-bold text-[#0F1E46]"><span style={{ color: BLUE }}><Radar className="h-[18px] w-[18px]" /></span>Nearest Garages &amp; Mechanics</h3>
    </div>
  )

  if (!cust) {
    return (
      <section className="rounded-xl border border-[#E6ECF5] bg-white" data-nearby="waiting">
        {head}
        <div className="flex items-start gap-2.5 p-3.5 text-[12.5px] leading-snug text-[#4B5563]">
          {looking ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" style={{ color: BLUE }} /> : <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />}
          <span>{looking ? 'Finding the area of the typed address…' : 'The nearest garages and mechanics show up here by themselves as soon as the customer’s location is known — shared from their phone, searched, or pinned on the map.'}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[#E6ECF5] bg-white" data-nearby={isApprox ? 'approx' : 'exact'}>
      {head}
      <div className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex overflow-hidden rounded-lg border border-[#D5DDEC] bg-white text-[12.5px] font-semibold" role="group" aria-label="Show">
            {(['all', 'garage', 'mechanic'] as const).map((k) => (
              <button key={k} type="button" onClick={() => { setTab(k); setLimit(FIRST) }} aria-pressed={tab === k} data-nearby-tab={k}
                className={`h-8 whitespace-nowrap px-3 ${tab === k ? 'bg-[#E3EBFF] text-[#1E40E0]' : 'text-[#374151] hover:bg-[#F6F8FB]'}`}>{k === 'all' ? 'All' : k === 'garage' ? 'Garages' : 'Mechanics'} <span className="font-normal opacity-80">{count(k)}</span></button>
            ))}
          </div>
          {rows.length > 0 && onShowOnMap && pos && (
            <button type="button" onClick={onShowOnMap} data-nearby-map title="Zoom the map out until the customer and these rows are all in view" className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#D5DDEC] bg-white px-2.5 text-[12.5px] font-bold hover:bg-[#F6F8FB]" style={{ color: BLUE }}><MapPin className="h-4 w-4" />On map</button>
          )}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#4B5563]" data-nearby-summary>
          {loading && kindList.length === 0 ? 'Loading…' : list.length === 0 ? (kindList.length ? `None within ${radiusKm} km — ${farther} farther away; widen the radius on the map` : '') : `${radiusKm > 0 ? `${near} within ${radiusKm} km` : `${list.length} at any distance`} · nearest ${kmText(list[0].km, isApprox)} away${farther > 0 ? ` · ${farther} farther than ${radiusKm} km` : ''}`}
        </p>

        {isApprox && (
          <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#FFF8E6] px-2.5 py-2 text-[12px] leading-snug text-[#92400E]" data-nearby-approx>
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Measured from the <b>typed address</b>, so the distances are approximate. Ask for the location or drop the pin for exact ones.</span>
          </p>
        )}

        {loading && list.length === 0 ? (
          <div className="py-8 text-center text-[#64748B]"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : list.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-[#CBD5E1] px-3 py-5 text-center text-[12.5px] text-[#6B7280]" data-nearby-empty>
            {tab === 'garage' ? 'No garage has a saved map location yet.' : tab === 'mechanic' ? 'No mechanic has shared a location yet.' : 'No garage or mechanic has a saved location yet.'}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5" data-nearby-list>
            {rows.map((it, i) => {
              const st = PARTNER_STATUS[it.status]
              const seen = it.kind === 'mechanic' ? it.raw?.currentLocation?.lastUpdated : null
              const stale = seen && Date.now() - new Date(seen).getTime() > STALE_MIN * 60000
              return (
                <li key={keyOf(it)} data-nearby-row={it.kind} className="flex items-center gap-1.5 rounded-xl border border-[#E6ECF5] bg-[#FBFCFE] pr-2 hover:border-[#BCD0FB] hover:bg-[#F3F6FC]">
                  <button type="button" onClick={() => onOpen(it, { customer: cust, approx: isApprox })} title="Details and numbers to call" className="flex min-w-0 flex-1 items-start gap-2.5 py-2 pl-2.5 text-left">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold text-white" style={{ background: pinColor(it) }}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <b className="truncate text-[13.5px] text-[#111827]">{it.name}</b>
                        <span className="shrink-0 whitespace-nowrap text-[13.5px] font-bold text-[#0F1E46]" data-nearby-km>{kmText(it.km, isApprox)}</span>
                      </span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11.5px] text-[#6B7280]">
                        {it.kind === 'garage' ? <Store className="h-3.5 w-3.5 shrink-0 text-indigo-600" /> : <User className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />}
                        <span className="shrink-0 font-semibold text-[#374151]">{it.kind === 'garage' ? 'Garage' : 'Mechanic'}</span>
                        <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: st.dot }} />
                        <span className="shrink-0 font-semibold" style={{ color: st.fg }}>{st.label}</span>
                        {(stale || (it.place && it.place !== '—')) && <span className="truncate">· {stale ? `seen ${agoText(seen)}` : it.place}</span>}
                      </span>
                    </span>
                  </button>
                  {hasPhone(it.phone) && (
                    <>
                      <a href={telHref(it.phone)} title={`Call ${it.name}`} data-nearby-call className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E3E8EF] bg-white hover:bg-[#F3F6FC]" style={{ color: BLUE }}><Phone className="h-4 w-4" /></a>
                      <a href={waHref(it.phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E3E8EF] bg-white text-[#15803D] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-4 w-4" /></a>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {list.length > rows.length && (
          <button type="button" onClick={() => setLimit(MORE)} data-nearby-more className="mt-2 w-full rounded-lg border border-dashed border-[#CBD5E1] bg-white px-3 py-2 text-[12.5px] font-bold hover:bg-[#F8FAFD]" style={{ color: BLUE }}>
            Show {Math.min(list.length, MORE) - rows.length} more
          </button>
        )}
        {unplaced > 0 && list.length > 0 && (
          <p className="mt-2 text-[11.5px] leading-snug text-[#6B7280]">{unplaced} more {unplaced === 1 ? 'has' : 'have'} no saved location, so {unplaced === 1 ? 'it is' : 'they are'} not ranked here — you still see {unplaced === 1 ? 'it' : 'them'} when assigning.</p>
        )}
      </div>
    </section>
  )
}
