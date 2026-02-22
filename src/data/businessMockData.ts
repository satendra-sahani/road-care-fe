// ============================================================
// COMPLETE BUSINESS MANAGEMENT MOCK DATA
// Purchase entries, Sales records, Profit tracking, Investor data
// ============================================================

// ---- PURCHASE ENTRIES (Stock bought from companies) ----
export interface PurchaseEntry {
  id: string
  invoiceNo: string
  date: string
  supplierName: string
  supplierGST?: string
  items: PurchaseItem[]
  totalAmount: number
  paidAmount: number
  paymentStatus: 'paid' | 'partial' | 'pending'
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque'
  notes?: string
  createdBy: string
}

export interface PurchaseItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  costPerUnit: number
  totalCost: number
  mrp: number
  sellingPrice: number
}

export const mockPurchases: PurchaseEntry[] = [
  {
    id: 'PUR-001',
    invoiceNo: 'INV-2026-0215',
    date: '2026-02-15',
    supplierName: 'Auto Parts Co. - Gorakhpur',
    supplierGST: '09AABCU9603R1ZM',
    items: [
      { productId: 'PRD-001', productName: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', quantity: 50, costPerUnit: 800, totalCost: 40000, mrp: 1500, sellingPrice: 1290 },
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 30, costPerUnit: 620, totalCost: 18600, mrp: 950, sellingPrice: 850 },
      { productId: 'PRD-003', productName: 'Michelin Energy XM2+ 195/65 R15', sku: 'TYRE-195-65-R15', quantity: 10, costPerUnit: 3200, totalCost: 32000, mrp: 5200, sellingPrice: 4500 },
    ],
    totalAmount: 90600,
    paidAmount: 90600,
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    notes: 'Monthly restock order',
    createdBy: 'Satendra'
  },
  {
    id: 'PUR-002',
    invoiceNo: 'INV-2026-0212',
    date: '2026-02-12',
    supplierName: 'Tyre World - Deoria',
    items: [
      { productId: 'PRD-003', productName: 'Michelin Energy XM2+ 195/65 R15', sku: 'TYRE-195-65-R15', quantity: 8, costPerUnit: 3200, totalCost: 25600, mrp: 5200, sellingPrice: 4500 },
      { productId: 'PRD-009', productName: 'Apollo Amazer 4G Life 175/70 R13', sku: 'TYRE-175-70-R13', quantity: 15, costPerUnit: 2100, totalCost: 31500, mrp: 3200, sellingPrice: 2800 },
    ],
    totalAmount: 57100,
    paidAmount: 40000,
    paymentStatus: 'partial',
    paymentMethod: 'upi',
    notes: 'Remaining ₹17,100 to be paid by month end',
    createdBy: 'Satendra'
  },
  {
    id: 'PUR-003',
    invoiceNo: 'INV-2026-0210',
    date: '2026-02-10',
    supplierName: 'Battery House - Kushinagar',
    items: [
      { productId: 'PRD-004', productName: 'Exide EEZY 35L Battery', sku: 'BAT-35L-001', quantity: 20, costPerUnit: 2800, totalCost: 56000, mrp: 4500, sellingPrice: 3850 },
      { productId: 'PRD-010', productName: 'Amaron GO 35AH Battery', sku: 'BAT-35AH-002', quantity: 15, costPerUnit: 3100, totalCost: 46500, mrp: 4800, sellingPrice: 4200 },
    ],
    totalAmount: 102500,
    paidAmount: 102500,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    createdBy: 'Satendra'
  },
  {
    id: 'PUR-004',
    invoiceNo: 'INV-2026-0205',
    date: '2026-02-05',
    supplierName: 'Bosch Authorized - Lucknow',
    supplierGST: '09AADCB2230A1Z5',
    items: [
      { productId: 'PRD-005', productName: 'Bosch Spark Plug Set (4pc)', sku: 'SP-4PC-001', quantity: 100, costPerUnit: 180, totalCost: 18000, mrp: 350, sellingPrice: 280 },
      { productId: 'PRD-006', productName: 'Bosch Air Filter', sku: 'AF-BOSCH-001', quantity: 40, costPerUnit: 320, totalCost: 12800, mrp: 550, sellingPrice: 450 },
      { productId: 'PRD-001', productName: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', quantity: 30, costPerUnit: 780, totalCost: 23400, mrp: 1500, sellingPrice: 1290 },
    ],
    totalAmount: 54200,
    paidAmount: 54200,
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    createdBy: 'Satendra'
  },
  {
    id: 'PUR-005',
    invoiceNo: 'INV-2026-0201',
    date: '2026-02-01',
    supplierName: 'Oil Distributors Ltd. - Varanasi',
    items: [
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 50, costPerUnit: 620, totalCost: 31000, mrp: 950, sellingPrice: 850 },
      { productId: 'PRD-011', productName: 'Shell Helix HX7 10W-40', sku: 'OIL-10W40-001', quantity: 25, costPerUnit: 700, totalCost: 17500, mrp: 1100, sellingPrice: 950 },
    ],
    totalAmount: 48500,
    paidAmount: 0,
    paymentStatus: 'pending',
    paymentMethod: 'cheque',
    notes: 'Payment due 28 Feb',
    createdBy: 'Satendra'
  },
  {
    id: 'PUR-006',
    invoiceNo: 'INV-2026-0125',
    date: '2026-01-25',
    supplierName: 'Auto Parts Co. - Gorakhpur',
    supplierGST: '09AABCU9603R1ZM',
    items: [
      { productId: 'PRD-007', productName: 'Monroe Front Shock Absorber', sku: 'SA-FRONT-001', quantity: 20, costPerUnit: 1200, totalCost: 24000, mrp: 2200, sellingPrice: 1850 },
      { productId: 'PRD-008', productName: 'Denso Alternator', sku: 'ALT-DENSO-001', quantity: 10, costPerUnit: 2500, totalCost: 25000, mrp: 4200, sellingPrice: 3600 },
    ],
    totalAmount: 49000,
    paidAmount: 49000,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    createdBy: 'Satendra'
  }
]

// ---- SALES RECORDS (Every sale to customer) ----
export interface SaleRecord {
  id: string
  invoiceNo: string
  date: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  items: SaleItem[]
  subtotal: number
  discount: number
  totalAmount: number
  paymentMethod: 'cash' | 'upi' | 'card' | 'cod'
  paymentStatus: 'paid' | 'pending' | 'cod_pending'
  deliveryMode: 'pickup' | 'delivery'
  orderId?: string
  deliveryBoy?: string
  profit: number
  notes?: string
  createdBy: string
}

export interface SaleItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  costPrice: number
  sellingPrice: number
  discount: number
  totalPrice: number
  profit: number
}

export const mockSales: SaleRecord[] = [
  {
    id: 'SALE-001',
    invoiceNo: 'RC-2026-0001',
    date: '2026-02-17',
    customerName: 'Ramesh Yadav',
    customerPhone: '+91 98765 43210',
    customerAddress: 'Hata Main Market, Kushinagar',
    items: [
      { productId: 'PRD-001', productName: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', quantity: 1, costPrice: 800, sellingPrice: 1290, discount: 0, totalPrice: 1290, profit: 490 },
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 2, costPrice: 620, sellingPrice: 850, discount: 50, totalPrice: 1650, profit: 410 },
    ],
    subtotal: 2940,
    discount: 50,
    totalAmount: 2890,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 900,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-002',
    invoiceNo: 'RC-2026-0002',
    date: '2026-02-17',
    customerName: 'Suresh Kumar',
    customerPhone: '+91 87654 32109',
    customerAddress: 'Hetimpur, Deoria',
    items: [
      { productId: 'PRD-003', productName: 'Michelin Energy XM2+ 195/65 R15', sku: 'TYRE-195-65-R15', quantity: 2, costPrice: 3200, sellingPrice: 4500, discount: 200, totalPrice: 8800, profit: 2400 },
    ],
    subtotal: 9000,
    discount: 200,
    totalAmount: 8800,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    deliveryMode: 'delivery',
    orderId: 'ORD-1042',
    deliveryBoy: 'Amit Singh',
    profit: 2400,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-003',
    invoiceNo: 'RC-2026-0003',
    date: '2026-02-16',
    customerName: 'Manoj Tiwari',
    customerPhone: '+91 76543 21098',
    customerAddress: 'Bermehiya, Deoria',
    items: [
      { productId: 'PRD-004', productName: 'Exide EEZY 35L Battery', sku: 'BAT-35L-001', quantity: 1, costPrice: 2800, sellingPrice: 3850, discount: 0, totalPrice: 3850, profit: 1050 },
      { productId: 'PRD-005', productName: 'Bosch Spark Plug Set (4pc)', sku: 'SP-4PC-001', quantity: 2, costPrice: 180, sellingPrice: 280, discount: 0, totalPrice: 560, profit: 200 },
    ],
    subtotal: 4410,
    discount: 0,
    totalAmount: 4410,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 1250,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-004',
    invoiceNo: 'RC-2026-0004',
    date: '2026-02-16',
    customerName: 'Vikram Singh',
    customerPhone: '+91 65432 10987',
    customerAddress: 'Bhatani Dadan, Deoria',
    items: [
      { productId: 'PRD-007', productName: 'Monroe Front Shock Absorber', sku: 'SA-FRONT-001', quantity: 2, costPrice: 1200, sellingPrice: 1850, discount: 100, totalPrice: 3600, profit: 1200 },
      { productId: 'PRD-006', productName: 'Bosch Air Filter', sku: 'AF-BOSCH-001', quantity: 1, costPrice: 320, sellingPrice: 450, discount: 0, totalPrice: 450, profit: 130 },
    ],
    subtotal: 4150,
    discount: 100,
    totalAmount: 4050,
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    deliveryMode: 'delivery',
    orderId: 'ORD-1043',
    deliveryBoy: 'Rajesh Kumar',
    profit: 1330,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-005',
    invoiceNo: 'RC-2026-0005',
    date: '2026-02-15',
    customerName: 'Ajay Patel',
    customerPhone: '+91 54321 09876',
    customerAddress: 'Mundera Chand, Deoria',
    items: [
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 3, costPrice: 620, sellingPrice: 850, discount: 0, totalPrice: 2550, profit: 690 },
      { productId: 'PRD-005', productName: 'Bosch Spark Plug Set (4pc)', sku: 'SP-4PC-001', quantity: 4, costPrice: 180, sellingPrice: 280, discount: 40, totalPrice: 1080, profit: 360 },
    ],
    subtotal: 3630,
    discount: 40,
    totalAmount: 3590,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 1050,
    notes: 'Regular customer - mechanic shop owner',
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-006',
    invoiceNo: 'RC-2026-0006',
    date: '2026-02-15',
    customerName: 'Dinesh Gupta',
    customerPhone: '+91 43210 98765',
    customerAddress: 'Bharkulwa Bazar, Deoria',
    items: [
      { productId: 'PRD-008', productName: 'Denso Alternator', sku: 'ALT-DENSO-001', quantity: 1, costPrice: 2500, sellingPrice: 3600, discount: 0, totalPrice: 3600, profit: 1100 },
    ],
    subtotal: 3600,
    discount: 0,
    totalAmount: 3600,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 1100,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-007',
    invoiceNo: 'RC-2026-0007',
    date: '2026-02-14',
    customerName: 'Pradeep Mishra',
    customerPhone: '+91 32109 87654',
    customerAddress: 'Hata Sabji Mandi, Kushinagar',
    items: [
      { productId: 'PRD-001', productName: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', quantity: 2, costPrice: 800, sellingPrice: 1290, discount: 80, totalPrice: 2500, profit: 820 },
      { productId: 'PRD-006', productName: 'Bosch Air Filter', sku: 'AF-BOSCH-001', quantity: 2, costPrice: 320, sellingPrice: 450, discount: 0, totalPrice: 900, profit: 260 },
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 1, costPrice: 620, sellingPrice: 850, discount: 0, totalPrice: 850, profit: 230 },
    ],
    subtotal: 4330,
    discount: 80,
    totalAmount: 4250,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 1310,
    notes: 'Bulk order from garage',
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-008',
    invoiceNo: 'RC-2026-0008',
    date: '2026-02-13',
    customerName: 'Ravi Sharma',
    customerPhone: '+91 21098 76543',
    customerAddress: 'Hata, Kushinagar',
    items: [
      { productId: 'PRD-004', productName: 'Exide EEZY 35L Battery', sku: 'BAT-35L-001', quantity: 1, costPrice: 2800, sellingPrice: 3850, discount: 150, totalPrice: 3700, profit: 900 },
    ],
    subtotal: 3850,
    discount: 150,
    totalAmount: 3700,
    paymentMethod: 'cod',
    paymentStatus: 'cod_pending',
    deliveryMode: 'delivery',
    orderId: 'ORD-1039',
    deliveryBoy: 'Amit Singh',
    profit: 900,
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-009',
    invoiceNo: 'RC-2026-0009',
    date: '2026-02-12',
    customerName: 'Santosh Verma',
    customerPhone: '+91 10987 65432',
    items: [
      { productId: 'PRD-009', productName: 'Apollo Amazer 4G Life 175/70 R13', sku: 'TYRE-175-70-R13', quantity: 4, costPrice: 2100, sellingPrice: 2800, discount: 400, totalPrice: 10800, profit: 2400 },
    ],
    subtotal: 11200,
    discount: 400,
    totalAmount: 10800,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    profit: 2400,
    notes: '4 tyres for Maruti Alto - full set change',
    createdBy: 'Satendra'
  },
  {
    id: 'SALE-010',
    invoiceNo: 'RC-2026-0010',
    date: '2026-02-10',
    customerName: 'Anil Kumar',
    customerPhone: '+91 09876 54321',
    customerAddress: 'Hetimpur, Deoria',
    items: [
      { productId: 'PRD-005', productName: 'Bosch Spark Plug Set (4pc)', sku: 'SP-4PC-001', quantity: 3, costPrice: 180, sellingPrice: 280, discount: 0, totalPrice: 840, profit: 300 },
      { productId: 'PRD-002', productName: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', quantity: 2, costPrice: 620, sellingPrice: 850, discount: 0, totalPrice: 1700, profit: 460 },
      { productId: 'PRD-001', productName: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', quantity: 1, costPrice: 800, sellingPrice: 1290, discount: 0, totalPrice: 1290, profit: 490 },
    ],
    subtotal: 3830,
    discount: 0,
    totalAmount: 3830,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'delivery',
    orderId: 'ORD-1036',
    deliveryBoy: 'Rajesh Kumar',
    profit: 1250,
    createdBy: 'Satendra'
  }
]

// ---- INVESTOR DATA ----
export interface Investor {
  id: string
  name: string
  phone: string
  email?: string
  investmentAmount: number
  equityPercentage: number
  investmentDate: string
  type: 'founder' | 'investor' | 'partner'
  status: 'active' | 'exited'
  profitShare: number // percentage of profit they get
  totalProfitPaid: number
  notes?: string
}

export const mockInvestors: Investor[] = [
  {
    id: 'INV-001',
    name: 'Satendra Sahani',
    phone: '+91 98765 43210',
    email: 'satendra@roadcare.in',
    investmentAmount: 500000,
    equityPercentage: 60,
    investmentDate: '2025-12-01',
    type: 'founder',
    status: 'active',
    profitShare: 60,
    totalProfitPaid: 0,
    notes: 'Founder & CEO'
  },
  {
    id: 'INV-002',
    name: 'Investor 1',
    phone: '+91 87654 32109',
    investmentAmount: 200000,
    equityPercentage: 25,
    investmentDate: '2026-01-15',
    type: 'investor',
    status: 'active',
    profitShare: 25,
    totalProfitPaid: 0,
    notes: 'Seed investor - 2 Lakh'
  },
  {
    id: 'INV-003',
    name: 'Investor 2',
    phone: '+91 76543 21098',
    investmentAmount: 100000,
    equityPercentage: 15,
    investmentDate: '2026-02-01',
    type: 'partner',
    status: 'active',
    profitShare: 15,
    totalProfitPaid: 0,
    notes: 'Partner investor - 1 Lakh'
  }
]

// ---- DAILY SUMMARY ----
export interface DailySummary {
  date: string
  totalPurchases: number
  totalSales: number
  totalProfit: number
  totalOrders: number
  itemsSold: number
  topProduct: string
  cashIn: number
  cashOut: number
}

export const mockDailySummaries: DailySummary[] = [
  { date: '2026-02-17', totalPurchases: 0, totalSales: 11690, totalProfit: 3300, totalOrders: 2, itemsSold: 5, topProduct: 'Michelin Tyre', cashIn: 2890, cashOut: 0 },
  { date: '2026-02-16', totalPurchases: 0, totalSales: 8460, totalProfit: 2580, totalOrders: 2, itemsSold: 6, topProduct: 'Exide Battery', cashIn: 4410, cashOut: 0 },
  { date: '2026-02-15', totalPurchases: 90600, totalSales: 7190, totalProfit: 2150, totalOrders: 2, itemsSold: 8, topProduct: 'Castrol Oil', cashIn: 3600, cashOut: 90600 },
  { date: '2026-02-14', totalPurchases: 0, totalSales: 4250, totalProfit: 1310, totalOrders: 1, itemsSold: 5, topProduct: 'Brake Pads', cashIn: 4250, cashOut: 0 },
  { date: '2026-02-13', totalPurchases: 0, totalSales: 3700, totalProfit: 900, totalOrders: 1, itemsSold: 1, topProduct: 'Exide Battery', cashIn: 0, cashOut: 0 },
  { date: '2026-02-12', totalPurchases: 57100, totalSales: 10800, totalProfit: 2400, totalOrders: 1, itemsSold: 4, topProduct: 'Apollo Tyre', cashIn: 10800, cashOut: 40000 },
  { date: '2026-02-10', totalPurchases: 102500, totalSales: 3830, totalProfit: 1250, totalOrders: 1, itemsSold: 6, topProduct: 'Brake Pads', cashIn: 3830, cashOut: 102500 },
]

// ---- EXPENSE CATEGORIES ----
export interface Expense {
  id: string
  date: string
  category: 'rent' | 'salary' | 'transport' | 'electricity' | 'marketing' | 'packaging' | 'misc'
  description: string
  amount: number
  paidTo: string
  paymentMethod: 'cash' | 'upi' | 'bank_transfer'
}

export const mockExpenses: Expense[] = [
  { id: 'EXP-001', date: '2026-02-01', category: 'rent', description: 'Shop rent - February', amount: 8000, paidTo: 'Landlord', paymentMethod: 'cash' },
  { id: 'EXP-002', date: '2026-02-01', category: 'electricity', description: 'Electricity bill - January', amount: 2500, paidTo: 'UPPCL', paymentMethod: 'upi' },
  { id: 'EXP-003', date: '2026-02-05', category: 'salary', description: 'Delivery boy salary', amount: 10000, paidTo: 'Amit Singh', paymentMethod: 'cash' },
  { id: 'EXP-004', date: '2026-02-05', category: 'salary', description: 'Delivery boy salary', amount: 10000, paidTo: 'Rajesh Kumar', paymentMethod: 'cash' },
  { id: 'EXP-005', date: '2026-02-10', category: 'transport', description: 'Stock pickup from Gorakhpur', amount: 1500, paidTo: 'Transport', paymentMethod: 'cash' },
  { id: 'EXP-006', date: '2026-02-12', category: 'packaging', description: 'Packaging material', amount: 800, paidTo: 'Packaging Store', paymentMethod: 'cash' },
  { id: 'EXP-007', date: '2026-02-15', category: 'marketing', description: 'Pamphlet printing - 500 copies', amount: 1500, paidTo: 'Print Shop', paymentMethod: 'cash' },
  { id: 'EXP-008', date: '2026-02-15', category: 'transport', description: 'Stock pickup from Deoria', amount: 800, paidTo: 'Transport', paymentMethod: 'cash' },
]

// ---- HELPER FUNCTIONS ----
export const getBusinessMetrics = () => {
  const totalPurchaseAmount = mockPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaidToPurchase = mockPurchases.reduce((sum, p) => sum + p.paidAmount, 0)
  const pendingPayments = totalPurchaseAmount - totalPaidToPurchase

  const totalSalesAmount = mockSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalProfit = mockSales.reduce((sum, s) => sum + s.profit, 0)
  const totalDiscounts = mockSales.reduce((sum, s) => sum + s.discount, 0)
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalProfit - totalExpenses

  const totalInvestment = mockInvestors.reduce((sum, i) => sum + i.investmentAmount, 0)

  const totalItemsSold = mockSales.reduce((sum, s) =>
    sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

  const totalItemsPurchased = mockPurchases.reduce((sum, p) =>
    sum + p.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

  const profitMargin = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0

  return {
    totalPurchaseAmount,
    totalPaidToPurchase,
    pendingPayments,
    totalSalesAmount,
    totalProfit,
    totalDiscounts,
    totalExpenses,
    netProfit,
    totalInvestment,
    totalItemsSold,
    totalItemsPurchased,
    profitMargin,
    totalSalesCount: mockSales.length,
    totalPurchaseCount: mockPurchases.length,
    averageOrderValue: totalSalesAmount / mockSales.length,
  }
}
