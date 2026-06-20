'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { LoginModal } from './LoginModal'

interface LoginModalCtx {
  openLogin: (onSuccess?: () => void) => void
  closeLogin: () => void
}
const Ctx = createContext<LoginModalCtx>({ openLogin: () => {}, closeLogin: () => {} })
export const useLoginModal = () => useContext(Ctx)

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const cbRef = useRef<(() => void) | null>(null)
  const { isAuthenticated } = useSelector((s: RootState) => s.customerAuth)

  const openLogin = useCallback((onSuccess?: () => void) => {
    if (isAuthenticated) { onSuccess?.(); return }
    cbRef.current = onSuccess || null
    setOpen(true)
  }, [isAuthenticated])

  const closeLogin = useCallback(() => { setOpen(false); cbRef.current = null }, [])

  // When auth succeeds while the modal is open → close it and run the pending action.
  useEffect(() => {
    if (open && isAuthenticated) {
      setOpen(false)
      const cb = cbRef.current
      cbRef.current = null
      if (cb) window.setTimeout(cb, 60)
    }
  }, [isAuthenticated, open])

  return (
    <Ctx.Provider value={{ openLogin, closeLogin }}>
      {children}
      {open && <LoginModal onClose={closeLogin} />}
    </Ctx.Provider>
  )
}
