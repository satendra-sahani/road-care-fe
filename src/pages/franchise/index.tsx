import { FranchiseDashboard } from '@/components/franchise/FranchiseDashboard'
import { SEOHead } from '@/components/SEOHead'

export default function FranchiseDashboardPage() {
  return (
    <>
      <SEOHead title="Franchise – Dashboard" noIndex />
      <FranchiseDashboard />
    </>
  )
}
