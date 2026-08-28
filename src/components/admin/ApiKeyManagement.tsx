'use client'

// Admin — API Key Management. Every integration key (Razorpay, Hanu OTP,
// WhatsApp, Agora, ImageKit, Google Maps, AI) in one place. Saving a key
// applies it to the running backend instantly — no redeploy. Keys that are
// baked into the mobile binaries (Android/iOS Maps SDK) are labelled
// "App rebuild required": the value is stored centrally, but only takes
// effect in the next app build.
import { useEffect, useMemo, useState } from 'react'
import { adminApiKeysAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  KeyRound, Loader2, RefreshCw, Save, X, Pencil, Undo2, Zap, Smartphone, ShieldAlert,
} from 'lucide-react'

interface KeyRow {
  name: string; label: string; group: string; desc: string
  secret: boolean; applies: 'instant' | 'app-rebuild'
  source: 'custom' | 'default'; hasValue: boolean; preview: string
  updatedAt?: string | null
}

export function ApiKeyManagement() {
  const [rows, setRows] = useState<KeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminApiKeysAPI.list()
      if (r.data?.success) setRows(r.data.data || [])
      else toast.error(r.data?.message || 'Could not load keys')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not load keys')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const groups = useMemo(() => {
    const m = new Map<string, KeyRow[]>()
    rows.forEach((r) => { if (!m.has(r.group)) m.set(r.group, []); m.get(r.group)!.push(r) })
    return Array.from(m.entries())
  }, [rows])

  const startEdit = (r: KeyRow) => { setEditing(r.name); setValue('') }

  const save = async (name: string, v: string) => {
    setSaving(true)
    try {
      const r = await adminApiKeysAPI.set(name, v)
      if (r.data?.success) { toast.success(r.data.message || 'Saved'); setEditing(null); load() }
      else toast.error(r.data?.message || 'Failed')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-[#1A1D29]"><KeyRound className="h-5 w-5 text-[#1B3B6F]" /> API Key Management</h1>
          <p className="text-sm text-slate-500">Manage every integration key from one place. Changes marked <b>Instant</b> apply to the live backend immediately.</p>
        </div>
        <button onClick={load} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Wrong keys can break payments, OTP or media instantly — double-check before saving. <b>Reset to default</b> restores the server&apos;s .env value.</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 shadow-sm"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
      ) : (
        <div className="space-y-6">
          {groups.map(([group, items]) => (
            <div key={group} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-[#F6F8FB] px-4 py-2.5 text-[13px] font-extrabold text-[#1B3B6F]">{group}</div>
              <div className="divide-y divide-gray-50">
                {items.map((r) => (
                  <div key={r.name} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1A1D29]">{r.label}</span>
                          {r.applies === 'instant'
                            ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700"><Zap className="h-3 w-3" /> INSTANT</span>
                            : <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-600"><Smartphone className="h-3 w-3" /> APP REBUILD REQUIRED</span>}
                          {r.source === 'custom' && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-600">CUSTOM</span>}
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">{r.desc}</p>
                        <p className="mt-1 font-mono text-[12px] text-slate-600">
                          <span className="font-sans font-bold text-slate-400">{r.name}: </span>
                          {r.hasValue ? (r.preview || '••••••••') : <span className="italic text-slate-400">not set</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {r.source === 'custom' && (
                          <button onClick={() => save(r.name, '')} disabled={saving}
                            title="Reset to server .env default"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <Undo2 className="h-3.5 w-3.5" /> Reset
                          </button>
                        )}
                        <button onClick={() => startEdit(r)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#1B3B6F] px-3 text-[12px] font-bold text-white hover:bg-[#16305c]">
                          <Pencil className="h-3.5 w-3.5" /> {r.hasValue ? 'Change' : 'Set'}
                        </button>
                      </div>
                    </div>

                    {editing === r.name && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
                        <input
                          autoFocus
                          type={r.secret ? 'password' : 'text'}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={`New value for ${r.name}`}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 font-mono text-[13px] outline-none focus:border-[#1B3B6F]/60"
                        />
                        <button onClick={() => save(r.name, value)} disabled={saving || !value.trim()}
                          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save &amp; Apply
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
