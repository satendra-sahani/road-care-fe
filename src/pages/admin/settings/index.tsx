'use client'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PlatformSettings } from '@/components/admin/PlatformSettings'

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/settings" />
      <main className="ml-0 lg:ml-72 transition-all duration-300">
        <PlatformSettings />
      </main>
    </div>
  )
}
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, Bell, Shield, Database, Mail, Globe } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Road Care',
    siteDescription: 'Your trusted partner for all automotive needs',
    contactEmail: 'support@roadcare.com',
    contactPhone: '1-800-ROADCARE',
    address: '123 Auto Street, Car City, CC 12345',
    enableNotifications: true,
    enableSMS: false,
    maintenanceMode: false,
    autoApproveOrders: false,
    taxRate: 18,
    shippingRate: 50,
    minOrderAmount: 500,
    maxOrderAmount: 50000
  })

  const handleSave = () => {
    console.log('Saving settings:', settings)
    // Add save logic here
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar currentPath="/admin/settings" />
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                System Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure system-wide settings and preferences
              </p>
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Site Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => updateSetting('contactEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={(e) => updateSetting('contactPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Business Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingRate">Shipping Rate (₹)</Label>
                  <Input
                    id="shippingRate"
                    type="number"
                    value={settings.shippingRate}
                    onChange={(e) => updateSetting('shippingRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    value={settings.minOrderAmount}
                    onChange={(e) => updateSetting('minOrderAmount', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOrderAmount">Maximum Order Amount (₹)</Label>
                  <Input
                    id="maxOrderAmount"
                    type="number"
                    value={settings.maxOrderAmount}
                    onChange={(e) => updateSetting('maxOrderAmount', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-approve Orders</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve new orders without manual review
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoApproveOrders}
                    onCheckedChange={(checked) => updateSetting('autoApproveOrders', checked)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Notification Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for orders, updates, and alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Send SMS notifications for urgent updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableSMS}
                    onCheckedChange={(checked) => updateSetting('enableSMS', checked)}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Security Settings</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Security Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">SSL Enabled</Badge>
                    <Badge variant="secondary">Two-Factor Auth</Badge>
                    <Badge variant="secondary">Rate Limiting</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-4">Password Policy</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Minimum 8 characters</p>
                    <p>• At least 1 uppercase letter</p>
                    <p>• At least 1 number</p>
                    <p>• At least 1 special character</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* System */}
          <TabsContent value="system" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">System Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Put the system in maintenance mode for updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-4">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <span className="ml-2 font-mono">2.1.0</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="ml-2">2024-02-11</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Database:</span>
                      <span className="ml-2">Connected</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cache:</span>
                      <span className="ml-2">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}