import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { FileText, ShieldAlert, Scale, Gavel } from 'lucide-react'

const LAST_UPDATED = 'April 2026'

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms & Conditions"
        description="Terms & Conditions of Bharat Mechanics — rules for using the platform, customer obligations, KYC documents, registration fees, fraud liability and legal action."
        keywords="terms and conditions, bharat mechanics terms, legal, fraud action, KYC, service agreement"
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <FileText className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">Terms &amp; Conditions</h1>
                  <p className="text-xs md:text-sm text-white/75 mt-0.5">Last updated: {LAST_UPDATED}</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
                These Terms govern your use of Bharat Mechanics (&quot;Platform&quot;), operated within India.
                By creating an account, placing an order, or booking a service, you accept these Terms in full.
                Please read carefully.
              </p>
            </div>
          </div>

          {/* Body */}
          <article className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">

            {/* 1. Acceptance */}
            <Section id="1-acceptance" title="1. Acceptance of Terms">
              <p>
                By accessing or using Bharat Mechanics (website, Android app, or any related service),
                you confirm that you have read, understood and agreed to be bound by these Terms,
                our <Link href="/privacy" className="text-[#1B3B6F] font-semibold underline">Privacy Policy</Link>, and
                our <Link href="/refund-policy" className="text-[#1B3B6F] font-semibold underline">Refund Policy</Link>.
                If you do not agree, you must not use the Platform.
              </p>
            </Section>

            {/* 2. Eligibility */}
            <Section id="2-eligibility" title="2. Eligibility">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You must be at least 18 years of age and legally competent to contract under the Indian Contract Act, 1872.</li>
                <li>You must be a resident of India with a valid address and contact number.</li>
                <li>You must not be a person barred from receiving services under the laws of India.</li>
                <li>Business / mechanic accounts must be legally registered entities or individuals authorised to trade.</li>
              </ul>
            </Section>

            {/* 3. Account registration & KYC */}
            <Section id="3-kyc" title="3. Account Registration &amp; KYC Documents">
              <p>
                All users are required to register with accurate, current and complete information.
                Depending on the account type, the following documents are mandatory for verification (KYC):
              </p>

              <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Account Type</th>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Mandatory Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Customer</td>
                      <td className="px-3 py-2.5 text-gray-700">
                        Mobile number (OTP verified), Aadhaar / PAN / Voter ID / Driving Licence (any one),
                        Vehicle Registration Certificate (RC) for service requests.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Mechanic / Service Partner</td>
                      <td className="px-3 py-2.5 text-gray-700">
                        Aadhaar Card, PAN Card, Driving Licence, Police Verification Certificate,
                        Bank account details &amp; cancelled cheque / passbook, Address proof, Passport-size photo,
                        Shop / Garage address proof (if applicable), Trade licence (if applicable).
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium">Shop Partner / Seller</td>
                      <td className="px-3 py-2.5 text-gray-700">
                        GSTIN certificate, PAN (business / proprietor), Certificate of Incorporation / Partnership Deed,
                        Bank account details, Authorised signatory ID proof, FSSAI / trade licence where applicable,
                        Dealer / brand authorisation letters for branded parts.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3">
                You are responsible for keeping your credentials confidential. All activity under your account is
                deemed to be performed by you. We reserve the right to suspend or terminate any account with
                incomplete, forged, or mismatched documents.
              </p>
            </Section>

            {/* 4. Services */}
            <Section id="4-services" title="4. Services Offered">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Sale of automotive parts and accessories (car, bike, scooter, auto-rickshaw).</li>
                <li>Booking of doorstep / roadside / walk-in mechanic services.</li>
                <li>Emergency roadside assistance (breakdown, puncture, battery, fuel, lockout, accident support).</li>
                <li>Wallet, rewards, referrals and related features made available on the Platform.</li>
              </ul>
              <p className="mt-3 text-gray-700">
                Bharat Mechanics acts as an intermediary between customers, independent mechanics and sellers.
                Workmanship and product quality is delivered by the service partner / seller; the Platform is
                responsible for facilitation, dispute mediation and safety standards as described in these Terms.
              </p>
            </Section>

            {/* 5. Fees, Pricing & Registration fee */}
            <Section id="5-fees" title="5. Fees, Pricing &amp; Registration Fee">
              <p>
                All prices shown on the Platform are in Indian Rupees (₹) and inclusive of applicable GST
                unless stated otherwise.
              </p>

              <div className="mt-4 rounded-xl border-2 border-[#FF6B35]/30 bg-[#FFF6F1] p-4 md:p-5">
                <p className="font-bold text-[#1A1D29] flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#FF6B35]" />
                  Registration / Booking Fee (Non-refundable)
                </p>
                <p className="mt-2 text-sm text-gray-800 leading-relaxed">
                  Every service booking carries a nominal <strong>Registration Fee</strong> (also called Booking Fee
                  or Convenience Fee) collected at the time of booking. This fee covers platform onboarding,
                  identity verification of assigned mechanic, dispatch logistics, secure communications and
                  after-service support.
                </p>
                <p className="mt-2 text-sm text-gray-800 leading-relaxed">
                  <strong>The Registration Fee is adjusted towards your final invoice</strong> — i.e. the final amount
                  you pay at service completion equals the mechanic&apos;s estimated / actual cost of work plus parts,
                  and the Registration Fee already paid is deducted from that total.
                </p>
                <p className="mt-2 text-sm text-gray-800 leading-relaxed">
                  <strong>However, the Registration Fee itself is non-refundable</strong> in the event of cancellation,
                  no-show, abuse, or rejection of the mechanic&apos;s quote. Full details are in our
                  <Link href="/refund-policy" className="text-[#1B3B6F] font-semibold underline ml-1">Refund Policy</Link>.
                </p>
              </div>

              <p className="mt-4">
                Final price is computed as: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[13px]">
                Labour + Parts + Applicable Taxes (GST) − Registration Fee already paid − Wallet / Coupon discount
                </code>.
                A digital invoice is generated and made available in your account after service completion.
              </p>
            </Section>

            {/* 6. Cancellation */}
            <Section id="6-cancellation" title="6. Cancellation">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You may cancel a service request free of charge before a mechanic is assigned.</li>
                <li>After assignment but before the mechanic has departed, a cancellation charge up to the Registration Fee may apply.</li>
                <li>After mechanic departure or on-site arrival, you will be liable for the visit / diagnostic charge plus the Registration Fee.</li>
                <li>For product orders, cancellation is permitted before dispatch. Post-dispatch requests will be treated as returns under the Refund Policy.</li>
              </ul>
            </Section>

            {/* 7. User obligations */}
            <Section id="7-obligations" title="7. User Obligations &amp; Prohibited Use">
              <p>You agree <strong>not</strong> to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Submit false / forged / altered identification, address proof, vehicle RC or payment information.</li>
                <li>Create multiple accounts, abuse referral / rewards programs, or use bots / automated scripts.</li>
                <li>Make frivolous emergency requests, no-show bookings, or repeatedly cancel after mechanic dispatch.</li>
                <li>Issue fraudulent chargebacks, dispute legitimate transactions, or attempt unauthorised refund claims.</li>
                <li>Impersonate any person, upload objectionable content, or infringe intellectual property.</li>
                <li>Reverse-engineer, scrape, copy or resell Platform data or services without written consent.</li>
                <li>Use the Platform for money laundering, trading prohibited goods, or any act unlawful under Indian law.</li>
              </ul>
            </Section>

            {/* 8. Fraud & legal action */}
            <Section id="8-fraud" title="8. Fraud Prevention &amp; Legal Action" accent>
              <p>
                Bharat Mechanics maintains zero tolerance for fraud, misrepresentation, identity theft, payment
                disputes filed in bad faith, and abuse of emergency services. We operate automated and manual
                fraud-detection systems and preserve logs, device fingerprints, IP addresses, geo-location,
                call records and chat records for evidentiary purposes.
              </p>

              <p className="mt-3">
                Where fraud, cheating, forgery or cyber-offence is reasonably suspected, we reserve the right — without
                prior notice — to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Immediately suspend or permanently terminate the account.</li>
                <li>Withhold any pending payout, wallet balance, cashback or reward points.</li>
                <li>Report the matter to the concerned Cyber Crime Cell, local police station, and to CERT-In.</li>
                <li>Register a formal First Information Report (FIR) and pursue civil recovery proceedings.</li>
                <li>Share investigation data with law-enforcement, banks, payment gateways and credit bureaus.</li>
              </ul>

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-800 flex items-center gap-2 text-sm">
                  <Gavel className="h-4 w-4" />
                  Applicable Indian laws
                </p>
                <ul className="mt-2 text-sm text-red-900 space-y-1 leading-relaxed">
                  <li>• <strong>Bharatiya Nyaya Sanhita (BNS), 2023</strong> — Sections 318 (cheating), 316 (criminal breach of trust), 336–340 (forgery &amp; use of forged documents), 319 (cheating by personation).</li>
                  <li>• <strong>Information Technology Act, 2000</strong> — Sections 43 (unauthorised access / damage), 66 (computer-related offences), 66C (identity theft), 66D (cheating by personation using computer resource).</li>
                  <li>• <strong>Consumer Protection Act, 2019</strong> — where applicable, including e-commerce rules and unfair trade practice provisions.</li>
                  <li>• <strong>Prevention of Money Laundering Act, 2002</strong> — where suspicious transactions are identified.</li>
                  <li>• <strong>Negotiable Instruments Act, 1881</strong> — Section 138 for cheque dishonour.</li>
                </ul>
                <p className="mt-2.5 text-[13px] text-red-900">
                  Offences under BNS s.318 &amp; IT Act s.66D carry imprisonment up to 7 years and fine.
                  The user agrees that they shall bear all investigation, legal and recovery costs, including
                  advocate&apos;s fees, incurred by Bharat Mechanics in prosecuting the offence.
                </p>
              </div>
            </Section>

            {/* 9. Liability */}
            <Section id="9-liability" title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Bharat Mechanics&apos; total aggregate liability towards
                any user arising out of a single service or order shall not exceed the amount actually paid
                by the user for that transaction, excluding the Registration Fee.
                The Platform is not liable for indirect, incidental, consequential or punitive damages,
                loss of profit, loss of data, or vehicle downtime.
              </p>
            </Section>

            {/* 10. Indemnity */}
            <Section id="10-indemnity" title="10. Indemnity">
              <p>
                You agree to indemnify and hold harmless Bharat Mechanics, its directors, employees,
                service partners and affiliates from and against any claim, loss, liability, damage or expense
                (including reasonable advocate&apos;s fees) arising out of (a) your breach of these Terms,
                (b) your violation of any law or third-party right, or (c) any content / information you submit.
              </p>
            </Section>

            {/* 11. Governing law */}
            <Section id="11-law" title="11. Governing Law &amp; Jurisdiction">
              <p className="flex items-start gap-2">
                <Scale className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  These Terms shall be governed by and construed in accordance with the laws of India.
                  Subject to the dispute-resolution clause below, the courts at the registered office location of
                  Bharat Mechanics shall have exclusive jurisdiction over all disputes.
                </span>
              </p>
            </Section>

            {/* 12. Dispute resolution */}
            <Section id="12-disputes" title="12. Dispute Resolution">
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Reach out via in-app Help or email the Grievance Officer (details in Privacy Policy) within 15 days of the incident.</li>
                <li>If unresolved in 30 days, the matter may be referred to mediation under the Mediation Act, 2023.</li>
                <li>Failing mediation, disputes shall be referred to binding arbitration by a sole arbitrator under the Arbitration &amp; Conciliation Act, 1996. Seat: India. Language: English / Hindi.</li>
              </ol>
            </Section>

            {/* 13. Changes */}
            <Section id="13-changes" title="13. Changes to these Terms">
              <p>
                We may update these Terms from time to time. The &quot;Last updated&quot; date at the top will
                change accordingly. Material changes will be notified via in-app or email. Continued use of the
                Platform after such notification constitutes acceptance of the revised Terms.
              </p>
            </Section>

            {/* 14. Contact */}
            <Section id="14-contact" title="14. Contact">
              <p>
                For any question about these Terms, please contact us through the in-app Help Centre or via
                email. Contact details are listed in our
                <Link href="/privacy" className="text-[#1B3B6F] font-semibold underline ml-1">Privacy Policy</Link>.
              </p>
            </Section>

            {/* Footer row of related links */}
            <div className="pt-2 flex flex-wrap gap-2">
              <Link href="/privacy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Privacy Policy
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

/* ─── Reusable section block ─── */
function Section({
  id, title, accent = false, children,
}: {
  id: string; title: string; accent?: boolean; children: React.ReactNode
}) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl border ${accent ? 'border-red-200 bg-white' : 'border-gray-200 bg-white'} p-4 md:p-6 shadow-sm`}>
      <h2 className="text-base md:text-lg font-bold text-[#1A1D29] tracking-tight mb-2 md:mb-3">{title}</h2>
      <div className="prose prose-sm max-w-none text-[13.5px] md:text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
