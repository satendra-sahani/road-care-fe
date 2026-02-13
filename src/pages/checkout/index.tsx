import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return <CheckoutPage />
}
import Link from 'next/link'
import { useState } from 'react'

export default function CheckoutPage() {
  const [addressType, setAddressType] = useState<'home' | 'work'>('home')
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'confirm'>('address')
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (currentStep === 'address') {
      setCurrentStep('payment')
    } else if (currentStep === 'payment') {
      setCurrentStep('confirm')
    }
  }

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address')
    } else if (currentStep === 'confirm') {
      setCurrentStep('payment')
    }
  }

  const subtotal = 2597
  const shipping = 100
  const tax = 134
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-white/90 mt-2">Complete your purchase</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {(['address', 'payment', 'confirm'] as const).map((step, index) => (
              <div key={step} className="flex items-center gap-4 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep === step || (
                      (currentStep === 'payment' && step === 'address') ||
                      (currentStep === 'confirm' && (step === 'address' || step === 'payment'))
                    )
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold capitalize text-sm">{step === 'address' ? 'Delivery Address' : step === 'payment' ? 'Payment' : 'Confirmation'}</p>
                </div>
                {index < 2 && <ArrowRight className="text-muted" size={20} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Address Section */}
            {currentStep === 'address' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>

                {/* Address Type */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Address Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAddressType('home')}
                      className={`p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                        addressType === 'home'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <Home size={24} />
                      <div className="text-left">
                        <p className="font-bold">Home</p>
                        <p className="text-xs text-muted-foreground">Residential</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setAddressType('work')}
                      className={`p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                        addressType === 'work'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <Building2 size={24} />
                      <div className="text-left">
                        <p className="font-bold">Office</p>
                        <p className="text-xs text-muted-foreground">Commercial</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Personal Details */}
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <User size={20} /> Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Input
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Address Details */}
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MapPin size={20} /> Address Details
                </h3>
                <div className="space-y-4 mb-6">
                  <Textarea
                    name="addressLine1"
                    placeholder="House No., Building Name"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="h-20"
                    required
                  />
                  <Input
                    name="addressLine2"
                    placeholder="Road Name, Area, Colony (Optional)"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="pincode"
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <Button onClick={handleNext} size="lg" className="w-full bg-secondary hover:bg-secondary/90">
                  Continue to Payment
                </Button>
              </Card>
            )}

            {/* Payment Section */}
            {currentStep === 'payment' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

                <div className="space-y-4 mb-6">
                  <label className="flex items-center p-4 border-2 border-primary bg-primary/5 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="mr-4" />
                    <div>
                      <p className="font-bold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, or RuPay</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary">
                    <input type="radio" name="payment" className="mr-4" />
                    <div>
                      <p className="font-bold">UPI</p>
                      <p className="text-sm text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary">
                    <input type="radio" name="payment" className="mr-4" />
                    <div>
                      <p className="font-bold">Net Banking</p>
                      <p className="text-sm text-muted-foreground">Direct transfer from your bank</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary">
                    <input type="radio" name="payment" className="mr-4" />
                    <div>
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when the order arrives</p>
                    </div>
                  </label>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <Lock size={16} className="inline mr-2" />
                    Your payment information is secure and encrypted
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleBack} variant="outline" size="lg" className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Button onClick={handleNext} size="lg" className="flex-1 bg-secondary hover:bg-secondary/90">
                    Continue
                  </Button>
                </div>
              </Card>
            )}

            {/* Confirmation Section */}
            {currentStep === 'confirm' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Order Confirmation</h2>

                <div className="space-y-6">
                  {/* Delivery Address Summary */}
                  <div>
                    <h3 className="font-bold mb-3">Delivery Address</h3>
                    <Card className="p-4 bg-muted">
                      <p className="font-semibold">{formData.fullName}</p>
                      <p className="text-sm text-muted-foreground">{formData.phone}</p>
                      <p className="text-sm mt-2">{formData.addressLine1}, {formData.addressLine2}</p>
                      <p className="text-sm">{formData.city}, {formData.state} - {formData.pincode}</p>
                    </Card>
                  </div>

                  {/* Items Summary */}
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Package size={20} /> Order Items
                    </h3>
                    <Card className="divide-y divide-border">
                      {[
                        { name: 'Engine Oil Filter', brand: 'Bosch', qty: 2, price: 299 },
                        { name: 'Brake Pads Set', brand: 'Brembo', qty: 1, price: 1200 },
                        { name: 'Car Battery', brand: 'Exide', qty: 1, price: 3500 },
                      ].map((item, index) => (
                        <div key={index} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.brand} × {item.qty}</p>
                          </div>
                          <p className="font-semibold">₹{item.price * item.qty}</p>
                        </div>
                      ))}
                    </Card>
                  </div>

                  {/* Terms */}
                  <Card className="p-4 bg-yellow-50 border-yellow-100">
                    <p className="text-sm text-yellow-900">
                      By placing this order, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </Card>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button onClick={handleBack} variant="outline" size="lg" className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Link href="/orders" className="flex-1">
                    <Button size="lg" className="w-full bg-secondary hover:bg-secondary/90">
                      Place Order
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                {[
                  { name: 'Engine Oil Filter', qty: 2, price: 299 },
                  { name: 'Brake Pads Set', qty: 1, price: 1200 },
                  { name: 'Car Battery', qty: 1, price: 3500 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm">{item.name}</p>
                      <p className="text-sm font-semibold">₹{item.price * item.qty}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{shipping}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">₹{total}</span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Free returns within 30 days</p>
                <p>✓ 100% authentic products</p>
                <p>✓ Secure payment guaranteed</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
