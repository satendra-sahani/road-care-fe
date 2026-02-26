import { useRouter } from 'next/router'
import { ProductDetail } from '@/components/shop/ProductDetail'

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>
  }

  return <ProductDetail productId={id} />
}
