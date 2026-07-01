'use client'

// My Vehicle QR (SecureContact) — ported from bmc-extra.jsx MyQR.
import { useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  useVehicles, vehicleStore, VEHICLE_EMOJIS, plateToCode, qrPayload, type Vehicle,
} from '@/lib/secureContact'
import {
  Shield, Pencil, Download, Send, Plus, Info, Phone, QrCode, Check, Trash2,
} from 'lucide-react'

export function VehicleQRPage() {
  const router = useRouter()
  const list = useVehicles()
  const [vi, setVi] = useState(0)
  const [calls, setCalls] = useState(true)
  const [msgs, setMsgs] = useState(true)
  const [edit, setEdit] = useState<number | 'new' | null>(null)
  const v = list[vi] || list[0]

  return (
    <UserLayout>
      <div className="mx-auto max-w-md px-4 pb-10" style={{ background: 'linear-gradient(180deg,#E6F6F8,#F4F6FB 70%)' }}>
        <div className="pt-5">
          <h1 className="font-display text-2xl font-extrabold text-[#0F2545]">My Vehicle QR</h1>
          <p className="text-[12.5px] font-semibold text-slate-500">SecureContact · number stays private</p>
        </div>

        {/* vehicle switcher */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {list.map((mv, i) => (
            <button key={mv.id} onClick={() => setVi(i)}
              className={`flex flex-1 items-center gap-2.5 rounded-2xl px-3 py-2.5 ${vi === i ? 'border-2 border-[#1B3B6F] bg-white shadow-sm' : 'border border-slate-200 bg-slate-50'}`}>
              <span className="text-xl">{mv.em}</span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-[12.5px] font-extrabold text-[#0F2545]">{mv.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="block text-[10.5px] font-bold text-slate-500">{mv.plate}</span>
              </span>
            </button>
          ))}
        </div>

        {/* QR sticker card */}
        <div className="mt-3.5 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex items-center gap-2.5 px-4 py-4 text-white" style={{ background: 'linear-gradient(150deg,#142C52,#24508C)' }}>
            <Shield className="h-5 w-5" fill="#FFD68A" color="#FFD68A" />
            <div className="flex-1">
              <div className="text-[10.5px] font-extrabold tracking-widest opacity-75">BHARAT MECHANICS</div>
              <div className="font-display text-[17px] font-extrabold leading-tight">SecureContact</div>
            </div>
            <div className="text-[26px]">{v.em}</div>
          </div>
          <div className="px-4 pb-5 pt-5 text-center">
            <div className="inline-block rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              {/* Real scannable QR — any phone camera opens the public landing page */}
              <QRCodeSVG value={qrPayload(v.code)} size={150} fgColor="#0C1B2E" bgColor="#FFFFFF" />
            </div>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <div className="text-[15px] font-extrabold text-[#0F2545]">{v.name}</div>
              <button onClick={() => setEdit(vi)} className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
                <Pencil className="h-3 w-3 text-[#1B3B6F]" />
              </button>
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#EAF0FA] px-3 py-1 text-sm font-extrabold tracking-widest text-[#1B3B6F]">{v.plate}</div>
            <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
              <Shield className="h-3.5 w-3.5 text-[#1BA672]" /> Scan to reach me — my number stays hidden
            </div>
          </div>
        </div>

        {/* actions */}
        <button onClick={() => setEdit(vi)}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 text-sm font-extrabold text-[#1B3B6F]">
          <Pencil className="h-4 w-4" /> Edit vehicle details
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => toast.success('Sticker saved to phone')}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1B3B6F] text-sm font-bold text-white">
            <Download className="h-[18px] w-[18px]" /> Download
          </button>
          <button onClick={async () => {
            const link = qrPayload(v.code)
            const message = `Reach me about my vehicle ${v.plate} via Bharat Mechanics SecureContact: ${link}`
            try {
              if (navigator.share) await navigator.share({ title: 'SecureContact', text: message, url: link })
              else { await navigator.clipboard.writeText(link); toast.success('Share link copied') }
            } catch { /* user dismissed the share sheet */ }
          }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-slate-50 text-sm font-bold text-[#1B3B6F]">
            <Send className="h-[17px] w-[17px]" /> Share link
          </button>
        </div>
        <button onClick={() => setEdit('new')}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 text-[13px] font-bold text-slate-700">
          <Plus className="h-4 w-4 text-[#1B3B6F]" /> Add another vehicle
        </button>
        <button onClick={() => router.push(`/v/${v.code}`)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 text-[13px] font-bold text-slate-700">
          <Info className="h-4 w-4 text-[#12A4B4]" /> Preview what a scanner sees
        </button>
        <button onClick={() => router.push('/scan')}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 text-[13px] font-bold text-slate-700">
          <QrCode className="h-4 w-4 text-[#1B3B6F]" /> Scan someone&apos;s vehicle QR
        </button>

        {/* how it works */}
        <h3 className="mb-2.5 mt-5 text-base font-extrabold text-[#0F2545]">How it <span className="text-[#FF6B35]">works</span></h3>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 shadow-sm">
          {[
            [<QrCode key="q" className="h-5 w-5 text-[#1B3B6F]" />, 'Someone scans your sticker', 'On your windshield or under the seat'],
            [<Shield key="s" className="h-5 w-5 text-[#1B3B6F]" />, 'We connect you privately', 'Your phone number is never shown'],
            [<Phone key="p" className="h-5 w-5 text-[#1B3B6F]" />, 'They call or message you', 'Move your vehicle — sorted in seconds'],
          ].map(([icon, t, s], i, a) => (
            <div key={i} className={`flex items-center gap-3 py-3.5 ${i < a.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF0FA]">{icon}</div>
              <div className="flex-1">
                <div className="text-[13.5px] font-bold text-[#0F2545]">{t as string}</div>
                <div className="text-[11.5px] font-semibold text-slate-500">{s as string}</div>
              </div>
            </div>
          ))}
        </div>

        {/* privacy controls */}
        <h3 className="mb-2.5 mt-5 text-base font-extrabold text-[#0F2545]">Privacy <span className="text-[#FF6B35]">controls</span></h3>
        <div className="rounded-2xl border border-slate-100 bg-white px-4 shadow-sm">
          <PrivacyToggle label="Allow voice calls" sub="Scanners can call you anonymously" on={calls} set={setCalls} icon={<Phone className="h-5 w-5 text-[#1B3B6F]" />} />
          <PrivacyToggle label="Allow messages" sub="Receive quick chat requests" on={msgs} set={setMsgs} icon={<Send className="h-5 w-5 text-[#1B3B6F]" />} />
          <div className="flex items-center gap-3 py-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E6F7F0]"><Shield className="h-5 w-5 text-[#1BA672]" /></div>
            <div className="flex-1">
              <div className="text-[13.5px] font-bold text-[#0F2545]">Mask my number</div>
              <div className="text-[11.5px] font-semibold text-slate-500">Always on for your safety</div>
            </div>
            <span className="rounded-full bg-[#E6F7F0] px-2.5 py-1 text-[11px] font-extrabold text-[#1BA672]">LOCKED</span>
          </div>
        </div>
      </div>

      {edit !== null && (
        <VehEditSheet
          veh={edit === 'new' ? null : list[edit]}
          onClose={() => setEdit(null)}
          onSave={(nv) => {
            if (edit === 'new') { const idx = vehicleStore.add(nv); setVi(idx) }
            else { vehicleStore.update(edit, nv) }
            setEdit(null); toast.success('Vehicle details saved')
          }}
          onDelete={edit !== 'new' && list.length > 1 ? () => { vehicleStore.remove(edit); setVi(0); setEdit(null); toast.success('Vehicle removed') } : undefined}
        />
      )}
    </UserLayout>
  )
}

function PrivacyToggle({ label, sub, on, set, icon }: { label: string; sub: string; on: boolean; set: (v: boolean) => void; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF0FA]">{icon}</div>
      <div className="flex-1">
        <div className="text-[13.5px] font-bold text-[#0F2545]">{label}</div>
        <div className="text-[11.5px] font-semibold text-slate-500">{sub}</div>
      </div>
      <button onClick={() => set(!on)}
        className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition ${on ? 'bg-[#1BA672]' : 'bg-slate-300'}`}>
        <span className="absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all" style={{ left: on ? 22 : 3 }} />
      </button>
    </div>
  )
}

function VehEditSheet({ veh, onClose, onSave, onDelete }: {
  veh: Vehicle | null
  onClose: () => void
  onSave: (v: { name: string; plate: string; em: string; code: string }) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(veh?.name || '')
  const [plate, setPlate] = useState(veh?.plate || '')
  const [em, setEm] = useState(veh?.em || '🏍️')
  const code = plateToCode(plate)
  const valid = name.trim().length > 1 && plate.replace(/[^A-Za-z0-9]/g, '').length >= 4

  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] flex flex-col justify-end bg-[#0F1C32]/50 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88%] overflow-y-auto rounded-t-3xl bg-[#F4F6FB] px-[18px] pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,.3)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
        <div className="mb-[18px] flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF0FA]">
            {veh ? <Pencil className="h-[19px] w-[19px] text-[#1B3B6F]" /> : <Plus className="h-[19px] w-[19px] text-[#1B3B6F]" />}
          </div>
          <div>
            <div className="font-display text-lg font-extrabold leading-tight text-[#0F2545]">{veh ? 'Edit vehicle' : 'Add vehicle'}</div>
            <div className="text-[11.5px] font-bold text-slate-500">Shown on your SecureContact QR</div>
          </div>
        </div>

        <div className="mb-1.5 ml-0.5 text-xs font-extrabold text-slate-700">Vehicle type</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {VEHICLE_EMOJIS.map((e) => (
            <button key={e} onClick={() => setEm(e)}
              className={`grid h-[50px] w-[50px] place-items-center rounded-xl text-2xl ${em === e ? 'border-2 border-[#1B3B6F] bg-[#EAF0FA]' : 'border border-slate-200 bg-slate-50'}`}>{e}</button>
          ))}
        </div>

        <div className="mb-1.5 ml-0.5 text-xs font-extrabold text-slate-700">Vehicle name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Honda Activa 6G"
          className="mb-4 h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 text-[15px] font-bold text-[#0F2545] outline-none" />

        <div className="mb-1.5 ml-0.5 text-xs font-extrabold text-slate-700">Number plate</div>
        <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="e.g. DL 8C AB 1234"
          className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 text-[15px] font-extrabold tracking-widest text-[#0F2545] outline-none" />

        <div className="my-3.5 flex items-center gap-2 rounded-xl bg-[#E6F7F0] px-3.5 py-3">
          <Shield className="h-4 w-4 shrink-0 text-[#1BA672]" />
          <span className="text-xs font-bold leading-snug text-slate-700">Your phone number is never printed on the QR — it always stays masked.</span>
        </div>

        <button disabled={!valid} onClick={() => onSave({ name: name.trim(), plate: plate.trim(), em, code })}
          className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white ${valid ? 'bg-[#1B3B6F]' : 'cursor-not-allowed bg-slate-300'}`}>
          <Check className="h-[18px] w-[18px]" /> {veh ? 'Save changes' : 'Add vehicle'}
        </button>
        {onDelete && (
          <button onClick={onDelete} className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 text-sm font-extrabold text-[#E2483D]">
            <Trash2 className="h-[17px] w-[17px]" /> Remove this vehicle
          </button>
        )}
      </div>
    </div>
  )
}
