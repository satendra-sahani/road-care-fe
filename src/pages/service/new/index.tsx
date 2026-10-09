import type { GetServerSideProps } from 'next'
import { CUSTOMER_WEB, storeUrlFor } from '@/lib/customerWeb'
import { ServicePage } from '@/components/service/ServicePage'

export default function ServiceNew() {
  return <ServicePage />
}

// Booking on the website is off for now: this page does not open — the visitor goes
// straight to the app's store page for their device (App Store on Apple devices,
// Google Play on everything else). See lib/customerWeb.ts.
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  if (CUSTOMER_WEB) return { props: {} }
  return { redirect: { destination: storeUrlFor(String(req.headers['user-agent'] || '')), permanent: false } }
}
