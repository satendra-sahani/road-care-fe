import { ProfilePage } from '@/components/profile/ProfilePage'

export default function Profile() {
  return <ProfilePage />
}
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { User, Mail, Phone, MapPin, Lock, LogOut, Heart, Settings, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    address: '123 Main Street, City',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-white/90 mt-2">Manage your account and preferences</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-6 text-center sticky top-24">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-1">John Doe</h2>
              <p className="text-sm text-muted-foreground mb-6">Regular Customer</p>

              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                  <p className="text-2xl font-bold">2,450</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={24} /> Personal Information
                </h2>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : null}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                    <p className="font-semibold">{formData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Default Address</p>
                    <p className="font-semibold">{formData.address}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    name="fullName"
                    label="Full Name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="email"
                    type="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="phone"
                    label="Phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <Input
                    name="address"
                    label="Address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Saved Addresses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin size={24} /> Saved Addresses
                </h2>
                <Button variant="outline" size="sm">
                  Add New
                </Button>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'Home', address: '123 Main Street, Apt 4B, City' },
                  { type: 'Work', address: '456 Business Plaza, Suite 200, City' },
                ].map((item, index) => (
                  <Card key={index} className="p-4 flex items-start justify-between">
                    <div>
                      <p className="font-bold">{item.type}</p>
                      <p className="text-sm text-muted-foreground">{item.address}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight size={20} />
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings size={24} /> Account Settings
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition">
                  <span className="flex items-center gap-3">
                    <Lock size={20} />
                    Change Password
                  </span>
                  <ChevronRight size={20} className="text-muted" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition">
                  <span className="flex items-center gap-3">
                    <Mail size={20} />
                    Email Preferences
                  </span>
                  <ChevronRight size={20} className="text-muted" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition">
                  <span className="flex items-center gap-3">
                    <Heart size={20} />
                    Wishlist & Favorites
                  </span>
                  <ChevronRight size={20} className="text-muted" />
                </button>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <h2 className="text-xl font-bold mb-4 text-destructive">Danger Zone</h2>
              <Button variant="destructive" className="w-full gap-2">
                <LogOut size={20} /> Logout
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
