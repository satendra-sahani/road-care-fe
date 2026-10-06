import { useEffect } from 'react'
import { useRouter } from 'next/router'

// /manager → the field executive app
export default function ManagerIndex() {
  const router = useRouter()
  useEffect(() => { router.replace('/manager/garage') }, [router])
  return null
}
