'use client'

// Admin — send an APPROVED WhatsApp template to a user.
// Dropdown 1: sender number (from the WABA). Dropdown 2: approved templates.
// No template creation here — only listing + sending.
import { useEffect, useState } from 'react'
import { adminWhatsappAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Send, MessageSquare, RefreshCw } from 'lucide-react'

interface Sender { id: string; display: string; name: string }
interface Template { id: string; name: string; language: string; category?: string }

export function WhatsAppSender() {
  const [senders, setSenders] = useState<Sender[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [senderId, setSenderId] = useState('')
  const [templateKey, setTemplateKey] = useState('') // `${name}::${language}`
  const [toPhone, setToPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

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

  const send = async () => {
    if (!senderId) { toast.error('Select a WhatsApp sender number'); return }
    if (!templateKey) { toast.error('Select a template'); return }
    if (!toPhone.trim()) { toast.error('Enter the recipient phone number'); return }
    const [templateName, languageCode] = templateKey.split('::')
    setSending(true)
    try {
      const r = await adminWhatsappAPI.send({ phoneNumberId: senderId, templateName, languageCode, toPhone: toPhone.trim() })
      if (r.data?.success) { toast.success(r.data.message || 'Template sent'); setToPhone('') }
      else toast.error(r.data?.message || 'Failed to send')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to send') } finally { setSending(false) }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-[#1A1D29]">WhatsApp — Send Template</h1>
        <p className="text-sm text-slate-500">Send an approved WhatsApp template to a user.</p>
      </div>

      <div className="max-w-3xl rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Dropdown 1 — WhatsApp sender number */}
              <div>
                <label className="mb-1 block text-[12px] font-bold text-slate-600">WhatsApp number</label>
                <select value={senderId} onChange={(e) => setSenderId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1B3B6F]/50">
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1B3B6F]/50">
                  {templates.length === 0 && <option value="">No approved templates</option>}
                  {templates.map((t) => (
                    <option key={t.id} value={`${t.name}::${t.language}`}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-4">
              <label className="mb-1 block text-[12px] font-bold text-slate-600">Send to user (phone)</label>
              <input value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="e.g. 9888888888"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50 sm:max-w-xs" />
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button onClick={send} disabled={sending}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1B3B6F] px-4 text-sm font-bold text-white transition-colors hover:bg-[#16305c] disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send template
              </button>
              <button onClick={load} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" /> {templates.length} approved templates
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
