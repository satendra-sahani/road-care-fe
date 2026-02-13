import { OrderHistoryPage } from '@/components/orders/OrderHistoryPage'

export default function Orders() {
  return <OrderHistoryPage />
}
import { DUMMY_ORDERS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { Package, MapPin, Clock, CheckCircle, Eye, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: ArrowRight },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Package },
}

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const filteredOrders = filterStatus
    ? DUMMY_ORDERS.filter((order) => order.status === filterStatus)
    : DUMMY_ORDERS

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-white/90">Track and manage your orders</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-4 py-2 rounded-full font-semibold transition ${
              filterStatus === null
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Orders
          </button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package size={64} className="mx-auto text-muted mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8">
              Start shopping to see your orders here
            </p>
            <Link href="/shop">
              <Button>Continue Shopping</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig]
              const Icon = config?.icon || Package

              return (
                <Card key={order.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">
                          Order #{order.id.padStart(6, '0')}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${config?.color}`}>
                          <Icon size={16} />
                          {config?.label}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ordered on {formatDate(order.orderDate)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.part.name} × {item.quantity}
                          </span>
                          <span className="font-semibold">₹{item.part.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="font-bold text-lg text-primary">₹{order.totalPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delivery Boy</p>
                      <p className="font-semibold">{order.deliveryBoy || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin size={14} /> Delivery Address
                      </p>
                      <p className="font-semibold text-xs">{order.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Delivery</p>
                      <p className="font-semibold">
                        {order.deliveryDate || 'Processing'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Eye size={16} /> View Details
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
