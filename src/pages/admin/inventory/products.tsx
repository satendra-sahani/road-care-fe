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
import { uploadAPI, productAPI } from '@/services/api'
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
  Download,
  FileUp,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Power,
  PlusCircle,
  Layers,
  IndianRupee,
  Image as ImageIcon,
  Save,
  Rocket,
  FileText,
  Crop,
  ZoomIn,
  ZoomOut,
  Check,
} from 'lucide-react'
import Cropper from 'react-easy-crop'
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
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { cn, formatDate } from '@/lib/utils'

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
  draft: '#8b5cf6',
  outOfStock: '#ef4444',
  lowStock: '#f59e0b',
  active: '#22c55e',
  inactive: '#94a3b8',
}
const isDraftProduct = (p: ProductItem) => !!p.isDraft && !p.isActive
const getStripeKey = (p: ProductItem) => {
  if (isDraftProduct(p)) return 'draft'
  if (p.inventory.quantity <= 0) return 'outOfStock'
  if (p.inventory.quantity <= p.inventory.minStock) return 'lowStock'
  return p.isActive ? 'active' : 'inactive'
}

// Sections shown in the editor's left rail (replaces cramped top tabs).
const SECTIONS = [
  { id: 'basic', label: 'Basic Info', desc: 'Name, category & brand', icon: Package },
  { id: 'pricing', label: 'Pricing & Stock', desc: 'Cost, price & inventory', icon: IndianRupee },
  { id: 'media', label: 'Images', desc: 'Thumbnail & gallery', icon: ImageIcon },
  { id: 'variants', label: 'Variants', desc: 'Sizes, colours & specs', icon: Layers },
] as const

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

// ─── CSV helpers (no external dependency) ─────────────────────────────────────
const CSV_TEMPLATE_HEADERS = ['name', 'sku', 'partNumber', 'brand', 'category', 'vehicleType', 'cost', 'selling', 'mrp', 'stock', 'minStock', 'hsnCode', 'gstRate', 'tags', 'image', 'images', 'description']
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let cur: string[] = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { cur.push(field); field = '' }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || cur.length) { cur.push(field); rows.push(cur) }
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => { const o: Record<string, string> = {}; headers.forEach((h, i) => { o[h] = (r[i] ?? '').trim() }); return o })
}
function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

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
  hsnCode: '',
  gstRate: '',
  returnable: true,
  returnWindowDays: '7',
  metaTitle: '',
  metaDescription: '',
  supplierName: '',
  supplierContact: '',
  imageCompleted: false,
  amountFinalized: false,
  thumbnailUrl: '',
  imageUrls: [] as string[],
  variants: [] as VariantForm[],
}

// ─── Image cropping — a professional crop step before every image upload ───────
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (e) => reject(e))
    img.src = url
  })

// Render the chosen crop region to a canvas → JPEG blob (capped at 1200px).
async function getCroppedBlob(imageSrc: string, area: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  const MAX = 1200
  const scale = Math.min(1, MAX / Math.max(area.width, area.height))
  canvas.width = Math.max(1, Math.round(area.width * scale))
  canvas.height = Math.max(1, Math.round(area.height * scale))
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.92)
  })
}

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const CROP_ASPECTS: { label: string; value: number }[] = [
  { label: 'Square', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
]

// Reusable crop dialog. The parent feeds it one image src at a time (queue) and
// receives the cropped File back via onCrop.
function ImageCropDialog({ open, src, count, busy, onCancel, onCrop }: {
  open: boolean
  src: string
  count: number
  busy: boolean
  onCancel: () => void
  onCrop: (file: File) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [areaPixels, setAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Reset the view whenever a new image comes up.
  useEffect(() => { setCrop({ x: 0, y: 0 }); setZoom(1); setAreaPixels(null) }, [src])

  const confirm = async () => {
    if (!areaPixels) return
    try {
      const blob = await getCroppedBlob(src, areaPixels)
      onCrop(new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    } catch {
      toast.error('Could not crop image')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onCancel() }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-4">
          <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/[0.06]" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 backdrop-blur">
              <Crop className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">Crop image</DialogTitle>
              <DialogDescription className="text-[12px] text-white/60">
                Drag to reposition · scroll or use the slider to zoom{count > 1 ? ` · ${count} images left` : ''}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[320px] bg-neutral-900">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, ap) => setAreaPixels(ap as { x: number; y: number; width: number; height: number })}
              showGrid
            />
          )}
        </div>

        <div className="px-6 py-3 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#1B3B6F]" aria-label="Zoom" />
            <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 mr-1">Ratio</span>
            {CROP_ASPECTS.map((a) => (
              <button key={a.label} type="button" onClick={() => setAspect(a.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${aspect === a.value ? 'bg-[#1B3B6F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-3.5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={confirm} disabled={busy || !areaPixels} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Crop &amp; Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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
  const [pickerFor, setPickerFor] = useState<number | null>(null) // which variant's "reuse image" picker is open

  // ── Image cropper queue: files are cropped one-by-one, then uploaded ──
  const [cropFiles, setCropFiles] = useState<File[]>([])
  const [cropSrc, setCropSrc] = useState('')
  const [cropUpload, setCropUpload] = useState<{ fn: (f: File) => Promise<void> } | null>(null)
  const [cropBusy, setCropBusy] = useState(false)

  // Open the cropper for a batch of files; each cropped result runs through `upload`.
  const startCrop = async (files: File[], upload: (f: File) => Promise<void>) => {
    if (!files.length) return
    try {
      const src = await readAsDataURL(files[0])
      setCropFiles(files)
      setCropSrc(src)
      setCropUpload({ fn: upload })
    } catch { toast.error('Could not read image') }
  }
  const closeCrop = () => { setCropFiles([]); setCropSrc(''); setCropUpload(null); setCropBusy(false) }
  const handleCropDone = async (croppedFile: File) => {
    if (!cropUpload) return
    setCropBusy(true)
    try { await cropUpload.fn(croppedFile) } catch { toast.error('Upload failed') }
    setCropBusy(false)
    // Advance to the next queued file, or close when done.
    const remaining = cropFiles.slice(1)
    if (remaining.length) {
      try { const src = await readAsDataURL(remaining[0]); setCropFiles(remaining); setCropSrc(src) }
      catch { closeCrop() }
    } else {
      closeCrop()
    }
  }

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

  // Every image already uploaded in this product form (product thumbnail +
  // product images + all variants) — offered for reuse so the same file isn't
  // re-uploaded for another variant/brand.
  const productImagePool: string[] = (() => {
    const urls: string[] = []
    const push = (u?: string) => { if (u && !urls.includes(u)) urls.push(u) }
    push(formData.thumbnailUrl)
    formData.imageUrls.forEach(push)
    formData.variants.forEach((vv) => { push(vv.thumbnailUrl); vv.imageUrls.forEach(push) })
    return urls
  })()

  // ─── Variant helpers ─────────────────────────────────
  const addVariant = () => setFormData((prev) => ({ ...prev, variants: [...prev.variants, emptyVariant()] }))
  const removeVariant = (idx: number) => { setPickerFor(null); setFormData((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) })) }
  // Reuse an image that's already uploaded elsewhere in this product (no re-upload).
  const addExistingVariantImage = (idx: number, url: string) =>
    mutateVariant(idx, (v) => (v.imageUrls.includes(url) ? v : { ...v, imageUrls: [...v.imageUrls, url] }))
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

  const handleVariantThumbUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startCrop([file], async (cropped) => {
      const res = await uploadAPI.uploadImage(cropped, 'products')
      updateVariant(idx, { thumbnailUrl: res.data.data.url })
    })
    e.target.value = ''
  }
  const handleVariantImagesUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    startCrop(files, async (cropped) => {
      const res = await uploadAPI.uploadImage(cropped, 'products')
      mutateVariant(idx, (v) => ({ ...v, imageUrls: [...v.imageUrls, res.data.data.url] }))
    })
    e.target.value = ''
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

  // ─── Bulk CSV import / export ────────────────────────
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; failed: number; errors: { line: number; error: string }[] } | null>(null)

  const refetchProducts = () => {
    const params: Record<string, any> = { page, limit: 10 }
    if (searchQuery) params.search = searchQuery
    if (categoryFilter !== 'all') params.category = categoryFilter
    if (brandFilter !== 'all') params.brand = brandFilter
    if (statusFilter === 'active') params.isActive = true
    if (statusFilter === 'inactive') params.isActive = false
    dispatch(fetchProductsRequest(params))
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true); setImportResult(null)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (!rows.length) { toast.error('CSV has no data rows'); return }
      let imported = 0, updated = 0, failed = 0
      const errors: { line: number; error: string }[] = []
      const BATCH = 500
      for (let i = 0; i < rows.length; i += BATCH) {
        const res = await productAPI.importRows(rows.slice(i, i + BATCH))
        const d = res.data?.data || {}
        imported += d.imported || 0; updated += d.updated || 0; failed += d.failed || 0
        if (Array.isArray(d.errors)) errors.push(...d.errors.map((er: any) => ({ line: (er.line || 0) + i, error: er.error })))
      }
      setImportResult({ imported, updated, failed, errors })
      toast.success(`Import done — ${imported} added, ${updated} updated, ${failed} failed`)
      refetchProducts()
    } catch (err: any) {
      toast.error('Import failed: ' + (err?.response?.data?.message || err?.message || 'error'))
    } finally { setImporting(false) }
  }

  const handleExport = async () => {
    try {
      const res = await productAPI.exportAll()
      const rows = res.data?.data || []
      if (!rows.length) { toast.error('No products to export'); return }
      downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))
      toast.success(`Exported ${rows.length} products`)
    } catch { toast.error('Export failed') }
  }

  const handleDownloadTemplate = () => {
    const sample: Record<string, string> = {
      name: 'Front Brake Pad Set', sku: 'BP-SWIFT-001', partNumber: 'OEM123456', brand: 'Bosch', category: 'Brake Pads',
      vehicleType: 'Car', cost: '450', selling: '899', mrp: '1099', stock: '25', minStock: '5', hsnCode: '8708', gstRate: '18',
      tags: 'brake|safety|premium', image: 'https://example.com/pad.jpg', images: '', description: 'Ceramic front brake pad for Maruti Swift',
    }
    const ordered: Record<string, string> = {}
    CSV_TEMPLATE_HEADERS.forEach((h) => { ordered[h] = sample[h] ?? '' })
    downloadCsv('product-import-template.csv', toCsv([ordered]))
  }

  // ─── Bulk select (multi-select + bulk activate/deactivate/delete) ──────────
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const toggleSelect = (id: string) =>
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allSelected = products.length > 0 && selectedIds.length === products.length
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : products.map((p: ProductItem) => p._id))
  const clearSelection = () => setSelectedIds([])
  const handleBulkActive = async (isActive: boolean) => {
    if (!selectedIds.length) return
    try {
      await productAPI.bulkUpdate(selectedIds, { isActive })
      toast.success(`${selectedIds.length} product(s) ${isActive ? 'activated' : 'deactivated'}`)
      clearSelection(); refetchProducts()
    } catch { toast.error('Bulk update failed') }
  }
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} product(s)? This cannot be undone.`)) return
    try {
      await productAPI.bulkDelete(selectedIds)
      toast.success(`${selectedIds.length} product(s) deleted`)
      clearSelection(); refetchProducts()
    } catch { toast.error('Bulk delete failed') }
  }

  // ─── Data-entry flag toggle (Image / Amount completed) from the list row ────
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const toggleFlag = async (product: ProductItem, field: 'imageCompleted' | 'amountFinalized') => {
    setTogglingId(product._id + field)
    try {
      await productAPI.update(product._id, { [field]: !product[field] })
      refetchProducts()
    } catch {
      toast.error('Update failed')
    } finally {
      setTogglingId(null)
    }
  }

  // ─── Publish toggle (Coming Soon ↔ live) from the list row ──────────────────
  // Unpublished (default) = customers see placeholder image + ₹0 + "Coming Soon"
  // and can't order. Published = real image/price + orderable.
  const togglePublish = async (product: ProductItem) => {
    setTogglingId(product._id + 'published')
    try {
      await productAPI.togglePublished(product._id, !product.published)
      toast.success(!product.published ? 'Published — now live for customers' : 'Set to Coming Soon')
      refetchProducts()
    } catch {
      toast.error('Update failed')
    } finally {
      setTogglingId(null)
    }
  }

  // ─── Add Product ─────────────────────────────────────
  const handleOpenAdd = () => {
    setFormData(emptyProductForm)
    setFormTab('basic')
    setPickerFor(null)
    setIsAddOpen(true)
  }

  // Generate a valid, unique-ish SKU from the name so quick creates don't trip
  // the backend's required-SKU rule. Matches /^[A-Z0-9-_]+$/.
  const autoSku = (name: string) => {
    const base = (name || 'PRODUCT').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 14) || 'PRODUCT'
    return `${base}-${Date.now().toString(36).toUpperCase().slice(-5)}`
  }

  // Shared flag checkboxes shown in the Add/Edit dialog footer
  const renderFormFlags = () => (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox checked={formData.isFeatured} onCheckedChange={(c) => setFormData({ ...formData, isFeatured: c as boolean })} />
        <Label className="text-[13px] cursor-pointer">Featured Product</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox checked={formData.imageCompleted} onCheckedChange={(c) => setFormData({ ...formData, imageCompleted: c as boolean })} />
        <Label className="text-[13px] cursor-pointer">Image Completed</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox checked={formData.amountFinalized} onCheckedChange={(c) => setFormData({ ...formData, amountFinalized: c as boolean })} />
        <Label className="text-[13px] cursor-pointer">Amount Completed</Label>
      </div>
    </div>
  )

  const handleSaveNew = (asDraft = false) => {
    if (!formData.name || !formData.category || !formData.brand || !formData.priceCost || !formData.priceSelling) {
      toast.error('Please fill required fields: Name, Category, Brand, Cost, Selling Price')
      return
    }
    const payload: any = {
      name: formData.name,
      sku: formData.sku || autoSku(formData.name),
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
      isActive: !asDraft,
      isDraft: asDraft,
    }
    if (formData.partNumber) payload.partNumber = formData.partNumber
    if (formData.hsnCode) payload.hsnCode = formData.hsnCode
    if (formData.gstRate) payload.gstRate = Number(formData.gstRate)
    payload.returnable = formData.returnable
    if (formData.returnWindowDays) payload.returnWindowDays = Number(formData.returnWindowDays)
    if (formData.metaTitle) payload.metaTitle = formData.metaTitle
    if (formData.metaDescription) payload.metaDescription = formData.metaDescription
    if (formData.supplierName) payload.suppliers = [{ name: formData.supplierName, contact: formData.supplierContact || undefined }]
    payload.imageCompleted = formData.imageCompleted
    payload.amountFinalized = formData.amountFinalized
    if (formData.tags) payload.tags = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    if (formData.thumbnailUrl) payload.thumbnail = { url: formData.thumbnailUrl }
    if (formData.imageUrls.length > 0) payload.images = formData.imageUrls.map((url) => ({ url }))
    const variants = buildVariantsPayload()
    if (variants.length > 0) payload.variants = variants

    dispatch(createProductRequest(payload))
    toast.success(asDraft ? 'Saved as draft' : 'Product published')
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
      hsnCode: p.hsnCode || '',
      gstRate: p.gstRate != null ? String(p.gstRate) : '',
      returnable: p.returnable !== false,
      returnWindowDays: p.returnWindowDays != null ? String(p.returnWindowDays) : '7',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      supplierName: p.suppliers?.[0]?.name || '',
      supplierContact: p.suppliers?.[0]?.contact || '',
      imageCompleted: !!p.imageCompleted,
      amountFinalized: !!p.amountFinalized,
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
    setPickerFor(null)
    setIsEditOpen(true)
  }

  const handleSaveEdit = (asDraft = false) => {
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
    if (formData.hsnCode) payload.hsnCode = formData.hsnCode
    if (formData.gstRate) payload.gstRate = Number(formData.gstRate)
    payload.returnable = formData.returnable
    if (formData.returnWindowDays) payload.returnWindowDays = Number(formData.returnWindowDays)
    if (formData.metaTitle) payload.metaTitle = formData.metaTitle
    if (formData.metaDescription) payload.metaDescription = formData.metaDescription
    if (formData.supplierName) payload.suppliers = [{ name: formData.supplierName, contact: formData.supplierContact || undefined }]
    payload.imageCompleted = formData.imageCompleted
    payload.amountFinalized = formData.amountFinalized
    if (formData.tags) payload.tags = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    if (formData.thumbnailUrl) payload.thumbnail = { url: formData.thumbnailUrl }
    // Always send images so uploads (and removals) persist on edit
    payload.images = formData.imageUrls.map((url) => ({ url }))
    payload.variants = buildVariantsPayload()

    // Draft → hide from store. Publish → go live. Plain "Save Changes" on an
    // already-published product leaves its active state untouched.
    if (asDraft) {
      payload.isDraft = true
      payload.isActive = false
    } else {
      payload.isDraft = false
      if (selectedProduct.isDraft) payload.isActive = true
    }

    dispatch(updateProductRequest({ id: selectedProduct._id, data: payload }))
    toast.success(asDraft ? 'Saved as draft' : selectedProduct.isDraft ? 'Product published' : 'Changes saved')
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
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    startCrop([file], async (cropped) => {
      const res = await uploadAPI.uploadImage(cropped, 'products')
      setFormData((prev) => ({ ...prev, thumbnailUrl: res.data.data.url }))
      toast.success('Thumbnail added')
    })
    e.target.value = ''
  }

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    startCrop(files, async (cropped) => {
      const res = await uploadAPI.uploadImage(cropped, 'products')
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, res.data.data.url] }))
    })
    e.target.value = ''
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
    <div className="flex flex-1 min-h-0">
      {/* Left section rail (desktop) */}
      <nav className="hidden sm:flex w-56 shrink-0 flex-col gap-1 border-r border-gray-100 bg-gray-50/60 p-3">
        {SECTIONS.map((s) => {
          const active = formTab === s.id
          const Icon = s.icon
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFormTab(s.id)}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors border',
                active ? 'bg-white shadow-sm border-gray-100' : 'border-transparent hover:bg-white/70'
              )}
            >
              <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', active ? 'bg-[#1B3B6F] text-white' : 'bg-gray-200/70 text-gray-500')}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold leading-tight', active ? 'text-[#1A1D29]' : 'text-gray-600')}>
                  {s.label}{s.id === 'variants' && formData.variants.length > 0 ? ` (${formData.variants.length})` : ''}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{s.desc}</p>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-ultra-narrow">
        {/* Mobile section switcher */}
        <div className="sm:hidden mb-4">
          <Select value={formTab} onValueChange={setFormTab}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={formTab} onValueChange={setFormTab}>
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
        {/* Supplier (sourcing info) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Supplier Name</Label>
            <Input value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} placeholder="e.g. AutoParts Distributors" />
          </div>
          <div className="grid gap-2">
            <Label>Supplier Contact</Label>
            <Input value={formData.supplierContact} onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })} placeholder="Phone / email" />
          </div>
        </div>
        {/* SEO (product page ranking on Google) */}
        <div className="grid gap-2">
          <Label>SEO Meta Title <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Defaults to product name" maxLength={160} />
        </div>
        <div className="grid gap-2">
          <Label>SEO Meta Description <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Textarea value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} rows={2} placeholder="Short description for Google search results" maxLength={320} />
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
        {/* Tax & returns (India GST invoicing + per-product return policy) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>HSN Code</Label>
            <Input value={formData.hsnCode} onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="e.g. 8708" />
          </div>
          <div className="grid gap-2">
            <Label>GST Rate (%)</Label>
            <Input type="number" value={formData.gstRate} onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })} placeholder="18" />
          </div>
          <div className="grid gap-2">
            <Label>Return Window (days)</Label>
            <Input type="number" value={formData.returnWindowDays} onChange={(e) => setFormData({ ...formData, returnWindowDays: e.target.value })} placeholder="7" disabled={!formData.returnable} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={formData.returnable} onCheckedChange={(c) => setFormData({ ...formData, returnable: c as boolean })} />
          <Label>Returnable</Label>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Variant Images</Label>
                    {productImagePool.filter((u) => !v.imageUrls.includes(u)).length > 0 && (
                      <button type="button" onClick={() => setPickerFor(pickerFor === idx ? null : idx)} className="text-[#1B3B6F] text-xs flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> {pickerFor === idx ? 'Close' : 'Reuse existing'}
                      </button>
                    )}
                  </div>
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
                  {pickerFor === idx && (
                    <div className="mt-1 rounded-lg border border-gray-200 bg-white p-2">
                      <p className="text-[11px] text-gray-500 mb-1.5">Tap an already-uploaded image to reuse it for this variant — no need to upload again.</p>
                      {productImagePool.filter((u) => !v.imageUrls.includes(u)).length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-2">No other images available yet</p>
                      ) : (
                        <div className="grid grid-cols-6 gap-2">
                          {productImagePool.filter((u) => !v.imageUrls.includes(u)).map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => addExistingVariantImage(idx, url)}
                              title="Add to this variant"
                              className="relative aspect-square rounded-md overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#1B3B6F] transition"
                            >
                              <img src={url} alt="existing" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
      </div>
    </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <FileUp className="h-4 w-4 mr-2" /> Template
              </Button>
              <label className={`inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-white text-sm font-medium cursor-pointer hover:bg-gray-50 ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? 'Importing…' : 'Import CSV'}
                <input type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" disabled={importing} />
              </label>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
              <Button onClick={handleOpenAdd} className="bg-[#1B3B6F] hover:bg-[#0F2545] shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Bulk import result summary */}
          {importResult && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-4 font-medium">
                  <span className="text-emerald-600">✓ {importResult.imported} added</span>
                  <span className="text-blue-600">↻ {importResult.updated} updated</span>
                  <span className={importResult.failed ? 'text-red-600' : 'text-gray-400'}>✕ {importResult.failed} failed</span>
                </div>
                <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600"><XIcon className="h-4 w-4" /></button>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-red-50 p-2 text-[12px] text-red-700 space-y-0.5">
                  {importResult.errors.slice(0, 100).map((er, i) => (
                    <div key={i}>Row {er.line}: {er.error}</div>
                  ))}
                  {importResult.errors.length > 100 && <div className="text-red-400">…and {importResult.errors.length - 100} more</div>}
                </div>
              )}
            </div>
          )}

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
                  {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#1B3B6F]/[0.04] border-b border-gray-200">
                      <span className="text-sm font-medium text-[#1B3B6F]">{selectedIds.length} selected</span>
                      <div className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => handleBulkActive(true)}>Activate</Button>
                      <Button variant="outline" size="sm" onClick={() => handleBulkActive(false)}>Deactivate</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleBulkDelete}>Delete</Button>
                      <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                        <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Entry</TableHead>
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
                          <TableCell className="w-10">
                            <Checkbox checked={selectedIds.includes(product._id)} onCheckedChange={() => toggleSelect(product._id)} />
                          </TableCell>
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
                            {isDraftProduct(product) ? (
                              <Badge className="bg-violet-100 text-violet-700 border-0">Draft</Badge>
                            ) : (
                              <Badge className={product.isActive ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleFlag(product, 'imageCompleted')}
                                disabled={togglingId === product._id + 'imageCompleted'}
                                title="Toggle Image Completed"
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${product.imageCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {product.imageCompleted ? '✓ Image' : 'Image'}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleFlag(product, 'amountFinalized')}
                                disabled={togglingId === product._id + 'amountFinalized'}
                                title="Toggle Amount Completed"
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${product.amountFinalized ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {product.amountFinalized ? '✓ Amount' : 'Amount'}
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePublish(product)}
                                disabled={togglingId === product._id + 'published'}
                                title={product.published ? 'Live — click to set Coming Soon' : 'Coming Soon — click to publish (go live)'}
                                className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${product.published ? 'bg-[#FF6B35] text-white border-[#FF6B35] hover:bg-[#F2541B]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                              >
                                {product.published ? '● Published' : 'Coming Soon'}
                              </button>
                            </div>
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
            <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden flex flex-col h-[88vh] max-h-[720px]">
              {/* Gradient header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-5 shrink-0">
                <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
                <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/[0.05]" />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white">Add New Product</DialogTitle>
                      <DialogDescription className="text-[12px] text-white/60">Fill in the sections, then save as draft or publish to the store.</DialogDescription>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                    <FileText className="h-3 w-3" /> Not saved yet
                  </span>
                </div>
              </div>

              {ProductForm()}

              {/* Sticky footer */}
              <div className="border-t border-gray-100 px-6 py-3 flex flex-col gap-3 shrink-0 bg-white">
                {renderFormFlags()}
                <div className="flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="text-gray-500 hover:text-gray-700">Cancel</Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSaveNew(true)} disabled={actionLoading} className="border-gray-300 text-gray-700">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save as Draft
                    </Button>
                    <Button onClick={() => handleSaveNew(false)} disabled={actionLoading} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                      Publish Product
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* ─── Edit Product Dialog ─────────────────────────── */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden flex flex-col h-[88vh] max-h-[720px]">
              {/* Gradient header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-5 shrink-0">
                <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
                <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/[0.05]" />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur">
                      <Edit className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg font-bold text-white truncate">Edit Product</DialogTitle>
                      <DialogDescription className="text-[12px] text-white/60 truncate">{selectedProduct?.name}</DialogDescription>
                    </div>
                  </div>
                  {selectedProduct && (
                    <span className={cn(
                      'shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold',
                      isDraftProduct(selectedProduct) ? 'bg-violet-400/20 text-violet-100'
                        : selectedProduct.isActive ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/10 text-white/70'
                    )}>
                      {isDraftProduct(selectedProduct) ? 'Draft' : selectedProduct.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>

              {ProductForm()}

              {/* Sticky footer */}
              <div className="border-t border-gray-100 px-6 py-3 flex flex-col gap-3 shrink-0 bg-white">
                {renderFormFlags()}
                <div className="flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700">Cancel</Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleSaveEdit(true)} disabled={actionLoading} className="border-gray-300 text-gray-700">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save as Draft
                    </Button>
                    <Button onClick={() => handleSaveEdit(false)} disabled={actionLoading} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (selectedProduct?.isDraft ? <Rocket className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />)}
                      {selectedProduct?.isDraft ? 'Publish' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
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

          {/* ─── Image Cropper (shared by all image uploads) ─────── */}
          <ImageCropDialog
            open={!!cropSrc}
            src={cropSrc}
            count={cropFiles.length}
            busy={cropBusy}
            onCancel={closeCrop}
            onCrop={handleCropDone}
          />
        </div>
      </main>
    </div>
  )
}
