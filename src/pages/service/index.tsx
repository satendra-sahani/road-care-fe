import type { GetServerSideProps } from 'next'
import { CUSTOMER_WEB, storeUrlFor } from '@/lib/customerWeb'
import { ServicePage } from '@/components/service/ServicePage'
import { SEOHead } from '@/components/SEOHead'

export default function Service() {
  return (
    <>
      <SEOHead
        title="Book a Mechanic at Home"
        description="Book a certified mechanic at home in Gorakhpur, Deoria, Kushinagar & Maharajganj — car & bike repair, battery, AC, brakes and 24/7 roadside help."
        keywords="mechanic near me, bike mistri near me, car repair near me, puncture repair near me, car service at home, car service, bike service, doorstep mechanic, vehicle repair, engine service, brake repair, AC service, battery replacement, car maintenance, two wheeler service, emergency mechanic"
      />
      <ServicePage />
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
