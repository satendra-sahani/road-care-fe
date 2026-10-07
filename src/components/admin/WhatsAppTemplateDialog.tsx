'use client'

// WhatsApp chat → "Send a template": pick an approved template, fill in its
// values (and header photo / video / document when it needs one), see it exactly
// as the customer will, and send it to the person whose chat is open.
// A template is the only thing WhatsApp lets a business send once the 24-hour
// reply window has closed. Sending uses the same API as the Send Template page.
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCheck, FileText, ImagePlus, Loader2, MessageSquareText, Play, RefreshCw, Search, Send, UploadCloud, X } from 'lucide-react'
import { adminWhatsappAPI } from '@/services/api'
import { MEDIA_ACCEPT, btnIcon, renderBodyPreview, renderWaText } from './WhatsAppSender'

interface Sender { id: string; display: string; name: string }
interface Template {
  id: string; name: string; language: string; category?: string; bodyText?: string; varCount?: number
  headerType?: string | null; headerText?: string; footerText?: string; buttons?: { type: string; text: string }[]
}
interface Media { mediaId: string; kind: string; filename: string; previewUrl: string; mime: string }

const keyOf = (t: Template) => `${t.name}::${t.language}`
const pretty = (name: string) => name.replace(/_/g, ' ')
const CATEGORY: Record<string, string> = { MARKETING: 'bg-violet-100 text-violet-700', UTILITY: 'bg-sky-100 text-sky-700', AUTHENTICATION: 'bg-amber-100 text-amber-700' }
const prettyPhone = (p: string) => (p?.length > 10 ? `+${p.slice(0, p.length - 10)} ${p.slice(-10)}` : p)

export function WhatsAppTemplateDialog({ open, toPhone, toName, phoneNumberId, onClose, onSent }: {
  open: boolean
  toPhone: string
  toName?: string
  /** the business number this chat is on — preselected as the sender */
  phoneNumberId?: string
  onClose: () => void
  onSent: () => void
}) {
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [senderId, setSenderId] = useState('')
  const [tplKey, setTplKey] = useState('')
  const [q, setQ] = useState('')
  const [vars, setVars] = useState<string[]>([])
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const tpl = templates.find((t) => keyOf(t) === tplKey)
  const varCount = tpl?.varCount || 0
  const headerType = String(tpl?.headerType || '').toUpperCase()
  const needsMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)
  const firstName = String(toName || '').trim().split(/\s+/)[0] || ''

  const load = async () => {
    setLoading(true); setFailed('')
    try {
      const [s, t] = await Promise.all([adminWhatsappAPI.getSenders(), adminWhatsappAPI.getTemplates()])
      const sList: Sender[] = s.data?.data || []
      const tList: Template[] = t.data?.data || []
      setSenders(sList); setTemplates(tList)
      setSenderId((cur) => cur || (sList.find((x) => x.id === phoneNumberId) || sList[0])?.id || phoneNumberId || '')
      setTplKey((cur) => (cur && tList.some((x) => keyOf(x) === cur) ? cur : tList[0] ? keyOf(tList[0]) : ''))
      if (!tList.length) setFailed(t.data?.message || 'There are no approved templates yet. Create one in WhatsApp Manager.')
    } catch (e: any) {
      setFailed(e?.response?.data?.message || 'Could not load the templates. Check the WhatsApp keys in Key Management.')
    } finally { setLoading(false) }
  }
  // fresh every time it opens for a chat
  useEffect(() => {
    if (!open) return
    setQ(''); setSenderId(''); setSending(false)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, toPhone])
  // a different template → empty values (the first one is usually the name) and no media
  useEffect(() => {
    setVars(Array.from({ length: varCount }, (_, i) => (i === 0 ? firstName : '')))
    setMedia((prev) => { if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl); return null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplKey, varCount])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sending, onClose])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? templates.filter((t) => `${t.name} ${pretty(t.name)} ${t.bodyText || ''} ${t.category || ''}`.toLowerCase().includes(s)) : templates
  }, [templates, q])
  const now = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }), [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const onFile = async (f?: File | null) => {
    if (!f) return
    if (f.size > 16 * 1024 * 1024) { toast.error('File too large — WhatsApp allows up to 16 MB'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', f)
      if (senderId) form.append('phoneNumberId', senderId)
      const r = await adminWhatsappAPI.uploadMedia(form)
      if (r.data?.success && r.data.data?.mediaId) {
        if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl)
        setMedia({ mediaId: r.data.data.mediaId, kind: r.data.data.kind, mime: r.data.data.mime, filename: r.data.data.filename || f.name, previewUrl: URL.createObjectURL(f) })
      } else toast.error(r.data?.message || 'Upload failed')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed')
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const missing = !tpl ? 'Choose a template'
    : !senderId ? 'Choose the WhatsApp number to send from'
    : varCount > 0 && vars.slice(0, varCount).some((v) => !v.trim()) ? 'Fill in every value of the template'
    : needsMedia && !media ? `This template needs ${headerType === 'IMAGE' ? 'a photo' : headerType === 'VIDEO' ? 'a video' : 'a document'} — upload it`
    : ''

  const send = async () => {
    if (missing || !tpl) { toast.error(missing); return }
    setSending(true)
    try {
      const r = await adminWhatsappAPI.send({
        phoneNumberId: senderId, templateName: tpl.name, languageCode: tpl.language, toPhone,
        variables: varCount > 0 ? vars.slice(0, varCount).map((v) => v.trim()) : undefined,
        ...(needsMedia && media ? { headerMediaId: media.mediaId, headerMediaKind: headerType.toLowerCase() } : {}),
      })
      if (r.data?.success) { toast.success(`Template sent to ${toName || prettyPhone(toPhone)}`); onSent() }
      else toast.error(r.data?.message || 'The template could not be sent')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'The template could not be sent')
    } finally { setSending(false) }
  }

  const field = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-800 outline-none focus:border-[#12A34B]'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Send a WhatsApp template"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onClose() }}>
      <div className="flex h-full max-h-[760px] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F7EF] text-[#008069]"><MessageSquareText className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="text-[18px] font-extrabold leading-tight text-[#1A1D29]">Send a template</h2>
              <p className="truncate text-[12.5px] text-slate-500">To <b className="text-slate-700">{toName || prettyPhone(toPhone)}</b>{toName ? ` · ${prettyPhone(toPhone)}` : ''} — the only message WhatsApp allows after the 24-hour window.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
        ) : failed && !templates.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="max-w-md text-sm text-amber-700">{failed}</p>
            <button type="button" onClick={load} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" />Try again</button>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,330px)] md:overflow-hidden">
            {/* 1 — templates */}
            <div className="flex min-h-0 flex-col border-b border-slate-100 md:border-b-0 md:border-r">
              <div className="p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${templates.length} templates`} aria-label="Search templates" className={`${field} pl-9`} />
                </div>
              </div>
              <div className="scrollbar-admin max-h-[220px] min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3 md:max-h-none">
                {shown.length === 0 && <p className="px-1 py-4 text-center text-[12.5px] text-slate-500">No template matches “{q}”.</p>}
                {shown.map((t) => {
                  const on = keyOf(t) === tplKey
                  return (
                    <button key={keyOf(t)} type="button" data-tpl-option onClick={() => setTplKey(keyOf(t))}
                      className={`block w-full rounded-xl border px-3 py-2 text-left transition-colors ${on ? 'border-[#12A34B] bg-[#F0FBF4]' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-[13px] font-bold capitalize text-slate-800">{pretty(t.name)}</b>
                        <span className="shrink-0 text-[10.5px] font-semibold uppercase text-slate-400">{t.language}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-slate-500">{t.bodyText || '—'}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        {t.category && <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${CATEGORY[t.category] || 'bg-slate-100 text-slate-600'}`}>{t.category}</span>}
                        {(t.varCount || 0) > 0 && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">{t.varCount} value{t.varCount === 1 ? '' : 's'}</span>}
                        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(String(t.headerType || '').toUpperCase()) && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">{String(t.headerType).toLowerCase()}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2 — what to fill in */}
            <div className="scrollbar-admin min-h-0 space-y-4 overflow-y-auto border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              {senders.length > 1 && (
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-slate-600">Send from</label>
                  <select value={senderId} onChange={(e) => setSenderId(e.target.value)} aria-label="Send from" className={field}>
                    {senders.map((s) => <option key={s.id} value={s.id}>{s.display}{s.name ? ` — ${s.name}` : ''}</option>)}
                  </select>
                </div>
              )}

              {needsMedia && (
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-slate-600">Header {headerType.toLowerCase()} <span className="text-red-500">*</span></label>
                  <input ref={fileRef} type="file" hidden accept={MEDIA_ACCEPT[headerType]} onChange={(e) => onFile(e.target.files?.[0])} />
                  {media ? (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                      {media.kind === 'image' ? <img src={media.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileText className="h-5 w-5" /></span>}
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">{media.filename}</span>
                      <button type="button" onClick={() => fileRef.current?.click()} className="text-[12px] font-bold text-[#008069]">Change</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-[12.5px] text-slate-600 hover:bg-slate-100">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5 text-[#008069]" />}
                      <b>{uploading ? 'Uploading…' : `Upload the ${headerType.toLowerCase()}`}</b><span className="text-[11px] text-slate-400">up to 16 MB</span>
                    </button>
                  )}
                </div>
              )}

              {varCount > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-[12px] font-bold text-slate-600">Values of this template <span className="text-red-500">*</span></p>
                  {Array.from({ length: varCount }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[11.5px] font-bold text-amber-700">{`{{${i + 1}}}`}</span>
                      <input value={vars[i] || ''} aria-label={`Value ${i + 1}`} placeholder={i === 0 ? 'e.g. customer name' : `Value ${i + 1}`} className={field}
                        onChange={(e) => setVars((v) => { const n = [...v]; n[i] = e.target.value; return n })} />
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400">Each value replaces its {'{{number}}'} in the message — the preview shows the result.</p>
                </div>
              ) : tpl ? (
                <p className="rounded-xl bg-slate-50 px-3 py-3 text-[12.5px] text-slate-600">This template has nothing to fill in — it is sent exactly as shown in the preview.</p>
              ) : null}
            </div>

            {/* 3 — preview */}
            <div className="flex min-h-0 flex-col bg-[#EFEAE2] p-4" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
              <p className="mb-2 text-center text-[10.5px] font-bold uppercase tracking-wider text-slate-500">What {firstName || 'the customer'} will receive</p>
              <div className="scrollbar-admin min-h-0 flex-1 overflow-y-auto">
                {tpl && (
                  <div data-tpl-preview className="ml-auto max-w-[290px] overflow-hidden rounded-lg rounded-tr-none bg-[#D9FDD3] shadow-sm">
                    {needsMedia && (
                      <div className="flex h-[140px] items-center justify-center bg-black/10 text-slate-500">
                        {media?.kind === 'image' ? <img src={media.previewUrl} alt="" className="h-full w-full object-cover" />
                          : media ? <span className="flex flex-col items-center gap-1 text-[12px]">{headerType === 'VIDEO' ? <Play className="h-7 w-7" /> : <FileText className="h-7 w-7" />}{media.filename}</span>
                          : <span className="flex flex-col items-center gap-1 text-[11.5px]"><ImagePlus className="h-6 w-6" />{headerType.toLowerCase()} goes here</span>}
                      </div>
                    )}
                    <div className="px-2.5 pb-1.5 pt-2 text-[13.5px] leading-normal text-slate-800">
                      {headerType === 'TEXT' && tpl.headerText && <p className="mb-1 font-bold">{renderWaText(tpl.headerText, 'h')}</p>}
                      <p className="whitespace-pre-wrap break-words">{renderBodyPreview(tpl.bodyText || '', vars)}</p>
                      {tpl.footerText && <p className="mt-1 text-[11.5px] text-slate-500">{tpl.footerText}</p>}
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] text-emerald-800/60">{now}<CheckCheck className="h-3.5 w-3.5" /></p>
                    </div>
                    {(tpl.buttons || []).map((b, i) => (
                      <div key={i} className="flex items-center justify-center gap-1.5 border-t border-black/10 py-2 text-[13px] font-medium text-[#027EB5]">{btnIcon(b.type)}{b.text}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
          <p className="min-w-0 flex-1 text-[12px] text-slate-500">{!loading && templates.length > 0 && (missing ? <span className="font-semibold text-amber-700">{missing}</span> : 'Ready to send. WhatsApp bills a template by its category.')}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={sending} className="h-10 rounded-xl border border-slate-200 px-4 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" data-tpl-send onClick={send} disabled={sending || loading || !!missing}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#12A34B] px-5 text-[13.5px] font-bold text-white hover:bg-[#0f8f41] disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? 'Sending…' : 'Send template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
