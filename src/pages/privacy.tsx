import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  ShieldCheck, Lock, MapPin, Camera, Image as ImageIcon, Mic, Phone, Bell,
  MessageSquare, Wifi, UserCog,
} from 'lucide-react'

const LAST_UPDATED = 'April 2026'

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Privacy Policy of Bharat Mechanics — what data we collect, why Android / Play Store permissions are requested, how we store, share and protect your information under the DPDPA Act 2023."
        keywords="privacy policy, data protection, play store permissions, DPDPA, Bharat Mechanics privacy"
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
                  <p className="text-xs md:text-sm text-white/75 mt-0.5">Last updated: {LAST_UPDATED}</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
                Your privacy matters. This policy explains what data Bharat Mechanics collects, why we need each
                Android / Play Store permission, how we use and share your information, and the rights you have
                under the Digital Personal Data Protection Act, 2023 (DPDPA).
              </p>
            </div>
          </div>

          <article className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">

            {/* 1. Who we are */}
            <Section id="1" title="1. Who We Are">
              <p>
                Bharat Mechanics (the &quot;Platform&quot;) is an Indian automotive parts and mechanic-services
                marketplace accessible via web and Android application. This Privacy Policy applies to all users
                — customers, mechanics and shop partners — and covers data processed within India.
              </p>
            </Section>

            {/* 2. What we collect */}
            <Section id="2" title="2. Information We Collect">
              <h3 className="font-semibold text-[#1A1D29] mt-2">a) You provide directly</h3>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Full name, mobile number, email, password (hashed).</li>
                <li>Vehicle details — type, brand, model, RC number (for service bookings).</li>
                <li>KYC documents — Aadhaar / PAN / DL / GSTIN etc. as applicable.</li>
                <li>Delivery &amp; service addresses, landmarks, pincode.</li>
                <li>Content you upload — vehicle photos, damage photos, feedback, reviews.</li>
                <li>Voice recordings (only when you explicitly use AI Voice Booking).</li>
              </ul>

              <h3 className="font-semibold text-[#1A1D29] mt-4">b) Collected automatically</h3>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Device information — model, OS version, unique device identifier, language.</li>
                <li>App usage analytics — screens visited, taps, crash logs, performance metrics.</li>
                <li>IP address, network type, approximate location from IP.</li>
                <li>Precise GPS location (only when the app is open or with your explicit background-location consent, for live tracking of a mechanic visit).</li>
                <li>Cookies &amp; similar technologies on the website (see Cookies section).</li>
              </ul>

              <h3 className="font-semibold text-[#1A1D29] mt-4">c) From third parties</h3>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Payment status &amp; transaction ID from the payment gateway (e.g. Razorpay).</li>
                <li>Map &amp; reverse-geocoding data from map providers (e.g. OpenStreetMap / Google Maps).</li>
                <li>SMS delivery status from SMS gateway (for OTPs and transactional alerts).</li>
              </ul>

              <p className="mt-3 font-semibold text-[#1A1D29]">We do NOT collect:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Your full card number or CVV — handled entirely by the PCI-DSS compliant payment gateway.</li>
                <li>The content of your personal SMS, call logs, contacts list, or any unrelated files / media.</li>
              </ul>
            </Section>

            {/* 3. Play Store / Android permissions */}
            <Section id="3" title="3. Android / Play Store Permissions" accent>
              <p>
                The Bharat Mechanics Android app requests only those permissions that are genuinely needed to
                deliver a feature you have asked for. You may revoke any permission at any time from your device
                settings — some features will then stop working.
              </p>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-[13px] md:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Permission</th>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Why we ask</th>
                      <th className="text-left font-semibold text-[#1A1D29] px-3 py-2.5 border-b">Required?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <Perm icon={MapPin} name="Location — Approximate &amp; Precise (foreground)">
                      To detect your current location when you tap &quot;Use current location&quot;, to show nearby
                      mechanics / shops, to calculate service ETA and distance, and to help you attach an
                      accurate pickup / service address.
                    </Perm>
                    <Perm icon={MapPin} name="Location — Background" required="Optional">
                      Requested only if you enable live mechanic tracking for an ongoing service, or SOS roadside
                      assistance. Used solely while that service is active; you can stop at any time.
                    </Perm>
                    <Perm icon={Camera} name="Camera">
                      To let you capture and upload photos of your vehicle, damage, invoices or KYC documents
                      directly during a service request. No silent or background capture is performed.
                    </Perm>
                    <Perm icon={ImageIcon} name="Photos &amp; Media / Storage (READ_MEDIA_IMAGES)">
                      To let you attach existing images from your gallery when creating a booking or submitting
                      feedback, and to save downloaded invoices.
                    </Perm>
                    <Perm icon={Mic} name="Microphone">
                      Only used for the AI Voice Booking feature — we record audio only when you tap the
                      microphone button and stop as soon as you tap stop.
                    </Perm>
                    <Perm icon={Phone} name="Phone (Call)" required="Optional">
                      To open your dialler with the mechanic&apos;s number when you tap &quot;Call Mechanic&quot;.
                      We never auto-dial.
                    </Perm>
                    <Perm icon={Bell} name="Notifications">
                      To send booking updates, payment confirmations, order status, promotions
                      (you can opt-out), and emergency SOS acknowledgements.
                    </Perm>
                    <Perm icon={MessageSquare} name="SMS (SMS Retriever API)">
                      Used <em>only</em> to automatically read the 6-digit OTP we send you during login, so you
                      do not need to switch apps. We do not read any other SMS. We do not request READ_SMS.
                    </Perm>
                    <Perm icon={Wifi} name="Internet &amp; Network State">
                      Core connectivity — to communicate with our servers and adapt content to your network speed.
                    </Perm>
                    <Perm icon={UserCog} name="Post-Install Receiver / Foreground Service">
                      Used for live-tracking foreground service during an active roadside / SOS assistance request,
                      with a persistent notification so you always know tracking is running.
                    </Perm>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[13px] text-gray-700">
                In compliance with Google Play&apos;s User Data, Permissions and Families policies, we clearly
                disclose the above permissions in the app&apos;s Play Store listing under
                <em> &quot;Data safety&quot;</em> and request runtime consent before accessing any sensitive data.
              </p>
            </Section>

            {/* 4. Why we use your data */}
            <Section id="4" title="4. How We Use Your Data">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To create and authenticate your account.</li>
                <li>To match you with suitable mechanics / shops and fulfil your orders and service requests.</li>
                <li>To process payments, issue invoices, and manage wallet / rewards / referrals.</li>
                <li>To provide customer support and resolve disputes.</li>
                <li>To send transactional and promotional communications (promotional can be opted-out).</li>
                <li>To improve our services — aggregate analytics, fraud detection, safety, and model training (where applicable, on anonymised data only).</li>
                <li>To comply with legal, tax, regulatory and government obligations within India.</li>
              </ul>
            </Section>

            {/* 5. Sharing */}
            <Section id="5" title="5. Sharing Your Data">
              <p>We share only the minimum data needed, and only with:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong>Assigned mechanics / shop partners</strong> — your name, mobile, service address and issue description, to deliver the service you booked.</li>
                <li><strong>Payment gateways</strong> — transaction amount, order ID, and basic customer details, to process payments and refunds.</li>
                <li><strong>Logistics / courier partners</strong> — for delivery of physical parts you order.</li>
                <li><strong>SMS, email and push-notification providers</strong> — to deliver messages you have subscribed to.</li>
                <li><strong>Analytics &amp; crash-reporting services</strong> — on an anonymised / aggregated basis wherever possible.</li>
                <li><strong>Law-enforcement agencies</strong> — where required by law, pursuant to a valid written notice / court order under Indian law.</li>
              </ul>
              <p className="mt-3">
                We <strong>never sell</strong> your personal data to advertisers or data brokers.
              </p>
            </Section>

            {/* 6. Retention */}
            <Section id="6" title="6. Data Retention">
              <p>
                We retain your data only as long as required to provide the service, for as long as your account
                is active, or as mandated by Indian law (e.g. GST records are kept for at least 8 years under the
                CGST Act, 2017). Inactive accounts may be anonymised after a defined retention period.
              </p>
            </Section>

            {/* 7. Security */}
            <Section id="7" title="7. Security">
              <p className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-1 shrink-0 text-[#1B3B6F]" />
                <span>
                  We use HTTPS (TLS 1.2+) for all traffic, bcrypt-hashed passwords, JWT-based authentication,
                  role-based access control for employees, encrypted backups, and regular security reviews.
                  Payments are handled on PCI-DSS compliant gateways — card data never touches our servers.
                </span>
              </p>
              <p className="mt-2">
                In the unlikely event of a data breach affecting your personal data, we will notify you and the
                Data Protection Board of India within the timelines prescribed under the DPDPA, 2023.
              </p>
            </Section>

            {/* 8. Your rights */}
            <Section id="8" title="8. Your Rights under DPDPA 2023">
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Right to access</strong> — obtain a summary of personal data we hold about you.</li>
                <li><strong>Right to correction &amp; erasure</strong> — ask us to correct inaccurate data or delete data that is no longer needed.</li>
                <li><strong>Right to withdraw consent</strong> — withdraw any consent you previously gave (for example, marketing emails or background location).</li>
                <li><strong>Right to nominate</strong> — nominate another person to exercise your rights in the event of death or incapacity.</li>
                <li><strong>Right to grievance redressal</strong> — reach our Grievance Officer (below) free of cost.</li>
              </ul>
              <p className="mt-3">
                Most rights can be exercised directly from your profile settings. For others, write to our
                Grievance Officer.
              </p>
            </Section>

            {/* 9. Cookies */}
            <Section id="9" title="9. Cookies &amp; Similar Technologies (Web)">
              <p>
                The website uses a limited number of strictly-necessary cookies (authentication, cart) and
                optional analytics cookies. You can clear cookies from your browser settings at any time.
              </p>
            </Section>

            {/* 10. Children */}
            <Section id="10" title="10. Children's Data">
              <p>
                Bharat Mechanics is not intended for children under 18 years of age. We do not knowingly collect
                data from minors. If you believe a minor has created an account, please contact the Grievance
                Officer and we will remove the account promptly.
              </p>
            </Section>

            {/* 11. Grievance officer */}
            <Section id="11" title="11. Grievance Officer">
              <p>
                In accordance with Rule 3(11) of the IT (Intermediary Guidelines) Rules, 2021 and Section 10 of
                the DPDPA, 2023, the details of the Grievance Officer are:
              </p>
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm space-y-1">
                <p><strong>Name:</strong> Grievance Officer, Bharat Mechanics</p>
                <p><strong>Email:</strong> grievance@bharatmechanics.in</p>
                <p><strong>Support:</strong> support@bharatmechanics.in</p>
                <p><strong>Phone:</strong> +91 1800-123-4567 (Mon–Sat, 9 AM – 7 PM IST)</p>
                <p><strong>Response time:</strong> Acknowledgement within 24 hours, resolution within 15 days.</p>
              </div>
            </Section>

            {/* 12. Changes */}
            <Section id="12" title="12. Updates to this Policy">
              <p>
                We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date reflects
                the latest version. Material changes will be notified via email or in-app notification.
              </p>
            </Section>

            <div className="pt-2 flex flex-wrap gap-2">
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

function Perm({
  icon: Icon, name, required = 'Required', children,
}: { icon: any; name: string; required?: 'Required' | 'Optional'; children: React.ReactNode }) {
  return (
    <tr>
      <td className="align-top px-3 py-2.5">
        <span className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 text-[#1B3B6F] shrink-0" />
          <span className="font-medium text-[#1A1D29]" dangerouslySetInnerHTML={{ __html: name }} />
        </span>
      </td>
      <td className="align-top px-3 py-2.5">{children}</td>
      <td className="align-top px-3 py-2.5">
        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          required === 'Required' ? 'bg-[#DBEAFE] text-[#1B3B6F]' : 'bg-gray-100 text-gray-600'
        }`}>{required}</span>
      </td>
    </tr>
  )
}
