import type { GetServerSideProps } from 'next'
import { CUSTOMER_WEB, storeUrlFor } from '@/lib/customerWeb'
import { SEOHead } from '@/components/SEOHead'
import EmergencyPage from '@/components/service/EmergencyPage'

export default function Emergency() {
  return (
    <>
      <SEOHead
        title="Emergency Assistance"
        description="Get immediate roadside emergency assistance. Vehicle breakdown, accident support, flat tyre, battery dead, out of fuel — help is just a tap away."
        keywords="emergency mechanic, roadside assistance, vehicle breakdown, accident help, flat tyre, battery dead, SOS mechanic"
      />
      <EmergencyPage />
    </>
  )
}

// Booking on the website is off for now: this page does not open — the visitor goes
// straight to the app's store page for their device (App Store on Apple devices,
// Google Play on everything else). See lib/customerWeb.ts.
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  if (CUSTOMER_WEB) return { props: {} }
  return { redirect: { destination: storeUrlFor(String(req.headers['user-agent'] || '')), permanent: false } }
}
