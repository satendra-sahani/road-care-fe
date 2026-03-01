// @ts-nocheck
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search, Plus, Minus, X, Loader2, User, Package, MapPin, CreditCard,
  Upload, ShoppingBag, UserPlus, Phone, Mail, Trash2, ImageIcon, CheckCircle, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { orderAPI } from '@/services/api'

const fmt = (n: number) => `Rs.${(n || 0).toLocaleString('en-IN')}`

interface SelectedProduct {
  _id: string
  name: string
  sku: string
  thumbnail?: string
  price: number
  stock: number
  quantity: number
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderCreated: () => void
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  // Customer
  const [custSearch, setCustSearch] = useState('')
  const [custResults, setCustResults] = useState<any[]>([])
  const [custLoading, setCustLoading] = useState(false)
  const [selectedCust, setSelectedCust] = useState<any>(null)
  const [isNewCust, setIsNewCust] = useState(false)
  const [newCust, setNewCust] = useState({ fullName: '', phone: '', email: '' })

  // Products
  const [prodSearch, setProdSearch] = useState('')
  const [prodResults, setProdResults] = useState<any[]>([])
  const [prodLoading, setProdLoading] = useState(false)
  const [products, setProducts] = useState<SelectedProduct[]>([])

  // Shipping
  const [address, setAddress] = useState({
    fullName: '', phone: '', address: '', landmark: '', city: '', state: '', pincode: ''
  })

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ orderId: string; password?: string } | null>(null)

  const custTimer = useRef<any>(null)
  const prodTimer = useRef<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCustSearch(''); setCustResults([]); setSelectedCust(null); setIsNewCust(false)
      setNewCust({ fullName: '', phone: '', email: '' })
      setProdSearch(''); setProdResults([]); setProducts([])
      setAddress({ fullName: '', phone: '', address: '', landmark: '', city: '', state: '', pincode: '' })
      setPaymentMethod('cod'); setUtrNumber(''); setScreenshot(null)
      setDiscount(''); setNotes(''); setError(''); setSuccess(null)
    }
  }, [open])

  // Customer search (debounced)
  const searchCustomers = useCallback((q: string) => {
    setCustSearch(q)
    if (custTimer.current) clearTimeout(custTimer.current)
    if (q.length < 2) { setCustResults([]); return }
    custTimer.current = setTimeout(async () => {
      setCustLoading(true)
      try {
        const res = await orderAPI.searchCustomers(q)
        setCustResults(res.data?.data || [])
      } catch { setCustResults([]) }
      finally { setCustLoading(false) }
    }, 300)
  }, [])

  // Product search (debounced)
  const searchProducts = useCallback((q: string) => {
    setProdSearch(q)
    if (prodTimer.current) clearTimeout(prodTimer.current)
    if (q.length < 2) { setProdResults([]); return }
    prodTimer.current = setTimeout(async () => {
      setProdLoading(true)
      try {
        const res = await orderAPI.searchProducts(q)
        setProdResults(res.data?.data || [])
      } catch { setProdResults([]) }
      finally { setProdLoading(false) }
    }, 300)
  }, [])

  const selectCustomer = (c: any) => {
    setSelectedCust(c)
    setCustSearch(''); setCustResults([]); setIsNewCust(false)
    // Pre-fill address
    setAddress(prev => ({
      fullName: c.fullName || prev.fullName,
      phone: c.phone || prev.phone,
      address: c.address || prev.address,
      landmark: prev.landmark,
      city: c.city || prev.city,
      state: c.state || prev.state,
      pincode: c.pincode || prev.pincode,
    }))
  }

  const addProduct = (p: any) => {
    const existing = products.find(x => x._id === p._id)
    if (existing) {
      if (existing.quantity < existing.stock) {
        setProducts(prev => prev.map(x => x._id === p._id ? { ...x, quantity: x.quantity + 1 } : x))
      }
    } else {
      setProducts(prev => [...prev, {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        thumbnail: p.thumbnail?.url || p.images?.[0]?.url,
        price: p.price?.selling || 0,
        stock: p.inventory?.quantity || 0,
        quantity: 1,
      }])
    }
    setProdSearch(''); setProdResults([])
  }

  const updateQty = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p
      const newQ = Math.max(1, Math.min(p.stock, p.quantity + delta))
      return { ...p, quantity: newQ }
    }))
  }

  const removeProduct = (id: string) => setProducts(prev => prev.filter(p => p._id !== id))

  // Calculations
  const subtotal = products.reduce((s, p) => s + p.price * p.quantity, 0)
  const shipping = subtotal >= 500 ? 0 : 50
  const discountVal = Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal + shipping)
  const total = subtotal + shipping - discountVal

  // Submit
  const handleSubmit = async () => {
    setError('')
    // Validation
    if (!selectedCust && !isNewCust) return setError('Please select or create a customer')
    if (isNewCust && !newCust.fullName.trim()) return setError('Customer name is required')
    if (isNewCust && !newCust.phone.trim()) return setError('Customer phone is required')
    if (products.length === 0) return setError('Add at least one product')
    if (!address.fullName.trim() || !address.phone.trim() || !address.address.trim() || !address.city.trim() || !address.state.trim() || !address.pincode.trim()) {
      return setError('Please fill all required shipping address fields')
    }

    setSubmitting(true)
    try {
      const orderData: any = {
        items: products.map(p => ({ productId: p._id, quantity: p.quantity })),
        shippingAddress: address,
        paymentMethod,
        discount: discountVal,
        notes: notes.trim() || undefined,
      }

      if (selectedCust) {
        orderData.customerId = selectedCust._id
      } else if (isNewCust) {
        orderData.newCustomer = {
          fullName: newCust.fullName.trim(),
          phone: newCust.phone.trim(),
          email: newCust.email.trim() || undefined,
        }
      }

      if (paymentMethod === 'online') {
        orderData.paymentDetails = {
          utrNumber: utrNumber.trim() || undefined,
        }
      }

      const formData = new FormData()
      formData.append('orderData', JSON.stringify(orderData))
      if (screenshot) formData.append('paymentScreenshot', screenshot)

      const res = await orderAPI.create(formData)
      if (res.data?.success) {
        setSuccess({
          orderId: res.data.data?.order?.orderId || 'Created',
          password: res.data.data?.generatedPassword
        })
        onOrderCreated()
      } else {
        setError(res.data?.message || 'Failed to create order')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error creating order')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success view ──
  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Order Created!</h3>
            <p className="text-sm text-gray-500">Order <span className="font-semibold text-blue-700">{success.orderId}</span> has been created successfully.</p>
            {success.password && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">New Customer Account Created</p>
                <p className="text-sm text-amber-700">
                  Generated password: <span className="font-mono font-bold bg-amber-100 px-2 py-0.5 rounded">{success.password}</span>
                </p>
                <button
                  className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  onClick={() => navigator.clipboard.writeText(success.password!)}
                >
                  <Copy className="h-3 w-3" /> Copy password
                </button>
                <p className="text-xs text-amber-600 mt-2">Share this password with the customer so they can log in.</p>
              </div>
            )}
            <Button onClick={() => onOpenChange(false)} className="bg-[#1B3B6F] hover:bg-[#0F2545] mt-2">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1B3B6F]">
            <ShoppingBag className="h-5 w-5" /> Create New Order
          </DialogTitle>
          <DialogDescription>Create an order on behalf of a customer. Fill all required fields.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-2" style={{ scrollbarWidth: 'thin' }}>

          {/* ═══ SECTION 1: CUSTOMER ═══ */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
              <User className="h-4 w-4 text-[#1B3B6F]" /> Customer
            </h4>

            {selectedCust ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {selectedCust.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selectedCust.fullName}</p>
                  <p className="text-xs text-gray-500">{selectedCust.phone} {selectedCust.email && `| ${selectedCust.email}`}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCust(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : !isNewCust ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customer by name, phone, or email..."
                    value={custSearch}
                    onChange={e => searchCustomers(e.target.value)}
                    className="pl-9"
                  />
                  {custLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                </div>
                {custResults.length > 0 && (
                  <div className="bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y">
                    {custResults.map(c => (
                      <button key={c._id} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3" onClick={() => selectCustomer(c)}>
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {c.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.fullName || 'No name'}</p>
                          <p className="text-xs text-gray-500">{c.phone} {c.email && `| ${c.email}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setIsNewCust(true)}>
                  <UserPlus className="h-3.5 w-3.5" /> Create New Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">New Customer Details</p>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setIsNewCust(false)}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Full Name *</Label>
                    <Input value={newCust.fullName} onChange={e => setNewCust(p => ({ ...p, fullName: e.target.value }))} placeholder="Customer name" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone *</Label>
                    <Input value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit phone" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} placeholder="Optional" className="h-9 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ═══ SECTION 2: PRODUCTS ═══ */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
              <Package className="h-4 w-4 text-[#1B3B6F]" /> Products
            </h4>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or SKU..."
                value={prodSearch}
                onChange={e => searchProducts(e.target.value)}
                className="pl-9"
              />
              {prodLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
            </div>

            {prodResults.length > 0 && (
              <div className="bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y">
                {prodResults.map(p => (
                  <button
                    key={p._id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => addProduct(p)}
                  >
                    <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                      {(p.thumbnail?.url || p.images?.[0]?.url) ? (
                        <img src={p.thumbnail?.url || p.images[0].url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 m-2.5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#1B3B6F]">{fmt(p.price?.selling)}</p>
                      <p className="text-xs text-gray-400">Stock: {p.inventory?.quantity ?? 0}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {products.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-center px-2 py-2 w-20">Price</th>
                      <th className="text-center px-2 py-2 w-28">Qty</th>
                      <th className="text-right px-3 py-2 w-20">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                              {p.thumbnail ? (
                                <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 m-2 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-2 py-2 text-xs">{fmt(p.price)}</td>
                        <td className="text-center px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button className="h-6 w-6 rounded border hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQty(p._id, -1)}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{p.quantity}</span>
                            <button className="h-6 w-6 rounded border hover:bg-gray-100 flex items-center justify-center" onClick={() => updateQty(p._id, 1)}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="text-right px-3 py-2 text-xs font-semibold">{fmt(p.price * p.quantity)}</td>
                        <td className="px-1 py-2">
                          <button className="h-6 w-6 rounded hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600" onClick={() => removeProduct(p._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 px-3 py-2 text-right">
                  <span className="text-xs text-gray-500">Subtotal: </span>
                  <span className="text-sm font-bold text-[#1B3B6F]">{fmt(subtotal)}</span>
                </div>
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm border rounded-lg border-dashed">
                Search and add products above
              </div>
            )}
          </section>

          {/* ═══ SECTION 3: SHIPPING ADDRESS ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#1B3B6F]" /> Shipping Address
              </h4>
              {selectedCust && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-blue-600" onClick={() => selectCustomer(selectedCust)}>
                  Use customer address
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Address *</Label>
                <Input value={address.address} onChange={e => setAddress(p => ({ ...p, address: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Landmark</Label>
                <Input value={address.landmark} onChange={e => setAddress(p => ({ ...p, landmark: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">City *</Label>
                <Input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">State *</Label>
                <Input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Pincode *</Label>
                <Input value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
          </section>

          {/* ═══ SECTION 4: PAYMENT & SUMMARY ═══ */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
              <CreditCard className="h-4 w-4 text-[#1B3B6F]" /> Payment & Summary
            </h4>

            {/* Payment method radio */}
            <div className="flex gap-3">
              <button
                className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${paymentMethod === 'cod' ? 'border-[#1B3B6F] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <Package className={`h-5 w-5 mx-auto mb-1 ${paymentMethod === 'cod' ? 'text-[#1B3B6F]' : 'text-gray-400'}`} />
                <p className={`text-sm font-semibold ${paymentMethod === 'cod' ? 'text-[#1B3B6F]' : 'text-gray-500'}`}>Cash on Delivery</p>
              </button>
              <button
                className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${paymentMethod === 'online' ? 'border-[#1B3B6F] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setPaymentMethod('online')}
              >
                <CreditCard className={`h-5 w-5 mx-auto mb-1 ${paymentMethod === 'online' ? 'text-[#1B3B6F]' : 'text-gray-400'}`} />
                <p className={`text-sm font-semibold ${paymentMethod === 'online' ? 'text-[#1B3B6F]' : 'text-gray-500'}`}>Online Payment</p>
              </button>
            </div>

            {/* Online payment fields */}
            {paymentMethod === 'online' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                <div>
                  <Label className="text-xs">UTR / Transaction Number</Label>
                  <Input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="Enter UTR or reference number" className="h-9 text-sm bg-white" />
                </div>
                <div>
                  <Label className="text-xs">Payment Screenshot</Label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setScreenshot(e.target.files?.[0] || null)} />
                  {screenshot ? (
                    <div className="flex items-center gap-2 bg-white rounded-lg border p-2 mt-1">
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-gray-700 truncate flex-1">{screenshot.name}</span>
                      <button className="text-red-400 hover:text-red-600" onClick={() => { setScreenshot(null); if (fileRef.current) fileRef.current.value = '' }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" /> Upload Screenshot
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Discount + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Discount (Rs.)</Label>
                <Input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional order notes" className="h-9 text-sm" />
              </div>
            </div>

            {/* Summary */}
            {products.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : fmt(shipping)}
                  </span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium text-red-500">-{fmt(discountVal)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-[#1B3B6F]">Total</span>
                  <span className="font-bold text-lg text-[#1B3B6F]">{fmt(total)}</span>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={paymentMethod === 'online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                    {paymentMethod === 'online' ? 'Paid Online' : 'Cash on Delivery'}
                  </Badge>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 border border-red-200">{error}</div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button
            className="bg-[#1B3B6F] hover:bg-[#0F2545] gap-2"
            disabled={submitting || products.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><ShoppingBag className="h-4 w-4" /> Create Order</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
