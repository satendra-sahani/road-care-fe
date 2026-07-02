'use client'

// Shop-partner Invoices — GST tax invoices derived from paid/completed orders,
// mirroring the app (ShopInvoices/ShopInvoice). Prices are GST-inclusive:
// taxable = round(gross / 1.18), gst = gross − taxable, split CGST/SGST.
import { useEffect, useMemo, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Receipt, FileText, Check, Printer, X, Search } from 'lucide-react'

const DIST = '#D97706', GREEN = '#15936B'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')
const pick = (...v: any[]) => v.find((x) => x !== undefined && x !== null && x !== '')
const fmtDate = (iso?: string) => { try { return new Date(iso || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }

// A paid/completed order becomes a tax invoice.
const PAID = ['completed', 'delivered', 'paid', 'fulfilled', 'closed']
const isInvoiced = (o: any) => PAID.includes(String(o.status || '').toLowerCase()) || o.isPaid || o.paidAt
const amountOf = (o: any) => Number(pick(o.finalCost, o.totalAmount, o.grandTotal, o.total, o.estimatedCost, o.amount, 0)) || 0
const invNo = (o: any) => pick(o.invoiceNumber, o.invoiceNo, o.orderId, o.orderNumber) || ('INV-' + String(o._id || '').slice(-6).toUpperCase())
const invDate = (o: any) => pick(o.completedAt, o.paidAt, o.updatedAt, o.createdAt)

function gstSplit(gross: number) {
  const taxable = Math.round(gross / 1.18)
  const gst = gross - taxable
  const cgst = Math.round(gst / 2)
  return { taxable, gst, cgst, sgst: gst - cgst }
}

export function ShopInvoices() {
  const [orders, setOrders] = useState<any[]>([])
  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<any | null>(null)

  useEffect(() => {
    Promise.all([
      shopAPI.getOrders({ limit: 200 }).catch(() => null),
      shopAPI.getProfile().catch(() => null),
    ]).then(([o, p]) => {
      const list = o?.data?.data || o?.data?.orders || o?.data || []
      setOrders(Array.isArray(list) ? list : [])
      if (p?.data?.success) setShop(p.data.data)
    }).catch(() => toast.error('Could not load invoices')).finally(() => setLoading(false))
  }, [])

  const invoices = useMemo(() => orders.filter(isInvoiced).sort((a, b) => (new Date(invDate(b) || 0).getTime() - new Date(invDate(a) || 0).getTime())), [orders])
  const filtered = invoices.filter((o) => {
    const s = invNo(o) + ' ' + (o.customer?.fullName || '')
    return s.toLowerCase().includes(q.toLowerCase())
  })
  const totalInvoiced = invoices.reduce((a, o) => a + amountOf(o), 0)
  const totalGst = invoices.reduce((a, o) => a + gstSplit(amountOf(o)).gst, 0)

  if (loading) return <div className="flex h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  return (
    <div className="p-4 md:p-6 space-y-[18px] max-w-5xl">
      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#E7ECF3] bg-white p-4 shadow-sm">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#E7F6EF]" style={{ color: GREEN }}><Receipt className="h-[18px] w-[18px]" /></div>
          <div className="mt-2.5 text-[19px] font-extrabold text-[#13203A]">{inr(totalInvoiced)}</div>
          <div className="text-[12px] font-semibold text-[#7B8AA3]">Total invoiced · {invoices.length} invoice{invoices.length === 1 ? '' : 's'}</div>
        </div>
        <div className="rounded-2xl border border-[#E7ECF3] bg-white p-4 shadow-sm">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FEF3E2]" style={{ color: DIST }}><FileText className="h-[18px] w-[18px]" /></div>
          <div className="mt-2.5 text-[19px] font-extrabold text-[#13203A]">{inr(totalGst)}</div>
          <div className="text-[12px] font-semibold text-[#7B8AA3]">GST collected · CGST + SGST</div>
        </div>
      </div>

      {/* list */}
      <div className="rounded-2xl border border-[#E7ECF3] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F6] px-[18px] py-3.5">
          <h3 className="text-[15.5px] font-extrabold text-[#13203A]">GST tax invoices</h3>
          <div className="flex items-center gap-2 rounded-lg border border-[#E7ECF3] px-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 w-40 text-sm outline-none" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#E7ECF3]"><FileText className="h-6 w-6 text-slate-300" /></div>
            <div className="mt-3 text-[15px] font-extrabold text-[#13203A]">No invoices yet</div>
            <div className="text-[13px] text-[#7B8AA3]">Completed & paid jobs will appear here as GST invoices.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F4F8]">
            {filtered.map((o) => (
              <button key={o._id || invNo(o)} onClick={() => setOpen(o)} className="flex w-full items-center gap-3 px-[18px] py-3.5 text-left hover:bg-slate-50">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E7F6EF]" style={{ color: GREEN }}><FileText className="h-[18px] w-[18px]" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-extrabold text-[#13203A]">{invNo(o)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6EF] px-2 py-0.5 text-[10px] font-extrabold" style={{ color: GREEN }}><Check className="h-3 w-3" /> Paid</span>
                  </div>
                  <div className="truncate text-[12px] text-[#7B8AA3]">{o.customer?.fullName || 'Customer'} · {fmtDate(invDate(o))}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-extrabold text-[#13203A]">{inr(amountOf(o))}</div>
                  <div className="text-[10.5px] font-semibold uppercase text-[#9AA7B8]">{o.paymentMethod || o.payMethod || 'paid'}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && <InvoiceModal order={open} shop={shop} onClose={() => setOpen(null)} />}
    </div>
  )
}

function InvoiceModal({ order, shop, onClose }: { order: any; shop: any; onClose: () => void }) {
  const gross = amountOf(order)
  const { taxable, cgst, sgst } = gstSplit(gross)
  const print = () => window.print()
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:bg-white print:p-0">
      <div className="my-4 w-full max-w-2xl rounded-2xl bg-white shadow-xl print:my-0 print:shadow-none" id="shop-invoice">
        {/* toolbar (hidden on print) */}
        <div className="flex items-center justify-between border-b border-[#EEF1F6] px-5 py-3 print:hidden">
          <span className="text-[13px] font-extrabold text-[#13203A]">Tax invoice</span>
          <div className="flex gap-2">
            <button onClick={print} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: DIST }}><Printer className="h-4 w-4" /> Print / Download</button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* invoice */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[20px] font-black text-[#13203A]">{shop?.shopName || 'Bharat Mechanics Shop'}</div>
              <div className="mt-1 max-w-xs text-[12px] text-[#64748B]">
                {[shop?.address?.street, shop?.address?.city, shop?.address?.state, shop?.address?.pincode].filter(Boolean).join(', ')}
              </div>
              {shop?.kyc?.gstNumber && <div className="mt-1 text-[12px] font-bold text-[#13203A]">GSTIN: {shop.kyc.gstNumber}</div>}
              {shop?.shopPhone && <div className="text-[12px] text-[#64748B]">{shop.shopPhone}</div>}
            </div>
            <div className="text-right">
              <div className="text-[16px] font-black tracking-wide" style={{ color: DIST }}>TAX INVOICE</div>
              <div className="mt-1 text-[12px] text-[#64748B]">No: <b className="text-[#13203A]">{invNo(order)}</b></div>
              <div className="text-[12px] text-[#64748B]">Date: {fmtDate(invDate(order))}</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-[#F7F9FB] p-3.5">
            <div className="text-[11px] font-extrabold uppercase text-[#9AA7B8]">Bill to</div>
            <div className="text-[14px] font-bold text-[#13203A]">{order.customer?.fullName || 'Customer'}</div>
            {order.customer?.phone && <div className="text-[12px] text-[#64748B]">{order.customer.phone}</div>}
          </div>

          {/* lines */}
          <table className="mt-6 w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#E7ECF3] text-left text-[#7B8AA3]">
                <th className="pb-2 font-bold">Description</th>
                <th className="pb-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="text-[#13203A]">
              <tr><td className="py-2">Service &amp; parts (taxable value)</td><td className="py-2 text-right font-semibold">{inr(taxable)}</td></tr>
              <tr><td className="py-1.5 text-[#64748B]">CGST @ 9%</td><td className="py-1.5 text-right">{inr(cgst)}</td></tr>
              <tr><td className="py-1.5 text-[#64748B]">SGST @ 9%</td><td className="py-1.5 text-right">{inr(sgst)}</td></tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#13203A]"><td className="pt-2.5 text-[15px] font-black">Total</td><td className="pt-2.5 text-right text-[15px] font-black">{inr(gross)}</td></tr>
            </tfoot>
          </table>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-[11px] text-[#9AA7B8]">Payment: <b className="uppercase text-[#13203A]">{order.paymentMethod || order.payMethod || 'Paid'}</b> · Amounts are GST-inclusive.</div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F6EF] px-3 py-1 text-[12px] font-extrabold" style={{ color: GREEN }}><Check className="h-4 w-4" /> PAID</span>
          </div>
          <div className="mt-6 border-t border-dashed border-[#E7ECF3] pt-3 text-center text-[11px] text-[#9AA7B8]">This is a computer-generated tax invoice · Bharat Mechanics</div>
        </div>
      </div>
    </div>
  )
}
