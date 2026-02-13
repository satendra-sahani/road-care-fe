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
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  ShoppingCart,
  Layers,
  Tag,
  Calendar,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  X,
  Save
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Product, ProductFilters } from '@/types'
import { 
  mockProducts, 
  mockCategories, 
  mockBrands, 
  mockSuppliers, 
  mockStockMovements,
  mockInventoryMetrics 
} from '@/data/mockData'

// Vehicle data structure for cascading dropdowns
const vehicleData = {
  car: {
    honda: ['City', 'Civic', 'Accord', 'CR-V', 'Jazz', 'Amaze'],
    toyota: ['Camry', 'Corolla', 'Innova', 'Fortuner', 'Etios', 'Glanza'],
    maruti: ['Swift', 'Baleno', 'Dzire', 'Alto', 'Wagon R', 'Vitara Brezza'],
    hyundai: ['i20', 'i10', 'Verna', 'Creta', 'Venue', 'Tucson'],
    tata: ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tiago', 'Tigor'],
    mahindra: ['XUV300', 'XUV500', 'XUV700', 'Scorpio', 'Bolero', 'Thar'],
    ford: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle'],
    volkswagen: ['Polo', 'Vento', 'Tiguan', 'T-Roc', 'Passat']
  },
  motorcycle: {
    honda: ['Activa', 'CB Shine', 'Unicorn', 'Hornet', 'CBR', 'Dio'],
    yamaha: ['FZ', 'R15', 'MT-15', 'Fascino', 'Ray ZR', 'Aerox'],
    'hero-motocorp': ['Splendor', 'HF Deluxe', 'Passion', 'Glamour', 'Xtreme', 'Destini'],
    bajaj: ['Pulsar', 'Avenger', 'Dominar', 'CT', 'Platina', 'Chetak'],
    'tvs': ['Apache', 'Ntorq', 'Jupiter', 'Radeon', 'XL100', 'iQube'],
    'royal-enfield': ['Classic', 'Bullet', 'Himalayan', 'Interceptor', 'Continental GT']
  },
  truck: {
    tata: ['Ace', 'Super Ace', 'Ultra', 'Prima', 'Signa', 'LPT'],
    ashok: ['Dost', 'Partner', 'Boss', 'U-Truck', 'Guru', 'Captain'],
    mahindra: ['Bolero Pickup', 'Supro', 'Jeeto', 'Furio', 'Blazo'],
    eicher: ['Pro 1049', 'Pro 2049', 'Pro 3015', 'Pro 6025', 'Pro 8025'],
    'force-motors': ['Traveller', 'Tempo', 'Trax', 'Citiline']
  },
  bus: {
    tata: ['Starbus', 'Ultra', 'Magna', 'LP', 'Marcopolo'],
    ashok: ['Viking', 'Lynx', 'Falcon', 'Cheetah', 'Stallion'],
    mahindra: ['Tourister', 'Cosmo', 'Cruzio', 'Blazo Bus'],
    eicher: ['Skyline', 'Starline', 'Pro Bus']
  }
}

// Auto Part Brands (manufacturers of auto parts)
const autoPartBrands = {
  tyres: ['Michelin', 'Bridgestone', 'JK Tyre', 'Apollo', 'CEAT', 'MRF', 'Goodyear'],
  'engine-oil': ['Castrol', 'Mobil 1', 'Shell', 'Valvoline', 'Total', 'Motul', 'Gulf'],
  'brake-system': ['Bosch', 'Brembo', 'Akebono', 'Wagner', 'Ferodo', 'EBC', 'Bendix'],
  battery: ['Exide', 'Amaron', 'Luminous', 'Su-Kam', 'Okaya', 'SF Sonic', 'Tata Green'],
  electrical: ['Bosch', 'Denso', 'Valeo', 'Hella', 'Philips', 'Osram', 'Lucas'],
  filters: ['Mann Filter', 'Bosch', 'Mahle', 'K&N', 'Fram', 'Wix', 'Purolator'],
  suspension: ['Monroe', 'KYB', 'Bilstein', 'Gabriel', 'Sachs', 'Ohlins', 'Fox'],
  universal: ['Bosch', 'Denso', 'Continental', 'Valeo', 'Mahle', 'Hella', 'NGK']
}

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [filters, setFilters] = useState<ProductFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('products')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [brandFormData, setBrandFormData] = useState({ name: '', logo: null as File | null })
  const [brands, setBrands] = useState(mockBrands)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' })
  const [categories, setCategories] = useState(mockCategories)
  const [isVehicleBrandModalOpen, setIsVehicleBrandModalOpen] = useState(false)
  const [vehicleBrandFormData, setVehicleBrandFormData] = useState({ 
    vehicleType: '', 
    brandName: '', 
    models: [''] 
  })
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
  const [selectedProductForUnits, setSelectedProductForUnits] = useState<any>(null)
  const [unitUpdateData, setUnitUpdateData] = useState({ quantity: '', reason: '' })
  const [stockHistory, setStockHistory] = useState<any[]>([
    { id: 1, productId: 'PRD-001', type: 'addition', quantity: 50, reason: 'Initial Stock', date: '2026-01-15', by: 'Admin' },
    { id: 2, productId: 'PRD-001', type: 'sale', quantity: -5, reason: 'Sale Order #12345', date: '2026-02-10', by: 'System' },
    { id: 3, productId: 'PRD-002', type: 'addition', quantity: 20, reason: 'Restock', date: '2026-02-05', by: 'Admin' }
  ])
  const [productFormData, setProductFormData] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    price: '',
    mrp: '',
    stock: '',
    lowStockThreshold: '',
    description: '',
    specifications: [''],
    compatibility: [''],
    weight: '',
    warranty: '',
    thumbnail: null as File | null,
    images: [] as File[]
  })

  // Status configuration
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
    'out-of-stock': { color: 'bg-red-100 text-red-800', label: 'Out of Stock' },
    discontinued: { color: 'bg-yellow-100 text-yellow-800', label: 'Discontinued' }
  }

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || product.category.toLowerCase().replace(/\s+/g, '-') === categoryFilter
      const matchesBrand = brandFilter === 'all' || product.brand.toLowerCase() === brandFilter
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesBrand && matchesStatus
    })
  }, [searchQuery, categoryFilter, brandFilter, statusFilter])

  const getInventoryStats = () => {
    const totalProducts = mockProducts.length
    const activeProducts = mockProducts.filter(p => p.status === 'active').length
    const lowStockProducts = mockProducts.filter(p => p.stock <= p.lowStockThreshold).length
    const outOfStock = mockProducts.filter(p => p.stock === 0).length
    const totalValue = mockProducts.reduce((sum, p) => sum + (p.stock * p.costPrice), 0)
    
    return { totalProducts, activeProducts, lowStockProducts, outOfStock, totalValue }
  }

  const stats = getInventoryStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setBrandFormData({ name: '', logo: null })
    setIsBrandModalOpen(true)
  }

  const handleEditBrand = (brand: any) => {
    setSelectedBrand(brand)
    setBrandFormData({ name: brand.name, logo: null })
    setIsBrandModalOpen(true)
  }

  const handleSaveBrand = () => {
    if (selectedBrand) {
      // Update existing brand
      setBrands(prev => prev.map(b => 
        b.id === selectedBrand.id 
          ? { ...b, name: brandFormData.name }
          : b
      ))
    } else {
      // Add new brand
      const newBrand = {
        id: `brand-${Date.now()}`,
        name: brandFormData.name,
        count: 0,
        revenue: 0
      }
      setBrands(prev => [...prev, newBrand])
    }
    setIsBrandModalOpen(false)
    setBrandFormData({ name: '', logo: null })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBrandFormData(prev => ({ ...prev, logo: file }))
    }
  }

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setCategoryFormData({ name: '', description: '' })
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category)
    setCategoryFormData({ name: category.name, description: category.description || '' })
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = () => {
    if (selectedCategory) {
      // Update existing category
      setCategories(prev => prev.map(c => 
        c.id === selectedCategory.id 
          ? { ...c, name: categoryFormData.name, description: categoryFormData.description }
          : c
      ))
    } else {
      // Add new category
      const newCategory = {
        id: `cat-${Date.now()}`,
        name: categoryFormData.name,
        description: categoryFormData.description,
        count: 0,
        revenue: 0
      }
      setCategories(prev => [...prev, newCategory])
    }
    setIsCategoryModalOpen(false)
    setCategoryFormData({ name: '', description: '' })
  }

  const handleAddProduct = () => {
    setProductFormData({
      name: '',
      sku: '',
      category: '',
      brand: '',
      vehicleType: '',
      vehicleBrand: '',
      vehicleModel: '',
      price: '',
      mrp: '',
      stock: '',
      lowStockThreshold: '',
      description: '',
      specifications: [''],
      compatibility: [''],
      weight: '',
      warranty: '',
      thumbnail: null,
      images: []
    })
    setIsAddProductOpen(true)
  }

  const handleSaveProduct = () => {
    const newProduct: Product = {
      id: `PRD-${Date.now()}`,
      name: productFormData.name,
      sku: productFormData.sku || `SKU-${Date.now()}`,
      category: productFormData.category,
      brand: productFormData.brand,
      price: Number(productFormData.price),
      mrp: Number(productFormData.mrp),
      stock: Number(productFormData.stock),
      lowStockThreshold: Number(productFormData.lowStockThreshold),
      status: 'active',
      rating: 0,
      reviews: 0,
      sales: 0,
      images: productFormData.images.map(img => URL.createObjectURL(img)),
      description: productFormData.description,
      specifications: productFormData.specifications.filter(s => s.trim()),
      compatibility: productFormData.compatibility.filter(c => c.trim()),
      supplier: 'Default Supplier',
      costPrice: Number(productFormData.price) * 0.7, // 30% margin
      weight: productFormData.weight ? Number(productFormData.weight) : undefined,
      warranty: productFormData.warranty || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setProducts(prev => [...prev, newProduct])
    setIsAddProductOpen(false)
  }

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProductFormData(prev => ({ ...prev, thumbnail: file }))
      // Also add to images array if it's the first image
      if (prev.images.length === 0) {
        setProductFormData(prev => ({ ...prev, images: [file] }))
      }
    }
  }

  const handleMultipleImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setProductFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const removeImage = (index: number) => {
    setProductFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const addSpecification = () => {
    setProductFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, '']
    }))
  }

  const updateSpecification = (index: number, value: string) => {
    setProductFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => i === index ? value : spec)
    }))
  }

  const removeSpecification = (index: number) => {
    setProductFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const addCompatibility = () => {
    setProductFormData(prev => ({
      ...prev,
      compatibility: [...prev.compatibility, '']
    }))
  }

  const updateCompatibility = (index: number, value: string) => {
    setProductFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.map((comp, i) => i === index ? value : comp)
    }))
  }

  const removeCompatibility = (index: number) => {
    setProductFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.filter((_, i) => i !== index)
    }))
  }

  const handleVehicleTypeChange = (value: string) => {
    setProductFormData(prev => ({
      ...prev,
      vehicleType: value,
      vehicleBrand: '', // Reset brand when type changes
      vehicleModel: ''  // Reset model when type changes
    }))
  }

  const handleVehicleBrandChange = (value: string) => {
    setProductFormData(prev => ({
      ...prev,
      vehicleBrand: value,
      vehicleModel: '' // Reset model when brand changes
    }))
  }

  const getAvailableVehicleBrands = () => {
    if (!productFormData.vehicleType || !vehicleData[productFormData.vehicleType as keyof typeof vehicleData]) {
      return []
    }
    return Object.keys(vehicleData[productFormData.vehicleType as keyof typeof vehicleData])
  }

  const getAvailableVehicleModels = () => {
    if (!productFormData.vehicleType || !productFormData.vehicleBrand) {
      return []
    }
    const typeData = vehicleData[productFormData.vehicleType as keyof typeof vehicleData]
    if (!typeData) return []
    return typeData[productFormData.vehicleBrand as keyof typeof typeData] || []
  }

  const getAvailableAutoPartBrands = () => {
    if (!productFormData.category) {
      return autoPartBrands.universal // Show universal brands if no category
    }
    const categoryKey = productFormData.category.toLowerCase().replace(/\s+/g, '-')
    return autoPartBrands[categoryKey as keyof typeof autoPartBrands] || autoPartBrands.universal
  }

  const handleAddVehicleBrand = () => {
    setVehicleBrandFormData({ vehicleType: '', brandName: '', models: [''] })
    setIsVehicleBrandModalOpen(true)
  }

  const handleSaveVehicleBrand = () => {
    // In a real app, this would update the backend
    console.log('Saving vehicle brand:', vehicleBrandFormData)
    setIsVehicleBrandModalOpen(false)
  }

  const addModel = () => {
    setVehicleBrandFormData(prev => ({
      ...prev,
      models: [...prev.models, '']
    }))
  }

  const updateModel = (index: number, value: string) => {
    setVehicleBrandFormData(prev => ({
      ...prev,
      models: prev.models.map((model, i) => i === index ? value : model)
    }))
  }

  const removeModel = (index: number) => {
    setVehicleBrandFormData(prev => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index)
    }))
  }

  const handleUnitClick = (product: any) => {
    setSelectedProductForUnits(product)
    setUnitUpdateData({ quantity: '', reason: '' })
    setIsUnitModalOpen(true)
  }

  const handleUpdateUnits = () => {
    if (selectedProductForUnits && unitUpdateData.quantity) {
      const quantity = parseInt(unitUpdateData.quantity)
      const newStockEntry = {
        id: stockHistory.length + 1,
        productId: selectedProductForUnits.id,
        type: quantity > 0 ? 'addition' : 'sale',
        quantity: quantity,
        reason: unitUpdateData.reason || (quantity > 0 ? 'Stock Addition' : 'Stock Adjustment'),
        date: new Date().toISOString().split('T')[0],
        by: 'Admin'
      }
      
      // Update stock history
      setStockHistory(prev => [...prev, newStockEntry])
      
      // Update product stock
      setProducts(prev => prev.map(p => 
        p.id === selectedProductForUnits.id 
          ? { ...p, stock: p.stock + quantity }
          : p
      ))
      
      setIsUnitModalOpen(false)
    }
  }

  const getProductStockHistory = (productId: string) => {
    return stockHistory.filter(entry => entry.productId === productId)
  }

  const getProductSoldUnits = (productId: string) => {
    return stockHistory
      .filter(entry => entry.productId === productId && entry.quantity < 0)
      .reduce((total, entry) => total + Math.abs(entry.quantity), 0)
  }

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsEditProductOpen(true)
  }

  const handleDeleteProduct = (product: any) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getStockStatusBadge = (product: any) => {
    if (product.stock === 0) {
      return <Badge className="bg-red-100 text-red-800 border-0">Out of Stock</Badge>
    } else if (product.stock <= product.lowStockThreshold) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Low Stock</Badge>
    }
    return <Badge className="bg-green-100 text-green-800 border-0">In Stock</Badge>
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for products:`, selectedProducts)
    setSelectedProducts([])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Inventory Management</h1>
          <p className="text-[#6B7280] mt-1">Manage your product catalog, stock levels, and inventory operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Products
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Inventory
          </Button>
          <Button 
            className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            onClick={handleAddProduct}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalProducts}</p>
                <p className="text-xs text-[#6B7280]">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.activeProducts}</p>
                <p className="text-xs text-[#6B7280]">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.lowStockProducts}</p>
                <p className="text-xs text-[#6B7280]">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.outOfStock}</p>
                <p className="text-xs text-[#6B7280]">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold text-[#1A1D29]">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-[#6B7280]">Inventory Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products by name, SKU, brand..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="brake-system">Brake System</SelectItem>
                      <SelectItem value="engine-oil">Engine Oil</SelectItem>
                      <SelectItem value="tyres">Tyres</SelectItem>
                      <SelectItem value="battery">Battery</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={brandFilter} onValueChange={(value) => {
                    setBrandFilter(value)
                    if (value !== 'all') {
                      setActiveTab('brands')
                    }
                  }}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="bosch">Bosch</SelectItem>
                      <SelectItem value="castrol">Castrol</SelectItem>
                      <SelectItem value="michelin">Michelin</SelectItem>
                      <SelectItem value="exide">Exide</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedProducts.length} product(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('update-prices')}
                      >
                        Update Prices
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('update-stock')}
                      >
                        Update Stock
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleBulkAction('export')}
                      >
                        Export Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === filteredProducts.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Current Units</TableHead>
                    <TableHead>Sold Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-[#1A1D29]">{product.name}</div>
                            <div className="text-sm text-[#6B7280]">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.brand}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(product.price)}</div>
                          <div className="text-sm text-[#6B7280] line-through">{formatCurrency(product.mrp)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="h-auto p-2 text-left font-medium hover:bg-blue-50 flex items-center space-x-2"
                          onClick={() => handleUnitClick(product)}
                        >
                          <Package className="h-4 w-4 text-blue-600" />
                          <div className="space-y-1">
                            <div className={`font-medium ${
                              product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {product.stock} units
                            </div>
                            {getStockStatusBadge(product)}
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 font-medium">
                            {getProductSoldUnits(product.id)} units
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{product.rating}</span>
                          <span className="text-sm text-[#6B7280]">({product.reviews})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUnitClick(product)}>
                              <Package className="mr-2 h-4 w-4" />
                              Manage Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredProducts.length === 0 && (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No products found</h3>
                  <p className="text-[#6B7280]">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Product Categories</span>
                <Button 
                  className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                  onClick={handleAddCategory}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardTitle>
              <CardDescription>Manage product categories and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1B3B6F] rounded-lg flex items-center justify-center">
                        <Layers className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#1A1D29]">{category.name}</h4>
                        <p className="text-sm text-[#6B7280]">{category.count} products</p>
                        {category.description && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-medium text-[#1A1D29]">{formatCurrency(category.revenue)}</p>
                        <p className="text-sm text-[#6B7280]">Total Revenue</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Auto Part Brands */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Auto Part Brands</span>
                  <Button 
                    className="bg-[#1B3B6F] hover:bg-[#0F2545]"
                    onClick={handleAddBrand}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part Brand
                  </Button>
                </CardTitle>
                <CardDescription>Manufacturers of auto parts (Michelin, Bosch, Castrol, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(autoPartBrands).map(([category, brandList]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-[#1B3B6F] mb-3 capitalize">
                        {category.replace('-', ' ')} Brands
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {brandList.map((brand) => (
                          <div key={brand} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>{brand}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditBrand({ id: `${category}-${brand}`, name: brand })}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Brands */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vehicle Brands</span>
                  <Button 
                    className="bg-[#FF6B35] hover:bg-[#E55A2B]"
                    onClick={handleAddVehicleBrand}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle Brand
                  </Button>
                </CardTitle>
                <CardDescription>Vehicle manufacturers (Honda, Toyota, Royal Enfield, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(vehicleData).map(([vehicleType, brandData]) => (
                    <div key={vehicleType} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-[#FF6B35] mb-3 capitalize">
                        {vehicleType} Brands
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(brandData).map((brand) => (
                          <div key={brand} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                            <span className="capitalize">
                              {brand.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {brandData[brand as keyof typeof brandData].length} models
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stock Management Tab */}
        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Products running low on inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProducts.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <h4 className="font-medium text-[#1A1D29]">{product.name}</h4>
                        <p className="text-sm text-[#6B7280]">Current Stock: {product.stock} units</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Out of Stock */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2" />
                  Out of Stock
                </CardTitle>
                <CardDescription>Products currently unavailable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProducts.filter(p => p.stock === 0).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <h4 className="font-medium text-[#1A1D29]">{product.name}</h4>
                        <p className="text-sm text-red-600">Out of Stock</p>
                      </div>
                      <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Details - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Complete product information and analytics
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Product Name:</span> {selectedProduct.name}</p>
                    <p><span className="text-[#6B7280]">SKU:</span> {selectedProduct.sku}</p>
                    <p><span className="text-[#6B7280]">Category:</span> {selectedProduct.category}</p>
                    <p><span className="text-[#6B7280]">Brand:</span> {selectedProduct.brand}</p>
                    <p><span className="text-[#6B7280]">Status:</span> {getStatusBadge(selectedProduct.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Pricing & Stock</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Selling Price:</span> {formatCurrency(selectedProduct.price)}</p>
                    <p><span className="text-[#6B7280]">MRP:</span> {formatCurrency(selectedProduct.mrp)}</p>
                    <p><span className="text-[#6B7280]">Cost Price:</span> {formatCurrency(selectedProduct.costPrice)}</p>
                    <p><span className="text-[#6B7280]">Current Stock:</span> {selectedProduct.stock} units</p>
                    <p><span className="text-[#6B7280]">Stock Status:</span> {getStockStatusBadge(selectedProduct)}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 flex items-center justify-center">
                      <Star className="h-6 w-6 mr-1" />
                      {selectedProduct.rating}
                    </p>
                    <p className="text-sm text-[#6B7280]">Rating ({selectedProduct.reviews} reviews)</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedProduct.sales}</p>
                    <p className="text-sm text-[#6B7280]">Units Sold</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedProduct.sales * (selectedProduct.price - selectedProduct.costPrice))}
                    </p>
                    <p className="text-sm text-[#6B7280]">Gross Profit</p>
                  </div>
                </div>
              </div>

              {/* Description & Specifications */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Description</h4>
                  <p className="text-sm text-[#6B7280]">{selectedProduct.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Specifications</h4>
                  <ul className="text-sm text-[#6B7280] space-y-1">
                    {selectedProduct.specifications.map((spec: string, index: number) => (
                      <li key={index}>• {spec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Compatibility */}
              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Vehicle Compatibility</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.compatibility.map((vehicle: string, index: number) => (
                    <Badge key={index} variant="secondary">{vehicle}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Add/Edit Modal */}
      <Dialog open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBrand ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
            <DialogDescription>
              {selectedBrand 
                ? 'Update the brand information below.' 
                : 'Create a new brand by filling in the details below.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Brand Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {brandFormData.logo ? (
                    <img 
                      src={URL.createObjectURL(brandFormData.logo)} 
                      alt="Brand logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="brand-logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload PNG, JPG or SVG (max 2MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={brandFormData.name}
                onChange={(e) => setBrandFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter brand name"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBrandModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBrand}
              disabled={!brandFormData.name.trim()}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            >
              {selectedBrand ? 'Update Brand' : 'Save Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Add/Edit Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? 'Update the category information below.' 
                : 'Create a new category by filling in the details below.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                className="w-full"
              />
            </div>

            {/* Category Description */}
            <div className="space-y-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                className="w-full min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={!categoryFormData.name.trim()}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            >
              {selectedCategory ? 'Update Category' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new auto part product with complete details and specifications.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Basic Information</h4>
              
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Brake Pads Set - Front"
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={productFormData.sku}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g., BP-FRONT-001 (auto-generated if empty)"
                />
              </div>

              {/* Auto Part Brand Dropdown */}
              <div className="space-y-2">
                <Label>Auto Part Brand *</Label>
                <p className="text-xs text-gray-500">Manufacturer of the auto part (e.g., Michelin, Bosch, Castrol)</p>
                <Select 
                  value={productFormData.brand} 
                  onValueChange={(value) => setProductFormData(prev => ({ ...prev, brand: value }))}
                  disabled={!productFormData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select auto part brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableAutoPartBrands().map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={productFormData.category} 
                  onValueChange={(value) => {
                    setProductFormData(prev => ({ 
                      ...prev, 
                      category: value,
                      brand: '' // Reset brand when category changes
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Type Dropdown */}
              <div className="space-y-2">
                <Label>Vehicle Type *</Label>
                <Select 
                  value={productFormData.vehicleType} 
                  onValueChange={handleVehicleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Brand Dropdown */}
              <div className="space-y-2">
                <Label>Vehicle Brand *</Label>
                <p className="text-xs text-gray-500">Manufacturer of the vehicle (e.g., Honda, Toyota, Royal Enfield)</p>
                <Select 
                  value={productFormData.vehicleBrand} 
                  onValueChange={handleVehicleBrandChange}
                  disabled={!productFormData.vehicleType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVehicleBrands().map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Model Dropdown */}
              <div className="space-y-2">
                <Label>Vehicle Model *</Label>
                <Select 
                  value={productFormData.vehicleModel} 
                  onValueChange={(value) => setProductFormData(prev => ({ ...prev, vehicleModel: value }))}
                  disabled={!productFormData.vehicleBrand}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVehicleModels().map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Selling Price (₹) *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="1290"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-mrp">MRP (₹)</Label>
                  <Input
                    id="product-mrp"
                    type="number"
                    value={productFormData.mrp}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, mrp: e.target.value }))}
                    placeholder="1500"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock Quantity *</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low-stock">Low Stock Alert</Label>
                  <Input
                    id="low-stock"
                    type="number"
                    value={productFormData.lowStockThreshold}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="product-weight">Weight (kg)</Label>
                  <Input
                    id="product-weight"
                    type="number"
                    step="0.1"
                    value={productFormData.weight}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-warranty">Warranty</Label>
                  <Input
                    id="product-warranty"
                    value={productFormData.warranty}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, warranty: e.target.value }))}
                    placeholder="2 years"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Images & Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Images & Details</h4>
              
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label htmlFor="product-thumbnail">Main Product Image</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    {productFormData.thumbnail ? (
                      <img 
                        src={URL.createObjectURL(productFormData.thumbnail)} 
                        alt="Product thumbnail"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="product-thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Images Upload */}
              <div className="space-y-2">
                <Label htmlFor="product-images">Additional Images</Label>
                <Input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImagesUpload}
                  className="cursor-pointer"
                />
                {productFormData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {productFormData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={productFormData.description}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="High-quality ceramic brake pads for superior stopping power"
                  className="min-h-[80px]"
                />
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Specifications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Spec
                  </Button>
                </div>
                <div className="space-y-2">
                  {productFormData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={spec}
                        onChange={(e) => updateSpecification(index, e.target.value)}
                        placeholder="e.g., Ceramic compound"
                        className="flex-1"
                      />
                      {productFormData.specifications.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSpecification(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compatibility */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vehicle Compatibility</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCompatibility}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Vehicle
                  </Button>
                </div>
                <div className="space-y-2">
                  {productFormData.compatibility.map((comp, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={comp}
                        onChange={(e) => updateCompatibility(index, e.target.value)}
                        placeholder="e.g., Honda City, Maruti Swift"
                        className="flex-1"
                      />
                      {productFormData.compatibility.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCompatibility(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsAddProductOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProduct}
              disabled={!productFormData.name.trim() || !productFormData.brand || !productFormData.category || !productFormData.vehicleType || !productFormData.vehicleBrand || !productFormData.vehicleModel || !productFormData.price}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            >
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Brand Add Modal */}
      <Dialog open={isVehicleBrandModalOpen} onOpenChange={setIsVehicleBrandModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle Brand</DialogTitle>
            <DialogDescription>
              Add a new vehicle brand with its models to the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Vehicle Type Selection */}
            <div className="space-y-2">
              <Label>Vehicle Type *</Label>
              <Select 
                value={vehicleBrandFormData.vehicleType} 
                onValueChange={(value) => setVehicleBrandFormData(prev => ({ ...prev, vehicleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="vehicle-brand-name">Brand Name *</Label>
              <Input
                id="vehicle-brand-name"
                value={vehicleBrandFormData.brandName}
                onChange={(e) => setVehicleBrandFormData(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="e.g., Royal Enfield, BMW, Kawasaki"
              />
            </div>

            {/* Models */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vehicle Models *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addModel}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Model
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vehicleBrandFormData.models.map((model, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={model}
                      onChange={(e) => updateModel(index, e.target.value)}
                      placeholder="e.g., Classic 350, Himalayan, Continental GT"
                      className="flex-1"
                    />
                    {vehicleBrandFormData.models.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeModel(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {vehicleBrandFormData.brandName && vehicleBrandFormData.vehicleType && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div className="text-sm">
                  <p><span className="font-medium">Type:</span> {vehicleBrandFormData.vehicleType}</p>
                  <p><span className="font-medium">Brand:</span> {vehicleBrandFormData.brandName}</p>
                  <p><span className="font-medium">Models:</span> {vehicleBrandFormData.models.filter(m => m.trim()).join(', ') || 'None'}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsVehicleBrandModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveVehicleBrand}
              disabled={!vehicleBrandFormData.vehicleType || !vehicleBrandFormData.brandName.trim() || !vehicleBrandFormData.models.some(m => m.trim())}
              className="bg-[#FF6B35] hover:bg-[#E55A2B]"
            >
              Add Vehicle Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Management Modal */}
      <Dialog open={isUnitModalOpen} onOpenChange={setIsUnitModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unit Management - {selectedProductForUnits?.name}</DialogTitle>
            <DialogDescription>
              View stock history and update units for this product.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Stock Overview */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedProductForUnits?.stock || 0}
                    </div>
                    <div className="text-sm text-gray-500">Current Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedProductForUnits ? getProductSoldUnits(selectedProductForUnits.id) : 0}
                    </div>
                    <div className="text-sm text-gray-500">Units Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedProductForUnits?.lowStockThreshold || 0}
                    </div>
                    <div className="text-sm text-gray-500">Low Stock Alert</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock History */}
            <div className="space-y-3">
              <h4 className="font-medium text-lg">Stock History</h4>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProductForUnits && getProductStockHistory(selectedProductForUnits.id).length > 0 ? (
                      getProductStockHistory(selectedProductForUnits.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm">{entry.date}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={entry.type === 'addition' ? 'default' : 'destructive'}
                                className={entry.type === 'addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              >
                                {entry.type === 'addition' ? 'Added' : 'Sold'}
                              </Badge>
                            </TableCell>
                            <TableCell className={`font-medium ${
                              entry.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                            </TableCell>
                            <TableCell className="text-sm">{entry.reason}</TableCell>
                            <TableCell className="text-sm">{entry.by}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                          No stock history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Add/Update Units */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Stock</CardTitle>
                <CardDescription>Add or remove units from inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={unitUpdateData.quantity}
                      onChange={(e) => setUnitUpdateData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity (+/- numbers)"
                    />
                    <p className="text-xs text-gray-500">
                      Use positive numbers to add stock, negative to reduce
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={unitUpdateData.reason}
                      onChange={(e) => setUnitUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Reason for stock change"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setUnitUpdateData(prev => ({ ...prev, quantity: '50', reason: 'Stock Replenishment' }))}
                  >
                    Add 50 Units
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUnitUpdateData(prev => ({ ...prev, quantity: '100', reason: 'Bulk Stock Addition' }))}
                  >
                    Add 100 Units
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUnitModalOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={handleUpdateUnits}
              disabled={!unitUpdateData.quantity || unitUpdateData.quantity === '0'}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
            >
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}