'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { authAPI } from '@/services/api'
import Cookies from 'js-cookie'
import { Store, Loader2, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ShopLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await authAPI.login({ email: phone, password })
      const data = res.data?.data || res.data

      if (data?.user?.role !== 'shop') {
        setError('This account is not a shop partner account.')
        setLoading(false)
        return
      }

      const token = data?.token
      if (token) {
        Cookies.set('token', token, { expires: 7 })
        router.push('/shop-partner')
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BharatMechanics</h1>
          <p className="text-gray-400 text-sm mt-1">Shop Partner Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-xl space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Login to manage your shop orders</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone / Email</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Enter phone or email"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF6B35] hover:bg-[#e55a28] text-white py-2.5"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <p className="text-center text-xs text-gray-500">
            Contact admin to create your shop partner account
          </p>
        </form>
      </div>
    </div>
  )
}
