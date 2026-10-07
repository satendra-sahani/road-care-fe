'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, ClipboardList, Wrench, UserCog, Settings, Plus, ShieldCheck, Shield, FileText, Calculator, Eye, ImagePlus, Clock, Car, Tag, BadgePercent,
  Trash2, Send, Save, User, MapPin, CalendarDays, Package, Loader2, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceRequest } from '@/store/slices/serviceRequestSlice'
import { serviceRequestAPI, uploadAPI } from '@/services/api'
import { vehicleIconFor, vehicleName } from './serviceRequestUi'

// "Submit Diagnosis & Estimate" — the admin fills the quotation on the
// mechanic's behalf (mechanic can't use the app). Three modes, by status:
//   accepted / on_way        → first submission
//   diagnosis                → revise the quotation
//   approved / in_progress   → add / remove items (customer must re-approve)
// Pricing, membership discounts and the booking-fee adjustment stay on the server.

const REVISE = ['diagnosis', 'approved', 'in_progress']
const AFTER_APPROVAL = ['approved', 'in_progress']
const WARRANTIES = ['1 Month', '3 Months', '6 Months', '1 Year', '2 Years']
const MAX_PHOTOS = 10
const MAX_MB = 5

type Part = { name: string; cost: string; quantity: string; warranty: string }
type Form = {
  reportedIssue: string; notes: string; photos: string[]
  laborCost: string; estimatedTime: string; actualTime: string
  parts: Part[]
  travelCharge: string; otherCharges: string; discount: string
  serviceWarranty: string; partsWarranty: string; additionalNotes: string; reason: string
}

const num = (v: string) => parseFloat(v) || 0
const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN')}`
const draftKey = (id: string) => `bm_diag_draft_${id}`
const readDraft = (id: string): Form | null => { try { const s = localStorage.getItem(draftKey(id)); return s ? JSON.parse(s) : null } catch { return null } }
const dropDraft = (id: string) => { try { localStorage.removeItem(draftKey(id)) } catch {} }

const fromRequest = (r: ServiceRequest): Form => {
  const d: any = r.diagnosis || {}
  const cb: any = d.costBreakdown || {}
  const travel = Number(cb.travelCharge) || 0
  // older quotes only have the combined figure — show it under "Other Charges"
  const other = cb.otherCharges != null && (travel || cb.otherCharges) ? Number(cb.otherCharges) || 0 : Math.max(0, (Number(cb.additionalCharges) || 0) - travel)
  return {
    reportedIssue: d.reportedIssue || r.description || '',
    notes: d.notes || '',
    photos: Array.isArray(d.photos) ? d.photos : [],
    laborCost: cb.laborCost != null ? String(cb.laborCost) : '',
    estimatedTime: d.estimatedTime ? String(d.estimatedTime) : '',
    actualTime: d.actualTime ? String(d.actualTime) : '',
    parts: (cb.parts || []).map((p: any) => ({ name: p.name || '', cost: String(p.cost ?? ''), quantity: String(p.quantity ?? 1), warranty: p.warranty || '' })),
    travelCharge: travel ? String(travel) : '',
    otherCharges: other ? String(other) : '',
    discount: cb.discount ? String(cb.discount) : '',
    serviceWarranty: d.serviceWarranty || '',
    partsWarranty: d.partsWarranty || '',
    additionalNotes: d.additionalNotes || '',
    reason: '',
  }
}

const label = 'mb-1.5 block text-[13px] font-semibold text-[#1F2937]'
const field = 'w-full rounded-lg border border-[#DFE5EE] bg-white px-3 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2447D6]'
const BLUE = '#1E40E0'

function Band({ icon, children, right }: { icon: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-t-xl bg-[#EEF3FD] px-4 py-2.5">
      <h3 className="flex items-center gap-2.5 text-[15.5px] font-bold text-[#0F1E46]"><span style={{ color: BLUE }}>{icon}</span>{children}</h3>
      {right}
    </div>
  )
}
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-[#E6ECF5] bg-white ${className}`}>{children}</section>
)
/** input with a boxed leading icon and an optional trailing unit */
function IconInput({ icon, unit, ...p }: { icon: React.ReactNode; unit?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex h-10 overflow-hidden rounded-lg border border-[#DFE5EE] bg-white focus-within:border-[#2447D6]">
      <span className="flex w-10 shrink-0 items-center justify-center border-r border-[#DFE5EE] text-[#475569]">{icon}</span>
      <input {...p} className="min-w-0 flex-1 bg-transparent px-3 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF]" />
      {unit && <span className="flex shrink-0 items-center border-l border-[#DFE5EE] px-3 text-[13px] text-[#374151]">{unit}</span>}
    </div>
  )
}
const Row = ({ k, v, minus }: { k: string; v: number; minus?: boolean }) => (
  <div className="flex items-center justify-between text-[13.5px]"><span className="text-[#4B5563]">{k}</span><b className="font-bold text-[#111827]">{minus ? '- ' : ''}{inr(v)}</b></div>
)

export function DiagnosisDialog({ open, request, onClose, onDone }: {
  open: boolean
  request: ServiceRequest | null
  onClose: () => void
  /** called after a successful submit so the list can refresh */
  onDone: () => void
}) {
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const setPart = (i: number, patch: Partial<Part>) => setForm((f) => { if (!f) return f; const parts = [...f.parts]; parts[i] = { ...parts[i], ...patch }; return { ...f, parts } })

  const id = request?._id
  useEffect(() => {
    if (!open || !request) { setForm(null); return }
    const draft = readDraft(request._id)
    setForm(draft ? { ...fromRequest(request), ...draft } : fromRequest(request))
    if (draft) toast.info('Draft restored')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open || !request || !form) return null

  const isRevise = REVISE.includes(request.status)
  const afterApproval = AFTER_APPROVAL.includes(request.status)
  const labour = num(form.laborCost)
  const partsTotal = form.parts.reduce((s, p) => s + num(p.cost) * (parseInt(p.quantity) || 1), 0)
  const extra = num(form.travelCharge) + num(form.otherCharges)
  const discount = num(form.discount)
  const total = labour + partsTotal + extra - discount
  const V = vehicleIconFor(request.vehicle?.type)
  const coords = request.location?.coordinates
  const place = [request.location?.address, request.location?.city].filter(Boolean).join(', ')
  const when = (() => {
    const d = request.scheduledDate ? new Date(request.scheduledDate) : null
    if (!d || isNaN(d.getTime())) return ''
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${request.scheduledTime ? `, ${request.scheduledTime}` : ''}`
  })()

  const addFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list || [])
    if (!files.length) return
    const room = MAX_PHOTOS - form.photos.length
    const good = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_MB * 1024 * 1024).slice(0, room)
    if (good.length < files.length) toast.error(room <= 0 ? `Maximum ${MAX_PHOTOS} photos` : `Only images up to ${MAX_MB} MB are accepted (max ${MAX_PHOTOS})`)
    if (!good.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < good.length; i += 5) {
        const res = await uploadAPI.uploadImages(good.slice(i, i + 5), 'diagnosis')
        for (const u of res.data?.data?.uploaded || []) if (u?.url) urls.push(u.url)
      }
      if (urls.length) setForm((f) => (f ? { ...f, photos: [...f.photos, ...urls] } : f))
      if (urls.length < good.length) toast.error('Some photos could not be uploaded')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not upload the photos')
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const saveDraft = () => {
    try { localStorage.setItem(draftKey(request._id), JSON.stringify(form)); toast.success('Draft saved on this device') }
    catch { toast.error('Could not save the draft') }
  }

  const submit = async () => {
    if (!form.reportedIssue.trim()) { toast.error('Enter the issue reported by the customer'); return }
    if (!form.notes.trim()) { toast.error('Enter your diagnosis findings'); return }
    if (form.laborCost === '' || isNaN(parseFloat(form.laborCost))) { toast.error('Enter the labour cost'); return }
    if (!(parseInt(form.estimatedTime) > 0)) { toast.error('Enter the estimated time in minutes'); return }
    if (form.parts.some((p) => !p.name.trim() || p.cost === '' || isNaN(parseFloat(p.cost)))) { toast.error('Every part needs a name and a price'); return }
    if (total < 0) { toast.error('Discount cannot be more than the estimate'); return }
    setSaving(true)
    try {
      const payload = {
        laborCost: labour,
        parts: form.parts.map((p) => ({
          name: p.name.trim(), cost: num(p.cost), quantity: parseInt(p.quantity) || 1,
          ...(p.warranty.trim() ? { warranty: p.warranty.trim() } : {}),
        })),
        additionalCharges: extra,
        travelCharge: num(form.travelCharge),
        otherCharges: num(form.otherCharges),
        discount,
        notes: form.notes.trim(),
        reportedIssue: form.reportedIssue.trim(),
        additionalNotes: form.additionalNotes.trim(),
        photos: form.photos,
        serviceWarranty: form.serviceWarranty.trim(),
        partsWarranty: form.partsWarranty.trim(),
        estimatedTime: parseInt(form.estimatedTime),
        actualTime: form.actualTime ? parseInt(form.actualTime) : '',
        ...(afterApproval && form.reason.trim() ? { reason: form.reason.trim() } : {}),
      }
      const res = isRevise
        ? await serviceRequestAPI.updateDiagnosis(request._id, payload)
        : await serviceRequestAPI.submitDiagnosis(request._id, payload as any)
      if (res.data?.success) {
        toast.success(
          afterApproval ? 'Quotation revised — customer must approve again before work continues'
            : isRevise ? 'Quotation revised — customer notified'
            : 'Diagnosis submitted — sent to customer for approval',
        )
        dropDraft(request._id)
        onDone()
      } else {
        toast.error(res.data?.message || 'Could not submit diagnosis')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not submit diagnosis')
    } finally { setSaving(false) }
  }

  const title = afterApproval ? 'Add / Remove Items & Re-estimate' : isRevise ? 'Revise Diagnosis & Estimate' : 'Submit Diagnosis & Estimate'
  const cta = saving ? 'Submitting…' : afterApproval ? 'Send Revised Quote for Approval' : isRevise ? 'Save Revision & Notify Customer' : 'Submit & Notify Customer'
  const warrantyOptions = (cur: string) => (cur && !WARRANTIES.includes(cur) ? [cur, ...WARRANTIES] : WARRANTIES)

  const Totals = ({ partsLabel }: { partsLabel: string }) => (
    <>
      <div className="space-y-2.5 px-4 py-3.5">
        <Row k="Labour Cost" v={labour} />
        <Row k={partsLabel} v={partsTotal} />
        <Row k="Additional Charges" v={extra} />
        <Row k="Discount" v={discount} minus />
      </div>
      <div className="mx-2.5 mb-2.5 flex items-center justify-between rounded-lg bg-[#EAF0FE] px-4 py-3">
        <span className="text-[16px] font-bold" style={{ color: BLUE }}>Total Estimate</span>
        <span className="text-[21px] font-extrabold" style={{ color: BLUE }} data-diag-total>{inr(total)}</span>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-2 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose() }} role="dialog" aria-modal="true" aria-label="Submit Diagnosis & Estimate">
      <div className="flex h-full max-h-[980px] w-full max-w-[1210px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: BLUE }}><ClipboardList className="h-[22px] w-[22px]" /></span>
            <div className="min-w-0">
              <h2 className="text-[24px] font-extrabold leading-tight text-[#0F1E46]">{title}</h2>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">
                {request.mechanic?.name ? <>On behalf of <b className="text-[#374151]">{request.mechanic.name}</b> · </> : null}
                Provide complete details of the issue, work done, parts used and estimated cost for customer approval.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#16305C] hover:bg-[#F1F5F9]"><X className="h-6 w-6" /></button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-4 pb-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:overflow-hidden">
          {/* ───────── form ───────── */}
          <div className="space-y-3 lg:overflow-y-auto lg:pr-1">
            <Card>
              <Band icon={<Wrench className="h-[18px] w-[18px]" />}>1. Problem &amp; Diagnosis</Band>
              <div className="space-y-3 p-3.5">
                <div>
                  <label className={label}>Customer Reported Issue <span className="text-[#DC2626]">*</span></label>
                  <textarea rows={2} className={`${field} py-2.5`} value={form.reportedIssue} placeholder="e.g. Bike not starting, unusual noise, puncture, etc."
                    onChange={(e) => set({ reportedIssue: e.target.value })} aria-label="Customer Reported Issue" />
                </div>
                <div>
                  <label className={label}>Diagnosis (Your Findings) <span className="text-[#DC2626]">*</span></label>
                  <textarea rows={2} className={`${field} py-2.5`} value={form.notes} placeholder="What's wrong with the vehicle / what needs to be done…"
                    onChange={(e) => set({ notes: e.target.value })} aria-label="Diagnosis findings" />
                </div>
                <div>
                  <label className={label}>Photos (Optional)</label>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                  <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
                      className={`flex h-[118px] min-w-[240px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-3 text-center ${dragging ? 'border-[#1E40E0] bg-[#EEF3FD]' : 'border-[#C9D3E3] bg-[#FAFBFE] hover:bg-[#F3F6FC]'}`}>
                      {uploading ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: BLUE }} /> : <ImagePlus className="h-6 w-6" style={{ color: BLUE }} />}
                      <b className="mt-1.5 text-[13.5px] font-bold text-[#0F1E46]">{uploading ? 'Uploading…' : 'Upload photos'}</b>
                      <span className="text-[12.5px] text-[#4B5563]">Drag &amp; drop or click to upload</span>
                      <i className="text-[11.5px] text-[#6B7280]">JPG, PNG (Max {MAX_PHOTOS} files, {MAX_MB}MB each)</i>
                    </button>
                    {form.photos.map((src, i) => (
                      <div key={src + i} className="relative h-[118px] w-[130px] shrink-0 overflow-hidden rounded-xl border border-[#E6ECF5] bg-[#F1F5F9]" data-diag-photo>
                        <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" /></a>
                        <button type="button" aria-label="Remove photo" onClick={() => set({ photos: form.photos.filter((_, j) => j !== i) })}
                          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0F172A]/80 text-white hover:bg-[#0F172A]"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    {form.photos.length > 0 && form.photos.length < MAX_PHOTOS && (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex h-[118px] w-[112px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9D3E3] text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F3F6FC]">
                        <Plus className="h-6 w-6" style={{ color: BLUE }} />Add More
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <Band icon={<UserCog className="h-[18px] w-[18px]" />}>2. Labour Details</Band>
              <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-3">
                <div>
                  <label className={label}>Labour Cost (₹) <span className="text-[#DC2626]">*</span></label>
                  <IconInput icon={<ClipboardList className="h-4 w-4" />} type="number" min="0" inputMode="decimal" placeholder="e.g. 300" aria-label="Labour Cost" value={form.laborCost} onChange={(e) => set({ laborCost: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Estimated Time (Minutes) <span className="text-[#DC2626]">*</span></label>
                  <IconInput icon={<Clock className="h-4 w-4" />} unit="mins" type="number" min="0" inputMode="numeric" placeholder="e.g. 60" aria-label="Estimated Time" value={form.estimatedTime} onChange={(e) => set({ estimatedTime: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Actual Time (Minutes)</label>
                  <IconInput icon={<Clock className="h-4 w-4" />} unit="mins" type="number" min="0" inputMode="numeric" placeholder="e.g. 75" aria-label="Actual Time" value={form.actualTime} onChange={(e) => set({ actualTime: e.target.value })} />
                </div>
              </div>
            </Card>

            <Card>
              <Band icon={<Settings className="h-[18px] w-[18px]" />} right={
                <button type="button" onClick={() => set({ parts: [...form.parts, { name: '', cost: '', quantity: '1', warranty: '' }] })}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[#CBD5E8] bg-white px-3 text-[13px] font-bold text-[#0F1E46] hover:bg-[#F8FAFD]"><Plus className="h-4 w-4" style={{ color: BLUE }} />Add Part</button>
              }>3. Parts Used</Band>
              {form.parts.length === 0 ? (
                <p className="px-4 py-4 text-[13px] text-[#6B7280]">No parts — labour only. Use “Add Part” if any part is replaced.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead>
                      <tr className="whitespace-nowrap text-[11.5px] font-bold uppercase tracking-wide text-[#475569]">
                        <th className="px-3.5 py-2.5">Part / Item</th><th className="px-2 py-2.5">Qty</th><th className="px-2 py-2.5">Unit Price (₹)</th>
                        <th className="px-2 py-2.5">Total (₹)</th><th className="px-2 py-2.5">Warranty</th><th className="px-3.5 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.parts.map((p, i) => (
                        <tr key={i} className="border-t border-[#EEF2F7]" data-diag-part>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><Package className="h-5 w-5" /></span>
                              <input className={`${field} h-10 min-w-[180px] font-semibold`} placeholder="Part name, e.g. Battery 12V 5Ah" aria-label="Part name" value={p.name} onChange={(e) => setPart(i, { name: e.target.value })} />
                            </div>
                          </td>
                          <td className="px-2 py-2.5"><input className={`${field} h-10 w-[58px]`} type="number" min="1" aria-label="Quantity" value={p.quantity} onChange={(e) => setPart(i, { quantity: e.target.value })} /></td>
                          <td className="px-2 py-2.5"><input className={`${field} h-10 w-[88px]`} type="number" min="0" placeholder="0" aria-label="Unit price" value={p.cost} onChange={(e) => setPart(i, { cost: e.target.value })} /></td>
                          <td className="px-2 py-2.5 text-[14px] font-bold text-[#111827]">{(num(p.cost) * (parseInt(p.quantity) || 1)).toLocaleString('en-IN')}</td>
                          <td className="px-2 py-2.5">
                            <div className="relative w-[128px]">
                              <select className={`${field} h-10 appearance-none pr-8`} aria-label="Warranty" value={p.warranty} onChange={(e) => setPart(i, { warranty: e.target.value })}>
                                <option value="">No warranty</option>
                                {warrantyOptions(p.warranty).map((w) => <option key={w} value={w}>{w}</option>)}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-[#475569]" />
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button type="button" aria-label="Remove part" onClick={() => set({ parts: form.parts.filter((_, j) => j !== i) })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#EF4423] hover:bg-[#FEF2F2]"><Trash2 className="h-[18px] w-[18px]" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <Band icon={<Plus className="h-[18px] w-[18px]" strokeWidth={3} />}>4. Additional Charges <span className="text-[12.5px] font-medium text-[#4B5563]">(Optional)</span></Band>
              <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-3">
                <div><label className={label}>Travel Charge (₹)</label><IconInput icon={<Car className="h-4 w-4" />} type="number" min="0" placeholder="e.g. 50" aria-label="Travel Charge" value={form.travelCharge} onChange={(e) => set({ travelCharge: e.target.value })} /></div>
                <div><label className={label}>Other Charges (₹)</label><IconInput icon={<Tag className="h-4 w-4" />} type="number" min="0" placeholder="e.g. 100" aria-label="Other Charges" value={form.otherCharges} onChange={(e) => set({ otherCharges: e.target.value })} /></div>
                <div><label className={label}>Discount (₹)</label><IconInput icon={<BadgePercent className="h-4 w-4" />} type="number" min="0" placeholder="e.g. 50" aria-label="Discount" value={form.discount} onChange={(e) => set({ discount: e.target.value })} /></div>
              </div>
            </Card>

            <Card>
              <Band icon={<ShieldCheck className="h-[18px] w-[18px]" />}>5. Service Guarantee</Band>
              <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2">
                <div><label className={label}>Labour Guarantee</label><IconInput icon={<Wrench className="h-4 w-4" />} placeholder="e.g. 15 days on labour" aria-label="Labour Guarantee" value={form.serviceWarranty} onChange={(e) => set({ serviceWarranty: e.target.value })} /></div>
                <div><label className={label}>Parts Warranty</label><IconInput icon={<Shield className="h-4 w-4" />} placeholder="e.g. 6 months on battery, 3 months on spark plug" aria-label="Parts Warranty" value={form.partsWarranty} onChange={(e) => set({ partsWarranty: e.target.value })} /></div>
              </div>
            </Card>

            <Card>
              <Band icon={<FileText className="h-[18px] w-[18px]" />}>6. Additional Notes <span className="text-[12.5px] font-medium text-[#4B5563]">(Optional)</span></Band>
              <div className="space-y-3 p-3.5">
                <textarea rows={2} className={`${field} py-2.5`} value={form.additionalNotes} aria-label="Additional Notes"
                  placeholder="Any important notes for the customer (e.g. further checks recommended, next service date, etc.)" onChange={(e) => set({ additionalNotes: e.target.value })} />
                {afterApproval && (
                  <div>
                    <label className={label}>Reason for change</label>
                    <input className={`${field} h-10`} value={form.reason} placeholder="e.g. brake pads also worn" aria-label="Reason for change" onChange={(e) => set({ reason: e.target.value })} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ───────── previews ───────── */}
          <div className="flex min-h-0 flex-col gap-3">
            <div className="min-h-0 flex-1 space-y-3 lg:overflow-y-auto lg:pr-1">
              <Card className="bg-[#F6F9FE]">
                <Band icon={<Calculator className="h-[18px] w-[18px]" />}>Estimate Summary</Band>
                <div className="m-2.5 rounded-lg bg-white"><Totals partsLabel={`Parts Cost (${form.parts.length} ${form.parts.length === 1 ? 'item' : 'items'})`} /></div>
              </Card>

              <Card>
                <Band icon={<Eye className="h-[18px] w-[18px]" />}>Service Preview</Band>
                <div className="space-y-3 p-4 text-[13px]">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#16305C]"><V size={32} /></span>
                    <div className="min-w-0"><b className="block truncate text-[14.5px] font-bold text-[#111827]">{vehicleName(request.vehicle)}</b><span className="text-[#6B7280]">{request.vehicle?.registrationNumber || (request.requestId ?? '')}</span></div>
                  </div>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2.5">
                    <span className="flex items-center gap-2 text-[#4B5563]"><User className="h-4 w-4 text-[#475569]" />Customer</span>
                    <span><b className="block font-semibold text-[#111827]">{request.customer?.name || '—'}</b><span className="text-[#6B7280]">{request.customer?.phone || ''}</span></span>
                    <span className="flex items-center gap-2 text-[#4B5563]"><Wrench className="h-4 w-4 text-[#475569]" />Service Type</span>
                    <span className="font-semibold capitalize text-[#111827]">{String(request.serviceType || '—').replace(/[_-]/g, ' ')}</span>
                    <span className="flex items-center gap-2 text-[#4B5563]"><MapPin className="h-4 w-4 text-[#475569]" />Location</span>
                    <span><span className="block font-semibold text-[#111827]">{place || '—'}</span>
                      {(coords?.latitude != null || place) && (
                        <a className="text-[12.5px] font-medium underline" style={{ color: BLUE }} target="_blank" rel="noopener noreferrer"
                          href={`https://www.google.com/maps/search/?api=1&query=${coords?.latitude != null ? `${coords.latitude},${coords.longitude}` : encodeURIComponent(place)}`}>View on Map</a>
                      )}
                    </span>
                    {when && <><span className="flex items-center gap-2 text-[#4B5563]"><CalendarDays className="h-4 w-4 text-[#475569]" />Scheduled</span><span className="text-[#374151]">{when}</span></>}
                  </div>
                </div>
              </Card>

              <Card>
                <Band icon={<Settings className="h-[18px] w-[18px]" />}>Parts Preview</Band>
                <div className="p-3">
                  {form.parts.filter((p) => p.name.trim()).length === 0 && <p className="px-1 py-2 text-[13px] text-[#6B7280]">No parts added.</p>}
                  {form.parts.filter((p) => p.name.trim()).map((p, i) => {
                    const q = parseInt(p.quantity) || 1
                    return (
                      <div key={i} className="flex items-center gap-3 border-b border-[#EEF2F7] py-2.5 last:border-0" data-diag-preview-part>
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]"><Package className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1 text-[12.5px]"><b className="block truncate text-[13.5px] font-bold text-[#111827]">{p.name}</b><span className="text-[#6B7280]">Qty: {q} &nbsp;|&nbsp; {inr(num(p.cost))} each</span></div>
                        <div className="shrink-0 text-right">
                          {p.warranty && <span className="mb-1 inline-block rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[12px] font-semibold text-[#15803D]">{p.warranty}</span>}
                          <b className="block text-[14px] font-bold text-[#111827]">{inr(num(p.cost) * q)}</b>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card>
                <Band icon={<Calculator className="h-[18px] w-[18px]" />}>Total Preview</Band>
                <Totals partsLabel="Parts Cost" />
                <p className="px-4 pb-3 text-[11px] leading-snug text-[#8A94A6]">Membership discounts, free-service waiver, emergency charge and any booking fee already paid are applied automatically by the server.</p>
              </Card>
            </div>

            <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
              <button type="button" onClick={saveDraft} disabled={saving} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#CBD5E8] bg-[#F6F9FE] px-3.5 text-[13px] font-bold text-[#0F1E46] hover:bg-[#EEF3FD]"><Save className="h-4 w-4" style={{ color: BLUE }} />Save as Draft</button>
              <button type="button" onClick={submit} disabled={saving || uploading} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#F4451A] px-3 text-[13px] font-bold text-white shadow-[0_6px_14px_rgba(244,69,26,.3)] hover:bg-[#E03C12] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
