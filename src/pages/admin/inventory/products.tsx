'use client'

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchProductsRequest,
  createProductRequest,
  updateProductRequest,
  deleteProductRequest,
  toggleProductStatusRequest,
  addStockRequest,
  clearProductError,
} from '@/store/slices/productSlice'
import { fetchCategoriesRequest } from '@/store/slices/categorySlice'
import { fetchBrandsRequest } from '@/store/slices/brandSlice'
import { ProductItem } from '@/store/slices/productSlice'
import { uploadAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  ShoppingCart,
  Loader2,
  Upload,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Power,
  PlusCircle,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

// ─── helpers ───────────────────────────────────────────
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const getCatName = (cat: any) => (typeof cat === 'object' && cat ? cat.name : '—')
const getBrandName = (b: any) => (typeof b === 'object' && b ? b.name : '—')
// parentCategory can be a populated object, a raw id string, or null.
const catParentId = (c: any): string | null => {
  const p = c?.parentCategory
  if (!p) return null
  return typeof p === 'object' ? p._id : p
}

// Left-edge row stripe — surfaces stock urgency (and active/inactive) at a glance.
const STATUS_STRIPE: Record<string, string> = {
  outOfStock: '#ef4444',
  lowStock: '#f59e0b',
  active: '#22c55e',
  inactive: '#94a3b8',
}
const getStripeKey = (p: ProductItem) => {
  if (p.inventory.quantity <= 0) return 'outOfStock'
  if (p.inventory.quantity <= p.inventory.minStock) return 'lowStock'
  return p.isActive ? 'active' : 'inactive'
}

// A single product variant as held in form state (all scalars are strings for inputs).
type VariantForm = {
  name: string
  sku: string
  brand: string
  priceCost: string
  priceSelling: string
  priceMrp: string
  stock: string
  thumbnailUrl: string
  imageUrls: string[]
  attributes: { key: string; value: string }[]
}
const emptyVariant = (): VariantForm => ({
  name: '', sku: '', brand: '', priceCost: '', priceSelling: '', priceMrp: '',
  stock: '', thumbnailUrl: '', imageUrls: [], attributes: [],
})

const emptyProductForm = {
  name: '',
  sku: '',
  partNumber: '',
  description: '',
  category: '',          // effective (leaf) category id sent to backend
  categoryParent: '',    // selected parent category id (UI only)
  brand: '',
  vehicleType: 'Car',
  priceCost: '',
  priceSelling: '',
  priceMrp: '',
  inventoryQuantity: '',
  inventoryMinStock: '',
  tags: '',
  isFeatured: false,
  thumbnailUrl: '',
  imageUrls: [] as string[],
  variants: [] as VariantForm[],
}

export default function AdminInventoryProductsPage() {
  const dispatch = useAppDispatch()
  const { products, loading, actionLoading, error, pagination } = useAppSelector((s) => s.product)
  const { categories } = useAppSelector((s) => s.category)
  const { brands } = useAppSelector((s) => s.brand)

  // filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  // dialogs
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isStockOpen, setIsStockOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [formData, setFormData] = useState(emptyProductForm)
  const [stockQty, setStockQty] = useState('')
  const [uploading, setUploading] = useState(false)
  const [formTab, setFormTab] = useState('basic')

  // ─── Fetch on mount & filter change ──────────────────
  useEffect(() => {
    const params: Record<string, any> = { page, limit: 10 }
    if (searchQuery) params.search = searchQuery
    if (categoryFilter !== 'all') params.category = categoryFilter
    if (brandFilter !== 'all') params.brand = brandFilter
    if (statusFilter === 'active') params.isActive = true
    if (statusFilter === 'inactive') params.isActive = false
    dispatch(fetchProductsRequest(params))
  }, [dispatch, page, searchQuery, categoryFilter, brandFilter, statusFilter])

  // fetch categories & brands for dropdowns
  useEffect(() => {
    dispatch(fetchCategoriesRequest({ limit: 200 }))
    dispatch(fetchBrandsRequest({ limit: 200 }))
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearProductError())
    }
  }, [error, dispatch])

  // ─── Stats computed from current page ────────────────
  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length
    const lowStock = products.filter((p) => p.inventory.quantity > 0 && p.inventory.quantity <= p.inventory.minStock).length
    const outOfStock = products.filter((p) => p.inventory.quantity <= 0).length
    return { total: pagination.total, active, lowStock, outOfStock }
  }, [products, pagination.total])

  // ─── Category tree (parent → sub-category) ───────────
  const activeCategories = categories.filter((c) => c.isActive)
  const parentCategories = activeCategories.filter((c) => !catParentId(c))
  const subCategories = activeCategories.filter((c) => catParentId(c) === formData.categoryParent)
  const isSubSelected = subCategories.some((c) => c._id === formData.category)

  // ─── Variant helpers ─────────────────────────────────
  const addVariant = () => setFormData((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }))
  const removeVariant = (idx: number) => setFormData((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))
  const updateVariant = (idx: number, patch: Partial<VariantForm>) =>
    setFormData((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }))
  const mutateVariant = (idx: number, fn: (v: VariantForm) => VariantForm) =>
    setFormData((prev) => ({ ...prev, variants: prev.variants.map((v, i) => (i === idx ? fn(v) : v)) }))
  const addVariantAttr = (idx: number) => mutateVariant(idx, (v) => ({ ...v, attributes: [...v.attributes, { key: '', value: '' }] }))
  const updateVariantAttr = (idx: number, ai: number, patch: Partial<{ key: string; value: string }>) =>
    mutateVariant(idx, (v) => ({ ...v, attributes: v.attributes.map((a, i) => (i === ai ? { ...a, ...patch } : a)) }))
  const removeVariantAttr = (idx: number, ai: number) =>
    mutateVariant(idx, (v) => ({ ...v, attributes: v.attributes.filter((_, i) => i !== ai) }))
  const removeVariantImage = (idx: number, imgIdx: number) =>
    mutateVariant(idx, (v) => ({ ...v, imageUrls: v.imageUrls.filter((_, i) => i !== imgIdx) }))

  const handleVariantThumbUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImage(file, 'products')
      updateVariant(idx, { thumbnailUrl: res.data.data.url })
      toast.success('Variant thumbnail uploaded')
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }
  const handleVariantImagesUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImages(files, 'products')
      const urls = res.data.data.map((img: any) => img.url)
      mutateVariant(idx, (v) => ({ ...v, imageUrls: [...v.imageUrls, ...urls] }))
      toast.success(`${urls.length} images uploaded`)
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  // Map form variants → API payload (drops blank rows & empty fields).
  const buildVariantsPayload = () =>
    formData.variants
      .filter((v) => v.name.trim() || v.sku.trim() || v.priceSelling)
      .map((v) => {
        const out: any = { name: v.name.trim() }
        if (v.sku.trim()) out.sku = v.sku.trim()
        if (v.brand) out.brand = v.brand
        const price: any = {}
        if (v.priceCost) price.cost = Number(v.priceCost)
        if (v.priceSelling) price.selling = Number(v.priceSelling)
        if (v.priceMrp) price.mrp = Number(v.priceMrp)
        if (Object.keys(price).length) out.price = price
        if (v.stock) out.inventory = { quantity: Number(v.stock) }
        if (v.thumbnailUrl) out.thumbnail = { url: v.thumbnailUrl }
        if (v.imageUrls.length) out.images = v.imageUrls.map((url) => ({ url }))
        const attrs = v.attributes.filter((a) => a.key.trim()).map((a) => ({ key: a.key.trim(), value: a.value.trim() }))
        if (attrs.length) out.attributes = attrs
        return out
      })

  // ─── Add Product ─────────────────────────────────────
  const handleOpenAdd = () => {
    setFormData(emptyProductForm)
    setFormTab('basic')
    setIsAddOpen(true)
  }

  const handleSaveNew = () => {
    if (!formData.name || !formData.category || !formData.brand || !formData.priceCost || !formData.priceSelling) {
      toast.error('Please fill required fields: Name, Category, Brand, Cost, Selling Price')
      return
    }
    const payload: any = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      brand: formData.brand,
      vehicleType: formData.vehicleType,
      price: {
        cost: Number(formData.priceCost),
        selling: Number(formData.priceSelling),
        mrp: Number(formData.priceMrp || formData.priceSelling),
      },
      inventory: {
        quantity: Number(formData.inventoryQuantity || 0),
        minStock: Number(formData.inventoryMinStock || 5),
      },
      isFeatured: formData.isFeatured,
    }
    if (formData.sku) payload.sku = formData.sku
    if (formData.partNumber) payload.partNumber = formData.partNumber
    if (formData.tags) payload.tags = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    if (formData.thumbnailUrl) payload.thumbnail = { url: formData.thumbnailUrl }
    if (formData.imageUrls.length > 0) payload.images = formData.imageUrls.map((url) => ({ url }))
    const variants = buildVariantsPayload()
    if (variants.length > 0) payload.variants = variants

    dispatch(createProductRequest(payload))
    toast.success('Product created successfully')
    setIsAddOpen(false)
  }

  // ─── Edit Product ────────────────────────────────────
  const handleOpenEdit = (p: ProductItem) => {
    setSelectedProduct(p)
    const catId = typeof p.category === 'object' ? p.category._id : (p.category as string)
    const catObj = categories.find((c) => c._id === catId)
    const parentId = catObj ? catParentId(catObj) : null
    setFormData({
      name: p.name,
      sku: p.sku || '',
      partNumber: p.partNumber || '',
      description: p.description || '',
      category: catId || '',
      categoryParent: parentId || catId || '',
      brand: typeof p.brand === 'object' ? p.brand._id : (p.brand as string),
      vehicleType: p.vehicleType || 'Car',
      priceCost: String(p.price.cost),
      priceSelling: String(p.price.selling),
      priceMrp: String(p.price.mrp),
      inventoryQuantity: String(p.inventory.quantity),
      inventoryMinStock: String(p.inventory.minStock),
      tags: (p.tags || []).join(', '),
      isFeatured: p.isFeatured,
      thumbnailUrl: p.thumbnail?.url || '',
      imageUrls: p.images?.map((i) => i.url) || [],
      variants: (p.variants || []).map((v) => ({
        name: v.name || '',
        sku: v.sku || '',
        brand: typeof v.brand === 'object' && v.brand ? v.brand._id : ((v.brand as string) || ''),
        priceCost: v.price?.cost != null ? String(v.price.cost) : '',
        priceSelling: v.price?.selling != null ? String(v.price.selling) : '',
        priceMrp: v.price?.mrp != null ? String(v.price.mrp) : '',
        stock: v.inventory?.quantity != null ? String(v.inventory.quantity) : '',
        thumbnailUrl: v.thumbnail?.url || '',
        imageUrls: (v.images || []).map((i) => i.url),
        attributes: (v.attributes || []).map((a) => ({ key: a.key || '', value: a.value || '' })),
      })),
    })
    setFormTab('basic')
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedProduct) return
    const payload: any = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      brand: formData.brand,
      vehicleType: formData.vehicleType,
      price: {
        cost: Number(formData.priceCost),
        selling: Number(formData.priceSelling),
        mrp: Number(formData.priceMrp || formData.priceSelling),
      },
      inventory: {
        quantity: Number(formData.inventoryQuantity || 0),
        minStock: Number(formData.inventoryMinStock || 5),
      },
      isFeatured: formData.isFeatured,
    }
    if (formData.sku) payload.sku = formData.sku
    if (formData.partNumber) payload.partNumber = formData.partNumber
    if (formData.tags) payload.tags = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    if (formData.thumbnailUrl) payload.thumbnail = { url: formData.thumbnailUrl }
    payload.variants = buildVariantsPayload()

    dispatch(updateProductRequest({ id: selectedProduct._id, data: payload }))
    toast.success('Product updated successfully')
    setIsEditOpen(false)
  }

  // ─── Delete Product ──────────────────────────────────
  const handleDelete = () => {
    if (selectedProduct) {
      dispatch(deleteProductRequest(selectedProduct._id))
      toast.success('Product deleted')
    }
    setIsDeleteOpen(false)
  }

  // ─── Toggle Status ───────────────────────────────────
  const handleToggleStatus = (p: ProductItem) => {
    dispatch(toggleProductStatusRequest(p._id))
    toast.success(`Product ${p.isActive ? 'deactivated' : 'activated'}`)
  }

  // ─── Add Stock ───────────────────────────────────────
  const handleAddStock = () => {
    if (selectedProduct && stockQty) {
      dispatch(addStockRequest({ id: selectedProduct._id, quantity: Number(stockQty) }))
      toast.success(`Added ${stockQty} units`)
    }
    setIsStockOpen(false)
    setStockQty('')
  }

  // ─── Image Upload ────────────────────────────────────
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImage(file, 'products')
      setFormData((prev) => ({ ...prev, thumbnailUrl: res.data.data.url }))
      toast.success('Thumbnail uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImages(files, 'products')
      const urls = res.data.data.map((img: any) => img.url)
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }))
      toast.success(`${urls.length} images uploaded`)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImageUrl = (idx: number) => {
    setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }))
  }

  // ─── Helpers ─────────────────────────────────────────
  const getStockBadge = (p: ProductItem) => {
    if (p.inventory.quantity <= 0) return <Badge className="bg-red-100 text-red-700 border-0">Out of Stock</Badge>
    if (p.inventory.quantity <= p.inventory.minStock) return <Badge className="bg-amber-100 text-amber-700 border-0">Low Stock</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700 border-0">In Stock</Badge>
  }

  // ─── Product Form (shared by Add & Edit) ─────────────
  const ProductForm = () => (
    <Tabs value={formTab} onValueChange={setFormTab}>
      <TabsList className="grid grid-cols-4 w-full mb-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
        <TabsTrigger value="media">Images</TabsTrigger>
        <TabsTrigger value="variants">Variants{formData.variants.length > 0 ? ` (${formData.variants.length})` : ''}</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid gap-2">
          <Label>Product Name *</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Brake Pad Set" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>SKU</Label>
            <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Auto-generated if empty" />
          </div>
          <div className="grid gap-2">
            <Label>Part Number</Label>
            <Input value={formData.partNumber} onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Category *</Label>
            <Select value={formData.categoryParent} onValueChange={(v) => setFormData({ ...formData, categoryParent: v, category: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {parentCategories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>
              Sub-category
              {formData.categoryParent && subCategories.length === 0 && <span className="text-gray-400 font-normal"> · none</span>}
            </Label>
            <Select
              value={isSubSelected ? formData.category : ''}
              onValueChange={(v) => setFormData({ ...formData, category: v })}
              disabled={!formData.categoryParent || subCategories.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.categoryParent ? 'Pick a category first' : subCategories.length === 0 ? 'No sub-categories' : 'Select sub-category'} />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Brand *</Label>
            <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.filter((b) => b.isActive).map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Vehicle Type</Label>
            <Select value={formData.vehicleType} onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto Rickshaw', 'Scooter', 'Universal'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Description *</Label>
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Product description" />
        </div>
        <div className="grid gap-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="brake, safety, premium" />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={formData.isFeatured} onCheckedChange={(c) => setFormData({ ...formData, isFeatured: c as boolean })} />
          <Label>Featured Product</Label>
        </div>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Cost Price *</Label>
            <Input type="number" value={formData.priceCost} onChange={(e) => setFormData({ ...formData, priceCost: e.target.value })} placeholder="0" />
          </div>
          <div className="grid gap-2">
            <Label>Selling Price *</Label>
            <Input type="number" value={formData.priceSelling} onChange={(e) => setFormData({ ...formData, priceSelling: e.target.value })} placeholder="0" />
          </div>
          <div className="grid gap-2">
            <Label>MRP</Label>
            <Input type="number" value={formData.priceMrp} onChange={(e) => setFormData({ ...formData, priceMrp: e.target.value })} placeholder="0" />
          </div>
        </div>
        {formData.priceCost && formData.priceSelling && (
          <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700 font-medium">
            Margin: {formatCurrency(Number(formData.priceSelling) - Number(formData.priceCost))} ({(((Number(formData.priceSelling) - Number(formData.priceCost)) / Number(formData.priceSelling)) * 100).toFixed(1)}%)
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Initial Stock</Label>
            <Input type="number" value={formData.inventoryQuantity} onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })} placeholder="0" />
          </div>
          <div className="grid gap-2">
            <Label>Min Stock Alert</Label>
            <Input type="number" value={formData.inventoryMinStock} onChange={(e) => setFormData({ ...formData, inventoryMinStock: e.target.value })} placeholder="5" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="media" className="space-y-4">
        <div className="grid gap-2">
          <Label>Thumbnail</Label>
          {formData.thumbnailUrl ? (
            <div className="relative inline-block w-24 h-24">
              <img src={formData.thumbnailUrl} alt="thumb" className="w-24 h-24 rounded-lg object-cover border" />
              <button type="button" onClick={() => setFormData({ ...formData, thumbnailUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 w-fit">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-gray-500" />}
              <span className="text-sm text-gray-600">{uploading ? 'Uploading...' : 'Upload Thumbnail'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
        <div className="grid gap-2">
          <Label>Product Images</Label>
          <div className="flex flex-wrap gap-3">
            {formData.imageUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt={`img-${i}`} className="w-20 h-20 rounded-lg object-cover border" />
                <button type="button" onClick={() => removeImageUrl(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer w-20 h-20 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5 text-gray-400" />}
              <span className="text-[10px] text-gray-400 mt-1">Add</span>
              <input type="file" accept="image/*" multiple onChange={handleImagesUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="variants" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1A1D29]">Product Variants</p>
            <p className="text-xs text-gray-500">Optional. Add size / colour / spec variations — each with its own brand, images, price &amp; stock.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-[#1B3B6F]/30 text-[#1B3B6F] hover:bg-[#1B3B6F]/5">
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </div>

        {formData.variants.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
            <Layers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No variants yet</p>
            <p className="text-xs text-gray-400">This product will be sold as a single item.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.variants.map((v, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1B3B6F] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Variant {idx + 1}
                  </span>
                  <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Variant Name *</Label>
                    <Input value={v.name} onChange={(e) => updateVariant(idx, { name: e.target.value })} placeholder="e.g. Front / Ceramic" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input value={v.sku} onChange={(e) => updateVariant(idx, { sku: e.target.value })} placeholder="Optional" />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Brand (for this variant)</Label>
                  <Select value={v.brand || 'inherit'} onValueChange={(val) => updateVariant(idx, { brand: val === 'inherit' ? '' : val })}>
                    <SelectTrigger><SelectValue placeholder="Same as product brand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Same as product brand</SelectItem>
                      {brands.filter((b) => b.isActive).map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="grid gap-1.5"><Label className="text-xs">Cost</Label><Input type="number" value={v.priceCost} onChange={(e) => updateVariant(idx, { priceCost: e.target.value })} placeholder="0" /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">Selling</Label><Input type="number" value={v.priceSelling} onChange={(e) => updateVariant(idx, { priceSelling: e.target.value })} placeholder="0" /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">MRP</Label><Input type="number" value={v.priceMrp} onChange={(e) => updateVariant(idx, { priceMrp: e.target.value })} placeholder="0" /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">Stock</Label><Input type="number" value={v.stock} onChange={(e) => updateVariant(idx, { stock: e.target.value })} placeholder="0" /></div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Variant Thumbnail</Label>
                  {v.thumbnailUrl ? (
                    <div className="relative inline-block w-20 h-20">
                      <img src={v.thumbnailUrl} alt="variant thumb" className="w-20 h-20 rounded-lg object-cover border" />
                      <button type="button" onClick={() => updateVariant(idx, { thumbnailUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-white w-fit">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-gray-500" />}
                      <span className="text-xs text-gray-600">Upload</span>
                      <input type="file" accept="image/*" onChange={(e) => handleVariantThumbUpload(idx, e)} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs">Variant Images</Label>
                  <div className="flex flex-wrap gap-2">
                    {v.imageUrls.map((url, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={url} alt={`v-${idx}-img-${i}`} className="w-16 h-16 rounded-lg object-cover border" />
                        <button type="button" onClick={() => removeVariantImage(idx, i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer w-16 h-16 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg hover:bg-white">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5 text-gray-400" />}
                      <input type="file" accept="image/*" multiple onChange={(e) => handleVariantImagesUpload(idx, e)} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Properties</Label>
                    <button type="button" onClick={() => addVariantAttr(idx)} className="text-[#1B3B6F] text-xs flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add property
                    </button>
                  </div>
                  {v.attributes.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <Input value={a.key} onChange={(e) => updateVariantAttr(idx, ai, { key: e.target.value })} placeholder="e.g. Size" className="h-8 text-xs" />
                      <Input value={a.value} onChange={(e) => updateVariantAttr(idx, ai, { value: e.target.value })} placeholder="e.g. 90/90-12" className="h-8 text-xs" />
                      <button type="button" onClick={() => removeVariantAttr(idx, ai)} className="text-red-400 hover:text-red-600">
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/products" />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Products</h1>
              <p className="text-[#6B7280] mt-1 text-sm">Manage your product catalog and inventory</p>
            </div>
            <Button onClick={handleOpenAdd} className="bg-[#1B3B6F] hover:bg-[#0F2545] shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total Products</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B3B6F]/10">
                  <Package className="h-[18px] w-[18px] text-[#1B3B6F]" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1D29]">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Across catalog</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Active</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-[18px] w-[18px] text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1D29]">{stats.active}</p>
              <p className="text-xs text-gray-400 mt-1">Currently listed</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Low Stock</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50">
                  <AlertTriangle className="h-[18px] w-[18px] text-amber-600" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1D29]">{stats.lowStock}</p>
              <p className="text-xs text-gray-400 mt-1">Needs reorder</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Out of Stock</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50">
                  <TrendingDown className="h-[18px] w-[18px] text-red-600" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-[#1A1D29]">{stats.outOfStock}</p>
              <p className="text-xs text-gray-400 mt-1">Unavailable</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, SKU..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter((c) => c.isActive).map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="All Brands" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.filter((b) => b.isActive).map((b) => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading && products.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or add a new product</p>
                  <Button onClick={handleOpenAdd} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow
                          key={product._id}
                          className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                          style={{ borderLeftColor: STATUS_STRIPE[getStripeKey(product)] }}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {product.thumbnail?.url ? (
                                <img src={product.thumbnail.url} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-[#1A1D29] line-clamp-1">{product.name}</div>
                                <div className="text-xs text-[#6B7280]">SKU: {product.sku}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{getCatName(product.category)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{getBrandName(product.brand)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium tabular-nums">{formatCurrency(product.price.selling)}</div>
                              {product.price.mrp > product.price.selling && (
                                <div className="text-xs text-gray-400 line-through tabular-nums">{formatCurrency(product.price.mrp)}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="h-auto p-1.5 text-left hover:bg-blue-50"
                              onClick={() => { setSelectedProduct(product); setStockQty(''); setIsStockOpen(true) }}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`font-medium tabular-nums ${product.inventory.quantity <= product.inventory.minStock ? 'text-red-600' : 'text-green-600'}`}>
                                  {product.inventory.quantity}
                                </span>
                                {getStockBadge(product)}
                              </div>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge className={product.isActive ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />
                              <span className="text-sm font-medium tabular-nums">{product.reviewsSummary?.averageRating?.toFixed(1) || '0.0'}</span>
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
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setSelectedProduct(product); setIsViewOpen(true) }}>
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                                  <Power className="mr-2 h-4 w-4" /> {product.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedProduct(product); setStockQty(''); setIsStockOpen(true) }}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedProduct(product); setIsDeleteOpen(true) }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium px-2 tabular-nums">Page {page} of {pagination.pages}</span>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ─── Add Product Dialog ──────────────────────────── */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-[#1B3B6F]" />
                  </div>
                  Add New Product
                </DialogTitle>
                <DialogDescription>Create a new product in your inventory</DialogDescription>
              </DialogHeader>
              {ProductForm()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNew} disabled={actionLoading} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Edit Product Dialog ─────────────────────────── */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                  Edit Product
                </DialogTitle>
                <DialogDescription>Update product details</DialogDescription>
              </DialogHeader>
              {ProductForm()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={actionLoading} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── View Product Dialog ─────────────────────────── */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-[#1B3B6F]" />
                  </div>
                  Product Details
                </DialogTitle>
              </DialogHeader>
              {selectedProduct && (
                <div className="space-y-5">
                  {/* Thumb + Images */}
                  <div className="flex gap-3 flex-wrap">
                    {selectedProduct.thumbnail?.url && (
                      <img src={selectedProduct.thumbnail.url} alt="thumb" className="w-24 h-24 rounded-xl object-cover border-2 border-[#1B3B6F]/30" />
                    )}
                    {selectedProduct.images?.map((img, i) => (
                      <img key={i} src={img.url} alt={`img-${i}`} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                    ))}
                  </div>
                  {/* Variants */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-[#1A1D29] mb-2 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-[#1B3B6F]" /> Variants ({selectedProduct.variants.length})
                      </p>
                      <div className="space-y-2">
                        {selectedProduct.variants.map((v, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2">
                            {v.thumbnail?.url ? (
                              <img src={v.thumbnail.url} alt={v.name || `variant-${i}`} className="w-10 h-10 rounded object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><Layers className="h-4 w-4 text-gray-400" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.name || 'Variant'}</p>
                              <p className="text-xs text-gray-500">
                                {v.sku ? `SKU ${v.sku} · ` : ''}
                                {v.price?.selling != null ? formatCurrency(v.price.selling) : ''}
                                {v.inventory?.quantity != null ? ` · ${v.inventory.quantity} in stock` : ''}
                              </p>
                            </div>
                            {v.images && v.images.length > 0 && (
                              <span className="text-[11px] text-gray-400">{v.images.length} img</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                    <div><p className="text-gray-500">Name</p><p className="font-medium">{selectedProduct.name}</p></div>
                    <div><p className="text-gray-500">SKU</p><p className="font-medium">{selectedProduct.sku}</p></div>
                    <div><p className="text-gray-500">Category</p><p className="font-medium">{getCatName(selectedProduct.category)}</p></div>
                    <div><p className="text-gray-500">Brand</p><p className="font-medium">{getBrandName(selectedProduct.brand)}</p></div>
                    <div><p className="text-gray-500">Vehicle Type</p><p className="font-medium">{selectedProduct.vehicleType}</p></div>
                    <div><p className="text-gray-500">Status</p><Badge className={selectedProduct.isActive ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>{selectedProduct.isActive ? 'Active' : 'Inactive'}</Badge></div>
                    <div><p className="text-gray-500">Cost Price</p><p className="font-medium tabular-nums">{formatCurrency(selectedProduct.price.cost)}</p></div>
                    <div><p className="text-gray-500">Selling Price</p><p className="font-medium tabular-nums">{formatCurrency(selectedProduct.price.selling)}</p></div>
                    <div><p className="text-gray-500">MRP</p><p className="font-medium tabular-nums">{formatCurrency(selectedProduct.price.mrp)}</p></div>
                    <div><p className="text-gray-500">Stock</p><p className="font-medium tabular-nums">{selectedProduct.inventory.quantity} units</p></div>
                    <div><p className="text-gray-500">Min Stock</p><p className="font-medium tabular-nums">{selectedProduct.inventory.minStock}</p></div>
                    <div><p className="text-gray-500">Rating</p><div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-400" /><span className="font-medium tabular-nums">{selectedProduct.reviewsSummary?.averageRating?.toFixed(1) || '0'} ({selectedProduct.reviewsSummary?.totalReviews || 0})</span></div></div>
                    <div className="col-span-2"><p className="text-gray-500">Description</p><p className="text-sm">{selectedProduct.description}</p></div>
                    {selectedProduct.tags?.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-gray-500 mb-1">Tags</p>
                        <div className="flex flex-wrap gap-1">{selectedProduct.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
                      </div>
                    )}
                    <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(selectedProduct.createdAt)}</p></div>
                    <div><p className="text-gray-500">Updated</p><p className="font-medium">{formatDate(selectedProduct.updatedAt)}</p></div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ─── Delete Dialog ────────────────────────────────── */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                  Delete Product
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &ldquo;{selectedProduct?.name}&rdquo;? This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Add Stock Dialog ─────────────────────────────── */}
          <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <PlusCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  Add Stock
                </DialogTitle>
                <DialogDescription>
                  Current stock for {selectedProduct?.name}: <strong>{selectedProduct?.inventory?.quantity}</strong> units
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Quantity to Add</Label>
                  <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="Enter quantity" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStockOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStock} disabled={!stockQty || actionLoading} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Stock
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
