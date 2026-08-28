import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { Phone, Mail, Clock, MapPin, MessageSquare, Wrench, Package, Satellite } from 'lucide-react'

// Public support / help page — also serves as the App Store & Play Store
// "Support URL" target, so keep contact details accurate.
const CHANNELS = [
  { icon: Phone, title: 'Call us', value: '+91 93106 94349', href: 'tel:+919310694349', sub: 'Mon–Sat · 9 AM – 7 PM IST' },
  { icon: Mail, title: 'Email', value: 'bharatmechanics19@gmail.com', href: 'mailto:bharatmechanics19@gmail.com', sub: 'We reply within 24 hours' },
]

const TOPICS = [
  { icon: Wrench, title: 'Service bookings', desc: 'Booking a mechanic, tracking your service, rescheduling or cancelling.' },
  { icon: Package, title: 'Parts orders', desc: 'Order status, delivery, returns and refunds for spare-part orders.' },
  { icon: Satellite, title: 'GPS tracker', desc: 'Device ordering, installation, live tracking and subscription help.' },
  { icon: MessageSquare, title: 'Account & payments', desc: 'Login/OTP issues, wallet, invoices and payment questions.' },
]

export default function SupportPage() {
  return (
    <>
      <SEOHead
        title="Support & Help Center | Bharat Mechanics"
        description="Get help with Bharat Mechanics — service bookings, parts orders, GPS tracker and payments. Call +91 93106 94349 or email bharatmechanics19@gmail.com."
      />
      <UserLayout>
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
          <h1 className="text-3xl font-extrabold text-[#13203A]">Support &amp; Help Center</h1>
          <p className="mt-2 text-[15px] font-medium text-[#5B6B85]">
            We&apos;re here to help with anything — bookings, orders, GPS trackers or your account.
          </p>

          {/* Contact channels */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <a key={c.title} href={c.href}
                className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E7F6F0] text-[#15936B]"><c.icon className="h-5 w-5" /></span>
                <span>
                  <span className="block text-[13px] font-bold uppercase tracking-wide text-[#8A94A6]">{c.title}</span>
                  <span className="block text-[16px] font-extrabold text-[#13203A]">{c.value}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-[#5B6B85]"><Clock className="h-3.5 w-3.5" /> {c.sub}</span>
                </span>
              </a>
            ))}
          </div>

          {/* What we can help with */}
          <h2 className="mt-10 text-xl font-extrabold text-[#13203A]">What can we help you with?</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <div key={t.title} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF1FE] text-[#2563EB]"><t.icon className="h-5 w-5" /></span>
                <p className="mt-3 text-[15px] font-bold text-[#13203A]">{t.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#5B6B85]">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Company */}
          <div className="mt-10 rounded-2xl bg-[#F6F8FB] p-5 text-[13px] font-semibold leading-relaxed text-[#5B6B85]">
            <p className="flex items-center gap-1.5 font-extrabold text-[#13203A]"><MapPin className="h-4 w-4" /> BHARATMECHANICS PRIVATE LIMITED</p>
            <p className="mt-1">For account deletion, privacy or data requests, see our{' '}
              <a href="/privacy" className="font-bold text-[#1B3B6F] underline">Privacy Policy</a> or email us with the subject &quot;Data Request&quot;.
            </p>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
