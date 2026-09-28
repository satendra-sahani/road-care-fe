'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wallet, ArrowDownToLine, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { Panel, PrimaryBtn, Field, inputCls, Spinner, Empty, inr, dateIN, errMsg } from './ui'
import { cn } from '@/lib/utils'

const WD_STATUS: Record<string, string> = { pending: 'text-[#B45309] bg-[#FEF3C7]', processed: 'text-[#047857] bg-[#D1FAE5]', approved: 'text-[#047857] bg-[#D1FAE5]', rejected: 'text-[#B91C1C] bg-[#FEE2E2]' }

export function FranchiseWallet() {
  const [w, setW] = useState<any>(null)
  const [tab, setTab] = useState<'tx' | 'wd'>('tx')
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' })
  const [sending, setSending] = useState(false)

  const loadWallet = useCallback(async () => {
    const r = await franchiseAPI.wallet()
    const d = r.data?.data
    setW(d)
    if (d?.payout) {
      setMethod(d.payout.method === 'bank' ? 'bank' : 'upi')
      setUpiId(d.payout.upiId || '')
      setBank({ accountHolderName: d.payout.accountHolderName || '', accountNumber: d.payout.accountNumber || '', ifsc: d.payout.ifsc || '', bankName: d.payout.bankName || '' })
    }
  }, [])
  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const r = tab === 'tx' ? await franchiseAPI.transactions({ page, limit: 15 }) : await franchiseAPI.withdrawals({ page, limit: 15 })
      setRows(r.data?.data || []); setTotal(r.data?.pagination?.total || 0)
    } finally { setLoading(false) }
  }, [tab, page])
  useEffect(() => { loadWallet().catch(() => setW({})) }, [loadWallet])
  useEffect(() => { loadRows() }, [loadRows])

  const withdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Enter an amount'); return }
    setSending(true)
    try {
      const r = await franchiseAPI.withdraw({ amount: amt, method, upiId, ...bank })
      toast.success(r.data?.message || 'Withdrawal requested'); setAmount(''); await loadWallet(); setTab('wd'); setPage(1); loadRows()
    } catch (err) { toast.error(errMsg(err, 'Could not request the withdrawal')) } finally { setSending(false) }
  }

  if (!w) return <Spinner />
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl bg-gradient-to-br from-[#0F2547] to-[#0D9488] p-5 text-white lg:col-span-2">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white/80"><Wallet className="h-4 w-4" /> Wallet balance</div>
          <div className="mt-2 text-[34px] font-extrabold tabular-nums">{inr(w.balance)}</div>
          <div className="mt-1 text-[12.5px] text-white/80">100% withdrawable — no minimum balance to keep</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-white/80">
            <div>Total credited<br /><b className="text-[14px] text-white">{inr(w.totalCredited)}</b></div>
            <div>Total withdrawn<br /><b className="text-[14px] text-white">{inr(w.totalDebited)}</b></div>
          </div>
        </div>
        <Panel title="Withdraw" className="lg:col-span-3">
          {w.pendingWithdrawal ? (
            <div className="m-4 flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] text-[#92400E]">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Withdrawal {w.pendingWithdrawal.withdrawalId} of {inr(w.pendingWithdrawal.amount)} is being processed (requested {dateIN(w.pendingWithdrawal.createdAt)}). You can request another once it's done.</span>
            </div>
          ) : (
            <form onSubmit={withdraw} className="grid gap-3 p-4 sm:grid-cols-2">
              <Field label="Amount" hint={`Up to ${inr(w.withdrawable)}`}>
                <div className="flex gap-2">
                  <input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="0" />
                  <button type="button" onClick={() => setAmount(String(w.withdrawable || 0))} className="shrink-0 rounded-lg border border-[#DDE4EC] px-3 text-[12px] font-bold text-[#0D9488]">All</button>
                </div>
              </Field>
              <Field label="Pay to">
                <div className="flex gap-1.5">
                  {(['upi', 'bank'] as const).map((m) => (
                    <button type="button" key={m} onClick={() => setMethod(m)} className={cn('h-10 flex-1 rounded-lg border text-[13px] font-bold', method === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0F766E]' : 'border-[#DDE4EC] text-[#475569]')}>{m === 'upi' ? 'UPI' : 'Bank account'}</button>
                  ))}
                </div>
              </Field>
              {method === 'upi' ? (
                <div className="sm:col-span-2"><Field label="UPI ID"><input className={inputCls} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" /></Field></div>
              ) : (
                <>
                  <Field label="Account holder"><input className={inputCls} value={bank.accountHolderName} onChange={(e) => setBank((b) => ({ ...b, accountHolderName: e.target.value }))} /></Field>
                  <Field label="Account number"><input className={inputCls} value={bank.accountNumber} onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" /></Field>
                  <Field label="IFSC"><input className={inputCls} value={bank.ifsc} onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))} /></Field>
                  <Field label="Bank name"><input className={inputCls} value={bank.bankName} onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))} /></Field>
                </>
              )}
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <span className="text-[11.5px] text-[#7B8AA3]">Paid to your account within 2 hours to 5 working days.</span>
                <PrimaryBtn type="submit" loading={sending} disabled={!w.withdrawable}><ArrowDownToLine className="h-4 w-4" /> Withdraw</PrimaryBtn>
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Panel title={
        <div className="flex gap-1.5">
          {([['tx', 'Transactions'], ['wd', 'Withdrawals']] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setPage(1) }} className={cn('rounded-full px-3 py-1.5 text-[12.5px] font-bold', tab === k ? 'bg-[#0D9488] text-white' : 'bg-[#F1F5F9] text-[#475569]')}>{l}</button>
          ))}
        </div>
      }>
        {loading ? <Spinner /> : rows.length === 0 ? <Empty>Nothing here yet.</Empty> : tab === 'tx' ? (
          <ul className="divide-y divide-[#EEF1F6]">
            {rows.map((t) => (
              <li key={t._id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div className="min-w-0"><div className="truncate font-semibold text-[#13203A]">{t.description || t.category}</div><div className="text-[11.5px] text-[#7B8AA3]">{dateIN(t.createdAt)}</div></div>
                <b className={cn('tabular-nums', t.type === 'credit' ? 'text-[#047857]' : 'text-[#B91C1C]')}>{t.type === 'credit' ? '+' : '−'}{inr(t.amount)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-[#EEF1F6]">
            {rows.map((x) => (
              <li key={x._id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div className="min-w-0"><div className="font-semibold text-[#13203A]">{x.withdrawalId} · {x.payoutMethod === 'bank' ? 'Bank' : `UPI ${x.upiId || ''}`}</div><div className="text-[11.5px] text-[#7B8AA3]">{dateIN(x.createdAt)}</div></div>
                <div className="text-right"><b className="tabular-nums">{inr(x.amount)}</b><div><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold capitalize', WD_STATUS[x.status] || 'bg-[#F1F5F9] text-[#475569]')}>{x.status}</span></div></div>
              </li>
            ))}
          </ul>
        )}
        <AdminPagination page={page} pageSize={15} total={total} onPageChange={setPage} label={tab === 'tx' ? 'transactions' : 'withdrawals'} />
      </Panel>
    </div>
  )
}
