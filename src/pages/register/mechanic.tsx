import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { partnerRegisterAPI } from '@/services/api'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks'
import {
  MechanicFormFields, emptyMechanicForm, validateMechanicForm, toMechanicPayload, type MechanicFormValues,
} from '@/components/admin/MechanicRegistrationForm'
import { PhoneVerifyStep, RegisterSteps, type VerifiedPhone } from '@/components/partner/PhoneVerifyStep'
import { IcAutorenew, IcCheckCircle, IcChevronRight, IcInfo, IcVerifiedUser } from '@/components/icons/BmIcons'

// Public mechanic self-registration. Creates the same MechanicProfile the admin
// "Mechanic Registration" form creates (source: self, pending verification), so the
// mechanic appears in Admin → Mechanics right away.

export default function MechanicSelfRegister() {
  const [verified, setVerified] = useState<VerifiedPhone | null>(null)
  const [form, setForm] = useState<MechanicFormValues>({ ...emptyMechanicForm })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ name: string } | null>(null)
  // Prefill handed over by the landing-page quick form (sessionStorage, never the URL).
  const [q, setQ] = useState<Record<string, string | undefined>>({})
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bm_partner_prefill_mechanic')
      if (raw) { setQ(JSON.parse(raw)); sessionStorage.removeItem('bm_partner_prefill_mechanic') }
    } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    setForm((f) => ({ ...f, name: f.name || q.name || '', city: f.city || q.city || '' }))
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const onVerified = (v: VerifiedPhone) => {
    setVerified(v)
    setForm((f) => ({ ...f, phone: v.phone, name: f.name || v.existing.name || '' }))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uploader = async (file: File, folder: string) => {
    if (!verified) return undefined
    const r = await partnerRegisterAPI.uploadImage(file, folder, verified.token)
    return r.data?.data?.url as string | undefined
  }

  const submit = async () => {
    if (!verified) return
    const err = validateMechanicForm(form, { requirePayout: false })
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const r = await partnerRegisterAPI.registerMechanic(verified.token, toMechanicPayload(form))
      if (r.data?.success) {
        setDone({ name: form.name.trim() })
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      } else toast.error(r.data?.message || 'Could not complete registration')
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message || 'Could not complete registration'
      toast.error(msg)
      if (status === 401) setVerified(null) // verification expired → verify the number again
    } finally { setSaving(false) }
  }

  const existing = verified?.existing
  const alreadyMechanic = !!existing?.mechanic
  const step: 1 | 2 | 3 = done || alreadyMechanic ? 3 : verified ? 2 : 1

  return (
    <>
      <SEOHead
        title="Mechanic Registration – Join as Partner"
        description="Register as a Bharat Mechanics partner mechanic in Gorakhpur, Deoria, Kushinagar & across UP. Verify your mobile, add your skills and documents, start getting jobs."
        keywords="mechanic registration, mechanic job near me, bike mechanic job Gorakhpur, car mechanic job, join Bharat Mechanics, mechanic partner app, मैकेनिक रजिस्ट्रेशन"
      />
      <UserLayout>
        <div className="min-h-[70vh] bg-[#F5F8FC] pb-16 text-[#0E2B4C]">
          <header className="border-b border-[#E6ECF3] bg-[linear-gradient(180deg,#FFFFFF,#F5F8FC)]">
            <div className="mx-auto max-w-[1000px] px-[clamp(14px,3vw,24px)] pb-7 pt-5">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#52667C]">
                <Link href="/" className="hover:text-[#0E2B4C]">Home</Link><IcChevronRight size={14} />
                <Link href="/become-mechanic" className="hover:text-[#0E2B4C]">Become a Mechanic</Link><IcChevronRight size={14} />
                <span className="text-[#0E2B4C]" aria-current="page">Register</span>
              </nav>
              <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.01em] sm:text-[34px]">Register as a mechanic</h1>
              <p className="mt-2 max-w-[640px] text-[14.5px] leading-relaxed text-[#41586F]">
                Free registration. Verify your number, tell us your skills and upload your documents — our team verifies you and you start receiving jobs in the Bharat Mechanics app.
                <span lang="hi" className="mt-1 block text-[13px] text-[#52667C]">मुफ़्त रजिस्ट्रेशन — मोबाइल नंबर वेरिफाई करें और अपनी जानकारी भरें।</span>
              </p>
              <div className="mt-6"><RegisterSteps step={step} /></div>
            </div>
          </header>

          <div className="mx-auto max-w-[1000px] px-[clamp(14px,3vw,24px)] pt-7">
            {step === 1 && (
              <PhoneVerifyStep initialPhone={q.phone} onVerified={onVerified} loginHint="This number will be your login for the Bharat Mechanics mechanic app. We’ll send a one-time code by SMS." />
            )}

            {step === 3 && (
              <div className="mx-auto max-w-[620px] rounded-2xl border border-[#CDEBD9] bg-white p-6 text-center shadow-[0_16px_40px_-24px_rgba(14,43,76,0.35)] sm:p-8">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E4F5EA] text-[#13864D]"><IcCheckCircle size={34} /></span>
                <h2 className="mt-4 text-[22px] font-bold">
                  {done ? `Thank you, ${done.name.split(' ')[0] || 'partner'}!` : 'You are already registered'}
                </h2>
                <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-relaxed text-[#41586F]">
                  {done || !existing?.mechanic?.isVerified
                    ? <>Your registration is with our team for verification. We’ll call you on <b>+91 {verified?.phone}</b> if anything is missing. Meanwhile, download the app and log in with this number.</>
                    : <>Your mechanic account is verified. Log in to the Bharat Mechanics app with <b>+91 {verified?.phone}</b> to receive jobs.</>}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0E2B4C] px-5 text-[14px] font-semibold text-white hover:bg-[#16406F] hover:text-white">Get it on Google Play</a>
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#D6E2F0] bg-white px-5 text-[14px] font-semibold text-[#0E2B4C] hover:bg-[#F2F6FC]">Download on the App Store</a>
                </div>
                <ul className="mx-auto mt-6 max-w-[440px] space-y-2 text-left text-[13.5px] text-[#41586F]">
                  {['Our team checks your documents (usually within 24–48 hours).', 'Once verified, jobs near you appear in the app.', 'Accept a job, complete it, and get paid to your bank / UPI.'].map((t) => (
                    <li key={t} className="flex gap-2"><IcVerifiedUser size={18} className="mt-0.5 shrink-0 text-[#13864D]" />{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {step === 2 && verified && (
              <div className="space-y-5">
                {existing?.exists && existing.role === 'user' && (
                  <p className="flex gap-2 rounded-xl border border-[#F8D9C4] bg-[#FFF6EF] px-4 py-3 text-[13.5px] text-[#7A3410]">
                    <IcInfo size={18} className="mt-0.5 shrink-0" />
                    This number already has a Bharat Mechanics customer account. Registering will turn it into your mechanic account.
                  </p>
                )}
                <MechanicFormFields value={form} onChange={setForm} showAdmin={false} lockPhone selfMode uploader={uploader} />
                <p className="px-1 text-[12px] leading-snug text-[#52667C] sm:hidden">By registering you agree to our <Link href="/terms" className="font-semibold text-[#1864C8] underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#1864C8] underline">Privacy Policy</Link>.</p>
                <div className="sticky bottom-[68px] z-10 flex items-center gap-3 rounded-2xl border border-[#E6ECF3] bg-white/95 p-2 shadow-[0_12px_30px_-18px_rgba(14,43,76,0.45)] backdrop-blur sm:justify-between sm:p-3 md:bottom-4">
                  <p className="hidden px-1 text-[12px] leading-snug text-[#52667C] sm:block">By registering you agree to our <Link href="/terms" className="font-semibold text-[#1864C8] underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#1864C8] underline">Privacy Policy</Link>.</p>
                  <button type="button" onClick={submit} disabled={saving} className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C94309] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#A93807] disabled:opacity-60 sm:w-auto">
                    {saving && <IcAutorenew size={18} className="animate-spin" />}
                    {saving ? 'Submitting…' : 'Submit registration'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </UserLayout>
    </>
  )
}
