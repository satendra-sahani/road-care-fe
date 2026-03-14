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
