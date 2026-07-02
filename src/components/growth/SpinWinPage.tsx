'use client'

// Spin & Win — web port of the app's spin wheel, backed by the same APIs
// (/user/spin/wheel, /user/spin). The wheel is a CSS conic-gradient; the
// backend decides the prize and the wheel animates to land on it.
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserLayout } from '@/components/layout/UserLayout'
import { userSpinAPI } from '@/services/api'
import { Sparkles, Gift, Loader2, Wallet, Ticket } from 'lucide-react'

// claude-design wheel palette — nav → orange → teal → green, cycled
const WHEEL_COLORS = ['#1B3B6F', '#FF6B35', '#12A4B4', '#1BA672']

interface Segment { _id?: string; label: string; rewardType: string; value: number; color?: string }
interface WheelData {
  segments: Segment[]
  dailyFreeSpins: number
  remainingFreeSpins: number
  bonusSpins?: number
  totalSpinsAvailable?: number
}
interface HistoryItem { _id: string; segmentLabel: string; rewardType: string; rewardAmount: number; couponCode?: string; createdAt: string }

export function SpinWinPage() {
  const [wheel, setWheel] = useState<WheelData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ label: string; rewardType: string; amount?: number; couponCode?: string; walletBalance?: number } | null>(null)

  const load = useCallback(async () => {
    try {
      const [w, h] = await Promise.all([
        userSpinAPI.getWheel(),
        userSpinAPI.getHistory({ page: 1, limit: 10 }).catch(() => null),
      ])
      if (w.data?.success && w.data.data) setWheel(w.data.data)
      if (h?.data?.success) setHistory(h.data.data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not load the spin wheel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const segments = wheel?.segments || []
  const segAngle = segments.length ? 360 / segments.length : 45
  const totalAvail = wheel ? (wheel.totalSpinsAvailable ?? wheel.remainingFreeSpins + (wheel.bonusSpins || 0)) : 0

  const doSpin = async () => {
    if (spinning || !wheel || totalAvail <= 0) return
    setSpinning(true)
    setResult(null)
    try {
      const res = await userSpinAPI.spin()
      if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Spin failed')
      const { segment, reward, walletBalance } = res.data.data
      const idx = Math.max(0, segments.findIndex((s) => (s._id && s._id === segment?._id) || s.label === segment?.label))
      // Land the pointer (top) on the winning segment's centre
      const target = 360 * 6 + (360 - (idx * segAngle + segAngle / 2))
      setRotation((prev) => prev + target - (prev % 360))
      setTimeout(() => {
        setResult({
          label: segment?.label || 'Reward',
          rewardType: segment?.rewardType || 'better_luck',
          amount: reward?.amount,
          couponCode: reward?.couponCode,
          walletBalance,
        })
        setSpinning(false)
        load()
      }, 3400)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Spin failed')
      setSpinning(false)
    }
  }

  const conic = segments.length
    ? `conic-gradient(${segments.map((s, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * segAngle}deg ${(i + 1) * segAngle}deg`).join(', ')})`
    : `conic-gradient(${WHEEL_COLORS.map((c, i) => `${c} ${i * 90}deg ${(i + 1) * 90}deg`).join(', ')})`

  return (
    <UserLayout>
      <div className="mx-auto max-w-md px-4 pb-10 text-center" style={{ background: 'linear-gradient(180deg,#E6F6F8,#F4F6FB 70%)' }}>
        <div className="pt-5 text-left">
          <h1 className="font-display text-2xl font-extrabold text-[#0F2545]">Spin &amp; Win</h1>
          <p className="text-[12.5px] font-semibold text-slate-500">
            {wheel ? `${wheel.remainingFreeSpins} free spin${wheel.remainingFreeSpins === 1 ? '' : 's'} today` : 'Daily free spin & rewards'}
          </p>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-600">घुमाओ और जीतो · Spin to win wallet cashback &amp; rewards!</p>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" /></div>
        ) : (
          <>
            {/* wheel */}
            <div className="relative mx-auto mt-6" style={{ width: 270, height: 270 }}>
              <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-3xl">🔻</div>
              <div
                className="h-full w-full rounded-full border-8 border-white shadow-[0_14px_40px_rgba(27,59,111,.3)]"
                style={{
                  background: conic,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 3.2s cubic-bezier(.15,.9,.25,1)' : 'none',
                }}
              >
                {segments.map((s, i) => (
                  <div key={s._id || i}
                    className="absolute left-1/2 top-1/2 w-[120px] pr-4 text-right text-[12px] font-extrabold text-white"
                    style={{ transformOrigin: '0 0', transform: `rotate(${i * segAngle + segAngle / 2 - 90}deg)`, marginTop: -8 }}>
                    {s.label}
                  </div>
                ))}
              </div>
              <div className="absolute left-1/2 top-1/2 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl shadow-lg">🎯</div>
            </div>

            {/* result / CTA */}
            {result ? (
              <div className="mt-7">
                <div className="text-5xl">{result.rewardType === 'better_luck' ? '😅' : '🎉'}</div>
                <div className="mt-2 font-display text-2xl font-extrabold text-[#0F2545]">
                  {result.rewardType === 'better_luck' ? 'Better luck next time!' : `You won ${result.amount ? `₹${result.amount}` : result.label}!`}
                </div>
                {result.couponCode && (
                  <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-[#1B3B6F] bg-[#EAF0FA] px-4 py-2 font-extrabold tracking-widest text-[#1B3B6F]">
                    <Ticket className="h-4 w-4" /> {result.couponCode}
                  </div>
                )}
                {typeof result.walletBalance === 'number' && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#1BA672]"><Wallet className="h-4 w-4" /> Added to wallet · balance ₹{result.walletBalance.toLocaleString('en-IN')}</p>
                )}
                <button onClick={() => setResult(null)} disabled={totalAvail <= 0}
                  className="mx-auto mt-5 block h-12 w-56 rounded-2xl bg-[#FF6B35] font-extrabold text-white disabled:opacity-50">
                  {totalAvail > 0 ? 'Spin again' : 'Come back tomorrow'}
                </button>
              </div>
            ) : (
              <button onClick={doSpin} disabled={spinning || totalAvail <= 0}
                className="mx-auto mt-8 flex h-13 w-56 items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] py-3.5 font-extrabold tracking-wide text-white shadow-[0_10px_24px_-6px_rgba(255,107,53,.6)] disabled:opacity-60">
                {spinning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {spinning ? 'Spinning…' : totalAvail <= 0 ? 'COME BACK TOMORROW' : 'SPIN NOW'}
              </button>
            )}

            {/* history */}
            {history.length > 0 && (
              <div className="mt-8 text-left">
                <h3 className="mb-2.5 text-base font-extrabold text-[#0F2545]">Recent <span className="text-[#FF6B35]">wins</span></h3>
                <div className="divide-y rounded-2xl border border-slate-100 bg-white shadow-sm">
                  {history.map((h) => (
                    <div key={h._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF1EA]"><Gift className="h-4 w-4 text-[#FF6B35]" /></div>
                      <div className="flex-1">
                        <div className="text-[13px] font-extrabold text-[#0F2545]">{h.segmentLabel}</div>
                        <div className="text-[11px] font-semibold text-slate-400">{new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                      {h.rewardAmount > 0 ? <span className="text-sm font-extrabold text-[#1BA672]">+₹{h.rewardAmount}</span>
                        : h.couponCode ? <span className="rounded-lg bg-[#EAF0FA] px-2 py-1 text-[11px] font-extrabold text-[#1B3B6F]">{h.couponCode}</span>
                        : <span className="text-sm font-bold text-slate-300">—</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  )
}
