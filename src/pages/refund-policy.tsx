import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { Receipt, AlertCircle, CheckCircle2, XCircle, Calculator, Clock } from 'lucide-react'

const LAST_UPDATED = 'April 2026'

export default function RefundPolicyPage() {
  return (
    <>
      <SEOHead
        title="Refund & Cancellation Policy"
        description="Refund & Cancellation Policy of Bharat Mechanics — when refunds are issued, how the Registration Fee works, pricing formula, non-refundable items and timelines."
        keywords="refund policy, cancellation policy, registration fee, non-refundable, bharat mechanics refund"
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <Receipt className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">Refund &amp; Cancellation Policy</h1>
                  <p className="text-xs md:text-sm text-white/75 mt-0.5">Last updated: {LAST_UPDATED}</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
                We want you to have a fair, transparent experience. This page explains exactly when you&apos;re
                eligible for a refund, how long it takes, and — most importantly — what the
                Registration Fee covers and why it is non-refundable.
              </p>
            </div>
          </div>

          <article className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">

            {/* REGISTRATION FEE (highlighted) */}
            <section id="registration-fee" className="scroll-mt-20 rounded-2xl border-2 border-[#FF6B35]/40 bg-gradient-to-br from-[#FFF6F1] to-white p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-[#FF6B35]" />
                <h2 className="text-base md:text-lg font-bold text-[#1A1D29] tracking-tight">Registration / Booking Fee — Non-Refundable</h2>
              </div>

              <p className="text-[13.5px] md:text-sm text-gray-800 leading-relaxed">
                Whenever you create a service request on Bharat Mechanics, a small
                <strong> Registration Fee</strong> (also shown in your invoice as Booking Fee or Platform
                Convenience Fee) is charged upfront. This is typically <strong>₹99 for standard service bookings</strong>
                {' '}and <strong>₹199 for emergency / SOS roadside assistance</strong> (the exact amount is always
                displayed on the confirmation screen before you pay).
              </p>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-gray-200 p-4">
                  <p className="font-bold text-[#1A1D29] text-sm">What the fee covers</p>
                  <ul className="mt-2 text-[13px] text-gray-700 space-y-1 list-disc pl-5">
                    <li>Platform onboarding &amp; background verification of your assigned mechanic</li>
                    <li>Dispatch logistics, call-routing and in-app chat infrastructure</li>
                    <li>Secure payment processing and digital invoice generation</li>
                    <li>Post-service support, warranty follow-up and dispute mediation</li>
                    <li>Fraud-prevention, KYC checks and safety monitoring</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 p-4">
                  <p className="font-bold text-[#1A1D29] text-sm">How it is treated in your final bill</p>
                  <ul className="mt-2 text-[13px] text-gray-700 space-y-1 list-disc pl-5">
                    <li>The fee is <strong>adjusted against</strong> your final invoice on service completion.</li>
                    <li>You only pay the <em>difference</em> between your final bill and the fee already paid.</li>
                    <li>If the final bill is lower than the fee, the excess (if any) is returned to your wallet.</li>
                    <li>However, the Registration Fee itself is <strong>not refunded</strong> in the scenarios listed below.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="font-bold text-red-800 text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> The Registration Fee is NOT refunded when
                </p>
                <ul className="mt-2 text-[13px] text-red-900 space-y-1 list-disc pl-5">
                  <li>You cancel the booking after a mechanic is assigned and dispatched.</li>
                  <li>You are not available / unreachable at the scheduled time (no-show).</li>
                  <li>You reject the mechanic&apos;s diagnostic quote and choose not to proceed with repair.</li>
                  <li>The booking is cancelled because of false / incorrect information provided by you.</li>
                  <li>The booking is terminated due to fraud, abuse, or misuse of emergency service.</li>
                </ul>
              </div>
            </section>

            {/* Final price formula */}
            <Section id="pricing" title="Final Price Calculation">
              <p className="flex items-start gap-2">
                <Calculator className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  Every invoice is generated transparently using the following formula:
                </span>
              </p>

              <div className="mt-3 rounded-xl bg-[#0F2545] text-white p-4 font-mono text-[12.5px] md:text-sm leading-relaxed overflow-x-auto">
                <div>Final Amount Payable</div>
                <div className="mt-1.5 pl-3">
                  = Mechanic Labour / Service Charge
                  <br />
                  <span className="text-white/70">&nbsp;&nbsp;+ Cost of Parts &amp; Consumables (if any)</span>
                  <br />
                  <span className="text-white/70">&nbsp;&nbsp;+ Applicable GST</span>
                  <br />
                  <span className="text-[#FF9E6B]">&nbsp;&nbsp;− Registration Fee already paid</span>
                  <br />
                  <span className="text-[#7DD3FC]">&nbsp;&nbsp;− Wallet balance / Coupon / Cashback applied</span>
                </div>
              </div>

              <p className="mt-3 text-[13px]">
                The line-item breakdown is shown on the in-app invoice and also emailed to you. No hidden charges.
              </p>
            </Section>

            {/* Service refunds */}
            <Section id="service-refunds" title="Service Booking — Refund Scenarios">
              <div className="overflow-x-auto rounded-xl border border-gray-200 mt-2">
                <table className="w-full text-[13px] md:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Scenario</th>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Refund Amount</th>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Credited To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr>
                      <td className="px-3 py-2.5">Cancelled <strong>before</strong> mechanic assignment</td>
                      <td className="px-3 py-2.5">100% of paid amount</td>
                      <td className="px-3 py-2.5">Original payment method</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Cancelled after assignment but <strong>before mechanic starts travel</strong></td>
                      <td className="px-3 py-2.5">Paid amount minus Registration Fee</td>
                      <td className="px-3 py-2.5">Wallet or original method</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Cancelled after mechanic has left / reached site</td>
                      <td className="px-3 py-2.5">No refund — visit &amp; diagnostic charge + Registration Fee apply</td>
                      <td className="px-3 py-2.5">—</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">No-show by customer</td>
                      <td className="px-3 py-2.5">No refund</td>
                      <td className="px-3 py-2.5">—</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Mechanic unable to attend / cancelled by us</td>
                      <td className="px-3 py-2.5">100% refund including Registration Fee</td>
                      <td className="px-3 py-2.5">Original payment method</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Service not completed due to confirmed mechanic fault</td>
                      <td className="px-3 py-2.5">Labour charge refunded; Registration Fee retained</td>
                      <td className="px-3 py-2.5">Wallet or original method</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">Quote rejection (diagnostic only)</td>
                      <td className="px-3 py-2.5">No refund on visit / diagnostic charge or Registration Fee</td>
                      <td className="px-3 py-2.5">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Product / parts order refunds */}
            <Section id="parts-refunds" title="Parts / Accessories Orders">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Cancellation is free before the order is marked &quot;Dispatched&quot;.</li>
                <li>After dispatch, you may raise a return within <strong>7 days</strong> of delivery if the product is defective, damaged in transit, wrong item, or not as described.</li>
                <li>Items must be unused, in original packaging, with all tags, manuals and accessories.</li>
                <li>Consumables (engine oil, coolant, bulbs once installed, batteries activated, etc.) are <strong>non-returnable</strong> unless they are defective on arrival.</li>
                <li>Custom-fit, ordered-to-spec, or special-import parts are non-returnable once shipped.</li>
                <li>Return pickup is free if the error is ours; otherwise a reverse-logistics fee may be deducted.</li>
              </ul>
            </Section>

            {/* Emergency */}
            <Section id="emergency" title="Emergency / SOS Bookings">
              <p>
                Because emergency bookings trigger immediate mechanic dispatch within minutes and block that
                mechanic from other jobs, emergency Registration Fees are <strong>non-refundable</strong> once a
                mechanic has accepted the request. Misuse of emergency / SOS (false alarm, prank, abuse) may
                attract additional charges and account suspension.
              </p>
            </Section>

            {/* Timelines */}
            <Section id="timelines" title="Refund Timelines">
              <p className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  Once approved, refunds are initiated within <strong>2 working days</strong>. Actual credit to
                  your account depends on your bank and payment method:
                </span>
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Wallet credit — instant on approval.</li>
                <li>UPI — typically within 2–3 working days.</li>
                <li>Credit / Debit card — typically within 5–7 working days.</li>
                <li>Net banking / bank transfer — typically within 5–10 working days.</li>
              </ul>
              <p className="mt-2">
                You will receive a notification and email confirmation when the refund is initiated, along with
                the Refund Reference Number (RRN / ARN) to share with your bank if needed.
              </p>
            </Section>

            {/* Non-refundable */}
            <Section id="non-refundable" title="Items That Are Never Refundable">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Registration Fee / Booking Fee / Platform Convenience Fee (subject to the exceptions in &quot;Refund Scenarios&quot; above).</li>
                <li>Visit / diagnostic charges, once the mechanic has reached the service address.</li>
                <li>Opened consumables such as engine oil, coolant, brake fluid, installed batteries, etc.</li>
                <li>Custom or special-order parts.</li>
                <li>Gift cards, wallet top-ups and cashback / reward credits.</li>
                <li>Any amount forfeited due to fraud, abuse or violation of our <Link href="/terms" className="text-[#1B3B6F] font-semibold underline">Terms &amp; Conditions</Link>.</li>
              </ul>
            </Section>

            {/* Failed payments */}
            <Section id="failed-payments" title="Failed / Duplicate Payments">
              <p>
                If your payment fails but money is deducted, it is usually auto-reversed by your bank within
                5–7 working days. If you still don&apos;t see the reversal, please contact us with the
                transaction reference and we will coordinate with the payment gateway on your behalf.
              </p>
            </Section>

            {/* How to raise */}
            <Section id="raise-refund" title="How to Raise a Refund Request" accent>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Open the order / service request in the app or website.</li>
                <li>Tap &quot;Request Refund&quot; and pick the reason. Attach photos / invoices if relevant.</li>
                <li>Our support team reviews the request within 48 hours and updates the status.</li>
                <li>If approved, the refund is initiated and an RRN / ARN is shared.</li>
                <li>
                  If your request is rejected and you are not satisfied with the decision, you may escalate to
                  our Grievance Officer (details in the
                  <Link href="/privacy#11" className="text-[#1B3B6F] font-semibold underline ml-1">Privacy Policy</Link>
                  ).
                </li>
              </ol>

              <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-[13px] text-green-900">
                <p className="flex items-center gap-2 font-semibold text-green-800">
                  <CheckCircle2 className="h-4 w-4" /> Consumer rights
                </p>
                <p className="mt-1">
                  Nothing in this policy limits any rights you have under the Consumer Protection Act, 2019.
                  You may also approach the relevant District, State or National Consumer Disputes Redressal
                  Commission, or the National Consumer Helpline (NCH) at 1915.
                </p>
              </div>
            </Section>

            {/* Contact */}
            <Section id="contact" title="Contact Us">
              <p>
                For any questions about this policy, please reach out via in-app Help, email us at
                <span className="font-semibold"> support@bharatmechanics.in</span>, or call
                <span className="font-semibold"> +91 1800-123-4567</span> (Mon–Sat, 9 AM – 7 PM IST).
              </p>
            </Section>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link href="/terms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B3B6F] bg-[#DBEAFE] hover:bg-[#BFDBFE] rounded-full px-3 py-1.5 transition-colors">
                Privacy Policy
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
