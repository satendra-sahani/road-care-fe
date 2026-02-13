'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  User,
  MapPin,
  Package,
  Clock,
  Phone,
  Mail,
  Edit,
  Settings,
  Heart,
  ShoppingBag,
  Truck,
  CreditCard,
  Star,
  LogOut,
  Camera
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock user data
const mockUser = {
  id: 'USER-001',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@email.com',
  phone: '+91 98765 43210',
  avatar: '/avatar-placeholder.jpg',
  joinedDate: '2023-01-15',
  totalOrders: 24,
  totalSpent: 45678,
  vehicleInfo: {
    make: 'Maruti',
    model: 'Swift',
    year: 2020,
    registration: 'DL-8C-1234'
  }
}

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

const mockWishlist = [
  {
    id: 'WISH-001',
    productId: 'PRD-001',
    name: 'Premium Brake Discs Set',
    brand: 'Brembo',
    price: 5999,
    originalPrice: 7299,
    image: '/products/brake-disc-1.jpg',
    inStock: true,
    rating: 4.7
  },
  {
    id: 'WISH-002',
    productId: 'PRD-002',
    name: 'Performance Air Filter',
    brand: 'K&N',
    price: 1999,
    originalPrice: 2499,
    image: '/products/air-filter-1.jpg',
    inStock: false,
    rating: 4.8
  }
]

const mockPaymentMethods = [
  {
    id: 'PM-001',
    type: 'UPI',
    details: 'rajesh@paytm',
    isDefault: true
  },
  {
    id: 'PM-002',
    type: 'Card',
    details: '**** **** **** 1234',
    isDefault: false
  }
]

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState(mockUser)
  const [showAddAddress, setShowAddAddress] = useState(false)

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
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback className="text-xl font-semibold bg-[#1B3B6F] text-white">
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1A1D29]">{mockUser.name}</h1>
          <p className="text-[#6B7280] mt-1">{mockUser.email}</p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge className="bg-green-100 text-green-800">
              {mockUser.totalOrders} Orders
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              Member since {formatDate(mockUser.joinedDate)}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{mockUser.totalOrders}</p>
                    <p className="text-[#6B7280] text-sm">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{formatCurrency(mockUser.totalSpent)}</p>
                    <p className="text-[#6B7280] text-sm">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{mockWishlist.length}</p>
                    <p className="text-[#6B7280] text-sm">Wishlist Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[#6B7280]">Make & Model</p>
                  <p className="font-medium">{mockUser.vehicleInfo.make} {mockUser.vehicleInfo.model}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Year</p>
                  <p className="font-medium">{mockUser.vehicleInfo.year}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Registration</p>
                  <p className="font-medium">{mockUser.vehicleInfo.registration}</p>
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Wishlist */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Recent Wishlist Items
                </span>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('wishlist')}>
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockWishlist.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
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
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs mb-1">
                        {item.brand}
                      </Badge>
                      <h3 className="font-medium text-[#1A1D29] text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm font-bold text-[#1A1D29]">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-[#6B7280]" />
                      <div>
                        <p className="text-sm text-[#6B7280]">Full Name</p>
                        <p className="font-medium">{profileData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-[#6B7280]" />
                      <div>
                        <p className="text-sm text-[#6B7280]">Email</p>
                        <p className="font-medium">{profileData.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-[#6B7280]" />
                      <div>
                        <p className="text-sm text-[#6B7280]">Phone</p>
                        <p className="font-medium">{profileData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-[#6B7280]" />
                      <div>
                        <p className="text-sm text-[#6B7280]">Member Since</p>
                        <p className="font-medium">{formatDate(profileData.joinedDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Select value={mockUser.vehicleInfo.make}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maruti">Maruti</SelectItem>
                      <SelectItem value="Hyundai">Hyundai</SelectItem>
                      <SelectItem value="Honda">Honda</SelectItem>
                      <SelectItem value="Toyota">Toyota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={mockUser.vehicleInfo.model} />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select value={mockUser.vehicleInfo.year.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => 2024 - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="registration">Registration Number</Label>
                  <Input id="registration" value={mockUser.vehicleInfo.registration} />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  Update Vehicle Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Saved Addresses</h2>
            <Button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            >
              Add New Address
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockAddresses.map((address) => (
              <Card key={address.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{address.type}</Badge>
                      {address.isDefault && (
                        <Badge className="bg-green-100 text-green-800">Default</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-[#1A1D29]">{address.name}</p>
                    <p className="text-sm text-[#6B7280]">{address.address}</p>
                    <p className="text-sm text-[#6B7280]">{address.phone}</p>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    {!address.isDefault && (
                      <Button variant="outline" size="sm">
                        Set as Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {showAddAddress && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Add New Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressType">Address Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="Enter full name" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter phone number" />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" placeholder="Enter pincode" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter full address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Enter city" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="Enter state" />
                  </div>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                    Save Address
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddAddress(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Wishlist</h2>
            <p className="text-[#6B7280]">{mockWishlist.length} items</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockWishlist.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.png'
                      }}
                    />
                  </div>
                  
                  <Badge variant="secondary" className="text-xs mb-2">
                    {item.brand}
                  </Badge>
                  
                  <h3 className="font-medium text-[#1A1D29] mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-[#6B7280]">{item.rating}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-bold text-[#1A1D29]">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-sm text-[#6B7280] line-through">
                      {formatCurrency(item.originalPrice)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {item.inStock ? (
                      <Button size="sm" className="flex-1 bg-[#1B3B6F] hover:bg-[#0F2545]">
                        Add to Cart
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        Out of Stock
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Methods</h2>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Add Payment Method
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockPaymentMethods.map((method) => (
              <Card key={method.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1D29]">{method.type}</p>
                        <p className="text-sm text-[#6B7280]">{method.details}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800">Default</Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!method.isDefault && (
                      <Button variant="outline" size="sm">
                        Set as Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-[#6B7280]">Get notified about order status changes</p>
                </div>
                <Button variant="outline" size="sm">Toggle</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Offers</p>
                  <p className="text-sm text-[#6B7280]">Receive deals and offers via email</p>
                </div>
                <Button variant="outline" size="sm">Toggle</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-[#6B7280]">Get SMS updates for important events</p>
                </div>
                <Button variant="outline" size="sm">Toggle</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-[#6B7280]">Update your account password</p>
                </div>
                <Button variant="outline">Change</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-[#6B7280]">Add an extra layer of security</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-[#6B7280]">Permanently delete your account and data</p>
                </div>
                <Button variant="outline" className="text-red-600 hover:text-red-700 border-red-200">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}