'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Car,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

// Mock services data
const mockServices = [
  {
    id: 'SERVICE-001',
    title: 'Basic Car Service',
    description: 'Complete car inspection and basic maintenance',
    price: 1999,
    duration: '2-3 hours',
    rating: 4.5,
    reviews: 234,
    image: '/services/basic-service.jpg',
    includes: ['Engine Oil Change', 'Oil Filter Replacement', 'Basic Inspection', 'Car Wash']
  },
  {
    id: 'SERVICE-002',
    title: 'Premium Car Service',
    description: 'Comprehensive car service with detailed inspection',
    price: 3499,
    duration: '4-5 hours',
    rating: 4.8,
    reviews: 189,
    image: '/services/premium-service.jpg',
    includes: ['Engine Oil Change', 'All Filters Replacement', 'Brake Inspection', 'AC Service', 'Car Wash', 'Interior Cleaning']
  },
  {
    id: 'SERVICE-003',
    title: 'AC Service & Repair',
    description: 'Complete AC system check and repair',
    price: 1299,
    duration: '1-2 hours',
    rating: 4.6,
    reviews: 156,
    image: '/services/ac-service.jpg',
    includes: ['AC Gas Refill', 'Filter Cleaning', 'Cooling Check', 'Thermostat Check']
  },
  {
    id: 'SERVICE-004',
    title: 'Brake Service',
    description: 'Complete brake system inspection and service',
    price: 899,
    duration: '1-2 hours',
    rating: 4.7,
    reviews: 203,
    image: '/services/brake-service.jpg',
    includes: ['Brake Pad Check', 'Brake Fluid Check', 'Disc Inspection', 'Brake Performance Test']
  }
]

// Mock service requests data
const mockServiceRequests = [
  {
    id: 'REQ-001',
    serviceId: 'SERVICE-001',
    serviceName: 'Basic Car Service',
    date: '2024-01-25T10:00:00Z',
    status: 'Confirmed',
    mechanicName: 'Ramesh Sharma',
    mechanicPhone: '+91 98765 43210',
    mechanicRating: 4.8,
    address: '123, Sector 15, Gurgaon, Haryana - 122001',
    vehicleInfo: 'Maruti Swift 2020 (DL-8C-1234)',
    amount: 1999,
    canCancel: true,
    canReschedule: true
  },
  {
    id: 'REQ-002',
    serviceId: 'SERVICE-003',
    serviceName: 'AC Service & Repair',
    date: '2024-01-20T14:00:00Z',
    status: 'Completed',
    mechanicName: 'Suresh Kumar',
    mechanicPhone: '+91 98765 43211',
    mechanicRating: 4.6,
    address: '456, DLF Phase 2, Gurgaon, Haryana - 122002',
    vehicleInfo: 'Maruti Swift 2020 (DL-8C-1234)',
    amount: 1299,
    canCancel: false,
    canReschedule: false,
    canReview: true
  }
]

export function ServicePage() {
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  
  // Booking form state
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    address: '123, Sector 15, Gurgaon, Haryana - 122001',
    vehicleInfo: 'Maruti Swift 2020 (DL-8C-1234)',
    notes: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredServices = mockServices.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBookService = () => {
    // Handle service booking
    setShowBookingForm(false)
    setSelectedService(null)
    setActiveTab('requests')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1D29]">Auto Services</h1>
        <p className="text-[#6B7280] mt-1">Professional car service at your doorstep</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Services</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="new">Book Service</TabsTrigger>
        </TabsList>

        {/* Browse Services Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-service.png'
                      }}
                    />
                  </div>

                  <h3 className="font-semibold text-[#1A1D29] mb-2">{service.title}</h3>
                  <p className="text-sm text-[#6B7280] mb-3 line-clamp-2">{service.description}</p>

                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.rating}</span>
                    <span className="text-sm text-[#6B7280]">({service.reviews} reviews)</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-[#1A1D29]">{formatCurrency(service.price)}</p>
                      <p className="text-sm text-[#6B7280]">{service.duration}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-[#1A1D29]">Includes:</p>
                    <ul className="text-sm text-[#6B7280] space-y-1">
                      {service.includes.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {service.includes.length > 3 && (
                        <li className="text-xs text-[#6B7280]">
                          +{service.includes.length - 3} more services
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedService(service)
                      setShowBookingForm(true)
                      setActiveTab('new')
                    }}
                    className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]"
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Service Requests</h2>
            <p className="text-[#6B7280]">{mockServiceRequests.length} requests</p>
          </div>

          <div className="space-y-4">
            {mockServiceRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={
                          request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {request.status}
                        </Badge>
                        <span className="text-sm text-[#6B7280]">
                          Request #{request.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#1A1D29]">{request.serviceName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-[#6B7280] mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(request.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Car className="h-4 w-4" />
                            <span>{request.vehicleInfo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-[#6B7280]" />
                          <span className="text-sm">{request.mechanicName}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-[#6B7280]">{request.mechanicRating}</span>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-[#6B7280] mt-0.5" />
                          <span className="text-sm text-[#6B7280]">{request.address}</span>
                        </div>
                      </div>

                      <div className="text-lg font-bold text-[#1A1D29]">
                        {formatCurrency(request.amount)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {request.canReschedule && (
                        <Button variant="outline">
                          <Clock className="h-4 w-4 mr-2" />
                          Reschedule
                        </Button>
                      )}
                      {request.canCancel && (
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                          Cancel
                        </Button>
                      )}
                      {request.canReview && (
                        <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                          <Star className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      )}
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Mechanic
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {mockServiceRequests.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No service requests</h3>
                  <p className="text-[#6B7280] mb-6">You haven't booked any services yet</p>
                  <Button
                    onClick={() => setActiveTab('browse')}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                  >
                    Browse Services
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Book Service Tab */}
        <TabsContent value="new" className="space-y-6">
          {!showBookingForm ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#1A1D29] mb-2">Select a Service</h3>
                <p className="text-[#6B7280] mb-6">Choose from our available services to get started</p>
                <Button
                  onClick={() => setActiveTab('browse')}
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                >
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          ) : selectedService && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Book {selectedService.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date & Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Preferred Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={bookingData.date}
                          onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                          min={typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '2026-02-12'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Preferred Time</Label>
                        <Select value={bookingData.time} onValueChange={(value) => setBookingData(prev => ({ ...prev, time: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">09:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="14:00">02:00 PM</SelectItem>
                            <SelectItem value="15:00">03:00 PM</SelectItem>
                            <SelectItem value="16:00">04:00 PM</SelectItem>
                            <SelectItem value="17:00">05:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="address">Service Address</Label>
                      <Textarea
                        id="address"
                        value={bookingData.address}
                        onChange={(e) => setBookingData(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {/* Vehicle Info */}
                    <div>
                      <Label htmlFor="vehicle">Vehicle Information</Label>
                      <Input
                        id="vehicle"
                        value={bookingData.vehicleInfo}
                        onChange={(e) => setBookingData(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                        placeholder="e.g., Maruti Swift 2020 (DL-8C-1234)"
                      />
                    </div>

                    {/* Special Notes */}
                    <div>
                      <Label htmlFor="notes">Special Instructions (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={bookingData.notes}
                        onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any specific requirements or issues..."
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={handleBookService}
                        className="flex-1 bg-[#1B3B6F] hover:bg-[#0F2545]"
                        disabled={!bookingData.date || !bookingData.time}
                      >
                        Confirm Booking
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBookingForm(false)
                          setSelectedService(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Summary */}
              <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Service Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={selectedService.image}
                        alt={selectedService.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-service.png'
                        }}
                      />
                    </div>

                    <h3 className="font-semibold text-[#1A1D29] mb-2">{selectedService.title}</h3>
                    <p className="text-sm text-[#6B7280] mb-3">{selectedService.description}</p>

                    <div className="flex items-center space-x-1 mb-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{selectedService.rating}</span>
                      <span className="text-sm text-[#6B7280]">({selectedService.reviews} reviews)</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6B7280]">Duration</span>
                        <span className="text-sm font-medium">{selectedService.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#6B7280]">Service Price</span>
                        <span className="text-lg font-bold text-[#1A1D29]">{formatCurrency(selectedService.price)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#1A1D29]">What's Included:</p>
                      <ul className="space-y-1">
                        {selectedService.includes.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-[#6B7280]">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notes */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-[#1A1D29]">Important Notes:</h4>
                        <ul className="text-sm text-[#6B7280] space-y-1">
                          <li>• Mechanic will arrive at your location</li>
                          <li>• Payment can be made after service completion</li>
                          <li>• Free cancellation up to 2 hours before appointment</li>
                          <li>• All parts used are genuine and come with warranty</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}