'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { useFranchise } from './FranchiseContext'
import { Panel, PrimaryBtn, Field, inputCls, errMsg } from './ui'
import { cn } from '@/lib/utils'

export function FranchiseProfile() {
  const { me, refresh } = useFranchise()
  const f = me?.franchise
  const [form, setForm] = useState({ email: '', address: '', area: '', pincode: '' })
  const [payout, setPayout] = useState({ method: 'upi', upiId: '', accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!f) return
    setForm({ email: f.email || '', address: f.address || '', area: f.area || '', pincode: f.pincode || '' })
    setPayout({ method: f.payout?.method || 'upi', upiId: f.payout?.upiId || '', accountHolderName: f.payout?.accountHolderName || '', accountNumber: f.payout?.accountNumber || '', ifsc: f.payout?.ifsc || '', bankName: f.payout?.bankName || '' })
  }, [f])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try { const r = await franchiseAPI.updateProfile({ ...form, payout }); toast.success(r.data?.message || 'Saved'); await refresh() }
    catch (err) { toast.error(errMsg(err, 'Could not save')) } finally { setSaving(false) }
  }
  const owner = !!me?.isOwner
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((x) => ({ ...x, [k]: e.target.value }))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Franchise">
        <dl className="space-y-3 p-4 text-[13px]">
          {[['Name', f?.name], ['Code', f?.code], ['City', f?.city], ['Owner', f?.ownerName], ['Owner mobile', f?.phone], ['Your share', `${f?.earningPct ?? 0}% of every paid job`], ['You', `${me?.user?.fullName} (${owner ? 'Owner' : 'Team member'})`]].map(([k, v]) => (
            <div key={k as string}><dt className="text-[11.5px] font-bold uppercase tracking-wide text-[#7B8AA3]">{k}</dt><dd className="font-semibold text-[#13203A]">{v || '—'}</dd></div>
          ))}
          <p className="pt-1 text-[11.5px] text-[#7B8AA3]">Name, city and your share are set by Bharat Mechanics. Contact support to change them.</p>
        </dl>
      </Panel>
      <Panel title={owner ? 'Contact & payout account' : 'Contact'} className="lg:col-span-2">
        <form onSubmit={save} className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Email"><input className={inputCls} type="email" value={form.email} onChange={set('email')} disabled={!owner} /></Field>
          <Field label="Area"><input className={inputCls} value={form.area} onChange={set('area')} disabled={!owner} /></Field>
          <div className="sm:col-span-2"><Field label="Office address"><input className={inputCls} value={form.address} onChange={set('address')} disabled={!owner} /></Field></div>
          <Field label="PIN code"><input className={inputCls} value={form.pincode} onChange={set('pincode')} maxLength={6} disabled={!owner} /></Field>
          {owner && (
            <>
              <div className="sm:col-span-2 border-t border-[#EEF1F6] pt-3 text-[13px] font-extrabold text-[#13203A]">Payout account (used for withdrawals)</div>
              <Field label="Method">
                <div className="flex gap-1.5">
                  {(['upi', 'bank'] as const).map((m) => (
                    <button type="button" key={m} onClick={() => setPayout((p) => ({ ...p, method: m }))} className={cn('h-10 flex-1 rounded-lg border text-[13px] font-bold', payout.method === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DDE4EC] text-[#475569]')}>{m === 'upi' ? 'UPI' : 'Bank account'}</button>
                  ))}
                </div>
              </Field>
              {payout.method === 'upi' ? (
                <Field label="UPI ID"><input className={inputCls} value={payout.upiId} onChange={(e) => setPayout((p) => ({ ...p, upiId: e.target.value }))} placeholder="name@bank" /></Field>
              ) : (
                <>
                  <Field label="Account holder"><input className={inputCls} value={payout.accountHolderName} onChange={(e) => setPayout((p) => ({ ...p, accountHolderName: e.target.value }))} /></Field>
                  <Field label="Account number"><input className={inputCls} value={payout.accountNumber} onChange={(e) => setPayout((p) => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))} /></Field>
                  <Field label="IFSC"><input className={inputCls} value={payout.ifsc} onChange={(e) => setPayout((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))} /></Field>
                  <Field label="Bank name"><input className={inputCls} value={payout.bankName} onChange={(e) => setPayout((p) => ({ ...p, bankName: e.target.value }))} /></Field>
                </>
              )}
              <div className="flex justify-end sm:col-span-2"><PrimaryBtn type="submit" loading={saving}>Save</PrimaryBtn></div>
            </>
          )}
        </form>
      </Panel>
    </div>
  )
}
