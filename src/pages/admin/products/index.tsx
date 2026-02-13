'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DUMMY_PARTS } from '@/lib/constants'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState(DUMMY_PARTS)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/products" />
      <main className="lg:pl-72 transition-all duration-300">
        {/* Header */}
        <div className="bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Products</h1>
              <p className="text-muted-foreground">Manage your auto parts inventory</p>
            </div>
            <Link href="/admin/products/new">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90">
                <Plus size={20} /> Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted" size={20} />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Brand</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Rating</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{product.brand}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary">₹{product.price}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            product.stock > 10
                              ? 'bg-green-100 text-green-800'
                              : product.stock > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold">⭐ {product.rating}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-muted rounded-lg transition">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 hover:bg-muted rounded-lg transition text-primary">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button>1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
