'use client'

import { useEffect, useRef, useState } from 'react'
import { shopAPI, uploadAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Check, AlertTriangle, Camera } from 'lucide-react'

const DIST = '#D97706', GREEN = '#15936B'

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3.5 flex-1">
      <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
    </div>
  )
}

// One KYC document: pick an image → upload to ImageKit → show the thumbnail.
// Stores only the returned URL (never the raw file).
function DocUpload({ label, url, busy, onPick }: { label: string; url?: string; busy?: boolean; onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EEF1F6]">
      <button onClick={() => ref.current?.click()} disabled={busy}
        className="h-11 w-11 rounded-[10px] overflow-hidden flex items-center justify-center shrink-0 border border-[#E7ECF3]"
        style={{ background: url ? '#fff' : '#F6F8FB' }}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-[#475569]" />
          : url ? <img src={url} alt={label} className="h-full w-full object-cover" />
          : <Camera className="h-[18px] w-[18px] text-[#475569]" />}
      </button>
      <div className="flex-1 min-w-0">
        <b className="block text-[13.5px] text-[#13203A] truncate">{label}</b>
        <span className="text-[11.5px] text-[#7B8AA3]">{busy ? 'Uploading…' : url ? 'Uploaded' : 'Tap to upload a clear photo'}</span>
      </div>
      <button onClick={() => ref.current?.click()} disabled={busy}
        className="text-[12px] font-bold px-3 py-1.5 rounded-lg" style={{ background: url ? '#E7F6EF' : '#FEF3E2', color: url ? GREEN : DIST }}>
        {url ? 'Replace' : 'Upload'}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = '' }} />
    </div>
  )
}

type DocSlot = 'aadhaarImage' | 'panImage' | 'gstImage' | 'ownerPhoto'

export function ShopKyc() {
  const [k, setK] = useState<any>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imgs, setImgs] = useState<Partial<Record<DocSlot, string>>>({})
  const [uploading, setUploading] = useState<Partial<Record<DocSlot, boolean>>>({})

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
        setImgs({
          aadhaarImage: d.kyc?.aadhaarImage || undefined,
          panImage: d.kyc?.panImage || undefined,
          gstImage: d.kyc?.gstImage || undefined,
          ownerPhoto: d.kyc?.ownerPhoto || undefined,
        })
      }
    }).catch(() => toast.error('Could not load KYC')).finally(() => setLoading(false))
  }, [])

  const set = (key: string, v: string) => setK((s: any) => ({ ...s, [key]: v }))

  const FOLDER: Record<DocSlot, string> = {
    aadhaarImage: 'kyc/aadhaar', panImage: 'kyc/pan', gstImage: 'kyc/gst', ownerPhoto: 'kyc/owner',
  }

  // Upload a picked file to ImageKit and keep only the returned URL.
  const uploadDoc = async (slot: DocSlot, file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return }
    setUploading((u) => ({ ...u, [slot]: true }))
    try {
      const res = await uploadAPI.uploadImageAny(file, FOLDER[slot])
      const url = res.data?.data?.url || res.data?.url
      if (url) { setImgs((s) => ({ ...s, [slot]: url })); toast.success('Uploaded') }
      else toast.error('Upload failed')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }))
    }
  }

  const anyUploading = Object.values(uploading).some(Boolean)

  const submit = async () => {
    setSaving(true)
    try {
      const r = await shopAPI.submitKyc({
        ownerName: k.ownerName, aadhaarNumber: k.aadhaar, panNumber: k.pan, gstNumber: k.gst,
        aadhaarImage: imgs.aadhaarImage, panImage: imgs.panImage, gstImage: imgs.gstImage, ownerPhoto: imgs.ownerPhoto,
        coordinates: { latitude: Number(k.latitude) || undefined, longitude: Number(k.longitude) || undefined },
      })
      if (r.data?.success) toast.success('KYC details submitted for review'); else toast.error(r.data?.message || 'Could not submit')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not submit') } finally { setSaving(false) }
  }

  if (loading || !k) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

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
            <button onClick={submit} disabled={saving || anyUploading} className="inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px] disabled:opacity-50" style={{ background: DIST }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {anyUploading ? 'Uploading…' : 'Submit KYC'}</button>
          </div>
        </div>

        {/* Documents — upload to ImageKit, only URLs are saved */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Documents</h3></div>
          <div className="p-[18px] space-y-2.5">
            <DocUpload label="Aadhaar card" url={imgs.aadhaarImage} busy={uploading.aadhaarImage} onPick={(f) => uploadDoc('aadhaarImage', f)} />
            <DocUpload label="PAN card" url={imgs.panImage} busy={uploading.panImage} onPick={(f) => uploadDoc('panImage', f)} />
            <DocUpload label="GST certificate (optional)" url={imgs.gstImage} busy={uploading.gstImage} onPick={(f) => uploadDoc('gstImage', f)} />
            <DocUpload label="Owner photo" url={imgs.ownerPhoto} busy={uploading.ownerPhoto} onPick={(f) => uploadDoc('ownerPhoto', f)} />
            <p className="text-[11.5px] text-[#7B8AA3] pt-1">Photos are stored securely and reviewed by the admin team.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
