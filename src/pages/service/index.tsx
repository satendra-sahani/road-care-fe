import { ServicePage } from '@/components/service/ServicePage'
import { SEOHead } from '@/components/SEOHead'

export default function Service() {
  return (
    <>
      <SEOHead
        title="Vehicle Services"
        description="Book certified mechanics for doorstep car and bike repair services at Bharat Mechanics. Engine service, brake repair, battery replacement, AC service, general maintenance & emergency 24/7 assistance."
        keywords="mechanic near me, car service, bike service, doorstep mechanic, vehicle repair, engine service, brake repair, AC service, battery replacement, car maintenance, two wheeler service, emergency mechanic"
      />
      <ServicePage />
    </>
  )
}
