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
  Send,
  Bell,
  MessageSquare,
  Users,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Archive,
  Mail,
  Phone,
  Headphones,
  Target,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Mock notification data
const mockNotifications = [
  {
    id: 'NOT-001',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance will occur tomorrow from 2 AM to 4 AM IST. Services may be temporarily unavailable.',
    type: 'system',
    priority: 'high',
    status: 'draft',
    targetAudience: 'all',
    scheduledDate: '2026-02-13T02:00:00Z',
    createdBy: 'System Admin',
    createdDate: '2026-02-12T10:00:00Z',
    readCount: 0,
    clickCount: 0
  },
  {
    id: 'NOT-002',
    title: 'New Product Launch - BMW Parts Collection',
    message: 'Exciting news! We have launched our new BMW parts collection with genuine OEM parts. Check out the latest additions.',
    type: 'promotion',
    priority: 'medium',
    status: 'sent',
    targetAudience: 'customers',
    scheduledDate: '2026-02-12T09:00:00Z',
    createdBy: 'Marketing Team',
    createdDate: '2026-02-11T15:00:00Z',
    readCount: 847,
    clickCount: 234
  },
  {
    id: 'NOT-003',
    title: 'Service Request Update',
    message: 'Your recent service request #SR-2026-089 has been completed successfully. Please rate your experience.',
    type: 'service',
    priority: 'medium',
    status: 'delivered',
    targetAudience: 'specific',
    scheduledDate: '2026-02-12T14:30:00Z',
    createdBy: 'Service Team',
    createdDate: '2026-02-12T14:25:00Z',
    readCount: 1,
    clickCount: 1
  }
]

// Mock customer support data
const mockSupportTickets = [
  {
    id: 'SUP-001',
    ticketNumber: 'TK-2026-0245',
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 9876543210',
      avatar: '/avatars/rahul.png'
    },
    subject: 'Defective brake pads received',
    category: 'product_quality',
    priority: 'high',
    status: 'open',
    assignedTo: 'Priya Singh',
    createdDate: '2026-02-12T09:15:00Z',
    lastUpdated: '2026-02-12T11:30:00Z',
    responseTime: 135,
    messages: 4,
    tags: ['defective', 'brake_pads', 'refund_requested']
  },
  {
    id: 'SUP-002',
    ticketNumber: 'TK-2026-0246',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+91 8765432109',
      avatar: '/avatars/sarah.png'
    },
    subject: 'Order delivery delayed beyond promised date',
    category: 'delivery',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: 'Amit Kumar',
    createdDate: '2026-02-11T16:45:00Z',
    lastUpdated: '2026-02-12T10:20:00Z',
    responseTime: 67,
    messages: 6,
    tags: ['delivery_delay', 'compensation']
  },
  {
    id: 'SUP-003',
    ticketNumber: 'TK-2026-0247',
    customer: {
      name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '+91 7654321098',
      avatar: '/avatars/michael.png'
    },
    subject: 'Unable to find compatible parts for my vehicle',
    category: 'product_inquiry',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Sneha Patel',
    createdDate: '2026-02-10T14:20:00Z',
    lastUpdated: '2026-02-11T09:45:00Z',
    responseTime: 28,
    messages: 8,
    tags: ['part_compatibility', 'resolved']
  }
]

// Mock messaging data
const mockMessages = [
  {
    id: 'MSG-001',
    recipient: 'All Customers',
    subject: 'Welcome to Road Care Premium Membership',
    content: 'Thank you for upgrading to our Premium membership. Enjoy exclusive benefits and priority support.',
    type: 'welcome',
    status: 'sent',
    sentDate: '2026-02-12T10:00:00Z',
    openRate: 78.5,
    clickRate: 23.4,
    deliveredTo: 1245
  },
  {
    id: 'MSG-002',
    recipient: 'Inactive Users',
    subject: 'We miss you! Come back with 20% off',
    content: 'Its been a while since your last order. Here\'s a special 20% discount to welcome you back to Road Care.',
    type: 'promotional',
    status: 'scheduled',
    sentDate: '2026-02-13T10:00:00Z',
    openRate: 0,
    clickRate: 0,
    deliveredTo: 0
  }
]

// Mock campaign data
const mockCampaigns = [
  {
    id: 'CAM-001',
    name: 'Summer Service Campaign 2026',
    type: 'seasonal',
    status: 'active',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-28T23:59:59Z',
    targetAudience: 'all_customers',
    budget: 50000,
    spent: 23450,
    impressions: 45670,
    clicks: 2344,
    conversions: 156,
    revenue: 234500
  },
  {
    id: 'CAM-002',
    name: 'New Customer Acquisition',
    type: 'acquisition',
    status: 'paused',
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-03-15T23:59:59Z',
    targetAudience: 'new_users',
    budget: 75000,
    spent: 45600,
    impressions: 78900,
    clicks: 4567,
    conversions: 234,
    revenue: 345600
  }
]

const notificationTypes = {
  system: { color: 'bg-blue-100 text-blue-800', label: 'System' },
  promotion: { color: 'bg-green-100 text-green-800', label: 'Promotion' },
  service: { color: 'bg-purple-100 text-purple-800', label: 'Service' },
  alert: { color: 'bg-red-100 text-red-800', label: 'Alert' }
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' }
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  sent: { color: 'bg-green-100 text-green-800', label: 'Sent' },
  scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
  delivered: { color: 'bg-purple-100 text-purple-800', label: 'Delivered' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
}

const supportStatusConfig = {
  open: { color: 'bg-red-100 text-red-800', label: 'Open' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
}

const campaignStatusConfig = {
  active: { color: 'bg-green-100 text-green-800', label: 'Active' },
  paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
  completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' }
}

export function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState('notifications')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [showNewNotification, setShowNewNotification] = useState(false)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showTicketDetails, setShowTicketDetails] = useState<any>(null)

  const filteredNotifications = useMemo(() => {
    return mockNotifications.filter(notification =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const filteredTickets = useMemo(() => {
    return mockSupportTickets.filter(ticket =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

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

  const getTypeBadge = (type: string) => {
    const config = notificationTypes[type as keyof typeof notificationTypes]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getSupportStatusBadge = (status: string) => {
    const config = supportStatusConfig[status as keyof typeof supportStatusConfig]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getCampaignStatusBadge = (status: string) => {
    const config = campaignStatusConfig[status as keyof typeof campaignStatusConfig]
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getCommunicationStats = () => {
    const totalNotifications = mockNotifications.length
    const activeNotifications = mockNotifications.filter(n => n.status === 'sent' || n.status === 'scheduled').length
    const openTickets = mockSupportTickets.filter(t => t.status === 'open').length
    const avgResponseTime = mockSupportTickets.reduce((sum, t) => sum + t.responseTime, 0) / mockSupportTickets.length
    const activeCampaigns = mockCampaigns.filter(c => c.status === 'active').length
    
    return { totalNotifications, activeNotifications, openTickets, avgResponseTime, activeCampaigns }
  }

  const stats = getCommunicationStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Communication Center</h1>
          <p className="text-[#6B7280] mt-1">Manage notifications, customer support, and marketing communications</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Communication Report
          </Button>
        </div>
      </div>

      {/* Communication Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalNotifications}</p>
                <p className="text-xs text-[#6B7280]">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.activeNotifications}</p>
                <p className="text-xs text-[#6B7280]">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.openTickets}</p>
                <p className="text-xs text-[#6B7280]">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{Math.round(stats.avgResponseTime)}m</p>
                <p className="text-xs text-[#6B7280]">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.activeCampaigns}</p>
                <p className="text-xs text-[#6B7280]">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="support">Customer Support</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowNewNotification(true)}
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Notification
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedNotifications.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedNotifications.length} notification(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Send className="h-4 w-4 mr-1" />
                        Send Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Audience</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#1A1D29]">{notification.title}</div>
                          <div className="text-sm text-[#6B7280] max-w-md truncate">
                            {notification.message}
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-1">
                            By {notification.createdBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(notification.type)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(notification.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(notification.status)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {notification.targetAudience.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        {formatDate(notification.scheduledDate)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>👁️ {notification.readCount.toLocaleString()} reads</div>
                          <div>👆 {notification.clickCount.toLocaleString()} clicks</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Notification
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Support Tab */}
        <TabsContent value="support" className="space-y-6">
          {/* Support Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1A1D29]">{mockSupportTickets.filter(t => t.status === 'open').length}</p>
                <p className="text-sm text-[#6B7280]">Open Tickets</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1A1D29]">{mockSupportTickets.filter(t => t.status === 'in_progress').length}</p>
                <p className="text-sm text-[#6B7280]">In Progress</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1A1D29]">{mockSupportTickets.filter(t => t.status === 'resolved').length}</p>
                <p className="text-sm text-[#6B7280]">Resolved</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1A1D29]">{Math.round(stats.avgResponseTime)}m</p>
                <p className="text-sm text-[#6B7280]">Avg Response</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Tickets Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Support Tickets</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#1A1D29]">{ticket.ticketNumber}</div>
                          <div className="text-sm text-[#6B7280] max-w-sm truncate">
                            {ticket.subject}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ticket.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={ticket.customer.avatar} />
                            <AvatarFallback>
                              {ticket.customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{ticket.customer.name}</div>
                            <div className="text-xs text-[#6B7280]">{ticket.customer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {ticket.category.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        {getSupportStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ticket.assignedTo}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${ticket.responseTime > 120 ? 'text-red-600' : ticket.responseTime > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {ticket.responseTime}m
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowTicketDetails(ticket)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Message Center</CardTitle>
                <Button
                  onClick={() => setShowNewMessage(true)}
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div key={message.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-[#1A1D29]">{message.subject}</h3>
                        <p className="text-sm text-[#6B7280]">To: {message.recipient}</p>
                      </div>
                      {getStatusBadge(message.status)}
                    </div>
                    
                    <p className="text-sm text-[#6B7280] mb-3">{message.content}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[#6B7280]">Sent Date:</p>
                        <p className="font-medium">{formatDate(message.sentDate)}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Delivered To:</p>
                        <p className="font-medium">{message.deliveredTo.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Open Rate:</p>
                        <p className="font-medium">{message.openRate}%</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Click Rate:</p>
                        <p className="font-medium">{message.clickRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Marketing Campaigns</CardTitle>
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-[#1A1D29]">{campaign.name}</h3>
                        <p className="text-sm text-[#6B7280] capitalize">{campaign.type.replace('_', ' ')} Campaign</p>
                      </div>
                      {getCampaignStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-[#6B7280]">Budget:</p>
                        <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Spent:</p>
                        <p className="font-medium">{formatCurrency(campaign.spent)}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Impressions:</p>
                        <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#6B7280]">Conversions:</p>
                        <p className="font-medium">{campaign.conversions}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[#6B7280]">Budget Usage</span>
                        <span className="font-medium">{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                      </div>
                      <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[#6B7280]">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create New Notification Modal */}
      <Dialog open={showNewNotification} onOpenChange={setShowNewNotification}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Notification</DialogTitle>
            <DialogDescription>
              Send notifications to your users about important updates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input id="title" placeholder="Enter notification title" />
            </div>
            
            <div>
              <Label htmlFor="message">Message Content</Label>
              <Textarea id="message" placeholder="Enter notification message" rows={4} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Notification Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="mechanics">Mechanics</SelectItem>
                  <SelectItem value="delivery">Delivery Partners</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNotification(false)}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline">
                Save as Draft
              </Button>
              <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                Send Now
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Ticket Details Modal */}
      <Dialog open={!!showTicketDetails} onOpenChange={() => setShowTicketDetails(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Support Ticket Details - {showTicketDetails?.ticketNumber}</DialogTitle>
            <DialogDescription>
              Complete ticket information and conversation history
            </DialogDescription>
          </DialogHeader>
          
          {showTicketDetails && (
            <div className="space-y-6">
              {/* Ticket Overview */}
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={showTicketDetails.customer.avatar} />
                  <AvatarFallback>
                    {showTicketDetails.customer.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-[#1A1D29]">{showTicketDetails.subject}</h3>
                    {getSupportStatusBadge(showTicketDetails.status)}
                    {getPriorityBadge(showTicketDetails.priority)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6B7280]">Customer:</p>
                      <p className="font-medium">{showTicketDetails.customer.name}</p>
                      <p className="text-[#6B7280]">{showTicketDetails.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Assigned To:</p>
                      <p className="font-medium">{showTicketDetails.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Category:</p>
                      <p className="font-medium capitalize">{showTicketDetails.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[#6B7280]">Created:</p>
                      <p className="font-medium">{formatDate(showTicketDetails.createdDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Tags */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {showTicketDetails.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Response Area */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Add Response</h4>
                <Textarea placeholder="Type your response here..." rows={4} />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketDetails(null)}>
              Close
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
              <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                <Send className="h-4 w-4 mr-2" />
                Send Response
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}