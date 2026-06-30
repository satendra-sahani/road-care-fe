'use client'

// Edit Profile — redesigned per the customer-app prototype: navy gradient
// header band, avatar overlapping the band with working photo upload (file
// input → live preview), and Zepto-style fields. Persists to the prototype's
// `bmc_profile` localStorage key, prefilled from the customer auth user.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { toast } from 'sonner'
import { ChevronLeft, Camera, Check } from 'lucide-react'

interface ProfileData { avatar: string; name: string; email: string; gender: string; dob: string }
const KEY = 'bmc_profile'

const loadProfile = (): Partial<ProfileData> => {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function EditProfilePage() {
  const router = useRouter()
  const user = useSelector((s: RootState) => (s as any).customerAuth?.user)
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')

  // hydrate from localStorage first, then fall back to the logged-in user
  useEffect(() => {
    const saved = loadProfile()
    setAvatar(saved.avatar || user?.profileImage || '')
    setName(saved.name || user?.fullName || '')
    setEmail(saved.email || user?.email || '')
    setGender(saved.gender || '')
    setDob(saved.dob || '')
  }, [user])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setAvatar(String(r.result))
    r.readAsDataURL(f)
  }

  const save = () => {
    if (name.trim().length < 2) { toast.error('Please enter your name'); return }
    const data: ProfileData = { avatar, name: name.trim(), email: email.trim(), gender, dob }
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
    toast.success('Profile updated')
    router.push('/profile')
  }

  const fieldCls = 'h-[50px] w-full rounded-[13px] border-[1.5px] border-slate-200 bg-white px-3.5 text-[14.5px] font-bold text-[#0F2545] outline-none focus:border-[#1B3B6F]'
  const labelCls = 'mb-[7px] ml-0.5 block text-xs font-extrabold tracking-wide text-slate-600'

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <div className="mx-auto max-w-md">
        {/* navy header band */}
        <div className="relative pb-14 text-white" style={{ background: 'linear-gradient(165deg,#142C52,#24508C)' }}>
          <div className="flex items-center gap-3 px-4 pt-5">
            <button onClick={() => router.back()} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/15">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="font-display text-xl font-extrabold">Edit Profile</div>
              <div className="text-[11.5px] font-bold text-white/70">Keep your details up to date</div>
            </div>
          </div>

          {/* avatar overlapping the band */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative h-24 w-24">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[30px] border-4 border-[#F4F6FB] bg-[#EAF0FA] text-4xl">
                {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : '🧑'}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-[34px] w-[34px] place-items-center rounded-full border-[3px] border-[#F4F6FB] bg-[#FF6B35] text-white">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
            </div>
          </div>
        </div>

        {/* fields */}
        <div className="px-4 pb-10 pt-16">
          <label className={labelCls}>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={`${fieldCls} mb-4`} />

          <label className={labelCls}>Email address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" className={`${fieldCls} mb-4`} />

          <label className={labelCls}>Gender</label>
          <div className="mb-4 flex gap-2.5">
            {['Male', 'Female', 'Other'].map((g) => {
              const on = gender === g
              return (
                <button key={g} onClick={() => setGender(g)}
                  className={`h-[46px] flex-1 rounded-[13px] text-[13.5px] font-bold ${on ? 'border-2 border-[#1B3B6F] bg-[#EAF0FA] text-[#1B3B6F]' : 'border-[1.5px] border-slate-200 bg-white text-slate-500'}`}>
                  {g}
                </button>
              )
            })}
          </div>

          <label className={labelCls}>Date of birth</label>
          <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" className={`${fieldCls} mb-6 ${dob ? 'text-[#0F2545]' : 'text-slate-400'}`} />

          <button onClick={save}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3B6F] text-[15px] font-bold text-white transition hover:bg-[#16315c]">
            <Check className="h-[18px] w-[18px]" /> Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
