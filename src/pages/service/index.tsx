import { ServicePage } from '@/components/service/ServicePage'
import { SEOHead } from '@/components/SEOHead'

export default function Service() {
  return (
    <>
      <SEOHead
        title="Book a Mechanic at Home"
        description="Book a certified mechanic at home in Gorakhpur, Deoria, Kushinagar & Maharajganj — car & bike repair, battery, AC, brakes and 24/7 roadside help."
        keywords="mechanic near me, bike mistri near me, car repair near me, puncture repair near me, car service at home, car service, bike service, doorstep mechanic, vehicle repair, engine service, brake repair, AC service, battery replacement, car maintenance, two wheeler service, emergency mechanic"
      />
      <ServicePage />
    </>
  )
}
