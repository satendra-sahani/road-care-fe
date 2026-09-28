import { FranchiseProfile } from '@/components/franchise/FranchiseProfile'
import { SEOHead } from '@/components/SEOHead'

export default function FranchiseProfilePage() {
  return (
    <>
      <SEOHead title="Franchise – Profile" noIndex />
      <FranchiseProfile />
    </>
  )
}
