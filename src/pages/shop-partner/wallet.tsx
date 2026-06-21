'use client'

import { useEffect, useState, useCallback } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Wallet as WalletIcon, Plus, Loader2, AlertTriangle, ShieldCheck,
  ArrowDownLeft, ArrowUpRight, IndianRupee,
} from 'lucide-react'

const DIST = '#0D9488', DIST_50 = '#E6F7F4'
const QUICK = [500, 1000, 2000, 5000]

declare global {
  interface Window { Razorpay: any }
}

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function ShopWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState<number | ''>('')
  const [paying, setPaying] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([
        shopAPI.getWallet(),
        shopAPI.getWalletTransactions({ limit: 25 }).catch(() => null),
      ])
      if (w.data?.success) setWallet(w.data.data)
      const list = t?.data?.data?.transactions || t?.data?.data || []
      setTxns(Array.isArray(list) ? list : [])
    } catch {
      toast.error('Could not load wallet')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addMoney = async (amt: number) => {
    if (!amt || amt < 100) { toast.error('Minimum top-up is ₹100'); return }
    setPaying(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) { toast.error('Could not load payment gateway'); setPaying(false); return }
      const res = await shopAPI.createTopupOrder(amt)
      if (!res.data?.success) { toast.error(res.data?.message || 'Could not start payment'); setPaying(false); return }
      const { orderId, amount: amountPaise, currency, keyId } = res.data.data
      const rzp = new window.Razorpay({
        key: keyId,
        amount: amountPaise,
        currency,
        order_id: orderId,
        name: 'Bharat Mechanics',
        description: 'Wallet top-up',
        theme: { color: DIST },
        handler: async (resp: any) => {
          try {
            const v = await shopAPI.verifyTopup({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })
            if (v.data?.success) {
              toast.success(v.data.message || 'Wallet topped up')
              setAmount('')
              fetchAll()
            } else {
              toast.error(v.data?.message || 'Verification failed — contact support if money was deducted')
            }
          } catch {
            toast.error('Verification failed — contact support if money was deducted')
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.on('payment.failed', () => { toast.error('Payment failed'); setPaying(false) })
      rzp.open()
    } catch {
      toast.error('Could not start payment')
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>
  }

  const balance = wallet?.balance || 0
  const minBalance = wallet?.minBalance ?? 2000
  const belowMin = wallet?.belowMinimum ?? (balance < minBalance)
  const shortfall = wallet?.shortfall ?? Math.max(0, minBalance - balance)

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-[#13203A]">Wallet</h1>
        <p className="text-[13px] text-[#7B8AA3] mt-0.5">Add money and keep a minimum balance of {inr(minBalance)} to accept jobs.</p>
      </div>

      {/* Minimum-balance status */}
      {belowMin ? (
        <div className="flex items-start gap-3 rounded-2xl bg-[#fff4f4] border border-[#f6c9c9] px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-[#b91c1c] shrink-0 mt-0.5" />
          <div className="text-sm">
            <b className="text-[#b91c1c]">Balance below the {inr(minBalance)} minimum</b>
            <p className="text-[#9a3636] mt-0.5">Add at least <b>{inr(shortfall)}</b> to keep accepting new jobs.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-[#E7F6EF] border border-[#bfe6d3] px-4 py-3.5">
          <ShieldCheck className="h-5 w-5 text-[#15936B] shrink-0" />
          <div className="text-sm text-[#13203A]"><b>You&rsquo;re above the minimum balance.</b> You can accept jobs normally.</div>
        </div>
      )}

      {/* Balance + add money */}
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <div className="rounded-2xl p-5 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${DIST}, #0b7d72)` }}>
          <div className="flex items-center gap-2 text-white/80 text-[12.5px] font-semibold"><WalletIcon className="h-4 w-4" /> Available balance</div>
          <div className="text-[34px] font-extrabold leading-tight mt-1">{inr(balance)}</div>
          <div className="text-[12px] text-white/70 mt-1">Minimum to operate: {inr(minBalance)}</div>
        </div>

        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-5">
          <h3 className="font-extrabold text-[15px] text-[#13203A] mb-3">Add money</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setAmount(q)}
                className={`text-[13px] font-bold rounded-full px-3.5 py-2 border transition ${amount === q ? 'text-white border-transparent' : 'text-[#475569] border-[#E7ECF3] hover:border-[#c7d6ed]'}`}
                style={amount === q ? { background: DIST } : {}}>
                {inr(q)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center px-3 h-11 bg-[#F6F8FB] rounded-lg border border-[#E7ECF3] text-[#475569]"><IndianRupee className="h-4 w-4" /></div>
            <input
              type="number" min={100} value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))}
              placeholder="Enter amount (min ₹100)"
              className="flex-1 h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>
          <button
            onClick={() => addMoney(Number(amount))}
            disabled={paying || !amount || Number(amount) < 100}
            className="w-full h-11 rounded-xl text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ background: DIST }}
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {paying ? 'Processing…' : `Add ${amount ? inr(Number(amount)) : 'money'}`}
          </button>
          <p className="text-[11.5px] text-[#7B8AA3] mt-2 text-center">Secure payment via Razorpay (UPI, card, net banking).</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EEF1F6]"><h3 className="font-extrabold text-[15px] text-[#13203A]">Transactions</h3></div>
        {!txns.length ? (
          <div className="text-center py-10 text-[#7B8AA3] text-sm">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-[#EEF1F6]">
            {txns.map((t: any) => {
              const credit = t.type === 'credit'
              return (
                <div key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${credit ? 'bg-[#E7F6EF] text-[#15936B]' : 'bg-[#fff1eb] text-[#FF6B35]'}`}>
                    {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="text-[13.5px] text-[#13203A] block truncate">{t.description || t.category?.replace(/_/g, ' ')}</b>
                    <span className="text-[11.5px] text-[#7B8AA3]">{t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : ''}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <b className={`text-[14px] font-extrabold ${credit ? 'text-[#15936B]' : 'text-[#FF6B35]'}`}>{credit ? '+' : '−'}{inr(t.amount)}</b>
                    {t.balanceAfter != null && <div className="text-[11px] text-[#7B8AA3]">Bal {inr(t.balanceAfter)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
