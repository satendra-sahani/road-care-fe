import { Product, Category, Brand, Supplier, StockMovement, Order, Customer, Address, OrderTimeline, DeliveryPartner, Delivery, SalesMetrics, InventoryMetrics } from '@/types'

// Comprehensive Product Data (50+ products)
export const mockProducts: Product[] = [
  {
    id: 'PRD-001',
    name: 'Premium Brake Pads Set - Front',
    sku: 'BP-FRONT-001',
    category: 'Brake System',
    brand: 'Bosch',
    price: 1290,
    mrp: 1500,
    stock: 45,
    lowStockThreshold: 10,
    status: 'active',
    rating: 4.8,
    reviews: 124,
    sales: 89,
    images: ['/products/brake-pads-1.jpg', '/products/brake-pads-2.jpg'],
    description: 'High-quality ceramic brake pads for superior stopping power',
    specifications: ['Ceramic compound', 'Low dust', 'Noise-free operation'],
    compatibility: ['Honda City', 'Maruti Swift', 'Hyundai i20'],
    supplier: 'Auto Parts Co.',
    costPrice: 800,
    weight: 2.5,
    dimensions: { length: 15, width: 10, height: 3 },
    warranty: '2 years',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-02-10T14:20:00Z'
  },
  {
    id: 'PRD-002',
    name: 'Castrol GTX Engine Oil 5W-30',
    sku: 'OIL-5W30-001',
    category: 'Engine Oil',
    brand: 'Castrol',
    price: 850,
    mrp: 950,
    stock: 5,
    lowStockThreshold: 15,
    status: 'active',
    rating: 4.6,
    reviews: 89,
    sales: 156,
    images: ['/products/engine-oil-1.jpg'],
    description: 'Premium synthetic blend engine oil for modern engines',
    specifications: ['5W-30 viscosity', '4L container', 'API SN certified'],
    compatibility: ['All petrol engines', 'CNG engines'],
    supplier: 'Oil Distributors Ltd.',
    costPrice: 620,
    weight: 4.2,
    dimensions: { length: 20, width: 15, height: 25 },
    warranty: 'Manufacturer warranty',
    createdAt: '2026-01-20T09:15:00Z',
    updatedAt: '2026-02-12T11:30:00Z'
  },
  {
    id: 'PRD-003',
    name: 'Michelin Energy XM2+ 195/65 R15',
    sku: 'TYRE-195-65-R15',
    category: 'Tyres',
    brand: 'Michelin',
    price: 4500,
    mrp: 5200,
    stock: 12,
    lowStockThreshold: 8,
    status: 'active',
    rating: 4.9,
    reviews: 67,
    sales: 23,
    images: ['/products/tyre-1.jpg', '/products/tyre-2.jpg'],
    description: 'High-performance radial tyre with superior grip and durability',
    specifications: ['195/65 R15 size', 'Radial construction', '5-year warranty'],
    compatibility: ['Maruti Swift', 'Honda City', 'Hyundai Verna'],
    supplier: 'Tyre World',
    costPrice: 3200,
    weight: 8.5,
    dimensions: { length: 63, width: 63, height: 24 },
    warranty: '5 years',
    createdAt: '2026-01-10T16:45:00Z',
    updatedAt: '2026-02-08T10:15:00Z'
  },
  {
    id: 'PRD-004',
    name: 'Exide Car Battery 12V 65Ah',
    sku: 'BAT-12V-65AH',
    category: 'Battery',
    brand: 'Exide',
    price: 4200,
    mrp: 4800,
    stock: 0,
    lowStockThreshold: 5,
    status: 'out-of-stock',
    rating: 4.5,
    reviews: 156,
    sales: 78,
    images: ['/products/battery-1.jpg'],
    description: 'Maintenance-free car battery with 3-year warranty',
    specifications: ['12V 65Ah capacity', 'Maintenance-free', 'High cranking power'],
    compatibility: ['Most sedan cars', 'Hatchback vehicles'],
    supplier: 'Battery Solutions',
    costPrice: 2800,
    weight: 15.5,
    dimensions: { length: 24, width: 18, height: 19 },
    warranty: '3 years',
    createdAt: '2025-12-15T12:00:00Z',
    updatedAt: '2026-02-11T09:45:00Z'
  },
  {
    id: 'PRD-005',
    name: 'Bosch Wiper Blades Set',
    sku: 'WB-SET-001',
    category: 'Electrical',
    brand: 'Bosch',
    price: 650,
    mrp: 780,
    status: 'active',
    stock: 28,
    lowStockThreshold: 12,
    rating: 4.3,
    reviews: 45,
    sales: 67,
    images: ['/products/wiper-1.jpg'],
    description: 'High-quality windshield wiper blades for clear visibility',
    specifications: ['22" and 18" blades', 'All-season use', 'Easy installation'],
    compatibility: ['Universal fit', 'Most car models'],
    supplier: 'Auto Accessories Ltd.',
    costPrice: 420,
    weight: 0.8,
    dimensions: { length: 56, width: 8, height: 4 },
    warranty: '1 year',
    createdAt: '2026-01-05T14:30:00Z',
    updatedAt: '2026-02-01T16:20:00Z'
  },
  // Adding more comprehensive product data
  {
    id: 'PRD-006',
    name: 'K&N Air Filter Performance',
    sku: 'AF-KN-001',
    category: 'Air Filters',
    brand: 'K&N',
    price: 1200,
    mrp: 1400,
    stock: 35,
    lowStockThreshold: 15,
    status: 'active',
    rating: 4.7,
    reviews: 92,
    sales: 143,
    images: ['/products/air-filter-1.jpg'],
    description: 'High-flow performance air filter for improved engine power',
    specifications: ['Washable and reusable', 'Cotton gauze construction', '1 million mile warranty'],
    compatibility: ['Honda City', 'Maruti Baleno', 'Hyundai i20'],
    supplier: 'Performance Parts Ltd.',
    costPrice: 750,
    weight: 0.5,
    dimensions: { length: 25, width: 20, height: 5 },
    warranty: '1 million miles',
    createdAt: '2026-01-12T11:20:00Z',
    updatedAt: '2026-02-09T15:45:00Z'
  },
  {
    id: 'PRD-007',
    name: 'MRF ZVTV 185/65 R15',
    sku: 'TYRE-MRF-185',
    category: 'Tyres',
    brand: 'MRF',
    price: 3800,
    mrp: 4200,
    stock: 18,
    lowStockThreshold: 10,
    status: 'active',
    rating: 4.4,
    reviews: 78,
    sales: 34,
    images: ['/products/mrf-tyre-1.jpg'],
    description: 'Tubeless radial tyre with excellent wet grip',
    specifications: ['185/65 R15', 'Tubeless', 'Wet grip technology'],
    compatibility: ['Maruti Swift', 'Ford Figo', 'Nissan Micra'],
    supplier: 'Tyre World',
    costPrice: 2900,
    weight: 7.8,
    dimensions: { length: 60, width: 60, height: 22 },
    warranty: '4 years',
    createdAt: '2026-01-18T09:30:00Z',
    updatedAt: '2026-02-11T12:15:00Z'
  },
  {
    id: 'PRD-008',
    name: 'Shell Helix HX7 10W-40',
    sku: 'OIL-SHELL-10W40',
    category: 'Engine Oil',
    brand: 'Shell',
    price: 950,
    mrp: 1100,
    stock: 42,
    lowStockThreshold: 20,
    status: 'active',
    rating: 4.5,
    reviews: 156,
    sales: 89,
    images: ['/products/shell-oil-1.jpg'],
    description: 'Semi-synthetic motor oil for enhanced protection',
    specifications: ['10W-40 viscosity', 'Semi-synthetic', '4L container'],
    compatibility: ['Petrol and diesel engines', 'Older vehicles'],
    supplier: 'Oil Distributors Ltd.',
    costPrice: 720,
    weight: 4.1,
    dimensions: { length: 20, width: 15, height: 25 },
    warranty: 'Manufacturer warranty',
    createdAt: '2026-01-22T14:45:00Z',
    updatedAt: '2026-02-10T10:30:00Z'
  },
  {
    id: 'PRD-009',
    name: 'Amaron Car Battery 12V 55Ah',
    sku: 'BAT-AMARON-55AH',
    category: 'Battery',
    brand: 'Amaron',
    price: 3800,
    mrp: 4200,
    stock: 8,
    lowStockThreshold: 12,
    status: 'active',
    rating: 4.6,
    reviews: 89,
    sales: 45,
    images: ['/products/amaron-battery-1.jpg'],
    description: 'Long-lasting maintenance-free car battery',
    specifications: ['12V 55Ah', 'Zero maintenance', 'Superior cranking power'],
    compatibility: ['Compact cars', 'Small hatchbacks'],
    supplier: 'Battery Solutions',
    costPrice: 2650,
    weight: 13.2,
    dimensions: { length: 22, width: 17, height: 18 },
    warranty: '4 years',
    createdAt: '2026-01-25T16:20:00Z',
    updatedAt: '2026-02-12T08:45:00Z'
  },
  {
    id: 'PRD-010',
    name: 'NGK Spark Plugs Set',
    sku: 'SP-NGK-SET',
    category: 'Ignition System',
    brand: 'NGK',
    price: 480,
    mrp: 560,
    stock: 67,
    lowStockThreshold: 25,
    status: 'active',
    rating: 4.8,
    reviews: 234,
    sales: 178,
    images: ['/products/ngk-spark-plugs-1.jpg'],
    description: 'Premium iridium spark plugs for better performance',
    specifications: ['Iridium center electrode', 'Set of 4 plugs', 'Enhanced durability'],
    compatibility: ['Honda City', 'Maruti Swift', 'Hyundai i10'],
    supplier: 'Ignition Parts Co.',
    costPrice: 320,
    weight: 0.4,
    dimensions: { length: 8, width: 6, height: 10 },
    warranty: '2 years',
    createdAt: '2026-01-28T11:15:00Z',
    updatedAt: '2026-02-08T17:30:00Z'
  }
  // ... Continue with more products up to 50+
]

// Categories Data
export const mockCategories: Category[] = [
  {
    id: 'brake-system',
    name: 'Brake System',
    count: 45,
    revenue: 125000,
    description: 'Complete brake system components including pads, discs, and fluid',
    image: '/categories/brake-system.jpg'
  },
  {
    id: 'engine-oil',
    name: 'Engine Oil',
    count: 23,
    revenue: 89000,
    description: 'Premium engine oils for all vehicle types',
    image: '/categories/engine-oil.jpg'
  },
  {
    id: 'tyres',
    name: 'Tyres',
    count: 18,
    revenue: 156000,
    description: 'High-quality tyres from leading brands',
    image: '/categories/tyres.jpg'
  },
  {
    id: 'battery',
    name: 'Battery',
    count: 12,
    revenue: 78000,
    description: 'Maintenance-free car batteries with warranty',
    image: '/categories/battery.jpg'
  },
  {
    id: 'electrical',
    name: 'Electrical',
    count: 34,
    revenue: 45000,
    description: 'Electrical components and accessories',
    image: '/categories/electrical.jpg'
  },
  {
    id: 'air-filters',
    name: 'Air Filters',
    count: 28,
    revenue: 32000,
    description: 'Performance and standard air filters',
    image: '/categories/air-filters.jpg'
  },
  {
    id: 'ignition-system',
    name: 'Ignition System',
    count: 41,
    revenue: 67000,
    description: 'Spark plugs, ignition coils, and related components',
    image: '/categories/ignition.jpg'
  },
  {
    id: 'suspension',
    name: 'Suspension',
    count: 22,
    revenue: 89000,
    description: 'Shock absorbers and suspension components',
    image: '/categories/suspension.jpg'
  },
  {
    id: 'cooling-system',
    name: 'Cooling System',
    count: 15,
    revenue: 43000,
    description: 'Radiators, coolants, and cooling system parts',
    image: '/categories/cooling.jpg'
  },
  {
    id: 'transmission',
    name: 'Transmission',
    count: 19,
    revenue: 78000,
    description: 'Transmission oils and clutch components',
    image: '/categories/transmission.jpg'
  }
]

// Brands Data
export const mockBrands: Brand[] = [
  {
    id: 'bosch',
    name: 'Bosch',
    count: 56,
    revenue: 145000,
    description: 'German automotive technology leader',
    logo: '/brands/bosch.png',
    country: 'Germany'
  },
  {
    id: 'castrol',
    name: 'Castrol',
    count: 34,
    revenue: 89000,
    description: 'Premium lubricant manufacturer',
    logo: '/brands/castrol.png',
    country: 'UK'
  },
  {
    id: 'michelin',
    name: 'Michelin',
    count: 23,
    revenue: 178000,
    description: 'French premium tyre manufacturer',
    logo: '/brands/michelin.png',
    country: 'France'
  },
  {
    id: 'exide',
    name: 'Exide',
    count: 15,
    revenue: 95000,
    description: 'Leading battery manufacturer',
    logo: '/brands/exide.png',
    country: 'USA'
  },
  {
    id: 'shell',
    name: 'Shell',
    count: 28,
    revenue: 67000,
    description: 'Global energy company',
    logo: '/brands/shell.png',
    country: 'Netherlands'
  },
  {
    id: 'mrf',
    name: 'MRF',
    count: 32,
    revenue: 112000,
    description: 'Indian tyre manufacturer',
    logo: '/brands/mrf.png',
    country: 'India'
  },
  {
    id: 'amaron',
    name: 'Amaron',
    count: 18,
    revenue: 76000,
    description: 'Premium battery brand',
    logo: '/brands/amaron.png',
    country: 'India'
  },
  {
    id: 'ngk',
    name: 'NGK',
    count: 45,
    revenue: 89000,
    description: 'Japanese spark plug specialist',
    logo: '/brands/ngk.png',
    country: 'Japan'
  },
  {
    id: 'kn',
    name: 'K&N',
    count: 22,
    revenue: 54000,
    description: 'Performance air filter specialist',
    logo: '/brands/kn.png',
    country: 'USA'
  }
]

// Suppliers Data
export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Auto Parts Co.',
    contactPerson: 'Raj Kumar',
    email: 'raj@autoparts.com',
    phone: '+91-9876543210',
    address: '123 Industrial Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    gst: '27AABCA1234E1Z5',
    productsCount: 45,
    totalOrders: 156,
    status: 'active',
    rating: 4.5,
    createdAt: '2025-06-15T10:30:00Z'
  },
  {
    id: 'SUP-002',
    name: 'Oil Distributors Ltd.',
    contactPerson: 'Suresh Sharma',
    email: 'suresh@oildist.com',
    phone: '+91-9876543211',
    address: '456 Oil Complex',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    gst: '07AABCO1234E1Z6',
    productsCount: 23,
    totalOrders: 89,
    status: 'active',
    rating: 4.2,
    createdAt: '2025-07-20T14:15:00Z'
  },
  {
    id: 'SUP-003',
    name: 'Tyre World',
    contactPerson: 'Amit Patel',
    email: 'amit@tyreworld.com',
    phone: '+91-9876543212',
    address: '789 Tyre Market',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    gst: '27AABCT1234E1Z7',
    productsCount: 34,
    totalOrders: 67,
    status: 'active',
    rating: 4.7,
    createdAt: '2025-08-10T09:45:00Z'
  },
  {
    id: 'SUP-004',
    name: 'Battery Solutions',
    contactPerson: 'Vikram Singh',
    email: 'vikram@batterysol.com',
    phone: '+91-9876543213',
    address: '321 Battery Lane',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    gst: '29AABCB1234E1Z8',
    productsCount: 18,
    totalOrders: 134,
    status: 'active',
    rating: 4.4,
    createdAt: '2025-09-05T16:20:00Z'
  },
  {
    id: 'SUP-005',
    name: 'Performance Parts Ltd.',
    contactPerson: 'Ravi Gupta',
    email: 'ravi@perfparts.com',
    phone: '+91-9876543214',
    address: '654 Performance Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    gst: '33AABCP1234E1Z9',
    productsCount: 67,
    totalOrders: 234,
    status: 'active',
    rating: 4.8,
    createdAt: '2025-05-12T11:30:00Z'
  }
]

// Customers Data
export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+91-9876543200',
    avatar: '/avatars/john.png',
    totalOrders: 15,
    totalSpent: 25000,
    status: 'active',
    createdAt: '2025-08-15T10:30:00Z'
  },
  {
    id: 'CUST-002',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+91-9876543201',
    avatar: '/avatars/sarah.png',
    totalOrders: 8,
    totalSpent: 12000,
    status: 'active',
    createdAt: '2025-09-20T14:45:00Z'
  },
  {
    id: 'CUST-003',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91-9876543202',
    avatar: '/avatars/priya.png',
    totalOrders: 22,
    totalSpent: 45000,
    status: 'active',
    createdAt: '2025-07-10T09:20:00Z'
  },
  {
    id: 'CUST-004',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    phone: '+91-9876543203',
    avatar: '/avatars/rahul.png',
    totalOrders: 6,
    totalSpent: 8500,
    status: 'active',
    createdAt: '2025-11-05T16:15:00Z'
  },
  {
    id: 'CUST-005',
    name: 'David Wilson',
    email: 'david@example.com',
    phone: '+91-9876543204',
    avatar: '/avatars/david.png',
    totalOrders: 18,
    totalSpent: 32000,
    status: 'active',
    createdAt: '2025-06-25T12:40:00Z'
  }
]

// Sample addresses
export const mockAddresses: Address[] = [
  {
    type: 'home',
    name: 'John Smith',
    phone: '+91-9876543200',
    addressLine1: '123 Main Street',
    addressLine2: 'Apartment 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    landmark: 'Near Central Mall',
    isDefault: true
  },
  {
    type: 'office',
    name: 'John Smith',
    phone: '+91-9876543200',
    addressLine1: '456 Business Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400020',
    landmark: 'Opposite Metro Station',
    isDefault: false
  }
]

// Comprehensive Orders Data
export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: 'RC2026-001',
    customer: mockCustomers[0],
    products: [
      {
        productId: 'PRD-001',
        name: 'Premium Brake Pads Set - Front',
        sku: 'BP-FRONT-001',
        quantity: 2,
        price: 1290,
        total: 2580
      }
    ],
    subtotal: 2580,
    tax: 464.4,
    shippingCharges: 100,
    discount: 258,
    totalAmount: 2886,
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'UPI',
    orderDate: '2026-02-12T10:30:00Z',
    shippingAddress: mockAddresses[0],
    trackingNumber: 'TN123456789',
    courierPartner: 'BlueDart',
    estimatedDelivery: '2026-02-15T18:00:00Z',
    notes: 'Handle with care - fragile items',
    createdAt: '2026-02-12T10:30:00Z',
    updatedAt: '2026-02-12T15:45:00Z'
  },
  {
    id: 'ORD-002',
    orderNumber: 'RC2026-002',
    customer: mockCustomers[1],
    products: [
      {
        productId: 'PRD-002',
        name: 'Castrol GTX Engine Oil 5W-30',
        sku: 'OIL-5W30-001',
        quantity: 1,
        price: 850,
        total: 850
      },
      {
        productId: 'PRD-010',
        name: 'NGK Spark Plugs Set',
        sku: 'SP-NGK-SET',
        quantity: 1,
        price: 480,
        total: 480
      }
    ],
    subtotal: 1330,
    tax: 239.4,
    shippingCharges: 80,
    discount: 133,
    totalAmount: 1516,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'Credit Card',
    orderDate: '2026-02-12T08:15:00Z',
    shippingAddress: {
      type: 'home',
      name: 'Sarah Johnson',
      phone: '+91-9876543201',
      addressLine1: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      isDefault: true
    },
    notes: 'Customer requested morning delivery',
    createdAt: '2026-02-12T08:15:00Z',
    updatedAt: '2026-02-12T14:20:00Z'
  },
  {
    id: 'ORD-003',
    orderNumber: 'RC2026-003',
    customer: mockCustomers[2],
    products: [
      {
        productId: 'PRD-003',
        name: 'Michelin Energy XM2+ 195/65 R15',
        sku: 'TYRE-195-65-R15',
        quantity: 4,
        price: 4500,
        total: 18000
      }
    ],
    subtotal: 18000,
    tax: 3240,
    shippingCharges: 200,
    discount: 1800,
    totalAmount: 19640,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'Net Banking',
    orderDate: '2026-02-10T14:22:00Z',
    shippingAddress: {
      type: 'home',
      name: 'Priya Sharma',
      phone: '+91-9876543202',
      addressLine1: '789 Residential Complex',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      landmark: 'Near City Center',
      isDefault: true
    },
    trackingNumber: 'TN987654321',
    courierPartner: 'Delhivery',
    estimatedDelivery: '2026-02-13T16:00:00Z',
    actualDelivery: '2026-02-13T14:30:00Z',
    notes: 'Bulk order - check all items before delivery',
    createdAt: '2026-02-10T14:22:00Z',
    updatedAt: '2026-02-13T14:35:00Z'
  },
  {
    id: 'ORD-004',
    orderNumber: 'RC2026-004',
    customer: mockCustomers[3],
    products: [
      {
        productId: 'PRD-009',
        name: 'Amaron Car Battery 12V 55Ah',
        sku: 'BAT-AMARON-55AH',
        quantity: 1,
        price: 3800,
        total: 3800
      }
    ],
    subtotal: 3800,
    tax: 684,
    shippingCharges: 150,
    discount: 380,
    totalAmount: 4254,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'COD',
    orderDate: '2026-02-12T16:45:00Z',
    shippingAddress: {
      type: 'home',
      name: 'Rahul Kumar',
      phone: '+91-9876543203',
      addressLine1: '321 Housing Society',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: true
    },
    notes: 'COD order - collect payment on delivery',
    createdAt: '2026-02-12T16:45:00Z',
    updatedAt: '2026-02-12T16:45:00Z'
  },
  {
    id: 'ORD-005',
    orderNumber: 'RC2026-005',
    customer: mockCustomers[4],
    products: [
      {
        productId: 'PRD-006',
        name: 'K&N Air Filter Performance',
        sku: 'AF-KN-001',
        quantity: 1,
        price: 1200,
        total: 1200
      },
      {
        productId: 'PRD-005',
        name: 'Bosch Wiper Blades Set',
        sku: 'WB-SET-001',
        quantity: 1,
        price: 650,
        total: 650
      }
    ],
    subtotal: 1850,
    tax: 333,
    shippingCharges: 100,
    discount: 185,
    totalAmount: 2098,
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'Wallet',
    orderDate: '2026-02-11T12:20:00Z',
    shippingAddress: {
      type: 'office',
      name: 'David Wilson',
      phone: '+91-9876543204',
      addressLine1: '654 Corporate Tower',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      landmark: 'Sector 62',
      isDefault: false
    },
    cancellationReason: 'Customer requested cancellation due to changed requirements',
    notes: 'Refund processed within 3-5 business days',
    createdAt: '2026-02-11T12:20:00Z',
    updatedAt: '2026-02-11T18:30:00Z'
  }
]

// Stock Movement Data
export const mockStockMovements: StockMovement[] = [
  {
    id: 'STK-001',
    productId: 'PRD-001',
    productName: 'Premium Brake Pads Set - Front',
    type: 'out',
    quantity: 2,
    previousStock: 47,
    currentStock: 45,
    reason: 'Sale - Order RC2026-001',
    referenceId: 'ORD-001',
    createdBy: 'system',
    createdAt: '2026-02-12T10:35:00Z'
  },
  {
    id: 'STK-002',
    productId: 'PRD-002',
    productName: 'Castrol GTX Engine Oil 5W-30',
    type: 'in',
    quantity: 50,
    previousStock: 5,
    currentStock: 55,
    reason: 'Stock replenishment from supplier',
    referenceId: 'PO-001',
    createdBy: 'admin',
    createdAt: '2026-02-12T09:00:00Z'
  },
  {
    id: 'STK-003',
    productId: 'PRD-003',
    productName: 'Michelin Energy XM2+ 195/65 R15',
    type: 'out',
    quantity: 4,
    previousStock: 16,
    currentStock: 12,
    reason: 'Sale - Order RC2026-003',
    referenceId: 'ORD-003',
    createdBy: 'system',
    createdAt: '2026-02-10T14:25:00Z'
  },
  {
    id: 'STK-004',
    productId: 'PRD-004',
    productName: 'Exide Car Battery 12V 65Ah',
    type: 'adjustment',
    quantity: -2,
    previousStock: 2,
    currentStock: 0,
    reason: 'Damaged stock write-off',
    createdBy: 'admin',
    createdAt: '2026-02-11T15:20:00Z'
  },
  {
    id: 'STK-005',
    productId: 'PRD-010',
    productName: 'NGK Spark Plugs Set',
    type: 'return',
    quantity: 1,
    previousStock: 66,
    currentStock: 67,
    reason: 'Customer return - defective item',
    referenceId: 'RET-001',
    createdBy: 'admin',
    createdAt: '2026-02-12T11:15:00Z'
  }
]

// Delivery Partners Data
export const mockDeliveryPartners: DeliveryPartner[] = [
  {
    id: 'DP-001',
    name: 'BlueDart Express',
    contactPerson: 'Sunil Mehta',
    phone: '+91-9876540001',
    email: 'sunil@bluedart.com',
    serviceAreas: ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Chennai'],
    rateCard: {
      localDelivery: 80,
      intercityDelivery: 150,
      codCharges: 25
    },
    status: 'active',
    rating: 4.5,
    totalDeliveries: 1234,
    onTimeDeliveryRate: 92
  },
  {
    id: 'DP-002',
    name: 'Delhivery',
    contactPerson: 'Priya Singh',
    phone: '+91-9876540002',
    email: 'priya@delhivery.com',
    serviceAreas: ['All India'],
    rateCard: {
      localDelivery: 70,
      intercityDelivery: 120,
      codCharges: 20
    },
    status: 'active',
    rating: 4.3,
    totalDeliveries: 2156,
    onTimeDeliveryRate: 88
  },
  {
    id: 'DP-003',
    name: 'DTDC',
    contactPerson: 'Raj Kumar',
    phone: '+91-9876540003',
    email: 'raj@dtdc.com',
    serviceAreas: ['North India', 'West India'],
    rateCard: {
      localDelivery: 75,
      intercityDelivery: 140,
      codCharges: 30
    },
    status: 'active',
    rating: 4.1,
    totalDeliveries: 876,
    onTimeDeliveryRate: 85
  }
]

// Sales and Inventory Metrics
export const mockSalesMetrics: SalesMetrics = {
  totalRevenue: 1250000,
  totalOrders: 567,
  averageOrderValue: 2204,
  conversionRate: 3.2,
  topSellingProducts: [
    {
      productId: 'PRD-010',
      name: 'NGK Spark Plugs Set',
      sales: 178,
      revenue: 85440
    },
    {
      productId: 'PRD-002',
      name: 'Castrol GTX Engine Oil 5W-30',
      sales: 156,
      revenue: 132600
    },
    {
      productId: 'PRD-006',
      name: 'K&N Air Filter Performance',
      sales: 143,
      revenue: 171600
    }
  ],
  categoryWiseRevenue: [
    {
      category: 'Tyres',
      revenue: 345000,
      percentage: 27.6
    },
    {
      category: 'Brake System',
      revenue: 287500,
      percentage: 23.0
    },
    {
      category: 'Engine Oil',
      revenue: 234000,
      percentage: 18.7
    },
    {
      category: 'Battery',
      revenue: 198000,
      percentage: 15.8
    }
  ],
  monthlyRevenue: [
    {
      month: '2026-01',
      revenue: 456000,
      orders: 203
    },
    {
      month: '2026-02',
      revenue: 789000,
      orders: 364
    }
  ]
}

export const mockInventoryMetrics: InventoryMetrics = {
  totalProducts: 248,
  lowStockProducts: 23,
  outOfStockProducts: 8,
  totalInventoryValue: 2850000,
  fastMovingProducts: [mockProducts[9], mockProducts[1], mockProducts[5]],
  slowMovingProducts: [mockProducts[4], mockProducts[3]],
  categoryDistribution: [
    {
      category: 'Brake System',
      count: 45,
      percentage: 18.1
    },
    {
      category: 'Ignition System',
      count: 41,
      percentage: 16.5
    },
    {
      category: 'Electrical',
      count: 34,
      percentage: 13.7
    }
  ]
}