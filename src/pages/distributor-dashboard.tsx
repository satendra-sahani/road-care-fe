import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import Link from 'next/link'
import Image from 'next/image'
import { SEOHead } from '@/components/SEOHead'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { Lock } from 'lucide-react'
import {
  LayoutDashboard, BarChart3, ShoppingBag, Truck, Boxes, Wrench, Users,
  CreditCard, FileText, Settings, Menu, Search, Bell, Check, X,
  Phone, IndianRupee, Star, Plus, ArrowRight, AlertTriangle, MapPin, ShieldCheck,
  Package, Pencil,
} from 'lucide-react'

const DIST = '#0D9488', DIST50 = '#E6F7F4'

interface Order { id: string; shop: string; city: string; in: string; items: number; amt: string; status: string; step: number; ph: string; lines: [string, number, string][] }

const INIT_ORDERS: Order[] = [
  { id: '#BM-20420', shop: 'Apex Motors', city: 'Bhopal', in: 'AM', items: 14, amt: '68,400', status: 'new', step: 0, ph: '+91 98765 00011', lines: [['Brake Pad Set — Bosch', 6, '7,500'], ['Air Filter — K&N', 4, '4,400'], ['Engine Oil 5W-30 — MOTUL', 4, '1,960']] },
  { id: '#BM-20419', shop: 'New City Spares', city: 'Indore', in: 'NC', items: 9, amt: '42,100', status: 'new', step: 0, ph: '+91 98765 00022', lines: [['LED Headlight — Hella', 3, '8,697'], ['Spark Plug — NGK', 6, '1,080']] },
  { id: '#BM-20418', shop: 'Sharma Auto Parts', city: 'Indore', in: 'SA', items: 24, amt: '1,24,500', status: 'delivered', step: 5, ph: '+91 98765 00033', lines: [['Brake Pad Set — Bosch', 12, '15,000'], ['Car Battery — Exide', 8, '35,992']] },
  { id: '#BM-20417', shop: 'Verma Motors', city: 'Bhopal', in: 'VM', items: 12, amt: '48,200', status: 'transit', step: 3, ph: '+91 98765 00044', lines: [['Engine Oil 5W-30 — MOTUL', 24, '11,760']] },
  { id: '#BM-20416', shop: 'Khan Spares', city: 'Ujjain', in: 'KS', items: 38, amt: '2,10,800', status: 'processing', step: 1, ph: '+91 98765 00055', lines: [['Brake Pad Set — Bosch', 20, '25,000'], ['Air Filter — K&N', 18, '19,800']] },
  { id: '#BM-20415', shop: 'Royal Garage', city: 'Dewas', in: 'RG', items: 8, amt: '31,600', status: 'delivered', step: 5, ph: '+91 98765 00066', lines: [['Spark Plug — NGK', 8, '1,440']] },
  { id: '#BM-20414', shop: 'City Auto Hub', city: 'Indore', in: 'CA', items: 16, amt: '72,400', status: 'pending', step: 0, ph: '+91 98765 00077', lines: [['LED Headlight — Hella', 6, '17,394']] },
]
const STEPS = ['Placed', 'Accepted', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const ST: Record<string, { label: string; cls: string }> = {
  new: { label: 'New request', cls: 'bg-[#FEF3E2] text-[#D97706]' },
  pending: { label: 'Pending', cls: 'bg-[#FEF3E2] text-[#D97706]' },
  processing: { label: 'Processing', cls: 'bg-[#FFF1EB] text-[#FF6B35]' },
  transit: { label: 'In transit', cls: 'bg-[#EAF1FE] text-[#2563EB]' },
  delivered: { label: 'Delivered', cls: 'bg-[#E7F6F0] text-[#15936B]' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600' },
  paid: { label: 'Paid', cls: 'bg-[#E7F6F0] text-[#15936B]' },
  overdue: { label: 'Overdue', cls: 'bg-red-50 text-red-600' },
  active: { label: 'Active', cls: 'bg-[#E7F6F0] text-[#15936B]' },
}
const NAV = [
  { cap: 'Overview', items: [['dashboard', 'Dashboard', LayoutDashboard], ['analytics', 'Analytics', BarChart3]] },
  { cap: 'Operations', items: [['orders', 'Bulk Orders', ShoppingBag, '18'], ['shipments', 'Shipments', Truck, '6'], ['inventory', 'Inventory', Boxes]] },
  { cap: 'Network', items: [['mechanics', 'Manage Mechanics', Wrench, '5'], ['retailers', 'Retailers', Users]] },
  { cap: 'Finance', items: [['payments', 'Payments', CreditCard], ['invoices', 'Invoices & GST', FileText]] },
  { cap: 'Account', items: [['settings', 'Settings', Settings]] },
] as const
const TITLES: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Welcome back, Shakti Distributors 👋'], analytics: ['Analytics', 'Sales & performance insights'],
  orders: ['Bulk Orders', 'Orders from your retailer network'], shipments: ['Shipments', 'Track dispatches & deliveries'],
  inventory: ['Inventory', 'Stock levels across your catalog'], mechanics: ['Manage Mechanics', 'Mechanics in your network'],
  retailers: ['Retailers', 'Shops buying from you'], payments: ['Payments', 'Payouts & settlements'],
  invoices: ['Invoices & GST', 'Tax invoices and compliance'], settings: ['Settings', 'Manage your distributor account'],
}

const MECHANICS = [['Ramesh Kumar', 'Car · 4-wheeler', 'RK', 'online', true, '4.9', '312', '₹58k', 'Indore'], ['Sunil Pawar', 'Two-wheeler', 'SP', 'online', true, '4.7', '210', '₹42k', 'Nagpur'], ['Arjun Khanna', 'Multi-skill', 'AK', 'offline', true, '4.8', '278', '₹65k', 'Bhopal'], ['Imran Shaikh', 'AC & Electrical', 'IS', 'offline', false, '4.5', '96', '₹31k', 'Ujjain'], ['Vijay Patil', 'Denting & Paint', 'VP', 'online', true, '4.6', '154', '₹38k', 'Indore'], ['Deepak Yadav', 'Car · 4-wheeler', 'DY', 'offline', false, '4.2', '42', '₹18k', 'Dewas']]
const INVENTORY = [['Brake Pad Set — Bosch', 'Brakes', '14', 'low', '₹1,250', 'SKU-BR-014'], ['Engine Oil 5W-30 — MOTUL', 'Oils & Fluids', '320', 'ok', '₹490', 'SKU-OL-220'], ['Air Filter — K&N', 'Engine', '8', 'low', '₹1,100', 'SKU-AF-008'], ['Spark Plug — NGK', 'Engine', '460', 'ok', '₹180', 'SKU-SP-460'], ['LED Headlight — Hella', 'Lighting', '62', 'ok', '₹2,899', 'SKU-LT-062'], ['Car Battery — Exide', 'Batteries', '26', 'mid', '₹4,499', 'SKU-BT-026']]
const RETAILERS = [['Sharma Auto Parts', 'Indore', 'SA', 48, '₹6.2L', '4.9', 'active'], ['Khan Spares', 'Ujjain', 'KS', 41, '₹5.1L', '4.7', 'active'], ['Verma Motors', 'Bhopal', 'VM', 33, '₹3.9L', '4.8', 'active'], ['Royal Garage', 'Dewas', 'RG', 27, '₹2.8L', '4.6', 'active'], ['Apex Motors', 'Bhopal', 'AM', 9, '₹0.6L', '—', 'pending']]
const SHIPMENTS = [['#SH-8841', 'Sharma Auto Parts', 'Delhivery', 'transit', 'In transit', 'Today, 4 PM'], ['#SH-8840', 'Khan Spares', 'BlueDart', 'processing', 'Packing', 'Tomorrow'], ['#SH-8839', 'Verma Motors', 'Delhivery', 'delivered', 'Delivered', 'Yesterday'], ['#SH-8838', 'Royal Garage', 'Ecom Express', 'transit', 'Out for delivery', 'Today'], ['#SH-8837', 'City Auto Hub', 'BlueDart', 'pending', 'Awaiting pickup', '—']]
const PAYMENTS = [['Settlement · Jun W2', 'Credited', 'paid', '₹3,84,200', '14 Jun'], ['Settlement · Jun W1', 'Credited', 'paid', '₹4,12,800', '7 Jun'], ['Retailer dues · Apex', 'Pending', 'pending', '₹19,400', '—'], ['Retailer dues · City Hub', 'Overdue', 'overdue', '₹72,400', 'Due 10 Jun']]
const INVOICES = [['INV-2026-0418', 'Sharma Auto Parts', '₹1,24,500', '18% GST', 'paid'], ['INV-2026-0417', 'Verma Motors', '₹48,200', '18% GST', 'paid'], ['INV-2026-0416', 'Khan Spares', '₹2,10,800', '28% GST', 'pending'], ['INV-2026-0414', 'City Auto Hub', '₹72,400', '18% GST', 'overdue']]

function Badge({ s }: { s: string }) {
  const m = ST[s] || ST.pending
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full ${m.cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{m.label}</span>
}
function KPI({ bg, fg, Icon, dir, trend, val, label }: any) {
  return (
    <div className="bg-white border border-[#E7ECF3] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg, color: fg }}><Icon className="h-5 w-5" /></div>
        <span className={`text-[11px] font-bold ${dir === 'down' ? 'text-red-500' : 'text-[#15936B]'}`}>{trend}</span>
      </div>
      <div className="text-2xl font-extrabold text-[#13203A]">{val}</div>
      <div className="text-[12.5px] text-[#7B8AA3]">{label}</div>
    </div>
  )
}
const Th = ({ children }: any) => <th className="text-left text-[11px] font-bold uppercase tracking-wider text-[#7B8AA3] px-3 py-2.5">{children}</th>
const Card = ({ title, link, onLink, children, action }: any) => (
  <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EFF2F7]"><h3 className="font-extrabold text-[15px] text-[#13203A]">{title}</h3>{link && <button onClick={onLink} className="text-[12.5px] font-bold" style={{ color: DIST }}>{link}</button>}{action}</div>
    <div className="p-3">{children}</div>
  </div>
)

export default function DistributorDashboard() {
  // Partner access via the same simple phone+OTP login customers use.
  const { isAuthenticated } = useSelector((s: RootState) => s.customerAuth)
  const { openLogin } = useLoginModal()
  useEffect(() => {
    if (!isAuthenticated) openLogin()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState('dashboard')
  const [orders, setOrders] = useState<Order[]>(INIT_ORDERS)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [call, setCall] = useState<{ name: string; num: string } | null>(null)
  const [sbOpen, setSbOpen] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600) }
  const accept = (id: string) => { setOrders((o) => o.map((x) => x.id === id ? { ...x, status: 'processing', step: 1 } : x)); flash(`Order ${id} accepted — now processing`) }
  const reject = (id: string) => { setOrders((o) => o.map((x) => x.id === id ? { ...x, status: 'cancelled', step: 0 } : x)); flash(`Order ${id} rejected`) }
  const advance = (id: string) => { setOrders((o) => o.map((x) => { if (x.id !== id) return x; const step = Math.min(5, x.step + 1); const status = step >= 5 ? 'delivered' : step >= 3 ? 'transit' : 'processing'; return { ...x, step, status } })); flash(`Order ${id} moved forward`) }
  const go = (k: string) => { setView(k); setSbOpen(false); window.scrollTo(0, 0) }
  const drawer = orders.find((o) => o.id === drawerId)
  const newOrders = orders.filter((o) => o.status === 'new')
  const [title, sub] = TITLES[view]

  const OrderRow = (o: Order) => (
    <tr key={o.id} className="border-t border-[#EFF2F7] hover:bg-[#F6F8FB] cursor-pointer" onClick={() => setDrawerId(o.id)}>
      <td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px]">{o.id}</td>
      <td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="h-8 w-8 rounded-full bg-[#1B3B6F] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{o.in}</span><div><b className="block text-[13px] text-[#13203A]">{o.shop}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.city}</span></div></div></td>
      <td className="px-3 py-3 text-[13px] text-[#475569]">{o.items} items</td>
      <td className="px-3 py-3 font-bold text-[13px] text-[#13203A]">₹{o.amt}</td>
      <td className="px-3 py-3"><Badge s={o.status} /></td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => setCall({ name: o.shop, num: o.ph })} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#15936B]"><Phone className="h-4 w-4" /></button>
          {o.status === 'new' ? (
            <>
              <button onClick={() => reject(o.id)} className="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-[12.5px] font-bold">Reject</button>
              <button onClick={() => accept(o.id)} className="h-8 px-3 rounded-lg text-white text-[12.5px] font-bold inline-flex items-center gap-1" style={{ background: DIST }}><Check className="h-3.5 w-3.5" /> Accept</button>
            </>
          ) : <button className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#1B3B6F]"><MapPin className="h-4 w-4" /></button>}
        </div>
      </td>
    </tr>
  )

  const Table = ({ head, children }: any) => (
    <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr>{head.map((h: string, i: number) => <Th key={i}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>
  )

  function renderView() {
    if (view === 'orders') return (
      <>
        <Pills options={['All orders', 'Pending', 'Processing', 'In transit', 'Delivered']} />
        <Card title={`${orders.length} bulk orders`} action={<button className="h-9 px-3.5 rounded-lg text-white text-[13px] font-bold inline-flex items-center gap-1" style={{ background: DIST }}><Plus className="h-4 w-4" /> New order</button>}>
          <Table head={['Order', 'Retailer', 'Items', 'Amount', 'Status', '']}>{orders.map(OrderRow)}</Table>
        </Card>
      </>
    )
    if (view === 'inventory') return (
      <>
        <Pills options={['All parts', 'Low stock', 'Brakes', 'Engine', 'Oils']} action />
        <Card title={`${INVENTORY.length} products · 2 low`}>
          <Table head={['Product', 'Category', 'Stock', 'Price', 'Status', '']}>
            {INVENTORY.map((p, i) => { const cls = p[3] === 'low' ? 'pending' : p[3] === 'mid' ? 'processing' : 'delivered'; const lbl = p[3] === 'low' ? 'Low stock' : p[3] === 'mid' ? 'Re-order soon' : 'In stock'
              return <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="h-8 w-8 rounded-lg bg-[#F2F6FC] flex items-center justify-center"><Package className="h-4 w-4 text-[#1B3B6F]" /></span><div><b className="block text-[13px] text-[#13203A]">{p[0]}</b><span className="text-[11px] text-[#7B8AA3]">{p[5]}</span></div></div></td><td className="px-3 py-3 text-[13px] text-[#475569]">{p[1]}</td><td className="px-3 py-3 font-bold text-[13px]">{p[2]} units</td><td className="px-3 py-3 font-bold text-[13px]">{p[4]}</td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full ${ST[cls].cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{lbl}</span></td><td className="px-3 py-3"><button className="text-[12.5px] font-bold inline-flex items-center gap-1" style={{ color: DIST }}><Pencil className="h-3.5 w-3.5" /> Edit</button></td></tr> })}
          </Table>
        </Card>
      </>
    )
    if (view === 'retailers') return (
      <>
        <Pills options={['All retailers', 'Active', 'Pending', 'Top buyers']} action />
        <Card title="342 retailers in network">
          <Table head={['Retailer', 'Orders', 'Revenue', 'Rating', 'Status', '']}>
            {RETAILERS.map((r, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="h-8 w-8 rounded-full bg-[#1B3B6F] text-white text-[11px] font-bold flex items-center justify-center">{r[2]}</span><div><b className="block text-[13px] text-[#13203A]">{r[0]}</b><span className="text-[11.5px] text-[#7B8AA3]">{r[1]}</span></div></div></td><td className="px-3 py-3 text-[13px]">{r[3]} orders</td><td className="px-3 py-3 font-bold text-[13px]">{r[4]}</td><td className="px-3 py-3 text-[13px] text-[#F5A623] font-bold">{r[5] === '—' ? '—' : `★ ${r[5]}`}</td><td className="px-3 py-3"><Badge s={r[6] as string} /></td><td className="px-3 py-3"><button className="text-[12.5px] font-bold" style={{ color: DIST }}>View</button></td></tr>)}
          </Table>
        </Card>
      </>
    )
    if (view === 'shipments') return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg="#EAF1FE" fg="#2563EB" Icon={Truck} dir="up" trend="▲ 4" val="23" label="In transit" />
          <KPI bg="#FEF3E2" fg="#D97706" Icon={AlertTriangle} trend="6" val="6" label="Awaiting pickup" />
          <KPI bg="#E7F6F0" fg="#15936B" Icon={Check} dir="up" trend="▲ 18" val="142" label="Delivered (7d)" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={IndianRupee} dir="up" trend="▲ 2%" val="98%" label="On-time rate" />
        </div>
        <Card title="Active shipments"><Table head={['Shipment', 'Retailer', 'Courier', 'Status', 'ETA', '']}>{SHIPMENTS.map((s, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px]">{s[0]}</td><td className="px-3 py-3 text-[13px]">{s[1]}</td><td className="px-3 py-3 text-[13px] text-[#475569]">{s[2]}</td><td className="px-3 py-3"><Badge s={s[3]} /></td><td className="px-3 py-3 text-[13px] text-[#475569]">{s[5]}</td><td className="px-3 py-3"><button className="text-[12.5px] font-bold" style={{ color: DIST }}>Track</button></td></tr>)}</Table></Card>
      </>
    )
    if (view === 'payments') return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg="#E7F6F0" fg="#15936B" Icon={IndianRupee} dir="up" trend="▲ 9%" val="₹38.4L" label="Settled this month" />
          <KPI bg="#FEF3E2" fg="#D97706" Icon={AlertTriangle} trend="₹91.8k" val="₹91.8k" label="Pending dues" />
          <KPI bg="#FEE8E8" fg="#DC2626" Icon={AlertTriangle} dir="down" trend="1" val="₹72.4k" label="Overdue" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={CreditCard} trend="T+2" val="T+2" label="Payout cycle" />
        </div>
        <Card title="Recent settlements" link="Download statement →"><Table head={['Reference', 'Type', 'Amount', 'Status', 'Date']}>{PAYMENTS.map((p, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px]">{p[0]}</td><td className="px-3 py-3 text-[13px] text-[#475569]">{p[1]}</td><td className="px-3 py-3 font-bold text-[13px]">{p[3]}</td><td className="px-3 py-3"><Badge s={p[2]} /></td><td className="px-3 py-3 text-[13px] text-[#475569]">{p[4]}</td></tr>)}</Table></Card>
      </>
    )
    if (view === 'invoices') return (
      <>
        <div className="flex items-center gap-2.5 mb-4 p-3.5 rounded-xl text-[12.5px]" style={{ background: DIST50, color: '#0c5a52' }}><ShieldCheck className="h-[18px] w-[18px]" /> GST-compliant invoicing — all invoices auto-generated with HSN codes and tax breakup.</div>
        <Card title="Tax invoices" action={<button className="h-9 px-3.5 rounded-lg text-white text-[13px] font-bold inline-flex items-center gap-1" style={{ background: DIST }}><Plus className="h-4 w-4" /> New invoice</button>}><Table head={['Invoice', 'Retailer', 'Amount', 'Tax', 'Status', '']}>{INVOICES.map((v, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px]">{v[0]}</td><td className="px-3 py-3 text-[13px]">{v[1]}</td><td className="px-3 py-3 font-bold text-[13px]">{v[2]}</td><td className="px-3 py-3 text-[13px] text-[#475569]">{v[3]}</td><td className="px-3 py-3"><Badge s={v[4]} /></td><td className="px-3 py-3"><button className="text-[12.5px] font-bold" style={{ color: DIST }}>PDF</button></td></tr>)}</Table></Card>
      </>
    )
    if (view === 'mechanics') return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg={DIST50} fg={DIST} Icon={Wrench} dir="up" trend="▲ 3" val="48" label="Total mechanics" />
          <KPI bg="#E7F6F0" fg="#15936B" Icon={Users} dir="up" trend="▲ 12" val="31" label="Online now" />
          <KPI bg="#FFF1EB" fg="#FF6B35" Icon={AlertTriangle} dir="down" trend="5 new" val="5" label="Pending verification" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={Star} dir="up" trend="▲ 0.1" val="4.7" label="Avg. rating" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {MECHANICS.map((m, i) => (
            <div key={i} className="bg-white border border-[#E7ECF3] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-full bg-[#1B3B6F] text-white font-bold flex items-center justify-center">{m[2]}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${m[3] === 'online' ? 'bg-[#15936B]' : 'bg-[#94A3B8]'}`} /></div>
                <div><div className="flex items-center gap-1 font-bold text-[#13203A]">{m[0]}{m[4] && <Check className="h-3.5 w-3.5 text-[#15936B]" />}</div><span className="text-[12px] text-[#7B8AA3]">{m[1]} · {m[8]}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 py-3 border-y border-[#EFF2F7] text-center">
                <div><b className="block text-[13px]">{m[6]}</b><span className="text-[10.5px] text-[#7B8AA3]">Jobs</span></div>
                <div><b className="block text-[13px]">{m[7]}</b><span className="text-[10.5px] text-[#7B8AA3]">Earnings</span></div>
                <div><b className="block text-[13px]">★{m[5]}</b><span className="text-[10.5px] text-[#7B8AA3]">Rating</span></div>
              </div>
              <div className="flex gap-2 mt-3">
                {m[4] ? <><button className="flex-1 h-9 rounded-lg border border-[#E7ECF3] text-[13px] font-semibold text-[#475569]">Message</button><button className="flex-1 h-9 rounded-lg text-white text-[13px] font-semibold" style={{ background: DIST }}>Assign job</button></> : <><button className="flex-1 h-9 rounded-lg border border-red-200 text-red-600 text-[13px] font-semibold">Reject</button><button className="flex-1 h-9 rounded-lg text-white text-[13px] font-semibold" style={{ background: DIST }}>Verify</button></>}
              </div>
            </div>
          ))}
        </div>
      </>
    )
    if (view === 'analytics') return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          <KPI bg={DIST50} fg={DIST} Icon={BarChart3} dir="up" trend="▲ 22%" val="₹48.2L" label="Revenue (90d)" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={ShoppingBag} dir="up" trend="▲ 14%" val="3,180" label="Orders (90d)" />
          <KPI bg="#FFF1EB" fg="#FF6B35" Icon={IndianRupee} dir="up" trend="▲ 6%" val="₹1,516" label="Avg. order value" />
        </div>
        <Card title="Revenue trend · 12 months">
          <div className="flex items-end gap-2 h-56 px-1">
            {[40, 55, 48, 70, 62, 82, 75, 90, 68, 95, 88, 100].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5"><div className="w-full rounded-t-md" style={{ height: `${v}%`, background: DIST }} /><span className="text-[10px] text-[#7B8AA3]">{'JFMAMJJASOND'[i]}</span></div>
            ))}
          </div>
        </Card>
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <Card title="Top categories">{[['Brakes', '32%', 74], ['Engine parts', '24%', 56], ['Oils & fluids', '19%', 44], ['Lighting', '14%', 32], ['Batteries', '11%', 26]].map((c, i) => <div key={i} className="flex items-center gap-3 py-2"><div className="flex-1"><b className="text-[13px] text-[#13203A]">{c[0]}</b><div className="h-1.5 rounded-full bg-[#EFF2F7] mt-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c[2]}%`, background: DIST }} /></div></div><span className="text-[13px] font-bold text-[#475569]">{c[1]}</span></div>)}</Card>
          <Card title="Top regions">{[['Indore', '₹18.4L', 88], ['Bhopal', '₹12.1L', 58], ['Ujjain', '₹8.6L', 41], ['Dewas', '₹5.3L', 26]].map((c, i) => <div key={i} className="flex items-center gap-3 py-2"><MapPin className="h-4 w-4 text-[#1B3B6F]" /><div className="flex-1"><b className="text-[13px] text-[#13203A]">{c[0]}</b><div className="h-1.5 rounded-full bg-[#EFF2F7] mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-[#1B3B6F]" style={{ width: `${c[2]}%` }} /></div></div><span className="text-[13px] font-bold text-[#475569]">{c[1]}</span></div>)}</Card>
        </div>
      </>
    )
    if (view === 'settings') return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Business profile">
          {[['Distributor name', 'Shakti Distributors'], ['GST number', '23ABCDE1234F1Z5'], ['Owner name', 'Rajesh Shakti'], ['City', 'Indore, Madhya Pradesh']].map(([l, v]) => (
            <div key={l} className="mb-4"><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">{l}</label><input defaultValue={v} className="w-full h-[46px] border border-[#E7ECF3] rounded-[11px] px-3.5 text-sm bg-[#F6F8FB]" /></div>
          ))}
          <button className="h-11 px-5 rounded-lg text-white font-semibold inline-flex items-center gap-2" style={{ background: DIST }}><Check className="h-4 w-4" /> Save changes</button>
        </Card>
        <Card title="Preferences">
          {['Order notifications', 'Low-stock alerts', 'Daily summary email', 'Auto-accept verified retailers'].map((t, i) => (
            <div key={t} className="flex items-center justify-between py-3 border-b border-[#EFF2F7]"><b className="text-[13.5px] text-[#13203A]">{t}</b><span className="w-11 h-6 rounded-full relative" style={{ background: i < 2 ? DIST : '#E7ECF3' }}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white ${i < 2 ? 'right-[3px]' : 'left-[3px]'}`} /></span></div>
          ))}
          <div className="mt-4 p-3.5 rounded-xl text-[12.5px]" style={{ background: DIST50, color: '#0c5a52' }}>🔒 Your account is verified and GST-compliant.</div>
        </Card>
      </div>
    )
    // dashboard
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg={DIST50} fg={DIST} Icon={IndianRupee} dir="up" trend="▲ 14%" val="₹4.82L" label="Revenue today" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={ShoppingBag} dir="up" trend="▲ 6" val="128" label="Bulk orders today" />
          <KPI bg="#FFF1EB" fg="#FF6B35" Icon={Users} dir="up" trend="▲ 9%" val="342" label="Active retailers" />
          <KPI bg="#FEE8E8" fg="#DC2626" Icon={Truck} dir="down" trend="6 pending" val="23" label="Shipments in transit" />
        </div>
        {newOrders.length > 0 && (
          <div className="bg-white border border-[#bfe8d6] rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#E7F6F0' }}><h3 className="font-extrabold text-[15px] text-[#15936B]">⚡ {newOrders.length} new orders awaiting action</h3><button onClick={() => go('orders')} className="text-[12.5px] font-bold" style={{ color: DIST }}>View all →</button></div>
            <div className="p-3 space-y-2">
              {newOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 flex-wrap">
                  <span className="h-9 w-9 rounded-full bg-[#1B3B6F] text-white text-[11px] font-bold flex items-center justify-center">{o.in}</span>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setDrawerId(o.id)}><b className="block text-[13px] text-[#13203A]">{o.shop} · {o.id}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.items} items · {o.city}</span></div>
                  <span className="font-bold text-[13px] text-[#13203A]">₹{o.amt}</span>
                  <button onClick={() => setCall({ name: o.shop, num: o.ph })} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#15936B]"><Phone className="h-4 w-4" /></button>
                  <button onClick={() => reject(o.id)} className="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-[12.5px] font-bold">Reject</button>
                  <button onClick={() => accept(o.id)} className="h-8 px-3 rounded-lg text-white text-[12.5px] font-bold inline-flex items-center gap-1" style={{ background: DIST }}><Check className="h-3.5 w-3.5" /> Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-5">
          <Card title="Revenue overview" link="View report →" onLink={() => go('analytics')}>
            <div className="flex items-end gap-2.5 h-40 px-1">
              {[[58, 32], [72, 40], [64, 36], [88, 52], [76, 44], [95, 60], [82, 50]].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full flex items-end gap-1 h-full justify-center"><i className="w-2.5 rounded-t-sm" style={{ height: `${d[0]}%`, background: '#1B3B6F' }} /><i className="w-2.5 rounded-t-sm" style={{ height: `${d[1]}%`, background: DIST }} /></div><span className="text-[10px] text-[#7B8AA3]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span></div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-[12px] text-[#475569]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#1B3B6F]" /> Parts sales</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: DIST }} /> Service supplies</span></div>
          </Card>
          <Card title="Order status">
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 rounded-full shrink-0 flex items-center justify-center" style={{ background: `conic-gradient(#15936B 0% 62%, #FF6B35 62% 82%, #2A5298 82% 94%, #CBD5E1 94% 100%)` }}><div className="h-20 w-20 rounded-full bg-white flex flex-col items-center justify-center"><b className="text-xl font-extrabold text-[#13203A]">128</b><span className="text-[11px] text-[#7B8AA3]">orders</span></div></div>
              <div className="flex-1 space-y-1.5 text-[12.5px]">
                {[['Delivered', 79, '#15936B'], ['Processing', 26, '#FF6B35'], ['In transit', 15, '#2A5298'], ['Pending', 8, '#CBD5E1']].map((d) => <div key={d[0] as string} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: d[2] as string }} /><span className="flex-1 text-[#475569]">{d[0]}</span><b className="text-[#13203A]">{d[1]}</b></div>)}
              </div>
            </div>
          </Card>
        </div>
        <Card title="Recent bulk orders" link="View all →" onLink={() => go('orders')}>
          <Table head={['Order', 'Retailer', 'Items', 'Amount', 'Status', '']}>{orders.slice(0, 5).map(OrderRow)}</Table>
        </Card>
      </>
    )
  }

  function Pills({ options, action }: { options: string[]; action?: boolean }) {
    const [on, setOn] = useState(0)
    return (
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {options.map((o, i) => <button key={o} onClick={() => setOn(i)} className={`px-3.5 py-2 rounded-full text-[13px] font-bold border ${on === i ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`} style={on === i ? { background: DIST } : {}}>{o}</button>)}
        {action && <button className="ml-auto h-9 px-3.5 rounded-lg text-white text-[13px] font-bold inline-flex items-center gap-1" style={{ background: DIST }}><Plus className="h-4 w-4" /> Add</button>}
      </div>
    )
  }

  return (
    <>
      <SEOHead title="Distributor Dashboard" description="Bharat Mechanics distributor console." noIndex />

      {/* Login wall — the formatted dashboard shows blurred behind the phone+OTP modal */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-[55] bg-[#0F2547]/20 backdrop-blur-[2px] flex items-center justify-center px-6">
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-white text-[#0D9488] shadow-lg flex items-center justify-center mx-auto mb-4"><Lock className="h-7 w-7" /></div>
            <h2 className="text-xl font-extrabold text-white drop-shadow">Partner login</h2>
            <p className="text-sm text-white/85 mt-1.5 max-w-xs mx-auto drop-shadow">Sign in with your registered mobile number to access the distributor dashboard.</p>
            <button onClick={() => openLogin()} className="mt-5 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#0D9488] hover:bg-[#0b7d72] text-white font-bold shadow-lg">Login with mobile number</button>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-[#F6F8FB] flex ${isAuthenticated ? '' : 'blur-[3px] pointer-events-none select-none'}`}>
        {/* Sidebar */}
        {sbOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSbOpen(false)} />}
        <aside className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-white border-r border-[#E7ECF3] flex flex-col transition-transform ${sbOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="px-5 py-4 border-b border-[#EFF2F7]"><Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={150} height={48} className="h-8 w-auto object-contain" /></div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EFF2F7]">
            <div className="h-10 w-10 rounded-full text-white font-bold flex items-center justify-center shrink-0" style={{ background: DIST }}>SD</div>
            <div className="min-w-0 flex-1"><b className="block text-[13.5px] text-[#13203A] truncate">Shakti Distributors</b><span className="text-[11.5px] text-[#7B8AA3]">Distributor · Indore</span></div>
            <ShieldCheck className="h-4 w-4 text-[#15936B]" />
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2.5 scrollbar-ultra-narrow">
            {NAV.map((grp) => (
              <div key={grp.cap} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7B8AA3]">{grp.cap}</p>
                {grp.items.map((it) => {
                  const [key, label, Icon, badge] = it as any
                  const active = view === key
                  return (
                    <button key={key} onClick={() => go(key)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13.5px] font-semibold mb-0.5 transition-colors ${active ? 'text-white' : 'text-[#475569] hover:bg-[#F6F8FB]'}`} style={active ? { background: DIST } : {}}>
                      <Icon className="h-[18px] w-[18px]" /> {label}
                      {badge && <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#FF6B35] text-white'}`}>{badge}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className="border-t border-[#EFF2F7] p-2.5"><Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-[#475569] hover:bg-[#F6F8FB]"><ArrowRight className="h-[18px] w-[18px] rotate-180" /> Back to website</Link></div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E7ECF3] px-4 md:px-6 py-3 flex items-center gap-3">
            <button onClick={() => setSbOpen(true)} className="lg:hidden h-9 w-9 rounded-lg border border-[#E7ECF3] flex items-center justify-center"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><h1 className="text-base md:text-lg font-extrabold text-[#13203A] truncate">{title}</h1><p className="text-[12px] text-[#7B8AA3] truncate hidden sm:block">{sub}</p></div>
            <button className="ml-auto hidden md:flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#F6F8FB] border border-[#E7ECF3] text-[13px] text-[#7B8AA3]"><Search className="h-4 w-4" /> Search orders, parts…</button>
            <div className="hidden sm:flex items-center gap-0.5 bg-[#F6F8FB] rounded-lg p-0.5"><button className="px-2.5 py-1 rounded-md text-[12px] font-bold text-white" style={{ background: DIST }}>EN</button><button className="px-2.5 py-1 rounded-md text-[12px] font-bold text-[#7B8AA3]">हिं</button></div>
            <button className="relative h-10 w-10 rounded-xl border border-[#E7ECF3] flex items-center justify-center"><Bell className="h-5 w-5 text-[#475569]" /><span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#FF6B35] text-white text-[9px] font-bold flex items-center justify-center">4</span></button>
            <div className="hidden sm:flex items-center gap-2"><div className="h-9 w-9 rounded-full text-white font-bold flex items-center justify-center text-sm" style={{ background: DIST }}>SD</div><b className="text-sm text-[#13203A]">Shakti</b></div>
          </header>
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{renderView()}</div>
        </div>
      </div>

      {/* Order drawer */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setDrawerId(null)} />
          <aside className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-[61] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7ECF3]">
              <div><div className="font-extrabold text-[#13203A]">{drawer.id}</div><Badge s={drawer.status} /></div>
              <button onClick={() => setDrawerId(null)} className="h-9 w-9 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-[#1B3B6F] text-white font-bold flex items-center justify-center">{drawer.in}</div><div className="flex-1"><b className="block text-[#13203A]">{drawer.shop}</b><span className="text-[12.5px] text-[#7B8AA3]">{drawer.city} · {drawer.ph}</span></div><button onClick={() => setCall({ name: drawer.shop, num: drawer.ph })} className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: '#15936B' }}><Phone className="h-5 w-5" /></button></div>
              <div>
                <h4 className="font-bold text-[#13203A] mb-3 text-sm">Order tracking</h4>
                <div className="space-y-0">
                  {STEPS.map((st, i) => { const done = drawer.status === 'delivered' || i < drawer.step; const curr = i === drawer.step && drawer.status !== 'delivered' && drawer.status !== 'cancelled'
                    return <div key={st} className="flex gap-3 pb-4 last:pb-0"><div className="flex flex-col items-center"><div className={`h-5 w-5 rounded-full flex items-center justify-center ${done ? 'text-white' : curr ? 'border-2' : 'bg-[#EFF2F7]'}`} style={done ? { background: DIST } : curr ? { borderColor: DIST } : {}}>{done && <Check className="h-3 w-3" />}{curr && <span className="h-1.5 w-1.5 rounded-full" style={{ background: DIST }} />}</div>{i < STEPS.length - 1 && <span className="w-px flex-1 bg-[#EFF2F7]" />}</div><div className="-mt-0.5"><b className="block text-[13px] text-[#13203A]">{st}</b><span className="text-[11.5px] text-[#7B8AA3]">{done ? 'Completed' : curr ? 'In progress' : 'Pending'}</span></div></div> })}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#13203A] mb-3 text-sm">Items ({drawer.items})</h4>
                {drawer.lines.map((l, i) => <div key={i} className="flex items-center gap-3 py-2 border-b border-[#EFF2F7]"><div className="h-9 w-9 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><Package className="h-4 w-4 text-[#1B3B6F]" /></div><b className="flex-1 text-[13px] text-[#13203A]">{l[0]}</b><span className="text-[12px] text-[#7B8AA3]">×{l[1]}</span><span className="font-bold text-[13px]">₹{l[2]}</span></div>)}
                <div className="flex items-center justify-between pt-3"><span className="text-[#475569] font-semibold text-sm">Order total</span><b className="text-lg">₹{drawer.amt}</b></div>
              </div>
            </div>
            <div className="p-4 border-t border-[#E7ECF3] flex gap-2.5">
              {drawer.status === 'new' ? (
                <><button onClick={() => { reject(drawer.id) }} className="flex-1 h-12 rounded-lg border border-red-200 text-red-600 font-semibold">Reject</button><button onClick={() => { accept(drawer.id) }} className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: DIST }}><Check className="h-4 w-4" /> Accept order</button></>
              ) : drawer.status === 'delivered' ? (
                <button disabled className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: '#15936B' }}><Check className="h-4 w-4" /> Delivered</button>
              ) : drawer.status === 'cancelled' ? (
                <button disabled className="flex-1 h-12 rounded-lg bg-[#7B8AA3] text-white font-semibold">Order cancelled</button>
              ) : (
                <><button onClick={() => setCall({ name: drawer.shop, num: drawer.ph })} className="h-12 px-4 rounded-lg font-semibold" style={{ background: '#E7F6F0', color: '#15936B' }}><Phone className="h-5 w-5" /></button><button onClick={() => advance(drawer.id)} className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: DIST }}><ArrowRight className="h-4 w-4" /> Mark {STEPS[drawer.step + 1] || 'Delivered'}</button></>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Call modal */}
      {call && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setCall(null) }}>
          <div className="bg-white rounded-2xl p-7 text-center w-full max-w-xs">
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white animate-pulse" style={{ background: DIST }}><Phone className="h-7 w-7" /></div>
            <b className="block text-lg text-[#13203A]">{call.name}</b>
            <div className="text-[#7B8AA3] mt-1">{call.num}</div>
            <div className="flex gap-2.5 mt-5"><button onClick={() => setCall(null)} className="flex-1 h-11 rounded-lg border border-[#E7ECF3] font-semibold text-[#475569]">Cancel</button><a href={`tel:${call.num.replace(/\s/g, '')}`} className="flex-1 h-11 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: '#15936B' }}><Phone className="h-4 w-4" /> Call now</a></div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] bg-[#13203A] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[#5fd6aa]" /> {toast}</div>}
    </>
  )
}
