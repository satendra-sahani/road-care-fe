import { useRouter } from 'next/router'
import Head from 'next/head'
import { QRWebLanding } from '@/components/secure-contact/QRWebLanding'

// Public SecureContact landing — bharatmechanics.com/v/<code>.
// This is the URL encoded in every vehicle QR sticker (app + web), so any
// phone camera lands here. No auth, no app chrome.
export default function SecureContactLandingV() {
  const router = useRouter()
  const code = typeof router.query.code === 'string' ? router.query.code : ''
  return (
    <>
      <Head>
        <title>SecureContact · Bharat Mechanics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <QRWebLanding code={code} />
    </>
  )
}
