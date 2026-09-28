'use client'

import { createContext, useContext } from 'react'

export type FranchiseMe = {
  user: { _id: string; fullName?: string; phone?: string; email?: string; franchiseRole: 'owner' | 'staff' }
  franchise: {
    _id: string; name: string; code?: string; city?: string; area?: string; address?: string; pincode?: string
    email?: string; phone?: string; ownerName?: string; earningPct: number; isActive: boolean
    payout?: { method?: 'upi' | 'bank'; upiId?: string; accountHolderName?: string; accountNumber?: string; ifsc?: string; bankName?: string }
  }
  isOwner: boolean
}

export const FranchiseCtx = createContext<{ me: FranchiseMe | null; refresh: () => Promise<void> }>({ me: null, refresh: async () => {} })
export const useFranchise = () => useContext(FranchiseCtx)
