import type { GetServerSideProps } from 'next'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks'

// bharatmechanics.com/app — the target of the "Scan QR code to download"
// codes. Sends iPhone/iPad (and Mac) visitors to the App Store and everyone
// else to Google Play, so one QR works for both stores.
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const ua = req.headers['user-agent'] || ''
  const apple = /iPhone|iPad|iPod|Macintosh/i.test(ua)
  return { redirect: { destination: apple ? APP_STORE_URL : PLAY_STORE_URL, permanent: false } }
}

export default function AppRedirect() {
  return null
}
