'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  CreditCard,
  Truck,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Edit,
  AlertCircle,
  Package
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

// Mock data
const mockCartItems = [
  {
    id: 'CART-001',
    name: 'Premium Brake Pads Set - Front',
    brand: 'Bosch',
    price: 3499,
    quantity: 2,
    image: '/products/brake-pads-1.jpg'
  },
  {
    id: 'CART-002',
    name: 'Engine Oil Filter - Premium Quality',
    brand: 'Mann-Filter',
    price: 849,
    quantity: 1,
    image: '/products/oil-filter-1.jpg'
  }
]

const mockAddresses = [
  {
    id: 'ADDR-001',
    type: 'Home',
    name: 'Rajesh Kumar',
    address: '123, Sector 15, Gurgaon, Haryana - 122001',
    phone: '+91 98765 43210',
    isDefault: true
  },
  {
    id: 'ADDR-002',
    type: 'Office',
    name: 'Rajesh Kumar',
    address: '456, DLF Phase 2, Gurgaon, Haryana - 122002',
    phone: '+91 98765 43211',
    isDefault: false
  }
]

const paymentMethods = [
  {
    id: 'UPI',
    name: 'UPI',
    description: 'Pay using UPI apps',
    icon: '📱'
  },
  {
    id: 'CARD',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, RuPay',
    icon: '💳'
  },
  {
    id: 'NETBANKING',
    name: 'Net Banking',
    description: 'All major banks supported',
    icon: '🏦'
  },
  {
    id: 'WALLET',
    name: 'Digital Wallet',
    description: 'Paytm, PhonePe, Amazon Pay',
    icon: '👛'
  },
  {
    id: 'COD',
    name: 'Cash on Delivery',
    description: 'Pay when you receive',
    icon: '💰'
  }
]

export function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState('ADDR-001')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  
  // New address form
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    state: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateSubtotal = () => {
    return mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    return subtotal >= 2000 ? 0 : 99
  }

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.18)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping()
  }

  const steps = [
    { id: 1, name: 'Address', completed: currentStep > 1 },
    { id: 2, name: 'Payment', completed: currentStep > 2 },
    { id: 3, name: 'Review', completed: currentStep > 3 },
    { id: 4, name: 'Confirmation', completed: false }
  ]

  const handleAddAddress = () => {
    // Add new address logic
    setShowAddAddress(false)
    setNewAddress({
      type: 'Home',
      name: '',
      phone: '',
      pincode: '',
      address: '',
      city: '',
      state: ''
    })
  }

  const placeOrder = () => {
    // Place order logic
    setCurrentStep(4)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/cart">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29]">Checkout</h1>
            <p className="text-[#6B7280] mt-1">Complete your order</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed
                        ? 'bg-green-600 text-white'
                        : currentStep === step.id
                        ? 'bg-[#1B3B6F] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step.completed || currentStep === step.id
                        ? 'text-[#1A1D29]'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-4 ${
                      step.completed ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address Selection */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                  {mockAddresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <label htmlFor={address.id} className="cursor-pointer">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline">{address.type}</Badge>
                            {address.isDefault && (
                              <Badge className="bg-green-100 text-green-800">Default</Badge>
                            )}
                          </div>
                          <p className="font-medium text-[#1A1D29]">{address.name}</p>
                          <p className="text-sm text-[#6B7280]">{address.address}</p>
                          <p className="text-sm text-[#6B7280]">{address.phone}</p>
                        </label>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </RadioGroup>

                <Separator />

                <Button
                  variant="outline"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>

                {showAddAddress && (
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="addressType">Address Type</Label>
                          <Select value={newAddress.type} onValueChange={(value) => setNewAddress(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Office">Office</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))}
                            placeholder="Enter pincode"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter full address"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="Enter state"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button onClick={handleAddAddress} size="sm">
                          Save Address
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddAddress(false)} size="sm">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    disabled={!selectedAddress}
                  >
                    Continue to Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className="flex-1 flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <label htmlFor={method.id} className="cursor-pointer font-medium text-[#1A1D29]">
                            {method.name}
                          </label>
                          <p className="text-sm text-[#6B7280]">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Address
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    disabled={!paymentMethod}
                  >
                    Continue to Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Order Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Address Confirmation */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Delivery Address
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Change
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const address = mockAddresses.find(addr => addr.id === selectedAddress)
                    return address ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{address.type}</Badge>
                        <div>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-sm text-[#6B7280]">{address.address}</p>
                          <p className="text-sm text-[#6B7280]">{address.phone}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </CardContent>
              </Card>

              {/* Payment Method Confirmation */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Method
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                      Change
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const method = paymentMethods.find(pm => pm.id === paymentMethod)
                    return method ? (
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-[#6B7280]">{method.description}</p>
                        </div>
                      </div>
                    ) : null
                  })()}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {item.brand}
                          </Badge>
                          <h3 className="font-medium text-[#1A1D29]">{item.name}</h3>
                          <p className="text-sm text-[#6B7280]">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1A1D29]">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special instructions for delivery..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payment
                </Button>
                <Button
                  onClick={placeOrder}
                  className="bg-[#1B3B6F] hover:bg-[#0F2545] text-lg px-8"
                >
                  Place Order
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Order Confirmation */}
          {currentStep === 4 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#1A1D29] mb-2">Order Placed Successfully!</h2>
                <p className="text-[#6B7280] mb-6">
                  Thank you for your order. You will receive a confirmation email shortly.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-[#6B7280] mb-1">Order Number</p>
                  <p className="text-lg font-bold text-[#1A1D29]">#ORD-2024-001</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/orders">
                    <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      Track Your Order
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="outline">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>
                    {calculateShipping() === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatCurrency(calculateShipping())
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Tax (GST 18%)</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>

              {/* Delivery Info */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                  <Truck className="h-4 w-4" />
                  <span>Expected delivery in 2-3 business days</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment & 100% safe checkout</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-[#6B7280]">
                  <AlertCircle className="h-4 w-4" />
                  <span>Call us: 1800-123-4567</span>
                </div>
                <div className="flex items-center space-x-2 text-[#6B7280]">
                  <Clock className="h-4 w-4" />
                  <span>Available 24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}