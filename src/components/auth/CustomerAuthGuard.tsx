'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { loadUserRequest } from '@/store/slices/customerAuthSlice'
import Cookies from 'js-cookie'

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.customerAuth)

  useEffect(() => {
    const token = Cookies.get('customer_token')
    if (token && !isAuthenticated && !loading) {
      dispatch(loadUserRequest())
    } else if (!token) {
      router.replace('/login?redirect=' + encodeURIComponent(router.asPath))
    }
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated && !Cookies.get('customer_token')) {
      router.replace('/login?redirect=' + encodeURIComponent(router.asPath))
    }
  }, [loading, isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
