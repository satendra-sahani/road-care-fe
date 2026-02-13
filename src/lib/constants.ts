// User Types
export type UserRole = 'user' | 'admin' | 'mechanic' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: 'bike' | 'car' | 'scooter';
  registrationNumber: string;
  lastServiceDate?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  description: string;
  image?: string;
  stock: number;
  rating: number;
  reviews: number;
}

export interface CartItem {
  id: string;
  partId: string;
  part: Part;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  deliveryAddress: string;
  deliveryBoy?: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  serviceType: 'home' | 'roadside';
  vehicleType: 'bike' | 'car' | 'scooter';
  problem: string;
  location: string;
  photos: string[];
  contactNumber: string;
  estimatedCharge: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  mechanic?: string;
  requestDate: string;
  completedDate?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  rating: number;
  totalJobs: number;
  specializations: string[];
  isActive: boolean;
  joinDate: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  vehicle: string;
  rating: number;
  totalDeliveries: number;
  isActive: boolean;
  joinDate: string;
}

export interface DeliveryOrder extends Order {
  deliveryPersonId: string;
  trackingUpdates: TrackingUpdate[];
}

export interface TrackingUpdate {
  id: string;
  status: string;
  timestamp: string;
  location: string;
  message: string;
}

export interface MainCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description: string;
}

// Dummy Data
export const DUMMY_CATEGORIES: Category[] = [
  { id: '1', name: 'Engine Parts', icon: 'zap', description: 'Engine related components' },
  { id: '2', name: 'Brake System', icon: 'shield', description: 'Brake components and pads' },
  { id: '3', name: 'Suspension', icon: 'move-vertical', description: 'Suspension parts' },
  { id: '4', name: 'Electrical', icon: 'lightbulb', description: 'Electrical components' },
  { id: '5', name: 'Accessories', icon: 'package', description: 'Car accessories' },
];

export const DUMMY_PARTS: Part[] = [
  {
    id: '1',
    name: 'Engine Oil Filter',
    category: 'Engine Parts',
    brand: 'Bosch',
    price: 299,
    description: 'High quality engine oil filter for all car models',
    stock: 45,
    rating: 4.5,
    reviews: 120,
  },
  {
    id: '2',
    name: 'Air Filter',
    category: 'Engine Parts',
    brand: 'Mann-Filter',
    price: 399,
    description: 'Premium air filter with extended life',
    stock: 32,
    rating: 4.7,
    reviews: 98,
  },
  {
    id: '3',
    name: 'Brake Pads Set',
    category: 'Brake System',
    brand: 'Brembo',
    price: 1200,
    description: 'High performance brake pads',
    stock: 28,
    rating: 4.6,
    reviews: 156,
  },
  {
    id: '4',
    name: 'Spark Plugs (Pack of 4)',
    category: 'Engine Parts',
    brand: 'NGK',
    price: 499,
    description: 'Premium spark plugs for better ignition',
    stock: 55,
    rating: 4.4,
    reviews: 87,
  },
  {
    id: '5',
    name: 'Car Battery',
    category: 'Electrical',
    brand: 'Exide',
    price: 3500,
    description: '75Ah car battery with 60 months warranty',
    stock: 15,
    rating: 4.8,
    reviews: 203,
  },
  {
    id: '6',
    name: 'Suspension Springs',
    category: 'Suspension',
    brand: 'KYB',
    price: 2800,
    description: 'OEM quality suspension springs',
    stock: 22,
    rating: 4.5,
    reviews: 64,
  },
];

export const DUMMY_BRANDS: Brand[] = [
  { id: '1', name: 'Bosch', description: 'Leading automotive parts manufacturer' },
  { id: '2', name: 'Brembo', description: 'Premium brake systems' },
  { id: '3', name: 'NGK', description: 'Spark plugs and ignition systems' },
  { id: '4', name: 'Exide', description: 'Car batteries and power solutions' },
  { id: '5', name: 'Mann-Filter', description: 'High quality filters' },
  { id: '6', name: 'KYB', description: 'Suspension and shock systems' },
];

export const DUMMY_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    role: 'user',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543211',
    role: 'user',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '9876543212',
    role: 'admin',
  },
];

export const DUMMY_MECHANICS: Mechanic[] = [
  {
    id: '1',
    name: 'Raj Kumar',
    email: 'raj@example.com',
    phone: '9876543220',
    rating: 4.8,
    totalJobs: 256,
    specializations: ['Engine', 'Brakes'],
    isActive: true,
    joinDate: '2022-01-15',
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '9876543221',
    rating: 4.9,
    totalJobs: 189,
    specializations: ['Electrical', 'Suspension'],
    isActive: true,
    joinDate: '2022-06-20',
  },
  {
    id: '3',
    name: 'Arjun Patel',
    email: 'arjun@example.com',
    phone: '9876543222',
    rating: 4.7,
    totalJobs: 342,
    specializations: ['Engine', 'Transmission', 'Brakes'],
    isActive: true,
    joinDate: '2021-03-10',
  },
];

export const DUMMY_DELIVERY_PERSONS: DeliveryPerson[] = [
  {
    id: '1',
    name: 'Mohan Kumar',
    email: 'mohan@example.com',
    phone: '9876543230',
    vehicle: 'Honda Activa',
    rating: 4.6,
    totalDeliveries: 456,
    isActive: true,
    joinDate: '2022-02-14',
  },
  {
    id: '2',
    name: 'Suresh Rao',
    email: 'suresh@example.com',
    phone: '9876543231',
    vehicle: 'Toyota Innova',
    rating: 4.8,
    totalDeliveries: 523,
    isActive: true,
    joinDate: '2021-11-25',
  },
];

export const DUMMY_ORDERS: Order[] = [
  {
    id: '1',
    userId: '1',
    items: [
      {
        id: '1',
        partId: '1',
        part: DUMMY_PARTS[0],
        quantity: 2,
      },
    ],
    totalPrice: 598,
    status: 'delivered',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-18',
    deliveryAddress: '123 Main St, City',
    deliveryBoy: 'Mohan Kumar',
  },
  {
    id: '2',
    userId: '1',
    items: [
      {
        id: '2',
        partId: '3',
        part: DUMMY_PARTS[2],
        quantity: 1,
      },
    ],
    totalPrice: 1200,
    status: 'shipped',
    orderDate: '2024-01-20',
    deliveryAddress: '123 Main St, City',
    deliveryBoy: 'Suresh Rao',
  },
];

export const DUMMY_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: '1',
    userId: '1',
    serviceType: 'home',
    vehicleType: 'car',
    problem: 'Engine overheating issue',
    location: '456 Oak Ave, City',
    photos: [],
    contactNumber: '9876543210',
    estimatedCharge: '₹500 - ₹800',
    status: 'completed',
    mechanic: 'Raj Kumar',
    requestDate: '2024-01-10',
    completedDate: '2024-01-11',
  },
  {
    id: '2',
    userId: '1',
    serviceType: 'roadside',
    vehicleType: 'bike',
    problem: 'Brake failure',
    location: 'Highway 5, near junction',
    photos: [],
    contactNumber: '9876543210',
    estimatedCharge: '₹800 - ₹1200',
    status: 'accepted',
    mechanic: 'Priya Singh',
    requestDate: '2024-01-22',
  },
];
