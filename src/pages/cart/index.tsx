import { CartPage } from '@/components/cart/CartPage'

export default function Cart() {
  return <CartPage />
}
  ])

  const getItemDetails = (partId: string) => {
    return DUMMY_PARTS.find((p) => p.id === partId)
  }

  const handleQuantityChange = (partId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((item) => item.partId !== partId))
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.partId === partId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const handleRemove = (partId: string) => {
    setCartItems(cartItems.filter((item) => item.partId !== partId))
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const part = getItemDetails(item.partId)
    return sum + (part?.price || 0) * item.quantity
  }, 0)

  const shippingCost = subtotal > 1000 ? 0 : 100
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + shippingCost + tax

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={64} className="mx-auto text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Add some parts to get started!
            </p>
            <Link href="/shop">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {cartItems.map((item) => {
                    const part = getItemDetails(item.partId)
                    if (!part) return null

                    return (
                      <div key={item.partId} className="p-6 hover:bg-muted/30 transition">
                        <div className="flex gap-4 mb-4">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-3xl">
                            📦
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <Link
                              href={`/shop/${part.id}`}
                              className="font-bold text-lg hover:text-primary"
                            >
                              {part.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">{part.brand}</p>
                            <p className="text-lg font-bold text-primary mt-2">
                              ₹{part.price}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemove(item.partId)}
                            className="text-destructive hover:bg-red-50 p-2 rounded"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Qty:</span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.partId,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="p-1 border border-border rounded hover:bg-muted"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.partId,
                                Math.min(part.stock, item.quantity + 1)
                              )
                            }
                            className="p-1 border border-border rounded hover:bg-muted"
                          >
                            <Plus size={16} />
                          </button>
                          <span className="ml-auto text-lg font-bold">
                            ₹{part.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Continue Shopping */}
              <Link href="/shop" className="inline-block mt-6">
                <Button variant="outline" className="gap-2 bg-transparent">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shipping
                      {subtotal > 1000 && (
                        <span className="text-success ml-2 text-xs font-semibold">
                          FREE
                        </span>
                      )}
                    </span>
                    <span className="font-semibold">
                      {shippingCost === 0 ? (
                        <span className="text-success">Free</span>
                      ) : (
                        `₹${shippingCost}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (5%)</span>
                    <span className="font-semibold">₹{tax}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">₹{total}</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button size="lg" className="w-full gap-2 bg-secondary hover:bg-secondary/90">
                    Proceed to Checkout
                  </Button>
                </Link>

                {/* Discount Banner */}
                {subtotal < 1000 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
                    <p className="text-sm text-blue-900">
                      Add ₹{1000 - subtotal} more for free shipping!
                    </p>
                  </div>
                )}

                {/* Coupon Code */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Have a coupon code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-border rounded text-sm"
                    />
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
