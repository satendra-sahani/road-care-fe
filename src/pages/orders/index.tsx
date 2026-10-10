import { SEOHead } from '@/components/SEOHead'
import { OrderHistoryPage } from '@/components/orders/OrderHistoryPage'

export default function Orders() {
  return (<><SEOHead title="Your Orders" noIndex /><OrderHistoryPage /></>)
}
