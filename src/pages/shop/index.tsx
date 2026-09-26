import { ShopListing } from '@/components/shop/ShopListing'
import { SEOHead } from '@/components/SEOHead'

export default function Shop() {
  return (
    <>
      <SEOHead
        title="Buy Genuine Auto Parts Online"
        description="Buy genuine car & bike parts online: engine oil, brake pads, filters, batteries & more from top brands. Delivered to Gorakhpur, Deoria, Kushinagar & all India."
        keywords="auto parts near me, spare parts shop near me, bike spare parts online, buy auto parts online, car parts shop, bike parts, engine oil, brake pads, air filter, oil filter, spark plug, car battery, tyre, Bosch, Denso, NGK, Castrol, Mobil, Shell"
      />
      <ShopListing />
    </>
  )
}
