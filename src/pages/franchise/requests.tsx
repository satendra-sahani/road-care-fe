import { FranchiseRequests } from '@/components/franchise/FranchiseRequests'
import { SEOHead } from '@/components/SEOHead'

export default function FranchiseRequestsPage() {
  return (
    <>
      <SEOHead title="Franchise – Service Requests" noIndex />
      <FranchiseRequests />
    </>
  )
}
