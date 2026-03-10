'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import {
  IndianRupee, TrendingUp, Clock, CheckCircle, Loader2, Calendar,
  ArrowDownRight, ArrowUpRight, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ShopEarnings() {
  const [data, setData] = useState<any>(null)
  const [settlements, setSettlements] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'settlements'>('overview')

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, settleRes] = await Promise.all([
          shopAPI.getDashboard(),
          shopAPI.getSettlements()
        ])
        if (dashRes.data?.success) setData(dashRes.data.data)
        if (settleRes.data?.success) setSettlements(settleRes.data)
      } catch (err) {
        console.error('Earnings error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  const earnings = data?.earnings || {}
  const summary = settlements?.summary || {}

  const formatCurrency = (val: number) =>
    (val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings & Settlements</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('overview')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium', tab === 'overview' ? 'bg-[#0F2545] text-white' : 'bg-gray-100 text-gray-600')}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('settlements')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium', tab === 'settlements' ? 'bg-[#0F2545] text-white' : 'bg-gray-100 text-gray-600')}
        >
          Settlement History
        </button>
      </div>

      {tab === 'overview' && (
        <>
          {/* Earnings Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-500">Today</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.today?.totalEarning)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.today?.count || 0} jobs</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisWeek?.totalEarning)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.thisWeek?.count || 0} jobs</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs text-gray-500">This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.thisMonth?.totalEarning)}</p>
              <p className="text-xs text-gray-500 mt-1">{earnings.thisMonth?.count || 0} jobs</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs text-gray-500">Pending Settlement</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(earnings.pendingSettlement)}</p>
              <p className="text-xs text-gray-500 mt-1">To be settled</p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(earnings.totalEarnings)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Settled Amount</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.settled?.total)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-600 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(summary.pendingSettlement)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'settlements' && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Settlement History</h2>
            <p className="text-sm text-gray-500">Completed jobs and their settlement status</p>
          </div>

          {!settlements?.data?.length ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No settlements yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {settlements.data.map((item: any) => (
                <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.orderId}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Completed: {new Date(item.completedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.shopEarning)}</p>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        item.settlementStatus === 'settled'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      )}>
                        {item.settlementStatus === 'settled' ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Commission: {formatCurrency(item.commissionAmount)} | Total: {formatCurrency(item.finalCost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
