'use client'

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadUserRequest } from '@/store/slices/customerAuthSlice'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import Cookies from 'js-cookie'

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.customerAuth)
  const { openLogin } = useLoginModal()

  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated && !loading) dispatch(loadUserRequest())
  }, [])

  // Not logged in (and no token) → open the login modal instead of redirecting.
  useEffect(() => {
    if (!loading && !isAuthenticated && !Cookies.get('customer_token')) openLogin()
  }, [loading, isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8FB] text-center px-6">
        <div className="h-14 w-14 rounded-2xl bg-[#1B3B6F]/[0.08] text-[#1B3B6F] flex items-center justify-center mb-4"><Lock className="h-7 w-7" /></div>
        <h2 className="text-xl font-extrabold text-[#13203A]">Please log in to continue</h2>
        <p className="text-sm text-[#7B8AA3] mt-1.5 max-w-sm">Sign in with your mobile number to access this page.</p>
        <Button onClick={() => openLogin()} className="mt-5 bg-[#1B3B6F] hover:bg-[#152d55] text-white h-11 px-6">Login / Sign up</Button>
      </div>
    )
  }

  return <>{children}</>
}
