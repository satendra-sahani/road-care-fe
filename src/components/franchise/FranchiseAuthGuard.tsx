'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { Loader2 } from 'lucide-react'
import { franchiseAPI } from '@/services/api'
import { FranchiseCtx, type FranchiseMe } from './FranchiseContext'

// Franchise pages need a franchise login (cookie `franchise_token`, role 'franchise').
// Owner-only pages (wallet, team, profile edits) are also re-checked by the API.
const OWNER_ONLY = ['/franchise/wallet', '/franchise/team']

export function FranchiseAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [me, setMe] = useState<FranchiseMe | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'blocked'>('loading')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!Cookies.get('franchise_token')) { router.replace('/franchise/login'); return }
    try {
      const r = await franchiseAPI.me()
      if (r.data?.success) { setMe(r.data.data); setState('ok') } else { setState('blocked'); setMessage(r.data?.message || '') }
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401) return // api interceptor redirects to /franchise/login
      setMessage(e?.response?.data?.message || 'Could not open the franchise dashboard.')
      setState('blocked')
    }
  }, [router])

  useEffect(() => { load() }, [load])

  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#0F2547]"><Loader2 className="h-7 w-7 animate-spin text-white" /></div>
  }
  if (state === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] p-4">
        <div className="max-w-sm rounded-2xl border border-[#E7ECF3] bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-extrabold text-[#13203A]">No access</h2>
          <p className="mt-1.5 text-sm text-[#52667C]">{message || 'This account cannot open the franchise dashboard.'}</p>
          <button onClick={() => { Cookies.remove('franchise_token'); router.replace('/franchise/login') }} className="mt-4 rounded-xl bg-[#0F2547] px-4 py-2.5 text-sm font-bold text-white">Log in with another number</button>
        </div>
      </div>
    )
  }
  if (me && !me.isOwner && OWNER_ONLY.includes(router.pathname)) {
    return (
      <FranchiseCtx.Provider value={{ me, refresh: load }}>
        <div className="p-6"><div className="rounded-2xl border border-[#E7ECF3] bg-white p-6 text-sm text-[#52667C]">Only the franchise owner can open this page.</div></div>
      </FranchiseCtx.Provider>
    )
  }
  return <FranchiseCtx.Provider value={{ me, refresh: load }}>{children}</FranchiseCtx.Provider>
}
