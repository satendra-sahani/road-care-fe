// Product and Inventory Types
export interface Product {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  price: number
  mrp: number
  stock: number
  lowStockThreshold: number
  status: 'active' | 'inactive' | 'out-of-stock' | 'discontinued'
  rating: number
  reviews: number
  sales: number
  images: string[]
  description: string
  specifications: string[]
  compatibility: string[]
  supplier: string
  costPrice: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  warranty?: string
  createdAt: string
  updatedAt: string
}

// Part interface for the mock data
export interface Part {
  id: number
  name: string
  partNumber: string
  brand: string
  price: number
  mrp: number
  rating: number
  stock: string
  images: string[]
  category: string
  description: string
  specifications: string[]
  compatibility: string[]
  inStock: boolean
  reviews: number
}

// Main Category interface for vehicle types
export interface MainCategory {
  id: string
  name: string
  icon: string
  description: string
}

export interface Category {
  id: string
  name: string
  count?: number
  revenue?: number
  description?: string
  parentCategory?: string
  image?: string
  icon?: string
}

export interface Brand {
  id: string
  name: string
  category?: string
  description: string
  logo?: string
  country?: string
  count?: number
  revenue?: number
}

// Service Request Types
export interface ServiceRequest {
  id: string
  serviceType: 'home' | 'roadside'
  vehicleType: string
  problem: string
  location: string
  landmark?: string
  date: string
  timeSlot: string
  status: 'pending' | 'assigned' | 'on_way' | 'completed' | 'cancelled'
  mechanic?: {
    id: string
    name: string
    mobile: string
    rating: number
    specialization: string[]
  }
  estimatedCharge?: number
  actualCharge?: number
  createdAt: string
}

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'service' | 'system' | 'promotion'
  createdAt: string
  read: boolean
}

// Address Types for Orders
export interface Address {
  id: string
  type?: 'home' | 'office' | 'other'
  name: string
  mobile: string
  addressLine1: string
  addressLine2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  gst: string
  productsCount: number
  totalOrders: number
  status: 'active' | 'inactive' | 'blocked'
  rating: number
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'adjustment' | 'return'
  quantity: number
  previousStock: number
  currentStock: number
  reason: string
  referenceId?: string
  createdBy: string
  createdAt: string
}

// Order Management Types
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive' | 'blocked'
  createdAt: string
}

export interface OrderProduct {
  productId: string
  name: string
  sku: string
  quantity: number
  price: number
  discount?: number
  total: number
}

export interface Order {
  id: string
  orderNumber?: string
  customer?: Customer
  products?: OrderProduct[]
  subtotal?: number
  tax?: number
  shippingCharges?: number
  discount?: number
  totalAmount?: number
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially-refunded'
  paymentMethod?: 'COD' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Wallet'
  orderDate?: string
  shippingAddress?: Address
  billingAddress?: Address
  trackingNumber?: string
  courierPartner?: string
  estimatedDelivery?: string
  actualDelivery?: string
  notes?: string
  cancellationReason?: string
  returnReason?: string
  createdAt: string
  updatedAt: string
  // Additional fields for mock data compatibility
  items?: Array<{
    part: Part
    quantity: number
  }>
  total?: number
  address?: Address
  deliveryPerson?: {
    id: string
    name: string
    mobile: string
    rating: number
  }
}

export interface OrderTimeline {
  id: string
  orderId: string
  status: Order['status']
  timestamp: string
  description: string
  updatedBy: string
}

// Delivery Management Types
export interface DeliveryPartner {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  serviceAreas: string[]
  rateCard: {
    localDelivery: number
    intercityDelivery: number
    codCharges: number
  }
  status: 'active' | 'inactive'
  rating: number
  totalDeliveries: number
  onTimeDeliveryRate: number
}

export interface Delivery {
  id: string
  orderId: string
  orderNumber: string
  customer: {
    name: string
    phone: string
  }
  deliveryAddress: Address
  partner: DeliveryPartner
  assignedAt: string
  pickedUpAt?: string
  deliveredAt?: string
  status: 'assigned' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'failed' | 'returned'
  trackingNumber: string
  estimatedDelivery: string
  deliveryNotes?: string
  failureReason?: string
  proofOfDelivery?: string
  rating?: number
  feedback?: string
}

// Analytics and Reporting Types
export interface SalesMetrics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  conversionRate: number
  topSellingProducts: Array<{
    productId: string
    name: string
    sales: number
    revenue: number
  }>
  categoryWiseRevenue: Array<{
    category: string
    revenue: number
    percentage: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    orders: number
  }>
}

export interface InventoryMetrics {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalInventoryValue: number
  fastMovingProducts: Product[]
  slowMovingProducts: Product[]
  categoryDistribution: Array<{
    category: string
    count: number
    percentage: number
  }>
}

// Filter and Search Types
export interface ProductFilters {
  category?: string
  brand?: string
  status?: Product['status']
  priceRange?: { min: number; max: number }
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock'
  search?: string
}

export interface OrderFilters {
  status?: Order['status']
  paymentStatus?: Order['paymentStatus']
  paymentMethod?: Order['paymentMethod']
  dateRange?: { start: string; end: string }
  amountRange?: { min: number; max: number }
  search?: string
}

// Common Types
export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  message?: string
  success: boolean
}

// Form Types
export interface ProductFormData {
  name: string
  sku: string
  category: string
  brand: string
  price: number
  mrp: number
  stock: number
  lowStockThreshold: number
  description: string
  specifications: string[]
  compatibility: string[]
  supplier: string
  costPrice: number
  weight?: number
  dimensions?: Product['dimensions']
  warranty?: string
  images: string[]
}

export interface OrderUpdateData {
  status?: Order['status']
  trackingNumber?: string
  courierPartner?: string
  estimatedDelivery?: string
  notes?: string
}