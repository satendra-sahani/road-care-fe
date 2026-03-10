'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { authAPI } from '@/services/api'
import { Loader2, Store } from 'lucide-react'

interface ShopAuthGuardProps {
  children: React.ReactNode
}

export function ShopAuthGuard({ children }: ShopAuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token') || Cookies.get('customer_token')
      if (!token) {
        router.replace('/shop-partner/login')
        return
      }

      try {
        const res = await authAPI.getProfile()
        const user = res.data?.data || res.data?.user || res.data
        if (user?.role === 'shop') {
          setAuthenticated(true)
        } else {
          router.replace('/shop-partner/login')
        }
      } catch {
        Cookies.remove('token')
        router.replace('/shop-partner/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-[#FF6B35] rounded-2xl flex items-center justify-center shadow-lg">
          <Store className="h-7 w-7 text-white" />
        </div>
        <Loader2 className="h-6 w-6 text-white animate-spin" />
        <p className="text-gray-400 text-sm">Verifying shop partner access...</p>
      </div>
    )
  }

  if (!authenticated) return null

  return <>{children}</>
}
