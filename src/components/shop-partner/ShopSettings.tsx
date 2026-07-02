'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Check, Lock } from 'lucide-react'

const DIST = '#D97706'
const NOTIFS = ['New job alerts', 'Settlement updates', 'Customer reviews', 'Low-rating warnings']

export function ShopSettings() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notif, setNotif] = useState<boolean[]>([true, true, true, false])

  useEffect(() => {
    shopAPI.getProfile().then((r) => {
      if (r.data?.success) {
        const d = r.data.data
        setEmail(d?.shopEmail || d?.user?.email || '')
        setPhone(d?.shopPhone || d?.user?.phone || '')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try { const r = await shopAPI.updateProfile({ shopEmail: email }); if (r.data?.success) toast.success('Settings saved'); else toast.error(r.data?.message || 'Could not save') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Could not save') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Account */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Account</h3></div>
          <div className="p-[18px]">
            <div className="mb-3.5"><label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">Login mobile number</label>
              <input value={phone ? `+91 ${phone}` : '—'} readOnly className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm bg-[#F6F8FB] text-[#7B8AA3]" />
              <p className="mt-1 text-[11px] text-[#9AA7B8]">You log in with OTP on this number. To change it, contact the admin team.</p></div>
            <div className="mb-3.5"><label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">Contact email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@example.com" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" /></div>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px] disabled:opacity-50" style={{ background: DIST }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Notifications</h3></div>
          <div className="p-[18px]">
            {NOTIFS.map((t, i) => (
              <div key={t} className="flex items-center justify-between py-3 border-b border-[#EEF1F6] last:border-0">
                <b className="text-[13.5px] text-[#13203A]">{t}</b>
                <button onClick={() => setNotif((n) => n.map((x, j) => j === i ? !x : x))} className={`w-[46px] h-[27px] rounded-full relative transition ${notif[i] ? 'bg-[#15936B]' : 'bg-[#E7ECF3]'}`}>
                  <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${notif[i] ? 'left-[22px]' : 'left-[3px]'}`} />
                </button>
              </div>
            ))}
            <div className="mt-4 p-3.5 rounded-xl text-[12.5px] flex items-start gap-2" style={{ background: '#FEF3E2', color: '#8a5a08' }}>
              <Lock className="h-4 w-4 shrink-0 mt-0.5" /> Your bank details can only be changed by the admin team for security.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
