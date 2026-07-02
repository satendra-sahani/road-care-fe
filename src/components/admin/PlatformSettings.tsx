'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Plus,
  Settings,
  Shield,
  CreditCard,
  Wrench,
  Globe,
  Bell,
  Users,
  Database,
  Mail,
  Smartphone,
  Lock,
  Key,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Save,
  Upload,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

// Mock settings data
const mockGeneralSettings = {
  siteName: 'Bharat Machenics Auto Parts',
  siteDescription: 'Your trusted partner for genuine auto parts and vehicle services',
  contactEmail: 'support@roadcare.com',
  contactPhone: '+91 1800-ROADCARE',
  address: '123 Auto Street, Mumbai, Maharashtra 400001',
  timezone: 'Asia/Kolkata',
  language: 'en',
  currency: 'INR',
  maintenanceMode: false,
  registrationEnabled: true,
  guestCheckout: true,
  multiCurrency: false,
  multiLanguage: false,
  autoBackup: true,
  analyticsEnabled: true
}

const mockPaymentGateways = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    type: 'payment_processor',
    status: 'active',
    isConfigured: true,
    fees: '2.5%',
    logo: '/logos/razorpay.png',
    config: {
      keyId: 'rzp_test_***********',
      keySecret: '**********************',
      webhookSecret: '**********************'
    }
  },
  {
    id: 'paytm',
    name: 'Paytm',
    type: 'payment_processor', 
    status: 'inactive',
    isConfigured: false,
    fees: '2.0%',
    logo: '/logos/paytm.png',
    config: {}
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    type: 'payment_processor',
    status: 'active',
    isConfigured: true,
    fees: '1.8%',
    logo: '/logos/phonepe.png',
    config: {
      merchantId: 'ROADCARE***',
      saltKey: '**********************',
      saltIndex: '1'
    }
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'offline',
    status: 'active',
    isConfigured: true,
    fees: '₹25 per order',
    logo: '/logos/cod.png',
    config: {
      maxAmount: 10000,
      availableZones: ['Mumbai', 'Delhi', 'Bangalore']
    }
  }
]

const mockSecuritySettings = {
  twoFactorAuth: true,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  ipWhitelisting: false,
  loginAttempts: 5,
  accountLockoutDuration: 15,
  encryptionLevel: 'AES-256',
  sslCertificate: {
    issuer: 'Let\'s Encrypt',
    validUntil: '2026-08-15T00:00:00Z',
    status: 'valid'
  }
}

const mockUserRoles = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    userCount: 3,
    permissions: ['*'],
    isDefault: false,
    canDelete: false
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage orders, inventory, and users',
    userCount: 5,
    permissions: ['orders.*', 'inventory.*', 'users.read', 'reports.*'],
    isDefault: false,
    canDelete: true
  },
  {
    id: 'customer_service',
    name: 'Customer Service',
    description: 'Handle customer support and inquiries',
    userCount: 8,
    permissions: ['orders.read', 'customers.*', 'support.*'],
    isDefault: false,
    canDelete: true
  },
  {
    id: 'customer',
    name: 'Customer',
    description: 'Standard customer account with basic permissions',
    userCount: 1247,
    permissions: ['profile.*', 'orders.create', 'orders.read.own'],
    isDefault: true,
    canDelete: false
  }
]

const mockSystemHealth = {
  serverStatus: 'healthy',
  dbStatus: 'healthy',
  cacheStatus: 'healthy',
  storageUsage: 67,
  memoryUsage: 45,
  cpuUsage: 23,
  lastBackup: '2026-02-12T04:00:00Z',
  uptime: '15 days, 4 hours',
  activeUsers: 234,
  systemVersion: '2.1.4',
  lastUpdate: '2026-02-01T00:00:00Z'
}

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
  configured: { color: 'bg-blue-100 text-blue-800', label: 'Configured' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
}

const healthStatus = {
  healthy: { color: 'text-green-600', label: 'Healthy', icon: CheckCircle },
  warning: { color: 'text-yellow-600', label: 'Warning', icon: AlertTriangle },
  critical: { color: 'text-red-600', label: 'Critical', icon: AlertTriangle }
}

export function PlatformSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGateway, setSelectedGateway] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [showNewRole, setShowNewRole] = useState(false)
  const [generalSettings, setGeneralSettings] = useState(mockGeneralSettings)
  const [securitySettings, setSecuritySettings] = useState(mockSecuritySettings)
  const [isLoading, setIsLoading] = useState(false)

  // Service Config (from API)
  const [serviceConfig, setServiceConfig] = useState({
    advanceFeeEnabled: false,
    advanceFeeAmount: 199,
    advanceFeeApplyTo: 'all',
    advanceFeeType: 'adjustable',
    bookingFeeEnabled: true,
    bookingFeeAmount: 99,
    emergencyBookingFeeAmount: 199,
    bookingFeeRefundPolicy: {
      shortText: 'Non-refundable booking fee. Adjusted against final service cost.',
      detailedText: '',
      adjustable: true,
    },
    codEnabled: true,
    onlineEnabled: true,
    qrCallingEnabled: true,
    qrCallingFee: 0,
    maxNegotiationRounds: 2,
    platformCommission: 15,
    minTrustScore: 40,
    autoBlockTrustScore: 20,
    autoCancel: { diagnosisTimeout: 60, paymentTimeout: 1440 },
    serviceSettings: { minOrderValue: 500, maxCancellations: 3, autoBlockAfterRefusals: 2 },
    androidApp: {
      latestVersion: '1.0.0',
      minimumVersion: '1.0.0',
      forceUpdate: false,
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.bharatmechanics',
      updateTitle: 'Update Available',
      updateMessage: 'A new version of Bharat Mechanics is available. Please update to continue using the app.'
    }
  })
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)

  // Load service config from API
  React.useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true)
      try {
        const { configAPI } = await import('@/services/api')
        const res = await configAPI.getConfig()
        if (res.data?.success && res.data?.data) {
          setServiceConfig(prev => ({
            ...prev,
            ...res.data.data,
            // Ensure nested objects are properly merged with defaults
            bookingFeeRefundPolicy: {
              ...prev.bookingFeeRefundPolicy,
              ...(res.data.data.bookingFeeRefundPolicy || {})
            },
            autoCancel: {
              ...prev.autoCancel,
              ...(res.data.data.autoCancel || {})
            },
            serviceSettings: {
              ...prev.serviceSettings,
              ...(res.data.data.serviceSettings || {})
            },
            androidApp: {
              ...prev.androidApp,
              ...(res.data.data.androidApp || {})
            }
          }))
        }
      } catch (err) {
        console.error('Failed to load config:', err)
      } finally {
        setConfigLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSaveServiceConfig = async () => {
    setConfigSaving(true)
    try {
      const { configAPI } = await import('@/services/api')
      const res = await configAPI.updateConfig(serviceConfig)
      if (res.data?.success) {
        alert('Service config saved successfully!')
      }
    } catch (err) {
      console.error('Failed to save config:', err)
      alert('Failed to save config')
    } finally {
      setConfigSaving(false)
    }
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

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getHealthStatus = (status: string) => {
    const config = healthStatus[status as keyof typeof healthStatus]
    const IconComponent = config.icon
    
    return (
      <div className={`flex items-center ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-1" />
        {config.label}
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const getSystemStats = () => {
    const totalUsers = mockUserRoles.reduce((sum, role) => sum + role.userCount, 0)
    const activeGateways = mockPaymentGateways.filter(g => g.status === 'active').length
    const configuredGateways = mockPaymentGateways.filter(g => g.isConfigured).length
    
    return { totalUsers, activeGateways, configuredGateways }
  }

  const stats = getSystemStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Platform Settings</h1>
          <p className="text-[#6B7280] mt-1">Configure and manage your platform settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Configuration
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-[#1B3B6F] hover:bg-[#0F2545]"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{getHealthStatus(mockSystemHealth.serverStatus)}</p>
                <p className="text-xs text-[#6B7280]">Server Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{mockSystemHealth.activeUsers}</p>
                <p className="text-xs text-[#6B7280]">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{stats.activeGateways}</p>
                <p className="text-xs text-[#6B7280]">Payment Gateways</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}</p>
                <p className="text-xs text-[#6B7280]">2FA Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{mockSystemHealth.storageUsage}%</p>
                <p className="text-xs text-[#6B7280]">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{mockSystemHealth.uptime}</p>
                <p className="text-xs text-[#6B7280]">System Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="app-update">App Update</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>Configure your platform's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactEmail: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({...generalSettings, contactPhone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Preferences
                </CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0:00)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (GMT-5:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings({...generalSettings, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-[#6B7280]">Put site in maintenance mode</p>
                    </div>
                    <Switch
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>User Registration</Label>
                      <p className="text-sm text-[#6B7280]">Allow new user registration</p>
                    </div>
                    <Switch
                      checked={generalSettings.registrationEnabled}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, registrationEnabled: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Guest Checkout</Label>
                      <p className="text-sm text-[#6B7280]">Allow checkout without registration</p>
                    </div>
                    <Switch
                      checked={generalSettings.guestCheckout}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, guestCheckout: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analytics Tracking</Label>
                      <p className="text-sm text-[#6B7280]">Enable analytics and tracking</p>
                    </div>
                    <Switch
                      checked={generalSettings.analyticsEnabled}
                      onCheckedChange={(checked) => setGeneralSettings({...generalSettings, analyticsEnabled: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Gateways
                  </CardTitle>
                  <CardDescription>Configure and manage payment methods</CardDescription>
                </div>
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gateway
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockPaymentGateways.map((gateway) => (
                  <div key={gateway.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#1A1D29]">{gateway.name}</h3>
                          <p className="text-sm text-[#6B7280]">Processing fees: {gateway.fees}</p>
                        </div>
                      </div>
                      {getStatusBadge(gateway.status)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-[#6B7280]">Configuration:</span>
                      <span className={`font-medium ${gateway.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                        {gateway.isConfigured ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedGateway(gateway)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Configuration — real API */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2" />
                    Service Configuration
                  </CardTitle>
                  <CardDescription>Configure advance fees, payment methods, and platform settings</CardDescription>
                </div>
                <Button
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                  onClick={handleSaveServiceConfig}
                  disabled={configSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {configSaving ? 'Saving...' : 'Save Config'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {configLoading ? (
                <p className="text-[#6B7280]">Loading config...</p>
              ) : (
                <>
                  {/* Advance Fee */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Advance Fee (Before Mechanic Dispatch)</Label>
                        <p className="text-sm text-[#6B7280]">Require customers to pay advance fee before mechanic is sent</p>
                      </div>
                      <Switch
                        checked={serviceConfig.advanceFeeEnabled}
                        onCheckedChange={(checked) => setServiceConfig({...serviceConfig, advanceFeeEnabled: checked})}
                      />
                    </div>
                    {serviceConfig.advanceFeeEnabled && (
                      <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div>
                          <Label htmlFor="advanceFeeAmount">Amount (₹)</Label>
                          <Input
                            id="advanceFeeAmount"
                            type="number"
                            value={serviceConfig.advanceFeeAmount}
                            onChange={(e) => setServiceConfig({...serviceConfig, advanceFeeAmount: parseInt(e.target.value) || 0})}
                            className="max-w-xs"
                          />
                        </div>
                        <div>
                          <Label>Apply To</Label>
                          <Select
                            value={serviceConfig.advanceFeeApplyTo || 'all'}
                            onValueChange={(val) => setServiceConfig({...serviceConfig, advanceFeeApplyTo: val})}
                          >
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All customers</SelectItem>
                              <SelectItem value="new_only">New customers only (0 completed orders)</SelectItem>
                              <SelectItem value="low_trust">Low trust customers (trust score below threshold)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Fee Type</Label>
                          <Select
                            value={serviceConfig.advanceFeeType || 'adjustable'}
                            onValueChange={(val) => setServiceConfig({...serviceConfig, advanceFeeType: val})}
                          >
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adjustable">Adjustable (deduct from final bill)</SelectItem>
                              <SelectItem value="non_refundable">Non-refundable (extra charge)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking Fee */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Booking Fee</Label>
                        <p className="text-sm text-[#6B7280]">Starting price shown to customers at booking (non-refundable, adjusted against final bill)</p>
                      </div>
                      <Switch
                        checked={serviceConfig.bookingFeeEnabled}
                        onCheckedChange={(checked) => setServiceConfig({...serviceConfig, bookingFeeEnabled: checked})}
                      />
                    </div>
                    {serviceConfig.bookingFeeEnabled && (
                      <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="bookingFeeAmount">Normal Booking Fee (₹)</Label>
                            <Input
                              id="bookingFeeAmount"
                              type="number"
                              value={serviceConfig.bookingFeeAmount}
                              onChange={(e) => setServiceConfig({...serviceConfig, bookingFeeAmount: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="emergencyBookingFeeAmount">Emergency Booking Fee (₹)</Label>
                            <Input
                              id="emergencyBookingFeeAmount"
                              type="number"
                              value={serviceConfig.emergencyBookingFeeAmount}
                              onChange={(e) => setServiceConfig({...serviceConfig, emergencyBookingFeeAmount: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="refundPolicyShort">Refund Policy (Short Text — shown next to price)</Label>
                          <Input
                            id="refundPolicyShort"
                            value={serviceConfig.bookingFeeRefundPolicy?.shortText || ''}
                            onChange={(e) => setServiceConfig({...serviceConfig, bookingFeeRefundPolicy: {...serviceConfig.bookingFeeRefundPolicy, shortText: e.target.value}})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="refundPolicyDetailed">Refund Policy (Detailed — shown on expand)</Label>
                          <textarea
                            id="refundPolicyDetailed"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={serviceConfig.bookingFeeRefundPolicy?.detailedText || ''}
                            onChange={(e) => setServiceConfig({...serviceConfig, bookingFeeRefundPolicy: {...serviceConfig.bookingFeeRefundPolicy, detailedText: e.target.value}})}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Adjustable Against Final Bill</Label>
                            <p className="text-sm text-[#6B7280]">Deduct booking fee from mechanic&apos;s diagnosis total</p>
                          </div>
                          <Switch
                            checked={serviceConfig.bookingFeeRefundPolicy?.adjustable ?? true}
                            onCheckedChange={(checked) => setServiceConfig({...serviceConfig, bookingFeeRefundPolicy: {...serviceConfig.bookingFeeRefundPolicy, adjustable: checked}})}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">Payment Methods</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Cash on Delivery (COD)</Label>
                        <p className="text-sm text-[#6B7280]">Allow customers to pay cash after service</p>
                      </div>
                      <Switch
                        checked={serviceConfig.codEnabled}
                        onCheckedChange={(checked) => setServiceConfig({...serviceConfig, codEnabled: checked})}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Online Payment</Label>
                        <p className="text-sm text-[#6B7280]">Allow online payment via Razorpay</p>
                      </div>
                      <Switch
                        checked={serviceConfig.onlineEnabled}
                        onCheckedChange={(checked) => setServiceConfig({...serviceConfig, onlineEnabled: checked})}
                      />
                    </div>
                  </div>

                  {/* SecureContact QR Calling */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">SecureContact QR Calling</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Guest QR calling</Label>
                        <p className="text-sm text-[#6B7280]">Let anyone who scans a vehicle QR call the owner anonymously</p>
                      </div>
                      <Switch
                        checked={(serviceConfig as any).qrCallingEnabled !== false}
                        onCheckedChange={(checked) => setServiceConfig({...serviceConfig, qrCallingEnabled: checked} as any)}
                      />
                    </div>
                    {(serviceConfig as any).qrCallingEnabled !== false && (
                      <div>
                        <Label htmlFor="qrCallingFee">Per-call fee (₹) — keep 0 for free</Label>
                        <Input
                          id="qrCallingFee"
                          type="number"
                          min={0}
                          value={(serviceConfig as any).qrCallingFee ?? 0}
                          onChange={(e) => setServiceConfig({...serviceConfig, qrCallingFee: Math.max(0, parseInt(e.target.value) || 0)} as any)}
                        />
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Currently {((serviceConfig as any).qrCallingFee ?? 0) > 0 ? `₹${(serviceConfig as any).qrCallingFee} per call (payment collection goes live with the fee)` : 'FREE for all scanners'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Platform Settings */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">Platform Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platformCommission">Platform Commission (%)</Label>
                        <Input
                          id="platformCommission"
                          type="number"
                          value={serviceConfig.platformCommission}
                          onChange={(e) => setServiceConfig({...serviceConfig, platformCommission: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxNegotiationRounds">Max Negotiation Rounds</Label>
                        <Input
                          id="maxNegotiationRounds"
                          type="number"
                          value={serviceConfig.maxNegotiationRounds}
                          onChange={(e) => setServiceConfig({...serviceConfig, maxNegotiationRounds: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="minTrustScore">Min Trust Score (Warning Threshold)</Label>
                        <Input
                          id="minTrustScore"
                          type="number"
                          value={serviceConfig.minTrustScore}
                          onChange={(e) => setServiceConfig({...serviceConfig, minTrustScore: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="autoBlockTrustScore">Auto-Block Trust Score</Label>
                        <Input
                          id="autoBlockTrustScore"
                          type="number"
                          value={serviceConfig.autoBlockTrustScore}
                          onChange={(e) => setServiceConfig({...serviceConfig, autoBlockTrustScore: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Settings */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">Service Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="minOrderValue">Minimum Order Value (₹)</Label>
                        <Input
                          id="minOrderValue"
                          type="number"
                          value={serviceConfig.serviceSettings?.minOrderValue ?? 500}
                          onChange={(e) => setServiceConfig({
                            ...serviceConfig,
                            serviceSettings: {
                              ...serviceConfig.serviceSettings,
                              minOrderValue: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxCancellations">Max Cancellations (per customer)</Label>
                        <Input
                          id="maxCancellations"
                          type="number"
                          value={serviceConfig.serviceSettings?.maxCancellations ?? 3}
                          onChange={(e) => setServiceConfig({
                            ...serviceConfig,
                            serviceSettings: {
                              ...serviceConfig.serviceSettings,
                              maxCancellations: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="autoBlockAfterRefusals">Auto-block after refused payments</Label>
                        <Input
                          id="autoBlockAfterRefusals"
                          type="number"
                          value={serviceConfig.serviceSettings?.autoBlockAfterRefusals ?? 2}
                          onChange={(e) => setServiceConfig({
                            ...serviceConfig,
                            serviceSettings: {
                              ...serviceConfig.serviceSettings,
                              autoBlockAfterRefusals: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authentication Settings */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Authentication & Access
                </CardTitle>
                <CardDescription>Configure authentication and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-[#6B7280]">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={securitySettings.loginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="lockoutDuration">Account Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={securitySettings.accountLockoutDuration}
                    onChange={(e) => setSecuritySettings({...securitySettings, accountLockoutDuration: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-[#6B7280]">Restrict admin access to specific IPs</p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelisting}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, ipWhitelisting: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Policy & SSL */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password Policy & Encryption
                </CardTitle>
                <CardDescription>Configure password requirements and encryption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="minLength">Minimum Password Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireUppercase: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireNumbers: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireSpecialChars: checked
                        }
                      })}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>SSL Certificate Status</Label>
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Certificate Valid</p>
                        <p className="text-xs text-green-600">Issuer: {securitySettings.sslCertificate.issuer}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Valid until: {formatDate(securitySettings.sslCertificate.validUntil)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>Encryption Level</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{securitySettings.encryptionLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    User Roles & Permissions
                  </CardTitle>
                  <CardDescription>Manage user roles and their permissions</CardDescription>
                </div>
                <Button
                  onClick={() => setShowNewRole(true)}
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUserRoles.map((role) => (
                  <div key={role.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-[#1A1D29]">{role.name}</h3>
                          {role.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#6B7280]">{role.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1A1D29]">{role.userCount.toLocaleString()}</p>
                        <p className="text-xs text-[#6B7280]">Users</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <Label className="text-xs text-[#6B7280]">PERMISSIONS</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.permissions.slice(0, 5).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRole(role)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Role
                      </Button>
                      {role.canDelete && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  System Health
                </CardTitle>
                <CardDescription>Monitor system performance and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Server Status</span>
                    {getHealthStatus(mockSystemHealth.serverStatus)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Database Status</span>
                    {getHealthStatus(mockSystemHealth.dbStatus)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Cache Status</span>
                    {getHealthStatus(mockSystemHealth.cacheStatus)}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#6B7280]">Storage Usage</span>
                      <span className="font-medium">{mockSystemHealth.storageUsage}%</span>
                    </div>
                    <Progress value={mockSystemHealth.storageUsage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#6B7280]">Memory Usage</span>
                      <span className="font-medium">{mockSystemHealth.memoryUsage}%</span>
                    </div>
                    <Progress value={mockSystemHealth.memoryUsage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#6B7280]">CPU Usage</span>
                      <span className="font-medium">{mockSystemHealth.cpuUsage}%</span>
                    </div>
                    <Progress value={mockSystemHealth.cpuUsage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Information
                </CardTitle>
                <CardDescription>System version and maintenance information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">System Version</span>
                    <span className="font-medium">{mockSystemHealth.systemVersion}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Last Update</span>
                    <span className="font-medium">{formatDate(mockSystemHealth.lastUpdate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">System Uptime</span>
                    <span className="font-medium">{mockSystemHealth.uptime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">Last Backup</span>
                    <span className="font-medium">{formatDate(mockSystemHealth.lastBackup)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Create System Backup
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                  
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* App Update Tab — Android force-update control */}
        <TabsContent value="app-update" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Android App Update Control
                  </CardTitle>
                  <CardDescription>
                    Control force-update behavior after publishing a new build on Play Store. Users with an older version than the "Minimum Version" will be blocked from using the app until they update.
                  </CardDescription>
                </div>
                <Button
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                  onClick={handleSaveServiceConfig}
                  disabled={configSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {configSaving ? 'Saving...' : 'Save Config'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {configLoading ? (
                <p className="text-[#6B7280]">Loading config...</p>
              ) : (
                <>
                  {/* How it works banner */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900 space-y-1">
                        <p className="font-semibold">How it works</p>
                        <p>• <strong>Latest Version</strong> — the newest version available on Play Store. Users on older builds see an optional update prompt.</p>
                        <p>• <strong>Minimum Version</strong> — the oldest version still allowed to run. Users below this are <strong>blocked</strong> with a mandatory update screen.</p>
                        <p>• <strong>Force Update</strong> — when ON, everyone below <em>latest</em> is blocked (treats latest as minimum).</p>
                        <p>• After uploading a new APK to Play Store, bump Latest Version here. To force everyone to update, also bump Minimum Version.</p>
                      </div>
                    </div>
                  </div>

                  {/* Version fields */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">Version Numbers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latestVersion">Latest Version (e.g., 1.2.0)</Label>
                        <Input
                          id="latestVersion"
                          placeholder="1.0.0"
                          value={serviceConfig.androidApp?.latestVersion || ''}
                          onChange={(e) => setServiceConfig({
                            ...serviceConfig,
                            androidApp: { ...serviceConfig.androidApp, latestVersion: e.target.value }
                          })}
                        />
                        <p className="text-xs text-[#6B7280] mt-1">Current build published on Play Store</p>
                      </div>
                      <div>
                        <Label htmlFor="minimumVersion">Minimum Allowed Version</Label>
                        <Input
                          id="minimumVersion"
                          placeholder="1.0.0"
                          value={serviceConfig.androidApp?.minimumVersion || ''}
                          onChange={(e) => setServiceConfig({
                            ...serviceConfig,
                            androidApp: { ...serviceConfig.androidApp, minimumVersion: e.target.value }
                          })}
                        />
                        <p className="text-xs text-[#6B7280] mt-1">Users below this are force-blocked</p>
                      </div>
                    </div>
                  </div>

                  {/* Force-update toggle */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Force Update (Block all older versions)</Label>
                        <p className="text-sm text-[#6B7280]">When ON, treats Latest Version as the minimum. Everyone below is blocked.</p>
                      </div>
                      <Switch
                        checked={!!serviceConfig.androidApp?.forceUpdate}
                        onCheckedChange={(checked) => setServiceConfig({
                          ...serviceConfig,
                          androidApp: { ...serviceConfig.androidApp, forceUpdate: checked }
                        })}
                      />
                    </div>
                    {serviceConfig.androidApp?.forceUpdate && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-900">
                            <strong>Warning:</strong> Force update is ON. Every user below version <strong>{serviceConfig.androidApp?.latestVersion || '1.0.0'}</strong> will see a mandatory update screen and cannot use the app until they update from Play Store.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Play Store URL + messaging */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <h3 className="font-medium text-[#1A1D29]">Update Screen Content</h3>
                    <div>
                      <Label htmlFor="playStoreUrl">Play Store URL</Label>
                      <Input
                        id="playStoreUrl"
                        placeholder="https://play.google.com/store/apps/details?id=..."
                        value={serviceConfig.androidApp?.playStoreUrl || ''}
                        onChange={(e) => setServiceConfig({
                          ...serviceConfig,
                          androidApp: { ...serviceConfig.androidApp, playStoreUrl: e.target.value }
                        })}
                      />
                      <p className="text-xs text-[#6B7280] mt-1">Tapped from the in-app update screen</p>
                    </div>
                    <div>
                      <Label htmlFor="updateTitle">Update Title</Label>
                      <Input
                        id="updateTitle"
                        placeholder="Update Available"
                        value={serviceConfig.androidApp?.updateTitle || ''}
                        onChange={(e) => setServiceConfig({
                          ...serviceConfig,
                          androidApp: { ...serviceConfig.androidApp, updateTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="updateMessage">Update Message</Label>
                      <textarea
                        id="updateMessage"
                        className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="A new version is available. Please update to continue."
                        value={serviceConfig.androidApp?.updateMessage || ''}
                        onChange={(e) => setServiceConfig({
                          ...serviceConfig,
                          androidApp: { ...serviceConfig.androidApp, updateMessage: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gateway Configuration Modal */}
      <Dialog open={!!selectedGateway} onOpenChange={() => setSelectedGateway(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedGateway?.name}</DialogTitle>
            <DialogDescription>
              Set up payment gateway configuration and credentials
            </DialogDescription>
          </DialogHeader>
          
          {selectedGateway && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{selectedGateway.name}</p>
                    <p className="text-sm text-blue-700">Processing fees: {selectedGateway.fees}</p>
                  </div>
                </div>
              </div>
              
              {selectedGateway.id === 'razorpay' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyId">API Key ID</Label>
                    <Input id="keyId" placeholder="rzp_test_***********" />
                  </div>
                  <div>
                    <Label htmlFor="keySecret">API Key Secret</Label>
                    <Input id="keySecret" type="password" placeholder="**********************" />
                  </div>
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input id="webhookSecret" type="password" placeholder="**********************" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Gateway</Label>
                  <p className="text-sm text-[#6B7280]">Accept payments through this gateway</p>
                </div>
                <Switch defaultChecked={selectedGateway.status === 'active'} />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGateway(null)}>
              Cancel
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Details Modal */}
      <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Details - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              View and manage role permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Role Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-[#6B7280]">Name:</span> {selectedRole.name}</p>
                  <p><span className="text-[#6B7280]">Description:</span> {selectedRole.description}</p>
                  <p><span className="text-[#6B7280]">Users:</span> {selectedRole.userCount.toLocaleString()}</p>
                  <p><span className="text-[#6B7280]">Default Role:</span> {selectedRole.isDefault ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Permissions</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-ultra-narrow">
                  {selectedRole.permissions.map((permission: string) => (
                    <div key={permission} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span>{permission}</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Edit Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}