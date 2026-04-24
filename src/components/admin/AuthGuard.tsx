'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { checkAuthRequest } from '@/store/slices/authSlice'
import { Loader2, Wrench } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading, user, initialCheckDone } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Only dispatch auth check if it hasn't been done yet
    if (!initialCheckDone) {
      dispatch(checkAuthRequest())
    }
  }, [dispatch, initialCheckDone])

  useEffect(() => {
    // Only redirect to login after the initial auth check is completed and user is not authenticated
    if (initialCheckDone && !isAuthenticated) {
      router.replace('/admin/login')
      return
    }
    // Admin area requires an admin or superadmin role — reject other roles
    if (initialCheckDone && isAuthenticated && user) {
      const role = (user as any).role
      const allowed = ['admin', 'superadmin', 'super_admin']
      if (role && !allowed.includes(role)) {
        router.replace('/admin/login?error=not_authorized')
      }
    }
  }, [initialCheckDone, isAuthenticated, user, router])

  // Show loading while auth check is in progress
  if (loading || !initialCheckDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-[#FF6B35] rounded-2xl flex items-center justify-center shadow-lg">
          <Wrench className="h-7 w-7 text-white" />
        </div>
        <Loader2 className="h-6 w-6 text-white animate-spin" />
        <p className="text-gray-400 text-sm">Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Block render while we wait for role-based redirect to kick in
  const role = (user as any)?.role
  if (role && !['admin', 'superadmin', 'super_admin'].includes(role)) {
    return null
  }

  return <>{children}</>
}
