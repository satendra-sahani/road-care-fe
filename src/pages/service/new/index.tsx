import { ServicePage } from '@/components/service/ServicePage'

export default function ServiceNew() {
  return <ServicePage />
}
import Link from 'next/link'
import { useState } from 'react'

export default function NewServiceRequestPage() {
  const [serviceType, setServiceType] = useState<'home' | 'roadside'>('home')
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'scooter'>('car')
  const [formData, setFormData] = useState({
    problem: '',
    location: '',
    landmark: '',
    contactNumber: '',
    selectedDate: '',
    selectedTime: '',
  })
  const [photos, setPhotos] = useState<string[]>([])

  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[v0] Form submitted:', { serviceType, vehicleType, formData })
    alert('Service request submitted successfully!')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/service" className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Services
          </Link>
          <h1 className="text-3xl font-bold">Request a Service</h1>
          <p className="text-white/90 mt-2">Our mechanics will respond to your request shortly</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Service Type *</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setServiceType('home')}
                className={`p-4 rounded-lg border-2 text-center transition ${
                  serviceType === 'home'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}
              >
                <div className="text-3xl mb-2">🏠</div>
                <p className="font-bold">Home Service</p>
                <p className="text-xs text-muted-foreground">Schedule at your location</p>
              </button>
              <button
                type="button"
                onClick={() => setServiceType('roadside')}
                className={`p-4 rounded-lg border-2 text-center transition ${
                  serviceType === 'roadside'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border hover:border-destructive'
                }`}
              >
                <div className="text-3xl mb-2">🚨</div>
                <p className="font-bold">Roadside Emergency</p>
                <p className="text-xs text-muted-foreground">Immediate assistance</p>
              </button>
            </div>
          </Card>

          {/* Vehicle Type */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Vehicle Type *</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['bike', 'car', 'scooter'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={`p-3 rounded-lg border-2 transition ${
                    vehicleType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <p className="text-2xl mb-1">
                    {type === 'car' ? '🚗' : type === 'bike' ? '🏍️' : '🛵'}
                  </p>
                  <p className="font-semibold text-sm capitalize">{type}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Problem Description */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Problem Description *</h2>
            <Textarea
              name="problem"
              placeholder="Describe the issue you're facing with your vehicle..."
              value={formData.problem}
              onChange={handleInputChange}
              className="min-h-32"
              required
            />
          </Card>

          {/* Photos */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Upload Photos (Optional)</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
              <Upload className="mx-auto text-muted mb-2" size={32} />
              <p className="font-semibold mb-1">Upload photos of the issue</p>
              <p className="text-sm text-muted-foreground">Max 3 photos, up to 5MB each</p>
            </div>
            {photos.length > 0 && (
              <div className="mt-4 flex gap-2">
                {photos.map((_, index) => (
                  <div key={index} className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    📸
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Location Details *</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Location
                </label>
                <Input
                  type="text"
                  name="location"
                  placeholder="Enter your location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Landmark (Optional)</label>
                <Input
                  type="text"
                  name="landmark"
                  placeholder="Nearby landmark to help us locate you"
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </Card>

          {/* Date & Time (for home service) */}
          {serviceType === 'home' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Select Date & Time *</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Preferred Date
                  </label>
                  <Input
                    type="date"
                    name="selectedDate"
                    value={formData.selectedDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3">Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, selectedTime: slot }))}
                        className={`p-3 rounded-lg border transition text-sm font-semibold ${
                          formData.selectedTime === slot
                            ? 'border-primary bg-primary text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Contact Number */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Contact Information *</h2>
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Phone size={16} className="inline mr-2" />
                Contact Number
              </label>
              <Input
                type="tel"
                name="contactNumber"
                placeholder="Your contact number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
            </div>
          </Card>

          {/* Estimated Charges */}
          <Card className="p-6 bg-blue-50 border-blue-100">
            <h3 className="font-bold mb-2">Estimated Service Charge</h3>
            <p className="text-2xl font-bold text-primary mb-2">₹500 - ₹1200</p>
            <p className="text-sm text-muted-foreground">
              *Actual charges may vary based on the service required. A mechanic will confirm the final amount.
            </p>
          </Card>

          {/* Emergency Call (for roadside) */}
          {serviceType === 'roadside' && (
            <Card className="p-6 bg-destructive/10 border-destructive/30">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">🚨</span>
                Emergency Assistance
              </h3>
              <p className="text-sm mb-3">For urgent roadside help, you can also call:</p>
              <p className="text-lg font-bold">1-800-ROADCARE</p>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/service" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
