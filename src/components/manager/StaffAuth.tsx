'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { garageFieldAPI } from '@/services/api'
import { getTarget, saveTarget, setStaffScope } from './staff'

// The field-staff app (/manager/*) needs a field-staff login: cookie `staff_token`,
// role 'field_staff'. Accounts are created by the admin (/admin/garages → Field
// Staff); there is no self sign-up. Not logged in → /manager/login.
export type StaffMe = { id: string; name: string; phone: string }
type Ctx = { me: StaffMe; target: number; setTarget: (n: number) => void; logout: () => void }
const NOBODY: StaffMe = { id: '', name: '', phone: '' }
const StaffCtx = createContext<Ctx>({ me: NOBODY, target: 5, setTarget: () => {}, logout: () => {} })
export const useStaff = () => useContext(StaffCtx)

export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [me, setMe] = useState<StaffMe | null>(null)
  const [target, setT] = useState(5)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  // useRouter() hands back a new object as the route settles; going through a ref
  // keeps `load` stable so the profile is checked once, not on every route event
  // (re-checking unmounted the page underneath the user and lost form state).
  const routerRef = useRef(router)
  routerRef.current = router
  const logout = useCallback(() => { Cookies.remove('staff_token'); routerRef.current.replace('/manager/login') }, [])
  const load = useCallback(async () => {
    if (!Cookies.get('staff_token')) { routerRef.current.replace('/manager/login'); return }
    setState((s) => (s === 'ok' ? s : 'loading'))
    try {
      const r = await garageFieldAPI.me()
      const d = r.data?.data
      if (!d?.id) throw new Error('no profile')
      setStaffScope(String(d.id))
      setT(getTarget())
      setMe({ id: String(d.id), name: d.name || 'Staff', phone: d.phone || '' })
      setState('ok')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401) return // the api interceptor clears the cookie and goes to /manager/login
      if (status === 403) { logout(); return } // logged in, but not a field-staff account
      setState('error')
    }
  }, [logout])
  useEffect(() => { load() }, [load])

  if (state === 'error') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#F6F8FC] p-6 text-center">
        <b className="text-[16px] text-[#13203A]">Could not open the app</b>
        <p className="text-[13.5px] text-[#64748B]">Check your internet and try again.</p>
        <button type="button" onClick={load} className="h-11 rounded-xl bg-[#1B3B6F] px-6 text-[14px] font-bold text-white">Try again</button>
      </div>
    )
  }
  if (state === 'loading' || !me) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FC]"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#1B3B6F] border-t-transparent" /></div>
  }
  return <StaffCtx.Provider value={{ me, target, setTarget: (n) => { saveTarget(n); setT(getTarget()) }, logout }}>{children}</StaffCtx.Provider>
}
