'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { authAPI } from '@/services/api'
import { Loader2, Store, Lock, Eye, EyeOff, User } from 'lucide-react'

const DIST = '#D97706'

export function ShopAuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  // login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const check = async () => {
    const token = Cookies.get('token')
    if (!token) { setAuthed(false); setLoading(false); return }
    try {
      const res = await authAPI.getProfile()
      const user = res.data?.data || res.data?.user || res.data
      setAuthed(user?.role === 'shop')
    } catch { setAuthed(false) } finally { setLoading(false) }
  }
  useEffect(() => { check() /* eslint-disable-next-line */ }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const res = await authAPI.login({ email, password })
      const data = res.data?.data || res.data
      if (data?.user?.role !== 'shop') { setError('This account is not a shop partner account.'); setSubmitting(false); return }
      if (data?.token) { Cookies.set('token', data.token, { expires: 7 }); setAuthed(true) }
      else setError('Login failed. Please try again.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F2547' }}>
        <Loader2 className="h-7 w-7 text-white animate-spin" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: '#F6F8FB' }}>
        {/* Blurred dashboard behind the popup */}
        <div className="absolute inset-0 blur-[6px] pointer-events-none select-none" aria-hidden>
          <div className="flex min-h-screen">
            <div className="w-[262px] shrink-0" style={{ background: '#0F2547' }} />
            <div className="flex-1 p-6">
              <div className="h-[70px] bg-white border-b border-[#E7ECF3] -mx-6 -mt-6 mb-6" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-[#E7ECF3]" />)}</div>
              <div className="h-64 bg-white rounded-2xl border border-[#E7ECF3] mb-4" />
              <div className="h-40 bg-white rounded-2xl border border-[#E7ECF3]" />
            </div>
          </div>
        </div>

        {/* Login popup */}
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4" style={{ background: 'rgba(15,37,71,0.30)' }}>
          <form onSubmit={login} className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="text-center pt-7 pb-4 px-6 border-b border-[#EEF1F6]">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: DIST }}><Store className="h-7 w-7 text-white" /></div>
              <h2 className="text-lg font-extrabold text-[#13203A]">Shop Partner Login</h2>
              <p className="text-[13px] text-[#7B8AA3] mt-0.5">Sign in to manage your shop</p>
            </div>
            <div className="p-6 space-y-3">
              {error && <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-lg border border-red-200">{error}</div>}
              <div>
                <label className="text-[12px] font-bold text-[#7B8AA3] mb-1.5 block">Email or phone</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7B8AA3]" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter email or phone" className="w-full h-11 pl-10 pr-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#7B8AA3] mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7B8AA3]" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" className="w-full h-11 pl-10 pr-10 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8AA3] hover:text-[#475569]">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: DIST }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{submitting ? 'Logging in…' : 'Login'}
              </button>
              <p className="text-center text-[11.5px] text-[#7B8AA3]">Contact admin to create your shop partner account</p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
