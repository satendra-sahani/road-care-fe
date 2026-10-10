'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Phone, MapPin, Star, Clock, Copy, Store, User, BadgeCheck, Wrench, ExternalLink, Loader2, Mail, Repeat, Navigation, ClipboardList, Home } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { adminShopAPI, adminGarageAPI, mechanicAPI } from '@/services/api'
import type { Mechanic } from '@/store/slices/mechanicSlice'
import { normalizeMechanic } from '@/store/sagas/mechanicSaga'
import { agoText, garageItem, hasPhone, kmText, mechanicItem, PARTNER_STATUS, phone10, prettyPhone, telHref, waHref, type PartnerItem, type Pt } from './partnerItems'
import { initialsOf } from './serviceRequestUi'

// Contact card of a garage / mechanic — opened from the name of whoever a request is
// assigned to, and from a row of the nearest list while a request is being created.
// It answers "who is this and how do I reach them": every number with Call / WhatsApp /
// Copy, the mechanic on the job, the address and how far it is from the customer.
// Read-only: it changes nothing. "Reassign" hands over to the usual assign dialog.

export type PartnerTarget = {
  /** which side to show first */
  show: 'garage' | 'mechanic'
  /** raw = the whole record when the caller already has it (nothing is fetched then) */
  garage?: { id: string; field?: boolean; raw?: any; name?: string; phone?: string; city?: string }
  /** id = a platform mechanic; without it, a garage's own mechanic known only by name and number */
  mechanic?: { id?: string; raw?: Mechanic; name?: string; phone?: string }
  /** where the customer is, to measure from */
  customer?: Pt | null
  approx?: boolean
  /** the request this is about */
  job?: { id: string; status?: string }
}

const BLUE = '#1E40E0'
const uniq = <T,>(a: T[]) => a.filter((x, i) => a.indexOf(x) === i)
const copy = async (text: string, what: string) => {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`) } catch { toast.error('Could not copy — select the number and copy it') }
}
type Num = { label: string; phone: string }
/** one row per number: the first label a number appears under wins */
const numbers = (list: { label: string; phone?: string | null }[]): Num[] => {
  const seen = new Set<string>()
  return list.filter((n) => hasPhone(n.phone) && !seen.has(phone10(n.phone)) && seen.add(phone10(n.phone))).map((n) => ({ label: n.label, phone: phone10(n.phone) }))
}

function NumberRow({ n, first }: { n: Num; first: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 ${first ? 'border-[#BFE3CC] bg-[#F0FBF4]' : 'border-[#E6ECF5] bg-white'}`} data-partner-number>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${first ? 'bg-[#16A34A] text-white' : 'bg-[#EEF3FD] text-[#1E40E0]'}`}><Phone className="h-[18px] w-[18px]" /></span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-[#6B7280]">{n.label}</span>
        <b className="block whitespace-nowrap text-[17px] tracking-wide text-[#0F1E46]" data-partner-phone>{prettyPhone(n.phone)}</b>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <a href={telHref(n.phone)} data-partner-call className={`flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-bold ${first ? 'bg-[#16A34A] text-white hover:bg-[#15803D]' : 'border border-[#CBD5E8] bg-white text-[#0F1E46] hover:bg-[#F3F6FC]'}`}><Phone className="h-4 w-4" />Call</a>
        <a href={waHref(n.phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B7E4C7] bg-white text-[#15803D] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-[18px] w-[18px]" /></a>
        <button type="button" onClick={() => copy(n.phone, 'Number')} title="Copy the number" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CBD5E8] bg-white text-[#0F1E46] hover:bg-[#F3F6FC]"><Copy className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
const Title = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h4 className="mb-2 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-[#6B7280]"><span style={{ color: BLUE }}>{icon}</span>{children}</h4>
)
const Row = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5 text-[13.5px] text-[#1F2937]"><span className="mt-0.5 shrink-0 text-[#16305C]">{icon}</span><span className="min-w-0 flex-1 break-words">{children}</span></div>
)
const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">{items.map((c) => <span key={c} className="rounded-lg bg-[#EEF3FB] px-2.5 py-1 text-[12px] font-medium text-[#16305C]">{c}</span>)}</div>
)

export function PartnerDetailsDialog({ target, mechanics, onClose, onReassign }: {
  target: PartnerTarget | null
  /** the admin's mechanic list, so a mechanic's details need no extra request */
  mechanics: Mechanic[]
  onClose: () => void
  /** shown as "Reassign" when the card is about a request */
  onReassign?: () => void
}) {
  const [tab, setTab] = useState<'garage' | 'mechanic'>('garage')
  const [shop, setShop] = useState<any | null>(null)
  const [site, setSite] = useState<any | null>(null) // the record our field staff wrote at the garage: owner's name, the number to ring
  const [team, setTeam] = useState<any[]>([]) // the garage's mechanics that have their own accounts
  const [mech, setMech] = useState<Mechanic | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const sig = target ? `${target.show}|${target.garage?.id || ''}|${target.mechanic?.id || target.mechanic?.phone || ''}|${target.job?.id || ''}` : ''
  useEffect(() => {
    if (!target) return
    let off = false
    const g = target.garage, m = target.mechanic
    setTab(target.show); setShop(g?.raw || null); setSite(null); setTeam([]); setFailed(false)
    setMech(m?.raw || (m?.id ? mechanics.find((x) => x._id === m.id) || null : null))
    const jobs: Promise<unknown>[] = []
    if (g?.id && !g.raw) jobs.push(adminShopAPI.getById(g.id).then((r) => { if (off) return; if (r.data?.success && r.data.data) setShop(r.data.data); else setFailed(true) }).catch(() => { if (!off) setFailed(true) }))
    if (g?.id && !g.field) jobs.push(adminShopAPI.getShopMechanics(g.id).then((r) => { if (!off && r.data?.success) setTeam(r.data.data || []) }).catch(() => {}))
    if (g?.id && g.field) jobs.push(adminGarageAPI.get(g.id).then((r) => { if (!off && r.data?.data) setSite(r.data.data) }).catch(() => {}))
    if (m?.id && !m.raw && !mechanics.some((x) => x._id === m.id)) jobs.push(mechanicAPI.getById(m.id).then((r) => { if (!off && r.data?.success && r.data.data) setMech(normalizeMechanic(r.data.data)) }).catch(() => {}))
    setLoading(jobs.length > 0)
    Promise.all(jobs).finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
  // a shop partner that began as a field garage keeps that record too
  const siteId = shop && !target?.garage?.field ? (typeof shop.garage === 'string' ? shop.garage : shop.garage?._id) : null
  useEffect(() => {
    if (!siteId) return
    let off = false
    adminGarageAPI.get(siteId).then((r) => { if (!off && r.data?.data) setSite(r.data.data) }).catch(() => {})
    return () => { off = true }
  }, [siteId])

  if (!target) return null
  const g = target.garage, m = target.mechanic
  const cust = target.customer || null
  const both = !!g && !!m
  const view = tab === 'mechanic' && m ? 'mechanic' : g ? 'garage' : 'mechanic'

  // ── the garage ──
  const gi: PartnerItem | null = shop ? garageItem(shop, cust) : null
  const gName = shop?.shopName || g?.name || 'Garage'
  const owner = String(shop?.user?.fullName || site?.ownerName || '').trim()
  const gNumbers = numbers([
    { label: 'Garage number', phone: shop?.shopPhone || g?.phone },
    { label: owner ? `Owner · ${owner}` : 'Owner', phone: shop?.user?.phone },
    { label: 'Number to call (from our field visit)', phone: site?.callNumber },
    { label: 'WhatsApp number (from our field visit)', phone: site?.whatsapp },
  ])
  const a = shop?.address || {}
  const gAddress = uniq([a.street, a.landmark && `Near ${a.landmark}`, a.area, a.city || g?.city, a.state, a.pincode].map((x) => String(x || '').trim()).filter(Boolean)).join(', ')
  // its mechanics: the ones with their own accounts first, then the names the garage only wrote down — one row per number
  const gMechs: { name: string; sub: string; phone?: string }[] = [
    ...team.filter((x: any) => x?.name).map((x: any) => ({ name: x.name, sub: (x.specializations || []).slice(0, 2).join(', ') || 'Mechanic', phone: x.phone })),
    ...(shop?.mechanics || []).filter((x: any) => x?.isActive !== false && x?.name).map((x: any) => ({ name: x.name, sub: x.specialization || 'Mechanic', phone: x.phone })),
  ].filter((x, i, all) => !hasPhone(x.phone) || all.findIndex((y) => phone10(y.phone) === phone10(x.phone)) === i)

  // ── the mechanic ──
  const mi: PartnerItem | null = mech ? mechanicItem(mech, cust) : null
  const mName = mech?.name || m?.name || 'Mechanic'
  const mPhone = mech?.phone || m?.phone
  const mNumbers = numbers([
    { label: 'Mobile number', phone: mPhone },
    { label: 'Emergency contact', phone: mech?.emergencyContact },
  ])
  const mAddress = uniq([mech?.address, mech?.city, mech?.state, mech?.pincode].map((x) => String(x || '').trim()).filter(Boolean)).join(', ')
  const seen = mech?.currentLocation?.lastUpdated

  const it = view === 'garage' ? gi : mi
  const name = view === 'garage' ? gName : mName
  const st = it ? PARTNER_STATUS[it.status] : null
  const list = view === 'garage' ? gNumbers : mNumbers
  const photo = it?.photo
  const mapLink = it?.pt ? `https://www.google.com/maps/search/?api=1&query=${it.pt.lat},${it.pt.lng}` : ''
  const kind = view === 'garage' ? (g?.field ? 'Garage · registered by our field staff' : 'Garage · shop partner') : m?.id ? 'Mechanic' : 'Mechanic of the garage'

  return (
    <Dialog.Root open onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        {/* the card sits inside the overlay, so it is centred without a transform of its own */}
        <Dialog.Overlay className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0B1730]/65 p-2 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:p-4">
        <Dialog.Content aria-describedby={undefined} data-partner-dialog={view}
          className="relative flex max-h-full w-full max-w-[580px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          {/* header */}
          <div className="relative shrink-0 px-5 pb-4 pt-5 text-white sm:px-6" style={{ background: 'linear-gradient(135deg,#0F2A5F 0%,#1E40E0 100%)' }}>
            <Dialog.Close aria-label="Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><X className="h-5 w-5" /></Dialog.Close>
            <div className="flex items-center gap-3.5 pr-10">
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`${photo}${photo.includes('ik.imagekit.io') ? '?tr=w-160,h-160,fo-auto' : ''}`} alt="" className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/40 object-cover" />
                : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/15 text-[22px] font-bold">{view === 'garage' ? <Store className="h-8 w-8" /> : initialsOf(name)}</span>}
              <div className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold uppercase tracking-wider text-white/75">{kind}</span>
                <Dialog.Title className="truncate text-[21px] font-extrabold leading-tight" data-partner-name>{name}</Dialog.Title>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] font-bold">
                  {it?.verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[#15803D]"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                  {it?.pending && <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[#B45309]">Not verified yet</span>}
                  {st && <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ color: st.fg, background: st.bg }}><i className="h-2 w-2 rounded-full" style={{ background: st.dot }} />{st.label}</span>}
                  {it && it.rating > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5"><Star className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]" />{it.rating} <span className="font-medium text-white/80">({it.ratings} {view === 'garage' ? 'reviews' : 'jobs'})</span></span>}
                  {it?.km != null && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5" data-partner-km><MapPin className="h-3.5 w-3.5" />{kmText(it.km, target.approx)} from the customer</span>}
                </div>
              </div>
            </div>
            {target.job && (
              <p className="mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white/90" style={{ background: 'rgba(255,255,255,.14)' }} data-partner-job>
                <ClipboardList className="h-4 w-4 shrink-0" />Assigned to request <b className="text-white">{target.job.id}</b>{target.job.status ? <span className="text-white/80">· {target.job.status}</span> : null}
              </p>
            )}
          </div>

          {/* garage / mechanic switch, when the job has both */}
          {both && (
            <div className="flex shrink-0 gap-1 border-b border-[#E6ECF5] bg-[#FAFBFE] p-1.5">
              {(['garage', 'mechanic'] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={view === k} data-partner-tab={k}
                  className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold ${view === k ? 'bg-[#E3EBFF] text-[#1E40E0]' : 'text-[#374151] hover:bg-[#F1F5FB]'}`}>
                  {k === 'garage' ? <Store className="h-4 w-4 shrink-0" /> : <User className="h-4 w-4 shrink-0" />}<span className="truncate">{k === 'garage' ? `Garage · ${gName}` : `Mechanic · ${mName}`}</span>
                </button>
              ))}
            </div>
          )}

          {/* body */}
          <div className="scrollbar-admin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div>
              <Title icon={<Phone className="h-3.5 w-3.5" />}>{view === 'garage' ? 'Call the garage' : 'Call the mechanic'}</Title>
              {list.length > 0 ? (
                <div className="space-y-2">{list.map((n, i) => <NumberRow key={n.phone} n={n} first={i === 0} />)}</div>
              ) : loading ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#E6ECF5] px-3 py-4 text-[13px] text-[#6B7280]"><Loader2 className="h-4 w-4 animate-spin" />Getting the numbers…</div>
              ) : (
                <p className="rounded-xl border border-dashed border-[#CBD5E1] px-3 py-4 text-center text-[13px] text-[#6B7280]" data-partner-nonumber>No phone number is saved for this {view === 'garage' ? 'garage' : 'mechanic'}.</p>
              )}
            </div>

            {/* the mechanic doing this job, on the garage's side */}
            {view === 'garage' && m && (
              <div data-partner-jobmech>
                <Title icon={<Wrench className="h-3.5 w-3.5" />}>Mechanic on this job</Title>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#E6ECF5] bg-[#FBFCFE] px-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16305C] text-[12.5px] font-bold text-white">{initialsOf(mName)}</span>
                  <button type="button" onClick={() => setTab('mechanic')} className="min-w-0 flex-1 text-left" title="Mechanic details">
                    <b className="block truncate text-[14.5px] text-[#111827] hover:underline">{mName}</b>
                    <span className="block text-[12.5px] text-[#4B5563]">{hasPhone(mPhone) ? prettyPhone(mPhone) : 'No number saved'}</span>
                  </button>
                  {hasPhone(mPhone) && (
                    <div className="flex shrink-0 gap-1.5">
                      <a href={telHref(mPhone)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#CBD5E8] bg-white px-3 text-[13px] font-bold text-[#0F1E46] hover:bg-[#F3F6FC]"><Phone className="h-4 w-4" />Call</a>
                      <a href={waHref(mPhone)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#B7E4C7] bg-white text-[#15803D] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-4 w-4" /></a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'garage' ? (
              <>
                <div>
                  <Title icon={<MapPin className="h-3.5 w-3.5" />}>Where it is</Title>
                  <div className="space-y-2 rounded-xl border border-[#E6ECF5] bg-white p-3">
                    {owner && <Row icon={<User className="h-4 w-4" />}>Owner: <b>{owner}</b></Row>}
                    <Row icon={<MapPin className="h-4 w-4" />}>{gAddress || <span className="text-[#6B7280]">{loading ? 'Getting the address…' : 'No address saved'}</span>}{gi?.km != null && <b className="ml-1.5 whitespace-nowrap text-[#1E40E0]">({kmText(gi.km, target.approx)} from the customer)</b>}</Row>
                    {gi?.hours && <Row icon={<Clock className="h-4 w-4" />}>{gi.open != null && <b className={gi.open ? 'text-[#16A34A]' : 'text-[#DC2626]'}>{gi.open ? 'Open now' : 'Closed now'}</b>}{gi.open != null && ' · '}{gi.hours}</Row>}
                    {gi?.doorstep != null && <Row icon={<Home className="h-4 w-4" />}>{gi.doorstep ? <b className="text-[#15803D]">Doorstep service — sends a mechanic to the customer</b> : 'Workshop only — the vehicle has to reach the garage'}</Row>}
                    {shop?.shopEmail && <Row icon={<Mail className="h-4 w-4" />}>{shop.shopEmail}</Row>}
                    {mapLink && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#CBD5E8] bg-white px-3 text-[13px] font-bold text-[#0F1E46] hover:bg-[#F3F6FC]"><MapPin className="h-4 w-4" style={{ color: BLUE }} />View on Google Maps</a>
                        {cust && <a href={`https://www.google.com/maps/dir/?api=1&origin=${gi!.pt!.lat},${gi!.pt!.lng}&destination=${cust.lat},${cust.lng}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#CBD5E8] bg-white px-3 text-[13px] font-bold text-[#0F1E46] hover:bg-[#F3F6FC]"><Navigation className="h-4 w-4" style={{ color: BLUE }} />Route to the customer</a>}
                      </div>
                    )}
                  </div>
                </div>
                {gMechs.length > 0 && (
                  <div data-partner-mechs>
                    <Title icon={<Wrench className="h-3.5 w-3.5" />}>Garage mechanics ({gMechs.length})</Title>
                    <div className="divide-y divide-[#EEF1F6] rounded-xl border border-[#E6ECF5] bg-white">
                      {gMechs.slice(0, 12).map((x, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-[11px] font-bold text-[#2563EB]">{initialsOf(x.name)}</span>
                          <span className="min-w-0 flex-1"><b className="block truncate text-[13.5px] text-[#111827]">{x.name}</b><span className="block truncate text-[12px] text-[#6B7280]">{x.sub}{hasPhone(x.phone) ? ` · ${prettyPhone(x.phone)}` : ''}</span></span>
                          {hasPhone(x.phone) && (
                            <span className="flex shrink-0 gap-1.5">
                              <a href={telHref(x.phone)} title={`Call ${x.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E8EF] hover:bg-[#F3F6FC]" style={{ color: BLUE }}><Phone className="h-4 w-4" /></a>
                              <a href={waHref(x.phone)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#15803D] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-4 w-4" /></a>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Title icon={<User className="h-3.5 w-3.5" />}>About the mechanic</Title>
                <div className="space-y-2 rounded-xl border border-[#E6ECF5] bg-white p-3">
                  {!m?.id && <Row icon={<Store className="h-4 w-4" />}>The garage’s own mechanic{g ? <> — works at <b>{gName}</b></> : null}. Only the name and number are on record.</Row>}
                  {m?.id && g && <Row icon={<Store className="h-4 w-4" />}>On this job for <button type="button" onClick={() => setTab('garage')} className="font-bold text-[#1E40E0] hover:underline">{gName}</button></Row>}
                  {mi?.pt && <Row icon={<MapPin className="h-4 w-4" />}>Last position{seen ? <> <b>{agoText(seen)}</b></> : null}{mi.km != null && <b className="ml-1.5 whitespace-nowrap text-[#1E40E0]">({kmText(mi.km, target.approx)} from the customer)</b>} · <a href={mapLink} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1E40E0] hover:underline">View on Google Maps</a></Row>}
                  {m?.id && mech && !mi?.pt && <Row icon={<MapPin className="h-4 w-4" />}><span className="text-[#6B7280]">This mechanic has not shared a location yet.</span></Row>}
                  {mAddress && <Row icon={<Home className="h-4 w-4" />}>{mAddress}</Row>}
                  {mech?.experience && <Row icon={<Clock className="h-4 w-4" />}>{mech.experience} experience{mech.completedServices ? ` · ${mech.completedServices} jobs done` : ''}</Row>}
                  {m?.id && !mech && <Row icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}><span className="text-[#6B7280]">{loading ? 'Getting the details…' : 'No more details on record.'}</span></Row>}
                </div>
              </div>
            )}

            {it && it.chips.length > 0 && <div><Title icon={<Wrench className="h-3.5 w-3.5" />}>Work they do</Title><Chips items={it.chips.slice(0, 14)} /></div>}
            {it && it.vehicles.length > 0 && <div><Title icon={<ClipboardList className="h-3.5 w-3.5" />}>Vehicles</Title><Chips items={it.vehicles} /></div>}
            {view === 'garage' && failed && !shop && <p className="rounded-lg bg-[#FFF8E6] px-3 py-2 text-[12.5px] text-[#92400E]">The full record of this garage could not be loaded just now — the number above is the one saved with the request.</p>}
          </div>

          {/* footer */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E6ECF5] bg-white px-5 py-3 sm:px-6">
            {view === 'garage' && g
              ? <a href={g.field ? '/admin/garages' : '/admin/shops'} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center gap-1.5 text-[13px] font-bold hover:underline" style={{ color: BLUE }}>Open in {g.field ? 'Garages' : 'Shop Partners'}<ExternalLink className="h-4 w-4" /></a>
              : <span />}
            <div className="flex flex-1 justify-end gap-2">
              {onReassign && target.job && <button type="button" onClick={onReassign} data-partner-reassign className="flex h-10 items-center gap-1.5 rounded-xl border border-[#FFB89C] bg-white px-4 text-[13.5px] font-bold text-[#EA580C] hover:bg-[#FFF4EE]"><Repeat className="h-4 w-4" />Reassign</button>}
              <Dialog.Close className="flex h-10 min-w-[96px] items-center justify-center rounded-xl bg-[#0F2A5F] px-5 text-[13.5px] font-bold text-white hover:brightness-110">Close</Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
