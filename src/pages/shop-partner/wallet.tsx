'use client'

import { useEffect, useState, useCallback } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Loader2, Plus, ArrowUp, ArrowDownLeft, ArrowUpRight, X, IndianRupee,
  Wallet as WalletIcon, Building2, Clock, AlertTriangle,
} from 'lucide-react'

const DIST = '#D97706', DIST_2 = '#B45309', GREEN = '#15936B', NAVY = '#1B3B6F', STAR = '#F5A623'
const QUICK = [500, 1000, 2000, 5000]
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

declare global { interface Window { Razorpay: any } }

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true); s.onerror = () => resolve(false); document.body.appendChild(s)
  })
}

export default function ShopWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [dash, setDash] = useState<any>(null)
  const [txns, setTxns] = useState<any[]>([])
  const [tab, setTab] = useState<'all' | 'credit' | 'debit'>('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState<number | ''>('')
  const [paying, setPaying] = useState(false)
  // Withdraw
  const [withdrawing, setWithdrawing] = useState(false)
  const [wAmt, setWAmt] = useState<number | ''>('')
  const [wMethod, setWMethod] = useState<'upi' | 'bank'>('upi')
  const [wUpi, setWUpi] = useState('')
  const [wBank, setWBank] = useState({ accountNumber: '', ifscCode: '', accountHolderName: '', bankName: '' })
  const [wSubmitting, setWSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [w, d, t] = await Promise.all([
        shopAPI.getWallet(), shopAPI.getDashboard().catch(() => null),
        shopAPI.getWalletTransactions({ limit: 30 }).catch(() => null),
      ])
      if (w.data?.success) setWallet(w.data.data)
      if (d?.data?.success) setDash(d.data.data)
      const list = t?.data?.data?.transactions || t?.data?.data || []
      setTxns(Array.isArray(list) ? list : [])
    } catch { toast.error('Could not load wallet') } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const addMoney = async (amt: number) => {
    if (!amt || amt < 100) { toast.error('Minimum top-up is ₹100'); return }
    setPaying(true)
    try {
      const ok = await loadRazorpay(); if (!ok) { toast.error('Could not load payment gateway'); setPaying(false); return }
      const res = await shopAPI.createTopupOrder(amt)
      if (!res.data?.success) { toast.error(res.data?.message || 'Could not start payment'); setPaying(false); return }
      const { orderId, amount: amountPaise, currency, keyId } = res.data.data
      const rzp = new window.Razorpay({
        key: keyId, amount: amountPaise, currency, order_id: orderId,
        name: 'Bharat Mechanics', description: 'Wallet top-up', theme: { color: DIST },
        handler: async (resp: any) => {
          try {
            const v = await shopAPI.verifyTopup({ razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature })
            if (v.data?.success) { toast.success(v.data.message || 'Wallet topped up'); setAmount(''); setAdding(false); fetchAll() }
            else toast.error(v.data?.message || 'Verification failed')
          } catch { toast.error('Verification failed — contact support if money was deducted') } finally { setPaying(false) }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.on('payment.failed', () => { toast.error('Payment failed'); setPaying(false) })
      rzp.open()
    } catch { toast.error('Could not start payment'); setPaying(false) }
  }

  const submitWithdraw = async () => {
    const amt = Number(wAmt)
    if (!amt || amt < 1) { toast.error('Enter an amount'); return }
    if (amt > (wallet?.balance || 0)) { toast.error('Amount exceeds your balance'); return }
    const payload: any = { amount: amt, method: wMethod }
    if (wMethod === 'upi') {
      if (!/^[\w.\-]+@[\w.\-]+$/.test(wUpi.trim())) { toast.error('Enter a valid UPI ID (name@bank)'); return }
      payload.upiId = wUpi.trim()
    } else {
      if (!wBank.accountNumber || wBank.accountNumber.length < 6) { toast.error('Enter a valid account number'); return }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(wBank.ifscCode.trim().toUpperCase())) { toast.error('Enter a valid IFSC code'); return }
      if (!wBank.accountHolderName.trim()) { toast.error('Enter the account holder name'); return }
      payload.bankDetails = { ...wBank, ifscCode: wBank.ifscCode.trim().toUpperCase() }
    }
    setWSubmitting(true)
    try {
      const r = await shopAPI.requestWithdrawal(payload)
      if (r.data?.success) { toast.success(r.data.message || 'Withdrawal requested'); setWithdrawing(false); setWAmt(''); setWUpi(''); fetchAll() }
      else toast.error(r.data?.message || 'Could not request withdrawal')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not request withdrawal') } finally { setWSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const balance = wallet?.balance || 0
  const minBalance = wallet?.minBalance ?? 2000
  const belowMin = wallet?.belowMinimum ?? (balance < minBalance)
  const shortfall = wallet?.shortfall ?? Math.max(0, minBalance - balance)
  const earnings = dash?.earnings || {}
  const shop = dash?.shop || {}
  const pending = earnings.pendingSettlement || 0
  const cycle = shop.settlementCycle || 'weekly'
  const filtered = txns.filter((t) => tab === 'all' || t.type === tab)

  return (
    <div className="p-4 md:p-6 space-y-[18px]">
      {/* Hero + next settlement */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-stretch">
        {/* Hero */}
        <div className="relative rounded-2xl p-[22px] text-white overflow-hidden" style={{ background: `linear-gradient(135deg, ${DIST}, #F59E0B)` }}>
          <div className="text-[12.5px] text-white/85 font-semibold">Wallet balance · वॉलेट बैलेंस</div>
          <div className="text-[40px] font-extrabold leading-tight mt-1">{inr(balance)}</div>
          <div className="text-[12.5px] text-white/85 flex items-center gap-1.5 capitalize"><span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Available · {cycle} settlement · min {inr(minBalance)}</div>
          {belowMin && <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1 text-[12px] font-bold"><AlertTriangle className="h-3.5 w-3.5" /> Add {inr(shortfall)} to reach the {inr(minBalance)} minimum</div>}
          <div className="flex flex-wrap gap-2.5 mt-4">
            <button onClick={() => { setWAmt(''); setWithdrawing(true) }} disabled={balance < 1} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2.5 font-bold text-[14px] disabled:opacity-50"><ArrowUp className="h-[17px] w-[17px]" /> Withdraw</button>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-white text-[#B45309] rounded-xl px-4 py-2.5 font-bold text-[14px]"><Plus className="h-[17px] w-[17px]" /> Add money</button>
            <Link href="/shop-partner/settlements" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2.5 font-bold text-[14px]"><Building2 className="h-[17px] w-[17px]" /> Settlements</Link>
          </div>
        </div>
        {/* Next settlement */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-[18px] flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center" style={{ background: '#FEF3E2', color: DIST_2 }}><Clock className="h-[18px] w-[18px]" /></div>
            <div><div className="text-[12px] text-[#7B8AA3]">Next settlement</div><div className="font-extrabold text-[14px] text-[#13203A] capitalize">{cycle} cycle</div></div>
          </div>
          <div className="text-[28px] font-extrabold leading-none" style={{ color: DIST_2 }}>{inr(pending)}</div>
          <div className="text-[12.5px] text-[#7B8AA3] mt-1.5 mb-auto">Pending payout for this cycle</div>
          <Link href="/shop-partner/settlements" className="inline-flex items-center justify-center gap-2 mt-3 text-white font-bold text-[14px] rounded-[11px] px-4 py-2.5" style={{ background: DIST }}><ArrowUp className="h-[15px] w-[15px]" /> View settlements</Link>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { bg: '#E7F6EF', fg: GREEN, Icon: IndianRupee, v: inr(earnings.thisMonth?.totalEarning || 0), l: 'This month in' },
          { bg: '#FFF7E6', fg: STAR, Icon: WalletIcon, v: inr(balance), l: 'Wallet balance' },
          { bg: '#FEE9E9', fg: '#DC2626', Icon: ArrowUpRight, v: `${shop.commissionRate ?? 25}%`, l: 'Commission' },
          { bg: '#EAF1FE', fg: '#2563EB', Icon: Building2, v: inr(minBalance), l: 'Minimum balance' },
        ].map((s) => (
          <div key={s.l} className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm flex items-center gap-3">
            <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.fg }}><s.Icon className="h-[18px] w-[18px]" /></div>
            <div className="min-w-0"><div className="text-[18px] font-extrabold text-[#13203A] leading-none truncate">{s.v}</div><div className="text-[12px] text-[#7B8AA3] mt-0.5">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* Transactions with tabs */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[#EEF1F6]">
          <h3 className="text-[15.5px] font-extrabold text-[#13203A]">Transactions</h3>
          <div className="flex bg-[#F6F8FB] border border-[#E7ECF3] rounded-[10px] p-1 gap-0.5">
            {(['all', 'credit', 'debit'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`text-[12.5px] font-bold px-3 py-1.5 rounded-md capitalize ${tab === t ? 'text-white' : 'text-[#475569]'}`} style={tab === t ? { background: NAVY } : {}}>{t === 'all' ? 'All' : t === 'credit' ? 'Credits' : 'Debits'}</button>
            ))}
          </div>
        </div>
        {!filtered.length ? (
          <div className="text-center py-12 text-[#7B8AA3] text-sm">No {tab === 'all' ? '' : tab + ' '}transactions yet.</div>
        ) : (
          <div className="divide-y divide-[#EEF1F6]">
            {filtered.map((t: any) => {
              const cr = t.type === 'credit'
              return (
                <div key={t._id} className="flex items-center gap-3 px-[18px] py-3.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cr ? 'bg-[#E7F6EF] text-[#15936B]' : 'bg-[#FEF3E2] text-[#B45309]'}`}>{cr ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div>
                  <div className="flex-1 min-w-0"><b className="text-[13.5px] text-[#13203A] block truncate">{t.description || t.category?.replace(/_/g, ' ')}</b><span className="text-[11.5px] text-[#7B8AA3]">{t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : ''}</span></div>
                  <div className="text-right shrink-0"><b className={`text-[14px] font-extrabold ${cr ? 'text-[#15936B]' : 'text-[#B45309]'}`}>{cr ? '+' : '−'}{inr(t.amount)}</b>{t.balanceAfter != null && <div className="text-[11px] text-[#7B8AA3]">Bal {inr(t.balanceAfter)}</div>}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add money modal */}
      {adding && (
        <div className="fixed inset-0 z-[80] bg-[#0F2547]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setAdding(false) }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-extrabold text-[#13203A]">Add money</h3><button onClick={() => setAdding(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7B8AA3]"><X className="h-4 w-4" /></button></div>
            <div className="flex flex-wrap gap-2 mb-3">{QUICK.map((q) => <button key={q} onClick={() => setAmount(q)} className={`text-[13px] font-bold rounded-full px-3.5 py-2 border ${amount === q ? 'text-white border-transparent' : 'text-[#475569] border-[#E7ECF3]'}`} style={amount === q ? { background: DIST } : {}}>{inr(q)}</button>)}</div>
            <div className="flex items-center gap-2 mb-3"><div className="flex items-center px-3 h-11 bg-[#F6F8FB] rounded-lg border border-[#E7ECF3] text-[#475569]"><IndianRupee className="h-4 w-4" /></div><input type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))} placeholder="Enter amount (min ₹100)" className="flex-1 h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" /></div>
            <button onClick={() => addMoney(Number(amount))} disabled={paying || !amount || Number(amount) < 100} className="w-full h-11 rounded-xl text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: DIST }}>{paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{paying ? 'Processing…' : `Add ${amount ? inr(Number(amount)) : 'money'}`}</button>
            <p className="text-[11.5px] text-[#7B8AA3] mt-2 text-center">Secure payment via Razorpay (UPI, card, net banking).</p>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {withdrawing && (
        <div className="fixed inset-0 z-[80] bg-[#0F2547]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setWithdrawing(false) }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-extrabold text-[#13203A]">Withdraw money</h3><button onClick={() => setWithdrawing(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7B8AA3]"><X className="h-4 w-4" /></button></div>
            <p className="text-[12.5px] text-[#7B8AA3] mb-3">Available balance: <b className="text-[#13203A]">{inr(balance)}</b>. Requests are reviewed and paid out by the admin team.</p>
            <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">Amount</label>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center px-3 h-11 bg-[#F6F8FB] rounded-lg border border-[#E7ECF3] text-[#475569]"><IndianRupee className="h-4 w-4" /></div>
              <input type="number" min={1} value={wAmt} onChange={(e) => setWAmt(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))} placeholder={`Up to ${inr(balance)}`} className="flex-1 h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
            </div>
            <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">Payout to</label>
            <div className="flex gap-2 mb-3">
              {(['upi', 'bank'] as const).map((m) => (
                <button key={m} onClick={() => setWMethod(m)} className={`flex-1 h-10 rounded-lg text-[13px] font-bold border ${wMethod === m ? 'text-white border-transparent' : 'text-[#475569] border-[#E7ECF3]'}`} style={wMethod === m ? { background: DIST } : {}}>{m === 'upi' ? 'UPI' : 'Bank account'}</button>
              ))}
            </div>
            {wMethod === 'upi' ? (
              <input value={wUpi} onChange={(e) => setWUpi(e.target.value)} placeholder="yourname@bank" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
            ) : (
              <div className="space-y-2.5 mb-3">
                <input value={wBank.accountHolderName} onChange={(e) => setWBank({ ...wBank, accountHolderName: e.target.value })} placeholder="Account holder name" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
                <input value={wBank.accountNumber} onChange={(e) => setWBank({ ...wBank, accountNumber: e.target.value.replace(/\D/g, '') })} placeholder="Account number" inputMode="numeric" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
                <div className="flex gap-2.5">
                  <input value={wBank.ifscCode} onChange={(e) => setWBank({ ...wBank, ifscCode: e.target.value.toUpperCase() })} placeholder="IFSC code" className="flex-1 h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
                  <input value={wBank.bankName} onChange={(e) => setWBank({ ...wBank, bankName: e.target.value })} placeholder="Bank (optional)" className="flex-1 h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
                </div>
              </div>
            )}
            <button onClick={submitWithdraw} disabled={wSubmitting || !wAmt} className="w-full h-11 rounded-xl text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: DIST }}>{wSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}{wSubmitting ? 'Requesting…' : `Withdraw ${wAmt ? inr(Number(wAmt)) : ''}`}</button>
          </div>
        </div>
      )}
    </div>
  )
}
