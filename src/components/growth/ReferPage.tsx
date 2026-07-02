'use client'

// Refer & Earn — web port of the app screen, backed by the same APIs
// (/user/referral/me, /user/referral/list).
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserLayout } from '@/components/layout/UserLayout'
import { userReferralAPI } from '@/services/api'
import { Copy, Send, Loader2, CheckCircle2, Clock, XCircle, UserPlus } from 'lucide-react'

interface ReferralMe {
  code: string
  shareUrl?: string
  shareMessage?: string
  rewardPerReferral: number
  stats: { totalInvited: number; pendingCount: number; rewardedCount: number; totalEarned: number }
}
interface Referee {
  _id: string
  status: 'pending' | 'rewarded' | 'rejected' | 'expired'
  referee?: { fullName?: string; phone?: string }
  rewardAmount?: number
  createdAt: string
}

const STATUS: Record<string, { label: string; cls: string; icon: any }> = {
  rewarded: { label: 'Rewarded', cls: 'bg-[#E6F7F0] text-[#1BA672]', icon: CheckCircle2 },
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-600', icon: Clock },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-500', icon: XCircle },
  expired: { label: 'Expired', cls: 'bg-slate-100 text-slate-400', icon: XCircle },
}

export function ReferPage() {
  const [me, setMe] = useState<ReferralMe | null>(null)
  const [list, setList] = useState<Referee[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([
        userReferralAPI.getMine(),
        userReferralAPI.getList({ page: 1, limit: 50 }).catch(() => null),
      ])
      if (m.data?.success) setMe(m.data.data)
      if (l?.data?.success) setList(l.data.data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not load referrals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const reward = me?.rewardPerReferral ?? 0
  const pendingAmount = (me?.stats.pendingCount ?? 0) * reward

  const copyCode = async () => {
    if (!me?.code) return
    try { await navigator.clipboard.writeText(me.code); toast.success(`Code ${me.code} copied`) }
    catch { toast.error('Could not copy — long-press to copy manually') }
  }

  const share = async () => {
    if (!me?.code) return
    const msg = me.shareMessage ||
      `Join me on Bharat Mechanics! Use my referral code ${me.code} when signing up and we both earn ₹${reward}.${me.shareUrl ? '\n' + me.shareUrl : ''}`
    try {
      if (navigator.share) await navigator.share({ title: 'Bharat Mechanics', text: msg, url: me.shareUrl })
      else { await navigator.clipboard.writeText(msg); toast.success('Invite message copied') }
    } catch { /* user dismissed the share sheet */ }
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-md px-4 pb-10" style={{ background: 'linear-gradient(180deg,#E6F6F8,#F4F6FB 70%)' }}>
        <div className="pt-5">
          <h1 className="font-display text-2xl font-extrabold text-[#0F2545]">Refer &amp; Earn</h1>
          <p className="text-[12.5px] font-semibold text-slate-500">Invite friends &amp; earn ₹{reward} per friend</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" /></div>
        ) : (
          <>
            {/* hero */}
            <div className="mt-4 text-center">
              <div className="text-6xl">🎁</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0F2545]">Give ₹{reward}, Get ₹{reward}</h2>
              <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-600">
                दोस्तों को बुलाओ · Invite friends to Bharat Mechanics. They get ₹{reward} off, you earn ₹{reward}.
              </p>
            </div>

            {/* stats */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                [`₹${me?.stats.totalEarned ?? 0}`, 'Total earned'],
                [String(me?.stats.totalInvited ?? 0), 'Friends joined'],
                [`₹${pendingAmount}`, 'Pending'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-slate-100 bg-white py-3 text-center shadow-sm">
                  <div className="font-display text-lg font-extrabold text-[#1B3B6F]">{v}</div>
                  <div className="text-[11px] font-bold text-slate-500">{l}</div>
                </div>
              ))}
            </div>

            {/* code card */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-extrabold tracking-wide text-slate-400">YOUR REFERRAL CODE</div>
              <div className="mt-2 flex gap-2.5">
                <div className="flex-1 rounded-xl border-2 border-dashed border-[#1B3B6F] bg-[#EAF0FA] py-3 text-center text-xl font-black tracking-[0.25em] text-[#1B3B6F]">
                  {me?.code || '—'}
                </div>
                <button onClick={copyCode} className="grid w-13 w-[52px] place-items-center rounded-xl bg-[#EAF0FA] text-[#1B3B6F]">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <button onClick={share}
                className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] font-extrabold text-white">
                <Send className="h-[18px] w-[18px]" /> Share invite link
              </button>
            </div>

            {/* how it works */}
            <h3 className="mb-2.5 mt-6 text-base font-extrabold text-[#0F2545]">How it <span className="text-[#FF6B35]">works</span></h3>
            <div className="divide-y rounded-2xl border border-slate-100 bg-white px-4 shadow-sm">
              {[
                ['1', 'Share your code', 'Send to friends via WhatsApp'],
                ['2', 'They book or shop', `Friend gets ₹${reward} off first order`],
                ['3', `You earn ₹${reward}`, 'Credited to wallet after completion'],
              ].map(([n, t, s]) => (
                <div key={n} className="flex items-center gap-3.5 py-3.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FF6B35] text-sm font-black text-white">{n}</div>
                  <div><div className="text-sm font-extrabold text-[#0F2545]">{t}</div><div className="text-xs font-semibold text-slate-500">{s}</div></div>
                </div>
              ))}
            </div>

            {/* invites */}
            <h3 className="mb-2.5 mt-6 text-base font-extrabold text-[#0F2545]">Your <span className="text-[#FF6B35]">invites</span></h3>
            {list.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <UserPlus className="mx-auto h-9 w-9 text-slate-300" />
                <div className="mt-2 text-sm font-extrabold text-[#0F2545]">No invites yet</div>
                <div className="text-xs font-semibold text-slate-500">Share your code and start earning</div>
              </div>
            ) : (
              <div className="divide-y rounded-2xl border border-slate-100 bg-white shadow-sm">
                {list.map((r) => {
                  const s = STATUS[r.status] || STATUS.pending
                  const SIcon = s.icon
                  return (
                    <div key={r._id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${s.cls}`}><SIcon className="h-4 w-4" /></div>
                      <div className="flex-1">
                        <div className="text-[13px] font-extrabold text-[#0F2545]">{r.referee?.fullName || 'New user'}</div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${s.cls}`}>{s.label}</span>
                        {r.rewardAmount ? <div className="mt-1 text-xs font-extrabold text-[#1BA672]">+₹{r.rewardAmount}</div> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  )
}
