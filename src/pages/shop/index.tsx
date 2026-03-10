import { ShopListing } from '@/components/shop/ShopListing'
import { SEOHead } from '@/components/SEOHead'

export default function Shop() {
  return (
    <>
      <SEOHead
        title="Shop Auto Parts"
        description="Browse and buy genuine auto parts online at Bharat Mechanics. Car parts, bike parts, engine oil, brake pads, filters, spark plugs, batteries & more from top brands. Fast delivery across India."
        keywords="buy auto parts online, car parts shop, bike parts, engine oil, brake pads, air filter, oil filter, spark plug, car battery, tyre, Bosch, Denso, NGK, Castrol, Mobil, Shell"
      />
      <ShopListing />
    </>
  )
}
