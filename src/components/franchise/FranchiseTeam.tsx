'use client'

import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { Panel, PrimaryBtn, GhostBtn, Field, inputCls, Modal, ActivePill, Spinner, Empty, dateIN, errMsg } from './ui'

// Owner only. Team members can manage shops, mechanics and requests and see
// earnings — but not the wallet, withdrawals, profile payout or the team.
export function FranchiseTeam() {
  const [rows, setRows] = useState<any[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { const r = await franchiseAPI.team(); setRows(r.data?.data || []) } catch (e) { toast.error(errMsg(e)); setRows([]) }
  }, [])
  useEffect(() => { load() }, [load])

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await franchiseAPI.addTeamMember(form)
      toast.success(r.data?.message || 'Added'); setAdding(false); setForm({ fullName: '', phone: '' }); load()
    } catch (err) { toast.error(errMsg(err, 'Could not add')) } finally { setSaving(false) }
  }
  const toggle = async (u: any) => {
    try { const r = await franchiseAPI.setTeamMemberActive(u._id, !u.isActive); toast.success(r.data?.message || 'Updated'); load() } catch (err) { toast.error(errMsg(err)) }
  }

  return (
    <>
      <Panel title="Team" action={<PrimaryBtn onClick={() => setAdding(true)}><UserPlus className="h-4 w-4" /> Add member</PrimaryBtn>}>
        <div className="border-b border-[#EEF1F6] px-4 py-3 text-[12.5px] text-[#52667C]">
          Team members log in at <b>/franchise/login</b> with an OTP. They can manage mechanics, shops and service requests and see earnings — but not your wallet, withdrawals, profile or team.
        </div>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty><Users className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />No team members.</Empty> : (
          <ul className="divide-y divide-[#EEF1F6]">
            {rows.map((u) => (
              <li key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div>
                  <b className="text-[#13203A]">{u.fullName}</b> <span className="text-[11.5px] font-bold uppercase text-[#0D9488]">{u.franchiseRole === 'owner' ? 'Owner' : 'Team'}</span>
                  <div className="text-[11.5px] text-[#7B8AA3]">{u.phone} · added {dateIN(u.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ActivePill active={u.isActive} />
                  {u.franchiseRole !== 'owner' && <GhostBtn onClick={() => toggle(u)}>{u.isActive ? 'Remove access' : 'Restore access'}</GhostBtn>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a team member" description="Use a number that doesn't already have a Bharat Mechanics account.">
        <form onSubmit={add} className="space-y-3">
          <Field label="Name" required><input className={inputCls} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required /></Field>
          <Field label="Mobile" required><input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" required /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <GhostBtn type="button" onClick={() => setAdding(false)} className="h-10">Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={saving}>Add member</PrimaryBtn>
          </div>
        </form>
      </Modal>
    </>
  )
}
