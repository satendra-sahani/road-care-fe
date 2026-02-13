'use client'

import * as React from 'react'
import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Package,
  Tag,
  Grid3X3,
  AlertCircle
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'

interface Category {
  id: string
  name: string
  description: string
  slug: string
  parentCategory?: string
  productsCount: number
  status: 'active' | 'inactive'
  createdDate: string
}

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Engine Parts',
    description: 'All engine related components and parts',
    slug: 'engine-parts',
    productsCount: 245,
    status: 'active',
    createdDate: '2024-01-15'
  },
  {
    id: 'cat-2',
    name: 'Brake System',
    description: 'Brake pads, rotors, and brake system components',
    slug: 'brake-system',
    productsCount: 189,
    status: 'active',
    createdDate: '2024-01-20'
  },
  {
    id: 'cat-3',
    name: 'Suspension',
    description: 'Shock absorbers, struts, and suspension parts',
    slug: 'suspension',
    productsCount: 156,
    status: 'active',
    createdDate: '2024-02-05'
  },
  {
    id: 'cat-4',
    name: 'Electrical',
    description: 'Batteries, alternators, and electrical components',
    slug: 'electrical',
    productsCount: 98,
    status: 'active',
    createdDate: '2024-02-10'
  },
  {
    id: 'cat-5',
    name: 'Tires & Wheels',
    description: 'Tires, rims, and wheel-related accessories',
    slug: 'tires-wheels',
    productsCount: 234,
    status: 'active',
    createdDate: '2024-02-12'
  },
  {
    id: 'cat-6',
    name: 'Body Parts',
    description: 'Exterior and interior body components',
    slug: 'body-parts',
    productsCount: 167,
    status: 'inactive',
    createdDate: '2024-01-28'
  }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    slug: '',
    parentCategory: ''
  })

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || category.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const handleAddCategory = () => {
    const category: Category = {
      id: `cat-${Math.floor(Math.random() * 1000000)}`, // Use random number instead of Date.now()
      name: newCategory.name,
      description: newCategory.description,
      slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      productsCount: 0,
      status: 'active',
      createdDate: '2026-02-12' // Use static date to prevent hydration issues
    }
    
    setCategories([...categories, category])
    setNewCategory({ name: '', description: '', slug: '', parentCategory: '' })
    setIsAddDialogOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productsCount, 0)
  const activeCategories = categories.filter(cat => cat.status === 'active').length

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/inventory/categories" />
      <main className="lg:pl-72 transition-all duration-300">
        <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Product Categories</h1>
          <p className="text-[#6B7280] mt-1">Manage your inventory categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new product category for your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Enter category description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL-friendly name)</Label>
                <Input
                  id="slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                  placeholder="category-slug (auto-generated if empty)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} className="bg-[#1B3B6F] hover:bg-[#1B3B6F]/90">
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
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
                <p className="text-2xl font-bold text-[#1A1D29]">{activeCategories}</p>
                <p className="text-xs text-[#6B7280]">Active Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{totalProducts}</p>
                <p className="text-xs text-[#6B7280]">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{categories.filter(c => c.status === 'inactive').length}</p>
                <p className="text-xs text-[#6B7280]">Inactive Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
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
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#1A1D29]">{category.name}</div>
                        <div className="text-sm text-[#6B7280]">/{category.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="text-sm text-[#6B7280] truncate">{category.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{category.productsCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(category.status)}>
                        {category.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[#6B7280]">
                        {formatDate(category.createdDate)}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Category
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
        </div>
      </main>
    </div>
  )
}