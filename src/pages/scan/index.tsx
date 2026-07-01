import Head from 'next/head'
import { ScanPage } from '@/components/secure-contact/ScanPage'

// SecureContact scanner — camera QR scanning (where supported) + manual code
// entry. Public route; contacting the owner prompts login on the next page.
export default function Scan() {
  return (
    <>
      <Head>
        <title>Scan vehicle QR · Bharat Mechanics</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ScanPage />
    </>
  )
}
