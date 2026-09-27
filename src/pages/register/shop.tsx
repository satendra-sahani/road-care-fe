import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { partnerRegisterAPI } from '@/services/api'
import { ShopFormFields, emptyShopForm, validateShopForm, toShopPayload, type ShopFormValues } from '@/components/admin/ShopRegistrationForm'
import { PhoneVerifyStep, RegisterSteps, type VerifiedPhone } from '@/components/partner/PhoneVerifyStep'
import { PartnerPlanTerms } from '@/components/partner/PartnerPlanTerms'
import { IcAutorenew, IcCheckCircle, IcChevronRight, IcInfo, IcVerifiedUser, IcStore } from '@/components/icons/BmIcons'

// Public shop-partner self-registration. Creates the same ShopPartner (+ owner
// account, + optional owner-mechanic) the admin "Mechanic Shop Registration" form
// creates — source: self, KYC pending — so it appears in Admin → Shop Partners.

export default function ShopSelfRegister() {
  const [verified, setVerified] = useState<VerifiedPhone | null>(null)
  const [form, setForm] = useState<ShopFormValues>({ ...emptyShopForm })
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState('standard')
  const [termsOk, setTermsOk] = useState(false)
  const [done, setDone] = useState<{ shopName: string } | null>(null)
  // Prefill handed over by the landing-page quick form (sessionStorage, never the URL).
  const [q, setQ] = useState<Record<string, string | undefined>>({})
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bm_partner_prefill_shop')
      if (raw) { setQ(JSON.parse(raw)); sessionStorage.removeItem('bm_partner_prefill_shop') }
    } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    setForm((f) => ({
      ...f,
      shopName: f.shopName || q.shop || '',
      ownerName: f.ownerName || q.owner || '',
      city: f.city || q.city || '',
      gstNumber: f.gstNumber || (q.gst || '').toUpperCase(),
    }))
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const onVerified = (v: VerifiedPhone) => {
    setVerified(v)
    setForm((f) => ({ ...f, ownerPhone: v.phone, ownerName: f.ownerName || v.existing.name || '' }))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const uploader = async (file: File, folder: string) => {
    if (!verified) return undefined
    const r = await partnerRegisterAPI.uploadImage(file, folder, verified.token)
    return r.data?.data?.url as string | undefined
  }

  const submit = async () => {
    if (!verified) return
    const err = validateShopForm({ ...form, walletAccepted: termsOk }, 'self')
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const r = await partnerRegisterAPI.registerShop(verified.token, { ...toShopPayload(form), walletAccepted: termsOk, plan, termsAccepted: true })
      if (r.data?.success) {
        setDone({ shopName: form.shopName.trim() })
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      } else toast.error(r.data?.message || 'Could not register your shop')
    } catch (e: any) {
      const status = e?.response?.status
      toast.error(e?.response?.data?.message || 'Could not register your shop')
      if (status === 401) setVerified(null)
    } finally { setSaving(false) }
  }

  const existing = verified?.existing
  const alreadyShop = !!existing?.shop
  const step: 1 | 2 | 3 = done || alreadyShop ? 3 : verified ? 2 : 1

  return (
    <>
      <SEOHead
        title="Register Your Workshop – Shop Partner"
        description="Register your garage or auto workshop as a Bharat Mechanics shop partner in Gorakhpur, Deoria, Kushinagar & across UP. Get doorstep jobs near you. Free signup."
        keywords="register garage online, workshop partner, mechanic shop registration, list my garage, auto workshop jobs Gorakhpur, Bharat Mechanics shop partner, गैराज रजिस्ट्रेशन"
      />
      <UserLayout>
        <div className="min-h-[70vh] bg-[#F5F8FC] pb-16 text-[#0E2B4C]">
          <header className="border-b border-[#E6ECF3] bg-[linear-gradient(180deg,#FFFFFF,#F5F8FC)]">
            <div className="mx-auto max-w-[1000px] px-[clamp(14px,3vw,24px)] pb-7 pt-5">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12.5px] text-[#52667C]">
                <Link href="/" className="hover:text-[#0E2B4C]">Home</Link><IcChevronRight size={14} />
                <Link href="/list-your-shop" className="hover:text-[#0E2B4C]">For Shops</Link><IcChevronRight size={14} />
                <span className="text-[#0E2B4C]" aria-current="page">Register</span>
              </nav>
              <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.01em] sm:text-[34px]">Register your shop</h1>
              <p className="mt-2 max-w-[660px] text-[14.5px] leading-relaxed text-[#41586F]">
                Join the Bharat Mechanics partner network for free. Verify your number, add your shop, KYC and bank details — once our team verifies you, jobs near your shop are routed to you.
                <span lang="hi" className="mt-1 block text-[13px] text-[#52667C]">अपनी दुकान / गैराज मुफ़्त में रजिस्टर करें।</span>
              </p>
              <div className="mt-6"><RegisterSteps step={step} /></div>
            </div>
          </header>

          <div className="mx-auto max-w-[1000px] px-[clamp(14px,3vw,24px)] pt-7">
            {step === 1 && (
              <PhoneVerifyStep initialPhone={q.phone} onVerified={onVerified} loginHint="Use the shop owner’s mobile number — it becomes the login for your Shop Partner panel. We’ll send a one-time code by SMS." />
            )}

            {step === 3 && (
              <div className="mx-auto max-w-[620px] rounded-2xl border border-[#CDEBD9] bg-white p-6 text-center shadow-[0_16px_40px_-24px_rgba(14,43,76,0.35)] sm:p-8">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E4F5EA] text-[#13864D]"><IcCheckCircle size={34} /></span>
                <h2 className="mt-4 text-[22px] font-bold">{done ? `${done.shopName} is registered!` : 'Your shop is already registered'}</h2>
                <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-relaxed text-[#41586F]">
                  {done || !existing?.shop?.isVerified
                    ? <>Your KYC is with our team for verification. You can already log in to the Shop Partner panel with <b>+91 {verified?.phone}</b> to top up your wallet and complete your profile.</>
                    : <>{existing?.shop?.shopName || 'Your shop'} is verified. Log in to the Shop Partner panel with <b>+91 {verified?.phone}</b>.</>}
                </p>
                <Link href="/shop-partner/login" className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#C94309] px-6 text-[15px] font-semibold text-white hover:bg-[#A93807] hover:text-white">
                  <IcStore size={18} /> Open Shop Partner panel
                </Link>
                <ul className="mx-auto mt-6 max-w-[440px] space-y-2 text-left text-[13.5px] text-[#41586F]">
                  {['Our team verifies your shop and KYC (usually within 24–48 hours).', 'Keep the minimum wallet balance to start receiving jobs.', 'Jobs near your shop are routed to you — assign them to your mechanics.'].map((t) => (
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
                    This number already has a Bharat Mechanics customer account. Registering will turn it into your Shop Partner login.
                  </p>
                )}
                <ShopFormFields form={form} setForm={setForm} mode="self" uploader={uploader} lockOwnerPhone />
                <PartnerPlanTerms plan={plan} onPlanChange={setPlan} accepted={termsOk} onAcceptedChange={setTermsOk} who="shop" name={form.ownerName.trim() || undefined} />
                <p className="px-1 text-[12px] leading-snug text-[#52667C] sm:hidden">By registering you agree to our <Link href="/terms" className="font-semibold text-[#1864C8] underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#1864C8] underline">Privacy Policy</Link>.</p>
                <div className="sticky bottom-[68px] z-10 flex items-center gap-3 rounded-2xl border border-[#E6ECF3] bg-white/95 p-2 shadow-[0_12px_30px_-18px_rgba(14,43,76,0.45)] backdrop-blur sm:justify-between sm:p-3 md:bottom-4">
                  <p className="hidden px-1 text-[12px] leading-snug text-[#52667C] sm:block">By registering you agree to our <Link href="/terms" className="font-semibold text-[#1864C8] underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#1864C8] underline">Privacy Policy</Link>.</p>
                  <button type="button" onClick={submit} disabled={saving} className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C94309] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#A93807] disabled:opacity-60 sm:w-auto">
                    {saving && <IcAutorenew size={18} className="animate-spin" />}
                    {saving ? 'Submitting…' : 'Register my shop'}
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
