'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchCategoriesRequest,
  fetchParentCategoriesRequest,
  createCategoryRequest,
  updateCategoryRequest,
  deleteCategoryRequest,
  clearCategoryError,
} from '@/store/slices/categorySlice'
import { CategoryItem } from '@/store/slices/categorySlice'
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
  Tag,
  Grid3X3,
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
import { formatDate } from '@/lib/utils'

const emptyForm = {
  name: '',
  description: '',
  parentCategory: '',
  image: '',
  icon: '',
  isActive: true,
  sortOrder: 0,
}

export default function CategoriesPage() {
  const dispatch = useAppDispatch()
  const { categories, parentCategories, loading, error, pagination } = useAppSelector(
    (state) => state.category
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewCategory, setViewCategory] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategoriesRequest({ limit: 100 }))
    dispatch(fetchParentCategoriesRequest())
  }, [dispatch])

  // Error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearCategoryError())
    }
  }, [error, dispatch])

  // Filter categories locally
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cat.isActive) ||
      (statusFilter === 'inactive' && !cat.isActive)
    return matchesSearch && matchesStatus
  })

  const activeCount = categories.filter((c) => c.isActive).length
  const inactiveCount = categories.filter((c) => !c.isActive).length

  // ─── Handlers ────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingCategory(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || '',
      parentCategory:
        typeof cat.parentCategory === 'object' && cat.parentCategory
          ? cat.parentCategory._id
          : (cat.parentCategory as string) || '',
      image: cat.image || '',
      icon: cat.icon || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder || 0,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    const payload: any = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
    }
    if (formData.parentCategory) payload.parentCategory = formData.parentCategory
    else payload.parentCategory = null
    if (formData.image) payload.image = formData.image
    if (formData.icon) payload.icon = formData.icon

    if (editingCategory) {
      dispatch(updateCategoryRequest({ id: editingCategory._id, data: payload }))
      toast.success('Category updated successfully')
    } else {
      dispatch(createCategoryRequest(payload))
      toast.success('Category created successfully')
    }
    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      dispatch(deleteCategoryRequest(deletingId))
      toast.success('Category deleted successfully')
    }
    setIsDeleteOpen(false)
    setDeletingId(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadAPI.uploadImage(file, 'categories')
      setFormData((prev) => ({ ...prev, image: res.data.data.url }))
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'

  const getParentName = (cat: CategoryItem) => {
    if (!cat.parentCategory) return '—'
    if (typeof cat.parentCategory === 'object') return cat.parentCategory.name
    const parent = categories.find((c) => c._id === cat.parentCategory)
    return parent ? parent.name : '—'
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/categories" />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1D29]">Product Categories</h1>
              <p className="text-[#6B7280] mt-1">Manage your inventory categories</p>
            </div>
            <Button onClick={handleOpenAdd} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{categories.length}</p>
                    <p className="text-xs text-[#6B7280]">Total Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-green-600" />
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
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{pagination.total}</p>
                    <p className="text-xs text-[#6B7280]">Total From API</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-[#1A1D29]">{inactiveCount}</p>
                    <p className="text-xs text-[#6B7280]">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Categories List</CardTitle>
                  <CardDescription>Manage and organize your product categories</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search categories..."
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
              {loading && categories.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((cat) => (
                      <TableRow key={cat._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {cat.image && (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-[#1A1D29]">{cat.name}</div>
                              <div className="text-xs text-[#6B7280]">/{cat.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {getParentName(cat)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-[#6B7280] truncate max-w-[200px]">
                            {cat.description || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(cat.isActive)}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#6B7280]">
                          {formatDate(cat.createdAt)}
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
                                  setViewCategory(cat)
                                  setIsViewOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(cat)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingId(cat._id)
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

          {/* ─── Add / Edit Dialog ─────────────────────────────── */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'Update category details'
                    : 'Create a new product category for your inventory'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Category Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Engine Parts"
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
                  <Label>Parent Category</Label>
                  <Select
                    value={formData.parentCategory || 'none'}
                    onValueChange={(val) =>
                      setFormData({ ...formData, parentCategory: val === 'none' ? '' : val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {parentCategories.map((pc) => (
                        <SelectItem key={pc._id} value={pc._id}>
                          {pc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Image</Label>
                  {formData.image ? (
                    <div className="relative inline-block w-20 h-20">
                      <img
                        src={formData.image}
                        alt="Category"
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                      }
                    />
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
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Delete Confirm Dialog ─────────────────────────── */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this category? This action cannot be undone.
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

          {/* ─── View Dialog ───────────────────────────────────── */}
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Category Details</DialogTitle>
              </DialogHeader>
              {viewCategory && (
                <div className="space-y-4">
                  {viewCategory.image && (
                    <img
                      src={viewCategory.image}
                      alt={viewCategory.name}
                      className="w-full h-40 rounded-lg object-cover"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{viewCategory.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Slug</p>
                      <p className="font-medium">/{viewCategory.slug}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Parent</p>
                      <p className="font-medium">{getParentName(viewCategory)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className={getStatusColor(viewCategory.isActive)}>
                        {viewCategory.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Description</p>
                      <p className="font-medium">{viewCategory.description || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(viewCategory.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Updated</p>
                      <p className="font-medium">{formatDate(viewCategory.updatedAt)}</p>
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
