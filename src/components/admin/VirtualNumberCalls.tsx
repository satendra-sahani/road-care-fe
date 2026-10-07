'use client'

// Call Logs → "Virtual number calls": the ordinary phone calls that went through
// the company's virtual number (customer ↔ garage / mechanic, numbers hidden from
// each other), newest first, with the recording of each answered call.
// Recordings are private files — the server hands out a link that plays for a few
// minutes (GET /admin/masked-calls/:id/recording).

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Pause, PhoneForwarded, Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { adminMaskedCallAPI } from '@/services/api'

type Row = {
  _id: string; direction: 'inbound' | 'connect'; from?: string; fromRole?: string; fromName?: string; to?: string; toRole?: string; toName?: string
  status: string; duration?: number; hangupCause?: string; createdAt: string
  serviceRequest?: { _id: string; requestId?: string } | null
  recording?: { status?: string; duration?: number }
}

const ROLE: Record<string, string> = { customer: 'Customer', mechanic: 'Mechanic', shop: 'Garage', team: 'Our team', unknown: 'Unknown caller' }
const STATUS: Record<string, { label: string; cls: string }> = {
  connected: { label: 'Talked', cls: 'bg-emerald-100 text-emerald-800' },
  unanswered: { label: 'Not answered', cls: 'bg-amber-100 text-amber-800' },
  no_match: { label: 'Not connected', cls: 'bg-slate-100 text-slate-700' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
  dialing: { label: 'Ringing', cls: 'bg-blue-100 text-blue-800' },
  menu: { label: 'Choosing', cls: 'bg-blue-100 text-blue-800' },
  started: { label: 'Started', cls: 'bg-blue-100 text-blue-800' },
}
const WHY: Record<string, string> = { NOT_ASSIGNED_YET: 'no mechanic assigned yet', NO_ACTIVE_REQUEST: 'no active request for this number' }
const talk = (s?: number) => { const n = Math.max(0, Math.round(s || 0)); return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${n % 60}s` }
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
const PAGE = 10

function Side({ name, role, phone }: { name?: string; role?: string; phone?: string }) {
  if (!phone && !role) return <span className="text-[#9CA3AF]">—</span>
  return (
    <span className="block min-w-0">
      <b className="block truncate font-semibold text-[#1A1D29]">{name || ROLE[role || 'unknown'] || role}</b>
      <span className="text-[11.5px] text-[#6B7280]">{name ? `${ROLE[role || 'unknown'] || role} · ` : ''}{phone ? `+91 ${phone}` : ''}</span>
    </span>
  )
}

export function VirtualNumberCalls() {
  const [rows, setRows] = useState<Row[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [recorded, setRecorded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [recLoading, setRecLoading] = useState('')
  const [recPlaying, setRecPlaying] = useState('')
  const audio = useRef<HTMLAudioElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminMaskedCallAPI.list({ page, limit: PAGE, ...(recorded ? { recorded: true } : {}) })
      setRows(res.data?.data || [])
      setPages(res.data?.pagination?.pages || 1)
      setTotal(res.data?.pagination?.total ?? (res.data?.data || []).length)
      setFailed('')
    } catch (e: any) {
      setFailed(e?.response?.data?.message || 'Could not load the virtual number calls.')
    } finally { setLoading(false) }
  }, [page, recorded])
  useEffect(() => { load() }, [load])
  useEffect(() => () => { audio.current?.pause() }, [])

  const play = async (id: string) => {
    audio.current?.pause()
    if (recPlaying === id) { setRecPlaying(''); return }
    setRecPlaying('')
    setRecLoading(id)
    try {
      const res = await adminMaskedCallAPI.recording(id)
      const src = res.data?.data?.url
      if (!res.data?.success || !src) { toast.error(res.data?.message || 'This recording cannot be played.'); return }
      const a = new Audio(src)
      a.onended = () => setRecPlaying('')
      a.onerror = () => { setRecPlaying(''); toast.error('The browser could not play this recording.') }
      audio.current = a
      await a.play()
      setRecPlaying(id)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not get the recording. Please try again.')
    } finally { setRecLoading('') }
  }

  return (
    <section data-virtual-calls className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF0F3] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><PhoneForwarded className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-[#1A1D29]">Virtual number calls</h2>
            <p className="text-xs text-[#6B7280]">Phone calls between customers and garages / mechanics through the company number{total ? ` · ${total} ${recorded ? 'recorded' : 'in all'}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151]">
            <input type="checkbox" className="h-3.5 w-3.5 accent-emerald-600" checked={recorded} onChange={(e) => { setPage(1); setRecorded(e.target.checked) }} />
            Only with recording
          </label>
          <button type="button" onClick={load} disabled={loading} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {failed ? (
        <p className="px-4 py-6 text-sm text-red-700">{failed}</p>
      ) : loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[#6B7280]"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#6B7280]">{recorded ? 'No recorded calls yet. A call is recorded once the other side picks up.' : 'No calls through the virtual number yet.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="whitespace-nowrap bg-[#F9FAFB] text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                <th className="px-4 py-2.5">When</th><th className="px-3 py-2.5">From</th><th className="px-3 py-2.5">To</th><th className="px-3 py-2.5">Request</th>
                <th className="px-3 py-2.5">Result</th><th className="px-4 py-2.5 text-right">Recording</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = STATUS[c.status] || { label: c.status, cls: 'bg-slate-100 text-slate-700' }
                return (
                  <tr key={c._id} data-virtual-call className="border-t border-[#F1F3F5] align-middle">
                    <td className="whitespace-nowrap px-4 py-2.5 text-[#4B5563]">{when(c.createdAt)}{c.direction === 'connect' && <span className="block text-[11px] text-[#9CA3AF]">started by admin</span>}</td>
                    <td className="max-w-[210px] px-3 py-2.5"><Side name={c.fromName} role={c.fromRole} phone={c.from} /></td>
                    <td className="max-w-[210px] px-3 py-2.5"><Side name={c.toName} role={c.toRole} phone={c.to} /></td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#1B3B6F]">{c.serviceRequest?.requestId || <span className="text-[#9CA3AF]">—</span>}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${s.cls}`}>{s.label}{c.status === 'connected' && c.duration ? ` · ${talk(c.duration)}` : ''}</span>
                      {c.status !== 'connected' && c.hangupCause && <span className="mt-0.5 block text-[11px] text-[#9CA3AF]">{WHY[c.hangupCause] || (/^DECLINED/.test(c.hangupCause) ? 'the other side cut the call' : '')}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {c.recording?.status ? (
                        <button type="button" data-call-recording onClick={() => play(c._id)} disabled={recLoading === c._id}
                          title={c.recording.status === 'failed' ? 'Not on our storage yet — press to try again' : 'Play the recording of this call'}
                          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                          {recLoading === c._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : recPlaying === c._id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          {recPlaying === c._id ? 'Stop' : 'Play'}{c.recording.duration ? ` · ${talk(c.recording.duration)}` : ''}
                        </button>
                      ) : <span className="text-[11.5px] text-[#9CA3AF]">{c.status === 'connected' ? 'no recording' : '—'}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-[#EEF0F3] px-4 py-2.5 text-xs text-[#6B7280]">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-1.5">
            <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" aria-label="Next page" disabled={page >= pages || loading} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </section>
  )
}
