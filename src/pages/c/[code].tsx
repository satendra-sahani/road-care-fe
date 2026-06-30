import { useRouter } from 'next/router'
import Head from 'next/head'
import { QRWebLanding } from '@/components/secure-contact/QRWebLanding'

// Public SecureContact landing — bharatmechanics.com/c/<code>.
// No auth, no app chrome: this is what a non-app scanner sees.
export default function SecureContactLanding() {
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
