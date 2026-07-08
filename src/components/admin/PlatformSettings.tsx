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
  RefreshCw,
  IndianRupee,
  Receipt,
  Wallet,
  QrCode,
  SlidersHorizontal,
  Tag,
  MessageSquare,
  Headset,
  HardDrive
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

// Presentational-only accent maps (icon chip colors + left stripe) — purely cosmetic, keyed off existing ids/status.
const GATEWAY_ACCENT: Record<string, { stripe: string; chipBg: string; chipText: string; icon: any }> = {
  razorpay: { stripe: '#3b82f6', chipBg: 'bg-blue-50', chipText: 'text-blue-600', icon: CreditCard },
  paytm: { stripe: '#6366f1', chipBg: 'bg-indigo-50', chipText: 'text-indigo-600', icon: Wallet },
  phonepe: { stripe: '#8b5cf6', chipBg: 'bg-violet-50', chipText: 'text-violet-600', icon: Smartphone },
  cod: { stripe: '#10b981', chipBg: 'bg-emerald-50', chipText: 'text-emerald-600', icon: IndianRupee },
}
const DEFAULT_GATEWAY_ACCENT = { stripe: '#94a3b8', chipBg: 'bg-gray-100', chipText: 'text-gray-600', icon: CreditCard }

const ROLE_ACCENT: Record<string, { chipBg: string; chipText: string; icon: any }> = {
  admin: { chipBg: 'bg-indigo-50', chipText: 'text-indigo-600', icon: Shield },
  manager: { chipBg: 'bg-sky-50', chipText: 'text-sky-600', icon: UserCheck },
  customer_service: { chipBg: 'bg-violet-50', chipText: 'text-violet-600', icon: Headset },
  customer: { chipBg: 'bg-slate-100', chipText: 'text-slate-600', icon: Users },
}
const DEFAULT_ROLE_ACCENT = { chipBg: 'bg-slate-100', chipText: 'text-slate-600', icon: Users }

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
    },
    homePopup: {
      enabled: true,
      title: 'Cashback Festival',
      subtitle: 'is LIVE · कैशबैक फेस्टिवल',
      badge: 'Real cashback on every order',
      body: 'Refer friends & earn ₹100 each — real cash, withdrawable to any UPI.',
      emoji: '🎉',
      imageUrl: '',
      ctaText: 'Claim & Explore',
      ctaTarget: 'Cashback',
      secondaryText: 'Maybe later',
      gradient: ['#FF4D8D', '#FF6B35', '#8C5CFF'] as string[],
      accentColor: '',
      showOnce: true,
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
            },
            homePopup: {
              ...prev.homePopup,
              ...(res.data.data.homePopup || {})
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

  // Export the currently-loaded settings (general + service config + security) as a CSV — reads existing state only.
  const exportConfigCsv = () => {
    const rows: string[][] = [['Section', 'Setting', 'Value']]
    const flatten = (section: string, obj: any) => {
      Object.entries(obj || {}).forEach(([key, val]) => {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          flatten(`${section} > ${key}`, val)
        } else {
          rows.push([section, key, Array.isArray(val) ? val.join('; ') : String(val)])
        }
      })
    }
    flatten('General', generalSettings)
    flatten('Service Config', serviceConfig)
    flatten('Security', securitySettings)
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `platform-settings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Platform Settings</h1>
          <p className="text-[#6B7280] mt-1">Configure and manage your platform settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportConfigCsv}>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50">
            <Database className="h-4 w-4 text-[#1B3B6F]" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Server Status</p>
          <div className="mt-0.5 text-sm font-extrabold text-[#1A1D29]">{getHealthStatus(mockSystemHealth.serverStatus)}</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Active Users</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{mockSystemHealth.activeUsers}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment Gateways</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{stats.activeGateways}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50">
            <Shield className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">2FA Status</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1A1D29]">{securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50">
            <HardDrive className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Storage Used</p>
          <p className="mt-0.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{mockSystemHealth.storageUsage}%</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50">
            <Globe className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">System Uptime</p>
          <p className="mt-0.5 text-sm font-extrabold text-[#1A1D29]">{mockSystemHealth.uptime}</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-6 h-11 rounded-xl border border-gray-100 bg-[#F6F8FB] p-1">
          <TabsTrigger value="general" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">General</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">Payments</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">Security</TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">Permissions</TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">System</TabsTrigger>
          <TabsTrigger value="app-update" className="rounded-lg text-sm font-medium data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white data-[state=active]:shadow-sm">App Update</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  Basic Information
                </CardTitle>
                <CardDescription>Configure your platform's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50">
                    <Settings className="h-4 w-4 text-violet-600" />
                  </div>
                  System Preferences
                </CardTitle>
                <CardDescription>Configure system-wide preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPaymentGateways.map((gateway) => {
                  const accent = GATEWAY_ACCENT[gateway.id] || DEFAULT_GATEWAY_ACCENT
                  const GatewayIcon = accent.icon
                  return (
                  <div
                    key={gateway.id}
                    className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm border-l-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderLeftColor: accent.stripe }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`grid h-10 w-10 place-items-center rounded-xl ${accent.chipBg}`}>
                          <GatewayIcon className={`h-5 w-5 ${accent.chipText}`} />
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
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Configuration — real API */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50">
                      <Wrench className="h-4 w-4 text-orange-600" />
                    </div>
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
            <CardContent className="space-y-5 pt-6">
              {configLoading ? (
                <p className="text-[#6B7280]">Loading config...</p>
              ) : (
                <>
                  {/* Advance Fee */}
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 shrink-0">
                          <IndianRupee className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Label className="font-medium">Advance Fee (Before Mechanic Dispatch)</Label>
                          <p className="text-sm text-[#6B7280]">Require customers to pay advance fee before mechanic is sent</p>
                        </div>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 shrink-0">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <Label className="font-medium">Booking Fee</Label>
                          <p className="text-sm text-[#6B7280]">Starting price shown to customers at booking (non-refundable, adjusted against final bill)</p>
                        </div>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 shrink-0">
                        <Wallet className="h-4 w-4 text-sky-600" />
                      </div>
                      Payment Methods
                    </h3>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 shrink-0">
                        <QrCode className="h-4 w-4 text-teal-600" />
                      </div>
                      SecureContact QR Calling
                    </h3>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 shrink-0">
                        <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                      </div>
                      Platform Settings
                    </h3>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 shrink-0">
                        <Wrench className="h-4 w-4 text-rose-600" />
                      </div>
                      Service Settings
                    </h3>
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
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  Authentication & Access
                </CardTitle>
                <CardDescription>Configure authentication and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50">
                    <Lock className="h-4 w-4 text-rose-600" />
                  </div>
                  Password Policy & Encryption
                </CardTitle>
                <CardDescription>Configure password requirements and encryption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Certificate Valid</p>
                        <p className="text-xs text-emerald-600">Issuer: {securitySettings.sslCertificate.issuer}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      Valid until: {formatDate(securitySettings.sslCertificate.validUntil)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Encryption Level</Label>
                  <div className="mt-1 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="text-sm font-medium">{securitySettings.encryptionLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50">
                      <UserCheck className="h-4 w-4 text-sky-600" />
                    </div>
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
            <CardContent className="pt-6">
              <div className="space-y-3">
                {mockUserRoles.map((role) => {
                  const accent = ROLE_ACCENT[role.id] || DEFAULT_ROLE_ACCENT
                  const RoleIcon = accent.icon
                  return (
                  <div key={role.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${accent.chipBg}`}>
                          <RoleIcon className={`h-4 w-4 ${accent.chipText}`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-[#1A1D29]">{role.name}</h3>
                            {role.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280]">{role.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1A1D29] tabular-nums">{role.userCount.toLocaleString()}</p>
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
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50">
                    <Database className="h-4 w-4 text-teal-600" />
                  </div>
                  System Health
                </CardTitle>
                <CardDescription>Monitor system performance and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100">
                    <Settings className="h-4 w-4 text-slate-600" />
                  </div>
                  System Information
                </CardTitle>
                <CardDescription>System version and maintenance information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2.5 text-[#1A1D29]">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50">
                      <Smartphone className="h-4 w-4 text-amber-600" />
                    </div>
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
            <CardContent className="space-y-5 pt-6">
              {configLoading ? (
                <p className="text-[#6B7280]">Loading config...</p>
              ) : (
                <>
                  {/* How it works banner */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 shrink-0">
                        <Tag className="h-4 w-4 text-indigo-600" />
                      </div>
                      Version Numbers
                    </h3>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <Label className="font-medium">Force Update (Block all older versions)</Label>
                          <p className="text-sm text-[#6B7280]">When ON, treats Latest Version as the minimum. Everyone below is blocked.</p>
                        </div>
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
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <h3 className="flex items-center gap-2.5 font-medium text-[#1A1D29]">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 shrink-0">
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                      </div>
                      Update Screen Content
                    </h3>
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

                  {/* ── Customer Home Popup (admin-managed content + design) ── */}
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-pink-50 shrink-0">
                          <Bell className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <Label className="font-medium">Customer Home Popup</Label>
                          <p className="text-sm text-[#6B7280]">The promo modal shown when a customer opens the app — content &amp; design are managed here.</p>
                        </div>
                      </div>
                      <Switch
                        checked={(serviceConfig as any).homePopup?.enabled !== false}
                        onCheckedChange={(checked) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, enabled: checked } } as any)}
                      />
                    </div>

                    {((serviceConfig as any).homePopup?.enabled !== false) && (
                      <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hpTitle">Title</Label>
                            <Input id="hpTitle" value={(serviceConfig as any).homePopup?.title || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, title: e.target.value } } as any)} />
                          </div>
                          <div>
                            <Label htmlFor="hpSubtitle">Subtitle</Label>
                            <Input id="hpSubtitle" value={(serviceConfig as any).homePopup?.subtitle || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, subtitle: e.target.value } } as any)} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="hpBadge">Badge / pill text</Label>
                          <Input id="hpBadge" value={(serviceConfig as any).homePopup?.badge || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, badge: e.target.value } } as any)} />
                        </div>
                        <div>
                          <Label htmlFor="hpBody">Body</Label>
                          <textarea
                            id="hpBody"
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={(serviceConfig as any).homePopup?.body || ''}
                            onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, body: e.target.value } } as any)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="hpEmoji">Emoji</Label>
                            <Input id="hpEmoji" maxLength={4} value={(serviceConfig as any).homePopup?.emoji || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, emoji: e.target.value } } as any)} />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="hpImage">Image URL (optional — replaces the emoji)</Label>
                            <Input id="hpImage" placeholder="https://..." value={(serviceConfig as any).homePopup?.imageUrl || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, imageUrl: e.target.value } } as any)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hpCtaText">Button text</Label>
                            <Input id="hpCtaText" value={(serviceConfig as any).homePopup?.ctaText || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, ctaText: e.target.value } } as any)} />
                          </div>
                          <div>
                            <Label htmlFor="hpCtaTarget">Button action</Label>
                            <Input id="hpCtaTarget" placeholder="Cashback" value={(serviceConfig as any).homePopup?.ctaTarget || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, ctaTarget: e.target.value } } as any)} />
                            <p className="mt-1 text-xs text-[#6B7280]">Screen name (Cashback, Shop, Subscription, Tracker) or an https:// link.</p>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="hpSecondary">Secondary (dismiss) text</Label>
                          <Input id="hpSecondary" value={(serviceConfig as any).homePopup?.secondaryText || ''} onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, secondaryText: e.target.value } } as any)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Header gradient</Label>
                            <div className="mt-1 flex items-center gap-2">
                              {[0, 1, 2].map((i) => (
                                <input
                                  key={i}
                                  type="color"
                                  value={(serviceConfig as any).homePopup?.gradient?.[i] || '#FF4D8D'}
                                  onChange={(e) => {
                                    const g = [...(((serviceConfig as any).homePopup?.gradient) || ['#FF4D8D', '#FF6B35', '#8C5CFF'])]
                                    g[i] = e.target.value
                                    setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, gradient: g } } as any)
                                  }}
                                  className="h-9 w-12 rounded border border-gray-200 bg-white p-0.5"
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Button color (blank = app default)</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="color"
                                value={(serviceConfig as any).homePopup?.accentColor || '#F59E0B'}
                                onChange={(e) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, accentColor: e.target.value } } as any)}
                                className="h-9 w-12 rounded border border-gray-200 bg-white p-0.5"
                              />
                              <Button variant="outline" size="sm" onClick={() => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, accentColor: '' } } as any)}>Reset</Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show once per session</Label>
                            <p className="text-sm text-[#6B7280]">Off = show on every Home visit.</p>
                          </div>
                          <Switch
                            checked={(serviceConfig as any).homePopup?.showOnce !== false}
                            onCheckedChange={(checked) => setServiceConfig({ ...serviceConfig, homePopup: { ...(serviceConfig as any).homePopup, showOnce: checked } } as any)}
                          />
                        </div>

                        {/* Live preview */}
                        <div>
                          <Label>Preview</Label>
                          <div className="mt-2 w-full max-w-[320px] overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${(((serviceConfig as any).homePopup?.gradient) || ['#FF4D8D', '#FF6B35', '#8C5CFF']).join(', ')})` }}>
                              {(serviceConfig as any).homePopup?.imageUrl
                                ? <img src={(serviceConfig as any).homePopup.imageUrl} alt="" className="mx-auto h-16 w-full max-w-[220px] rounded-lg object-cover" />
                                : <div className="text-4xl leading-none">{(serviceConfig as any).homePopup?.emoji || '🎉'}</div>}
                              <div className="mt-2 text-lg font-extrabold text-white">{(serviceConfig as any).homePopup?.title || 'Cashback Festival'}</div>
                              {(serviceConfig as any).homePopup?.subtitle && <div className="text-xs font-bold text-white/90">{(serviceConfig as any).homePopup.subtitle}</div>}
                            </div>
                            <div className="bg-white p-4 text-center">
                              {(serviceConfig as any).homePopup?.badge && <div className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{(serviceConfig as any).homePopup.badge}</div>}
                              {(serviceConfig as any).homePopup?.body && <p className="mt-2 text-sm text-gray-600">{(serviceConfig as any).homePopup.body}</p>}
                              <div className="mt-3 rounded-xl py-2 text-sm font-bold text-white" style={{ backgroundColor: (serviceConfig as any).homePopup?.accentColor || '#F59E0B' }}>{(serviceConfig as any).homePopup?.ctaText || 'Claim & Explore'}</div>
                              {(serviceConfig as any).homePopup?.secondaryText && <div className="mt-2 text-xs font-semibold text-gray-400">{(serviceConfig as any).homePopup.secondaryText}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              Configure {selectedGateway?.name}
            </DialogTitle>
            <DialogDescription>
              Set up payment gateway configuration and credentials
            </DialogDescription>
          </DialogHeader>

          {selectedGateway && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
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
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${(ROLE_ACCENT[selectedRole?.id] || DEFAULT_ROLE_ACCENT).chipBg}`}>
                <UserCheck className={`h-4 w-4 ${(ROLE_ACCENT[selectedRole?.id] || DEFAULT_ROLE_ACCENT).chipText}`} />
              </div>
              Role Details - {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              View and manage role permissions
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
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
                    <div key={permission} className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg text-sm">
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