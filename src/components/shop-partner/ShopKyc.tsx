'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Check, Plus, FileText, AlertTriangle } from 'lucide-react'

const DIST = '#D97706', GREEN = '#15936B'

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3.5 flex-1">
      <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
    </div>
  )
}

export function ShopKyc() {
  const [k, setK] = useState<any>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    shopAPI.getProfile().then((r) => {
      if (r.data?.success) {
        const d = r.data.data
        setVerified(!!d.isVerified)
        setK({
          ownerName: d.kyc?.ownerName || d.user?.fullName || '',
          aadhaar: d.kyc?.aadhaarNumber || '', pan: d.kyc?.panNumber || '', gst: d.kyc?.gstNumber || '',
          latitude: d.address?.coordinates?.latitude ?? '', longitude: d.address?.coordinates?.longitude ?? '',
          docs: d.kyc || {},
        })
      }
    }).catch(() => toast.error('Could not load KYC')).finally(() => setLoading(false))
  }, [])

  const set = (key: string, v: string) => setK((s: any) => ({ ...s, [key]: v }))

  const submit = async () => {
    setSaving(true)
    try {
      const r = await shopAPI.submitKyc({ ownerName: k.ownerName, aadhaarNumber: k.aadhaar, panNumber: k.pan, gstNumber: k.gst, coordinates: { latitude: Number(k.latitude) || undefined, longitude: Number(k.longitude) || undefined } })
      if (r.data?.success) toast.success('KYC details submitted for review'); else toast.error(r.data?.message || 'Could not submit')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not submit') } finally { setSaving(false) }
  }

  if (loading || !k) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const docs = [
    { name: 'Aadhaar Card', val: k.aadhaar || 'Not provided', ok: !!k.aadhaar },
    { name: 'PAN Card', val: k.pan || 'Not provided', ok: !!k.pan },
    { name: 'GST Certificate', val: k.gst || 'Optional', ok: !!k.gst },
    { name: 'Owner details', val: k.ownerName || 'Not provided', ok: !!k.ownerName },
  ]

  return (
    <div className="p-4 md:p-6 space-y-[18px] max-w-5xl">
      {/* Banner */}
      <div className={`flex items-center gap-3.5 rounded-2xl px-4 md:px-5 py-4 ${verified ? 'bg-[#E7F6EF] border border-[#bfe8d6]' : 'bg-[#FEF3E2] border border-[#f0d8a8]'}`}>
        <div className="h-[46px] w-[46px] rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: verified ? GREEN : DIST }}>
          {verified ? <Check className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div><b className="block text-[15px] text-[#13203A]">{verified ? 'KYC Verified ✓' : 'KYC under review'}</b>
          <span className="text-[13px] text-[#475569]">{verified ? 'Approved by the admin team · You can receive jobs and payouts.' : 'Submit your documents to start receiving jobs and payouts.'}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Identity */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Identity details</h3></div>
          <div className="p-[18px]">
            <Field label="Owner full name" value={k.ownerName} onChange={(v) => set('ownerName', v)} />
            <div className="flex gap-3"><Field label="Aadhaar number" value={k.aadhaar} onChange={(v) => set('aadhaar', v)} /><Field label="PAN number" value={k.pan} onChange={(v) => set('pan', v)} /></div>
            <Field label="GST number (optional)" value={k.gst} onChange={(v) => set('gst', v)} />
            <div className="flex gap-3"><Field label="Shop latitude" value={String(k.latitude)} onChange={(v) => set('latitude', v)} /><Field label="Shop longitude" value={String(k.longitude)} onChange={(v) => set('longitude', v)} /></div>
            <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px] disabled:opacity-50" style={{ background: DIST }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update details</button>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Documents</h3></div>
          <div className="p-[18px] space-y-2.5">
            {docs.map((d) => (
              <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl border border-[#EEF1F6]">
                <div className="h-9 w-9 rounded-[10px] bg-[#F6F8FB] flex items-center justify-center text-[#475569] shrink-0"><FileText className="h-[18px] w-[18px]" /></div>
                <div className="flex-1 min-w-0"><b className="block text-[13.5px] text-[#13203A] truncate">{d.name}</b><span className="text-[11.5px] text-[#7B8AA3]">{d.val}</span></div>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: d.ok ? '#E7F6EF' : '#FEF3E2', color: d.ok ? GREEN : DIST }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: d.ok ? GREEN : DIST }} />{d.ok ? 'Provided' : 'Pending'}</span>
              </div>
            ))}
            <button onClick={() => toast('Document upload coming soon')} className="w-full inline-flex items-center justify-center gap-2 mt-2 border border-dashed border-[#E7ECF3] rounded-xl py-3 text-[13px] font-bold text-[#475569]"><Plus className="h-[15px] w-[15px]" /> Upload a document</button>
          </div>
        </div>
      </div>
    </div>
  )
}
