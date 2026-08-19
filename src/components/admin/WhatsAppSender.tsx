'use client'

// Admin — send an APPROVED WhatsApp template to a user.
// Left: compose form (sender number, template, header media upload, variables,
// recipient). Right: a live phone-frame preview that mirrors EXACTLY how the
// template will render inside WhatsApp for the customer (header media/text,
// body with variables substituted live, footer, buttons, ticks).
// No template creation here — only listing + sending.
import { useEffect, useMemo, useRef, useState } from 'react'
import { adminWhatsappAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2, Send, MessageSquare, RefreshCw, Phone, Video, MoreVertical,
  ExternalLink, Copy, CornerUpLeft, FileText, Play, ImagePlus, X, UploadCloud,
  CheckCheck, User as UserIcon, Smartphone,
} from 'lucide-react'

interface Sender { id: string; display: string; name: string }
interface TemplateButton { type: string; text: string }
interface Template {
  id: string; name: string; language: string; category?: string; bodyText?: string; varCount?: number
  headerType?: string | null; headerText?: string; footerText?: string; buttons?: TemplateButton[]
}
interface UploadedMedia { mediaId: string; kind: string; filename: string; previewUrl: string; mime: string }

// ─── WhatsApp text formatting (*bold* _italic_ ~strike~) for the preview ─────
function renderWaText(text: string, keyPrefix = ''): React.ReactNode[] {
  const out: React.ReactNode[] = []
  // Split on formatting tokens while keeping them; simple non-nested pass.
  const re = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g
  const parts = text.split(re)
  parts.forEach((p, i) => {
    const k = `${keyPrefix}${i}`
    if (/^\*[^*\n]+\*$/.test(p)) out.push(<strong key={k}>{p.slice(1, -1)}</strong>)
    else if (/^_[^_\n]+_$/.test(p)) out.push(<em key={k}>{p.slice(1, -1)}</em>)
    else if (/^~[^~\n]+~$/.test(p)) out.push(<s key={k}>{p.slice(1, -1)}</s>)
    else out.push(<span key={k}>{p}</span>)
  })
  return out
}

// Body with {{n}} placeholders substituted by the live variable inputs.
// Unfilled slots render as small amber chips so the admin can spot them.
function renderBodyPreview(bodyText: string, vars: string[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /\{\{\s*(\d+)\s*\}\}/g
  let last = 0; let m: RegExpExecArray | null; let seg = 0
  while ((m = re.exec(bodyText)) !== null) {
    if (m.index > last) nodes.push(...renderWaText(bodyText.slice(last, m.index), `t${seg++}-`))
    const idx = parseInt(m[1], 10) - 1
    const val = (vars[idx] || '').trim()
    if (val) nodes.push(<span key={`v${seg++}`} className="font-medium">{val}</span>)
    else nodes.push(
      <span key={`v${seg++}`} className="mx-0.5 inline-block rounded bg-amber-100 px-1 text-[11px] font-bold text-amber-700 align-baseline">{`{{${m[1]}}}`}</span>
    )
    last = m.index + m[0].length
  }
  if (last < bodyText.length) nodes.push(...renderWaText(bodyText.slice(last), `t${seg++}-`))
  return nodes
}

const btnIcon = (type: string) => {
  const t = String(type || '').toUpperCase()
  if (t === 'URL') return <ExternalLink className="h-3.5 w-3.5" />
  if (t === 'PHONE_NUMBER') return <Phone className="h-3.5 w-3.5" />
  if (t === 'COPY_CODE') return <Copy className="h-3.5 w-3.5" />
  return <CornerUpLeft className="h-3.5 w-3.5" />
}

const MEDIA_ACCEPT: Record<string, string> = {
  IMAGE: 'image/jpeg,image/png,image/webp',
  VIDEO: 'video/mp4,video/3gpp',
  DOCUMENT: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf',
}

export function WhatsAppSender() {
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [senderId, setSenderId] = useState('')
  const [templateKey, setTemplateKey] = useState('') // `${name}::${language}`
  const [toPhone, setToPhone] = useState('')
  const [vars, setVars] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [media, setMedia] = useState<UploadedMedia | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedTemplate = templates.find((t) => `${t.name}::${t.language}` === templateKey)
  const selectedSender = senders.find((s) => s.id === senderId)
  const varCount = selectedTemplate?.varCount || 0
  const headerType = (selectedTemplate?.headerType || '').toUpperCase()
  const needsMedia = headerType === 'IMAGE' || headerType === 'VIDEO' || headerType === 'DOCUMENT'

  // Reset variable inputs + uploaded media whenever the chosen template changes.
  useEffect(() => {
    setVars(Array(varCount).fill(''))
    setMedia((prev) => { if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl); return null })
  }, [templateKey, varCount])

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [s, t] = await Promise.all([adminWhatsappAPI.getSenders(), adminWhatsappAPI.getTemplates()])
      const sList: Sender[] = s.data?.data || []
      const tList: Template[] = t.data?.data || []
      setSenders(sList)
      setTemplates(tList)
      if (sList[0]) setSenderId(sList[0].id)
      if (tList[0]) setTemplateKey(`${tList[0].name}::${tList[0].language}`)
      if (!s.data?.success) setError(s.data?.message || 'Could not load senders')
      else if (!t.data?.success) setError(t.data?.message || 'Could not load templates')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Could not load WhatsApp data — check credentials in .env')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const pickFile = () => fileRef.current?.click()

  const onFile = async (f: File | null | undefined) => {
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
        setMedia({
          mediaId: r.data.data.mediaId,
          kind: r.data.data.kind,
          mime: r.data.data.mime,
          filename: r.data.data.filename || f.name,
          previewUrl: URL.createObjectURL(f),
        })
        toast.success('Media uploaded')
      } else toast.error(r.data?.message || 'Upload failed')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const send = async () => {
    if (!senderId) { toast.error('Select a WhatsApp sender number'); return }
    if (!templateKey) { toast.error('Select a template'); return }
    if (!toPhone.trim()) { toast.error('Enter the recipient phone number'); return }
    if (varCount > 0 && vars.slice(0, varCount).some((v) => !v.trim())) { toast.error('Fill all template values'); return }
    if (needsMedia && !media) { toast.error(`This template needs a ${headerType.toLowerCase()} — upload it first`); return }
    const [templateName, languageCode] = templateKey.split('::')
    setSending(true)
    try {
      const r = await adminWhatsappAPI.send({
        phoneNumberId: senderId, templateName, languageCode, toPhone: toPhone.trim(),
        variables: varCount > 0 ? vars.slice(0, varCount) : undefined,
        ...(needsMedia && media ? { headerMediaId: media.mediaId, headerMediaKind: headerType.toLowerCase() } : {}),
      })
      if (r.data?.success) { toast.success(r.data.message || 'Template sent'); setToPhone('') }
      else toast.error(r.data?.message || 'Failed to send')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to send') } finally { setSending(false) }
  }

  const now = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }), [])
  const businessName = selectedSender?.name || 'Bharat Mechanics'

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1D29]">WhatsApp — Send Template</h1>
          <p className="text-sm text-slate-500">Send an approved WhatsApp template. The preview shows exactly what the customer receives.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F7EF] px-3 py-1.5 text-[11.5px] font-bold text-[#008069]">
          <MessageSquare className="h-3.5 w-3.5" /> {templates.length} approved templates
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* ─── Compose form ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {error && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Dropdown 1 — WhatsApp sender number */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-slate-600">WhatsApp number</label>
                <select value={senderId} onChange={(e) => setSenderId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#008069]/60">
                  {senders.length === 0 && <option value="">No numbers found</option>}
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>{s.display}{s.name ? ` — ${s.name}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2 — approved templates */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-slate-600">Template (approved)</label>
                <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#008069]/60">
                  {templates.length === 0 && <option value="">No approved templates</option>}
                  {templates.map((t) => (
                    <option key={t.id} value={`${t.name}::${t.language}`}>{t.name} ({t.language})</option>
                  ))}
                </select>
                {selectedTemplate?.category && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {selectedTemplate.category}{needsMedia ? ` · ${headerType.toLowerCase()} header` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Header media upload — only for IMAGE/VIDEO/DOCUMENT header templates */}
            {needsMedia && (
              <div className="mt-4">
                <label className="mb-1 block text-[12px] font-bold text-slate-600">
                  Header {headerType.toLowerCase()} <span className="font-semibold text-slate-400">(required by this template)</span>
                </label>
                <input ref={fileRef} type="file" className="hidden" accept={MEDIA_ACCEPT[headerType] || undefined}
                  onChange={(e) => onFile(e.target.files?.[0])} />
                {media ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {media.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media.previewUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ) : media.kind === 'video' ? (
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-slate-800 text-white"><Play className="h-6 w-6" /></div>
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-rose-50 text-rose-500"><FileText className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-slate-700">{media.filename}</p>
                      <p className="text-[11px] font-semibold text-emerald-600">Uploaded to WhatsApp ✓</p>
                    </div>
                    <button onClick={() => { if (media.previewUrl) URL.revokeObjectURL(media.previewUrl); setMedia(null) }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 shadow-sm hover:text-rose-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={pickFile} disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm font-bold text-slate-500 transition-colors hover:border-[#008069]/40 hover:text-[#008069] disabled:opacity-60">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : headerType === 'IMAGE' ? <ImagePlus className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
                    {uploading ? 'Uploading…' : `Upload ${headerType.toLowerCase()} (max 16 MB)`}
                  </button>
                )}
              </div>
            )}

            {/* Template variables ({{1}}, {{2}} …) — shown only if the template needs them */}
            {varCount > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-[12px] font-bold text-slate-600">Template values</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Array.from({ length: varCount }).map((_, i) => (
                    <input key={i} value={vars[i] || ''}
                      onChange={(e) => setVars((p) => { const n = [...p]; n[i] = e.target.value; return n })}
                      placeholder={`Value for {{${i + 1}}}`}
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#008069]/60" />
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">Values appear live in the preview as you type.</p>
              </div>
            )}

            {/* Recipient */}
            <div className="mt-4">
              <label className="mb-1 block text-[12px] font-bold text-slate-600">Send to user (phone)</label>
              <div className="relative sm:max-w-xs">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="e.g. 9888888888"
                  className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#008069]/60" />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button onClick={send} disabled={sending || uploading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#008069] px-5 text-sm font-bold text-white transition-colors hover:bg-[#016a58] disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send template
              </button>
              <button onClick={load} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          {/* ─── Live WhatsApp preview (phone frame) ──────────────────────── */}
          <div className="mx-auto w-full max-w-[400px]">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
              <Smartphone className="h-3.5 w-3.5" /> Customer preview
            </div>
            <div className="overflow-hidden rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl">
              {/* WhatsApp chat header */}
              <div className="flex items-center gap-2.5 bg-[#008069] px-3 py-2.5 text-white">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 text-[13px] font-extrabold">
                  {businessName.trim().charAt(0).toUpperCase() || 'B'}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[14.5px] font-bold">{businessName}</p>
                  <p className="text-[11px] text-white/75">online</p>
                </div>
                <Video className="h-[18px] w-[18px] opacity-90" />
                <Phone className="ml-2 h-4 w-4 opacity-90" />
                <MoreVertical className="ml-2 h-[18px] w-[18px] opacity-90" />
              </div>

              {/* Chat wallpaper + message */}
              <div className="min-h-[430px] px-3 pb-5 pt-3"
                style={{
                  backgroundColor: '#ECE5DD',
                  backgroundImage: 'radial-gradient(rgba(0,0,0,0.035) 1.2px, transparent 1.2px)',
                  backgroundSize: '18px 18px',
                }}>
                <div className="mb-3 flex justify-center">
                  <span className="rounded-lg bg-[#FDF3D8] px-2.5 py-1 text-[10.5px] font-semibold text-slate-500 shadow-sm">TODAY</span>
                </div>

                {selectedTemplate ? (
                  <div className="relative max-w-[88%]">
                    {/* bubble tail */}
                    <span className="absolute -left-[7px] top-0 h-0 w-0 border-r-[8px] border-t-[10px] border-r-transparent border-t-white" style={{ borderTopColor: '#fff' }} />
                    <div className="overflow-hidden rounded-lg rounded-tl-none bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
                      <div className="p-1.5 pb-2">
                        {/* Header — media or bold text */}
                        {needsMedia && (
                          media ? (
                            media.kind === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={media.previewUrl} alt="" className="mb-1.5 max-h-44 w-full rounded-md object-cover" />
                            ) : media.kind === 'video' ? (
                              <div className="relative mb-1.5 grid h-40 w-full place-items-center rounded-md bg-slate-800">
                                <video src={media.previewUrl} className="absolute inset-0 h-full w-full rounded-md object-cover opacity-80" muted />
                                <span className="relative grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white"><Play className="h-5 w-5 translate-x-[1px]" /></span>
                              </div>
                            ) : (
                              <div className="mb-1.5 flex items-center gap-2.5 rounded-md bg-[#F5F6F6] p-2.5">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-rose-500"><FileText className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                  <p className="truncate text-[12.5px] font-bold text-slate-700">{media.filename}</p>
                                  <p className="text-[10.5px] uppercase text-slate-400">{(media.mime.split('/')[1] || 'file')}</p>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="mb-1.5 grid h-36 w-full place-items-center rounded-md bg-slate-100 text-slate-400">
                              <div className="text-center">
                                {headerType === 'IMAGE' ? <ImagePlus className="mx-auto h-7 w-7" /> : headerType === 'VIDEO' ? <Play className="mx-auto h-7 w-7" /> : <FileText className="mx-auto h-7 w-7" />}
                                <p className="mt-1 text-[11px] font-bold">Upload {headerType.toLowerCase()} to preview</p>
                              </div>
                            </div>
                          )
                        )}
                        {headerType === 'TEXT' && selectedTemplate.headerText && (
                          <p className="px-1 pb-0.5 text-[13.5px] font-bold text-slate-800">{selectedTemplate.headerText}</p>
                        )}

                        {/* Body */}
                        <p className="whitespace-pre-wrap px-1 text-[13.5px] leading-[1.45] text-slate-800">
                          {renderBodyPreview(selectedTemplate.bodyText || '', vars)}
                        </p>

                        {/* Footer */}
                        {selectedTemplate.footerText && (
                          <p className="px-1 pt-1 text-[11px] leading-snug text-slate-400">{selectedTemplate.footerText}</p>
                        )}

                        {/* Time + ticks */}
                        <div className="flex items-center justify-end gap-1 px-1 pt-0.5">
                          <span className="text-[10px] text-slate-400">{now}</span>
                          <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
                        </div>
                      </div>

                      {/* Buttons */}
                      {(selectedTemplate.buttons || []).length > 0 && (
                        <div className="border-t border-slate-100">
                          {(selectedTemplate.buttons || []).map((b, i) => (
                            <div key={i} className={`flex h-10 items-center justify-center gap-1.5 text-[13px] font-medium text-[#00A5F4] ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                              {btnIcon(b.type)} {b.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-16 text-center text-[12.5px] font-semibold text-slate-400">
                    Select a template to preview it here
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Exact WhatsApp rendering — header, body, footer &amp; buttons</p>
          </div>
        </div>
      )}
    </div>
  )
}
