'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchBrandsRequest,
  createBrandRequest,
  updateBrandRequest,
  deleteBrandRequest,
  clearBrandError,
} from '@/store/slices/brandSlice'
import { BrandItem } from '@/store/slices/brandSlice'
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
  Shield,
  Globe,
  AlertCircle,
  Loader2,
  Upload,
  X as XIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate } from '@/lib/utils'

const vehicleTypeOptions = ['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto Rickshaw', 'Scooter', 'Bicycle', 'Universal']

const emptyForm = {
  name: '',
  description: '',
  logo: '',
  website: '',
  country: '',
  vehicleTypes: [] as string[],
  isActive: true,
}

export default function BrandsPage() {
  const dispatch = useAppDispatch()
  const { brands, loading, error, pagination } = useAppSelector((state) => state.brand)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewBrand, setViewBrand] = useState<BrandItem | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    dispatch(fetchBrandsRequest({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearBrandError())
    }
  }, [error, dispatch])

  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.isActive) ||
      (statusFilter === 'inactive' && !b.isActive)
    return matchesSearch && matchesStatus
  })

  const activeCount = brands.filter((b) => b.isActive).length

  const handleOpenAdd = () => {
    setEditingBrand(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (brand: BrandItem) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logo: brand.logo || '',
      website: brand.website || '',
      country: brand.country || '',
      vehicleTypes: brand.vehicleTypes || [],
      isActive: brand.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Brand name is required')
      return
    }

    const payload: any = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
    }
    if (formData.logo) payload.logo = formData.logo
    if (formData.website) payload.website = formData.website
    if (formData.country) payload.country = formData.country
    if (formData.vehicleTypes.length > 0) payload.vehicleTypes = formData.vehicleTypes

    if (editingBrand) {
      dispatch(updateBrandRequest({ id: editingBrand._id, data: payload }))
      toast.success('Brand updated successfully')
    } else {
      dispatch(createBrandRequest(payload))
      toast.success('Brand created successfully')
    }
    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      dispatch(deleteBrandRequest(deletingId))
      toast.success('Brand deleted successfully')
    }
    setIsDeleteOpen(false)
    setDeletingId(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImage(file, 'brands')
      setFormData((prev) => ({ ...prev, logo: res.data.data.url }))
      toast.success('Logo uploaded')
    } catch {
      toast.error('Logo upload failed')
    } finally {
      setUploading(false)
    }
  }

  const toggleVehicleType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }))
  }

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/brands" />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1D29]">Brands</h1>
              <p className="text-[#6B7280] mt-1">Manage auto part brands</p>
            </div>
            <Button onClick={handleOpenAdd} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{brands.length}</p>
                    <p className="text-xs text-[#6B7280]">Total Brands</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{activeCount}</p>
                    <p className="text-xs text-[#6B7280]">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{brands.length - activeCount}</p>
                    <p className="text-xs text-[#6B7280]">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Brands List</CardTitle>
                  <CardDescription>Manage your auto part brands</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search brands..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[250px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && brands.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Vehicle Types</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-8 h-8 rounded object-contain bg-gray-50"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                {brand.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-[#1A1D29]">{brand.name}</div>
                              <div className="text-xs text-[#6B7280]">/{brand.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {brand.country || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(brand.vehicleTypes || []).slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">
                                {t}
                              </Badge>
                            ))}
                            {(brand.vehicleTypes || []).length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{(brand.vehicleTypes || []).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(brand.isActive)}>
                            {brand.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {formatDate(brand.createdAt)}
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
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewBrand(brand)
                                  setIsViewOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(brand)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingId(brand._id)
                                  setIsDeleteOpen(true)
                                }}
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
              )}
            </CardContent>
          </Card>

          {/* ─── Add / Edit Dialog ────────────────────────────── */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                <DialogDescription>
                  {editingBrand ? 'Update brand details' : 'Add a new auto part brand'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Brand Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bosch"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Logo</Label>
                  {formData.logo ? (
                    <div className="relative inline-block w-20 h-20">
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-20 h-20 rounded-lg object-contain border bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 w-fit">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Country</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. Germany"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Vehicle Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {vehicleTypeOptions.map((type) => (
                      <label
                        key={type}
                        className="flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.vehicleTypes.includes(type)}
                          onCheckedChange={() => toggleVehicleType(type)}
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, isActive: val === 'active' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingBrand ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Delete Confirm ───────────────────────────────── */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete Brand</DialogTitle>
                <DialogDescription>
                  Are you sure? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── View Dialog ──────────────────────────────────── */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Brand Details</DialogTitle>
              </DialogHeader>
              {viewBrand && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {viewBrand.logo ? (
                      <img
                        src={viewBrand.logo}
                        alt={viewBrand.name}
                        className="w-16 h-16 rounded-lg object-contain bg-gray-50 border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
                        {viewBrand.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{viewBrand.name}</h3>
                      <p className="text-sm text-gray-500">/{viewBrand.slug}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Country</p>
                      <p className="font-medium">{viewBrand.country || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className={getStatusColor(viewBrand.isActive)}>
                        {viewBrand.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {viewBrand.website && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Website</p>
                        <a
                          href={viewBrand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {viewBrand.website}
                        </a>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-gray-500">Description</p>
                      <p className="font-medium">{viewBrand.description || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 mb-1">Vehicle Types</p>
                      <div className="flex flex-wrap gap-1">
                        {(viewBrand.vehicleTypes || []).map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                        {(viewBrand.vehicleTypes || []).length === 0 && (
                          <span className="text-sm text-gray-400">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(viewBrand.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Updated</p>
                      <p className="font-medium">{formatDate(viewBrand.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
