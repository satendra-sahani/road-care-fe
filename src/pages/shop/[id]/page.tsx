import { ProductDetail } from '@/components/shop/ProductDetail'

interface Props {
  params: { id: string }
}

export default function ProductDetailPage({ params }: Props) {
  return <ProductDetail productId={params.id} />
}
  const part = DUMMY_PARTS.find((p) => p.id === params.id)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  if (!part) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-xl text-muted-foreground">Product not found</p>
          <Link href="/shop">
            <Button className="mt-4">Back to Shop</Button>
          </Link>
        </div>
      </div>
    )
  }

  const relatedProducts = DUMMY_PARTS.filter((p) => p.category === part.category && p.id !== part.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 border-b border-border">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary">
            Shop
          </Link>
          <span>/</span>
          <Link href={`/shop?category=${part.category}`} className="hover:text-primary">
            {part.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{part.name}</span>
        </div>
      </div>

      {/* Product Details */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-muted rounded-lg h-96 md:h-full flex items-center justify-center text-8xl">
            📦
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-primary font-semibold text-sm mb-2">{part.category}</p>
              <h1 className="text-4xl font-bold mb-4">{part.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{part.brand}</p>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < Math.floor(part.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }
                    />
                  ))}
                </div>
                <span className="font-semibold">{part.rating}</span>
                <span className="text-muted-foreground">({part.reviews} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-muted-foreground text-sm mb-2">Price</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">₹{part.price}</span>
                <span className="text-lg text-muted-foreground line-through">
                  ₹{Math.round(part.price * 1.2)}
                </span>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Stock Status</p>
                {part.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span className="font-semibold text-primary">
                      In Stock ({part.stock} available)
                    </span>
                  </div>
                ) : (
                  <span className="text-destructive font-semibold">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold mb-3">About This Product</h3>
              <p className="text-muted-foreground">{part.description}</p>
            </div>

            {/* Quantity Selector */}
            {part.stock > 0 && (
              <div>
                <p className="text-muted-foreground text-sm mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-border rounded-lg hover:bg-muted"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(part.stock, quantity + 1))}
                    className="p-2 border border-border rounded-lg hover:bg-muted"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button size="lg" className="flex-1 gap-2 bg-secondary hover:bg-secondary/90">
                <ShoppingCart size={20} /> Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? 'border-primary text-primary' : ''}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                <Share2 size={20} /> Share
              </Button>
            </div>

            {/* Additional Info */}
            <Card className="p-4 bg-blue-50 border-blue-100">
              <p className="text-sm text-blue-900">
                ✓ Free shipping on orders above ₹1000
              </p>
              <p className="text-sm text-blue-900">✓ 1-year warranty included</p>
              <p className="text-sm text-blue-900">✓ Easy returns within 30 days</p>
            </Card>
          </div>
        </div>

        {/* Specifications */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Specifications</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-sm">Product Name</p>
              <p className="font-semibold">{part.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Brand</p>
              <p className="font-semibold">{part.brand}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Category</p>
              <p className="font-semibold">{part.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Price</p>
              <p className="font-semibold">₹{part.price}</p>
            </div>
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {[
              {
                name: 'Raj Kumar',
                rating: 5,
                text: 'Excellent product quality and fast delivery',
              },
              {
                name: 'Priya Singh',
                rating: 4,
                text: 'Good product, but delivery took a bit longer',
              },
              {
                name: 'Arjun Patel',
                rating: 5,
                text: 'Perfect fit for my car, very satisfied',
              },
            ].map((review, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold">{review.name}</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{review.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relPart) => (
                <Link key={relPart.id} href={`/shop/${relPart.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition h-full">
                    <div className="bg-muted h-40 flex items-center justify-center text-4xl">
                      📦
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold line-clamp-2 mb-2">{relPart.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{relPart.brand}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{relPart.price}
                        </span>
                        <Button
                          size="sm"
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}
