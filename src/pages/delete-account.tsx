import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  Trash2, Smartphone, Mail, ShieldCheck, Clock, FileText, AlertTriangle,
} from 'lucide-react'

const LAST_UPDATED = 'April 2026'
const SUPPORT_EMAIL = 'support@bharatmechanics.com'
const GRIEVANCE_EMAIL = 'grievance@bharatmechanics.com'

export default function DeleteAccountPage() {
  return (
    <>
      <SEOHead
        title="Delete Your Account"
        description="Request deletion of your Bharat Mechanics account and associated data — in-app or via email. What gets deleted, what we retain under Indian law, and processing timelines."
        keywords="delete account, data deletion, Bharat Mechanics, account removal, DPDPA, Play Store"
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <Trash2 className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">
                    Delete Your Account
                  </h1>
                  <p className="text-xs md:text-sm text-white/75 mt-0.5">
                    Last updated: {LAST_UPDATED}
                  </p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
                You can request deletion of your <strong>Bharat Mechanics</strong> account
                (app package <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">com.bharatmechanics.app</code>)
                and all associated personal data at any time, free of cost. This page explains how to request deletion,
                what data we delete, what we are legally required to retain, and how long the process takes.
              </p>
            </div>
          </div>

          <article className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">

            {/* 1. How to request deletion */}
            <Section id="1" title="1. How to Request Deletion" accent>
              <p>You can delete your account in either of two ways — choose whichever is more convenient.</p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A — In app */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4 text-[#1B3B6F]" />
                    <h3 className="font-semibold text-[#1A1D29] text-sm md:text-base">
                      Option A — In the Bharat Mechanics app
                    </h3>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[13.5px]">
                    <li>Open the Bharat Mechanics app and sign in with your registered mobile number.</li>
                    <li>Go to <strong>Profile → Settings → Delete Account</strong>.</li>
                    <li>Confirm your choice. A confirmation email / SMS will be sent to you.</li>
                    <li>Your account and associated data will be deleted within the timelines below.</li>
                  </ol>
                </div>

                {/* Option B — Email */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-[#1B3B6F]" />
                    <h3 className="font-semibold text-[#1A1D29] text-sm md:text-base">
                      Option B — By email
                    </h3>
                  </div>
                  <p className="text-[13.5px]">
                    Email us from your registered email <em>or</em> include your registered 10-digit mobile number in the message:
                  </p>
                  <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-[13px] space-y-1">
                    <p><strong>To:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1B3B6F] underline">{SUPPORT_EMAIL}</a></p>
                    <p><strong>Subject:</strong> Delete my Bharat Mechanics account</p>
                    <p><strong>Body must include:</strong> your registered 10-digit mobile number.</p>
                  </div>
                  <p className="mt-2 text-[12.5px] text-gray-600">
                    We verify ownership via OTP before processing emailed requests.
                  </p>
                </div>
              </div>
            </Section>

            {/* 2. What we delete */}
            <Section id="2" title="2. What We Delete">
              <p>Once your request is verified, the following data is permanently removed from our production systems:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Profile — full name, email, phone number, profile photo, date of birth, language preference.</li>
                <li>Saved addresses, saved vehicles (make / model / RC number) and their photos.</li>
                <li>KYC documents you uploaded (Aadhaar / PAN / DL / GSTIN copies).</li>
                <li>Wallet balance (after any pending refunds to the original payment instrument are processed).</li>
                <li>Referral history, reward points and spin-to-win entries.</li>
                <li>Notification preferences and FCM device tokens.</li>
                <li>Service requests, booking notes, chat / call history with mechanics, delivery partners and shops.</li>
                <li>Vehicle photos and damage photos you uploaded.</li>
                <li>Ratings and reviews you posted (personal identifiers removed; the rating itself may be retained in aggregate form).</li>
              </ul>
            </Section>

            {/* 3. What we retain */}
            <Section id="3" title="3. What We Retain (and Why)">
              <p className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  A limited set of data is retained even after account deletion, strictly to comply with Indian law.
                  None of this retained data is used to market to you or rebuild your profile.
                </span>
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-3">
                <li>
                  <strong>Invoices and tax records</strong> — retained for at least 8 years as mandated by the
                  CGST Act, 2017 and the Income Tax Act, 1961.
                </li>
                <li>
                  <strong>Payment transaction logs</strong> — retained as required by RBI norms and payment-gateway
                  agreements (typically up to 10 years from the transaction date).
                </li>
                <li>
                  <strong>Fraud / chargeback records</strong> — retained to protect the platform and other users from
                  recurring fraud.
                </li>
                <li>
                  <strong>Aggregated, anonymised analytics</strong> — retained indefinitely but no longer linked to
                  your identity and cannot be used to re-identify you.
                </li>
                <li>
                  <strong>Legal / regulatory holds</strong> — any data specifically requested by a law-enforcement
                  agency under a valid written notice is preserved for the duration of that notice.
                </li>
              </ul>
            </Section>

            {/* 4. Timeline */}
            <Section id="4" title="4. Processing Timeline">
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                  <span><strong>Acknowledgement:</strong> within 24 hours of your request.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                  <span><strong>Verification:</strong> we confirm you own the account via OTP to your registered mobile / email.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                  <span><strong>Deletion:</strong> completed within <strong>30 days</strong> of successful verification.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                  <span><strong>Confirmation:</strong> final email / SMS sent to you when deletion is complete.</span>
                </p>
              </div>
            </Section>

            {/* 5. Before you delete */}
            <Section id="5" title="5. Before You Delete — Please Note">
              <ul className="list-disc pl-5 space-y-1.5">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#FF6B35]" />
                  <span>Deletion is <strong>permanent</strong>. Your account cannot be restored once deletion is complete.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#FF6B35]" />
                  <span>Please <strong>withdraw any wallet balance</strong> or redeem pending refunds before requesting deletion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#FF6B35]" />
                  <span>If you have <strong>active service requests or pending orders</strong>, please complete or cancel them first — deleting mid-service may affect the other party.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#FF6B35]" />
                  <span>After deletion, you will need to <strong>re-register</strong> if you wish to use Bharat Mechanics again. Referral codes and reward points are <em>not</em> carried over.</span>
                </li>
              </ul>
            </Section>

            {/* 6. Privacy + security */}
            <Section id="6" title="6. Privacy &amp; Security">
              <p className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  All deletion requests are handled in line with our{' '}
                  <Link href="/privacy" className="text-[#1B3B6F] underline">Privacy Policy</Link>{' '}
                  and the Digital Personal Data Protection Act, 2023 (DPDPA). Data on our servers is encrypted at
                  rest and in transit (TLS 1.2+). Backups that contain your data are purged on our standard backup
                  rotation (up to 35 days after the primary deletion).
                </span>
              </p>
            </Section>

            {/* 7. Contact */}
            <Section id="7" title="7. Questions or Escalations">
              <p>If you did not receive an acknowledgement, or you wish to escalate a deletion request, contact:</p>
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm space-y-1">
                <p><strong>Support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1B3B6F] underline">{SUPPORT_EMAIL}</a></p>
                <p><strong>Grievance Officer:</strong> <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-[#1B3B6F] underline">{GRIEVANCE_EMAIL}</a></p>
                <p><strong>Response time:</strong> Acknowledgement within 24 hours, resolution within 15 days.</p>
              </div>
            </Section>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link href="/privacy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/refund-policy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Refund Policy
              </Link>
            </div>
          </article>
        </div>
      </UserLayout>
    </>
  )
}

function Section({
  id, title, accent = false, children,
}: { id: string; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl border ${accent ? 'border-[#FF6B35]/30 bg-white' : 'border-gray-200 bg-white'} p-4 md:p-6 shadow-sm`}>
      <h2 className="text-base md:text-lg font-bold text-[#1A1D29] tracking-tight mb-2 md:mb-3">{title}</h2>
      <div className="prose prose-sm max-w-none text-[13.5px] md:text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
